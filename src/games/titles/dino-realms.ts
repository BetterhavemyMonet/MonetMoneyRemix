import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createJuice, createLoop, fitCanvas, roundRect } from "../engine";
import { defineGame } from "../kit";
import type { GameMountApi } from "../types";

export const manifest = defineGame(
  "dino-realms",
  "Dino Realms",
  "Battle through five dangerous realms.",
  "Platformer",
  "A/D move · Space jump · J attack",
  { thumbnail: "/games/dino-realms.webp", featured: true, new: true, order: 5 },
);

type Enemy = { x: number; y: number; hp: number; kind: number; hit: number };

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
  let won = false;
  let t = 0;
  let score = 0;
  let hp = 3;
  let x = 180;
  let y = 390;
  let vy = 0;
  let facing = 1;
  let attackT = 0;
  let invul = 0;
  let cam = 0;
  const ground = 430;
  const enemies: Enemy[] = [];
  const coins: { x: number; y: number; taken: boolean }[] = [];
  for (let i = 0; i < 18; i += 1) {
    coins.push({ x: 280 + i * 140, y: 280 + (i % 3) * 40, taken: false });
    if (i % 2 === 0) enemies.push({ x: 420 + i * 150, y: ground - 28, hp: 2 + (i % 3), kind: i % 3, hit: 0 });
  }
  const goal = 2800;
  ArcadeGame.ready();

  const stop = createLoop((dt) => {
    t += dt;
    juice.step(dt);
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
    x += a.moveX * 240 * dt;
    if (a.moveX) facing = a.moveX > 0 ? 1 : -1;
    const onGround = y >= ground - 1;
    if (onGround) {
      y = ground;
      vy = 0;
      if (a.jumpPressed) {
        vy = -520;
        audio.jump();
      }
    } else vy += 1400 * dt;
    y += vy * dt;
    if (y > ground) y = ground;
    if (a.attackPressed && attackT <= 0) {
      attackT = 0.22;
      audio.hit();
    }
    attackT = Math.max(0, attackT - dt);
    invul = Math.max(0, invul - dt);
    cam += (x - 220 - cam) * Math.min(1, dt * 6);
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      e.hit = Math.max(0, e.hit - dt);
      e.x += Math.sin(t * 1.4 + e.kind) * 40 * dt;
      const dx = x - e.x;
      const dy = y - e.y;
      if (attackT > 0 && Math.abs(dx) < 70 && Math.abs(dy) < 50 && Math.sign(dx) !== facing * -1) {
        e.hp -= 1;
        e.hit = 0.15;
        score += 120;
        juice.burst(e.x, e.y, "#ff4488", 8);
        ArcadeGame.updateScore(score);
        if (e.hp <= 0) {
          score += 200;
          ArcadeGame.updateScore(score);
        }
      } else if (invul <= 0 && Math.abs(dx) < 28 && Math.abs(dy) < 36) {
        hp -= 1;
        invul = 1;
        juice.bump(0.5);
        audio.lose();
        if (hp <= 0) {
          ended = true;
          ArcadeGame.lost({ score, duration: t });
        }
      }
    }
    for (const c of coins) {
      if (c.taken) continue;
      if (Math.hypot(x - c.x, y - 24 - c.y) < 28) {
        c.taken = true;
        score += 50;
        audio.coin();
        ArcadeGame.updateScore(score);
      }
    }
    if (x > goal) {
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
    ctx.fillStyle = "#081428";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    const o = juice.offset();
    ctx.translate(-cam + o.x, o.y);
    const biome = x < 900 ? 0 : x < 1800 ? 1 : 2;
    const skies = ["#142052", "#3d142b", "#063b32"];
    ctx.fillStyle = skies[biome];
    ctx.fillRect(cam - 40, 0, W + 80, H);
    ctx.fillStyle = "#0a1a14";
    ctx.fillRect(cam - 40, ground + 8, W + 80, H);
    for (let i = 0; i < 12; i += 1) {
      ctx.fillStyle = i % 2 ? "#1a3a2a" : "#163024";
      ctx.fillRect(i * 260, ground - 90, 40, 90);
    }
    for (const c of coins) {
      if (c.taken) continue;
      ctx.fillStyle = "#ffd85a";
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      ctx.fillStyle = e.hit > 0 ? "#fff" : ["#ff664d", "#a855ff", "#00f0ff"][e.kind];
      roundRect(ctx, e.x - 18, e.y - 28, 36, 36, 6);
      ctx.fill();
    }
    ctx.fillStyle = "#00ffa3";
    ctx.fillRect(goal, ground - 120, 18, 120);
    ctx.fillStyle = invul > 0 && Math.floor(t * 20) % 2 === 0 ? "#fff" : "#2ee9d0";
    roundRect(ctx, x - 16, y - 42, 32, 42, 6);
    ctx.fill();
    if (attackT > 0) {
      ctx.fillStyle = "rgba(255,68,136,0.7)";
      ctx.fillRect(x + facing * 28, y - 30, 36, 12);
    }
    juice.draw(ctx);
    ctx.restore();
    ctx.fillStyle = "#fff5fb";
    ctx.font = "600 16px Orbitron, sans-serif";
    ctx.fillText(`HP ${hp}   SCORE ${score}`, 20, 28);
    if (!started) {
      ctx.fillStyle = "rgba(5,3,8,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "700 42px Bangers, sans-serif";
      ctx.fillText("DINO REALMS", W / 2, H / 2);
      ctx.fillStyle = "#b39bb0";
      ctx.font = "600 13px Orbitron, sans-serif";
      ctx.fillText("A/D move · Space jump · J attack", W / 2, H / 2 + 32);
      ctx.textAlign = "left";
    }
    if (ended) {
      ctx.fillStyle = "rgba(5,3,8,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "700 42px Bangers, sans-serif";
      ctx.fillText(won ? "REALM CLEARED" : "FOSSILIZED", W / 2, H / 2);
      ctx.textAlign = "left";
    }
  }

  return () => {
    stop();
    input.destroy();
  };
}
