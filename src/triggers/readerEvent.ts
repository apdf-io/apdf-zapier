import { defineTrigger, type Bundle, type PlainOutputField, type ZObject } from 'zapier-platform-core';

import { documentField } from '../fields/records.js';
import { fetchData, fetchDataOrNull, fetchPage, request } from '../lib/api.js';
import { ensureSuccessful } from '../lib/errors.js';
import { conditionFields, type ReaderEvent } from '../lib/events.js';
import type { Automation, AutomationExecution, Document, ReaderEventPayload } from '../lib/types.js';

/** How many recent events to offer as samples in the Zap editor. */
const SAMPLE_COUNT = 3;

/** Output fields for the event data any reader event can carry. */
const EVENT_DATA_FIELDS: Record<string, PlainOutputField> = {
  page: { key: 'event__data__page', label: 'Page', type: 'integer' },
  duration_ms: { key: 'event__data__duration_ms', label: 'Time on Page (ms)', type: 'integer' },
  text: { key: 'event__data__text', label: 'Text' },
  url: { key: 'event__data__url', label: 'Link URL' },
  is_internal: { key: 'event__data__is_internal', label: 'Is Internal Link', type: 'boolean' },
  type: { key: 'event__data__type', label: 'Annotation Type' },
  comment_text: { key: 'event__data__comment_text', label: 'Comment' },
  comment_author: { key: 'event__data__comment_author', label: 'Comment Author' },
  annotated_text: { key: 'event__data__annotated_text', label: 'Annotated Text' },
};

/**
 * A reader event as the trigger outputs it: the payload Apdf sent, plus an ID Zapier can tell
 * events apart by, since the payload has none of its own.
 */
export const toReaderEvent = (payload: ReaderEventPayload) => ({
  id: [payload.event.session_id, payload.trigger.matched_event, payload.timestamp].join(':'),
  ...payload,
});

/**
 * The documents the trigger is limited to, empty when it watches all of them. A single mapped
 * value may arrive as a plain string rather than a list.
 */
const watchedDocuments = (bundle: Bundle): string[] =>
  ([] as unknown[])
    .concat(bundle.inputData.doc_ids ?? [])
    .map(String)
    .filter((docId) => docId !== '');

/**
 * The automation that makes Apdf call this Zap: one event, the chosen documents, the filled-in
 * conditions, and Zapier's hook URL as its webhook.
 */
export const automationBody = (readerEvent: ReaderEvent, bundle: Bundle) => {
  const docIds = watchedDocuments(bundle);
  const conditions = readerEvent.conditions
    .filter((type) => bundle.inputData[type] !== undefined && bundle.inputData[type] !== '')
    .map((type) => ({ type, value: Number(bundle.inputData[type]) }));

  return {
    name: `Zapier: ${readerEvent.label}`,
    events: [readerEvent.event],
    webhook_url: bundle.targetUrl,
    ...(docIds.length > 0 ? { scope: 'specific', doc_ids: docIds } : { scope: 'all' }),
    ...(conditions.length > 0 ? { conditions } : {}),
  };
};

/** The made-up document of the static sample, used when the workspace has none of its own. */
const sampleDocument: ReaderEventPayload['document'] = {
  doc_id: '48927-c7621-ec3c0',
  name: 'Acme × Contoso proposal',
  viewer_url: 'https://docs.apdf.io/acme/48927-c7621-ec3c0',
  file_pages: 12,
};

/**
 * A sample event about the given document. Everything about the reader is made up.
 */
const samplePayload = (readerEvent: ReaderEvent, document: ReaderEventPayload['document']): ReaderEventPayload => ({
  automation: { id: '9b2f3c1e-5d4a-4e8b-a1c2-7f6e5d4c3b2a', name: `Zapier: ${readerEvent.label}` },
  document,
  trigger: { matched_event: readerEvent.event, conditions_evaluated: false },
  event: {
    session_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    viewer_id: 'f6e5d4c3-b2a1-4f0e-9d8c-7b6a5f4e3d2c',
    recipient: { name: 'Jane Doe', email: 'jane@contoso.com' },
    data: readerEvent.sampleData,
  },
  session: { total_duration_ms: 184000, pages_viewed: 7, completion_rate: 58 },
  timestamp: '2026-10-09T14:32:05+00:00',
});

/**
 * The latest payloads Apdf sent for this event, limited to the watched documents.
 */
