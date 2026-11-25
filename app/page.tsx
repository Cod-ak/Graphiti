"use client";

import React, { useState } from "react";
import Header from "./components/Header";
import Grid from "./components/Grid";
import Toolbar from "./components/Toolbar";
import ExportModal from "./components/ExportModal";
import { renderTextToMatrix } from "./lib/font";
import { getClientPresetMatrix } from "./lib/presets";
import { generateClientScripts } from "./lib/scriptGenerator";

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
  const [exportLoading, setExportLoading] = useState(false);
  const [powershellScript, setPowershellScript] = useState("");
  const [bashScript, setBashScript] = useState("");

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
    setGrid(rendered);
  };

  // 2. ACTION: Load Preset onto Canvas
  const handleApplyPreset = () => {
    const matrix = getClientPresetMatrix(selectedPreset, 52);
    setGrid(matrix);
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

    setGrid(next);
  };

  const handleCellAction = (row: number, col: number) => {
    if (activeTool === "bucket") {
      const fillShade = activeLevel;
      floodFill(row, col, fillShade);
    } else {
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = activeTool === "pencil" ? activeLevel : 0;
        return next;
      });
    }
  };

  const handleClear = () => {
    setGrid(Array.from({ length: 7 }, () => Array(52).fill(0)));
  };

  const handleInvert = () => {
    setGrid((prev) =>
      prev.map((row) =>
        row.map((cell) => (cell === 0 ? (activeLevel || 4) : 0))
      )
    );
  };

  const handleShift = (dir: "left" | "right" | "up" | "down") => {
    setGrid((prev) => {
      const next = Array.from({ length: 7 }, () => Array(52).fill(0));
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 52; c++) {
          let tr = r;
          let tc = c;
          if (dir === "up") tr = (r - 1 + 7) % 7;
          if (dir === "down") tr = (r + 1) % 7;
          if (dir === "left") tc = (c - 1 + 52) % 52;
          if (dir === "right") tc = (c + 1) % 52;
          next[tr][tc] = prev[r][c];
        }
      }
      return next;
    });
  };

  // 4. Open Export Modal (Instant Client Generation)
  const handleOpenExport = () => {
    setIsExportOpen(true);
    setExportLoading(true);

    try {
      const { powershell, bash } = generateClientScripts(
        grid,
        targetYear,
        "my-github-art"
      );
      setPowershellScript(powershell);
      setBashScript(bash);
    } catch (err) {
      console.error("Failed to generate scripts", err);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#f0f6fc]">
      {/* 1. Header with Stats & Export Action */}
      <Header
        activeCells={activeCells}
        totalCommits={totalCommits}
        year={targetYear}
        onOpenExport={handleOpenExport}
      />

      {/* 2. Main Studio Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-6 flex flex-col">
        {/* UPPER SECTION: Tools, Generators & Action Buttons (TOP) */}
        <section>
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
            targetYear={targetYear}
            setTargetYear={setTargetYear}
          />
        </section>

        {/* LOWER SECTION: Live GitHub Graph Canvas (BOTTOM) */}
        <section className="flex flex-col items-center justify-center p-6 bg-[#010409] border border-[#30363d] rounded-2xl shadow-inner overflow-hidden">
          <div className="w-full flex justify-between items-center mb-4 text-xs font-mono text-[#8b949e]">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#39d353] animate-pulse" />
              LIVE CANVAS • 7 ROWS × 52 WEEKS
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

          {/* Interactive 7x52 Grid */}
          <Grid
            grid={grid}
            onCellClick={handleCellAction}
            onCellHover={handleCellAction}
            isMouseDown={isMouseDown}
            setIsMouseDown={setIsMouseDown}
          />

          <div className="w-full flex justify-between items-center mt-4 text-[11px] text-[#8b949e] font-mono">
            <span>Click or drag over grid to draw freely</span>
            <span>Aspect Ratio 7.4 : 1 • Sunday-aligned</span>
          </div>
        </section>
      </main>

      {/* Export Code Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        targetYear={targetYear}
        activeDays={activeCells}
        totalCommits={totalCommits}
        powershellScript={powershellScript}
        bashScript={bashScript}
        loading={exportLoading}
      />
    </div>
  );
}
