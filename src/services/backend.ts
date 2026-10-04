/**
 * Frontend compatibility adapter.
 *
 * The existing production backend (monet-backend / api.betterhavemymonet.com)
 * is a read-only external contract. This UI never signs treasury payouts,
 * PayPal captures, or on-chain transfers itself.
 */

import { apiOrigin, FALLBACK_CONFIG } from "./monet-config";

export type BackendMode = "live" | "sandbox";

export function backendMode(): BackendMode {
  return import.meta.env.VITE_ARCADE_API_BASE ? "live" : "sandbox";
}

export function apiBase() {
  return apiOrigin();
}

export const MONET_PER_SOL = Math.round(1 / Math.max(0.0000001, FALLBACK_CONFIG.entryMonet / (FALLBACK_CONFIG.entrySol || 0.008)));

export function quoteExchange(from: "SOL" | "MONET", amount: number) {
  if (amount <= 0) return 0;
  const rate = FALLBACK_CONFIG.entryMonet / Math.max(0.0000001, FALLBACK_CONFIG.entrySol);
  if (from === "SOL") return amount * rate;
  return amount / rate;
}

export type TournamentStatus = "upcoming" | "open" | "active" | "completed";

export type Tournament = {
  id: string;
  title: string;
  gameId: string;
  status: TournamentStatus;
  entryMonet: number;
  prizeMonet: number;
  players: number;
  cap: number;
  startsAt: string;
  note: string;
};

export const TOURNAMENTS: Tournament[] = [
  {
    id: "runner-open",
    title: "Monet Runner Open",
    gameId: "dino",
    status: "open",
    entryMonet: FALLBACK_CONFIG.entryMonet,
    prizeMonet: 40,
    players: 8,
    cap: 16,
    startsAt: "Live now",
    note: "Pay entry · play to score · top 3 share the pot (50 / 30 / 10, 10% house).",
  },
  {
    id: "kombat-cup",
    title: "Monet Kombat Cup",
    gameId: "fighter",
    status: "active",
    entryMonet: FALLBACK_CONFIG.entryMonet,
    prizeMonet: 24,
    players: 8,
    cap: 8,
    startsAt: "Live now",
    note: "Fast one-on-one arcade fighting. Bracket display until live match API attaches.",
  },
  {
    id: "realms-invitational",
    title: "Dino Realms Invitational",
    gameId: "dino-realms",
    status: "upcoming",
    entryMonet: FALLBACK_CONFIG.entryMonet,
    prizeMonet: 32,
    players: 0,
    cap: 16,
    startsAt: "Saturday 18:00 UTC",
    note: "Featured weekend. Wallet entry uses existing payment endpoints in live mode.",
  },
  {
    id: "rawr-classic",
    title: "Rawr-man Classic",
    gameId: "pacman",
    status: "completed",
    entryMonet: FALLBACK_CONFIG.entryMonet,
    prizeMonet: 18,
    players: 8,
    cap: 8,
    startsAt: "Last weekend",
    note: "Top 3 paid out in MONET.",
  },
];

export const RIVALS = ["NOVA-1C4", "RIFT-88Q", "HEX-3MN", "PULSAR-2", "ORBIT-K", "VEX-04"];
