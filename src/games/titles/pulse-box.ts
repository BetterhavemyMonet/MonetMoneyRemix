import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createJuice, createLoop, fitCanvas } from "../engine";
import type { GameManifest, GameMountApi } from "../types";

export const manifest: GameManifest = {
  id: "reaction",
  title: "Reaction Blitz",
  slug: "reaction",
  description: "Test your timing and reaction speed.",
  blurb: "A pure reaction test. Timing is everything.",
  category: "Arcade",
  thumbnail: "/games/reaction-blitz.webp",
  route: "/games/reaction",
  backendGameId: "reaction",
  status: "live",
  features: { leaderboard: true, challenges: true, tournaments: true, multiplayer: false, controller: false },
  controls: "Space / tap when the ring hits the mark",
  order: 17,
};

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
  let t = 0;
  let radius = 220;
  let speed = 140;
  let lives = 3;
  let combo = 0;
  let score = 0;
  let armed = true;
  const target = 86;
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
    t += dt;
    radius -= speed * dt;
    if (radius < 18) {
      lives -= 1;
      combo = 0;
      radius = 220;
      speed = Math.min(260, speed + 8);
      armed = true;
      audio.lose();
      juice.bump(0.4);
      if (lives <= 0) {
        ended = true;
        ArcadeGame.finished({ score, won: score > 1200, duration: (performance.now() - start) / 1000 });
      }
    }
    if (armed && (a.jumpPressed || a.attackPressed)) {
      const err = Math.abs(radius - target);
      if (err < 16) {
        combo += 1;
        score += 100 + combo * 20;
        juice.burst(W / 2, H / 2, "#2ee9d0", 16);
        juice.bump(0.2);
        audio.coin();
      } else {
        lives -= 1;
        combo = 0;
        audio.hit();
        juice.bump(0.45);
        if (lives <= 0) {
          ended = true;
          ArcadeGame.finished({ score, won: false, duration: (performance.now() - start) / 1000 });
        }
      }
      radius = 220;
      speed = Math.min(280, speed + 12);
      ArcadeGame.updateScore(score);
      armed = false;
      setTimeout(() => {
        armed = true;
      }, 120);
    }
    draw();
  });

  function draw() {
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(46,233,208,0.35)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, target, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#2ee9d0";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, Math.max(8, radius), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#d946ef";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 10, 0, Math.PI * 2);
    ctx.fill();
    juice.draw(ctx);
    ctx.fillStyle = "#e8f4ff";
    ctx.font = "600 18px Oxanium, sans-serif";
    ctx.fillText(`SCORE ${score}   COMBO ${combo}   LIVES ${lives}`, 24, 32);
    if (!started) overlay("PULSE BOX", "Tap when the ring kisses the mark");
    if (ended) overlay("CORE QUIET", `Score ${score}`);
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
