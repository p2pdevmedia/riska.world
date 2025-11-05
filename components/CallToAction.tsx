export function CallToAction() {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 text-center">
      <div className="glass-panel space-y-6 px-10 py-12">
        <h2 className="section-title">Comienza a asegurar tu comunidad hoy</h2>
        <p className="section-subtitle">
          Integra nuestro protocolo via SDK o API GraphQL y diseña productos personalizados para cooperativas, DAOs o economías locales.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <a
            href="#login"
            className="rounded-full bg-aurora-600 px-6 py-3 font-semibold text-white shadow-glow hover:bg-aurora-500 transition"
          >
            Acceder con MetaMask
          </a>
          <a
            href="mailto:partners@riska.world"
            className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white/80 hover:border-aurora-500 hover:text-white transition"
          >
            Hablar con el equipo
          </a>
        </div>
      </div>
    </section>
  );
}
