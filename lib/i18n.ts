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
      title: "Riska.world – On-Chain Insurance for Verified Humans",
      description:
        "Riska.world protects verified humans with NFT policies, automated claims, and instant payouts on World Chain."
    },
    navbar: {
      brand: "riska.world",
      links: [
        { href: "#about", label: "About" },
        { href: "#vision", label: "Vision" },
        { href: "#stack", label: "Stack" }
      ],
      cta: "Log in",
      languageToggle: {
        label: "ES",
        ariaLabel: "Switch to Spanish"
      }
    },
    hero: {
      badge: "Intelligent coverage on World Chain",
      title: "On-chain insurance for verified humans.",
      description:
        "NFT policies, automated claims, and instant payouts powered by oracles. No paperwork, no friction—just transparent protection for World ID communities.",
      chips: ["NFT Policies", "Decentralized oracles", "DAO Governance"]
    },
    impactMetrics: {
      title: "Measurable impact, radical trust",
      subtitle:
        "Climate risks, community micro-insurance, and protection for creators: our protocols let you design tailored products and release payouts almost in real time.",
      body:
        "Every interaction is recorded on-chain, from issuing NFT policies to resolving claims automatically. Metrics refresh via oracles, keeping policyholders and DAO delegates aligned.",
      metrics: [
        { label: "Active policies", value: "4,200+" },
        { label: "Payout time", value: "< 15 min" },
        { label: "Human community", value: "38 countries" },
        { label: "Capital insured", value: "$12.5M" }
      ]
    },
    aboutSections: {
      sections: [
        {
          title: "Who we are",
          description:
            "We are a collective of actuaries, devs, and World ID community guardians reimagining insurance for a frictionless future.",
          points: [
            "Remote team with DeFi and parametric coverage expertise",
            "Ongoing external audits and radical transparency",
            "Commitment to protecting verified human identities"
          ]
        },
        {
          title: "What we build",
          description:
            "We craft on-chain policies represented as NFTs, where every coverage is governed by auditable smart contracts.",
          points: [
            "Automated claims via climate and social data oracles",
            "Instant payouts in stablecoins overseen by the community vault",
            "Friendly interfaces to issue, renew, or transfer policies"
          ]
        },
        {
          title: "Why choose Riska.world",
          description:
            "Because insurance should be open, programmable, and centered on real humans. Every decision and reserve is auditable on-chain here.",
          points: [
            "Gas optimised thanks to World Chain (OP Stack)",
            "Risk DAO that adjusts premiums and reserves in real time",
            "Incentives for verifiers and mutual-aid communities"
          ]
        }
      ]
    },
    valueGrid: {
      title: "Modular coverage for a programmable world",
      subtitle:
        "Built for teams operating on-chain that need reliable guarantees for verified humans. We make every step of the lifecycle transparent.",
      values: [
        {
          title: "Tokenised policies",
          description:
            "Each coverage lives as a unique NFT with immutable, transferable history—ideal for communities and DAO treasury managers."
        },
        {
          title: "Verifiable oracles",
          description:
            "Integrations with climate, health, and identity oracles validate events without manual steps, accelerating fund releases."
        },
        {
          title: "Community vault",
          description:
            "Publicly audited stablecoin reserves finance automated payouts and rewards for risk guardians."
        },
        {
          title: "Open governance",
          description:
            "The risk DAO tunes premiums, limits, and triggers to stay resilient as new scenarios emerge."
        }
      ]
    },
    techStack: {
      title: "A stack built for programmable trust",
      subtitle:
        "Every technology layer reinforces the transparency, auditability, and speed required for on-chain insurance.",
      stack: [
        {
          title: "Next.js 14",
          description: "Hybrid rendering, server actions, and optimal performance for real-time risk dashboards."
        },
        {
          title: "Tailwind CSS",
          description: "Adaptable design with glassmorphism components that reinforce riska.world's futuristic identity."
        },
        {
          title: "Prisma + PostgreSQL",
          description: "Secure management of policies, claim history, and risk metrics without duplicating client instances."
        },
        {
          title: "viem + MetaMask",
          description: "Direct connectivity to World Chain and compatible wallets, enabling decentralised login and signup."
        }
      ]
    },
    callToAction: {
      title: "Start protecting your community today",
      subtitle:
        "Integrate our protocol via SDK or GraphQL API and design custom products for cooperatives, DAOs, or local economies.",
      primary: "Log in with MetaMask",
      secondary: "Talk with the team"
    },
    footer: {
      note: "© {year} riska.world · Decentralised coverage for verified humans.",
      worldChain: "World Chain",
      email: "hey@riska.world"
    },
    walletAuth: {
      heading: "Secure access",
      description:
        "Authenticate with MetaMask to manage policies, file claims, and unlock benefits for verified humans.",
      statusLabel: "Status",
      status: {
        connected: (address: string) => `Active session on ${address}`,
        connecting: "Connecting…",
        disconnected: "Not connected"
      },
      chainId: (chainId: number) => `Chain ID: ${chainId}`,
      actions: {
        connect: "Connect with MetaMask",
        connecting: "Connecting…",
        disconnect: "Log out"
      },
      messages: {
        welcome: "Welcome to intelligent coverage for real humans!",
        disconnected: "Session closed. You can reconnect anytime.",
        error: "Unable to connect the wallet."
      }
    }
  },
  es: {
    metadata: {
      title: "Riska.world – On-Chain Insurance for Verified Humans",
      description:
        "Riska.world protege a humanos verificados con pólizas NFT, reclamos automatizados y pagos instantáneos sobre World Chain."
    },
    navbar: {
      brand: "riska.world",
      links: [
        { href: "#about", label: "Quiénes somos" },
        { href: "#vision", label: "Visión" },
        { href: "#stack", label: "Stack" }
      ],
      cta: "Acceder",
      languageToggle: {
        label: "EN",
        ariaLabel: "Cambiar a inglés"
      }
    },
    hero: {
      badge: "Cobertura inteligente en World Chain",
      title: "Seguro on-chain para humanos verificados.",
      description:
        "Pólizas NFT, reclamos automatizados y pagos instantáneos impulsados por oráculos. Sin papeleo, sin fricción: solo protección transparente para comunidades de World ID.",
      chips: ["Pólizas NFT", "Oráculos descentralizados", "Governanza DAO"]
    },
    impactMetrics: {
      title: "Impacto medible, confianza radical",
      subtitle:
        "Riesgos climáticos, microseguros comunitarios y protección para creadores: nuestros protocolos permiten diseñar productos a medida y liberar pagos casi en tiempo real.",
      body:
        "Cada interacción queda registrada on-chain, desde la emisión de la póliza NFT hasta la resolución automática de reclamos. Las métricas se actualizan vía oráculos, manteniendo al día a asegurados y delegados DAO.",
      metrics: [
        { label: "Pólizas activas", value: "4,200+" },
        { label: "Tiempo de payout", value: "< 15 min" },
        { label: "Comunidad humana", value: "38 países" },
        { label: "Capital asegurado", value: "$12.5M" }
      ]
    },
    aboutSections: {
      sections: [
        {
          title: "Quiénes somos",
          description:
            "Somos un colectivo de actuarios, devs y guardianes de la comunidad World ID que reimaginan los seguros para un futuro sin fricción.",
          points: [
            "Equipo remoto con experiencia en DeFi y cobertura paramétrica",
            "Auditorías externas continuas y transparencia radical",
            "Compromiso con la protección de identidades humanas verificadas"
          ]
        },
        {
          title: "Qué hacemos",
          description:
            "Construimos pólizas on-chain representadas como NFTs, donde cada cobertura se administra con smart contracts auditables.",
          points: [
            "Reclamos automatizados mediante oráculos de datos climáticos y sociales",
            "Payouts instantáneos en stablecoins supervisados por el vault comunitario",
            "Interfaces amigables para emitir, renovar o transferir pólizas"
          ]
        },
        {
          title: "Por qué usar Riska.world",
          description:
            "Porque el seguro debe ser abierto, programable y centrado en humanos reales. Aquí cada decisión y reserva es auditable en cadena.",
          points: [
            "Gas optimizado gracias a World Chain (OP Stack)",
            "DAO de riesgo que ajusta primas y reservas en tiempo real",
            "Incentivos para agentes verificadores y comunidades solidarias"
          ]
        }
      ]
    },
    valueGrid: {
      title: "Cobertura modular para un mundo programable",
      subtitle:
        "Diseñado para equipos que operan on-chain y necesitan garantías confiables para humanos verificados. Transparentamos cada paso del ciclo de vida.",
      values: [
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
      ]
    },
    techStack: {
      title: "Un stack diseñado para confianza programable",
      subtitle:
        "Cada capa tecnológica refuerza la transparencia, auditabilidad y velocidad necesarias para seguros on-chain.",
      stack: [
        {
          title: "Next.js 14",
          description: "Render híbrido, server actions y performance óptima para dashboards de riesgo en tiempo real."
        },
        {
          title: "Tailwind CSS",
          description: "Diseño adaptable con componentes glassmorphism que refuerzan la identidad futurista de riska.world."
        },
        {
          title: "Prisma + PostgreSQL",
          description: "Gestión segura de pólizas, historial de reclamos y métricas de riesgo sin duplicar instancias del cliente."
        },
        {
          title: "viem + MetaMask",
          description: "Conectividad directa a World Chain y carteras compatibles, habilitando login/signup descentralizado."
        }
      ]
    },
    callToAction: {
      title: "Comienza a asegurar tu comunidad hoy",
      subtitle:
        "Integra nuestro protocolo via SDK o API GraphQL y diseña productos personalizados para cooperativas, DAOs o economías locales.",
      primary: "Acceder con MetaMask",
      secondary: "Hablar con el equipo"
    },
    footer: {
      note: "© {year} riska.world · Cobertura descentralizada para humanos verificados.",
      worldChain: "World Chain",
      email: "hey@riska.world"
    },
    walletAuth: {
      heading: "Acceso seguro",
      description:
        "Autentícate con MetaMask para gestionar pólizas, presentar reclamos y acceder a beneficios para humanos verificados.",
      statusLabel: "Estado",
      status: {
        connected: (address: string) => `Sesión activa en ${address}`,
        connecting: "Conectando…",
        disconnected: "No conectado"
      },
      chainId: (chainId: number) => `Chain ID: ${chainId}`,
      actions: {
        connect: "Conectar con MetaMask",
        connecting: "Conectando…",
        disconnect: "Cerrar sesión"
      },
      messages: {
        welcome: "¡Bienvenido a la cobertura inteligente para humanos reales!",
        disconnected: "Sesión cerrada. Puedes volver a conectar cuando quieras.",
        error: "No se pudo conectar la wallet."
      }
    }
  }
};

export function isLanguage(value: string | null | undefined): value is Language {
  return value === "en" || value === "es";
}
