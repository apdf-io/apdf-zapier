import { defineSearch, type Bundle, type ZObject } from 'zapier-platform-core';

import { documentField, documentPath } from '../fields/records.js';
import { fetchDataOrNull } from '../lib/api.js';
import { signatureRequestOutputFields, signatureRequestSample } from '../lib/outputs.js';
import type { SignatureRequest } from '../lib/types.js';
import { found } from './results.js';

export const findSignatureRequest = defineSearch({
  key: 'findSignatureRequest',
  noun: 'signature request',
  display: {
    label: 'Find Signature Request',
    description:
      'Finds the latest signature request of a document, with who has signed and, once everyone has, the signed PDF.',
  },
  operation: {
    inputFields: [documentField()],
    perform: (z: ZObject, bundle: Bundle) =>
      found(fetchDataOrNull<SignatureRequest>(z, 'GET', documentPath(bundle, '/signature-request'))),
    sample: signatureRequestSample,
    outputFields: signatureRequestOutputFields,
  },
});
