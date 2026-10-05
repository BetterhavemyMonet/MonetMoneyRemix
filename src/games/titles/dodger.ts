import { defineGame } from "../kit";

export const manifest = defineGame(
  "dodger",
  "Asteroid Dodger",
  "Thread the needle through an endless neon asteroid field.",
  "Arcade",
  "Move · dodge incoming asteroids",
  {
    thumbnail: "/games/asteroid-dodger.webp",
    order: 21,
  },
);

export function mount() {
  return () => undefined;
}
