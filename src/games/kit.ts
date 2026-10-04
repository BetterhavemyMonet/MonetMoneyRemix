import type { GameCategory, GameFeatures, GameManifest } from "./types";

export const SKILL: GameFeatures = {
  leaderboard: true,
  challenges: true,
  tournaments: true,
  multiplayer: false,
  controller: true,
};

export function defineGame(
  id: string,
  title: string,
  description: string,
  category: GameCategory,
  controls: string,
  extra: Partial<GameManifest> = {},
): GameManifest {
  const slug = extra.slug ?? id;
  return {
    id,
    title,
    slug,
    description,
    blurb: extra.blurb ?? description,
    category,
    thumbnail: extra.thumbnail ?? `/games/${slug}.webp`,
    route: extra.route ?? `/games/${slug}`,
    backendGameId: extra.backendGameId ?? id,
    status: extra.status ?? "live",
    features: extra.features ?? SKILL,
    controls,
    featured: extra.featured,
    new: extra.new,
    order: extra.order,
    artA: extra.artA,
    artB: extra.artB,
  };
}

export function cover(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  title: string,
  sub: string,
) {
  ctx.fillStyle = "rgba(5,3,8,0.62)";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff5fb";
  ctx.font = "700 42px Bangers, Impact, sans-serif";
  ctx.fillText(title, W / 2, H / 2);
  ctx.fillStyle = "#b39bb0";
  ctx.font = "600 13px Orbitron, sans-serif";
  ctx.fillText(sub, W / 2, H / 2 + 32);
  ctx.textAlign = "left";
}
