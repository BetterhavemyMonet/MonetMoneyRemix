export type GameCategory =
  | "Platformer"
  | "Arcade"
  | "Puzzle"
  | "Racing"
  | "Shooter"
  | "Sports"
  | "Creator";

export type GameStatus = "live" | "beta" | "new" | "coming-soon" | "maintenance" | "disabled";

export type GameFeatures = {
  leaderboard: boolean;
  challenges: boolean;
  tournaments: boolean;
  multiplayer: boolean;
  controller: boolean;
};

export type GameManifest = {
  id: string;
  title: string;
  slug: string;
  description: string;
  blurb: string;
  category: GameCategory;
  thumbnail: string;
  route: string;
  backendGameId: string;
  status: GameStatus;
  features: GameFeatures;
  controls: string;
  featured?: boolean;
  new?: boolean;
  order?: number;
  artA?: string;
  artB?: string;
};

export type GameMountApi = {
  canvas: HTMLCanvasElement;
  reducedMotion: boolean;
};

export type GameModule = {
  manifest: GameManifest;
  mount: (api: GameMountApi) => () => void;
};
