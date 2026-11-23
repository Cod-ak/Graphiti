# Graphiti 🎨

```
   ____                 _     _ _   _ 
  / ___|_ __ __ _ _ __ | |__ (_) |_(_)
 | |  _| '__/ _` | '_ \| '_ \| | __| |
 | |_| | | | (_| | |_) | | | | | |_| |
  \____|_|  \__,_| .__/|_| |_|_|\__|_|
                 |_|                  
  >> Digital street art for your GitHub graph.
```

[![Language: Python 3.8+](https://img.shields.io/badge/Python-3.8%2B-blue.svg?logo=python)](https://python.org)
[![Shell: PowerShell 5.1+](https://img.shields.io/badge/PowerShell-5.1%2B-5391FE.svg?logo=powershell)](https://github.com/PowerShell/PowerShell)
[![Dependencies: Zero Mandatory](https://img.shields.io/badge/Dependencies-Zero%20Mandatory-brightgreen.svg)]()
[![Platform: Cross-Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**`Graphiti`** is the ultimate developer tool for your GitHub profile. It embodies a double-meaning: you are literally tagging **Graffiti** onto your GitHub contribution **Graph**.

Whether you want to paint 8-bit pixel art, write bold text banners, convert images into pixel art, or merge past contributions from an old work email into your personal GitHub account, **Graphiti** does it with precision, zero dependencies, and surgical Git history control.

---

## 🌟 Key Features

### 1. 🎨 Graph Art Studio (7×52 Canvas)
Turn GitHub's 7-row by 52-column contribution calendar into your personal pixel canvas:
- **🔤 Text Banners:** Render custom text (`"HELLO"`, `"HIRE ME"`, `"2024"`, `"CODE"`) using a built-in 5×7 dot-matrix font with variable kerning and alignment controls.
- **👾 Pixel Art Presets:** Built-in 8-bit designs including `invader`, `heart`, `wave`, `stars`, `checkers`, `cat`, `skull`, and `git`.
- **🖥️ Standalone Interactive Web Canvas (`canvas.html`):** Click-and-drag drawing board in the browser with 4 GitHub shades of green, flood fill, shift controls, text generator, image-to-pixel-art converter, and one-click JSON export.
- **📅 Accurate Date & Calendar Mathematics:** Full alignment with GitHub's Sunday-based week columns. Supports both fixed calendar years (`--year 2024`) and live profile views (`--mode rolling` ending today).
- **🟩 GitHub Quartile Shading:** Generates commit density matching GitHub's 5 quartile shades (0, 1, 3, 6, 10 commits/day) with `--intensity` multiplier.
- **👁️ TrueColor Terminal Preview (`--dry-run`):** Inspect your artwork directly in your terminal with 24-bit ANSI colors before generating a single commit.

### 2. 🔀 Contribution Merger & History Rewriter
Migrating to a new GitHub account or company? Claim your rightful past green squares:
- **🔍 Built-in Commit Auditor:** Inspects all historical commits, analyzes author/committer emails, and displays a comprehensive breakdown table.
- **⚡ Native High-Speed Stream Engine:** Rewrites past author name and email across branches and tags using Git's fast-export stream (zero dependencies, works on any platform).
- **🚀 `git-filter-repo` Compatible:** Automatically detects and leverages `git-filter-repo` if installed for massive repositories.
- **🛡️ Safety First:** Dry-run auditor mode, uncommitted changes detector, and confirmation prompts ensure you never accidentally overwrite uncommitted work.

### 3. 🪟 Native Windows Companion (`graphiti.ps1`)
A first-class PowerShell script with **zero external dependencies** — not even Python is required! Windows developers can run text generation, presets, interactive web canvas, and history rewriting natively using standard PowerShell and `git`.

---

## 📂 Repository Architecture

```
Graphiti/
├── graphiti.py                   # Main CLI entrypoint (Python 3)
├── graphiti.ps1                  # Native Windows PowerShell companion (Zero dependencies)
├── requirements.txt              # Minimal / optional enhancement dependencies
├── README.md                     # Documentation & visual guide
├── tests/                        # Comprehensive test suite
│   ├── test_art.py
│   ├── test_font.py
│   ├── test_presets.py
│   └── test_merger.py
└── graphiti_engine/
    ├── __init__.py               # Engine exports & version metadata
    ├── merger.py                 # Feature 1: Git history rewriter & commit auditor
    ├── art.py                    # Feature 2: Calendar date mapping & backdated commit engine
    ├── font.py                   # 5x7 dot-matrix font dictionary (A-Z, 0-9, symbols)
    ├── presets.py                # Pre-built pixel art templates (Heart, Invader, Wave, etc.)
    └── web/
        └── canvas.html           # Standalone interactive browser drawing board
