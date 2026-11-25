"use client";

import React from "react";
import {
  Type,
  Sparkles,
  Pencil,
  Eraser,
  Trash2,
  ArrowLeft,
  ArrowRight,
  PaintBucket,
  RefreshCw,
  Calendar,
  Check,
} from "lucide-react";

interface ToolbarProps {
  // Mode
  generatorMode: "text" | "preset";
  setGeneratorMode: (m: "text" | "preset") => void;

  // Text Mode
  text: string;
  setText: (t: string) => void;
  textAlign: "left" | "center" | "right";
  setTextAlign: (a: "left" | "center" | "right") => void;
  charSpacing: number;
  setCharSpacing: (s: number) => void;
  textLevel: number;
  setTextLevel: (lvl: number) => void;
  onApplyText: () => void;

  // Presets Mode
  selectedPreset: string;
  setSelectedPreset: (name: string) => void;
  presetsList: string[];
  onApplyPreset: () => void;

  // Draw Tools
  activeTool: "pencil" | "eraser" | "bucket";
  setActiveTool: (t: "pencil" | "eraser" | "bucket") => void;
  activeLevel: number;
  setActiveLevel: (lvl: number) => void;
  onClear: () => void;
  onInvert: () => void;
  onShift: (dir: "left" | "right" | "up" | "down") => void;

  // Target Calendar
  targetYear: number;
  setTargetYear: (y: number) => void;
}

const PRESET_LABELS: Record<string, { label: string; icon: string }> = {
  invader: { label: "Space Invader", icon: "👾" },
  cat: { label: "Pixel Cat", icon: "🐱" },
  heart: { label: "8-Bit Heart", icon: "❤️" },
  wave: { label: "Sine Wave", icon: "🌊" },
  checkers: { label: "Checkerboard", icon: "🏁" },
  git: { label: "Git Branch", icon: "🔀" },
  skull: { label: "Retro Skull", icon: "💀" },
  stars: { label: "Constellations", icon: "✨" },
};

const SHADE_BUTTONS = [
  { lvl: 0, bg: "bg-[#161b22] border-[#30363d]", label: "0: None" },
  { lvl: 1, bg: "bg-[#0e4429] border-[#0e4429]", label: "1: Light" },
  { lvl: 2, bg: "bg-[#006d32] border-[#006d32]", label: "2: Medium" },
  { lvl: 3, bg: "bg-[#26a641] border-[#26a641]", label: "3: Dark" },
  { lvl: 4, bg: "bg-[#39d353] border-[#39d353]", label: "4: Deepest" },
];

