import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getManifest,
  listLiveGames,
} from "@/games/registry";
import {
  createTournament,
  joinTournament,
  listTournaments,
  type Tournament,
  type TournamentStatus,
} from "@/services/tournaments";
import {
  loadMonetConfig,
} from "@/services/monet-config";
import { payMonetEntry } from "@/services/solana-payment";
import { useWallet } from "@/services/wallet";
import { formatMonet } from "@/lib/utils";
import { toast } from "sonner";

type Search = {
  game?: string;
};

export const Route = createFileRoute("/tournaments")({
  validateSearch: (
    s: Record<string, unknown>,
  ): Search => ({
    game:
      typeof s.game === "string"
        ? s.game
        : undefined,
  }),
  component: TournamentsPage,
});

const order: TournamentStatus[] = [
  "open",
  "active",
  "upcoming",
  "completed",
];

function percentLabel(value: number) {
  return `${Math.round(value * 100)}%`;
}

function TournamentsPage() {
  const { game } = Route.useSearch();
  const games = listLiveGames();
  const wallet = useWallet();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [createGame, setCreateGame] = useState(
    game ?? games[0]?.id ?? "",
  );
  const [fieldSize, setFieldSize] =
    useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] =
    useState<string | null>(null);

  const config = useQuery({
    queryKey: ["monet-config"],
    queryFn: loadMonetConfig,
  });

  const tournaments = useQuery({
    queryKey: ["tournaments", game ?? "all"],
    queryFn: () => listTournaments(game),
  });

  const fieldSizes =
    config.data?.tournamentFieldSizes ?? [];

  const selectedFieldSize =
    fieldSize &&
    fieldSizes.includes(fieldSize)
      ? fieldSize
      : fieldSizes[0] ?? null;

  const ensureWallet = async () => {
    let address = wallet.address;

    if (!wallet.connected || !address) {
      const connected =
        await wallet.connectPhantom();

      if (!connected) {
        throw new Error(
          "Connect Phantom to continue",
        );
      }

      address =
        useWallet.getState().address;
    }

    if (!address) {
      throw new Error(
        "Wallet address unavailable",
      );
    }

    return address;
  };

  const createLiveTournament = async () => {
    if (creating) return;

    try {
      setCreating(true);

      if (!config.data) {
        throw new Error(
          "Live tournament configuration is unavailable",
        );
      }

      if (!createGame) {
        throw new Error(
          "Choose a tournament game",
        );
      }

      if (!selectedFieldSize) {
        throw new Error(
          "Tournament field sizes are unavailable",
        );
      }

      const address =
        await ensureWallet();

      const entry =
        config.data.entryMonet;

      toast.message(
        `Approve ${formatMonet(entry)} ${config.data.symbol} tournament entry in Phantom…`,
      );

      const signature =
        await payMonetEntry(
          address,
          createGame,
          entry,
        );

      toast.message(
        "Payment sent. Verifying tournament creation on-chain…",
      );

      const created =
        await createTournament({
          wallet: address,
          signature,
          gameId: createGame,
          cap: selectedFieldSize,
          title:
            title.trim() || undefined,
        });

      sessionStorage.setItem(
        "tournament_session",
        JSON.stringify({
          tournamentId: created.id,
          txId: signature,
          game: created.gameId,
          entryFee: created.entryMonet,
          role: "creator",
        }),
      );

      toast.success(
        `Tournament created — you are player 1 of ${created.cap}`,
      );

      setTitle("");

      await qc.invalidateQueries({
        queryKey: ["tournaments"],
      });
    } catch (error) {
      console.error(
        "[TOURNAMENT CREATE]",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create tournament",
      );
    } finally {
      setCreating(false);
    }
  };

  const joinLiveTournament = async (
    tournament: Tournament,
  ) => {
    if (joiningId) return;

    try {
      setJoiningId(tournament.id);

      if (tournament.status !== "open") {
        throw new Error(
          "This tournament is not open for entry",
        );
      }

      if (
        !Number.isFinite(
          tournament.entryMonet,
        ) ||
        tournament.entryMonet <= 0
      ) {
        throw new Error(
          "Tournament is missing its locked backend entry amount",
        );
      }

      const address =
        await ensureWallet();

      const symbol =
        config.data?.symbol;

      if (!symbol) {
        throw new Error(
          "Live token configuration is unavailable",
        );
      }

      toast.message(
        `Approve ${formatMonet(tournament.entryMonet)} ${symbol} tournament entry in Phantom…`,
      );

      const signature =
        await payMonetEntry(
          address,
          tournament.gameId,
          tournament.entryMonet,
        );

      toast.message(
        "Payment sent. Verifying tournament entry on-chain…",
      );

      const joined =
        await joinTournament(
          tournament.id,
          {
            wallet: address,
            signature,
          },
        );

      sessionStorage.setItem(
        "tournament_session",
        JSON.stringify({
          tournamentId: joined.id,
          txId: signature,
          game: joined.gameId,
          entryFee: joined.entryMonet,
          role: "entrant",
        }),
      );

      toast.success(
        `Joined ${joined.title}`,
      );

      await qc.invalidateQueries({
        queryKey: ["tournaments"],
      });

      const manifest =
        getManifest(joined.gameId);

      if (!manifest) {
        throw new Error(
          "Tournament joined, but the game route is unavailable",
        );
      }

      await navigate({
        to: "/games/$slug",
        params: {
          slug: manifest.slug,
        },
        search: {
          tournament: joined.id,
        },
      });
    } catch (error) {
      console.error(
        "[TOURNAMENT JOIN]",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to join tournament",
      );
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <ArcadeShell>
      <h1 className="font-display text-4xl tracking-wide">
        Tournaments
      </h1>

      <p className="mt-1 max-w-xl text-sm text-muted">
        Pay entry · play to score · top 3 share
        the pot. Tournament rules and payouts are
        loaded from the Monet backend.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {config.data ? (
          [
            [
              "1st",
              `${percentLabel(
                config.data.tournamentPayout
                  .firstPercent,
              )} of pot`,
            ],
            [
              "2nd",
              `${percentLabel(
                config.data.tournamentPayout
                  .secondPercent,
              )} of pot`,
            ],
            [
              "3rd",
              `${percentLabel(
                config.data.tournamentPayout
                  .thirdPercent,
              )} of pot`,
            ],
            [
              "House",
              `${percentLabel(
                config.data.tournamentPayout
                  .treasuryPercent,
              )} rake`,
            ],
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">
                {k}
              </p>

              <p className="font-display text-xl tracking-wide">
                {v}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted sm:col-span-4">
            {config.isError
              ? "Tournament payout configuration unavailable."
              : "Loading tournament rules…"}
          </div>
        )}
      </div>

      <section className="mt-6 rounded-xl border border-primary/25 bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-wide">
              Create tournament
            </h2>

            <p className="mt-1 text-sm text-muted">
              Anyone can create one. Your entry is
              paid first and you become player #1.
            </p>
          </div>

          {config.data ? (
            <Badge>
              {formatMonet(
                config.data.entryMonet,
              )}{" "}
              {config.data.symbol} entry
            </Badge>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">
              Game
            </span>

            <select
              value={createGame}
              onChange={(e) =>
                setCreateGame(e.target.value)
              }
              className="w-full rounded-lg border border-border bg-bg-elev px-3 py-2"
            >
              {games.map((g) => (
                <option
                  key={g.id}
                  value={g.id}
                >
                  {g.title}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">
              Players
            </span>

            <select
              value={
                selectedFieldSize ?? ""
              }
              onChange={(e) =>
                setFieldSize(
                  Number(e.target.value),
                )
              }
              disabled={!fieldSizes.length}
              className="w-full rounded-lg border border-border bg-bg-elev px-3 py-2"
            >
              {fieldSizes.map((size) => (
                <option
                  key={size}
                  value={size}
                >
                  {size} players
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">
              Name
            </span>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              maxLength={80}
              placeholder="Optional tournament name"
              className="w-full rounded-lg border border-border bg-bg-elev px-3 py-2"
            />
          </label>
        </div>

        <Button
          className="mt-4"
          disabled={
            creating ||
            !config.data ||
            !selectedFieldSize ||
            !createGame
          }
          onClick={() =>
            void createLiveTournament()
          }
        >
          {creating
            ? "Creating…"
            : "Pay entry & create"}
        </Button>
      </section>

      {game ? (
        <p className="mt-4 text-sm text-ice">
          Filtered for{" "}
          {getManifest(game)?.title ?? game}
          {" · "}
          {config.data
            ? `${formatMonet(
                config.data.entryMonet,
              )} ${config.data.symbol} entry`
            : config.isError
              ? "entry unavailable"
              : "loading entry…"}
        </p>
      ) : null}

      {tournaments.isLoading ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          Loading live tournaments…
        </div>
      ) : null}

      {tournaments.isError ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <p className="font-display text-xl tracking-wide">
            Tournament service unavailable
          </p>

          <p className="mt-2 text-sm text-muted">
            {tournaments.error instanceof Error
              ? tournaments.error.message
              : "Unable to load tournaments."}
          </p>
        </div>
      ) : null}

      {tournaments.data &&
      tournaments.data.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <p className="font-display text-xl tracking-wide">
            No tournaments open yet
          </p>

          <p className="mt-2 text-sm text-muted">
            Be the first player to create one.
          </p>
        </div>
      ) : null}

      <div className="mt-6 space-y-8">
        {order.map((status) => {
          const items =
            tournaments.data?.filter(
              (t) => t.status === status,
            ) ?? [];

          if (!items.length) {
            return null;
          }

          return (
            <section key={status}>
              <h2 className="font-display text-2xl tracking-wide capitalize">
                {status}
              </h2>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {items.map((t) => {
                  const g =
                    getManifest(t.gameId);

                  return (
                    <article
                      key={t.id}
                      className="rounded-xl border border-border bg-surface p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-xl tracking-wide">
                            {t.title}
                          </p>

                          <p className="text-sm text-muted">
                            {g?.title ??
                              t.gameId}
                          </p>
                        </div>

                        <Badge>
                          {t.status}
                        </Badge>
                      </div>

                      {t.note ? (
                        <p className="mt-3 text-sm text-muted">
                          {t.note}
                        </p>
                      ) : null}

                      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-subtle">
                            Entry
                          </dt>

                          <dd className="tabular">
                            {formatMonet(
                              t.entryMonet,
                            )}{" "}
                            {config.data?.symbol ??
                              "Token"}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs uppercase tracking-wide text-subtle">
                            Prize pool
                          </dt>

                          <dd className="tabular">
                            {formatMonet(
                              t.prizeMonet,
                            )}{" "}
                            {config.data?.symbol ??
                              "Token"}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs uppercase tracking-wide text-subtle">
                            Field
                          </dt>

                          <dd>
                            {t.players}/{t.cap}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs uppercase tracking-wide text-subtle">
                            When
                          </dt>

                          <dd>{t.startsAt}</dd>
                        </div>
                      </dl>

                      {g &&
                      t.status === "open" ? (
                        <Button
                          className="mt-4"
                          size="sm"
                          disabled={
                            joiningId !== null
                          }
                          onClick={() =>
                            void joinLiveTournament(
                              t,
                            )
                          }
                        >
                          {joiningId === t.id
                            ? "Joining…"
                            : "Pay entry & join"}
                        </Button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-subtle">
        {config.data
          ? `Available field sizes: ${config.data.tournamentFieldSizes.join(
              " / ",
            )} players.`
          : config.isError
            ? "Tournament field configuration unavailable."
            : "Loading tournament field configuration…"}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
        {games.slice(0, 8).map((g) => (
          <span
            key={g.id}
            className="rounded-full border border-border px-3 py-1"
          >
            {g.title}
          </span>
        ))}
      </div>
    </ArcadeShell>
  );
}
