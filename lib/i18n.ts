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
        "Policies, premiums, and payouts execute through deterministic contracts, while independent oracle reports confirm events. Riska makes everyday coverage reliable, auditable, and globally accessible.",
      chips: ["Transparent contracts", "Oracle verification", "RSK incentives"]
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
        { label: "Governance", value: "Transparent" }
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
        "Pólizas, primas y pagos se ejecutan mediante contratos deterministas, mientras reportes independientes de oráculos confirman los eventos. Riska hace que la protección diaria sea confiable, auditable y accesible globalmente.",
      chips: ["Contratos transparentes", "Verificación con oráculos", "Incentivos RSK"]
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
        { label: "Gobernanza", value: "Transparente" }
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
    }
  }
};

export function isLanguage(value: string | null | undefined): value is Language {
  return value === "en" || value === "es";
}
