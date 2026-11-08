import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { automationExists, createTrackedDocument, deleteDocument, type TrackedDocument } from './support/apdf.js';
import { startTestServer, type TestServer } from './support/server.js';
import { invoke } from './support/zapier.js';

// Stashing needs Zapier's file storage, which only exists on Zapier; locally it is marked instead.
vi.mock('../lib/files.js', () => ({ stashFile: async (z: unknown, url: string) => `stashed:${url}` }));

let server: TestServer;
let document: TrackedDocument;

beforeAll(async () => {
  server = await startTestServer();
  document = await createTrackedDocument(server, 'Zapier test: signatures');
});

afterAll(async () => {
  await deleteDocument(document.docId);
  await server.close();
});

/**
 * Ask Jane Doe to sign the first page, placed by coordinates, without emailing her.
 */
const requestSignature = () =>
  invoke('creates.requestSignatures.operation.perform', {
    inputData: {
      doc_id: document.docId,
      signers: [{ role: 'Client', name: 'Jane Doe', email: 'jane@contoso.com', member: '', company: 'false' }],
      fields: [
        { field_role: 'Client', field_type: 'signature', anchor: '', pdf_field: '', page: '1', x: '72', y: '640' },
        { field_role: 'Client', field_type: 'date', page: 1, x: 72, y: 700 },
      ],
      send_email: 'false',
      metadata: { deal_id: 'D-42' },
    },
  });

describe('signature requests', () => {
  it('requests, finds and cancels the signatures of a document', async () => {
    const request = await requestSignature();

    expect(request).toMatchObject({
      status: 'pending',
      send_email: false,
      metadata: { deal_id: 'D-42' },
      signers: [{ type: 'recipient', role: 'Client', name: 'Jane Doe', status: 'pending', link: document.token }],
    });

    const [latest] = await invoke('searches.findSignatureRequest.operation.perform', {
      inputData: { doc_id: document.docId },
    });

    expect(latest.request_id).toBe(request.request_id);

    const cancelled = await invoke('creates.cancelSignatureRequest.operation.perform', {
      inputData: { doc_id: document.docId },
    });

    expect(cancelled).toMatchObject({ request_id: request.request_id, status: 'cancelled' });
  });

  it('explains why a request is refused', async () => {
    await expect(
      invoke('creates.requestSignatures.operation.perform', {
        inputData: { doc_id: document.docId, signers: [{ role: 'Client', member: 'nobody@contoso.com' }] },
      }),
    ).rejects.toThrow(/nobody@contoso.com/);
  });

  it('finds nothing for a document without a signature request', async () => {
    const other = await createTrackedDocument(server, 'Zapier test: no signatures');

    expect(
      await invoke('searches.findSignatureRequest.operation.perform', { inputData: { doc_id: other.docId } }),
    ).toEqual([]);

    await deleteDocument(other.docId);
  });
});

describe('signature triggers', () => {
  it('subscribes to a signature event and unsubscribes again', async () => {
    const subscription = await invoke('triggers.documentSigned.operation.performSubscribe', {
      inputData: { doc_ids: [document.docId], completion_rate: 80 },
      targetUrl: server.inboxUrl('signed'),
    });

    expect(await automationExists(subscription.id)).toBe(true);

    await invoke('triggers.documentSigned.operation.performUnsubscribe', { subscribeData: subscription });

    expect(await automationExists(subscription.id)).toBe(false);
  });

  it('hands the signed PDF of a completed request to later steps as a file', async () => {
    const fileUrl = server.fileUrl('one-page.pdf');

    const [event] = await invoke('triggers.signingCompleted.operation.perform', {
      cleanedRequest: {
        automation: { id: '9b2f3c1e-5d4a-4e8b-a1c2-7f6e5d4c3b2a', name: 'Zapier: Signing Completed' },
        document: { doc_id: document.docId, name: 'Zapier test: signatures', viewer_url: '', file_pages: 3 },
        trigger: { matched_event: 'signature:completed', conditions_evaluated: false },
        event: {
          session_id: 'unknown',
          viewer_id: 'unknown',
          recipient: null,
          data: { request_id: '39fe0-14d24-714bd', file_url: fileUrl, signers: [] },
        },
        session: { total_duration_ms: 0, pages_viewed: 0, completion_rate: 0 },
        timestamp: '2026-10-28T09:44:08+00:00',
      },
    });

    expect(event.event.data).toMatchObject({ file_url: fileUrl, file: `stashed:${fileUrl}` });
  });

  it('offers signing triggers without reading conditions where there is no reader session', async () => {
    const [sample] = await invoke('triggers.signingCompleted.operation.performList', {
      inputData: { doc_ids: [document.docId] },
    });

    expect(sample).toMatchObject({
      document: { doc_id: document.docId },
      trigger: { matched_event: 'signature:completed' },
      event: { data: { request_id: expect.any(String) } },
    });
  });
});
