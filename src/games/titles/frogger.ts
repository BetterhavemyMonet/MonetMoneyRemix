import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createLoop, fitCanvas } from "../engine";
import { cover, defineGame } from "../kit";
import type { GameMountApi } from "../types";

export const manifest = defineGame(
  "frogger",
  "Frogger",
  "Cross the chaos and reach the other side.",
  "Arcade",
  "WASD / arrows to hop",
  { thumbnail: "/games/frogger.webp", order: 11 },
);

type Lane = { y: number; dir: number; speed: number; gap: number; w: number; kind: "car" | "log" };

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
  let fx = W / 2;
  let fy = 500;
  let cool = 0;
  const lanes: Lane[] = [
    { y: 440, dir: 1, speed: 90, gap: 180, w: 70, kind: "car" },
    { y: 390, dir: -1, speed: 130, gap: 200, w: 50, kind: "car" },
    { y: 340, dir: 1, speed: 70, gap: 160, w: 90, kind: "car" },
    { y: 240, dir: -1, speed: 70, gap: 180, w: 110, kind: "log" },
    { y: 190, dir: 1, speed: 100, gap: 160, w: 90, kind: "log" },
    { y: 140, dir: -1, speed: 60, gap: 200, w: 140, kind: "log" },
  ];
  ArcadeGame.ready();

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
    cool = Math.max(0, cool - dt);
    if (cool <= 0) {
      if (Math.abs(a.moveX) > 0.5) {
        fx += Math.sign(a.moveX) * 48;
        cool = 0.16;
        audio.blip();
      } else if (Math.abs(a.moveY) > 0.5) {
        fy += Math.sign(a.moveY) * 50;
        cool = 0.16;
        audio.jump();
        if (a.moveY < 0) {
          score += 10;
          ArcadeGame.updateScore(score);
        }
      }
    }
    fx = Math.max(20, Math.min(W - 20, fx));
    if (fy < 80) {
      ended = true;
      won = true;
      score += 500;
      ArcadeGame.updateScore(score);
      ArcadeGame.won({ score, duration: t });
      audio.win();
    }
    const onWater = fy < 270 && fy > 110;
    let safe = !onWater;
    for (const lane of lanes) {
      const n = 8;
      for (let i = 0; i < n; i += 1) {
        const x = ((t * lane.speed * lane.dir + i * lane.gap) % (W + 200)) - 100;
        const hit = fx > x && fx < x + lane.w && Math.abs(fy - lane.y) < 18;
        if (!hit) continue;
        if (lane.kind === "car") {
          ended = true;
          audio.lose();
          ArcadeGame.lost({ score, duration: t });
        } else {
          safe = true;
          fx += lane.dir * lane.speed * dt;
        }
      }
    }
    if (onWater && !safe) {
      ended = true;
      audio.lose();
      ArcadeGame.lost({ score, duration: t });
    }
    draw();
  });

  function draw() {
    ctx.fillStyle = "#123";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#163";
    ctx.fillRect(0, 470, W, 80);
    ctx.fillRect(0, 270, W, 50);
    ctx.fillRect(0, 40, W, 70);
    ctx.fillStyle = "#024";
    ctx.fillRect(0, 110, W, 160);
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 320, W, 150);
    for (const lane of lanes) {
      for (let i = 0; i < 8; i += 1) {
        const x = ((t * lane.speed * lane.dir + i * lane.gap) % (W + 200)) - 100;
        ctx.fillStyle = lane.kind === "car" ? "#ff664d" : "#8b5a2b";
        ctx.fillRect(x, lane.y - 14, lane.w, 28);
      }
    }
    ctx.fillStyle = "#00ffa3";
    ctx.beginPath();
    ctx.arc(fx, fy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "600 16px Orbitron, sans-serif";
    ctx.fillText(`SCORE ${score}`, 24, 28);
    if (!started) cover(ctx, W, H, "FROGGER", "Hop across cars and logs");
    if (ended) cover(ctx, W, H, won ? "HOME" : "SPLAT", `Score ${score}`);
  }

  return () => {
    stop();
    input.destroy();
  };
}
