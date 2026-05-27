"use client";

import Link from "next/link";
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
  Trash2,
  Upload,
  UserPlus,
  Users,
  WalletCards
} from "lucide-react";
import { useState, type ComponentType, type Dispatch, type SetStateAction } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { WalletAuth } from "@/components/WalletAuth";
import type { Language } from "@/lib/i18n";

type StepId = "identity" | "kyc" | "beneficiaries" | "quote" | "confirm";

type WizardStep = {
  accent: string;
  icon: ComponentType<{ className?: string }>;
  id: StepId;
  meta: string;
  title: string;
};

type Beneficiary = {
  color: string;
  id: string;
  name: string;
  percent: number;
  wallet: string;
};

type KycFiles = {
  face: boolean;
  passportFront: string;
  passportSecond: string;
};

type EnrollmentState = {
  beneficiaries: Beneficiary[];
  identityReserved: boolean;
  kyc: KycFiles;
  paymentReady: boolean;
  quoteReviewed: boolean;
  riskAccepted: boolean;
  submitted: boolean;
  termsAccepted: boolean;
  walletReady: boolean;
};

type CompletionMap = Record<StepId, boolean>;

const beneficiaryColors = ["bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-cyan-500", "bg-violet-500"];

const initialBeneficiaries: Beneficiary[] = [
  { id: "beneficiary-1", name: "Mama", wallet: "", percent: 50, color: beneficiaryColors[0] },
  { id: "beneficiary-2", name: "Hermana", wallet: "", percent: 30, color: beneficiaryColors[1] },
  { id: "beneficiary-3", name: "Hijo", wallet: "", percent: 20, color: beneficiaryColors[2] }
];

const steps: WizardStep[] = [
  { accent: "bg-emerald-500", icon: Fingerprint, id: "identity", meta: "Wallet + World ID", title: "Identidad" },
  { accent: "bg-cyan-500", icon: IdCard, id: "kyc", meta: "KYC simple", title: "Documento" },
  { accent: "bg-rose-500", icon: Users, id: "beneficiaries", meta: "Beneficiarios", title: "Familia" },
  { accent: "bg-amber-500", icon: CircleDollarSign, id: "quote", meta: "30 USDC / mes", title: "Poliza" },
  { accent: "bg-violet-500", icon: FileCheck2, id: "confirm", meta: "World Chain", title: "Firma" }
];

