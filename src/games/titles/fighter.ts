import { defineGame } from "../kit";

export const manifest = defineGame(
  "fighter",
  "Monet Kombat",
  "Step into the arena and fight for arcade supremacy.",
  "Arcade",
  "Move · jump · attack · special",
  {
    thumbnail: "/games/monet-kombat.webp",
    featured: true,
    order: 5,
  },
);

export function mount() {
  return () => undefined;
}
