import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createLoop, fitCanvas, roundRect } from "../engine";
import { cover, defineGame } from "../kit";
import type { GameMountApi } from "../types";

export const manifest = defineGame(
  "mario",
  "Monet Bros",
  "Run, jump and conquer original Monet arcade worlds.",
  "Platformer",
  "A/D move · Space jump",
  { thumbnail: "/games/monet-bros.webp", order: 2 },
);

type Ent = { x: number; y: number; w: number; h: number; kind: "goom" | "coin" | "flag"; dead?: boolean };

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
  let x = 80;
  let y = 390;
  let vy = 0;
  let cam = 0;
  const ground = 430;
  const ents: Ent[] = [
    { x: 420, y: 402, w: 32, h: 28, kind: "goom" },
    { x: 620, y: 402, w: 32, h: 28, kind: "goom" },
    { x: 860, y: 402, w: 32, h: 28, kind: "goom" },
    { x: 1100, y: 402, w: 32, h: 28, kind: "goom" },
    { x: 500, y: 300, w: 18, h: 18, kind: "coin" },
    { x: 540, y: 300, w: 18, h: 18, kind: "coin" },
    { x: 740, y: 260, w: 18, h: 18, kind: "coin" },
    { x: 980, y: 300, w: 18, h: 18, kind: "coin" },
    { x: 1400, y: 250, w: 18, h: 180, kind: "flag" },
  ];
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
    x += a.moveX * 230 * dt;
    const onG = y >= ground - 1;
    if (onG) {
      y = ground;
      vy = 0;
      if (a.jumpPressed) {
        vy = -560;
        audio.jump();
      }
    } else vy += 1500 * dt;
    y += vy * dt;
    if (y > ground) y = ground;
    cam += (x - 200 - cam) * Math.min(1, 6 * dt);
    for (const e of ents) {
      if (e.dead) continue;
      if (e.kind === "goom") e.x -= 40 * dt;
      const hit = x < e.x + e.w && x + 28 > e.x && y - 40 < e.y + e.h && y > e.y;
      if (!hit) continue;
      if (e.kind === "coin") {
        e.dead = true;
        score += 100;
        audio.coin();
        ArcadeGame.updateScore(score);
      } else if (e.kind === "flag") {
        ended = true;
        won = true;
        score += 800;
        ArcadeGame.updateScore(score);
        ArcadeGame.won({ score, duration: t });
        audio.win();
      } else if (vy > 0 && y < e.y + 12) {
        e.dead = true;
        vy = -280;
        score += 200;
        audio.hit();
        ArcadeGame.updateScore(score);
      } else {
        ended = true;
        audio.lose();
        ArcadeGame.lost({ score, duration: t });
      }
    }
    if (y > 520) {
      ended = true;
      ArcadeGame.lost({ score, duration: t });
    }
    draw();
  });

  function draw() {
    ctx.fillStyle = "#4aa3ff";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(-cam, 0);
    ctx.fillStyle = "#5d3";
    ctx.fillRect(cam - 40, ground, W + 80, H);
    ctx.fillStyle = "#c84";
    ctx.fillRect(1400, 250, 18, 180);
    for (const e of ents) {
      if (e.dead) continue;
      ctx.fillStyle = e.kind === "coin" ? "#ffd85a" : e.kind === "flag" ? "#00ffa3" : "#a44";
      roundRect(ctx, e.x, e.y, e.w, e.h, 4);
      ctx.fill();
    }
    ctx.fillStyle = "#ff4488";
    roundRect(ctx, x, y - 40, 28, 40, 6);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#fff";
    ctx.font = "600 16px Orbitron, sans-serif";
    ctx.fillText(`SCORE ${score}`, 24, 32);
    if (!started) cover(ctx, W, H, "MONET BROS", "A/D move · Space jump · stomp foes · grab the flag");
    if (ended) cover(ctx, W, H, won ? "WORLD CLEAR" : "DOWN", `Score ${score}`);
  }

  return () => {
    stop();
    input.destroy();
  };
}
