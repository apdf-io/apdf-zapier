import type { PlainInputField } from 'zapier-platform-core';

/** How page selections are written, shared by every field that takes one. */
export const PAGE_SYNTAX =
  'Page numbers and ranges, for example `1,3-5`. Use `z` for the last page and `rN` for the Nth page from the end.';

/**
 * A PDF the operation reads. Zapier passes Apdf a URL either way: the mapped file's, or the one
 * typed in.
 */
export const pdfFileField = (overrides: Partial<PlainInputField> = {}): PlainInputField => ({
  key: 'file',
  label: 'PDF file',
  type: 'file',
  required: true,
  helpText: 'Map a PDF from an earlier step, or enter a public URL.',
  ...overrides,
});

/**
 * A page selection, required or optional, with its purpose in front of the shared syntax.
 */
export const pagesField = (purpose: string, overrides: Partial<PlainInputField> = {}): PlainInputField => ({
  key: 'pages',
  label: 'Pages',
  required: true,
  helpText: `${purpose} ${PAGE_SYNTAX}`,
  ...overrides,
});

/** The text a search looks for, and how it matches. */
export const searchFields: PlainInputField[] = [
  {
    key: 'text',
    label: 'Search text',
    required: true,
  },
  {
    key: 'case',
    label: 'Case sensitive',
    type: 'boolean',
    default: 'false',
    helpText: 'Whether capitalization must match exactly.',
  },
  {
    key: 'regex',
    label: 'Regular expression',
    type: 'boolean',
    default: 'false',
    helpText: 'Whether the search text is a regular expression.',
  },
];

/**
 * The name of the stamped PDF, as the field labels call it.
 */
const layerLabel = (layer: 'overlay' | 'underlay'): string => (layer === 'overlay' ? 'Overlay PDF' : 'Underlay PDF');

/**
 * Where a stamped PDF goes on the pages: placed over them, or behind them.
 */
export const layerFields = (layer: 'overlay' | 'underlay'): PlainInputField[] => [
  pdfFileField(),
  pdfFileField({
    key: layer,
    label: layerLabel(layer),
    helpText:
      layer === 'overlay'
        ? 'The PDF stamped on top of the pages, such as a watermark. Map a PDF from an earlier step, or enter a public URL.'
        : 'The PDF placed behind the pages, such as letterhead. Map a PDF from an earlier step, or enter a public URL.',
  }),
  {
    key: 'from',
    label: `Pages of the ${layer} PDF`,
    required: false,
    helpText: `Which pages of the ${layer} PDF to use, in order. Leave empty to use all of them. ${PAGE_SYNTAX}`,
  },
  {
    key: 'to',
    label: 'Target pages',
    required: false,
    helpText: `Which pages of your PDF get the ${layer}. Leave empty for every page. ${PAGE_SYNTAX}`,
  },
  {
    key: 'repeat',
    label: 'Repeat pages',
    required: false,
    helpText: `Pages of the ${layer} PDF to repeat once the ones above run out. ${PAGE_SYNTAX}`,
  },
];
