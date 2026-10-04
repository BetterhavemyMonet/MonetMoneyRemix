/**
 * Read-only snapshot of the existing Monet backend contract.
 * Live values are fetched from /api/config when CORS allows.
 * Payments, treasury, and PayPal capture stay on that backend.
 */

export type MonetConfig = {
  mint: string;
  symbol: string;
  decimals: number;
  treasuryAddress: string;
  entryMonet: number;
  entryUsd: number;
  entrySol: number;
  winnerPercent: number;
  treasuryPercent: number;
  wagersUsd: number[];
  paypalUsd: number[];
  network: string;
  publicRpcUrl: string;
};

export const FALLBACK_CONFIG: MonetConfig = {
  mint: "6eACLGXCGdw9D5zb5eBKyFnFNTX9pTihDEpZQ7gYAX1b",
  symbol: "MONET",
  decimals: 6,
  treasuryAddress: "epktxKugBkeft5ZCdv4SCLdsHA1HsMueLod5nXUDQQw",
  entryMonet: 0.0125,
  entryUsd: 0.99,
  entrySol: 0.008,
  winnerPercent: 0.8,
  treasuryPercent: 0.2,
  wagersUsd: [0.99, 4.99, 9.99],
  paypalUsd: [10, 20, 50, 100],
  network: "mainnet-beta",
  publicRpcUrl: "https://api.mainnet-beta.solana.com",
};

export const LIVE_API = "https://monet-backend-95vi.onrender.com";

export function apiOrigin() {
  return (import.meta.env.VITE_ARCADE_API_BASE as string | undefined) || LIVE_API;
}

let cached: MonetConfig | null = null;
let inflight: Promise<MonetConfig> | null = null;

function fromPayload(d: Record<string, unknown>): MonetConfig {
  const token = (d.token ?? {}) as Record<string, unknown>;
  const entry = (d.entry ?? {}) as Record<string, unknown>;
  const payout = (d.payout ?? {}) as Record<string, unknown>;
  const challenge = (d.challenge ?? {}) as Record<string, unknown>;
  const paypal = (d.paypal ?? {}) as Record<string, unknown>;
  return {
    mint: String(token.mint || FALLBACK_CONFIG.mint),
    symbol: String(token.symbol || "MONET"),
    decimals: Number(token.decimals ?? 6),
    treasuryAddress: String(d.treasuryAddress || FALLBACK_CONFIG.treasuryAddress),
    entryMonet: Number(entry.monet ?? FALLBACK_CONFIG.entryMonet),
    entryUsd: Number(entry.usd ?? FALLBACK_CONFIG.entryUsd),
    entrySol: Number(entry.sol ?? FALLBACK_CONFIG.entrySol),
    winnerPercent: Number(payout.winnerPercent ?? 0.8),
    treasuryPercent: Number(payout.treasuryPercent ?? 0.2),
    wagersUsd: Array.isArray(challenge.wagersUsd)
      ? (challenge.wagersUsd as number[])
      : FALLBACK_CONFIG.wagersUsd,
    paypalUsd: Array.isArray(paypal.packagesUsd)
      ? (paypal.packagesUsd as number[])
      : FALLBACK_CONFIG.paypalUsd,
    network: String(d.network || "mainnet-beta"),
    publicRpcUrl: String(d.publicRpcUrl || FALLBACK_CONFIG.publicRpcUrl),
  };
}

export async function loadMonetConfig(): Promise<MonetConfig> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${apiOrigin()}/api/config`, { cache: "no-store" });
      if (!res.ok) throw new Error("config");
      const d = (await res.json()) as Record<string, unknown>;
      cached = fromPayload(d);
      return cached;
    } catch {
      cached = FALLBACK_CONFIG;
      return cached;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function jupiterSwapUrl(mint: string) {
  return `https://jup.ag/swap/SOL-${mint}`;
}

export function raydiumSwapUrl(mint: string) {
  return `https://raydium.io/swap/?inputMint=sol&outputMint=${mint}`;
}

export function solscanTokenUrl(mint: string) {
  return `https://solscan.io/token/${mint}`;
}
