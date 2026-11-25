"""
Graphiti Art Studio - Date Mapping, Terminal Visualizer & Backdated Commit Engine.

Translates 7x52 pixel matrices into backdated Git commits aligned with GitHub's calendar grid.
"""

import datetime
import json
import os
import subprocess
import sys
from typing import Dict, List, Optional, Tuple

# Base commit counts per GitHub quartile shade
DEFAULT_LEVEL_COMMITS = {
    0: 0,
    1: 1,
    2: 3,
    3: 6,
    4: 10
}

# ANSI escape codes for terminal coloring
ANSI_RESET = "\033[0m"
ANSI_DIM = "\033[2m"
ANSI_BOLD = "\033[1m"
ANSI_CYAN = "\033[36m"
ANSI_YELLOW = "\033[33m"
ANSI_GREEN = "\033[32m"

# GitHub dark theme green shades (24-bit TrueColor)
SHADE_COLORS = {
    0: "\033[38;2;40;44;52m■\033[0m",       # Empty dark gray
    1: "\033[38;2;14;68;41m■\033[0m",       # Level 1 (#0e4429)
    2: "\033[38;2;0;109;50m■\033[0m",       # Level 2 (#006d32)
    3: "\033[38;2;38;166;65m■\033[0m",      # Level 3 (#26a641)
    4: "\033[38;2;57;211;83m■\033[0m",      # Level 4 (#39d353)
}

ASCII_SHADES = {
    0: "·",
    1: "░",
    2: "▒",
    3: "▓",
    4: "█"
}

DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]


def get_start_date(year: Optional[int] = None, mode: str = "year") -> datetime.date:
    """
    Computes the anchor Sunday (Week 0, Day 0) for the 7x52 calendar grid.
    
    In 'year' mode:
      Finds the Sunday of the week containing January 1st of `year`.
    In 'rolling' mode:
      Finds 51 weeks before current week's Sunday, ending on the current week.
    """
    if mode == "rolling" or year is None:
        today = datetime.date.today()
        # Weekday in Sunday=0 notation (Python weekday is Monday=0 ... Sunday=6)
        sun_weekday = (today.weekday() + 1) % 7
        this_week_sunday = today - datetime.timedelta(days=sun_weekday)
        return this_week_sunday - datetime.timedelta(weeks=51)
    else:
        jan1 = datetime.date(year, 1, 1)
        sun_weekday = (jan1.weekday() + 1) % 7
        return jan1 - datetime.timedelta(days=sun_weekday)


def cell_to_date(start_sunday: datetime.date, row: int, col: int) -> datetime.date:
    """Calculates exact date for a (row, column) in the 7x52 matrix."""
    return start_sunday + datetime.timedelta(days=(col * 7 + row))


