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
  retirementProduct: {
    badge: string;
    title: string;
    subtitle: string;
    timelineTitle: string;
    timeline: { label: string; description: string }[];
    economicsTitle: string;
    economics: { label: string; value: string; description: string }[];
    contractNote: string;
  };
  contracts: {
    title: string;
    subtitle: string;
    addressLabel: string;
    pendingLabel: string;
    explorerLabel: string;
    docsLabel: string;
    items: {
      id: ContractId;
      name: string;
      description: string;
    }[];
  };
  contractDetail: {
    backLabel: string;
    eyebrow: string;
    addressLabel: string;
    pendingAddressLabel: string;
    networkLabel: string;
    statusLabel: string;
    explorerLabel: string;
    responsibilitiesTitle: string;
    interfaceTitle: string;
    safeguardsTitle: string;
    sourceTitle: string;
    sourceIncludedLabel: string;
    sourcePendingLabel: string;
  };
  contractDocs: Record<
    ContractId,
    {
      title: string;
      summary: string;
      status: string;
      responsibilities: string[];
      interfaceItems: {
        name: string;
        description: string;
      }[];
      safeguards: string[];
      sourceNote: string;
    }
  >;
  docsPage: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      badge: string;
      title: string;
      description: string;
      primaryCta: string;
      secondaryCta: string;
    };
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
    miniApp: {
      label: string;
      checking: string;
      installed: string;
      browserFallback: string;
    };
    statusLabel: string;
    status: {
      connected: (address: string) => string;
      connecting: string;
      disconnected: string;
    };
    chainId: (chainId: number) => string;
    mode: {
      "world-app": string;
      browser: string;
    };
    actions: {
      connectWorldApp: string;
      connectBrowser: string;
      connecting: string;
      disconnect: string;
    };
    messages: {
      welcome: string;
      disconnected: string;
      error: string;
      nonceError: string;
      verifyError: string;
      worldAppRequired: string;
    };
  };
  worldIdGate: {
    heading: string;
    description: string;
    statusLabel: string;
    statuses: {
      locked: string;
      ready: string;
      loading: string;
      verified: string;
      error: string;
      notConfigured: string;
    };
    action: string;
    actionLoading: string;
    walletRequired: string;
    configMissing: string;
    signatureError: string;
    verifyError: string;
    duplicateError: string;
    errorPrefix: string;
    errors: Record<string, string>;
    signalLabel: (signal: string) => string;
    proofLabel: (proofId: string) => string;
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
    download: {
      label: string;
      note: string;
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
      title: "Riska.world - Life Protection + 30-Year Retirement Income",
      description:
        "Riska combines life protection with a 30-year USDC policy: after the 12-month waiting period, beneficiaries receive a formula payout; at maturity, the holder receives 100% principal over 10 years."
    },
    navbar: {
      brand: "RISKA",
      links: [
        { href: "/#enroll", label: "Enroll" },
        { href: "/#rules", label: "Policy rules" },
        { href: "/whitepaper", label: "White paper" },
        { href: "/docs", label: "Contracts" }
      ],
      cta: "Start",
      languageToggle: {
        label: "ES",
        ariaLabel: "Switch to Spanish"
      }
    },
    hero: {
      badge: "Riska 30 · Life protection + programmed income",
      title: "30 USDC a month. If you reach maturity, you collect 100%.",
      description:
        "Riska turns life insurance into a long-term USDC policy. After 12 paid months, verified beneficiaries can receive 80% of paid premiums if the holder dies before maturity. At 30 years, the holder receives 100% of scheduled principal over 10 years.",
      chips: [
        "30 USDC monthly premium",
        "12-month waiting period",
        "80% beneficiary formula",
        "100% maturity principal"
      ]
    },
    impactMetrics: {
      title: "Product rules",
      subtitle:
        "One policy, published outcomes: beneficiary support after the waiting period, programmed income when the 30-year term is complete.",
      body:
        "The base promise is principal-denominated in USDC: 80% of paid premiums to beneficiaries after verified death from month 12 through maturity, 90% of the matured or remaining balance after maturity, and 100% principal to the holder if they complete the term.",
      metrics: [
        { label: "Contribution term", value: "30 years" },
        { label: "Monthly premium", value: "30 USDC" },
        { label: "Waiting period", value: "12 months" },
        { label: "After maturity", value: "10-year payout" },
        { label: "Contract terms", value: "Auditable" },
        { label: "User identity", value: "Verified human" }
      ]
    },
    aboutSections: {
      sections: [
        {
          title: "30-year life contract",
          description:
            "Each policy publishes the 30 USDC premium, maturity date, waiting period, beneficiary formula, and programmed income method.",
          points: [
            "The holder contributes for 30 years",
            "The legal terms hash is linked to the on-chain policy",
            "The policy state is visible: active, grace, matured, payout, or closed"
          ]
        },
        {
          title: "Family protection phase",
          description:
            "Before maturity, the policy pays beneficiaries only under the published formula and after verified death reporting.",
          points: [
            "Beneficiaries are set at policy creation",
            "Death reports are verified before payout",
            "From month 12 through maturity, beneficiaries receive 80% of paid premiums after approval"
          ]
        },
        {
          title: "Retirement income phase",
          description:
            "After 30 years, the policy matures and converts the accumulated balance into scheduled payments.",
          points: [
            "Maturity is time-based and does not require an oracle",
            "The holder receives 100% of scheduled principal over 120 monthly payments",
            "Beneficiaries receive 90% of the matured or remaining balance if verified death occurs after maturity"
          ]
        }
      ]
    },
    valueGrid: {
      title: "Contract components",
      subtitle:
        "The protocol is scoped around one defensible product: life protection during accumulation, programmed income after maturity.",
      values: [
        {
          title: "Electronic policy terms",
          description:
            "A signed policy document defines coverage, beneficiaries, premiums, maturity, payout schedule, and dispute rules. Its hash is stored on-chain."
        },
        {
          title: "Principal and yield",
          description:
            "The 30 USDC monthly premium is protected principal for the base promise. Protocol economics come from allowlisted yield strategies and must be accounted separately."
        },
        {
          title: "Beneficiary formula",
          description:
            "Before 12 paid months there is no policy payout. From month 12 through maturity, verified beneficiaries receive 80% of paid premiums."
        },
        {
          title: "Programmed income",
          description:
            "After 30 years, 100% of scheduled principal converts into fixed withdrawals over 10 years."
        },
        {
          title: "Verified access",
          description:
            "World Chain verification limits duplicate policy abuse while preserving a wallet-native onboarding flow."
        }
      ]
    },
    retirementProduct: {
      badge: "Riska 30 contract",
      title: "A life policy that becomes income after 30 years.",
      subtitle:
        "Riska 30 keeps the promise explicit: 30 USDC per month, 12-month waiting period, 80% beneficiary payout before maturity, and 100% principal return to the holder at maturity.",
      timelineTitle: "Policy lifecycle",
      timeline: [
        {
          label: "Years 0-30",
          description: "The holder pays 30 USDC per month. Principal accumulates toward the 30-year maturity promise."
        },
        {
          label: "If death occurs",
          description: "After 12 paid months, a verified death claim pays beneficiaries 80% of paid premiums before maturity."
        },
        {
          label: "Year 30",
          description: "The policy matures by time. No death oracle is needed to unlock the retirement phase."
        },
        {
          label: "After maturity",
          description: "The holder receives 100% of scheduled principal over 10 years; verified death routes 90% of the remaining balance to beneficiaries."
        }
      ],
      economicsTitle: "Policy economics",
      economics: [
        {
          label: "Protected principal",
          value: "30 USDC/mo",
          description: "The base amount used for beneficiary formulas and maturity payout."
        },
        {
          label: "Yield strategy",
          value: "Protocol income",
          description: "Funds can be deployed into allowlisted protocols to generate yield for reserves and operations."
        },
        {
          label: "RISKA governance",
          value: "100,000 supply",
          description: "The 0-decimal token starts centralized and transferable, with a future decentralization path."
        }
      ],
      contractNote:
        "The production contracts need to be rewritten around World ID, KYC, multiple beneficiaries, yield accounting, upgrade governance, and the final payout formula."
    },
    contracts: {
      title: "Protocol contracts",
      subtitle:
        "Riska's current test modules are deployed on World Chain Sepolia. Each deployed module includes an explorer link and local source reference.",
      addressLabel: "Contract address",
      pendingLabel: "Pending deployment",
      explorerLabel: "View on explorer",
      docsLabel: "Read docs",
      items: [
        {
          id: "thirtyYearPolicy",
          name: "RiskaThirtyYearPolicy",
          description:
            "MVP policy lifecycle for 30-year contributions, death-benefit settlement, maturity activation, and programmed retirement payouts."
        },
        {
          id: "policyManager",
          name: "PolicyManager",
          description:
            "Issues coverage NFTs, enforces policy lifecycles, and exposes underwriting controls."
        },
        {
          id: "beneficiaryRegistry",
          name: "BeneficiaryRegistry",
          description:
            "Stores beneficiary wallets and allocation shares for each policy opened by the manager."
        },
        {
          id: "deathVerifier",
          name: "DeathVerifier",
          description:
            "Receives verified death reports, stores evidence hashes, and authorizes beneficiary settlement."
        },
        {
          id: "premiumVault",
          name: "PremiumVault",
          description:
            "Holds liquidity, accounts for pool balances, and releases capital for payouts."
        },
        {
          id: "mockUsdc",
          name: "MockUSDC",
          description:
            "Test ERC-20 payment token used for the Sepolia issuance flow and first premium approval."
        }
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
    contractDocs: {
      thirtyYearPolicy: {
        title: "RiskaThirtyYearPolicy",
        summary:
          "The MVP contract for the Riska 30 product: a 30-year contribution policy that protects beneficiaries before maturity and pays the holder through programmed withdrawals after maturity.",
        status: "Deployed on World Chain Sepolia for test flows. Not audited for production funds.",
        responsibilities: [
          "Create plans with premium, death benefit, allocation percentages, payout months, and terms hash.",
          "Open policies with holder, beneficiary, maturity date, paid-through date, and retirement balance.",
          "Collect premiums and separate retirement balance, risk reserve, and protocol fees.",
          "Settle verified death claims before maturity and activate programmed retirement payouts after maturity."
        ],
        interfaceItems: [
          {
            name: "createPlan",
            description: "Creates a policy plan with published economics and the hash of the electronic policy terms."
          },
          {
            name: "openPolicy",
            description: "Starts a holder policy, records the beneficiary, and collects the first premium."
          },
          {
            name: "payPremium",
            description: "Extends coverage by one or more payment periods and updates the retirement balance."
          },
          {
            name: "reportDeath",
            description: "Allows the approved verifier to submit an evidence hash and settle the beneficiary payout."
          },
          {
            name: "activateRetirement",
            description: "Converts a matured policy into programmed withdrawals for the holder."
          },
          {
            name: "claimRetirementPayout",
            description: "Releases the next scheduled retirement payout and closes the policy when the balance is exhausted."
          }
        ],
        safeguards: [
          "A non-reentrancy guard wraps premium collection, claim settlement, reserve funding, fee withdrawals, and payouts.",
          "Death benefits only settle when available risk liquidity covers the configured benefit.",
          "Retirement balances are tracked as protocol liabilities and separated from fee balance.",
          "Plan terms are anchored with a terms hash so the legal document can be versioned and audited."
        ],
        sourceNote:
          "The source below is the current MVP implementation included in this repository. It should be audited before production use."
      },
      policyManager: {
        title: "PolicyManager",
        summary:
          "The policy registry and issuance module for deployed coverage records. In the Riska 30 architecture, it is the place where a signed electronic policy becomes an on-chain policy reference.",
        status: "Deployed on World Chain Sepolia and wired to the registry, verifier, and vault.",
        responsibilities: [
          "Bind a policy holder, beneficiary, plan, and terms hash to a durable on-chain record.",
          "Expose lifecycle state to the app so users can see whether coverage is active, in grace, matured, or closed.",
          "Coordinate with the vault and verification modules when a claim or maturity event changes policy state.",
          "Keep policy metadata addressable for wallets, explorers, and partner integrations."
        ],
        interfaceItems: [
          {
            name: "Policy issuance",
            description: "Creates the coverage record after the user accepts the electronic contract and pays the required premium."
          },
          {
            name: "Beneficiary registry",
            description: "Stores or references the beneficiary selected by the holder at policy creation."
          },
          {
            name: "Lifecycle status",
            description: "Publishes the current policy state for the web app, explorers, and downstream integrations."
          },
          {
            name: "Terms reference",
            description: "Links the policy to the exact legal document hash accepted by the holder."
          }
        ],
        safeguards: [
          "Issuance should be gated by underwriting rules, verified identity, and capacity checks.",
          "Lifecycle changes should emit events for public auditability.",
          "Policy records should not store sensitive evidence directly on-chain.",
          "Administrative permissions should be time-delayed or moved behind governance before public scale."
        ],
        sourceNote:
          "The local source below is the contract used for the current World Chain Sepolia deployment."
      },
      beneficiaryRegistry: {
        title: "BeneficiaryRegistry",
        summary:
          "The registry module that stores beneficiary wallets and allocation shares for each policy created through the Riska policy manager.",
        status: "Deployed on World Chain Sepolia and restricted so only the policy manager can set beneficiaries.",
        responsibilities: [
          "Store beneficiary accounts and basis-point allocations for each policy.",
          "Reject empty, duplicate, zero-address, or oversized beneficiary sets.",
          "Require total beneficiary shares to equal 100%.",
          "Expose beneficiary count and indexed beneficiary reads for payout logic and app views."
        ],
        interfaceItems: [
          {
            name: "setPolicyManager",
            description: "Sets the only contract authorized to write beneficiary records."
          },
          {
            name: "setBeneficiaries",
            description: "Writes the beneficiary accounts and share percentages for a policy."
          },
          {
            name: "beneficiaryCount",
            description: "Returns how many beneficiaries are configured for a policy."
          },
          {
            name: "beneficiaryAt",
            description: "Returns a beneficiary wallet and share by index."
          }
        ],
        safeguards: [
          "Only the configured policy manager can write beneficiary data.",
          "The registry rejects duplicate wallets and zero addresses.",
          "A policy can have at most eight beneficiaries.",
          "Shares must add up to exactly 10,000 basis points."
        ],
        sourceNote:
          "The local source below is the contract used for the current World Chain Sepolia deployment."
      },
      deathVerifier: {
        title: "DeathVerifier",
        summary:
          "The verification module that receives death reports, records evidence hashes, and authorizes beneficiary settlement under the policy rules.",
        status: "Deployed on World Chain Sepolia with a single configured verifier for test flows.",
        responsibilities: [
          "Receive a death report for a policy without storing private documents directly on-chain.",
          "Record the hash or reference of off-chain evidence used by the verifier.",
          "Authorize claim settlement only after the event has passed the verification process.",
          "Provide an auditable trail for beneficiaries, governance, and future dispute windows."
        ],
        interfaceItems: [
          {
            name: "Evidence reference",
            description: "Stores a cryptographic reference to the documents or attestations used for verification."
          },
          {
            name: "Verifier authorization",
            description: "Restricts settlement authorization to approved reporters in the MVP."
          },
          {
            name: "Claim signal",
            description: "Notifies the policy module that a beneficiary payout can be executed."
          },
          {
            name: "Dispute upgrade path",
            description: "Leaves room for quorum, bonded reporters, and dispute windows in later versions."
          }
        ],
        safeguards: [
          "Raw medical, civil registry, or identity documents should stay off-chain.",
          "Verifier changes should be governed and evented.",
          "Large claims should support multiple reporters and a delay before final settlement.",
          "Evidence references should be immutable after settlement."
        ],
        sourceNote:
          "The local source below is the contract used for the current World Chain Sepolia deployment."
      },
      premiumVault: {
        title: "PremiumVault",
        summary:
          "The liquidity and accounting module for premiums, reserves, liabilities, fees, and payouts. This is the contract page that should replace the broken external premium-vault documentation link.",
        status: "Deployed on World Chain Sepolia and authorized to accept calls from the policy manager.",
        responsibilities: [
          "Receive premium flows from policy contracts and account for where each unit of capital belongs.",
          "Keep retirement liabilities separate from risk liquidity used for death benefits.",
          "Release approved beneficiary payouts, maturity withdrawals, and permitted fee withdrawals.",
          "Expose reserve and liability data so the web app can show solvency and payout capacity."
        ],
        interfaceItems: [
          {
            name: "Premium intake",
            description: "Receives funds from policy flows and attributes them to retirement balance, risk reserve, and fees."
          },
          {
            name: "Reserve accounting",
            description: "Tracks capital that backs death-benefit capacity separately from user retirement liabilities."
          },
          {
            name: "Payout release",
            description: "Transfers funds only when the policy or verifier module has authorized a claim or scheduled withdrawal."
          },
          {
            name: "Fee withdrawal",
            description: "Allows protocol fees to be withdrawn only from the accounted fee balance."
          }
        ],
        safeguards: [
          "Retirement liabilities must not be treated as free risk capital.",
          "Death-benefit payments should fail if available risk liquidity is insufficient.",
          "Treasury withdrawals should never touch user retirement balances.",
          "Vault operations should emit events for premium receipt, reserve funding, payout, and fee withdrawal."
        ],
        sourceNote:
          "The local source below is the contract used for the current World Chain Sepolia deployment."
      },
      mockUsdc: {
        title: "MockUSDC",
        summary:
          "A six-decimal ERC-20 test token used as the payment token for World Chain Sepolia policy issuance tests.",
        status: "Deployed on World Chain Sepolia. The deployer minted 20,000 MockUSDC for test enrollment flows.",
        responsibilities: [
          "Represent a USDC-like payment token in testnet flows.",
          "Expose six decimals so premiums match the policy math assumptions.",
          "Allow test minting for wallets that need premium funds.",
          "Provide the token approved by holders before opening a policy."
        ],
        interfaceItems: [
          {
            name: "decimals",
            description: "Returns 6 to match USDC-style accounting."
          },
          {
            name: "mint",
            description: "Mints test tokens for development and test issuance."
          },
          {
            name: "approve",
            description: "Lets a holder approve the vault to collect the first premium."
          },
          {
            name: "balanceOf",
            description: "Shows the available test balance for a wallet."
          }
        ],
        safeguards: [
          "This token is only for testnet and has no production value.",
          "Minting is intentionally open in the mock contract for development convenience.",
          "Production should use a real, allowlisted payment token.",
          "The app labels this deployment as World Chain Sepolia."
        ],
        sourceNote:
          "The local source below is the mock ERC-20 used for the current World Chain Sepolia deployment."
      }
    },
    docsPage: {
      metadata: {
        title: "Riska protocol docs",
        description:
          "Review deployed contracts, internal contract documentation, and integration entry points for Riska."
      },
      hero: {
        badge: "Documentation",
        title: "Build with the Riska protocol",
        description:
          "Explore contract addresses, integration resources, and references for partners shipping on World Chain.",
        primaryCta: "View contract addresses",
        secondaryCta: "Open white paper"
      }
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
          description: "Every death report, maturity activation, and payout event is recorded for public review and governance oversight."
        },
        {
          title: "Governance",
          description: "RISKA governance starts centralized, then can expand through transparent partner and community distribution."
        }
      ]
    },
    callToAction: {
      title: "Download the Riska 30 white paper",
      subtitle:
        "Prepared for grant review: product thesis, World Chain alignment, policy lifecycle, smart-contract scope, roadmap, and risk boundaries.",
      primary: "Open white paper",
      secondary: "Contact Riska Foundation"
    },
    footer: {
      note: "© {year} riska.world · Life protection with 30-year programmed income.",
      worldChain: "World Chain",
      email: "hey@riska.world"
    },
    walletAuth: {
      heading: "Riska 30 console",
      description:
        "Sign in through World App to review 30-year policy status, beneficiary settings, premium history, maturity date, and programmed payout state.",
      miniApp: {
        label: "Mini App bridge",
        checking: "Checking World App context…",
        installed: "World App detected. Wallet Auth will be verified on the Riska backend.",
        browserFallback: "Browser mode active. Use the web wallet fallback for local review."
      },
      statusLabel: "Status",
      status: {
        connected: (address: string) => `Session connected: ${address}`,
        connecting: "Connecting…",
        disconnected: "Not connected"
      },
      chainId: (chainId: number) => `Chain ID: ${chainId}`,
      mode: {
        "world-app": "World App",
        browser: "Browser wallet"
      },
      actions: {
        connectWorldApp: "Sign in with World App",
        connectBrowser: "Connect browser wallet",
        connecting: "Connecting…",
        disconnect: "Disconnect"
      },
      messages: {
        welcome: "Welcome to Riska 30. Wallet Auth was completed and the session is ready for the next onboarding step.",
        disconnected: "Session closed. Reconnect to manage policies, beneficiaries, and maturity payouts.",
        error: "Unable to connect the wallet.",
        nonceError: "Unable to prepare the Wallet Auth nonce.",
        verifyError: "Unable to verify the Wallet Auth signature.",
        worldAppRequired: "Open Riska inside World App to use Mini App Wallet Auth."
      }
    },
    worldIdGate: {
      heading: "One human, one policy",
      description:
        "Verify Proof of Human with IDKit before policy activation. Riska stores the World ID nullifier server-side so the same verified human cannot reserve a second policy.",
      statusLabel: "World ID gate",
      statuses: {
        locked: "Connect a wallet first so the proof can be bound to that address.",
        ready: "Ready to request a World ID proof for this wallet.",
        loading: "Preparing a signed World ID request…",
        verified: "Verified unique human. This wallet can continue to KYC and beneficiary setup.",
        error: "World ID verification needs attention.",
        notConfigured: "World ID app configuration is pending."
      },
      action: "Verify human",
      actionLoading: "Preparing proof…",
      walletRequired: "Connect Wallet Auth before requesting World ID.",
      configMissing: "Set NEXT_PUBLIC_WORLD_APP_ID before opening the IDKit flow.",
      signatureError: "Unable to create the signed RP request.",
      verifyError: "Unable to verify the World ID proof.",
      duplicateError: "This verified human is already reserved for a Riska policy.",
      errorPrefix: "IDKit error:",
      errors: {
        cancelled: "Verification was cancelled. No policy slot was reserved.",
        connection_failed: "The connection with World App was interrupted. Check your connection and try again.",
        credential_unavailable:
          "This World App account is not verified as human yet. Finish World ID verification in World App, then return to Riska and try again.",
        failed_by_host_app:
          "Riska could not accept the proof. Reconnect your wallet session and try again.",
        generic_error: "We could not complete World ID verification. Please try again.",
        identity_attributes_not_matched:
          "This World ID does not match the proof requirements for a Riska policy.",
        inclusion_proof_failed:
          "World App could not prepare the proof for this account. Wait a moment and try again.",
        inclusion_proof_pending:
          "Your World ID proof is still being prepared. Wait a moment and try again.",
        invalid_network: "World ID returned a proof for the wrong network. Please try again from World App.",
        invalid_rp_signature:
          "Riska's World ID configuration needs attention before verification can continue.",
        malformed_request: "The World ID request could not be read. Please refresh Riska and try again.",
        max_verifications_reached:
          "This World ID has already been used for this Riska verification.",
        nullifier_replayed:
          "This World ID has already been reserved for this Riska verification.",
        timeout: "World App took too long to answer. Please try again.",
        unexpected_response:
          "World App returned an unexpected response. Please update World App and try again.",
        user_rejected: "Verification was cancelled. No policy slot was reserved.",
        verification_rejected:
          "World App rejected the verification. Make sure your account is verified and try again.",
        world_id_3_not_available:
          "This World App account cannot create the required proof yet. Finish verification and try again.",
        world_id_4_not_available:
          "This World App account cannot create the required proof yet. Update World App or finish verification, then try again."
      },
      signalLabel: (signal: string) => `Signal: ${signal}`,
      proofLabel: (proofId: string) => `Reserved nullifier: ${proofId}`
    },
    whitepaper: {
      metadata: {
        title: "Riska Whitepaper - Life Protection with 30-Year Programmed Income",
        description:
          "Explore how riska.world combines life protection, long-term premium accumulation, verified death claims, and programmed payouts after a 30-year maturity period."
      },
      header: {
        badge: "Riska Foundation",
        title: "Riska: Life Protection with 30-Year Programmed Income",
        date: "November 2025"
      },
      download: {
        label: "Download white paper v2",
        note: "Prepared for World Chain grant review: Riska 30 product thesis, contract lifecycle, grant milestones, and risk scope."
      },
      abstract: {
        title: "Abstract",
        paragraphs: [
          "We present a 30-year life protection contract with a fixed 30 USDC monthly premium. If verified death occurs after the 12-month waiting period and before maturity, beneficiaries receive 80% of paid premiums. If the holder completes the term, the holder receives 100% of scheduled principal through 10 years of programmed withdrawals.",
          "Riska integrates World Chain to anchor participation to human-verified accounts. World Chain proof-of-personhood helps deter duplicate-policy abuse while keeping biometric data outside the protocol. Production onboarding adds passport-based KYC and FaceID/liveness matching. Death claims require a reporter, Riska Team verification, evidence hashes, and a dispute window."
        ]
      },
      introduction: {
        title: "1. Introduction",
        paragraphs: [
          "Riska focuses on a single product: a life policy that becomes programmed income after 30 years. Legacy life and retirement products are often opaque about fees, reserves, surrender value, and payout mechanics. Riska makes the policy state, payment history, maturity date, and payout rules inspectable.",
          "The contract does not attempt to be a full pension system at launch. It implements a bounded product: pay a published beneficiary formula before maturity and return scheduled principal to the holder after maturity. Yield strategies can fund protocol economics, but they must be separated from the user-facing principal promise."
        ],
        goalsTitle: "Design Goals",
        goals: [
          "Make the 30-year term, maturity, and payout schedule explicit.",
          "Keep protected principal, yield reserves, treasury balances, and beneficiary obligations separate.",
          "Pay beneficiaries under the 12-month waiting period and 80% formula when death is verified before maturity.",
          "Pay the holder 100% of scheduled principal through programmed withdrawals after maturity.",
          "Keep legal terms versioned through document hashes."
        ]
      },
      systemOverview: {
        title: "2. System Overview",
        paragraphs: [
          "Participants interact with a 30-year policy contract. A plan defines the 30 USDC monthly premium, 12-month waiting period, beneficiary payout formula, payout duration, inactivity review rules, and the hash of the legal policy document.",
          "Before maturity, the policy is active while premiums are current or inside the grace period. If the holder dies after 12 paid months and the death is verified, beneficiaries receive 80% of paid premiums.",
          "At maturity, the policy converts into programmed income. The holder activates retirement payouts, and the contract releases 100% of scheduled principal over 120 monthly withdrawals. If verified death occurs after maturity, beneficiaries receive 90% of the matured or remaining balance."
        ],
        everydayIntuition: {
          title: "Everyday Intuition",
          body: "Riska 30 is a promise with published outcomes: after the waiting period your family has a formula payout, and if you complete 30 years you collect the scheduled principal."
        }
      },
      userLifecycle: {
        title: "3. How It Works (User Lifecycle)",
        steps: [
          {
            label: "Verify identity.",
            description: "Authenticate with World ID and complete KYC before activating a real-money policy."
          },
          { label: "Accept policy terms.", description: "Review premium, waiting period, beneficiary formula, maturity date, payout duration, beneficiaries, and the terms hash." },
          { label: "Pay premium.", description: "The contract opens the policy and accounts the monthly USDC payment as protected principal." },
          { label: "Maintain coverage.", description: "Scheduled payments keep the policy active through the 30-year contribution term." },
          { label: "Collect outcome.", description: "Beneficiaries are paid under the published formula after verified death, or the holder collects 100% principal after maturity." }
        ],
        examples: {
          title: "Concrete Examples",
          items: [
            {
              label: "Before maturity:",
              description: "Alice pays premiums for 12 years and dies while covered. A verifier confirms the event, and her beneficiaries receive 80% of paid premiums."
            },
            {
              label: "At maturity:",
              description: "Bruno completes 30 years of payments. The policy matures, and he activates 120 monthly payments of 90 USDC."
            },
            {
              label: "During payout:",
              description: "Carla starts receiving retirement payments. If she dies before the balance is fully distributed, 90% of the remaining balance can route to her beneficiaries after verification."
            },
            {
              label: "Missed payments:",
              description: "If a holder misses payments for 12 months, the policy can enter inactivity review. Inactivity alone does not prove death or authorize payout."
            }
          ]
        }
      },
      capital: {
        title: "4. Principal, Yield, and Solvency",
        paragraphs: [
          "Each 30 USDC premium is protected principal for the base policy promise. Protocol income should come from yield spread, treasury subsidy, sponsor subsidy, or explicit external fees rather than reducing the protected principal.",
          "Yield-bearing strategies introduce additional risk and require separate accounting. The contract system should expose protected principal liabilities, treasury balances, yield reserves, strategy exposure, available liquidity, and beneficiary payout obligations."
        ],
        example: {
          title: "Base Example",
          body: "A holder who pays 30 USDC for 360 months contributes 10,800 USDC. At maturity, the holder receives 10,800 USDC over 120 payments, or 90 USDC per month."
        }
      },
      eventVerification: {
        title: "5. Death Verification",
        paragraphs: [
          "Reliable data is essential for beneficiary protection. A 12-month period without premium payment or payout claims can trigger inactivity review, but inactivity alone does not prove death. A reporter must submit a death report, Riska Team must verify it, and the system should record an evidence hash and dispute window before settlement."
        ],
        plainLanguage: {
          title: "Plain-Language View",
          body: "The contract does not decide whether a person died by itself. It records verified reports and then applies the published payout formula."
        }
      },
      claims: {
        title: "6. Maturity and Payouts",
        paragraphs: [
          "Maturity is deterministic: after 30 years, the policy can be activated for programmed payouts. The holder receives 100% of scheduled principal over 10 years instead of a lifetime annuity.",
          "If verified death occurs after maturity but before activation, or during the payout phase, beneficiaries receive 90% of the matured or remaining balance."
        ]
      },
      incentives: {
        title: "7. Economic Incentives and Capital Flow (RISKA)",
        intro: "The RISKA token starts as centralized governance for protocol parameters, enterprise distribution, and future decentralization.",
        points: [
          {
            label: "Riska Foundation:",
            description: "Initially controls the full 100,000-token supply and uses governance to manage protocol parameters, upgrades, and partner access."
          },
          {
            label: "Verifiers:",
            description: "Riska Team verifies death reports at launch; later verifier sets can be expanded and bonded through governance."
          },
          {
            label: "Policyholders and families:",
            description: "Contribute toward future programmed income while keeping beneficiary protection active before maturity."
          }
        ],
        feeParagraph:
          "RISKA has a fixed supply of 100,000 tokens, 0 decimals, and transferability from day 1. Protocol economics are expected to come from yield strategies, treasury subsidy, sponsor subsidy, or explicit fees, not from reducing the protected principal owed to policyholders.",
        example: {
          title: "Governance Posture",
          body: "Because the owner/foundation controls all RISKA at launch, governance is centralized first. The decentralization path should be disclosed before presenting Riska as community-governed."
        }
      },
      governance: {
        title: "8. Yield Risk and Governance",
        paragraphs: [
          "Plans publish principal liabilities, utilization, strategy exposure, available liquidity, beneficiary payouts, and yield reserve status. Issuance or yield deployment should halt when safe limits would be breached.",
          "Governance controls verifier sets, yield-strategy allowlists, caps, upgrade timelocks, fee routing, and emergency actions. Even while centralized, admin actions should use multisig, timelock, and public event trails."
        ]
      },
      security: {
        title: "9. Security Model and Fraud Prevention",
        points: [
          {
            label: "Minimize trust:",
            description: "Contracts should minimize privileged actions, use scoped emergency controls, and route upgrades through transparent governance."
          },
          {
            label: "Data minimization:",
            description: "Only necessary policy, KYC approval, and death-report references live on-chain while passport and FaceID evidence remain off-chain with cryptographic proofs."
          },
          {
            label: "Human verification:",
            description: "World Chain proof-of-personhood enforces one-policy-per-person, deterring sybil fraud and mass-claim bots without storing raw biometrics on Riska."
          },
          {
            label: "Auditability:",
            description: "Every decision—accept, deny, dispute, strategy change, and payout—is stored on-chain for public review."
          }
        ]
      },
      applications: {
        title: "10. Practical Applications",
        paragraphs: [
          "The first application is Riska 30: a long-duration policy for people who want family protection while building a future payout stream.",
          "Families choose the product because the outcome is direct: if the holder dies before maturity, beneficiaries receive support; if the holder completes the term, the holder receives programmed income.",
          "Employers, unions, and communities can sponsor premiums for verified members while the policy state remains auditable."
        ]
      },
      faq: {
        title: "11. FAQ",
        items: [
          {
            question: "How are prices set?",
            answer: "The base plan publishes a 30 USDC monthly premium, 12-month waiting period, 80% beneficiary formula before maturity, 90% beneficiary formula after maturity, and 10-year holder payout after maturity."
          },
          {
            question: "What if data feeds fail?",
            answer: "The MVP uses approved verifiers. Production should use multiple reporters, dispute windows, and bonded verification before large-scale deployment."
          },
          {
            question: "Can a pool run out of funds?",
            answer: "Protected principal and beneficiary obligations are tracked as liabilities. Yield strategy exposure must be capped, monitored, and backed by emergency withdrawal and loss-accounting rules."
          },
          {
            question: "Where does RISKA matter day-to-day?",
            answer: "RISKA controls governance parameters, verifier sets, strategy allowlists, partner access, and the future decentralization path."
          },
          {
            question: "Is this a pension?",
            answer: "The MVP is programmed income from accumulated balance, not a lifetime pension. Legal classification depends on jurisdiction and must be handled before public sale."
          }
        ]
      },
      conclusion: {
        title: "12. Conclusion",
        paragraphs: [
          "Riska replaces vague long-term promises with explicit policy states: active contribution, beneficiary protection, maturity, programmed payout, and closure. The first product is intentionally scoped so the contract can be audited before expanding into more complex retirement or insurance structures."
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
      title: "Riska.world - Protección de vida + renta a 30 años",
      description:
        "Riska combina protección de vida con una póliza USDC a 30 años: después de 12 meses, los beneficiarios cobran por fórmula; al madurar, el titular cobra 100% del principal en 10 años."
    },
    navbar: {
      brand: "RISKA",
      links: [
        { href: "/#enroll", label: "Inscripcion" },
        { href: "/#rules", label: "Reglas" },
        { href: "/whitepaper", label: "White paper" },
        { href: "/docs", label: "Contratos" }
      ],
      cta: "Empezar",
      languageToggle: {
        label: "EN",
        ariaLabel: "Cambiar a inglés"
      }
    },
    hero: {
      badge: "Riska 30 · Protección de vida + renta programada",
      title: "30 USDC por mes. Si llegas a madurez, cobras 100%.",
      description:
        "Riska convierte el seguro de vida en una póliza USDC de largo plazo. Después de 12 meses pagos, los beneficiarios verificados pueden cobrar 80% de las primas pagadas si el titular fallece antes de madurar. A los 30 años, el titular cobra 100% del principal en 10 años.",
      chips: [
        "Prima mensual de 30 USDC",
        "Espera de 12 meses",
        "Fórmula de 80% a beneficiarios",
        "100% del principal al madurar"
      ]
    },
    impactMetrics: {
      title: "Reglas del producto",
      subtitle:
        "Una póliza, resultados publicados: soporte a beneficiarios después de la espera, renta programada cuando completa los 30 años.",
      body:
        "La promesa base está denominada en USDC: 80% de primas pagadas a beneficiarios por fallecimiento verificado desde el mes 12 hasta madurez, 90% del saldo maduro o restante después de madurar, y 100% del principal al titular si completa el plazo.",
      metrics: [
        { label: "Plazo de aporte", value: "30 años" },
        { label: "Prima mensual", value: "30 USDC" },
        { label: "Espera", value: "12 meses" },
        { label: "Después de madurar", value: "Pago a 10 años" },
        { label: "Términos", value: "Auditables" },
        { label: "Identidad", value: "Humano verificado" }
      ]
    },
    aboutSections: {
      sections: [
        {
          title: "Contrato de vida a 30 años",
          description:
            "Cada póliza publica la prima de 30 USDC, fecha de madurez, espera, fórmula de beneficiarios y método de renta programada.",
          points: [
            "El titular aporta durante 30 años",
            "El hash de los términos legales queda vinculado a la póliza on-chain",
            "El estado es visible: activa, gracia, madura, en pago o cerrada"
          ]
        },
        {
          title: "Fase de protección familiar",
          description:
            "Antes de madurar, la póliza paga a beneficiarios solo bajo la fórmula publicada y después de verificar el fallecimiento.",
          points: [
            "Los beneficiarios se definen al crear la póliza",
            "Los reportes de fallecimiento se verifican antes del pago",
            "Desde el mes 12 hasta madurez, los beneficiarios cobran 80% de primas pagadas después de aprobación"
          ]
        },
        {
          title: "Fase de renta",
          description:
            "Después de 30 años, la póliza madura y convierte el principal programado en pagos programados.",
          points: [
            "La madurez depende del tiempo y no requiere oráculo",
            "El titular cobra 100% del principal programado en 120 pagos mensuales",
            "Los beneficiarios cobran 90% del saldo maduro o restante si hay fallecimiento verificado después de madurar"
          ]
        }
      ]
    },
    valueGrid: {
      title: "Componentes del contrato",
      subtitle:
        "El protocolo se enfoca en un producto defendible: protección de vida durante la acumulación y renta programada al madurar.",
      values: [
        {
          title: "Términos electrónicos",
          description:
            "Un documento firmado define cobertura, beneficiarios, primas, madurez, calendario de pagos y disputas. Su hash queda on-chain."
        },
        {
          title: "Principal y yield",
          description:
            "La prima mensual de 30 USDC es principal protegido para la promesa base. La economía del protocolo viene de estrategias de yield permitidas y se contabiliza aparte."
        },
        {
          title: "Fórmula de beneficiarios",
          description:
            "Antes de 12 meses pagos no hay pago de póliza. Desde el mes 12 hasta madurez, los beneficiarios verificados reciben 80% de primas pagadas."
        },
        {
          title: "Renta programada",
          description:
            "Después de 30 años, 100% del principal programado se convierte en retiros fijos durante 10 años."
        },
        {
          title: "Acceso verificado",
          description:
            "World Chain limita abuso por pólizas duplicadas mientras mantiene un onboarding nativo con wallet."
        }
      ]
    },
    retirementProduct: {
      badge: "Contrato Riska 30",
      title: "Una póliza de vida que se transforma en renta después de 30 años.",
      subtitle:
        "Riska 30 mantiene la promesa explícita: 30 USDC por mes, espera de 12 meses, 80% a beneficiarios antes de madurez y 100% del principal al titular al madurar.",
      timelineTitle: "Ciclo de vida de la póliza",
      timeline: [
        {
          label: "Años 0-30",
          description: "El titular paga 30 USDC por mes. El principal se acumula hacia la promesa de madurez a 30 años."
        },
        {
          label: "Si ocurre fallecimiento",
          description: "Después de 12 meses pagos, un reclamo de fallecimiento verificado paga a beneficiarios 80% de primas pagadas antes de madurez."
        },
        {
          label: "Año 30",
          description: "La póliza madura por tiempo. No se requiere un oráculo de fallecimiento para habilitar la fase de renta."
        },
        {
          label: "Después de madurar",
          description: "El titular cobra 100% del principal programado en 10 años; fallecimiento verificado deriva 90% del saldo restante a beneficiarios."
        }
      ],
      economicsTitle: "Economía de la póliza",
      economics: [
        {
          label: "Principal protegido",
          value: "30 USDC/mes",
          description: "La base usada para fórmulas de beneficiarios y pago de madurez."
        },
        {
          label: "Estrategia de yield",
          value: "Ingreso del protocolo",
          description: "Los fondos pueden prestarse en protocolos permitidos para generar yield destinado a reservas y operación."
        },
        {
          label: "Gobernanza RISKA",
          value: "100.000 supply",
          description: "El token sin decimales empieza centralizado y transferible, con camino futuro de descentralización."
        }
      ],
      contractNote:
        "Los contratos productivos deben reescribirse alrededor de World ID, KYC, múltiples beneficiarios, contabilidad de yield, gobernanza upgradeable y la fórmula final de pagos."
    },
    contracts: {
      title: "Contratos del protocolo",
      subtitle:
        "Los módulos actuales de prueba de Riska están desplegados en World Chain Sepolia. Cada módulo desplegado incluye enlace al explorador y referencia de código local.",
      addressLabel: "Dirección del contrato",
      pendingLabel: "Despliegue pendiente",
      explorerLabel: "Ver en el explorador",
      docsLabel: "Documentación",
      items: [
        {
          id: "thirtyYearPolicy",
          name: "RiskaThirtyYearPolicy",
          description:
            "Ciclo de vida MVP para aportes a 30 años, pago por fallecimiento, activación por madurez y renta programada."
        },
        {
          id: "policyManager",
          name: "PolicyManager",
          description:
            "Emite NFTs de cobertura, gestiona el ciclo de vida de las pólizas y expone controles de suscripción."
        },
        {
          id: "beneficiaryRegistry",
          name: "BeneficiaryRegistry",
          description:
            "Guarda wallets de beneficiarios y porcentajes de asignación para cada póliza abierta por el manager."
        },
        {
          id: "deathVerifier",
          name: "DeathVerifier",
          description:
            "Recibe reportes verificados de fallecimiento, guarda hashes de evidencia y autoriza pagos a beneficiarios."
        },
        {
          id: "premiumVault",
          name: "PremiumVault",
          description:
            "Resguarda la liquidez, lleva los saldos de los pools y libera capital para pagos."
        },
        {
          id: "mockUsdc",
          name: "MockUSDC",
          description:
            "Token ERC-20 de prueba usado en Sepolia para el flujo de emisión y aprobación de la primera prima."
        }
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
    contractDocs: {
      thirtyYearPolicy: {
        title: "RiskaThirtyYearPolicy",
        summary:
          "El contrato MVP para Riska 30: una póliza de aportes a 30 años que protege beneficiarios antes de la madurez y paga al titular con retiros programados después de madurar.",
        status: "Desplegado en World Chain Sepolia para flujos de prueba. No auditado para fondos productivos.",
        responsibilities: [
          "Crear planes con prima, beneficio por fallecimiento, porcentajes de asignación, meses de pago y hash de términos.",
          "Abrir pólizas con titular, beneficiario, fecha de madurez, fecha cubierta y saldo de retiro.",
          "Cobrar primas y separar saldo de retiro, reserva de riesgo y fees del protocolo.",
          "Liquidar reclamos de fallecimiento verificados antes de madurar y activar pagos programados al madurar."
        ],
        interfaceItems: [
          {
            name: "createPlan",
            description: "Crea un plan de póliza con economía publicada y hash de los términos electrónicos."
          },
          {
            name: "openPolicy",
            description: "Inicia una póliza, registra beneficiario y cobra la primera prima."
          },
          {
            name: "payPremium",
            description: "Extiende la cobertura por uno o más períodos de pago y actualiza el saldo de retiro."
          },
          {
            name: "reportDeath",
            description: "Permite que el verificador aprobado envíe un hash de evidencia y liquide el pago al beneficiario."
          },
          {
            name: "activateRetirement",
            description: "Convierte una póliza madura en retiros programados para el titular."
          },
          {
            name: "claimRetirementPayout",
            description: "Libera el siguiente pago programado y cierra la póliza cuando se agota el saldo."
          }
        ],
        safeguards: [
          "Un guard de no reentrada cubre cobro de primas, reclamos, fondeo de reserva, retiros de fees y pagos.",
          "Los beneficios por fallecimiento solo se liquidan si la liquidez de riesgo cubre el beneficio configurado.",
          "Los saldos de retiro se registran como pasivos del protocolo y se separan del balance de fees.",
          "Los términos del plan quedan anclados con un hash para auditar la versión legal aceptada."
        ],
        sourceNote:
          "El código de abajo es la implementación MVP incluida en este repositorio. Debe auditarse antes de uso productivo."
      },
      policyManager: {
        title: "PolicyManager",
        summary:
          "El módulo de registro y emisión de pólizas desplegadas. En Riska 30, es donde una póliza electrónica firmada se convierte en una referencia on-chain.",
        status: "Desplegado en World Chain Sepolia y conectado con registry, verifier y vault.",
        responsibilities: [
          "Vincular titular, beneficiario, plan y hash de términos a un registro on-chain duradero.",
          "Exponer el estado de ciclo de vida para que la app muestre si la cobertura está activa, en gracia, madura o cerrada.",
          "Coordinar con el vault y los módulos de verificación cuando un reclamo o madurez cambia el estado.",
          "Mantener metadata de pólizas accesible para wallets, exploradores e integraciones."
        ],
        interfaceItems: [
          {
            name: "Emisión de póliza",
            description: "Crea el registro de cobertura después de que el usuario acepta el contrato electrónico y paga la prima requerida."
          },
          {
            name: "Registro de beneficiario",
            description: "Guarda o referencia el beneficiario elegido por el titular al crear la póliza."
          },
          {
            name: "Estado de ciclo de vida",
            description: "Publica el estado actual de la póliza para la web, exploradores e integraciones."
          },
          {
            name: "Referencia de términos",
            description: "Vincula la póliza al hash exacto del documento legal aceptado por el titular."
          }
        ],
        safeguards: [
          "La emisión debe estar limitada por reglas de suscripción, identidad verificada y capacidad del pool.",
          "Los cambios de ciclo de vida deben emitir eventos para auditoría pública.",
          "Los registros no deben guardar evidencia sensible directamente on-chain.",
          "Los permisos administrativos deben migrar a timelocks o gobernanza antes de escalar."
        ],
        sourceNote:
          "El código local de abajo corresponde al contrato usado en el despliegue actual de World Chain Sepolia."
      },
      beneficiaryRegistry: {
        title: "BeneficiaryRegistry",
        summary:
          "El módulo de registro que guarda wallets de beneficiarios y porcentajes de asignación para cada póliza creada por el policy manager.",
        status: "Desplegado en World Chain Sepolia y restringido para que solo el policy manager pueda escribir beneficiarios.",
        responsibilities: [
          "Guardar cuentas de beneficiarios y asignaciones en basis points para cada póliza.",
          "Rechazar conjuntos vacíos, duplicados, con dirección cero o con demasiados beneficiarios.",
          "Exigir que los porcentajes sumen 100%.",
          "Exponer cantidad e índices de beneficiarios para pagos y vistas de la app."
        ],
        interfaceItems: [
          {
            name: "setPolicyManager",
            description: "Define el único contrato autorizado a escribir registros de beneficiarios."
          },
          {
            name: "setBeneficiaries",
            description: "Guarda las wallets y porcentajes de beneficiarios para una póliza."
          },
          {
            name: "beneficiaryCount",
            description: "Devuelve cuántos beneficiarios tiene configurados una póliza."
          },
          {
            name: "beneficiaryAt",
            description: "Devuelve wallet y porcentaje de un beneficiario por índice."
          }
        ],
        safeguards: [
          "Solo el policy manager configurado puede escribir datos de beneficiarios.",
          "El registro rechaza wallets duplicadas y direcciones cero.",
          "Una póliza puede tener como máximo ocho beneficiarios.",
          "Las asignaciones deben sumar exactamente 10.000 basis points."
        ],
        sourceNote:
          "El código local de abajo corresponde al contrato usado en el despliegue actual de World Chain Sepolia."
      },
      deathVerifier: {
        title: "DeathVerifier",
        summary:
          "El módulo de verificación que recibe reportes de fallecimiento, registra hashes de evidencia y autoriza pagos a beneficiarios bajo las reglas de la póliza.",
        status: "Desplegado en World Chain Sepolia con un verificador único configurado para pruebas.",
        responsibilities: [
          "Recibir reportes de fallecimiento sin almacenar documentos privados directamente on-chain.",
          "Registrar el hash o referencia de la evidencia off-chain usada por el verificador.",
          "Autorizar la liquidación del reclamo solo después del proceso de verificación.",
          "Dejar una traza auditable para beneficiarios, gobernanza y futuras ventanas de disputa."
        ],
        interfaceItems: [
          {
            name: "Referencia de evidencia",
            description: "Guarda una referencia criptográfica a los documentos o atestaciones usados en la verificación."
          },
          {
            name: "Autorización de verificador",
            description: "Restringe la autorización de liquidación a reporteros aprobados en el MVP."
          },
          {
            name: "Señal de reclamo",
            description: "Notifica al módulo de póliza que puede ejecutarse el pago al beneficiario."
          },
          {
            name: "Camino de disputa",
            description: "Permite evolucionar hacia quórum, reporteros con stake y ventanas de disputa."
          }
        ],
        safeguards: [
          "Documentos médicos, civiles o de identidad deben permanecer off-chain.",
          "Los cambios de verificador deben pasar por gobernanza y emitir eventos.",
          "Los reclamos grandes deben soportar múltiples reporteros y demora antes de liquidación final.",
          "Las referencias de evidencia deben ser inmutables después de liquidar."
        ],
        sourceNote:
          "El código local de abajo corresponde al contrato usado en el despliegue actual de World Chain Sepolia."
      },
      premiumVault: {
        title: "PremiumVault",
        summary:
          "El módulo de liquidez y contabilidad para primas, reservas, pasivos, fees y pagos. Esta es la página que reemplaza el enlace externo roto de premium-vault.",
        status: "Desplegado en World Chain Sepolia y autorizado a recibir llamadas del policy manager.",
        responsibilities: [
          "Recibir flujos de primas desde los contratos de póliza y contabilizar a dónde pertenece cada unidad de capital.",
          "Separar pasivos de retiro de la liquidez de riesgo usada para beneficios por fallecimiento.",
          "Liberar pagos aprobados a beneficiarios, retiros por madurez y retiros permitidos de fees.",
          "Exponer datos de reservas y pasivos para que la web muestre solvencia y capacidad de pago."
        ],
        interfaceItems: [
          {
            name: "Ingreso de primas",
            description: "Recibe fondos desde flujos de póliza y los atribuye a saldo de retiro, reserva de riesgo y fees."
          },
          {
            name: "Contabilidad de reservas",
            description: "Rastrea el capital que respalda beneficios por fallecimiento separado de los pasivos de retiro."
          },
          {
            name: "Liberación de pagos",
            description: "Transfiere fondos solo cuando el módulo de póliza o verificador autorizó un reclamo o retiro programado."
          },
          {
            name: "Retiro de fees",
            description: "Permite retirar fees del protocolo únicamente desde el balance contable de fees."
          }
        ],
        safeguards: [
          "Los pasivos de retiro no deben tratarse como capital libre de riesgo.",
          "Los pagos por fallecimiento deben fallar si la liquidez de riesgo no alcanza.",
          "Los retiros de tesorería nunca deben tocar saldos de retiro de usuarios.",
          "Las operaciones del vault deben emitir eventos por prima recibida, fondeo de reserva, pago y retiro de fees."
        ],
        sourceNote:
          "El código local de abajo corresponde al contrato usado en el despliegue actual de World Chain Sepolia."
      },
      mockUsdc: {
        title: "MockUSDC",
        summary:
          "Token ERC-20 de prueba con seis decimales usado como token de pago para tests de emisión en World Chain Sepolia.",
        status: "Desplegado en World Chain Sepolia. El deployer minteó 20.000 MockUSDC para flujos de inscripción de prueba.",
        responsibilities: [
          "Representar un token tipo USDC en flujos de testnet.",
          "Exponer seis decimales para coincidir con la matemática de la póliza.",
          "Permitir minteo de prueba para wallets que necesiten fondos de prima.",
          "Servir como token aprobado por titulares antes de abrir una póliza."
        ],
        interfaceItems: [
          {
            name: "decimals",
            description: "Devuelve 6 para contabilidad estilo USDC."
          },
          {
            name: "mint",
            description: "Mintea tokens de prueba para desarrollo y emisión testnet."
          },
          {
            name: "approve",
            description: "Permite que el titular apruebe al vault para cobrar la primera prima."
          },
          {
            name: "balanceOf",
            description: "Muestra el balance de prueba disponible para una wallet."
          }
        ],
        safeguards: [
          "Este token es solo de testnet y no tiene valor productivo.",
          "El minteo abierto es intencional en el mock para facilitar desarrollo.",
          "Producción debe usar un token de pago real y allowlisted.",
          "La app etiqueta este despliegue como World Chain Sepolia."
        ],
        sourceNote:
          "El código local de abajo es el ERC-20 mock usado en el despliegue actual de World Chain Sepolia."
      }
    },
    docsPage: {
      metadata: {
        title: "Documentación del protocolo Riska",
        description:
          "Consulta direcciones de contratos, documentación interna y puntos de integración de Riska."
      },
      hero: {
        badge: "Documentación",
        title: "Construye con el protocolo Riska",
        description:
          "Explora direcciones de contratos, recursos de integración y referencias para socios en World Chain.",
        primaryCta: "Ver direcciones de contratos",
        secondaryCta: "Abrir libro blanco"
      }
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
          description: "Cada reporte de fallecimiento, activación de madurez y evento de pago se registra para revisión pública y gobernanza."
        },
        {
          title: "Gobernanza",
          description: "La gobernanza RISKA empieza centralizada y luego puede expandirse con distribución transparente a partners y comunidad."
        }
      ]
    },
    callToAction: {
      title: "Descarga el white paper de Riska 30",
      subtitle:
        "Preparado para evaluación de grants: tesis del producto, alineación con World Chain, ciclo de póliza, contrato, roadmap y riesgos.",
      primary: "Abrir white paper",
      secondary: "Contactar a Fundación Riska"
    },
    footer: {
      note: "© {year} riska.world · Protección de vida con renta programada a 30 años.",
      worldChain: "World Chain",
      email: "hey@riska.world"
    },
    walletAuth: {
      heading: "Consola Riska 30",
      description:
        "Inicia sesión desde World App para revisar estado de póliza a 30 años, beneficiarios, historial de primas, fecha de madurez y estado de renta programada.",
      miniApp: {
        label: "Puente Mini App",
        checking: "Detectando contexto de World App…",
        installed: "World App detectada. Wallet Auth se verificará en el backend de Riska.",
        browserFallback: "Modo navegador activo. Usa la wallet web como fallback para revisión local."
      },
      statusLabel: "Estado",
      status: {
        connected: (address: string) => `Sesión conectada: ${address}`,
        connecting: "Conectando…",
        disconnected: "No conectado"
      },
      chainId: (chainId: number) => `Chain ID: ${chainId}`,
      mode: {
        "world-app": "World App",
        browser: "Wallet navegador"
      },
      actions: {
        connectWorldApp: "Entrar con World App",
        connectBrowser: "Conectar wallet web",
        connecting: "Conectando…",
        disconnect: "Desconectar"
      },
      messages: {
        welcome: "Bienvenido a Riska 30. Wallet Auth fue completado y la sesión queda lista para el siguiente paso de onboarding.",
        disconnected: "Sesión cerrada. Vuelve a conectar para gestionar pólizas, beneficiarios y pagos por madurez.",
        error: "No se pudo conectar la wallet.",
        nonceError: "No se pudo preparar el nonce de Wallet Auth.",
        verifyError: "No se pudo verificar la firma de Wallet Auth.",
        worldAppRequired: "Abre Riska dentro de World App para usar Wallet Auth de Mini App."
      }
    },
    worldIdGate: {
      heading: "Un humano, una póliza",
      description:
        "Verifica Proof of Human con IDKit antes de activar una póliza. Riska guarda el nullifier de World ID en backend para que el mismo humano verificado no pueda reservar una segunda póliza.",
      statusLabel: "Gate World ID",
      statuses: {
        locked: "Primero conecta una wallet para atar la prueba a esa dirección.",
        ready: "Listo para pedir una prueba World ID para esta wallet.",
        loading: "Preparando una solicitud World ID firmada…",
        verified: "Humano único verificado. Esta wallet puede seguir a KYC y beneficiarios.",
        error: "La verificación World ID necesita atención.",
        notConfigured: "Falta configurar la app de World ID."
      },
      action: "Verificar humano",
      actionLoading: "Preparando prueba…",
      walletRequired: "Conecta Wallet Auth antes de pedir World ID.",
      configMissing: "Configura NEXT_PUBLIC_WORLD_APP_ID antes de abrir IDKit.",
      signatureError: "No se pudo crear la solicitud RP firmada.",
      verifyError: "No se pudo verificar la prueba de World ID.",
      duplicateError: "Este humano verificado ya está reservado para una póliza Riska.",
      errorPrefix: "Error IDKit:",
      errors: {
        cancelled: "Cancelaste la verificación. No se reservó ninguna póliza.",
        connection_failed: "La conexión con World App se interrumpió. Revisa tu conexión e inténtalo de nuevo.",
        credential_unavailable:
          "Esta cuenta de World App todavía no está verificada como humana. Completa la verificación de World ID en World App y vuelve a intentarlo en Riska.",
        failed_by_host_app:
          "Riska no pudo aceptar la prueba. Vuelve a conectar tu sesión de wallet e inténtalo otra vez.",
        generic_error: "No pudimos completar la verificación de World ID. Inténtalo de nuevo.",
        identity_attributes_not_matched:
          "Este World ID no cumple los requisitos de prueba para una póliza Riska.",
        inclusion_proof_failed:
          "World App no pudo preparar la prueba para esta cuenta. Espera un momento e inténtalo de nuevo.",
        inclusion_proof_pending:
          "Tu prueba de World ID todavía se está preparando. Espera un momento e inténtalo de nuevo.",
        invalid_network: "World ID devolvió una prueba para la red incorrecta. Inténtalo de nuevo desde World App.",
        invalid_rp_signature:
          "La configuración de World ID de Riska necesita una corrección antes de continuar.",
        malformed_request: "La solicitud de World ID no se pudo leer. Refresca Riska e inténtalo de nuevo.",
        max_verifications_reached:
          "Este World ID ya fue usado para esta verificación de Riska.",
        nullifier_replayed:
          "Este World ID ya está reservado para esta verificación de Riska.",
        timeout: "World App tardó demasiado en responder. Inténtalo de nuevo.",
        unexpected_response:
          "World App devolvió una respuesta inesperada. Actualiza World App e inténtalo de nuevo.",
        user_rejected: "Cancelaste la verificación. No se reservó ninguna póliza.",
        verification_rejected:
          "World App rechazó la verificación. Asegúrate de que tu cuenta esté verificada e inténtalo de nuevo.",
        world_id_3_not_available:
          "Esta cuenta de World App todavía no puede crear la prueba requerida. Completa la verificación e inténtalo de nuevo.",
        world_id_4_not_available:
          "Esta cuenta de World App todavía no puede crear la prueba requerida. Actualiza World App o completa la verificación, y vuelve a intentarlo."
      },
      signalLabel: (signal: string) => `Signal: ${signal}`,
      proofLabel: (proofId: string) => `Nullifier reservado: ${proofId}`
    },
    whitepaper: {
      metadata: {
        title: "Libro blanco de Riska - Protección de vida con renta programada a 30 años",
        description:
          "Explora cómo riska.world combina protección de vida, acumulación de primas, reclamos verificados por fallecimiento y pagos programados después de una madurez de 30 años."
      },
      header: {
        badge: "Fundación Riska",
        title: "Riska: Protección de vida con renta programada a 30 años",
        date: "Noviembre 2025"
      },
      download: {
        label: "Descargar white paper v2",
        note: "Preparado para evaluación de grants en World Chain: tesis de Riska 30, ciclo contractual, hitos y alcance de riesgos."
      },
      abstract: {
        title: "Resumen",
        paragraphs: [
          "Presentamos un contrato de protección de vida a 30 años con prima fija de 30 USDC mensuales. Si hay fallecimiento verificado después de la espera de 12 meses y antes de madurez, los beneficiarios cobran 80% de las primas pagadas. Si el titular completa el plazo, cobra 100% del principal programado mediante retiros durante 10 años.",
          "Riska se integra con World Chain para anclar la participación a cuentas verificadas como humanas. La prueba de humanidad ayuda a frenar abuso por pólizas duplicadas sin guardar datos biométricos en el protocolo. Producción suma KYC con pasaporte y FaceID/liveness. Los reclamos por fallecimiento requieren reportero, verificación del Riska Team, hashes de evidencia y ventana de disputa."
        ]
      },
      introduction: {
        title: "1. Introducción",
        paragraphs: [
          "Riska se enfoca en un solo producto: una póliza de vida que se convierte en renta programada después de 30 años. Los productos tradicionales de vida y retiro suelen ser opacos en fees, reservas, valor de rescate y mecánica de pagos. Riska hace inspeccionables el estado de la póliza, historial de pagos, fecha de madurez y reglas de renta.",
          "El contrato no intenta ser un sistema jubilatorio completo en el lanzamiento. Implementa un producto acotado: pagar una fórmula publicada a beneficiarios antes de madurez y devolver el principal programado al titular después de madurar. Las estrategias de yield pueden financiar la economía del protocolo, pero deben separarse de la promesa base de principal."
        ],
        goalsTitle: "Objetivos de diseño",
        goals: [
          "Hacer explícitos el plazo de 30 años, la madurez y el calendario de pagos.",
          "Separar principal protegido, reservas de yield, tesorería y obligaciones a beneficiarios.",
          "Pagar a beneficiarios bajo la espera de 12 meses y fórmula de 80% cuando se verifica fallecimiento antes de madurez.",
          "Pagar al titular 100% del principal programado mediante retiros después de madurar.",
          "Versionar términos legales mediante hashes de documentos."
        ]
      },
      systemOverview: {
        title: "2. Visión general del sistema",
        paragraphs: [
          "Los participantes interactúan con un contrato de póliza a 30 años. Un plan define prima mensual de 30 USDC, espera de 12 meses, fórmula de pago a beneficiarios, duración de pagos, reglas de revisión por inactividad y hash del documento legal.",
          "Antes de madurar, la póliza está activa mientras las primas estén al día o dentro del período de gracia. Si el titular fallece después de 12 meses pagos y el fallecimiento se verifica, los beneficiarios reciben 80% de las primas pagadas.",
          "Al madurar, la póliza se convierte en renta programada. El titular activa pagos de retiro y el contrato libera 100% del principal programado en 120 retiros mensuales. Si hay fallecimiento verificado después de madurar, los beneficiarios reciben 90% del saldo maduro o restante."
        ],
        everydayIntuition: {
          title: "Intuición cotidiana",
          body: "Riska 30 es una promesa con resultados publicados: después de la espera tu familia tiene una fórmula de pago, y si completas 30 años cobras el principal programado."
        }
      },
      userLifecycle: {
        title: "3. Cómo funciona (ciclo de vida del usuario)",
        steps: [
          {
            label: "Verifica identidad.",
            description: "Autentícate con World ID y completa KYC antes de activar una póliza con dinero real."
          },
          {
            label: "Acepta términos de póliza.",
            description: "Revisa prima, espera, fórmula de beneficiarios, fecha de madurez, duración de pagos, beneficiarios y hash de términos."
          },
          { label: "Paga la prima.", description: "El contrato abre la póliza y contabiliza el pago mensual USDC como principal protegido." },
          { label: "Mantén cobertura.", description: "Los pagos programados mantienen activa la póliza durante el plazo de aporte de 30 años." },
          { label: "Cobra resultado.", description: "Los beneficiarios cobran bajo la fórmula publicada tras fallecimiento verificado, o el titular cobra 100% del principal después de madurar." }
        ],
        examples: {
          title: "Ejemplos concretos",
          items: [
            {
              label: "Antes de madurar:",
              description: "Alicia paga primas durante 12 años y fallece con cobertura. Un verificador confirma el evento y sus beneficiarios reciben 80% de las primas pagadas."
            },
            {
              label: "Al madurar:",
              description: "Bruno completa 30 años de pagos. La póliza madura y activa 120 pagos mensuales de 90 USDC."
            },
            {
              label: "Durante el cobro:",
              description: "Carla empieza a recibir pagos de retiro. Si fallece antes de distribuir todo el saldo, 90% del saldo restante puede ir a sus beneficiarios después de verificación."
            },
            {
              label: "Pagos omitidos:",
              description: "Si un titular omite pagos durante 12 meses, la póliza puede entrar en revisión por inactividad. La inactividad sola no prueba fallecimiento ni autoriza pagos."
            }
          ]
        }
      },
      capital: {
        title: "4. Principal, yield y solvencia",
        paragraphs: [
          "Cada prima de 30 USDC es principal protegido para la promesa base de la póliza. El ingreso del protocolo debería venir del spread de yield, subsidio de tesorería, subsidio de sponsors o fees externos explícitos, no de reducir el principal protegido.",
          "Las estrategias con yield agregan riesgo y requieren contabilidad separada. El sistema debe exponer pasivos de principal protegido, tesorería, reservas de yield, exposición por estrategia, liquidez disponible y obligaciones a beneficiarios."
        ],
        example: {
          title: "Ejemplo base",
          body: "Un titular que paga 30 USDC durante 360 meses aporta 10.800 USDC. Al madurar, cobra 10.800 USDC en 120 pagos, o 90 USDC por mes."
        }
      },
      eventVerification: {
        title: "5. Verificación de fallecimiento",
        paragraphs: [
          "Los datos confiables son esenciales para la protección de beneficiarios. Un período de 12 meses sin pago de primas o sin reclamar pagos puede disparar revisión por inactividad, pero la inactividad sola no prueba fallecimiento. Un reportero debe enviar el aviso, Riska Team debe verificarlo, y el sistema debe registrar hash de evidencia y ventana de disputa antes de liquidar."
        ],
        plainLanguage: {
          title: "Vista en lenguaje sencillo",
          body: "El contrato no decide por sí mismo si una persona falleció. Registra reportes verificados y aplica la fórmula de pago publicada."
        }
      },
      claims: {
        title: "6. Madurez y pagos",
        paragraphs: [
          "La madurez es determinista: después de 30 años, la póliza puede activarse para pagos programados. El titular cobra 100% del principal programado durante 10 años en lugar de una renta vitalicia.",
          "Si hay fallecimiento verificado después de madurar pero antes de activar, o durante la etapa de cobro, los beneficiarios reciben 90% del saldo maduro o restante."
        ]
      },
      incentives: {
        title: "7. Incentivos económicos y flujo de capital (RISKA)",
        intro: "El token RISKA empieza como gobernanza centralizada para parámetros del protocolo, distribución empresarial y futura descentralización.",
        points: [
          {
            label: "Fundación Riska:",
            description: "Controla inicialmente los 100.000 tokens y usa la gobernanza para gestionar parámetros, upgrades y acceso de partners."
          },
          {
            label: "Verificadores:",
            description: "Riska Team verifica reportes de fallecimiento al inicio; luego los conjuntos de verificadores pueden expandirse y respaldarse con bonos mediante gobernanza."
          },
          {
            label: "Titulares y familias:",
            description: "Aportan hacia renta futura mientras mantienen protección de beneficiarios antes de la madurez."
          }
        ],
        feeParagraph:
          "RISKA tiene oferta fija de 100.000 tokens, 0 decimales y transferibilidad desde el día 1. La economía del protocolo se espera desde estrategias de yield, subsidio de tesorería, subsidio de sponsors o fees explícitos, no desde reducir el principal protegido de los titulares.",
        example: {
          title: "Postura de gobernanza",
          body: "Como el owner/fundación controla todo RISKA al inicio, la gobernanza empieza centralizada. El camino de descentralización debe comunicarse antes de presentar Riska como gobernada por comunidad."
        }
      },
      governance: {
        title: "8. Riesgo de yield y gobernanza",
        paragraphs: [
          "Los planes publican pasivos de principal, utilización, exposición por estrategia, liquidez disponible, pagos a beneficiarios y estado de reservas de yield. La emisión o el despliegue de yield debe detenerse cuando se excederían límites seguros.",
          "La gobernanza controla verificadores, allowlists de estrategias de yield, límites, timelocks de upgrades, ruteo de fees y acciones de emergencia. Incluso centralizada, la administración debe usar multisig, timelock y eventos públicos."
        ]
      },
      security: {
        title: "9. Modelo de seguridad y prevención de fraude",
        points: [
          {
            label: "Minimizar confianza:",
            description: "Los contratos deben minimizar acciones privilegiadas, usar controles de emergencia acotados y rutear upgrades mediante gobernanza transparente."
          },
          {
            label: "Minimización de datos:",
            description: "Solo referencias necesarias de pólizas, aprobación KYC y reportes de fallecimiento viven on-chain mientras pasaporte y FaceID quedan off-chain con pruebas criptográficas."
          },
          {
            label: "Verificación humana:",
            description: "La prueba de humanidad de World Chain aplica una política de una persona por póliza, frenando fraudes sibilinos y bots de reclamos masivos sin almacenar biometría cruda en Riska."
          },
          {
            label: "Auditabilidad:",
            description: "Cada decisión—aceptar, negar, disputar, cambiar estrategia y pagar—se almacena on-chain para revisión pública."
          }
        ]
      },
      applications: {
        title: "10. Aplicaciones prácticas",
        paragraphs: [
          "La primera aplicación es Riska 30: una póliza de largo plazo para personas que quieren protección familiar mientras construyen un flujo de pagos futuro.",
          "Las familias eligen el producto porque el resultado es directo: si el titular fallece antes de madurar, los beneficiarios reciben soporte; si completa el plazo, el titular recibe renta programada.",
          "Empleadores, sindicatos y comunidades pueden patrocinar primas para miembros verificados mientras el estado de la póliza permanece auditable."
        ]
      },
      faq: {
        title: "11. Preguntas frecuentes",
        items: [
          {
            question: "¿Cómo se fijan los precios?",
            answer: "El plan base publica prima mensual de 30 USDC, espera de 12 meses, fórmula de 80% a beneficiarios antes de madurez, fórmula de 90% después de madurez y pago al titular durante 10 años."
          },
          {
            question: "¿Qué ocurre si fallan las fuentes de datos?",
            answer: "El MVP usa verificadores aprobados. Producción debería usar múltiples reporteros, ventanas de disputa y verificación con bonos antes de escalar."
          },
          {
            question: "¿Un pool puede quedarse sin fondos?",
            answer: "El principal protegido y las obligaciones a beneficiarios se registran como pasivos. La exposición de yield debe tener límites, monitoreo, retiro de emergencia y reglas de pérdida."
          },
          {
            question: "¿Dónde importa RISKA en el día a día?",
            answer: "RISKA controla parámetros de gobernanza, verificadores, allowlists de estrategias, acceso de partners y el camino futuro de descentralización."
          },
          {
            question: "¿Esto es una jubilación?",
            answer: "El producto usa renta programada desde principal acumulado, no una renta vitalicia ni jubilación estatal. La clasificación legal depende de la jurisdicción y debe resolverse antes de venta pública."
          }
        ]
      },
      conclusion: {
        title: "12. Conclusión",
        paragraphs: [
          "Riska reemplaza promesas vagas de largo plazo con estados explícitos: aporte activo, protección de beneficiarios, madurez, renta programada y cierre. El primer producto queda acotado a propósito para poder auditar el contrato antes de expandirse a estructuras de retiro o seguro más complejas."
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
