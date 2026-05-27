import {
  BadgeCheck,
  Camera,
  Check,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  Fingerprint,
  HeartHandshake,
  IdCard,
  LockKeyhole,
  Percent,
  ShieldCheck,
  Upload,
  UserPlus,
  Users,
  WalletCards
} from "lucide-react";
import type { ComponentType } from "react";

type Step = {
  accent: string;
  button: string;
  eyebrow: string;
  icon: ComponentType<{ className?: string }>;
  meta: string;
  progress: string;
  screen: "identity" | "kyc" | "beneficiaries" | "quote" | "confirm";
  title: string;
};

const steps: Step[] = [
  {
    accent: "bg-emerald-500",
    button: "Verificar humano",
    eyebrow: "Paso 1 de 5",
    icon: Fingerprint,
    meta: "Wallet + World ID",
    progress: "20%",
    screen: "identity",
    title: "Confirma que eres una persona unica"
  },
  {
    accent: "bg-cyan-500",
    button: "Subir documento",
    eyebrow: "Paso 2 de 5",
    icon: IdCard,
    meta: "KYC simple",
    progress: "40%",
    screen: "kyc",
    title: "Valida pasaporte y rostro"
  },
  {
    accent: "bg-rose-500",
    button: "Guardar beneficiarios",
    eyebrow: "Paso 3 de 5",
    icon: Users,
    meta: "Hasta 100%",
    progress: "60%",
    screen: "beneficiaries",
    title: "Elige a quienes proteger"
  },
  {
    accent: "bg-amber-500",
    button: "Revisar contrato",
    eyebrow: "Paso 4 de 5",
    icon: CircleDollarSign,
    meta: "30 USDC / mes",
    progress: "80%",
    screen: "quote",
    title: "Entiende tu poliza antes de pagar"
  },
  {
    accent: "bg-violet-500",
    button: "Firmar y pagar",
    eyebrow: "Paso 5 de 5",
    icon: FileCheck2,
    meta: "World Chain",
    progress: "100%",
    screen: "confirm",
    title: "Acepta terminos y activa"
  }
];