const copy = {
  en: {
    nav: {
      brand: "RISKA",
      links: [
        { href: "#enroll", label: "Enroll" },
        { href: "#rules", label: "Policy rules" },
        { href: "/whitepaper", label: "White paper" },
        { href: "/docs", label: "Contracts" }
      ],
      cta: "Start"
    },
    hero: {
      badge: "World App Mini App",
      title: "Riska 30 enrollment in five calm steps.",
      body:
        "A mobile-first flow for verified humans: wallet, World ID, KYC, beneficiaries, quote, and signed terms before any real policy payment.",
      metrics: [
        ["Monthly premium", "30 USDC"],
        ["Waiting period", "12 months"],
        ["Maturity", "30 years"]
      ]
    },
    access: {
      eyebrow: "Live gate",
      title: "Connect and reserve eligibility",
      body:
        "This panel uses the real MiniKit Wallet Auth and IDKit gate. The wizard stores demo state locally until the backend persistence and contracts are wired."
    },
    rules: {
      eyebrow: "Riska 30 rules",
      title: "The user sees the promise before signing.",
      body:
        "The flow keeps the product explicit: no payout before 12 paid months, 80% beneficiary formula before maturity, 100% scheduled principal to the holder at maturity, and 90% to beneficiaries after maturity.",
      items: [
        "No real policy before KYC approval",
        "Beneficiaries must total 100%",
        "Terms hash shown before payment",
        "Contract audit required before production funds"
      ]
    },
    wizard: {
      step: (index: number) => `Step ${index + 1} of 5`,
      complete: "Complete",
      pending: "Pending",
      continue: "Continue",
      done: "Application ready",
      demoNotice: "Demo state",
      demoBody: "Final activation stays disabled until audited contracts, KYC storage, and payment rails are production-ready.",
      identity: {
        wallet: "Wallet Auth ready",
        walletDetail: "Signed session that binds this enrollment to one wallet.",
        worldId: "One human, one policy",
        worldIdDetail: "World ID reserves a unique nullifier before KYC starts.",
        realGate: "Use the live gate below for a real Wallet Auth and IDKit proof.",
        connectDemo: "Mark wallet ready",
        reserveDemo: "Reserve human"
      },
      kyc: {
        passportFront: "Passport front",
        passportSecond: "Second page",
        pending: "Pending",
        uploaded: "Uploaded",
        face: "FaceID + liveness",
        faceDetail: "Match against the passport photo.",
        captureFace: "Capture face",
        checks: ["Encrypted off-chain data", "Riska Team review", "No payment before KYC approval"]
      },
      beneficiaries: {
        total: (value: number) => `Total allocation: ${value}%`,
        add: "Add beneficiary",
        wallet: "Wallet",
        name: "Name",
        share: "Share",
        invalid: "Beneficiary shares must total exactly 100%."
      },
      quote: {
        premium: "Monthly premium",
        principal: "Scheduled principal",
        payout: "Maturity payout",
        reviewed: "I reviewed the policy formula.",
        rules: [
          ["Before 12 months", "0%"],
          ["Month 12 to maturity", "80%"],
          ["30-year maturity", "100%"],
          ["After maturity", "90%"]
        ]
      },
      confirm: {
        termsHash: "Terms hash",
        firstPayment: "First payment",
        network: "Network",
        terms: "I accept the policy terms.",
        risk: "I understand this is not a production policy until audits and legal clearance are complete.",
        payment: "I am ready to authorize the first 30 USDC payment when production opens.",
        checklist: ["World ID", "KYC", "Beneficiaries", "Quote"],
        submitted: "Demo enrollment complete. Next production step: persist the application and open policy creation."
      }
    }
  },
  es: {
    nav: {
      brand: "RISKA",
      links: [
        { href: "#enroll", label: "Inscripcion" },
        { href: "#rules", label: "Reglas" },
        { href: "/whitepaper", label: "White paper" },
        { href: "/docs", label: "Contratos" }
      ],
      cta: "Empezar"
    },
    hero: {
      badge: "World App Mini App",
      title: "Inscripcion Riska 30 en cinco pasos claros.",
      body:
        "Un flujo mobile-first para humanos verificados: wallet, World ID, KYC, beneficiarios, cotizacion y terminos firmados antes de cualquier pago real.",
      metrics: [
        ["Prima mensual", "30 USDC"],
        ["Espera inicial", "12 meses"],
        ["Madurez", "30 anios"]
      ]
    },
    access: {
      eyebrow: "Gate real",
      title: "Conecta y reserva elegibilidad",
      body:
        "Este panel usa el Wallet Auth real de MiniKit y el gate IDKit. El wizard guarda estado demo local hasta conectar persistencia backend y contratos."
    },
    rules: {
      eyebrow: "Reglas Riska 30",
      title: "El usuario ve la promesa antes de firmar.",
      body:
        "El flujo mantiene el producto explicito: no hay payout antes de 12 meses pagos, beneficiarios cobran 80% antes de madurez, el titular cobra 100% al madurar y beneficiarios cobran 90% despues de madurez.",
      items: [
        "No hay poliza real antes de KYC",
        "Beneficiarios suman 100%",
        "Hash de terminos antes del pago",
        "Auditoria obligatoria antes de fondos productivos"
      ]
    },
    wizard: {
      step: (index: number) => `Paso ${index + 1} de 5`,
      complete: "Completo",
      pending: "Pendiente",
      continue: "Continuar",
      done: "Solicitud lista",
      demoNotice: "Estado demo",
      demoBody: "La activacion final queda bloqueada hasta tener contratos auditados, KYC persistente y pagos productivos.",
      identity: {
        wallet: "Wallet Auth listo",
        walletDetail: "Sesion firmada que ata esta inscripcion a una wallet.",
        worldId: "Un humano, una poliza",
        worldIdDetail: "World ID reserva un nullifier unico antes de empezar KYC.",
        realGate: "Usa el gate real de abajo para Wallet Auth e IDKit.",
        connectDemo: "Marcar wallet lista",
        reserveDemo: "Reservar humano"
      },
      kyc: {
        passportFront: "Pasaporte frente",
        passportSecond: "Segunda hoja",
        pending: "Pendiente",
        uploaded: "Cargado",
        face: "FaceID + vida",
        faceDetail: "Match contra foto del pasaporte.",
        captureFace: "Capturar rostro",
        checks: ["Datos cifrados off-chain", "Revision del Riska Team", "Sin pago hasta aprobar KYC"]
      },
      beneficiaries: {
        total: (value: number) => `Asignacion total: ${value}%`,
        add: "Agregar beneficiario",
        wallet: "Wallet",
        name: "Nombre",
        share: "Porcentaje",
        invalid: "Los porcentajes deben sumar exactamente 100%."
      },
      quote: {
        premium: "Prima mensual",
        principal: "Principal programado",
        payout: "Pago al madurar",
        reviewed: "Revise la formula de la poliza.",
        rules: [
          ["Antes de 12 meses", "0%"],
          ["Mes 12 a madurez", "80%"],
          ["Madurez 30 anios", "100%"],
          ["Despues de madurar", "90%"]
        ]
      },
      confirm: {
        termsHash: "Hash de terminos",
        firstPayment: "Primer pago",
        network: "Red",
        terms: "Acepto los terminos de la poliza.",
        risk: "Entiendo que no es una poliza productiva hasta auditoria y aprobacion legal.",
        payment: "Estoy listo para autorizar el primer pago de 30 USDC cuando produccion abra.",
        checklist: ["World ID", "KYC", "Beneficiarios", "Cotizacion"],
        submitted: "Inscripcion demo completa. Proximo paso productivo: persistir solicitud y crear poliza."
      }
    }
  }
};

