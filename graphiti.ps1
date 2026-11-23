<#
.SYNOPSIS
    Graphiti - Digital street art for your GitHub contribution graph.
    Native Windows PowerShell Companion (Zero Dependencies).

.DESCRIPTION
    Turn your 7x52 GitHub contribution graph into a canvas, or rewrite Git commit
    author history across repositories so migrating developers claim their past squares.

.EXAMPLE
    .\graphiti.ps1 art -RepoPath ..\canvas-repo -Year 2024 -Text "HELLO" -DryRun
    .\graphiti.ps1 art -RepoPath ..\canvas-repo -Year 2024 -Preset invader
    .\graphiti.ps1 art -RepoPath ..\canvas-repo -Mode rolling -Preset heart
    .\graphiti.ps1 canvas
    .\graphiti.ps1 merge -RepoPath .\my-project -OldEmail old@work.com -NewEmail me@gmail.com -DryRun
#>

[CmdletBinding()]
param(
    [Parameter(Position=0)]
    [ValidateSet("art", "canvas", "merge", "presets", "help")]
    [string]$Command = "help",

    # Art parameters
    [string]$RepoPath = ".",
    [int]$Year = 0,
    [ValidateSet("year", "rolling")]
    [string]$Mode = "year",
    [string]$Text = $null,
    [string]$Preset = $null,
    [string]$PatternFile = $null,
    [ValidateRange(1, 4)]
    [int]$Intensity = 1,
    [ValidateSet("left", "center", "right")]
    [string]$Align = "center",
    [int]$OffsetWeeks = 0,
    [switch]$DryRun,
    [switch]$Ascii,

    # Canvas parameters
    [int]$Port = 8080,

    # Merge parameters
    [string]$OldEmail,
    [string]$NewEmail,
    [string]$NewName,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# ANSI Colors
$ESC = [char]27
$C_RESET  = "$ESC[0m"
$C_BOLD   = "$ESC[1m"
$C_DIM    = "$ESC[2m"
$C_CYAN   = "$ESC[36m"
$C_GREEN  = "$ESC[32m"
$C_YELLOW = "$ESC[33m"
$C_RED    = "$ESC[31m"

$SHADE_0 = "$ESC[38;2;40;44;52m■$C_RESET"
$SHADE_1 = "$ESC[38;2;14;68;41m■$C_RESET"
$SHADE_2 = "$ESC[38;2;0;109;50m■$C_RESET"
$SHADE_3 = "$ESC[38;2;38;166;65m■$C_RESET"
$SHADE_4 = "$ESC[38;2;57;211;83m■$C_RESET"

$ASCII_SHADES = @("·", "░", "▒", "▓", "█")
$COMMIT_COUNTS = @(0, 1, 3, 6, 10)
$DAY_NAMES = @("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")

$LOGO = @"
   ____                 _     _ _   _ 
  / ___|_ __ __ _ _ __ | |__ (_) |_(_)
 | |  _| '__/ _` | '_ \| '_ \| | __| |
 | |_| | | | (_| | |_) | | | | | |_| |
  \____|_|  \__,_| .__/|_| |_|_|\__|_|
                 |_|                  
  >> Digital street art for your GitHub graph.
"@

# 5x7 Dot-matrix Font
$FONT_5X7 = @{
    'A' = @(
        @(0,1,1,1,0), @(1,0,0,0,1), @(1,0,0,0,1), @(1,1,1,1,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1)
    )
    'B' = @(
        @(1,1,1,1,0), @(1,0,0,0,1), @(1,0,0,0,1), @(1,1,1,1,0), @(1,0,0,0,1), @(1,0,0,0,1), @(1,1,1,1,0)
    )
    'C' = @(
        @(0,1,1,1,1), @(1,0,0,0,0), @(1,0,0,0,0), @(1,0,0,0,0), @(1,0,0,0,0), @(1,0,0,0,0), @(0,1,1,1,1)
    )
    'D' = @(
        @(1,1,1,1,0), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,1,1,1,0)
    )
    'E' = @(
        @(1,1,1,1,1), @(1,0,0,0,0), @(1,0,0,0,0), @(1,1,1,1,0), @(1,0,0,0,0), @(1,0,0,0,0), @(1,1,1,1,1)
    )
    'F' = @(
        @(1,1,1,1,1), @(1,0,0,0,0), @(1,0,0,0,0), @(1,1,1,1,0), @(1,0,0,0,0), @(1,0,0,0,0), @(1,0,0,0,0)
    )
    'G' = @(
        @(0,1,1,1,1), @(1,0,0,0,0), @(1,0,0,0,0), @(1,0,1,1,1), @(1,0,0,0,1), @(1,0,0,0,1), @(0,1,1,1,0)
    )
    'H' = @(
        @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,1,1,1,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1)
    )
    'I' = @(
        @(1,1,1), @(0,1,0), @(0,1,0), @(0,1,0), @(0,1,0), @(0,1,0), @(1,1,1)
    )
    'J' = @(
        @(0,0,1,1,1), @(0,0,0,1,0), @(0,0,0,1,0), @(0,0,0,1,0), @(1,0,0,1,0), @(1,0,0,1,0), @(0,1,1,0,0)
    )
    'K' = @(
        @(1,0,0,0,1), @(1,0,0,1,0), @(1,0,1,0,0), @(1,1,0,0,0), @(1,0,1,0,0), @(1,0,0,1,0), @(1,0,0,0,1)
    )
    'L' = @(
        @(1,0,0,0,0), @(1,0,0,0,0), @(1,0,0,0,0), @(1,0,0,0,0), @(1,0,0,0,0), @(1,0,0,0,0), @(1,1,1,1,1)
    )
    'M' = @(
        @(1,0,0,0,1), @(1,1,0,1,1), @(1,0,1,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1)
    )
    'N' = @(
        @(1,0,0,0,1), @(1,1,0,0,1), @(1,0,1,0,1), @(1,0,0,1,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1)
    )
    'O' = @(
        @(0,1,1,1,0), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(0,1,1,1,0)
    )
    'P' = @(
        @(1,1,1,1,0), @(1,0,0,0,1), @(1,0,0,0,1), @(1,1,1,1,0), @(1,0,0,0,0), @(1,0,0,0,0), @(1,0,0,0,0)
    )
    'Q' = @(
        @(0,1,1,1,0), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,1,0,1), @(1,0,0,1,1), @(0,1,1,1,1)
    )
    'R' = @(
        @(1,1,1,1,0), @(1,0,0,0,1), @(1,0,0,0,1), @(1,1,1,1,0), @(1,0,1,0,0), @(1,0,0,1,0), @(1,0,0,0,1)
    )
    'S' = @(
        @(0,1,1,1,1), @(1,0,0,0,0), @(1,0,0,0,0), @(0,1,1,1,0), @(0,0,0,0,1), @(0,0,0,0,1), @(1,1,1,1,0)
    )
    'T' = @(
        @(1,1,1,1,1), @(0,0,1,0,0), @(0,0,1,0,0), @(0,0,1,0,0), @(0,0,1,0,0), @(0,0,1,0,0), @(0,0,1,0,0)
    )
    'U' = @(
        @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(0,1,1,1,0)
    )
    'V' = @(
        @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(0,1,0,1,0), @(0,0,1,0,0)
    )
    'W' = @(
        @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(1,0,1,0,1), @(1,0,1,0,1), @(1,1,0,1,1), @(1,0,0,0,1)
    )
    'X' = @(
        @(1,0,0,0,1), @(1,0,0,0,1), @(0,1,0,1,0), @(0,0,1,0,0), @(0,1,0,1,0), @(1,0,0,0,1), @(1,0,0,0,1)
    )
    'Y' = @(
        @(1,0,0,0,1), @(1,0,0,0,1), @(0,1,0,1,0), @(0,0,1,0,0), @(0,0,1,0,0), @(0,0,1,0,0), @(0,0,1,0,0)
    )
    'Z' = @(
        @(1,1,1,1,1), @(0,0,0,0,1), @(0,0,0,1,0), @(0,0,1,0,0), @(0,1,0,0,0), @(1,0,0,0,0), @(1,1,1,1,1)
    )
    '0' = @(
        @(0,1,1,1,0), @(1,0,0,1,1), @(1,0,1,0,1), @(1,1,0,0,1), @(1,0,0,0,1), @(1,0,0,0,1), @(0,1,1,1,0)
    )
    '1' = @(
        @(0,1,0), @(1,1,0), @(0,1,0), @(0,1,0), @(0,1,0), @(0,1,0), @(1,1,1)
    )
    '2' = @(
        @(0,1,1,1,0), @(1,0,0,0,1), @(0,0,0,0,1), @(0,0,1,1,0), @(0,1,0,0,0), @(1,0,0,0,0), @(1,1,1,1,1)
    )
    '3' = @(
        @(1,1,1,1,0), @(0,0,0,0,1), @(0,0,0,0,1), @(0,1,1,1,0), @(0,0,0,0,1), @(0,0,0,0,1), @(1,1,1,1,0)
    )
    '4' = @(
        @(0,0,0,1,0), @(0,0,1,1,0), @(0,1,0,1,0), @(1,0,0,1,0), @(1,1,1,1,1), @(0,0,0,1,0), @(0,0,0,1,0)
    )
    '5' = @(
        @(1,1,1,1,1), @(1,0,0,0,0), @(1,1,1,1,0), @(0,0,0,0,1), @(0,0,0,0,1), @(1,0,0,0,1), @(0,1,1,1,0)
    )
    '6' = @(
        @(0,1,1,1,0), @(1,0,0,0,0), @(1,0,0,0,0), @(1,1,1,1,0), @(1,0,0,0,1), @(1,0,0,0,1), @(0,1,1,1,0)
    )
    '7' = @(
        @(1,1,1,1,1), @(0,0,0,0,1), @(0,0,0,1,0), @(0,0,1,0,0), @(0,1,0,0,0), @(0,1,0,0,0), @(0,1,0,0,0)
    )
    '8' = @(
        @(0,1,1,1,0), @(1,0,0,0,1), @(1,0,0,0,1), @(0,1,1,1,0), @(1,0,0,0,1), @(1,0,0,0,1), @(0,1,1,1,0)
    )
    '9' = @(
        @(0,1,1,1,0), @(1,0,0,0,1), @(1,0,0,0,1), @(0,1,1,1,1), @(0,0,0,0,1), @(0,0,0,0,1), @(0,1,1,1,0)
    )
    ' ' = @(
        @(0,0,0), @(0,0,0), @(0,0,0), @(0,0,0), @(0,0,0), @(0,0,0), @(0,0,0)
    )
    '!' = @(
        @(1), @(1), @(1), @(1), @(0), @(0), @(1)
    )
    '?' = @(
        @(0,1,1,1,0), @(1,0,0,0,1), @(0,0,0,1,0), @(0,0,1,0,0), @(0,0,1,0,0), @(0,0,0,0,0), @(0,0,1,0,0)
    )
    '-' = @(
        @(0,0,0), @(0,0,0), @(0,0,0), @(1,1,1), @(0,0,0), @(0,0,0), @(0,0,0)
    )
    '+' = @(
        @(0,0,0), @(0,1,0), @(0,1,0), @(1,1,1), @(0,1,0), @(0,1,0), @(0,0,0)
    )
}

