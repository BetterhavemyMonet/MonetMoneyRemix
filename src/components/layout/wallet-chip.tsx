import { Link } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/services/wallet";
import { formatMonet } from "@/lib/utils";

export function WalletChip() {
  const { connected, tag, monet, connectGuest } = useWallet();
  if (!connected) {
    return (
      <Button size="sm" onClick={() => connectGuest()}>
        <Wallet />
        Connect wallet
      </Button>
    );
  }
  return (
    <Link
      to="/wallet"
      className="flex h-10 items-center gap-2 rounded-md border border-primary/30 bg-surface px-3 text-sm"
    >
      <span className="hidden font-mono text-[10px] text-muted sm:inline">{tag}</span>
      <span className="tabular font-medium text-primary">{formatMonet(monet)}</span>
      <span className="text-[9px] uppercase tracking-wide text-muted">MONET</span>
    </Link>
  );
}
