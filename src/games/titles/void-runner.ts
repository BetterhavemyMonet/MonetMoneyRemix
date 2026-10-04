import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createJuice, createLoop, fitCanvas, roundRect } from "../engine";
import type { GameManifest, GameMountApi } from "../types";

export const manifest: GameManifest = {
  id: "dodger",
  title: "Asteroid Dodger",
  slug: "dodger",
  description: "Thread the gap and survive the asteroid field.",
  blurb: "Jump, slide, survive. Distance is the score.",
  category: "Arcade",
  thumbnail: "/games/asteroid-dodger.webp",
  route: "/games/dodger",
  backendGameId: "dodger",
  status: "live",
  features: { leaderboard: true, challenges: true, tournaments: true, multiplayer: false, controller: true },
  controls: "A/D move · Space jump",
  order: 16,
};

type Obs = { x: number; y: number; w: number; h: number; kind: "block" | "low" };

export function mount({ canvas }: GameMountApi) {
  const W = 960;
  const H = 540;
  const ctx = fitCanvas(canvas, W, H);
  if (!ctx) return () => undefined;
  const input = createInput(canvas);
  const audio = createAudio();
  const juice = createJuice();
  let started = false;
  let ended = false;
  let y = 390;
  let vy = 0;
  let slide = 0;
  let coyote = 0;
  let jumpBuf = 0;
  let dist = 0;
  let speed = 280;
  let spawn = 0;
  const obs: Obs[] = [];
  const ground = 430;
  const start = performance.now();

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
    juice.step(dt);
    if (!started || ended) {
      draw();
      return;
    }
    speed = Math.min(520, speed + 8 * dt);
    dist += speed * dt;
    if (a.jumpPressed) jumpBuf = 0.12;
    jumpBuf = Math.max(0, jumpBuf - dt);
    const onGround = y >= ground - 1;
    coyote = onGround ? 0.08 : Math.max(0, coyote - dt);
    if (jumpBuf > 0 && coyote > 0) {
      vy = -560;
      jumpBuf = 0;
      coyote = 0;
      audio.jump();
    }
    slide = a.moveY > 0.4 || input.has("KeyS") ? 0.35 : Math.max(0, slide - dt);
    vy += 1750 * dt;
    y += vy * dt;
    if (y > ground) {
      y = ground;
      vy = 0;
    }
    spawn -= dt;
    if (spawn <= 0) {
      spawn = 0.9 + Math.random() * 0.5;
      const low = Math.random() > 0.55;
      obs.push(low ? { x: W + 40, y: ground - 18, w: 46, h: 18, kind: "low" } : { x: W + 40, y: ground - 70, w: 36, h: 70, kind: "block" });
    }
    const px = 160;
    const ph = slide > 0 ? 28 : 48;
    const py = y - ph;
    for (let i = obs.length - 1; i >= 0; i -= 1) {
      const o = obs[i];
      o.x -= speed * dt;
      if (o.x + o.w < -20) obs.splice(i, 1);
      const hit = px + 28 > o.x && px < o.x + o.w && py + ph > o.y && py < o.y + o.h;
      if (hit) {
        ended = true;
        juice.bump(0.7);
        audio.lose();
        ArcadeGame.finished({
          score: Math.floor(dist),
          won: dist > 2500,
          duration: (performance.now() - start) / 1000,
        });
      }
    }
    ArcadeGame.updateScore(Math.floor(dist));
    draw();
  });

  function draw() {
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 448, W, 92);
    ctx.strokeStyle = "rgba(46,233,208,0.25)";
    ctx.beginPath();
    ctx.moveTo(0, 448);
    ctx.lineTo(W, 448);
    ctx.stroke();
    for (const o of obs) {
      ctx.fillStyle = o.kind === "low" ? "#d946ef" : "#2ee9d0";
      roundRect(ctx, o.x, o.y, o.w, o.h, 6);
      ctx.fill();
    }
    const ph = slide > 0 ? 28 : 48;
    ctx.fillStyle = "#9ae7ff";
    roundRect(ctx, 160, y - ph, 28, ph, 6);
    ctx.fill();
    juice.draw(ctx);
    ctx.fillStyle = "#e8f4ff";
    ctx.font = "600 18px Oxanium, sans-serif";
    ctx.fillText(`${Math.floor(dist)} m`, 24, 32);
    if (!started) overlay("VOID RUNNER", "Space jump · S slide");
    if (ended) overlay("RUN OVER", `${Math.floor(dist)} m`);
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
