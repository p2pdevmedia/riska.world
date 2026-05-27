"use client";

import { createWalletClient, custom, getAddress, type Chain } from "viem";
import { worldchain, worldchainSepolia } from "viem/chains";

import {
  WORLDCHAIN_SEPOLIA_CHAIN_ID_HEX,
  WORLDCHAIN_SEPOLIA_EXPLORER_URL,
  WORLDCHAIN_SEPOLIA_RPC_URL
} from "@/lib/riska-testnet";

export type WalletConnection = {
  address: string;
  chainId: number;
};

export type MetaMaskEthereum = {
  isMetaMask?: boolean;
  providers?: MetaMaskEthereum[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

type Eip6963ProviderDetail = {
  info: {
    rdns?: string;
    name?: string;
  };
  provider: MetaMaskEthereum;
};

const METAMASK_RDNS = "io.metamask";
const WALLET_REQUEST_TIMEOUT_MS = 45_000;

let cachedMetaMaskProvider: MetaMaskEthereum | undefined;

function getInjectedMetaMask(): MetaMaskEthereum | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const { ethereum } = window as unknown as { ethereum?: MetaMaskEthereum };
  const providers = ethereum?.providers ?? [];

  return (
    providers.find((provider) => provider.isMetaMask) ??
    (ethereum?.isMetaMask ? ethereum : undefined)
  );
}

async function getEip6963MetaMask(): Promise<MetaMaskEthereum | undefined> {
  if (typeof window === "undefined") {
    return undefined;
  }

  return new Promise((resolve) => {
    const providers: Eip6963ProviderDetail[] = [];
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      window.removeEventListener("eip6963:announceProvider", handleProvider);

      resolve(
        providers.find(({ info }) => info.rdns === METAMASK_RDNS)?.provider ??
          providers.find(({ provider }) => provider.isMetaMask)?.provider
      );
    };

    const handleProvider = (event: Event) => {
      providers.push((event as CustomEvent<Eip6963ProviderDetail>).detail);
    };

    window.addEventListener("eip6963:announceProvider", handleProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    window.setTimeout(finish, 300);
  });
}

async function getMetaMaskProvider(): Promise<MetaMaskEthereum | undefined> {
  if (cachedMetaMaskProvider) {
    return cachedMetaMaskProvider;
  }

  cachedMetaMaskProvider = (await getEip6963MetaMask()) ?? getInjectedMetaMask();
  return cachedMetaMaskProvider;
}

export async function getBrowserEthereumProvider(): Promise<MetaMaskEthereum> {
  const ethereum = await getMetaMaskProvider();

  if (!ethereum) {
    throw new Error("MetaMask no está disponible en este navegador.");
  }

  return ethereum;
}

async function requestWithTimeout<T>(request: Promise<T>, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), WALLET_REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([request, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function connectWallet(chain: Chain = worldchain): Promise<WalletConnection> {
  const ethereum = await getBrowserEthereumProvider();

  const [account] = (await requestWithTimeout(
    ethereum.request({
      method: "eth_requestAccounts"
    }) as Promise<string[]>,
    "MetaMask no respondió a tiempo. Revisa si la extensión está desbloqueada y vuelve a intentar."
  )) as string[];

  if (!account) {
    throw new Error("MetaMask no devolvió ninguna cuenta.");
  }

  const walletClient = createWalletClient({
    chain,
    transport: custom(ethereum)
  });

  const address = getAddress(account);
  const chainId = await walletClient.getChainId();

  return { address, chainId };
}

export async function switchToWorldchainSepolia(): Promise<void> {
  const ethereum = await getBrowserEthereumProvider();

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: WORLDCHAIN_SEPOLIA_CHAIN_ID_HEX }]
    });
  } catch (error) {
    if (!isUnknownChainError(error)) {
      throw error;
    }

    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          blockExplorerUrls: [WORLDCHAIN_SEPOLIA_EXPLORER_URL.replace(/\/address\/$/, "")],
          chainId: WORLDCHAIN_SEPOLIA_CHAIN_ID_HEX,
          chainName: "World Chain Sepolia",
          nativeCurrency: {
            decimals: 18,
            name: "Ether",
            symbol: "ETH"
          },
          rpcUrls: [WORLDCHAIN_SEPOLIA_RPC_URL]
        }
      ]
    });
  }
}

export async function createWorldchainSepoliaWalletClient() {
  const ethereum = await getBrowserEthereumProvider();

  return createWalletClient({
    chain: worldchainSepolia,
    transport: custom(ethereum)
  });
}

export async function disconnectWallet(): Promise<void> {
  const ethereum = await getMetaMaskProvider();

  if (!ethereum) {
    return;
  }

  try {
    await ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }]
    });
  } catch (error) {
    console.warn("No se pudo cerrar la sesión de MetaMask:", error);
  }
}

export function onWalletChange(
  handler: (payload: { accounts?: string[]; chainId?: string }) => void
): () => void {
  const accountsHandler: (...args: unknown[]) => void = (accounts) => {
    if (Array.isArray(accounts)) {
      handler({ accounts: accounts as string[] });
    }
  };

  const chainHandler: (...args: unknown[]) => void = (chainId) => {
    if (typeof chainId === "string") {
      handler({ chainId });
    }
  };

  let removeListeners = () => undefined;
  let disposed = false;

  void getMetaMaskProvider().then((ethereum) => {
    if (disposed || !ethereum?.on) {
      return;
    }

    ethereum.on("accountsChanged", accountsHandler);
    ethereum.on("chainChanged", chainHandler);

    removeListeners = () => {
      ethereum.removeListener?.("accountsChanged", accountsHandler);
      ethereum.removeListener?.("chainChanged", chainHandler);
    };
  });

  return () => {
    disposed = true;
    removeListeners();
  };
}

function isUnknownChainError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ((error as { code?: unknown }).code === 4902 || (error as { code?: unknown }).code === -32603)
  );
}
