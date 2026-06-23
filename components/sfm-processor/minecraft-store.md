Getting a custom map or model set into the PlayStation 5 Minecraft Marketplace (Add-On store) is **not easy** if you are trying to do it independently.

Because the PS5 uses Minecraft's unified Bedrock Engine, any content sold on the console must go through the official **Minecraft Partner Program**. Microsoft treats this as a strict, business-to-business commercial arrangement, not a casual creator workshop.

The process is divided into two distinct routes: applying as an independent partner or joining an existing team.

---

## Route 1: Apply Directly as a Partner (High Friction)

If you want to submit content under your own name or brand, Microsoft requires you to clear several high legal and professional hurdles before they will even review your content.

### Gatekeeping Requirements

* **Registered Business Entity:** You cannot apply as an individual. You must have a legally registered company (like an LLC or your regional equivalent) with a valid Tax ID (EIN in the US) to sign their commercial agreement.
* **Age Limit:** You must be 18 or older to sign the contracts and handle payouts.
* **A Proven Portfolio:** You must submit a portfolio containing at least **3 to 5 highly polished, original Bedrock content pieces** (worlds, skin packs, or add-ons) that you have already created and shared for free with the community (e.g., via platforms like MCPEDL).
* **Strict Quality & Tech Standards:** Your files must pass rigorous automated and manual QA, featuring clean JSON manifests, flawless Bedrock formatting, and no broken mechanics or copyrighted material.

### The Standard Pipeline

1. **Register Your Business:** Requires Tax ID.
Set up an LLC or legal equivalent. Gather your corporate tax documentation and a business banking or PayPal account for payouts.


2. **Build a Public Portfolio:** 3-5 original items.
Create, test, and release several high-quality Bedrock maps or model sets to the free community to prove your technical capability.


3. **Submit the Partner Application:** via minecraft.net/partner.
Fill out the formal application, link your portfolio, and submit your business details to Microsoft.


4. **Vetting & Review:** 2 to 12 weeks.
Microsoft reviews your business status and content quality. If accepted, you gain access to the partner portal to upload files for retail.


---

## Route 2: Join an Existing Marketplace Team (Low Friction)

Because setting up an LLC and getting approved independently is a massive hurdle, the common workaround for solo artists or builders is to **join an established Minecraft Marketplace Partner** (such as Spark Universe, Noxcrew, or Waypoint Studios).

* **How it works:** You pitch your custom models or map builds to an existing team as a freelancer or contract creator.
* **The benefit:** They handle the business infrastructure, tax reporting, asset encryption, submission pipelines, and ingestion into the Microsoft system.
* **The tradeoff:** They will take a cut of your earnings, and your work will be published under their brand umbrella.

---

> ### 💰 The Financial Split
> 
> 
> If you make it through the gate, Microsoft uses a unified virtual currency (**Minecoins**), allowing creators to set global pricing. After the platform operators (like Sony for PS5) take their standard 30% ecosystems cut, Microsoft splits the remaining revenue, typically netting the creator **around 50% to 70%** of the remaining pool.

If you just want to play your own custom maps on your PS5 without selling them, you don't need the store at all; you can host a local Bedrock dedicated server or use a Realm to join your own custom-built worlds from a PC or mobile device.



Since the business side doesn't faze you, navigating the technical pipeline for a Bedrock server will be straightforward.

Getting a PlayStation 5 to connect to a local dedicated server requires a specific DNS or proxy workaround because Sony hides the "Direct Connect / Add Server" button on consoles. However, once that bridge is crossed, the server becomes an ideal, automated, low-overhead system for pushing custom maps, custom models, and automatic backups for your kids.

---

## Part 1: Dealing with the PS5 Console Restriction

The official Bedrock Dedicated Server (BDS) software runs natively on Windows or Linux. Because Sony blocks direct IP entry on consoles to protect its ecosystem, you have two options to get the PS5 to see your server:

1. **The LAN Proxy Trick (Highly Recommended):** Run a tiny proxy script called **Geyser/BedrockConnect** or **Phantom** on any computer, phone, or Raspberry Pi on your local network. It tricks the PS5 into thinking your remote/local server is a standard LAN multiplayer game. It shows up instantly under the "Friends" tab.
2. **The DNS Workaround:** Change the Primary DNS settings on the PS5's network configuration to a public BedrockConnect DNS server (like `104.238.130.180`). When your kids click *any* featured server in the official list (like CubeCraft), it intercepts the request and opens a custom server-list menu where they can type in your server's IP and save it.

