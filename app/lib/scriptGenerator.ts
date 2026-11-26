import { calculateCommitPlan } from "./gridCodec";

export interface ScriptOptions {
  grid: number[][];
  year: number;
  repoName?: string;
  username?: string;
  speedMode?: "fast" | "deep";
  autoPush?: boolean;
}

export function generateClientScripts(
  grid: number[][],
  year: number = 2026,
  repoName: string = "my-github-art",
  username: string = "",
  speedMode: "fast" | "deep" = "fast",
  autoPush: boolean = true
): { powershell: string; bash: string; totalCommits: number; activeDays: number } {
  const plan = calculateCommitPlan(grid, year, speedMode);
  const totalCommits = plan.reduce((acc, item) => acc + item.count, 0);
  const activeDays = plan.length;

  const planPairs = plan.map((p) => [p.date, p.count]);
  const planJson = JSON.stringify(planPairs);

  const safeRepo = (repoName || "my-github-art").replace(/[^a-zA-Z0-9._-]/g, "");
  const safeUser = (username || "").replace(/[^a-zA-Z0-9-]/g, "");

  const powershell = `<#
================================================================================
  Graphiti Art Studio - Automated Git Commit Generator (Append Mode)
  Target Year   : ${year}
  Total Commits : ${totalCommits}
  Active Days   : ${activeDays}
================================================================================
#>

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "🎨 ========================================================" -ForegroundColor Cyan
Write-Host "   Graphiti: Digital Street Art for GitHub Profile" -ForegroundColor Green
Write-Host "   Target: ${year} | Mode: Append | Commits: ${totalCommits}" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed or not in PATH. Please install Git to continue."
    exit 1
}

$ghUser = "${safeUser}"
if ([string]::IsNullOrWhiteSpace($ghUser)) {
    $ghUser = Read-Host "Enter your GitHub username (e.g. cod-ak)"
}
$ghUser = $ghUser.Trim()
$repoName = "${safeRepo}"
$repoUrl = "https://github.com/$ghUser/$repoName.git"

$origDir = Get-Location
$workDir = ${
    autoPush
      ? 'Join-Path $env:TEMP ("graphiti-art-" + [guid]::NewGuid().ToString("N").Substring(0, 8))'
      : '$origDir.Path'
  }

if ($workDir -ne $origDir.Path) {
    New-Item -ItemType Directory -Path $workDir -Force | Out-Null
    Set-Location $workDir
}

Write-Host "[1/4] Preparing repository ($repoUrl)..." -ForegroundColor Cyan

# Append Mode: try shallow-cloning existing main branch first
if (-not (Test-Path .git)) {
    git clone --depth 1 --branch main $repoUrl . 2>$null
    if ($LASTEXITCODE -ne 0) {
        Get-ChildItem -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        git init -q
        git branch -M main
        git remote add origin $repoUrl
        Write-Host "  -> Initialized fresh repository (new main branch)" -ForegroundColor DarkGray
    } else {
        Write-Host "  -> Synced existing repository (Append Mode: keeping old years!)" -ForegroundColor Green
    }
} else {
    Write-Host "  -> Using existing local repository..." -ForegroundColor Cyan
}

$planJson = @'
${planJson}
'@

$plan = ConvertFrom-Json $planJson
$total = ${totalCommits}
$done = 0

if ($total -eq 0) {
    Write-Host "No pixels painted on canvas! Nothing to commit." -ForegroundColor Yellow
    Set-Location $origDir
    exit 0
}

Write-Host "[2/4] Writing $total backdated commits for ${year}..." -ForegroundColor Cyan

foreach ($entry in $plan) {
    $dateStr = $entry[0]
    $count = [int]$entry[1]
    
    for ($i = 0; $i -lt $count; $i++) {
        $minuteOffset = $i * 5
        $hour = [int](12 + [math]::Floor($minuteOffset / 60))
        $minute = [int]($minuteOffset % 60)
        $timestamp = ("{0} {1:00}:{2:00}:00 +0000" -f $dateStr, $hour, $minute)
        
        $env:GIT_AUTHOR_DATE = $timestamp
        $env:GIT_COMMITTER_DATE = $timestamp
        
        $msg = "Graphiti art: $dateStr #$($i+1)"
        git commit --allow-empty -q -m $msg
        
        $done++
        if ($done % 25 -eq 0 -or $done -eq $total) {
            $pct = [math]::Floor(($done / $total) * 100)
            Write-Host -NoNewline ("\`r  Progress: [$done/$total] $pct%")
        }
    }
}

Remove-Item Env:\\GIT_AUTHOR_DATE -ErrorAction SilentlyContinue
Remove-Item Env:\\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "[3/4] Commits ready! Pushing to GitHub..." -ForegroundColor Cyan

${
  autoPush
    ? `git push -u origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 [4/4] Success! Your ${year} graph is live at: https://github.com/$ghUser" -ForegroundColor Green
    Write-Host "   (Click '${year}' on your GitHub profile calendar to view it!)" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "⚠️ Push failed. Make sure the repository '$repoName' exists at https://github.com/new" -ForegroundColor Yellow
    Write-Host "   and that you are signed into Git as '$ghUser'." -ForegroundColor Yellow
}
Set-Location $origDir
Remove-Item -Path $workDir -Recurse -Force -ErrorAction SilentlyContinue`
    : `Write-Host "Done! Run: git remote add origin $repoUrl; git push -u origin main" -ForegroundColor Green`
}
Write-Host ""
`;

  const bashEntries = plan
    .map((p) => `  "${p.date} ${p.count}"`)
    .join("\n");

  const bash = `#!/usr/bin/env bash
# ================================================================================
#   Graphiti Art Studio - Automated Git Commit Generator (Append Mode)
#   Target Year   : ${year}
#   Total Commits : ${totalCommits}
#   Active Days   : ${activeDays}
# ================================================================================

set -e

echo ""
echo "🎨 Graphiti: Digital Street Art for GitHub Profile"
echo "   Target: ${year} | Mode: Append | Commits: ${totalCommits}"
echo ""

if ! command -v git &> /dev/null; then
    echo "Error: git is not installed or not in PATH."
    exit 1
fi

GH_USER="${safeUser}"
if [ -z "$GH_USER" ]; then
    read -p "Enter your GitHub username (e.g. cod-ak): " GH_USER
fi
REPO_NAME="${safeRepo}"
REPO_URL="https://github.com/$GH_USER/$REPO_NAME.git"

ORIG_DIR=$(pwd)
WORK_DIR=$(mktemp -d)
cd "$WORK_DIR"

echo "[1/4] Preparing repository ($REPO_URL)..."
if git clone --depth 1 --branch main "$REPO_URL" . 2>/dev/null; then
    echo "  -> Synced existing repository (Append Mode: keeping old years!)"
else
    rm -rf .git *
    git init -q
    git branch -M main
    git remote add origin "$REPO_URL"
    echo "  -> Initialized fresh repository (new main branch)"
fi

PLAN=(
${bashEntries}
)

TOTAL=${totalCommits}
DONE=0

if [ "$TOTAL" -eq 0 ]; then
    echo "No pixels painted on canvas!"
    cd "$ORIG_DIR"
    rm -rf "$WORK_DIR"
    exit 0
fi

echo "[2/4] Writing $TOTAL backdated commits for ${year}..."

for entry in "\${PLAN[@]}"; do
    DATE=\$(echo "\$entry" | awk '{print \$1}')
    COUNT=\$(echo "\$entry" | awk '{print \$2}')
    
    for ((i=0; i<COUNT; i++)); do
        MIN_OFFSET=\$((i * 5))
        HOUR=\$((12 + MIN_OFFSET / 60))
        MIN=\$((MIN_OFFSET % 60))
        TIMESTAMP=\$(printf "%s %02d:%02d:00 +0000" "\$DATE" "\$HOUR" "\$MIN")
        
        export GIT_AUTHOR_DATE="\$TIMESTAMP"
        export GIT_COMMITTER_DATE="\$TIMESTAMP"
        
        git commit --allow-empty -q -m "Graphiti art: \$DATE #\$((i+1))"
        
        DONE=\$((DONE + 1))
        if (( DONE % 25 == 0 || DONE == TOTAL )); then
            PCT=\$((DONE * 100 / TOTAL))
            printf "\\r  Progress: [%d/%d] %d%%" "\$DONE" "\$TOTAL" "\$PCT"
        fi
    done
done

unset GIT_AUTHOR_DATE
unset GIT_COMMITTER_DATE

echo ""
echo "[3/4] Commits ready! Pushing to GitHub..."

if git push -u origin main; then
    echo ""
    echo "🎉 [4/4] Success! Your ${year} graph is live at: https://github.com/$GH_USER"
    echo "   (Click '${year}' on your GitHub profile calendar to view it!)"
else
    echo ""
    echo "⚠️ Push failed. Make sure '$REPO_NAME' exists at https://github.com/new."
fi

cd "$ORIG_DIR"
rm -rf "$WORK_DIR"
echo ""
`;

  return { powershell, bash, totalCommits, activeDays };
}
