import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shortTag } from "@/lib/utils";
import { FALLBACK_CONFIG } from "@/services/monet-config";
import { detectWallet, walletDeeplink, type WalletKind } from "@/services/solana-wallets";
import { fetchLiveBalance } from "@/services/live-arcade";

type WalletState = {
  connected: boolean;
  address: string | null;
  tag: string;
  monet: number;
  sol: number;
  network: "solana-mainnet";
  source: "wallet" | "disconnected";
  walletName: string | null;
  connectProvider: (kind: WalletKind) => Promise<"connected" | "redirect" | "missing">;
  disconnect: () => void;
  creditMonet: (n: number) => void;
  debitMonet: (n: number) => boolean;
  creditSol: (n: number) => void;
  debitSol: (n: number) => boolean;
  refresh: () => Promise<void>;
};

async function readChainBalances(address: string) {
  const rpc = FALLBACK_CONFIG.publicRpcUrl;
  const call = (method: string, params: unknown[]) =>
    fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }).then((r) => r.json() as Promise<{ result?: { value?: unknown } }>);

  const solJson = await call("getBalance", [address]);
  const lamports = Number(solJson.result?.value ?? 0);
  const tokJson = await call("getTokenAccountsByOwner", [
    address,
    { mint: FALLBACK_CONFIG.mint },
    { encoding: "jsonParsed" },
  ]);
  const accounts = (tokJson.result?.value ?? []) as Array<{
    account?: { data?: { parsed?: { info?: { tokenAmount?: { uiAmount?: number } } } } };
  }>;
  const monet = Number(accounts[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0);
  return { sol: lamports / 1_000_000_000, monet };
}

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      connected: false,
      address: null,
      tag: "—",
      monet: 0,
      sol: 0,
      network: "solana-mainnet",
      source: "disconnected",
      walletName: null,
      async connectProvider(kind) {
        const provider = detectWallet(kind);
        if (!provider) {
          const link = walletDeeplink(kind);
          if (link) {
            window.location.assign(link);
            return "redirect";
          }
          return "missing";
        }
        const res = await provider.connect();
        const address = res.publicKey.toString();
        set({
          connected: true,
          address,
          tag: shortTag(address),
          monet: 0,
          sol: 0,
          network: "solana-mainnet",
          source: "wallet",
          walletName: kind,
        });
        void get().refresh();
        return "connected";
      },
      disconnect() {
        set({
          connected: false,
          source: "disconnected",
          walletName: null,
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
      async refresh() {
        const current = get();
        if (current.source !== "wallet" || !current.address) return;
        try {
          const live = await fetchLiveBalance(current.address);
          const bal = live ?? (await readChainBalances(current.address));
          if (get().address !== current.address) return;
          set({ monet: bal.monet, sol: bal.sol, network: "solana-mainnet" });
        } catch {
          /* public RPC can fail; keep the last read */
        }
      },
    }),
    { name: "monet-arcade-wallet", version: 2 },
  ),
);
