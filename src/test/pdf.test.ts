import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { startTestServer, type TestServer } from './support/server.js';
import { invoke } from './support/zapier.js';

// Stashing needs Zapier's file storage, which only exists on Zapier; locally it is marked instead.
vi.mock('../lib/files.js', () => ({ stashFile: async (z: unknown, url: string) => `stashed:${url}` }));

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

afterAll(async () => {
  await server.close();
});

/**
 * Run an operation the way the Zap editor runs it for a sample: start the job and wait for it.
 */
const runSample = (key: string, inputData: Record<string, unknown>) =>
  invoke(`creates.${key}.operation.perform`, { inputData, meta: { isLoadingSample: true } });

/**
 * Run an operation the way a live Zap runs it: start the job with a callback URL, receive what
 * Apdf posts there, and resume the step with it.
 */
const runLive = async (key: string, inputData: Record<string, unknown>, inbox: string) => {
  const outputData = await invoke(
    `creates.${key}.operation.perform`,
    { inputData },
    { callbackUrl: server.inboxUrl(inbox) },
  );
  const cleanedRequest = await server.nextPost(inbox);

  return invoke(`creates.${key}.operation.performResume`, { inputData, outputData, cleanedRequest });
};

const fileDetails = (details: Record<string, unknown> = {}) =>
  expect.objectContaining({
    file: expect.stringMatching(/^stashed:https?:\/\/.+\.pdf$/),
    file_url: expect.stringMatching(/\.pdf$/),
    expiration: expect.any(String),
    ...details,
  });

const producedFile = (details: Record<string, unknown> = {}) => fileDetails({ job_id: expect.any(String), ...details });

