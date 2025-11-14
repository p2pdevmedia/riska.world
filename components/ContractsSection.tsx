"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { contracts } from "@/lib/contracts";
import { contractSources } from "@/lib/contractSources";

export function ContractsSection() {
  const { t } = useLanguage();
  const contractsText = t.contracts;
  const contentById = new Map(contractsText.items.map((item) => [item.id, item]));

  return (
    <section id="contracts" className="mx-auto max-w-6xl px-6 pb-24">
      <div className="mb-10 flex flex-col items-center text-center">
        <h2 className="section-title">{contractsText.title}</h2>
        <p className="section-subtitle mt-4 max-w-2xl">{contractsText.subtitle}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contracts.map((contract) => {
          const content = contentById.get(contract.id);
          const source = contractSources[contract.id];

          return (
            <article key={contract.id} className="glass-panel flex flex-col justify-between gap-6 p-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-aurora-400">
                    {contract.network}
                  </p>
                  <h3 className="text-lg font-semibold text-white">{content?.name ?? contract.id}</h3>
                </div>
                {content?.description ? (
                  <p className="text-sm text-slate-300/80">{content.description}</p>
                ) : null}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    {contractsText.addressLabel}
                  </span>
                  <code className="mt-2 block break-words rounded bg-black/40 px-3 py-2 font-mono text-sm text-aurora-200">
                    {contract.address}
                  </code>
                </div>
                {source ? (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {contractsText.sourceLabel}
                    </span>
                    <pre
                      className="max-h-80 overflow-auto rounded border border-white/5 bg-black/50 p-4 text-left font-mono text-xs leading-relaxed text-emerald-100 shadow-inner"
                      data-language={source.language}
                    >
                      <code className="whitespace-pre">{source.code}</code>
                    </pre>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                {contract.explorerUrl ? (
                  <a
                    href={contract.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={linkClassName}
                  >
                    {contractsText.explorerLabel}
                  </a>
                ) : null}
                {contract.docsUrl ? (
                  <a href={contract.docsUrl} target="_blank" rel="noreferrer" className={linkClassName}>
                    {contractsText.docsLabel}
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

const linkClassName =
  "rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-aurora-400/60 hover:text-white";
