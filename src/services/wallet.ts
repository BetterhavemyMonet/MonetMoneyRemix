import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shortTag } from "@/lib/utils";

type WalletState = {
  connected: boolean;
  address: string | null;
  tag: string;
  monet: number;
  sol: number;
  network: "solana-mainnet" | "sandbox";
  source: "guest" | "phantom" | "disconnected";
  connectGuest: () => void;
  connectPhantom: () => Promise<boolean>;
  disconnect: () => void;
  creditMonet: (n: number) => void;
  debitMonet: (n: number) => boolean;
  creditSol: (n: number) => void;
  debitSol: (n: number) => boolean;
  refresh: () => void;
};

function guestAddress() {
  const bytes = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return `So1${bytes.slice(0, 41)}`;
}

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      connected: false,
      address: null,
      tag: "GUEST",
      monet: 0,
      sol: 0,
      network: "sandbox",
      source: "disconnected",
      connectGuest() {
        const address = get().address ?? guestAddress();
        set({
          connected: true,
          address,
          tag: shortTag(address),
          monet: get().monet > 0 ? get().monet : 12.5,
          sol: get().sol > 0 ? get().sol : 0.25,
          network: "sandbox",
          source: "guest",
        });
      },
      async connectPhantom() {
        const provider = (
          window as Window & {
            solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey: { toString: () => string } }> };
          }
        ).solana;
        if (!provider?.isPhantom) {
          get().connectGuest();
          return false;
        }
        try {
          const res = await provider.connect();
          const address = res.publicKey.toString();
          set({
            connected: true,
            address,
            tag: shortTag(address),
            monet: get().monet > 0 ? get().monet : 12.5,
            sol: get().sol > 0 ? get().sol : 0.25,
            network: "sandbox",
            source: "phantom",
          });
          return true;
        } catch {
          return false;
        }
      },
      disconnect() {
        set({
          connected: false,
          source: "disconnected",
        });
      },
      creditMonet(n) {
        set({ monet: Math.max(0, get().monet + n) });
      },
      debitMonet(n) {
        if (get().monet < n) return false;
        set({ monet: get().monet - n });
        return true;
      },
      creditSol(n) {
        set({ sol: Math.max(0, get().sol + n) });
      },
      debitSol(n) {
        if (get().sol < n) return false;
        set({ sol: get().sol - n });
        return true;
      },
      refresh() {
        set({ monet: get().monet, sol: get().sol });
      },
    }),
    { name: "monet-arcade-wallet" },
  ),
);
