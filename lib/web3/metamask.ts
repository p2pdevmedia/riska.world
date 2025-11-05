"use client";

import { createWalletClient, custom, getAddress } from "viem";
import { mainnet } from "viem/chains";

export type WalletConnection = {
  address: string;
  chainId: number;
};

type MetaMaskEthereum = {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
};

function getEthereum(): MetaMaskEthereum | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const { ethereum } = window as unknown as { ethereum?: MetaMaskEthereum };
  return ethereum?.isMetaMask ? ethereum : undefined;
}

export async function connectWallet(): Promise<WalletConnection> {
  const ethereum = getEthereum();

  if (!ethereum) {
    throw new Error("MetaMask no está disponible en este navegador.");
  }

  const [account] = (await ethereum.request({
    method: "eth_requestAccounts"
  })) as string[];

  const walletClient = createWalletClient({
    chain: mainnet,
    transport: custom(ethereum)
  });

  const address = getAddress(account);
  const { id: chainId } = await walletClient.getChainId();

  return { address, chainId };
}

export async function disconnectWallet(): Promise<void> {
  const ethereum = getEthereum();

  if (!ethereum) {
    return;
  }

  try {
    await ethereum.request({
      method: "wallet_requestPermissions",
      params: [[{ eth_accounts: {} }]]
    });
  } catch (error) {
    console.warn("No se pudo cerrar la sesión de MetaMask:", error);
  }
}

export function onWalletChange(
  handler: (payload: { accounts?: string[]; chainId?: string }) => void
): () => void {
  const ethereum = getEthereum();

  if (!ethereum || !ethereum.on) {
    return () => undefined;
  }

  const accountsHandler = (accounts: string[]) => handler({ accounts });
  const chainHandler = (chainId: string) => handler({ chainId });

  ethereum.on("accountsChanged", accountsHandler);
  ethereum.on("chainChanged", chainHandler);

  return () => {
    (ethereum as MetaMaskEthereum & { removeListener?: typeof ethereum.on }).removeListener?.(
      "accountsChanged",
      accountsHandler
    );
    (ethereum as MetaMaskEthereum & { removeListener?: typeof ethereum.on }).removeListener?.(
      "chainChanged",
      chainHandler
    );
  };
}
