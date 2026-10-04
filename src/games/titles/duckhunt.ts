import { ArcadeGame } from "../bridge";
import { createAudio, createLoop, fitCanvas } from "../engine";
import { cover, defineGame } from "../kit";
import type { GameMountApi } from "../types";

export const manifest = defineGame(
  "duckhunt",
  "Duck Hunt",
  "Fast reactions. Clean shots. Big scores.",
  "Shooter",
  "Click / tap to shoot · 3 shots per wave",
  { thumbnail: "/games/duck-hunt.webp", order: 7 },
);

type Duck = { x: number; y: number; vx: number; vy: number; alive: boolean };

export function mount({ canvas }: GameMountApi) {
  const W = 960;
  const H = 540;
  const ctx = fitCanvas(canvas, W, H);
  if (!ctx) return () => undefined;
  const audio = createAudio();
  let started = false;
  let ended = false;
  let t = 0;
  let score = 0;
  let shots = 3;
  let wave = 1;
  const ducks: Duck[] = [];
  const spawn = () => {
    ducks.length = 0;
    shots = 3;
    for (let i = 0; i < wave; i += 1) {
      ducks.push({
        x: 80 + Math.random() * 200,
        y: 80 + Math.random() * 200,
        vx: 80 + Math.random() * 90,
        vy: (Math.random() * 2 - 1) * 50,
        alive: true,
      });
    }
  };
  spawn();
  ArcadeGame.ready();

  const shoot = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    if (!started) {
      started = true;
      audio.unlock();
      ArcadeGame.started();
      return;
    }
    if (ended || shots <= 0) return;
    shots -= 1;
    let hit = false;
    for (const d of ducks) {
      if (!d.alive) continue;
      if (Math.hypot(px - d.x, py - d.y) < 28) {
        d.alive = false;
        hit = true;
        score += 250;
        audio.hit();
        ArcadeGame.updateScore(score);
      }
    }
    if (!hit) audio.blip();
    if (!hit && shots === 0 && ducks.some((d) => d.alive)) {
      ended = true;
      audio.lose();
      ArcadeGame.lost({ score, duration: t });
    }
    if (ducks.every((d) => !d.alive)) {
      wave += 1;
      score += 400;
      ArcadeGame.updateScore(score);
      spawn();
    }
  };
  canvas.addEventListener("pointerdown", shoot);

  const stop = createLoop((dt) => {
    t += dt;
    if (started && !ended) {
      for (const d of ducks) {
        if (!d.alive) continue;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.y < 40 || d.y > 280) d.vy *= -1;
        if (d.x > W + 20) d.x = -20;
      }
    }
    draw();
  });

  function draw() {
    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#3a7";
    ctx.fillRect(0, 340, W, 200);
    ctx.fillStyle = "#163";
    ctx.fillRect(0, 400, W, 140);
    for (const d of ducks) {
      if (!d.alive) continue;
      ctx.fillStyle = "#c84";
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ea5";
      ctx.beginPath();
      ctx.arc(d.x + 18, d.y - 4, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#122";
    ctx.font = "600 16px Orbitron, sans-serif";
    ctx.fillText(`SCORE ${score}   SHOTS ${shots}   WAVE ${wave}`, 24, 32);
    if (!started) cover(ctx, W, H, "DUCK HUNT", "Tap the ducks · 3 shots a wave");
    if (ended) cover(ctx, W, H, "FLY AWAY", `Score ${score}`);
  }

  return () => {
    stop();
    canvas.removeEventListener("pointerdown", shoot);
  };
}