def load_pattern_file(filepath: str) -> List[List[int]]:
    """
    Loads a 7x52 matrix from a JSON file.
    Supports 2D lists, {"matrix": [...]}, {"grid": [...]}, or {"pixels": [{"x", "y", "level"}]}.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Pattern file not found: {filepath}")
        
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    grid = [[0 for _ in range(52)] for _ in range(7)]
    
    if isinstance(data, list):
        if len(data) == 7 and isinstance(data[0], list):
            for r in range(min(7, len(data))):
                for c in range(min(52, len(data[r]))):
                    grid[r][c] = max(0, min(4, int(data[r][c])))
            return grid
            
    if isinstance(data, dict):
        matrix = data.get("matrix") or data.get("grid")
        if matrix and isinstance(matrix, list):
            for r in range(min(7, len(matrix))):
                for c in range(min(52, len(matrix[r]))):
                    grid[r][c] = max(0, min(4, int(matrix[r][c])))
            return grid
            
        pixels = data.get("pixels")
        if pixels and isinstance(pixels, list):
            for p in pixels:
                x = p.get("x", p.get("col", 0))
                y = p.get("y", p.get("row", 0))
                lvl = p.get("level", p.get("val", 4))
                if 0 <= y < 7 and 0 <= x < 52:
                    grid[y][x] = max(0, min(4, int(lvl)))
            return grid
            
    raise ValueError(f"Unrecognized pattern JSON format in: {filepath}")


def render_terminal_preview(
    grid: List[List[int]],
    start_sunday: datetime.date,
    title: str = "GRAPHITI PREVIEW",
    use_ascii: bool = False
) -> str:
    """
    Renders an ANSI-colored 7x52 calendar grid with month headers and day labels.
    """
    cols = len(grid[0]) if grid else 52
    lines = []
    
    header_banner = (
        f"\n{ANSI_BOLD}{ANSI_CYAN}════════════════════════════════════════════════════════════════════════════════{ANSI_RESET}\n"
        f"  🎨  {ANSI_BOLD}{title}{ANSI_RESET}\n"
        f"{ANSI_BOLD}{ANSI_CYAN}════════════════════════════════════════════════════════════════════════════════{ANSI_RESET}"
    )
    lines.append(header_banner)
    
    # Month timeline header
    month_header = "       "
    last_month = None
    for c in range(cols):
        date_at_col = cell_to_date(start_sunday, 0, c)
        current_month = date_at_col.strftime("%b")
        if current_month != last_month and (cols - c >= 3):
            # Print month abbreviation (3 chars)
            month_header += current_month[0]
            last_month = current_month
        else:
            month_header += " "
            
    lines.append(f"{ANSI_DIM}{month_header}{ANSI_RESET}")
    
    # Render the 7 rows (Sun to Sat)
    shade_map = ASCII_SHADES if use_ascii else SHADE_COLORS
    for r in range(7):
        day_label = f"{DAY_NAMES[r]}  "
        row_str = ""
        for c in range(cols):
            val = grid[r][c]
            row_str += shade_map.get(val, shade_map[0]) + " "
        lines.append(f"{ANSI_DIM}{day_label}{ANSI_RESET} {row_str}")
        
    # Legend
    legend = (
        f"\n  Legend:  "
        f"{shade_map[0]} 0  "
        f"{shade_map[1]} 1  "
        f"{shade_map[2]} 2  "
        f"{shade_map[3]} 3  "
        f"{shade_map[4]} 4  (commits: 0, 1, 3, 6, 10)\n"
    )
    lines.append(legend)
    return "\n".join(lines)


def calculate_commit_plan(
    grid: List[List[int]],
    start_sunday: datetime.date,
    intensity: int = 1
) -> List[Tuple[datetime.date, int]]:
    """
    Generates a list of (date, commit_count) tuples for all active pixels.
    """
    plan = []
    cols = len(grid[0]) if grid else 52
    
    for c in range(cols):
        for r in range(7):
            level = grid[r][c]
            if level > 0:
                base_count = DEFAULT_LEVEL_COMMITS.get(level, 1)
                total_commits = base_count * max(1, intensity)
                target_date = cell_to_date(start_sunday, r, c)
                plan.append((target_date, total_commits))
                
    return plan


def execute_commit_plan(
    repo_path: str,
    commit_plan: List[Tuple[datetime.date, int]],
    dry_run: bool = False
) -> int:
    """
    Executes backdated empty commits into the target git repository.
    
    Returns total commits generated.
    """
    abs_repo = os.path.abspath(repo_path)
    if not os.path.isdir(abs_repo):
        raise FileNotFoundError(f"Target repository path does not exist: {abs_repo}")
        
    git_dir = os.path.join(abs_repo, ".git")
    if not os.path.exists(git_dir):
        # Auto-initialize if not yet a git repo
        print(f"{ANSI_YELLOW}Notice: Initializing new Git repository in {abs_repo}...{ANSI_RESET}")
        subprocess.run(["git", "init"], cwd=abs_repo, check=True, stdout=subprocess.DEVNULL)
        
    total_commits = sum(count for _, count in commit_plan)
    
    if dry_run:
        print(f"\n{ANSI_BOLD}Dry Run Complete:{ANSI_RESET}")
        print(f"  Target Repository : {abs_repo}")
        print(f"  Active Days       : {len(commit_plan)}")
        print(f"  Total Commits     : {total_commits}")
        if commit_plan:
            first_date = min(d for d, _ in commit_plan)
            last_date = max(d for d, _ in commit_plan)
            print(f"  Date Span         : {first_date} -> {last_date}")
        print(f"\n{ANSI_GREEN}No commits were created (dry-run mode).{ANSI_RESET}")
        return 0

    print(f"\n{ANSI_BOLD}Executing commit plan...{ANSI_RESET}")
    print(f"  Repository    : {abs_repo}")
    print(f"  Active Days   : {len(commit_plan)}")
    print(f"  Total Commits : {total_commits}")
    
    commits_done = 0
    env = os.environ.copy()
    
    for date_obj, count in commit_plan:
        date_str = date_obj.strftime("%Y-%m-%d")
        for i in range(count):
            # Stagger commit timestamp by 5-minute increments starting at 12:00
            minute_offset = i * 5
            hour = 12 + (minute_offset // 60)
            minute = minute_offset % 60
            time_str = f"{hour:02d}:{minute:02d}:00 +0000"
            iso_timestamp = f"{date_str} {time_str}"
            
            env["GIT_AUTHOR_DATE"] = iso_timestamp
            env["GIT_COMMITTER_DATE"] = iso_timestamp
            
            commit_msg = f"Graphiti art: {date_str} #{i+1}"
            cmd = ["git", "commit", "--allow-empty", "-m", commit_msg]
            
            subprocess.run(
                cmd,
                cwd=abs_repo,
                env=env,
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE
            )
            commits_done += 1
            
            # Print lightweight inline progress
            if commits_done % 20 == 0 or commits_done == total_commits:
                pct = int((commits_done / total_commits) * 100)
                sys.stdout.write(f"\r  Progress: [{commits_done}/{total_commits}] {pct}%")
                sys.stdout.flush()
                
    print(f"\n\n{ANSI_BOLD}{ANSI_GREEN}🎉 Success! Created {commits_done} backdated commits in {abs_repo}{ANSI_RESET}")
    print("\nNext steps:")
    print("  1. Push commits to GitHub:")
    print("     cd", abs_repo)
    print("     git remote add origin https://github.com/<your-user>/<art-repo>.git")
    print("     git push -u origin main (or git push -u origin master)")
    print("  2. Refresh your GitHub profile after ~2-5 minutes to see your artwork!")
    return commits_done
