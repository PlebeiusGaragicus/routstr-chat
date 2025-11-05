import { http, HttpResponse, delay } from 'msw';

function getScenario(request: Request): string | null {
  const header = request.headers.get('X-Mock-Scenario');
  return header ? header.toLowerCase() : null;
}

export const handlers = [
  http.post('*/v1/chat/completions', async ({ request }) => {
    const scenario = getScenario(request);

    if (scenario && (scenario === '401' || scenario === 'unauthorized')) {
      const latency = request.headers.get('X-Mock-Latency');
      if (latency) {
        const ms = Number.isNaN(Number(latency))
          ? latency === 'slow' ? 1500 : latency === 'timeout' ? 10000 : 0
          : Number(latency);
        if (ms > 0) await delay(ms);
      }

      return HttpResponse.json(
        {
          error: {
            message: 'Unauthorized - Invalid or expired token',
            code: 'UNAUTHORIZED',
            status: 401,
          },
        },
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'x-routstr-request-id': '7ee5gg8b-9d41-5cbe-c2aa-50d0555eg07d',
          },
        }
      );
    }

    if (scenario && (scenario === '403' || scenario === 'forbidden')) {
      const latency = request.headers.get('X-Mock-Latency');
      if (latency) {
        const ms = Number.isNaN(Number(latency))
          ? latency === 'slow' ? 1500 : latency === 'timeout' ? 10000 : 0
          : Number(latency);
        if (ms > 0) await delay(ms);
      }

      return HttpResponse.json(
        {
          error: {
            message: 'Forbidden - Insufficient permissions',
            code: 'FORBIDDEN',
            status: 403,
          },
        },
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'x-routstr-request-id': '8ff6hh9c-0e52-6dcf-d3bb-61e1666fh18e',
          },
        }
      );
    }

    if (scenario && (scenario === '402' || scenario === 'payment-required')) {
      const latency = request.headers.get('X-Mock-Latency');
      if (latency) {
        const ms = Number.isNaN(Number(latency))
          ? latency === 'slow' ? 1500 : latency === 'timeout' ? 10000 : 0
          : Number(latency);
        if (ms > 0) await delay(ms);
      }

      return HttpResponse.json(
        {
          error: {
            message: 'Payment Required - Insufficient balance',
            code: 'PAYMENT_REQUIRED',
            status: 402,
          },
        },
        {
          status: 402,
          headers: {
            'Content-Type': 'application/json',
            'x-routstr-request-id': '9gg7ii0d-1f63-7edg-e4cc-72f2777gi29f',
          },
        }
      );
    }

    if (scenario && (scenario === '413' || scenario === 'payload-too-large')) {
      const latency = request.headers.get('X-Mock-Latency');
      if (latency) {
        const ms = Number.isNaN(Number(latency))
          ? latency === 'slow' ? 1500 : latency === 'timeout' ? 10000 : 0
          : Number(latency);
        if (ms > 0) await delay(ms);
      }

      return HttpResponse.json(
        {
          error: {
            message: 'Payload Too Large',
            code: 'PAYLOAD_TOO_LARGE',
            status: 413,
          },
        },
        {
          status: 413,
          headers: {
            'Content-Type': 'application/json',
            'x-routstr-request-id': '6dd4ff7a-8c30-4bad-b199-49c9444df96c',
          },
        }
      );
    }

    if (scenario && (scenario === '500' || scenario === 'internal-server-error')) {
      const latency = request.headers.get('X-Mock-Latency');
      if (latency) {
        const ms = Number.isNaN(Number(latency))
          ? latency === 'slow' ? 1500 : latency === 'timeout' ? 10000 : 0
          : Number(latency);
        if (ms > 0) await delay(ms);
      }

      return HttpResponse.json(
        {
          error: {
            message: 'Internal Server Error - Something went wrong on the server',
            code: 'INTERNAL_SERVER_ERROR',
            status: 500,
          },
        },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'x-routstr-request-id': '0hh8jj1e-2g74-8feh-f5dd-83g3888hj30g',
          },
        }
      );
    }

    if (scenario && (scenario === '502' || scenario === 'bad-gateway')) {
      const latency = request.headers.get('X-Mock-Latency');
      if (latency) {
        const ms = Number.isNaN(Number(latency))
          ? latency === 'slow' ? 1500 : latency === 'timeout' ? 10000 : 0
          : Number(latency);
        if (ms > 0) await delay(ms);
      }

      return HttpResponse.json(
        {
          error: {
            message: 'Bad Gateway - Server received an invalid response',
            code: 'BAD_GATEWAY',
            status: 502,
          },
        },
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'x-routstr-request-id': '1ii9kk2f-3h85-9gfi-g6ee-94h4999ik41h',
          },
        }
      );
    }

    return;
  }),

  http.get('https://mint.minibits.cash/Bitcoin/v1/keysets', async ({ request }) => {
    const scenario = getScenario(request);

    if (scenario && (scenario === 'failed-to-fetch' || scenario === 'network-error')) {
      // Simulate a network failure that causes "Failed to fetch"
      // This simulates a blocked request (e.g., CORS failure) that doesn't return any response
      throw new Error('Failed to fetch');
    }

    // Default response when no scenario is set
    return HttpResponse.json({
      keysets: [
        { id: "00827d7d75aa8fcb", unit: "sat", active: false, input_fee_ppk: 0 },
        { id: "9mlfd5vCzgGl", unit: "sat", active: false, input_fee_ppk: 0 },
        { id: "00500550f0494146", unit: "sat", active: true, input_fee_ppk: 0 },
        { id: "ctv28hTYzQwr", unit: "sat", active: false, input_fee_ppk: 0 }
      ]
    });
  }),

  http.get('https://mint.minibits.cash/Bitcoin/v1/info', async ({ request }) => {
    const scenario = getScenario(request);

    if (scenario && (scenario === 'failed-to-fetch' || scenario === 'network-error')) {
      // Simulate a network failure that causes "Failed to fetch"
      throw new Error('Failed to fetch');
    }

    // Default response when no scenario is set
    return HttpResponse.json({
      name: "Minibits mint",
      pubkey: "023cf092fb60e21e8c367817c2c9d7471d796f6b75dc259e1a3320d5e53d489554",
      version: "Nutshell/0.18.0",
      description: "Minibits wallet mint. Minibits is an active research project in BETA, use at your own risk.",
      description_long: "Do not use with large amounts of ecash. Minibits mint is operated on a best-effort basis and without any guarantees.",
      contact: [
        { method: "email", info: "support@minibits.cash" },
        { method: "twitter", info: "@MinibitsCash" },
        { method: "nostr", info: "npub1kvaln6tm0re4d99q9e4ma788wpvnw0jzkz595cljtfgwhldd75xsj9tkzv" }
      ],
      motd: "Message to users",
      icon_url: "https://play-lh.googleusercontent.com/raLGxOOzbxOsEx25gr-rISzJOdbgVPG11JHuI2yV57TxqPD_fYBof9TRh-vUE-XyhgmN=w240-h480-rw",
      time: 1762312502,
      nuts: {
        "4": {
          methods: [{ method: "bolt11", unit: "sat", min_amount: 0, max_amount: 1000000, options: { description: true } }],
          disabled: false
        },
        "5": {
          methods: [{ method: "bolt11", unit: "sat", min_amount: 0, max_amount: 1000000 }],
          disabled: false
        },
        "7": { supported: true },
        "8": { supported: true },
        "9": { supported: true },
        "10": { supported: true },
        "11": { supported: true },
        "12": { supported: true },
        "14": { supported: true },
        "20": { supported: true },
        "15": {
          methods: [{ method: "bolt11", unit: "sat" }]
        },
        "17": {
          supported: [{ method: "bolt11", unit: "sat", commands: ["bolt11_melt_quote", "proof_state", "bolt11_mint_quote"] }]
        },
        "19": {
          cached_endpoints: [
            { method: "POST", path: "/v1/mint/bolt11" },
            { method: "POST", path: "/v1/melt/bolt11" },
            { method: "POST", path: "/v1/swap" }
          ],
          ttl: 604800
        }
      }
    });
  }),
];
