import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  automationExists,
  createTrackedDocument,
  deleteDocument,
  simulateReader,
  type TrackedDocument,
} from './support/apdf.js';
import { startTestServer, type TestServer } from './support/server.js';
import { invoke } from './support/zapier.js';

let server: TestServer;
let document: TrackedDocument;

/** Subscriptions still to remove, so a failing test leaves no automation behind. */
const subscriptions = new Map<string, Record<string, unknown>>();

/**
 * Turn a trigger on, the way Zapier does when a Zap is switched on.
 */
const subscribe = async (trigger: string, bundle: Record<string, unknown>) => {
  const subscription = await invoke(`triggers.${trigger}.operation.performSubscribe`, bundle);

  subscriptions.set(trigger, subscription);

  return subscription;
};

/**
 * Turn a trigger off again, the way Zapier does when a Zap is switched off.
 */
const unsubscribe = async (trigger: string) => {
  await invoke(`triggers.${trigger}.operation.performUnsubscribe`, { subscribeData: subscriptions.get(trigger) });

  subscriptions.delete(trigger);
};

beforeAll(async () => {
  server = await startTestServer();
  document = await createTrackedDocument(server, 'Zapier test: reader events');
});

afterAll(async () => {
  for (const trigger of subscriptions.keys()) {
    await unsubscribe(trigger);
  }

  await deleteDocument(document.docId);
  await server.close();
});

describe('reader event triggers', () => {
  it('delivers a reader event from subscribe to unsubscribe', async () => {
    const subscription = await subscribe('documentOpened', {
      inputData: { doc_ids: [document.docId] },
      targetUrl: server.inboxUrl('opened'),
    });

    expect(await automationExists(subscription.id)).toBe(true);

    await simulateReader(document, 'document:loaded');
    const payload = await server.nextPost('opened');

    const [event] = await invoke('triggers.documentOpened.operation.perform', { cleanedRequest: payload });

    expect(event).toMatchObject({
      id: expect.stringContaining(':document:loaded:'),
      document: { doc_id: document.docId, name: 'Zapier test: reader events' },
      trigger: { matched_event: 'document:loaded' },
      event: { recipient: { name: 'Jane Doe', email: 'jane@contoso.com' } },
    });

    const samples = await invoke('triggers.documentOpened.operation.performList', {
      inputData: { doc_ids: [document.docId] },
    });

    expect(samples[0]).toMatchObject({
      document: { doc_id: document.docId },
      trigger: { matched_event: 'document:loaded' },
    });

    await unsubscribe('documentOpened');

    expect(await automationExists(subscription.id)).toBe(false);
  });

  it('lets Apdf filter by condition before calling Zapier', async () => {
    await subscribe('pageViewed', {
      inputData: { doc_ids: [document.docId], page_number: 3 },
      targetUrl: server.inboxUrl('page-three'),
    });

    await simulateReader(document, 'page:enter', 2);
    await simulateReader(document, 'page:enter', 3);

    const payload = await server.nextPost('page-three');
    const [event] = await invoke('triggers.pageViewed.operation.perform', { cleanedRequest: payload });

    expect(event.event.data).toEqual({ page: 3 });

    await unsubscribe('pageViewed');
  });

  it('finds the reading session a reader event belongs to', async () => {
    const [session] = await invoke('triggers.readingSessionList.operation.perform', {
      inputData: { doc_id: document.docId },
    });

    expect(session.name).toMatch(/^Jane Doe <jane@contoso.com> · /);

    const [found] = await invoke('searches.findReadingSession.operation.perform', {
      inputData: { doc_id: document.docId, session_id: session.id },
    });

    expect(found.session).toMatchObject({ session_id: session.id, recipient: { name: 'Jane Doe' } });
  });

  it('unsubscribes quietly when the automation is already gone', async () => {
    await expect(
      invoke('triggers.documentOpened.operation.performUnsubscribe', {
        subscribeData: { id: '00000000-0000-0000-0000-000000000000' },
      }),
    ).resolves.toEqual({});
  });

  it('explains that triggers need a plan with automations', async () => {
    await expect(
      invoke(
        'triggers.documentOpened.operation.performSubscribe',
        { targetUrl: server.inboxUrl('hobby') },
        { token: process.env.APDF_TEST_HOBBY_TOKEN },
      ),
    ).rejects.toThrow(/Upgrade at/);
  });
});
