const values = [
  {
    title: "Pólizas tokenizadas",
    description:
      "Cada cobertura vive como un NFT único con historial inmutable y transferible, ideal para comunidades y DAO treasury managers."
  },
  {
    title: "Oráculos verificables",
    description:
      "Integraciones con oráculos climáticos, de salud y de identidad validan eventos sin intervención manual, acelerando la liberación de fondos."
  },
  {
    title: "Vault comunitario",
    description:
      "Reservas en stablecoins auditadas públicamente financian pagos automáticos y recompensas para guardianes de riesgo." 
  },
  {
    title: "Governanza abierta",
    description:
      "La DAO de riesgo ajusta primas, límites y triggers, garantizando resiliencia ante nuevos escenarios." 
  }
];

export function ValueGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="mb-10 flex flex-col items-center text-center">
        <h2 className="section-title">Cobertura modular para un mundo programable</h2>
        <p className="section-subtitle mt-4 max-w-2xl">
          Diseñado para equipos que operan on-chain y necesitan garantías confiables para humanos verificados. Transparentamos cada paso del ciclo de vida.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {values.map((value) => (
          <div key={value.title} className="glass-panel p-8">
            <h3 className="text-xl font-semibold text-white">{value.title}</h3>
            <p className="mt-3 text-sm text-slate-300/80">{value.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
