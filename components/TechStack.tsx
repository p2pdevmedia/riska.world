const stack = [
  {
    title: "Next.js 14",
    description: "Render híbrido, server actions y performance óptima para dashboards de riesgo en tiempo real."
  },
  {
    title: "Tailwind CSS",
    description: "Diseño adaptable con componentes glassmorphism que refuerzan la identidad futurista de riska.world."
  },
  {
    title: "Prisma + PostgreSQL",
    description: "Gestión segura de pólizas, historial de reclamos y métricas de riesgo sin duplicar instancias del cliente."
  },
  {
    title: "viem + MetaMask",
    description: "Conectividad directa a World Chain y carteras compatibles, habilitando login/signup descentralizado."
  }
];

export function TechStack() {
  return (
    <section id="stack" className="mx-auto max-w-6xl px-6 pb-24">
      <div className="glass-panel p-10">
        <h2 className="section-title text-center">Un stack diseñado para confianza programable</h2>
        <p className="section-subtitle mt-4 text-center">
          Cada capa tecnológica refuerza la transparencia, auditabilidad y velocidad necesarias para seguros on-chain.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {stack.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/5 bg-night-900/80 p-6">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300/80">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
