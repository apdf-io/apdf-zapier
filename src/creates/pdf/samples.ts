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

/** Sample of a step that read the fields of a form. */
export const formFieldsSample = {
  job_id: '01M4GQ3GVGZFY170D7TS7J20ZK',
  fields: [
    {
      name: 'full_name',
      type: 'text',
      label: 'Full name of the applicant',
      value: '',
      page: 1,
      required: true,
      read_only: false,
    },
    {
      name: 'contact',
      type: 'radio',
      label: 'Preferred way of contact',
      value: null,
      page: 1,
      required: false,
      read_only: false,
      options: ['Email', 'Phone'],
    },
    {
      name: 'newsletter',
      type: 'checkbox',
      label: null,
      value: false,
      page: 1,
      required: false,
      read_only: false,
      options: ['Yes'],
    },
  ],
  pages: [{ page: 1, width: 612, height: 792, has_text: true }],
};

/** Sample of a step that rendered form pages with their fields marked. */
export const formPagesSample = {
  job_id: '01M4GQ3GVGZFY170D7TS7J20ZK',
  count: 1,
  pages: [
    {
      page: 1,
      file: 'https://zapier-files.example.com/stash/191674e262f952ca-1.png',
      file_url: 'https://apdf-files.s3.eu-central-1.amazonaws.com/191674e262f952ca-1.png',
      expiration: '2026-10-09T15:32:05.000000Z',
    },
  ],
  fields: [
    { page: 1, number: 1, name: 'full_name', type: 'text' },
    { page: 1, number: 2, name: 'contact', type: 'radio', option: 'Email' },
    { page: 1, number: 3, name: 'contact', type: 'radio', option: 'Phone' },
    { page: 1, number: 4, name: 'newsletter', type: 'checkbox', option: 'Yes' },
  ],
  legend: '1: full_name (text)\n2: contact = Email (radio)\n3: contact = Phone (radio)\n4: newsletter = Yes (checkbox)',
};
