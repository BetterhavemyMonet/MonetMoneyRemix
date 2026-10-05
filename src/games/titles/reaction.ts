import { defineGame } from "../kit";

export const manifest = defineGame(
  "reaction",
  "Reaction Blitz",
  "Test your reflexes and react before the clock beats you.",
  "Arcade",
  "Tap or click as quickly as possible",
  {
    thumbnail: "/games/reaction-blitz.webp",
    order: 22,
  },
);

export function mount() {
  return () => undefined;
}
