import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Maximize, RotateCcw, Volume2 } from "lucide-react";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { GameViewport } from "@/components/arcade/game-viewport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArcadeGame } from "@/games/bridge";
import { getManifest, statusTone } from "@/games/registry";
import { submitScore } from "@/services/api";
import { useWallet } from "@/services/wallet";
import { formatScore } from "@/lib/utils";
import { toast } from "sonner";

type Search = { practice?: boolean; create?: boolean; challenge?: string; tournament?: string };

export const Route = createFileRoute("/games/$slug")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    practice: s.practice === true || s.practice === "1" || s.practice === "true",
    create: s.create === true || s.create === "1" || s.create === "true",
    challenge: typeof s.challenge === "string" ? s.challenge : undefined,
    tournament: typeof s.tournament === "string" ? s.tournament : undefined,
  }),
  component: GamePage,
});

function GamePage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const game = getManifest(slug);
  const [score, setScore] = useState(0);
  const [key, setKey] = useState(0);
  const wallet = useWallet();
  const practice = Boolean(search.practice) || Boolean(search.create);

  useEffect(() => {
    setScore(0);
    return ArcadeGame.subscribe((event) => {
      if (event.type === "SCORE_CHANGED") setScore(event.score);
      if (event.type === "GAME_COMPLETED") {
        setScore(event.score);
        const tag = wallet.connected ? wallet.tag : "GUEST";
        void submitScore({
          data: {
            gameId: game?.backendGameId ?? slug,
            playerTag: tag,
            score: Math.floor(event.score),
            durationMs: Math.floor(event.duration * 1000),
            won: event.won,
          },
        }).then(
          () => toast.success(practice ? "Practice score saved locally" : "Score posted to the arcade board"),
          () => toast.error("Score stayed local — board is unreachable"),
        );
      }
      if (event.type === "GAME_ERROR") toast.error(event.message);
    });
  }, [slug, game?.backendGameId, wallet.connected, wallet.tag, practice]);

  if (!game) {
    return (
      <ArcadeShell>
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="font-display text-2xl">This game couldn't load.</p>
          <Button asChild className="mt-4">
            <Link to="/games">Return to Arcade</Link>
          </Button>
        </div>
      </ArcadeShell>
    );
  }

  return (
    <ArcadeShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/games" aria-label="Back to arcade">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl tracking-wide">{game.title}</h1>
              <Badge tone={statusTone(game.status)}>{game.status.replace("-", " ")}</Badge>
            </div>
            <p className="text-sm text-muted">{game.controls}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-border bg-bg-elev px-3 py-2 text-sm">
            Score <span className="tabular font-medium text-primary">{formatScore(score)}</span>
          </div>
          <Button variant="secondary" size="icon" onClick={() => setKey((k) => k + 1)} aria-label="Restart">
            <RotateCcw />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Fullscreen"
            onClick={() => {
              const el = document.documentElement;
              if (!document.fullscreenElement) void el.requestFullscreen();
              else void document.exitFullscreen();
            }}
          >
            <Maximize />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Sound">
            <Volume2 />
          </Button>
        </div>
      </div>
      {practice ? (
        <p className="mb-3 rounded-full border border-accent/40 bg-accent/15 px-4 py-2 text-center text-[11px] uppercase tracking-wide text-accent">
          Practice mode — no entry fee · no prize
        </p>
      ) : null}
      <GameViewport
        key={`${slug}-${key}`}
        slug={slug}
        search={search}
      />
      <p className="mt-3 text-xs text-subtle">
        Tap left to move, right to act on phones. Isolated game runtime — a crash here cannot take down the arcade.
      </p>
    </ArcadeShell>
  );
}
