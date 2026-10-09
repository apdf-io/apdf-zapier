import type { Bundle, PlainInputField } from 'zapier-platform-core';

/**
 * The document picker every document-scoped step shares. It lists active documents by name and
 * offers a Find Document step for mapping an ID from elsewhere.
 */
export const documentField = (overrides: Partial<PlainInputField> = {}): PlainInputField => ({
  key: 'doc_id',
  label: 'Document',
  required: true,
  helpText: 'The tracked document. Pick one, or map a document ID from an earlier step.',
  dynamic: 'documentList.id.name',
  search: 'findDocument.doc_id',
  ...overrides,
});

/**
 * The tracking link picker. It lists the links of the chosen document by recipient.
 */
export const trackingLinkField = (): PlainInputField => ({
  key: 'token',
  label: 'Tracking Link',
  required: true,
  helpText: 'The recipient link. Pick one, or map its token from an earlier step.',
  dynamic: 'trackingLinkList.id.name',
  dependsOn: ['doc_id'],
  search: 'findTrackingLink.token',
});

/**
 * The reading session picker. It lists the sessions of the chosen document by reader and time.
 */
export const readingSessionField = (): PlainInputField => ({
  key: 'session_id',
  label: 'Reading Session',
  required: true,
  helpText: 'The session. Pick one, or map a session ID from a reader event.',
  dynamic: 'readingSessionList.id.name',
  dependsOn: ['doc_id'],
});

/**
 * The path of the document the step was set up for.
 */
export const documentPath = (bundle: Bundle, suffix = ''): string =>
  `/docs/${encodeURIComponent(String(bundle.inputData.doc_id))}${suffix}`;
