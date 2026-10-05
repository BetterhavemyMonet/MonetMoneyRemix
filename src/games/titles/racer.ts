import { defineGame } from "../kit";

export const manifest = defineGame(
  "racer",
  "Monet Drift",
  "Push the limits in a high-speed neon racing showdown.",
  "Racing",
  "Steer · accelerate · brake",
  {
    thumbnail: "/games/monet-drift.webp",
    featured: true,
    order: 6,
  },
);

export function mount() {
  return () => undefined;
}
