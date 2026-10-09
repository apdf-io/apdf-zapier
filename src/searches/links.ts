import { defineSearch, type Bundle, type ZObject } from 'zapier-platform-core';

import { documentField, documentPath } from '../fields/records.js';
import { findInList } from '../lib/api.js';
import { trackingLinkOutputFields, trackingLinkSample } from '../lib/outputs.js';
import type { TrackingLink } from '../lib/types.js';
import { found } from './results.js';

export const findTrackingLink = defineSearch({
  key: 'findTrackingLink',
  noun: 'Tracking Link',
  display: {
    label: 'Find Tracking Link',
    description: "Finds a document's tracking link by the recipient's email address.",
  },
  operation: {
    inputFields: [
      documentField(),
      {
        key: 'email',
        label: 'Recipient Email',
        required: true,
        helpText: 'The email address the link was created for. Case does not matter.',
      },
    ],
    perform: (z: ZObject, bundle: Bundle) => {
      const email = String(bundle.inputData.email).trim().toLowerCase();

      return found(
        findInList<TrackingLink>(z, documentPath(bundle, '/links'), (link) => link.email?.toLowerCase() === email),
      );
    },
    sample: trackingLinkSample,
    outputFields: trackingLinkOutputFields,
  },
});
