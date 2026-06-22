

async function fetchTelemetry(config) {
    if (!config.api_key) throw new Error('RunPod API Key parameter context is vacant.');

    const graphqlQuery = {
        query: `{
            myself {
                id
                email
                minBalance
                clientBalance
                currentSpendPerHr
                pods {
                    id
                    name
                    machineId
                    desiredStatus
                    runtime { 
                        ports { ip publicPort isIpPublic } 
                    }
                }
            }
        }`
    };

    const response = await fetch('https://api.runpod.io/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.api_key.trim()}`
        },
        body: JSON.stringify(graphqlQuery)
    });

    const result = await response.json();
    if (result.errors) throw new Error(`RunPod Graph Exception: ${result.errors[0].message}`);
    if (!result.data || !result.data.myself) throw new Error('Malformed metadata mapping structure returned.');

    const user = result.data.myself;
    const balanceAmount = user.clientBalance ? parseFloat(user.clientBalance) : 0.00;
    const currentSpend = user.currentSpendPerHr ? parseFloat(user.currentSpendPerHr) : 0.00;
    // 1. Normalize Identity (Matches userinfo / account)
    const authenticatedAccount = user.email || "RunPod Token Session";

    // 2. Normalize Projects (RunPod acts as a single multi-tenant workspace project)
    const processedProjects = [{
        id: user.id,
        name: `RunPod Workspace (${user.email.split('@')[0]})`,
        exists: true,
        clientIdMask: `...${config.api_key.trim().slice(-4)}`,
        clientSecretMask: "N/A"
    }];

    const activeVMs = (user.pods || []).map((pod, index) => {
        // Safely extract fields out of the nested runtime container matrix
        const runtimeContext = pod.runtime || {};
        const currentStatus = pod.desiredStatus || 'UNKNOWN';

        const publicIpPortObj = runtimeContext.ports?.find(p => p.publicPort);
        const publicIp = publicIpPortObj ? publicIpPortObj.ip : null;

        console.log(`   └─ RunPod Trace -> [${index}] ${pod.name || pod.id} | Status: ${currentStatus}`);

        return {
            name: pod.name || `pod-${pod.id}`,
            status: currentStatus,
            ip: publicIp,
            endpoint: publicIp ? `http://${publicIp}` : null,
            diagnostic: currentStatus === 'ERROR' ? "Container exit trace triggered layout collapse." : null
        };
    });

    // 4. Normalize Quotas (Matches balance / credit caps)
    const accountQuotas = {
        metricName: "Prepaid Wallet Balance",
        inUse: `$0.00`,
        limit: `$0.00`,
        available: `$${(balanceAmount / 100).toFixed(2)}`
    };
    const availability = await fetchRunpodAvailableRegions(config)

    return {
        authenticated: true,
        account: user.email,
        projects: [{
            id: user.id,
            name: `RunPod Workspace (${user.email.split('@')[0]})`,
            exists: true,
            clientIdMask: `...${config.api_key.trim().slice(-4)}`,
            clientSecretMask: "N/A"
        }],
        activeVMs: activeVMs,
        quotas: {
            metricName: `Prepaid Wallet Balance (Burn Rate: $${currentSpend.toFixed(2)}/hr)`,
            inUse: `$${currentSpend.toFixed(2)}`,
            limit: `$0.00`,
            available: `$${balanceAmount.toFixed(2)}`
        },
        availability: availability
    };
}


async function fetchRunpodAvailableRegions(config) {
    if (!config?.api_key) {
        throw new Error("Missing required RunPod API key in configuration.");
    }

    const graphqlQuery = {
        query: `
            query GpuTypes {
                gpuTypes {
                    id
                    displayName
                    memoryInGb
                    securePrice
                    communityPrice
                    maxGpuCount
                    maxGpuCountCommunityCloud
                    maxGpuCountSecureCloud
                    nodeGroupDatacenters {
                        id
                        name
                        location
                        region
                    }
                }
            }
        `
    };

    try {
        const response = await fetch('https://api.runpod.io/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.api_key.trim()}`
            },
            body: JSON.stringify(graphqlQuery)
        });

        if (!response.ok) {
            const rawErrorText = await response.text().catch(() => "Unreadable stream");
            throw new Error(`RunPod HTTP ${response.status}: ${rawErrorText}`);
        }

        const json = await response.json();
        
        if (json.errors) {
            throw new Error(`GraphQL Error: ${json.errors.map(e => e.message).join(', ')}`);
        }

        const gpuTypes = json.data?.gpuTypes || [];
        const flattenedZones = {};

        for (const gpu of gpuTypes) {
            if (!gpu.nodeGroupDatacenters) continue;

            for (const dc of gpu.nodeGroupDatacenters) {
                // Generate a consistent lowercase lookup key based on the Datacenter code/ID
                const zoneKey = dc.id.toLowerCase();
                
                // Determine deployment types based on maximum node allocations
                const secureAvailable = (gpu.maxGpuCountSecureCloud || 0) > 0;
                const communityAvailable = (gpu.maxGpuCountCommunityCloud || 0) > 0;
                
                if (!secureAvailable && !communityAvailable) continue;
                
                const cloudType = secureAvailable ? "Secure" : "Community";
                const hwLabel = `${gpu.displayName} (${gpu.memoryInGb}GB / ${cloudType})`;

                if (!flattenedZones[zoneKey]) {
                    const cleanName = dc.name ? dc.name.replace(/[\(\)]/g, '').trim() : "Unknown Location";
                    const geoRegion = dc.region ? `[${dc.region}]` : '';
                    flattenedZones[zoneKey] = `${cleanName} ${geoRegion} / ${hwLabel}`;
                } else {
                    // Append this chip tier if it's running out of the same cluster point
                    if (!flattenedZones[zoneKey].includes(gpu.displayName)) {
                        flattenedZones[zoneKey] += `, ${gpu.displayName}`;
                    }
                }
            }
        }

        return flattenedZones;
    } catch (error) {
        console.error("Failed to fetch region matrix from RunPod:", error);
        throw error;
    }
}

module.exports = {
    fetchTelemetry,
    fetchRunpodAvailableRegions
};