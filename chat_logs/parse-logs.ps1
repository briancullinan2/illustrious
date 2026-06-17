# Define the root path containing your historical chat logs
$LogRoot = "C:\Users\megam\Documents\Collections\conversations\Trillian\logs"

# Define the partial name patterns you want to match (supports multiple wildcards)
$FilePatterns = @(
    "*jessieface*"
    "*schoch*"
    "*j.schoch*"
    "*KamiLPgirlie*"
    "*music4life*"
    "*tahititina*"
    "*arcadiaz*"
    "*aimsley07*"
    "*grandslam*"
    "*cryptelligencia*"
)

$MatchingFiles = Get-ChildItem -Path $LogRoot -Recurse -File -ErrorAction SilentlyContinue | 
    Where-Object {
        foreach ($Pattern in $FilePatterns) {
            if ($_.Name -like $Pattern) { return $true }
        }
        return $false
    }

# 2. Iterate and pipe each resolved path into your Python pipeline
Write-Host "🚀 Found $($MatchingFiles.Count) matching conversation files to process." -ForegroundColor Cyan
Write-Host " "

foreach ($File in $MatchingFiles) {
    Write-Host "Parsing: $($File.FullName)" -ForegroundColor Yellow
    
    # Run the python script with the absolute file path safely quoted
    python .\chat_logs\parse-logs.py --logfile "$($File.FullName)"
}

Write-Host " "
Write-Host "All target logs processed cleanly into JSON training sets." -ForegroundColor Green