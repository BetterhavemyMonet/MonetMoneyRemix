import { defineGame } from "../kit";

export const manifest = defineGame(
  "breakout",
  "Monet Breakout",
  "Smash through the neon wall and chase the high score.",
  "Arcade",
  "Move paddle · keep the ball alive",
  {
    thumbnail: "/games/breakout.webp",
    order: 20,
  },
);

export function mount() {
  return () => undefined;
}
