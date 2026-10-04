import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createLoop, fitCanvas } from "../engine";
import { cover, defineGame } from "../kit";
import type { GameMountApi } from "../types";

export const manifest = defineGame(
  "pong",
  "Pong",
  "Classic paddle combat with arcade speed.",
  "Sports",
  "W/S or arrows to move the paddle",
  { thumbnail: "/games/pong.webp", order: 10 },
);

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
  let py = H / 2;
  let ay = H / 2;
  let bx = W / 2;
  let by = H / 2;
  let vx = 280;
  let vy = 160;
  let ps = 0;
  let as = 0;
  ArcadeGame.ready();

  const stop = createLoop((dt) => {
    t += dt;
    const a = input.sample();
    if (!started) {
      if (a.jumpPressed || a.attackPressed || a.moveY) {
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
    py += a.moveY * 420 * dt;
    py = Math.max(40, Math.min(H - 40, py));
    const target = by;
    ay += Math.sign(target - ay) * Math.min(Math.abs(target - ay), 280 * dt);
    bx += vx * dt;
    by += vy * dt;
    if (by < 12 || by > H - 12) {
      vy *= -1;
      audio.blip();
    }
    if (bx < 48 && Math.abs(by - py) < 48) {
      vx = Math.abs(vx) + 20;
      vy += (by - py) * 4;
      audio.hit();
    }
    if (bx > W - 48 && Math.abs(by - ay) < 48) {
      vx = -Math.abs(vx) - 20;
      vy += (by - ay) * 4;
      audio.hit();
    }
    if (bx < 0) {
      as += 1;
      bx = W / 2;
      by = H / 2;
      vx = 280;
      audio.lose();
    }
    if (bx > W) {
      ps += 1;
      ArcadeGame.updateScore(ps);
      bx = W / 2;
      by = H / 2;
      vx = -280;
      audio.coin();
    }
    if (ps >= 5 || as >= 5) {
      ended = true;
      if (ps > as) ArcadeGame.won({ score: ps, duration: t });
      else ArcadeGame.lost({ score: ps, duration: t });
    }
    draw();
  });

  function draw() {
    ctx.fillStyle = "#08020f";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    for (let y = 0; y < H; y += 22) ctx.fillRect(W / 2 - 2, y, 4, 12);
    ctx.fillStyle = "#00f0ff";
    ctx.fillRect(24, py - 40, 12, 80);
    ctx.fillStyle = "#ff4488";
    ctx.fillRect(W - 36, ay - 40, 12, 80);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(bx, by, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "700 36px Bangers, sans-serif";
    ctx.fillText(String(ps), W / 2 - 80, 50);
    ctx.fillText(String(as), W / 2 + 50, 50);
    if (!started) cover(ctx, W, H, "PONG", "W/S move · first to 5");
    if (ended) cover(ctx, W, H, ps > as ? "YOU WIN" : "CPU WINS", `${ps} - ${as}`);
  }

  return () => {
    stop();
    input.destroy();
  };
}
