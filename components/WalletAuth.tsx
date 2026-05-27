"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import { useMiniKit } from "@worldcoin/minikit-js/minikit-provider";
import type { WalletAuthResult } from "@worldcoin/minikit-js/commands";
import { useCallback, useEffect, useState } from "react";
import { getAddress } from "viem";

import { useLanguage } from "@/components/LanguageProvider";
import { WorldIdGate } from "@/components/WorldIdGate";
import { connectWallet, disconnectWallet, onWalletChange } from "@/lib/web3/metamask";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

type AuthState =
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "connected"; address: string; chainId: number; method: "world-app" | "browser" };

type MessageState =
  | { type: "welcome" }
  | { type: "disconnected" }
  | { type: "error" }
  | { type: "custom"; text: string };

export function WalletAuth({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { t } = useLanguage();
  const { isInstalled } = useMiniKit();
  const walletText = t.walletAuth;

  const [state, setState] = useState<AuthState>({ status: "disconnected" });
  const [message, setMessage] = useState<MessageState | null>(null);

  const connectMiniAppWallet = useCallback(async () => {
    const nonceResponse = await fetch("/api/minikit/nonce", {
      cache: "no-store"
    });

    if (!nonceResponse.ok) {
      throw new Error(walletText.messages.nonceError);
    }

    const noncePayload = (await nonceResponse.json()) as {
      nonce: string;
      statement: string;
      expiresAt: string;
    };

    const result = await MiniKit.walletAuth({
      nonce: noncePayload.nonce,
      statement: noncePayload.statement,
      expirationTime: new Date(noncePayload.expiresAt)
    });

    if (result.executedWith === "fallback") {
      throw new Error(walletText.messages.worldAppRequired);
    }

    const completeResponse = await fetch("/api/minikit/complete-siwe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nonce: noncePayload.nonce,
        payload: result.data satisfies WalletAuthResult
      })
    });

    const completePayload = (await completeResponse.json()) as {
      isValid: boolean;
      address?: string;
      chainId?: number;
      error?: string;
    };

    if (!completeResponse.ok || !completePayload.isValid || !completePayload.address) {
      throw new Error(completePayload.error ?? walletText.messages.verifyError);
    }

    return {
      address: getAddress(completePayload.address),
      chainId: completePayload.chainId ?? 480
    };
  }, [walletText.messages.nonceError, walletText.messages.verifyError, walletText.messages.worldAppRequired]);

  const connect = useCallback(async () => {
    setState({ status: "connecting" });
    setMessage(null);
    try {
      if (isInstalled) {
        const connection = await connectMiniAppWallet();
        setState({ status: "connected", method: "world-app", ...connection });
      } else {
        const connection = await connectWallet();
        setState({ status: "connected", method: "browser", ...connection });
      }
      setMessage({ type: "welcome" });
    } catch (error) {
      console.error(error);
      setState({ status: "disconnected" });
      if (error instanceof Error && error.message) {
        setMessage({ type: "custom", text: error.message });
      } else {
        setMessage({ type: "error" });
      }
    }
  }, [connectMiniAppWallet, isInstalled]);

  const disconnect = useCallback(async () => {
    if (state.status === "connected" && state.method === "browser") {
      await disconnectWallet();
    }
    setState({ status: "disconnected" });
    setMessage({ type: "disconnected" });
  }, [state]);

  useEffect(() => {
    return onWalletChange(({ accounts, chainId }) => {
      setState((prev) => {
        if (accounts?.length === 0) {
          return { status: "disconnected" };
        }

        const fallbackAddress = prev.status === "connected" ? prev.address : undefined;
        const fallbackChainId = prev.status === "connected" ? prev.chainId : 0;
        const fallbackMethod = prev.status === "connected" ? prev.method : "browser";

        const nextAddress = accounts && accounts.length > 0 ? getAddress(accounts[0]) : fallbackAddress;
        const nextChainId = typeof chainId === "string" ? parseInt(chainId, 16) : fallbackChainId;

        if (!nextAddress) {
          return prev;
        }

        return {
          status: "connected",
          address: nextAddress,
          chainId: nextChainId,
          method: fallbackMethod
        };
      });
    });
  }, []);

  const statusText =
    state.status === "connected"
      ? walletText.status.connected(truncateAddress(state.address))
      : state.status === "connecting"
      ? walletText.status.connecting
      : walletText.status.disconnected;

  const miniAppStatus =
    isInstalled === undefined
      ? walletText.miniApp.checking
      : isInstalled
      ? walletText.miniApp.installed
      : walletText.miniApp.browserFallback;

  const actionLabel =
    state.status === "connecting"
      ? walletText.actions.connecting
      : isInstalled
      ? walletText.actions.connectWorldApp
      : walletText.actions.connectBrowser;

  const messageText =
    message == null
      ? null
      : message.type === "custom"
      ? message.text
      : walletText.messages[message.type];

  const isLight = variant === "light";
  const panelClass = isLight
    ? "border border-[#d9ded5] bg-white p-5 md:p-7 space-y-5"
    : "glass-panel p-8 md:p-10 space-y-6 max-w-lg";
  const descriptionClass = isLight ? "text-sm text-[#516159]" : "text-sm text-slate-300/80";
  const miniPanelClass = isLight
    ? "border border-[#dce4d8] bg-[#f8faf6] px-4 py-3"
    : "rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3";
  const eyebrowClass = isLight
    ? "text-xs uppercase tracking-[0.26em] text-[#6b766f]"
    : "text-xs uppercase tracking-[0.26em] text-slate-400";
  const statusEyebrowClass = isLight
    ? "text-sm uppercase tracking-[0.22em] text-[#6b766f]"
    : "text-sm uppercase tracking-[0.3em] text-slate-400";
  const secondaryTextClass = isLight ? "text-sm text-[#405047]" : "text-sm text-slate-200";
  const detailTextClass = isLight ? "mt-1 text-xs text-[#66746e]" : "mt-1 text-xs text-slate-400";
  const primaryButtonClass = isLight
    ? "bg-[#17231e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#26342d] disabled:cursor-not-allowed disabled:bg-[#ccd6cf] disabled:text-[#728078]"
    : "rounded-full bg-aurora-600 px-6 py-3 text-white shadow-glow transition hover:bg-aurora-500 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:shadow-none";
  const secondaryButtonClass = isLight
    ? "border border-[#cbd7cf] bg-white px-5 py-3 text-sm font-semibold text-[#26342d] transition hover:border-[#17231e]"
    : "rounded-full border border-white/10 bg-night-800 px-6 py-3 text-slate-200 transition hover:border-aurora-500";
  const messageClass = isLight
    ? "border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-800"
    : "rounded-xl border border-aurora-500/20 bg-aurora-500/10 px-4 py-2 text-xs text-aurora-500/90";

  return (
    <div className={panelClass}>
      <div>
        <h3 className="text-2xl font-semibold">{walletText.heading}</h3>
        <p className={descriptionClass}>{walletText.description}</p>
      </div>

      <div className={miniPanelClass}>
        <p className={eyebrowClass}>
          {walletText.miniApp.label}
        </p>
        <p className={`mt-1 ${secondaryTextClass}`}>{miniAppStatus}</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={statusEyebrowClass}>{walletText.statusLabel}</p>
          <p className="text-lg font-medium">{statusText}</p>
          {state.status === "connected" && (
            <p className={detailTextClass}>
              {walletText.chainId(state.chainId)} · {walletText.mode[state.method]}
            </p>
          )}
        </div>
        {state.status === "connected" ? (
          <button
            onClick={disconnect}
            className={secondaryButtonClass}
          >
            {walletText.actions.disconnect}
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={state.status === "connecting"}
            className={primaryButtonClass}
          >
            {actionLabel}
          </button>
        )}
      </div>

      {messageText && (
        <p className={messageClass}>
          {messageText}
        </p>
      )}

      <WorldIdGate
        variant={variant}
        walletAddress={state.status === "connected" ? state.address : undefined}
      />
    </div>
  );
}
