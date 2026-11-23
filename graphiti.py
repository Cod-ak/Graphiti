#!/usr/bin/env python3
r"""
   ____                 _     _ _   _ 
  / ___|_ __ __ _ _ __ | |__ (_) |_(_)
 | |  _| '__/ _` | '_ \| '_ \| | __| |
 | |_| | | | (_| | |_) | | | | | |_| |
  \____|_|  \__,_| .__/|_| |_|_|\__|_|
                 |_|                  
  >> Digital street art for your GitHub graph.

Graphiti CLI - Complete toolkit for GitHub contribution graph art and commit history rewriting.
"""

import argparse
import datetime
import http.server
import os
import socket
import socketserver
import sys
import threading
import webbrowser

from graphiti_engine.art import (
    calculate_commit_plan,
    execute_commit_plan,
    get_start_date,
    load_pattern_file,
    render_terminal_preview,
)
from graphiti_engine.font import render_text_to_matrix
from graphiti_engine.merger import rewrite_history
from graphiti_engine.presets import get_preset_matrix, list_presets

ASCII_LOGO = r"""
   ____                 _     _ _   _ 
  / ___|_ __ __ _ _ __ | |__ (_) |_(_)
 | |  _| '__/ _` | '_ \| '_ \| | __| |
 | |_| | | | (_| | |_) | | | | | |_| |
  \____|_|  \__,_| .__/|_| |_|_|\__|_|
                 |_|                  
  >> Digital street art for your GitHub graph.
"""


def find_free_port(start_port: int = 8080) -> int:
    """Finds an open TCP port starting from `start_port`."""
    port = start_port
    while port < 65535:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                port += 1
    return start_port


def cmd_canvas(args: argparse.Namespace) -> None:
    """Launches the interactive Web Drawing Board in the browser."""
    web_dir = os.path.join(os.path.dirname(__file__), "graphiti_engine", "web")
    html_file = os.path.join(web_dir, "canvas.html")
    
    if not os.path.exists(html_file):
        print(f"Error: Web canvas file not found at {html_file}", file=sys.stderr)
        sys.exit(1)
        
    port = find_free_port(args.port if args.port else 8080)
    
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *h_args, **kwargs):
            super().__init__(*h_args, directory=web_dir, **kwargs)
            
        def log_message(self, fmt, *log_args):
            # Suppress default request logging to keep terminal tidy
            pass

    server = socketserver.TCPServer(("127.0.0.1", port), QuietHandler)
    url = f"http://127.0.0.1:{port}/canvas.html"
    
    print(ASCII_LOGO)
    print(f"🎨 Graphiti Web Canvas server running at: \033[1m\033[36m{url}\033[0m")
    print("Press Ctrl+C to stop the server.\n")
    
    if not args.no_browser:
        webbrowser.open(url)
        
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping canvas server. Happy tagging!")
        server.server_close()


def cmd_art(args: argparse.Namespace) -> None:
    """Generates backdated commits from text, presets, or pattern files."""
    # Determine grid source
    sources_count = sum(1 for x in [args.text, args.preset, args.pattern_file] if x is not None)
    if sources_count == 0:
        print("Error: Must provide one of --text, --preset, or --pattern-file.", file=sys.stderr)
        print("Example: python graphiti.py art --text 'HI' --dry-run")
        sys.exit(1)
    if sources_count > 1:
        print("Error: Specify only one of --text, --preset, or --pattern-file.", file=sys.stderr)
        sys.exit(1)

    title = "GRAPHITI CANVAS"
    
    if args.text:
        grid = render_text_to_matrix(
            text=args.text,
            total_cols=52,
            char_spacing=1,
            level=4,
            align=args.align,
            offset_weeks=args.offset_weeks
        )
        title = f"TEXT BANNER: \"{args.text}\""
    elif args.preset:
        try:
            grid = get_preset_matrix(args.preset, cols=52)
            title = f"PRESET: {args.preset.upper()}"
        except KeyError as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    elif args.pattern_file:
        try:
            grid = load_pattern_file(args.pattern_file)
            title = f"PATTERN FILE: {os.path.basename(args.pattern_file)}"
        except Exception as e:
            print(f"Error loading pattern file: {e}", file=sys.stderr)
            sys.exit(1)

    # Calculate calendar start date
    mode = "rolling" if args.mode == "rolling" else "year"
    target_year = args.year if args.year else (None if mode == "rolling" else datetime.date.today().year)
    start_sunday = get_start_date(year=target_year, mode=mode)
    
    # Render terminal preview
    preview = render_terminal_preview(
        grid=grid,
        start_sunday=start_sunday,
        title=f"{title} ({'Rolling 52 Weeks' if mode == 'rolling' else f'Year {target_year}'})",
        use_ascii=args.ascii
    )
    print(preview)

    # Calculate commit plan
    commit_plan = calculate_commit_plan(grid, start_sunday, intensity=args.intensity)
    
    # Execute or dry-run
    execute_commit_plan(
        repo_path=args.repo_path,
        commit_plan=commit_plan,
        dry_run=args.dry_run
    )


