import { apiBase } from "./backend";

type PayPalConfig = {
  ok: boolean;
  clientId?: string;
  error?: string;
};

export type PayPalCreateResult = {
  ok: boolean;
  orderId: string;
  sessionToken: string;
  usdAmount: number;
  monetAmount: number;
  monetBaseUnits: number;
  solPriceUsd?: number | null;
  solEquivalent?: number | null;
  error?: string;
};

export type PayPalCaptureResult = {
  ok: boolean;
  processing?: boolean;
  usdAmount?: number;
  monetAmount?: number;
  txId?: string | null;
  alreadyPaid?: boolean;
  code?: string;
  paymentCaptured?: boolean;
  walletAddress?: string;
  ataAddress?: string;
  prepareAtaEndpoint?: string;
  message?: string;
  error?: string;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        style?: Record<string, unknown>;
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onCancel?: () => void;
        onError?: (error: unknown) => void;
      }) => {
        render: (selector: string) => Promise<void>;
        close?: () => Promise<void>;
      };
    };
  }
}

let paypalLoadPromise: Promise<void> | null = null;

export async function loadPayPal(): Promise<void> {
  if (window.paypal) return;

  if (paypalLoadPromise) {
    return paypalLoadPromise;
  }

  paypalLoadPromise = (async () => {
    const response = await fetch(`${apiBase()}/api/paypal/config`);

    const config = (await response.json()) as PayPalConfig;

    if (!response.ok || !config.ok || !config.clientId) {
      throw new Error(config.error || "PayPal is not configured");
    }

    const clientId = config.clientId;

    await new Promise<void>((resolve, reject) => {
      const existing =
        document.querySelector<HTMLScriptElement>(
          "script[data-monet-paypal-sdk]",
        );

      if (existing) {
        if (window.paypal) {
          resolve();
          return;
        }

        existing.addEventListener("load", () => resolve(), {
          once: true,
        });

        existing.addEventListener(
          "error",
          () => reject(new Error("PayPal SDK failed to load")),
          { once: true },
        );

        return;
      }

      const script = document.createElement("script");

      script.dataset.monetPaypalSdk = "1";

      script.src =
        "https://www.paypal.com/sdk/js?client-id=" +
        encodeURIComponent(clientId) +
        "&currency=USD&intent=capture&components=buttons";

      script.onload = () => resolve();

      script.onerror = () =>
        reject(new Error("PayPal SDK failed to load"));

      document.head.appendChild(script);
    });

    if (!window.paypal) {
      throw new Error("PayPal SDK unavailable");
    }
  })();

  try {
    await paypalLoadPromise;
  } catch (error) {
    paypalLoadPromise = null;
    throw error;
  }
}

export async function createMonetPayPalOrder(
  usdAmount: number,
  walletAddress: string,
): Promise<PayPalCreateResult> {
  const response = await fetch(
    `${apiBase()}/api/buy-monet/paypal/create-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usdAmount,
        walletAddress,
      }),
    },
  );

  const data = (await response.json()) as PayPalCreateResult;

  if (!response.ok || !data.ok || !data.orderId || !data.sessionToken) {
    throw new Error(data.error || "Could not create PayPal order");
  }

  return data;
}

export async function captureMonetPayPalOrder(
  orderId: string,
  sessionToken: string,
): Promise<PayPalCaptureResult> {
  const response = await fetch(
    `${apiBase()}/api/buy-monet/paypal/capture-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        sessionToken,
      }),
    },
  );

  const data = (await response.json()) as PayPalCaptureResult;

  if (
    response.status === 409 &&
    data.code === "ATA_REQUIRED" &&
    data.paymentCaptured
  ) {
    return data;
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || data.message || "PayPal capture failed");
  }

  return data;
}
