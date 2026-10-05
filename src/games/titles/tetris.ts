import { defineGame } from "../kit";

export const manifest = defineGame(
  "tetris",
  "Monet Tetris",
  "Stack, clear and survive as the blocks keep falling.",
  "Puzzle",
  "Move · rotate · soft drop · hard drop",
  {
    thumbnail: "/games/tetris.webp",
    order: 23,
  },
);

export function mount() {
  return () => undefined;
}
