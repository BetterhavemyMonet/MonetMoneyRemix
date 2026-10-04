import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createJuice, createLoop, fitCanvas, roundRect } from "../engine";
import type { GameManifest, GameMountApi } from "../types";

export const manifest: GameManifest = {
  id: "fighter",
  title: "Monet Kombat",
  slug: "fighter",
  description: "Fast one-on-one arcade fighting.",
  blurb: "Light, heavy, block. First to drop the rival.",
  category: "Arcade",
  thumbnail: "/games/monet-kombat.webp",
  route: "/games/fighter",
  backendGameId: "fighter",
  status: "live",
  features: { leaderboard: true, challenges: true, tournaments: true, multiplayer: false, controller: true },
  controls: "A/D move · J light · K heavy · L block",
  order: 15,
};

export function mount({ canvas }: GameMountApi) {
  const W = 960;
  const H = 540;
  const ctx = fitCanvas(canvas, W, H);
  if (!ctx) return () => undefined;
  const input = createInput(canvas);
  const audio = createAudio();
  const juice = createJuice();
  const p = { x: 260, hp: 100, stun: 0, atk: 0, heavy: false, block: false };
  const e = { x: 640, hp: 100, stun: 0, atk: 0, think: 0 };
  let started = false;
  let ended = false;
  let score = 0;
  const ground = 420;
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
    p.stun = Math.max(0, p.stun - dt);
    e.stun = Math.max(0, e.stun - dt);
    p.atk = Math.max(0, p.atk - dt);
    e.atk = Math.max(0, e.atk - dt);
    p.block = a.block && p.stun <= 0;
    if (p.stun <= 0) p.x += a.moveX * 220 * dt;
    p.x = Math.max(80, Math.min(e.x - 70, p.x));
    if (p.stun <= 0 && p.atk <= 0 && (a.attackPressed || a.attack2Pressed)) {
      p.atk = a.attack2Pressed ? 0.42 : 0.22;
      p.heavy = a.attack2Pressed;
      audio.hit();
    }
    e.think -= dt;
    if (e.think <= 0 && e.stun <= 0) {
      e.think = 0.35 + Math.random() * 0.4;
      const gap = e.x - p.x;
      if (gap > 140) e.x -= 40;
      else if (Math.random() > 0.4) e.atk = Math.random() > 0.6 ? 0.42 : 0.22;
    } else if (e.stun <= 0) e.x += Math.sin(performance.now() / 400) * 10 * dt;
    e.x = Math.min(860, Math.max(p.x + 70, e.x));

    const hit = (fromX: number, toX: number, dmg: number, who: "p" | "e") => {
      if (Math.abs(fromX - toX) < 90) {
        if (who === "p") {
          if (p.block) {
            dmg *= 0.2;
          }
          p.hp -= dmg;
          p.stun = 0.25;
          juice.bump(0.35);
        } else {
          e.hp -= dmg;
          e.stun = 0.22;
          score += dmg * 8;
          juice.burst(e.x, ground - 40, "#2ee9d0", 8);
          juice.bump(0.28);
          ArcadeGame.updateScore(Math.floor(score));
        }
      }
    };
    if (p.atk > 0.01 && p.atk < 0.08) hit(p.x + 50, e.x, p.heavy ? 16 : 8, "e");
    if (e.atk > 0.01 && e.atk < 0.08) hit(e.x - 50, p.x, 10, "p");
    if (p.hp <= 0 || e.hp <= 0) {
      ended = true;
      const won = e.hp <= 0;
      if (won) score += 800;
      ArcadeGame.finished({
        score: Math.floor(score),
        won,
        duration: (performance.now() - start) / 1000,
      });
      if (won) audio.win();
      else audio.lose();
    }
    draw();
  });

  function draw() {
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#11192b";
    ctx.fillRect(0, ground, W, H - ground);
    ctx.fillStyle = "#2ee9d0";
    roundRect(ctx, p.x, ground - 90, 46, 90, 8);
    ctx.fill();
    if (p.atk > 0) {
      ctx.fillStyle = "rgba(46,233,208,0.5)";
      ctx.fillRect(p.x + 40, ground - 70, p.heavy ? 70 : 44, 16);
    }
    ctx.fillStyle = "#d946ef";
    roundRect(ctx, e.x, ground - 90, 46, 90, 8);
    ctx.fill();
    if (e.atk > 0) {
      ctx.fillStyle = "rgba(217,70,239,0.5)";
      ctx.fillRect(e.x - 40, ground - 70, 44, 16);
    }
    ctx.fillStyle = "#243044";
    ctx.fillRect(40, 24, 280, 12);
    ctx.fillRect(W - 320, 24, 280, 12);
    ctx.fillStyle = "#2ee9d0";
    ctx.fillRect(40, 24, 280 * Math.max(0, p.hp / 100), 12);
    ctx.fillStyle = "#d946ef";
    ctx.fillRect(W - 320, 24, 280 * Math.max(0, e.hp / 100), 12);
    juice.draw(ctx);
    ctx.fillStyle = "#8ba0b8";
    ctx.font = "500 13px Sora, sans-serif";
    ctx.fillText(`SCORE ${Math.floor(score)}`, 40, 54);
    if (!started) overlay("SIGNAL DUEL", "A/D move · J light · K heavy · L block");
    if (ended) overlay(e.hp <= 0 ? "YOU WIN" : "K.O.", `Score ${Math.floor(score)}`);
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
