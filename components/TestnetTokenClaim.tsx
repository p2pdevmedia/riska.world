"use client";

import { Check, Coins, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { createPublicClient, http, type Address } from "viem";
import { worldchainSepolia } from "viem/chains";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import {
  WORLDCHAIN_SEPOLIA_CHAIN_ID,
  type RiskaTestnetConfigResponse
} from "@/lib/riska-testnet";
import {
  connectWallet,
  createWorldchainSepoliaWalletClient,
  switchToWorldchainSepolia
} from "@/lib/web3/metamask";

const claimFaucetAbi = [
  {
    inputs: [{ name: "", type: "address" }],
    name: "claimed",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

const assets = [
  { amount: "15,000", symbol: "USDC" },
  { amount: "2", symbol: "BTC" },
  { amount: "5", symbol: "ETH" },
  { amount: "50", symbol: "SOL" }
];

type ClaimStatus = "idle" | "loading" | "claimed" | "error";

export function TestnetTokenClaim() {
  const [faucetAddress, setFaucetAddress] = useState<Address | null>(null);
  const [status, setStatus] = useState<ClaimStatus>("loading");
  const [message, setMessage] = useState("Verificando faucet de World Chain Sepolia…");

  useEffect(() => {
    void fetch("/api/contracts/worldchain-sepolia", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as RiskaTestnetConfigResponse;
        const address = data.deployment?.contracts.testnetTokenFaucet?.address;

        if (!response.ok || !data.configured || data.deployment?.chainId !== String(WORLDCHAIN_SEPOLIA_CHAIN_ID) || !address) {
          throw new Error("El faucet todavía no está desplegado en World Chain Sepolia.");
        }

        setFaucetAddress(address);
        setStatus("idle");
        setMessage("Una reclamación por wallet. Solo tokens de prueba.");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "No se pudo cargar el faucet de testnet.");
      });
  }, []);

  async function claimTokens() {
    if (!faucetAddress) return;

    setStatus("loading");
    setMessage("Conectando la wallet a World Chain Sepolia…");

    try {
      await switchToWorldchainSepolia();
      const wallet = await connectWallet(worldchainSepolia);
      if (wallet.chainId !== WORLDCHAIN_SEPOLIA_CHAIN_ID) throw new Error("Cambiá a World Chain Sepolia para reclamar.");

      const publicClient = createPublicClient({ chain: worldchainSepolia, transport: http() });
      const alreadyClaimed = await publicClient.readContract({
        address: faucetAddress,
        abi: claimFaucetAbi,
        functionName: "claimed",
        args: [wallet.address as Address]
      });

      if (alreadyClaimed) {
        setStatus("claimed");
        setMessage("Esta wallet ya reclamó los tokens de prueba.");
        return;
      }

      setMessage("Confirmá la transacción en tu wallet…");
      const walletClient = await createWorldchainSepoliaWalletClient();
      const hash = await walletClient.writeContract({
        account: wallet.address as Address,
        address: faucetAddress,
        abi: claimFaucetAbi,
        functionName: "claim"
      });

      setMessage("Esperando la confirmación de World Chain Sepolia…");
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus("claimed");
      setMessage("Tokens de prueba reclamados correctamente.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo reclamar los tokens.");
    }
  }

  return (
    <div className="riska-dark-surface flex min-h-screen flex-col bg-[#080b10] text-[#f5f7fb]">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-5 py-16 pb-28">
        <section className="w-full max-w-xl overflow-hidden rounded-[28px] border border-[#202936] bg-[#10151d] p-5 shadow-[0_22px_60px_rgba(8,11,16,0.28)] md:p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#20295b] text-[#aeb8ff]">
            <Coins className="h-6 w-6" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#aeb8ff]">World Chain Sepolia · testnet</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#f5f7fb]">Claim test tokens</h1>
          <p className="mt-3 text-sm leading-6 text-[#9baac0]">Esta página no aparece en la navegación. El contrato solo permite una reclamación por wallet y solo existe en testnet.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {assets.map((asset) => (
              <div className="rounded-xl border border-[#303a49] bg-[#0b1018] p-4" key={asset.symbol}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8190a6]">{asset.symbol}</p>
                <p className="mt-1 text-2xl font-semibold text-[#f5f7fb]">{asset.amount}</p>
              </div>
            ))}
          </div>

          <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${status === "error" ? "border-red-400/30 bg-red-400/10 text-red-200" : status === "claimed" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-[#303a49] bg-[#151d28] text-[#9baac0]"}`}>
            {status === "loading" ? <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" /> : status === "claimed" ? <Check className="mr-2 inline h-4 w-4" /> : <ShieldCheck className="mr-2 inline h-4 w-4" />}
            {message}
          </div>

          <button
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#5868ea] px-4 text-sm font-semibold text-white transition hover:bg-[#4f63e8] disabled:cursor-not-allowed disabled:bg-[#303a49] disabled:text-[#8190a6]"
            disabled={!faucetAddress || status === "loading" || status === "claimed"}
            onClick={() => void claimTokens()}
            type="button"
          >
            {status === "loading" && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {status === "claimed" ? "Claim completed" : "Claim test tokens"}
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
