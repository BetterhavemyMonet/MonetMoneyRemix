import { apiOrigin } from "./monet-config";

export type LiveChallenge = {
  id: string;
  code: string;
  game: string;
  status: string;
  paymentType: "monet" | "sol";
  wagerUsd: number;
  entryFeeMonet: number | null;
  entryFeeBaseUnits: number | null;
  entryFeeSolLamports: number | null;
  expiresAt: number;
};

type CreateChallengeResponse = {
  ok: boolean;
  challenge?: LiveChallenge;
  error?: string;
};

export async function createLiveChallenge(input: {
  wallet: string;
  game: string;
  signature: string;
  wagerUsd: number;
}): Promise<LiveChallenge> {
  const response = await fetch(
    `${apiOrigin()}/api/challenge/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wallet: input.wallet,
        game: input.game,
        signature: input.signature,
        paymentType: "monet",
        wagerUsd: input.wagerUsd,
      }),
    },
  );

  const data =
    (await response.json().catch(() => ({}))) as CreateChallengeResponse;

  if (!response.ok || !data.ok || !data.challenge) {
    throw new Error(
      data.error || "Unable to create challenge",
    );
  }

  return data.challenge;
}

export type ChallengeLobbyEntry = {
  id: string;
  code: string;
  game: string;
  status: string;
  paymentType: "monet" | "sol";
  wagerUsd: number;
  entryFeeMonet: number | null;
  entryFeeBaseUnits: number | null;
  entryFeeSolLamports: number | null;
  potBaseUnits: number | null;
  createdAt: number;
  expiresAt: number;
  player: string | null;
};

type ChallengeLobbyResponse = {
  ok: boolean;
  challenges?: ChallengeLobbyEntry[];
  error?: string;
};

export async function listLiveChallenges(
  wallet?: string | null,
): Promise<ChallengeLobbyEntry[]> {
  const query = wallet
    ? `?wallet=${encodeURIComponent(wallet)}`
    : "";

  const response = await fetch(
    `${apiOrigin()}/api/challenges${query}`,
    {
      cache: "no-store",
    },
  );

  const data =
    (await response.json().catch(() => ({}))) as ChallengeLobbyResponse;

  if (!response.ok || !data.ok) {
    throw new Error(
      data.error || "Unable to load live challenges",
    );
  }

  return Array.isArray(data.challenges)
    ? data.challenges
    : [];
}

export type JoinedChallenge = {
  id: string;
  code: string;
  game: string;
  status: string;
  wagerUsd: number;
  entryFeeMonet: number | null;
  entryFeeBaseUnits: number | null;
  grossPotBaseUnits: number;
  winnerPayoutBaseUnits: number;
  treasuryBaseUnits: number;
  player1: string;
  player2: string;
};

type JoinChallengeResponse = {
  ok: boolean;
  challenge?: JoinedChallenge;
  error?: string;
};

export async function joinLiveChallenge(input: {
  challengeId: string;
  wallet: string;
  signature: string;
  paymentType: "monet" | "sol";
}): Promise<JoinedChallenge> {
  const response = await fetch(
    `${apiOrigin()}/api/challenge/join`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        challengeId: input.challengeId,
        wallet: input.wallet,
        signature: input.signature,
        paymentType: input.paymentType,
      }),
    },
  );

  const data =
    (await response.json().catch(() => ({}))) as JoinChallengeResponse;

  if (!response.ok || !data.ok || !data.challenge) {
    throw new Error(
      data.error || "Unable to join challenge",
    );
  }

  return data.challenge;
}
