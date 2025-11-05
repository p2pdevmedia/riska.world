"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function WhitepaperContent() {
  const { t } = useLanguage();
  const whitepaper = t.whitepaper;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <header className="mb-12 space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-aurora-500/80">
          {whitepaper.header.badge}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {whitepaper.header.title}
        </h1>
        <p className="text-sm text-slate-400">{whitepaper.header.date}</p>
      </header>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-white">{whitepaper.abstract.title}</h2>
        {whitepaper.abstract.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-slate-300">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-white">{whitepaper.introduction.title}</h2>
        {whitepaper.introduction.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-slate-300">
            {paragraph}
          </p>
        ))}
        <h3 className="text-lg font-semibold text-white">
          {whitepaper.introduction.goalsTitle}
        </h3>
        <ul className="list-disc space-y-2 pl-6 text-slate-300">
          {whitepaper.introduction.goals.map((goal) => (
            <li key={goal}>{goal}</li>
          ))}
        </ul>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-white">{whitepaper.systemOverview.title}</h2>
        {whitepaper.systemOverview.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-slate-300">
            {paragraph}
          </p>
        ))}
        <div className="rounded-lg border border-white/5 bg-white/5 p-6 text-sm text-slate-200">
          <h3 className="mb-3 text-base font-semibold text-white">
            {whitepaper.systemOverview.everydayIntuition.title}
          </h3>
          <p>{whitepaper.systemOverview.everydayIntuition.body}</p>
        </div>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-white">{whitepaper.userLifecycle.title}</h2>
        <ol className="list-decimal space-y-3 pl-6 text-slate-300">
          {whitepaper.userLifecycle.steps.map((step) => (
            <li key={step.label}>
              <span className="font-medium text-white">{step.label}</span> {step.description}
            </li>
          ))}
        </ol>
        <div className="space-y-3 rounded-lg border border-white/5 bg-white/5 p-6 text-sm text-slate-200">
          <h3 className="text-base font-semibold text-white">
            {whitepaper.userLifecycle.examples.title}
          </h3>
          <ul className="list-disc space-y-2 pl-5">
            {whitepaper.userLifecycle.examples.items.map((example) => (
              <li key={example.label}>
                <span className="font-medium text-white">{example.label}</span> {example.description}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-white">{whitepaper.capital.title}</h2>
        {whitepaper.capital.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-slate-300">
            {paragraph}
          </p>
        ))}
        <div className="rounded-lg border border-white/5 bg-white/5 p-6 text-sm text-slate-200">
          <h3 className="mb-3 text-base font-semibold text-white">
            {whitepaper.capital.example.title}
          </h3>
          <p>{whitepaper.capital.example.body}</p>
        </div>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-white">{whitepaper.eventVerification.title}</h2>
        {whitepaper.eventVerification.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-slate-300">
            {paragraph}
          </p>
        ))}
        <div className="rounded-lg border border-white/5 bg-white/5 p-6 text-sm text-slate-200">
          <h3 className="mb-3 text-base font-semibold text-white">
            {whitepaper.eventVerification.plainLanguage.title}
          </h3>
          <p>{whitepaper.eventVerification.plainLanguage.body}</p>
        </div>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-white">{whitepaper.claims.title}</h2>
        {whitepaper.claims.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-slate-300">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-white">{whitepaper.incentives.title}</h2>
        <p className="leading-7 text-slate-300">{whitepaper.incentives.intro}</p>
        <ul className="list-disc space-y-2 pl-6 text-slate-300">
          {whitepaper.incentives.points.map((point) => (
            <li key={point.label}>
              <span className="font-medium text-white">{point.label}</span> {point.description}
            </li>
          ))}
        </ul>
        <p className="leading-7 text-slate-300">{whitepaper.incentives.feeParagraph}</p>
        <div className="rounded-lg border border-white/5 bg-white/5 p-6 text-sm text-slate-200">
          <h3 className="mb-3 text-base font-semibold text-white">
            {whitepaper.incentives.example.title}
          </h3>
          <p>{whitepaper.incentives.example.body}</p>
        </div>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-white">{whitepaper.governance.title}</h2>
        {whitepaper.governance.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-slate-300">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-white">{whitepaper.security.title}</h2>
        <ul className="list-disc space-y-2 pl-6 text-slate-300">
          {whitepaper.security.points.map((point) => (
            <li key={point.label}>
              <span className="font-medium text-white">{point.label}</span> {point.description}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-white">{whitepaper.applications.title}</h2>
        {whitepaper.applications.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-slate-300">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-white">{whitepaper.faq.title}</h2>
        <div className="space-y-5">
          {whitepaper.faq.items.map((item) => (
            <div key={item.question}>
              <p className="font-semibold text-white">{item.question}</p>
              <p className="leading-7 text-slate-300">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12 space-y-6">
        <h2 className="text-xl font-semibold text-white">{whitepaper.conclusion.title}</h2>
        {whitepaper.conclusion.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-slate-300">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="mb-12 space-y-4">
        <h2 className="text-xl font-semibold text-white">{whitepaper.references.title}</h2>
        <ol className="list-decimal space-y-3 pl-6 text-slate-300">
          {whitepaper.references.items.map((reference) => (
            <li key={reference}>{reference}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
