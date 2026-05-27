"use client";

import {
  BadgeCheck,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  Fingerprint,
  HeartHandshake,
  IdCard,
  Percent,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Users,
  WalletCards
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type Dispatch,
  type SetStateAction
} from "react";

import { Footer } from "@/components/Footer";
import { useLanguage } from "@/components/LanguageProvider";
import { Navbar } from "@/components/Navbar";
import { WalletAuth, type WalletAuthSession } from "@/components/WalletAuth";
import type { PolicyHumanReservationView } from "@/components/WorldIdGate";
import type { Language } from "@/lib/i18n";

type StepId = "identity" | "kyc" | "beneficiaries" | "quote" | "confirm";

type WizardStep = {
  accent: string;
  icon: ComponentType<{ className?: string }>;
  id: StepId;
};

type Beneficiary = {
  color: string;
  id: string;
  name: string;
  percent: number;
  wallet: string;
};

type KycFiles = {
  faceCapture: string;
  passportFront: string;
  passportSecond: string;
};

type EnrollmentState = {
  applicationId: string | null;
  beneficiaries: Beneficiary[];
  humanReservation: PolicyHumanReservationView | null;
  kyc: KycFiles;
  paymentReady: boolean;
  quoteReviewed: boolean;
  riskAccepted: boolean;
  submitted: boolean;
  submittedAt: string | null;
  termsAccepted: boolean;
  walletSession: WalletAuthSession | null;
};

type CompletionMap = Record<StepId, boolean>;

const storageKey = "riska.enrollment.v1";
const beneficiaryColors = ["bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-cyan-500", "bg-violet-500"];

const steps: WizardStep[] = [
  { accent: "bg-emerald-500", icon: Fingerprint, id: "identity" },
  { accent: "bg-cyan-500", icon: IdCard, id: "kyc" },
  { accent: "bg-rose-500", icon: Users, id: "beneficiaries" },
  { accent: "bg-amber-500", icon: CircleDollarSign, id: "quote" },
  { accent: "bg-violet-500", icon: FileCheck2, id: "confirm" }
];

