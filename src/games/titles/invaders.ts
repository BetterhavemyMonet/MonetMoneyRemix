import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createLoop, fitCanvas } from "../engine";
import { cover, defineGame } from "../kit";
import type { GameMountApi } from "../types";

export const manifest = defineGame(
  "invaders",
  "Invaders",
  "Hold the line against the incoming swarm.",
  "Shooter",
  "A/D move · J / Space fire",
  { thumbnail: "/games/invaders.webp", order: 13 },
);

type Shot = { x: number; y: number; vy: number };

export function mount({ canvas }: GameMountApi) {
  const W = 960;
  const H = 540;
  const ctx = fitCanvas(canvas, W, H);
  if (!ctx) return () => undefined;
  const input = createInput(canvas);
  const audio = createAudio();
  let started = false;
  let ended = false;
  let t = 0;
  let score = 0;
  let x = W / 2;
  let cool = 0;
  let dir = 1;
  let rowY = 70;
  const shots: Shot[] = [];
  const grid: { alive: boolean }[] = Array.from({ length: 40 }, () => ({ alive: true }));
  ArcadeGame.ready();

  const stop = createLoop((dt) => {
    t += dt;
    const a = input.sample();
    if (!started) {
      if (a.jumpPressed || a.attackPressed) {
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
    x += a.moveX * 340 * dt;
    x = Math.max(24, Math.min(W - 24, x));
    cool = Math.max(0, cool - dt);
    if ((a.attack || a.jump) && cool <= 0) {
      shots.push({ x, y: H - 64, vy: -460 });
      cool = 0.28;
      audio.blip();
    }
    const left = 80;
    const top = rowY;
    const step = Math.sin(t * 0.6) * 80;
    if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) {
      dir *= Math.random() > 0.96 ? -1 : dir;
      rowY += 4;
    }
    for (const s of shots) s.y += s.vy * dt;
    for (let i = 0; i < 40; i += 1) {
      if (!grid[i].alive) continue;
      const c = i % 10;
      const r = Math.floor(i / 10);
      const ix = left + c * 72 + step;
      const iy = top + r * 40;
      for (const s of shots) {
        if (Math.abs(s.x - ix) < 18 && Math.abs(s.y - iy) < 14) {
          grid[i].alive = false;
          s.y = -20;
          score += 20;
          audio.hit();
          ArcadeGame.updateScore(score);
        }
      }
      if (iy > H - 90) {
        ended = true;
        ArcadeGame.lost({ score, duration: t });
      }
    }
    if (grid.every((g) => !g.alive)) {
      ended = true;
      ArcadeGame.won({ score, duration: t });
      audio.win();
    }
    draw();
  });

  function draw() {
    ctx.fillStyle = "#050308";
    ctx.fillRect(0, 0, W, H);
    const step = Math.sin(t * 0.6) * 80;
    for (let i = 0; i < 40; i += 1) {
      if (!grid[i].alive) continue;
      const c = i % 10;
      const r = Math.floor(i / 10);
      ctx.fillStyle = r < 1 ? "#ff4488" : r < 3 ? "#a855ff" : "#00f0ff";
      ctx.fillRect(80 + c * 72 + step - 14, rowY + r * 40 - 10, 28, 20);
    }
    ctx.fillStyle = "#00ffa3";
    ctx.fillRect(x - 16, H - 48, 32, 16);
    ctx.fillStyle = "#fff";
    for (const s of shots) ctx.fillRect(s.x - 2, s.y, 4, 12);
    ctx.font = "600 16px Orbitron, sans-serif";
    ctx.fillText(`SCORE ${score}`, 24, 32);
    if (!started) cover(ctx, W, H, "INVADERS", "A/D move · Space fire · hold the line");
    if (ended) cover(ctx, W, H, grid.some((g) => g.alive) ? "OVERRUN" : "SAVED", `Score ${score}`);
  }

  return () => {
    stop();
    input.destroy();
  };
}