const recentEvents = async (z: ZObject, readerEvent: ReaderEvent, docIds: string[]) => {
  const { data } = await fetchPage<AutomationExecution>(z, '/automations/executions', 1);

  return data
    .filter((execution) => execution.matched_event === readerEvent.event && execution.payload !== null)
    .filter((execution) => docIds.length === 0 || docIds.includes(String(execution.doc_id)))
    .slice(0, SAMPLE_COUNT)
    .map((execution) => toReaderEvent(execution.payload as ReaderEventPayload));
};

/**
 * The document a sample is built around: the first watched one, or else the newest in the
 * workspace. Null when there is none to use.
 */
const sampleSourceDocument = async (z: ZObject, docIds: string[]): Promise<ReaderEventPayload['document'] | null> => {
  const document =
    docIds.length > 0
      ? await fetchDataOrNull<Document>(z, 'GET', `/docs/${encodeURIComponent(docIds[0] ?? '')}`)
      : ((await fetchPage<Document>(z, '/docs', 1)).data[0] ?? null);

  return document
    ? { doc_id: document.doc_id, name: document.name, viewer_url: document.viewer_url, file_pages: document.file_pages }
    : null;
};

/**
 * Build the trigger for one reader event. Turning the Zap on creates an Apdf automation that
 * posts to Zapier; turning it off deletes that automation again.
 */
export const defineReaderEventTrigger = (readerEvent: ReaderEvent) =>
  defineTrigger({
    key: readerEvent.key,
    noun: 'reader event',
    display: {
      label: readerEvent.label,
      description: readerEvent.description,
    },
    operation: {
      type: 'hook',
      inputFields: [
        documentField({
          key: 'doc_ids',
          label: 'Documents',
          required: false,
          list: true,
          search: undefined,
          helpText: 'Only trigger for these documents. Leave empty to trigger for every document in the workspace.',
        }),
        ...readerEvent.conditions.map((type) => conditionFields[type]),
      ],

      performSubscribe: (z: ZObject, bundle: Bundle) =>
        fetchData<Automation>(z, 'POST', '/automations', { body: automationBody(readerEvent, bundle) }),

      // An automation already deleted in Apdf leaves nothing to clean up.
      performUnsubscribe: async (z: ZObject, bundle: Bundle) => {
        const automationId = encodeURIComponent(String(bundle.subscribeData?.id));
        const response = await request(z, 'DELETE', `/automations/${automationId}`, { skipThrowForStatus: true });

        if (response.status !== 404) {
          ensureSuccessful(z, response);
        }

        return {};
      },

      perform: (z: ZObject, bundle: Bundle) => [toReaderEvent(bundle.cleanedRequest as ReaderEventPayload)],

      // Recent runs carry real payloads. Without any, a sample around one of the user's own
      // documents still lets later steps map a document that exists.
      performList: async (z: ZObject, bundle: Bundle) => {
        const recent = await recentEvents(z, readerEvent, watchedDocuments(bundle));

        if (recent.length > 0) {
          return recent;
        }

        const document = await sampleSourceDocument(z, watchedDocuments(bundle));

        return document ? [toReaderEvent(samplePayload(readerEvent, document))] : [];
      },

      sample: toReaderEvent(samplePayload(readerEvent, sampleDocument)),

      outputFields: [
        { key: 'id', label: 'Event ID' },
        { key: 'document__doc_id', label: 'Document ID' },
        { key: 'document__name', label: 'Document Name' },
        { key: 'document__viewer_url', label: 'Document Viewer URL' },
        { key: 'document__file_pages', label: 'Document Pages', type: 'integer' },
        { key: 'trigger__matched_event', label: 'Event' },
        { key: 'event__session_id', label: 'Session ID' },
        { key: 'event__viewer_id', label: 'Viewer ID' },
        { key: 'event__recipient__name', label: 'Recipient Name' },
        { key: 'event__recipient__email', label: 'Recipient Email' },
        ...Object.keys(readerEvent.sampleData ?? {}).flatMap((key) => EVENT_DATA_FIELDS[key] ?? []),
        { key: 'session__total_duration_ms', label: 'Session Reading Time (ms)', type: 'integer' },
        { key: 'session__pages_viewed', label: 'Session Pages Viewed', type: 'integer' },
        { key: 'session__completion_rate', label: 'Session Completion Rate (%)', type: 'number' },
        { key: 'automation__id', label: 'Automation ID' },
        { key: 'timestamp', label: 'Occurred At', type: 'datetime' },
      ],
    },
  });
