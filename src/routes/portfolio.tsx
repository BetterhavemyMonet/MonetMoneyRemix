import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { Button } from "@/components/ui/button";
import { getManifest, listLiveGames } from "@/games/registry";
import { listRecentPlays, listScores } from "@/services/api";
import { useWallet } from "@/services/wallet";
import { formatMonet, formatScore, formatSol } from "@/lib/utils";

export const Route = createFileRoute("/portfolio")({ component: PortfolioPage });

function PortfolioPage() {
  const wallet = useWallet();
  const tag = wallet.connected ? wallet.tag : "GUEST";
  const plays = useQuery({
    queryKey: ["plays", tag],
    queryFn: () => listRecentPlays({ data: { playerTag: tag } }),
    enabled: wallet.connected,
  });
  const scores = useQuery({
    queryKey: ["myscores", tag],
    queryFn: () => listScores({ data: { limit: 40 } }),
  });
  const mine = (scores.data ?? []).filter((s) => s.player_tag === tag);
  const best = [...mine].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <ArcadeShell>
      <h1 className="font-display text-4xl tracking-wide">Portfolio</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Wallet & token balances. Connect to attach scores to a tag — no accounts, just the wallet.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="MONET balance" value={formatMonet(wallet.monet)} hint="$MONET" />
        <Stat label="SOL balance" value={formatSol(wallet.sol)} hint="Solana" />
        <Stat label="Pending wins" value="0" hint="MONET" />
        <Stat label="Games played" value={String((plays.data ?? []).length)} hint="this device" />
      </div>
      {!wallet.connected ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted">Connect your wallet to view your portfolio</p>
          <Button className="mt-4" onClick={() => wallet.connectGuest()}>
            Connect wallet
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface p-5">
            <p className="font-display text-2xl tracking-wide">Best scores</p>
            <ul className="mt-3 space-y-2 text-sm">
              {best.length === 0 ? (
                <li className="text-muted">No scores yet — hit the floor.</li>
              ) : (
                best.map((s) => (
                  <li key={s.id} className="flex justify-between">
                    <span>{getManifest(s.game_id)?.title ?? s.game_id}</span>
                    <span className="tabular text-primary">{formatScore(s.score)}</span>
                  </li>
                ))
              )}
            </ul>
          </section>
          <section className="rounded-xl border border-border bg-bg-elev p-5">
            <p className="font-display text-2xl tracking-wide">Recent plays</p>
            <ul className="mt-3 space-y-2 text-sm">
              {(plays.data ?? []).length === 0 ? (
                <li className="text-muted">
                  Jump into {listLiveGames()[0]?.title ?? "a game"} to start a trail.
                </li>
              ) : (
                (plays.data ?? []).map((p) => (
                  <li key={p.game_id} className="flex justify-between">
                    <Link to="/games/$slug" params={{ slug: getManifest(p.game_id)?.slug ?? p.game_id }} className="text-ice">
                      {getManifest(p.game_id)?.title ?? p.game_id}
                    </Link>
                    <span className="text-subtle">{new Date(p.played_at).toLocaleDateString()}</span>
                  </li>
                ))
              )}
            </ul>
            <Button asChild className="mt-4" variant="secondary">
              <Link to="/exchange">Open exchange</Link>
            </Button>
          </section>
        </div>
      )}
    </ArcadeShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">{label}</p>
      <p className="mt-1 font-display text-2xl tracking-wide tabular">{value}</p>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}
