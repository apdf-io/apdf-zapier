/** Sample of a step that produced one file. */
export const producedFileSample = (details: Record<string, unknown> = {}) => ({
  job_id: '01M4GQ3GVGZFY170D7TS7J20ZK',
  file: 'https://zapier-files.example.com/stash/191674e262f952ca.pdf',
  file_url: 'https://apdf-files.s3.eu-central-1.amazonaws.com/191674e262f952ca.pdf',
  expiration: '2026-10-09T15:32:05.000000Z',
  ...details,
});

/** Sample of a step that produced several files. */
export const producedFilesSample = (files: Record<string, unknown>[]) => ({
  job_id: '01M4GQ3GVGZFY170D7TS7J20ZK',
  count: files.length,
  files: files.map((details, index) => ({
    file: `https://zapier-files.example.com/stash/191674e262f952ca-${index + 1}.pdf`,
    file_url: `https://apdf-files.s3.eu-central-1.amazonaws.com/191674e262f952ca-${index + 1}.pdf`,
    expiration: '2026-10-09T15:32:05.000000Z',
    ...details,
  })),
});

/** Sample of a step that extracted text. */
export const extractedTextSample = {
  job_id: '01M4GQ3GVGZFY170D7TS7J20ZK',
  text: 'Proposal for Contoso\n\nAnnual licence: $24,000',
  pages_total: 2,
  characters_total: 44,
  pages: [
    { page: 1, characters: 20, content: 'Proposal for Contoso' },
    { page: 2, characters: 23, content: 'Annual licence: $24,000' },
  ],
};

/** Sample of a step that searched text. */
export const searchResultSample = {
  job_id: '01M4GQ3GVGZFY170D7TS7J20ZK',
  search_text: 'licence',
  results_total: 1,
  results_pages: 1,
  results: [{ page: 2, matched_line: 'Annual licence: $24,000', exact_word: 'licence' }],
};
