import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createLoop, fitCanvas } from "../engine";
import { cover, defineGame } from "../kit";
import type { GameMountApi } from "../types";

export const manifest = defineGame(
  "maker",
  "Monet Maker",
  "Design custom Monet Runner levels and challenge friends.",
  "Creator",
  "Click a slot to place obstacles · Space to test",
  {
    thumbnail: "/games/monet-maker.webp",
    order: 3,
    features: { leaderboard: true, challenges: true, tournaments: false, multiplayer: false, controller: false },
  },
);

export function mount({ canvas }: GameMountApi) {
  const W = 960;
  const H = 540;
  const ctx = fitCanvas(canvas, W, H);
  if (!ctx) return () => undefined;
  const input = createInput(canvas);
  const audio = createAudio();
  const slots = Array.from({ length: 16 }, () => 0);
  let mode: "edit" | "play" | "over" = "edit";
  let t = 0;
  let score = 0;
  let x = 80;
  let y = 0;
  let vy = 0;
  const ground = 400;
  ArcadeGame.ready();
  ArcadeGame.started();

  const click = (e: PointerEvent) => {
    if (mode !== "edit") return;
    const r = canvas.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    if (py < 120 || py > 460) return;
    const i = Math.min(15, Math.max(0, Math.floor(((px - 40) / (W - 80)) * 16)));
    slots[i] = (slots[i] + 1) % 3;
    audio.blip();
  };
  canvas.addEventListener("pointerdown", click);

  const stop = createLoop((dt) => {
    t += dt;
    const a = input.sample();
    if (mode === "edit") {
      if (a.jumpPressed) {
        mode = "play";
        x = 80;
        y = 0;
        vy = 0;
        score = 0;
        t = 0;
        audio.unlock();
      }
      draw();
      return;
    }
    if (mode === "over") {
      if (a.jumpPressed) mode = "edit";
      draw();
      return;
    }
    if (y <= 0 && a.jumpPressed) {
      vy = 520;
      audio.jump();
    }
    vy -= 1600 * dt;
    y = Math.max(0, y + vy * dt);
    if (y === 0) vy = 0;
    x += 220 * dt;
    const i = Math.floor(((x - 40) / (W - 80)) * 16);
    if (i >= 0 && i < 16 && slots[i]) {
      const bird = slots[i] === 2;
      const oh = bird ? 24 : 48;
      const oy = bird ? 70 : 0;
      const dinoH = 48;
      const py = ground - dinoH - y;
      const ox = 40 + (i + 0.3) * ((W - 80) / 16);
      const oyy = ground - oh - oy;
      if (x < ox + 28 && x + 36 > ox && py < oyy + oh && py + dinoH > oyy) {
        mode = "over";
        audio.lose();
        ArcadeGame.lost({ score, duration: t });
      }
    }
    score = Math.floor(x);
    ArcadeGame.updateScore(score);
    if (x > W - 60) {
      mode = "over";
      score += 500;
      ArcadeGame.updateScore(score);
      ArcadeGame.won({ score, duration: t });
      audio.win();
    }
    draw();
  });

  function draw() {
    ctx.fillStyle = "#12295a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#00ffa3";
    ctx.fillRect(40, ground, W - 80, 3);
    const slotW = (W - 80) / 16;
    for (let i = 0; i < 16; i += 1) {
      const sx = 40 + i * slotW;
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.strokeRect(sx, 140, slotW - 4, ground - 140);
      if (slots[i] === 1) {
        ctx.fillStyle = "#00c878";
        ctx.fillRect(sx + 8, ground - 48, 18, 48);
      }
      if (slots[i] === 2) {
        ctx.fillStyle = "#ff4488";
        ctx.fillRect(sx + 6, ground - 94, 24, 18);
      }
    }
    if (mode !== "edit") {
      ctx.fillStyle = "#7CFF5A";
      ctx.fillRect(x, ground - 48 - y, 36, 48);
    }
    ctx.fillStyle = "#fff5fb";
    ctx.font = "600 16px Orbitron, sans-serif";
    ctx.fillText(mode === "edit" ? "CLICK SLOTS · SPACE TO TEST" : `SCORE ${score}`, 24, 32);
    if (mode === "over") cover(ctx, W, H, "LEVEL DONE", "Space to edit again");
  }

  return () => {
    stop();
    input.destroy();
    canvas.removeEventListener("pointerdown", click);
  };
}
