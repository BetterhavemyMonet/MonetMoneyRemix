import type { GameCategory, GameManifest, GameModule, GameStatus } from "./types";

const modules = import.meta.glob("./titles/*.ts", { eager: true }) as Record<
  string,
  { manifest?: GameManifest; mount?: GameModule["mount"] }
>;

const loaded: GameModule[] = [];
for (const mod of Object.values(modules)) {
  if (mod?.manifest) {
    loaded.push({
      manifest: mod.manifest,
      mount: mod.mount ?? (() => () => undefined),
    });
  }
}

loaded.sort((a, b) => (a.manifest.order ?? 99) - (b.manifest.order ?? 99) || a.manifest.title.localeCompare(b.manifest.title));

export function listGames() {
  return loaded.map((g) => g.manifest).filter((g) => g.status !== "disabled");
}

export function listLiveGames() {
  return listGames().filter((g) => g.status === "live" || g.status === "new" || g.status === "beta");
}

export function getGame(slug: string) {
  return loaded.find((g) => g.manifest.slug === slug || g.manifest.id === slug || g.manifest.backendGameId === slug);
}

export function getManifest(slug: string) {
  return getGame(slug)?.manifest;
}

export function categoriesFromRegistry(): GameCategory[] {
  return [...new Set(listGames().map((g) => g.category))];
}

export function gamesForFilter(filter: string) {
  const all = listGames();
  const key = filter.toLowerCase();
  if (!key || key === "all") return all;
  if (key === "new") return all.filter((g) => g.new || g.status === "new");
  if (key === "coming soon" || key === "coming-soon") {
    return all.filter((g) => g.status === "coming-soon");
  }
  if (key === "multiplayer") return all.filter((g) => g.features.multiplayer);
  return all.filter((g) => g.category.toLowerCase() === key);
}

export function gamesWithFeature(feature: keyof GameManifest["features"]) {
  return listLiveGames().filter((g) => g.features[feature]);
}

export function searchGames(q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return listGames();
  return listGames().filter(
    (g) =>
      g.title.toLowerCase().includes(s) ||
      g.description.toLowerCase().includes(s) ||
      g.category.toLowerCase().includes(s) ||
      g.blurb.toLowerCase().includes(s),
  );
}

export function statusTone(status: GameStatus) {
  if (status === "live") return "ok" as const;
  if (status === "new" || status === "beta") return "primary" as const;
  if (status === "coming-soon") return "accent" as const;
  if (status === "maintenance") return "warn" as const;
  return "muted" as const;
}
