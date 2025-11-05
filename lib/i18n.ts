import type { ContractId } from "./contracts";

export type Language = "en" | "es";

export type Dictionary = {
  metadata: {
    title: string;
    description: string;
  };
  navbar: {
    brand: string;
    links: { href: string; label: string }[];
    cta: string;
    languageToggle: {
      label: string;
      ariaLabel: string;
    };
  };
  hero: {
    badge: string;
    title: string;
    description: string;
    chips: string[];
  };
  impactMetrics: {
    title: string;
    subtitle: string;
    body: string;
    metrics: { label: string; value: string }[];
  };
  aboutSections: {
    sections: {
      title: string;
      description: string;
      points: string[];
    }[];
  };
  valueGrid: {
    title: string;
    subtitle: string;
    values: {
      title: string;
      description: string;
    }[];
  };
  contracts: {
    title: string;
    subtitle: string;
    addressLabel: string;
    explorerLabel: string;
    docsLabel: string;
    items: {
      id: ContractId;
      name: string;
      description: string;
    }[];
  };
  techStack: {
    title: string;
    subtitle: string;
    stack: {
      title: string;
      description: string;
    }[];
  };
  callToAction: {
    title: string;
    subtitle: string;
    primary: string;
    secondary: string;
  };
  footer: {
    note: string;
    worldChain: string;
    email: string;
  };
  walletAuth: {
    heading: string;
    description: string;
    statusLabel: string;
    status: {
      connected: (address: string) => string;
      connecting: string;
      disconnected: string;
    };
    chainId: (chainId: number) => string;
    actions: {
      connect: string;
      connecting: string;
      disconnect: string;
    };
    messages: {
      welcome: string;
      disconnected: string;
      error: string;
    };
  };
  whitepaper: {
    metadata: {
      title: string;
      description: string;
    };
    header: {
      badge: string;
      title: string;
      date: string;
    };
    abstract: {
      title: string;
      paragraphs: string[];
    };
    introduction: {
      title: string;
      paragraphs: string[];
      goalsTitle: string;
      goals: string[];
    };
    systemOverview: {
      title: string;
      paragraphs: string[];
      everydayIntuition: {
        title: string;
        body: string;
      };
    };
    userLifecycle: {
      title: string;
      steps: { label: string; description: string }[];
      examples: {
        title: string;
        items: { label: string; description: string }[];
      };
    };
    capital: {
      title: string;
      paragraphs: string[];
      example: {
        title: string;
        body: string;
      };
    };
    eventVerification: {
      title: string;
      paragraphs: string[];
      plainLanguage: {
        title: string;
        body: string;
      };
    };
    claims: {
      title: string;
      paragraphs: string[];
    };
    incentives: {
      title: string;
      intro: string;
      points: { label: string; description: string }[];
      feeParagraph: string;
      example: {
        title: string;
        body: string;
      };
    };
    governance: {
      title: string;
      paragraphs: string[];
    };
    security: {
      title: string;
      points: { label: string; description: string }[];
    };
    applications: {
      title: string;
      paragraphs: string[];
    };
    faq: {
      title: string;
      items: { question: string; answer: string }[];
    };
    conclusion: {
      title: string;
      paragraphs: string[];
    };
    references: {
      title: string;
      items: string[];
    };
  };
};