const initialState: EnrollmentState = {
  beneficiaries: initialBeneficiaries,
  identityReserved: false,
  kyc: {
    face: false,
    passportFront: "",
    passportSecond: ""
  },
  paymentReady: false,
  quoteReviewed: false,
  riskAccepted: false,
  submitted: false,
  termsAccepted: false,
  walletReady: false
};

export function RiskaEnrollmentHome() {
  const { language } = useLanguage();
  const content = copy[language];
  const [activeStepId, setActiveStepId] = useState<StepId>("identity");
  const [state, setState] = useState<EnrollmentState>(initialState);

  const activeStepIndex = steps.findIndex((step) => step.id === activeStepId);
  const activeStep = steps[activeStepIndex] ?? steps[0];
  const beneficiaryTotal = state.beneficiaries.reduce((total, beneficiary) => total + beneficiary.percent, 0);
  const completion = getCompletion(state, beneficiaryTotal);
  const canSubmit = completion.identity && completion.kyc && completion.beneficiaries && completion.quote;

  function setKycFile(field: keyof Pick<KycFiles, "passportFront" | "passportSecond">, fileName: string) {
    setState((current) => ({
      ...current,
      kyc: {
        ...current.kyc,
        [field]: fileName
      }
    }));
  }

  function updateBeneficiary(id: string, field: keyof Pick<Beneficiary, "name" | "percent" | "wallet">, value: string) {
    setState((current) => ({
      ...current,
      beneficiaries: current.beneficiaries.map((beneficiary) =>
        beneficiary.id === id
          ? {
              ...beneficiary,
              [field]: field === "percent" ? clampPercent(Number(value)) : value
            }
          : beneficiary
      )
    }));
  }

  function addBeneficiary() {
    setState((current) => {
      if (current.beneficiaries.length >= 5) {
        return current;
      }

      const nextIndex = current.beneficiaries.length + 1;
      return {
        ...current,
        beneficiaries: [
          ...current.beneficiaries,
          {
            id: `beneficiary-${Date.now()}`,
            name: language === "es" ? `Beneficiario ${nextIndex}` : `Beneficiary ${nextIndex}`,
            wallet: "",
            percent: 0,
            color: beneficiaryColors[current.beneficiaries.length % beneficiaryColors.length]
          }
        ]
      };
    });
  }

  function removeBeneficiary(id: string) {
    setState((current) => ({
      ...current,
      beneficiaries: current.beneficiaries.filter((beneficiary) => beneficiary.id !== id)
    }));
  }

  function completeCurrentStep() {
    if (activeStep.id === "identity") {
      if (!state.walletReady) {
        setState((current) => ({ ...current, walletReady: true }));
        return;
      }

      if (!state.identityReserved) {
        setState((current) => ({ ...current, identityReserved: true }));
        return;
      }
    }

    if (activeStep.id === "kyc" && !completion.kyc) {
      setState((current) => ({
        ...current,
        kyc: {
          face: true,
          passportFront: current.kyc.passportFront || "passport-front.jpg",
          passportSecond: current.kyc.passportSecond || "passport-second.jpg"
        }
      }));
      return;
    }

    if (activeStep.id === "quote" && !state.quoteReviewed) {
      setState((current) => ({ ...current, quoteReviewed: true }));
      return;
    }

    if (activeStep.id === "confirm") {
      if (canSubmit && state.termsAccepted && state.riskAccepted && state.paymentReady) {
        setState((current) => ({ ...current, submitted: true }));
      }
      return;
    }

    const nextStep = steps[Math.min(activeStepIndex + 1, steps.length - 1)];
    setActiveStepId(nextStep.id);
  }

  const primaryDisabled =
    activeStep.id === "beneficiaries" && !completion.beneficiaries
      ? true
      : activeStep.id === "confirm" && !(canSubmit && state.termsAccepted && state.riskAccepted && state.paymentReady);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f7f2] text-[#18211d]">
      <header className="sticky top-0 z-40 border-b border-[#dce4d8] bg-[#f5f7f2]/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="text-lg font-semibold tracking-[0.18em] text-emerald-800">
            {content.nav.brand}
          </Link>
          <div className="hidden items-center gap-7 text-sm text-[#56665d] md:flex">
            {content.nav.links.map((link) => (
              <Link key={link.href} href={link.href} className="text-[#56665d] hover:text-[#18211d]">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle variant="light" />
            <a
              href="#enroll"
              className="border border-[#17231e] bg-[#17231e] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white"
            >
              {content.nav.cta}
            </a>
          </div>
        </nav>
      </header>

      <section id="enroll" className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-12">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-700">{content.hero.badge}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            {content.hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#516159]">{content.hero.body}</p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {content.hero.metrics.map(([label, value]) => (
              <div key={label} className="border border-[#d9ded5] bg-white px-3 py-3">
                <p className="text-xs text-[#6b766f]">{label}</p>
                <p className="mt-1 text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const selected = step.id === activeStepId;
              const complete = completion[step.id];
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepId(step.id)}
                  className={`min-w-[150px] border px-3 py-3 text-left transition sm:min-w-0 ${
                    selected ? "border-[#17231e] bg-white" : "border-[#d9ded5] bg-[#fbfcf8] hover:bg-white"
                  }`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center ${step.accent}`}>
                    {complete ? <Check className="h-5 w-5 text-white" /> : <Icon className="h-5 w-5 text-white" />}
                  </span>
                  <span className="mt-3 block text-xs text-[#66746e]">{content.wizard.step(index)}</span>
                  <span className="mt-1 block text-sm font-semibold">{step.meta}</span>
                  <span className={`mt-2 block text-xs ${complete ? "text-emerald-700" : "text-[#7a867e]"}`}>
                    {complete ? content.wizard.complete : content.wizard.pending}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <EnrollmentPhone
          activeStepIndex={activeStepIndex}
          beneficiaryTotal={beneficiaryTotal}
          canSubmit={canSubmit}
          completion={completion}
          content={content}
          language={language}
          onAddBeneficiary={addBeneficiary}
          onKycFile={setKycFile}
          onPrimary={completeCurrentStep}
          onRemoveBeneficiary={removeBeneficiary}
          onSetState={setState}
          onUpdateBeneficiary={updateBeneficiary}
          primaryDisabled={primaryDisabled}
          state={state}
          step={activeStep}
        />
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-12 md:px-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border border-[#d9ded5] bg-white p-5 md:p-7">
          <p className="text-sm font-semibold text-emerald-700">{content.access.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold">{content.access.title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#516159]">{content.access.body}</p>
        </div>
        <WalletAuth variant="light" />
      </section>

      <section id="rules" className="border-y border-[#dce4d8] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold text-emerald-700">{content.rules.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">
              {content.rules.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-[#516159]">{content.rules.body}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {content.rules.items.map((item) => (
              <div key={item} className="flex gap-3 border border-[#dce4d8] bg-[#f8faf6] p-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-emerald-100 text-emerald-700">
                  <Check className="h-4 w-4" />
                </span>
                <p className="text-sm leading-6 text-[#405047]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-[#647268] md:flex-row md:items-center md:justify-between md:px-8">
        <p>© 2026 RISKA · World Chain Mini App</p>
        <div className="flex gap-4">
          <Link href="/onboarding-mockups" className="text-[#56665d] hover:text-[#18211d]">
            Mockups
          </Link>
          <Link href="/whitepaper" className="text-[#56665d] hover:text-[#18211d]">
            White paper
          </Link>
        </div>
      </footer>
    </main>
  );
}

type EnrollmentPhoneProps = {
  activeStepIndex: number;
  beneficiaryTotal: number;
  canSubmit: boolean;
  completion: CompletionMap;
  content: (typeof copy)[Language];
  language: Language;
  onAddBeneficiary: () => void;
  onKycFile: (field: keyof Pick<KycFiles, "passportFront" | "passportSecond">, fileName: string) => void;
  onPrimary: () => void;
  onRemoveBeneficiary: (id: string) => void;
  onSetState: Dispatch<SetStateAction<EnrollmentState>>;
  onUpdateBeneficiary: (id: string, field: keyof Pick<Beneficiary, "name" | "percent" | "wallet">, value: string) => void;
  primaryDisabled: boolean;
  state: EnrollmentState;
  step: WizardStep;
};

function EnrollmentPhone(props: EnrollmentPhoneProps) {
  const { activeStepIndex, content, primaryDisabled, state, step } = props;
  const Icon = step.icon;
  const primaryLabel = getPrimaryLabel(props);

  return (
    <article className="mx-auto w-full max-w-[390px] rounded-[34px] border-[10px] border-[#111816] bg-[#111816] shadow-2xl shadow-[#22332a]/20 lg:ml-auto">
      <div className="min-h-[680px] overflow-hidden rounded-[22px] bg-[#fbfcf8]">
        <div className="flex items-center justify-between border-b border-[#e7ebe2] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${step.accent}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-[#6b766f]">{content.wizard.step(activeStepIndex)}</p>
              <p className="text-sm font-semibold">{step.meta}</p>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef3ec]">
            <LockKeyhole className="h-4 w-4 text-[#526258]" />
          </div>
        </div>

        <div className="h-1 bg-[#e4eae1]">
          <div className={`h-full ${step.accent}`} style={{ width: `${(activeStepIndex + 1) * 20}%` }} />
        </div>

        <div className="flex min-h-[620px] flex-col px-5 pb-5 pt-6">
          <h2 className="text-2xl font-semibold leading-tight">{step.title}</h2>
          <div className="mt-5 flex-1">
            {renderScreen(props)}
          </div>

          {state.submitted && (
            <p className="mb-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
              {content.wizard.confirm.submitted}
            </p>
          )}

          <button
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 bg-[#17231e] px-4 text-sm font-semibold text-white transition hover:bg-[#26342d] disabled:cursor-not-allowed disabled:bg-[#cbd6cf] disabled:text-[#728078]"
            disabled={primaryDisabled || state.submitted}
            onClick={props.onPrimary}
            type="button"
          >
            {primaryLabel}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function renderScreen(props: EnrollmentPhoneProps) {
  switch (props.step.id) {
    case "identity":
      return <IdentityScreen {...props} />;
    case "kyc":
      return <KycScreen {...props} />;
    case "beneficiaries":
      return <BeneficiariesScreen {...props} />;
    case "quote":
      return <QuoteScreen {...props} />;
    case "confirm":
      return <ConfirmScreen {...props} />;
  }
}

function IdentityScreen({ content, onSetState, state }: EnrollmentPhoneProps) {
  const text = content.wizard.identity;
  return (
    <div className="space-y-4">
      <InteractiveInfoBlock
        checked={state.walletReady}
        detail={text.walletDetail}
        icon={WalletCards}
        title={text.wallet}
      />
      <InteractiveInfoBlock
        checked={state.identityReserved}
        detail={text.worldIdDetail}
        icon={ShieldCheck}
        title={text.worldId}
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          className="border border-[#dce4d8] bg-white px-3 py-3 text-sm font-semibold text-[#17231e]"
          onClick={() => onSetState((current) => ({ ...current, walletReady: true }))}
          type="button"
        >
          {text.connectDemo}
        </button>
        <button
          className="border border-[#dce4d8] bg-white px-3 py-3 text-sm font-semibold text-[#17231e] disabled:text-[#9aa69f]"
          disabled={!state.walletReady}
          onClick={() => onSetState((current) => ({ ...current, identityReserved: true }))}
          type="button"
        >
          {text.reserveDemo}
        </button>
      </div>
      <div className="border border-[#dae3d8] bg-[#f2f6ee] p-4">
        <p className="text-xs text-[#6b766f]">{content.wizard.demoNotice}</p>
        <p className="mt-1 text-sm leading-6">{text.realGate}</p>
      </div>
    </div>
  );
}

function KycScreen({ content, onKycFile, onSetState, state }: EnrollmentPhoneProps) {
  const text = content.wizard.kyc;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <KycTile
          field="passportFront"
          icon={Upload}
          label={text.passportFront}
          onKycFile={onKycFile}
          state={state.kyc.passportFront ? text.uploaded : text.pending}
        />
        <KycTile
          field="passportSecond"
          icon={Upload}
          label={text.passportSecond}
          onKycFile={onKycFile}
          state={state.kyc.passportSecond ? text.uploaded : text.pending}
        />
      </div>
      <button
        className="w-full border border-[#d9e2df] bg-white p-4 text-left"
        onClick={() => onSetState((current) => ({ ...current, kyc: { ...current.kyc, face: true } }))}
        type="button"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{text.face}</p>
            <p className="mt-1 text-sm text-[#66746e]">{text.faceDetail}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center bg-cyan-50">
            {state.kyc.face ? <Check className="h-6 w-6 text-cyan-700" /> : <Camera className="h-6 w-6 text-cyan-700" />}
          </div>
        </div>
      </button>
      <Checklist items={text.checks} />
    </div>
  );
}

function BeneficiariesScreen({
  beneficiaryTotal,
  content,
  onAddBeneficiary,
  onRemoveBeneficiary,
  onUpdateBeneficiary,
  state
}: EnrollmentPhoneProps) {
  const text = content.wizard.beneficiaries;
  return (
    <div className="space-y-3">
      {state.beneficiaries.map((beneficiary) => (
        <BeneficiaryEditor
          beneficiary={beneficiary}
          key={beneficiary.id}
          onRemoveBeneficiary={onRemoveBeneficiary}
          onUpdateBeneficiary={onUpdateBeneficiary}
          text={text}
        />
      ))}
      <button
        className="flex w-full items-center gap-3 border border-dashed border-[#cdd8ce] bg-[#fbfcf8] p-3 text-left disabled:opacity-50"
        disabled={state.beneficiaries.length >= 5}
        onClick={onAddBeneficiary}
        type="button"
      >
        <span className="flex h-9 w-9 items-center justify-center bg-[#eef3ec]">
          <UserPlus className="h-5 w-5 text-[#526258]" />
        </span>
        <span className="font-semibold">{text.add}</span>
      </button>
      <div className="h-2 overflow-hidden bg-[#e8ede4]">
        <div className="h-full bg-[#17231e]" style={{ width: `${Math.min(beneficiaryTotal, 100)}%` }} />
      </div>
      <p className={`text-xs ${beneficiaryTotal === 100 ? "text-emerald-700" : "text-red-700"}`}>
        {text.total(beneficiaryTotal)}
      </p>
      {beneficiaryTotal !== 100 && <p className="text-xs text-red-700">{text.invalid}</p>}
    </div>
  );
}

function QuoteScreen({ content, onSetState, state }: EnrollmentPhoneProps) {
  const text = content.wizard.quote;
  const ruleIcons = [Percent, HeartHandshake, BadgeCheck, Users];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <QuoteMetric label={text.premium} value="30 USDC" />
        <QuoteMetric label={text.principal} value="10,800 USDC" />
      </div>
      <QuoteMetric label={text.payout} value="90 USDC / mo" />
      {text.rules.map(([label, value], index) => (
        <RuleRow icon={ruleIcons[index]} key={label} label={label} value={value} />
      ))}
      <label className="flex items-start gap-3 border border-[#dce4d8] bg-white p-3 text-sm">
        <input
          checked={state.quoteReviewed}
          className="mt-1 h-4 w-4 accent-[#17231e]"
          onChange={(event) => onSetState((current) => ({ ...current, quoteReviewed: event.target.checked }))}
          type="checkbox"
        />
        <span>{text.reviewed}</span>
      </label>
    </div>
  );
}

function ConfirmScreen({ canSubmit, completion, content, onSetState, state }: EnrollmentPhoneProps) {
  const text = content.wizard.confirm;
  const checklist = [
    completion.identity,
    completion.kyc,
    completion.beneficiaries,
    completion.quote
  ];
  return (
    <div className="space-y-4">
      <div className="border border-[#ddd8ed] bg-[#f5f2ff] p-4">
        <p className="text-sm text-[#655a80]">{text.termsHash}</p>
        <p className="mt-2 break-all font-mono text-xs text-[#32284f]">0x9a81...f03c</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {text.checklist.map((item, index) => (
          <StatusPill complete={checklist[index]} key={item} label={item} />
        ))}
      </div>
      <div className="border border-[#e3dfd6] bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#66746e]">{text.firstPayment}</span>
          <span className="font-semibold">30 USDC</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-[#66746e]">{text.network}</span>
          <span className="font-semibold">World Chain</span>
        </div>
      </div>
      <ConsentCheck
        checked={state.termsAccepted}
        label={text.terms}
        onChange={(checked) => onSetState((current) => ({ ...current, termsAccepted: checked }))}
      />
      <ConsentCheck
        checked={state.riskAccepted}
        label={text.risk}
        onChange={(checked) => onSetState((current) => ({ ...current, riskAccepted: checked }))}
      />
      <ConsentCheck
        checked={state.paymentReady}
        disabled={!canSubmit}
        label={text.payment}
        onChange={(checked) => onSetState((current) => ({ ...current, paymentReady: checked }))}
      />
      {!canSubmit && <p className="text-xs leading-5 text-red-700">{content.wizard.demoBody}</p>}
    </div>
  );
}

function InteractiveInfoBlock({
  checked,
  detail,
  icon: Icon,
  title
}: {
  checked: boolean;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="border border-[#dce4d8] bg-white p-4">
      <div className="flex gap-3">
        <div className={`flex h-10 w-10 items-center justify-center ${checked ? "bg-emerald-50 text-emerald-700" : "bg-[#eef3ec] text-[#526258]"}`}>
          {checked ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
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
  field,
  icon: Icon,
  label,
  onKycFile,
  state
}: {
  field: keyof Pick<KycFiles, "passportFront" | "passportSecond">;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onKycFile: (field: keyof Pick<KycFiles, "passportFront" | "passportSecond">, fileName: string) => void;
  state: string;
}) {
  return (
    <label className="cursor-pointer border border-[#d9e2df] bg-white p-3">
      <input
        className="sr-only"
        onChange={(event) => onKycFile(field, event.target.files?.[0]?.name ?? "")}
        type="file"
      />
      <div className="flex h-10 w-10 items-center justify-center bg-cyan-50">
        <Icon className="h-5 w-5 text-cyan-700" />
      </div>
      <p className="mt-4 text-sm font-semibold">{label}</p>
      <p className="mt-1 truncate text-xs text-[#66746e]">{state}</p>
    </label>
  );
}

function BeneficiaryEditor({
  beneficiary,
  onRemoveBeneficiary,
  onUpdateBeneficiary,
  text
}: {
  beneficiary: Beneficiary;
  onRemoveBeneficiary: (id: string) => void;
  onUpdateBeneficiary: (id: string, field: keyof Pick<Beneficiary, "name" | "percent" | "wallet">, value: string) => void;
  text: (typeof copy)[Language]["wizard"]["beneficiaries"];
}) {
  return (
    <div className="border border-[#dce4d8] bg-white p-3">
      <div className="flex items-center gap-2">
        <span className={`h-8 w-8 shrink-0 ${beneficiary.color}`} />
        <input
          aria-label={text.name}
          className="min-w-0 flex-1 border border-[#e3e8df] bg-[#fbfcf8] px-2 py-2 text-sm font-semibold outline-none focus:border-[#17231e]"
          onChange={(event) => onUpdateBeneficiary(beneficiary.id, "name", event.target.value)}
          value={beneficiary.name}
        />
        <button
          aria-label="Remove beneficiary"
          className="flex h-9 w-9 items-center justify-center border border-[#e3e8df] text-[#66746e]"
          onClick={() => onRemoveBeneficiary(beneficiary.id)}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_88px] gap-2">
        <input
          aria-label={text.wallet}
          className="min-w-0 border border-[#e3e8df] bg-[#fbfcf8] px-2 py-2 text-xs outline-none focus:border-[#17231e]"
          onChange={(event) => onUpdateBeneficiary(beneficiary.id, "wallet", event.target.value)}
          placeholder="0x..."
          value={beneficiary.wallet}
        />
        <input
          aria-label={text.share}
          className="border border-[#e3e8df] bg-[#fbfcf8] px-2 py-2 text-right text-sm font-semibold outline-none focus:border-[#17231e]"
          max={100}
          min={0}
          onChange={(event) => onUpdateBeneficiary(beneficiary.id, "percent", event.target.value)}
          type="number"
          value={beneficiary.percent}
        />
      </div>
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

function QuoteMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#dce4d8] bg-white p-4">
      <p className="text-sm text-[#66746e]">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
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

function ConsentCheck({
  checked,
  disabled,
  label,
  onChange
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-3 border border-[#dce4d8] bg-white p-3 text-sm ${disabled ? "opacity-50" : ""}`}>
      <input
        checked={checked}
        className="mt-1 h-4 w-4 accent-[#17231e]"
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}

function StatusPill({ complete, label }: { complete: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 border px-2 py-2 text-xs ${complete ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-[#e3e8df] bg-white text-[#66746e]"}`}>
      <span className="flex h-4 w-4 items-center justify-center">
        {complete && <Check className="h-3.5 w-3.5" />}
      </span>
      {label}
    </div>
  );
}

function getCompletion(state: EnrollmentState, beneficiaryTotal: number): CompletionMap {
  return {
    identity: state.walletReady && state.identityReserved,
    kyc: Boolean(state.kyc.passportFront && state.kyc.passportSecond && state.kyc.face),
    beneficiaries: state.beneficiaries.length > 0 && beneficiaryTotal === 100,
    quote: state.quoteReviewed,
    confirm: state.submitted
  };
}

function clampPercent(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function getPrimaryLabel({ completion, content, state, step }: EnrollmentPhoneProps) {
  if (state.submitted) {
    return content.wizard.done;
  }

  if (step.id === "identity") {
    if (!state.walletReady) {
      return content.wizard.identity.connectDemo;
    }

    if (!state.identityReserved) {
      return content.wizard.identity.reserveDemo;
    }
  }

  if (step.id === "kyc" && !completion.kyc) {
    return content.wizard.kyc.captureFace;
  }

  if (step.id === "quote" && !completion.quote) {
    return content.wizard.quote.reviewed;
  }

  if (step.id === "confirm") {
    return content.wizard.done;
  }

  return content.wizard.continue;
}
