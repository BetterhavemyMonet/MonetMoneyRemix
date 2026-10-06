import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Swords, Trophy, Gamepad2, Users } from "lucide-react";
import type { GameManifest } from "@/games/types";
import { loadMonetConfig } from "@/services/monet-config";
import { formatMonet, formatUsd } from "@/lib/utils";

export function PlayModes({ game, onClose }: { game: GameManifest; onClose: () => void }) {
  const nav = useNavigate();

  const config = useQuery({
    queryKey: ["monet-config"],
    queryFn: loadMonetConfig,
  });

  const fee = config.data
    ? `${formatMonet(config.data.entryMonet)} ${config.data.symbol}`
    : "LIVE RATE";
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-bg/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl border border-primary/30 bg-surface p-5 shadow-glow"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="mode-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Select mode</p>
            <h2 id="mode-title" className="font-display text-3xl tracking-wide">
              {game.title}
            </h2>
            <p className="mt-1 text-sm text-muted">Choose how you want to play {game.title}.</p>
          </div>
          <button type="button" className="text-muted" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="mt-4 grid gap-2">
          <ModeBtn
            icon={Gamepad2}
            title="Practice"
            desc="Play free. No entry fee."
            tag="FREE"
            onClick={() => {
              onClose();
              void nav({ to: "/games/$slug", params: { slug: game.slug }, search: { practice: true } });
            }}
          />
          <ModeBtn
            icon={Swords}
            title="Head-to-head"
            desc="Create or join a player challenge."
            tag={fee}
            onClick={() => {
              onClose();
              void nav({ to: "/challenges", search: { game: game.id, tab: "h2h" } });
            }}
          />
          <ModeBtn
            icon={Trophy}
            title="Tournament"
            desc="Compete on the tournament leaderboard."
            tag="ENTER"
            onClick={() => {
              onClose();
              void nav({ to: "/tournaments", search: { game: game.id } });
            }}
          />
          <ModeBtn
            icon={Users}
            title="Open challenges"
            desc="Browse available player challenges."
            tag="LIVE"
            onClick={() => {
              onClose();
              void nav({ to: "/challenges", search: { game: game.id, tab: "lobby" } });
            }}
          />
        </div>
        <p className="mt-4 text-[11px] text-subtle">
          {config.data
            ? `Paid modes use the live backend rate: ${fee} (≈${formatUsd(
                config.data.entryUsd,
              )}). ${Math.round(
                config.data.winnerPercent * 100,
              )}% winner / ${Math.round(
                config.data.treasuryPercent * 100,
              )}% treasury.`
            : config.isError
              ? "Live payment configuration is currently unavailable."
              : "Loading live payment configuration…"}
        </p>
      </div>
    </div>
  );
}

function ModeBtn({
  icon: Icon,
  title,
  desc,
  tag,
  onClick,
}: {
  icon: typeof Gamepad2;
  title: string;
  desc: string;
  tag: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border border-border bg-bg-elev px-3 py-3 text-left transition-colors hover:border-primary/50"
    >
      <span className="grid size-10 place-items-center rounded-md bg-primary/15 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
      <span className="text-[10px] font-extrabold uppercase tracking-wide text-ice">{tag}</span>
    </button>
  );
}
