export type WorldIdEnvironment = "production" | "staging";

export const RISKA_WORLD_ID_POLICY_ACTION =
  process.env.NEXT_PUBLIC_WORLD_ID_POLICY_ACTION ?? "riska-policy-human-v1";

export const RISKA_WORLD_ID_ENVIRONMENT = getWorldIdEnvironment(
  process.env.NEXT_PUBLIC_WORLD_ID_ENVIRONMENT
);

export function getWorldAppId(): `app_${string}` | undefined {
  const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID;

  if (!appId || !appId.startsWith("app_")) {
    return undefined;
  }

  return appId as `app_${string}`;
}

export function normalizeWorldIdSignal(walletAddress: string) {
  return walletAddress.toLowerCase();
}

function getWorldIdEnvironment(value: string | undefined): WorldIdEnvironment {
  return value === "staging" ? "staging" : "production";
}
