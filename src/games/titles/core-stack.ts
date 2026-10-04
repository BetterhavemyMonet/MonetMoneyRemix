import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createLoop, fitCanvas } from "../engine";
import type { GameManifest, GameMountApi } from "../types";

export const manifest: GameManifest = {
  id: "tetris",
  title: "Tetris",
  slug: "tetris",
  description: "Stack smart and clear lines under pressure.",
  blurb: "Guideline tetris: 7-bag, hold, ghost, hard drop.",
  category: "Puzzle",
  thumbnail: "/games/tetris.webp",
  route: "/games/tetris",
  backendGameId: "tetris",
  status: "live",
  features: { leaderboard: true, challenges: true, tournaments: true, multiplayer: false, controller: true },
  controls: "A/D move · W rotate · S soft · Space hard · C hold",
  order: 9,
};

const SHAPES: number[][][] = [
  [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
];
const COLORS = ["#2ee9d0", "#f5b942", "#d946ef", "#34d399", "#fb7185", "#9ae7ff", "#8ba0b8"];
const COLS = 10;
const ROWS = 20;

function rotate(m: number[][]) {
  const n = m.length;
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  for (let y = 0; y < n; y += 1) for (let x = 0; x < n; x += 1) out[x][n - 1 - y] = m[y][x];
  return out;
}

export function mount({ canvas }: GameMountApi) {
  const W = 960;
  const H = 540;
  const ctx = fitCanvas(canvas, W, H);
  if (!ctx) return () => undefined;
  const input = createInput(canvas);
  const audio = createAudio();
  const cell = 24;
  const ox = 320;
  const oy = 30;
  const board: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  let bag: number[] = [];
  const next: number[] = [];
  const take = () => {
    if (bag.length === 0) bag = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
    return bag.pop()!;
  };
  while (next.length < 3) next.push(take());
  let kind = take();
  let shape = SHAPES[kind].map((r) => r.slice());
  let px = 3;
  let py = 0;
  let hold: number | null = null;
  let held = false;
  let fall = 0;
  let score = 0;
  let started = false;
  let ended = false;
  let das = 0;
  let lock = 0;
  let prevW = false;
  let prevSpace = false;
  let prevC = false;
  const start = performance.now();

  const collides = (s: number[][], x: number, y: number) => {
    for (let r = 0; r < s.length; r += 1)
      for (let c = 0; c < s[r].length; c += 1) {
        if (!s[r][c]) continue;
        const nx = x + c;
        const ny = y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    return false;
  };

  const spawn = (k: number) => {
    kind = k;
    shape = SHAPES[k].map((r) => r.slice());
    px = 3;
    py = 0;
    held = false;
    if (collides(shape, px, py)) {
      ended = true;
      ArcadeGame.finished({ score, won: score > 2000, duration: (performance.now() - start) / 1000 });
      audio.lose();
    }
  };

  const lockPiece = () => {
    for (let r = 0; r < shape.length; r += 1)
      for (let c = 0; c < shape[r].length; c += 1) {
        if (shape[r][c] && py + r >= 0) board[py + r][px + c] = kind + 1;
      }
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r -= 1) {
      if (board[r].every((v) => v)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(0));
        cleared += 1;
        r += 1;
      }
    }
    const table = [0, 100, 300, 500, 800];
    score += table[cleared] ?? 800;
    if (cleared) audio.coin();
    else audio.blip();
    ArcadeGame.updateScore(score);
    spawn(next.shift()!);
    next.push(take());
  };

  const ghostY = () => {
    let gy = py;
    while (!collides(shape, px, gy + 1)) gy += 1;
    return gy;
  };

  ArcadeGame.ready();
  const stop = createLoop((dt) => {
    const a = input.sample();
    if (!started) {
      if (a.jumpPressed || a.attackPressed) {
        started = true;
        audio.unlock();
        ArcadeGame.started();
      }
    }
    if (!started || ended) {
      draw();
      return;
    }
    if (a.moveX !== 0) {
      das -= dt;
      if (das <= 0) {
        const nx = px + Math.sign(a.moveX);
        if (!collides(shape, nx, py)) px = nx;
        das = 0.08;
      }
    } else das = 0;
    const wDown = input.has("KeyW") || input.has("ArrowUp");
    if (wDown && !prevW) {
      const rot = rotate(shape);
      if (!collides(rot, px, py)) shape = rot;
      else if (!collides(rot, px - 1, py)) {
        shape = rot;
        px -= 1;
      } else if (!collides(rot, px + 1, py)) {
        shape = rot;
        px += 1;
      }
    }
    prevW = wDown;
    const cDown = input.has("KeyC");
    if (cDown && !prevC && !held) {
      const prev = hold;
      hold = kind;
      held = true;
      spawn(prev ?? next.shift()!);
      if (prev == null) next.push(take());
    }
    prevC = cDown;
    const gravity = a.moveY > 0.3 ? 0.04 : 0.7;
    fall += dt;
    if (fall >= gravity) {
      fall = 0;
      if (!collides(shape, px, py + 1)) {
        py += 1;
        lock = 0;
        if (a.moveY > 0.3) score += 1;
      } else {
        lock += gravity;
        if (lock > 0.45) lockPiece();
      }
    }
    const space = input.has("Space");
    if (space && !prevSpace) {
      const gy = ghostY();
      score += (gy - py) * 2;
      py = gy;
      lockPiece();
    }
    prevSpace = space;
    draw();
  });

  function drawCell(x: number, y: number, color: string, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(ox + x * cell + 1, oy + y * cell + 1, cell - 2, cell - 2);
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(ox - 8, oy - 8, COLS * cell + 16, ROWS * cell + 16);
    for (let r = 0; r < ROWS; r += 1)
      for (let c = 0; c < COLS; c += 1) {
        if (board[r][c]) drawCell(c, r, COLORS[board[r][c] - 1]);
      }
    const gy = ghostY();
    for (let r = 0; r < shape.length; r += 1)
      for (let c = 0; c < shape[r].length; c += 1) {
        if (shape[r][c]) {
          drawCell(px + c, gy + r, COLORS[kind], 0.22);
          drawCell(px + c, py + r, COLORS[kind]);
        }
      }
    ctx.fillStyle = "#8ba0b8";
    ctx.font = "500 13px Sora, sans-serif";
    ctx.fillText("NEXT", 620, 48);
    next.forEach((k, i) => {
      const s = SHAPES[k];
      for (let r = 0; r < s.length; r += 1)
        for (let c = 0; c < s[r].length; c += 1) {
          if (s[r][c]) {
            ctx.fillStyle = COLORS[k];
            ctx.fillRect(620 + c * 16, 60 + i * 70 + r * 16, 14, 14);
          }
        }
    });
    ctx.fillStyle = "#e8f4ff";
    ctx.font = "600 18px Oxanium, sans-serif";
    ctx.fillText(`SCORE ${score}`, 24, 36);
    if (!started) overlay("CORE STACK", "A/D move · W rotate · Space hard drop · C hold");
    if (ended) overlay("REACTOR LOCK", `Score ${score}`);
  }

  function overlay(title: string, sub: string) {
    ctx.fillStyle = "rgba(5,7,13,0.6)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8f4ff";
    ctx.font = "700 42px Oxanium, sans-serif";
    ctx.fillText(title, W / 2, H / 2);
    ctx.fillStyle = "#8ba0b8";
    ctx.font = "500 16px Sora, sans-serif";
    ctx.fillText(sub, W / 2, H / 2 + 32);
    ctx.textAlign = "left";
  }

  return () => {
    stop();
    input.destroy();
  };
}
