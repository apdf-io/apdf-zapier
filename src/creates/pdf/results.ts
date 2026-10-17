import type { PlainOutputField, ZObject } from 'zapier-platform-core';

import { stashFile } from '../../lib/files.js';

/** A file an operation produced, as Apdf describes it. */
interface ProducedFile {
  file: string;
  expiration: string;
  [detail: string]: unknown;
}

/** Text extracted page by page. */
interface ExtractedText {
  pages: { page: number; characters: number; content: string }[];
  [detail: string]: unknown;
}

/** A field marked on a form page, as Apdf numbers it. */
interface MarkedField {
  number: number;
  name: string;
  type: string;
  option?: string;
  hidden?: boolean;
}

/** Form pages rendered with their marked fields. */
interface FormPages {
  pages: (ProducedFile & { page: number; fields: MarkedField[] })[];
}

/** Turns a finished job's result into the step's output. */
export type ResultShaper = (z: ZObject, result: any) => Promise<Record<string, unknown>> | Record<string, unknown>;

/**
 * One produced file: Zapier's stashed copy as "file", Apdf's own short-lived link as "file_url",
 * and whatever else Apdf reported about it.
 */
export const producedFile: ResultShaper = async (z, result: ProducedFile) => ({
  ...result,
  file_url: result.file,
  file: await stashFile(z, result.file),
});

/**
 * Several produced files, as line items.
 */
export const producedFiles: ResultShaper = async (z, results: ProducedFile[]) => ({
  count: results.length,
  files: await Promise.all(results.map((result) => producedFile(z, result))),
});

/**
 * Extracted text, with the pages joined into one "text" field for the common case of wanting
 * all of it.
 */
export const extractedText: ResultShaper = (z, result: ExtractedText) => ({
  ...result,
  text: result.pages.map((page) => page.content).join('\n\n'),
});

/**
 * One line per marked field, saying which field and option its number stands for, so an AI step
 * can be given the images and this text.
 */
const legendLine = ({ number, name, type, option, hidden }: MarkedField): string =>
  `${number}: ${name}${option === undefined ? '' : ` = ${option}`} (${type}${hidden ? ', hidden' : ''})`;

/**
 * Rendered form pages as line items with their images, the marked fields of every page in one
 * list, and the legend of the numbers as text.
 */
export const formPages: ResultShaper = async (z, result: FormPages) => {
  const fields = result.pages.flatMap(({ page, fields }) => fields.map((field) => ({ page, ...field })));

  return {
    count: result.pages.length,
    pages: await Promise.all(result.pages.map(({ fields, ...page }) => producedFile(z, page))),
    fields,
    legend: fields.map(legendLine).join('\n'),
  };
};

/** Results that are already plain data. */
export const asIs: ResultShaper = (z, result: Record<string, unknown>) => result;

export const producedFileOutputFields: PlainOutputField[] = [
  { key: 'job_id', label: 'Job ID' },
  { key: 'file', label: 'File', type: 'file' },
  { key: 'file_url', label: 'File URL (expires after an hour)' },
  { key: 'expiration', label: 'File URL Expires At', type: 'datetime' },
];

export const pageCountOutputFields: PlainOutputField[] = [
  { key: 'pages', label: 'Pages', type: 'integer' },
  { key: 'size', label: 'File Size (Bytes)', type: 'integer' },
];

export const producedFilesOutputFields: PlainOutputField[] = [
  { key: 'job_id', label: 'Job ID' },
  { key: 'count', label: 'Number of Files', type: 'integer' },
  { key: 'files[]file', label: 'Files', type: 'file' },
  { key: 'files[]file_url', label: 'File URLs (expire after an hour)' },
];

export const extractedTextOutputFields: PlainOutputField[] = [
  { key: 'job_id', label: 'Job ID' },
  { key: 'text', label: 'Text' },
  { key: 'pages_total', label: 'Pages', type: 'integer' },
  { key: 'characters_total', label: 'Characters', type: 'integer' },
  { key: 'pages[]page', label: 'Page Number', type: 'integer' },
  { key: 'pages[]content', label: 'Page Text' },
];

export const searchResultOutputFields: PlainOutputField[] = [
  { key: 'job_id', label: 'Job ID' },
  { key: 'search_text', label: 'Search Text' },
  { key: 'results_total', label: 'Matches', type: 'integer' },
  { key: 'results_pages', label: 'Pages With Matches', type: 'integer' },
  { key: 'results[]page', label: 'Match Page', type: 'integer' },
  { key: 'results[]matched_line', label: 'Matched Line' },
  { key: 'results[]exact_word', label: 'Matched Text' },
];

export const formFieldsOutputFields: PlainOutputField[] = [
  { key: 'job_id', label: 'Job ID' },
  { key: 'fields[]name', label: 'Field Name' },
  { key: 'fields[]type', label: 'Field Type' },
  { key: 'fields[]label', label: 'Field Label' },
  { key: 'fields[]value', label: 'Field Value' },
  { key: 'fields[]page', label: 'Field Page', type: 'integer' },
  { key: 'fields[]required', label: 'Field Required', type: 'boolean' },
  { key: 'fields[]read_only', label: 'Field Read-Only', type: 'boolean' },
  { key: 'fields[]options', label: 'Field Options' },
];

export const formPagesOutputFields: PlainOutputField[] = [
  { key: 'job_id', label: 'Job ID' },
  { key: 'count', label: 'Number of Pages', type: 'integer' },
  { key: 'legend', label: 'Field Numbers' },
  { key: 'pages[]page', label: 'Page Number', type: 'integer' },
  { key: 'pages[]file', label: 'Page Images', type: 'file' },
  { key: 'pages[]file_url', label: 'Page Image URLs (expire after an hour)' },
  { key: 'fields[]number', label: 'Field Number', type: 'integer' },
  { key: 'fields[]name', label: 'Field Name' },
  { key: 'fields[]type', label: 'Field Type' },
  { key: 'fields[]option', label: 'Field Option' },
  { key: 'fields[]page', label: 'Field Page', type: 'integer' },
];
