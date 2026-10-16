import { defineTrigger, type Bundle, type ZObject } from 'zapier-platform-core';

import { fetchPage } from '../lib/api.js';
import { documentOutputFields, documentSample, withDocumentId } from '../lib/outputs.js';
import type { Document } from '../lib/types.js';

export const newDocument = defineTrigger({
  key: 'newDocument',
  noun: 'document',
  display: {
    label: 'New Document',
    description: 'Triggers when a document is added to your workspace.',
  },
  operation: {
    type: 'polling',
    // Apdf lists the newest documents first, so the first page holds everything new.
    perform: async (z: ZObject, bundle: Bundle) => {
      const { data } = await fetchPage<Document>(z, '/docs', 1, { status: 'all' });

      return data.map(withDocumentId);
    },
    sample: withDocumentId(documentSample),
    outputFields: documentOutputFields,
  },
});
