import { createFileRoute, Link } from "@tanstack/react-router";
import { ArcadeShell } from "@/components/layout/arcade-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConnectWalletButton } from "@/components/arcade/connect-wallet";
import { FALLBACK_CONFIG } from "@/services/monet-config";
import { useWallet } from "@/services/wallet";
import { formatMonet, formatSol, shortAddr } from "@/lib/utils";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

function WalletPage() {
  const wallet = useWallet();
  const short = wallet.address ? shortAddr(wallet.address) : "—";

  return (
    <ArcadeShell>
      <h1 className="font-display text-4xl tracking-wide">Wallet</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Phantom, Solflare, Coinbase, or Backpack on Solana mainnet. Balances come from the live arcade server. There is no practice wallet.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-muted">Status</p>
            <Badge tone={wallet.connected ? "ok" : "muted"}>
              {wallet.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          <p className="mt-4 font-mono text-lg">{short}</p>
          <p className="text-xs text-subtle">
            {wallet.tag} · {wallet.source} · {wallet.network}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-bg-elev p-4">
              <p className="text-xs uppercase tracking-wide text-muted">
                MONET
              </p>
              <p className="mt-1 font-display text-2xl tracking-wide tabular text-primary">{formatMonet(wallet.monet)}</p>
            </div>
            <div className="rounded-lg border border-border bg-bg-elev p-4">
              <p className="text-xs uppercase tracking-wide text-muted">
                SOL
              </p>
              <p className="mt-1 font-display text-2xl tracking-wide tabular">{formatSol(wallet.sol)}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {!wallet.connected ? (
              <ConnectWalletButton label="Connect wallet" />
            ) : (
              <>
                <Button variant="secondary" onClick={() => void wallet.refresh()}>
                  Refresh
                </Button>
                <Button variant="ghost" onClick={() => wallet.disconnect()}>
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </section>
        <section className="rounded-xl border border-border bg-bg-elev p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Network</p>
          <p className="mt-2 font-display text-2xl tracking-wide">Solana</p>
          <p className="mt-2 text-sm text-muted">
            Adapter: <span className="text-fg">Solana mainnet</span>. Keep a little SOL for fees. Entry is{" "}
            {formatMonet(FALLBACK_CONFIG.entryMonet)} MONET on paid games.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>Connect / disconnect preserved</li>
            <li>Identity shown as a truncated address</li>
            <li>No private keys, no PayPal, no treasury writes</li>
          </ul>
          <Button asChild className="mt-5" variant="secondary">
            <Link to="/portfolio">Open portfolio</Link>
          </Button>
        </section>
      </div>
    </ArcadeShell>
  );
}
