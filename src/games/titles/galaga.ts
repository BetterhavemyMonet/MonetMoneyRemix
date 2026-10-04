import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createLoop, fitCanvas } from "../engine";
import { cover, defineGame } from "../kit";
import type { GameMountApi } from "../types";

export const manifest = defineGame(
  "galaga",
  "Galaga",
  "Defend the grid from waves of attackers.",
  "Shooter",
  "A/D move · J / Space fire",
  { thumbnail: "/games/galaga.webp", order: 12 },
);

type Shot = { x: number; y: number; vy: number };
type Bug = { x: number; y: number; alive: boolean };

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
  const shots: Shot[] = [];
  const bugs: Bug[] = [];
  for (let r = 0; r < 4; r += 1) for (let c = 0; c < 10; c += 1) bugs.push({ x: 160 + c * 64, y: 70 + r * 42, alive: true });
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
    x += a.moveX * 360 * dt;
    x = Math.max(30, Math.min(W - 30, x));
    cool = Math.max(0, cool - dt);
    if ((a.attack || a.jump) && cool <= 0) {
      shots.push({ x, y: H - 70, vy: -420 });
      cool = 0.22;
      audio.blip();
    }
    for (const s of shots) s.y += s.vy * dt;
    const swing = Math.sin(t * 1.4) * 40;
    for (const b of bugs) {
      if (!b.alive) continue;
      b.x += Math.sin(t + b.y) * 10 * dt;
      for (const s of shots) {
        if (Math.hypot(s.x - (b.x + swing), s.y - b.y) < 16) {
          b.alive = false;
          s.y = -99;
          score += 100;
          audio.hit();
          ArcadeGame.updateScore(score);
        }
      }
    }
    if (bugs.every((b) => !b.alive)) {
      ended = true;
      ArcadeGame.won({ score, duration: t });
      audio.win();
    }
    if (t > 90) {
      ended = true;
      ArcadeGame.lost({ score, duration: t });
    }
    draw();
  });

  function draw() {
    ctx.fillStyle = "#050318";
    ctx.fillRect(0, 0, W, H);
    const swing = Math.sin(t * 1.4) * 40;
    for (const b of bugs) {
      if (!b.alive) continue;
      ctx.fillStyle = "#ff4488";
      ctx.beginPath();
      ctx.arc(b.x + swing, b.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#00f0ff";
    ctx.fillRect(x - 14, H - 54, 28, 18);
    ctx.fillStyle = "#fff";
    for (const s of shots) ctx.fillRect(s.x - 2, s.y, 4, 10);
    ctx.font = "600 16px Orbitron, sans-serif";
    ctx.fillText(`SCORE ${score}`, 24, 32);
    if (!started) cover(ctx, W, H, "GALAGA", "A/D move · Space fire");
    if (ended) cover(ctx, W, H, bugs.some((b) => b.alive) ? "SWARM" : "GRID CLEAR", `Score ${score}`);
  }

  return () => {
    stop();
    input.destroy();
  };
}
