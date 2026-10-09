import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { startTestServer, type TestServer } from './support/server.js';
import { invoke } from './support/zapier.js';

let server: TestServer;
let docId: string;

const withDocument = (inputData: Record<string, unknown> = {}) => ({ inputData: { doc_id: docId, ...inputData } });

beforeAll(async () => {
  server = await startTestServer();

  const document = await invoke('creates.createDocument.operation.perform', {
    inputData: { file: server.fileUrl('three-pages.pdf'), name: 'Zapier test: documents' },
  });

  docId = document.doc_id;
});

afterAll(async () => {
  await server.close();
});

describe('documents', () => {
  it('creates a document from a file URL', async () => {
    const document = await invoke('searches.findDocument.operation.perform', withDocument());

    expect(document).toEqual([
      expect.objectContaining({ doc_id: docId, name: 'Zapier test: documents', file_pages: 3 }),
    ]);
  });

  it('finds nothing for an unknown document ID', async () => {
    await expect(
      invoke('searches.findDocument.operation.perform', { inputData: { doc_id: 'zzzzz-zzzzz-zzzzz' } }),
    ).resolves.toEqual([]);
  });

  it('archives, unarchives and changes the visibility of a document', async () => {
    const archived = await invoke('creates.archiveDocument.operation.perform', withDocument());
    const unarchived = await invoke('creates.unarchiveDocument.operation.perform', withDocument());
    const madePublic = await invoke('creates.makeDocumentPublic.operation.perform', withDocument());
    const madePrivate = await invoke('creates.makeDocumentPrivate.operation.perform', withDocument());

    expect(archived.archived_at).not.toBeNull();
    expect(unarchived.archived_at).toBeNull();
    expect(madePublic.is_public).toBe(true);
    expect(madePrivate.is_public).toBe(false);
  });

  it('reports the analytics of a document', async () => {
    const [analytics] = await invoke('searches.findDocumentAnalytics.operation.perform', withDocument());

    expect(analytics).toMatchObject({
      doc_id: docId,
      sessions: expect.any(Number),
      completion_rate: expect.any(Number),
    });
  });

  it('lists new documents with an ID for deduplication', async () => {
    const documents = await invoke('triggers.newDocument.operation.perform');

    expect(documents[0]).toMatchObject({ id: docId, doc_id: docId });
  });

  it('offers active documents in the dropdown by name', async () => {
    const choices = await invoke('triggers.documentList.operation.perform');

    expect(choices).toContainEqual({ id: docId, name: 'Zapier test: documents' });
  });

  it('pages through the dropdown', async () => {
    await expect(invoke('triggers.documentList.operation.perform', { meta: { page: 1000 } })).resolves.toEqual([]);
  });

  it('explains why a document cannot be created', async () => {
    await expect(
      invoke('creates.createDocument.operation.perform', { inputData: { file: 'not a url', name: 'Broken' } }),
    ).rejects.toThrow(/file: The file field must be a valid URL/);
  });

  it('deletes a document', async () => {
    const deleted = await invoke('creates.deleteDocument.operation.perform', withDocument());

    expect(deleted).toEqual({ doc_id: docId, deleted: true });
    await expect(invoke('searches.findDocument.operation.perform', withDocument())).resolves.toEqual([]);
  });
});
