"""
Graphiti Pixel Art Presets.

Pre-designed 7-row templates that can be tiled, centered, or stretched across the 52-week GitHub calendar.
Values range from 0 (empty) to 4 (deepest green).
"""

import math
from typing import Dict, List, Optional


def create_empty_grid(rows: int = 7, cols: int = 52) -> List[List[int]]:
    return [[0 for _ in range(cols)] for _ in range(rows)]


def _stamp_matrix(
    dest: List[List[int]],
    stamp: List[List[int]],
    start_row: int = 0,
    start_col: int = 0
) -> None:
    """Stamps a smaller 2D matrix into a larger matrix."""
    for r, row in enumerate(stamp):
        for c, val in enumerate(row):
            tr = start_row + r
            tc = start_col + c
            if 0 <= tr < len(dest) and 0 <= tc < len(dest[0]):
                dest[tr][tc] = val


def preset_heart(cols: int = 52) -> List[List[int]]:
    """Pixel heart with multi-tier shading, centered or repeated."""
    grid = create_empty_grid(7, cols)
    # 7x9 Heart template with shades 1-4
    # Row 0: Sun ... Row 6: Sat
    heart_stamp = [
        [0, 2, 3, 0, 0, 0, 3, 2, 0],
        [3, 4, 4, 3, 0, 3, 4, 4, 3],
        [4, 4, 4, 4, 3, 4, 4, 4, 4],
        [4, 4, 4, 4, 4, 4, 4, 4, 4],
        [0, 4, 4, 4, 4, 4, 4, 4, 0],
        [0, 0, 3, 4, 4, 4, 3, 0, 0],
        [0, 0, 0, 2, 4, 2, 0, 0, 0],
    ]
    # Place two hearts or one centered heart depending on width
    if cols >= 25:
        # Centered trio or duo
        start1 = (cols // 2) - 12
        start2 = (cols // 2) + 3
        _stamp_matrix(grid, heart_stamp, 0, start1)
        _stamp_matrix(grid, heart_stamp, 0, start2)
    else:
        start = max(0, (cols - 9) // 2)
        _stamp_matrix(grid, heart_stamp, 0, start)
    return grid


def preset_invader(cols: int = 52) -> List[List[int]]:
    """Classic 8-bit arcade space invader (11 columns wide, 7 rows high)."""
    grid = create_empty_grid(7, cols)
    invader = [
        [0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0],
        [0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0],
        [0, 0, 4, 4, 4, 4, 4, 4, 4, 0, 0],
        [0, 4, 4, 1, 4, 4, 4, 1, 4, 4, 0],
        [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        [4, 0, 4, 0, 0, 0, 0, 0, 4, 0, 4],
        [0, 0, 0, 4, 4, 0, 4, 4, 0, 0, 0],
    ]
    # Repeat invaders across the grid with spacing
    spacing = 15
    for start_c in range(2, cols - 11, spacing):
        _stamp_matrix(grid, invader, 0, start_c)
    return grid


def preset_wave(cols: int = 52) -> List[List[int]]:
    """Ocean wave / sinusoidal frequency sweep across 52 weeks."""
    grid = create_empty_grid(7, cols)
    for c in range(cols):
        # Calculate sine wave height (0 to 6)
        angle = (c / cols) * (4 * math.pi)  # 2 full cycles
        normalized_sine = (math.sin(angle) + 1.0) / 2.0  # 0.0 to 1.0
        peak_row = int(normalized_sine * 6.99)
        
        for r in range(7):
            dist = abs(r - peak_row)
            if dist == 0:
                grid[r][c] = 4
            elif dist == 1:
                grid[r][c] = 3
            elif dist == 2:
                grid[r][c] = 2
            elif dist == 3:
                grid[r][c] = 1
    return grid


def preset_checkers(cols: int = 52) -> List[List[int]]:
    """Checkerboard weave pattern across the entire calendar."""
    grid = create_empty_grid(7, cols)
    for r in range(7):
        for c in range(cols):
            if (r + c) % 2 == 0:
                grid[r][c] = 4 if ((r // 2) + (c // 2)) % 2 == 0 else 2
            else:
                grid[r][c] = 0
    return grid


def preset_stars(cols: int = 52) -> List[List[int]]:
    """Constellation of twinkling pixel stars across the calendar."""
    grid = create_empty_grid(7, cols)
    # 5x5 star stamp
    star5 = [
        [0, 0, 4, 0, 0],
        [0, 2, 4, 2, 0],
        [4, 4, 4, 4, 4],
        [0, 2, 4, 2, 0],
        [0, 0, 4, 0, 0],
    ]
    # 3x3 small star
    star3 = [
        [0, 3, 0],
        [3, 4, 3],
        [0, 3, 0],
    ]
    
    # Stamp stars across the calendar at varying heights
    _stamp_matrix(grid, star5, 1, 4)
    _stamp_matrix(grid, star3, 0, 15)
    _stamp_matrix(grid, star5, 1, 23)
    _stamp_matrix(grid, star3, 3, 34)
    _stamp_matrix(grid, star5, 1, 42)
    return grid


def preset_cat(cols: int = 52) -> List[List[int]]:
    """Cute 8-bit walking cat."""
    grid = create_empty_grid(7, cols)
    cat = [
        [0, 4, 0, 0, 4, 0, 0, 0, 0, 0],
        [4, 4, 4, 4, 4, 0, 0, 0, 0, 4],
        [4, 1, 4, 1, 4, 0, 0, 0, 4, 0],
        [4, 4, 4, 4, 4, 4, 4, 4, 4, 0],
        [0, 4, 4, 4, 4, 4, 4, 4, 0, 0],
        [0, 4, 4, 4, 4, 4, 4, 4, 0, 0],
        [0, 4, 0, 4, 0, 0, 4, 0, 4, 0],
    ]
    # Center cat
    start_c = max(0, (cols - 10) // 2)
    _stamp_matrix(grid, cat, 0, start_c)
    return grid


def preset_skull(cols: int = 52) -> List[List[int]]:
    """Retro pixel skull with bone cross."""
    grid = create_empty_grid(7, cols)
    skull = [
        [0, 0, 4, 4, 4, 4, 4, 0, 0],
        [0, 4, 4, 4, 4, 4, 4, 4, 0],
        [4, 4, 1, 4, 4, 4, 1, 4, 4],
        [4, 4, 1, 4, 4, 4, 1, 4, 4],
        [0, 4, 4, 4, 4, 4, 4, 4, 0],
        [0, 0, 4, 1, 4, 1, 4, 0, 0],
        [0, 0, 4, 1, 4, 1, 4, 0, 0],
    ]
    start_c = max(0, (cols - 9) // 2)
    _stamp_matrix(grid, skull, 0, start_c)
    return grid


def preset_git(cols: int = 52) -> List[List[int]]:
    """Git branch and merge graph motif."""
    grid = create_empty_grid(7, cols)
    # Master branch along row 5, feature branch branching up to row 1 then merging back
    for c in range(cols):
        grid[5][c] = 2  # base line
        
    # Feature branch 1
    for c in range(8, 22):
        grid[2][c] = 3
    grid[4][7] = 4
    grid[3][8] = 4
    grid[3][21] = 4
    grid[4][22] = 4
    # Merge commits
    grid[5][7] = 4
    grid[5][22] = 4
    
    # Feature branch 2
    for c in range(28, 44):
        grid[1][c] = 4
    grid[4][27] = 3
    grid[3][28] = 3
    grid[2][29] = 3
    grid[2][43] = 3
    grid[3][44] = 3
    grid[4][45] = 3
    grid[5][27] = 4
    grid[5][45] = 4
    return grid


PRESETS: Dict[str, callable] = {
    'heart': preset_heart,
    'invader': preset_invader,
    'wave': preset_wave,
    'checkers': preset_checkers,
    'stars': preset_stars,
    'cat': preset_cat,
    'skull': preset_skull,
    'git': preset_git,
}


def get_preset_matrix(name: str, cols: int = 52) -> List[List[int]]:
    """
    Retrieves a preset matrix by name.
    
    Raises:
        KeyError if the preset name is not recognized.
    """
    key = name.lower().strip()
    if key not in PRESETS:
        available = ", ".join(sorted(PRESETS.keys()))
        raise KeyError(f"Unknown preset '{name}'. Available presets: {available}")
    return PRESETS[key](cols=cols)


def list_presets() -> List[str]:
    """Returns the names of all registered presets."""
    return sorted(PRESETS.keys())
