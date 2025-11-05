const metrics = [
  { label: "Pólizas activas", value: "4,200+" },
  { label: "Tiempo de payout", value: "< 15 min" },
  { label: "Comunidad humana", value: "38 países" },
  { label: "Capital asegurado", value: "$12.5M" }
];

export function ImpactMetrics() {
  return (
    <section id="vision" className="mx-auto max-w-6xl px-6 pb-24">
      <div className="glass-panel grid gap-8 p-10 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <h2 className="section-title">Impacto medible, confianza radical</h2>
          <p className="section-subtitle">
            Riesgos climáticos, microseguros comunitarios y protección para creadores: nuestros protocolos permiten diseñar productos a medida y liberar pagos casi en tiempo real.
          </p>
          <p className="text-sm text-slate-300/80">
            Cada interacción queda registrada on-chain, desde la emisión de la póliza NFT hasta la resolución automática de reclamos. Las métricas se actualizan vía oráculos, manteniendo al día a asegurados y delegados DAO.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-white/10 bg-night-900/70 p-6 text-center">
              <p className="text-3xl font-semibold text-white">{metric.value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-400">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