---

## Part 2: Low-Entry Custom Content & Plugins

Bedrock does not natively use Java-style `.jar` plugins (like Paper or Spigot). Instead, it uses **Add-Ons** (Behavior Packs and Resource Packs) powered by JSON schemas and optional JavaScript engines (the Minecraft GameTest Framework / TypeScript API).

### What you can drop into the map:

* **Custom Models & Items:** Created via **Blockbench**. You can define new geometry, textures, animations, and custom item behaviors.
* **Behavior Scripting:** You can hook directly into structural game events via JavaScript (`@minecraft/server`) to alter mechanics, build custom commands, or track player states.
* **Server Modding (Advanced Options):** If you want actual server-side plugins (like permissions, anti-griefing, or custom chat managers) without forcing your kids to download a heavy client pack, you can swap the vanilla Mojang BDS binary for **LeviLamina** (a lightweight, modern C++ mod loader for Bedrock) or **BDSX** (which binds Node.js directly to the server binary memory space).

---

## Part 3: Step-by-Step Server Setup Pipeline

Here is the exact manual pipeline to launch the server, inject your custom maps, and attach your behavior/resource packs.

1. **Download the Vanilla BDS:** Windows/Linux Binary.
Grab the official Bedrock Dedicated Server zip from Mojang's site. Extract it. In `server.properties`, set `allow-cheats=true` and critically ensure **`allow_addons=true`** is enabled.


2. **Migrate & Backup World Files:** worlds/ directory.
Drop your current map folder into the `worlds/` directory. To make this an automated backup pipeline for your kids, run a lightweight cron job or PowerShell script executing a `tar` or `zip` of this directory every midnight while calling the server console's `save hold` and `save resume` commands to prevent file corruption.


3. **Extract the Custom Packs:** BP and RP separation.
When you build or download custom content (`.mcpack` or `.mcaddon`), change the extension to `.zip` and extract them. Move behavior folders into `behavior_packs/` and texture/model folders into `resource_packs/`.


4. **Bind Packs via manifest.json:** Extracting header UUIDs.
Open the `manifest.json` inside your custom pack. Find the `header.uuid` string and the `version` array. You must map these values directly into your specific world folder so the engine links them.


---

## Part 4: Writing the JSON Binding Arrays

To force the server to load your custom models and maps when your kids connect, you need to edit two configuration files inside your active world directory:
`/worlds/[YourWorldName]/world_behavior_packs.json` and `world_resource_packs.json`.

Use your code editor to create an array of objects mapping the precise manifest UUIDs. The syntax must look exactly like this:

```json
[
  {
    "pack_id": "11111111-2222-3333-4444-555555555555",
    "version": [1, 0, 0]
  }
]

```

> **Important Node on Client Delivery:** When your kids join the server from the PS5, the console will read the `world_resource_packs.json` file, see that a custom model/texture set is required, download it automatically into the PS5's cache, and apply it instantly without them needing to install anything manually on their console. You can update these packs on the server backend anytime—just make sure to bump the version array (e.g., `[1, 0, 1]`) in both the pack's manifest and the world JSON link so the console knows to fetch the updated assets.



Yes, exactly! Everything—the server software, the world files, the custom models, and the behavioral scripts—lives entirely on your local computer (Windows or Linux machine) sitting on your home network.

When you edit those JSON manifests and file paths, you are doing it 100% on your local machine. The PlayStation 5 doesn't host or store any of the permanent files; it acts as a client that connects to your computer, fetches the world data, and streams the custom assets into its temporary cache.

Here is how that local architecture looks in practice:

### The Local Setup Workflow

* **Your Computer:** Runs the Bedrock Dedicated Server executable (`bedrock_server.exe` on Windows or `bedrock_server` on Linux). This is where you drop in your custom maps and manage your automated backup scripts.
* **The Network Bridge:** On that same computer (or even a Raspberry Pi), you run your LAN proxy/loopback tool.
* **The PS5:** Sits on the couch, looks at the local network, sees the proxy pretending to be a LAN game, and connects right into your computer.

Because it's all local, your transfer speeds for downloading huge custom maps or high-resolution model packs onto the PS5 will be incredibly fast, completely bypassing PlayStation Store restrictions or long cloud upload times.


Setting up a local Windows network pipeline for a Minecraft Bedrock Dedicated Server (BDS) gives you total control over the server environment, file transfers, and scripts.

