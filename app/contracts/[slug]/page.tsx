import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContractDetailContent } from "@/components/ContractDetailContent";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { contracts, getContractBySlug } from "@/lib/contracts";
import { dictionaries } from "@/lib/i18n";

type ContractPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return contracts.map((contract) => ({
    slug: contract.slug
  }));
}

export function generateMetadata({ params }: ContractPageProps): Metadata {
  const contract = getContractBySlug(params.slug);

  if (!contract) {
    return {
      title: "Contract not found"
    };
  }

  const docs = dictionaries.en.contractDocs[contract.id];

  return {
    title: `${docs.title} - Riska contract documentation`,
    description: docs.summary
  };
}

export default async function ContractPage({ params }: ContractPageProps) {
  const contract = getContractBySlug(params.slug);

  if (!contract) {
    notFound();
  }

  const sourceCode = contract.sourceFile ? await readContractSource(contract.sourceFile) : null;

  return (
    <div className="riska-dark-surface flex min-h-screen flex-col bg-[#080b10] text-[#f5f7fb]">
      <Navbar />
      <main className="flex-1">
        <ContractDetailContent contract={contract} sourceCode={sourceCode} />
      </main>
      <Footer />
    </div>
  );
}

async function readContractSource(sourceFile: string) {
  try {
    return await readFile(path.join(process.cwd(), sourceFile), "utf8");
  } catch {
    return null;
  }
}
