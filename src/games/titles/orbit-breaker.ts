import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createJuice, createLoop, fitCanvas } from "../engine";
import type { GameManifest, GameMountApi } from "../types";

export const manifest: GameManifest = {
  id: "breakout",
  title: "Breakout",
  slug: "breakout",
  description: "Smash the neon wall and keep the ball alive.",
  blurb: "Classic breaker physics with neon juice.",
  category: "Arcade",
  thumbnail: "/games/breakout.webp",
  route: "/games/breakout",
  backendGameId: "breakout",
  status: "live",
  features: { leaderboard: true, challenges: true, tournaments: true, multiplayer: false, controller: true },
  controls: "A/D paddle · Space launch",
  order: 14,
};

type Brick = { x: number; y: number; hp: number; alive: boolean };

export function mount({ canvas }: GameMountApi) {
  const W = 960;
  const H = 540;
  const ctx = fitCanvas(canvas, W, H);
  if (!ctx) return () => undefined;
  const input = createInput(canvas);
  const audio = createAudio();
  const juice = createJuice();
  const bricks: Brick[] = [];
  for (let r = 0; r < 5; r += 1)
    for (let c = 0; c < 11; c += 1)
      bricks.push({ x: 80 + c * 72, y: 60 + r * 28, hp: 1 + (r < 2 ? 1 : 0), alive: true });
  let px = 430;
  const pw = 110;
  let bx = 480;
  let by = 400;
  let bvx = 180;
  let bvy = -260;
  let launched = false;
  let started = false;
  let ended = false;
  let score = 0;
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
    px += a.moveX * 520 * dt;
    px = Math.max(20, Math.min(W - pw - 20, px));
    if (!launched) {
      bx = px + pw / 2;
      by = H - 72;
      if (a.jumpPressed) {
        launched = true;
        bvx = 180 * (Math.random() > 0.5 ? 1 : -1);
        bvy = -280;
      }
    } else {
      bx += bvx * dt;
      by += bvy * dt;
      if (bx < 16 || bx > W - 16) {
        bvx *= -1;
        bx = Math.max(16, Math.min(W - 16, bx));
      }
      if (by < 16) bvy = Math.abs(bvy);
      if (by > H - 28 && bx > px && bx < px + pw && bvy > 0) {
        bvy = -Math.abs(bvy);
        bvx += (bx - (px + pw / 2)) * 4;
        audio.blip();
      }
      for (const br of bricks) {
        if (!br.alive) continue;
        if (bx > br.x && bx < br.x + 64 && by > br.y && by < br.y + 22) {
          br.hp -= 1;
          if (br.hp <= 0) {
            br.alive = false;
            score += 120;
            juice.burst(br.x + 32, br.y + 10, "#2ee9d0", 10);
            juice.bump(0.2);
            audio.coin();
          } else {
            score += 40;
            audio.hit();
          }
          bvy *= -1;
          ArcadeGame.updateScore(score);
        }
      }
      if (by > H + 20) {
        ended = true;
        ArcadeGame.finished({ score, won: false, duration: (performance.now() - start) / 1000 });
        audio.lose();
      }
      if (bricks.every((b) => !b.alive)) {
        ended = true;
        score += 1500;
        ArcadeGame.finished({ score, won: true, duration: (performance.now() - start) / 1000 });
        audio.win();
      }
    }
    draw();
  });

  function draw() {
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, W, H);
    for (const br of bricks) {
      if (!br.alive) continue;
      ctx.fillStyle = br.hp > 1 ? "#d946ef" : "#2ee9d0";
      ctx.fillRect(br.x, br.y, 64, 20);
    }
    ctx.fillStyle = "#9ae7ff";
    ctx.fillRect(px, H - 48, pw, 12);
    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    ctx.fill();
    juice.draw(ctx);
    ctx.fillStyle = "#e8f4ff";
    ctx.font = "600 18px Oxanium, sans-serif";
    ctx.fillText(`SCORE ${score}`, 24, 32);
    if (!started) overlay("ORBIT BREAKER", "A/D paddle · Space launch");
    if (ended) overlay(bricks.every((b) => !b.alive) ? "BELT CLEARED" : "DRIFT", `Score ${score}`);
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
