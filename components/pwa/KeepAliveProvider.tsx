"use client";

import { useKeepAlive } from "@/hooks/useKeepAlive";

/**
 * Provider component that enables silent audio keep-alive for the PWA.
 * This prevents mobile browsers from suspending the app when the screen is off.
 *
 * Place this component near the root of your app to enable keep-alive
 * functionality. It renders no visible UI.
 */
export function KeepAliveProvider({ children }: { children: React.ReactNode }) {
  // Initialize keep-alive - it auto-starts on first user interaction
  useKeepAlive();

  return <>{children}</>;
}
