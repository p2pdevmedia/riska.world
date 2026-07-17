export type Language = "en" | "es";

const worldIdErrorsEn = {
  cancelled: "Verification was cancelled. No policy slot was reserved.",
  connection_failed: "The connection with World App was interrupted. Check your connection and try again.",
  credential_unavailable:
    "This World App account is not verified as human yet. Finish World ID verification in World App, then return to Riska and try again.",
  failed_by_host_app: "Riska could not accept the proof. Reconnect your wallet session and try again.",
  generic_error: "We could not complete World ID verification. Please try again.",
  identity_attributes_not_matched: "This World ID does not match the proof requirements for a Riska policy.",
  inclusion_proof_failed: "World App could not prepare the proof for this account. Wait a moment and try again.",
  inclusion_proof_pending: "Your World ID proof is still being prepared. Wait a moment and try again.",
  invalid_network: "World ID returned a proof for the wrong network. Please try again from World App.",
  invalid_rp_signature: "Riska's World ID configuration needs attention before verification can continue.",
  malformed_request: "The World ID request could not be read. Please refresh Riska and try again.",
  max_verifications_reached: "This World ID has already been used for this Riska verification.",
  nullifier_replayed: "This World ID has already been reserved for this Riska verification.",
  timeout: "World App took too long to answer. Please try again.",
  unexpected_response: "World App returned an unexpected response. Please update World App and try again.",
  user_rejected: "Verification was cancelled. No policy slot was reserved.",
  verification_rejected: "World App rejected the verification. Make sure your account is verified and try again.",
  wallet_session_required:
    "Connect your wallet again before verifying World ID. In World App this creates the secure Wallet Auth session Riska needs.",
  world_id_3_not_available:
    "This World App account cannot create the required proof yet. Finish verification and try again.",
  world_id_4_not_available:
    "This World App account cannot create the required proof yet. Update World App or finish verification, then try again."
};

const worldIdErrorsEs = {
  cancelled: "Cancelaste la verificación. No se reservó ninguna póliza.",
  connection_failed: "La conexión con World App se interrumpió. Revisa tu conexión e inténtalo de nuevo.",
  credential_unavailable:
    "Esta cuenta de World App todavía no está verificada como humana. Completa la verificación de World ID en World App y vuelve a intentarlo en Riska.",
  failed_by_host_app: "Riska no pudo aceptar la prueba. Vuelve a conectar tu sesión de wallet e inténtalo otra vez.",
  generic_error: "No pudimos completar la verificación de World ID. Inténtalo de nuevo.",
  identity_attributes_not_matched: "Este World ID no cumple los requisitos de prueba para una póliza Riska.",
  inclusion_proof_failed: "World App no pudo preparar la prueba para esta cuenta. Espera un momento e inténtalo de nuevo.",
  inclusion_proof_pending: "Tu prueba de World ID todavía se está preparando. Espera un momento e inténtalo de nuevo.",
  invalid_network: "World ID devolvió una prueba para la red incorrecta. Inténtalo de nuevo desde World App.",
  invalid_rp_signature: "La configuración de World ID de Riska necesita una corrección antes de continuar.",
  malformed_request: "La solicitud de World ID no se pudo leer. Refresca Riska e inténtalo de nuevo.",
  max_verifications_reached: "Este World ID ya fue usado para esta verificación de Riska.",
  nullifier_replayed: "Este World ID ya está reservado para esta verificación de Riska.",
  timeout: "World App tardó demasiado en responder. Inténtalo de nuevo.",
  unexpected_response: "World App devolvió una respuesta inesperada. Actualiza World App e inténtalo de nuevo.",
  user_rejected: "Cancelaste la verificación. No se reservó ninguna póliza.",
  verification_rejected: "World App rechazó la verificación. Asegúrate de que tu cuenta esté verificada e inténtalo de nuevo.",
  wallet_session_required:
    "Vuelve a conectar tu wallet antes de verificar World ID. En World App eso crea la sesión segura de Wallet Auth que Riska necesita.",
  world_id_3_not_available:
    "Esta cuenta de World App todavía no puede crear la prueba requerida. Completa la verificación e inténtalo de nuevo.",
  world_id_4_not_available:
    "Esta cuenta de World App todavía no puede crear la prueba requerida. Actualiza World App o completa la verificación, y vuelve a intentarlo."
};

const contractDocsEn = {
  policyManager: {
    title: "RiskaPolicyManager",
    summary:
      "The active flexible policy manager for opening policies, deposits, partial extra withdrawals, auxiliary token custody, payout activation, holder claims, heartbeat, beneficiary death notice, and death claim.",
    status: "Deployed on World Chain Sepolia for test flows. Not audited for production funds.",
    responsibilities: [
      "Open one policy per holder after app-level World ID verification.",
      "Allocate deposits first to the 10,800 USDC minimum and then to extra principal.",
      "Let holders withdraw extra principal in parts with no fee.",
      "Let holders custody non-USDC ERC20 tokens after the USDC minimum is covered.",
      "Activate 120 monthly payouts once the minimum is funded.",
      "Reset living holder depletion to an active reusable policy.",
      "Cancel pending death reports whenever the holder interacts.",
      "Allow configured beneficiaries to claim after a report plus 12 months without holder interaction."
    ],
    interfaceItems: [
      { name: "openPolicy", description: "Creates the policy, stores beneficiaries, and collects the first 30 USDC unit." },
      { name: "deposit", description: "Adds USDC before payout activation, filling minimum principal first." },
      { name: "activatePayout", description: "Snapshots monthly payout over 120 months once the minimum is funded." },
      { name: "claimMonthly", description: "Pays the next holder payout with no fee." },
      { name: "withdrawExtra", description: "Withdraws part of the extra principal with no fee and reschedules payout if needed." },
      { name: "depositToken", description: "Stores a non-USDC ERC20 token after the USDC minimum is covered; it stays outside payout math and passes 100% to beneficiaries on death settlement." },
      { name: "withdrawToken", description: "Withdraws part of a stored non-USDC ERC20 token with no fee." },
      { name: "claimAll", description: "Withdraws all remaining holder principal, retaining 20% only from remaining minimum principal, and keeps the policy reusable." },
      { name: "heartbeat", description: "Records life interaction without withdrawing money." },
      { name: "reportDeath", description: "Lets a configured beneficiary start the 12-month notice window." },
      { name: "claimDeath", description: "Pays beneficiaries after the no-interaction window." }
    ],
    safeguards: [
      "New deposits are closed after payout activation; extra withdrawals remain allowed.",
      "Claim-all and death settlement retain 20% only from remaining minimum principal.",
      "Extra principal is never fee-bearing.",
      "Auxiliary tokens never count toward the minimum-principal fee or monthly payout.",
      "Stored auxiliary tokens are paid 100% to beneficiaries on death settlement.",
      "Beneficiary reports cannot be claimed while the holder keeps interacting."
    ],
    sourceNote: "The local source below is the current manager used by the World Chain Sepolia deployment."
  },
  beneficiaryRegistry: {
    title: "RiskaBeneficiaryRegistry",
    summary: "Stores beneficiary wallets and allocation shares for each policy.",
    status: "Deployed on World Chain Sepolia and writable only by the policy manager.",
    responsibilities: [
      "Store beneficiary accounts and basis-point allocations.",
      "Reject empty, duplicate, zero-address, or oversized beneficiary sets.",
      "Require total beneficiary shares to equal 100%."
    ],
    interfaceItems: [
      { name: "setPolicyManager", description: "Sets the only contract authorized to write records." },
      { name: "setBeneficiaries", description: "Writes beneficiary accounts and share percentages." },
      { name: "beneficiaryCount", description: "Returns beneficiary count for a policy." },
      { name: "beneficiaryAt", description: "Returns a beneficiary wallet and share by index." }
    ],
    safeguards: [
      "Only the configured policy manager can write.",
      "At most eight beneficiaries per policy.",
      "Shares must add up to exactly 10,000 basis points."
    ],
    sourceNote: "The local source below is used in the current Sepolia deployment."
  },
  premiumVault: {
    title: "RiskaPremiumVault",
    summary: "USDC and auxiliary ERC20 custody module for deposits, holder payouts, beneficiary payouts, and protocol reserve accounting.",
    status: "Deployed on World Chain Sepolia and callable only by the policy manager.",
    responsibilities: [
      "Collect USDC deposits from holders.",
      "Track total principal liability.",
      "Track auxiliary token liabilities by token address.",
      "Pay holder monthly claims, partial extra withdrawals, auxiliary token withdrawals, and claim-all payouts.",
      "Pay beneficiaries according to registry shares.",
      "Track retained claim-all and death fees as protocol reserve."
    ],
    interfaceItems: [
      { name: "collectPremium", description: "Collects USDC from a holder and increases principal liability." },
      { name: "payHolder", description: "Releases no-fee monthly and partial-withdrawal principal to the holder." },
      { name: "settleHolderClaimAll", description: "Releases claim-all payout and accounts the 20% retained fee on remaining minimum principal." },
      { name: "settleBeneficiaryPayout", description: "Releases beneficiary payout and accounts retained reserve." },
      { name: "collectAuxiliaryToken", description: "Collects a non-USDC ERC20 token for policy custody outside payout and fee math." },
      { name: "payAuxiliaryTokenHolder", description: "Releases a stored auxiliary token back to the holder." },
      { name: "settleAuxiliaryTokenBeneficiaries", description: "Pays stored auxiliary token balances to beneficiaries with no fee." }
    ],
    safeguards: [
      "Only the policy manager can move funds.",
      "Payouts cannot exceed tracked liability.",
      "Auxiliary token payouts cannot exceed tracked token liability.",
      "Protocol reserve is accounted but not withdrawable in this version."
    ],
    sourceNote: "The local source below is used in the current Sepolia deployment."
  }
};

