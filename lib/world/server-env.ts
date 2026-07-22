type RequiredEnvironment = Record<string, string>;

export function requiredEnvironment(names: string[]): RequiredEnvironment | null {
  const entries = names.map((name) => [name, process.env[name]?.trim()] as const);

  if (entries.some(([, value]) => !value)) {
    return null;
  }

  return Object.fromEntries(entries) as RequiredEnvironment;
}

export function policyHumanEnvironment(deployment: "prod-test" | "testnet") {
  const policyManagerName = deployment === "prod-test"
    ? "RISKA_WORLDCHAIN_SEPOLIA_POLICY_MANAGER_PROD_TEST"
    : "RISKA_WORLDCHAIN_SEPOLIA_POLICY_MANAGER";
  const env = requiredEnvironment([
    "WORLD_ID_RP_ID",
    "POLICY_HUMAN_SIGNING_KEY",
    "WORLDCHAIN_SEPOLIA_RPC_URL",
    policyManagerName
  ]);

  return env && {
    policyManager: env[policyManagerName] as `0x${string}`,
    rpId: env.WORLD_ID_RP_ID,
    rpcUrl: env.WORLDCHAIN_SEPOLIA_RPC_URL,
    signingKey: env.POLICY_HUMAN_SIGNING_KEY as `0x${string}`
  };
}
