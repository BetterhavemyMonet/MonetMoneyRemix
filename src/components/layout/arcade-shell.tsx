import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArcadeNav, MobileDock } from "./arcade-nav";
import { WalletChip } from "./wallet-chip";

export function ArcadeShell({ children, flush }: { children: ReactNode; flush?: boolean }) {
  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none absolute inset-0 arcade-grid opacity-60" />
      <div className="pointer-events-none absolute inset-0 scanlines opacity-40" />
      <header className="sticky top-0 z-40 border-b border-primary/20 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/brand/mark.svg" alt="" className="size-9 rounded-[10px]" />
            <span className="leading-tight">
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text font-display text-lg tracking-[0.12em] text-transparent">
                MONET MONEY
              </span>
              <span className="block text-[9px] uppercase tracking-[0.28em] text-muted">Mainnet arcade</span>
            </span>
          </Link>
          <ArcadeNav />
          <WalletChip />
        </div>
      </header>
      <main className={flush ? "relative w-full pb-24 lg:pb-8" : "relative mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:pb-12"}>
        {children}
      </main>
      <MobileDock />
    </div>
  );
}
