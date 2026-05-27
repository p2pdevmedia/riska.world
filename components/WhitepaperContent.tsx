"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function WhitepaperContent() {
  const { t } = useLanguage();
  const whitepaper = t.whitepaper;

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-12 md:px-8 md:py-16">
      <header className="mb-12 space-y-4 text-center">
        <p className="text-sm font-semibold text-emerald-700">
          {whitepaper.header.badge}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#18211d] sm:text-5xl">
          {whitepaper.header.title}
        </h1>
        <p className="text-sm text-[#66746e]">{whitepaper.header.date}</p>
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 pt-4">
          <a
            href="/whitepapers/riska-whitepaper-v2.pdf"
            download
            className="bg-[#17231e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#26342d] hover:text-white"
          >
            {whitepaper.download.label}
          </a>
          <p className="text-sm leading-6 text-[#66746e]">{whitepaper.download.note}</p>
        </div>
      </header>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-[#18211d]">{whitepaper.abstract.title}</h2>
        {whitepaper.abstract.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-[#516159]">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-[#18211d]">{whitepaper.introduction.title}</h2>
        {whitepaper.introduction.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-[#516159]">
            {paragraph}
          </p>
        ))}
        <h3 className="text-lg font-semibold text-[#18211d]">
          {whitepaper.introduction.goalsTitle}
        </h3>
        <ul className="list-disc space-y-2 pl-6 text-[#516159]">
          {whitepaper.introduction.goals.map((goal) => (
            <li key={goal}>{goal}</li>
          ))}
        </ul>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-[#18211d]">{whitepaper.systemOverview.title}</h2>
        {whitepaper.systemOverview.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-[#516159]">
            {paragraph}
          </p>
        ))}
        <div className="border border-[#d9ded5] bg-white p-6 text-sm text-[#405047]">
          <h3 className="mb-3 text-base font-semibold text-[#18211d]">
            {whitepaper.systemOverview.everydayIntuition.title}
          </h3>
          <p>{whitepaper.systemOverview.everydayIntuition.body}</p>
        </div>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-[#18211d]">{whitepaper.userLifecycle.title}</h2>
        <ol className="list-decimal space-y-3 pl-6 text-[#516159]">
          {whitepaper.userLifecycle.steps.map((step) => (
            <li key={step.label}>
              <span className="font-medium text-[#18211d]">{step.label}</span> {step.description}
            </li>
          ))}
        </ol>
        <div className="space-y-3 border border-[#d9ded5] bg-white p-6 text-sm text-[#405047]">
          <h3 className="text-base font-semibold text-[#18211d]">
            {whitepaper.userLifecycle.examples.title}
          </h3>
          <ul className="list-disc space-y-2 pl-5">
            {whitepaper.userLifecycle.examples.items.map((example) => (
              <li key={example.label}>
                <span className="font-medium text-[#18211d]">{example.label}</span> {example.description}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-[#18211d]">{whitepaper.capital.title}</h2>
        {whitepaper.capital.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-[#516159]">
            {paragraph}
          </p>
        ))}
        <div className="border border-[#d9ded5] bg-white p-6 text-sm text-[#405047]">
          <h3 className="mb-3 text-base font-semibold text-[#18211d]">
            {whitepaper.capital.example.title}
          </h3>
          <p>{whitepaper.capital.example.body}</p>
        </div>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-[#18211d]">{whitepaper.eventVerification.title}</h2>
        {whitepaper.eventVerification.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-[#516159]">
            {paragraph}
          </p>
        ))}
        <div className="border border-[#d9ded5] bg-white p-6 text-sm text-[#405047]">
          <h3 className="mb-3 text-base font-semibold text-[#18211d]">
            {whitepaper.eventVerification.plainLanguage.title}
          </h3>
          <p>{whitepaper.eventVerification.plainLanguage.body}</p>
        </div>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-[#18211d]">{whitepaper.claims.title}</h2>
        {whitepaper.claims.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-[#516159]">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-[#18211d]">{whitepaper.incentives.title}</h2>
        <p className="leading-7 text-[#516159]">{whitepaper.incentives.intro}</p>
        <ul className="list-disc space-y-2 pl-6 text-[#516159]">
          {whitepaper.incentives.points.map((point) => (
            <li key={point.label}>
              <span className="font-medium text-[#18211d]">{point.label}</span> {point.description}
            </li>
          ))}
        </ul>
        <p className="leading-7 text-[#516159]">{whitepaper.incentives.feeParagraph}</p>
        <div className="border border-[#d9ded5] bg-white p-6 text-sm text-[#405047]">
          <h3 className="mb-3 text-base font-semibold text-[#18211d]">
            {whitepaper.incentives.example.title}
          </h3>
          <p>{whitepaper.incentives.example.body}</p>
        </div>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-[#18211d]">{whitepaper.governance.title}</h2>
        {whitepaper.governance.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-[#516159]">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-[#18211d]">{whitepaper.security.title}</h2>
        <ul className="list-disc space-y-2 pl-6 text-[#516159]">
          {whitepaper.security.points.map((point) => (
            <li key={point.label}>
              <span className="font-medium text-[#18211d]">{point.label}</span> {point.description}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-[#18211d]">{whitepaper.applications.title}</h2>
        {whitepaper.applications.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-[#516159]">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-[#18211d]">{whitepaper.faq.title}</h2>
        <div className="space-y-5">
          {whitepaper.faq.items.map((item) => (
            <div key={item.question}>
              <p className="font-semibold text-[#18211d]">{item.question}</p>
              <p className="leading-7 text-[#516159]">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-[#18211d]">{whitepaper.conclusion.title}</h2>
        {whitepaper.conclusion.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-[#516159]">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="mb-12 space-y-4">
        <h2 className="text-xl font-semibold text-[#18211d]">{whitepaper.references.title}</h2>
        <ol className="list-decimal space-y-3 pl-6 text-[#516159]">
          {whitepaper.references.items.map((reference) => (
            <li key={reference}>{reference}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
