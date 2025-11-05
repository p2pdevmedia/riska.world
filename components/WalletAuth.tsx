"use client";

import { useCallback, useEffect, useState } from "react";
import { getAddress } from "viem";

import { useLanguage } from "@/components/LanguageProvider";
import { connectWallet, disconnectWallet, onWalletChange } from "@/lib/web3/metamask";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

type AuthState =
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "connected"; address: string; chainId: number };

type MessageState =
  | { type: "welcome" }
  | { type: "disconnected" }
  | { type: "error" }
  | { type: "custom"; text: string };

export function WalletAuth() {
  const { t } = useLanguage();
  const walletText = t.walletAuth;

  const [state, setState] = useState<AuthState>({ status: "disconnected" });
  const [message, setMessage] = useState<MessageState | null>(null);

  const connect = useCallback(async () => {
    setState({ status: "connecting" });
    setMessage(null);
    try {
      const connection = await connectWallet();
      setState({ status: "connected", ...connection });
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
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setState({ status: "disconnected" });
    setMessage({ type: "disconnected" });
  }, []);

  useEffect(() => {
    return onWalletChange(({ accounts, chainId }) => {
      setState((prev) => {
        if (accounts?.length === 0) {
          return { status: "disconnected" };
        }

        const fallbackAddress = prev.status === "connected" ? prev.address : undefined;
        const fallbackChainId = prev.status === "connected" ? prev.chainId : 0;

        const nextAddress = accounts && accounts.length > 0 ? getAddress(accounts[0]) : fallbackAddress;
        const nextChainId = typeof chainId === "string" ? parseInt(chainId, 16) : fallbackChainId;

        if (!nextAddress) {
          return prev;
        }

        return { status: "connected", address: nextAddress, chainId: nextChainId };
      });
    });
  }, []);

  const statusText =
    state.status === "connected"
      ? walletText.status.connected(truncateAddress(state.address))
      : state.status === "connecting"
      ? walletText.status.connecting
      : walletText.status.disconnected;

  const actionLabel =
    state.status === "connecting" ? walletText.actions.connecting : walletText.actions.connect;

  const messageText =
    message == null
      ? null
      : message.type === "custom"
      ? message.text
      : walletText.messages[message.type];

  return (
    <div className="glass-panel p-8 md:p-10 space-y-6 max-w-lg">
      <div>
        <h3 className="text-2xl font-semibold">{walletText.heading}</h3>
        <p className="text-sm text-slate-300/80">{walletText.description}</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{walletText.statusLabel}</p>
          <p className="text-lg font-medium">{statusText}</p>
          {state.status === "connected" && (
            <p className="mt-1 text-xs text-slate-400">{walletText.chainId(state.chainId)}</p>
          )}
        </div>
        {state.status === "connected" ? (
          <button
            onClick={disconnect}
            className="rounded-full border border-white/10 bg-night-800 px-6 py-3 text-slate-200 transition hover:border-aurora-500"
          >
            {walletText.actions.disconnect}
          </button>
        ) : (
          <button
            onClick={connect}
            className="rounded-full bg-aurora-600 px-6 py-3 text-white shadow-glow transition hover:bg-aurora-500"
          >
            {actionLabel}
          </button>
        )}
      </div>

      {messageText && (
        <p className="rounded-xl border border-aurora-500/20 bg-aurora-500/10 px-4 py-2 text-xs text-aurora-500/90">
          {messageText}
        </p>
      )}
    </div>
  );
}