export const dictionaries: Record<Language, Dictionary> = {
  en: {
    metadata: {
      title: "Riska.world – A Peer-to-Peer Insurance System",
      description:
        "Riska presents peer-to-peer insurance where transparent contracts, oracle reports, and the RSK token align incentives for reliable, auditable protection."
    },
    navbar: {
      brand: "riska.world",
      links: [
        { href: "#about", label: "About" },
        { href: "#vision", label: "Vision" },
        { href: "#contracts", label: "Contracts" },
        { href: "#stack", label: "Stack" },
        { href: "/whitepaper", label: "Whitepaper" }
      ],
      cta: "Log in",
      languageToggle: {
        label: "ES",
        ariaLabel: "Switch to Spanish"
      }
    },
    hero: {
      badge: "Riska Foundation · November 2025",
      title: "Peer-to-peer insurance with verifiable triggers.",
      description:
        "Policies, premiums, and payouts execute through deterministic contracts, while independent oracle reports confirm events. Riska makes everyday coverage reliable, auditable, and globally accessible for World Chain verified users with sybil-resistant access.",
      chips: [
        "Transparent contracts",
        "Oracle verification",
        "RSK incentives",
        "World Chain verified users"
      ]
    },
    impactMetrics: {
      title: "Design goals",
      subtitle:
        "Riska removes discretionary bottlenecks by expressing coverage as code and confirming truth via verifiable data feeds.",
      body:
        "Every pool publishes what it covers, how payouts are computed, and which reports confirm events. Participation is open, execution is deterministic, and incentives stay aligned through the RSK economy.",
      metrics: [
        { label: "Capital & coverage", value: "Open participation" },
        { label: "Execution", value: "Deterministic" },
        { label: "Event truth", value: "Objective oracles" },
        { label: "Governance", value: "Transparent" },
        { label: "User identity", value: "World Chain verified" }
      ]
    },
    aboutSections: {
      sections: [
        {
          title: "Public risk pools",
          description:
            "Pools hold capital, publish what they cover, and express policy terms as transparent rules anyone can audit.",
          points: [
            "Policies specify insured sum, coverage window, and trigger",
            "Examples span auto, home, electronics, travel, and logistics",
            "Everyday intuition: a ticket with a clear rule that pays when triggered"
          ]
        },
        {
          title: "User lifecycle",
          description:
            "From selecting a product to automatic settlement, each step follows deterministic logic enforced by oracles.",
          points: [
            "Select product with published terms",
            "Pay premium and receive a timestamped policy",
            "Oracles monitor triggers and execute payouts automatically"
          ]
        },
        {
          title: "Capital discipline",
          description:
            "Premiums cover expected loss, risk margin, and operating fees, while solvency buffers keep pools resilient.",
          points: [
            "Expected loss: E[Li] = qiSi",
            "Premium formula: πi = qiSi + ρi + κi",
            "Capital rule: P ≥ μ + z1−ασ"
          ]
        }
      ]
    },
    valueGrid: {
      title: "System components",
      subtitle:
        "Deterministic contracts, oracle proofs, and token incentives combine to deliver fast, transparent settlements.",
      values: [
        {
          title: "Deterministic contracts",
          description:
            "Policies execute as written, eliminating discretionary approval and keeping rules auditable."
        },
        {
          title: "Oracle reports",
          description:
            "Independent data providers submit signed evidence; matching reports finalize events, disagreements trigger bounded disputes."
        },
        {
          title: "Instant claims",
          description:
            "Once an event is confirmed, payouts settle immediately and disputes rely on published routines."
        },
        {
          title: "RSK economy",
          description:
            "Liquidity providers, data operators, and users align through staking, fees, and deflationary token retirements."
        },
        {
          title: "World Chain verified access",
          description:
            "Users prove they are unique humans through World Chain verification, keeping coverage open while deterring sybil abuse."
        }
      ]
    },
    contracts: {
      title: "Deployed contracts",
      subtitle:
        "Riska's on-chain modules live on World Chain. Edit lib/contracts.ts and this list refreshes instantly.",
      addressLabel: "Contract address",
      explorerLabel: "View on explorer",
      docsLabel: "Read docs",
      items: [
        {
          id: "policyManager",
          name: "PolicyManager",
          description:
            "Issues coverage NFTs, enforces policy lifecycles, and exposes underwriting controls."
        },
        {
          id: "claimsBridge",
          name: "ClaimsBridge",
          description:
            "Receives oracle attestations, validates reports, and routes approved claims to the vault."
        },
        {
          id: "premiumVault",
          name: "PremiumVault",
          description:
            "Holds liquidity, accounts for pool balances, and releases capital for payouts."
        }
      ]
    },
    techStack: {
      title: "Operational safeguards",
      subtitle:
        "Security practices minimize trust, limit data exposure, and keep every decision auditable on-chain.",
      stack: [
        {
          title: "Minimize trust",
          description: "Contracts remain minimal, contain no backdoors, and rely on diverse, bonded oracle sets."
        },
        {
          title: "Data minimization",
          description: "Only necessary references live on-chain while evidence stays off-chain with cryptographic links."
        },
        {
          title: "Auditability",
          description: "Every claim decision—accept, deny, dispute—is recorded for public review and governance oversight."
        },
        {
          title: "Governance",
          description: "RSK holders propose parameter changes with transparent quorums, dispute windows, and fee settings."
        }
      ]
    },
    callToAction: {
      title: "Read the whitepaper",
      subtitle:
        "Explore how capital pools, oracle proofs, and the RSK incentive model deliver reliable, auditable protection.",
      primary: "Open whitepaper",
      secondary: "Contact Riska Foundation"
    },
    footer: {
      note: "© {year} riska.world · Peer-to-peer insurance with verifiable data.",
      worldChain: "World Chain",
      email: "hey@riska.world"
    },
    walletAuth: {
      heading: "Policy console",
      description:
        "Connect a wallet to review policies, monitor oracle events, and track deterministic settlements in real time.",
      statusLabel: "Status",
      status: {
        connected: (address: string) => `Session connected: ${address}`,
        connecting: "Connecting…",
        disconnected: "Not connected"
      },
      chainId: (chainId: number) => `Chain ID: ${chainId}`,
      actions: {
        connect: "Connect wallet",
        connecting: "Connecting…",
        disconnect: "Disconnect"
      },
      messages: {
        welcome: "Welcome to Riska: peer-to-peer insurance enforced by transparent rules.",
        disconnected: "Session closed. Reconnect to manage policies and claims.",
        error: "Unable to connect the wallet."
      }
    },
    whitepaper: {
      metadata: {
        title: "Riska Whitepaper — A Peer-to-Peer Insurance System",
        description:
          "Explore how riska.world delivers transparent, automated coverage with peer-to-peer capital pools, oracle verified events, and the RSK token economy."
      },
      header: {
        badge: "Riska Foundation",
        title: "Riska: A Peer-to-Peer Insurance System",
        date: "November 2025"
      },
      abstract: {
        title: "Abstract",
        paragraphs: [
          "We present a peer-to-peer insurance protocol where everyday risks—car accidents, home damage, electronics failure, travel disruptions—are covered by public rules and verifiable data instead of discretionary processes. Policies, premiums, and payouts are handled by transparent contracts; events are confirmed by independent reports. A native token (RSK) aligns incentives across users, liquidity providers, and data operators with a deflationary fee design, staking for oracle honesty, and on-chain governance. The goal is simple: make protection reliable, auditable, and globally accessible.",
          "Riska integrates World Chain to anchor participation to human-verified accounts. World Chain’s proof-of-personhood brings sybil resistance, lets capital pools price risk knowing each user is unique, and gives regulators a familiar compliance surface while keeping biometric data off-chain."
        ]
      },
      introduction: {
        title: "1. Introduction",
        paragraphs: [
          "Insurance helps when it is easy to buy and reliable to settle. Legacy systems rely on opaque steps and discretionary approval. Riska removes those bottlenecks by expressing coverage as code and event truth as verifiable data feeds. Anyone can read the rules and audit settlements. This mirrors the ethos of electronic cash systems: replace institution-led discretion with transparent, predictable mechanics.",
          "World Chain extends that ethos to identity. By authenticating with a World Chain verified credential, each participant proves they are a unique human without surrendering personal data to the protocol. Pools can open onboarding globally, reduce fraud, and concentrate underwriting capital on genuine households instead of bots."
        ],
        goalsTitle: "Design Goals",
        goals: [
          "Open participation in capital and coverage.",
          "Deterministic execution of policy terms.",
          "Objective event verification.",
          "Clear incentives and governance.",
          "Minimal surface for abuse."
        ]
      },
      systemOverview: {
        title: "2. System Overview",
        paragraphs: [
          "Participants interact through public risk pools. A pool holds capital and publishes what it covers and how payouts are computed. A policy specifies the insured sum S (amount paid on trigger), coverage window T (validity period), and trigger θ (a condition defined by data).",
          "Access is anchored to World Chain verified users. Each policyholder signs transactions with a proof-of-personhood credential, giving pools confidence that incentives target unique humans while preserving pseudonymity on-chain.",
          "Examples include auto collision (police or telematics report), home flood (certified water-level data), electronics failure (service center logs), and travel delay (airline feeds)."
        ],
        everydayIntuition: {
          title: "Everyday Intuition",
          body: "A policy is like a ticket with a clear rule. If the condition happens, it pays. Everyone can see the rule and verify how it is enforced."
        }
      },
      userLifecycle: {
        title: "3. How It Works (User Lifecycle)",
        steps: [
          {
            label: "Verify identity.",
            description: "Authenticate with World Chain to confirm you are a unique human before interacting with pools."
          },
          { label: "Select product.", description: "Choose auto, home, electronics, or travel coverage with published terms." },
          { label: "Pay premium.", description: "The contract issues a timestamped policy for window T." },
          { label: "Data monitoring.", description: "Oracles watch for the trigger θ." },
          { label: "Settlement.", description: "If θ is confirmed within T, payout executes automatically." }
        ],
        examples: {
          title: "Concrete Examples",
          items: [
            {
              label: "Auto:",
              description: "Alice buys collision coverage. If an official accident report is filed in T, the oracle reports it and the policy pays a fixed amount."
            },
            {
              label: "Home:",
              description: "A registered address is paid if certified flood data surpasses a threshold."
            },
            {
              label: "Electronics:",
              description: "A device is paid if sensor or service logs confirm failure within T."
            },
            {
              label: "Travel:",
              description: "A flight policy pays a flat sum when an airline feed confirms a 3h+ delay."
            }
          ]
        }
      },
      capital: {
        title: "4. Capital and Solvency",
        paragraphs: [
          "Pools must stay solvent even in bad months. Premiums should reflect expected payouts plus a buffer. The expected loss for a single policy equals the chance of a claim times the payout amount, E[Li] = qiSi. Across N policies, μ = Σ qiSi. Total premiums must cover this expectation over time.",
          "Premiums include expected loss plus risk margin ρi and operating fees κi: πi = qiSi + ρi + κi. Pools also maintain a solvency buffer so capital P meets P ≥ μ + z1−ασ, keeping insolvency probability below α."
        ],
        example: {
          title: "Illustrative Mini-Example",
          body: "A home-flood product pays $2,000 with q = 2%. Expected payout per policy is $40. If fees and margin total $10, premium is $50. Selling 10,000 policies implies expected payouts of $400k; capital and buffers absorb rare spikes."
        }
      },
      eventVerification: {
        title: "5. Event Verification",
        paragraphs: [
          "Reliable data is essential in parametric insurance. Oracles submit signed reports with event type e, timestamp t, and evidence hash h. The contract waits a short window Δ for multiple reports; if a quorum agrees, the event is confirmed. Conflicts open a bounded dispute."
        ],
        plainLanguage: {
          title: "Plain-Language View",
          body: "Several independent observers describe the same event. When they agree, the claim is paid. When they disagree, the system pauses briefly and resolves it using published rules."
        }
      },
      claims: {
        title: "6. Claims and Disputes",
        paragraphs: [
          "Once verified, payouts execute immediately. If oracles disagree, a dispute window allows re-reporting. Data providers that misreport risk losing posted bonds. All claim decisions are recorded on-chain for audit."
        ]
      },
      incentives: {
        title: "7. Economic Incentives and Capital Flow (RSK)",
        intro: "The RSK token aligns incentives across liquidity providers, data operators, and users.",
        points: [
          {
            label: "Liquidity providers:",
            description: "Supply capital to pools and earn premiums while solvency rules and capacity limits protect their stake."
          },
          {
            label: "Data operators:",
            description: "Stake RSK as bond. Honest reporting earns fees; misconduct risks slashing."
          },
          {
            label: "Users:",
            description: "Pay posted premiums and receive automatic payouts when triggers occur."
          }
        ],
        feeParagraph:
          "A portion of protocol fees buys and retires RSK over time, linking usage to decreasing supply. If total fees in a period are F with fraction β earmarked for retirement, the retired amount is Δretire = βF / P, with P the price of RSK at settlement. Circulating supply updates as St+1 = St − Δretire.",
        example: {
          title: "Worked Example",
          body: "If a pool processes $1,000,000 of premiums with 1% protocol fee (F = $10,000) and β = 0.5, then $5,000 buys and retires RSK. With P = $2, about 2,500 RSK are retired that period."
        }
      },
      governance: {
        title: "8. Risk Calibration and Governance",
        paragraphs: [
          "Pools publish capacity, utilization, and recent claims. Issuance halts when safe limits would be breached. Margin M and target α are set per product type, and correlated risks receive conservative adjustments to ρi.",
          "Governance allows RSK holders to propose parameter changes—quorum, dispute windows, fee fractions—and upgrades with time delays so participants can react. All changes remain on-chain and auditable."
        ]
      },
      security: {
        title: "9. Security Model and Fraud Prevention",
        points: [
          {
            label: "Minimize trust:",
            description: "Contracts are minimal and contain no privileged backdoors. Oracles are diverse and bonded to discourage misbehavior."
          },
          {
            label: "Data minimization:",
            description: "Only necessary policy and claim references live on-chain while evidence remains off-chain with cryptographic proofs."
          },
          {
            label: "Human verification:",
            description: "World Chain proof-of-personhood enforces one-policy-per-person, deterring sybil fraud and mass-claim bots without storing raw biometrics on Riska."
          },
          {
            label: "Auditability:",
            description: "Every decision—accept, deny, dispute—is stored on-chain for public review."
          }
        ]
      },
      applications: {
        title: "10. Practical Applications",
        paragraphs: [
          "The protocol supports coverage for cars, homes, electronics, travel, and logistics. Each product pays when predefined data sources confirm the qualifying event, enabling fast, transparent protection.",
          "People choose Riska for simple rules, few steps, and fast results. Products disclose triggers and data sources up front so buyers know exactly what is covered.",
          "World Chain verification lets community programs or employers sponsor coverage knowing that subsidies reach unique humans, reducing leakage from bots and duplicate identities."
        ]
      },
      faq: {
        title: "11. FAQ",
        items: [
          {
            question: "How are prices set?",
            answer: "By expected payouts plus margin and fees: π = qS + ρ + κ. Pools publish each component."
          },
          {
            question: "What if data feeds fail?",
            answer: "Multiple feeds and a dispute window reduce single-source risk. Operators stake RSK and can be slashed for misconduct."
          },
          {
            question: "Can a pool run out of funds?",
            answer: "Capacity and buffers are enforced by contracts. Issuance halts before unsafe exposure."
          },
          {
            question: "Where does RSK matter day-to-day?",
            answer: "Staking for oracle honesty, governance voting, and deflationary retirement via protocol fees."
          },
          {
            question: "Is this legal insurance?",
            answer: "Riska provides parametric protection: clear triggers, fixed payouts, and transparency. Local compliance varies by jurisdiction and products can be configured accordingly."
          }
        ]
      },
      conclusion: {
        title: "12. Conclusion",
        paragraphs: [
          "Riska replaces friction and discretion with transparent rules and verifiable data. By combining capital pools, objective event proofs, and the RSK incentive model, the protocol aims to make everyday protection reliable, auditable, and open-access."
        ]
      },
      references: {
        title: "References",
        items: [
          "S. Nakamoto. Bitcoin: A Peer-to-Peer Electronic Cash System. 2008. https://bitcoin.org/bitcoin.pdf",
          "A. Eling and W. Schnell. Parametric Insurance: The Next Generation of Insurance Products. 2016.",
          "OECD. Innovation in Peer-to-Peer Risk Pooling. 2023.",
          "B. Pournader et al. Blockchain and Risk Transfer Mechanisms. 2022.",
          "Chainlink Labs. Data Feeds and Oracle Architectures. 2021. https://chain.link"
        ]
      }
    }
  },
  es: {
    metadata: {
      title: "Riska.world – Un sistema de seguros peer-to-peer",
      description:
        "Riska presenta seguros peer-to-peer donde contratos transparentes, reportes de oráculos y el token RSK alinean incentivos para una protección confiable y auditable."
    },
    navbar: {
      brand: "riska.world",
      links: [
        { href: "#about", label: "Quiénes somos" },
        { href: "#vision", label: "Visión" },
        { href: "#contracts", label: "Contratos" },
        { href: "#stack", label: "Stack" },
        { href: "/whitepaper", label: "Libro blanco" }
      ],
      cta: "Acceder",
      languageToggle: {
        label: "EN",
        ariaLabel: "Cambiar a inglés"
      }
    },
    hero: {
      badge: "Fundación Riska · Noviembre 2025",
      title: "Seguros peer-to-peer con disparadores verificables.",
      description:
        "Pólizas, primas y pagos se ejecutan mediante contratos deterministas, mientras reportes independientes de oráculos confirman los eventos. Riska hace que la protección diaria sea confiable, auditable y accesible globalmente para usuarios verificados en World Chain con acceso resistente a sibilas.",
      chips: [
        "Contratos transparentes",
        "Verificación con oráculos",
        "Incentivos RSK",
        "Usuarios verificados en World Chain"
      ]
    },
    impactMetrics: {
      title: "Objetivos de diseño",
      subtitle:
        "Riska elimina cuellos de botella discrecionales expresando la cobertura como código y confirmando la verdad con datos verificables.",
      body:
        "Cada pool publica qué cubre, cómo calcula los pagos y qué reportes confirman los eventos. La participación es abierta, la ejecución es determinista y los incentivos se alinean mediante la economía de RSK.",
      metrics: [
        { label: "Capital y cobertura", value: "Participación abierta" },
        { label: "Ejecución", value: "Determinista" },
        { label: "Verdad del evento", value: "Oráculos objetivos" },
        { label: "Gobernanza", value: "Transparente" },
        { label: "Identidad de usuario", value: "Verificación en World Chain" }
      ]
    },
    aboutSections: {
      sections: [
        {
          title: "Pools de riesgo públicos",
          description:
            "Los pools mantienen capital, publican qué cubren y expresan las pólizas como reglas transparentes auditables por cualquiera.",
          points: [
            "Las pólizas especifican suma asegurada, ventana de cobertura y disparador",
            "Ejemplos incluyen auto, hogar, electrónica, viajes y logística",
            "Intuición diaria: un ticket con una regla clara que paga cuando se activa"
          ]
        },
        {
          title: "Ciclo de vida del usuario",
          description:
            "Desde elegir un producto hasta el asentamiento automático, cada paso sigue lógica determinista reforzada por oráculos.",
          points: [
            "Selecciona un producto con términos publicados",
            "Paga la prima y recibe una póliza con timestamp",
            "Los oráculos monitorean disparadores y ejecutan pagos automáticamente"
          ]
        },
        {
          title: "Disciplina de capital",
          description:
            "Las primas cubren pérdida esperada, margen de riesgo y fees operativos, mientras los buffers de solvencia mantienen resiliencia.",
          points: [
            "Pérdida esperada: E[Li] = qiSi",
            "Prima: πi = qiSi + ρi + κi",
            "Regla de capital: P ≥ μ + z1−ασ"
          ]
        }
      ]
    },
    valueGrid: {
      title: "Componentes del sistema",
      subtitle:
        "Contratos deterministas, pruebas de oráculos e incentivos del token trabajan juntos para liquidaciones rápidas y transparentes.",
      values: [
        {
          title: "Contratos deterministas",
          description:
            "Las pólizas se ejecutan tal como están escritas, eliminando la aprobación discrecional y manteniendo reglas auditables."
        },
        {
          title: "Reportes de oráculos",
          description:
            "Proveedores independientes envían evidencia firmada; los reportes coincidentes finalizan eventos y los desacuerdos abren disputas acotadas."
        },
        {
          title: "Reclamos instantáneos",
          description:
            "Una vez confirmado el evento, los pagos se liquidan al instante y las disputas siguen rutinas publicadas."
        },
        {
          title: "Economía RSK",
          description:
            "Proveedores de liquidez, operadores de datos y usuarios se alinean mediante staking, fees y retiro deflacionario del token."
        },
        {
          title: "Acceso verificado en World Chain",
          description:
            "Los usuarios prueban que son humanos únicos mediante la verificación en World Chain, manteniendo la apertura del sistema y frenando el abuso sibila."
        }
      ]
    },
    contracts: {
      title: "Contratos desplegados",
      subtitle:
        "Los módulos on-chain de Riska viven en World Chain. Edita lib/contracts.ts y la lista se actualiza al instante.",
      addressLabel: "Dirección del contrato",
      explorerLabel: "Ver en el explorador",
      docsLabel: "Documentación",
      items: [
        {
          id: "policyManager",
          name: "PolicyManager",
          description:
            "Emite NFTs de cobertura, gestiona el ciclo de vida de las pólizas y expone controles de suscripción."
        },
        {
          id: "claimsBridge",
          name: "ClaimsBridge",
          description:
            "Recibe atestaciones de oráculos, valida reportes y envía reclamos aprobados al vault."
        },
        {
          id: "premiumVault",
          name: "PremiumVault",
          description:
            "Resguarda la liquidez, lleva los saldos de los pools y libera capital para pagos."
        }
      ]
    },
    techStack: {
      title: "Salvaguardas operativas",
      subtitle:
        "Las prácticas de seguridad minimizan la confianza, limitan la exposición de datos y dejan cada decisión auditable en cadena.",
      stack: [
        {
          title: "Minimizar confianza",
          description: "Los contratos son mínimos, no tienen backdoors y dependen de oráculos diversos con bonos en stake."
        },
        {
          title: "Minimización de datos",
          description: "Solo las referencias necesarias viven on-chain mientras la evidencia permanece off-chain con enlaces criptográficos."
        },
        {
          title: "Auditabilidad",
          description: "Cada decisión de reclamo—aceptar, negar, disputar—se registra para revisión pública y gobernanza."
        },
        {
          title: "Gobernanza",
          description: "Los tenedores de RSK proponen cambios de parámetros con quórums transparentes, ventanas de disputa y ajustes de fees."
        }
      ]
    },
    callToAction: {
      title: "Lee el whitepaper",
      subtitle:
        "Explora cómo los pools de capital, las pruebas de oráculos y el modelo de incentivos RSK brindan protección confiable y auditable.",
      primary: "Abrir whitepaper",
      secondary: "Contactar a Fundación Riska"
    },
    footer: {
      note: "© {year} riska.world · Seguros peer-to-peer con datos verificables.",
      worldChain: "World Chain",
      email: "hey@riska.world"
    },
    walletAuth: {
      heading: "Consola de pólizas",
      description:
        "Conecta una wallet para revisar pólizas, monitorear eventos de oráculos y seguir asentamientos deterministas en tiempo real.",
      statusLabel: "Estado",
      status: {
        connected: (address: string) => `Sesión conectada: ${address}`,
        connecting: "Conectando…",
        disconnected: "No conectado"
      },
      chainId: (chainId: number) => `Chain ID: ${chainId}`,
      actions: {
        connect: "Conectar wallet",
        connecting: "Conectando…",
        disconnect: "Desconectar"
      },
      messages: {
        welcome: "Bienvenido a Riska: seguros peer-to-peer reforzados por reglas transparentes.",
        disconnected: "Sesión cerrada. Vuelve a conectar para gestionar pólizas y reclamos.",
        error: "No se pudo conectar la wallet."
      }
    },
    whitepaper: {
      metadata: {
        title: "Libro blanco de Riska — Un sistema de seguros peer-to-peer",
        description:
          "Explora cómo riska.world ofrece cobertura transparente y automatizada con pools de capital peer-to-peer, eventos verificados por oráculos y la economía del token RSK."
      },
      header: {
        badge: "Fundación Riska",
        title: "Riska: Un sistema de seguros peer-to-peer",
        date: "Noviembre 2025"
      },
      abstract: {
        title: "Resumen",
        paragraphs: [
          "Presentamos un protocolo de seguros peer-to-peer en el que los riesgos cotidianos—accidentes automovilísticos, daños en el hogar, fallas de electrónicos, interrupciones de viaje—se cubren con reglas públicas y datos verificables en lugar de procesos discrecionales. Las pólizas, primas y pagos se gestionan con contratos transparentes; los eventos se confirman con reportes independientes. Un token nativo (RSK) alinea incentivos entre usuarios, proveedores de liquidez y operadores de datos mediante un diseño deflacionario de comisiones, staking para la honestidad de los oráculos y gobernanza on-chain. El objetivo es simple: hacer que la protección sea confiable, auditable y accesible globalmente.",
          "Riska se integra con World Chain para anclar la participación a cuentas verificadas como humanas. La prueba de humanidad de World Chain aporta resistencia a sibilas, permite que los pools valoren el riesgo sabiendo que cada usuario es único y ofrece a los reguladores una superficie de cumplimiento familiar mientras mantiene los datos biométricos fuera de la cadena."
        ]
      },
      introduction: {
        title: "1. Introducción",
        paragraphs: [
          "El seguro funciona cuando es sencillo comprarlo y confiable al momento de liquidar. Los sistemas heredados dependen de pasos opacos y aprobación discrecional. Riska elimina esos cuellos de botella al expresar la cobertura como código y la verdad de los eventos como datos verificables. Cualquiera puede leer las reglas y auditar las liquidaciones. Esto refleja la filosofía del dinero electrónico: reemplazar la discreción institucional por mecánicas transparentes y predecibles.",
          "World Chain extiende esa filosofía a la identidad. Al autenticarse con una credencial verificada de World Chain, cada participante demuestra que es un humano único sin entregar datos personales al protocolo. Los pools pueden abrir el onboarding global, reducir el fraude y enfocar el capital de suscripción en hogares genuinos en lugar de bots."
        ],
        goalsTitle: "Objetivos de diseño",
        goals: [
          "Participación abierta en capital y cobertura.",
          "Ejecución determinista de los términos de la póliza.",
          "Verificación objetiva de los eventos.",
          "Incentivos y gobernanza claros.",
          "Superficie mínima para el abuso."
        ]
      },
      systemOverview: {
        title: "2. Visión general del sistema",
        paragraphs: [
          "Los participantes interactúan mediante pools de riesgo públicos. Un pool mantiene capital y publica qué cubre y cómo calcula los pagos. Una póliza especifica la suma asegurada S (monto pagado cuando se activa), la ventana de cobertura T (período de vigencia) y el disparador θ (una condición definida por datos).",
          "El acceso se ancla a usuarios verificados en World Chain. Cada titular firma transacciones con una credencial de prueba de humanidad, lo que brinda a los pools confianza en que los incentivos llegan a humanos únicos mientras se preserva la seudonimia on-chain.",
          "Los ejemplos incluyen choques automovilísticos (reporte policial o telemático), inundaciones en el hogar (datos certificados de nivel de agua), fallas de electrónicos (registros de centros de servicio) y demoras en viajes (feeds de aerolíneas)."
        ],
        everydayIntuition: {
          title: "Intuición cotidiana",
          body: "Una póliza es como un boleto con una regla clara. Si ocurre la condición, paga. Todos pueden ver la regla y verificar cómo se aplica."
        }
      },
      userLifecycle: {
        title: "3. Cómo funciona (ciclo de vida del usuario)",
        steps: [
          {
            label: "Verifica identidad.",
            description: "Autentícate con World Chain para confirmar que eres un humano único antes de interactuar con los pools."
          },
          { label: "Selecciona producto.", description: "Elige cobertura de auto, hogar, electrónica o viajes con términos publicados." },
          { label: "Paga la prima.", description: "El contrato emite una póliza con marca de tiempo para la ventana T." },
          { label: "Monitoreo de datos.", description: "Los oráculos vigilan el disparador θ." },
          { label: "Liquidación.", description: "Si θ se confirma dentro de T, el pago se ejecuta automáticamente." }
        ],
        examples: {
          title: "Ejemplos concretos",
          items: [
            {
              label: "Auto:",
              description: "Alicia compra cobertura de colisión. Si se registra un informe oficial de accidente dentro de T, el oráculo lo reporta y la póliza paga un monto fijo."
            },
            {
              label: "Hogar:",
              description: "Un domicilio registrado cobra si los datos certificados de inundación superan un umbral."
            },
            {
              label: "Electrónica:",
              description: "Un dispositivo cobra si los sensores o registros de servicio confirman la falla dentro de T."
            },
            {
              label: "Viajes:",
              description: "Una póliza de vuelo paga una suma fija cuando un feed de aerolínea confirma una demora de 3+ horas."
            }
          ]
        }
      },
      capital: {
        title: "4. Capital y solvencia",
        paragraphs: [
          "Los pools deben permanecer solventes incluso en meses desfavorables. Las primas deben reflejar los pagos esperados más un colchón. La pérdida esperada de una póliza equivale a la probabilidad de reclamo multiplicada por el monto a pagar, E[Li] = qiSi. En N pólizas, μ = Σ qiSi. Las primas totales deben cubrir esta expectativa en el tiempo.",
          "Las primas incluyen pérdida esperada más margen de riesgo ρi y costos operativos κi: πi = qiSi + ρi + κi. Los pools también mantienen un buffer de solvencia para que el capital P cumpla P ≥ μ + z1−ασ, manteniendo la probabilidad de insolvencia por debajo de α."
        ],
        example: {
          title: "Mini ejemplo ilustrativo",
          body: "Un producto contra inundaciones en el hogar paga 2.000 dólares con q = 2%. El pago esperado por póliza es 40 dólares. Si fees y margen suman 10 dólares, la prima es 50 dólares. Vender 10.000 pólizas implica pagos esperados de 400 mil dólares; el capital y los buffers absorben picos infrecuentes."
        }
      },
      eventVerification: {
        title: "5. Verificación de eventos",
        paragraphs: [
          "Los datos confiables son esenciales en seguros paramétricos. Los oráculos envían reportes firmados con tipo de evento e, timestamp t y hash de evidencia h. El contrato espera una ventana corta Δ para múltiples reportes; si un quórum coincide, el evento se confirma. Los conflictos abren una disputa acotada."
        ],
        plainLanguage: {
          title: "Vista en lenguaje sencillo",
          body: "Varios observadores independientes describen el mismo evento. Cuando concuerdan, el reclamo se paga. Cuando discrepan, el sistema se pausa brevemente y lo resuelve siguiendo reglas publicadas."
        }
      },
      claims: {
        title: "6. Reclamos y disputas",
        paragraphs: [
          "Una vez verificados, los pagos se ejecutan de inmediato. Si los oráculos discrepan, una ventana de disputa permite re-reportar. Los proveedores de datos que informan mal arriesgan los bonos que pusieron en stake. Todas las decisiones de reclamos quedan registradas on-chain para auditoría."
        ]
      },
      incentives: {
        title: "7. Incentivos económicos y flujo de capital (RSK)",
        intro: "El token RSK alinea incentivos entre proveedores de liquidez, operadores de datos y usuarios.",
        points: [
          {
            label: "Proveedores de liquidez:",
            description: "Aportan capital a los pools y ganan primas mientras las reglas de solvencia y los límites de capacidad protegen su posición."
          },
          {
            label: "Operadores de datos:",
            description: "Hacen staking de RSK como bono. Reportar con honestidad genera fees; la mala conducta puede ser castigada."
          },
          {
            label: "Usuarios:",
            description: "Pagan las primas publicadas y reciben pagos automáticos cuando se activan los disparadores."
          }
        ],
        feeParagraph:
          "Una parte de las comisiones del protocolo compra y retira RSK con el tiempo, vinculando el uso con una oferta decreciente. Si las comisiones totales de un período son F y la fracción β se destina al retiro, el monto retirado es Δretire = βF / P, donde P es el precio de RSK al liquidar. La oferta circulante se actualiza como St+1 = St − Δretire.",
        example: {
          title: "Ejemplo práctico",
          body: "Si un pool procesa 1.000.000 de dólares en primas con un fee del protocolo de 1% (F = 10.000 dólares) y β = 0,5, entonces 5.000 dólares compran y retiran RSK. Con P = 2 dólares, se retiran alrededor de 2.500 RSK en ese período."
        }
      },
      governance: {
        title: "8. Calibración de riesgo y gobernanza",
        paragraphs: [
          "Los pools publican capacidad, utilización y reclamos recientes. La emisión se detiene cuando se excederían límites seguros. El margen M y el objetivo α se definen por tipo de producto, y los riesgos correlacionados reciben ajustes conservadores a ρi.",
          "La gobernanza permite que los tenedores de RSK propongan cambios de parámetros—quórum, ventanas de disputa, fracciones de fees—y actualizaciones con retrasos temporales para que los participantes reaccionen. Todos los cambios permanecen on-chain y auditables."
        ]
      },
      security: {
        title: "9. Modelo de seguridad y prevención de fraude",
        points: [
          {
            label: "Minimizar confianza:",
            description: "Los contratos son mínimos y no contienen backdoors privilegiadas. Los oráculos son diversos y están respaldados por bonos."
          },
          {
            label: "Minimización de datos:",
            description: "Solo las referencias necesarias de pólizas y reclamos viven on-chain mientras la evidencia permanece off-chain con pruebas criptográficas."
          },
          {
            label: "Verificación humana:",
            description: "La prueba de humanidad de World Chain aplica una política de una persona por póliza, frenando fraudes sibilinos y bots de reclamos masivos sin almacenar biometría cruda en Riska."
          },
          {
            label: "Auditabilidad:",
            description: "Cada decisión—aceptar, negar, disputar—se almacena on-chain para revisión pública."
          }
        ]
      },
      applications: {
        title: "10. Aplicaciones prácticas",
        paragraphs: [
          "El protocolo admite coberturas para autos, hogares, electrónicos, viajes y logística. Cada producto paga cuando las fuentes de datos predefinidas confirman el evento habilitante, permitiendo protección rápida y transparente.",
          "Las personas eligen Riska por reglas simples, pocos pasos y resultados rápidos. Los productos revelan disparadores y fuentes de datos desde el inicio para que los compradores sepan exactamente qué está cubierto.",
          "La verificación en World Chain permite que programas comunitarios o empleadores patrocinen coberturas sabiendo que los subsidios llegan a humanos únicos, reduciendo fugas por bots o identidades duplicadas."
        ]
      },
      faq: {
        title: "11. Preguntas frecuentes",
        items: [
          {
            question: "¿Cómo se fijan los precios?",
            answer: "Por pagos esperados más margen y fees: π = qS + ρ + κ. Los pools publican cada componente."
          },
          {
            question: "¿Qué ocurre si fallan las fuentes de datos?",
            answer: "Múltiples feeds y una ventana de disputa reducen el riesgo de una sola fuente. Los operadores ponen RSK en stake y pueden ser penalizados por mala conducta."
          },
          {
            question: "¿Un pool puede quedarse sin fondos?",
            answer: "La capacidad y los buffers se hacen cumplir con contratos. La emisión se detiene antes de una exposición insegura."
          },
          {
            question: "¿Dónde importa RSK en el día a día?",
            answer: "En el staking para la honestidad de los oráculos, el voto de gobernanza y el retiro deflacionario mediante las comisiones del protocolo."
          },
          {
            question: "¿Esto es un seguro legal?",
            answer: "Riska ofrece protección paramétrica: disparadores claros, pagos fijos y transparencia. El cumplimiento local varía por jurisdicción y los productos pueden configurarse en consecuencia."
          }
        ]
      },
      conclusion: {
        title: "12. Conclusión",
        paragraphs: [
          "Riska reemplaza la fricción y la discreción con reglas transparentes y datos verificables. Al combinar pools de capital, pruebas objetivas de eventos y el modelo de incentivos RSK, el protocolo busca que la protección cotidiana sea confiable, auditable y de acceso abierto."
        ]
      },
      references: {
        title: "Referencias",
        items: [
          "S. Nakamoto. Bitcoin: A Peer-to-Peer Electronic Cash System. 2008. https://bitcoin.org/bitcoin.pdf",
          "A. Eling and W. Schnell. Parametric Insurance: The Next Generation of Insurance Products. 2016.",
          "OECD. Innovation in Peer-to-Peer Risk Pooling. 2023.",
          "B. Pournader et al. Blockchain and Risk Transfer Mechanisms. 2022.",
          "Chainlink Labs. Data Feeds and Oracle Architectures. 2021. https://chain.link"
        ]
      }
    }
  }
};

export function isLanguage(value: string | null | undefined): value is Language {
  return value === "en" || value === "es";
}
