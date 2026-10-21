import type { Bundle, PlainInputField } from 'zapier-platform-core';

/**
 * The document picker every document-scoped step shares. It lists active documents by name and
 * offers a Find Document step for mapping an ID from elsewhere.
 */
export const documentField = (overrides: Partial<PlainInputField> = {}): PlainInputField => ({
  key: 'doc_id',
  label: 'Document',
  required: true,
  helpText: 'Pick a document, or map a document ID from an earlier step.',
  dynamic: 'documentList.id.name',
  search: 'findDocument.doc_id',
  ...overrides,
});

/**
 * The tracking link picker. It lists the links of the chosen document by recipient.
 */
export const trackingLinkField = (): PlainInputField => ({
  key: 'token',
  label: 'Tracking link',
  required: true,
  helpText: 'Pick a tracking link, or map its token from an earlier step.',
  dynamic: 'trackingLinkList.id.name',
  dependsOn: ['doc_id'],
  search: 'findTrackingLink.token',
});

/**
 * The reading session picker. It lists the sessions of the chosen document by reader and time.
 */
export const readingSessionField = (): PlainInputField => ({
  key: 'session_id',
  label: 'Reading session',
  required: true,
  helpText: 'Pick a reading session, or map a session ID from a reader event.',
  dynamic: 'readingSessionList.id.name',
  dependsOn: ['doc_id'],
});

/**
 * The annotation picker. It lists the annotations of the chosen document by page and marked text.
 */
export const annotationField = (): PlainInputField => ({
  key: 'annotation_id',
  label: 'Annotation',
  required: true,
  helpText: 'Pick an annotation, or map an annotation ID from an annotation trigger.',
  dynamic: 'annotationList.id.name',
  dependsOn: ['doc_id'],
});

/**
 * The path of the document the step was set up for.
 */
export const documentPath = (bundle: Bundle, suffix = ''): string =>
  `/docs/${encodeURIComponent(String(bundle.inputData.doc_id))}${suffix}`;
