"use client";

import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Grid from "./components/Grid";
import Toolbar from "./components/Toolbar";
import ExportModal from "./components/ExportModal";
import { renderTextToMatrix } from "./lib/font";
import { getClientPresetMatrix } from "./lib/presets";

// Initial Space Invader preset
const INITIAL_GRID = getClientPresetMatrix("invader", 52);

export default function Home() {
  const [grid, setGrid] = useState<number[][]>(INITIAL_GRID);
  const [generatorMode, setGeneratorMode] = useState<"text" | "preset">("preset");

  // Text Mode State
  const [text, setText] = useState("HIRE ME");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [charSpacing, setCharSpacing] = useState(1);
  const [textLevel, setTextLevel] = useState<number>(4);

  // Preset Mode State
  const [selectedPreset, setSelectedPreset] = useState("invader");
  const presetsList = [
    "invader",
    "cat",
    "heart",
    "wave",
    "checkers",
    "git",
    "skull",
    "stars",
  ];

  // Draw Tools State
  const [activeTool, setActiveTool] = useState<"pencil" | "eraser" | "bucket">("pencil");
  const [activeLevel, setActiveLevel] = useState<number>(4);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Target Year
  const [targetYear, setTargetYear] = useState<number>(2026);

  // Export Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Undo / Redo History & Feedback Toast
  const [history, setHistory] = useState<number[][][]>([INITIAL_GRID]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 1800);
  };

  const pushGrid = (nextGrid: number[][]) => {
    const sliced = history.slice(0, historyIndex + 1);
    const updated = [...sliced, nextGrid].slice(-30);
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
    setGrid(nextGrid);
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const prevIdx = historyIndex - 1;
    setHistoryIndex(prevIdx);
    setGrid(history[prevIdx]);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIdx = historyIndex + 1;
    setHistoryIndex(nextIdx);
    setGrid(history[nextIdx]);
  };

  // Keyboard shortcuts for Undo (Ctrl+Z) / Redo (Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // Restore canvas and auto-open modal after GitHub OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1" || params.get("oauth_error") || params.get("oauth_setup")) {
      try {
        const saved = localStorage.getItem("graphiti_pending_art");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.grid)) {
            setGrid(parsed.grid);
            setHistory([parsed.grid]);
            setHistoryIndex(0);
          }
          if (typeof parsed.targetYear === "number") setTargetYear(parsed.targetYear);
          localStorage.removeItem("graphiti_pending_art");
        }
      } catch {}
      setIsExportOpen(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // Calculate live stats
  const activeCells = grid.reduce(
    (acc, row) => acc + row.filter((c) => c > 0).length,
    0
  );

  const totalCommits = grid.reduce((acc, row) => {
    return (
      acc +
      row.reduce((rAcc, cell) => {
        const counts: Record<number, number> = { 0: 0, 1: 1, 2: 3, 3: 6, 4: 10 };
        return rAcc + (counts[cell] || 0);
      }, 0)
    );
  }, 0);

  // 1. ACTION: Render Text onto Canvas
  const handleApplyText = () => {
    const rendered = renderTextToMatrix(
      text,
      52,
      charSpacing,
      textLevel,
      textAlign,
      0
    );
    pushGrid(rendered);
    showToast("✓ Text rendered onto canvas");
  };

  // 2. ACTION: Load Preset onto Canvas
  const handleApplyPreset = () => {
    const matrix = getClientPresetMatrix(selectedPreset, 52);
    pushGrid(matrix);
    showToast("✓ Preset loaded onto canvas");
  };

  // 3. Drawing & Editing Tools
  const floodFill = (startRow: number, startCol: number, newLevel: number) => {
    const targetLevel = grid[startRow][startCol];
    if (targetLevel === newLevel) return;

    const next = grid.map((r) => [...r]);
    const queue: [number, number][] = [[startRow, startCol]];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const [r, c] = queue.pop()!;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (r < 0 || r >= 7 || c < 0 || c >= 52) continue;
      if (next[r][c] !== targetLevel) continue;

      next[r][c] = newLevel;

      queue.push([r + 1, c]);
      queue.push([r - 1, c]);
      queue.push([r, c + 1]);
      queue.push([r, c - 1]);
    }

    pushGrid(next);
  };

  const handleCellClick = (row: number, col: number) => {
    if (activeTool === "bucket") {
      floodFill(row, col, activeLevel);
    } else {
      const next = grid.map((r) => [...r]);
      next[row][col] = activeTool === "pencil" ? activeLevel : 0;
      pushGrid(next);
    }
  };

  const handleCellHover = (row: number, col: number) => {
    if (activeTool === "bucket") return;
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = activeTool === "pencil" ? activeLevel : 0;
      setHistory((h) => {
        const copy = [...h];
        copy[historyIndex] = next;
        return copy;
      });
      return next;
    });
  };

  const handleClear = () => {
    pushGrid(Array.from({ length: 7 }, () => Array(52).fill(0)));
    showToast("Canvas cleared (Ctrl+Z to undo)");
  };

  const handleInvert = () => {
    const next = grid.map((row) =>
      row.map((cell) => (cell === 0 ? activeLevel || 4 : 0))
    );
    pushGrid(next);
  };

  const handleShift = (dir: "left" | "right" | "up" | "down") => {
    const next = Array.from({ length: 7 }, () => Array(52).fill(0));
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 52; c++) {
        let tr = r;
        let tc = c;
        if (dir === "up") tr = (r - 1 + 7) % 7;
        if (dir === "down") tr = (r + 1) % 7;
        if (dir === "left") tc = (c - 1 + 52) % 52;
        if (dir === "right") tc = (c + 1) % 52;
        next[tr][tc] = grid[r][c];
      }
    }
    pushGrid(next);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#f0f6fc]">
      {/* 1. Header with Stats & Export Action */}
      <Header
        activeCells={activeCells}
        totalCommits={totalCommits}
        year={targetYear}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* 2. Main Studio Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-6 flex flex-col">
        {/* UPPER SECTION: Live GitHub Graph Canvas */}
        <section
          key="graph-section"
          className="flex flex-col items-center justify-center p-6 bg-[#010409] border border-[#30363d] rounded-2xl shadow-inner overflow-hidden"
        >
          <div className="w-full flex justify-between items-center mb-4 text-xs font-mono text-[#8b949e]">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#39d353] animate-pulse" />
              LIVE CANVAS • 7 ROWS × 52 WEEKS
              {toastMsg && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-[#238636]/20 border border-[#238636]/40 text-[#39d353] text-[10px] font-semibold">
                  {toastMsg}
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span>Less</span>
              <div className="flex gap-1 items-center">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#161b22] border border-[#30363d]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0e4429]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#006d32]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#26a641]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#39d353]" />
              </div>
              <span>More</span>
            </div>
          </div>

          <Grid
            grid={grid}
            onCellClick={handleCellClick}
            onCellHover={handleCellHover}
            isMouseDown={isMouseDown}
            setIsMouseDown={setIsMouseDown}
          />

          <div className="w-full flex justify-between items-center mt-4 text-[11px] text-[#8b949e] font-mono">
            <span>Click or drag over grid to draw freely</span>
            <span>Aspect Ratio 7.4 : 1 • Sunday-aligned</span>
          </div>
        </section>

        {/* LOWER SECTION: Tools, Generators & Action Buttons */}
        <section key="toolbar-section">
          <Toolbar
            generatorMode={generatorMode}
            setGeneratorMode={setGeneratorMode}
            text={text}
            setText={setText}
            textAlign={textAlign}
            setTextAlign={setTextAlign}
            charSpacing={charSpacing}
            setCharSpacing={setCharSpacing}
            textLevel={textLevel}
            setTextLevel={setTextLevel}
            onApplyText={handleApplyText}
            selectedPreset={selectedPreset}
            setSelectedPreset={setSelectedPreset}
            presetsList={presetsList}
            onApplyPreset={handleApplyPreset}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            activeLevel={activeLevel}
            setActiveLevel={setActiveLevel}
            onClear={handleClear}
            onInvert={handleInvert}
            onShift={handleShift}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            targetYear={targetYear}
            setTargetYear={setTargetYear}
          />
        </section>
      </main>

      {/* Export / Deploy Modal (Option 1 + Option 2) */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        grid={grid}
        targetYear={targetYear}
        activeDays={activeCells}
      />
    </div>
  );
}
