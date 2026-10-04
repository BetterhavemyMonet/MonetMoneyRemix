import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { GameCard } from "@/components/arcade/game-card";
import { Input } from "@/components/ui/input";
import { categoriesFromRegistry, gamesForFilter, searchGames } from "@/games/registry";
import { FALLBACK_CONFIG } from "@/services/monet-config";
import { formatMonet, formatUsd, cn } from "@/lib/utils";

export const Route = createFileRoute("/games/")({ component: GamesPage });

function GamesPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");
  const filters = ["ALL", ...categoriesFromRegistry().map((c) => c.toUpperCase())];
  const games = useMemo(() => {
    const searched = searchGames(q);
    const ids = new Set(gamesForFilter(filter).map((g) => g.id));
    return searched.filter((g) => ids.has(g.id));
  }, [q, filter]);

  return (
    <ArcadeShell>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-primary">Play. Compete. Win.</p>
      <h1 className="font-display text-4xl tracking-wide md:text-5xl">Arcade</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Skill first. Arcade always. Practice free, challenge another player, or enter a tournament.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">Entry fee</p>
          <p className="font-display text-2xl tracking-wide">{formatMonet(FALLBACK_CONFIG.entryMonet)} MONET</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">USD equivalent</p>
          <p className="font-display text-2xl tracking-wide">{formatUsd(FALLBACK_CONFIG.entryUsd)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">Play for the pot</p>
          <p className="font-display text-2xl tracking-wide">80% / 20%</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-subtle">
        Keep a small amount of SOL in your connected wallet to cover Solana network fees on paid games.
      </p>
      <div className="mt-5 max-w-md">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search games" />
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "h-10 shrink-0 rounded-full border px-4 text-[10px] font-extrabold uppercase tracking-wide",
              filter === f ? "border-primary bg-primary/15 text-primary" : "border-border text-muted",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
      {games.length === 0 ? <p className="mt-10 text-sm text-muted">No games match that filter.</p> : null}
    </ArcadeShell>
  );
}