export default function Toolbar({
  generatorMode,
  setGeneratorMode,
  text,
  setText,
  textAlign,
  setTextAlign,
  charSpacing,
  setCharSpacing,
  textLevel,
  setTextLevel,
  onApplyText,
  selectedPreset,
  setSelectedPreset,
  presetsList,
  onApplyPreset,
  activeTool,
  setActiveTool,
  activeLevel,
  setActiveLevel,
  onClear,
  onInvert,
  onShift,
  targetYear,
  setTargetYear,
}: ToolbarProps) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-2xl space-y-5">
      {/* 1. PERMANENT CANVAS TOOLBAR (Always Visible at Top) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        {/* Draw Tools (Pencil, Eraser, Bucket) */}
        <div className="flex items-center gap-3">
          <div className="flex bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
            <button
              onClick={() => setActiveTool("pencil")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTool === "pencil"
                  ? "bg-[#21262d] text-white shadow-sm border border-[#30363d]"
                  : "text-[#8b949e] hover:text-white"
              }`}
              title="Pencil Brush"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Draw</span>
            </button>
            <button
              onClick={() => setActiveTool("eraser")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTool === "eraser"
                  ? "bg-[#21262d] text-white shadow-sm border border-[#30363d]"
                  : "text-[#8b949e] hover:text-white"
              }`}
              title="Eraser"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Erase</span>
            </button>
            <button
              onClick={() => setActiveTool("bucket")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTool === "bucket"
                  ? "bg-[#21262d] text-white shadow-sm border border-[#30363d]"
                  : "text-[#8b949e] hover:text-white"
              }`}
              title="Bucket Flood Fill"
            >
              <PaintBucket className="w-3.5 h-3.5" />
              <span>Fill</span>
            </button>
          </div>

          {/* Palette Shades 0 - 4 */}
          <div className="flex items-center gap-1.5 bg-[#0d1117] px-3 py-1.5 rounded-xl border border-[#30363d]">
            <span className="text-[11px] text-[#8b949e] font-mono mr-1">Shades:</span>
            {SHADE_BUTTONS.map(({ lvl, bg, label }) => (
              <button
                key={lvl}
                onClick={() => {
                  setActiveLevel(lvl);
                  if (lvl > 0 && activeTool === "eraser") setActiveTool("pencil");
                }}
                className={`w-5 h-5 rounded-[3px] border ${bg} transition-all ${
                  activeLevel === lvl && activeTool !== "eraser"
                    ? "ring-2 ring-white scale-110 shadow-md"
                    : "opacity-80 hover:opacity-100"
                }`}
                title={label}
              />
            ))}
          </div>
        </div>

        {/* Global Manipulators: Shift, Invert, Clear */}
        <div className="flex items-center gap-2">
          {/* Week Shift */}
          <div className="flex bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
            <button
              onClick={() => onShift("left")}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-lg transition-all"
              title="Shift Canvas Left by 1 Week"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>◄ Week</span>
            </button>
            <button
              onClick={() => onShift("right")}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-lg transition-all"
              title="Shift Canvas Right by 1 Week"
            >
              <span>Week ►</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Invert */}
          <button
            onClick={onInvert}
            className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-white bg-[#0d1117] hover:bg-[#21262d] px-3 py-2 rounded-xl border border-[#30363d] transition-all"
            title="Invert shaded and empty cells"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Invert</span>
          </button>

          {/* Clear */}
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-[#f85149] hover:bg-[#f85149]/15 px-3 py-2 rounded-xl border border-[#f85149]/30 transition-all"
            title="Clear all pixels"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* 2. GENERATOR DECK (Tab Switcher for Text vs Presets) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
            <button
              onClick={() => setGeneratorMode("text")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                generatorMode === "text"
                  ? "bg-[#238636] text-white shadow-md shadow-[#238636]/30"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Text Banner Generator</span>
            </button>
            <button
              onClick={() => setGeneratorMode("preset")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                generatorMode === "preset"
                  ? "bg-[#238636] text-white shadow-md shadow-[#238636]/30"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>8-Bit Pixel Presets</span>
            </button>
          </div>

          {/* Target Calendar Year */}
          <div className="flex items-center gap-2 bg-[#0d1117] px-3 py-1.5 rounded-xl border border-[#30363d]">
            <Calendar className="w-3.5 h-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e]">Target Year:</span>
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
              className="bg-transparent text-xs font-mono text-white focus:outline-none cursor-pointer"
            >
              {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                <option key={y} value={y} className="bg-[#161b22] text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Panel A: Text Banner Generator */}
        {generatorMode === "text" && (
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Text Input */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-xs font-medium text-[#8b949e]">
                  Banner Text (A-Z, 0-9, Symbols)
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. HIRE ME, 2026, CODE"
                  maxLength={14}
                  className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#238636] text-white px-3.5 py-2 rounded-lg text-sm font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-[#238636]"
                />
              </div>

              {/* Alignment */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-xs font-medium text-[#8b949e]">Alignment</label>
                <div className="flex bg-[#161b22] p-1 rounded-lg border border-[#30363d]">
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => setTextAlign(align)}
                      className={`flex-1 py-1 rounded text-xs font-medium capitalize transition-all ${
                        textAlign === align
                          ? "bg-[#21262d] text-white font-semibold"
                          : "text-[#8b949e] hover:text-white"
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              {/* Letter Spacing */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-[#8b949e]">Letter Spacing</label>
                <div className="flex items-center gap-2 bg-[#161b22] px-3 py-2 rounded-lg border border-[#30363d]">
                  <input
                    type="range"
                    min="0"
                    max="3"
                    value={charSpacing}
                    onChange={(e) => setCharSpacing(Number(e.target.value))}
                    className="w-full accent-[#238636] cursor-pointer"
                  />
                  <span className="text-xs font-mono text-white w-4">{charSpacing}</span>
                </div>
              </div>

              {/* Text Shade */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-[#8b949e]">Shade Level</label>
                <select
                  value={textLevel}
                  onChange={(e) => setTextLevel(Number(e.target.value))}
                  className="w-full bg-[#161b22] border border-[#30363d] text-white px-2.5 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-[#238636] cursor-pointer"
                >
                  <option value={4}>Level 4 (Deepest)</option>
                  <option value={3}>Level 3 (Dark)</option>
                  <option value={2}>Level 2 (Medium)</option>
                  <option value={1}>Level 1 (Light)</option>
                </select>
              </div>
            </div>

            {/* ACTION BUTTON: Render Text onto Canvas */}
            <div className="flex justify-end pt-2 border-t border-[#30363d]/50">
              <button
                onClick={onApplyText}
                className="flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-[#238636]/30 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Render Text onto Canvas</span>
              </button>
            </div>
          </div>
        )}

        {/* Panel B: 8-Bit Pixel Presets */}
        {generatorMode === "preset" && (
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {presetsList.map((p) => {
                const meta = PRESET_LABELS[p] || { label: p, icon: "🎨" };
                const isSelected = selectedPreset === p;
                return (
                  <button
                    key={p}
                    onClick={() => setSelectedPreset(p)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#238636]/20 border-[#238636] text-white shadow-md shadow-[#238636]/30 ring-1 ring-[#238636]"
                        : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#8b949e]/50"
                    }`}
                  >
                    <span className="text-xl">{meta.icon}</span>
                    <span className="font-semibold">{meta.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ACTION BUTTON: Load Preset onto Canvas */}
            <div className="flex items-center justify-between pt-2 border-t border-[#30363d]/50">
              <span className="text-xs text-[#8b949e] font-mono">
                Selected: <strong className="text-white">{PRESET_LABELS[selectedPreset]?.label || selectedPreset}</strong>
              </span>
              <button
                onClick={onApplyPreset}
                className="flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-[#238636]/30 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Load Preset onto Canvas</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
