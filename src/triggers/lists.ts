import { defineTrigger, type Bundle, type ZObject } from 'zapier-platform-core';

import { documentPath } from '../fields/records.js';
import { fetchPage } from '../lib/api.js';
import type { Document, ReadingSession, TrackingLink } from '../lib/types.js';

/** A dropdown choice: what is stored, and what the user reads. */
interface Choice {
  id: string;
  name: string;
}

/**
 * A hidden trigger that powers a dynamic dropdown, one Apdf page per dropdown page.
 */
const defineListTrigger = <T>(
  key: string,
  noun: string,
  path: (bundle: Bundle) => string,
  toChoice: (item: T) => Choice,
  params: Record<string, unknown> = {},
) =>
  defineTrigger({
    key,
    noun,
    display: {
      label: `List ${noun}s`,
      description: `Lists ${noun.toLowerCase()}s for a dropdown.`,
      hidden: true,
    },
    operation: {
      type: 'polling',
      canPaginate: true,
      // Zapier counts dropdown pages from 0, Apdf from 1.
      perform: async (z: ZObject, bundle: Bundle) => {
        const { data } = await fetchPage<T>(z, path(bundle), bundle.meta.page + 1, params);

        return data.map(toChoice);
      },
    },
  });

/**
 * Describe a link by its recipient, the way people tell links apart.
 */
const recipientLabel = (recipient: { name: string; email: string | null } | null): string => {
  if (recipient === null) {
    return 'Anonymous reader';
  }

  return recipient.email ? `${recipient.name} <${recipient.email}>` : recipient.name;
};

export const documentList = defineListTrigger<Document>(
  'documentList',
  'Document',
  () => '/docs',
  (document) => ({ id: document.doc_id, name: document.name }),
  { status: 'active' },
);

export const trackingLinkList = defineListTrigger<TrackingLink>(
  'trackingLinkList',
  'Tracking Link',
  (bundle) => documentPath(bundle, '/links'),
  (link) => ({ id: link.token, name: recipientLabel(link) }),
);

export const readingSessionList = defineListTrigger<ReadingSession>(
  'readingSessionList',
  'Reading Session',
  (bundle) => documentPath(bundle, '/analytics/sessions'),
  (session) => ({ id: session.session_id, name: `${recipientLabel(session.recipient)} · ${session.created_at}` }),
);
