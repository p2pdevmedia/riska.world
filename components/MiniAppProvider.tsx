"use client";

import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";

export function MiniAppProvider({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <MiniKitProvider props={{ appId: process.env.NEXT_PUBLIC_WORLD_APP_ID }}>
      {children}
    </MiniKitProvider>
  );
}
