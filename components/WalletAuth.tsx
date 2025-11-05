"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { connectWallet, disconnectWallet, onWalletChange } from "@/lib/web3/metamask";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

type AuthState =
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "connected"; address: string; chainId: number };

export function WalletAuth() {
  const [state, setState] = useState<AuthState>({ status: "disconnected" });
  const [message, setMessage] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setState({ status: "connecting" });
    setMessage(null);
    try {
      const connection = await connectWallet();
      setState({ status: "connected", ...connection });
      setMessage("¡Bienvenido a la cobertura inteligente para humanos reales!");
    } catch (error) {
      console.error(error);
      setState({ status: "disconnected" });
      setMessage(error instanceof Error ? error.message : "No se pudo conectar la wallet.");
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setState({ status: "disconnected" });
    setMessage("Sesión cerrada. Puedes volver a conectar cuando quieras.");
  }, []);

  useEffect(() => {
    return onWalletChange(({ accounts, chainId }) => {
      if (accounts && accounts.length === 0) {
        setState({ status: "disconnected" });
      } else if (accounts && accounts.length > 0) {
        setState((prev) =>
          prev.status === "connected"
            ? { status: "connected", address: accounts[0], chainId: prev.chainId }
            : { status: "connected", address: accounts[0], chainId: parseInt(chainId ?? "0", 16) }
        );
      }

      if (chainId) {
        setState((prev) =>
          prev.status === "connected"
            ? { ...prev, chainId: parseInt(chainId, 16) }
            : { status: "connected", address: accounts?.[0] ?? "", chainId: parseInt(chainId, 16) }
        );
      }
    });
  }, []);

  const primaryAction = useMemo(() => {
    if (state.status === "connected") {
      return (
        <button
          onClick={disconnect}
          className="px-6 py-3 rounded-full bg-night-800 text-slate-200 border border-white/10 hover:border-aurora-500 transition"
        >
          Cerrar sesión
        </button>
      );
    }

    return (
      <button
        onClick={connect}
        className="px-6 py-3 rounded-full bg-aurora-600 text-white shadow-glow hover:bg-aurora-500 transition"
      >
        {state.status === "connecting" ? "Conectando…" : "Conectar con MetaMask"}
      </button>
    );
  }, [connect, disconnect, state]);

  return (
    <div className="glass-panel p-8 md:p-10 space-y-6 max-w-lg">
      <div>
        <h3 className="text-2xl font-semibold">Acceso seguro</h3>
        <p className="text-sm text-slate-300/80">
          Autentícate con MetaMask para gestionar pólizas, presentar reclamos y acceder a beneficios para humanos verificados.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Estado</p>
          <p className="text-lg font-medium">
            {state.status === "connected"
              ? `Sesión activa en ${truncateAddress(state.address)}`
              : state.status === "connecting"
              ? "Conectando…"
              : "No conectado"}
          </p>
          {state.status === "connected" && (
            <p className="text-xs text-slate-400 mt-1">Chain ID: {state.chainId}</p>
          )}
        </div>
        {primaryAction}
      </div>

      {message && (
        <p className="text-xs text-aurora-500/90 bg-aurora-500/10 border border-aurora-500/20 rounded-xl px-4 py-2">
          {message}
        </p>
      )}
    </div>
  );
}
