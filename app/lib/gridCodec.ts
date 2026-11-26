// Compact URL-safe Run-Length Encoding for 7x52 GitHub Contribution Grid

export function encodeGridRLE(grid: number[][]): string {
  // Flatten column-major (col 0..51, row 0..6) or row-major (row 0..6, col 0..51)
  const flat: number[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 52; c++) {
      const val = grid[r]?.[c] ?? 0;
      flat.push(Math.max(0, Math.min(4, val)));
    }
  }

  let encoded = "";
  let i = 0;
  while (i < flat.length) {
    const val = flat[i];
    let count = 1;
    while (i + count < flat.length && flat[i + count] === val) {
      count++;
    }
    encoded += count > 1 ? `${val}x${count}-` : `${val}-`;
    i += count;
  }

  return encoded.slice(0, -1); // remove trailing '-'
}

export function decodeGridRLE(encoded: string): number[][] {
  const flat: number[] = [];
  const parts = encoded.split("-");

  for (const part of parts) {
    if (!part) continue;
    if (part.includes("x")) {
      const [vStr, cStr] = part.split("x");
      const val = Math.max(0, Math.min(4, parseInt(vStr, 10) || 0));
      const count = Math.max(0, Math.min(364, parseInt(cStr, 10) || 0));
      for (let k = 0; k < count; k++) {
        flat.push(val);
      }
    } else {
      const val = Math.max(0, Math.min(4, parseInt(part, 10) || 0));
      flat.push(val);
    }
  }

  const grid: number[][] = Array.from({ length: 7 }, () => Array(52).fill(0));
  for (let idx = 0; idx < Math.min(364, flat.length); idx++) {
    const r = Math.floor(idx / 52);
    const c = idx % 52;
    grid[r][c] = flat[idx];
  }
  return grid;
}

export function calculateCommitPlan(
  grid: number[][],
  year: number,
  speedMode: "fast" | "deep" = "fast"
): Array<{ date: string; count: number }> {
  const countsMap: Record<number, number> =
    speedMode === "fast"
      ? { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 }
      : { 0: 0, 1: 1, 2: 3, 3: 6, 4: 10 };

  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dayOfWeek = jan1.getUTCDay();
  const startDate = new Date(jan1);
  startDate.setUTCDate(jan1.getUTCDate() - dayOfWeek);

  const plan: Array<{ date: string; count: number }> = [];

  for (let col = 0; col < 52; col++) {
    for (let row = 0; row < 7; row++) {
      const level = grid[row]?.[col] ?? 0;
      const count = countsMap[level] || 0;
      if (count > 0) {
        const cellDate = new Date(startDate);
        cellDate.setUTCDate(startDate.getUTCDate() + col * 7 + row);
        const dateStr = cellDate.toISOString().split("T")[0];
        plan.push({ date: dateStr, count });
      }
    }
  }

  return plan;
}