```

---

## 🚀 Quick Start

### Installation

Clone the repository:
```bash
git clone https://github.com/<your-user>/Graphiti.git
cd Graphiti
```

Core Graphiti has **zero mandatory dependencies**. If you wish to install optional enhancements (e.g. `git-filter-repo` or `Pillow`):
```bash
pip install -r requirements.txt
```

---

## 🎨 Feature 1: Drawing Art onto the Graph

### Safe Workflow Recommendation: Dedicated Canvas Repository
> [!IMPORTANT]
> Always create a **dedicated, empty repository** on GitHub (e.g., `github-canvas` or `profile-art`) for your Graphiti art commits.
> 
> **Why?**
> - GitHub aggregates contributions across all your repositories.
> - If you ever want to clear or change your graph art, **simply delete that one repository**, and your profile calendar resets immediately!

### 1. Preview in Terminal (Dry Run)
Inspect the 7×52 calendar grid in your terminal before creating any commits:
```bash
# Python
python graphiti.py art --year 2024 --text "HELLO" --dry-run

# PowerShell
.\graphiti.ps1 art -Year 2024 -Text "HELLO" -DryRun
```

Terminal output:
```
════════════════════════════════════════════════════════════════════════════════
  🎨  TEXT BANNER: "HELLO" (Year 2024)
════════════════════════════════════════════════════════════════════════════════
       Jan   Feb   Mar    Apr   May    Jun   Jul   Aug    Sep   Oct   Nov   
Sun   · · · · · · · · · · █ · · · █ · █ █ █ █ █ · █ · · · · · █ · · · · · █ █ █ █ · · · · · · · · · ·
Mon   · · · · · · · · · · █ · · · █ · █ · · · · · █ · · · · · █ · · · · · █ · · · █ · · · · · · · · · ·
Tue   · · · · · · · · · · █ · · · █ · █ · · · · · █ · · · · · █ · · · · · █ · · · █ · · · · · · · · · ·
Wed   · · · · · · · · · · █ █ █ █ █ · █ █ █ █ · · █ · · · · · █ · · · · · █ · · · █ · · · · · · · · · ·
Thu   · · · · · · · · · · █ · · · █ · █ · · · · · █ · · · · · █ · · · · · █ · · · █ · · · · · · · · · ·
Fri   · · · · · · · · · · █ · · · █ · █ · · · · · █ · · · · · █ · · · · · █ · · · █ · · · · · · · · · ·
Sat   · · · · · · · · · · █ · · · █ · █ █ █ █ █ · █ █ █ █ █ · █ █ █ █ █ · █ █ █ █ · · · · · · · · · · ·

  Legend:  ■ 0  ■ 1  ■ 2  ■ 3  ■ 4  (commits: 0, 1, 3, 6, 10)
```

### 2. Commit Text Banner
Commit backdated empty commits into your canvas repository:
```bash
# Python
python graphiti.py art --repo-path ../canvas-repo --year 2024 --text "HELLO"

# PowerShell
.\graphiti.ps1 art -RepoPath ..\canvas-repo -Year 2024 -Text "HELLO"
```

### 3. Draw from Built-in Presets
```bash
# Retro Pixel Alien
python graphiti.py art --repo-path ../canvas-repo --year 2024 --preset invader

# Twin Hearts
python graphiti.py art --repo-path ../canvas-repo --year 2024 --preset heart

# Sinusoidal Ocean Wave
python graphiti.py art --repo-path ../canvas-repo --year 2024 --preset wave

# Checkerboard Weave
python graphiti.py art --repo-path ../canvas-repo --year 2024 --preset checkers

# Constellation Stars
python graphiti.py art --repo-path ../canvas-repo --year 2024 --preset stars
```

### 4. Rolling 52-Week Mode (Visible Today)
By default, `--year YYYY` maps to the January–December calendar view. If you want art visible on your **front GitHub profile page today**, use `--mode rolling`:
```bash
python graphiti.py art --repo-path ../canvas-repo --mode rolling --preset heart
```

### 5. Draw from Web Canvas Pattern JSON
```bash
python graphiti.py art --repo-path ../canvas-repo --year 2024 --pattern-file pattern.json
```

### 6. Pushing to GitHub
After the commit engine finishes:
```bash
cd ../canvas-repo
git remote add origin https://github.com/<your-username>/github-canvas.git
git branch -M main
git push -u origin main
```
> [!TIP]
> GitHub recalculates contribution graphs periodically. Your commits will appear on your profile graph within **2–5 minutes**. Ensure the email configured in your Git client matches an email verified on your GitHub account!

---

## 🖥️ Feature 2: Launch the Web Drawing Board

Open an interactive, browser-based 7×52 pixel canvas studio:
```bash
# Python
python graphiti.py canvas