describe('PDF operations in the Zap editor', () => {
  it.each([
    ['createPdfFromHtml', () => ({ html: '<h1>Hello from Zapier</h1>', format: 'a4', margin_top: 10 }), { pages: 1 }],
    ['convertOfficeToPdf', () => ({ file: server.fileUrl('document.docx') }), { pages: 1 }],
    ['mergePdfs', () => ({ files: [server.fileUrl('one-page.pdf'), server.fileUrl('three-pages.pdf')] }), { pages: 4 }],
    ['compressPdf', () => ({ file: server.fileUrl('three-pages.pdf') }), { size_compressed: expect.any(Number) }],
    ['extractPdfPages', () => ({ file: server.fileUrl('three-pages.pdf'), pages: '2-z' }), { pages: 2 }],
    ['deletePdfPages', () => ({ file: server.fileUrl('three-pages.pdf'), pages: '1' }), { pages: 2 }],
    [
      'rotatePdfPages',
      () => ({ file: server.fileUrl('three-pages.pdf'), rotations: [{ angle: '90', pages: '1' }, { angle: '180' }] }),
      {},
    ],
    [
      'overlayPdf',
      () => ({ file: server.fileUrl('three-pages.pdf'), overlay: server.fileUrl('overlay.pdf'), to: '1-2' }),
      {},
    ],
    ['underlayPdf', () => ({ file: server.fileUrl('three-pages.pdf'), underlay: server.fileUrl('underlay.pdf') }), {}],
    ['makePdfSearchable', () => ({ file: server.fileUrl('scanned.pdf') }), { pages: expect.any(Number) }],
    [
      'addPdfPassword',
      () => ({ file: server.fileUrl('three-pages.pdf'), owner_code: 'owner-1', user_code: 'user-1' }),
      {},
    ],
    ['removePdfPassword', () => ({ file: server.fileUrl('password-protected.pdf'), current_code: 'owner-123' }), {}],
  ])('%s produces a file', async (key, inputData, details) => {
    await expect(runSample(key, inputData())).resolves.toEqual(producedFile(details));
  });

  it('ignores optional fields left blank, as Zapier sends them', async () => {
    const result = await runSample('convertPdfToImages', {
      file: server.fileUrl('one-page.pdf'),
      image_type: 'png',
      color_mode: '',
      dpi: '',
      pages: '',
    });

    expect(result.count).toBe(1);
  });

  it('adds only the owner password when the user password is blank', async () => {
    const result = await runSample('addPdfPassword', {
      file: server.fileUrl('three-pages.pdf'),
      owner_code: 'owner-1',
      user_code: '',
    });

    expect(result).toEqual(producedFile());
  });

  it('keeps each page selection with its file when one is left blank', async () => {
    const result = await runSample('mergePdfs', {
      files: [server.fileUrl('three-pages.pdf'), server.fileUrl('three-pages.pdf')],
      pages: ['', '1'],
    });

    expect(result).toEqual(producedFile({ pages: 4 }));
  });

  it('merges only the chosen pages of each file', async () => {
    const result = await runSample('mergePdfs', {
      files: [server.fileUrl('three-pages.pdf'), server.fileUrl('three-pages.pdf'), server.fileUrl('one-page.pdf')],
      pages: ['1', '2-z'],
    });

    expect(result).toEqual(producedFile({ pages: 4 }));
  });

  it('splits a PDF into several files', async () => {
    const result = await runSample('splitPdf', { file: server.fileUrl('three-pages.pdf'), pages: '1,2-3' });

    expect(result).toMatchObject({ count: 2 });
    expect(result.files).toEqual([fileDetails({ pages: 1 }), fileDetails({ pages: 2 })]);
  });

  it('renders pages as images', async () => {
    const result = await runSample('convertPdfToImages', {
      file: server.fileUrl('three-pages.pdf'),
      image_type: 'png',
      dpi: 72,
      pages: '1-2',
    });

    expect(result.count).toBe(2);
    expect(result.files[0]).toMatchObject({ page: 1, file: expect.stringMatching(/^stashed:.+\.png$/) });
  });

  it('extracts the text, also joined into one field', async () => {
    const result = await runSample('extractPdfText', { file: server.fileUrl('three-pages.pdf') });

    expect(result.pages_total).toBe(3);
    expect(result.text).toMatch(/^First Page[\s\S]+Second Page[\s\S]+Page 3\/3/);
  });

  it('searches the text, accepting booleans as Zapier sends them', async () => {
    const result = await runSample('searchPdfText', {
      file: server.fileUrl('three-pages.pdf'),
      text: 'second page',
      case: 'false',
      regex: 'false',
    });

    // Apdf reports the page of a search match as a string.
    expect(result).toMatchObject({ results_total: 1, results: [{ page: '2', exact_word: 'Second Page' }] });
  });

  it('reads the text of a scanned PDF', async () => {
    const result = await runSample('extractPdfTextWithOcr', { file: server.fileUrl('scanned.pdf') });

    expect(result.text).toMatch(/grasshopper/i);
  });

  it('searches the text of a scanned PDF', async () => {
    const result = await runSample('searchPdfTextWithOcr', {
      file: server.fileUrl('scanned.pdf'),
      text: 'grasshopper',
    });

    expect(result.results_total).toBeGreaterThan(0);
  });

  it('reads the metadata', async () => {
    const result = await runSample('getPdfMetadata', { file: server.fileUrl('three-pages.pdf') });

    expect(result).toMatchObject({ job_id: expect.any(String), pages: 3, encrypted: false });
  });

  it('reads the form fields', async () => {
    const result = await runSample('getPdfFormFields', { file: server.fileUrl('form-fields.pdf') });

    expect(result.fields).toContainEqual(expect.objectContaining({ name: 'name', type: 'text', page: 1 }));
    expect(result.fields).toContainEqual(
      expect.objectContaining({ name: 'size', type: 'radio', options: ['S', 'M', 'L'] }),
    );
  });

  it('fills the form fields, keeping those with a blank value', async () => {
    const result = await runSample('fillPdfForm', {
      file: server.fileUrl('form-fields.pdf'),
      fields: [
        { name: 'name', value: 'Ada Lovelace' },
        { name: 'newsletter', value: 'true' },
        { name: 'company', value: '' },
      ],
      flatten: 'false',
    });

    expect(result).toEqual(producedFile({ calculations: { updated: [], unsupported: [] } }));

    const filled = await runSample('getPdfFormFields', { file: result.file_url });
    const values = Object.fromEntries(
      filled.fields.map((field: { name: string; value: unknown }) => [field.name, field.value]),
    );

    expect(values).toMatchObject({ name: 'Ada Lovelace', newsletter: true });
  });

  it('renders the form pages with their fields numbered, and lists the numbers as text', async () => {
    const result = await runSample('visualizePdfForm', { file: server.fileUrl('form-fields.pdf'), dpi: 50, pages: '' });

    expect(result.count).toBe(1);
    expect(result.pages[0]).toMatchObject({ page: 1, file: expect.stringMatching(/^stashed:.+\.png$/) });
    expect(result.pages[0]).not.toHaveProperty('fields');
    expect(result.fields[0]).toEqual({ page: 1, number: 1, name: 'name', type: 'text' });
    expect(result.legend.split('\n')).toHaveLength(result.fields.length);
    expect(result.legend).toMatch(/^1: name \(text\)\n/);
    expect(result.legend).toContain(': size = M (radio)');
  });

  it('reports why a job could not start', async () => {
    await expect(
      runSample('extractPdfPages', { file: server.fileUrl('three-pages.pdf'), pages: 'abc' }),
    ).rejects.toThrow(/pages: The pages field format is invalid/);
  });
});

