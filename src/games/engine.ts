export type Actions = {
  moveX: number;
  moveY: number;
  jump: boolean;
  attack: boolean;
  attack2: boolean;
  block: boolean;
  pause: boolean;
  jumpPressed: boolean;
  attackPressed: boolean;
  attack2Pressed: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
};

export function createLoop(update: (dt: number) => void) {
  let raf = 0;
  let last = performance.now();
  let acc = 0;
  const step = 1 / 60;
  const tick = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc >= step) {
      update(step);
      acc -= step;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export function createInput(el: HTMLElement) {
  const keys = new Set<string>();
  const injected = new Set<string>();
  let prevJump = false;
  let prevAttack = false;
  let prevAttack2 = false;
  const pointers = new Map<number, { x: number; y: number; role: "move" | "act" }>();

  const onDown = (e: KeyboardEvent) => {
    keys.add(e.code);
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
      e.preventDefault();
    }
  };
  const onUp = (e: KeyboardEvent) => keys.delete(e.code);
  const clear = () => keys.clear();
  const onPointer = (e: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (e.type === "pointerdown") {
      pointers.set(e.pointerId, { x, y, role: x < 0.42 ? "move" : "act" });
      el.setPointerCapture(e.pointerId);
    } else if (e.type === "pointermove" && pointers.has(e.pointerId)) {
      const p = pointers.get(e.pointerId)!;
      p.x = x;
      p.y = y;
    } else {
      pointers.delete(e.pointerId);
    }
  };

  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", clear);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clear();
  });
  el.addEventListener("pointerdown", onPointer);
  el.addEventListener("pointermove", onPointer);
  el.addEventListener("pointerup", onPointer);
  el.addEventListener("pointercancel", onPointer);

  const has = (code: string) => keys.has(code) || injected.has(code);

  const sample = (): Actions => {
    let moveX = 0;
    let moveY = 0;
    if (has("KeyA") || has("ArrowLeft")) moveX -= 1;
    if (has("KeyD") || has("ArrowRight")) moveX += 1;
    if (has("KeyW") || has("ArrowUp")) moveY -= 1;
    if (has("KeyS") || has("ArrowDown")) moveY += 1;
    for (const p of pointers.values()) {
      if (p.role === "move") {
        moveX += (p.x - 0.18) * 6;
        moveY += (p.y - 0.72) * 4;
      }
    }
    moveX = Math.max(-1, Math.min(1, moveX));
    moveY = Math.max(-1, Math.min(1, moveY));
    const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() ?? [] : [];
    for (const pad of pads) {
      if (!pad) continue;
      const ax = pad.axes[0] ?? 0;
      const ay = pad.axes[1] ?? 0;
      const mag = Math.hypot(ax, ay);
      if (mag > 0.15) {
        const scale = ((mag - 0.15) / 0.85) / mag;
        moveX += ax * scale;
        moveY += ay * scale;
      }
      if (pad.buttons[0]?.pressed) moveY -= 1;
      if (pad.buttons[2]?.pressed) keys.add("KeyJ");
    }
    moveX = Math.max(-1, Math.min(1, moveX));
    moveY = Math.max(-1, Math.min(1, moveY));
    const jump =
      has("Space") ||
      has("KeyW") ||
      has("ArrowUp") ||
      [...pointers.values()].some((p) => p.role === "act" && p.y < 0.55);
    const attack =
      has("KeyJ") ||
      has("KeyK") ||
      [...pointers.values()].some((p) => p.role === "act" && p.x >= 0.7);
    const attack2 = has("KeyK");
    const block = has("KeyL") || has("ShiftLeft");
    const actions: Actions = {
      moveX,
      moveY,
      jump,
      attack,
      attack2,
      block,
      pause: has("Escape") || has("KeyP"),
      jumpPressed: jump && !prevJump,
      attackPressed: attack && !prevAttack,
      attack2Pressed: attack2 && !prevAttack2,
    };
    prevJump = jump;
    prevAttack = attack;
    prevAttack2 = attack2;
    return actions;
  };

  return {
    sample,
    has,
    setKeys(codes: string[]) {
      injected.clear();
      for (const c of codes) injected.add(c);
    },
    destroy() {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", clear);
      el.removeEventListener("pointerdown", onPointer);
      el.removeEventListener("pointermove", onPointer);
      el.removeEventListener("pointerup", onPointer);
      el.removeEventListener("pointercancel", onPointer);
    },
  };
}

export function createAudio() {
  let ctx: AudioContext | null = null;
  const unlock = () => {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  };
  const tone = (freq: number, dur = 0.08, type: OscillatorType = "square", gain = 0.05) => {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    g.gain.setTargetAtTime(0.0001, ctx.currentTime + dur * 0.4, 0.03);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  };
  return {
    unlock,
    jump: () => tone(420, 0.09, "square", 0.04),
    hit: () => tone(180, 0.12, "sawtooth", 0.06),
    coin: () => tone(880, 0.07, "triangle", 0.045),
    lose: () => tone(110, 0.28, "sawtooth", 0.06),
    win: () => {
      tone(523, 0.12, "triangle", 0.05);
      setTimeout(() => tone(784, 0.16, "triangle", 0.05), 90);
    },
    blip: () => tone(640, 0.04, "square", 0.03),
  };
}

export function createJuice() {
  let trauma = 0;
  const particles: Particle[] = [];
  return {
    bump(n = 0.35) {
      trauma = Math.min(1, trauma + n);
    },
    burst(x: number, y: number, color: string, n = 10) {
      for (let i = 0; i < n; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const s = 40 + Math.random() * 180;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 0.35 + Math.random() * 0.3,
          max: 0.5,
          size: 1.5 + Math.random() * 3,
          color,
        });
      }
    },
    offset() {
      const shake = trauma * trauma;
      return {
        x: (Math.random() * 2 - 1) * 12 * shake,
        y: (Math.random() * 2 - 1) * 12 * shake,
      };
    },
    step(dt: number) {
      trauma = Math.max(0, trauma - dt * 1.8);
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 220 * dt;
        if (p.life <= 0) particles.splice(i, 1);
      }
    },
    draw(ctx: CanvasRenderingContext2D) {
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    },
  };
}

export function fitCanvas(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
