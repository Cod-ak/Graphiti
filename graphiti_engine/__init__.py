"""
Graphiti Engine - Digital Street Art for your GitHub Contribution Graph.
"""

__version__ = "1.0.0"
__author__ = "Graphiti"

from graphiti_engine.art import (
    calculate_commit_plan,
    execute_commit_plan,
    get_start_date,
    load_pattern_file,
    render_terminal_preview,
)
from graphiti_engine.font import FONT_5X7, render_text_to_matrix
from graphiti_engine.merger import audit_repository, rewrite_history
from graphiti_engine.presets import PRESETS, get_preset_matrix, list_presets

__all__ = [
    "FONT_5X7",
    "PRESETS",
    "render_text_to_matrix",
    "get_preset_matrix",
    "list_presets",
    "get_start_date",
    "load_pattern_file",
    "render_terminal_preview",
    "calculate_commit_plan",
    "execute_commit_plan",
    "audit_repository",
    "rewrite_history",
]
