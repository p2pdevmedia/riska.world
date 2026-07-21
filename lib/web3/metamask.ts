"use client";

import { createWalletClient, custom, getAddress, type Chain } from "viem";
import { worldchain } from "viem/chains";

import {
  WORLDCHAIN_SEPOLIA_CHAIN_ID_HEX,
  WORLDCHAIN_SEPOLIA_EXPLORER_URL,
  WORLDCHAIN_SEPOLIA_RPC_URL
} from "@/lib/riska-testnet";
import { createTransactionWalletClient } from "@/lib/web3/wallet-client";

export type WalletConnection = {
  address: string;
  chainId: number;
};

export type MetaMaskEthereum = {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isUniswapWallet?: boolean;
  isRabby?: boolean;
  providers?: MetaMaskEthereum[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

type Eip6963ProviderDetail = {
  info: {
    icon?: string;
    uuid?: string;
    rdns?: string;
    name?: string;
  };
  provider: MetaMaskEthereum;
};

export type BrowserWalletOption = {
  icon?: string;
  id: string;
  name: string;
  rdns?: string;
};

const METAMASK_RDNS = "io.metamask";
const WALLET_REQUEST_TIMEOUT_MS = 45_000;
const PROVIDER_INITIALIZATION_TIMEOUT_MS = 1_200;

let cachedMetaMaskProvider: MetaMaskEthereum | undefined;
let cachedMobileSdkProvider: MetaMaskEthereum | undefined;
let activeBrowserProvider: MetaMaskEthereum | undefined;
let discoveredBrowserWallets: Array<BrowserWalletOption & { provider: MetaMaskEthereum }> = [];

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

async function getEip6963Providers(): Promise<Eip6963ProviderDetail[]> {
  if (typeof window === "undefined") {
    return [];
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

      resolve(providers);
    };

    const handleProvider = (event: Event) => {
      providers.push((event as CustomEvent<Eip6963ProviderDetail>).detail);
    };

    window.addEventListener("eip6963:announceProvider", handleProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    window.setTimeout(finish, 300);
  });
}

function getWalletName(provider: MetaMaskEthereum, fallback = "Browser wallet") {
  if (provider.isMetaMask) return "MetaMask";
  if (provider.isCoinbaseWallet) return "Coinbase Wallet";
  if (provider.isUniswapWallet) return "Uniswap Wallet";
  if (provider.isRabby) return "Rabby Wallet";
  return fallback;
}

function getInjectedProviders() {
  if (typeof window === "undefined") return [];

  const { ethereum } = window as unknown as { ethereum?: MetaMaskEthereum };
  if (!ethereum) return [];
  return ethereum.providers?.length ? ethereum.providers : [ethereum];
}

export async function discoverBrowserWallets(): Promise<BrowserWalletOption[]> {
  const announced = await getEip6963Providers();
  const candidates: Array<BrowserWalletOption & { provider: MetaMaskEthereum }> = [];
  const seenProviders = new Set<MetaMaskEthereum>();

  const add = (provider: MetaMaskEthereum, option: BrowserWalletOption) => {
    if (seenProviders.has(provider)) return;
    seenProviders.add(provider);
    candidates.push({ ...option, provider });
  };

  announced.forEach(({ info, provider }, index) => {
    add(provider, {
      icon: info.icon,
      id: `eip6963:${info.rdns ?? info.uuid ?? index}`,
      name: info.name ?? getWalletName(provider),
      rdns: info.rdns
    });
  });

  getInjectedProviders().forEach((provider, index) => {
    add(provider, {
      id: `injected:${index}:${getWalletName(provider).toLowerCase().replace(/\s+/g, "-")}`,
      name: getWalletName(provider),
      rdns: provider.isMetaMask ? METAMASK_RDNS : undefined
    });
  });

  // MetaMask Mobile does not always expose an injected provider before its SDK
  // has initialized. Keep its existing deep-link fallback available on phones.
  if (candidates.length === 0 && isMobileDevice()) {
    const mobileProvider = await getMobileSdkProvider();
    if (mobileProvider) {
      add(mobileProvider, { id: "metamask-mobile", name: "MetaMask" , rdns: METAMASK_RDNS });
    }
  }

  discoveredBrowserWallets = candidates;
  return candidates.map(({ provider: _provider, ...option }) => option);
}

async function getMetaMaskProvider(): Promise<MetaMaskEthereum | undefined> {
  if (cachedMetaMaskProvider) {
    return cachedMetaMaskProvider;
  }

  const announced = await getEip6963Providers();
  cachedMetaMaskProvider =
    announced.find(({ info }) => info.rdns === METAMASK_RDNS)?.provider ??
    announced.find(({ provider }) => provider.isMetaMask)?.provider ??
    getInjectedMetaMask();

  // MetaMask Mobile injects the provider asynchronously after its in-app browser
  // has loaded the page. Waiting for its initialization event avoids presenting a
  // false "not available" error while the app is still preparing the dapp.
  if (!cachedMetaMaskProvider) {
    cachedMetaMaskProvider = await waitForInjectedMetaMask();
  }

  return cachedMetaMaskProvider;
}

function waitForInjectedMetaMask(): Promise<MetaMaskEthereum | undefined> {
  if (typeof window === "undefined") {
    return Promise.resolve(undefined);
  }

  return new Promise((resolve) => {
    const finish = () => {
      window.removeEventListener("ethereum#initialized", handleInitialized);
      resolve(getInjectedMetaMask());
    };

    const handleInitialized = () => finish();

    window.addEventListener("ethereum#initialized", handleInitialized, { once: true });
    window.setTimeout(finish, PROVIDER_INITIALIZATION_TIMEOUT_MS);
  });
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function getMobileSdkProvider(): Promise<MetaMaskEthereum | undefined> {
  if (!isMobileDevice()) {
    return undefined;
  }

  if (cachedMobileSdkProvider) {
    return cachedMobileSdkProvider;
  }

  const { default: MetaMaskSDK } = await import("@metamask/sdk");
  const sdk = new MetaMaskSDK({
    dappMetadata: {
      name: "Riska",
      url: window.location.origin
    }
  });

  const provider = sdk.getProvider();
  if (!provider) {
    return undefined;
  }

  cachedMobileSdkProvider = provider as unknown as MetaMaskEthereum;
  return cachedMobileSdkProvider;
}

export async function getBrowserEthereumProvider(walletId?: string): Promise<MetaMaskEthereum> {
  if (walletId) {
    if (discoveredBrowserWallets.length === 0) {
      await discoverBrowserWallets();
    }
    const selected = discoveredBrowserWallets.find((wallet) => wallet.id === walletId)?.provider;
    if (selected) {
      activeBrowserProvider = selected;
      return selected;
    }
  }

  const ethereum = activeBrowserProvider ?? (await getMetaMaskProvider()) ?? (await getMobileSdkProvider());

  if (!ethereum) {
    throw new Error("No encontramos una wallet compatible. Instala o abre MetaMask, Coinbase Wallet, Uniswap Wallet, Rabby u otra wallet EIP-1193.");
  }

  activeBrowserProvider = ethereum;
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

export async function connectWallet(chain: Chain = worldchain, walletId?: string): Promise<WalletConnection> {
  const ethereum = await getBrowserEthereumProvider(walletId);

  const [account] = (await requestWithTimeout(
    ethereum.request({
      method: "eth_requestAccounts"
    }) as Promise<string[]>,
    "La wallet no respondió a tiempo. Revisa que esté desbloqueada y vuelve a intentar."
  )) as string[];

  if (!account) {
    throw new Error("La wallet no devolvió ninguna cuenta.");
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

  // `switchToWorldchainSepolia` validates/selects the network before this
  // client is created. Keeping the wallet client chain-agnostic prevents Viem
  // from issuing a second `eth_chainId` request while a transaction request is
  // already in flight. Some injected providers can cross those responses and
  // return transaction calldata (for example the policy terms hash) as the
  // chain id, which Viem then rejects as an unsafe JavaScript integer.
  return createTransactionWalletClient(ethereum);
}

export async function disconnectWallet(): Promise<void> {
  const ethereum = activeBrowserProvider ?? (await getMetaMaskProvider());

  if (!ethereum) {
    return;
  }

  try {
    await ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }]
    });
  } catch (error) {
    console.warn("No se pudo revocar el acceso de la wallet:", error);
  } finally {
    activeBrowserProvider = undefined;
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

  void getBrowserEthereumProvider()
    .then((ethereum) => {
      if (disposed || !ethereum?.on) {
        return;
      }

      ethereum.on("accountsChanged", accountsHandler);
      ethereum.on("chainChanged", chainHandler);

      removeListeners = () => {
        ethereum.removeListener?.("accountsChanged", accountsHandler);
        ethereum.removeListener?.("chainChanged", chainHandler);
      };
    })
    // A browser without an injected wallet is a supported state. The connect
    // button will surface the actionable error if the user explicitly uses it.
    .catch(() => undefined);

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
