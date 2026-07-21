"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import type { ContractDefinition } from "@/lib/contracts";

type ContractDetailContentProps = {
  contract: ContractDefinition;
  sourceCode: string | null;
};

export function ContractDetailContent({ contract, sourceCode }: ContractDetailContentProps) {
  const { t } = useLanguage();
  const labels = t.contractDetail;
  const docs = t.contractDocs[contract.id];

  return (
    <div className="pb-24">
      <section className="mx-auto w-full max-w-5xl px-5 py-12 md:px-8">
        <Link href="/docs" className="text-sm font-semibold text-[#aeb8ff] transition hover:text-[#f5f7fb]">
          {labels.backLabel}
        </Link>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-6">
            <p className="text-sm font-semibold text-[#aeb8ff]">{labels.eyebrow}</p>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-[#18211d] sm:text-5xl">{docs.title}</h1>
              <p className="text-base leading-7 text-[#516159] sm:text-lg">{docs.summary}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {contract.explorerUrl ? (
                <a
                  href={contract.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-[#334052] bg-[#151d28] px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d8e0ee] transition hover:border-[#5868ea] hover:text-[#f5f7fb]"
                >
                  {labels.explorerLabel}
                </a>
              ) : null}
              <span className="rounded-lg border border-[#5868ea]/40 bg-[#20295b] px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#c8d0ff]">
                {contract.sourceIncluded ? labels.sourceIncludedLabel : labels.sourcePendingLabel}
              </span>
            </div>
          </div>
          <div className="glass-panel grid gap-5 p-6">
            <ContractFact label={labels.networkLabel} value={contract.network} />
            <ContractFact label={labels.statusLabel} value={docs.status} />
            <ContractFact label={labels.addressLabel} value={contract.address ?? labels.pendingAddressLabel} mono />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 lg:grid-cols-3">
        <DocumentationPanel title={labels.responsibilitiesTitle}>
          <ul className="space-y-3 text-sm leading-6 text-[#516159]">
            {docs.responsibilities.map((item) => (
              <li key={item} className="border-b border-[#e3e8df] pb-3 last:border-b-0 last:pb-0">
                {item}
              </li>
            ))}
          </ul>
        </DocumentationPanel>

        <DocumentationPanel title={labels.interfaceTitle}>
          <div className="space-y-4">
            {docs.interfaceItems.map((item) => (
              <div key={item.name} className="space-y-1 border-b border-[#e3e8df] pb-4 last:border-b-0 last:pb-0">
                <h3 className="font-mono text-sm text-emerald-800">{item.name}</h3>
                <p className="text-sm leading-6 text-[#516159]">{item.description}</p>
              </div>
            ))}
          </div>
        </DocumentationPanel>

        <DocumentationPanel title={labels.safeguardsTitle}>
          <ul className="space-y-3 text-sm leading-6 text-[#516159]">
            {docs.safeguards.map((item) => (
              <li key={item} className="border-b border-[#e3e8df] pb-3 last:border-b-0 last:pb-0">
                {item}
              </li>
            ))}
          </ul>
        </DocumentationPanel>
      </section>

      <section className="mx-auto max-w-6xl px-6">
        <div className="mb-6 space-y-3">
          <h2 className="text-2xl font-semibold text-[#18211d]">{labels.sourceTitle}</h2>
          <p className="max-w-3xl text-sm leading-6 text-[#516159]">{docs.sourceNote}</p>
        </div>
        {sourceCode ? (
          <pre className="max-h-[640px] overflow-auto border border-[#d9ded5] bg-[#111816] p-5 text-xs leading-6 text-[#edf3ee]">
            <code>{sourceCode}</code>
          </pre>
        ) : null}
      </section>
    </div>
  );
}

type ContractFactProps = {
  label: string;
  value: string;
  mono?: boolean;
};

function ContractFact({ label, value, mono = false }: ContractFactProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#66746e]">{label}</p>
      <p className={mono ? "break-words font-mono text-sm text-emerald-800" : "text-sm leading-6 text-[#405047]"}>
        {value}
      </p>
    </div>
  );
}

type DocumentationPanelProps = {
  title: string;
  children: ReactNode;
};

function DocumentationPanel({ title, children }: DocumentationPanelProps) {
  return (
    <article className="glass-panel p-6">
      <h2 className="mb-5 text-xl font-semibold text-[#18211d]">{title}</h2>
      {children}
    </article>
  );
}