function New-Grid {
    param([int]$Rows = 7, [int]$Cols = 52)
    $g = [System.Collections.Generic.List[int[]]]::new()
    for ($r = 0; $r -lt $Rows; $r++) {
        $g.Add((New-Object int[] $Cols))
    }
    return $g
}

function Render-TextMatrix {
    param([string]$InputText, [string]$Alignment = "center", [int]$Level = 4, [int]$Offset = 0)
    $grid = New-Grid 7 52
    $upper = $InputText.ToUpper()
    
    # Render glyph columns
    $colList = [System.Collections.Generic.List[int[]]]::new()
    for ($i = 0; $i -lt $upper.Length; $i++) {
        $ch = [string]$upper[$i]
        $glyph = $FONT_5X7[$ch]
        if (-not $glyph) { $glyph = $FONT_5X7['?'] }
        $glyphWidth = $glyph[0].Length

        for ($c = 0; $c -lt $glyphWidth; $c++) {
            $colVec = New-Object int[] 7
            for ($r = 0; $r -lt 7; $r++) {
                $colVec[$r] = $glyph[$r][$c]
            }
            $colList.Add($colVec)
        }
        if ($i -lt ($upper.Length - 1)) {
            $colList.Add((New-Object int[] 7)) # 1-space column
        }
    }

    $contentWidth = $colList.Count
    $startCol = 0
    if ($Alignment -eq "center") {
        $startCol = [Math]::Max(0, [Math]::Floor((52 - $contentWidth) / 2))
    } elseif ($Alignment -eq "right") {
        $startCol = [Math]::Max(0, 52 - $contentWidth)
    }
    $startCol += $Offset

    for ($c = 0; $c -lt $contentWidth; $c++) {
        $tc = $startCol + $c
        if ($tc -ge 0 -and $tc -lt 52) {
            for ($r = 0; $r -lt 7; $r++) {
                if ($colList[$c][$r] -gt 0) {
                    $grid[$r][$tc] = $Level
                }
            }
        }
    }
    return $grid
}

