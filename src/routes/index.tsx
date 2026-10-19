import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { ConnectWalletButton } from "@/components/arcade/connect-wallet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CABINETS, nightDraw } from "@/games/cabinets";
import { listGames } from "@/games/registry";
import { CabinetCard } from "@/components/arcade/cabinet-card";
import { TOURNAMENTS } from "@/services/backend";
import { FALLBACK_CONFIG, loadMonetConfig } from "@/services/monet-config";
import { useWallet } from "@/services/wallet";
import { formatMonet, formatSol } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const games = listGames();
  const floor = CABINETS.filter((g) => !g.extra);
  const featured = floor.filter((g) => g.featured);
  const draw = nightDraw();
  const extras = CABINETS.filter((g) => g.extra);
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Platformer", "Arcade", "Racing", "Shooter", "Puzzle", "Sports"];
  const shown = filter === "All" ? floor : floor.filter((g) => g.category === filter);
  const { connected, monet, sol } = useWallet();
  const live = useQuery({ queryKey: ["monet-config"], queryFn: () => loadMonetConfig() });
  const cfg = live.data ?? FALLBACK_CONFIG;

  return (
    <ArcadeShell>
      <section className="relative overflow-hidden rounded-xl border border-primary/25 bg-bg-elev px-5 py-8 text-left md:px-8 md:py-10">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-primary">Insert coin</p>
        <h1 className="mt-3 font-display text-4xl tracking-wide md:text-6xl">Play the floor</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Production cabinets from betterhavemymonet.com, plus the games on this build. A round is{" "}
          {formatMonet(cfg.entryMonet)} MONET, ${cfg.entryUsd.toFixed(2)}, or the matching SOL amount in the connected wallet.
          Raise a match to $4.99 or $9.99. Head-to-head pays the winner {Math.round(cfg.winnerPercent * 100)}% and the treasury{" "}
          {Math.round(cfg.treasuryPercent * 100)}%. Skill only. No chance cabinets.
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">Play. Earn. Escape. Better have my Monet.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link to="/lobby">Live lobby</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/exchange">Exchange</Link>
          </Button>
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/25 bg-primary/10 px-4 py-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Monet</span>
            <span className="tabular text-sm font-semibold text-primary">
              {connected ? formatMonet(monet) : "Connect wallet"}
            </span>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Entry fee" value={`${formatMonet(cfg.entryMonet)} MONET`} />
        <Stat label="Winner cut" value={`${Math.round(cfg.winnerPercent * 100)}%`} />
        <Stat label="Games" value={`${games.length} live`} />
        <Stat label="Network" value="Solana" />
      </section>
      {live.isSuccess ? (
        <p className="mt-2 text-center text-[10px] uppercase tracking-[0.18em] text-subtle">
          Entry fee read from the Render arcade server
        </p>
      ) : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { to: "/games", title: "Play games", desc: `${games.length} arcade titles · win prizes` },
          { to: "/exchange", title: "Exchange", desc: "Buy MONET via Jupiter · PayPal packages" },
          { to: "/portfolio", title: "Portfolio", desc: "Wallet & token balances · PnL tracker" },
          { to: "/leaderboards", title: "Leaderboard", desc: "Top scores & global rankings" },
          { to: "/challenges", title: "Challenge", desc: "H2H · live lobby · same pot as the live arcade" },
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
                Connect Phantom, Solflare, Coinbase, or Backpack. Balances are read from Solana mainnet.
              </p>
              <div className="mt-5">
                <ConnectWalletButton label="Connect wallet" block />
              </div>
            </>
          )}
          <p className="mt-3 text-[11px] text-subtle">
            Solana mainnet · payments stay on the existing arcade.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-elev p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">$MONET contract</p>
          <p className="mt-3 break-all font-mono text-xs text-ice">{cfg.mint}</p>
          <p className="mt-3 text-sm text-muted">
            Entry {formatMonet(cfg.entryMonet)} MONET per paid game · H2H & tournament
            winners paid in MONET.
          </p>
          <Button asChild className="mt-4" variant="secondary">
            <a href={`https://raydium.io/swap/?inputMint=sol&outputMint=${cfg.mint}`} target="_blank" rel="noreferrer">
              Buy $MONET on Raydium
            </a>
          </Button>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-wide">Featured</h2>
          <Badge tone="primary">Live site</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((g) => (
            <CabinetCard key={g.slug} game={g} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl tracking-wide">Night draw</h2>
        <p className="mt-1 text-sm text-muted">Four skill cabinets, reshuffled each day. Still the same games, never a chance wheel.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {draw.map((g) => (
            <CabinetCard key={g.slug} game={g} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-wide">New games</h2>
          <Badge tone="primary">Dino Realms · Monet Drift</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {floor.filter((g) => g.slug === "dino-realms" || g.slug === "racer").map((g) => (
            <CabinetCard key={g.slug} game={g} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl tracking-wide">All cabinets</h2>
          <div className="flex flex-wrap gap-2">
            {filters.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setFilter(name)}
                className={name === filter ? "h-8 rounded-md bg-primary px-3 text-xs text-primary-fg" : "h-8 rounded-md border border-border px-3 text-xs"}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((g) => (
            <CabinetCard key={g.slug} game={g} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl tracking-wide">Also on this build</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {extras.map((g) => (
            <CabinetCard key={g.slug} game={g} />
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
