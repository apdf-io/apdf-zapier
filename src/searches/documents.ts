import { defineSearch, type Bundle, type ZObject } from 'zapier-platform-core';

import { documentField, documentPath, readingSessionField } from '../fields/records.js';
import { fetchDataOrNull } from '../lib/api.js';
import { documentOutputFields, documentSample } from '../lib/outputs.js';
import type { Document } from '../lib/types.js';
import { found } from './results.js';

export const findDocument = defineSearch({
  key: 'findDocument',
  noun: 'document',
  display: {
    label: 'Find Document',
    description: 'Finds a document by its ID.',
  },
  operation: {
    inputFields: [
      documentField({
        search: undefined,
        helpText: 'Pick a document, or map a document ID from an earlier step.',
      }),
    ],
    perform: (z: ZObject, bundle: Bundle) => found(fetchDataOrNull<Document>(z, 'GET', documentPath(bundle))),
    sample: documentSample,
    outputFields: documentOutputFields,
  },
});

export const findDocumentAnalytics = defineSearch({
  key: 'findDocumentAnalytics',
  noun: 'document analytics',
  display: {
    label: 'Find Document Analytics',
    description: 'Finds the engagement totals of a document: sessions, viewers, reading time, completion and more.',
  },
  operation: {
    inputFields: [documentField()],
    perform: async (z: ZObject, bundle: Bundle) => {
      const analytics = await fetchDataOrNull<Record<string, unknown>>(z, 'GET', documentPath(bundle, '/analytics'));

      return analytics === null ? [] : [{ doc_id: bundle.inputData.doc_id, ...analytics }];
    },
    sample: {
      doc_id: documentSample.doc_id,
      sessions: 14,
      unique_viewers: 6,
      avg_duration_ms: 212000,
      completion_rate: 64,
      pages_per_session: 7.5,
      prints: 1,
      downloads: 3,
      form_submissions: 2,
      annotations: 5,
    },
    outputFields: [
      { key: 'doc_id', label: 'Document ID' },
      { key: 'sessions', label: 'Sessions', type: 'integer' },
      { key: 'unique_viewers', label: 'Unique Viewers', type: 'integer' },
      { key: 'avg_duration_ms', label: 'Average Reading Time (ms)', type: 'number' },
      { key: 'completion_rate', label: 'Completion Rate (%)', type: 'number' },
      { key: 'pages_per_session', label: 'Pages per Session', type: 'number' },
      { key: 'prints', label: 'Prints', type: 'integer' },
      { key: 'downloads', label: 'Downloads', type: 'integer' },
      { key: 'form_submissions', label: 'Form Submissions', type: 'integer' },
      { key: 'annotations', label: 'Annotations', type: 'integer' },
    ],
  },
});

export const findReadingSession = defineSearch({
  key: 'findReadingSession',
  noun: 'reading session',
  display: {
    label: 'Find Reading Session',
    description: 'Finds one reading session of a document, with its time on every page and its events.',
  },
  operation: {
    inputFields: [documentField(), readingSessionField()],
    perform: (z: ZObject, bundle: Bundle) =>
      found(
        fetchDataOrNull<Record<string, unknown>>(
          z,
          'GET',
          documentPath(bundle, `/analytics/sessions/${encodeURIComponent(String(bundle.inputData.session_id))}`),
        ),
      ),
    sample: {
      session: {
        session_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        viewer_id: 'f6e5d4c3-b2a1-4f0e-9d8c-7b6a5f4e3d2c',
        recipient: { name: 'Jane Doe', email: 'jane@contoso.com' },
        device_type: 'desktop',
        browser: 'Chrome',
        os: 'macOS',
        created_at: '2026-10-09 14:28:11',
      },
      metrics: {
        total_duration_ms: 184000,
        pages_viewed: 7,
        total_pages: 12,
        completion_pct: 58,
        downloads: 0,
        prints: 0,
      },
      pages: [{ page: 1, duration_ms: 21000 }],
      events: [{ event: 'page:enter', page: 1 }],
    },
    outputFields: [
      { key: 'session__session_id', label: 'Session ID' },
      { key: 'session__viewer_id', label: 'Viewer ID' },
      { key: 'session__recipient__name', label: 'Recipient Name' },
      { key: 'session__recipient__email', label: 'Recipient Email' },
      { key: 'session__device_type', label: 'Device Type' },
      { key: 'session__browser', label: 'Browser' },
      { key: 'session__os', label: 'Operating System' },
      { key: 'session__created_at', label: 'Started At' },
      { key: 'metrics__total_duration_ms', label: 'Reading Time (ms)', type: 'integer' },
      { key: 'metrics__pages_viewed', label: 'Pages Viewed', type: 'integer' },
      { key: 'metrics__total_pages', label: 'Document Pages', type: 'integer' },
      { key: 'metrics__completion_pct', label: 'Completion Rate (%)', type: 'integer' },
      { key: 'metrics__downloads', label: 'Downloads', type: 'integer' },
      { key: 'metrics__prints', label: 'Prints', type: 'integer' },
    ],
  },
});
