import type { Document, TrackingLink } from './types.js';

/**
 * Zapier expects every trigger result to carry an "id"; a document's own key is doc_id.
 */
export const withDocumentId = (document: Document) => ({ id: document.doc_id, ...document });

export const documentSample: Document = {
  doc_id: '48927-c7621-ec3c0',
  viewer_url: 'https://docs.apdf.io/acme/48927-c7621-ec3c0',
  file_url: 'https://apdf-files.s3.eu-central-1.amazonaws.com/docs/202610/4ddc3d936ac912d932576.pdf',
  name: 'Acme × Contoso proposal',
  file_size: 482113,
  file_pages: 12,
  is_public: false,
  created_at: '2026-10-09T16:14:17.000000Z',
  archived_at: null,
};

export const documentOutputFields = [
  { key: 'doc_id', label: 'Document ID' },
  { key: 'name', label: 'Name' },
  { key: 'viewer_url', label: 'Viewer URL' },
  { key: 'file_url', label: 'File URL' },
  { key: 'file_size', label: 'File Size (Bytes)', type: 'integer' as const },
  { key: 'file_pages', label: 'Pages', type: 'integer' as const },
  { key: 'is_public', label: 'Is Public', type: 'boolean' as const },
  { key: 'created_at', label: 'Created At', type: 'datetime' as const },
  { key: 'archived_at', label: 'Archived At', type: 'datetime' as const },
];

export const trackingLinkSample: TrackingLink = {
  token: '1fuRqbfX',
  name: 'Jane Doe',
  email: 'jane@contoso.com',
  url: 'https://docs.apdf.io/acme/48927-c7621-ec3c0?v=1fuRqbfX',
  is_active: true,
  last_viewed_at: null,
  created_at: '2026-10-09T16:14:25.000000Z',
};

export const trackingLinkOutputFields = [
  { key: 'token', label: 'Token' },
  { key: 'name', label: 'Recipient Name' },
  { key: 'email', label: 'Recipient Email' },
  { key: 'url', label: 'Tracking URL' },
  { key: 'is_active', label: 'Is Active', type: 'boolean' as const },
  { key: 'last_viewed_at', label: 'Last Viewed At', type: 'datetime' as const },
  { key: 'created_at', label: 'Created At', type: 'datetime' as const },
];
