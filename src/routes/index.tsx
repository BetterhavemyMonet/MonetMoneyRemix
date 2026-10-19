import { createFileRoute, Link } from "@tanstack/react-router";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { GameCard } from "@/components/arcade/game-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listGames, listLiveGames } from "@/games/registry";
import { TOURNAMENTS, backendMode } from "@/services/backend";
import { FALLBACK_CONFIG } from "@/services/monet-config";
import { useWallet } from "@/services/wallet";
import { formatMonet, formatSol, formatUsd } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const games = listGames();
  const featured = games.find((g) => g.featured) ?? listLiveGames()[0];
  const rest = games.filter((g) => g.id !== featured?.id).slice(0, 6);
  const { connected, monet, sol, connectGuest } = useWallet();
  const mode = backendMode();

  return (
    <ArcadeShell>
      <section className="relative overflow-hidden rounded-xl border border-primary/25 bg-bg-elev px-5 py-8 text-left md:px-8 md:py-10">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-primary">Insert coin</p>
        <h1 className="mt-3 font-display text-4xl tracking-wide md:text-6xl">Play the floor</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Production cabinets from betterhavemymonet.com, plus the games on this build. A round is {formatMonet(FALLBACK_CONFIG.entryMonet)} MONET, ${FALLBACK_CONFIG.entryUsd.toFixed(2)}, or the matching SOL amount in the connected wallet. Raise a match to $4.99 or $9.99. Head-to-head pays the winner {Math.round(FALLBACK_CONFIG.winnerPercent * 100)}% and the treasury 20%. Skill only. No chance cabinets.
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">Play. Earn. Escape. Better have my Monet.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button asChild><Link to="/challenges">Live lobby</Link></Button>
          <Button asChild variant="secondary"><Link to="/exchange">Exchange</Link></Button>
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/25 bg-primary/10 px-4 py-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Monet</span>
            <span className="tabular text-sm font-semibold text-primary">{connected ? formatMonet(monet) : "Connect wallet"}</span>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Entry fee" value={formatUsd(FALLBACK_CONFIG.entryUsd)} />
        <Stat label="Winner cut" value={`${Math.round(FALLBACK_CONFIG.winnerPercent * 100)}%`} />
        <Stat label="Games" value={`${games.length} live`} />
        <Stat label="Network" value="Solana" />
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { to: "/games", title: "Play games", desc: `${games.length} arcade titles · win prizes` },
          { to: "/exchange", title: "Exchange", desc: "Buy MONET via Jupiter · PayPal packages" },
          { to: "/portfolio", title: "Portfolio", desc: "Wallet & token balances · PnL tracker" },
          { to: "/leaderboards", title: "Leaderboard", desc: "Top scores & global rankings" },
          { to: "/challenges", title: "Challenge", desc: "H2H · live lobby · 80/20 pot split" },
          { to: "/tournaments", title: "Tournament", desc: "Multi-player · top 3 paid out" },
        ].map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-xl border border-border bg-bg-elev p-4 transition-colors hover:border-primary/50"
          >
            <p className="font-display text-xl tracking-wide">{card.title}</p>
            <p className="mt-1 text-sm text-muted">{card.desc}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Wallet</p>
          {connected ? (
            <>
              <p className="mt-3 font-display text-4xl tracking-wide text-primary tabular">{formatMonet(monet)}</p>
              <p className="text-xs uppercase tracking-wide text-muted">MONET</p>
              <p className="mt-3 text-lg tabular">{formatSol(sol)} SOL</p>
              <Button asChild className="mt-5 w-full" variant="secondary">
                <Link to="/wallet">Manage wallet</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted">
                Connect a guest arcade wallet to keep scores on this device. Phantom attaches when the
                extension is present.
              </p>
              <Button className="mt-5 w-full" onClick={() => connectGuest()}>
                Connect wallet
              </Button>
            </>
          )}
          <p className="mt-3 text-[11px] text-subtle">
            Mode: {mode === "live" ? "connected backend" : "sandbox adapter"} · payments stay on existing rails
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-elev p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">$MONET contract</p>
          <p className="mt-3 break-all font-mono text-xs text-ice">{FALLBACK_CONFIG.mint}</p>
          <p className="mt-3 text-sm text-muted">
            Entry {formatMonet(FALLBACK_CONFIG.entryMonet)} MONET per paid game · H2H & tournament
            winners paid in MONET.
          </p>
          <Button asChild className="mt-4" variant="secondary">
            <a href={`https://raydium.io/swap/?inputMint=sol&outputMint=${FALLBACK_CONFIG.mint}`} target="_blank" rel="noreferrer">
              Buy $MONET on Raydium
            </a>
          </Button>
        </div>
      </section>

      {featured ? (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-3xl tracking-wide">Featured</h2>
            <Badge tone="primary">Live</Badge>
          </div>
          <GameCard game={featured} featured />
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-wide">On the floor</h2>
          <Link to="/games" className="text-sm text-primary">
            All games
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-wide">Tournaments</h2>
          <Link to="/tournaments" className="text-sm text-primary">
            View all
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {TOURNAMENTS.slice(0, 2).map((t) => (
            <Link
              key={t.id}
              to="/tournaments"
              className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-xl tracking-wide">{t.title}</p>
                <Badge>{t.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">{t.note}</p>
              <p className="mt-3 text-xs tabular text-primary">
                Prize {formatMonet(t.prizeMonet)} MONET · {t.players}/{t.cap} players
              </p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-12 border-t border-border pt-6 text-center text-[11px] uppercase tracking-[0.16em] text-subtle">
        For those who aren't made of money, better have your Monet.
        <span className="mt-2 block">© Monet Money Arcade · Built on Solana</span>
      </footer>
    </ArcadeShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-subtle">{label}</p>
      <p className="mt-1 font-display text-2xl tracking-wide">{value}</p>
    </div>
  );
}
