import zapier, { defineApp } from 'zapier-platform-core';

import packageJson from '../package.json' with { type: 'json' };

import authentication from './authentication.js';
import * as annotationActions from './creates/annotations.js';
import * as documentActions from './creates/documents.js';
import * as linkActions from './creates/links.js';
import * as pdfActions from './creates/pdf/index.js';
import { readerEvents } from './lib/events.js';
import { afters, befores } from './middleware.js';
import * as documentSearches from './searches/documents.js';
import * as linkSearches from './searches/links.js';
import * as listTriggers from './triggers/lists.js';
import { newDocument } from './triggers/newDocument.js';
import { defineReaderEventTrigger } from './triggers/readerEvent.js';

/**
 * Key a list of triggers, actions or searches the way the app definition expects them.
 */
const byKey = <T extends { key: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item) => [item.key, item]));

export default defineApp({
  version: packageJson.version,
  platformVersion: zapier.version,

  // Blank optional fields are dropped per request instead (see withoutEmptyValues), so list
  // fields keep their positions, such as the page selection paired with each file to merge.
  flags: { cleanInputData: false },

  authentication,
  beforeRequest: [...befores],
  afterResponse: [...afters],

  triggers: byKey([...readerEvents.map(defineReaderEventTrigger), newDocument, ...Object.values(listTriggers)]),

  creates: byKey([
    ...Object.values(documentActions),
    ...Object.values(linkActions),
    ...Object.values(annotationActions),
    ...Object.values(pdfActions),
  ]),

  searches: byKey([...Object.values(documentSearches), ...Object.values(linkSearches)]),

  searchOrCreates: {
    findTrackingLink: {
      key: 'findTrackingLink',
      display: {
        label: 'Find or Create Tracking Link',
        description: 'Finds the tracking link of a recipient, and creates one when there is none yet.',
      },
      search: 'findTrackingLink',
      create: 'createTrackingLink',
    },
  },
});