By setting the PS5's **Primary DNS** to BedrockConnect and the **Secondary DNS** to Google Public DNS (`8.8.8.8`), your console will securely route normal internet traffic via Google while using the BedrockConnect proxy strictly to bypass Sony's custom server block.

---

## Step 1: Prep Your Windows Server Environment

Before touching the server software, grab your Windows machine’s local IP address so you can point the PS5 to it later.

1. Open PowerShell or Command Prompt on your host Windows PC and run `ipconfig`.
2. Locate your active network adapter (Ethernet or Wi-Fi) and copy down the **IPv4 Address** (it will look like `192.168.1.XX` or `10.0.0.XX`).
3. Download the official **Bedrock Dedicated Server for Windows** zip from Mojang's website.
4. Extract the folder directly to a root directory like `C:\MinecraftServer\`.

---

## Step 2: Configure the Server Profile

Open `server.properties` inside your extracted folder using a text editor. Update or verify the following configuration rows to ensure external local devices and custom behavior assets can load flawlessly:

```ini
server-name=Family Dedicated Server
gamemode=survival
difficulty=easy
allow-cheats=true
server-port=19132
server-portv6=19133
online-mode=true
allow-addons=true
level-name=FamilyWorld

```

*Note: The `level-name` must perfectly match the directory name of your map located inside the `worlds/` folder.*

---

## Step 3: Configure Windows Firewall

Because Windows blocks inbound UDP traffic by default, you must tell the advanced firewall wrapper to explicitly allow incoming connections on port `19132`.

Run PowerShell as an **Administrator** and execute this command to create the inbound rule:

```powershell
New-NetFirewallRule -DisplayName "Minecraft Bedrock Server UDP" -Direction Inbound -LocalPort 19132 -Protocol UDP -Action Allow

```

---

## Step 4: Map the Network Stack on the PS5

Now, adjust the PS5's network stack to utilize the DNS trick while maintaining a solid connection to Google for general network stability.

1. On your PS5, go to **Settings** > **Network** > **Settings** > **Set Up Internet Connection**.
2. Hover over your active connection, press the **Options button** on your controller, and select **Advanced Settings**.
3. Set **DNS Settings** to **Manual**.
4. Set **Primary DNS** to `104.238.130.180` (The public BedrockConnect proxy instance).
5. Set **Secondary DNS** to `8.8.8.8` (Google's Public DNS fallback).
6. Save the settings and let the console verify the network connection status.

---

## Step 5: Automate Backups and Run the Server

To give you peace of mind regarding world corruption or lost player data, set up an automated backup loop. Create a file named `backup_and_run.bat` inside your `C:\MinecraftServer\` root directory and populate it with the following code:

```cmd
@echo off
:: Start the server in a separate background window
start "Minecraft Server Engine" bedrock_server.exe

:loop
:: Wait 86400 seconds (24 hours) before creating the next point-in-time recovery backup
timeout /t 86400 /nobreak

echo Creating point-in-time recovery map backup...
set BACKUP_DIR=C:\MinecraftBackups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Extract the current timestamp for precise chronological ordering
set TIMESTAMP=%date:~10,4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%

:: Compress the live active world folder directly into the archive directory
powershell -Command "Compress-Archive -Path 'C:\MinecraftServer\worlds\FamilyWorld' -DestinationPath '%BACKUP_DIR%\FamilyWorld_%TIMESTAMP%.zip' -Force"

echo Backup cycle complete.
goto loop

