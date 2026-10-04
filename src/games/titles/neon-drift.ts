import { ArcadeGame } from "../bridge";
import { createAudio, createInput, createJuice, createLoop, fitCanvas } from "../engine";
import { cover, defineGame } from "../kit";
import type { GameMountApi } from "../types";

export const manifest = defineGame(
  "racer",
  "Monet Drift",
  "Push your line and race for the fastest time.",
  "Racing",
  "W throttle · S brake · A left · D right",
  { slug: "racer", thumbnail: "/games/monet-drift.webp", featured: true, order: 6, backendGameId: "racer" },
);

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
  let score = 0;
  let x = 0;
  let z = 0;
  let yaw = 0;
  let speed = 0;
  let laps = 0;
  let lastSector = 0;
  ArcadeGame.ready();

  if (import.meta.env.DEV) {
    window.__controlsTest = {
      getYaw: () => yaw,
      getSpeed: () => speed,
      setKeys: (codes) => input.setKeys(codes),
    };
  }

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
    if (a.moveY < -0.1) speed += 420 * dt;
    else if (a.moveY > 0.1) speed -= 620 * dt;
    else speed *= Math.pow(0.18, dt);
    speed = Math.max(-80, Math.min(320, speed));
    const steer = -a.moveX;
    const speedFactor = Math.min(1, Math.abs(speed) / 180);
    const reverse = speed >= 0 ? 1 : -1;
    yaw += steer * 2.4 * speedFactor * reverse * dt;
    x += -Math.sin(yaw) * speed * dt;
    z += Math.cos(yaw) * speed * dt;
    const ang = Math.atan2(x, z);
    if (lastSector > 2 && ang < -2) {
      laps += 1;
      audio.win();
      if (laps >= 3) {
        ended = true;
        score += Math.max(100, 12000 - Math.floor(t * 40));
        ArcadeGame.updateScore(score);
        ArcadeGame.won({ score, duration: t });
      }
    }
    lastSector = ang;
    score = Math.max(score, Math.floor(speed * 4 + laps * 2000));
    ArcadeGame.updateScore(score);
    draw();
  });

  function draw() {
    ctx.fillStyle = "#12081c";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    const o = juice.offset();
    ctx.translate(W / 2 + o.x, H * 0.72 + o.y);
    ctx.strokeStyle = "#ff4488";
    ctx.lineWidth = 48;
    ctx.beginPath();
    ctx.ellipse(0, 0, 280, 140, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.ellipse(0, 0, 280, 140, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const px = Math.sin(yaw) * -8;
    const pz = Math.cos(yaw) * -8;
    ctx.fillStyle = "#fff";
    ctx.save();
    ctx.translate(x * 0.42 + px, -z * 0.22 + pz);
    ctx.rotate(-yaw);
    ctx.fillRect(-8, -14, 16, 26);
    ctx.restore();
    ctx.restore();
    ctx.fillStyle = "#fff5fb";
    ctx.font = "600 16px Orbitron, sans-serif";
    ctx.fillText(`LAP ${Math.min(laps + 1, 3)} / 3`, 24, 32);
    ctx.fillStyle = "#b39bb0";
    ctx.fillText(`SPEED ${Math.abs(speed | 0)}`, 24, 54);
    if (!started) cover(ctx, W, H, "MONET DRIFT", "W throttle · A/D steer · 3 laps");
    if (ended) cover(ctx, W, H, "FINISH", `Score ${score}`);
  }

  return () => {
    stop();
    input.destroy();
    if (window.__controlsTest) delete window.__controlsTest;
  };
}
