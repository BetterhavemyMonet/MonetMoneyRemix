import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createLoop, fitCanvas } from "../engine";
import { cover, defineGame } from "../kit";
import type { GameMountApi } from "../types";

export const manifest = defineGame(
  "pacman",
  "Rawr-man",
  "Chase the maze and hunt the high score.",
  "Arcade",
  "WASD / arrows to steer",
  { thumbnail: "/games/rawr-man.webp", order: 4 },
);

const MAP = [
  "###################",
  "#........#........#",
  "#.##.###.#.###.##.#",
  "#o...............o#",
  "#.##.#.#####.#.##.#",
  "#....#...#...#....#",
  "####.###.#.###.####",
  "####.#.......#.####",
  "####.#.## ##.#.####",
  "........#   #......",
  "####.#.#####.#.####",
  "####.#.......#.####",
  "####.#.#####.#.####",
  "#........#........#",
  "#.##.###.#.###.##.#",
  "#o..#......... #.o#",
  "###.#.#.#####.#.###",
  "#.....#...#...#...#",
  "#.#######.#.#####.#",
  "#.................#",
  "###################",
];

export function mount({ canvas }: GameMountApi) {
  const W = 960;
  const H = 540;
  const ctx = fitCanvas(canvas, W, H);
  if (!ctx) return () => undefined;
  const input = createInput(canvas);
  const audio = createAudio();
  const rows = MAP.length;
  const cols = MAP[0].length;
  const cell = Math.min((W - 40) / cols, (H - 60) / rows);
  const ox = (W - cols * cell) / 2;
  const oy = 50;
  let started = false;
  let ended = false;
  let t = 0;
  let score = 0;
  let px = 9;
  let py = 15;
  let dir = { x: 0, y: 0 };
  let next = { x: 0, y: 0 };
  const ghosts = [
    { x: 9, y: 9, vx: 1, vy: 0, color: "#ff4488" },
    { x: 8, y: 9, vx: -1, vy: 0, color: "#00f0ff" },
    { x: 10, y: 9, vx: 0, vy: -1, color: "#a855ff" },
  ];
  const dots = new Set<string>();
  for (let y = 0; y < rows; y += 1)
    for (let x = 0; x < cols; x += 1) if (MAP[y][x] === "." || MAP[y][x] === "o") dots.add(`${x},${y}`);
  ArcadeGame.ready();

  const wall = (x: number, y: number) => {
    const c = MAP[y]?.[x];
    return !c || c === "#";
  };

  const stop = createLoop((dt) => {
    t += dt;
    const a = input.sample();
    if (!started) {
      if (a.jumpPressed || a.attackPressed || a.moveX || a.moveY) {
        started = true;
        audio.unlock();
        ArcadeGame.started();
      }
      draw();
      return;
    }
    if (ended) {
      draw();
      return;
    }
    if (a.moveX < -0.3) next = { x: -1, y: 0 };
    if (a.moveX > 0.3) next = { x: 1, y: 0 };
    if (a.moveY < -0.3) next = { x: 0, y: -1 };
    if (a.moveY > 0.3) next = { x: 0, y: 1 };
    const step = t % 0.12 < dt;
    if (step) {
      if (!wall(px + next.x, py + next.y)) dir = { ...next };
      if (!wall(px + dir.x, py + dir.y)) {
        px += dir.x;
        py += dir.y;
        if (px < 0) px = cols - 1;
        if (px >= cols) px = 0;
      }
      const key = `${px},${py}`;
      if (dots.delete(key)) {
        score += MAP[py][px] === "o" ? 50 : 10;
        audio.coin();
        ArcadeGame.updateScore(score);
        if (dots.size === 0) {
          ended = true;
          ArcadeGame.won({ score, duration: t });
        }
      }
      for (const g of ghosts) {
        const opts = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ].filter((d) => !wall(g.x + d.x, g.y + d.y) && !(d.x === -g.vx && d.y === -g.vy));
        const pick = opts[Math.floor(Math.random() * Math.max(1, opts.length))] ?? { x: -g.vx, y: -g.vy };
        g.vx = pick.x;
        g.vy = pick.y;
        if (!wall(g.x + g.vx, g.y + g.vy)) {
          g.x += g.vx;
          g.y += g.vy;
        }
        if (g.x === px && g.y === py) {
          ended = true;
          audio.lose();
          ArcadeGame.lost({ score, duration: t });
        }
      }
    }
    draw();
  });

  function draw() {
    ctx.fillStyle = "#08020f";
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const sx = ox + x * cell;
        const sy = oy + y * cell;
        if (MAP[y][x] === "#") {
          ctx.fillStyle = "#2a1460";
          ctx.fillRect(sx, sy, cell - 1, cell - 1);
        } else if (dots.has(`${x},${y}`)) {
          ctx.fillStyle = "#ffd85a";
          ctx.beginPath();
          ctx.arc(sx + cell / 2, sy + cell / 2, MAP[y][x] === "o" ? 5 : 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.fillStyle = "#ffd85a";
    ctx.beginPath();
    ctx.arc(ox + (px + 0.5) * cell, oy + (py + 0.5) * cell, cell * 0.38, 0.4, Math.PI * 2 - 0.4);
    ctx.lineTo(ox + (px + 0.5) * cell, oy + (py + 0.5) * cell);
    ctx.fill();
    for (const g of ghosts) {
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(ox + (g.x + 0.5) * cell, oy + (g.y + 0.5) * cell, cell * 0.36, Math.PI, 0);
      ctx.fillRect(ox + g.x * cell + 2, oy + (g.y + 0.5) * cell, cell - 4, cell * 0.36);
    }
    ctx.fillStyle = "#fff";
    ctx.font = "600 16px Orbitron, sans-serif";
    ctx.fillText(`SCORE ${score}`, 24, 32);
    if (!started) cover(ctx, W, H, "RAWR-MAN", "WASD to chase the maze");
    if (ended) cover(ctx, W, H, dots.size ? "CAUGHT" : "CLEARED", `Score ${score}`);
  }

  return () => {
    stop();
    input.destroy();
  };
}
