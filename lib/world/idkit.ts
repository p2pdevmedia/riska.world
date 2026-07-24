export type WorldIdEnvironment = "production" | "staging";
export type WorldIdDeployment = "production" | "prod-test" | "testnet";

export const RISKA_WORLD_ID_POLICY_ACTION =
  process.env.NEXT_PUBLIC_WORLD_ID_POLICY_ACTION ?? "riska-policy-human-v1";

export function getWorldIdEnvironmentForDeployment(deployment: WorldIdDeployment): WorldIdEnvironment {
  return deployment === "testnet" ? "staging" : "production";
}

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

export function getWorldIdSimulatorIdentitySelectorUrl(href: string) {
  try {
    const url = new URL(href);

    if (url.hostname !== "simulator.worldcoin.org") {
      return null;
    }

    url.pathname = "/select-id";
    return url.toString();
  } catch {
    return null;
  }
}
