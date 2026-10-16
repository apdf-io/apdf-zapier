import type { PlainInputField } from 'zapier-platform-core';

/** The condition templates an automation accepts, keyed as the API names them. */
export type ConditionType = 'page_number' | 'time_on_page' | 'total_reading_time' | 'pages_viewed' | 'completion_rate';

/** A reader event a trigger can start a Zap on. */
export interface ReaderEvent {
  /** The Zapier trigger key. */
  key: string;
  /** The event name Apdf uses. */
  event: string;
  label: string;
  description: string;
  /** The conditions Apdf allows for this event, in the order they are offered. */
  conditions: ConditionType[];
  /** What the event's "data" looks like, for the sample. */
  sampleData: Record<string, unknown> | null;
}

/**
 * One optional input per condition. Each narrows when the automation fires; Apdf evaluates it
 * before calling Zapier, so a Zap only runs for readers that qualify.
 */
export const conditionFields: Record<ConditionType, PlainInputField> = {
  page_number: {
    key: 'page_number',
    label: 'Page number',
    type: 'integer',
    helpText: 'Only trigger for this page.',
  },
  time_on_page: {
    key: 'time_on_page',
    label: 'Minimum time on page (seconds)',
    type: 'integer',
    helpText: 'Only trigger when the reader has stayed on the page at least this long.',
  },
  total_reading_time: {
    key: 'total_reading_time',
    label: 'Minimum total reading time (seconds)',
    type: 'integer',
    helpText:
      "Only trigger when the reader has spent at least this long reading the document during this visit, across all pages. A page's time counts once they move on to another page or close the document; time with the tab in the background doesn't count.",
  },
  pages_viewed: {
    key: 'pages_viewed',
    label: 'Minimum pages viewed',
    type: 'integer',
    helpText: 'Only trigger when the reader has opened at least this many different pages during this visit.',
  },
  completion_rate: {
    key: 'completion_rate',
    label: 'Minimum completion rate (%)',
    type: 'integer',
    helpText: "Only trigger when the reader has viewed at least this share of the document's pages during this visit.",
  },
};

const SESSION_CONDITIONS: ConditionType[] = ['total_reading_time', 'pages_viewed', 'completion_rate'];
const PAGE_CONDITIONS: ConditionType[] = ['page_number', ...SESSION_CONDITIONS];
const DWELL_CONDITIONS: ConditionType[] = ['page_number', 'time_on_page', ...SESSION_CONDITIONS];

/**
 * Every event an Apdf automation can fire on, mirroring the AutomationTrigger enum in Apdf
 * together with the conditions each one accepts.
 */
export const readerEvents: ReaderEvent[] = [
  {
    key: 'documentOpened',
    event: 'document:loaded',
    label: 'Document Opened',
    description: 'Triggers when a reader opens a tracked document. Fires once per reading session.',
    conditions: SESSION_CONDITIONS,
    sampleData: null,
  },
  {
    key: 'documentDownloaded',
    event: 'document:download',
    label: 'Document Downloaded',
    description: 'Triggers when a reader downloads a tracked document. Fires once per reading session.',
    conditions: SESSION_CONDITIONS,
    sampleData: null,
  },
  {
    key: 'documentPrinted',
    event: 'document:print',
    label: 'Document Printed',
    description: 'Triggers when a reader prints a tracked document. Fires once per reading session.',
    conditions: SESSION_CONDITIONS,
    sampleData: null,
  },
  {
    key: 'pageViewed',
    event: 'page:enter',
    label: 'Page Viewed',
    description: 'Triggers when a reader navigates to a page. Fires once per reading session.',
    conditions: PAGE_CONDITIONS,
    sampleData: { page: 3 },
  },
  {
    key: 'pageRead',
    event: 'page:read',
    label: 'Page Read',
    description: 'Triggers when a reader stays on a page, measured in 15-second steps. Fires once per reading session.',
    conditions: DWELL_CONDITIONS,
    sampleData: { page: 3, duration_ms: 45000 },
  },
  {
    key: 'pageLeft',
    event: 'page:leave',
    label: 'Page Left',
    description: 'Triggers when a reader navigates away from a page. Fires once per reading session.',
    conditions: DWELL_CONDITIONS,
    sampleData: { page: 3, duration_ms: 52000 },
  },
  {
    key: 'textCopied',
    event: 'text:copied',
    label: 'Text Copied',
    description: 'Triggers when a reader copies text from a tracked document. Fires every time.',
    conditions: PAGE_CONDITIONS,
    sampleData: { page: 4, text: 'Annual licence: $24,000' },
  },
  {
    key: 'linkClicked',
    event: 'link:clicked',
    label: 'Link Clicked',
    description: 'Triggers when a reader clicks a link in a tracked document. Fires every time.',
    conditions: PAGE_CONDITIONS,
    sampleData: { page: 5, url: 'https://example.com/book-a-call', text: 'Book a call', is_internal: false },
  },
  {
    key: 'formSubmitted',
    event: 'form:submit',
    label: 'Form Submitted',
    description: 'Triggers when a reader submits the form fields of a tracked document. Fires every time.',
    conditions: SESSION_CONDITIONS,
    sampleData: { fields: { company: 'Contoso', seats: '25', start_date: '2026-11-01' } },
  },
  {
    key: 'annotationCreated',
    event: 'annotation:create',
    label: 'Annotation Created',
    description: 'Triggers when a reader highlights, marks up or comments on a tracked document. Fires every time.',
    conditions: PAGE_CONDITIONS,
    sampleData: {
      page: 4,
      type: 'highlight',
      comment_text: 'Can we get volume pricing here?',
      comment_author: 'Jane Doe',
      annotated_text: 'Annual licence: $24,000',
    },
  },
  {
    key: 'annotationUpdated',
    event: 'annotation:update',
    label: 'Annotation Updated',
    description: 'Triggers when a reader changes an annotation on a tracked document. Fires every time.',
    conditions: PAGE_CONDITIONS,
    sampleData: {
      page: 4,
      type: 'highlight',
      comment_text: 'Can we get volume pricing for 50 seats?',
      comment_author: 'Jane Doe',
      annotated_text: 'Annual licence: $24,000',
    },
  },
  {
    key: 'annotationDeleted',
    event: 'annotation:delete',
    label: 'Annotation Deleted',
    description: 'Triggers when a reader removes an annotation from a tracked document. Fires every time.',
    conditions: PAGE_CONDITIONS,
    sampleData: { page: 4 },
  },
];
