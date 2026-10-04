import { createFileRoute, Link } from "@tanstack/react-router";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getManifest, listLiveGames } from "@/games/registry";
import { TOURNAMENTS, type TournamentStatus } from "@/services/backend";
import { FALLBACK_CONFIG } from "@/services/monet-config";
import { formatMonet } from "@/lib/utils";

type Search = { game?: string };

export const Route = createFileRoute("/tournaments")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    game: typeof s.game === "string" ? s.game : undefined,
  }),
  component: TournamentsPage,
});

const order: TournamentStatus[] = ["open", "active", "upcoming", "completed"];

function TournamentsPage() {
  const { game } = Route.useSearch();
  const games = listLiveGames();
  return (
    <ArcadeShell>
      <h1 className="font-display text-4xl tracking-wide">Tournaments</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Pay entry · play to score · top 3 share the pot. Brackets and payouts stay on the existing backend.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {[
          ["1st", "50% of pot"],
          ["2nd", "30% of pot"],
          ["3rd", "10% of pot"],
          ["House", "10% rake"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">{k}</p>
            <p className="font-display text-xl tracking-wide">{v}</p>
          </div>
        ))}
      </div>
      {game ? (
        <p className="mt-4 text-sm text-ice">Filtered for {getManifest(game)?.title ?? game} · {formatMonet(FALLBACK_CONFIG.entryMonet)} MONET entry</p>
      ) : null}
      <div className="mt-6 space-y-8">
        {order.map((status) => {
          const items = TOURNAMENTS.filter((t) => t.status === status && (!game || t.gameId === game || getManifest(t.gameId)?.id === game));
          if (!items.length) return null;
          return (
            <section key={status}>
              <h2 className="font-display text-2xl tracking-wide capitalize">{status}</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {items.map((t) => {
                  const g = getManifest(t.gameId);
                  return (
                    <article key={t.id} className="rounded-xl border border-border bg-surface p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-xl tracking-wide">{t.title}</p>
                          <p className="text-sm text-muted">{g?.title ?? t.gameId}</p>
                        </div>
                        <Badge>{t.status}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted">{t.note}</p>
                      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-subtle">Entry</dt>
                          <dd className="tabular">{formatMonet(t.entryMonet)} MONET</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-subtle">Prize</dt>
                          <dd className="tabular text-primary">{formatMonet(t.prizeMonet)} MONET</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-subtle">Field</dt>
                          <dd>
                            {t.players}/{t.cap}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-subtle">When</dt>
                          <dd>{t.startsAt}</dd>
                        </div>
                      </dl>
                      {g ? (
                        <Button asChild className="mt-4" size="sm">
                          <Link to="/games/$slug" params={{ slug: g.slug }} search={{ tournament: t.id }}>
                            Enter
                          </Link>
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
      <p className="mt-8 text-xs text-subtle">Create flow supports 4 / 8 / 16 player fields on the live backend.</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
        {games.slice(0, 8).map((g) => (
          <span key={g.id} className="rounded-full border border-border px-3 py-1">
            {g.title}
          </span>
        ))}
      </div>
    </ArcadeShell>
  );
}
