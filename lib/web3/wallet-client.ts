import { createWalletClient, custom, type Transport, type WalletClient } from "viem";
import { worldchainSepolia } from "viem/chains";

export type Eip1193RequestProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function createTransactionWalletClient(provider: Eip1193RequestProvider) {
  return createWalletClient({
    // Viem supports `null` here at runtime to disable its redundant chain
    // assertion, although the current public type only exposes `undefined`.
    chain: null as unknown as undefined,
    transport: custom(provider)
  }) as unknown as WalletClient<Transport, typeof worldchainSepolia>;
}