function Get-PresetMatrix {
    param([string]$PresetName)
    $grid = New-Grid 7 52
    $p = $PresetName.ToLower().Trim()

    switch ($p) {
        "heart" {
            $stamp = @(
                @(0,2,3,0,0,0,3,2,0),
                @(3,4,4,3,0,3,4,4,3),
                @(4,4,4,4,3,4,4,4,4),
                @(4,4,4,4,4,4,4,4,4),
                @(0,4,4,4,4,4,4,4,0),
                @(0,0,3,4,4,4,3,0,0),
                @(0,0,0,2,4,2,0,0,0)
            )
            # Stamp two hearts
            for ($r = 0; $r -lt 7; $r++) {
                for ($c = 0; $c -lt 9; $c++) {
                    $grid[$r][14 + $c] = $stamp[$r][$c]
                    $grid[$r][29 + $c] = $stamp[$r][$c]
                }
            }
        }
        "invader" {
            $invader = @(
                @(0,0,3,0,0,0,0,0,3,0,0),
                @(0,0,0,3,0,0,0,3,0,0,0),
                @(0,0,4,4,4,4,4,4,4,0,0),
                @(0,4,4,1,4,4,4,1,4,4,0),
                @(4,4,4,4,4,4,4,4,4,4,4),
                @(4,0,4,0,0,0,0,0,4,0,4),
                @(0,0,0,4,4,0,4,4,0,0,0)
            )
            for ($sc = 2; $sc -lt 40; $sc += 15) {
                for ($r = 0; $r -lt 7; $r++) {
                    for ($c = 0; $c -lt 11; $c++) {
                        $grid[$r][$sc + $c] = $invader[$r][$c]
                    }
                }
            }
        }
        "wave" {
            for ($c = 0; $c -lt 52; $c++) {
                $angle = ($c / 52.0) * 4.0 * [Math]::PI
                $peak = [Math]::Floor((([Math]::Sin($angle) + 1.0) / 2.0) * 6.99)
                for ($r = 0; $r -lt 7; $r++) {
                    $dist = [Math]::Abs($r - $peak)
                    if ($dist -eq 0) { $grid[$r][$c] = 4 }
                    elseif ($dist -eq 1) { $grid[$r][$c] = 3 }
                    elseif ($dist -eq 2) { $grid[$r][$c] = 2 }
                    elseif ($dist -eq 3) { $grid[$r][$c] = 1 }
                }
            }
        }
        "checkers" {
            for ($r = 0; $r -lt 7; $r++) {
                for ($c = 0; $c -lt 52; $c++) {
                    if (($r + $c) % 2 -eq 0) {
                        $grid[$r][$c] = if (([Math]::Floor($r/2) + [Math]::Floor($c/2)) % 2 -eq 0) { 4 } else { 2 }
                    }
                }
            }
        }
        "stars" {
            $star5 = @(
                @(0,0,4,0,0),
                @(0,2,4,2,0),
                @(4,4,4,4,4),
                @(0,2,4,2,0),
                @(0,0,4,0,0)
            )
            $star3 = @(
                @(0,3,0),
                @(3,4,3),
                @(0,3,0)
            )
            # Stamp 5x5 stars
            for ($r = 0; $r -lt 5; $r++) {
                for ($c = 0; $c -lt 5; $c++) {
                    $grid[1 + $r][4 + $c] = $star5[$r][$c]
                    $grid[1 + $r][23 + $c] = $star5[$r][$c]
                    $grid[1 + $r][42 + $c] = $star5[$r][$c]
                }
            }
            # Stamp 3x3 stars
            for ($r = 0; $r -lt 3; $r++) {
                for ($c = 0; $c -lt 3; $c++) {
                    $grid[$r][15 + $c] = $star3[$r][$c]
                    $grid[3 + $r][34 + $c] = $star3[$r][$c]
                }
            }
        }
        default {
            Write-Error "Unknown preset: '$PresetName'. Available: heart, invader, wave, checkers, stars"
        }
    }
    return $grid
}

