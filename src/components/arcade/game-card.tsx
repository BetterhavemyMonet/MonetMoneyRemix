import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { GameManifest } from "@/games/types";
import { statusTone } from "@/games/registry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlayModes } from "./play-modes";

export function GameCard({ game, featured }: { game: GameManifest; featured?: boolean }) {
  const [open, setOpen] = useState(false);
  const playable = game.status !== "coming-soon" && game.status !== "maintenance" && game.status !== "disabled";
  const creator = game.category === "Creator";

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-surface",
        featured && "md:flex-row",
      )}
    >
      <Link
        to="/games/$slug"
        params={{ slug: game.slug }}
        search={{ practice: true }}
        className={cn("relative block overflow-hidden", featured ? "md:w-[48%]" : "aspect-[21/9]")}
      >
        <img
          src={game.thumbnail}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg to-transparent" />
        <Badge tone={statusTone(game.status)} className="absolute left-3 top-3">
          {game.category}
        </Badge>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{game.category}</p>
          <h3 className="font-display text-2xl tracking-wide">{game.title}</h3>
          <p className="mt-1 text-sm text-muted">{featured ? game.description : game.blurb}</p>
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          {playable ? (
            creator ? (
              <Button asChild size="sm">
                <Link to="/games/$slug" params={{ slug: game.slug }} search={{ create: true }}>
                  Open creator
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="secondary">
                  <Link to="/games/$slug" params={{ slug: game.slug }} search={{ practice: true }}>
                    Practice
                  </Link>
                </Button>
                <Button size="sm" onClick={() => setOpen(true)}>
                  Play
                </Button>
              </>
            )
          ) : (
            <Button size="sm" variant="secondary" disabled>
              Coming soon
            </Button>
          )}
        </div>
      </div>
      {open ? <PlayModes game={game} onClose={() => setOpen(false)} /> : null}
    </article>
  );
}
