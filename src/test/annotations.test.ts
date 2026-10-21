import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTrackedDocument, deleteDocument, simulateAnnotation, type TrackedDocument } from './support/apdf.js';
import { startTestServer, type TestServer } from './support/server.js';
import { invoke } from './support/zapier.js';

let server: TestServer;
let document: TrackedDocument;

beforeAll(async () => {
  server = await startTestServer();
  document = await createTrackedDocument(server, 'Zapier test: annotations');
});

afterAll(async () => {
  await deleteDocument(document.docId);
  await server.close();
});

const addComment = (annotationId: string, text: string) =>
  invoke('creates.addAnnotationComment.operation.perform', {
    inputData: { doc_id: document.docId, annotation_id: annotationId, author: 'Sam Lee', text },
  });

describe('annotation comments', () => {
  it('offers the annotations of the chosen document in the dropdown', async () => {
    const annotationId = await simulateAnnotation(document);

    const choices = await invoke('triggers.annotationList.operation.perform', {
      inputData: { doc_id: document.docId },
    });

    expect(choices).toContainEqual({ id: annotationId, name: 'Page 1 · Annual licence: $24,000' });
  });

  it('opens the thread of an annotation without a comment', async () => {
    const annotation = await addComment(await simulateAnnotation(document), 'Happy to walk you through it.');

    expect(annotation).toMatchObject({
      comment_author: 'Sam Lee',
      comment_text: 'Happy to walk you through it.',
      replies: [],
    });
  });

  it('replies to an annotation that already has a comment', async () => {
    const annotationId = await simulateAnnotation(document, 'Can we get volume pricing here?');

    const annotation = await addComment(annotationId, 'Yes, from 25 seats.');

    expect(annotation).toMatchObject({
      comment_text: 'Can we get volume pricing here?',
      replies: [expect.objectContaining({ author: 'Sam Lee', text: 'Yes, from 25 seats.' })],
    });
  });
});