const contractDocsEs = {
  policyManager: {
    title: "RiskaPolicyManager",
    summary:
      "Manager flexible activo para abrir pólizas, depositar, retirar extra en partes, custodiar tokens auxiliares, activar pagos, cobrar, enviar heartbeat, reportar fallecimiento y liquidar beneficiarios.",
    status: "Desplegado en World Chain Sepolia para pruebas. No auditado para fondos productivos.",
    responsibilities: [
      "Abrir una póliza por titular después de la verificación World ID en la app.",
      "Asignar depósitos primero al mínimo de 10,800 USDC y luego a principal extra.",
      "Permitir retiros parciales del principal extra sin comisión.",
      "Permitir custodia de tokens ERC20 no-USDC cuando el mínimo USDC está cubierto.",
      "Activar 120 pagos mensuales cuando el mínimo está fondeado.",
      "Reiniciar una póliza vaciada por un titular vivo para que pueda volver a usarse.",
      "Cancelar reportes de fallecimiento pendientes cada vez que el titular interactúa.",
      "Permitir que los beneficiarios configurados cobren tras un reporte y 12 meses sin interacción del titular."
    ],
    interfaceItems: [
      { name: "openPolicy", description: "Crea la póliza, guarda beneficiarios y cobra la primera unidad de 30 USDC." },
      { name: "deposit", description: "Agrega USDC antes de activar pagos, cubriendo primero el mínimo." },
      { name: "activatePayout", description: "Fija el pago mensual sobre 120 meses cuando el mínimo está fondeado." },
      { name: "claimMonthly", description: "Paga el siguiente mes al titular sin comisión." },
      { name: "withdrawExtra", description: "Retira parte del principal extra sin comisión y reprograma pagos si hace falta." },
      { name: "depositToken", description: "Guarda un token ERC20 no-USDC tras cubrir el mínimo USDC; queda fuera del cálculo mensual y pasa 100% a beneficiarios en la liquidación por fallecimiento." },
      { name: "withdrawToken", description: "Retira parte de un token ERC20 guardado sin comisión." },
      { name: "claimAll", description: "Retira todo el principal restante, reteniendo 20% solo del mínimo restante, y deja la póliza reutilizable." },
      { name: "heartbeat", description: "Registra prueba de vida sin retirar dinero." },
      { name: "reportDeath", description: "Permite que un beneficiario configurado inicie la ventana de 12 meses." },
      { name: "claimDeath", description: "Paga a los beneficiarios tras la ventana sin interacción." }
    ],
    safeguards: [
      "Los depósitos nuevos se cierran tras activar pagos; los retiros de extra siguen permitidos.",
      "El retiro total y la liquidación por fallecimiento retienen 20% solo del mínimo restante.",
      "El principal extra nunca paga comisión.",
      "Los tokens auxiliares no cuentan para la comisión sobre el mínimo ni para el pago mensual.",
      "Los tokens auxiliares guardados se pagan 100% a beneficiarios en la liquidación por fallecimiento.",
      "Los reportes de beneficiarios no pueden cobrarse si el titular sigue interactuando."
    ],
    sourceNote: "El código local de abajo es el manager actual usado en Sepolia."
  },
  beneficiaryRegistry: {
    title: "RiskaBeneficiaryRegistry",
    summary: "Guarda las wallets de los beneficiarios y sus porcentajes para cada póliza.",
    status: "Desplegado en World Chain Sepolia y escribible solo por el policy manager.",
    responsibilities: [
      "Guardar cuentas y asignaciones en basis points.",
      "Rechazar conjuntos vacíos, duplicados, con dirección cero o demasiado grandes.",
      "Exigir que los porcentajes sumen 100%."
    ],
    interfaceItems: [
      { name: "setPolicyManager", description: "Define el único contrato autorizado a escribir." },
      { name: "setBeneficiaries", description: "Guarda cuentas y porcentajes." },
      { name: "beneficiaryCount", description: "Devuelve la cantidad de beneficiarios." },
      { name: "beneficiaryAt", description: "Devuelve la wallet y el porcentaje por índice." }
    ],
    safeguards: [
      "Solo escribe el manager configurado.",
      "Máximo ocho beneficiarios por póliza.",
      "Las asignaciones deben sumar exactamente 10,000 basis points."
    ],
    sourceNote: "El código local de abajo se usa en el despliegue actual de Sepolia."
  },
  premiumVault: {
    title: "RiskaPremiumVault",
    summary: "Custodia USDC y tokens ERC20 auxiliares para depósitos, pagos al titular, pagos a beneficiarios y reserva del protocolo.",
    status: "Desplegado en World Chain Sepolia y llamable solo por el policy manager.",
    responsibilities: [
      "Cobrar depósitos USDC de los titulares.",
      "Rastrear el pasivo total de principal.",
      "Rastrear el pasivo de tokens auxiliares por dirección de token.",
      "Pagar cobros mensuales, retiros parciales de extra, retiros de tokens auxiliares y retiro total al titular.",
      "Pagar a los beneficiarios según los porcentajes del registry.",
      "Registrar como reserva las comisiones retenidas de retiro total y fallecimiento."
    ],
    interfaceItems: [
      { name: "collectPremium", description: "Cobra USDC y aumenta el pasivo de principal." },
      { name: "payHolder", description: "Libera principal sin comisión por cobros mensuales y retiros parciales al titular." },
      { name: "settleHolderClaimAll", description: "Libera el retiro total y contabiliza el 20% retenido sobre el mínimo restante." },
      { name: "settleBeneficiaryPayout", description: "Libera el pago a beneficiarios y contabiliza la reserva retenida." },
      { name: "collectAuxiliaryToken", description: "Cobra un token ERC20 no-USDC para custodia de la póliza, fuera del cálculo de pago y comisión." },
      { name: "payAuxiliaryTokenHolder", description: "Libera un token auxiliar guardado de vuelta al titular." },
      { name: "settleAuxiliaryTokenBeneficiaries", description: "Paga los tokens auxiliares guardados a los beneficiarios sin comisión." }
    ],
    safeguards: [
      "Solo el policy manager puede mover fondos.",
      "Los pagos no pueden superar el pasivo registrado.",
      "Los pagos de tokens auxiliares no pueden superar el pasivo registrado por token.",
      "La reserva del protocolo está contabilizada pero no es retirable en esta versión."
    ],
    sourceNote: "El código local de abajo se usa en el despliegue actual de Sepolia."
  }
};

