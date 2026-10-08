import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  captureMonetPayPalOrder,
  createMonetPayPalOrder,
  loadPayPal,
} from "@/services/paypal";
import { jupiterSwapUrl, loadMonetConfig } from "@/services/monet-config";
import { useWallet } from "@/services/wallet";
import { formatMonet, formatSol, formatUsd, shortAddr } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/exchange")({ component: ExchangePage });

function ExchangePage() {
  const wallet = useWallet();

  const config = useQuery({
    queryKey: ["monet-config"],
    queryFn: loadMonetConfig,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const [from, setFrom] =
    useState<"SOL" | "MONET">("SOL");

  const [amount, setAmount] =
    useState("0.1");

  const [pack, setPack] =
    useState<number | null>(null);

  const [status, setStatus] =
    useState<"idle" | "quoting" | "done">("idle");

  const [paypalReady, setPaypalReady] =
    useState(false);

  const [paypalLoading, setPaypalLoading] =
    useState(false);

  useEffect(() => {
    if (
      pack == null &&
      config.data?.paypalUsd.length
    ) {
      setPack(config.data.paypalUsd[0]);
    }
  }, [config.data, pack]);

  const n = Number(amount) || 0;

  const to =
    from === "SOL" ? "MONET" : "SOL";

  const out = useMemo(() => {
    if (!config.data || n <= 0) return null;
    if (config.data.entrySol == null ||
        config.data.entrySol <= 0) return null;

    const rate =
      config.data.entryMonet /
      config.data.entrySol;

    return from === "SOL"
      ? n * rate
      : n / rate;
  }, [config.data, from, n]);

  const usdMonetRate =
    config.data
      ? config.data.entryMonet /
        config.data.entryUsd
      : null;

  const packMonet =
    pack != null &&
    usdMonetRate != null
      ? pack * usdMonetRate
      : null;

  const swap = async () => {
    if (!config.data) {
      toast.error(
        "Live backend configuration is unavailable",
      );
      return;
    }

    if (n <= 0) {
      toast.error("Enter an amount");
      return;
    }

    if (!wallet.connected) {
      const connected = await wallet.connectPhantom();

      if (!connected) {
        toast.error("Connect Phantom to swap on Jupiter");
        return;
      }
    }

    setStatus("quoting");

    window.open(
      jupiterSwapUrl(config.data.mint),
      "_blank",
      "noopener,noreferrer",
    );

    setStatus("done");
    toast.success("Jupiter opened for your swap");
  };

  const buyPack = async () => {
    if (!config.data) {
      toast.error(
        "Live backend configuration is unavailable",
      );
      return;
    }

    if (pack == null) {
      toast.error(
        "No PayPal package is available from the backend",
      );
      return;
    }

    let address = wallet.address;

    if (!wallet.connected || !address) {
      const connected = await wallet.connectPhantom();

      if (!connected) {
        toast.error("Connect Phantom before buying MONET");
        return;
      }

      address = useWallet.getState().address;
    }

    if (!address) {
      toast.error("Wallet address unavailable");
      return;
    }

    try {
      setPaypalLoading(true);
      setPaypalReady(false);

      await loadPayPal();

      const paypal = window.paypal;

      if (!paypal) {
        throw new Error("PayPal SDK unavailable");
      }

      const container = document.querySelector(
        "#paypal-buy-buttons",
      );

      if (!container) {
        throw new Error("PayPal checkout container unavailable");
      }

      container.innerHTML = "";

      let sessionToken = "";

      await paypal.Buttons({
        style: {
          layout: "vertical",
          shape: "rect",
          label: "paypal",
        },

        createOrder: async () => {
          const order = await createMonetPayPalOrder(
            pack,
            address,
          );

          sessionToken = order.sessionToken;

          return order.orderId;
        },

        onApprove: async (data) => {
          if (!sessionToken) {
            throw new Error("PayPal purchase session unavailable");
          }

          const result = await captureMonetPayPalOrder(
            data.orderID,
            sessionToken,
          );

          if (
            result.code === "ATA_REQUIRED" &&
            result.paymentCaptured
          ) {
            toast.warning(
              result.message ||
                "Payment captured. Your MONET token account must be created before delivery.",
            );
            return;
          }

          if (result.processing) {
            toast.success(
              "Payment captured. MONET delivery is processing.",
            );
            return;
          }

          toast.success(
            result.alreadyPaid
              ? "Purchase already completed."
              :
                    result.monetAmount != null
                      ? `${formatMonet(result.monetAmount)} MONET sent to your wallet.`
                      : "Purchase completed. MONET delivery confirmed.",
          );
        },

        onCancel: () => {
          toast.message("PayPal checkout cancelled.");
        },

        onError: (error) => {
          console.error("[PAYPAL BUY]", error);
          toast.error("PayPal checkout failed. Please try again.");
        },
      }).render("#paypal-buy-buttons");

      setPaypalReady(true);
    } catch (error) {
      console.error("[PAYPAL BUY]", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load PayPal checkout",
      );
    } finally {
      setPaypalLoading(false);
    }
  };

  return (
    <ArcadeShell>
      <h1 className="font-display text-4xl tracking-wide">Monet Exchange</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Buy MONET with PayPal or swap SOL on Jupiter. Purchases are verified and fulfilled by the production backend.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Your MONET balance</p>
          <p className="mt-2 font-display text-4xl tracking-wide text-primary tabular">{formatMonet(wallet.monet)}</p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-muted">Token address</p>
          <p className="mt-1 break-all font-mono text-xs text-ice">{config.data?.mint ?? "Loading live token config…"}</p>
          <p className="mt-2 text-xs text-subtle">{config.data
              ? `${shortAddr(config.data.mint)} · SPL · ${config.data.network}`
              : "Backend configuration required"}</p>
        </section>

        <section className="rounded-xl border border-border bg-bg-elev p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Buy MONET with PayPal</p>
          <p className="mt-1 text-sm text-muted">Sent to your connected wallet. Packages come from the live backend config.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(config.data?.paypalUsd ?? []).map((usd: number) => (
              <button
                key={usd}
                type="button"
                onClick={() => setPack(usd)}
                className={`rounded-lg border px-3 py-3 text-left ${pack === usd ? "border-primary bg-primary/15" : "border-border bg-surface"}`}
              >
                <p className="font-display text-xl">{formatUsd(usd)}</p>
                <p className="text-xs text-muted">
                  {usdMonetRate != null
                    ? `${formatMonet(usd * usdMonetRate)} MONET`
                    : "Loading…"}
                </p>
              </button>
            ))}
          </div>
          <Button
            className="mt-4 w-full"
            onClick={() => void buyPack()}
            disabled={paypalLoading || !config.data || pack == null}
          >
            {paypalLoading
              ? "Loading PayPal…"
              : pack != null
                ? `Pay ${formatUsd(pack)} with PayPal`
                : "PayPal unavailable"}
          </Button>

          <div
            id="paypal-buy-buttons"
            className={paypalReady ? "mt-4" : "hidden"}
          />

          <p className="mt-2 text-[11px] text-subtle">
            Secure PayPal checkout · MONET is delivered by the production backend to your connected wallet.
          </p>
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
        <p className="font-display text-3xl tracking-wide tabular">
          {out == null
            ? "—"
            : from === "SOL"
              ? formatMonet(out)
              : formatSol(out)}
        </p>
        <p className="mt-1 text-[11px] text-subtle">
          Indicative backend rate only. Jupiter provides the executable market quote.
        </p>
        <Button
          className="mt-4 w-full"
          onClick={swap}
          disabled={
            status === "quoting" ||
            !config.data
          }
        >
          {status === "quoting" ? "Settling…" : `Swap to ${to}`}
        </Button>
        <a
          className={`mt-3 block text-center text-sm ${
            config.data
              ? "text-ice"
              : "pointer-events-none text-muted"
          }`}
          href={
            config.data
              ? jupiterSwapUrl(config.data.mint)
              : undefined
          }
          target="_blank"
          rel="noreferrer"
        >
          Open full Jupiter swap
        </a>
      </div>
    </ArcadeShell>
  );
}
