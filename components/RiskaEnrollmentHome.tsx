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
  LogOut,
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
import type { PolicyHumanReservationView } from "@/components/WorldIdGate";
import type { Language } from "@/lib/i18n";
import { RISKA_POLICY_TERMS_HASH, WORLDCHAIN_SEPOLIA_CHAIN_ID, type RiskaTestnetDeployment } from "@/lib/riska-testnet";
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
import { disconnectWallet } from "@/lib/web3/metamask";

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

type AssetOperation = "dashboard" | "deposit" | "withdraw";

const storageKey = "riska.enrollment.v2";
const pendingWalletStorageKey = "riska.pending-wallet-session";
const beneficiaryColors = ["bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-cyan-500", "bg-violet-500"];

const steps: WizardStep[] = [
  { accent: "bg-[#5868ea]", icon: Fingerprint, id: "identity" },
  { accent: "bg-[#5868ea]", icon: Users, id: "beneficiaries" },
  { accent: "bg-[#5868ea]", icon: CircleDollarSign, id: "quote" },
  { accent: "bg-[#5868ea]", icon: FileCheck2, id: "confirm" }
];

const copy = {
  en: {
    welcome: {
      badge: "Riska 30",
      title: "Flexible life protection for verified humans.",
      body:
        "Riska is a World Chain USDC policy account. Any verified human can fund the 10,800 USDC minimum over time, add or withdraw extra principal, store other ERC20 tokens after the minimum, and pass those tokens 100% to beneficiaries on death settlement.",
      primary: "Start application",
      secondary: "Read policy rules",
      cards: [
        {
          icon: HeartHandshake,
          title: "Family protection",
          body: "Beneficiaries can claim only after a death report plus 12 months without holder interaction, including 100% of stored non-USDC tokens."
        },
        {
          icon: CircleDollarSign,
          title: "Flexible income",
          body: "Once the minimum is funded, the holder can start 120 monthly payments, withdraw extra in parts, or claim the remaining balance."
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
        "Any verified human can open a policy. Deposits fill the 10,800 USDC minimum first, extra USDC increases future monthly payout, auxiliary tokens stay fee-free, and beneficiaries receive those stored tokens 100% after the death notice window.",
      items: [
        "World ID verification is completed before policy issuance",
        "Beneficiaries must total 100%",
        "Extra deposits can be withdrawn without fee",
        "Stored ERC20 tokens pass fully to beneficiaries on death settlement",
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
      submit: "Open policy",
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
          yieldAmount: "Yield amount",
          yieldCostBasis: "Cost basis",
          yieldDeposit: "Start yield",
          yieldEstimated: "Estimated assets",
          yieldStrategy: "Strategy",
          chooseYieldStrategy: "Choose Morpho strategy",
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
        "Riska es una cuenta de póliza USDC en World Chain. Cualquier humano verificado puede fondear el mínimo de 10,800 USDC con el tiempo, sumar o retirar principal extra, guardar otros ERC20 después del mínimo y hacer que esos tokens pasen 100% a beneficiarios en liquidación por muerte.",
      primary: "Empezar solicitud",
      secondary: "Ver reglas",
      cards: [
        {
          icon: HeartHandshake,
          title: "Protección familiar",
          body: "Los beneficiarios pueden cobrar solo después de reportar fallecimiento y esperar 12 meses sin interacción del titular, incluyendo 100% de los tokens no-USDC guardados."
        },
        {
          icon: CircleDollarSign,
          title: "Renta flexible",
          body: "Cuando el mínimo está fondeado, el titular puede activar 120 pagos mensuales, retirar extra en partes o retirar el saldo restante."
        },
        {
          icon: Fingerprint,
          title: "Un humano, una póliza",
          body: "World ID y la wallet reservan un cupo de póliza para cada humano verificado."
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
        ["Aviso muerte", "12 meses"]
      ]
    },
    rules: {
      eyebrow: "Reglas Riska 30",
      title: "La promesa queda visible antes de firmar.",
      body:
        "Cualquier humano verificado puede abrir una póliza. Los depósitos llenan primero el mínimo de 10,800 USDC, el extra aumenta el pago mensual futuro, los tokens auxiliares no pagan fee y los beneficiarios reciben esos tokens 100% después de la ventana de muerte.",
      items: [
        "La verificación World ID se completa antes de emitir",
        "Los beneficiarios deben sumar 100%",
        "El extra se puede retirar sin fee",
        "Los ERC20 guardados pasan completos a beneficiarios en liquidación por muerte",
        "El heartbeat del titular cancela reportes pendientes"
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
        confirm: { meta: "World Chain", title: "Revisión y consentimiento" },
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
          ["Fee claim-all/muerte", "20% solo mínimo"]
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
          claimDeath: "Cobrar muerte",
          claimMonthly: "Cobrar mes",
          claimableAt: "Cobrable desde",
          commonTokens: "Tokens de prueba comunes",
          customToken: "0x custom",
          deathNotice: "Reporte muerte",
          lastActivity: "Última actividad",
          logout: "Cerrar sesión",
          deposit: "Depositar",
          depositAmount: "Monto a depositar",
          depositToken: "Depositar token",
          extraPrincipal: "Principal extra",
          heartbeat: "Heartbeat",
          yieldAmount: "Monto yield",
          yieldCostBasis: "Costo base",
          yieldDeposit: "Activar yield",
          yieldEstimated: "Activos estimados",
          yieldStrategy: "Estrategia",
          chooseYieldStrategy: "Elegí una estrategia Morpho",
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
          reportDeath: "Reportar muerte",
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
          chooseAsset: "Elegí un activo",
          depositTitle: "Depositar fondos",
          withdrawTitle: "Retirar fondos",
          operationHint: "Elegí un token y monto para continuar.",
          usdcAvailable: "USDC extra disponible",
          tokenAddress: "Dirección del token ERC20",
          tokenAddressInvalid: "Ingresá una dirección ERC20 válida.",
          tokenAmount: "Monto del token",
          tokenVaultNote:
            "Estos tokens quedan separados del cálculo de pago en USDC. El titular puede retirarlos en partes sin fee y, si hay liquidación por muerte, pasan 100% a beneficiarios.",
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

  const visibleStepId = state.issuedPolicyId ? "confirm" : activeStepId;
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
    <div className="min-h-screen overflow-x-hidden bg-[#f4f4f8] text-[#202027]">
      <Navbar />
      <main className="pb-28">
        {view === "home" && <WelcomeScreen content={content} onStartApplication={startApplication} />}

        {view === "apply" && <section id="enroll" className={`mx-auto px-5 py-10 md:px-8 lg:py-14 ${state.issuedPolicyId ? "max-w-6xl" : "max-w-3xl"}`}>
          <div className="space-y-4">
            {!state.issuedPolicyId && (
              <StepRail
                activeStepId={activeStepId}
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
            <div className="grid gap-3 sm:grid-cols-2">
              {content.rules.items.map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-[#e8e8ed] bg-[#fafafd] p-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e6e9ff] text-[#5868ea]">
                    <Check className="h-4 w-4" />
                  </span>
                  <p className="text-sm leading-6 text-[#54545f]">{item}</p>
                </div>
              ))}
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
        <p className="mt-3 text-sm leading-6 text-[#777782]">Conectá tu wallet para comenzar.</p>
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
    <div className="rounded-2xl border border-[#e2e2e8] bg-white p-2 shadow-[0_8px_24px_rgba(30,30,45,0.03)]">
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
                  selected ? "border-[#cbd2ff] bg-[#f2f3ff]" : "border-transparent hover:border-[#e6e6ec] hover:bg-[#fafafd]"
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
    <article className={isDashboard ? "" : "rounded-[24px] border border-[#e2e2e8] bg-white shadow-[0_20px_60px_rgba(30,30,45,0.09)]"}>
      {!isDashboard && <header className="flex flex-col gap-4 border-b border-[#eeeeF2] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.accent}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-[#777782]">{content.wizard.step(activeStepIndex)}</p>
            <h2 className="text-2xl font-semibold leading-tight tracking-[-0.04em]">{screenTitle}</h2>
          </div>
        </div>
        <StatusPill
          complete={step.id === "confirm" ? props.readyToSubmit || state.submitted : props.completion[step.id]}
          label={step.id === "confirm" && state.submitted ? content.wizard.submitted : stepCopy.meta}
        />
      </header>}

      {!isDashboard && <div className="h-1 bg-[#eeeeF2]">
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
          <p className="mt-5 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {content.wizard.blocked}
          </p>
        )}

        {!state.issuedPolicyId && (
          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#eeeeF2] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#dedee5] bg-white px-5 text-sm font-semibold text-[#42424c] transition hover:border-[#aeb8ff] hover:text-[#4f63e8] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={activeStepIndex === 0}
              onClick={props.onBack}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
              {content.wizard.back}
            </button>
            <button
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#202027] px-5 text-sm font-semibold text-white transition hover:bg-[#5868ea] disabled:cursor-not-allowed disabled:bg-[#d9d9e0] disabled:text-[#858590]"
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
        initialSession={state.walletSession}
        key={state.walletSession?.address ?? "disconnected"}
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
      <div className="grid gap-3 md:grid-cols-2">
        <SummaryFact label={text.wallet} value={state.walletSession ? shortAddress(state.walletSession.address) : "-"} />
        <SummaryFact label={text.proof} value={state.humanReservation ? shortProofId(state.humanReservation.nullifier) : "-"} />
        <SummaryFact label={text.firstPayment} value="30 USDC" />
        <SummaryFact label={text.network} value="World Chain Sepolia" />
      </div>

      <div className="border border-[#ddd8ed] bg-[#f5f2ff] p-4">
        <p className="text-sm text-[#655a80]">{text.termsHash}</p>
        <p className="mt-2 break-all font-mono text-xs text-[#32284f]">{RISKA_POLICY_TERMS_HASH}</p>
      </div>

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

  async function logout() {
    try {
      await disconnectWallet();
    } finally {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.assign("/");
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
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#303a49] bg-[#111722] px-3 text-xs font-semibold text-[#c5d1e5] transition hover:border-[#62738f] disabled:opacity-50"
          disabled={isWorking}
          onClick={() => void logout()}
          type="button"
        >
          <LogOut className="h-4 w-4" />
          {text.logout}
        </button>
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
                  receiveLabel={text.depositFunds}
                  sendLabel={text.withdrawFunds}
                  share="100% policy base"
                />
                {policy.auxiliaryTokens.map((token) => (
                  <AssetTableRow
                    balance={formatTokenAmount(token.balance, token.decimals)}
                    key={token.address}
                    label={token.symbol}
                    onReceive={() => openAssetOperation("deposit", token.address)}
                    onSend={() => openAssetOperation("withdraw", token.address)}
                    receiveLabel={text.depositFunds}
                    sendLabel={text.withdrawFunds}
                    share={shortAddress(token.address)}
                  />
                ))}
              </section>
            </>
          )}

          {assetOperation !== "dashboard" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070b]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={assetOperation === "deposit" ? text.depositTitle : text.withdrawTitle}>
              <div className="w-full max-w-sm rounded-[22px] border border-[#334052] bg-[#10151d] p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-[#f5f7fb]">{assetOperation === "deposit" ? text.depositTitle : text.withdrawTitle}</p>
                    <p className="mt-1 text-sm text-[#8d9bb0]">{assetOperation === "deposit" ? text.operationHint : text.withdrawExtraAmount}</p>
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
                <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8d9bb0]">
                  {assetOperation === "deposit" ? text.depositAmount : text.withdrawExtraAmount}
                  <input
                    aria-label={assetOperation === "deposit" ? text.depositAmount : text.withdrawExtraAmount}
                    autoFocus
                    className="mt-2 min-h-12 w-full rounded-lg border border-[#334052] bg-[#0b1018] px-3 text-base font-semibold text-[#f5f7fb] outline-none focus:border-[#5868ea]"
                    max={assetOperation === "withdraw" ? withdrawableBalanceLabel : undefined}
                    min="0"
                    onChange={(event) => tokenAddress ? setTokenAmount(event.target.value) : (assetOperation === "deposit" ? setDepositAmount(event.target.value) : setExtraWithdrawAmount(event.target.value))}
                    step="any"
                    type="number"
                    value={tokenAddress ? tokenAmount : (assetOperation === "deposit" ? depositAmount : extraWithdrawAmount)}
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
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button className="min-h-11 rounded-lg border border-[#334052] bg-[#151d28] px-3 text-sm font-semibold text-[#e6edf8] transition hover:border-[#718299]" onClick={() => setAssetOperation("dashboard")} type="button">
                    {text.cancel}
                  </button>
                  <PolicyActionButton
                    action={assetOperation === "deposit" ? (tokenAddress ? "depositToken" : "deposit") : (tokenAddress ? "withdrawToken" : "withdrawExtra")}
                    disabled={isWorking || (assetOperation === "deposit" ? (tokenAddress ? !canUseTokenVault : !canDeposit) : (tokenAddress ? !canWithdrawToken : !canWithdrawExtra))}
                    icon={assetOperation === "deposit" ? ArrowDownToLine : ArrowUpFromLine}
                    label={assetOperation === "deposit" ? text.depositFunds : text.withdrawFunds}
                    onClick={runAction}
                    workingAction={workingAction}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 rounded-xl border border-[#202936] bg-[#10151d] p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d9bb0]">{text.yieldVault}</p>
              <p className="text-sm font-semibold text-[#f5f7fb]">
                {policy.yieldPositions.length > 0 ? `${policy.yieldPositions.length}` : text.noYieldPositions}
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#8d9bb0]">{text.yieldVaultNote}</p>
            <div className="mt-3 rounded-lg border border-[#283443] bg-[#0b1018] p-3">
              <p className="text-sm font-semibold text-[#f5f7fb]">{text.staticUsdc}</p>
              <p className="mt-1 text-sm text-[#8d9bb0]">
                {text.staticUsdcNote(formatUsdcAmount(policy.totalPrincipal - yieldAllocated))}
              </p>
            </div>

            {policy.yieldPositions.length > 0 && (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {policy.yieldPositions.map((position) => (
                  <div className="rounded-lg border border-[#283443] bg-[#0b1018] p-3" key={position.strategyId}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#f5f7fb]">{position.name}</p>
                        <p className="mt-1 text-xs text-[#8d9bb0]">
                          {text.yieldStrategy} #{position.strategyId}
                        </p>
                      </div>
                      <button
                        className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#334052] bg-[#151d28] px-3 text-xs font-semibold text-[#e6edf8] transition hover:border-[#718299] disabled:opacity-50"
                        disabled={isWorking || status !== 1}
                        onClick={() =>
                          void runAction("withdrawYield", {
                            amount: formatUsdcAmount(position.shares),
                            strategyId: position.strategyId
                          })
                        }
                        type="button"
                      >
                        <HandCoins className="h-4 w-4" />
                        {text.yieldWithdraw}
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <SummaryFact label={text.yieldCostBasis} value={`${formatUsdcAmount(position.costBasis)} USDC`} />
                      <SummaryFact label={text.yieldEstimated} value={`${formatUsdcAmount(position.estimatedAssets)} USDC`} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 grid gap-2 lg:grid-cols-[0.7fr_1fr_auto]">
              <select
                aria-label={text.yieldStrategy}
                className="min-h-11 rounded-lg border border-[#334052] bg-[#0b1018] px-3 text-sm text-[#f5f7fb] outline-none focus:border-[#5868ea]"
                onChange={(event) => setYieldStrategyId(event.target.value)}
                value={yieldStrategyId}
              >
                <option value="">{text.chooseYieldStrategy}</option>
                {availableYieldStrategies.map((strategy) => (
                  <option key={strategy.strategyId} value={strategy.strategyId}>
                    {strategy.name}
                  </option>
                ))}
              </select>
              <input
                aria-label={text.yieldAmount}
                className="min-h-11 rounded-lg border border-[#334052] bg-[#0b1018] px-3 text-sm text-[#f5f7fb] outline-none focus:border-[#5868ea]"
                min="0"
                onChange={(event) => setYieldAmount(event.target.value)}
                step="0.000001"
                type="number"
                value={yieldAmount}
              />
              <PolicyActionButton
                action="depositYield"
                disabled={!canDepositYield || yieldStrategyId === "" || isWorking}
                icon={Percent}
                label={text.yieldDeposit}
                onClick={runAction}
                workingAction={workingAction}
              />
            </div>
          </div>

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

function AssetTableRow({
  balance,
  label,
  onReceive,
  onSend,
  receiveLabel,
  sendLabel,
  share
}: {
  balance: string;
  label: string;
  onReceive: () => void;
  onSend: () => void;
  receiveLabel: string;
  sendLabel: string;
  share: string;
}) {
  return (
    <div className="grid gap-3 border-b border-[#202936] px-5 py-4 last:border-b-0 md:grid-cols-[1.2fr_1fr_0.7fr_auto] md:items-center md:gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#20295b] text-sm font-bold text-[#aeb8ff]">{label.slice(0, 1)}</span>
        <span className="font-semibold text-[#f5f7fb]">{label}</span>
      </div>
      <p className="font-semibold text-[#f5f7fb]">{balance}</p>
      <p className="text-sm text-[#8d9bb0]">{share}</p>
      <div className="flex gap-2 md:justify-end">
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
