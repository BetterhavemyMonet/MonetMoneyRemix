import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shortTag } from "@/lib/utils";

type WalletState = {
  connected: boolean;
  address: string | null;
  tag: string;
  monet: number;
  sol: number;
  network: "solana-mainnet";
  source: "phantom" | "disconnected";
  connectGuest: () => void;
  connectPhantom: () => Promise<boolean>;
  disconnect: () => void;
  creditMonet: (n: number) => void;
  debitMonet: (n: number) => boolean;
  creditSol: (n: number) => void;
  debitSol: (n: number) => boolean;
  refresh: () => void;
};

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      connected: false,
      address: null,
      tag: "DISCONNECTED",
      monet: 0,
      sol: 0,
      network: "solana-mainnet",
      source: "disconnected",

      connectGuest() {
        console.warn("[wallet] Guest sandbox wallets are disabled in production.");
      },

      async connectPhantom() {
        const provider = (
          window as Window & {
            solana?: {
              isPhantom?: boolean;
              connect: () => Promise<{
                publicKey: { toString: () => string };
              }>;
            };
          }
        ).solana;

        if (!provider?.isPhantom) {
          console.warn("[wallet] Phantom provider not found.");
          return false;
        }

        try {
          const res = await provider.connect();
          const address = res.publicKey.toString();

          set({
            connected: true,
            address,
            tag: shortTag(address),
            monet: 0,
            sol: 0,
            network: "solana-mainnet",
            source: "phantom",
          });

          return true;
        } catch (error) {
          console.error("[wallet] Phantom connection failed:", error);
          return false;
        }
      },

      disconnect() {
        set({
          connected: false,
          address: null,
          tag: "DISCONNECTED",
          monet: 0,
          sol: 0,
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
        set({
          monet: get().monet,
          sol: get().sol,
        });
      },
    }),
    {
      name: "monet-arcade-wallet",
      partialize: (state) => ({
        connected: state.connected,
        address: state.address,
        tag: state.tag,
        network: state.network,
        source: state.source,
      }),
    },
  ),
);
