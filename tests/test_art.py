"""
Unit tests for Graphiti Art Studio (Date Mapping, Plan Generation, Preview).
"""

import datetime
import json
import os
import tempfile
import unittest

from graphiti_engine.art import (
    calculate_commit_plan,
    cell_to_date,
    get_start_date,
    load_pattern_file,
    render_terminal_preview,
)


class TestArtEngine(unittest.TestCase):
    def test_start_date_year_mode(self):
        # Jan 1, 2024 was a Monday (weekday 0 in python, so Sunday=0 convention is day 1)
        # Preceding Sunday was Dec 31, 2023
        start_2024 = get_start_date(year=2024, mode="year")
        self.assertEqual(start_2024, datetime.date(2023, 12, 31))
        # Ensure it's Sunday
        # Python weekday: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
        self.assertEqual(start_2024.weekday(), 6)

    def test_cell_to_date_calculation(self):
        start = datetime.date(2024, 1, 7)  # Sunday
        # Row 0, Col 0 -> same Sunday
        self.assertEqual(cell_to_date(start, row=0, col=0), start)
        # Row 1, Col 0 -> Monday
        self.assertEqual(cell_to_date(start, row=1, col=0), start + datetime.timedelta(days=1))
        # Row 0, Col 1 -> Next Sunday (7 days later)
        self.assertEqual(cell_to_date(start, row=0, col=1), start + datetime.timedelta(days=7))

    def test_commit_plan_counts(self):
        grid = [[0 for _ in range(52)] for _ in range(7)]
        # Place 1 pixel at level 1 (1 commit), 1 pixel at level 4 (10 commits)
        grid[0][0] = 1
        grid[1][0] = 4
        
        start = datetime.date(2024, 1, 7)
        plan = calculate_commit_plan(grid, start, intensity=1)
        self.assertEqual(len(plan), 2)
        self.assertEqual(plan[0], (start, 1))
        self.assertEqual(plan[1], (start + datetime.timedelta(days=1), 10))
        
        # Test intensity multiplier 2
        plan_int2 = calculate_commit_plan(grid, start, intensity=2)
        self.assertEqual(plan_int2[0], (start, 2))
        self.assertEqual(plan_int2[1], (start + datetime.timedelta(days=1), 20))

    def test_load_pattern_file_formats(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            # 2D list format
            path_2d = os.path.join(tmpdir, "pattern_2d.json")
            mat = [[0 for _ in range(52)] for _ in range(7)]
            mat[2][5] = 4
            with open(path_2d, "w") as f:
                json.dump(mat, f)
            loaded = load_pattern_file(path_2d)
            self.assertEqual(loaded[2][5], 4)

            # Object with matrix key
            path_obj = os.path.join(tmpdir, "pattern_obj.json")
            with open(path_obj, "w") as f:
                json.dump({"matrix": mat}, f)
            loaded_obj = load_pattern_file(path_obj)
            self.assertEqual(loaded_obj[2][5], 4)

            # Sparse pixels format
            path_sparse = os.path.join(tmpdir, "pattern_sparse.json")
            with open(path_sparse, "w") as f:
                json.dump({"pixels": [{"x": 10, "y": 3, "level": 3}]}, f)
            loaded_sparse = load_pattern_file(path_sparse)
            self.assertEqual(loaded_sparse[3][10], 3)

    def test_render_terminal_preview(self):
        grid = [[0 for _ in range(52)] for _ in range(7)]
        grid[0][0] = 4
        start = datetime.date(2024, 1, 7)
        preview = render_terminal_preview(grid, start, title="TEST", use_ascii=True)
        self.assertIn("TEST", preview)
        self.assertIn("Sun", preview)
        self.assertIn("Sat", preview)
        self.assertIn("█", preview)


if __name__ == "__main__":
    unittest.main()
