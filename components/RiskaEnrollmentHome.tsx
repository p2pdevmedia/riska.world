"use client";

import {
  Activity,
  BadgeCheck,
  BellRing,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  Fingerprint,
  HandCoins,
  HeartHandshake,
  Percent,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
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
import { RISKA_POLICY_TERMS_HASH, WORLDCHAIN_SEPOLIA_CHAIN_ID, type RiskaTestnetDeployment } from "@/lib/riska-testnet";
import {
  formatTestnetContractError,
  formatUsdcAmount,
  getRiskaTestnetDeployment,
  getTestnetPolicy,
  issueTestnetPolicy,
  MINIMUM_POLICY_PRINCIPAL,
  runTestnetPolicyAction,
  type RiskaTestnetPolicyView,
  type TestnetIssuanceResult,
  type TestnetIssuanceStatus,
  type TestnetPolicyAction,
  type TestnetPolicyActionStatus
} from "@/lib/web3/riska-testnet";

type StepId = "identity" | "beneficiaries" | "quote" | "confirm";

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

type EnrollmentState = {
  applicationId: string | null;
  beneficiaries: Beneficiary[];
  humanReservation: PolicyHumanReservationView | null;
  issuedPolicyId: string | null;
  issuedTransactionHash: string | null;
  paymentReady: boolean;
  quoteReviewed: boolean;
  riskAccepted: boolean;
  submitted: boolean;
  submittedAt: string | null;
  termsAccepted: boolean;
  walletSession: WalletAuthSession | null;
};

type CompletionMap = Record<StepId, boolean>;

type TestnetDeploymentState =
  | { status: "loading" }
  | { deployment: RiskaTestnetDeployment; status: "configured" }
  | { error: string; status: "missing" };

type TestnetIssueState =
  | { status: "idle" }
  | { status: "working"; step: TestnetIssuanceStatus }
  | { result: TestnetIssuanceResult; status: "issued" }
  | { message: string; status: "error" };

const storageKey = "riska.enrollment.v2";
const beneficiaryColors = ["bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-cyan-500", "bg-violet-500"];

const steps: WizardStep[] = [
  { accent: "bg-emerald-500", icon: Fingerprint, id: "identity" },
  { accent: "bg-rose-500", icon: Users, id: "beneficiaries" },
  { accent: "bg-amber-500", icon: CircleDollarSign, id: "quote" },
  { accent: "bg-violet-500", icon: FileCheck2, id: "confirm" }
];

const copy = {
  en: {
    welcome: {
      badge: "Riska 30",
      title: "Flexible life protection for verified humans.",
      body:
        "Riska is a World Chain USDC policy account. Any verified human can fund the 10,800 USDC minimum over time, add extra principal, and activate programmed income when ready.",
      primary: "Start application",
      secondary: "Read policy rules",
      cards: [
        {
          icon: HeartHandshake,
          title: "Family protection",
          body: "Beneficiaries can claim only after a death report plus 12 months without holder interaction."
        },
        {
          icon: CircleDollarSign,
          title: "Flexible income",
          body: "Once the minimum is funded, the holder can start 120 monthly payments or claim the remaining balance."
        },
        {
          icon: Fingerprint,
          title: "One human, one policy",
          body: "World ID and wallet authentication reserve one policy slot for each verified human."
        }
      ],
      facts: [
        ["Minimum", "10,800 USDC"],
        ["Base unit", "30 USDC"],
        ["Payout", "120 months"],
        ["Network", "World Chain"]
      ]
    },
    hero: {
      badge: "World Chain policy application",
      title: "Enroll in Riska 30.",
      body:
        "Complete the real policy application flow: wallet, World ID, beneficiaries, flexible policy quote, and signed consent before issuance.",
      metrics: [
        ["Minimum policy", "10,800 USDC"],
        ["Payout schedule", "120 months"],
        ["Death notice", "12 months"]
      ]
    },
    rules: {
      eyebrow: "Riska 30 rules",
      title: "The promise is visible before the user signs.",
      body:
        "Any verified human can open a policy. Deposits fill the 10,800 USDC minimum first, extra deposits increase future monthly payout, and beneficiaries can claim only after 12 months without holder interaction.",
      items: [
        "World ID verification is completed before policy issuance",
        "Beneficiaries must total 100%",
        "Extra deposits are not fee-bearing",
        "Holder heartbeat cancels pending death reports"
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
      step: (index: number) => `Step ${index + 1} of ${steps.length}`,
      submit: "Open test policy",
      submitted: "Policy issued",
      steps: {
        beneficiaries: { meta: "Beneficiaries", title: "Beneficiary allocation" },
        confirm: { meta: "World Chain", title: "Review and consent" },
        identity: { meta: "Wallet + World ID", title: "Verified human" },
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
        payout: "Estimated monthly payout",
        premium: "Base unit",
        principal: "Minimum policy",
        reviewed: "I reviewed the policy formula.",
        rules: [
          ["Minimum first", "10,800 USDC"],
          ["Extra deposits", "100% principal"],
          ["Holder payout", "120 months"],
          ["Death fee", "20% of minimum only"]
        ]
      },
      confirm: {
        application: "Application",
        checklist: ["World ID", "Beneficiaries", "Quote"],
        firstPayment: "First payment",
        network: "Network",
        proof: "Human proof",
        submitted:
          "Test policy opened on World Chain Sepolia.",
        testnetConfigured: "Testnet contracts ready",
        testnetMissing: "Testnet contracts pending deployment",
        testnetPolicy: "Policy ID",
        testnetTitle: "World Chain Sepolia issuance",
        testnetTx: "Open policy tx",
        terms: "I accept the Riska 30 policy terms.",
        termsHash: "Terms hash",
        risk: "I understand the payout rules and smart-contract audit requirement before user funds are activated.",
        payment: "I authorize preparing the first 30 USDC payment for the issuance step.",
        wallet: "Wallet",
        policy: {
          actionComplete: "Transaction confirmed",
          actionError: "Action failed",
          activate: "Activate payout",
          claimAll: "Claim all",
          claimDeath: "Claim death",
          claimMonthly: "Claim monthly",
          claimableAt: "Claimable after",
          deathNotice: "Death report",
          deposit: "Deposit",
          depositAmount: "Deposit amount",
          extraPrincipal: "Extra principal",
          heartbeat: "Heartbeat",
          minimumFunded: "Minimum funded",
          monthlyEstimate: "Monthly estimate",
          noDeathNotice: "No report",
          payoutProgress: "Payouts",
          refresh: "Refresh",
          reportDeath: "Report death",
          status: "Status",
          title: "Flexible policy state"
        }
      }
    }
  },
  es: {
    welcome: {
      badge: "Riska 30",
      title: "Proteccion flexible para humanos verificados.",
      body:
        "Riska es una cuenta de poliza USDC en World Chain. Cualquier humano verificado puede fondear el minimo de 10,800 USDC con el tiempo, sumar principal extra y activar renta programada cuando quiera.",
      primary: "Empezar solicitud",
      secondary: "Ver reglas",
      cards: [
        {
          icon: HeartHandshake,
          title: "Proteccion familiar",
          body: "Los beneficiarios pueden cobrar solo despues de reportar fallecimiento y esperar 12 meses sin interaccion del titular."
        },
        {
          icon: CircleDollarSign,
          title: "Renta flexible",
          body: "Cuando el minimo esta fondeado, el titular puede activar 120 pagos mensuales o retirar el saldo restante."
        },
        {
          icon: Fingerprint,
          title: "Un humano, una poliza",
          body: "World ID y la wallet reservan un cupo de poliza para cada humano verificado."
        }
      ],
      facts: [
        ["Minimo", "10,800 USDC"],
        ["Unidad base", "30 USDC"],
        ["Pagos", "120 meses"],
        ["Red", "World Chain"]
      ]
    },
    hero: {
      badge: "Solicitud de poliza en World Chain",
      title: "Inscribite en Riska 30.",
      body:
        "Completa el flujo real de solicitud: wallet, World ID, beneficiarios, cotizacion flexible y consentimiento firmado antes de emitir.",
      metrics: [
        ["Poliza minima", "10,800 USDC"],
        ["Calendario", "120 meses"],
        ["Aviso muerte", "12 meses"]
      ]
    },
    rules: {
      eyebrow: "Reglas Riska 30",
      title: "La promesa queda visible antes de firmar.",
      body:
        "Cualquier humano verificado puede abrir una poliza. Los depositos llenan primero el minimo de 10,800 USDC, el extra aumenta el pago mensual futuro y los beneficiarios solo cobran despues de 12 meses sin interaccion del titular.",
      items: [
        "La verificacion World ID se completa antes de emitir",
        "Los beneficiarios deben sumar 100%",
        "Los depositos extra no pagan fee",
        "El heartbeat del titular cancela reportes pendientes"
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
      step: (index: number) => `Paso ${index + 1} de ${steps.length}`,
      submit: "Abrir poliza testnet",
      submitted: "Poliza emitida",
      steps: {
        beneficiaries: { meta: "Beneficiarios", title: "Asignacion de beneficiarios" },
        confirm: { meta: "World Chain", title: "Revision y consentimiento" },
        identity: { meta: "Wallet + World ID", title: "Humano verificado" },
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
        payout: "Pago mensual estimado",
        premium: "Unidad base",
        principal: "Poliza minima",
        reviewed: "Revise la formula de la poliza.",
        rules: [
          ["Primero minimo", "10,800 USDC"],
          ["Depositos extra", "100% principal"],
          ["Pago titular", "120 meses"],
          ["Fee muerte", "20% solo minimo"]
        ]
      },
      confirm: {
        application: "Solicitud",
        checklist: ["World ID", "Beneficiarios", "Cotizacion"],
        firstPayment: "Primer pago",
        network: "Red",
        proof: "Prueba humana",
        submitted:
          "Poliza de prueba abierta en World Chain Sepolia.",
        testnetConfigured: "Contratos testnet listos",
        testnetMissing: "Contratos testnet pendientes de deploy",
        testnetPolicy: "Policy ID",
        testnetTitle: "Emision en World Chain Sepolia",
        testnetTx: "Tx de apertura",
        terms: "Acepto los terminos de la poliza Riska 30.",
        termsHash: "Hash de terminos",
        risk: "Entiendo las reglas de pago y el requisito de auditoria de contratos antes de activar fondos de usuarios.",
        payment: "Autorizo preparar el primer pago de 30 USDC para el paso de emision.",
        wallet: "Wallet",
        policy: {
          actionComplete: "Transaccion confirmada",
          actionError: "La accion fallo",
          activate: "Activar pagos",
          claimAll: "Cobrar todo",
          claimDeath: "Cobrar muerte",
          claimMonthly: "Cobrar mes",
          claimableAt: "Cobrable desde",
          deathNotice: "Reporte muerte",
          deposit: "Depositar",
          depositAmount: "Monto a depositar",
          extraPrincipal: "Principal extra",
          heartbeat: "Heartbeat",
          minimumFunded: "Minimo fondeado",
          monthlyEstimate: "Estimado mensual",
          noDeathNotice: "Sin reporte",
          payoutProgress: "Pagos",
          refresh: "Actualizar",
          reportDeath: "Reportar muerte",
          status: "Estado",
          title: "Estado flexible"
        }
      }
    }
  }
};

const initialState: EnrollmentState = {
  applicationId: null,
  beneficiaries: [createEmptyBeneficiary(1, 100)],
  humanReservation: null,
  paymentReady: false,
  issuedPolicyId: null,
  issuedTransactionHash: null,
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
  const [testnetDeployment, setTestnetDeployment] = useState<TestnetDeploymentState>({ status: "loading" });
  const [testnetIssue, setTestnetIssue] = useState<TestnetIssueState>({ status: "idle" });
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
    let mounted = true;

    void getRiskaTestnetDeployment()
      .then((deployment) => {
        if (mounted) {
          setTestnetDeployment({ deployment, status: "configured" });
        }
      })
      .catch((error) => {
        if (mounted) {
          setTestnetDeployment({
            error: formatTestnetContractError(error),
            status: "missing"
          });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    if (!state.submitted && testnetIssue.status === "issued") {
      setTestnetIssue({ status: "idle" });
    }
  }, [state.submitted, testnetIssue.status]);

  const activeStepIndex = steps.findIndex((step) => step.id === activeStepId);
  const activeStep = steps[activeStepIndex] ?? steps[0];
  const beneficiaryTotal = state.beneficiaries.reduce((total, beneficiary) => total + beneficiary.percent, 0);
  const completion = getCompletion(state, beneficiaryTotal);
  const canSubmit = completion.identity && completion.beneficiaries && completion.quote;
  const readyToSubmit = canSubmit && state.termsAccepted && state.riskAccepted && state.paymentReady;
  const testnetReady = testnetDeployment.status === "configured";
  const testnetWorking = testnetIssue.status === "working";

  const handleWalletSessionChange = useCallback((walletSession: WalletAuthSession | null) => {
    setState((current) => {
      if (sameWalletSession(current.walletSession, walletSession)) {
        return current;
      }

      if (current.walletSession?.address === walletSession?.address && current.walletSession?.method === walletSession?.method) {
        return {
          ...current,
          walletSession
        };
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

  async function continueEnrollment() {
    if (activeStep.id === "confirm") {
      if (readyToSubmit && state.walletSession && testnetReady) {
        setTestnetIssue({ status: "idle" });
        try {
          const result = await issueTestnetPolicy({
            beneficiaries: state.beneficiaries,
            holder: state.walletSession.address,
            onStatus: (step) => setTestnetIssue({ status: "working", step })
          });

          setTestnetIssue({ result, status: "issued" });
          setState((current) => ({
            ...current,
            applicationId: current.applicationId ?? `RISKA-WCSP-${result.policyId}`,
            issuedPolicyId: result.policyId,
            issuedTransactionHash: result.txHashes.openPolicy,
            submitted: true,
            submittedAt: current.submittedAt ?? new Date().toISOString()
          }));
        } catch (error) {
          setTestnetIssue({
            message: formatTestnetContractError(error),
            status: "error"
          });
        }
      } else if (readyToSubmit) {
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
      ? !readyToSubmit || !testnetReady || testnetWorking || state.submitted
      : !completion[activeStep.id];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f7f2] text-[#18211d]">
      <Navbar />
      <main>
        <WelcomeScreen content={content} />

        <section id="enroll" className="mx-auto max-w-7xl px-5 py-8 md:px-8 lg:py-12">
          <div className="space-y-6">
            <StepRail
              activeStepId={activeStepId}
              completion={completion}
              content={content}
              onStepSelect={setActiveStepId}
            />

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
                onPrimary={continueEnrollment}
                onRemoveBeneficiary={removeBeneficiary}
                onSetState={setState}
                onUpdateBeneficiary={updateBeneficiary}
                onWalletSessionChange={handleWalletSessionChange}
                primaryDisabled={primaryDisabled}
                readyToSubmit={readyToSubmit}
                state={state}
                step={activeStep}
                testnetDeployment={testnetDeployment}
                testnetIssue={testnetIssue}
              />
            </div>
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
  onPrimary: () => void;
  onRemoveBeneficiary: (id: string) => void;
  onSetState: Dispatch<SetStateAction<EnrollmentState>>;
  onUpdateBeneficiary: (id: string, field: keyof Pick<Beneficiary, "name" | "percent" | "wallet">, value: string) => void;
  onWalletSessionChange: (session: WalletAuthSession | null) => void;
  primaryDisabled: boolean;
  readyToSubmit: boolean;
  state: EnrollmentState;
  step: WizardStep;
  testnetDeployment: TestnetDeploymentState;
  testnetIssue: TestnetIssueState;
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
    <div className="border border-[#d9ded5] bg-white p-2">
      <div className="overflow-x-auto">
        <div className="grid min-w-[680px] grid-cols-4 gap-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const selected = step.id === activeStepId;
            const complete = completion[step.id];
            const stepCopy = content.wizard.steps[step.id];

            return (
              <button
                aria-current={selected ? "step" : undefined}
                className={`flex min-h-[76px] w-full items-center gap-3 border px-3 py-3 text-left transition ${
                  selected ? "border-[#17231e] bg-[#f8faf6]" : "border-transparent hover:border-[#d9ded5] hover:bg-[#fbfcf8]"
                }`}
                key={step.id}
                onClick={() => onStepSelect(step.id)}
                type="button"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center ${step.accent}`}>
                  {complete ? <Check className="h-4 w-4 text-white" /> : <Icon className="h-4 w-4 text-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-[#66746e]">{content.wizard.step(index)}</span>
                  <span className="block truncate text-sm font-semibold">{stepCopy.meta}</span>
                </span>
                <span className={`shrink-0 text-xs ${complete ? "text-emerald-700" : "text-[#7a867e]"}`}>
                  {complete ? content.wizard.complete : content.wizard.pending}
                </span>
              </button>
            );
          })}
        </div>
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
        <div className={`h-full ${step.accent}`} style={{ width: `${((activeStepIndex + 1) / steps.length) * 100}%` }} />
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

function ConfirmScreen({
  canSubmit,
  completion,
  content,
  onSetState,
  state,
  testnetDeployment,
  testnetIssue
}: EnrollmentWizardProps) {
  const text = content.wizard.confirm;
  const checklist = [
    completion.identity,
    completion.beneficiaries,
    completion.quote
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <SummaryFact label={text.wallet} value={state.walletSession ? shortAddress(state.walletSession.address) : "-"} />
        <SummaryFact label={text.proof} value={state.humanReservation ? shortProofId(state.humanReservation.nullifier) : "-"} />
        <SummaryFact label={text.firstPayment} value="30 USDC" />
        <SummaryFact label={text.network} value={`World Chain Sepolia (${WORLDCHAIN_SEPOLIA_CHAIN_ID})`} />
      </div>

      <div className="border border-[#ddd8ed] bg-[#f5f2ff] p-4">
        <p className="text-sm text-[#655a80]">{text.termsHash}</p>
        <p className="mt-2 break-all font-mono text-xs text-[#32284f]">{RISKA_POLICY_TERMS_HASH}</p>
      </div>

      <TestnetIssuePanel
        content={content}
        state={state}
        testnetDeployment={testnetDeployment}
        testnetIssue={testnetIssue}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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

function TestnetIssuePanel({
  content,
  state,
  testnetDeployment,
  testnetIssue
}: {
  content: (typeof copy)[Language];
  state: EnrollmentState;
  testnetDeployment: TestnetDeploymentState;
  testnetIssue: TestnetIssueState;
}) {
  const text = content.wizard.confirm;
  const deployment = testnetDeployment.status === "configured" ? testnetDeployment.deployment : null;
  const openPolicyTx =
    state.issuedTransactionHash ??
    (testnetIssue.status === "issued" ? testnetIssue.result.txHashes.openPolicy : null);
  const policyId =
    state.issuedPolicyId ??
    (testnetIssue.status === "issued" ? testnetIssue.result.policyId : null);
  const status = getTestnetPanelStatus(content, testnetDeployment, testnetIssue);
  const explorerUrl = deployment && openPolicyTx ? `${deployment.explorerBaseUrl.replace(/\/address\/$/, "/tx/")}${openPolicyTx}` : null;

  return (
    <div className="border border-[#cfe0d2] bg-[#f8faf6] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#26342d]">{text.testnetTitle}</p>
          <p className={`mt-1 text-sm ${status.tone}`}>{status.message}</p>
        </div>
        {deployment?.contracts.policyManager?.address && (
          <p className="break-all font-mono text-xs text-[#66746e]">
            {shortAddress(deployment.contracts.policyManager.address)}
          </p>
        )}
      </div>

      {(policyId || openPolicyTx) && (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {policyId && <SummaryFact label={text.testnetPolicy} value={policyId} />}
          {openPolicyTx && (
            <div className="border border-[#dce4d8] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#66746e]">{text.testnetTx}</p>
              {explorerUrl ? (
                <a
                  className="mt-2 block break-all font-mono text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                  href={explorerUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {openPolicyTx}
                </a>
              ) : (
                <p className="mt-2 break-all font-mono text-xs font-semibold">{openPolicyTx}</p>
              )}
            </div>
          )}
        </div>
      )}

      {policyId && state.walletSession && (
        <PolicyControlPanel
          content={content}
          policyId={policyId}
          walletAddress={state.walletSession.address}
        />
      )}
    </div>
  );
}

function PolicyControlPanel({
  content,
  policyId,
  walletAddress
}: {
  content: (typeof copy)[Language];
  policyId: string;
  walletAddress: string;
}) {
  const text = content.wizard.confirm.policy;
  const [policy, setPolicy] = useState<RiskaTestnetPolicyView | null>(null);
  const [depositAmount, setDepositAmount] = useState("10770");
  const [workingAction, setWorkingAction] = useState<TestnetPolicyAction | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState("text-[#66746e]");

  const refreshPolicy = useCallback(async () => {
    const nextPolicy = await getTestnetPolicy({ policyId, viewer: walletAddress });
    setPolicy(nextPolicy);
  }, [policyId, walletAddress]);

  useEffect(() => {
    let mounted = true;

    void getTestnetPolicy({ policyId, viewer: walletAddress })
      .then((nextPolicy) => {
        if (mounted) {
          setPolicy(nextPolicy);
        }
      })
      .catch((error) => {
        if (mounted) {
          setStatusMessage(formatTestnetContractError(error));
          setStatusTone("text-red-700");
        }
      });

    return () => {
      mounted = false;
    };
  }, [policyId, walletAddress]);

  async function runAction(action: TestnetPolicyAction) {
    setWorkingAction(action);
    setStatusTone("text-amber-700");
    setStatusMessage(getPolicyActionLabel(action, text));

    try {
      await runTestnetPolicyAction({
        action,
        amount: action === "deposit" ? depositAmount : undefined,
        holder: walletAddress,
        onStatus: (status) => {
          setStatusMessage(getPolicyActionStatusLabel(status));
        },
        policyId
      });
      await refreshPolicy();
      setStatusMessage(text.actionComplete);
      setStatusTone("text-emerald-700");
    } catch (error) {
      setStatusMessage(`${text.actionError}: ${formatTestnetContractError(error)}`);
      setStatusTone("text-red-700");
    } finally {
      setWorkingAction(null);
    }
  }

  const isWorking = Boolean(workingAction);
  const status = policy?.status ?? 0;
  const minimumPercent = policy
    ? Number((policy.remainingMinimumPrincipal * 10_000n) / MINIMUM_POLICY_PRINCIPAL) / 100
    : 0;
  const canUseHolderAction = policy ? status === 1 || status === 2 : false;
  const minimumFunded = policy ? policy.remainingMinimumPrincipal >= MINIMUM_POLICY_PRINCIPAL : false;
  const canDeposit = policy ? status === 1 : false;
  const canActivate = policy ? status === 1 && minimumFunded : false;
  const canClaimMonthly = policy ? status === 2 : false;
  const canClaimAll = policy ? status === 2 || (status === 1 && minimumFunded) : false;
  const canReportDeath = policy
    ? policy.isViewerBeneficiary && (status === 1 || status === 2) && !policy.deathNotice.active
    : false;
  const canClaimDeath = policy
    ? policy.isViewerBeneficiary && policy.deathNotice.active && (status === 1 || status === 2)
    : false;

  return (
    <div className="mt-4 border border-[#dce4d8] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#26342d]">{text.title}</p>
          <p className="mt-1 text-xs text-[#66746e]">
            {text.status}: {policy ? getPolicyStatusLabel(policy.status) : content.wizard.pending}
          </p>
        </div>
        <button
          className="flex h-10 items-center justify-center gap-2 border border-[#cbd7cf] px-3 text-xs font-semibold text-[#26342d] transition hover:border-[#17231e] disabled:opacity-50"
          disabled={isWorking}
          onClick={() => void refreshPolicy()}
          type="button"
        >
          <RefreshCw className="h-4 w-4" />
          {text.refresh}
        </button>
      </div>

      {policy && (
        <>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <SummaryFact
              label={text.minimumFunded}
              value={`${formatUsdcAmount(policy.remainingMinimumPrincipal)} USDC (${minimumPercent.toFixed(2)}%)`}
            />
            <SummaryFact label={text.extraPrincipal} value={`${formatUsdcAmount(policy.remainingExtraPrincipal)} USDC`} />
            <SummaryFact label={text.monthlyEstimate} value={`${formatUsdcAmount(policy.monthlyPayoutEstimate)} USDC`} />
            <SummaryFact label={text.payoutProgress} value={`${policy.payoutsMade} / 120`} />
          </div>

          <div className="mt-3 border border-[#e3e8df] bg-[#f8faf6] p-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#66746e]">{text.deathNotice}</p>
              <p className="text-sm font-semibold text-[#26342d]">
                {policy.deathNotice.active ? shortAddress(policy.deathNotice.reporter) : text.noDeathNotice}
              </p>
            </div>
            {policy.deathNotice.active && (
              <p className="mt-2 text-sm text-[#66746e]">
                {text.claimableAt}: {formatUnixDate(policy.deathNotice.claimableAt)}
              </p>
            )}
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
            <input
              aria-label={text.depositAmount}
              className="min-h-11 border border-[#e3e8df] bg-[#fbfcf8] px-3 text-sm outline-none focus:border-[#17231e]"
              min="0"
              onChange={(event) => setDepositAmount(event.target.value)}
              step="0.000001"
              type="number"
              value={depositAmount}
            />
            <PolicyActionButton
              action="deposit"
              disabled={!canDeposit || isWorking}
              icon={Send}
              label={text.deposit}
              onClick={runAction}
              workingAction={workingAction}
            />
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <PolicyActionButton
              action="heartbeat"
              disabled={!canUseHolderAction || isWorking}
              icon={Activity}
              label={text.heartbeat}
              onClick={runAction}
              workingAction={workingAction}
            />
            <PolicyActionButton
              action="activatePayout"
              disabled={!canActivate || isWorking}
              icon={CircleDollarSign}
              label={text.activate}
              onClick={runAction}
              workingAction={workingAction}
            />
            <PolicyActionButton
              action="claimMonthly"
              disabled={!canClaimMonthly || isWorking}
              icon={HandCoins}
              label={text.claimMonthly}
              onClick={runAction}
              workingAction={workingAction}
            />
            <PolicyActionButton
              action="claimAll"
              disabled={!canClaimAll || isWorking}
              icon={WalletCards}
              label={text.claimAll}
              onClick={runAction}
              workingAction={workingAction}
            />
            <PolicyActionButton
              action="reportDeath"
              disabled={!canReportDeath || isWorking}
              icon={BellRing}
              label={text.reportDeath}
              onClick={runAction}
              workingAction={workingAction}
            />
            <PolicyActionButton
              action="claimDeath"
              disabled={!canClaimDeath || isWorking}
              icon={HeartHandshake}
              label={text.claimDeath}
              onClick={runAction}
              workingAction={workingAction}
            />
          </div>
        </>
      )}

      {statusMessage && <p className={`mt-3 text-sm ${statusTone}`}>{statusMessage}</p>}
    </div>
  );
}

function PolicyActionButton({
  action,
  disabled,
  icon: Icon,
  label,
  onClick,
  workingAction
}: {
  action: TestnetPolicyAction;
  disabled: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: (action: TestnetPolicyAction) => void;
  workingAction: TestnetPolicyAction | null;
}) {
  const working = workingAction === action;

  return (
    <button
      className="flex min-h-11 items-center justify-center gap-2 border border-[#cbd7cf] bg-[#fbfcf8] px-3 text-sm font-semibold text-[#26342d] transition hover:border-[#17231e] hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
      disabled={disabled}
      onClick={() => onClick(action)}
      type="button"
    >
      <Icon className={`h-4 w-4 ${working ? "animate-pulse" : ""}`} />
      {label}
    </button>
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

function getPrimaryLabel({ content, state, step, testnetIssue }: EnrollmentWizardProps) {
  if (state.submitted) {
    return content.wizard.submitted;
  }

  if (step.id === "confirm" && testnetIssue.status === "working") {
    return getTestnetStepLabel(testnetIssue.step);
  }

  if (step.id === "confirm") {
    return content.wizard.submit;
  }

  return content.wizard.continue;
}

function getTestnetStepLabel(step: TestnetIssuanceStatus) {
  const labels: Record<TestnetIssuanceStatus, string> = {
    approving_usdc: "Approving USDC",
    checking_usdc: "Checking USDC",
    issued: "Policy issued",
    loading_contracts: "Loading contracts",
    opening_policy: "Opening policy",
    switching_network: "Switching network"
  };

  return labels[step];
}

function getPolicyStatusLabel(status: number) {
  const labels: Record<number, string> = {
    0: "None",
    1: "Active",
    2: "Payout active",
    3: "Death settled",
    4: "Closed"
  };

  return labels[status] ?? "Unknown";
}

function getPolicyActionLabel(
  action: TestnetPolicyAction,
  text: (typeof copy)[Language]["wizard"]["confirm"]["policy"]
) {
  const labels: Record<TestnetPolicyAction, string> = {
    activatePayout: text.activate,
    claimAll: text.claimAll,
    claimDeath: text.claimDeath,
    claimMonthly: text.claimMonthly,
    deposit: text.deposit,
    heartbeat: text.heartbeat,
    reportDeath: text.reportDeath
  };

  return labels[action];
}

function getPolicyActionStatusLabel(status: TestnetPolicyActionStatus) {
  const labels: Record<TestnetPolicyActionStatus, string> = {
    approving_usdc: "Approving USDC",
    checking_usdc: "Checking USDC",
    confirming_transaction: "Confirming transaction",
    issued: "Policy issued",
    loading_contracts: "Loading contracts",
    opening_policy: "Opening policy",
    refreshing_policy: "Refreshing policy",
    sending_transaction: "Sending transaction",
    switching_network: "Switching network"
  };

  return labels[status];
}

function formatUnixDate(timestamp: number) {
  if (!timestamp) {
    return "-";
  }

  return new Date(timestamp * 1000).toLocaleString();
}

function getTestnetPanelStatus(
  content: (typeof copy)[Language],
  deployment: TestnetDeploymentState,
  issue: TestnetIssueState
) {
  const text = content.wizard.confirm;

  if (issue.status === "working") {
    return {
      message: getTestnetStepLabel(issue.step),
      tone: "text-amber-700"
    };
  }

  if (issue.status === "issued") {
    return {
      message: text.submitted,
      tone: "text-emerald-700"
    };
  }

  if (issue.status === "error") {
    return {
      message: issue.message,
      tone: "text-red-700"
    };
  }

  if (deployment.status === "configured") {
    return {
      message: text.testnetConfigured,
      tone: "text-emerald-700"
    };
  }

  if (deployment.status === "loading") {
    return {
      message: content.wizard.pending,
      tone: "text-[#66746e]"
    };
  }

  return {
    message: `${text.testnetMissing}: ${deployment.error}`,
    tone: "text-red-700"
  };
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
    walletSession: stored.walletSession ?? null
  };
}

function clearSubmission(state: EnrollmentState): EnrollmentState {
  if (
    !state.submitted &&
    !state.applicationId &&
    !state.submittedAt &&
    !state.issuedPolicyId &&
    !state.issuedTransactionHash
  ) {
    return state;
  }

  return {
    ...state,
    applicationId: null,
    issuedPolicyId: null,
    issuedTransactionHash: null,
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
