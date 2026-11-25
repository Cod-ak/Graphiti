// Client-side Script Generator for Graphiti
// Generates PowerShell (.ps1) and Bash (.sh) scripts directly in the browser!

export function getStartDateForYear(year: number): Date {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dayOfWeek = jan1.getUTCDay(); // 0 is Sunday
  // Rewind to the preceding Sunday
  const start = new Date(jan1);
  start.setUTCDate(jan1.getUTCDate() - dayOfWeek);
  return start;
}

export function generateClientScripts(
  grid: number[][],
  year: number = 2026,
  repoName: string = "my-github-art"
): { powershell: string; bash: string; totalCommits: number; activeDays: number } {
  const commitCounts: Record<number, number> = {
    0: 0,
    1: 1,
    2: 3,
    3: 6,
    4: 10,
  };

  const startDate = getStartDateForYear(year);
  const plan: [string, number][] = [];
  let totalCommits = 0;

  for (let col = 0; col < 52; col++) {
    for (let row = 0; row < 7; row++) {
      const level = grid[row]?.[col] ?? 0;
      const count = commitCounts[level] || 0;
      if (count > 0) {
        const cellDate = new Date(startDate);
        cellDate.setUTCDate(startDate.getUTCDate() + col * 7 + row);
        const dateStr = cellDate.toISOString().split("T")[0];
        plan.push([dateStr, count]);
        totalCommits += count;
      }
    }
  }

  const activeDays = plan.length;
  const planJson = JSON.stringify(plan);

  const powershell = `<#
================================================================================
  Graphiti Art Studio - Automated Git Commit Generator
  Target Year   : ${year}
  Total Commits : ${totalCommits}
  Active Days   : ${activeDays}
================================================================================
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🎨 ========================================================" -ForegroundColor Cyan
Write-Host "   Graphiti: Digital Street Art for GitHub Profile" -ForegroundColor Green
Write-Host "   Generating ${totalCommits} backdated commits across ${activeDays} days..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed or not in PATH. Please install Git to continue."
    exit 1
}

if (-not (Test-Path .git)) {
    Write-Host "[1/3] Initializing new Git repository..." -ForegroundColor Cyan
    git init -q
    git checkout -b main 2>$null
} else {
    Write-Host "[1/3] Using existing repository in $pwd..." -ForegroundColor Cyan
}

$planJson = @'
${planJson}
'@

$plan = ConvertFrom-Json $planJson
$total = ${totalCommits}
$done = 0

Write-Host "[2/3] Writing backdated commits..." -ForegroundColor Cyan

foreach ($entry in $plan) {
    $dateStr = $entry[0]
    $count = [int]$entry[1]
    
    for ($i = 0; $i -lt $count; $i++) {
        $minuteOffset = $i * 5
        $hour = 12 + [math]::Floor($minuteOffset / 60)
        $minute = $minuteOffset % 60
        $timestamp = ("{0} {1:D2}:{2:D2}:00 +0000" -f $dateStr, $hour, $minute)
        
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

Write-Host ""
Write-Host "[3/3] Done! ${totalCommits} commits created successfully." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps to publish on GitHub:" -ForegroundColor Yellow
Write-Host "  1. Create a new empty repository on GitHub named '${repoName}'"
Write-Host "  2. Link remote and push:"
Write-Host "     git remote add origin https://github.com/<your-username>/${repoName}.git"
Write-Host "     git push -u origin main"
Write-Host ""
`;

  const bashEntries = plan
    .map(([date, count]) => `  "${date} ${count}"`)
    .join("\n");

  const bash = `#!/usr/bin/env bash
# ================================================================================
#   Graphiti Art Studio - Automated Git Commit Generator
#   Target Year   : ${year}
#   Total Commits : ${totalCommits}
#   Active Days   : ${activeDays}
# ================================================================================

set -e

echo ""
echo "🎨 Graphiti: Digital Street Art for GitHub Profile"
echo "   Generating ${totalCommits} commits across ${activeDays} days..."
echo ""

if ! command -v git &> /dev/null; then
    echo "Error: git is not installed or not in PATH."
    exit 1
fi

if [ ! -d ".git" ]; then
    echo "[1/3] Initializing new Git repository..."
    git init -q
    git checkout -b main 2>/dev/null || true
else
    echo "[1/3] Using existing repository in $(pwd)..."
fi

PLAN=(
${bashEntries}
)

TOTAL=${totalCommits}
DONE=0

echo "[2/3] Writing backdated commits..."

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

echo ""
echo "[3/3] Done! ${totalCommits} commits generated successfully."
echo ""
echo "Next steps to publish on GitHub:"
echo "  1. Create a repository on GitHub named '${repoName}'"
echo "  2. Link remote and push:"
echo "     git remote add origin https://github.com/<your-username>/${repoName}.git"
echo "     git push -u origin main"
echo ""
`;

  return { powershell, bash, totalCommits, activeDays };
}
