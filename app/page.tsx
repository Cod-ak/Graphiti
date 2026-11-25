"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import Grid from "./components/Grid";
import Toolbar from "./components/Toolbar";
import ExportModal from "./components/ExportModal";

// Default Invader matrix preset pre-loaded for instant load
const INITIAL_INVADER = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
].map(row => row.map(cell => cell * 4));

export default function Home() {
  const [grid, setGrid] = useState<number[][]>(INITIAL_INVADER);
  const [mode, setMode] = useState<"text" | "preset" | "draw">("preset");
  
  // Text Mode State
  const [text, setText] = useState("HIRE ME");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [charSpacing, setCharSpacing] = useState(1);
  const [offsetWeeks, setOffsetWeeks] = useState(0);

  // Preset Mode State
  const [selectedPreset, setSelectedPreset] = useState("invader");
  const [presetsList, setPresetsList] = useState<string[]>([
    "invader",
    "cat",
    "heart",
    "wave",
    "checkers",
    "git",
    "skull",
    "stars",
  ]);

  // Draw Mode State
  const [activeTool, setActiveTool] = useState<"pencil" | "eraser">("pencil");
  const [activeLevel, setActiveLevel] = useState<number>(4);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Target Year
  const [targetYear, setTargetYear] = useState<number>(2024);

  // Export Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [powershellScript, setPowershellScript] = useState("");
  const [bashScript, setBashScript] = useState("");

  // Calculate stats
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

  // Load presets list on mount
  useEffect(() => {
    fetch("/api/presets")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.presets) {
          setPresetsList(data.presets.map((p: any) => p.name));
        }
      })
      .catch(() => {});
  }, []);

  // Update text banner on changes
  useEffect(() => {
    if (mode === "text") {
      const timer = setTimeout(() => {
        fetch("/api/render-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            align: textAlign,
            char_spacing: charSpacing,
            offset_weeks: offsetWeeks,
            level: 4,
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.grid) setGrid(data.grid);
          })
          .catch(() => {});
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [text, textAlign, charSpacing, offsetWeeks, mode]);

  // Handle Preset Selection
  const handleSelectPreset = (name: string) => {
    setSelectedPreset(name);
    fetch("/api/presets")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const found = data?.presets?.find((p: any) => p.name === name);
        if (found?.grid) setGrid(found.grid);
      })
      .catch(() => {});
  };

  // Drawing interactions
  const handleCellAction = (row: number, col: number) => {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = activeTool === "pencil" ? activeLevel : 0;
      return next;
    });
  };

  const handleClear = () => {
    setGrid(Array.from({ length: 7 }, () => Array(52).fill(0)));
  };

  const handleShift = (dir: "up" | "down" | "left" | "right") => {
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

  // Open Export Modal & Generate Scripts
  const handleOpenExport = async () => {
    setIsExportOpen(true);
    setExportLoading(true);

    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grid,
          year: targetYear,
          mode: "year",
          intensity: 1,
          repo_name: "my-github-art",
        }),
      });
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data?.powershell) {
        setPowershellScript(data.powershell);
        setBashScript(data.bash);
      }
    } catch (err) {
      console.error("Failed to generate script", err);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#f0f6fc]">
      {/* Top Navigation */}
      <Header
        activeCells={activeCells}
        totalCommits={totalCommits}
        year={targetYear}
        onOpenExport={handleOpenExport}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-6 flex flex-col">
        {/* Canvas Display */}
        <section className="flex flex-col items-center justify-center p-6 bg-[#010409] border border-[#30363d] rounded-2xl shadow-inner overflow-hidden">
          <div className="w-full flex justify-between items-center mb-4 text-xs font-mono text-[#8b949e]">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#39d353] animate-pulse" />
              LIVE CANVAS • 7 ROWS × 52 WEEKS
            </span>
            <span>Target: {targetYear}</span>
          </div>

          <Grid
            grid={grid}
            onCellClick={handleCellAction}
            onCellHover={handleCellAction}
            isMouseDown={isMouseDown}
            setIsMouseDown={setIsMouseDown}
          />
        </section>

        {/* Toolbar & Controls */}
        <Toolbar
          mode={mode}
          setMode={setMode}
          text={text}
          setText={setText}
          textAlign={textAlign}
          setTextAlign={setTextAlign}
          charSpacing={charSpacing}
          setCharSpacing={setCharSpacing}
          offsetWeeks={offsetWeeks}
          setOffsetWeeks={setOffsetWeeks}
          selectedPreset={selectedPreset}
          onSelectPreset={handleSelectPreset}
          presetsList={presetsList}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          activeLevel={activeLevel}
          setActiveLevel={setActiveLevel}
          onClear={handleClear}
          onShift={handleShift}
          targetYear={targetYear}
          setTargetYear={setTargetYear}
        />
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        targetYear={targetYear}
        totalCommits={totalCommits}
        activeDays={activeCells}
        powershellScript={powershellScript}
        bashScript={bashScript}
        loading={exportLoading}
      />
    </div>
  );
}
