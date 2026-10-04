import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createLoop, fitCanvas, roundRect } from "../engine";
import { cover, defineGame } from "../kit";
import type { GameMountApi } from "../types";

export const manifest = defineGame(
  "kong",
  "Token Kong",
  "Climb, dodge and chase the high score.",
  "Platformer",
  "A/D move · Space jump",
  { thumbnail: "/games/token-kong.webp", order: 19 },
);

type Barrel = { x: number; y: number; vx: number };

export function mount({ canvas }: GameMountApi) {
  const W = 960;
  const H = 540;
  const ctx = fitCanvas(canvas, W, H);
  if (!ctx) return () => undefined;
  const input = createInput(canvas);
  const audio = createAudio();
  let started = false;
  let ended = false;
  let won = false;
  let t = 0;
  let score = 0;
  let x = 60;
  let y = 500;
  let vy = 0;
  const floors = [500, 400, 300, 200, 100];
  const barrels: Barrel[] = [];
  ArcadeGame.ready();

  const floorAt = (py: number) => floors.find((f) => Math.abs(py - f) < 12);

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
    x += a.moveX * 200 * dt;
    x = Math.max(20, Math.min(W - 20, x));
    const f = floorAt(y);
    if (f && vy >= 0) {
      y = f;
      vy = 0;
      if (a.jumpPressed) {
        vy = -420;
        audio.jump();
      }
    } else vy += 1100 * dt;
    y += vy * dt;
    if (Math.random() < dt * 0.7) barrels.push({ x: 80, y: 100, vx: 140 });
    for (const b of barrels) {
      b.x += b.vx * dt;
      const bf = floorAt(b.y);
      if (bf) {
        if (b.x > W - 40) {
          b.y += 100;
          b.vx *= -1;
        }
        if (b.x < 40) {
          b.y += 100;
          b.vx *= -1;
        }
      }
      if (Math.hypot(b.x - x, b.y - y) < 24) {
        ended = true;
        audio.lose();
        ArcadeGame.lost({ score, duration: t });
      }
    }
    score = Math.max(score, Math.floor((500 - y) * 2 + t * 8));
    ArcadeGame.updateScore(score);
    if (y <= 100 && x < 140) {
      ended = true;
      won = true;
      score += 1000;
      ArcadeGame.updateScore(score);
      ArcadeGame.won({ score, duration: t });
      audio.win();
    }
    draw();
  });

  function draw() {
    ctx.fillStyle = "#140810";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ff664d";
    for (const f of floors) ctx.fillRect(40, f, W - 80, 8);
    ctx.fillStyle = "#a855ff";
    roundRect(ctx, 50, 40, 70, 60, 8);
    ctx.fill();
    ctx.fillStyle = "#ffd85a";
    for (const b of barrels) {
      ctx.beginPath();
      ctx.arc(b.x, b.y - 10, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#00f0ff";
    roundRect(ctx, x - 12, y - 36, 24, 36, 4);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "600 16px Orbitron, sans-serif";
    ctx.fillText(`SCORE ${score}`, 24, 28);
    if (!started) cover(ctx, W, H, "TOKEN KONG", "Climb the girders · dodge barrels");
    if (ended) cover(ctx, W, H, won ? "RESCUED" : "BARRELED", `Score ${score}`);
  }

  return () => {
    stop();
    input.destroy();
  };
}
