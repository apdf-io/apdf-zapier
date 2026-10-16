import { definePdfOperation } from './operation.js';
import { PAGE_SYNTAX, pagesField, pdfFileField } from './fields.js';
import {
  pageCountOutputFields,
  producedFile,
  producedFileOutputFields,
  producedFiles,
  producedFilesOutputFields,
} from './results.js';
import { producedFileSample, producedFilesSample } from './samples.js';

/** Page sizes and units the HTML renderer accepts. */
const PAGE_FORMATS = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'letter', 'legal', 'tabloid', 'ledger'];
const UNITS = { px: 'Pixels', in: 'Inches', cm: 'Centimeters', mm: 'Millimeters' };

/**
 * A number field of the page layout group.
 */
const layoutNumber = (key: string, label: string, helpText: string) => ({
  key,
  label,
  type: 'number' as const,
  group: 'layout',
  helpText,
});

export const createPdfFromHtml = definePdfOperation({
  key: 'createPdfFromHtml',
  label: 'Create PDF From HTML',
  description: 'Renders HTML into a PDF.',
  path: '/pdf/file/create',
  inputFields: [
    {
      key: 'html',
      label: 'HTML',
      type: 'code',
      required: true,
      helpText: 'The HTML to render, including any inline CSS.',
    },
    {
      key: 'format',
      label: 'Page format',
      group: 'layout',
      choices: Object.fromEntries(PAGE_FORMATS.map((format) => [format, format.toUpperCase()])),
      helpText: 'The paper size. Ignored when a width and height are set.',
    },
    {
      key: 'orientation',
      label: 'Orientation',
      group: 'layout',
      choices: { portrait: 'Portrait', landscape: 'Landscape' },
    },
    layoutNumber('width', 'Width', 'A custom page width. Set it together with the height.'),
    layoutNumber('height', 'Height', 'A custom page height. Set it together with the width.'),
    {
      key: 'unit',
      label: 'Unit',
      group: 'layout',
      choices: UNITS,
      helpText: 'The unit of the width, height and margins.',
    },
    layoutNumber('scale', 'Scale', 'Zoom applied while rendering, between 0.1 and 2.'),
    layoutNumber('margin_top', 'Margin top', 'Space above the content.'),
    layoutNumber('margin_right', 'Margin right', 'Space right of the content.'),
    layoutNumber('margin_bottom', 'Margin bottom', 'Space below the content.'),
    layoutNumber('margin_left', 'Margin left', 'Space left of the content.'),
    {
      key: 'header',
      label: 'Header HTML',
      type: 'code',
      group: 'layout',
      helpText: 'HTML rendered at the top of every page.',
    },
    {
      key: 'footer',
      label: 'Footer HTML',
      type: 'code',
      group: 'layout',
      helpText: 'HTML rendered at the bottom of every page.',
    },
  ],
  inputFieldGroups: [{ key: 'layout', label: 'Page Layout' }],
  result: producedFile,
  sample: producedFileSample({ pages: 2, size: 48211 }),
  outputFields: [...producedFileOutputFields, ...pageCountOutputFields],
});

export const convertOfficeToPdf = definePdfOperation({
  key: 'convertOfficeToPdf',
  label: 'Convert Office Document to PDF',
  description: 'Converts a Word, Excel, PowerPoint, OpenDocument or RTF file into a PDF.',
  path: '/pdf/file/convert',
  inputFields: [
    pdfFileField({
      label: 'Office file',
      helpText:
        'A docx, doc, xlsx, xls, pptx, ppt, odt, ods, odp or rtf file. Map a file from an earlier step, or enter a public URL.',
    }),
  ],
  result: producedFile,
  sample: producedFileSample({ pages: 4, size: 182044 }),
  outputFields: [...producedFileOutputFields, ...pageCountOutputFields],
});

/**
 * Pair each file to merge with the page selection at the same position, if there is one.
 */
