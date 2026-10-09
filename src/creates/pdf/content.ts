import { definePdfOperation } from './operation.js';
import { pdfFileField, searchFields } from './fields.js';
import {
  asIs,
  extractedText,
  extractedTextOutputFields,
  pageCountOutputFields,
  producedFile,
  producedFileOutputFields,
  searchResultOutputFields,
} from './results.js';
import { extractedTextSample, producedFileSample, searchResultSample } from './samples.js';

export const extractPdfText = definePdfOperation({
  key: 'extractPdfText',
  label: 'Extract PDF Text',
  description: 'Extracts the text of a PDF that has a text layer. For scanned PDFs, use Extract PDF Text With OCR.',
  path: '/pdf/content/read',
  inputFields: [pdfFileField()],
  result: extractedText,
  sample: extractedTextSample,
  outputFields: extractedTextOutputFields,
});

export const searchPdfText = definePdfOperation({
  key: 'searchPdfText',
  label: 'Search PDF Text',
  description: 'Finds text in a PDF and returns every match with its page and line.',
  path: '/pdf/content/search',
  inputFields: [pdfFileField(), ...searchFields],
  result: asIs,
  sample: searchResultSample,
  outputFields: searchResultOutputFields,
});

export const makePdfSearchable = definePdfOperation({
  key: 'makePdfSearchable',
  label: 'Make PDF Searchable With OCR',
  description: 'Adds a searchable text layer to a scanned PDF.',
  path: '/pdf/ocr/convert',
  inputFields: [pdfFileField({ helpText: 'The scanned PDF. Map a file from an earlier step, or enter a public URL.' })],
  result: producedFile,
  sample: producedFileSample({ pages: 3, size: 1840022 }),
  outputFields: [...producedFileOutputFields, ...pageCountOutputFields],
});

export const extractPdfTextWithOcr = definePdfOperation({
  key: 'extractPdfTextWithOcr',
  label: 'Extract PDF Text With OCR',
  description: 'Reads the text of a scanned PDF with OCR.',
  path: '/pdf/ocr/read',
  inputFields: [pdfFileField({ helpText: 'The scanned PDF. Map a file from an earlier step, or enter a public URL.' })],
  result: extractedText,
  sample: extractedTextSample,
  outputFields: extractedTextOutputFields,
});

export const searchPdfTextWithOcr = definePdfOperation({
  key: 'searchPdfTextWithOcr',
  label: 'Search PDF Text With OCR',
  description: 'Finds text in a scanned PDF with OCR and returns every match with its page and line.',
  path: '/pdf/ocr/search',
  inputFields: [
    pdfFileField({ helpText: 'The scanned PDF. Map a file from an earlier step, or enter a public URL.' }),
    ...searchFields,
  ],
  result: asIs,
  sample: searchResultSample,
  outputFields: searchResultOutputFields,
});

export const getPdfMetadata = definePdfOperation({
  key: 'getPdfMetadata',
  label: 'Get PDF Metadata',
  description: 'Reads the page count, page size, title, creator, dates and encryption status of a PDF.',
  path: '/pdf/metadata/read',
  inputFields: [pdfFileField()],
  result: asIs,
  sample: {
    job_id: '01M4GQ3GVGZFY170D7TS7J20ZK',
    title: 'Proposal for Contoso',
    creator: 'Microsoft Word',
    producer: 'macOS Quartz PDFContext',
    created: 'Thu Oct  8 09:12:44 2026 CEST',
    modified: 'Thu Oct  8 09:12:44 2026 CEST',
    pages: 12,
    encrypted: false,
    page_size: '595.276 x 841.89 pts (A4)',
    file_size: 482113,
    pdf_version: '1.7',
  },
  outputFields: [
    { key: 'job_id', label: 'Job ID' },
    { key: 'title', label: 'Title' },
    { key: 'creator', label: 'Creator' },
    { key: 'producer', label: 'Producer' },
    { key: 'created', label: 'Created' },
    { key: 'modified', label: 'Modified' },
    { key: 'pages', label: 'Pages', type: 'integer' },
    { key: 'encrypted', label: 'Encrypted', type: 'boolean' },
    { key: 'page_size', label: 'Page Size' },
    { key: 'file_size', label: 'File Size (Bytes)', type: 'integer' },
    { key: 'pdf_version', label: 'PDF Version' },
  ],
});
