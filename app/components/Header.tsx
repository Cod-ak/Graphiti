"use client";

import React from "react";
import { Terminal, Github, Sparkles, Download } from "lucide-react";

interface HeaderProps {
  activeCells: number;
  totalCommits: number;
  year: number | null;
  onOpenExport: () => void;
}

export default function Header({
  activeCells,
  totalCommits,
  year,
  onOpenExport,
}: HeaderProps) {
  return (
    <header className="border-b border-[#30363d] bg-[#161b22]/70 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#238636] to-[#2ea043] flex items-center justify-center shadow-lg shadow-[#238636]/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Graphiti Studio
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 border border-[#238636]/40 text-[#39d353]">
              v1.0 (Option B)
            </span>
          </h1>
          <p className="text-xs text-[#8b949e]">
            Digital street art for your GitHub profile contribution graph
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Metrics */}
        <div className="hidden sm:flex items-center gap-3 text-xs font-mono bg-[#0d1117] px-3 py-1.5 rounded-lg border border-[#30363d]">
          <div className="flex items-center gap-1.5">
            <span className="text-[#8b949e]">Active Days:</span>
            <span className="font-semibold text-white">{activeCells}</span>
          </div>
          <span className="text-[#30363d]">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#8b949e]">Commits:</span>
            <span className="font-semibold text-[#39d353]">{totalCommits}</span>
          </div>
          {year && (
            <>
              <span className="text-[#30363d]">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#8b949e]">Target:</span>
                <span className="font-semibold text-[#58a6ff]">{year}</span>
              </div>
            </>
          )}
        </div>

        {/* Export / Deploy CTA */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-[#238636]/30 active:scale-95"
        >
          <Terminal className="w-4 h-4" />
          <span>Export & Run Script</span>
        </button>
      </div>
    </header>
  );
}
