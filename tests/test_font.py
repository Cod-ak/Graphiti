"""
Unit tests for Graphiti Font Engine.
"""

import unittest
from graphiti_engine.font import FONT_5X7, render_text_to_matrix


class TestFontEngine(unittest.TestCase):
    def test_all_ascii_letters_defined(self):
        for char in "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?":
            self.assertIn(char, FONT_5X7, f"Character '{char}' missing from font dictionary")
            glyph = FONT_5X7[char]
            self.assertEqual(len(glyph), 7, f"Glyph '{char}' does not have 7 rows")
            width = len(glyph[0])
            self.assertGreater(width, 0)
            for row in glyph:
                self.assertEqual(len(row), width, f"Inconsistent width in glyph '{char}'")

    def test_render_text_dimensions(self):
        grid = render_text_to_matrix("HELLO", total_cols=52)
        self.assertEqual(len(grid), 7)
        self.assertEqual(len(grid[0]), 52)
        
        # Check active pixels are present
        active_count = sum(sum(1 for cell in row if cell > 0) for row in grid)
        self.assertGreater(active_count, 0)

    def test_text_alignment(self):
        grid_left = render_text_to_matrix("H", total_cols=52, align="left")
        grid_right = render_text_to_matrix("H", total_cols=52, align="right")
        
        # Left-aligned H should start in column 0
        self.assertGreater(grid_left[0][0], 0)
        # Right-aligned H should end in column 51
        self.assertGreater(grid_right[0][51], 0)

    def test_intensity_level(self):
        grid = render_text_to_matrix("A", total_cols=52, level=3)
        for row in grid:
            for cell in row:
                self.assertIn(cell, [0, 3])


if __name__ == "__main__":
    unittest.main()
