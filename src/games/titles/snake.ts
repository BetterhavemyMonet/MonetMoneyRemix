import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createLoop, fitCanvas } from "../engine";
import { cover, defineGame } from "../kit";
import type { GameMountApi } from "../types";

export const manifest = defineGame(
  "snake",
  "Snake",
  "Grow the chain without crossing your path.",
  "Arcade",
  "WASD / arrows",
  { thumbnail: "/games/snake.webp", order: 8 },
);

export function mount({ canvas }: GameMountApi) {
  const W = 960;
  const H = 540;
  const ctx = fitCanvas(canvas, W, H);
  if (!ctx) return () => undefined;
  const input = createInput(canvas);
  const audio = createAudio();
  const cols = 24;
  const rows = 14;
  const cell = 32;
  const ox = (W - cols * cell) / 2;
  const oy = (H - rows * cell) / 2;
  let started = false;
  let ended = false;
  let t = 0;
  let acc = 0;
  let dir = { x: 1, y: 0 };
  let next = { x: 1, y: 0 };
  let body = [
    { x: 6, y: 7 },
    { x: 5, y: 7 },
    { x: 4, y: 7 },
  ];
  let food = { x: 12, y: 7 };
  let score = 0;
  ArcadeGame.ready();

  const place = () => {
    do {
      food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
    } while (body.some((b) => b.x === food.x && b.y === food.y));
  };

  const stop = createLoop((dt) => {
    t += dt;
    const a = input.sample();
    if (!started) {
      if (a.jumpPressed || a.attackPressed || a.moveX || a.moveY) {
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
    if (a.moveX < -0.3 && dir.x !== 1) next = { x: -1, y: 0 };
    if (a.moveX > 0.3 && dir.x !== -1) next = { x: 1, y: 0 };
    if (a.moveY < -0.3 && dir.y !== 1) next = { x: 0, y: -1 };
    if (a.moveY > 0.3 && dir.y !== -1) next = { x: 0, y: 1 };
    acc += dt;
    if (acc > 0.12) {
      acc = 0;
      dir = next;
      const head = { x: body[0].x + dir.x, y: body[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows || body.some((b) => b.x === head.x && b.y === head.y)) {
        ended = true;
        audio.lose();
        ArcadeGame.lost({ score, duration: t });
      } else {
        body.unshift(head);
        if (head.x === food.x && head.y === food.y) {
          score += 10;
          audio.coin();
          ArcadeGame.updateScore(score);
          place();
        } else body.pop();
      }
    }
    draw();
  });

  function draw() {
    ctx.fillStyle = "#05140c";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(0,255,163,0.15)";
    ctx.strokeRect(ox, oy, cols * cell, rows * cell);
    for (const b of body) {
      ctx.fillStyle = "#00ffa3";
      ctx.fillRect(ox + b.x * cell + 2, oy + b.y * cell + 2, cell - 4, cell - 4);
    }
    ctx.fillStyle = "#ff4488";
    ctx.fillRect(ox + food.x * cell + 4, oy + food.y * cell + 4, cell - 8, cell - 8);
    ctx.fillStyle = "#fff";
    ctx.font = "600 16px Orbitron, sans-serif";
    ctx.fillText(`SCORE ${score}`, 24, 32);
    if (!started) cover(ctx, W, H, "SNAKE", "WASD · don't bite yourself");
    if (ended) cover(ctx, W, H, "TANGLED", `Score ${score}`);
  }

  return () => {
    stop();
    input.destroy();
  };
}