const copy = {
  en: {
    welcome: {
      badge: "Riska 30",
      title: "Life protection that becomes programmed income.",
      body:
        "Riska is a 30-year USDC policy on World Chain. During the contribution phase it protects your family; after maturity it turns into scheduled payments for the holder.",
      primary: "Start application",
      secondary: "Read policy rules",
      cards: [
        {
          icon: HeartHandshake,
          title: "Family protection",
          body: "After 12 paid months, verified beneficiaries can receive the published payout formula if the holder dies before maturity."
        },
        {
          icon: CircleDollarSign,
          title: "30-year income",
          body: "If the holder reaches maturity, 100% of scheduled principal is paid over 10 years."
        },
        {
          icon: Fingerprint,
          title: "One human, one policy",
          body: "World ID and wallet authentication reserve one policy slot for each verified human."
        }
      ],
      facts: [
        ["Premium", "30 USDC / month"],
        ["Waiting period", "12 months"],
        ["Maturity", "30 years"],
        ["Network", "World Chain"]
      ]
    },
    hero: {
      badge: "World Chain policy application",
      title: "Enroll in Riska 30.",
      body:
        "Complete the real policy application flow: wallet, World ID, KYC, beneficiaries, policy quote, and signed consent before issuance.",
      metrics: [
        ["Monthly premium", "30 USDC"],
        ["Waiting period", "12 months"],
        ["Maturity", "30 years"]
      ]
    },
    rules: {
      eyebrow: "Riska 30 rules",
      title: "The promise is visible before the user signs.",
      body:
        "No payout before 12 paid months, beneficiaries receive 80% before maturity, the holder receives 100% at maturity, and beneficiaries receive 90% after maturity.",
      items: [
        "No policy issuance before KYC approval",
        "Beneficiaries must total 100%",
        "Terms hash shown before payment",
        "Audited contracts required before user funds"
      ]
    },
    wizard: {
      back: "Back",
      blocked: "Complete the required fields to continue.",
      complete: "Complete",
      continue: "Continue",
      pending: "Pending",
      ready: "Ready",
      required: "Required",
      step: (index: number) => `Step ${index + 1} of 5`,
      submit: "Submit application",
      submitted: "Application submitted",
      steps: {
        beneficiaries: { meta: "Beneficiaries", title: "Beneficiary allocation" },
        confirm: { meta: "World Chain", title: "Review and consent" },
        identity: { meta: "Wallet + World ID", title: "Verified human" },
        kyc: { meta: "Passport + face", title: "Identity documents" },
        quote: { meta: "30 USDC / month", title: "Policy quote" }
      },
      identity: {
        instruction:
          "Connect your wallet and complete World ID. The wizard unlocks the next step only after one verified human is reserved for this wallet.",
        wallet: "Wallet connected",
        walletDetail: "Wallet Auth binds this application to a World Chain address.",
        worldId: "Human reserved",
        worldIdDetail: "World ID reserves one policy slot for one verified human."
      },
      kyc: {
        checks: ["Encrypted off-chain storage target", "Riska Team review queue", "No premium payment before approval"],
        face: "Face capture",
        faceDetail: "Use a live front-facing image for the passport match.",
        passportFront: "Passport front",
        passportSecond: "Second page",
        pending: "Required",
        uploaded: "Selected"
      },
      beneficiaries: {
        add: "Add beneficiary",
        invalid: "Shares must total exactly 100%.",
        name: "Name",
        namePlaceholder: "Full name",
        remove: "Remove beneficiary",
        share: "Share",
        total: (value: number) => `Total allocation: ${value}%`,
        wallet: "Wallet",
        walletInvalid: "Each beneficiary needs a valid 0x wallet address.",
        walletPlaceholder: "0x..."
      },
      quote: {
        payout: "Maturity payout",
        premium: "Monthly premium",
        principal: "Scheduled principal",
        reviewed: "I reviewed the policy formula.",
        rules: [
          ["Before 12 months", "0%"],
          ["Month 12 to maturity", "80%"],
          ["30-year maturity", "100%"],
          ["After maturity", "90%"]
        ]
      },
      confirm: {
        application: "Application",
        checklist: ["World ID", "KYC", "Beneficiaries", "Quote"],
        firstPayment: "First payment",
        network: "Network",
        proof: "Human proof",
        submitted:
          "Application is ready for review. The next backend step is storing it, approving KYC, and opening policy issuance.",
        terms: "I accept the Riska 30 policy terms.",
        termsHash: "Terms hash",
        risk: "I understand the payout rules, KYC review, and smart-contract audit requirement before user funds are activated.",
        payment: "I authorize preparing the first 30 USDC payment for the issuance step.",
        wallet: "Wallet"
      }
    }
  },
  es: {
    welcome: {
      badge: "Riska 30",
      title: "Proteccion de vida que se convierte en renta programada.",
      body:
        "Riska es una poliza USDC a 30 anios en World Chain. Durante la etapa de aporte protege a tu familia; al madurar se convierte en pagos programados para el titular.",
      primary: "Empezar solicitud",
      secondary: "Ver reglas",
      cards: [
        {
          icon: HeartHandshake,
          title: "Proteccion familiar",
          body: "Despues de 12 meses pagos, los beneficiarios verificados pueden cobrar la formula publicada si el titular fallece antes de madurar."
        },
        {
          icon: CircleDollarSign,
          title: "Renta a 30 anios",
          body: "Si el titular llega a madurez, cobra 100% del principal programado durante 10 anios."
        },
        {
          icon: Fingerprint,
          title: "Un humano, una poliza",
          body: "World ID y la wallet reservan un cupo de poliza para cada humano verificado."
        }
      ],
      facts: [
        ["Prima", "30 USDC / mes"],
        ["Espera", "12 meses"],
        ["Madurez", "30 anios"],
        ["Red", "World Chain"]
      ]
    },
    hero: {
      badge: "Solicitud de poliza en World Chain",
      title: "Inscribite en Riska 30.",
      body:
        "Completa el flujo real de solicitud: wallet, World ID, KYC, beneficiarios, cotizacion de poliza y consentimiento firmado antes de emitir.",
      metrics: [
        ["Prima mensual", "30 USDC"],
        ["Espera inicial", "12 meses"],
        ["Madurez", "30 anios"]
      ]
    },
    rules: {
      eyebrow: "Reglas Riska 30",
      title: "La promesa queda visible antes de firmar.",
      body:
        "No hay pago antes de 12 meses pagos, beneficiarios cobran 80% antes de madurez, el titular cobra 100% al madurar y beneficiarios cobran 90% despues de madurez.",
      items: [
        "No se emite poliza antes de aprobar KYC",
        "Los beneficiarios deben sumar 100%",
        "Hash de terminos antes del pago",
        "Contratos auditados antes de fondos de usuarios"
      ]
    },
    wizard: {
      back: "Atras",
      blocked: "Completa los campos requeridos para continuar.",
      complete: "Completo",
      continue: "Continuar",
      pending: "Pendiente",
      ready: "Listo",
      required: "Requerido",
      step: (index: number) => `Paso ${index + 1} de 5`,
      submit: "Enviar solicitud",
      submitted: "Solicitud enviada",
      steps: {
        beneficiaries: { meta: "Beneficiarios", title: "Asignacion de beneficiarios" },
        confirm: { meta: "World Chain", title: "Revision y consentimiento" },
        identity: { meta: "Wallet + World ID", title: "Humano verificado" },
        kyc: { meta: "Pasaporte + rostro", title: "Documentos de identidad" },
        quote: { meta: "30 USDC / mes", title: "Cotizacion de poliza" }
      },
      identity: {
        instruction:
          "Conecta tu wallet y completa World ID. El wizard habilita el siguiente paso solo cuando queda reservado un humano verificado para esta wallet.",
        wallet: "Wallet conectada",
        walletDetail: "Wallet Auth ata esta solicitud a una direccion de World Chain.",
        worldId: "Humano reservado",
        worldIdDetail: "World ID reserva un cupo de poliza para un humano verificado."
      },
      kyc: {
        checks: ["Destino de datos cifrado off-chain", "Cola de revision Riska Team", "Sin pago de prima antes de aprobar"],
        face: "Captura facial",
        faceDetail: "Usa una imagen frontal viva para matchear contra el pasaporte.",
        passportFront: "Pasaporte frente",
        passportSecond: "Segunda hoja",
        pending: "Requerido",
        uploaded: "Seleccionado"
      },
      beneficiaries: {
        add: "Agregar beneficiario",
        invalid: "Los porcentajes deben sumar exactamente 100%.",
        name: "Nombre",
        namePlaceholder: "Nombre completo",
        remove: "Quitar beneficiario",
        share: "Porcentaje",
        total: (value: number) => `Asignacion total: ${value}%`,
        wallet: "Wallet",
        walletInvalid: "Cada beneficiario necesita una wallet 0x valida.",
        walletPlaceholder: "0x..."
      },
      quote: {
        payout: "Pago al madurar",
        premium: "Prima mensual",
        principal: "Principal programado",
        reviewed: "Revise la formula de la poliza.",
        rules: [
          ["Antes de 12 meses", "0%"],
          ["Mes 12 a madurez", "80%"],
          ["Madurez 30 anios", "100%"],
          ["Despues de madurar", "90%"]
        ]
      },
      confirm: {
        application: "Solicitud",
        checklist: ["World ID", "KYC", "Beneficiarios", "Cotizacion"],
        firstPayment: "Primer pago",
        network: "Red",
        proof: "Prueba humana",
        submitted:
          "La solicitud queda lista para revision. El proximo paso backend es guardarla, aprobar KYC y abrir emision de poliza.",
        terms: "Acepto los terminos de la poliza Riska 30.",
        termsHash: "Hash de terminos",
        risk: "Entiendo las reglas de pago, la revision KYC y el requisito de auditoria de contratos antes de activar fondos de usuarios.",
        payment: "Autorizo preparar el primer pago de 30 USDC para el paso de emision.",
        wallet: "Wallet"
      }
    }
  }
};