def cmd_merge(args: argparse.Namespace) -> None:
    """Rewrites commit author/committer history across repository."""
    rewrite_history(
        repo_path=args.repo_path,
        old_email=args.old_email,
        new_email=args.new_email,
        new_name=args.new_name,
        dry_run=args.dry_run,
        force=args.force
    )


def cmd_presets(args: argparse.Namespace) -> None:
    """Lists all available pixel art presets."""
    print(f"\n🎨 Available Graphiti Presets:\n")
    for name in list_presets():
        print(f"  • {name:<12} (Use: python graphiti.py art --preset {name})")
    print("\nTo preview any preset in terminal:")
    print("  python graphiti.py art --preset invader --dry-run\n")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="graphiti",
        description="Graphiti: Digital Street Art for your GitHub contribution graph.",
        epilog="Tag your GitHub calendar with pride. Use dedicated canvas repositories!"
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Subcommand: art
    art_parser = subparsers.add_parser("art", help="Draw text, presets, or patterns onto GitHub graph")
    art_parser.add_argument("--repo-path", default=".", help="Target Git repository path (default: current directory)")
    art_parser.add_argument("--year", type=int, default=None, help="Target calendar year (e.g. 2024)")
    art_parser.add_argument("--mode", choices=["year", "rolling"], default="year", help="Calendar mapping mode (default: year)")
    art_parser.add_argument("--text", type=str, default=None, help="Text string to render onto graph")
    art_parser.add_argument("--preset", type=str, default=None, help="Preset pattern name (e.g. invader, heart, wave, stars)")
    art_parser.add_argument("--pattern-file", type=str, default=None, help="Path to exported canvas JSON pattern file")
    art_parser.add_argument("--intensity", type=int, default=1, choices=[1, 2, 3, 4], help="Commit count multiplier (1-4)")
    art_parser.add_argument("--align", choices=["left", "center", "right"], default="center", help="Text alignment (default: center)")
    art_parser.add_argument("--offset-weeks", type=int, default=0, help="Horizontal shift in weeks (+/-)")
    art_parser.add_argument("--dry-run", action="store_true", help="Preview grid in terminal without creating commits")
    art_parser.add_argument("--ascii", action="store_true", help="Use plain ASCII characters instead of ANSI colors")

    # Subcommand: canvas
    canvas_parser = subparsers.add_parser("canvas", help="Launch interactive web drawing board in browser")
    canvas_parser.add_argument("--port", type=int, default=8080, help="Local HTTP server port (default: 8080)")
    canvas_parser.add_argument("--no-browser", action="store_true", help="Do not automatically launch web browser")

    # Subcommand: merge
    merge_parser = subparsers.add_parser("merge", help="Rewrite commit author/committer history across past commits")
    merge_parser.add_argument("--repo-path", default=".", help="Target Git repository path")
    merge_parser.add_argument("--old-email", required=True, help="Old email address to replace (can be comma-separated)")
    merge_parser.add_argument("--new-email", required=True, help="New email address to assign")
    merge_parser.add_argument("--new-name", type=str, default=None, help="New author/committer name to assign")
    merge_parser.add_argument("--dry-run", action="store_true", help="Audit commits and display report without modifying history")
    merge_parser.add_argument("-y", "--yes", "--force", dest="force", action="store_true", help="Skip confirmation prompt")

    # Subcommand: presets
    subparsers.add_parser("presets", help="List all available pixel art presets")

    return parser


def main() -> None:
    parser = build_parser()
    if len(sys.argv) == 1:
        print(ASCII_LOGO)
        parser.print_help()
        sys.exit(0)
        
    args = parser.parse_args()
    
    if args.command == "art":
        cmd_art(args)
    elif args.command == "canvas":
        cmd_canvas(args)
    elif args.command == "merge":
        cmd_merge(args)
    elif args.command == "presets":
        cmd_presets(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
