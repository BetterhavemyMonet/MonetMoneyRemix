/**
 * Production Monet Money Arcade compatibility map.
 *
 * These paths point to the preserved production games under /public.
 * Games not listed here continue to use the native Remix game engine.
 */

export const LEGACY_GAMES: Record<string, string> = {
  breakout: "/legacy-games/breakout.html",
  "dino-realms": "/legacy-games/dino-realms.html",
  dino: "/legacy-games/dino.html",
  dodger: "/legacy-games/dodger.html",
  duckhunt: "/legacy-games/duckhunt.html",
  fighter: "/legacy-games/fighter.html",
  frogger: "/legacy-games/frogger.html",
  galaga: "/legacy-games/galaga.html",
  invaders: "/legacy-games/invaders.html",
  kong: "/legacy-games/kong.html",
  mario: "/legacy-games/mario.html",
  pacman: "/legacy-games/pacman.html",
  pong: "/legacy-games/pong.html",
  racer: "/legacy-games/racer.html",
  reaction: "/legacy-games/reaction.html",
  snake: "/legacy-games/snake.html",
  tap: "/legacy-games/tap.html",
  tetris: "/legacy-games/tetris.html",
};

export function getLegacyGamePath(slug: string) {
  return LEGACY_GAMES[slug] ?? null;
}

export function isLegacyGame(slug: string) {
  return Boolean(getLegacyGamePath(slug));
}

export function buildLegacyGameUrl(
  slug: string,
  search?: {
    practice?: boolean;
    create?: boolean;
    challenge?: string;
    tournament?: string;
  },
) {
  const path = getLegacyGamePath(slug);
  if (!path) return null;

  const params = new URLSearchParams();

  if (search?.practice || search?.create) {
    params.set("practice", "1");
  }

  if (search?.challenge) {
    params.set("challenge", search.challenge);
  }

  if (search?.tournament) {
    params.set("tournament", search.tournament);
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
