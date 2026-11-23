import base64
import datetime
import gzip
import json
import os
import sys
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure graphiti_engine is in the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from graphiti_engine.font import render_text_to_matrix
from graphiti_engine.presets import get_preset_matrix, list_presets
from graphiti_engine.art import get_start_date, calculate_commit_plan

app = FastAPI(title="Graphiti Studio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextRenderRequest(BaseModel):
    text: str
    align: str = "center"
    char_spacing: int = 1
    offset_weeks: int = 0
    level: int = 4


class ScriptGenerateRequest(BaseModel):
    grid: List[List[int]]
    year: Optional[int] = None
    mode: str = "year"
    intensity: int = 1
    repo_name: str = "my-github-art"


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Graphiti Studio API", "version": "1.0.0"}


@app.get("/api/presets")
def get_presets():
    names = list_presets()
    presets_data = []
    for name in names:
        try:
            matrix = get_preset_matrix(name, cols=52)
            presets_data.append({"name": name, "grid": matrix})
        except Exception:
            pass
    return {"presets": presets_data}


@app.post("/api/render-text")
def render_text(req: TextRenderRequest):
    if not req.text.strip():
        # Empty 7x52
        return {"grid": [[0] * 52 for _ in range(7)]}
    matrix = render_text_to_matrix(
        text=req.text.strip(),
        total_cols=52,
        char_spacing=max(0, min(5, req.char_spacing)),
        level=max(1, min(4, req.level)),
        align=req.align if req.align in ["left", "center", "right"] else "center",
        offset_weeks=req.offset_weeks
    )
    return {"grid": matrix}


def generate_powershell_code(commit_plan: List, repo_name: str) -> str:
    plan_json = json.dumps([[d.strftime("%Y-%m-%d"), count] for d, count in commit_plan])
    total_commits = sum(count for _, count in commit_plan)
    
    script = f'''<#
================================================================================
  Graphiti Art Studio - Automated Git Commit Generator
  Total Commits : {total_commits}
  Active Days   : {len(commit_plan)}
================================================================================
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🎨 ========================================================" -ForegroundColor Cyan
Write-Host "   Graphiti: Digital Street Art for GitHub Profile" -ForegroundColor Green
Write-Host "   Generating {total_commits} backdated commits across {len(commit_plan)} days..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Ensure git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {{
    Write-Error "Git is not installed or not in PATH. Please install Git to continue."
    exit 1
}}

# Initialize git repository if not in one
if (-not (Test-Path .git)) {{
    Write-Host "[1/3] Initializing new Git repository..." -ForegroundColor Cyan
    git init -q
    git checkout -b main 2>$null
}} else {{
    Write-Host "[1/3] Using existing repository in $pwd..." -ForegroundColor Cyan
}}

# Commit Plan Data
$planJson = @'
{plan_json}
'@

$plan = ConvertFrom-Json $planJson
$total = {total_commits}
$done = 0

Write-Host "[2/3] Writing backdated commits..." -ForegroundColor Cyan

foreach ($entry in $plan) {{
    $dateStr = $entry[0]
    $count = [int]$entry[1]
    
    for ($i = 0; $i -lt $count; $i++) {{
        $minuteOffset = $i * 5
        $hour = 12 + [math]::Floor($minuteOffset / 60)
        $minute = $minuteOffset % 60
        $timestamp = ("{{0}} {{1:D2}}:{{2:D2}}:00 +0000" -f $dateStr, $hour, $minute)
        
        $env:GIT_AUTHOR_DATE = $timestamp
        $env:GIT_COMMITTER_DATE = $timestamp
        
        $msg = "Graphiti art: $dateStr #$($i+1)"
        git commit --allow-empty -q -m $msg
        
        $done++
        if ($done % 25 -eq 0 -or $done -eq $total) {{
            $pct = [math]::Floor(($done / $total) * 100)
            Write-Host -NoNewline ("`r  Progress: [$done/$total] $pct%")
        }}
    }}
}}

Remove-Item Env:\\GIT_AUTHOR_DATE -ErrorAction SilentlyContinue
Remove-Item Env:\\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host ""
Write-Host ""
Write-Host "🎉 [3/3] Success! Created $total commits." -ForegroundColor Green
Write-Host ""
Write-Host "Next step - Link and push to GitHub:" -ForegroundColor Yellow
Write-Host "  git remote add origin https://github.com/<your-username>/{repo_name}.git" -ForegroundColor White
Write-Host "  git branch -M main" -ForegroundColor White
Write-Host "  git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "💡 Note: It usually takes 2-5 minutes for GitHub to render the contribution graph." -ForegroundColor Cyan
Write-Host "   To erase this art anytime, simply delete the {repo_name} repository on GitHub." -ForegroundColor DarkGray
Write-Host ""
'''
    return script


def generate_bash_code(commit_plan: List, repo_name: str) -> str:
    total_commits = sum(count for _, count in commit_plan)
    
    # Generate bash arrays
    date_lines = []
    for d, count in commit_plan:
        date_str = d.strftime("%Y-%m-%d")
        date_lines.append(f'  "{date_str}:{count}"')
    
    dates_block = "\n".join(date_lines)
    
    script = f'''#!/usr/bin/env bash
# ==============================================================================
#   Graphiti Art Studio - Automated Git Commit Generator
#   Total Commits : {total_commits}
#   Active Days   : {len(commit_plan)}
# ==============================================================================

set -e

echo ""
echo "🎨 ========================================================"
echo "   Graphiti: Digital Street Art for GitHub Profile"
echo "   Generating {total_commits} backdated commits across {len(commit_plan)} days..."
echo "============================================================"
echo ""

if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install Git first."
    exit 1
fi

if [ ! -d .git ]; then
    echo "[1/3] Initializing new Git repository..."
    git init -q
    git checkout -b main 2>/dev/null || true
else
    echo "[1/3] Using existing repository..."
fi

plan=(
{dates_block}
)

total={total_commits}
done=0

echo "[2/3] Writing backdated commits..."

for item in "${{plan[@]}}"; do
    IFS=":" read -r dateStr count <<< "$item"
    for ((i=0; i<count; i++)); do
        minuteOffset=$((i * 5))
        hour=$((12 + minuteOffset / 60))
        minute=$((minuteOffset % 60))
        timeFormatted=$(printf "%02d:%02d:00 +0000" "$hour" "$minute")
        timestamp="$dateStr $timeFormatted"
        
        export GIT_AUTHOR_DATE="$timestamp"
        export GIT_COMMITTER_DATE="$timestamp"
        
        git commit --allow-empty -q -m "Graphiti art: $dateStr #$((i+1))"
        
        done=$((done + 1))
        if (( done % 25 == 0 || done == total )); then
            pct=$(( done * 100 / total ))
            printf "\\r  Progress: [%d/%d] %d%%" "$done" "$total" "$pct"
        fi
    done
done

unset GIT_AUTHOR_DATE
unset GIT_COMMITTER_DATE

echo ""
echo ""
echo "🎉 [3/3] Success! Created $total commits."
echo ""
echo "Next step - Link and push to GitHub:"
echo "  git remote add origin https://github.com/<your-username>/{repo_name}.git"
echo "  git branch -M main"
echo "  git push -u origin main"
echo ""
echo "💡 Note: It takes 2-5 minutes for GitHub to update your profile graph."
echo "   To erase this art anytime, simply delete the {repo_name} repository on GitHub."
echo ""
'''
    return script


@app.post("/api/generate-script")
def generate_script(req: ScriptGenerateRequest):
    grid = req.grid
    if not grid or len(grid) != 7:
        raise HTTPException(status_code=400, detail="Grid must have exactly 7 rows")
        
    mode = "rolling" if req.mode == "rolling" else "year"
    target_year = req.year if req.year else (None if mode == "rolling" else datetime.date.today().year)
    start_sunday = get_start_date(year=target_year, mode=mode)
    
    commit_plan = calculate_commit_plan(grid, start_sunday, intensity=req.intensity)
    total_commits = sum(count for _, count in commit_plan)
    
    if not commit_plan:
        raise HTTPException(status_code=400, detail="No pixels painted on grid. Paint at least one cell!")
        
    ps_code = generate_powershell_code(commit_plan, req.repo_name)
    bash_code = generate_bash_code(commit_plan, req.repo_name)
    
    first_date = min(d for d, _ in commit_plan).strftime("%Y-%m-%d")
    last_date = max(d for d, _ in commit_plan).strftime("%Y-%m-%d")
    
    return {
        "powershell": ps_code,
        "bash": bash_code,
        "total_commits": total_commits,
        "active_days": len(commit_plan),
        "date_span": {"start": first_date, "end": last_date},
        "target_year": target_year,
        "mode": mode
    }