describe('PDF operations in a live Zap', () => {
  it('waits for the callback and resumes with the result', async () => {
    const result = await runLive(
      'mergePdfs',
      { files: [server.fileUrl('one-page.pdf'), server.fileUrl('three-pages.pdf')] },
      'merge',
    );

    expect(result).toEqual(producedFile({ pages: 4 }));
  });

  it('resumes with several files', async () => {
    const result = await runLive('splitPdf', { file: server.fileUrl('three-pages.pdf'), pages: 'n1' }, 'split');

    expect(result.count).toBe(3);
  });

  it('fails the step when the job fails', async () => {
    await expect(
      runLive('extractPdfPages', { file: server.fileUrl('three-pages.pdf'), pages: '9' }, 'failing'),
    ).rejects.toThrow(/extract operation/);
  });
});

/**
 * The flat fields of a German invoice as a Zap maps them: two lines, one of them under reverse
 * charge, and a shipping charge.
 */
const invoiceInput = (overrides: Record<string, unknown> = {}) => ({
  file: server.fileUrl('invoice.pdf'),
  number: 'RE-2026-0042',
  issue_date: '2026-11-11T00:00:00+01:00',
  due_date: '2026-11-25T00:00:00+01:00',
  currency: 'EUR',
  seller_name: 'Lieferant GmbH',
  seller_vat_number: 'DE123456789',
  seller_street: 'Lieferantenstraße 20',
  seller_postcode: '80333',
  seller_city: 'München',
  seller_country: 'DE',
  buyer_name: 'Kunden AG',
  buyer_vat_number: 'FR12345678901',
  buyer_street: 'Rue de la Paix 1',
  buyer_postcode: '75002',
  buyer_city: 'Paris',
  buyer_country: 'FR',
  iban: 'DE02120300000000202051',
  payment_terms: 'Payable within 14 days',
  lines: [
    { name: 'Consulting', quantity: '8', unit: 'HUR', unit_price: '120', vat_rate: '19' },
    { name: 'Installation', quantity: '1', unit_price: '500', vat_rate: '0', vat_category: 'reverse_charge' },
  ],
  charges: [{ charge_reason: 'Shipping', charge_amount: '4.95', charge_vat_rate: '19' }],
  vat_exemption_reason: 'Reverse charge',
  ...overrides,
});

describe('E-invoices in the Zap editor', () => {
  it('creates an e-invoice, reads its data back and finds it valid', async () => {
    const created = await runSample('createEInvoice', invoiceInput());

    expect(created).toEqual(producedFile({ level: 'EN 16931' }));

    const data = await runSample('getEInvoiceData', { file: created.file_url });

    expect(data).toMatchObject({
      level: 'EN 16931',
      number: 'RE-2026-0042',
      issue_date: '2026-11-11',
      due_date: '2026-11-25',
      seller: { name: 'Lieferant GmbH', vat_id: 'DE123456789' },
      buyer: { name: 'Kunden AG', address: { country: 'FR' } },
      payment: { method: 'credit_transfer', iban: 'DE02120300000000202051', terms: 'Payable within 14 days' },
      charges: [{ amount: 4.95, reason: 'Shipping' }],
      totals: { net_total: 1464.95, vat_total: 183.34, gross_total: 1648.29, amount_due: 1648.29 },
      xml: expect.stringMatching(/^<\?xml/),
    });
    expect(data.vat_breakdown).toContainEqual(
      expect.objectContaining({ category: 'reverse_charge', exemption_reason: 'Reverse charge' }),
    );

    await expect(runSample('validateEInvoice', { file: created.file_url })).resolves.toMatchObject({
      valid: true,
      level: 'EN 16931',
      errors: [],
      error_summary: '',
    });
  });

  it('ignores optional fields left blank, as Zapier sends them', async () => {
    const created = await runSample(
      'createEInvoice',
      invoiceInput({
        level: '',
        type: '',
        due_date: '',
        seller_electronic_address: '',
        seller_contact_name: '',
        bic: '',
        discounts: [],
      }),
    );

    expect(created).toEqual(producedFile({ level: 'EN 16931' }));
  });

  it('lists every rule an invalid e-invoice breaks, also as one text', async () => {
    const result = await runSample('validateEInvoice', { file: server.fileUrl('einvoice-invalid.pdf') });

    expect(result).toMatchObject({
      valid: false,
      level: 'EN 16931',
      errors: [{ source: 'xml', rule: 'BR-CO-16' }],
      error_summary: expect.stringMatching(/^Amount due for payment/),
    });
  });

  it('fails the step with the rules the invoice breaks', async () => {
    await expect(runSample('createEInvoice', invoiceInput({ level: 'XRECHNUNG' }))).rejects.toThrow(
      /The e-invoice is not valid\. einvoice: .*Buyer reference/,
    );
  });
});

describe('E-invoices in a live Zap', () => {
  it('waits for the callback and resumes with the e-invoice', async () => {
    await expect(runLive('createEInvoice', invoiceInput(), 'einvoice')).resolves.toEqual(
      producedFile({ level: 'EN 16931' }),
    );
  });
});
