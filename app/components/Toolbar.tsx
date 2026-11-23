"use client";

import React, { useState } from "react";
import {
  Type,
  Sparkles,
  Pencil,
  Eraser,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Calendar,
  Layers,
} from "lucide-react";

interface ToolbarProps {
  mode: "text" | "preset" | "draw";
  setMode: (m: "text" | "preset" | "draw") => void;
  // Text Mode
  text: string;
  setText: (t: string) => void;
  textAlign: "left" | "center" | "right";
  setTextAlign: (a: "left" | "center" | "right") => void;
  charSpacing: number;
  setCharSpacing: (s: number) => void;
  offsetWeeks: number;
  setOffsetWeeks: (o: number) => void;
  // Presets
  selectedPreset: string;
  onSelectPreset: (name: string) => void;
  presetsList: string[];
  // Draw Mode
  activeTool: "pencil" | "eraser";
  setActiveTool: (t: "pencil" | "eraser") => void;
  activeLevel: number;
  setActiveLevel: (lvl: number) => void;
  onClear: () => void;
  onShift: (dir: "up" | "down" | "left" | "right") => void;
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

export default function Toolbar({
  mode,
  setMode,
  text,
  setText,
  textAlign,
  setTextAlign,
  charSpacing,
  setCharSpacing,
  offsetWeeks,
  setOffsetWeeks,
  selectedPreset,
  onSelectPreset,
  presetsList,
  activeTool,
  setActiveTool,
  activeLevel,
  setActiveLevel,
  onClear,
  onShift,
  targetYear,
  setTargetYear,
}: ToolbarProps) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-xl space-y-4">
      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-[#30363d] pb-3 gap-2">
        <button
          onClick={() => setMode("text")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === "text"
              ? "bg-[#21262d] text-[#58a6ff] border border-[#30363d]"
              : "text-[#8b949e] hover:text-white hover:bg-[#21262d]/50"
          }`}
        >
          <Type className="w-4 h-4" />
          Text Banner
        </button>

        <button
          onClick={() => setMode("preset")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === "preset"
              ? "bg-[#21262d] text-[#58a6ff] border border-[#30363d]"
              : "text-[#8b949e] hover:text-white hover:bg-[#21262d]/50"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          8-Bit Presets
        </button>

        <button
          onClick={() => setMode("draw")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === "draw"
              ? "bg-[#21262d] text-[#58a6ff] border border-[#30363d]"
              : "text-[#8b949e] hover:text-white hover:bg-[#21262d]/50"
          }`}
        >
          <Pencil className="w-4 h-4" />
          Freehand Draw
        </button>
      </div>

      {/* Sub-Panel: TEXT MODE */}
      {mode === "text" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-[#8b949e]">Banner Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. HIRE ME, 2025, CODE"
              maxLength={12}
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] text-white px-3 py-1.5 rounded-lg text-sm font-mono tracking-wider focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8b949e]">Alignment</label>
            <div className="flex bg-[#0d1117] p-1 rounded-lg border border-[#30363d]">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => setTextAlign(align)}
                  className={`flex-1 py-1 rounded text-xs font-medium capitalize ${
                    textAlign === align ? "bg-[#21262d] text-white" : "text-[#8b949e]"
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8b949e]">Letter Spacing</label>
            <div className="flex items-center gap-2 bg-[#0d1117] px-3 py-1.5 rounded-lg border border-[#30363d]">
              <input
                type="range"
                min="0"
                max="3"
                value={charSpacing}
                onChange={(e) => setCharSpacing(Number(e.target.value))}
                className="w-full accent-[#238636]"
              />
              <span className="text-xs font-mono text-white w-4">{charSpacing}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Panel: PRESETS MODE */}
      {mode === "preset" && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presetsList.map((p) => {
              const meta = PRESET_LABELS[p] || { label: p, icon: "🎨" };
              const isSelected = selectedPreset === p;
              return (
                <button
                  key={p}
                  onClick={() => onSelectPreset(p)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-[#238636]/20 border-[#238636] text-white shadow-sm shadow-[#238636]/30"
                      : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#8b949e]/50"
                  }`}
                >
                  <span className="text-base">{meta.icon}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Panel: DRAW MODE */}
      {mode === "draw" && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Tools & Levels */}
          <div className="flex items-center gap-3">
            <div className="flex bg-[#0d1117] p-1 rounded-lg border border-[#30363d]">
              <button
                onClick={() => setActiveTool("pencil")}
                className={`p-1.5 rounded ${
                  activeTool === "pencil" ? "bg-[#21262d] text-white" : "text-[#8b949e]"
                }`}
                title="Pencil Brush"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTool("eraser")}
                className={`p-1.5 rounded ${
                  activeTool === "eraser" ? "bg-[#21262d] text-white" : "text-[#8b949e]"
                }`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>

            {/* Brush Shading Selector */}
            {activeTool === "pencil" && (
              <div className="flex items-center gap-1.5 bg-[#0d1117] px-2.5 py-1.5 rounded-lg border border-[#30363d]">
                <span className="text-[11px] text-[#8b949e] mr-1">Shade:</span>
                {[
                  { lvl: 1, bg: "bg-[#0e4429]" },
                  { lvl: 2, bg: "bg-[#006d32]" },
                  { lvl: 3, bg: "bg-[#26a641]" },
                  { lvl: 4, bg: "bg-[#39d353]" },
                ].map(({ lvl, bg }) => (
                  <button
                    key={lvl}
                    onClick={() => setActiveLevel(lvl)}
                    className={`w-5 h-5 rounded-[3px] border ${bg} ${
                      activeLevel === lvl ? "ring-2 ring-white scale-110" : "opacity-80"
                    }`}
                    title={`Level ${lvl}`}
                  />
                ))}
              </div>
            )}

            <button
              onClick={onClear}
              className="flex items-center gap-1 text-xs text-[#f85149] hover:bg-[#f85149]/10 px-2.5 py-1.5 rounded-lg border border-[#f85149]/30 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>

          {/* Shift Controls */}
          <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#30363d]">
            <span className="text-[10px] text-[#8b949e] px-1 font-mono uppercase">Nudge:</span>
            <button
              onClick={() => onShift("left")}
              className="p-1 hover:bg-[#21262d] text-[#8b949e] hover:text-white rounded"
              title="Shift Left"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onShift("right")}
              className="p-1 hover:bg-[#21262d] text-[#8b949e] hover:text-white rounded"
              title="Shift Right"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onShift("up")}
              className="p-1 hover:bg-[#21262d] text-[#8b949e] hover:text-white rounded"
              title="Shift Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onShift("down")}
              className="p-1 hover:bg-[#21262d] text-[#8b949e] hover:text-white rounded"
              title="Shift Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Target Year Configuration Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#30363d]/50 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#58a6ff]" />
          <span className="text-[#8b949e]">Target Calendar Year:</span>
          <select
            value={targetYear}
            onChange={(e) => setTargetYear(Number(e.target.value))}
            className="bg-[#0d1117] border border-[#30363d] text-white px-2.5 py-1 rounded-md text-xs font-mono focus:outline-none focus:border-[#58a6ff]"
          >
            {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map((y) => (
              <option key={y} value={y}>
                {y} {y <= 2021 ? "(Clean Canvas Recommended)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-[#8b949e]">
          💡 Tip: Picking an older empty year keeps your real coding history clean and untouched.
        </div>
      </div>
    </div>
  );
}
