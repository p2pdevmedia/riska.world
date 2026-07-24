"use client";

import { FlaskConical, ShieldCheck } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type RiskaEnvironment = "prod-test" | "testnet";

type EnvironmentContextValue = {
  environment: RiskaEnvironment;
  productionAvailable: boolean;
  setEnvironment: (environment: RiskaEnvironment) => void;
};

const storageKey = "riska.network-environment";
const EnvironmentContext = createContext<EnvironmentContextValue | null>(null);

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
  const [environment, setEnvironment] = useState<RiskaEnvironment>("testnet");
  const [productionAvailable, setProductionAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/contracts/worldchain-sepolia?environment=production", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { configured?: boolean; deployment?: { chainId?: string } };
        if (!cancelled && response.ok && payload.configured && payload.deployment?.chainId === "480") {
          setProductionAvailable(true);
          if (window.localStorage.getItem(storageKey) === "prod-test") setEnvironment("prod-test");
        } else if (window.localStorage.getItem(storageKey) === "prod-test") {
          window.localStorage.removeItem(storageKey);
          setEnvironment("testnet");
        }
      })
      .catch(() => undefined);

    const stored = window.localStorage.getItem(storageKey);
    if (stored === "testnet") setEnvironment(stored);
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(
    () => ({
      environment,
      productionAvailable,
      setEnvironment: (nextEnvironment: RiskaEnvironment) => {
        if (nextEnvironment === "prod-test" && !productionAvailable) return;
        window.localStorage.setItem(storageKey, nextEnvironment);
        setEnvironment(nextEnvironment);
      }
    }),
    [environment, productionAvailable]
  );

  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (!context) throw new Error("useEnvironment must be used within EnvironmentProvider.");
  return context;
}

export function EnvironmentSwitcher() {
  const { environment, productionAvailable, setEnvironment } = useEnvironment();
  const isTestnet = environment === "testnet";

  return (
    <div aria-label="Entorno de red" className="flex items-center gap-1 rounded-xl border border-[#303a49] bg-[#080b10] p-1">
      <button
        aria-pressed={!isTestnet}
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition ${
          !isTestnet ? "bg-[#174a38] text-[#b8f5d4]" : "text-[#8190a6] hover:text-[#f5f7fb]"
        }`}
        onClick={() => setEnvironment("prod-test")}
        disabled={!productionAvailable}
        title={productionAvailable ? "World Chain mainnet" : "PROD estará disponible cuando exista el despliegue mainnet"}
        type="button"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        PROD
      </button>
      <button
        aria-pressed={isTestnet}
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition ${
          isTestnet ? "bg-[#20295b] text-[#c6ceff]" : "text-[#8190a6] hover:text-[#f5f7fb]"
        }`}
        onClick={() => setEnvironment("testnet")}
        type="button"
      >
        <FlaskConical className="h-3.5 w-3.5" />
        TEST
      </button>
    </div>
  );
}
