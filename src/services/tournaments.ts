import { apiOrigin } from "./monet-config";

export type TournamentStatus =
  | "upcoming"
  | "open"
  | "active"
  | "completed";

export type TournamentPayout = {
  firstPercent: number;
  secondPercent: number;
  thirdPercent: number;
  treasuryPercent: number;
};

export type Tournament = {
  id: string;
  title: string;
  gameId: string;
  status: TournamentStatus;

  entryMonet: number;
  entryFeeBaseUnits: number;

  prizeMonet: number;
  grossPotBaseUnits: number;
  prizePoolBaseUnits: number;

  payoutBaseUnits: {
    first: number;
    second: number;
    third: number;
    treasury: number;
  };

  players: number;
  cap: number;

  startsAt: string;
  note: string;

  payout: TournamentPayout;

  createdAt: number;
  updatedAt: number;
};

type TournamentListResponse = {
  ok: boolean;
  tournaments?: Tournament[];
  error?: string;
};

type TournamentResponse = {
  ok: boolean;
  tournament?: Tournament;
  error?: string;
};

function errorMessage(
  payload: unknown,
  fallback: string,
) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallback;
}

export async function listTournaments(
  gameId?: string,
): Promise<Tournament[]> {
  const query = gameId
    ? `?game=${encodeURIComponent(gameId)}`
    : "";

  const response = await fetch(
    `${apiOrigin()}/api/tournaments${query}`,
    {
      cache: "no-store",
    },
  );

  const payload =
    (await response.json()) as TournamentListResponse;

  if (!response.ok || !payload.ok) {
    throw new Error(
      errorMessage(
        payload,
        `Tournament request failed (${response.status})`,
      ),
    );
  }

  if (!Array.isArray(payload.tournaments)) {
    throw new Error(
      "Backend returned invalid tournament data",
    );
  }

  return payload.tournaments;
}

export async function getTournament(
  id: string,
): Promise<Tournament> {
  const response = await fetch(
    `${apiOrigin()}/api/tournaments/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
    },
  );

  const payload =
    (await response.json()) as TournamentResponse;

  if (
    !response.ok ||
    !payload.ok ||
    !payload.tournament
  ) {
    throw new Error(
      errorMessage(
        payload,
        `Tournament request failed (${response.status})`,
      ),
    );
  }

  return payload.tournament;
}

export type CreateTournamentInput = {
  wallet: string;
  signature: string;
  gameId: string;
  cap: number;
  title?: string;
  startsAt?: string;
  note?: string;
};

export async function createTournament(
  input: CreateTournamentInput,
): Promise<Tournament> {
  const response = await fetch(
    `${apiOrigin()}/api/tournaments`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  const payload =
    (await response.json()) as TournamentResponse;

  if (
    !response.ok ||
    !payload.ok ||
    !payload.tournament
  ) {
    throw new Error(
      errorMessage(
        payload,
        `Tournament creation failed (${response.status})`,
      ),
    );
  }

  return payload.tournament;
}

export type JoinTournamentInput = {
  wallet: string;
  signature: string;
};

export async function joinTournament(
  tournamentId: string,
  input: JoinTournamentInput,
): Promise<Tournament> {
  const response = await fetch(
    `${apiOrigin()}/api/tournaments/${encodeURIComponent(tournamentId)}/join`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  const payload =
    (await response.json()) as TournamentResponse;

  if (
    !response.ok ||
    !payload.ok ||
    !payload.tournament
  ) {
    throw new Error(
      errorMessage(
        payload,
        `Tournament entry failed (${response.status})`,
      ),
    );
  }

  return payload.tournament;
}