const initialState: EnrollmentState = {
  applicationId: null,
  beneficiaries: [createEmptyBeneficiary(1, 100)],
  humanReservation: null,
  kyc: {
    faceCapture: "",
    passportFront: "",
    passportSecond: ""
  },
  paymentReady: false,
  quoteReviewed: false,
  riskAccepted: false,
  submitted: false,
  submittedAt: null,
  termsAccepted: false,
  walletSession: null
};

export function RiskaEnrollmentHome() {
  const { language } = useLanguage();
  const content = copy[language];
  const [activeStepId, setActiveStepId] = useState<StepId>("identity");
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<EnrollmentState>(initialState);

  useEffect(() => {
    try {
      const storedState = window.localStorage.getItem(storageKey);
      if (storedState) {
        setState(restoreEnrollmentState(JSON.parse(storedState)));
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [hydrated, state]);

  const activeStepIndex = steps.findIndex((step) => step.id === activeStepId);
  const activeStep = steps[activeStepIndex] ?? steps[0];
  const beneficiaryTotal = state.beneficiaries.reduce((total, beneficiary) => total + beneficiary.percent, 0);
  const completion = getCompletion(state, beneficiaryTotal);
  const canSubmit = completion.identity && completion.kyc && completion.beneficiaries && completion.quote;
  const readyToSubmit = canSubmit && state.termsAccepted && state.riskAccepted && state.paymentReady;

  const handleWalletSessionChange = useCallback((walletSession: WalletAuthSession | null) => {
    setState((current) => {
      if (sameWalletSession(current.walletSession, walletSession)) {
        return current;
      }

      return {
        ...clearSubmission(current),
        humanReservation: walletSession ? current.humanReservation : null,
        walletSession
      };
    });
  }, []);

  const handleHumanReservationChange = useCallback((humanReservation: PolicyHumanReservationView | null) => {
    setState((current) => {
      if (sameHumanReservation(current.humanReservation, humanReservation)) {
        return current;
      }

      return {
        ...clearSubmission(current),
        humanReservation
      };
    });
  }, []);

  function setKycFile(field: keyof KycFiles, fileName: string) {
    setState((current) => ({
      ...clearSubmission(current),
      kyc: {
        ...current.kyc,
        [field]: fileName
      }
    }));
  }

  function updateBeneficiary(id: string, field: keyof Pick<Beneficiary, "name" | "percent" | "wallet">, value: string) {
    setState((current) => ({
      ...clearSubmission(current),
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

      return {
        ...clearSubmission(current),
        beneficiaries: [
          ...current.beneficiaries,
          createEmptyBeneficiary(current.beneficiaries.length + 1, 0)
        ]
      };
    });
  }

  function removeBeneficiary(id: string) {
    setState((current) => {
      if (current.beneficiaries.length <= 1) {
        return current;
      }

      return {
        ...clearSubmission(current),
        beneficiaries: current.beneficiaries.filter((beneficiary) => beneficiary.id !== id)
      };
    });
  }

  function goBack() {
    const previousStep = steps[Math.max(activeStepIndex - 1, 0)];
    setActiveStepId(previousStep.id);
  }

  function continueEnrollment() {
    if (activeStep.id === "confirm") {
      if (readyToSubmit) {
        setState((current) => ({
          ...current,
          applicationId: current.applicationId ?? `RISKA-${Date.now().toString(36).toUpperCase()}`,
          submitted: true,
          submittedAt: current.submittedAt ?? new Date().toISOString()
        }));
      }
      return;
    }

    if (!completion[activeStep.id]) {
      return;
    }

    const nextStep = steps[Math.min(activeStepIndex + 1, steps.length - 1)];
    setActiveStepId(nextStep.id);
  }

  const primaryDisabled =
    activeStep.id === "confirm"
      ? !readyToSubmit || state.submitted
      : !completion[activeStep.id];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f7f2] text-[#18211d]">
      <Navbar />
      <main>
        <WelcomeScreen content={content} />

        <section id="enroll" className="mx-auto max-w-7xl px-5 py-8 md:px-8 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <aside className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-emerald-700">{content.hero.badge}</p>
                <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">
                  {content.hero.title}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-[#516159]">{content.hero.body}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {content.hero.metrics.map(([label, value]) => (
                  <div key={label} className="border border-[#d9ded5] bg-white px-3 py-3">
                    <p className="text-xs text-[#6b766f]">{label}</p>
                    <p className="mt-1 text-lg font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <StepRail
                activeStepId={activeStepId}
                completion={completion}
                content={content}
                onStepSelect={setActiveStepId}
              />
            </aside>

            <EnrollmentWizard
              activeStepIndex={activeStepIndex}
              beneficiaryTotal={beneficiaryTotal}
              canSubmit={canSubmit}
              completion={completion}
              content={content}
              onAddBeneficiary={addBeneficiary}
              onBack={goBack}
              onHumanReservationChange={handleHumanReservationChange}
              onKycFile={setKycFile}
              onPrimary={continueEnrollment}
              onRemoveBeneficiary={removeBeneficiary}
              onSetState={setState}
              onUpdateBeneficiary={updateBeneficiary}
              onWalletSessionChange={handleWalletSessionChange}
              primaryDisabled={primaryDisabled}
              readyToSubmit={readyToSubmit}
              state={state}
              step={activeStep}
            />
          </div>
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
      </main>
      <Footer />
    </div>
  );
}

function WelcomeScreen({ content }: { content: (typeof copy)[Language] }) {
  const welcome = content.welcome;

  return (
    <section className="border-b border-[#dce4d8] bg-[#f5f7f2]">
      <div className="mx-auto grid min-h-[calc(100vh-69px)] max-w-7xl gap-10 px-5 py-10 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-emerald-700">{welcome.badge}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
            {welcome.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#516159]">{welcome.body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="flex h-12 items-center justify-center bg-[#17231e] px-5 text-sm font-semibold text-white transition hover:bg-[#26342d] hover:text-white"
              href="#enroll"
            >
              {welcome.primary}
            </a>
            <a
              className="flex h-12 items-center justify-center border border-[#cbd7cf] bg-white px-5 text-sm font-semibold text-[#26342d] transition hover:border-[#17231e] hover:text-[#18211d]"
              href="#rules"
            >
              {welcome.secondary}
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {welcome.facts.map(([label, value]) => (
              <div className="border border-[#d9ded5] bg-white p-4" key={label}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#66746e]">{label}</p>
                <p className="mt-2 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3">
            {welcome.cards.map((card) => {
              const Icon = card.icon;

              return (
                <article className="flex gap-4 border border-[#d9ded5] bg-white p-4" key={card.title}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-semibold">{card.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[#516159]">{card.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

type EnrollmentWizardProps = {
  activeStepIndex: number;
  beneficiaryTotal: number;
  canSubmit: boolean;
  completion: CompletionMap;
  content: (typeof copy)[Language];
  onAddBeneficiary: () => void;
  onBack: () => void;
  onHumanReservationChange: (reservation: PolicyHumanReservationView | null) => void;
  onKycFile: (field: keyof KycFiles, fileName: string) => void;
  onPrimary: () => void;
  onRemoveBeneficiary: (id: string) => void;
  onSetState: Dispatch<SetStateAction<EnrollmentState>>;
  onUpdateBeneficiary: (id: string, field: keyof Pick<Beneficiary, "name" | "percent" | "wallet">, value: string) => void;
  onWalletSessionChange: (session: WalletAuthSession | null) => void;
  primaryDisabled: boolean;
  readyToSubmit: boolean;
  state: EnrollmentState;
  step: WizardStep;
};

function StepRail({
  activeStepId,
  completion,
  content,
  onStepSelect
}: {
  activeStepId: StepId;
  completion: CompletionMap;
  content: (typeof copy)[Language];
  onStepSelect: (stepId: StepId) => void;
}) {
  return (
    <div className="border border-[#d9ded5] bg-white p-4">
      <div className="space-y-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const selected = step.id === activeStepId;
          const complete = completion[step.id];
          const stepCopy = content.wizard.steps[step.id];

          return (
            <button
              aria-current={selected ? "step" : undefined}
              className={`flex w-full items-center gap-3 border px-3 py-3 text-left transition ${
                selected ? "border-[#17231e] bg-[#f8faf6]" : "border-transparent hover:border-[#d9ded5] hover:bg-[#fbfcf8]"
              }`}
              key={step.id}
              onClick={() => onStepSelect(step.id)}
              type="button"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${step.accent}`}>
                {complete ? <Check className="h-5 w-5 text-white" /> : <Icon className="h-5 w-5 text-white" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-[#66746e]">{content.wizard.step(index)}</span>
                <span className="block truncate text-sm font-semibold">{stepCopy.meta}</span>
              </span>
              <span className={`text-xs ${complete ? "text-emerald-700" : "text-[#7a867e]"}`}>
                {complete ? content.wizard.complete : content.wizard.pending}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EnrollmentWizard(props: EnrollmentWizardProps) {
  const { activeStepIndex, content, primaryDisabled, state, step } = props;
  const Icon = step.icon;
  const stepCopy = content.wizard.steps[step.id];
  const primaryLabel = getPrimaryLabel(props);

  return (
    <article className="border border-[#d9ded5] bg-white shadow-2xl shadow-[#22332a]/10">
      <header className="flex flex-col gap-4 border-b border-[#e7ebe2] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center ${step.accent}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-[#6b766f]">{content.wizard.step(activeStepIndex)}</p>
            <h2 className="text-2xl font-semibold leading-tight">{stepCopy.title}</h2>
          </div>
        </div>
        <StatusPill
          complete={step.id === "confirm" ? props.readyToSubmit || state.submitted : props.completion[step.id]}
          label={step.id === "confirm" && state.submitted ? content.wizard.submitted : stepCopy.meta}
        />
      </header>

      <div className="h-1 bg-[#e4eae1]">
        <div className={`h-full ${step.accent}`} style={{ width: `${(activeStepIndex + 1) * 20}%` }} />
      </div>

      <div className="px-5 py-6 md:px-7">
        {renderScreen(props)}

        {state.submitted && (
          <div className="mt-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
            <p className="font-semibold">{content.wizard.confirm.submitted}</p>
            <p className="mt-1 font-mono text-xs">{state.applicationId}</p>
          </div>
        )}

        {!props.completion[step.id] && step.id !== "confirm" && (
          <p className="mt-5 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {content.wizard.blocked}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#e7ebe2] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="flex h-12 items-center justify-center gap-2 border border-[#cbd7cf] bg-white px-5 text-sm font-semibold text-[#26342d] transition hover:border-[#17231e] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={activeStepIndex === 0}
            onClick={props.onBack}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
            {content.wizard.back}
          </button>
          <button
            className="flex h-12 items-center justify-center gap-2 bg-[#17231e] px-5 text-sm font-semibold text-white transition hover:bg-[#26342d] disabled:cursor-not-allowed disabled:bg-[#cbd6cf] disabled:text-[#728078]"
            disabled={primaryDisabled}
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

function renderScreen(props: EnrollmentWizardProps) {
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

function IdentityScreen({
  content,
  onHumanReservationChange,
  onWalletSessionChange,
  state
}: EnrollmentWizardProps) {
  const text = content.wizard.identity;

  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-sm leading-6 text-[#516159]">{text.instruction}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <InteractiveInfoBlock
          checked={Boolean(state.walletSession)}
          detail={state.walletSession ? shortAddress(state.walletSession.address) : text.walletDetail}
          icon={WalletCards}
          title={text.wallet}
        />
        <InteractiveInfoBlock
          checked={Boolean(state.humanReservation)}
          detail={state.humanReservation ? shortProofId(state.humanReservation.nullifier) : text.worldIdDetail}
          icon={ShieldCheck}
          title={text.worldId}
        />
      </div>
      <WalletAuth
        onHumanReservationChange={onHumanReservationChange}
        onSessionChange={onWalletSessionChange}
        variant="light"
      />
    </div>
  );
}

function KycScreen({ content, onKycFile, state }: EnrollmentWizardProps) {
  const text = content.wizard.kyc;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <KycTile
          accept="image/*,.pdf"
          field="passportFront"
          fileName={state.kyc.passportFront}
          icon={Upload}
          label={text.passportFront}
          onKycFile={onKycFile}
          pendingLabel={text.pending}
          uploadedLabel={text.uploaded}
        />
        <KycTile
          accept="image/*,.pdf"
          field="passportSecond"
          fileName={state.kyc.passportSecond}
          icon={Upload}
          label={text.passportSecond}
          onKycFile={onKycFile}
          pendingLabel={text.pending}
          uploadedLabel={text.uploaded}
        />
        <KycTile
          accept="image/*"
          capture="user"
          field="faceCapture"
          fileName={state.kyc.faceCapture}
          icon={Camera}
          label={text.face}
          onKycFile={onKycFile}
          pendingLabel={text.pending}
          uploadedLabel={text.uploaded}
        />
      </div>
      <div className="border border-[#d9e2df] bg-[#f8faf6] p-4">
        <p className="font-semibold">{text.face}</p>
        <p className="mt-1 text-sm leading-6 text-[#66746e]">{text.faceDetail}</p>
      </div>
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
}: EnrollmentWizardProps) {
  const text = content.wizard.beneficiaries;
  const hasWalletError = state.beneficiaries.some((beneficiary) => !isWalletAddress(beneficiary.wallet));

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {state.beneficiaries.map((beneficiary) => (
          <BeneficiaryEditor
            beneficiary={beneficiary}
            canRemove={state.beneficiaries.length > 1}
            key={beneficiary.id}
            onRemoveBeneficiary={onRemoveBeneficiary}
            onUpdateBeneficiary={onUpdateBeneficiary}
            text={text}
          />
        ))}
      </div>
      <button
        className="flex w-full items-center gap-3 border border-dashed border-[#cdd8ce] bg-[#fbfcf8] p-4 text-left transition hover:bg-white disabled:opacity-50"
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
      <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className={beneficiaryTotal === 100 ? "text-emerald-700" : "text-red-700"}>
          {text.total(beneficiaryTotal)}
        </p>
        {beneficiaryTotal !== 100 && <p className="text-red-700">{text.invalid}</p>}
        {hasWalletError && <p className="text-red-700">{text.walletInvalid}</p>}
      </div>
    </div>
  );
}

function QuoteScreen({ content, onSetState, state }: EnrollmentWizardProps) {
  const text = content.wizard.quote;
  const ruleIcons = [Percent, HeartHandshake, BadgeCheck, Users];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <QuoteMetric label={text.premium} value="30 USDC" />
        <QuoteMetric label={text.principal} value="10,800 USDC" />
        <QuoteMetric label={text.payout} value="90 USDC / mo" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {text.rules.map(([label, value], index) => (
          <RuleRow icon={ruleIcons[index]} key={label} label={label} value={value} />
        ))}
      </div>
      <ConsentCheck
        checked={state.quoteReviewed}
        label={text.reviewed}
        onChange={(checked) => onSetState((current) => ({ ...clearSubmission(current), quoteReviewed: checked }))}
      />
    </div>
  );
}

function ConfirmScreen({ canSubmit, completion, content, onSetState, state }: EnrollmentWizardProps) {
  const text = content.wizard.confirm;
  const checklist = [
    completion.identity,
    completion.kyc,
    completion.beneficiaries,
    completion.quote
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <SummaryFact label={text.wallet} value={state.walletSession ? shortAddress(state.walletSession.address) : "-"} />
        <SummaryFact label={text.proof} value={state.humanReservation ? shortProofId(state.humanReservation.nullifier) : "-"} />
        <SummaryFact label={text.firstPayment} value="30 USDC" />
        <SummaryFact label={text.network} value="World Chain" />
      </div>

      <div className="border border-[#ddd8ed] bg-[#f5f2ff] p-4">
        <p className="text-sm text-[#655a80]">{text.termsHash}</p>
        <p className="mt-2 break-all font-mono text-xs text-[#32284f]">0x9a81...f03c</p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {text.checklist.map((item, index) => (
          <StatusPill complete={checklist[index]} key={item} label={item} />
        ))}
      </div>

      <ConsentCheck
        checked={state.termsAccepted}
        label={text.terms}
        onChange={(checked) => onSetState((current) => ({ ...clearSubmission(current), termsAccepted: checked }))}
      />
      <ConsentCheck
        checked={state.riskAccepted}
        label={text.risk}
        onChange={(checked) => onSetState((current) => ({ ...clearSubmission(current), riskAccepted: checked }))}
      />
      <ConsentCheck
        checked={state.paymentReady}
        disabled={!canSubmit}
        label={text.payment}
        onChange={(checked) => onSetState((current) => ({ ...clearSubmission(current), paymentReady: checked }))}
      />
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
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 break-words text-sm leading-6 text-[#66746e]">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function KycTile({
  accept,
  capture,
  field,
  fileName,
  icon: Icon,
  label,
  onKycFile,
  pendingLabel,
  uploadedLabel
}: {
  accept: string;
  capture?: "user" | "environment";
  field: keyof KycFiles;
  fileName: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onKycFile: (field: keyof KycFiles, fileName: string) => void;
  pendingLabel: string;
  uploadedLabel: string;
}) {
  return (
    <label className="cursor-pointer border border-[#d9e2df] bg-white p-4 transition hover:border-[#17231e]">
      <input
        accept={accept}
        capture={capture}
        className="sr-only"
        onChange={(event) => onKycFile(field, event.target.files?.[0]?.name ?? "")}
        type="file"
      />
      <div className="flex h-10 w-10 items-center justify-center bg-cyan-50">
        <Icon className="h-5 w-5 text-cyan-700" />
      </div>
      <p className="mt-4 text-sm font-semibold">{label}</p>
      <p className={`mt-1 truncate text-xs ${fileName ? "text-emerald-700" : "text-[#66746e]"}`}>
        {fileName ? `${uploadedLabel}: ${fileName}` : pendingLabel}
      </p>
    </label>
  );
}

function BeneficiaryEditor({
  beneficiary,
  canRemove,
  onRemoveBeneficiary,
  onUpdateBeneficiary,
  text
}: {
  beneficiary: Beneficiary;
  canRemove: boolean;
  onRemoveBeneficiary: (id: string) => void;
  onUpdateBeneficiary: (id: string, field: keyof Pick<Beneficiary, "name" | "percent" | "wallet">, value: string) => void;
  text: (typeof copy)[Language]["wizard"]["beneficiaries"];
}) {
  const walletInvalid = beneficiary.wallet.trim().length > 0 && !isWalletAddress(beneficiary.wallet);

  return (
    <div className="border border-[#dce4d8] bg-white p-3">
      <div className="flex items-center gap-2">
        <span className={`h-8 w-8 shrink-0 ${beneficiary.color}`} />
        <input
          aria-label={text.name}
          className="min-w-0 flex-1 border border-[#e3e8df] bg-[#fbfcf8] px-2 py-2 text-sm font-semibold outline-none focus:border-[#17231e]"
          onChange={(event) => onUpdateBeneficiary(beneficiary.id, "name", event.target.value)}
          placeholder={text.namePlaceholder}
          value={beneficiary.name}
        />
        <button
          aria-label={text.remove}
          className="flex h-9 w-9 items-center justify-center border border-[#e3e8df] text-[#66746e] transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canRemove}
          onClick={() => onRemoveBeneficiary(beneficiary.id)}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_88px] gap-2">
        <input
          aria-label={text.wallet}
          className={`min-w-0 border bg-[#fbfcf8] px-2 py-2 text-xs outline-none focus:border-[#17231e] ${
            walletInvalid ? "border-red-300" : "border-[#e3e8df]"
          }`}
          onChange={(event) => onUpdateBeneficiary(beneficiary.id, "wallet", event.target.value)}
          placeholder={text.walletPlaceholder}
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
    <div className="grid gap-2 md:grid-cols-3">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-2 border border-[#dce4d8] bg-[#f8faf6] px-3 py-3 text-sm text-[#4d5e55]">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-emerald-100 text-emerald-700">
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
    <div className={`flex items-center gap-2 border px-3 py-2 text-xs ${complete ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-[#e3e8df] bg-white text-[#66746e]"}`}>
      <span className="flex h-4 w-4 items-center justify-center">
        {complete && <Check className="h-3.5 w-3.5" />}
      </span>
      {label}
    </div>
  );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#dce4d8] bg-[#f8faf6] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#66746e]">{label}</p>
      <p className="mt-2 break-words font-semibold">{value}</p>
    </div>
  );
}

function getCompletion(state: EnrollmentState, beneficiaryTotal: number): CompletionMap {
  return {
    identity: Boolean(state.walletSession && state.humanReservation),
    kyc: Boolean(state.kyc.passportFront && state.kyc.passportSecond && state.kyc.faceCapture),
    beneficiaries:
      state.beneficiaries.length > 0 &&
      beneficiaryTotal === 100 &&
      state.beneficiaries.every((beneficiary) => beneficiary.name.trim().length > 0 && isWalletAddress(beneficiary.wallet)),
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

function getPrimaryLabel({ content, state, step }: EnrollmentWizardProps) {
  if (state.submitted) {
    return content.wizard.submitted;
  }

  if (step.id === "confirm") {
    return content.wizard.submit;
  }

  return content.wizard.continue;
}

function createEmptyBeneficiary(index: number, percent: number): Beneficiary {
  return {
    color: beneficiaryColors[(index - 1) % beneficiaryColors.length],
    id: `beneficiary-${index}-${Date.now()}`,
    name: "",
    percent,
    wallet: ""
  };
}

function restoreEnrollmentState(value: unknown): EnrollmentState {
  if (!value || typeof value !== "object") {
    return initialState;
  }

  const stored = value as Partial<EnrollmentState>;
  const beneficiaries =
    Array.isArray(stored.beneficiaries) && stored.beneficiaries.length > 0
      ? stored.beneficiaries.map((beneficiary, index) => ({
          ...createEmptyBeneficiary(index + 1, 0),
          ...beneficiary,
          color: beneficiary.color || beneficiaryColors[index % beneficiaryColors.length],
          id: beneficiary.id || `beneficiary-${index + 1}-${Date.now()}`
        }))
      : initialState.beneficiaries;

  return {
    ...initialState,
    ...stored,
    beneficiaries,
    humanReservation: stored.humanReservation ?? null,
    kyc: {
      ...initialState.kyc,
      ...stored.kyc
    },
    walletSession: stored.walletSession ?? null
  };
}

function clearSubmission(state: EnrollmentState): EnrollmentState {
  if (!state.submitted && !state.applicationId && !state.submittedAt) {
    return state;
  }

  return {
    ...state,
    applicationId: null,
    submitted: false,
    submittedAt: null
  };
}

function isWalletAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

function sameWalletSession(left: WalletAuthSession | null, right: WalletAuthSession | null) {
  return left?.address === right?.address && left?.chainId === right?.chainId && left?.method === right?.method;
}

function sameHumanReservation(left: PolicyHumanReservationView | null, right: PolicyHumanReservationView | null) {
  return left?.nullifier === right?.nullifier && left?.walletAddress === right?.walletAddress;
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortProofId(nullifier: string) {
  return `${nullifier.slice(0, 8)}...${nullifier.slice(-6)}`;
}
