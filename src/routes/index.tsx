import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { GameCard } from "@/components/arcade/game-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  listGames,
  listLiveGames,
} from "@/games/registry";
import {
  loadMonetConfig,
} from "@/services/monet-config";
import {
  listTournaments,
} from "@/services/tournaments";
import { useWallet } from "@/services/wallet";
import {
  formatMonet,
  formatSol,
  formatUsd,
} from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const games = listGames();

  const featured =
    games.find((g) => g.featured) ??
    listLiveGames()[0];

  const rest = games
    .filter((g) => g.id !== featured?.id)
    .slice(0, 6);

  const {
    connected,
    monet,
    sol,
    connectPhantom,
  } = useWallet();

  const config = useQuery({
    queryKey: ["monet-config"],
    queryFn: loadMonetConfig,
  });

  const tournaments = useQuery({
    queryKey: ["tournaments", "all"],
    queryFn: () => listTournaments(),
  });

  const challengeSplit =
    config.data
      ? `${Math.round(
          config.data.winnerPercent * 100,
        )}/${Math.round(
          config.data.treasuryPercent * 100,
        )} pot split`
      : config.isError
        ? "Live payout configuration unavailable"
        : "Loading live payout rules…";

  return (
    <ArcadeShell>
      <section className="relative overflow-hidden rounded-xl border border-primary/25 bg-bg-elev px-5 py-12 text-center md:px-10 md:py-16">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-primary">
          Insert coin to earn
        </p>

        <h1
          className="hero-glitch mt-4 text-6xl md:text-8xl"
          data-text="MONET MONEY"
        >
          MONET MONEY
        </h1>

        <p className="mt-3 bg-gradient-to-r from-primary to-accent bg-clip-text font-display text-2xl tracking-[0.16em] text-transparent md:text-4xl">
          PLAY. EARN. ESCAPE.
        </p>

        <p className="mt-3 text-sm uppercase tracking-[0.18em] text-muted">
          The arcade where{" "}
          <span className="text-primary">
            memes
          </span>{" "}
          print money.
        </p>

        <p className="mx-auto mt-4 max-w-lg text-sm text-muted">
          Better have my Monet. Original skill games
          on Solana — practice free, challenge a
          friend, or cash out the pot.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link to="/games">
              Play games
            </Link>
          </Button>

          <Button
            asChild
            variant="secondary"
          >
            <Link to="/leaderboards">
              Leaderboard
            </Link>
          </Button>
        </div>

        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-primary/25 bg-primary/10 px-4 py-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
            Monet balance
          </span>

          <span className="tabular text-sm font-semibold text-primary">
            {connected
              ? formatMonet(monet)
              : "Connect wallet"}
          </span>
        </div>
      </section>

      <section className="mt-6 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Entry fee"
          value={
            config.data
              ? formatUsd(
                  config.data.entryUsd,
                )
              : config.isError
                ? "Unavailable"
                : "Loading…"
          }
        />

        <Stat
          label="Winner cut"
          value={
            config.data
              ? `${Math.round(
                  config.data
                    .winnerPercent * 100,
                )}%`
              : config.isError
                ? "Unavailable"
                : "Loading…"
          }
        />

        <Stat
          label="Games"
          value={`${games.length} live`}
        />

        <Stat
          label="Network"
          value={
            config.data
              ? config.data.network
              : config.isError
                ? "Unavailable"
                : "Loading…"
          }
        />
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            to: "/games",
            title: "Play games",
            desc: `${games.length} arcade titles · win prizes`,
          },
          {
            to: "/exchange",
            title: "Exchange",
            desc: "Buy MONET via Jupiter · PayPal packages",
          },
          {
            to: "/portfolio",
            title: "Portfolio",
            desc: "Wallet & token balances · PnL tracker",
          },
          {
            to: "/leaderboards",
            title: "Leaderboard",
            desc: "Top scores & global rankings",
          },
          {
            to: "/challenges",
            title: "Challenge",
            desc: `H2H · live lobby · ${challengeSplit}`,
          },
          {
            to: "/tournaments",
            title: "Tournament",
            desc: "Multi-player · top 3 paid out",
          },
        ].map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-xl border border-border bg-bg-elev p-4 transition-colors hover:border-primary/50"
          >
            <p className="font-display text-xl tracking-wide">
              {card.title}
            </p>

            <p className="mt-1 text-sm text-muted">
              {card.desc}
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
            Wallet
          </p>

          {connected ? (
            <>
              <p className="mt-3 font-display text-4xl tracking-wide text-primary tabular">
                {formatMonet(monet)}
              </p>

              <p className="text-xs uppercase tracking-wide text-muted">
                {config.data?.symbol ??
                  "Token"}
              </p>

              <p className="mt-3 text-lg tabular">
                {formatSol(sol)} SOL
              </p>

              <Button
                asChild
                className="mt-5 w-full"
                variant="secondary"
              >
                <Link to="/wallet">
                  Manage wallet
                </Link>
              </Button>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted">
                Connect your Phantom wallet to use
                Monet Money Arcade on Solana
                mainnet.
              </p>

              <Button
                className="mt-5 w-full"
                onClick={() =>
                  connectPhantom()
                }
              >
                Connect wallet
              </Button>
            </>
          )}

          <p className="mt-3 text-[11px] text-subtle">
            Production payments and configuration
            are verified by the Monet backend.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-bg-elev p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
            $MONET contract
          </p>

          <p className="mt-3 break-all font-mono text-xs text-ice">
            {config.data
              ? config.data.mint
              : config.isError
                ? "Backend configuration unavailable"
                : "Loading contract…"}
          </p>

          <p className="mt-3 text-sm text-muted">
            {config.data
              ? `Entry ${formatMonet(
                  config.data.entryMonet,
                )} ${config.data.symbol} per paid game · H2H & tournament winners paid in ${config.data.symbol}.`
              : config.isError
                ? "Entry configuration unavailable."
                : "Loading entry configuration…"}
          </p>

          {config.data ? (
            <Button
              asChild
              className="mt-4"
              variant="secondary"
            >
              <a
                href={`https://raydium.io/swap/?inputMint=sol&outputMint=${encodeURIComponent(
                  config.data.mint,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Buy $MONET on Raydium
              </a>
            </Button>
          ) : null}
        </div>
      </section>

      {featured ? (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-3xl tracking-wide">
              Featured
            </h2>

            <Badge tone="primary">
              Live
            </Badge>
          </div>

          <GameCard
            game={featured}
            featured
          />
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-wide">
            On the floor
          </h2>

          <Link
            to="/games"
            className="text-sm text-primary"
          >
            All games
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((g) => (
            <GameCard
              key={g.id}
              game={g}
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-wide">
            Tournaments
          </h2>

          <Link
            to="/tournaments"
            className="text-sm text-primary"
          >
            View all
          </Link>
        </div>

        {tournaments.isLoading ? (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            Loading live tournaments…
          </div>
        ) : null}

        {tournaments.isError ? (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            Tournament service currently
            unavailable.
          </div>
        ) : null}

        {tournaments.data &&
        tournaments.data.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="font-display text-xl tracking-wide">
              No tournaments open yet
            </p>

            <p className="mt-1 text-sm text-muted">
              Create the first tournament from
              the tournament lobby.
            </p>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          {tournaments.data
            ?.slice(0, 2)
            .map((t) => (
              <Link
                key={t.id}
                to="/tournaments"
                className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-xl tracking-wide">
                    {t.title}
                  </p>

                  <Badge>
                    {t.status}
                  </Badge>
                </div>

                {t.note ? (
                  <p className="mt-1 text-sm text-muted">
                    {t.note}
                  </p>
                ) : null}

                <p className="mt-3 text-xs tabular text-primary">
                  Prize{" "}
                  {formatMonet(
                    t.prizeMonet,
                  )}{" "}
                  {config.data?.symbol ??
                    "token"}{" "}
                  · {t.players}/{t.cap} players
                </p>
              </Link>
            ))}
        </div>
      </section>

      <footer className="mt-12 border-t border-border pt-6 text-center text-[11px] uppercase tracking-[0.16em] text-subtle">
        For those who aren't made of money,
        better have your Monet.
        <span className="mt-2 block">
          © Monet Money Arcade · Built on
          Solana
        </span>
      </footer>
    </ArcadeShell>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-subtle">
        {label}
      </p>

      <p className="mt-1 font-display text-2xl tracking-wide">
        {value}
      </p>
    </div>
  );
}
