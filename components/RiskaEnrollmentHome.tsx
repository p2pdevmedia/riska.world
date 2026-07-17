"use client";

import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
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
import { WorldIdGate, type PolicyHumanReservationView } from "@/components/WorldIdGate";
import type { Language } from "@/lib/i18n";
import { WORLDCHAIN_SEPOLIA_CHAIN_ID, type RiskaTestnetDeployment } from "@/lib/riska-testnet";
import {
  formatTestnetContractError,
  formatTokenAmount,
  formatUsdcAmount,
  getTestnetPolicyCashflow,
  getRiskaTestnetDeployment,
  getTestnetPolicy,
  getTestnetPolicyIdForHolder,
  issueTestnetPolicy,
  MINIMUM_POLICY_PRINCIPAL,
  runTestnetPolicyAction,
  type RiskaTestnetPolicyView,
  type RiskaTestnetCashflow,
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

type ExistingPolicyLookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { policyId: string; status: "found" }
  | { status: "none" }
  | { message: string; status: "error" };

type AssetOperation = "dashboard" | "deposit" | "withdraw" | "yield";

const storageKey = "riska.enrollment.v2";
const pendingWalletStorageKey = "riska.pending-wallet-session";
const beneficiaryColors = ["bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-cyan-500", "bg-violet-500"];

const steps: WizardStep[] = [
  { accent: "bg-[#5868ea]", icon: Fingerprint, id: "identity" },
  { accent: "bg-[#5868ea]", icon: Users, id: "beneficiaries" },
  { accent: "bg-[#5868ea]", icon: FileCheck2, id: "confirm" }
];

const copy = {
  en: {
    welcome: {
      badge: "Riska 30",
      title: "Flexible life protection for verified humans.",
      body:
        "Riska is a flexible USDC policy on World Chain. You fund a 10,800 USDC minimum at your own pace, add or withdraw extra principal whenever you want, and once the minimum is covered you can also hold other ERC20 tokens. If a claim is settled, those tokens pass in full to your beneficiaries.",
      primary: "Start application",
      secondary: "Read policy rules",
      cards: [
        {
          icon: HeartHandshake,
          title: "Family protection",
          body: "Beneficiaries are paid only after a death report followed by 12 straight months with no activity from you. They receive 100% of any non-USDC tokens you stored."
        },
        {
          icon: CircleDollarSign,
          title: "Flexible income",
          body: "Once the minimum is funded, you choose: start 120 monthly payments, withdraw extra principal in parts, or take out the full balance."
        },
        {
          icon: Fingerprint,
          title: "One human, one policy",
          body: "World ID and Wallet Auth work together so each verified person can hold exactly one policy."
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
      eyebrow: "Riska 30 policy terms",
      title: "Every term is disclosed before you sign.",
      body:
        "Riska is a flexible USDC life-protection policy on World Chain. These terms explain, in plain language, who can enroll, how the policy is funded, how you get paid, and how your beneficiaries are settled. Every amount, fee, and waiting period below is enforced by the policy contract — not by a person.",
      stepsTitle: "How the process works",
      steps: [
        {
          title: "Verify your identity",
          body: "Each verified person can hold one policy. Before it is issued, you complete World ID and connect your wallet with Wallet Auth. Together they reserve a single policy for one real human. Riska never stores your biometric data."
        },
        {
          title: "Fund the minimum",
          body: "The minimum policy is 10,800 USDC, funded in units of 30 USDC. Pay it little by little or in one deposit — your choice. Every deposit goes first toward this minimum principal, the capital required before payments can start."
        },
        {
          title: "Add extra principal or other tokens",
          body: "Anything you deposit above the minimum becomes extra principal: it raises your future monthly payment and you can withdraw it in parts at any time, with no fee. Once the minimum is covered, you can also hold other ERC20 tokens for free — they stay separate and never change your payout."
        },
        {
          title: "Get paid as the holder",
          body: "With the minimum funded, you can start 120 monthly payments, withdraw extra principal in parts, or take out the full balance. Only a full withdrawal (claim-all) keeps a 20% fee, and only on the remaining minimum principal — extra principal always comes back in full. Any interaction, or heartbeat, records that you are alive."
        },
        {
          title: "Protect your beneficiaries",
          body: "Your beneficiary shares must add up to 100%. A beneficiary can file a death report, but settlement unlocks only after 12 straight months with no activity from you. They then receive your extra principal, 100% of any stored tokens, and 80% of the remaining minimum principal. A single interaction from you cancels the report."
        }
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
      submit: "Open policy",
      submitted: "Policy issued",
      steps: {
        beneficiaries: { meta: "Beneficiaries", title: "Beneficiary allocation" },
        confirm: { meta: "Create policy / vault", title: "Create policy / vault" },
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
          ["Claim-all/death fee", "20% of minimum only"]
        ]
      },
      confirm: {
        application: "Application",
        checklist: ["World ID", "Beneficiaries", "Quote"],
        firstPayment: "First payment",
        network: "Network",
        proof: "Human proof",
        submitted:
          "Policy opened on World Chain.",
        testnetConfigured: "Network ready",
        testnetExisting: "Policy found for this wallet",
        testnetLookup: "Checking this wallet for an existing policy",
        testnetMissing: "Network unavailable",
        testnetPolicy: "Policy ID",
        testnetTitle: "World Chain deployment",
        testnetTx: "Transaction",
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
          claimAllFeeNote: "Claim all retains 20% of the remaining minimum principal. Extra USDC is paid 100%.",
          claimDeath: "Claim death",
          claimMonthly: "Claim monthly",
          claimableAt: "Claimable after",
          commonTokens: "Common test tokens",
          customToken: "Custom 0x",
          deathNotice: "Death report",
          lastActivity: "Last activity",
          logout: "Logout",
          deposit: "Deposit",
          depositAmount: "Deposit amount",
          depositToken: "Deposit token",
          extraPrincipal: "Extra principal",
          heartbeat: "Heartbeat",
          yield: "Yield",
          yieldAmount: "Yield amount",
          yieldCostBasis: "Cost basis",
          yieldDeposit: "Start yield",
          yieldEstimated: "Estimated assets",
          yieldStrategy: "Strategy",
          chooseYieldStrategy: "Choose Morpho strategy",
          yieldProtocolHint: "Morpho is the only configured yield protocol. It currently accepts USDC.",
          yieldUnavailable: "There is no yield protocol configured for this token yet.",
          staticUsdc: "Keep USDC static",
          staticUsdcNote: (amount: string) => `${amount} USDC remain in the Riska contract. They earn no yield and are not exposed to Morpho.`,
          yieldVault: "Yield opt-in",
          yieldVaultNote:
            "Yield is opt-in and can use minimum or extra principal. Realized positive yield pays 10% to RISKA and credits 90% to this policy as extra principal; realized losses reduce extra principal first and then minimum principal.",
          yieldWithdraw: "Exit yield",
          minimumFunded: "Minimum funded",
          monthlyEstimate: "Monthly estimate",
          noYieldPositions: "No yield positions",
          noAuxiliaryTokens: "No extra tokens",
          noDeathNotice: "No report",
          payoutProgress: "Payouts",
          refresh: "Refresh",
          reportDeath: "Report death",
          selectedToken: "Selected token",
          status: "Status",
          title: "Dashboard",
          netWorth: "Policy value",
          fundingProgress: "Funding progress",
          holdings: "Holdings",
          policyHistory: "Policy history",
          policyActive: "Policy active",
          activityCount: (count: number) => `${count} ${count === 1 ? "movement" : "movements"}`,
          noActivity: "No movements yet",
          assetsTab: "Assets",
          activityTab: "Activity",
          asset: "Asset",
          allocation: "Allocation",
          actions: "Actions",
          assets: "Your assets",
          balance: "Total balance",
          depositFunds: "Deposit",
          withdrawFunds: "Withdraw",
          send: "Send",
          receive: "Receive",
          backToDashboard: "Back to dashboard",
          cancel: "Cancel",
          chooseAsset: "Choose asset",
          depositTitle: "Deposit funds",
          withdrawTitle: "Withdraw funds",
          operationHint: "Choose a token and amount to continue.",
          usdcAvailable: "Available extra USDC",
          tokenAddress: "ERC20 token address",
          tokenAddressInvalid: "Enter a valid ERC20 token address.",
          tokenAmount: "Token amount",
          tokenVaultNote:
            "These tokens are separate from USDC payout math. The holder can withdraw them in parts with no fee, and if death settlement happens they pass 100% to beneficiaries.",
          tokenVaultClosed: "This policy is not active for token vault actions.",
          tokenVaultLocked: (amount: string) => `Unlock the token vault by funding the remaining ${amount} USDC minimum.`,
          tokenVault: "Extra token vault",
          withdrawExtra: "Withdraw extra",
          withdrawExtraAmount: "Extra withdrawal amount",
          withdrawToken: "Withdraw token"
        }
      }
    }
  },
  es: {
    welcome: {
      badge: "Riska 30",
      title: "Protección flexible para humanos verificados.",
      body:
        "Riska es una póliza en USDC, flexible, sobre World Chain. Fondeas un mínimo de 10,800 USDC a tu propio ritmo, agregas o retiras principal extra cuando quieras y, una vez cubierto el mínimo, también puedes guardar otros tokens ERC20. Si se liquida la póliza, esos tokens pasan completos a tus beneficiarios.",
      primary: "Empezar solicitud",
      secondary: "Ver reglas",
      cards: [
        {
          icon: HeartHandshake,
          title: "Protección familiar",
          body: "Tus beneficiarios cobran solo tras un reporte de fallecimiento y 12 meses seguidos sin actividad tuya. Reciben el 100% de los tokens no-USDC que hayas guardado."
        },
        {
          icon: CircleDollarSign,
          title: "Renta flexible",
          body: "Con el mínimo fondeado, tú decides: activar 120 pagos mensuales, retirar el principal extra en partes o retirar el saldo completo."
        },
        {
          icon: Fingerprint,
          title: "Un humano, una póliza",
          body: "World ID y Wallet Auth trabajan juntos para que cada persona verificada tenga exactamente una póliza."
        }
      ],
      facts: [
        ["Mínimo", "10,800 USDC"],
        ["Unidad base", "30 USDC"],
        ["Pagos", "120 meses"],
        ["Red", "World Chain"]
      ]
    },
    hero: {
      badge: "Solicitud de póliza en World Chain",
      title: "Inscribite en Riska 30.",
      body:
        "Completa el flujo real de solicitud: wallet, World ID, beneficiarios, cotización flexible y consentimiento firmado antes de emitir.",
      metrics: [
        ["Póliza mínima", "10,800 USDC"],
        ["Calendario", "120 meses"],
        ["Aviso fallecimiento", "12 meses"]
      ]
    },
    rules: {
      eyebrow: "Términos de la póliza Riska 30",
      title: "Cada término se informa antes de firmar.",
      body:
        "Riska es una póliza de protección de vida en USDC, flexible, sobre World Chain. Estos términos explican, en lenguaje claro, quién puede inscribirse, cómo se fondea la póliza, cómo cobras y cómo se liquida a tus beneficiarios. Cada monto, comisión y plazo de espera de abajo lo hace cumplir el contrato de la póliza, no una persona.",
      stepsTitle: "Cómo funciona el proceso",
      steps: [
        {
          title: "Verifica tu identidad",
          body: "Cada persona verificada puede tener una sola póliza. Antes de emitirla completas World ID y conectas tu wallet con Wallet Auth. En conjunto reservan una única póliza para un humano real. Riska nunca almacena tus datos biométricos."
        },
        {
          title: "Fondea el mínimo",
          body: "La póliza mínima es de 10,800 USDC y se fondea en unidades de 30 USDC. Puedes completarla de a poco o en un solo depósito, como prefieras. Cada aporte cubre primero este principal mínimo: es el capital necesario para que empiecen los pagos."
        },
        {
          title: "Agrega principal extra u otros tokens",
          body: "Todo lo que deposites por encima del mínimo se vuelve principal extra: aumenta tu pago mensual futuro y puedes retirarlo en partes cuando quieras, sin comisión. Una vez cubierto el mínimo, también puedes guardar otros tokens ERC20 sin costo; quedan separados y no cambian el cálculo de tus pagos."
        },
        {
          title: "Cobra como titular",
          body: "Con el mínimo fondeado, puedes activar 120 pagos mensuales, retirar el principal extra en partes o retirar el saldo completo. Solo el retiro total (claim-all) retiene una comisión del 20%, y únicamente sobre el principal mínimo restante; el principal extra siempre se devuelve completo. Cualquier interacción con la póliza registra tu prueba de vida (heartbeat)."
        },
        {
          title: "Protege a tus beneficiarios",
          body: "Los porcentajes de tus beneficiarios deben sumar 100%. Un beneficiario puede presentar un reporte de fallecimiento, pero la liquidación se habilita solo tras 12 meses seguidos sin ninguna actividad tuya. Reciben entonces tu principal extra, el 100% de los tokens que hayas guardado y el 80% del principal mínimo restante. Una sola interacción tuya cancela el reporte."
        }
      ]
    },
    wizard: {
      back: "Atrás",
      blocked: "Completa los campos requeridos para continuar.",
      complete: "Completo",
      continue: "Continuar",
      pending: "Pendiente",
      ready: "Listo",
      required: "Requerido",
      step: (index: number) => `Paso ${index + 1} de ${steps.length}`,
      submit: "Abrir póliza",
      submitted: "Póliza emitida",
      steps: {
        beneficiaries: { meta: "Beneficiarios", title: "Asignación de beneficiarios" },
        confirm: { meta: "Crear póliza / bóveda", title: "Crear póliza / bóveda" },
        identity: { meta: "Wallet + World ID", title: "Humano verificado" },
        quote: { meta: "30 USDC / mes", title: "Cotización de póliza" }
      },
      identity: {
        instruction:
          "Conecta tu wallet y completa World ID. El wizard habilita el siguiente paso solo cuando queda reservado un humano verificado para esta wallet.",
        wallet: "Wallet conectada",
        walletDetail: "Wallet Auth ata esta solicitud a una dirección de World Chain.",
        worldId: "Humano reservado",
        worldIdDetail: "World ID reserva un cupo de póliza para un humano verificado."
      },
      beneficiaries: {
        add: "Agregar beneficiario",
        invalid: "Los porcentajes deben sumar exactamente 100%.",
        name: "Nombre",
        namePlaceholder: "Nombre completo",
        remove: "Quitar beneficiario",
        share: "Porcentaje",
        total: (value: number) => `Asignación total: ${value}%`,
        wallet: "Wallet",
        walletInvalid: "Cada beneficiario necesita una wallet 0x válida.",
        walletPlaceholder: "0x..."
      },
      quote: {
        payout: "Pago mensual estimado",
        premium: "Unidad base",
        principal: "Póliza mínima",
        reviewed: "Revisé la fórmula de la póliza.",
        rules: [
          ["Primero mínimo", "10,800 USDC"],
          ["Depósitos extra", "100% principal"],
          ["Pago titular", "120 meses"],
          ["Comisión retiro/fallecimiento", "20% solo mínimo"]
        ]
      },
      confirm: {
        application: "Solicitud",
        checklist: ["World ID", "Beneficiarios", "Cotización"],
        firstPayment: "Primer pago",
        network: "Red",
        proof: "Prueba humana",
        submitted:
          "Póliza abierta en World Chain.",
        testnetConfigured: "Red lista",
        testnetExisting: "Póliza encontrada para esta wallet",
        testnetLookup: "Buscando póliza existente para esta wallet",
        testnetMissing: "Red no disponible",
        testnetPolicy: "Policy ID",
        testnetTitle: "Despliegue en World Chain",
        testnetTx: "Transacción",
        terms: "Acepto los términos de la póliza Riska 30.",
        termsHash: "Hash de términos",
        risk: "Entiendo las reglas de pago y el requisito de auditoría de contratos antes de activar fondos de usuarios.",
        payment: "Autorizo preparar el primer pago de 30 USDC para el paso de emisión.",
        wallet: "Wallet",
        policy: {
          actionComplete: "Transacción confirmada",
          actionError: "La acción falló",
          activate: "Activar pagos",
          claimAll: "Cobrar todo",
          claimAllFeeNote: "Cobrar todo retiene 20% del mínimo restante. El extra USDC se paga 100%.",
          claimDeath: "Cobrar fallecimiento",
          claimMonthly: "Cobrar mes",
          claimableAt: "Cobrable desde",
          commonTokens: "Tokens de prueba comunes",
          customToken: "0x custom",
          deathNotice: "Reporte de fallecimiento",
          lastActivity: "Última actividad",
          logout: "Cerrar sesión",
          deposit: "Depositar",
          depositAmount: "Monto a depositar",
          depositToken: "Depositar token",
          extraPrincipal: "Principal extra",
          heartbeat: "Heartbeat",
          yield: "Yield",
          yieldAmount: "Monto yield",
          yieldCostBasis: "Costo base",
          yieldDeposit: "Activar yield",
          yieldEstimated: "Activos estimados",
          yieldStrategy: "Estrategia",
          chooseYieldStrategy: "Elige una estrategia de Morpho",
          yieldProtocolHint: "Morpho es el único protocolo de yield configurado. Actualmente acepta USDC.",
          yieldUnavailable: "Todavía no hay un protocolo de yield configurado para este token.",
          staticUsdc: "Mantener USDC estático",
          staticUsdcNote: (amount: string) => `${amount} USDC quedan en el contrato de Riska. No generan yield ni quedan expuestos a Morpho.`,
          yieldVault: "Yield opt-in",
          yieldVaultNote:
            "El yield es opcional y puede usar principal mínimo o extra. El yield positivo realizado paga 10% a RISKA y acredita 90% a esta póliza como principal extra; las pérdidas realizadas reducen primero el extra y luego el mínimo.",
          yieldWithdraw: "Salir de yield",
          minimumFunded: "Mínimo fondeado",
          monthlyEstimate: "Estimado mensual",
          noYieldPositions: "Sin posiciones yield",
          noAuxiliaryTokens: "Sin tokens extra",
          noDeathNotice: "Sin reporte",
          payoutProgress: "Pagos",
          refresh: "Actualizar",
          reportDeath: "Reportar fallecimiento",
          selectedToken: "Token seleccionado",
          status: "Estado",
          title: "Dashboard",
          netWorth: "Valor de la póliza",
          fundingProgress: "Progreso de fondeo",
          holdings: "Activos",
          policyHistory: "Historial de la póliza",
          policyActive: "Póliza activa",
          activityCount: (count: number) => `${count} ${count === 1 ? "movimiento" : "movimientos"}`,
          noActivity: "Sin movimientos todavía",
          assetsTab: "Activos",
          activityTab: "Actividad",
          asset: "Activo",
          allocation: "Asignación",
          actions: "Acciones",
          assets: "Tus activos",
          balance: "Balance total",
          depositFunds: "Depositar",
          withdrawFunds: "Retirar",
          send: "Enviar",
          receive: "Recibir",
          backToDashboard: "Volver al dashboard",
          cancel: "Cancelar",
          chooseAsset: "Elige un activo",
          depositTitle: "Depositar fondos",
          withdrawTitle: "Retirar fondos",
          operationHint: "Elige un token y un monto para continuar.",
          usdcAvailable: "USDC extra disponible",
          tokenAddress: "Dirección del token ERC20",
          tokenAddressInvalid: "Ingresa una dirección ERC20 válida.",
          tokenAmount: "Monto del token",
          tokenVaultNote:
            "Estos tokens quedan separados del cálculo de pago en USDC. El titular puede retirarlos en partes sin comisión y, si hay liquidación por fallecimiento, pasan 100% a los beneficiarios.",
          tokenVaultClosed: "Esta póliza no está activa para acciones de bóveda.",
          tokenVaultLocked: (amount: string) => `Para desbloquear la bóveda faltan ${amount} USDC del mínimo.`,
          tokenVault: "Bóveda de tokens extra",
          withdrawExtra: "Retirar extra",
          withdrawExtraAmount: "Monto de extra a retirar",
          withdrawToken: "Retirar token"
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

export function RiskaEnrollmentHome({ view = "home" }: { view?: "apply" | "home" | "rules" }) {
  const { language } = useLanguage();
  const content = copy[language];
  const [activeStepId, setActiveStepId] = useState<StepId>("identity");
  const [hydrated, setHydrated] = useState(false);
  const [existingPolicyLookup, setExistingPolicyLookup] = useState<ExistingPolicyLookupState>({ status: "idle" });
  const [testnetDeployment, setTestnetDeployment] = useState<TestnetDeploymentState>({ status: "loading" });
  const [testnetIssue, setTestnetIssue] = useState<TestnetIssueState>({ status: "idle" });
  const [state, setState] = useState<EnrollmentState>(initialState);

  useEffect(() => {
    try {
      const storedState = window.localStorage.getItem(storageKey);
      const pendingWallet = window.sessionStorage.getItem(pendingWalletStorageKey);
      let restoredState = initialState;

      if (storedState) {
        restoredState = restoreEnrollmentState(JSON.parse(storedState));
      }

      if (pendingWallet) {
        const walletSession = JSON.parse(pendingWallet) as WalletAuthSession;
        if (walletSession?.status === "connected" && walletSession.address) {
          restoredState = {
            ...clearSubmission(restoredState),
            humanReservation: null,
            walletSession
          };
        }
      }

      setState(restoredState);
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
    window.dispatchEvent(new Event("riska-session-changed"));
  }, [hydrated, state]);

  useEffect(() => {
    if (!state.submitted && testnetIssue.status === "issued") {
      setTestnetIssue({ status: "idle" });
    }
  }, [state.submitted, testnetIssue.status]);

  const walletAddress = state.walletSession?.address ?? null;
  const testnetConfigured = testnetDeployment.status === "configured";

  useEffect(() => {
    if (!hydrated || !walletAddress || !testnetConfigured) {
      setExistingPolicyLookup({ status: "idle" });
      return;
    }

    let mounted = true;
    setExistingPolicyLookup({ status: "loading" });

    void getTestnetPolicyIdForHolder({ holder: walletAddress })
      .then((policyId) => {
        if (!mounted) {
          return;
        }

        if (!policyId) {
          setExistingPolicyLookup({ status: "none" });
          setState((current) => {
            if (current.walletSession?.address !== walletAddress || !current.issuedPolicyId) {
              return current;
            }

            return clearSubmission(current);
          });
          return;
        }

        setExistingPolicyLookup({ policyId, status: "found" });
        setActiveStepId("confirm");
        setState((current) => {
          if (current.walletSession?.address !== walletAddress) {
            return current;
          }

          if (current.issuedPolicyId === policyId && current.submitted) {
            return current;
          }

          return {
            ...current,
            applicationId: current.applicationId ?? `RISKA-WCSP-${policyId}`,
            issuedPolicyId: policyId,
            submitted: true,
            submittedAt: current.submittedAt ?? new Date().toISOString()
          };
        });
      })
      .catch((error) => {
        if (!mounted) {
          return;
        }

        setExistingPolicyLookup({
          message: formatTestnetContractError(error),
          status: "error"
        });
      });

    return () => {
      mounted = false;
    };
  }, [hydrated, testnetConfigured, walletAddress]);

  // Existing local sessions may still point to the former quote step. It now
  // lives inside Dashboard, so they continue directly there instead of resetting.
  const visibleStepId = state.issuedPolicyId || activeStepId === "quote" ? "confirm" : activeStepId;
  const activeStepIndex = steps.findIndex((step) => step.id === visibleStepId);
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

  const startApplication = useCallback(
    (walletSession: WalletAuthSession | null) => {
      if (!walletSession) {
        return;
      }

      window.sessionStorage.setItem(pendingWalletStorageKey, JSON.stringify(walletSession));
      handleWalletSessionChange(walletSession);
      window.location.assign("/apply");
    },
    [handleWalletSessionChange]
  );

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

    if (humanReservation) {
      setActiveStepId("beneficiaries");
    }
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

          setExistingPolicyLookup({ policyId: result.policyId, status: "found" });
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
    <div className="riska-dark-surface min-h-screen overflow-x-hidden bg-[#080b10] text-[#f5f7fb]">
      <Navbar />
      <main className="pb-28">
        {view === "home" && <WelcomeScreen content={content} onStartApplication={startApplication} />}

        {view === "apply" && <section id="enroll" className={`mx-auto px-5 py-10 md:px-8 lg:py-14 ${state.issuedPolicyId ? "max-w-6xl" : "max-w-3xl"}`}>
          <div className="space-y-4">
            {!state.issuedPolicyId && (
              <StepRail
                activeStepId={visibleStepId}
                completion={completion}
                content={content}
                onStepSelect={setActiveStepId}
              />
            )}

            <div>
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
                existingPolicyLookup={existingPolicyLookup}
                testnetDeployment={testnetDeployment}
                testnetIssue={testnetIssue}
              />
            </div>
          </div>
        </section>}

        {view === "rules" && <section id="rules" className="mx-3 my-8 rounded-[28px] border border-[#e2e2e8] bg-white md:mx-6 md:my-10">
          <div className="mx-auto max-w-4xl space-y-10 px-5 py-10 md:px-8 lg:py-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5868ea]">{content.rules.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.045em] md:text-4xl">
                {content.rules.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-[#696975]">{content.rules.body}</p>
              <p className="mt-4 text-sm leading-6 text-[#777782]">{content.welcome.body}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {content.welcome.facts.map(([label, value]) => (
                <div className="rounded-2xl border border-[#e8e8ed] bg-[#fafafd] p-4" key={label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#777782]">{label}</p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.03em]">{value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold tracking-[-0.03em]">{content.rules.stepsTitle}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {content.rules.steps.map((step, index) => (
                  <div key={step.title} className="flex gap-3 rounded-xl border border-[#e8e8ed] bg-[#fafafd] p-4">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e6e9ff] text-sm font-semibold text-[#5868ea]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold leading-6 text-[#202027]">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-[#54545f]">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              {content.welcome.cards.map((card) => {
                const Icon = card.icon;

                return (
                  <article className="flex gap-4 rounded-2xl border border-[#e8e8ed] bg-[#fafafd] p-4" key={card.title}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6e9ff] text-[#5868ea]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold">{card.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#696975]">{card.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>}
      </main>
      <Footer />
    </div>
  );
}

function WelcomeScreen({
  content,
  onStartApplication
}: {
  content: (typeof copy)[Language];
  onStartApplication: (walletSession: WalletAuthSession | null) => void;
}) {
  const welcome = content.welcome;

  return (
    <section className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm text-center">
        <p className="text-sm font-bold tracking-[-0.05em] text-[#202027]">RISKA</p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-[#202027]">{welcome.primary}</h1>
        <p className="mt-3 text-sm leading-6 text-[#777782]">Conecta tu wallet para comenzar.</p>
        <div className="mt-7 flex justify-center">
          <WalletAuth onSessionChange={onStartApplication} variant="start" />
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
  existingPolicyLookup: ExistingPolicyLookupState;
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
    <div className="rounded-2xl border border-[#202936] bg-[#10151d] p-2 shadow-[0_16px_38px_rgba(8,11,16,0.2)]">
      <div className="overflow-x-auto">
        <div className="grid min-w-[520px] grid-cols-4 gap-1">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const selected = step.id === activeStepId;
            const complete = completion[step.id];
            const stepCopy = content.wizard.steps[step.id];

            return (
              <button
                aria-current={selected ? "step" : undefined}
                className={`flex min-h-[58px] w-full items-center justify-center gap-2 rounded-xl border px-2 py-2 text-center transition ${
                  selected ? "border-[#5868ea] bg-[#20295b] text-[#f5f7fb]" : "border-transparent text-[#9baac0] hover:border-[#303a49] hover:bg-[#151d28]"
                }`}
                key={step.id}
                onClick={() => onStepSelect(step.id)}
                type="button"
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${step.accent}`}>
                  {complete ? <Check className="h-3 w-3 text-white" /> : <Icon className="h-3 w-3 text-white" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">{stepCopy.meta}</span>
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
  const screenTitle = step.id === "confirm" && state.issuedPolicyId ? content.wizard.confirm.policy.title : stepCopy.title;
  const isDashboard = Boolean(state.issuedPolicyId);

  return (
    <article className={isDashboard ? "" : "overflow-hidden rounded-[28px] border border-[#202936] bg-[#080b10] text-[#f5f7fb] shadow-[0_22px_60px_rgba(8,11,16,0.25)]"}>
      {!isDashboard && <header className="flex flex-col gap-4 border-b border-[#202936] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.accent}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-[#8190a6]">{content.wizard.step(activeStepIndex)}</p>
            <h2 className="text-2xl font-semibold leading-tight tracking-[-0.04em]">{screenTitle}</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill
            complete={step.id === "confirm" ? props.readyToSubmit || state.submitted : props.completion[step.id]}
            label={step.id === "confirm" && state.submitted ? content.wizard.submitted : stepCopy.meta}
          />
        </div>
      </header>}

      {!isDashboard && <div className="h-1 bg-[#10151d]">
        <div className={`h-full ${step.accent}`} style={{ width: `${((activeStepIndex + 1) / steps.length) * 100}%` }} />
      </div>}

      <div className={isDashboard ? "" : "px-5 py-6 md:px-7"}>
        {renderScreen(props)}

        {state.submitted && !state.issuedPolicyId && (
          <div className="mt-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
            <p className="font-semibold">{content.wizard.confirm.submitted}</p>
            <p className="mt-1 font-mono text-xs">{state.applicationId}</p>
          </div>
        )}

        {!props.completion[step.id] && step.id !== "confirm" && (
          <p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {content.wizard.blocked}
          </p>
        )}

        {!state.issuedPolicyId && !(step.id === "identity" && state.walletSession) && (
          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#202936] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#334052] bg-[#151d28] px-5 text-sm font-semibold text-[#e6edf8] transition hover:border-[#5868ea] hover:text-[#aeb8ff] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={activeStepIndex === 0}
              onClick={props.onBack}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
              {content.wizard.back}
            </button>
            <button
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#5868ea] px-5 text-sm font-semibold text-white transition hover:bg-[#4f63e8] disabled:cursor-not-allowed disabled:bg-[#303a49] disabled:text-[#8190a6]"
              disabled={primaryDisabled}
              onClick={props.onPrimary}
              type="button"
            >
              {primaryLabel}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
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
  onHumanReservationChange,
  onWalletSessionChange,
  state
}: EnrollmentWizardProps) {
  if (state.walletSession) {
    return (
      <WorldIdGate
        onReservationChange={onHumanReservationChange}
        variant="compact"
        walletAddress={state.walletSession.address}
      />
    );
  }

  return (
    <div>
      <WalletAuth onSessionChange={onWalletSessionChange} variant="dark" />
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
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[#3a4656] bg-[#10151d] p-4 text-left text-[#e6edf8] transition hover:border-[#5868ea] hover:bg-[#151d28] disabled:opacity-50"
        disabled={state.beneficiaries.length >= 5}
        onClick={onAddBeneficiary}
        type="button"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#20295b]">
          <UserPlus className="h-5 w-5 text-[#aeb8ff]" />
        </span>
        <span className="font-semibold">{text.add}</span>
      </button>
      <div className="h-2 overflow-hidden rounded-full bg-[#202936]">
        <div className="h-full bg-[#5868ea]" style={{ width: `${Math.min(beneficiaryTotal, 100)}%` }} />
      </div>
      <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className={beneficiaryTotal === 100 ? "text-emerald-300" : "text-red-300"}>
          {text.total(beneficiaryTotal)}
        </p>
        {beneficiaryTotal !== 100 && <p className="text-red-300">{text.invalid}</p>}
        {hasWalletError && <p className="text-red-300">{text.walletInvalid}</p>}
      </div>
    </div>
  );
}

function QuoteScreen({ content, onSetState, state }: Pick<EnrollmentWizardProps, "content" | "onSetState" | "state">) {
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
  existingPolicyLookup,
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

  if (state.issuedPolicyId) {
    return (
      <div className="space-y-5">
        <TestnetIssuePanel
          content={content}
          existingPolicyLookup={existingPolicyLookup}
          state={state}
          testnetDeployment={testnetDeployment}
          testnetIssue={testnetIssue}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <QuoteScreen content={content} onSetState={onSetState} state={state} />

      <TestnetIssuePanel
        content={content}
        existingPolicyLookup={existingPolicyLookup}
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
  existingPolicyLookup,
  state,
  testnetDeployment,
  testnetIssue
}: {
  content: (typeof copy)[Language];
  existingPolicyLookup: ExistingPolicyLookupState;
  state: EnrollmentState;
  testnetDeployment: TestnetDeploymentState;
  testnetIssue: TestnetIssueState;
}) {
  const text = content.wizard.confirm;
  const deployment = testnetDeployment.status === "configured" ? testnetDeployment.deployment : null;
  const openPolicyTx =
    state.issuedTransactionHash ??
    (testnetIssue.status === "issued" ? testnetIssue.result.txHashes.openPolicy : null);
  const issuedPolicyId =
    state.issuedPolicyId ??
    (testnetIssue.status === "issued" ? testnetIssue.result.policyId : null);
  const policyId =
    existingPolicyLookup.status === "found"
      ? existingPolicyLookup.policyId
      : existingPolicyLookup.status === "none" || existingPolicyLookup.status === "error"
        ? testnetIssue.status === "issued"
          ? testnetIssue.result.policyId
          : null
        : issuedPolicyId;
  const status = getTestnetPanelStatus(content, testnetDeployment, testnetIssue, existingPolicyLookup);
  const explorerUrl = deployment && openPolicyTx ? `${deployment.explorerBaseUrl.replace(/\/address\/$/, "/tx/")}${openPolicyTx}` : null;

  // Once a policy exists, the dashboard is the product surface. Issuance details remain
  // available only while opening a policy, avoiding duplicate technical status cards.
  if (policyId && state.walletSession) {
    return (
      <PolicyControlPanel
        content={content}
        deployment={deployment}
        policyId={policyId}
        walletAddress={state.walletSession.address}
      />
    );
  }

  return (
    <div className="rounded-xl border border-[#303a49] bg-[#10151d] p-4 text-[#e6edf8]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#f5f7fb]">{text.testnetTitle}</p>
          <p className={`mt-1 text-sm ${status.tone}`}>{status.message}</p>
        </div>
        {deployment?.contracts.policyManager?.address && (
          <p className="break-all font-mono text-xs text-[#8190a6]">
            {shortAddress(deployment.contracts.policyManager.address)}
          </p>
        )}
      </div>

      {(policyId || openPolicyTx) && (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {policyId && <SummaryFact label={text.testnetPolicy} value={policyId} />}
          {openPolicyTx && (
            <div className="rounded-xl border border-[#303a49] bg-[#0b1018] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8190a6]">{text.testnetTx}</p>
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
    </div>
  );
}

function PolicyControlPanel({
  content,
  deployment,
  policyId,
  walletAddress
}: {
  content: (typeof copy)[Language];
  deployment: RiskaTestnetDeployment | null;
  policyId: string;
  walletAddress: string;
}) {
  const text = content.wizard.confirm.policy;
  const [policy, setPolicy] = useState<RiskaTestnetPolicyView | null>(null);
  const [cashflow, setCashflow] = useState<RiskaTestnetCashflow[]>([]);
  const [depositAmount, setDepositAmount] = useState("10770");
  const [extraWithdrawAmount, setExtraWithdrawAmount] = useState("100");
  const [yieldAmount, setYieldAmount] = useState("100");
  const [yieldStrategyId, setYieldStrategyId] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenAmount, setTokenAmount] = useState("1");
  const [assetOperation, setAssetOperation] = useState<AssetOperation>("dashboard");
  const [canChooseAsset, setCanChooseAsset] = useState(false);
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

  useEffect(() => {
    let mounted = true;

    void getTestnetPolicyCashflow(policyId)
      .then((history) => {
        if (mounted) {
          setCashflow(history);
        }
      })
      .catch(() => {
        if (mounted) {
          setCashflow([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [policyId]);

  async function runAction(action: TestnetPolicyAction, options?: { amount?: string; strategyId?: number }) {
    setWorkingAction(action);
    setStatusTone("text-amber-700");
    setStatusMessage(getPolicyActionLabel(action, text));

    try {
      await runTestnetPolicyAction({
        action,
        amount: options?.amount ?? (
          action === "deposit"
            ? depositAmount
            : action === "withdrawExtra"
              ? extraWithdrawAmount
              : action === "depositYield"
                ? yieldAmount
              : action === "depositToken" || action === "withdrawToken"
                ? tokenAmount
              : undefined
        ),
        holder: walletAddress,
        onStatus: (status) => {
          setStatusMessage(getPolicyActionStatusLabel(status));
        },
        policyId,
        strategyId:
          options?.strategyId ??
          (action === "depositYield" || action === "withdrawYield" ? Number(yieldStrategyId) : undefined),
        tokenAddress: action === "depositToken" || action === "withdrawToken" ? tokenAddress : undefined
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
  const canWithdrawExtra = policy ? canUseHolderAction && policy.remainingExtraPrincipal > 0n : false;
  const yieldAllocated = policy?.yieldPositions.reduce((total, position) => total + position.costBasis, 0n) ?? 0n;
  const yieldConfigured = Boolean(deployment?.contracts.yieldStrategyManager?.address);
  const availableYieldStrategies = policy?.yieldStrategies.filter((strategy) => strategy.active && strategy.depositsEnabled) ?? [];
  const canDepositYield = policy
    ? yieldConfigured && availableYieldStrategies.length > 0 && status === 1 && policy.totalPrincipal > yieldAllocated
    : false;
  const canUseTokenVault = policy ? canUseHolderAction && (minimumFunded || status === 2) : false;
  const hasTokenAddress = isWalletAddress(tokenAddress);
  const normalizedTokenAddress = tokenAddress.trim().toLowerCase();
  const selectedAuxiliaryToken = policy?.auxiliaryTokens.find(
    (token) => token.address.toLowerCase() === normalizedTokenAddress
  );
  const canWithdrawToken = Boolean(hasTokenAddress && canUseHolderAction && selectedAuxiliaryToken && selectedAuxiliaryToken.balance > 0n);
  const canActivate = policy ? status === 1 && minimumFunded : false;
  const canClaimMonthly = policy ? status === 2 : false;
  const canClaimAll = policy ? status === 2 || (status === 1 && minimumFunded) : false;
  const canReportDeath = policy
    ? policy.isViewerBeneficiary && (status === 1 || status === 2) && !policy.deathNotice.active
    : false;
  const canClaimDeath = policy
    ? policy.isViewerBeneficiary && policy.deathNotice.active && (status === 1 || status === 2)
    : false;

  function chooseAsset(address: string) {
    setTokenAddress(address);
  }

  function openAssetOperation(operation: Exclude<AssetOperation, "dashboard">, address = "", allowSelection = false) {
    chooseAsset(address);
    setCanChooseAsset(allowSelection);
    if (operation === "yield" && address === "" && availableYieldStrategies.length === 1) {
      setYieldStrategyId(String(availableYieldStrategies[0].strategyId));
    }
    setAssetOperation(operation);
  }

  const withdrawableBalance = tokenAddress
    ? selectedAuxiliaryToken?.balance ?? 0n
    : policy?.remainingExtraPrincipal ?? 0n;
  const withdrawableBalanceLabel = tokenAddress && selectedAuxiliaryToken
    ? formatTokenAmount(withdrawableBalance, selectedAuxiliaryToken.decimals)
    : formatUsdcAmount(withdrawableBalance);
  const visibleCashflow = cashflow.slice(-12);
  const largestCashflow = visibleCashflow.reduce(
    (largest, movement) => movement.amount > largest ? movement.amount : largest,
    1n
  );

  function setWithdrawalPercentage(percentage: number) {
    const amount = (withdrawableBalance * BigInt(percentage)) / 100n;
    const formattedAmount = tokenAddress && selectedAuxiliaryToken
      ? formatTokenAmount(amount, selectedAuxiliaryToken.decimals)
      : formatUsdcAmount(amount);

    if (tokenAddress) {
      setTokenAmount(formattedAmount);
    } else {
      setExtraWithdrawAmount(formattedAmount);
    }
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#202936] bg-[#080b10] p-4 text-[#f5f7fb] shadow-[0_22px_60px_rgba(8,11,16,0.25)] md:p-6">
      <div className="flex flex-col gap-3 border-b border-[#202936] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#f5f7fb]">{text.title}</p>
          {policy && (
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
              <span className="text-[#8d9bb0]">{text.status}: <strong className="font-semibold text-[#aeb8ff]">{getPolicyStatusLabel(policy.status)}</strong></span>
              <span className="text-[#8d9bb0]">{text.deathNotice}: <strong className="font-semibold text-[#f5f7fb]">{policy.deathNotice.active ? formatUnixDate(policy.deathNotice.reportedAt) : text.noDeathNotice}</strong></span>
              <span className="text-[#8d9bb0]">{text.lastActivity}: <strong className="font-semibold text-[#f5f7fb]">{formatUnixDate(policy.lastHolderInteractionAt)}</strong></span>
            </div>
          )}
        </div>
      </div>

      {policy && (
        <>
          {(
            <>
              <div className="mt-5 grid gap-4 xl:grid-cols-[1.55fr_0.85fr]">
                <section className="min-h-[286px] rounded-[22px] border border-[#202936] bg-[radial-gradient(circle_at_85%_110%,rgba(36,195,135,0.28),transparent_42%),linear-gradient(135deg,#101722,#080b10_70%)] p-5 md:p-7">
                  <p className="text-sm font-medium text-[#9baac0]">{text.netWorth}</p>
                  <p className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#f8faff] md:text-6xl">${formatUsdcAmount(policy.totalPrincipal)}</p>
                  <p className="mt-2 text-sm text-[#9baac0]">{formatUsdcAmount(policy.totalPrincipal)} USDC</p>
                  <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
                    <DashboardMetric label={text.minimumFunded} value={`${minimumPercent.toFixed(2)}%`} />
                    <DashboardMetric label={text.usdcAvailable} value={`${formatUsdcAmount(policy.remainingExtraPrincipal)} USDC`} accent />
                    <DashboardMetric label={text.payoutProgress} value={`${policy.payoutsMade} / 120`} />
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <button className="flex h-11 items-center gap-2 rounded-xl bg-[#5868ea] px-4 text-sm font-semibold text-white transition hover:bg-[#4f63e8]" onClick={() => openAssetOperation("deposit", "", true)} type="button">
                      <ArrowDownToLine className="h-4 w-4" />
                      {text.depositFunds}
                    </button>
                    <button className="flex h-11 items-center gap-2 rounded-xl border border-[#3a4656] bg-[#151d28] px-4 text-sm font-semibold text-[#e6edf8] transition hover:border-[#718299]" onClick={() => openAssetOperation("withdraw", "", true)} type="button">
                      <ArrowUpFromLine className="h-4 w-4" />
                      {text.withdrawFunds}
                    </button>
                  </div>
                </section>

                <section className="relative overflow-hidden rounded-[22px] border border-[#202936] bg-[#101722] p-5">
                  <p className="text-sm font-medium text-[#9baac0]">{text.policyHistory}</p>
                  <div className="mt-5 flex h-24 items-end gap-1.5 border-b border-[#2b3543] pb-2">
                    {visibleCashflow.length > 0 ? visibleCashflow.map((movement, index) => {
                      const height = Math.max(12, Number((movement.amount * 100n) / largestCashflow));

                      return (
                        <span
                          aria-label={`${movement.kind === "deposit" ? text.depositFunds : text.withdrawFunds}: ${formatUsdcAmount(movement.amount)} USDC · ${formatShortDate(movement.timestamp)}`}
                          className={`flex-1 rounded-t-sm ${movement.kind === "deposit" ? "bg-gradient-to-t from-[#2a347e] to-[#aeb8ff]" : "bg-gradient-to-t from-[#7d3656] to-[#f0a2c2]"}`}
                          key={`${movement.timestamp}-${index}`}
                          style={{ height: `${height}%` }}
                          title={`${movement.kind === "deposit" ? text.depositFunds : text.withdrawFunds}: ${formatUsdcAmount(movement.amount)} USDC · ${formatShortDate(movement.timestamp)}`}
                        />
                      );
                    }) : <span className="text-sm text-[#8d9bb0]">{text.noActivity}</span>}
                  </div>
                  <div className="relative mt-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold text-[#f6f8fc]">{text.activityCount(visibleCashflow.length)}</p>
                      <p className="mt-1 text-sm text-[#9baac0]">{visibleCashflow.length > 0 ? `${formatShortDate(visibleCashflow[0].timestamp)} — ${formatShortDate(visibleCashflow[visibleCashflow.length - 1].timestamp)}` : text.policyActive}</p>
                    </div>
                    <div className="flex gap-2 text-xs font-semibold">
                      <span className="rounded-full border border-[#5868ea] bg-[#20295b] px-3 py-1 text-[#c8d0ff]">{text.depositFunds}</span>
                      <span className="rounded-full border border-[#7d3656] bg-[#341b2d] px-3 py-1 text-[#f0a2c2]">{text.withdrawFunds}</span>
                    </div>
                  </div>
                </section>
              </div>

              <section className="mt-5 overflow-hidden rounded-[22px] border border-[#202936] bg-[#10151d]">
                <div className="flex items-center justify-between border-b border-[#202936] px-5 py-4">
                  <div className="flex items-center gap-5 text-sm font-semibold">
                    <span className="border-b-2 border-[#5868ea] pb-4 -mb-4 text-[#f5f7fb]">{text.assetsTab}</span>
                    <span className="text-[#8190a6]">{text.activityTab}</span>
                  </div>
                  <span className="text-sm text-[#8190a6]">{policy.auxiliaryTokens.length + 1} {text.holdings.toLowerCase()}</span>
                </div>
                <div className="hidden grid-cols-[1.2fr_1fr_0.7fr_auto] gap-4 border-b border-[#202936] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8190a6] md:grid">
                  <span>{text.asset}</span><span>{text.balance}</span><span>{text.allocation}</span><span>{text.actions}</span>
                </div>
                <AssetTableRow
                  balance={`${formatUsdcAmount(policy.totalPrincipal)} USDC`}
                  label="USDC"
                  onReceive={() => openAssetOperation("deposit")}
                  onSend={() => openAssetOperation("withdraw")}
                  onYield={() => openAssetOperation("yield")}
                  receiveLabel={text.depositFunds}
                  sendLabel={text.withdrawFunds}
                  share="100% policy base"
                  yieldLabel={text.yield}
                />
                {policy.auxiliaryTokens.map((token) => (
                  <AssetTableRow
                    balance={formatTokenAmount(token.balance, token.decimals)}
                    key={token.address}
                    label={token.symbol}
                    onReceive={() => openAssetOperation("deposit", token.address)}
                    onSend={() => openAssetOperation("withdraw", token.address)}
                    onYield={() => openAssetOperation("yield", token.address)}
                    receiveLabel={text.depositFunds}
                    sendLabel={text.withdrawFunds}
                    share={shortAddress(token.address)}
                    yieldLabel={text.yield}
                  />
                ))}
              </section>
            </>
          )}

          {assetOperation !== "dashboard" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070b]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={assetOperation === "deposit" ? text.depositTitle : assetOperation === "withdraw" ? text.withdrawTitle : text.yield}>
              <div className="w-full max-w-sm rounded-[22px] border border-[#334052] bg-[#10151d] p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-[#f5f7fb]">{assetOperation === "deposit" ? text.depositTitle : assetOperation === "withdraw" ? text.withdrawTitle : text.yield}</p>
                    <p className="mt-1 text-sm text-[#8d9bb0]">{assetOperation === "deposit" ? text.operationHint : assetOperation === "withdraw" ? text.withdrawExtraAmount : text.yieldProtocolHint}</p>
                  </div>
                  {canChooseAsset ? (
                    <select
                      aria-label={text.chooseAsset}
                      className="h-9 rounded-full border border-[#3a4656] bg-[#0b1018] px-3 text-sm font-semibold text-[#aeb8ff] outline-none focus:border-[#5868ea]"
                      onChange={(event) => chooseAsset(event.target.value)}
                      value={tokenAddress}
                    >
                      <option value="">USDC</option>
                      {policy.auxiliaryTokens.map((token) => (
                        <option key={token.address} value={token.address}>{token.symbol}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="rounded-full border border-[#3a4656] bg-[#0b1018] px-3 py-1 text-sm font-semibold text-[#aeb8ff]">
                      {tokenAddress ? selectedAuxiliaryToken?.symbol ?? "ERC20" : "USDC"}
                    </span>
                  )}
                </div>
                {assetOperation === "yield" && tokenAddress === "" && (
                  <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8d9bb0]">
                    {text.yieldStrategy}
                    <select
                      aria-label={text.yieldStrategy}
                      className="mt-2 min-h-12 w-full rounded-lg border border-[#334052] bg-[#0b1018] px-3 text-sm font-semibold text-[#f5f7fb] outline-none focus:border-[#5868ea]"
                      onChange={(event) => setYieldStrategyId(event.target.value)}
                      value={yieldStrategyId}
                    >
                      <option value="">{text.chooseYieldStrategy}</option>
                      {availableYieldStrategies.map((strategy) => (
                        <option key={strategy.strategyId} value={strategy.strategyId}>{strategy.name}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8d9bb0]">
                  {assetOperation === "deposit" ? text.depositAmount : assetOperation === "withdraw" ? text.withdrawExtraAmount : text.yieldAmount}
                  <input
                    aria-label={assetOperation === "deposit" ? text.depositAmount : assetOperation === "withdraw" ? text.withdrawExtraAmount : text.yieldAmount}
                    autoFocus
                    className="mt-2 min-h-12 w-full rounded-lg border border-[#334052] bg-[#0b1018] px-3 text-base font-semibold text-[#f5f7fb] outline-none focus:border-[#5868ea]"
                    max={assetOperation === "withdraw" ? withdrawableBalanceLabel : undefined}
                    min="0"
                    onChange={(event) => assetOperation === "yield" ? setYieldAmount(event.target.value) : tokenAddress ? setTokenAmount(event.target.value) : (assetOperation === "deposit" ? setDepositAmount(event.target.value) : setExtraWithdrawAmount(event.target.value))}
                    step="any"
                    type="number"
                    value={assetOperation === "yield" ? yieldAmount : tokenAddress ? tokenAmount : (assetOperation === "deposit" ? depositAmount : extraWithdrawAmount)}
                  />
                </label>
                {assetOperation === "withdraw" && (
                  <>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {[25, 50, 75, 100].map((percentage) => (
                        <button
                          className="h-9 rounded-lg border border-[#334052] bg-[#151d28] text-xs font-semibold text-[#d8e0ee] transition hover:border-[#5868ea] hover:text-[#aeb8ff]"
                          key={percentage}
                          onClick={() => setWithdrawalPercentage(percentage)}
                          type="button"
                        >
                          {percentage}%
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-[#8d9bb0]">
                      {text.usdcAvailable}: {withdrawableBalanceLabel} {tokenAddress ? selectedAuxiliaryToken?.symbol ?? "" : "USDC"}
                    </p>
                  </>
                )}
                {assetOperation === "yield" && tokenAddress !== "" && (
                  <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">{text.yieldUnavailable}</p>
                )}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button className="min-h-11 rounded-lg border border-[#334052] bg-[#151d28] px-3 text-sm font-semibold text-[#e6edf8] transition hover:border-[#718299]" onClick={() => setAssetOperation("dashboard")} type="button">
                    {text.cancel}
                  </button>
                  <PolicyActionButton
                    action={assetOperation === "deposit" ? (tokenAddress ? "depositToken" : "deposit") : assetOperation === "withdraw" ? (tokenAddress ? "withdrawToken" : "withdrawExtra") : "depositYield"}
                    disabled={isWorking || (assetOperation === "deposit" ? (tokenAddress ? !canUseTokenVault : !canDeposit) : assetOperation === "withdraw" ? (tokenAddress ? !canWithdrawToken : !canWithdrawExtra) : tokenAddress !== "" || !canDepositYield || yieldStrategyId === "")}
                    icon={assetOperation === "deposit" ? ArrowDownToLine : assetOperation === "withdraw" ? ArrowUpFromLine : Percent}
                    label={assetOperation === "deposit" ? text.depositFunds : assetOperation === "withdraw" ? text.withdrawFunds : text.yieldDeposit}
                    onClick={runAction}
                    workingAction={workingAction}
                  />
                </div>
              </div>
            </div>
          )}

          <p className="mt-3 rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-xs leading-5 text-amber-200">
            {text.claimAllFeeNote}
          </p>

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
      className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#334052] bg-[#151d28] px-3 text-sm font-semibold text-[#e6edf8] transition hover:border-[#718299] hover:bg-[#1b2634] disabled:cursor-not-allowed disabled:opacity-45"
      disabled={disabled}
      onClick={() => onClick(action)}
      type="button"
    >
      <Icon className={`h-4 w-4 ${working ? "animate-pulse" : ""}`} />
      {label}
    </button>
  );
}

function DashboardMetric({ accent = false, label, value }: { accent?: boolean; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#8d9bb0]">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent ? "text-[#aeb8ff]" : "text-[#f5f7fb]"}`}>{value}</p>
    </div>
  );
}

function getTokenLogo(symbol: string) {
  const normalized = symbol.replace(/^m/, "").toUpperCase();
  const logos: Record<string, string> = {
    BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=040",
    ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040",
    SOL: "https://cryptologos.cc/logos/solana-sol-logo.png?v=040",
    USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040"
  };

  return logos[normalized];
}

function AssetTableRow({
  balance,
  label,
  onReceive,
  onSend,
  onYield,
  receiveLabel,
  sendLabel,
  share,
  yieldLabel
}: {
  balance: string;
  label: string;
  onReceive: () => void;
  onSend: () => void;
  onYield: () => void;
  receiveLabel: string;
  sendLabel: string;
  share: string;
  yieldLabel: string;
}) {
  const logo = getTokenLogo(label);

  return (
    <div className="grid gap-3 border-b border-[#202936] px-5 py-4 last:border-b-0 md:grid-cols-[1.2fr_1fr_0.7fr_auto] md:items-center md:gap-4">
      <div className="flex items-center gap-3">
        {logo ? (
          <img alt={`${label} logo`} className="h-9 w-9 rounded-xl bg-[#20295b] object-cover" src={logo} />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#20295b] text-sm font-bold text-[#aeb8ff]">{label.slice(0, 1)}</span>
        )}
        <span className="font-semibold text-[#f5f7fb]">{label}</span>
      </div>
      <p className="font-semibold text-[#f5f7fb]">{balance}</p>
      <p className="text-sm text-[#8d9bb0]">{share}</p>
      <div className="flex flex-wrap gap-2 md:justify-end">
        <button className="flex h-9 items-center gap-1.5 rounded-lg border border-[#5868ea] px-3 text-xs font-semibold text-[#aeb8ff] transition hover:bg-[#20295b]" onClick={onYield} type="button">
          <Percent className="h-3.5 w-3.5" />
          {yieldLabel}
        </button>
        <button className="flex h-9 items-center gap-1.5 rounded-lg border border-[#334052] px-3 text-xs font-semibold text-[#d8e0ee] transition hover:border-[#74869f]" onClick={onSend} type="button">
          <ArrowUpFromLine className="h-3.5 w-3.5" />
          {sendLabel}
        </button>
        <button className="flex h-9 items-center gap-1.5 rounded-lg bg-[#5868ea] px-3 text-xs font-semibold text-white transition hover:bg-[#4f63e8]" onClick={onReceive} type="button">
          <ArrowDownToLine className="h-3.5 w-3.5" />
          {receiveLabel}
        </button>
      </div>
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
    <div className="rounded-xl border border-[#303a49] bg-[#10151d] p-4 text-[#e6edf8]">
      <div className="flex gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${checked ? "bg-emerald-400/15 text-emerald-300" : "bg-[#20295b] text-[#aeb8ff]"}`}>
          {checked ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 break-words text-sm leading-6 text-[#9baac0]">{detail}</p>
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
    <div className="rounded-xl border border-[#303a49] bg-[#10151d] p-3 text-[#e6edf8]">
      <div className="flex items-center gap-2">
        <span className={`h-8 w-8 shrink-0 ${beneficiary.color}`} />
        <input
          aria-label={text.name}
          className="min-w-0 flex-1 rounded-lg border border-[#334052] bg-[#0b1018] px-2 py-2 text-sm font-semibold text-[#f5f7fb] outline-none placeholder:text-[#8190a6] focus:border-[#5868ea]"
          onChange={(event) => onUpdateBeneficiary(beneficiary.id, "name", event.target.value)}
          placeholder={text.namePlaceholder}
          value={beneficiary.name}
        />
        <button
          aria-label={text.remove}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#334052] text-[#9baac0] transition hover:border-red-300 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
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
          className={`min-w-0 rounded-lg border bg-[#0b1018] px-2 py-2 text-xs text-[#f5f7fb] outline-none placeholder:text-[#8190a6] focus:border-[#5868ea] ${
            walletInvalid ? "border-red-400" : "border-[#334052]"
          }`}
          onChange={(event) => onUpdateBeneficiary(beneficiary.id, "wallet", event.target.value)}
          placeholder={text.walletPlaceholder}
          value={beneficiary.wallet}
        />
        <input
          aria-label={text.share}
          className="rounded-lg border border-[#334052] bg-[#0b1018] px-2 py-2 text-right text-sm font-semibold text-[#f5f7fb] outline-none focus:border-[#5868ea]"
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
    <div className="rounded-xl border border-[#303a49] bg-[#10151d] p-4 text-[#f5f7fb]">
      <p className="text-sm text-[#9baac0]">{label}</p>
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
    <div className="flex items-center justify-between rounded-xl border border-[#303a49] bg-[#10151d] p-3 text-[#f5f7fb]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#20295b] text-[#aeb8ff]">
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
    <label className={`flex items-start gap-3 rounded-xl border border-[#303a49] bg-[#10151d] p-3 text-sm text-[#e6edf8] ${disabled ? "opacity-50" : ""}`}>
      <input
        checked={checked}
        className="mt-1 h-4 w-4 accent-[#5868ea]"
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
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${complete ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-[#334052] bg-[#111722] text-[#9baac0]"}`}>
      <span className="flex h-4 w-4 items-center justify-center">
        {complete && <Check className="h-3.5 w-3.5" />}
      </span>
      {label}
    </div>
  );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#303a49] bg-[#10151d] p-4 text-[#f5f7fb]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8190a6]">{label}</p>
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
    approving_token: "Approving token",
    approving_usdc: "Approving USDC",
    checking_token: "Checking token",
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
    depositToken: text.depositToken,
    depositYield: text.yieldDeposit,
    heartbeat: text.heartbeat,
    reportDeath: text.reportDeath,
    withdrawExtra: text.withdrawExtra,
    withdrawToken: text.withdrawToken,
    withdrawYield: text.yieldWithdraw
  };

  return labels[action];
}

function getPolicyActionStatusLabel(status: TestnetPolicyActionStatus) {
  const labels: Record<TestnetPolicyActionStatus, string> = {
    approving_token: "Approving token",
    approving_usdc: "Approving USDC",
    checking_token: "Checking token",
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

function formatShortDate(timestamp: number) {
  if (!timestamp) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(timestamp * 1000));
}

function getTestnetPanelStatus(
  content: (typeof copy)[Language],
  deployment: TestnetDeploymentState,
  issue: TestnetIssueState,
  existingPolicyLookup: ExistingPolicyLookupState
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

  if (existingPolicyLookup.status === "loading") {
    return {
      message: text.testnetLookup,
      tone: "text-amber-700"
    };
  }

  if (existingPolicyLookup.status === "found") {
    return {
      message: text.testnetExisting,
      tone: "text-emerald-700"
    };
  }

  if (existingPolicyLookup.status === "error") {
    return {
      message: existingPolicyLookup.message,
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
