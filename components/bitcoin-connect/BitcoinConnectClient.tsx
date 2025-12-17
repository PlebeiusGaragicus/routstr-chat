"use client";

import { useEffect } from "react";

export default function BitcoinConnectClient() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("@getalby/bitcoin-connect-react");
        // Optional dark-mode control via class on <html>
        // @ts-ignore
        globalThis.bcDarkMode = "class";
        if (!cancelled) {
          mod.init({
            appName: "Routstr Chat",
            filters: ["nwc"],
            persistConnection: true,
            showBalance: true,
            providerConfig: {
              nwc: {
                authorizationUrlOptions: {
                  requestMethods: [
                    "pay_invoice",
                    "get_balance",
                    "make_invoice",
                    "lookup_invoice",
                  ],
                },
              },
            },
          });
        }
      } catch (err) {
        // swallow init errors to avoid breaking the app
        console.error("[BitcoinConnect] init error", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