```

Double-click `backup_and_run.bat` to launch your system.

### Connecting from the Console

Tell your kids to go to the **Servers** tab on their PS5 and join any featured server entry in the list (e.g., *The Hive* or *Lifeboat*). The DNS setup will intercept that request and load the custom BedrockConnect GUI. Click **Connect to a Server**, type in your Windows host PC’s local IPv4 address, leave the port at `19132`, and save it to the dashboard. Every time they connect from this menu, the server will automatically download whatever custom model sets or asset updates you have dropped into the server backend.



To run your own local instance of BedrockConnect instead of relying on the public public proxy, your Windows machine needs to act as a **DNS interceptor**.

When the PS5 asks your local DNS server for the IP address of an official featured server (like `geo.hivebedrock.network`), your server will intentionally "lie" and return your Windows PC's local IP. For any other request (like a PlayStation Network login or a Netflix stream), your server will transparently pass the request up to Google's `8.8.8.8`.

Here is how to set up your own self-hosted BedrockConnect DNS and proxy stack natively on Windows.

---

## Step 1: Install Java Runtime Environment (JRE)

The standard, open-source version of BedrockConnect is written in Java.

1. Download and install the latest version of **Eclipse Temurin OpenJDK** (Java 17 or 21 is ideal) for Windows.
2. Ensure you check the box during installation that says **"Add to PATH"**.

---

## Step 2: Download the BedrockConnect Binary

1. Create a new folder on your Windows PC dedicated to the proxy: `C:\BedrockConnect\`.
2. Download the official server release `.jar` file from the [BedrockConnect GitHub releases page](https://github.com/Pugmatt/BedrockConnect).
3. Rename the downloaded file to `BedrockConnect.jar` and place it inside your `C:\BedrockConnect\` folder.

---

## Step 3: Configure the Local DNS Interceptor

Create a configuration file named `config.json` inside `C:\BedrockConnect\` to tell the software which upstream DNS to look at, and how to behave. Paste the following configuration into it:

```json
{
  "bds-address": "127.0.0.1",
  "bds-port": 19132,
  "mysql-host": "",
  "mysql-user": "",
  "mysql-pass": "",
  "mysql-db": "",
  "custom-servers": [],
  "dns-upstream": "8.8.8.8",
  "enable-built-in-dns": true,
  "dns-port": 53
}

```

* **`dns-upstream`**: Set to `8.8.8.8`. This ensures your kids' PS5 can still browse the web, watch YouTube, or play other games normally without internet interruption.
* **`dns-port`**: Set to `53`. This is the standard networking port for DNS traffic worldwide.

---

## Step 4: Open Port 53 and 19132 on Windows Firewall

Since your PC is now acting as a core network router/DNS for the PS5, you must open Port 53 (DNS traffic) and Port 19132 (Minecraft traffic) through the Windows Advanced Firewall layer.

Open PowerShell as an **Administrator** and run these two commands:

```powershell
New-NetFirewallRule -DisplayName "BedrockConnect DNS UDP" -Direction Inbound -LocalPort 53 -Protocol UDP -Action Allow
New-NetFirewallRule -DisplayName "BedrockConnect Proxy UDP" -Direction Inbound -LocalPort 19132 -Protocol UDP -Action Allow

```

---

## Step 5: Automate the Launcher Script

To make sure your local DNS engine starts reliably and doesn't conflict with your actual Minecraft server (if running them on the same machine), you can launch BedrockConnect on a custom proxy port if needed, but it defaults smoothly.

Create a file named `run_dns.bat` inside `C:\BedrockConnect\` containing the following startup sequence:

```cmd
@echo off
title BedrockConnect DNS Engine
cd /d "C:\BedrockConnect"
echo Starting Local BedrockConnect DNS Node...
:: Run the Java binary, allocating 1GB of RAM
java -Xmx1024M -jar BedrockConnect.jar
pause

