import type { FeedbackPayload } from './feedback.js';

// Public recipient alias, intended for website forms. It grants no mailbox/archive access.
const endpoint = 'https://formsubmit.co/ajax/63c134c5aa56100f0b1a409cf8c25648';

export async function sendFeedback(payload: FeedbackPayload, transport: typeof fetch = fetch): Promise<void> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new Error('Submission timed out')); }, 20000);
  });
  try {
    await Promise.race([(async () => {
      const response = await transport(endpoint, {
        // The service requires a source origin. Never send the current path/query in Referer.
        method: 'POST', credentials: 'omit', referrerPolicy: 'origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal,
      });
      if (!response.ok) throw new Error('Submission rejected');
      const result: unknown = await response.json();
      // Activation failures also return HTTP 200; only the explicit acknowledgement counts.
      if (!result || typeof result !== 'object' || !('success' in result) || (result.success !== true && result.success !== 'true')) throw new Error('Submission not acknowledged');
    })(), deadline]);
  } finally { if (timer !== undefined) clearTimeout(timer); }
}
