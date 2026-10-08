/**
 * Authoritative Monet backend configuration.
 *
 * Production token, treasury, pricing, payout, challenge,
 * PayPal, network and RPC values come from /api/config.
 *
 * This service intentionally fails closed when required
 * backend configuration is unavailable or malformed.
 */

export type ChallengeWager = {
  usd: number;
  monet: number;
  baseUnits: number;
};

export type TournamentPayout = {
  firstPercent: number;
  secondPercent: number;
  thirdPercent: number;
  treasuryPercent: number;
};

export type MonetConfig = {
  mint: string;
  symbol: string;
  decimals: number;
  treasuryAddress: string;
  entryMonet: number;
  entryUsd: number;
  entrySol: number | null;
  winnerPercent: number;
  treasuryPercent: number;
  challengeWagers: ChallengeWager[];
  tournamentFieldSizes: number[];
  tournamentPayout: TournamentPayout;
  paypalUsd: number[];
  network: string;
  publicRpcUrl: string;
};

export const LIVE_API =
  "https://monet-backend-95vi.onrender.com";

export function apiOrigin() {
  return (
    import.meta.env.VITE_ARCADE_API_BASE as
      | string
      | undefined
  ) || LIVE_API;
}

let cached: MonetConfig | null = null;
let cachedAt = 0;
const CONFIG_CACHE_MS = 60_000;
let inflight: Promise<MonetConfig> | null = null;

function requiredString(
  value: unknown,
  name: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `Backend config missing ${name}`,
    );
  }

  return value.trim();
}

function requiredNumber(
  value: unknown,
  name: string,
): number {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(
      `Backend config missing ${name}`,
    );
  }

  return number;
}

function positiveNumber(
  value: unknown,
  name: string,
): number {
  const number = requiredNumber(value, name);

  if (number <= 0) {
    throw new Error(
      `Backend config has invalid ${name}`,
    );
  }

  return number;
}

function percent(
  value: unknown,
  name: string,
): number {
  const number = requiredNumber(value, name);

  if (number < 0 || number > 1) {
    throw new Error(
      `Backend config has invalid ${name}`,
    );
  }

  return number;
}

function fromPayload(
  d: Record<string, unknown>,
): MonetConfig {
  const token =
    (d.token ?? {}) as Record<string, unknown>;

  const entry =
    (d.entry ?? {}) as Record<string, unknown>;

  const payout =
    (d.payout ?? {}) as Record<string, unknown>;

  const challenge =
    (d.challenge ?? {}) as Record<string, unknown>;

  const tournament =
    (d.tournament ?? {}) as Record<string, unknown>;

  const tournamentPayout =
    (tournament.payout ?? {}) as Record<string, unknown>;

  const paypal =
    (d.paypal ?? {}) as Record<string, unknown>;

  const challengeWagers =
    Array.isArray(challenge.wagers)
      ? (
          challenge.wagers as Record<
            string,
            unknown
          >[]
        )
          .map((wager) => ({
            usd: Number(wager.usd),
            monet: Number(wager.monet),
            baseUnits: Number(wager.baseUnits),
          }))
          .filter(
            (wager) =>
              Number.isFinite(wager.usd) &&
              Number.isFinite(wager.monet) &&
              Number.isFinite(
                wager.baseUnits,
              ) &&
              wager.usd > 0 &&
              wager.monet > 0 &&
              wager.baseUnits > 0,
          )
      : [];

  const tournamentFieldSizes =
    Array.isArray(tournament.fieldSizes)
      ? tournament.fieldSizes
          .map(Number)
          .filter(
            (value) =>
              Number.isSafeInteger(value) &&
              value > 1,
          )
      : [];

  if (tournamentFieldSizes.length === 0) {
    throw new Error(
      "Backend config missing tournament.fieldSizes",
    );
  }

  const parsedTournamentPayout: TournamentPayout = {
    firstPercent: percent(
      tournamentPayout.firstPercent,
      "tournament.payout.firstPercent",
    ),

    secondPercent: percent(
      tournamentPayout.secondPercent,
      "tournament.payout.secondPercent",
    ),

    thirdPercent: percent(
      tournamentPayout.thirdPercent,
      "tournament.payout.thirdPercent",
    ),

    treasuryPercent: percent(
      tournamentPayout.treasuryPercent,
      "tournament.payout.treasuryPercent",
    ),
  };

  const paypalUsd =
    Array.isArray(paypal.packagesUsd)
      ? paypal.packagesUsd
          .map(Number)
          .filter(
            (value) =>
              Number.isFinite(value) &&
              value > 0,
          )
      : [];

  const config: MonetConfig = {
    mint: requiredString(
      token.mint,
      "token.mint",
    ),

    symbol: requiredString(
      token.symbol,
      "token.symbol",
    ),

    decimals: requiredNumber(
      token.decimals,
      "token.decimals",
    ),

    treasuryAddress: requiredString(
      d.treasuryAddress,
      "treasuryAddress",
    ),

    entryMonet: positiveNumber(
      entry.monet,
      "entry.monet",
    ),

    entryUsd: positiveNumber(
      entry.usd,
      "entry.usd",
    ),

    entrySol:
      entry.sol == null
        ? null
        : positiveNumber(entry.sol, "entry.sol"),

    winnerPercent: percent(
      payout.winnerPercent,
      "payout.winnerPercent",
    ),

    treasuryPercent: percent(
      payout.treasuryPercent,
      "payout.treasuryPercent",
    ),

    challengeWagers,

    tournamentFieldSizes,
    tournamentPayout: parsedTournamentPayout,

    paypalUsd,

    network: requiredString(
      d.network,
      "network",
    ),

    publicRpcUrl: requiredString(
      d.publicRpcUrl,
      "publicRpcUrl",
    ),
  };

  const tournamentPayoutTotal =
    config.tournamentPayout.firstPercent +
    config.tournamentPayout.secondPercent +
    config.tournamentPayout.thirdPercent +
    config.tournamentPayout.treasuryPercent;

  if (
    Math.abs(tournamentPayoutTotal - 1) >
    0.000001
  ) {
    throw new Error(
      "Backend tournament payout percentages do not total 100%",
    );
  }

  const payoutTotal =
    config.winnerPercent +
    config.treasuryPercent;

  if (
    Math.abs(payoutTotal - 1) >
    0.000001
  ) {
    throw new Error(
      "Backend payout percentages do not total 100%",
    );
  }

  return config;
}

export async function loadMonetConfig():
  Promise<MonetConfig> {
  if (
    cached &&
    Date.now() - cachedAt < CONFIG_CACHE_MS
  ) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(
        `${apiOrigin()}/api/config`,
        {
          cache: "no-store",
        },
      );

      if (!res.ok) {
        throw new Error(
          `Backend config request failed (${res.status})`,
        );
      }

      const data =
        (await res.json()) as Record<
          string,
          unknown
        >;

      cached = fromPayload(data);
      cachedAt = Date.now();

      return cached;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function jupiterSwapUrl(
  mint: string,
) {
  return `https://jup.ag/swap/SOL-${mint}`;
}

export function raydiumSwapUrl(
  mint: string,
) {
  return `https://raydium.io/swap/?inputMint=sol&outputMint=${mint}`;
}

export function solscanTokenUrl(
  mint: string,
) {
  return `https://solscan.io/token/${mint}`;
}
