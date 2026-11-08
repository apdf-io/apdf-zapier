import type { Annotation, Document, SignatureRequest, TrackingLink } from './types.js';

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

export const annotationSample: Annotation = {
  annotation_id: 'annot_1776805002364_5uxvr3fcx',
  page: 4,
  type: 'highlight',
  creator_id: 'OLHe7I5rXTBz',
  recipient: { name: 'Jane Doe', email: 'jane@contoso.com' },
  annotated_text: 'Annual licence: $24,000',
  comment_author: 'Jane Doe',
  comment_text: 'Can we get volume pricing here?',
  replies: [{ author: 'Sam Lee', text: 'Yes, from 25 seats.', created_at: '2026-10-09T16:20:41.000000Z' }],
  created_at: '2026-10-09T16:18:02.000000Z',
};

export const annotationOutputFields = [
  { key: 'annotation_id', label: 'Annotation ID' },
  { key: 'page', label: 'Page', type: 'integer' as const },
  { key: 'type', label: 'Annotation Type' },
  { key: 'annotated_text', label: 'Annotated Text' },
  { key: 'comment_author', label: 'Comment Author' },
  { key: 'comment_text', label: 'Comment' },
  { key: 'replies[]author', label: 'Reply Author' },
  { key: 'replies[]text', label: 'Reply' },
  { key: 'replies[]created_at', label: 'Reply Created At', type: 'datetime' as const },
  { key: 'recipient__name', label: 'Recipient Name' },
  { key: 'recipient__email', label: 'Recipient Email' },
  { key: 'created_at', label: 'Created At', type: 'datetime' as const },
];

export const signatureRequestSample: SignatureRequest = {
  request_id: '39fe0-14d24-714bd',
  status: 'pending',
  message: 'Here is the contract we discussed.',
  metadata: { deal_id: 'D-42' },
  send_email: true,
  signers: [
    {
      type: 'recipient',
      role: 'Client',
      name: 'Jane Doe',
      email: 'jane@contoso.com',
      status: 'signed',
      link: 'fi6WgjyH',
      url: 'https://docs.apdf.io/acme/48927-c7621-ec3c0?v=fi6WgjyH',
      signed_at: '2026-10-28T09:44:06.000000Z',
      declined_at: null,
      decline_reason: null,
    },
    {
      type: 'member',
      role: 'Agency',
      name: 'Sam Lee',
      email: 'sam@acme.com',
      status: 'pending',
      link: null,
      url: null,
      signed_at: null,
      declined_at: null,
      decline_reason: null,
    },
  ],
  file_url: null,
  signed_file_hash: null,
  created_at: '2026-10-28T09:42:22.000000Z',
  completed_at: null,
  cancelled_at: null,
};

export const signatureRequestOutputFields = [
  { key: 'request_id', label: 'Signature Request ID' },
  { key: 'status', label: 'Status' },
  { key: 'message', label: 'Message' },
  { key: 'signers[]role', label: 'Signer Role' },
  { key: 'signers[]name', label: 'Signer Name' },
  { key: 'signers[]email', label: 'Signer Email' },
  { key: 'signers[]status', label: 'Signer Status' },
  { key: 'signers[]url', label: 'Signer Signing URL' },
  { key: 'signers[]signed_at', label: 'Signer Signed At', type: 'datetime' as const },
  { key: 'signers[]decline_reason', label: 'Signer Decline Reason' },
  { key: 'file_url', label: 'Signed PDF URL' },
  { key: 'created_at', label: 'Created At', type: 'datetime' as const },
  { key: 'completed_at', label: 'Completed At', type: 'datetime' as const },
  { key: 'cancelled_at', label: 'Cancelled At', type: 'datetime' as const },
];