const mergeEntries = (files: unknown, pages: unknown): { file: unknown; pages?: unknown }[] => {
  const selections = ([] as unknown[]).concat(pages ?? []);

  return ([] as unknown[])
    .concat(files)
    .map((file, index) => (selections[index] ? { file, pages: selections[index] } : { file }));
};

export const mergePdfs = definePdfOperation({
  key: 'mergePdfs',
  label: 'Merge PDFs',
  description: 'Joins several PDFs into one, in the order given, optionally taking only some pages of each.',
  path: '/pdf/file/merge',
  inputFields: [
    pdfFileField({
      key: 'files',
      label: 'PDF files',
      list: true,
      helpText: 'The PDFs to join, in order. Map files from earlier steps, or enter public URLs.',
    }),
    {
      key: 'pages',
      label: 'Pages per file',
      list: true,
      helpText: `Which pages to take from each file, in the same order as the files: the first entry is for the first file, and so on. Use \`1-z\` for all pages of a file; files without an entry are taken whole. ${PAGE_SYNTAX}`,
    },
  ],
  body: ({ files, pages, ...rest }) => ({ ...rest, files: mergeEntries(files, pages) }),
  result: producedFile,
  sample: producedFileSample({ pages: 9, size: 612388 }),
  outputFields: [...producedFileOutputFields, ...pageCountOutputFields],
});

export const splitPdf = definePdfOperation({
  key: 'splitPdf',
  label: 'Split PDF',
  description: 'Splits a PDF into several files.',
  path: '/pdf/file/split',
  inputFields: [
    pdfFileField(),
    pagesField(
      'One file per comma-separated group, so `1,2-3,4-z` makes three files. Use `nN` for a new file every N pages, for example `n2`.',
    ),
  ],
  result: producedFiles,
  sample: producedFilesSample([
    { pages: 1, size: 120443 },
    { pages: 2, size: 241161 },
  ]),
  outputFields: [
    ...producedFilesOutputFields,
    { key: 'files[]pages', label: 'File Pages', type: 'integer' },
    { key: 'files[]size', label: 'File Size (Bytes)', type: 'integer' },
  ],
});

export const compressPdf = definePdfOperation({
  key: 'compressPdf',
  label: 'Compress PDF',
  description: 'Reduces the file size of a PDF.',
  path: '/pdf/file/compress',
  inputFields: [pdfFileField()],
  result: producedFile,
  sample: producedFileSample({ size_original: 4812290, size_compressed: 1288310 }),
  outputFields: [
    ...producedFileOutputFields,
    { key: 'size_original', label: 'Original Size (Bytes)', type: 'integer' },
    { key: 'size_compressed', label: 'Compressed Size (Bytes)', type: 'integer' },
  ],
});

export const convertPdfToImages = definePdfOperation({
  key: 'convertPdfToImages',
  label: 'Convert PDF to Images',
  description: 'Renders PDF pages as PNG, JPEG or TIFF images, one file per page.',
  path: '/pdf/file/to-image',
  inputFields: [
    pdfFileField(),
    {
      key: 'image_type',
      label: 'Image type',
      required: true,
      default: 'png',
      choices: { png: 'PNG', jpeg: 'JPEG', jpegcmyk: 'JPEG (CMYK)', tiff: 'TIFF' },
    },
    {
      key: 'color_mode',
      label: 'Color mode',
      choices: { color: 'Color', gray: 'Grayscale', mono: 'Monochrome' },
    },
    { key: 'dpi', label: 'Resolution (DPI)', type: 'integer', helpText: 'Up to 300. Defaults to 150.' },
    pagesField('Which pages to render. Defaults to the first page.', { required: false }),
  ],
  result: producedFiles,
  sample: producedFilesSample([{ page: 1 }, { page: 2 }]),
  outputFields: [...producedFilesOutputFields, { key: 'files[]page', label: 'Image Page', type: 'integer' }],
});
