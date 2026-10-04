import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createLoop, fitCanvas } from "../engine";
import { cover, defineGame } from "../kit";
import type { GameMountApi } from "../types";

export const manifest = defineGame(
  "dino",
  "Monet Runner",
  "Run, jump and survive the neon wilds.",
  "Platformer",
  "Space / tap to jump · S to duck",
  { thumbnail: "/games/monet-runner.webp", featured: true, order: 1 },
);

type Obs = { x: number; w: number; h: number; y: number; kind: "cactus" | "bird" };

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
  let speed = 380;
  let y = 0;
  let vy = 0;
  let duck = 0;
  let spawn = 0;
  const ground = 420;
  const obs: Obs[] = [];
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
    duck = a.moveY > 0.4 ? 1 : 0;
    if (y <= 0 && a.jumpPressed) {
      vy = 560;
      audio.jump();
    }
    vy -= 1600 * dt;
    y = Math.max(0, y + vy * dt);
    if (y === 0) vy = 0;
    speed += 8 * dt;
    spawn -= dt;
    if (spawn <= 0) {
      const bird = Math.random() > 0.72;
      obs.push({
        x: W + 40,
        w: bird ? 46 : 28 + Math.random() * 18,
        h: bird ? 24 : 40 + Math.random() * 36,
        y: bird ? 70 : 0,
        kind: bird ? "bird" : "cactus",
      });
      spawn = 0.9 + Math.random() * 0.7;
    }
    const dinoH = duck && y === 0 ? 28 : 52;
    for (const o of obs) {
      o.x -= speed * dt;
      const px = 120;
      const py = ground - dinoH - y;
      const ox = o.x;
      const oy = ground - o.h - o.y;
      if (px < ox + o.w && px + 40 > ox && py < oy + o.h && py + dinoH > oy) {
        ended = true;
        audio.lose();
        ArcadeGame.lost({ score, duration: t });
      }
    }
    while (obs[0] && obs[0].x < -80) obs.shift();
    score = Math.floor(t * speed * 0.12);
    ArcadeGame.updateScore(score);
    draw();
  });

  function draw() {
    ctx.fillStyle = "#08241c";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#00ffa3";
    ctx.fillRect(0, ground, W, 4);
    const dinoH = duck && y === 0 ? 28 : 52;
    ctx.fillStyle = "#7CFF5A";
    ctx.fillRect(120, ground - dinoH - y, 40, dinoH);
    ctx.fillStyle = "#050308";
    ctx.fillRect(146, ground - dinoH - y + 10, 8, 8);
    for (const o of obs) {
      ctx.fillStyle = o.kind === "bird" ? "#ff4488" : "#00c878";
      ctx.fillRect(o.x, ground - o.h - o.y, o.w, o.h);
    }
    ctx.fillStyle = "#fff5fb";
    ctx.font = "600 16px Orbitron, sans-serif";
    ctx.fillText(`SCORE ${score}`, 24, 32);
    if (!started) cover(ctx, W, H, "MONET RUNNER", "Space jump · S duck · survive the neon wilds");
    if (ended) cover(ctx, W, H, "TRIPPED", `Score ${score}`);
  }

  return () => {
    stop();
    input.destroy();
  };
}