export const dictionaries = {
  en: {
    metadata: {
      title: "Riska.world - Flexible protection for verified humans",
      description:
        "Riska lets verified humans open a flexible USDC policy, fund a 10,800 USDC minimum, withdraw extra principal in parts, custody other ERC20 tokens, and use heartbeat-based beneficiary protection."
    },
    navbar: {
      brand: "RISKA",
      links: [
        { href: "/apply", label: "Enroll" },
        { href: "/rules", label: "Policy rules" },
        { href: "/whitepaper", label: "White paper" },
        { href: "/docs", label: "Contracts" }
      ],
      cta: "Start",
      languageToggle: { label: "ES", ariaLabel: "Switch to Spanish" }
    },
    hero: {
      badge: "Riska 30 · Flexible USDC policy",
      title: "Any verified human can open a policy.",
      description:
        "Fund the 10,800 USDC minimum over time or upfront. Extra deposits increase future monthly payout and can be withdrawn in parts. After the USDC minimum is covered, other ERC20 tokens can be stored with no Riska fee and pass fully to beneficiaries on death settlement.",
      chips: [
        "10,800 USDC minimum",
        "30 USDC base unit",
        "120 monthly payouts",
        "Heartbeat death-flow guard"
      ]
    },
    impactMetrics: {
      title: "Product rules",
      subtitle: "One policy account, visible balances, and clear holder or beneficiary outcomes.",
      body:
        "Deposits fill the minimum first, partial extra and auxiliary token withdrawals have no fee, and claim-all or death fees touch only remaining minimum principal. Stored auxiliary tokens pass 100% to beneficiaries.",
      metrics: [
        { label: "Minimum policy", value: "10,800 USDC" },
        { label: "Base unit", value: "30 USDC" },
        { label: "Payout duration", value: "120 months" },
        { label: "Death notice", value: "12 months" },
        { label: "Extra principal", value: "No fee" },
        { label: "User identity", value: "Verified human" }
      ]
    },
    aboutSections: {
      sections: [
        {
          title: "Flexible policy account",
          description: "A verified holder opens one policy and funds the minimum at their own pace.",
          points: [
            "Any verified human can open a policy",
            "The terms hash is linked to the policy",
            "Minimum and extra principal are visible separately"
          ]
        },
        {
          title: "Holder-controlled payout",
          description: "Once the minimum is funded, the holder decides when to start or withdraw.",
          points: [
            "Activate 120 monthly payments",
            "Withdraw extra principal in parts without fee",
            "Store other ERC20 tokens after the USDC minimum",
            "Claim all with a minimum-only fee",
            "Use heartbeat to prove life without claiming that month"
          ]
        },
        {
          title: "Beneficiary notice flow",
          description: "Beneficiaries use a report-and-wait path instead of a hidden manual gate.",
          points: [
            "Only configured beneficiaries can report",
            "Death claim waits 12 months after report",
            "Stored ERC20 tokens pass fully to beneficiaries",
            "Any holder interaction cancels the report"
          ]
        }
      ]
    },
    valueGrid: {
      title: "Contract components",
      subtitle: "The protocol separates identity, beneficiaries, principal accounting, and payout rules.",
      values: [
        {
          title: "Electronic policy terms",
          description: "A signed policy document defines deposits, beneficiaries, heartbeat, payout rights, and the death-notice window."
        },
        {
          title: "Minimum and extra principal",
          description: "The first 10,800 USDC funds the minimum. Anything above it is extra principal, and other ERC20 tokens can be stored separately after the minimum is covered."
        },
        {
          title: "Holder payout",
          description: "After the minimum is funded, the holder can activate 120 monthly payments, withdraw extra principal in parts, or claim all remaining principal with the minimum-only fee."
        },
        {
          title: "Beneficiary payout",
          description: "Beneficiaries receive extra principal, 100% of stored auxiliary tokens, and 80% of remaining minimum principal after the no-interaction window."
        },
        {
          title: "Verified access",
          description: "World ID reduces duplicate policy abuse while keeping biometric data outside Riska."
        }
      ]
    },
    retirementProduct: {
      badge: "Riska 30 contract",
      title: "A policy account that can become programmed income.",
      subtitle:
        "The minimum policy is 10,800 USDC. Once funded, the holder can activate 120 monthly payments, store other ERC20 tokens, withdraw extra in parts, claim all with a minimum-only fee, or keep interacting with heartbeat. Stored ERC20 tokens pass 100% to beneficiaries on death settlement.",
      timelineTitle: "Policy lifecycle",
      timeline: [
        { label: "Open", description: "Verify as human, configure beneficiaries, accept terms, and pay the first 30 USDC unit." },
        { label: "Fund", description: "Deposit any amount before payout activation; the minimum fills first and extra principal follows." },
        { label: "Choose payout", description: "Activate monthly payout, custody other tokens, withdraw extra in parts, or claim all principal with the minimum-only fee once the minimum is funded. Custodied tokens pass 100% to beneficiaries on death settlement." },
        { label: "Beneficiary notice", description: "A beneficiary report plus 12 months without holder interaction can unlock death settlement." }
      ],
      economicsTitle: "Policy economics",
      economics: [
        {
          label: "Minimum principal",
          value: "10,800 USDC",
          description: "The base amount required before holder payout can be activated."
        },
        {
          label: "Extra principal",
          value: "No fee",
          description: "Extra deposits increase monthly payout, can be withdrawn in parts, and pass fully to beneficiaries if death settlement happens."
        },
        {
          label: "Auxiliary tokens",
          value: "100% to beneficiaries",
          description: "Non-USDC ERC20 balances stay outside payout math, have no fee, and pass fully to beneficiaries on death settlement."
        },
        {
          label: "Claim-all/death fee",
          value: "20% of minimum",
          description: "Charged only against remaining minimum principal during claim-all or death settlement."
        }
      ],
      contractNote:
        "The current testnet contracts implement the flexible policy flow. Production still requires legal clearance, external audit, multisig/timelock, and monitoring."
    },
    contracts: {
      title: "Protocol contracts",
      subtitle: "Riska's current modules are deployed on World Chain Sepolia for test flows.",
      addressLabel: "Contract address",
      pendingLabel: "Pending deployment",
      explorerLabel: "View on explorer",
      docsLabel: "Read docs",
      items: [
        { id: "policyManager", name: "PolicyManager", description: "Active flexible policy lifecycle and payout manager." },
        { id: "beneficiaryRegistry", name: "BeneficiaryRegistry", description: "Stores beneficiary wallets and allocation shares." },
        { id: "premiumVault", name: "PremiumVault", description: "Holds USDC and auxiliary ERC20 tokens, then releases holder or beneficiary payouts." }
      ]
    },
    contractDetail: {
      backLabel: "Back to contracts",
      eyebrow: "Contract documentation",
      addressLabel: "Contract address",
      pendingAddressLabel: "Pending deployment",
      networkLabel: "Network",
      statusLabel: "Status",
      explorerLabel: "View on explorer",
      responsibilitiesTitle: "Responsibilities",
      interfaceTitle: "Interface map",
      safeguardsTitle: "Risk controls",
      sourceTitle: "Contract source",
      sourceIncludedLabel: "Source included in this site",
      sourcePendingLabel: "Source import pending"
    },
    contractDocs: contractDocsEn,
    docsPage: {
      metadata: {
        title: "Riska protocol docs",
        description: "Review deployed contracts, internal documentation, and integration entry points for Riska."
      },
      hero: {
        badge: "Documentation",
        title: "Build with the Riska protocol",
        description: "Explore contract addresses, integration resources, and references for partners shipping on World Chain.",
        primaryCta: "View contract addresses",
        secondaryCta: "Open white paper"
      }
    },
    techStack: {
      title: "Operational safeguards",
      subtitle: "Security practices minimize trust, limit data exposure, and keep every decision auditable.",
      stack: [
        { title: "Minimize trust", description: "Contracts keep privileged actions small and explicit." },
        { title: "Data minimization", description: "Only necessary references live on-chain while sensitive evidence stays off-chain." },
        { title: "Auditability", description: "Deposits, heartbeats, notices, claims, and payouts emit reviewable events." },
        { title: "Governance", description: "Production admin should use multisig, timelock, monitoring, and clear roles." }
      ]
    },
    callToAction: {
      title: "Download the Riska 30 white paper",
      subtitle: "Prepared for grant review: product thesis, World Chain alignment, lifecycle, roadmap, and risk boundaries.",
      primary: "Open white paper",
      secondary: "Contact Riska Foundation"
    },
    footer: {
      note: "© {year} riska.world · Flexible protection for verified humans.",
      worldChain: "World Chain",
      email: "hey@riska.world"
    },
    walletAuth: {
      heading: "Riska 30 console",
      description:
        "Sign in through World App to review policy state, beneficiary settings, minimum funding, extra principal, heartbeat, and payout actions.",
      miniApp: {
        label: "Mini App bridge",
        checking: "Checking World App context...",
        installed: "World App detected. Wallet Auth will be verified on the Riska backend.",
        browserFallback: "Browser mode active. Use the web wallet fallback for local review."
      },
      statusLabel: "Status",
      status: {
        connected: (address: string) => `Session connected: ${address}`,
        connecting: "Connecting...",
        disconnected: "Not connected"
      },
      chainId: (chainId: number) => `Network: ${chainId}`,
      mode: { "world-app": "World App", browser: "Browser wallet" },
      actions: {
        connectWorldApp: "Sign in with World App",
        connectBrowser: "Connect browser wallet",
        connecting: "Connecting...",
        disconnect: "Disconnect"
      },
      messages: {
        welcome: "Welcome to Riska 30. Wallet Auth is ready for the next onboarding step.",
        disconnected: "Session closed. Reconnect to manage policies, beneficiaries, heartbeat, and payout actions.",
        error: "Unable to connect the wallet.",
        nonceError: "Unable to prepare the Wallet Auth nonce.",
        verifyError: "Unable to verify the Wallet Auth signature.",
        worldAppRequired: "Open Riska inside World App to use Mini App Wallet Auth."
      }
    },
    worldIdGate: {
      heading: "One human, one policy",
      description:
        "Verify your identity with World ID before activating a policy. Riska records your verification so the same person cannot reserve a second policy.",
      statusLabel: "World ID",
      statuses: {
        locked: "Connect a wallet first so the proof can be bound to that address.",
        ready: "Ready to verify your identity with World ID.",
        loading: "Preparing World ID request...",
        verified: "Identity verified. This wallet can continue to beneficiary setup.",
        error: "World ID verification needs attention.",
        notConfigured: "World ID is not configured. Contact support."
      },
      action: "Verify I am human",
      actionLoading: "Preparing proof...",
      walletRequired: "Connect your wallet before verifying with World ID.",
      configMissing: "World ID is not configured. Contact support.",
      signatureError: "Unable to prepare the verification request.",
      verifyError: "Unable to verify the World ID proof.",
      duplicateError: "This verified human is already reserved for a Riska policy.",
      errorPrefix: "Verification error:",
      errors: worldIdErrorsEn as Record<string, string>,
      signalLabel: (signal: string) => `Signal: ${signal}`,
      proofLabel: (proofId: string) => `Verified: ${proofId}`
    },
    whitepaper: {
      metadata: {
        title: "Riska Whitepaper - Flexible Protection and Programmed Income",
        description:
          "Explore how Riska combines World ID, flexible USDC deposits, heartbeat, beneficiary notice, and programmed holder payouts."
      },
      header: {
        badge: "Riska Foundation",
        title: "Riska: Flexible Protection and Programmed Income",
        date: "May 2026"
      },
      download: {
        label: "Download white paper v2",
        note: "Prepared for World Chain grant review: flexible policy thesis, contract lifecycle, milestones, and risk scope."
      },
      abstract: {
        title: "Abstract",
        paragraphs: [
          "Riska 30 is a flexible USDC policy account for World ID verified humans. The holder funds a 10,800 USDC minimum over time or upfront, and any extra principal increases future monthly payout while remaining withdrawable in parts.",
          "After the USDC minimum is covered, the holder can store non-USDC ERC20 tokens in the policy. Those auxiliary tokens do not affect monthly payout, never pay a Riska fee, and pass 100% to beneficiaries if death settlement happens.",
          "Beneficiaries can claim only after a death report plus 12 months without holder interaction. A heartbeat, deposit, auxiliary token action, beneficiary update, monthly claim, or claim-all cancels the pending report."
        ]
      },
      introduction: {
        title: "1. Introduction",
        paragraphs: [
          "Riska makes policy state, deposit allocation, beneficiary rights, heartbeat, and payout rules inspectable.",
          "The launch model is intentionally scoped: no hidden eligibility step, no opaque death gate, no fee on monthly or partial holder withdrawals, and a published minimum-only fee for claim-all."
        ],
        goalsTitle: "Design Goals",
        goals: [
          "Let any verified human open one policy.",
          "Separate minimum principal from extra principal.",
          "Give holders no-fee monthly payout, partial extra withdrawal, auxiliary token custody, minimum-fee claim-all, and heartbeat actions.",
          "Give beneficiaries a transparent report-and-wait path.",
          "Keep legal terms versioned through document hashes."
        ]
      },
      systemOverview: {
        title: "2. System Overview",
        paragraphs: [
          "The policy manager stores holder, terms hash, payout count, timestamps, minimum principal, extra principal, and status.",
          "The vault holds USDC and auxiliary ERC20 tokens, tracks total principal liability, and accounts retained claim-all or death fees as protocol reserve.",
          "The beneficiary registry stores recipient wallets and basis-point shares."
        ],
        everydayIntuition: {
          title: "Everyday Intuition",
          body: "The holder can keep funding, start income after the minimum is funded, store other ERC20 tokens, withdraw extra in parts, withdraw all principal, or simply heartbeat to say they are alive. If death settlement happens, stored auxiliary tokens pass 100% to beneficiaries."
        }
      },
      userLifecycle: {
        title: "3. How It Works",
        steps: [
          { label: "Verify identity.", description: "Authenticate with Wallet Auth and World ID before continuing." },
          { label: "Set beneficiaries.", description: "Choose wallets and percentages that sum to 100%." },
          { label: "Open policy.", description: "Accept terms and pay the first 30 USDC testnet unit." },
          { label: "Fund or withdraw.", description: "Deposit before payout activation, store auxiliary tokens after the USDC minimum, then activate monthly payout, withdraw extra in parts, or claim all with the minimum-only fee. Auxiliary tokens pass 100% to beneficiaries on death settlement." },
          { label: "Heartbeat.", description: "Interact without withdrawing to cancel a pending death notice." }
        ],
        examples: {
          title: "Concrete Examples",
          items: [
            { label: "Minimum funded:", description: "A holder with 10,800 USDC can activate 120 baseline payments." },
            { label: "Extra principal:", description: "A holder with 12,000 USDC gets a higher monthly estimate and can withdraw part of the extra." },
            { label: "Auxiliary tokens:", description: "A holder can store another ERC20 after the USDC minimum, without changing payout math or adding a fee." },
            { label: "Death claim:", description: "Beneficiaries receive extra principal, 100% of auxiliary tokens, plus 80% of the remaining minimum." },
            { label: "False report:", description: "A holder heartbeat cancels the report immediately." }
          ]
        }
      },
      capital: {
        title: "4. Principal, Fees, and Solvency",
        paragraphs: [
          "Minimum principal and extra principal are policy liabilities until paid to the holder or beneficiaries.",
          "Claim-all and death settlement retain 20% of remaining minimum principal only. Extra principal and auxiliary tokens are not fee-bearing, so stored auxiliary tokens pass fully to beneficiaries."
        ],
        example: {
          title: "Base Example",
          body: "A policy with 10,800 USDC minimum and 1,000 USDC extra pays 9,640 USDC to beneficiaries and retains 2,160 USDC as protocol reserve."
        }
      },
      eventVerification: {
        title: "5. Beneficiary Notice",
        paragraphs: [
          "A configured beneficiary can report death only after the policy has existed for 12 months. The report starts a second 12-month window. If the holder interacts, the report is cancelled."
        ],
        plainLanguage: {
          title: "Plain-Language View",
          body: "A report does not pay immediately. The holder has a long, simple window to prove life by interacting."
        }
      },
      claims: {
        title: "6. Holder and Beneficiary Claims",
        paragraphs: [
          "Holder monthly claims, partial extra withdrawals, and auxiliary token withdrawals have no fee. Claim-all retains 20% only from remaining minimum principal.",
          "Beneficiary death claims pay according to beneficiary shares after the no-interaction window. Stored non-USDC ERC20 balances are distributed 100% to beneficiaries with no protocol fee."
        ]
      },
      incentives: {
        title: "7. Economic Incentives and Capital Flow",
        intro: "RISKA should support reliability, governance, and partner distribution without distracting from the principal promise.",
        points: [
          { label: "Riska Foundation:", description: "Initially manages parameters, upgrades, and partner access." },
          { label: "Policyholders:", description: "Fund the policy and control payout or heartbeat actions." },
          { label: "Beneficiaries:", description: "Can report and claim only through the published delay." }
        ],
        feeParagraph:
          "Protocol economics should be explicit. In claim-all and death settlement, the fee base is only remaining minimum principal.",
        example: {
          title: "Governance Posture",
          body: "Production admin should use multisig, timelock, public events, and a clear decentralization path."
        }
      },
      governance: {
        title: "8. Yield Risk and Governance",
        paragraphs: [
          "Yield strategies are future work and must be separated from principal liabilities.",
          "Production governance should control strategy allowlists, caps, upgrades, fee routing, and emergency actions."
        ]
      },
      security: {
        title: "9. Security Model",
        points: [
          { label: "Access control:", description: "Only the policy manager can move vault funds." },
          { label: "Data minimization:", description: "Sensitive evidence stays off-chain." },
          { label: "Human verification:", description: "World ID enforces one verified human per policy in the app flow." },
          { label: "Auditability:", description: "Deposits, notices, heartbeats, and payouts emit public events." }
        ]
      },
      applications: {
        title: "10. Practical Applications",
        paragraphs: [
          "Riska 30 serves people who want transparent family protection and optional programmed income.",
          "Communities and employers can sponsor deposits for verified members while policy state remains auditable."
        ]
      },
      faq: {
        title: "11. FAQ",
        items: [
          { question: "Who can open a policy?", answer: "Any World ID verified human in the supported flow." },
          { question: "When can the holder start payout?", answer: "After the 10,800 USDC minimum is fully funded." },
          { question: "Do extra deposits or other tokens pay a fee?", answer: "No. Extra principal and auxiliary ERC20 tokens are not fee-bearing, can be withdrawn in parts by the holder, and pass 100% to beneficiaries on death settlement." },
          { question: "Who can report death?", answer: "Only a configured beneficiary." },
          { question: "Is this a public insurance launch?", answer: "No. Real-money production needs legal clearance and external audit." }
        ]
      },
      conclusion: {
        title: "12. Conclusion",
        paragraphs: [
          "Riska replaces vague long-term promises with explicit policy balances, reusable holder controls, beneficiary notice, and auditable settlement."
        ]
      },
      references: {
        title: "References",
        items: [
          "World Foundation Grants, https://world.org/grants",
          "World Developer Docs, World ID, https://docs.world.org/world-id",
          "World Developer Docs, Mini Apps, https://docs.world.org/mini-apps"
        ]
      }
    }
  },
  es: {
    metadata: {
      title: "Riska.world - Protección flexible para humanos verificados",
      description:
        "Riska permite que humanos verificados abran una póliza USDC flexible, fondeen un mínimo de 10,800 USDC, retiren el extra en partes, guarden otros tokens ERC20 y protejan a sus beneficiarios con un mecanismo de prueba de vida."
    },
    navbar: {
      brand: "RISKA",
      links: [
        { href: "/apply", label: "Inscripción" },
        { href: "/rules", label: "Reglas" },
        { href: "/whitepaper", label: "White paper" },
        { href: "/docs", label: "Contratos" }
      ],
      cta: "Empezar",
      languageToggle: { label: "EN", ariaLabel: "Switch to English" }
    },
    hero: {
      badge: "Riska 30 · Póliza USDC flexible",
      title: "Cualquier humano verificado puede abrir una póliza.",
      description:
        "Fondea el mínimo de 10,800 USDC poco a poco o de una sola vez. Los depósitos extra aumentan tu pago mensual futuro y puedes retirarlos en partes. Una vez cubierto el mínimo, puedes guardar otros tokens ERC20 sin comisión de Riska; si se liquida la póliza, pasan completos a tus beneficiarios.",
      chips: [
        "Mínimo 10,800 USDC",
        "Unidad base 30 USDC",
        "120 pagos mensuales",
        "Prueba de vida contra reportes falsos"
      ]
    },
    impactMetrics: {
      title: "Reglas del producto",
      subtitle: "Una sola cuenta de póliza, saldos a la vista y resultados claros.",
      body:
        "Los depósitos cubren primero el mínimo. Retirar el extra o tus tokens auxiliares no tiene comisión, y solo el retiro total o la liquidación por fallecimiento tocan el mínimo restante. Los tokens auxiliares guardados pasan 100% a tus beneficiarios.",
      metrics: [
        { label: "Póliza mínima", value: "10,800 USDC" },
        { label: "Unidad base", value: "30 USDC" },
        { label: "Duración de pagos", value: "120 meses" },
        { label: "Aviso de fallecimiento", value: "12 meses" },
        { label: "Principal extra", value: "Sin comisión" },
        { label: "Identidad", value: "Humano verificado" }
      ]
    },
    aboutSections: {
      sections: [
        {
          title: "Cuenta de póliza flexible",
          description: "Un titular verificado abre una póliza y fondea el mínimo a su ritmo.",
          points: [
            "Cualquier humano verificado puede abrirla",
            "El hash de los términos queda vinculado a la póliza",
            "El mínimo y el extra se muestran por separado"
          ]
        },
        {
          title: "Pagos que controla el titular",
          description: "Con el mínimo fondeado, el titular decide si cobra o espera.",
          points: [
            "Activar 120 pagos mensuales",
            "Retirar el extra en partes sin comisión",
            "Guardar otros tokens ERC20 una vez cubierto el mínimo",
            "Retirar todo con comisión solo sobre el mínimo",
            "Usar la prueba de vida sin cobrar ese mes"
          ]
        },
        {
          title: "Aviso de beneficiarios",
          description: "Los beneficiarios usan un flujo de reporte y espera, sin compuertas ocultas.",
          points: [
            "Solo los beneficiarios configurados pueden reportar",
            "El cobro espera 12 meses tras el reporte",
            "Los tokens ERC20 guardados pasan completos a los beneficiarios",
            "Cualquier interacción del titular cancela el reporte"
          ]
        }
      ]
    },
    valueGrid: {
      title: "Componentes del contrato",
      subtitle: "El protocolo separa identidad, beneficiarios, contabilidad del principal y reglas de pago.",
      values: [
        {
          title: "Términos electrónicos",
          description: "El documento firmado define los depósitos, beneficiarios, prueba de vida, derechos de cobro y la ventana de aviso."
        },
        {
          title: "Mínimo y extra",
          description: "Los primeros 10,800 USDC fondean el mínimo. Todo lo que lo supere es principal extra, y otros tokens ERC20 pueden guardarse aparte una vez cubierto el mínimo."
        },
        {
          title: "Pago al titular",
          description: "Con el mínimo fondeado, el titular puede activar 120 pagos mensuales, retirar el extra en partes o retirar todo con comisión solo sobre el mínimo."
        },
        {
          title: "Pago a beneficiarios",
          description: "Los beneficiarios reciben el principal extra, el 100% de los tokens auxiliares guardados y el 80% del mínimo restante tras la ventana sin interacción."
        },
        {
          title: "Acceso verificado",
          description: "World ID reduce el abuso de pólizas duplicadas sin que Riska guarde datos biométricos."
        }
      ]
    },
    retirementProduct: {
      badge: "Contrato Riska 30",
      title: "Una cuenta de póliza que puede convertirse en renta programada.",
      subtitle:
        "La póliza mínima es de 10,800 USDC. Una vez fondeada, el titular puede activar 120 pagos, guardar otros tokens ERC20, retirar el extra en partes, retirar todo con comisión solo sobre el mínimo o seguir enviando prueba de vida. Los tokens ERC20 guardados pasan 100% a los beneficiarios en la liquidación por fallecimiento.",
      timelineTitle: "Ciclo de vida",
      timeline: [
        { label: "Abrir", description: "Verificar tu identidad, configurar beneficiarios, aceptar los términos y pagar la primera unidad de 30 USDC." },
        { label: "Fondear", description: "Depositar cualquier monto antes de activar los pagos; primero se cubre el mínimo y luego el extra." },
        { label: "Elegir cómo cobrar", description: "Con el mínimo fondeado, activar pagos mensuales, guardar otros tokens, retirar el extra en partes o retirar todo el principal con comisión solo sobre el mínimo. Los tokens guardados pasan 100% a los beneficiarios en la liquidación por fallecimiento." },
        { label: "Aviso de beneficiario", description: "Un reporte de beneficiario más 12 meses sin interacción puede habilitar la liquidación." }
      ],
      economicsTitle: "Economía de la póliza",
      economics: [
        { label: "Principal mínimo", value: "10,800 USDC", description: "Base requerida antes de activar el pago al titular." },
        { label: "Principal extra", value: "Sin comisión", description: "Aumenta el pago mensual, puede retirarse en partes y pasa completo a los beneficiarios si hay liquidación." },
        { label: "Tokens auxiliares", value: "100% a beneficiarios", description: "Los tokens ERC20 no-USDC quedan fuera del cálculo mensual, no pagan comisión y pasan completos a los beneficiarios en la liquidación por fallecimiento." },
        { label: "Comisión de retiro total/fallecimiento", value: "20% del mínimo", description: "Se cobra solo sobre el mínimo restante durante el retiro total o la liquidación por fallecimiento." }
      ],
      contractNote:
        "Los contratos de testnet actuales implementan el flujo flexible. La producción requiere aval legal, auditoría externa, multisig/timelock y monitoreo."
    },
    contracts: {
      title: "Contratos del protocolo",
      subtitle: "Los módulos actuales de Riska están desplegados en World Chain Sepolia para pruebas.",
      addressLabel: "Dirección del contrato",
      pendingLabel: "Despliegue pendiente",
      explorerLabel: "Ver en el explorador",
      docsLabel: "Documentación",
      items: [
        { id: "policyManager", name: "PolicyManager", description: "Manager activo del ciclo flexible y de los pagos." },
        { id: "beneficiaryRegistry", name: "BeneficiaryRegistry", description: "Guarda las wallets y los porcentajes de los beneficiarios." },
        { id: "premiumVault", name: "PremiumVault", description: "Custodia USDC y tokens ERC20 auxiliares, y libera los pagos al titular o a los beneficiarios." }
      ]
    },
    contractDetail: {
      backLabel: "Volver a contratos",
      eyebrow: "Documentación del contrato",
      addressLabel: "Dirección del contrato",
      pendingAddressLabel: "Despliegue pendiente",
      networkLabel: "Red",
      statusLabel: "Estado",
      explorerLabel: "Ver en el explorador",
      responsibilitiesTitle: "Responsabilidades",
      interfaceTitle: "Mapa de interfaz",
      safeguardsTitle: "Controles de riesgo",
      sourceTitle: "Código del contrato",
      sourceIncludedLabel: "Código incluido en este sitio",
      sourcePendingLabel: "Importación de código pendiente"
    },
    contractDocs: contractDocsEs,
    docsPage: {
      metadata: {
        title: "Documentación del protocolo Riska",
        description: "Consulta las direcciones de los contratos, la documentación interna y los puntos de integración de Riska."
      },
      hero: {
        badge: "Documentación",
        title: "Construye con el protocolo Riska",
        description: "Explora las direcciones de los contratos, los recursos de integración y las referencias para World Chain.",
        primaryCta: "Ver contratos",
        secondaryCta: "Abrir white paper"
      }
    },
    techStack: {
      title: "Salvaguardas operativas",
      subtitle: "Prácticas de seguridad para minimizar la confianza, limitar los datos y auditar cada decisión.",
      stack: [
        { title: "Minimizar la confianza", description: "Los contratos mantienen las acciones privilegiadas pequeñas y explícitas." },
        { title: "Minimizar los datos", description: "Solo las referencias necesarias viven on-chain; la evidencia sensible queda off-chain." },
        { title: "Auditabilidad", description: "Depósitos, pruebas de vida, avisos, cobros y pagos emiten eventos verificables." },
        { title: "Gobernanza", description: "La producción debe usar multisig, timelock, monitoreo y roles claros." }
      ]
    },
    callToAction: {
      title: "Descarga el white paper de Riska 30",
      subtitle: "Preparado para grants: tesis del producto, alineación con World Chain, ciclo de vida, roadmap y límites de riesgo.",
      primary: "Abrir white paper",
      secondary: "Contactar a la Fundación Riska"
    },
    footer: {
      note: "© {year} riska.world · Protección flexible para humanos verificados.",
      worldChain: "World Chain",
      email: "hey@riska.world"
    },
    walletAuth: {
      heading: "Consola Riska 30",
      description:
        "Inicia sesión desde World App para revisar el estado de tu póliza, los beneficiarios, el mínimo fondeado, el principal extra, la prueba de vida y los pagos.",
      miniApp: {
        label: "Mini App",
        checking: "Detectando contexto de World App...",
        installed: "World App detectada. Wallet Auth se verificará en el backend de Riska.",
        browserFallback: "Modo navegador activo. Usa la wallet web como alternativa para revisión local."
      },
      statusLabel: "Estado",
      status: {
        connected: (address: string) => `Sesión conectada: ${address}`,
        connecting: "Conectando...",
        disconnected: "No conectado"
      },
      chainId: (chainId: number) => `Red: ${chainId}`,
      mode: { "world-app": "World App", browser: "Wallet navegador" },
      actions: {
        connectWorldApp: "Entrar con World App",
        connectBrowser: "Conectar wallet web",
        connecting: "Conectando...",
        disconnect: "Desconectar"
      },
      messages: {
        welcome: "Bienvenido a Riska 30. Wallet Auth está lista para el siguiente paso.",
        disconnected: "Sesión cerrada. Vuelve a conectar para gestionar pólizas, beneficiarios, heartbeat y pagos.",
        error: "No se pudo conectar la wallet.",
        nonceError: "No se pudo preparar la sesión de Wallet Auth.",
        verifyError: "No se pudo verificar la firma de Wallet Auth.",
        worldAppRequired: "Abre Riska dentro de World App para usar Wallet Auth de Mini App."
      }
    },
    worldIdGate: {
      heading: "Un humano, una póliza",
      description:
        "Verifica tu identidad con World ID antes de activar una póliza. Riska registra tu verificación para que el mismo humano no pueda reservar una segunda póliza.",
      statusLabel: "World ID",
      statuses: {
        locked: "Primero conecta una wallet para vincular la prueba a esa dirección.",
        ready: "Listo para pedir una prueba de World ID para esta wallet.",
        loading: "Preparando una solicitud de World ID firmada...",
        verified: "Humano único verificado. Esta wallet puede continuar a beneficiarios.",
        error: "La verificación de World ID necesita atención.",
        notConfigured: "World ID no está configurado. Contacta a soporte."
      },
      action: "Verificar que soy humano",
      actionLoading: "Preparando prueba...",
      walletRequired: "Conecta tu wallet antes de verificar con World ID.",
      configMissing: "World ID no está configurado. Contacta a soporte.",
      signatureError: "No se pudo crear la solicitud de verificación.",
      verifyError: "No se pudo verificar la prueba de World ID.",
      duplicateError: "Este humano verificado ya está reservado para una póliza Riska.",
      errorPrefix: "Error de verificación:",
      errors: worldIdErrorsEs as Record<string, string>,
      signalLabel: (signal: string) => `Señal: ${signal}`,
      proofLabel: (proofId: string) => `Verificado: ${proofId}`
    },
    whitepaper: {
      metadata: {
        title: "Whitepaper Riska - Protección flexible y renta programada",
        description:
          "Explora cómo Riska combina World ID, depósitos USDC flexibles, prueba de vida, aviso de beneficiarios y pagos programados."
      },
      header: {
        badge: "Fundación Riska",
        title: "Riska: Protección flexible y renta programada",
        date: "Mayo 2026"
      },
      download: {
        label: "Descargar white paper v2",
        note: "Preparado para grants en World Chain: tesis flexible, ciclo contractual, hitos y riesgos."
      },
      abstract: {
        title: "Resumen",
        paragraphs: [
          "Riska 30 es una cuenta de póliza USDC flexible para humanos verificados por World ID. El titular fondea un mínimo de 10,800 USDC poco a poco o por adelantado, y el principal extra aumenta el pago mensual futuro sin dejar de ser retirable en partes.",
          "Una vez cubierto el mínimo USDC, el titular puede guardar tokens ERC20 no-USDC en la póliza. Esos tokens auxiliares no cambian el pago mensual, nunca pagan comisión de Riska y pasan 100% a los beneficiarios si hay liquidación por fallecimiento.",
          "Los beneficiarios solo pueden cobrar tras un reporte y 12 meses sin interacción del titular. Una prueba de vida, un depósito, una operación con tokens auxiliares, un cambio de beneficiarios, un cobro mensual o un retiro total cancelan el reporte pendiente."
        ]
      },
      introduction: {
        title: "1. Introducción",
        paragraphs: [
          "Riska hace inspeccionables el estado de la póliza, la asignación de depósitos, los derechos de los beneficiarios, la prueba de vida y las reglas de pago.",
          "El modelo inicial es acotado a propósito: sin pasos ocultos de elegibilidad, sin compuertas opacas de fallecimiento, sin comisión en los cobros mensuales ni en los retiros parciales, y con una comisión publicada solo sobre el mínimo para el retiro total."
        ],
        goalsTitle: "Objetivos de diseño",
        goals: [
          "Permitir que cualquier humano verificado abra una póliza.",
          "Separar el principal mínimo del principal extra.",
          "Dar al titular pagos mensuales sin comisión, retiro parcial del extra, custodia de tokens auxiliares, retiro total con comisión solo sobre el mínimo y prueba de vida.",
          "Dar a los beneficiarios una ruta transparente de reporte y espera.",
          "Versionar los términos legales mediante hashes."
        ]
      },
      systemOverview: {
        title: "2. Visión general",
        paragraphs: [
          "El policy manager guarda el titular, el hash de los términos, la cantidad de pagos, las marcas de tiempo, el mínimo, el extra y el estado.",
          "El vault mantiene el USDC y los tokens ERC20 auxiliares, el pasivo total de principal y, como reserva, las comisiones retenidas del retiro total o del fallecimiento.",
          "El beneficiary registry guarda las wallets receptoras y sus porcentajes en basis points."
        ],
        everydayIntuition: {
          title: "Intuición cotidiana",
          body: "El titular puede seguir fondeando, empezar a cobrar renta cuando el mínimo está listo, guardar otros tokens ERC20, retirar el extra en partes, retirar todo o enviar una prueba de vida para indicar que sigue con vida. Si hay liquidación por fallecimiento, los tokens auxiliares guardados pasan 100% a los beneficiarios."
        }
      },
      userLifecycle: {
        title: "3. Cómo funciona",
        steps: [
          { label: "Verifica tu identidad.", description: "Autentícate con Wallet Auth y World ID antes de continuar." },
          { label: "Define tus beneficiarios.", description: "Elige wallets y porcentajes que sumen 100%." },
          { label: "Abre la póliza.", description: "Acepta los términos y paga la primera unidad de testnet de 30 USDC." },
          { label: "Fondea o retira.", description: "Deposita antes de activar los pagos y guarda tokens auxiliares una vez cubierto el mínimo USDC; luego activa los pagos, retira el extra en partes o retira todo con comisión solo sobre el mínimo. Los tokens auxiliares pasan 100% a los beneficiarios en la liquidación por fallecimiento." },
          { label: "Prueba de vida.", description: "Interactúa sin retirar para cancelar un aviso de fallecimiento pendiente." }
        ],
        examples: {
          title: "Ejemplos concretos",
          items: [
            { label: "Mínimo fondeado:", description: "Un titular con 10,800 USDC puede activar 120 pagos base." },
            { label: "Principal extra:", description: "Un titular con 12,000 USDC obtiene un estimado mensual mayor y puede retirar parte del extra." },
            { label: "Tokens auxiliares:", description: "Un titular puede guardar otro token ERC20 una vez cubierto el mínimo USDC, sin cambiar el pago mensual ni sumar comisión." },
            { label: "Cobro por fallecimiento:", description: "Los beneficiarios reciben el extra, el 100% de los tokens auxiliares y el 80% del mínimo restante." },
            { label: "Reporte falso:", description: "Una prueba de vida del titular cancela el reporte al instante." }
          ]
        }
      },
      capital: {
        title: "4. Principal, comisiones y solvencia",
        paragraphs: [
          "El mínimo y el extra son pasivos de la póliza hasta que se pagan al titular o a los beneficiarios.",
          "El retiro total y la liquidación por fallecimiento retienen el 20% solo del mínimo restante. El principal extra y los tokens auxiliares no pagan comisión, por eso los tokens auxiliares guardados pasan completos a los beneficiarios."
        ],
        example: {
          title: "Ejemplo base",
          body: "Una póliza con 10,800 USDC de mínimo y 1,000 USDC de extra paga 9,640 USDC a los beneficiarios y retiene 2,160 USDC como reserva."
        }
      },
      eventVerification: {
        title: "5. Aviso de beneficiarios",
        paragraphs: [
          "Un beneficiario configurado puede reportar el fallecimiento solo después de que la póliza cumpla 12 meses. El reporte inicia otra ventana de 12 meses. Si el titular interactúa, el reporte se cancela."
        ],
        plainLanguage: {
          title: "Vista simple",
          body: "Un reporte no paga al instante. El titular tiene una ventana amplia y sencilla para probar que sigue con vida con solo interactuar."
        }
      },
      claims: {
        title: "6. Cobros del titular y de los beneficiarios",
        paragraphs: [
          "Los cobros mensuales, los retiros parciales del extra y los retiros de tokens auxiliares no tienen comisión. El retiro total retiene el 20% solo del mínimo restante.",
          "Los cobros de los beneficiarios se pagan según sus porcentajes tras la ventana sin interacción. Los saldos ERC20 no-USDC guardados se distribuyen 100% a los beneficiarios, sin comisión de protocolo."
        ]
      },
      incentives: {
        title: "7. Incentivos y flujo de capital",
        intro: "RISKA debe apoyar la confiabilidad, la gobernanza y la distribución sin distraer de la promesa del principal.",
        points: [
          { label: "Fundación Riska:", description: "Gestiona parámetros, actualizaciones y partners al inicio." },
          { label: "Titulares:", description: "Fondean la póliza y controlan el cobro o la prueba de vida." },
          { label: "Beneficiarios:", description: "Pueden reportar y cobrar solo respetando la demora publicada." }
        ],
        feeParagraph:
          "La economía del protocolo debe ser explícita. En el flujo actual de fallecimiento, la base de la comisión es solo el mínimo restante.",
        example: {
          title: "Postura de gobernanza",
          body: "La producción debe usar multisig, timelock, eventos públicos y un camino claro hacia la descentralización."
        }
      },
      governance: {
        title: "8. Riesgo de yield y gobernanza",
        paragraphs: [
          "Las estrategias de yield son trabajo futuro y deben separarse de los pasivos de principal.",
          "La gobernanza en producción debe controlar allowlists, límites, actualizaciones, ruteo de comisiones y acciones de emergencia."
        ]
      },
      security: {
        title: "9. Modelo de seguridad",
        points: [
          { label: "Acceso:", description: "Solo el policy manager puede mover los fondos del vault." },
          { label: "Datos mínimos:", description: "La evidencia sensible queda off-chain." },
          { label: "Humano verificado:", description: "World ID exige una persona por póliza en el flujo de la app." },
          { label: "Auditabilidad:", description: "Depósitos, avisos, pruebas de vida y pagos emiten eventos públicos." }
        ]
      },
      applications: {
        title: "10. Aplicaciones",
        paragraphs: [
          "Riska 30 sirve a personas que quieren protección familiar transparente y renta programada opcional.",
          "Comunidades y empleadores pueden patrocinar depósitos para miembros verificados manteniendo el estado auditable."
        ]
      },
      faq: {
        title: "11. Preguntas frecuentes",
        items: [
          { question: "¿Quién puede abrir una póliza?", answer: "Cualquier humano verificado por World ID en el flujo soportado." },
          { question: "¿Cuándo puede cobrar el titular?", answer: "Cuando el mínimo de 10,800 USDC está completamente fondeado." },
          { question: "¿El extra u otros tokens pagan comisión?", answer: "No. El principal extra y los tokens ERC20 auxiliares no pagan comisión, el titular puede retirarlos en partes y pasan 100% a los beneficiarios en la liquidación por fallecimiento." },
          { question: "¿Quién puede reportar un fallecimiento?", answer: "Solo un beneficiario configurado." },
          { question: "¿Esto es un lanzamiento público de seguro?", answer: "No. La producción con dinero real requiere aval legal y auditoría externa." }
        ]
      },
      conclusion: {
        title: "12. Conclusión",
        paragraphs: [
          "Riska reemplaza las promesas vagas por saldos explícitos, controles reutilizables del titular, aviso de beneficiarios y liquidación auditable."
        ]
      },
      references: {
        title: "Referencias",
        items: [
          "World Foundation Grants, https://world.org/grants",
          "World Developer Docs, World ID, https://docs.world.org/world-id",
          "World Developer Docs, Mini Apps, https://docs.world.org/mini-apps"
        ]
      }
    }
  }
} as const;

export type Dictionary = (typeof dictionaries)[Language];

export function isLanguage(value: string | null | undefined): value is Language {
  return value === "en" || value === "es";
}
