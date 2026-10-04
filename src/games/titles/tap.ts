import { ArcadeGame } from "../bridge";
import { createAudio, createLoop, fitCanvas } from "../engine";
import { cover, defineGame } from "../kit";
import type { GameMountApi } from "../types";

export const manifest = defineGame(
  "tap",
  "Tap Frenzy",
  "Pure speed. Tap fast and beat the clock.",
  "Arcade",
  "Tap / click as fast as you can",
  { thumbnail: "/games/tap-frenzy.webp", order: 18 },
);

export function mount({ canvas }: GameMountApi) {
  const W = 960;
  const H = 540;
  const ctx = fitCanvas(canvas, W, H);
  if (!ctx) return () => undefined;
  const audio = createAudio();
  let started = false;
  let ended = false;
  let t = 0;
  let taps = 0;
  const LIMIT = 10;
  ArcadeGame.ready();

  const hit = () => {
    audio.unlock();
    if (!started) {
      started = true;
      ArcadeGame.started();
      return;
    }
    if (ended) return;
    taps += 1;
    audio.blip();
    ArcadeGame.updateScore(taps);
  };
  canvas.addEventListener("pointerdown", hit);

  const stop = createLoop((dt) => {
    if (started && !ended) {
      t += dt;
      if (t >= LIMIT) {
        ended = true;
        ArcadeGame.won({ score: taps, duration: t });
        audio.win();
      }
    }
    draw();
  });

  function draw() {
    ctx.fillStyle = "#1a0820";
    ctx.fillRect(0, 0, W, H);
    const pulse = started ? 1 + Math.sin(taps) * 0.04 : 1;
    ctx.fillStyle = "#ff4488";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 90 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "700 48px Bangers, sans-serif";
    ctx.fillText(String(taps), W / 2, H / 2 + 16);
    ctx.font = "600 14px Orbitron, sans-serif";
    ctx.fillStyle = "#b39bb0";
    ctx.fillText(started ? `${Math.max(0, LIMIT - t).toFixed(1)}s` : "TAP TO START", W / 2, H / 2 + 80);
    ctx.textAlign = "left";
    if (ended) cover(ctx, W, H, "TIME", `${taps} taps`);
  }

  return () => {
    stop();
    canvas.removeEventListener("pointerdown", hit);
  };
}