function Show-TerminalPreview {
    param($Grid, [datetime]$StartSunday, [string]$Title, [switch]$PlainAscii)
    Write-Host "`n$C_BOLD$C_CYAN════════════════════════════════════════════════════════════════════════════════$C_RESET"
    Write-Host "  🎨  $C_BOLD$Title$C_RESET"
    Write-Host "$C_BOLD$C_CYAN════════════════════════════════════════════════════════════════════════════════$C_RESET"

    # Month headers
    $monthHeader = "       "
    $lastM = ""
    for ($c = 0; $c -lt 52; $c++) {
        $curDate = $StartSunday.AddDays($c * 7)
        $mStr = $curDate.ToString("MMM")
        if ($mStr -ne $lastM -and (52 - $c) -ge 3) {
            $monthHeader += $mStr.Substring(0, 1)
            $lastM = $mStr
        } else {
            $monthHeader += " "
        }
    }
    Write-Host "$C_DIM$monthHeader$C_RESET"

    for ($r = 0; $r -lt 7; $r++) {
        $line = "$C_DIM$($DAY_NAMES[$r])  $C_RESET "
        for ($c = 0; $c -lt 52; $c++) {
            $val = $Grid[$r][$c]
            if ($PlainAscii) {
                $line += $ASCII_SHADES[$val] + " "
            } else {
                switch ($val) {
                    0 { $line += "$SHADE_0 " }
                    1 { $line += "$SHADE_1 " }
                    2 { $line += "$SHADE_2 " }
                    3 { $line += "$SHADE_3 " }
                    4 { $line += "$SHADE_4 " }
                }
            }
        }
        Write-Host $line
    }

    Write-Host "`n  Legend:  $SHADE_0 0  $SHADE_1 1  $SHADE_2 2  $SHADE_3 3  $SHADE_4 4  (commits: 0, 1, 3, 6, 10)`n"
}

