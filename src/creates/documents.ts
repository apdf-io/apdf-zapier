import { defineCreate, type Bundle, type ZObject } from 'zapier-platform-core';

import { documentField, documentPath } from '../fields/records.js';
import { fetchData, request } from '../lib/api.js';
import { documentOutputFields, documentSample } from '../lib/outputs.js';
import type { Document } from '../lib/types.js';

export const createDocument = defineCreate({
  key: 'createDocument',
  noun: 'document',
  display: {
    label: 'Create Document',
    description: 'Creates a document from a PDF, ready to share through tracking links and the hosted viewer.',
  },
  operation: {
    inputFields: [
      {
        key: 'file',
        label: 'PDF file',
        type: 'file',
        required: true,
        helpText: 'Map a PDF from an earlier step, or enter a public URL.',
      },
      {
        key: 'name',
        label: 'Name',
        required: true,
        helpText: 'Shown in the dashboard, in analytics and in every reader event.',
      },
    ],
    perform: (z: ZObject, bundle: Bundle) =>
      fetchData<Document>(z, 'POST', '/docs', {
        body: { file: bundle.inputData.file, name: bundle.inputData.name },
      }),
    sample: documentSample,
    outputFields: documentOutputFields,
  },
});

/**
 * An action that changes one document through a POST to one of its sub-paths, such as
 * "/archive". They differ only in wording and path.
 */
const defineDocumentAction = (key: string, label: string, description: string, suffix: string) =>
  defineCreate({
    key,
    noun: 'document',
    display: { label, description },
    operation: {
      inputFields: [documentField()],
      perform: (z: ZObject, bundle: Bundle) => fetchData<Document>(z, 'POST', documentPath(bundle, suffix)),
      sample: documentSample,
      outputFields: documentOutputFields,
    },
  });

export const archiveDocument = defineDocumentAction(
  'archiveDocument',
  'Archive Document',
  "Archives a document. Readers can't open it and it stops counting toward your plan's document limit until you unarchive it.",
  '/archive',
);

export const unarchiveDocument = defineDocumentAction(
  'unarchiveDocument',
  'Unarchive Document',
  'Returns an archived document to the active list.',
  '/unarchive',
);

export const makeDocumentPublic = defineDocumentAction(
  'makeDocumentPublic',
  'Make Document Public',
  'Lets anyone with the viewer URL open the document, without a tracking link.',
  '/public',
);

export const makeDocumentPrivate = defineDocumentAction(
  'makeDocumentPrivate',
  'Make Document Private',
  'Requires a tracking link to open the document.',
  '/private',
);

export const deleteDocument = defineCreate({
  key: 'deleteDocument',
  noun: 'document',
  display: {
    label: 'Delete Document',
    description: 'Deletes a document permanently, with its PDF file, tracking links, annotations and form submissions.',
  },
  operation: {
    inputFields: [documentField()],
    perform: async (z: ZObject, bundle: Bundle) => {
      await request(z, 'DELETE', documentPath(bundle));

      return { doc_id: bundle.inputData.doc_id, deleted: true };
    },
    sample: { doc_id: documentSample.doc_id, deleted: true },
    outputFields: [
      { key: 'doc_id', label: 'Document ID' },
      { key: 'deleted', label: 'Deleted', type: 'boolean' },
    ],
  },
});
