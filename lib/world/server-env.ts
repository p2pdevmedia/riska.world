type RequiredEnvironment = Record<string, string>;

export function requiredEnvironment(names: string[]): RequiredEnvironment | null {
  const entries = names.map((name) => [name, process.env[name]?.trim()] as const);

  if (entries.some(([, value]) => !value)) {
    return null;
  }

  return Object.fromEntries(entries) as RequiredEnvironment;
}

export function policyHumanEnvironment(deployment: "production" | "testnet" | "prod-test") {
  const isProduction = deployment === "production" || deployment === "prod-test";
  const policyManagerName = isProduction
    ? "RISKA_WORLDCHAIN_POLICY_MANAGER"
    : "RISKA_WORLDCHAIN_SEPOLIA_POLICY_MANAGER";
  const rpcName = isProduction ? "WORLDCHAIN_RPC_URL" : "WORLDCHAIN_SEPOLIA_RPC_URL";
  const env = requiredEnvironment([
    "WORLD_ID_RP_ID",
    "POLICY_HUMAN_SIGNING_KEY",
    rpcName,
    policyManagerName
  ]);

  return env && {
    policyManager: env[policyManagerName] as `0x${string}`,
    rpId: env.WORLD_ID_RP_ID,
    rpcUrl: env[rpcName],
    signingKey: env.POLICY_HUMAN_SIGNING_KEY as `0x${string}`
  };
}
