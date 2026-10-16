import { defineCreate, type Bundle, type ZObject } from 'zapier-platform-core';

import { documentField, documentPath, trackingLinkField } from '../fields/records.js';
import { fetchData, request } from '../lib/api.js';
import { trackingLinkOutputFields, trackingLinkSample } from '../lib/outputs.js';
import type { TrackingLink } from '../lib/types.js';

/**
 * The path of the tracking link the step was set up for.
 */
const trackingLinkPath = (bundle: Bundle, suffix = ''): string =>
  documentPath(bundle, `/links/${encodeURIComponent(String(bundle.inputData.token))}${suffix}`);

export const createTrackingLink = defineCreate({
  key: 'createTrackingLink',
  noun: 'tracking link',
  display: {
    label: 'Create Tracking Link',
    description:
      'Creates a tracking link for one recipient, so everything they do in the document is attributed to them.',
  },
  operation: {
    inputFields: [
      documentField(),
      {
        key: 'name',
        label: 'Recipient name',
        required: true,
        helpText: 'Who the link is for. Every reader event from this link carries this name.',
      },
      {
        key: 'email',
        label: 'Recipient email',
        helpText: 'Recorded alongside the name.',
      },
    ],
    perform: (z: ZObject, bundle: Bundle) =>
      fetchData<TrackingLink>(z, 'POST', documentPath(bundle, '/links'), {
        body: { name: bundle.inputData.name, email: bundle.inputData.email },
      }),
    sample: trackingLinkSample,
    outputFields: trackingLinkOutputFields,
  },
});

/**
 * An action that switches one tracking link on or off.
 */
const defineTrackingLinkAction = (key: string, label: string, description: string, suffix: string) =>
  defineCreate({
    key,
    noun: 'tracking link',
    display: { label, description },
    operation: {
      inputFields: [documentField(), trackingLinkField()],
      perform: (z: ZObject, bundle: Bundle) => fetchData<TrackingLink>(z, 'POST', trackingLinkPath(bundle, suffix)),
      sample: trackingLinkSample,
      outputFields: trackingLinkOutputFields,
    },
  });

export const activateTrackingLink = defineTrackingLinkAction(
  'activateTrackingLink',
  'Activate Tracking Link',
  'Lets the recipient open the document through their link again.',
  '/activate',
);

export const deactivateTrackingLink = defineTrackingLinkAction(
  'deactivateTrackingLink',
  'Deactivate Tracking Link',
  'Stops the recipient from opening the document through their link, without deleting it.',
  '/deactivate',
);

export const deleteTrackingLink = defineCreate({
  key: 'deleteTrackingLink',
  noun: 'tracking link',
  display: {
    label: 'Delete Tracking Link',
    description: 'Deletes a tracking link permanently.',
  },
  operation: {
    inputFields: [documentField(), trackingLinkField()],
    perform: async (z: ZObject, bundle: Bundle) => {
      await request(z, 'DELETE', trackingLinkPath(bundle));

      return { token: bundle.inputData.token, deleted: true };
    },
    sample: { token: trackingLinkSample.token, deleted: true },
    outputFields: [
      { key: 'token', label: 'Token' },
      { key: 'deleted', label: 'Deleted', type: 'boolean' },
    ],
  },
});