# Subcommand: ART
function Invoke-Art {
    if (-not $Text -and -not $Preset -and -not $PatternFile) {
        Write-Error "Must provide one of -Text, -Preset, or -PatternFile."
    }

    $title = "GRAPHITI ART"
    if ($Text) {
        $grid = Render-TextMatrix -InputText $Text -Alignment $Align -Level 4 -Offset $OffsetWeeks
        $title = "TEXT BANNER: `"$Text`""
    } elseif ($Preset) {
        $grid = Get-PresetMatrix -PresetName $Preset
        $title = "PRESET: $($Preset.ToUpper())"
    } elseif ($PatternFile) {
        if (-not (Test-Path $PatternFile)) { Write-Error "Pattern file not found: $PatternFile" }
        $json = Get-Content $PatternFile -Raw | ConvertFrom-Json
        $grid = New-Grid 7 52
        $mat = if ($json.matrix) { $json.matrix } elseif ($json.grid) { $json.grid } else { $json }
        for ($r = 0; $r -lt 7; $r++) {
            for ($c = 0; $c -lt 52; $c++) {
                if ($mat[$r][$c] -ne $null) {
                    $grid[$r][$c] = [int]$mat[$r][$c]
                }
            }
        }
        $title = "PATTERN: $(Split-Path $PatternFile -Leaf)"
    }

    # Calendar Date calculation
    $today = [datetime]::Today
    $startSunday = [datetime]::MinValue
    if ($Mode -eq "rolling" -or $Year -eq 0) {
        $sunOffset = [int]$today.DayOfWeek # Sunday=0
        $thisWeekSun = $today.AddDays(-$sunOffset)
        $startSunday = $thisWeekSun.AddDays(-51 * 7)
    } else {
        $jan1 = [datetime]::new($Year, 1, 1)
        $sunOffset = [int]$jan1.DayOfWeek
        $startSunday = $jan1.AddDays(-$sunOffset)
    }

    Show-TerminalPreview -Grid $grid -StartSunday $startSunday -Title $title -PlainAscii:$Ascii

    # Calculate commit plan
    $plan = [System.Collections.Generic.List[PSCustomObject]]::new()
    for ($c = 0; $c -lt 52; $c++) {
        for ($r = 0; $r -lt 7; $r++) {
            $lvl = $grid[$r][$c]
            if ($lvl -gt 0) {
                $commits = $COMMIT_COUNTS[$lvl] * $Intensity
                $targetDate = $startSunday.AddDays($c * 7 + $r)
                $plan.Add([PSCustomObject]@{ Date = $targetDate; Count = $commits })
            }
        }
    }

    $totalCommits = ($plan | Measure-Object -Property Count -Sum).Sum
    $absRepoPath = Resolve-Path $RepoPath -ErrorAction SilentlyContinue
    if (-not $absRepoPath) {
        if ($DryRun) {
            $absRepo = $RepoPath
        } else {
            Write-Host "$C_YELLOW Target path does not exist. Creating directory...$C_RESET"
            New-Item -ItemType Directory -Path $RepoPath -Force | Out-Null
            $absRepo = (Resolve-Path $RepoPath).Path
        }
    } else {
        $absRepo = $absRepoPath.Path
    }

    if (-not $DryRun) {
        $gitDir = Join-Path $absRepo ".git"
        if (-not (Test-Path $gitDir)) {
            Write-Host "$C_YELLOW Initializing new Git repository in $absRepo...$C_RESET"
            git init $absRepo | Out-Null
        }
    }

    if ($DryRun) {
        Write-Host "$C_BOLD Dry Run Complete:$C_RESET"
        Write-Host "  Target Repository : $absRepo"
        Write-Host "  Active Days       : $($plan.Count)"
        Write-Host "  Total Commits     : $totalCommits"
        Write-Host "`n$C_GREEN No commits created (dry-run mode).$C_RESET"
        return
    }

    # Execute commits
    Write-Host "`n$C_BOLD Executing commit plan...$C_RESET"
    Write-Host "  Repository    : $absRepo"
    Write-Host "  Active Days   : $($plan.Count)"
    Write-Host "  Total Commits : $totalCommits"

    $done = 0
    foreach ($item in $plan) {
        $dateStr = $item.Date.ToString("yyyy-MM-dd")
        for ($i = 0; $i -lt $item.Count; $i++) {
            $minOffset = $i * 5
            $h = [int](12 + [Math]::Floor($minOffset / 60))
            $m = [int]($minOffset % 60)
            $isoDate = "$dateStr $('{0:00}' -f $h):$('{0:00}' -f $m):00 +0000"

            $env:GIT_AUTHOR_DATE = $isoDate
            $env:GIT_COMMITTER_DATE = $isoDate

            $commitMsg = "Graphiti art: $dateStr #$($i+1)"
            git -C $absRepo commit --allow-empty -m $commitMsg 2>$null | Out-Null
            $done++

            if ($done % 20 -eq 0 -or $done -eq $totalCommits) {
                $pct = [Math]::Floor(($done / $totalCommits) * 100)
                Write-Host -NoNewline "`r  Progress: [$done/$totalCommits] $pct%"
            }
        }
    }

    Write-Host "`n`n$C_BOLD$C_GREEN🎉 Success! Created $done backdated commits in $absRepo$C_RESET"
    Write-Host "Next step: Push to GitHub to illuminate your profile squares!"
}

