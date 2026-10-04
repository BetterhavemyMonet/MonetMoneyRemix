import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { gamesWithFeature } from "@/games/registry";
import { listScores } from "@/services/api";
import { formatScore, cn } from "@/lib/utils";

type Search = { game?: string };

export const Route = createFileRoute("/leaderboards")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    game: typeof s.game === "string" ? s.game : undefined,
  }),
  component: LeaderboardsPage,
});

function LeaderboardsPage() {
  const games = gamesWithFeature("leaderboard");
  const { game: preset } = Route.useSearch();
  const [gameId, setGameId] = useState(preset ?? games[0]?.id ?? "dino");
  const [range, setRange] = useState<"all" | "week" | "day">("all");
  const scores = useQuery({
    queryKey: ["scores", gameId],
    queryFn: () => listScores({ data: { gameId, limit: 30 } }),
  });
  const rows = useMemo(() => {
    const list = scores.data ?? [];
    if (range === "all") return list;
    const ms = range === "day" ? 86_400_000 : 7 * 86_400_000;
    const cut = Date.now() - ms;
    return list.filter((r) => new Date(r.created_at).getTime() >= cut);
  }, [scores.data, range]);

  return (
    <ArcadeShell>
      <h1 className="font-display text-4xl tracking-wide">Leaderboard</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">Top scores & global rankings across the live catalog.</p>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {games.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGameId(g.id)}
            className={cn(
              "h-10 shrink-0 rounded-full border px-4 text-sm",
              gameId === g.id ? "border-primary text-primary" : "border-border text-muted",
            )}
          >
            {g.title}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        {(["all", "week", "day"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={cn(
              "h-9 rounded-full border px-3 text-[10px] font-extrabold uppercase tracking-wide",
              range === r ? "border-ice text-ice" : "border-border text-muted",
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <ol className="mt-6 divide-y divide-border rounded-xl border border-border bg-surface">
        {rows.length === 0 ? (
          <li className="p-6 text-sm text-muted">No scores yet. Be first on the board.</li>
        ) : (
          rows.map((r, i) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="w-8 tabular text-subtle">{i + 1}</span>
              <span className="flex-1 font-mono">{r.player_tag}</span>
              <span className="tabular font-semibold text-primary">{formatScore(r.score)}</span>
            </li>
          ))
        )}
      </ol>
    </ArcadeShell>
  );
}
