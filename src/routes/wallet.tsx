import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadMonetConfig } from "@/services/monet-config";
import { useWallet } from "@/services/wallet";
import {
  formatMonet,
  formatSol,
  shortAddr,
} from "@/lib/utils";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
});

function WalletPage() {
  const wallet = useWallet();

  const config = useQuery({
    queryKey: ["monet-config"],
    queryFn: loadMonetConfig,
  });

  const short = wallet.address
    ? shortAddr(wallet.address)
    : "—";

  return (
    <ArcadeShell>
      <h1 className="font-display text-4xl tracking-wide">
        Wallet
      </h1>

      <p className="mt-1 max-w-xl text-sm text-muted">
        Connect Phantom for live Solana transactions.
        Payment verification, PayPal fulfillment, and
        treasury settlement remain backend-authoritative.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-muted">
              Status
            </p>

            <Badge
              tone={
                wallet.connected
                  ? "ok"
                  : "muted"
              }
            >
              {wallet.connected
                ? "Connected"
                : "Disconnected"}
            </Badge>
          </div>

          <p className="mt-4 font-mono text-lg">
            {short}
          </p>

          <p className="text-xs text-subtle">
            {wallet.tag} · {wallet.source} ·{" "}
            {wallet.network}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-bg-elev p-4">
              <p className="text-xs uppercase tracking-wide text-muted">
                MONET
              </p>

              <p className="mt-1 font-display text-2xl tracking-wide tabular text-primary">
                {formatMonet(wallet.monet)}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-bg-elev p-4">
              <p className="text-xs uppercase tracking-wide text-muted">
                SOL
              </p>

              <p className="mt-1 font-display text-2xl tracking-wide tabular">
                {formatSol(wallet.sol)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {!wallet.connected ? (
              <Button
                onClick={() =>
                  void wallet.connectPhantom()
                }
              >
                Connect Phantom
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() =>
                    wallet.refresh()
                  }
                >
                  Refresh
                </Button>

                <Button
                  variant="ghost"
                  onClick={() =>
                    wallet.disconnect()
                  }
                >
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-bg-elev p-5">
          <p className="text-xs uppercase tracking-wide text-muted">
            Network
          </p>

          <p className="mt-2 font-display text-2xl tracking-wide">
            Solana
          </p>

          <p className="mt-2 text-sm text-muted">
            Live Solana wallet mode. Keep a little
            SOL for network fees.{" "}
            {config.data
              ? `Current paid-game entry: ${formatMonet(
                  config.data.entryMonet,
                )} ${config.data.symbol}.`
              : config.isError
                ? "Live entry configuration is currently unavailable."
                : "Loading live entry configuration…"}
          </p>

          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>Phantom connect / disconnect</li>
            <li>
              Identity shown as a truncated address
            </li>
            <li>
              No private keys or treasury signing in
              the browser
            </li>
          </ul>

          <Button
            asChild
            className="mt-5"
            variant="secondary"
          >
            <Link to="/portfolio">
              Open portfolio
            </Link>
          </Button>
        </section>
      </div>
    </ArcadeShell>
  );
}
