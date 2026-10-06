import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { gamesWithFeature, getManifest } from "@/games/registry";
import { createLiveChallenge, joinLiveChallenge, listLiveChallenges } from "@/services/challenges";
import { payMonetEntry } from "@/services/solana-payment";
import { loadMonetConfig } from "@/services/monet-config";
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
  const [wager, setWager] = useState<number | null>(null);
  const [view, setView] = useState<"h2h" | "lobby">(tab === "lobby" ? "lobby" : "h2h");
  const wallet = useWallet();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const config = useQuery({
    queryKey: ["monet-config"],
    queryFn: loadMonetConfig,
  });

  const wagers = config.data?.challengeWagers ?? [];

  const selectedWager =
    wagers.find((item) => item.usd === wager) ??
    wagers[0] ??
    null;

  const entry = selectedWager?.monet ?? null;

  const list = useQuery({
    queryKey: ["live-challenges", wallet.address],
    queryFn: () => listLiveChallenges(wallet.address),
  });
  const [creating, setCreating] = useState(false);

  const issue = async () => {
    if (creating) return;

    try {
      setCreating(true);

      let address = wallet.address;

      if (!wallet.connected || !address) {
        const connected = await wallet.connectPhantom();

        if (!connected) {
          toast.error("Connect Phantom to create a challenge");
          return;
        }

        address = useWallet.getState().address;
      }

      if (!address) {
        toast.error("Wallet address unavailable");
        return;
      }

      if (!selectedWager || entry == null) {
        toast.error("Live challenge pricing is unavailable");
        return;
      }

      toast.message(
        `Approve ${formatMonet(entry)} MONET entry in Phantom…`,
      );

      const signature = await payMonetEntry(
        address,
        gameId,
        entry,
      );

      toast.message("Payment sent. Verifying on-chain…");

      const challenge = await createLiveChallenge({
        wallet: address,
        game: gameId,
        signature,
        wagerUsd: selectedWager.usd,
      });

      sessionStorage.setItem(
        "challenge_session",
        JSON.stringify({
          challengeId: challenge.id,
          code: challenge.code,
          txId: signature,
          wagerUsd: challenge.wagerUsd,
          entryFee: challenge.entryFeeMonet,
          game: challenge.game,
        }),
      );

      toast.success(
        `Challenge ${challenge.code} opened`,
      );

      void qc.invalidateQueries({
        queryKey: ["challenges"],
      });
    } catch (error) {
      console.error("[CHALLENGE CREATE]", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create challenge",
      );
    } finally {
      setCreating(false);
    }
  };

  const joinChallenge = async (
    challenge: NonNullable<typeof list.data>[number],
  ) => {
    if (joiningId) return;

    try {
      setJoiningId(challenge.id);

      if (challenge.paymentType !== "monet") {
        toast.error(
          `${challenge.paymentType.toUpperCase()} challenge joining is not available yet`,
        );
        return;
      }

      if (
        challenge.entryFeeMonet == null ||
        challenge.entryFeeMonet <= 0
      ) {
        toast.error(
          "Challenge is missing its locked backend entry amount",
        );
        return;
      }

      let address = wallet.address;

      if (!wallet.connected || !address) {
        const connected = await wallet.connectPhantom();

        if (!connected) {
          toast.error("Connect Phantom to join this challenge");
          return;
        }

        address = useWallet.getState().address;
      }

      if (!address) {
        toast.error("Wallet address unavailable");
        return;
      }

      toast.message(
        `Approve ${formatMonet(challenge.entryFeeMonet)} MONET entry in Phantom…`,
      );

      const signature = await payMonetEntry(
        address,
        challenge.game,
        challenge.entryFeeMonet,
      );

      toast.message(
        "Payment sent. Verifying challenge entry on-chain…",
      );

      const joined = await joinLiveChallenge({
        challengeId: challenge.id,
        wallet: address,
        signature,
        paymentType: challenge.paymentType,
      });

      sessionStorage.setItem(
        "challenge_session",
        JSON.stringify({
          challengeId: joined.id,
          code: joined.code,
          txId: signature,
          wagerUsd: joined.wagerUsd,
          entryFee: joined.entryFeeMonet,
          game: joined.game,
          role: "player2",
        }),
      );

      toast.success(`Joined challenge ${joined.code}`);

      await qc.invalidateQueries({
        queryKey: ["live-challenges"],
      });

      await navigate({
        to: "/games/$slug",
        params: {
          slug:
            getManifest(joined.game)?.slug ??
            joined.game,
        },
        search: {
          challenge: joined.id,
        },
      });
    } catch (error) {
      console.error("[CHALLENGE JOIN]", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to join challenge",
      );
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <ArcadeShell>
      <h1 className="font-display text-4xl tracking-wide">Challenges</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Play vs friend · live challenges
        {config.data
          ? ` · ${Math.round(config.data.winnerPercent * 100)}% winner / ${Math.round(config.data.treasuryPercent * 100)}% treasury.`
          : "."}
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
          <p className="mt-1 text-sm text-muted">
            {config.data
              ? `Winner takes ${Math.round(config.data.winnerPercent * 100)}% of both entry fees.`
              : "Loading live payout configuration…"}
          </p>
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
          <label className="mt-4 block text-xs uppercase tracking-wide text-muted">Wager</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {wagers.map((item) => (
              <button
                key={item.usd}
                type="button"
                onClick={() => setWager(item.usd)}
                className={cn(
                  "h-10 rounded-full border px-4 text-sm",
                  selectedWager?.usd === item.usd
                    ? "border-primary text-primary"
                    : "border-border text-muted",
                )}
              >
                {formatUsd(item.usd)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-subtle">
                {formatMonet(entry)} MONET entry · paid on Solana and verified by the production backend
              </p>
          <Button
            className="mt-5 w-full"
            onClick={() => void issue()}
            disabled={creating}
          >
            {creating ? "Creating challenge…" : "Create challenge"}
          </Button>
        </section>
        <section className="rounded-xl border border-border bg-bg-elev p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide">{view === "lobby" ? "Live lobby" : "My challenges"}</h2>
            <Badge>Live</Badge>
          </div>
          <ul className="mt-4 space-y-3">
            {(list.data ?? []).length === 0 ? (
              <li className="text-sm text-muted">
                {wallet.connected ? "No open challenges yet." : "Connect wallet to see your challenges."}
              </li>
            ) : (
              (list.data ?? []).map((c) => {
                const g = getManifest(c.game);
                return (
                  <li key={c.id} className="rounded-lg border border-border bg-surface p-3">
                    <p className="font-display text-lg tracking-wide">{g?.title ?? c.game}</p>
                    <p className="text-xs text-muted">
                      {c.player
                        ? `${c.player.slice(0, 4)}…${c.player.slice(-4)}`
                        : "Player"}{" "}
                      · {formatUsd(c.wagerUsd)}
                      {c.entryFeeMonet != null
                        ? ` · ${formatMonet(c.entryFeeMonet)} MONET`
                        : ""}
                      {" · "}
                      {c.status}
                    </p>
                    <Button
              size="sm"
              className="mt-2"
              variant="secondary"
              disabled={joiningId !== null}
              onClick={() => void joinChallenge(c)}
            >
              {joiningId === c.id ? "Joining…" : "Join"}
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
