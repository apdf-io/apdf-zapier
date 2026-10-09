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