# Subcommand: CANVAS
function Invoke-Canvas {
    $scriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent
    $htmlPath = Join-Path $scriptDir "graphiti_engine\web\canvas.html"
    if (-not (Test-Path $htmlPath)) {
        Write-Error "Cannot find web canvas at: $htmlPath"
    }
    Write-Host $LOGO
    Write-Host "🎨 Launching Graphiti Web Drawing Board in your default browser..."
    Start-Process $htmlPath
}

# Subcommand: MERGE
function Invoke-Merge {
    if (-not $OldEmail -or -not $NewEmail) {
        Write-Error "-OldEmail and -NewEmail are required for merge command."
    }
    $absRepo = (Resolve-Path $RepoPath).Path
    Write-Host "`n$C_BOLD$C_CYAN════════════════════════════════════════════════════════════════════════════════$C_RESET"
    Write-Host "  🔍  $C_BOLD GRAPHITI CONTRIBUTION AUDITOR$C_RESET"
    Write-Host "$C_BOLD$C_CYAN════════════════════════════════════════════════════════════════════════════════$C_RESET"
    Write-Host "  Target Repository : $absRepo"
    Write-Host "  Old Target Email  : $C_YELLOW$OldEmail$C_RESET"
    Write-Host "  New Target Email  : $C_GREEN$NewEmail$C_RESET"
    if ($NewName) { Write-Host "  New Author Name   : $C_GREEN$NewName$C_RESET" }

    $logOutput = git -C $absRepo log --all --pretty=format:"%H|%an|%ae|%cn|%ce|%ad|%s" --date=short 2>$null
    if (-not $logOutput) {
        Write-Host "$C_YELLOW Repository has no commits.$C_RESET"
        return
    }

    $allCommits = $logOutput -split "`n" | Where-Object { $_.Trim().Length -gt 0 }
    $matching = @()
    foreach ($line in $allCommits) {
        $p = $line -split "\|", 7
        if ($p.Length -ge 7) {
            if ($p[2].Trim().ToLower() -eq $OldEmail.ToLower() -or $p[4].Trim().ToLower() -eq $OldEmail.ToLower()) {
                $matching += $line
            }
        }
    }

    Write-Host "  Total Commits     : $($allCommits.Count)"
    Write-Host "  Matching Commits  : $C_BOLD$($matching.Count)$C_RESET"

    if ($matching.Count -eq 0) {
        Write-Host "$C_YELLOW No commits matched '$OldEmail'.$C_RESET"
        return
    }

    Write-Host "`n  Sample Commits to be Rewritten (up to 5):"
    for ($i = 0; $i -lt [Math]::Min(5, $matching.Count); $i++) {
        $p = $matching[$i] -split "\|", 7
        Write-Host "    $C_DIM$($p[0].Substring(0, 8))$C_RESET | $($p[5]) | $($p[2]) -> $C_GREEN$NewEmail$C_RESET | $($p[6])"
    }

    if ($DryRun) {
        Write-Host "`n$C_GREEN Dry run completed. No history was modified.$C_RESET"
        return
    }

    if (-not $Force) {
        Write-Host "`n$C_YELLOW$C_BOLD⚠️  WARNING: Rewriting history changes commit hashes for all downstream commits!$C_RESET"
        $confirm = Read-Host "Proceed with rewriting $($matching.Count) commits? (y/N)"
        if ($confirm.ToLower() -ne "y" -and $confirm.ToLower() -ne "yes") {
            Write-Host "Operation cancelled."
            return
        }
    }

    Write-Host "`nRewriting commit history using native high-speed Git fast-stream engine..."
    $export = git -C $absRepo fast-export --all
    $rewritten = [System.Collections.Generic.List[string]]::new()
    $oldEmailsLower = @($OldEmail.Split(',') | ForEach-Object { $_.Trim().ToLower() })

    foreach ($line in $export) {
        if ($line -match '^(author|committer)\s+(.*?)\s+<([^>]+)>\s+(.*)$') {
            $role = $matches[1]
            $origName = $matches[2]
            $origEmail = $matches[3]
            $stamp = $matches[4]

            if ($oldEmailsLower -contains $origEmail.Trim().ToLower()) {
                $finalName = if ($NewName) { $NewName } else { $origName }
                $rewritten.Add("$role $finalName <$NewEmail> $stamp")
                continue
            }
        }
        $rewritten.Add($line)
    }

    $streamFile = Join-Path $absRepo "graphiti_stream.dump"
    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($streamFile, ($rewritten -join "`n") + "`n", $utf8NoBom)

    cmd.exe /c "git -C `"$absRepo`" fast-import --force < `"$streamFile`" 2>nul" | Out-Null

    $branch = (git -C $absRepo rev-parse --abbrev-ref HEAD 2>$null).Trim()
    if ($branch -and $branch -ne "HEAD") {
        git -C $absRepo reset --hard "refs/heads/$branch" 2>$null | Out-Null
    }
    Remove-Item $streamFile -Force -ErrorAction SilentlyContinue

    Write-Host "`n$C_BOLD$C_GREEN✅ History rewrite completed!$C_RESET"
    Write-Host "Next step: Force push rewritten branches to GitHub:"
    Write-Host "  git push origin --force --all"
    Write-Host "  git push origin --force --tags"
}

# Router
switch ($Command) {
    "art" { Invoke-Art }
    "canvas" { Invoke-Canvas }
    "merge" { Invoke-Merge }
    "presets" {
        Write-Host "`n🎨 Available Graphiti Presets:"
        @("heart", "invader", "wave", "checkers", "stars") | ForEach-Object {
            Write-Host "  • $_ (Use: .\graphiti.ps1 art -Preset $_)"
        }
        Write-Host ""
    }
    default {
        Write-Host $LOGO
        Write-Host "Usage:"
        Write-Host "  .\graphiti.ps1 art -RepoPath <path> -Year 2024 -Text 'HELLO' [-DryRun]"
        Write-Host "  .\graphiti.ps1 art -RepoPath <path> -Preset invader [-DryRun]"
        Write-Host "  .\graphiti.ps1 art -RepoPath <path> -PatternFile pattern.json"
        Write-Host "  .\graphiti.ps1 canvas"
        Write-Host "  .\graphiti.ps1 merge -RepoPath <path> -OldEmail <old> -NewEmail <new> [-NewName <name>] [-DryRun]"
        Write-Host "  .\graphiti.ps1 presets"
    }
}
