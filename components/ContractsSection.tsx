"use client";

import Link from "next/link";

import { useLanguage } from "@/components/LanguageProvider";
import { contracts, getContractPath } from "@/lib/contracts";

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

          return (
            <article key={contract.id} className="glass-panel flex flex-col justify-between gap-6 p-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    {contract.network}
                  </p>
                  <h3 className="text-lg font-semibold text-[#18211d]">{content?.name ?? contract.id}</h3>
                </div>
                {content?.description ? (
                  <p className="text-sm leading-6 text-[#516159]">{content.description}</p>
                ) : null}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#66746e]">
                    {contractsText.addressLabel}
                  </span>
                  {contract.address ? (
                    <code className="mt-2 block break-words border border-[#e3e8df] bg-[#fbfcf8] px-3 py-2 font-mono text-sm text-emerald-800">
                      {contract.address}
                    </code>
                  ) : (
                    <p className="mt-2 border border-[#e3e8df] bg-[#fbfcf8] px-3 py-2 text-sm text-[#66746e]">
                      {contractsText.pendingLabel}
                    </p>
                  )}
                </div>
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
                <Link href={getContractPath(contract)} className={linkClassName}>
                  {contractsText.docsLabel}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

const linkClassName =
  "border border-[#cbd7cf] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#26342d] transition hover:border-[#17231e] hover:text-[#18211d]";
