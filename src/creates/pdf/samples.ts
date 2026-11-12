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

/** Sample of a step that read the data of an e-invoice. */
export const eInvoiceDataSample = {
  job_id: '01M4GQ3GVGZFY170D7TS7J20ZK',
  level: 'EN 16931',
  number: 'RE-2026-0042',
  type: 'invoice',
  issue_date: '2026-11-11',
  due_date: '2026-11-25',
  currency: 'EUR',
  buyer_reference: null,
  order_reference: null,
  seller: {
    name: 'Acme GmbH',
    vat_id: 'DE123456789',
    address: { line1: 'Hauptstraße 1', line2: null, city: 'Berlin', postcode: '10115', country: 'DE' },
  },
  buyer: {
    name: 'Contoso AG',
    vat_id: null,
    address: { line1: 'Am Markt 5', line2: null, city: 'Hamburg', postcode: '20095', country: 'DE' },
  },
  payment: { method: 'credit_transfer', iban: 'DE02120300000000202051', terms: 'Payable within 14 days' },
  lines: [
    {
      name: 'Consulting',
      quantity: 8,
      unit: 'HUR',
      unit_price: 120,
      vat_category: 'standard',
      vat_rate: 19,
      amount: 960,
    },
  ],
  vat_breakdown: [{ category: 'standard', rate: 19, net_amount: 960, vat_amount: 182.4, exemption_reason: null }],
  totals: {
    line_total: 960,
    discount_total: 0,
    charge_total: 0,
    net_total: 960,
    vat_total: 182.4,
    gross_total: 1142.4,
    paid_amount: 0,
    amount_due: 1142.4,
  },
  xml: '<?xml version="1.0" encoding="UTF-8"?>\n<rsm:CrossIndustryInvoice ...>...</rsm:CrossIndustryInvoice>',
};

/** Sample of a step that validated an e-invoice. */
export const eInvoiceValidationSample = {
  job_id: '01M4GQ3GVGZFY170D7TS7J20ZK',
  valid: false,
  level: 'EN 16931',
  errors: [
    {
      source: 'xml',
      rule: 'BR-CO-16',
      message:
        'Amount due for payment (BT-115) = Invoice total amount with VAT (BT-112) -Paid amount (BT-113) +Rounding amount (BT-114).',
    },
  ],
  warnings: [],
  error_summary:
    'Amount due for payment (BT-115) = Invoice total amount with VAT (BT-112) -Paid amount (BT-113) +Rounding amount (BT-114).',
};