# PowerShell
.\graphiti.ps1 canvas
```

### Interactive Board Capabilities:
- 🖌️ **Painting Tools:** Pencil, Eraser, and Paint Bucket (flood fill).
- 🎨 **Shades:** 5 GitHub quartile shades (Levels 0–4) with Dark Mode and Light Mode toggles.
- 🔤 **Text Generator:** Type any text, pick alignment (Left, Center, Right), and stamp it onto the board.
- 🖼️ **Image-to-Pixel Downscaler:** Drag and drop any image (PNG, JPG, SVG, WebP) to automatically quantize luminance to 7×52 green pixels with live contrast adjustments.
- 🔄 **Transformations:** Shift pattern left/right by week, invert canvas, undo/redo (with `Ctrl+Z` / `Ctrl+Y`).
- 💾 **Export / Import:** Download `pattern.json` or copy the ready-to-run CLI command in one click.

---

## 🔀 Feature 3: Merging Contributions & History Rewriting

Migrating developers often lose past contribution squares because commits at previous employers were authored under a corporate email (`you@company.com`) rather than your personal GitHub email (`you@gmail.com`).

**Graphiti's Contribution Merger** rewrites past author and committer metadata across your repository.

### 1. Audit Commits (Dry Run)
Preview which commits will be affected without changing any Git history:
```bash
# Python
python graphiti.py merge --repo-path ./my-project --old-email old@work.com --new-email me@gmail.com --new-name "Jane Doe" --dry-run

# PowerShell
.\graphiti.ps1 merge -RepoPath .\my-project -OldEmail old@work.com -NewEmail me@gmail.com -NewName "Jane Doe" -DryRun
```

Example Auditor Report:
```
════════════════════════════════════════════════════════════════════════════════
  🔍   GRAPHITI CONTRIBUTION AUDITOR
════════════════════════════════════════════════════════════════════════════════
  Target Repository : C:\Users\Dev\Projects\my-project
  Old Target Email  : old@work.com
  New Target Email  : me@gmail.com
  New Author Name   : Jane Doe
  Total Commits     : 420
  Matching Commits  : 215

  Author Email Breakdown:
    👉 [TARGET] old@work.com                    : 215 commits
                colleague@work.com              : 150 commits
                bot@ci.com                      : 55 commits

  Sample Commits to be Rewritten (up to 5):
    4a1f302b | 2022-03-14 | old@work.com -> me@gmail.com | Implement user authentication
    8c3e2119 | 2022-03-15 | old@work.com -> me@gmail.com | Fix race condition in cache
    9f0d11a2 | 2022-03-18 | old@work.com -> me@gmail.com | Add database migrations
════════════════════════════════════════════════════════════════════════════════
```

### 2. Execute History Rewrite
```bash
# Python
python graphiti.py merge --repo-path ./my-project --old-email old@work.com --new-email me@gmail.com --new-name "Jane Doe"

# PowerShell
.\graphiti.ps1 merge -RepoPath .\my-project -OldEmail old@work.com -NewEmail me@gmail.com -NewName "Jane Doe" -Force
```

### 3. Update Remote Repository
Because rewriting Git history alters commit hashes, force-push your updated branches to GitHub:
```bash
git push origin --force --all
git push origin --force --tags
```

---

## ⚙️ Technical Specifications

| Parameter | Specification | Details |
|---|---|---|
| **Matrix Size** | 7 Rows × 52 Columns | Rows correspond to days of the week (Sun=0 to Sat=6). Columns represent calendar weeks. |
| **Year Mapping** | Sunday containing Jan 1st | Aligns column 0 with the initial Sunday of the target year. |
| **Rolling Mapping** | 51 weeks before current Sunday | Aligns column 51 with the current week so commits appear on your live profile. |
| **Quartile Commit Counts** | Level 0: 0 commits<br>Level 1: 1 commit<br>Level 2: 3 commits<br>Level 3: 6 commits<br>Level 4: 10 commits | Matches GitHub's contribution quartile thresholds. |
| **Timestamp Staggering** | +5 minutes per commit | Commits for a single day start at 12:00:00 UTC and increment by 5 minutes to prevent timestamp collisions. |
| **Commit Type** | Empty commits (`--allow-empty`) | Lightweight commits that don't bloat repository size. |
| **Dependencies** | Python Standard Library & Native PowerShell | Zero external libraries required for core operation. |

---

## 📖 CLI Command Reference

### `art` Subcommand
```
usage: graphiti art [-h] [--repo-path REPO_PATH] [--year YEAR]
                    [--mode {year,rolling}] [--text TEXT] [--preset PRESET]
                    [--pattern-file PATTERN_FILE] [--intensity {1,2,3,4}]
                    [--align {left,center,right}] [--offset-weeks OFFSET_WEEKS]
                    [--dry-run] [--ascii]
```

### `merge` Subcommand
```
usage: graphiti merge [-h] [--repo-path REPO_PATH] --old-email OLD_EMAIL
                      --new-email NEW_EMAIL [--new-name NEW_NAME]
                      [--dry-run] [-y]
```

### `canvas` Subcommand
```
usage: graphiti canvas [-h] [--port PORT] [--no-browser]
```

### `presets` Subcommand
```
usage: graphiti presets [-h]
```

---

## 🛡️ License

Released under the [MIT License](LICENSE). Digital street art for everyone. Tag responsibly!