export function OnboardingMockupsCanvas() {
  return (
    <main className="min-h-screen bg-[#f5f7f2] text-[#18211d]">
      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-emerald-700">RISKA enrollment wizard</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-5xl">
              Canvas mobile para inscripcion de usuarios
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#516159]">
              Flujo pensado para World App: cada pantalla pide una decision concreta, explica por
              que importa, y deja claro que no hay poliza real hasta KYC, beneficiarios, firma y
              pago.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm md:w-80">
            <CanvasMetric label="Duracion objetivo" value="4-6 min" />
            <CanvasMetric label="Pantallas clave" value="5" />
          </div>
        </div>

        <div className="mt-8 overflow-x-auto pb-6">
          <div className="flex min-w-max gap-5">
            {steps.map((step) => (
              <PhoneMockup key={step.screen} step={step} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function CanvasMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#d9ded5] bg-white px-4 py-3">
      <p className="text-xs text-[#6b766f]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function PhoneMockup({ step }: { step: Step }) {
  const Icon = step.icon;

  return (
    <article className="w-[320px] shrink-0 rounded-[34px] border-[10px] border-[#111816] bg-[#111816] shadow-2xl shadow-[#22332a]/20">
      <div className="min-h-[690px] overflow-hidden rounded-[22px] bg-[#fbfcf8]">
        <div className="flex items-center justify-between border-b border-[#e7ebe2] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${step.accent}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-[#6b766f]">{step.eyebrow}</p>
              <p className="text-sm font-semibold">{step.meta}</p>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef3ec]">
            <LockKeyhole className="h-4 w-4 text-[#526258]" />
          </div>
        </div>

        <div className="h-1 bg-[#e4eae1]">
          <div className={`h-full ${step.accent}`} style={{ width: step.progress }} />
        </div>

        <div className="flex min-h-[630px] flex-col px-5 pb-5 pt-6">
          <h2 className="text-2xl font-semibold leading-tight">{step.title}</h2>
          <div className="mt-5 flex-1">{renderScreen(step.screen)}</div>

          <button className="mt-5 flex h-12 w-full items-center justify-center gap-2 bg-[#17231e] px-4 text-sm font-semibold text-white">
            {step.button}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function renderScreen(screen: Step["screen"]) {
  switch (screen) {
    case "identity":
      return <IdentityScreen />;
    case "kyc":
      return <KycScreen />;
    case "beneficiaries":
      return <BeneficiariesScreen />;
    case "quote":
      return <QuoteScreen />;
    case "confirm":
      return <ConfirmScreen />;
  }
}

function IdentityScreen() {
  return (
    <div className="space-y-4">
      <InfoBlock
        icon={WalletCards}
        title="Wallet Auth listo"
        detail="Sesion firmada con World App para conectar la poliza a tu wallet."
        tone="emerald"
      />
      <InfoBlock
        icon={ShieldCheck}
        title="Una persona, una poliza"
        detail="World ID reserva un nullifier unico antes de avanzar a KYC."
        tone="cyan"
      />
      <div className="border border-[#dae3d8] bg-[#f2f6ee] p-4">
        <p className="text-xs text-[#6b766f]">Proxima etapa</p>
        <p className="mt-1 text-sm leading-6">
          Riska nunca guarda biometria. Solo conserva la prueba de unicidad necesaria para evitar
          polizas duplicadas.
        </p>
      </div>
    </div>
  );
}

function KycScreen() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <KycTile icon={Upload} label="Pasaporte frente" state="Pendiente" />
        <KycTile icon={Upload} label="Segunda hoja" state="Pendiente" />
      </div>
      <div className="border border-[#d9e2df] bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">FaceID + vida</p>
            <p className="mt-1 text-sm text-[#66746e]">Match contra foto del pasaporte.</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center bg-cyan-50">
            <Camera className="h-6 w-6 text-cyan-700" />
          </div>
        </div>
      </div>
      <Checklist items={["Datos cifrados off-chain", "Revision del Riska Team", "Sin pago hasta aprobar KYC"]} />
    </div>
  );
}

function BeneficiariesScreen() {
  return (
    <div className="space-y-4">
      <BeneficiaryRow name="Mama" percent="50%" color="bg-rose-500" />
      <BeneficiaryRow name="Hermana" percent="30%" color="bg-amber-500" />
      <BeneficiaryRow name="Hijo" percent="20%" color="bg-emerald-500" />
      <div className="border border-dashed border-[#cdd8ce] bg-[#fbfcf8] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#eef3ec]">
            <UserPlus className="h-5 w-5 text-[#526258]" />
          </div>
          <div>
            <p className="font-semibold">Agregar beneficiario</p>
            <p className="text-sm text-[#66746e]">Puedes cambiarlos antes del fallecimiento.</p>
          </div>
        </div>
      </div>
      <div className="h-2 overflow-hidden bg-[#e8ede4]">
        <div className="h-full w-full bg-[#17231e]" />
      </div>
      <p className="text-xs text-[#66746e]">Asignacion total: 100%</p>
    </div>
  );
}

function QuoteScreen() {
  return (
    <div className="space-y-4">
      <div className="border border-[#dce4d8] bg-white p-4">
        <p className="text-sm text-[#66746e]">Prima mensual</p>
        <div className="mt-2 flex items-end gap-2">
          <p className="text-4xl font-semibold">30</p>
          <p className="pb-1 text-sm font-semibold text-[#66746e]">USDC</p>
        </div>
      </div>
      <RuleRow icon={Percent} label="Antes de 12 meses" value="0%" />
      <RuleRow icon={HeartHandshake} label="Mes 12 a madurez" value="80%" />
      <RuleRow icon={BadgeCheck} label="Madurez 30 anios" value="100%" />
      <RuleRow icon={Users} label="Despues de madurar" value="90%" />
    </div>
  );
}

function ConfirmScreen() {
  return (
    <div className="space-y-4">
      <div className="border border-[#ddd8ed] bg-[#f5f2ff] p-4">
        <p className="text-sm text-[#655a80]">Hash de terminos</p>
        <p className="mt-2 break-all font-mono text-xs text-[#32284f]">
          0x9a81...f03c
        </p>
      </div>
      <Checklist
        items={[
          "World ID verificado",
          "KYC aprobado",
          "Beneficiarios 100%",
          "Contrato leido"
        ]}
      />
      <div className="border border-[#e3dfd6] bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#66746e]">Primer pago</span>
          <span className="font-semibold">30 USDC</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-[#66746e]">Red</span>
          <span className="font-semibold">World Chain</span>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  detail,
  icon: Icon,
  title,
  tone
}: {
  detail: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  tone: "cyan" | "emerald";
}) {
  const toneClass = tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-cyan-50 text-cyan-700";

  return (
    <div className="border border-[#dce4d8] bg-white p-4">
      <div className="flex gap-3">
        <div className={`flex h-10 w-10 items-center justify-center ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[#66746e]">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function KycTile({
  icon: Icon,
  label,
  state
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  state: string;
}) {
  return (
    <div className="border border-[#d9e2df] bg-white p-3">
      <div className="flex h-10 w-10 items-center justify-center bg-cyan-50">
        <Icon className="h-5 w-5 text-cyan-700" />
      </div>
      <p className="mt-4 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs text-[#66746e]">{state}</p>
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-2 text-sm text-[#4d5e55]">
          <span className="flex h-5 w-5 items-center justify-center bg-emerald-100 text-emerald-700">
            <Check className="h-3.5 w-3.5" />
          </span>
          {item}
        </div>
      ))}
    </div>
  );
}

function BeneficiaryRow({ color, name, percent }: { color: string; name: string; percent: string }) {
  return (
    <div className="flex items-center justify-between border border-[#dce4d8] bg-white p-4">
      <div className="flex items-center gap-3">
        <span className={`h-9 w-9 ${color}`} />
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-xs text-[#66746e]">Wallet pendiente</p>
        </div>
      </div>
      <p className="font-semibold">{percent}</p>
    </div>
  );
}

function RuleRow({
  icon: Icon,
  label,
  value
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border border-[#dce4d8] bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center bg-amber-50 text-amber-700">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold">{label}</p>
      </div>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
