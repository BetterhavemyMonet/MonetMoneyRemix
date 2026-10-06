import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { apiOrigin, loadMonetConfig } from "./monet-config";

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  signAndSendTransaction?: (
    transaction: Transaction,
  ) => Promise<{ signature?: string } | string>;
  signTransaction?: (
    transaction: Transaction,
  ) => Promise<Transaction>;
};

type BlockhashResponse = {
  blockhash?: string;
};

type BroadcastResponse = {
  signature?: string;
  error?: string;
};

function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === "undefined") return null;

  const provider = (
    window as Window & {
      solana?: PhantomProvider;
    }
  ).solana;

  return provider?.isPhantom ? provider : null;
}

function createMemoInstruction(
  payer: PublicKey,
  memo: string,
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      {
        pubkey: payer,
        isSigner: true,
        isWritable: false,
      },
    ],
    programId: new PublicKey(
      "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
    ),
    data: Buffer.from(memo, "utf8"),
  });
}

async function getBackendBlockhash(): Promise<string> {
  const response = await fetch(`${apiOrigin()}/api/blockhash`, {
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as BlockhashResponse;

  if (!response.ok || !data.blockhash) {
    throw new Error("Could not obtain a Solana blockhash");
  }

  return data.blockhash;
}

async function broadcastSignedTransaction(
  transaction: Transaction,
): Promise<string> {
  const serialized = transaction.serialize();

  let binary = "";

  for (const byte of serialized) {
    binary += String.fromCharCode(byte);
  }

  const encoded = btoa(binary);

  const response = await fetch(
    `${apiOrigin()}/api/broadcast-transaction`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: encoded,
      }),
    },
  );

  const data = (await response.json().catch(() => ({}))) as BroadcastResponse;

  if (!response.ok || !data.signature) {
    throw new Error(
      data.error || "Could not broadcast entry transaction",
    );
  }

  return data.signature;
}

export async function payMonetEntry(
  walletAddress: string,
  game: string,
  amountMonet: number,
): Promise<string> {
  if (!walletAddress) {
    throw new Error("Connect wallet first");
  }

  if (!Number.isFinite(amountMonet) || amountMonet <= 0) {
    throw new Error("Invalid MONET entry amount");
  }

  const provider = getPhantomProvider();

  if (!provider) {
    throw new Error("Phantom wallet is not available");
  }

  const config = await loadMonetConfig();

  const payer = new PublicKey(walletAddress);

  if (
    provider.publicKey &&
    provider.publicKey.toString() !== payer.toString()
  ) {
    throw new Error("Connected wallet does not match arcade wallet");
  }

  const mint = new PublicKey(config.mint);
  const treasury = new PublicKey(config.treasuryAddress);

  const sourceAta = getAssociatedTokenAddressSync(
    mint,
    payer,
  );

  const treasuryAta = getAssociatedTokenAddressSync(
    mint,
    treasury,
  );

  const scale = 10 ** config.decimals;

  const rawAmount = BigInt(
    Math.round(amountMonet * scale),
  );

  if (rawAmount <= 0n) {
    throw new Error("Entry amount is too small");
  }

  const blockhash = await getBackendBlockhash();

  const transaction = new Transaction();

  transaction.feePayer = payer;
  transaction.recentBlockhash = blockhash;

  transaction.add(
    createTransferInstruction(
      sourceAta,
      treasuryAta,
      payer,
      rawAmount,
    ),
  );

  transaction.add(
    createMemoInstruction(
      payer,
      `Monet Arcade | ${game.toUpperCase()} | ${amountMonet} MONET entry fee`,
    ),
  );

  if (provider.signAndSendTransaction) {
    const result =
      await provider.signAndSendTransaction(transaction);

    const signature =
      typeof result === "string"
        ? result
        : result?.signature;

    if (!signature) {
      throw new Error("Wallet did not return a transaction signature");
    }

    return signature;
  }

  if (!provider.signTransaction) {
    throw new Error("Wallet does not support transaction signing");
  }

  const signed =
    await provider.signTransaction(transaction);

  return broadcastSignedTransaction(signed);
}
