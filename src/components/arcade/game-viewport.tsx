import { useEffect, useRef, useState } from "react";
import { ArcadeGame } from "@/games/bridge";
import { getGame } from "@/games/registry";

export function GameViewport({ slug }: { slug: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const game = getGame(slug);
    const canvas = canvasRef.current;
    if (!game || !canvas) {
      setError("This game couldn't load.");
      return;
    }
    if (game.manifest.status === "coming-soon") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      return game.mount({ canvas, reducedMotion: reduced });
    } catch (err) {
      const message = err instanceof Error ? err.message : "This game couldn't load.";
      ArcadeGame.error(message);
      setError(message);
      return;
    }
  }, [slug]);

  const game = getGame(slug);
  if (!game) {
    return (
      <div className="grid min-h-[360px] place-items-center rounded-xl border border-border bg-bg-elev text-sm text-muted">
        This game couldn't load.
      </div>
    );
  }
  if (game.manifest.status === "coming-soon") {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border">
        <img src={game.manifest.thumbnail} alt="" className="h-[min(70vh,540px)] w-full object-cover opacity-70" />
        <div className="absolute inset-0 grid place-items-center bg-bg/50">
          <div className="rounded-xl border border-border bg-surface/90 px-6 py-5 text-center">
            <p className="font-display text-2xl">Coming soon</p>
            <p className="mt-1 max-w-sm text-sm text-muted">{game.manifest.description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-bg-elev">
      <canvas
        ref={canvasRef}
        className="mx-auto block h-[min(70vh,540px)] w-full touch-none bg-bg"
        style={{ touchAction: "none" }}
      />
      {error ? (
        <div className="absolute inset-0 grid place-items-center bg-bg/80">
          <p className="text-sm text-danger">{error}</p>
        </div>
      ) : null}
    </div>
  );
}
