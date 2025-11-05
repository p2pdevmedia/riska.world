const highlights = [
  {
    title: "Quiénes somos",
    description:
      "Somos un colectivo de actuarios, devs y guardianes de la comunidad World ID que reimaginan los seguros para un futuro sin fricción.",
    points: [
      "Equipo remoto con experiencia en DeFi y cobertura paramétrica",
      "Auditorías externas continuas y transparencia radical",
      "Compromiso con la protección de identidades humanas verificadas"
    ]
  },
  {
    title: "Qué hacemos",
    description:
      "Construimos pólizas on-chain representadas como NFTs, donde cada cobertura se administra con smart contracts auditables.",
    points: [
      "Reclamos automatizados mediante oráculos de datos climáticos y sociales",
      "Payouts instantáneos en stablecoins supervisados por el vault comunitario",
      "Interfaces amigables para emitir, renovar o transferir pólizas"
    ]
  },
  {
    title: "Por qué usar Riska.world",
    description:
      "Porque el seguro debe ser abierto, programable y centrado en humanos reales. Aquí cada decisión y reserva es auditable en cadena.",
    points: [
      "Gas optimizado gracias a World Chain (OP Stack)",
      "DAO de riesgo que ajusta primas y reservas en tiempo real",
      "Incentivos para agentes verificadores y comunidades solidarias"
    ]
  }
];

export function AboutSections() {
  return (
    <section id="about" className="relative mx-auto max-w-6xl px-6 pb-24">
      <div className="grid gap-10 md:grid-cols-3">
        {highlights.map((item) => (
          <article key={item.title} className="glass-panel p-8 space-y-5">
            <header>
              <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300/80">{item.description}</p>
            </header>
            <ul className="space-y-3 text-sm text-slate-200/80">
              {item.points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-aurora-500 shadow-glow" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
