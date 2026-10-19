import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { quoteExchange } from "@/services/backend";
import { FALLBACK_CONFIG, jupiterSwapUrl } from "@/services/monet-config";
import { useWallet } from "@/services/wallet";
import { formatMonet, formatSol, formatUsd, shortAddr } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/exchange")({ component: ExchangePage });

function ExchangePage() {
  const wallet = useWallet();
  const [from, setFrom] = useState<"SOL" | "MONET">("SOL");
  const [amount, setAmount] = useState("0.1");
  const [pack, setPack] = useState(FALLBACK_CONFIG.paypalUsd[0]);
  const [status, setStatus] = useState<"idle" | "quoting" | "done">("idle");
  const n = Number(amount) || 0;
  const out = useMemo(() => quoteExchange(from, n), [from, n]);
  const to = from === "SOL" ? "MONET" : "SOL";
  const rate = FALLBACK_CONFIG.entryMonet / FALLBACK_CONFIG.entryUsd;

  const swap = () => {
    if (n <= 0) {
      toast.error("Enter an amount");
      return;
    }
    window.open(jupiterSwapUrl(FALLBACK_CONFIG.mint), "_blank", "noopener,noreferrer");
    toast.message("Jupiter handles the real swap. This arcade does not move funds.");
  };

  const buyPack = () => {
    window.open("https://betterhavemymonet.com/exchange", "_blank", "noopener,noreferrer");
    toast.message("PayPal checkout stays on the live arcade. This app does not charge cards.");
  };

  return (
    <ArcadeShell>
      <h1 className="font-display text-4xl tracking-wide">Monet Exchange</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Buy MONET with PayPal packages or swap SOL on Jupiter. Live mode forwards to the existing
        exchange. This frontend never captures cards or signs treasury payouts.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Your MONET balance</p>
          <p className="mt-2 font-display text-4xl tracking-wide text-primary tabular">{formatMonet(wallet.monet)}</p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-muted">Token address</p>
          <p className="mt-1 break-all font-mono text-xs text-ice">{FALLBACK_CONFIG.mint}</p>
          <p className="mt-2 text-xs text-subtle">{shortAddr(FALLBACK_CONFIG.mint)} · SPL · {FALLBACK_CONFIG.network}</p>
        </section>

        <section className="rounded-xl border border-border bg-bg-elev p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Buy MONET with PayPal</p>
          <p className="mt-1 text-sm text-muted">Sent to your connected wallet. Packages come from the live backend config.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {FALLBACK_CONFIG.paypalUsd.map((usd) => (
              <button
                key={usd}
                type="button"
                onClick={() => setPack(usd)}
                className={`rounded-lg border px-3 py-3 text-left ${pack === usd ? "border-primary bg-primary/15" : "border-border bg-surface"}`}
              >
                <p className="font-display text-xl">{formatUsd(usd)}</p>
                <p className="text-xs text-muted">{formatMonet(usd * rate)} MONET</p>
                {usd === 100 ? <p className="mt-1 text-[10px] uppercase tracking-wide text-warn">Best value</p> : null}
              </button>
            ))}
          </div>
          <Button className="mt-4 w-full" onClick={buyPack}>
            {`Continue ${formatUsd(pack)} on the live arcade`}
          </Button>
          <p className="mt-2 text-[11px] text-subtle">Opens the live arcade. Cards are charged there, not here.</p>
        </section>
      </div>

      <div className="mx-auto mt-8 max-w-md rounded-xl border border-border bg-surface p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Swap SOL ↔ MONET</p>
        <label className="mt-4 block text-xs uppercase tracking-wide text-muted">From</label>
        <div className="mt-1 flex gap-2">
          <Input
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setStatus("idle");
            }}
          />
          <button
            type="button"
            className="h-11 min-w-24 rounded-md border border-border bg-bg-elev px-3 text-sm"
            onClick={() => setFrom(from === "SOL" ? "MONET" : "SOL")}
          >
            {from}
          </button>
        </div>
        <p className="mt-1 text-xs text-subtle">
          Balance {from === "SOL" ? `${formatSol(wallet.sol)} SOL` : `${formatMonet(wallet.monet)} MONET`}
        </p>
        <button type="button" className="mx-auto my-3 grid size-10 place-items-center rounded-full border border-border" onClick={() => setFrom(from === "SOL" ? "MONET" : "SOL")}>
          <ArrowDownUp className="size-4" />
        </button>
        <p className="text-xs uppercase tracking-wide text-muted">To {to}</p>
        <p className="font-display text-3xl tracking-wide tabular">{from === "SOL" ? formatMonet(out) : formatSol(out)}</p>
        <Button className="mt-4 w-full" onClick={swap} disabled={status === "quoting"}>
          {status === "quoting" ? "Settling…" : "Open Jupiter swap"}
        </Button>
        <a
          className="mt-3 block text-center text-sm text-ice"
          href={jupiterSwapUrl(FALLBACK_CONFIG.mint)}
          target="_blank"
          rel="noreferrer"
        >
          Open full Jupiter swap
        </a>
      </div>
    </ArcadeShell>
  );
}
