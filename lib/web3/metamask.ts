"use client";

import { createWalletClient, custom, getAddress } from "viem";
import { worldchain } from "viem/chains";

export type WalletConnection = {
  address: string;
  chainId: number;
};

type MetaMaskEthereum = {
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

export async function connectWallet(): Promise<WalletConnection> {
  const ethereum = await getMetaMaskProvider();

  if (!ethereum) {
    throw new Error("MetaMask no está disponible en este navegador.");
  }

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
    chain: worldchain,
    transport: custom(ethereum)
  });

  const address = getAddress(account);
  const chainId = await walletClient.getChainId();

  return { address, chainId };
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
