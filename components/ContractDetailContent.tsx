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
      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <Link href="/docs" className="text-sm font-semibold text-aurora-300 transition hover:text-white">
          {labels.backLabel}
        </Link>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.35em] text-aurora-500/80">{labels.eyebrow}</p>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{docs.title}</h1>
              <p className="text-base leading-7 text-slate-300 sm:text-lg">{docs.summary}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {contract.explorerUrl ? (
                <a
                  href={contract.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-aurora-400/60 hover:text-white"
                >
                  {labels.explorerLabel}
                </a>
              ) : null}
              <span className="rounded-full border border-aurora-500/50 bg-aurora-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-aurora-100">
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
          <ul className="space-y-3 text-sm leading-6 text-slate-300/90">
            {docs.responsibilities.map((item) => (
              <li key={item} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                {item}
              </li>
            ))}
          </ul>
        </DocumentationPanel>

        <DocumentationPanel title={labels.interfaceTitle}>
          <div className="space-y-4">
            {docs.interfaceItems.map((item) => (
              <div key={item.name} className="space-y-1 border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
                <h3 className="font-mono text-sm text-aurora-200">{item.name}</h3>
                <p className="text-sm leading-6 text-slate-300/85">{item.description}</p>
              </div>
            ))}
          </div>
        </DocumentationPanel>

        <DocumentationPanel title={labels.safeguardsTitle}>
          <ul className="space-y-3 text-sm leading-6 text-slate-300/90">
            {docs.safeguards.map((item) => (
              <li key={item} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                {item}
              </li>
            ))}
          </ul>
        </DocumentationPanel>
      </section>

      <section className="mx-auto max-w-6xl px-6">
        <div className="mb-6 space-y-3">
          <h2 className="text-2xl font-semibold text-white">{labels.sourceTitle}</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-300/85">{docs.sourceNote}</p>
        </div>
        {sourceCode ? (
          <pre className="max-h-[640px] overflow-auto rounded-lg border border-white/10 bg-black/50 p-5 text-xs leading-6 text-slate-200">
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
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className={mono ? "break-words font-mono text-sm text-aurora-100" : "text-sm leading-6 text-slate-200"}>
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
      <h2 className="mb-5 text-xl font-semibold text-white">{title}</h2>
      {children}
    </article>
  );
}
