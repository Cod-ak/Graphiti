"use client";

import React, { useState } from "react";

interface GridProps {
  grid: number[][];
  onCellClick: (row: number, col: number) => void;
  onCellHover: (row: number, col: number) => void;
  isMouseDown: boolean;
  setIsMouseDown: (down: boolean) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "", "Tue", "", "Thu", "", "Sat"];

const SHADE_CLASSES: Record<number, string> = {
  0: "bg-[#161b22] border-[rgba(255,255,255,0.05)]",
  1: "bg-[#0e4429] border-[rgba(255,255,255,0.1)]",
  2: "bg-[#006d32] border-[rgba(255,255,255,0.15)]",
  3: "bg-[#26a641] border-[rgba(255,255,255,0.2)]",
  4: "bg-[#39d353] border-[rgba(255,255,255,0.25)] shadow-[0_0_8px_rgba(57,211,83,0.3)]",
};

export default function Grid({
  grid,
  onCellClick,
  onCellHover,
  isMouseDown,
  setIsMouseDown,
}: GridProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const handleMouseEnter = (row: number, col: number) => {
    setHoveredCell({ row, col });
    if (isMouseDown) {
      onCellHover(row, col);
    }
  };

  const handleMouseDown = (row: number, col: number) => {
    setIsMouseDown(true);
    onCellClick(row, col);
  };

  return (
    <div
      className="inline-block p-4 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-x-auto max-w-full"
      onMouseLeave={() => {
        setIsMouseDown(false);
        setHoveredCell(null);
      }}
    >
      {/* Month Labels */}
      <div className="flex text-[11px] text-[#8b949e] mb-1 pl-8 font-mono">
        {MONTHS.map((m, idx) => (
          <span key={idx} className="w-[49px] text-left">
            {m}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        {/* Day of Week Labels */}
        <div className="flex flex-col justify-between text-[10px] text-[#8b949e] font-mono py-[2px] pr-1 w-6">
          {DAYS.map((d, idx) => (
            <span key={idx} className="h-[12px] leading-[12px]">
              {d}
            </span>
          ))}
        </div>

        {/* 7 x 52 Matrix Grid */}
        <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
          {Array.from({ length: 52 }).map((_, col) =>
            Array.from({ length: 7 }).map((_, row) => {
              const level = grid[row]?.[col] ?? 0;
              const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;
              return (
                <div
                  key={`${row}-${col}`}
                  onMouseDown={() => handleMouseDown(row, col)}
                  onMouseEnter={() => handleMouseEnter(row, col)}
                  className={`w-[12px] h-[12px] rounded-[2.5px] border cursor-pointer transition-all duration-75 select-none touch-none ${
                    SHADE_CLASSES[level]
                  } ${isHovered ? "scale-125 z-10 !border-white ring-2 ring-white/30" : ""}`}
                  title={`Week ${col + 1}, ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][row]} • Level ${level}`}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#30363d]/50 text-[11px] text-[#8b949e] font-mono">
        <div>
          {hoveredCell ? (
            <span>
              Week <strong className="text-white">{hoveredCell.col + 1}</strong>,{" "}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][hoveredCell.row]} • Shade Level:{" "}
              <strong className="text-[#39d353]">{grid[hoveredCell.row]?.[hoveredCell.col] ?? 0}</strong>
            </span>
          ) : (
            <span>Click or drag over grid to draw</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <div
              key={lvl}
              className={`w-[10px] h-[10px] rounded-[2px] border ${SHADE_CLASSES[lvl]}`}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