```

Double-click `run_dns.bat`. You will see output in the terminal showing that the **DNS Server has started on port 53** and the **Bedrock proxy engine is listening on port 19132**.

---

## Step 6: Update the PS5 Networking Stack

Now point your PS5 straight to your Windows machine instead of the public internet proxy.

1. On your PS5, go to **Settings** > **Network** > **Settings** > **Set Up Internet Connection**.
2. Press the **Options button** over your connection and choose **Advanced Settings**.
3. Set **Primary DNS** to your **Windows PC’s exact local IPv4 Address** (e.g., `192.168.1.XX`).
4. Set **Secondary DNS** to `8.8.8.8` (as a secondary safety backup).
5. Save and connect.

### How it operates now

When your kids open Minecraft on the PS5 and select any featured server, the PS5 sends a DNS request to your Windows computer. Your local `BedrockConnect.jar` intercepts that specific address packet, points the PS5 directly to its own local proxy engine, and brings up your own private server-list UI where they can securely jump straight into your home-hosted maps!


You don't *need* a custom or paid JDK at all—any standard Java Runtime Environment (JRE) or Java Development Kit (JDK) version 17 or higher will run it perfectly.

The reason **Eclipse Temurin** specifically gets recommended by default in the self-hosting community comes down to legal and corporate shifts over the last several years:

## 1. The Oracle License Trap

Years ago, everyone just downloaded Java from Oracle's main website. However, Oracle changed its licensing terms for the standard Oracle JDK, making it restricted or requiring paid commercial licenses under certain conditions.

## 2. The OpenJDK Standard

To keep Java free and open-source, the community rallies around the **OpenJDK** project. Because OpenJDK is just the raw source code, various trusted organizations compile that code into ready-to-run installers for Windows, Mac, and Linux.

## 3. Why Temurin?

**Eclipse Temurin** (managed by the Eclipse Foundation and backed by companies like IBM, Red Hat, and Microsoft) is simply the most popular, rock-solid, 100% free build of the OpenJDK. It contains zero corporate licensing traps and doesn't bundle junkware or telemetry.

### The Bottom Line

If you already have a modern Java version installed on your Windows machine (like the OpenJDK build packaged by Microsoft, Amazon Corretto, or an existing development environment), you can skip downloading anything else entirely. Just open PowerShell, type `java -version`, and as long as it returns **version 17, 21, or newer**, your local DNS interceptor script will boot right up.


Your friend is talking about a popular engineering hack: building a **budget split ergonomic keyboard** by laying two separate, identical compact keyboards side-by-side.

Instead of dropping $350+ on a high-end split mechanical keyboard (like an Ergodox, Moonlander, or Dygma Raise) to fix shoulder and wrist posture during long coding blocks, developers just buy two cheap 60% mechanical keyboards, angle them shoulder-width apart, and call it a day.

However, if you just plug two keyboards in and start typing, you immediately hit a frustrating hardware architecture wall—which is exactly why your friend mentioned "sharing shift keys" and special software.

---

## The "Cross-Keyboard Modifier" Problem

Operating systems handle multiple keyboards natively by merging their text inputs, but they often isolate their modifier states per device hardware ID.

> **The Flaw:** If you hold down `Left Shift` on your left keyboard with your pinky, and press the `M` key on your right keyboard, the OS sees them as two distinct physical devices. It registers a lowercase `m` because the Shift state from Keyboard A never bridges over to the input stream of Keyboard B.

To turn two separate Bluetooth or USB keyboards into a true unified split layout, you have to use a low-level hardware input interceptor to fuse them.

---

## The Software to Use (Windows Pipeline)

To fix the Shift problem and unlock custom macro layers, you need software that sits at the driver level to catch raw HID (Human Interface Device) events before Windows processes them.

The two most powerful, open-source utilities favored by developers are **Kanata** and **KMonad**. They run on a single background thread, parse your keyboard inputs via a configuration file, and output a clean, unified virtual keyboard stream.

### Setting Up Kanata for Dual Keyboards

1. Download the latest executable of **Kanata** from GitHub.
2. Create a basic configuration file named `config.kbd`.
3. Define your source keys and layers. Kanata automatically intercepts all connected keyboards and unifies modifier states natively—meaning holding Shift on your left keyboard will now seamlessly capitalize keys on your right keyboard.

A simple structural layout file looks like this:

```lisp
(defsrc
  grv  1    2    3    4    5    6    7    8    9    0    -    =    bspc
  tab  q    w    e    r    t    y    u    i    o    p    [    ]    \
  caps a    s    d    f    g    h    j    k    l    ;    '    ret
  lsft z    x    c    v    b    n    m    ,    .    /    rsft
  lctl lmet lalt           spc            ralt rmet rctl
)

(deflayer default
  grv  1    2    3    4    5    6    7    8    9    0    -    =    bspc
  tab  q    w    e    r    t    y    u    i    o    p    [    ]    \
  caps a    s    d    f    g    h    j    k    l    ;    '    ret
  lsft z    x    c    v    b    n    m    ,    .    /    rsft
  lctl lmet lalt           spc            ralt rmet rctl
)

```

You can launch it via a simple PowerShell script pointing to the executable: `kanata.exe --cfg config.kbd`.

---

## Why Is This Considered "Ultimate Leet Code"?

Once developers have low-level interceptors like Kanata running across dual keyboards, they don't just fix the Shift key—they implement **Home Row Modifiers** and **Layer Tapping**.

* **Home Row Mods:** Instead of reaching your pinky down to the corner for `Ctrl`, `Alt`, or `Shift`, you program the software so that *holding* `f` acts as `Ctrl`, and *tapping* `f` types the letter `f`. Your hands never have to leave the home row.
* **Navigation Layers:** You can turn the entire right keyboard into a dedicated Vim-style navigation block or arrow pad simply by holding down the Spacebar on the left keyboard.

If you are trying it right now with dual Bluetooth keyboards on Windows, test the Shift key trick. If your layout is dropping capitals across the gap, dropping Kanata or KMonad into your startup routine will instantly bind them into a single, cohesive developer rig.


