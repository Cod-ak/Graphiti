"""
Graphiti Contribution Merger - Git History Rewriter & Commit Auditor.

Rewrites author and committer identities across Git repository history so
developers migrating between accounts can claim their past contribution squares.
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile
from typing import Dict, List, Optional, Tuple

ANSI_RESET = "\033[0m"
ANSI_BOLD = "\033[1m"
ANSI_DIM = "\033[2m"
ANSI_RED = "\033[31m"
ANSI_GREEN = "\033[32m"
ANSI_YELLOW = "\033[33m"
ANSI_CYAN = "\033[36m"


class CommitRecord:
    def __init__(
        self,
        commit_hash: str,
        author_name: str,
        author_email: str,
        committer_name: str,
        committer_email: str,
        date_str: str,
        subject: str
    ):
        self.hash = commit_hash
        self.author_name = author_name
        self.author_email = author_email
        self.committer_name = committer_name
        self.committer_email = committer_email
        self.date_str = date_str
        self.subject = subject


def audit_repository(repo_path: str, old_email: str) -> Tuple[List[CommitRecord], List[CommitRecord], Dict[str, int]]:
    """
    Analyzes all commits in the repository.
    
    Returns:
        (all_commits, matching_commits, author_email_counts)
    """
    abs_repo = os.path.abspath(repo_path)
    if not os.path.isdir(abs_repo):
        raise FileNotFoundError(f"Repository path not found: {abs_repo}")
    if not os.path.exists(os.path.join(abs_repo, ".git")):
        raise ValueError(f"Path is not a Git repository: {abs_repo}")
        
    cmd = [
        "git", "log",
        "--all",
        "--pretty=format:%H|%an|%ae|%cn|%ce|%ad|%s",
        "--date=short"
    ]
    
    result = subprocess.run(
        cmd,
        cwd=abs_repo,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace"
    )
    
    if result.returncode != 0:
        if "does not have any commits yet" in result.stderr or "fatal: your current branch" in result.stderr:
            return [], [], {}
        raise RuntimeError(f"git log failed: {result.stderr}")
        
    all_commits: List[CommitRecord] = []
    matching_commits: List[CommitRecord] = []
    author_counts: Dict[str, int] = {}
    
    old_emails_lower = [e.strip().lower() for e in old_email.split(",") if e.strip()]
    
    for line in result.stdout.strip().split("\n"):
        if not line.strip():
            continue
        parts = line.split("|", 6)
        if len(parts) < 7:
            continue
        c_hash, an, ae, cn, ce, ad, sub = parts
        rec = CommitRecord(c_hash, an, ae, cn, ce, ad, sub)
        all_commits.append(rec)
        
        email_key = ae.strip().lower()
        author_counts[email_key] = author_counts.get(email_key, 0) + 1
        
        if (rec.author_email.strip().lower() in old_emails_lower or
                rec.committer_email.strip().lower() in old_emails_lower):
            matching_commits.append(rec)
            
    return all_commits, matching_commits, author_counts


def render_audit_report(
    repo_path: str,
    old_email: str,
    new_email: str,
    new_name: Optional[str],
    all_commits: List[CommitRecord],
    matching_commits: List[CommitRecord],
    author_counts: Dict[str, int]
) -> str:
    """Renders a formatted terminal audit report before rewriting history."""
    lines = []
    lines.append(f"\n{ANSI_BOLD}{ANSI_CYAN}════════════════════════════════════════════════════════════════════════════════{ANSI_RESET}")
    lines.append(f"  🔍  {ANSI_BOLD}GRAPHITI CONTRIBUTION AUDITOR{ANSI_RESET}")
    lines.append(f"{ANSI_BOLD}{ANSI_CYAN}════════════════════════════════════════════════════════════════════════════════{ANSI_RESET}")
    lines.append(f"  Target Repository : {os.path.abspath(repo_path)}")
    lines.append(f"  Old Target Email  : {ANSI_YELLOW}{old_email}{ANSI_RESET}")
    lines.append(f"  New Target Email  : {ANSI_GREEN}{new_email}{ANSI_RESET}")
    if new_name:
        lines.append(f"  New Author Name   : {ANSI_GREEN}{new_name}{ANSI_RESET}")
    lines.append(f"  Total Commits     : {len(all_commits)}")
    lines.append(f"  Matching Commits  : {ANSI_BOLD}{len(matching_commits)}{ANSI_RESET}")
    
    lines.append(f"\n{ANSI_BOLD}  Author Email Breakdown:{ANSI_RESET}")
    for email, count in sorted(author_counts.items(), key=lambda x: -x[1]):
        marker = "👉 [TARGET]" if email in [e.strip().lower() for e in old_email.split(",")] else "  "
        lines.append(f"    {marker} {email:<35} : {count} commits")
        
    if matching_commits:
        lines.append(f"\n{ANSI_BOLD}  Sample Commits to be Rewritten (up to 5):{ANSI_RESET}")
        for rec in matching_commits[:5]:
            lines.append(
                f"    {ANSI_DIM}{rec.hash[:8]}{ANSI_RESET} | {rec.date_str} | "
                f"{rec.author_email} -> {ANSI_GREEN}{new_email}{ANSI_RESET} | {rec.subject[:40]}"
            )
        if len(matching_commits) > 5:
            lines.append(f"    {ANSI_DIM}... and {len(matching_commits) - 5} more commits{ANSI_RESET}")
            
    lines.append(f"{ANSI_BOLD}{ANSI_CYAN}════════════════════════════════════════════════════════════════════════════════{ANSI_RESET}\n")
    return "\n".join(lines)


def is_git_filter_repo_available() -> bool:
    """Checks whether git-filter-repo is installed on the system."""
    try:
        res = subprocess.run(
            ["git-filter-repo", "--version"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return res.returncode == 0
    except Exception:
        try:
            res = subprocess.run(
                [sys.executable, "-m", "git_filter_repo", "--version"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            return res.returncode == 0
        except Exception:
            return False


def _rewrite_with_fast_stream(
    abs_repo: str,
    old_emails: List[str],
    new_email: str,
    new_name: Optional[str] = None
) -> bool:
    """
    High-speed, zero-dependency stream rewrite using Git's fast-export and fast-import.
    Works natively across Windows, Linux, and macOS without requiring external bash shells.
    """
    # Detect current branch
    branch_proc = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        cwd=abs_repo,
        stdout=subprocess.PIPE,
        text=True,
        check=True
    )
    current_branch = branch_proc.stdout.strip()
    
    # Export commits
    export_proc = subprocess.Popen(
        ["git", "fast-export", "--all"],
        cwd=abs_repo,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Import rewriter
    import_proc = subprocess.Popen(
        ["git", "fast-import", "--force"],
        cwd=abs_repo,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    old_emails_lower = [e.strip().lower() for e in old_emails]
    ident_regex = re.compile(r'^(author|committer)\s+(.*?)\s+<([^>]+)>\s+(.*)$')
    
    try:
        for line_bytes in export_proc.stdout:
            try:
                line_str = line_bytes.decode("utf-8", errors="replace")
            except Exception:
                import_proc.stdin.write(line_bytes)
                continue
                
            m = ident_regex.match(line_str.rstrip("\r\n"))
            if m:
                role, name, email, stamp = m.groups()
                if email.strip().lower() in old_emails_lower:
                    final_name = new_name if new_name else name
                    final_line = f"{role} {final_name} <{new_email}> {stamp}\n"
                    import_proc.stdin.write(final_line.encode("utf-8"))
                    continue
                    
            import_proc.stdin.write(line_bytes)
            
        export_proc.stdout.close()
        import_proc.stdin.close()
        import_proc.wait()
        export_proc.wait()
        
        if import_proc.returncode != 0:
            err = import_proc.stderr.read().decode("utf-8", errors="replace")
            print(f"{ANSI_RED}fast-import error: {err}{ANSI_RESET}")
            return False
            
        # Reset current branch to the rewritten commit tree
        if current_branch and current_branch != "HEAD":
            subprocess.run(
                ["git", "reset", "--hard", f"refs/heads/{current_branch}"],
                cwd=abs_repo,
                check=True,
                stdout=subprocess.DEVNULL
            )
            
        return True
    except Exception as e:
        print(f"{ANSI_RED}Stream rewrite failed: {e}{ANSI_RESET}")
        return False


def rewrite_history(
    repo_path: str,
    old_email: str,
    new_email: str,
    new_name: Optional[str] = None,
    dry_run: bool = False,
    force: bool = False
) -> bool:
    """
    Executes the commit rewrite using git-filter-repo or high-speed fast-stream engine.
    """
    abs_repo = os.path.abspath(repo_path)
    all_commits, matching_commits, author_counts = audit_repository(abs_repo, old_email)
    
    report = render_audit_report(abs_repo, old_email, new_email, new_name, all_commits, matching_commits, author_counts)
    print(report)
    
    if len(matching_commits) == 0:
        print(f"{ANSI_YELLOW}No commits matched '{old_email}'. Nothing to rewrite.{ANSI_RESET}")
        return True
        
    if dry_run:
        print(f"{ANSI_GREEN}Dry run completed. No Git history was modified.{ANSI_RESET}")
        return True
        
    # Check for uncommitted changes
    status_res = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=abs_repo,
        stdout=subprocess.PIPE,
        text=True
    )
    if status_res.stdout.strip() and not force:
        print(f"{ANSI_RED}Error: Working directory has uncommitted changes.{ANSI_RESET}")
        print("Please commit, stash, or pass --force before rewriting history.")
        return False
        
    # Safety confirmation prompt
    if not force:
        print(f"{ANSI_YELLOW}{ANSI_BOLD}⚠️  WARNING: Rewriting Git history modifies all downstream commit hashes!{ANSI_RESET}")
        print("Collaborators will need to re-clone or rebase their branches.")
        try:
            confirm = input(f"Are you sure you want to rewrite {len(matching_commits)} commits? [y/N]: ").strip().lower()
            if confirm not in ["y", "yes"]:
                print("Operation cancelled.")
                return False
        except (KeyboardInterrupt, EOFError):
            print("\nOperation cancelled.")
            return False

    old_emails_list = [e.strip() for e in old_email.split(",") if e.strip()]
    use_filter_repo = is_git_filter_repo_available()
    
    if use_filter_repo:
        print(f"{ANSI_CYAN}Using git-filter-repo for high-speed rewrite...{ANSI_RESET}")
        mailmap_lines = []
        for old_e in old_emails_list:
            if new_name:
                mailmap_lines.append(f"{new_name} <{new_email}> <{old_e}>\n")
                mailmap_lines.append(f"{new_name} <{new_email}> * <{old_e}>\n")
            else:
                mailmap_lines.append(f"<{new_email}> <{old_e}>\n")
                
        with tempfile.NamedTemporaryFile("w", delete=False, encoding="utf-8", suffix=".mailmap") as f:
            f.writelines(mailmap_lines)
            mailmap_path = f.name
            
        try:
            cmd = ["git-filter-repo", "--mailmap", mailmap_path, "--force"]
            subprocess.run(cmd, cwd=abs_repo, check=True)
            print(f"{ANSI_GREEN}✅ History rewrite complete via git-filter-repo!{ANSI_RESET}")
        finally:
            if os.path.exists(mailmap_path):
                os.remove(mailmap_path)
    else:
        print(f"{ANSI_CYAN}Rewriting commit history using native high-speed Git fast-stream engine...{ANSI_RESET}")
        success = _rewrite_with_fast_stream(abs_repo, old_emails_list, new_email, new_name)
        if not success:
            return False
        print(f"{ANSI_GREEN}✅ History rewrite complete!{ANSI_RESET}")

    print("\nNext steps:")
    print("  To update your GitHub remote repository with the rewritten history:")
    print("     git push origin --force --all")
    print("     git push origin --force --tags")
    return True
