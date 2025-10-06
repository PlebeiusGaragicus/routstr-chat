import { http, HttpResponse, delay } from 'msw';

function getScenario(request: Request): string | null {
  const header = request.headers.get('X-Mock-Scenario');
  return header ? header.toLowerCase() : null;
}

export const handlers = [
  http.post('*/v1/chat/completions', async ({ request }) => {
    const scenario = getScenario(request);

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
          },
        }
      );
    }

    return;
  }),
];
