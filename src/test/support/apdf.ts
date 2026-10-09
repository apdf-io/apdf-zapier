import { randomUUID } from 'node:crypto';

import type { TestServer } from './server.js';
import { invoke } from './zapier.js';

/** A tracked document with one recipient link, as most tests need it. */
export interface TrackedDocument {
  docId: string;
  token: string;
}

/**
 * Create a document from a fixture and mint a link for Jane Doe, through the integration itself.
 */
export const createTrackedDocument = async (server: TestServer, name: string): Promise<TrackedDocument> => {
  const document = await invoke('creates.createDocument.operation.perform', {
    inputData: { file: server.fileUrl('three-pages.pdf'), name },
  });

  const link = await invoke('creates.createTrackingLink.operation.perform', {
    inputData: { doc_id: document.doc_id, name: 'Jane Doe', email: 'jane@contoso.com' },
  });

  return { docId: document.doc_id, token: link.token };
};

/**
 * Remove a document created by a test.
 */
export const deleteDocument = (docId: string) =>
  invoke('creates.deleteDocument.operation.perform', { inputData: { doc_id: docId } });

/** How often a throttled request is retried before the test gives up. */
const THROTTLE_RETRIES = 8;

/**
 * Call Apdf directly, outside the integration. Apdf rate-limits by workspace and by IP, so a
 * throttled request waits as long as Apdf asks and tries again.
 */
export const fetchApdf = async (path: string, init: RequestInit = {}): Promise<Response> => {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`${process.env.APDF_BASE_URL}${path}`, {
      ...init,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init.headers },
    });

    if (response.status !== 429 || attempt === THROTTLE_RETRIES) {
      return response;
    }

    await new Promise((resolve) => setTimeout(resolve, (Number(response.headers.get('retry-after')) || 1) * 1000));
  }
};

/**
 * Whether Apdf still has the automation, asked with the test workspace's token.
 */
export const automationExists = async (automationId: string): Promise<boolean> =>
  (
    await fetchApdf(`/automations/${automationId}`, {
      headers: { Authorization: `Bearer ${process.env.APDF_TEST_TOKEN}` },
    })
  ).status === 200;

/**
 * Play a reader opening the document through their link, the way the hosted viewer reports it.
 * The viewer endpoint ignores crawlers, so the request presents itself as a desktop browser.
 */
export const simulateReader = async (document: TrackedDocument, event: string, page = 1): Promise<void> => {
  const response = await fetchApdf(`/viewer/docs/${document.docId}/events`, {
    method: 'POST',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({
      session_id: randomUUID(),
      link_token: document.token,
      events: [{ event, viewer_id: randomUUID(), page, total_pages: 3, timestamp: Date.now() }],
    }),
  });

  if (!response.ok) {
    throw new Error(`The viewer endpoint answered ${response.status}: ${await response.text()}`);
  }
};
