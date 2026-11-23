"""
Unit tests for Graphiti Presets.
"""

import unittest
from graphiti_engine.presets import PRESETS, get_preset_matrix, list_presets


class TestPresets(unittest.TestCase):
    def test_registered_presets(self):
        names = list_presets()
        expected = ["cat", "checkers", "git", "heart", "invader", "skull", "stars", "wave"]
        for exp in expected:
            self.assertIn(exp, names)

    def test_preset_dimensions_and_levels(self):
        for name in list_presets():
            grid = get_preset_matrix(name, cols=52)
            self.assertEqual(len(grid), 7, f"Preset {name} row count is not 7")
            self.assertEqual(len(grid[0]), 52, f"Preset {name} col count is not 52")
            
            has_pixels = False
            for row in grid:
                for cell in row:
                    self.assertTrue(0 <= cell <= 4, f"Invalid cell level {cell} in preset {name}")
                    if cell > 0:
                        has_pixels = True
            self.assertTrue(has_pixels, f"Preset {name} has no active pixels")

    def test_invalid_preset_raises(self):
        with self.assertRaises(KeyError):
            get_preset_matrix("non_existent_preset_xyz")


if __name__ == "__main__":
    unittest.main()
