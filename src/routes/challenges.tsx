import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { gamesWithFeature, getManifest } from "@/games/registry";
import { createChallenge, listChallenges } from "@/services/api";
import { fetchLiveChallenges } from "@/services/live-arcade";
import { RIVALS } from "@/services/backend";
import { FALLBACK_CONFIG } from "@/services/monet-config";
import { useWallet } from "@/services/wallet";
import { formatMonet, formatUsd, cn } from "@/lib/utils";
import { toast } from "sonner";

type Search = { game?: string; tab?: string };

export const Route = createFileRoute("/challenges")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    game: typeof s.game === "string" ? s.game : undefined,
    tab: typeof s.tab === "string" ? s.tab : undefined,
  }),
  component: ChallengesPage,
});

function ChallengesPage() {
  const { game: preset, tab } = Route.useSearch();
  const games = gamesWithFeature("challenges");
  const [gameId, setGameId] = useState(preset ?? games[0]?.id ?? "dino");
  const [rival, setRival] = useState(RIVALS[0]);
  const [wager, setWager] = useState(FALLBACK_CONFIG.wagersUsd[0]);
  const [view, setView] = useState<"h2h" | "lobby">(tab === "lobby" ? "lobby" : "h2h");
  const wallet = useWallet();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["challenges"], queryFn: () => listChallenges() });
  const live = useQuery({ queryKey: ["live-challenges"], queryFn: () => fetchLiveChallenges() });
  const rate = FALLBACK_CONFIG.entryMonet / FALLBACK_CONFIG.entryUsd;
  const entry = Math.round(wager * rate * 1e6) / 1e6;
  const create = useMutation({
    mutationFn: () =>
      createChallenge({
        data: {
          gameId,
          challengerTag: wallet.tag || "GUEST",
          opponentTag: rival,
          entryMonet: entry,
        },
      }),
    onSuccess: () => {
      toast.success("Challenge opened");
      void qc.invalidateQueries({ queryKey: ["challenges"] });
    },
  });

  const issue = () => {
    if (!wallet.connected || wallet.source !== "wallet") {
      toast.error("Connect a Solana wallet before opening a paid challenge.");
      return;
    }
    create.mutate();
  };

  return (
    <ArcadeShell>
      <h1 className="font-display text-4xl tracking-wide">Challenges</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Play vs friend · live challenges · {Math.round(FALLBACK_CONFIG.winnerPercent * 100)}% winner /{" "}
        {Math.round(FALLBACK_CONFIG.treasuryPercent * 100)}% treasury.
      </p>
      <div className="mt-4 flex gap-2">
        {(["h2h", "lobby"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setView(t)}
            className={cn(
              "h-10 rounded-full border px-4 text-[10px] font-extrabold uppercase tracking-wide",
              view === t ? "border-primary bg-primary/15 text-primary" : "border-border text-muted",
            )}
          >
            {t === "h2h" ? "1v1" : "Lobby"}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-2xl tracking-wide">Create 1v1 challenge</h2>
          <p className="mt-1 text-sm text-muted">Winner takes 80% of both entry fees.</p>
          <label className="mt-4 block text-xs uppercase tracking-wide text-muted">Game</label>
          <select
            className="mt-1 h-11 w-full rounded-md border border-border bg-bg-elev px-3 text-sm"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
          >
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
          <label className="mt-4 block text-xs uppercase tracking-wide text-muted">Opponent</label>
          <select
            className="mt-1 h-11 w-full rounded-md border border-border bg-bg-elev px-3 text-sm"
            value={rival}
            onChange={(e) => setRival(e.target.value)}
          >
            {RIVALS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <label className="mt-4 block text-xs uppercase tracking-wide text-muted">Wager</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {FALLBACK_CONFIG.wagersUsd.map((usd) => (
              <button
                key={usd}
                type="button"
                onClick={() => setWager(usd)}
                className={cn(
                  "h-10 rounded-full border px-4 text-sm",
                  wager === usd ? "border-primary text-primary" : "border-border text-muted",
                )}
              >
                {formatUsd(usd)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-subtle">{formatMonet(entry)} MONET entry · billed by existing rails in live mode</p>
          <Button className="mt-5 w-full" onClick={issue} disabled={create.isPending}>
            Create challenge
          </Button>
        </section>
        <section className="rounded-xl border border-border bg-bg-elev p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide">{view === "lobby" ? "Live lobby" : "My challenges"}</h2>
            <Badge>Live</Badge>
          </div>
          <ul className="mt-4 space-y-3">
            {(live.data ?? list.data ?? []).length === 0 ? (
              <li className="text-sm text-muted">
                {wallet.connected ? "No open challenges on the Monet backend yet." : "Connect wallet to see your challenges."}
              </li>
            ) : (
              (live.data ?? list.data ?? []).map((c) => {
                const g = getManifest(c.game_id);
                return (
                  <li key={c.id} className="rounded-lg border border-border bg-surface p-3">
                    <p className="font-display text-lg tracking-wide">{g?.title ?? c.game_id}</p>
                    <p className="text-xs text-muted">
                      {c.challenger_tag} vs {c.opponent_tag} · {formatMonet(c.entry_monet)} MONET · {c.status}
                    </p>
                    <Button asChild size="sm" className="mt-2" variant="secondary">
                      <Link to="/games/$slug" params={{ slug: g?.slug ?? c.game_id }} search={{ challenge: c.id }}>
                        Join
                      </Link>
                    </Button>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>
    </ArcadeShell>
  );
}
