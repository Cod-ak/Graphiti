"""
Unit tests for Graphiti Contribution Merger.
"""

import os
import shutil
import subprocess
import tempfile
import unittest

from graphiti_engine.merger import audit_repository, render_audit_report, rewrite_history


class TestMergerEngine(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        subprocess.run(["git", "init"], cwd=self.test_dir, check=True, stdout=subprocess.DEVNULL)
        
        # Configure local git user
        subprocess.run(["git", "config", "user.name", "Old Author"], cwd=self.test_dir, check=True)
        subprocess.run(["git", "config", "user.email", "old@work.com"], cwd=self.test_dir, check=True)
        
        # Create 3 commits
        for i in range(3):
            file_path = os.path.join(self.test_dir, f"file{i}.txt")
            with open(file_path, "w") as f:
                f.write(f"content {i}")
            subprocess.run(["git", "add", "."], cwd=self.test_dir, check=True)
            subprocess.run(["git", "commit", "-m", f"Commit {i}"], cwd=self.test_dir, check=True)

    def tearDown(self):
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_audit_repository(self):
        all_commits, matching, counts = audit_repository(self.test_dir, "old@work.com")
        self.assertEqual(len(all_commits), 3)
        self.assertEqual(len(matching), 3)
        self.assertEqual(counts.get("old@work.com"), 3)

    def test_audit_no_match(self):
        all_commits, matching, counts = audit_repository(self.test_dir, "different@company.com")
        self.assertEqual(len(all_commits), 3)
        self.assertEqual(len(matching), 0)

    def test_render_audit_report(self):
        all_commits, matching, counts = audit_repository(self.test_dir, "old@work.com")
        report = render_audit_report(
            self.test_dir,
            old_email="old@work.com",
            new_email="new@gmail.com",
            new_name="New Name",
            all_commits=all_commits,
            matching_commits=matching,
            author_counts=counts
        )
        self.assertIn("GRAPHITI CONTRIBUTION AUDITOR", report)
        self.assertIn("old@work.com", report)
        self.assertIn("new@gmail.com", report)
        self.assertIn("Total Commits     : 3", report)


if __name__ == "__main__":
    unittest.main()
