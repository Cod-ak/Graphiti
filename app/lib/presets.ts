// Client-side 8-Bit Pixel Art Presets for Graphiti
function createEmptyGrid(rows: number = 7, cols: number = 52): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function stampMatrix(
  dest: number[][],
  stamp: number[][],
  startRow: number = 0,
  startCol: number = 0
): void {
  for (let r = 0; r < stamp.length; r++) {
    for (let c = 0; c < stamp[r].length; c++) {
      const tr = startRow + r;
      const tc = startCol + c;
      if (tr >= 0 && tr < dest.length && tc >= 0 && tc < dest[0].length) {
        dest[tr][tc] = stamp[r][c];
      }
    }
  }
}

export function presetHeart(cols: number = 52): number[][] {
  const grid = createEmptyGrid(7, cols);
  const heartStamp = [
    [0, 2, 3, 0, 0, 0, 3, 2, 0],
    [3, 4, 4, 3, 0, 3, 4, 4, 3],
    [4, 4, 4, 4, 3, 4, 4, 4, 4],
    [4, 4, 4, 4, 4, 4, 4, 4, 4],
    [0, 4, 4, 4, 4, 4, 4, 4, 0],
    [0, 0, 3, 4, 4, 4, 3, 0, 0],
    [0, 0, 0, 2, 4, 2, 0, 0, 0],
  ];

  if (cols >= 25) {
    const start1 = Math.floor(cols / 2) - 12;
    const start2 = Math.floor(cols / 2) + 3;
    stampMatrix(grid, heartStamp, 0, start1);
    stampMatrix(grid, heartStamp, 0, start2);
  } else {
    const start = Math.max(0, Math.floor((cols - 9) / 2));
    stampMatrix(grid, heartStamp, 0, start);
  }
  return grid;
}

export function presetInvader(cols: number = 52): number[][] {
  const grid = createEmptyGrid(7, cols);
  const invader = [
    [0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0],
    [0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0],
    [0, 0, 4, 4, 4, 4, 4, 4, 4, 0, 0],
    [0, 4, 4, 1, 4, 4, 4, 1, 4, 4, 0],
    [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    [4, 0, 4, 0, 0, 0, 0, 0, 4, 0, 4],
    [0, 0, 0, 4, 4, 0, 4, 4, 0, 0, 0],
  ];
  const spacing = 15;
  for (let startC = 2; startC < cols - 11; startC += spacing) {
    stampMatrix(grid, invader, 0, startC);
  }
  return grid;
}

export function presetWave(cols: number = 52): number[][] {
  const grid = createEmptyGrid(7, cols);
  for (let c = 0; c < cols; c++) {
    const angle = (c / cols) * (4 * Math.PI);
    const normalizedSine = (Math.sin(angle) + 1.0) / 2.0;
    const peakRow = Math.floor(normalizedSine * 6.99);

    for (let r = 0; r < 7; r++) {
      const dist = Math.abs(r - peakRow);
      if (dist === 0) grid[r][c] = 4;
      else if (dist === 1) grid[r][c] = 3;
      else if (dist === 2) grid[r][c] = 2;
      else if (dist === 3) grid[r][c] = 1;
    }
  }
  return grid;
}

export function presetCheckers(cols: number = 52): number[][] {
  const grid = createEmptyGrid(7, cols);
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) {
        grid[r][c] = ((Math.floor(r / 2) + Math.floor(c / 2)) % 2 === 0) ? 4 : 2;
      } else {
        grid[r][c] = 0;
      }
    }
  }
  return grid;
}

export function presetStars(cols: number = 52): number[][] {
  const grid = createEmptyGrid(7, cols);
  const star5 = [
    [0, 0, 4, 0, 0],
    [0, 2, 4, 2, 0],
    [4, 4, 4, 4, 4],
    [0, 2, 4, 2, 0],
    [0, 0, 4, 0, 0],
  ];
  const star3 = [
    [0, 3, 0],
    [3, 4, 3],
    [0, 3, 0],
  ];
  stampMatrix(grid, star5, 1, 4);
  stampMatrix(grid, star3, 0, 15);
  stampMatrix(grid, star5, 1, 23);
  stampMatrix(grid, star3, 3, 34);
  stampMatrix(grid, star5, 1, 42);
  return grid;
}

export function presetCat(cols: number = 52): number[][] {
  const grid = createEmptyGrid(7, cols);
  const cat = [
    [0, 4, 0, 0, 4, 0, 0, 0, 0, 0],
    [4, 4, 4, 4, 4, 0, 0, 0, 0, 4],
    [4, 1, 4, 1, 4, 0, 0, 0, 4, 0],
    [4, 4, 4, 4, 4, 4, 4, 4, 4, 0],
    [0, 4, 4, 4, 4, 4, 4, 4, 0, 0],
    [0, 4, 4, 4, 4, 4, 4, 4, 0, 0],
    [0, 4, 0, 4, 0, 0, 4, 0, 4, 0],
  ];
  const startC = Math.max(0, Math.floor((cols - 10) / 2));
  stampMatrix(grid, cat, 0, startC);
  return grid;
}

export function presetSkull(cols: number = 52): number[][] {
  const grid = createEmptyGrid(7, cols);
  const skull = [
    [0, 0, 4, 4, 4, 4, 4, 0, 0],
    [0, 4, 4, 4, 4, 4, 4, 4, 0],
    [4, 4, 1, 4, 4, 4, 1, 4, 4],
    [4, 4, 1, 4, 4, 4, 1, 4, 4],
    [0, 4, 4, 4, 4, 4, 4, 4, 0],
    [0, 0, 4, 1, 4, 1, 4, 0, 0],
    [0, 0, 4, 1, 4, 1, 4, 0, 0],
  ];
  const startC = Math.max(0, Math.floor((cols - 9) / 2));
  stampMatrix(grid, skull, 0, startC);
  return grid;
}

export function presetGit(cols: number = 52): number[][] {
  const grid = createEmptyGrid(7, cols);
  for (let c = 0; c < cols; c++) {
    grid[5][c] = 2;
  }
  for (let c = 8; c < 22; c++) {
    grid[2][c] = 3;
  }
  grid[4][7] = 4;
  grid[3][8] = 4;
  grid[3][21] = 4;
  grid[4][22] = 4;
  grid[5][7] = 4;
  grid[5][22] = 4;

  for (let c = 28; c < 44; c++) {
    grid[1][c] = 4;
  }
  grid[4][27] = 3;
  grid[3][28] = 3;
  grid[2][29] = 3;
  grid[2][43] = 3;
  grid[3][44] = 3;
  grid[4][45] = 3;
  grid[5][27] = 4;
  grid[5][45] = 4;
  return grid;
}

export const PRESET_GENERATORS: Record<string, (cols?: number) => number[][]> = {
  heart: presetHeart,
  invader: presetInvader,
  wave: presetWave,
  checkers: presetCheckers,
  stars: presetStars,
  cat: presetCat,
  skull: presetSkull,
  git: presetGit,
};

export function getClientPresetMatrix(name: string, cols: number = 52): number[][] {
  const key = name.toLowerCase().trim();
  const fn = PRESET_GENERATORS[key] || PRESET_GENERATORS["invader"];
  return fn(cols);
}
