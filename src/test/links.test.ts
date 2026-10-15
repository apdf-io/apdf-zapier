import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTrackedDocument, deleteDocument, type TrackedDocument } from './support/apdf.js';
import { startTestServer, type TestServer } from './support/server.js';
import { invoke } from './support/zapier.js';

let server: TestServer;
let document: TrackedDocument;

const withLink = () => ({ inputData: { doc_id: document.docId, token: document.token } });

beforeAll(async () => {
  server = await startTestServer();
  document = await createTrackedDocument(server, 'Zapier test: links');
});

afterAll(async () => {
  await deleteDocument(document.docId);
  await server.close();
});

describe('tracking links', () => {
  it('finds a link by the recipient email, ignoring case', async () => {
    const links = await invoke('searches.findTrackingLink.operation.perform', {
      inputData: { doc_id: document.docId, email: ' Jane@Contoso.com ' },
    });

    expect(links).toEqual([expect.objectContaining({ token: document.token, name: 'Jane Doe' })]);
  });

  it('finds nothing for an email without a link', async () => {
    const links = await invoke('searches.findTrackingLink.operation.perform', {
      inputData: { doc_id: document.docId, email: 'nobody@contoso.com' },
    });

    expect(links).toEqual([]);
  });

  it('offers the links of the chosen document in the dropdown', async () => {
    const choices = await invoke('triggers.trackingLinkList.operation.perform', {
      inputData: { doc_id: document.docId },
    });

    expect(choices).toEqual([{ id: document.token, name: 'Jane Doe <jane@contoso.com>' }]);
  });

  it('deactivates and activates a link', async () => {
    const deactivated = await invoke('creates.deactivateTrackingLink.operation.perform', withLink());
    const activated = await invoke('creates.activateTrackingLink.operation.perform', withLink());

    expect(deactivated.is_active).toBe(false);
    expect(activated.is_active).toBe(true);
  });

  it('creates a link without an email when the email is left blank', async () => {
    const link = await invoke('creates.createTrackingLink.operation.perform', {
      inputData: { doc_id: document.docId, name: 'John Roe', email: '' },
    });

    expect(link).toMatchObject({ token: expect.any(String), name: 'John Roe' });
    expect(link.email).toBeFalsy();
  });

  it('deletes a link', async () => {
    const deleted = await invoke('creates.deleteTrackingLink.operation.perform', withLink());

    expect(deleted).toEqual({ token: document.token, deleted: true });
    await expect(
      invoke('searches.findTrackingLink.operation.perform', {
        inputData: { doc_id: document.docId, email: 'jane@contoso.com' },
      }),
    ).resolves.toEqual([]);
  });
});
