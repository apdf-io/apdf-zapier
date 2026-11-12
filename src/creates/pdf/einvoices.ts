import type { PlainInputField, PlainOutputField } from 'zapier-platform-core';

import { definePdfOperation } from './operation.js';
import { pdfFileField } from './fields.js';
import { producedFile, producedFileOutputFields, type ResultShaper } from './results.js';
import { eInvoiceDataSample, eInvoiceValidationSample, producedFileSample } from './samples.js';

/** The profiles an e-invoice can be created in. */
const LEVELS = { BASIC: 'Basic', 'EN 16931': 'EN 16931', EXTENDED: 'Extended', XRECHNUNG: 'XRechnung' };

const INVOICE_TYPES = {
  invoice: 'Invoice',
  credit_note: 'Credit note',
  corrected_invoice: 'Corrected invoice',
  prepayment_invoice: 'Prepayment invoice',
  partial_invoice: 'Partial invoice',
  self_billed_invoice: 'Self-billed invoice',
};

const PAYMENT_METHODS = {
  credit_transfer: 'Bank transfer',
  direct_debit: 'Direct debit',
  card: 'Card',
  online: 'Online payment',
};

const VAT_CATEGORIES = {
  standard: 'Standard rate',
  zero_rated: 'Zero rated',
  exempt: 'Exempt',
  reverse_charge: 'Reverse charge',
  intra_community: 'Intra-community supply',
  export: 'Export outside the EU',
  outside_scope: 'Outside the scope of VAT',
};

/** The VAT categories without VAT, which each need an exemption reason. */
const EXEMPT_CATEGORIES = ['exempt', 'reverse_charge', 'intra_community', 'export', 'outside_scope'];

/**
 * A date field; Zapier hands it over as a full timestamp, of which the date is used.
 */
const dateField = (key: string, label: string, overrides: Partial<PlainInputField> = {}): PlainInputField => ({
  key,
  label,
  type: 'datetime',
  ...overrides,
});

/**
 * The postal address fields of a party, in the given group.
 */
const addressFields = (party: 'seller' | 'buyer'): PlainInputField[] => [
  { key: `${party}_street`, label: 'Street', group: party },
  { key: `${party}_postcode`, label: 'Postcode', group: party },
  { key: `${party}_city`, label: 'City', group: party },
  {
    key: `${party}_country`,
    label: 'Country',
    required: true,
    default: 'DE',
    group: party,
    helpText: 'The two-letter country code, such as `DE` or `FR`.',
  },
];

/**
 * The name, VAT ID, address and electronic address of a party, in the group named after it.
 */
const partyFields = (party: 'seller' | 'buyer', label: string): PlainInputField[] => [
  { key: `${party}_name`, label: `${label} name`, required: true, group: party },
  { key: `${party}_vat_number`, label: 'VAT ID', group: party },
  ...addressFields(party),
  {
    key: `${party}_electronic_address`,
    label: 'Electronic address',
    group: party,
    helpText: 'Where e-invoices reach the party, usually an email address. Required for XRechnung.',
  },
];

/**
 * Discounts or charges on the whole invoice, as line items.
 */
const adjustmentField = (kind: 'discount' | 'charge', example: string): PlainInputField => ({
  key: `${kind}s`,
  label: `${kind === 'discount' ? 'Discounts' : 'Charges'} on the invoice`,
  children: [
    { key: `${kind}_reason`, label: `${kind === 'discount' ? 'Discount' : 'Charge'} reason`, helpText: example },
    { key: `${kind}_amount`, label: 'Net amount', type: 'number' },
    {
      key: `${kind}_percent`,
      label: 'Percent',
      type: 'number',
      helpText: 'Instead of an amount: a percent of the lines with the same VAT rate.',
    },
    { key: `${kind}_vat_rate`, label: 'VAT rate', type: 'number' },
  ],
});

/**
 * The discounts or charges of the step, from its prefixed line item keys back to the fields the API takes.
 */
const adjustments = (items: unknown, kind: 'discount' | 'charge') =>
  ((items as Record<string, unknown>[] | undefined) ?? []).map((item) => ({
    reason: item[`${kind}_reason`],
    amount: item[`${kind}_amount`],
    percent: item[`${kind}_percent`],
    vat_rate: item[`${kind}_vat_rate`],
  }));

/** The first part of a Zapier timestamp, the date as YYYY-MM-DD. */
const dateOf = (value: unknown): string | undefined => (value ? String(value).slice(0, 10) : undefined);

/**
 * A party with its address and electronic address, from the flat fields of the step.
 */
const party = (input: Record<string, unknown>, name: 'seller' | 'buyer') => ({
  name: input[`${name}_name`],
  vat_id: input[`${name}_vat_number`],
  electronic_address: input[`${name}_electronic_address`] ? { id: input[`${name}_electronic_address`] } : undefined,
  address: {
    line1: input[`${name}_street`],
    postcode: input[`${name}_postcode`],
    city: input[`${name}_city`],
    country: input[`${name}_country`],
  },
});

/**
 * The exemption reason for every VAT category without VAT the invoice uses.
 */
const exemptionReasons = (reason: unknown, lines: Record<string, unknown>[]) =>
  reason
    ? Object.fromEntries(
        lines
          .map((line) => String(line.vat_category ?? ''))
          .filter((category) => EXEMPT_CATEGORIES.includes(category))
          .map((category) => [category, reason]),
      )
    : undefined;

/**
 * The request body: the flat fields of the step regrouped into the invoice the API takes.
 */
const eInvoiceBody = (input: Record<string, unknown>): Record<string, unknown> => {
  const lines = (input.lines as Record<string, unknown>[] | undefined) ?? [];

  return {
    file: input.file,
    level: input.level,
    invoice: {
      number: input.number,
      type: input.type,
      issue_date: dateOf(input.issue_date),
      due_date: dateOf(input.due_date),
      currency: input.currency,
      buyer_reference: input.buyer_reference,
      order_reference: input.order_reference,
      preceding_invoices: input.preceding_invoice_number
        ? [{ number: input.preceding_invoice_number, issue_date: dateOf(input.preceding_invoice_date) }]
        : undefined,
      seller: {
        ...party(input, 'seller'),
        tax_number: input.seller_tax_number,
        registration_number: input.seller_registration_number,
        contact: {
          name: input.seller_contact_name,
          phone: input.seller_contact_phone,
          email: input.seller_contact_email,
        },
      },
      buyer: party(input, 'buyer'),
      payment: {
        method: input.payment_method,
        iban: input.iban,
        bic: input.bic,
        account_name: input.account_name,
        debtor_iban: input.debtor_iban,
        creditor_id: input.creditor_identifier,
        mandate_reference: input.mandate_reference,
        reference: input.payment_reference,
        terms: input.payment_terms,
      },
      lines,
      discounts: adjustments(input.discounts, 'discount'),
      charges: adjustments(input.charges, 'charge'),
      vat_exemption_reasons: exemptionReasons(input.vat_exemption_reason, lines),
      paid_amount: input.paid_amount,
    },
  };
};

/**
 * The read invoice data at the top of the step's output, next to its level and XML.
 */
const eInvoiceData: ResultShaper = (z, { level, invoice, xml }) => ({ level, ...invoice, xml });

/**
 * The validation result, with every error message also joined into one text for emails and messages.
 */
const eInvoiceValidation: ResultShaper = (z, result: { errors: { message: string }[] }) => ({
  ...result,
  error_summary: result.errors.map((error) => error.message).join('\n'),
});

export const createEInvoice = definePdfOperation({
  key: 'createEInvoice',
  label: 'Create E-Invoice',
  description:
    'Turns a PDF invoice into a ZUGFeRD / Factur-X e-invoice by embedding the invoice data as XML, with the totals calculated.',
  path: '/pdf/einvoice/create',
  inputFields: [
    pdfFileField({
      label: 'PDF invoice',
      helpText: 'The invoice as people read it. Map a PDF from an earlier step, or enter a public URL.',
    }),
    {
      key: 'level',
      label: 'Profile',
      choices: LEVELS,
      default: 'EN 16931',
      helpText: 'XRechnung is the profile German public authorities expect.',
    },
    { key: 'number', label: 'Invoice number', required: true },
    { key: 'type', label: 'Document type', choices: INVOICE_TYPES, default: 'invoice' },
    dateField('issue_date', 'Issue date', { required: true }),
    dateField('due_date', 'Due date'),
    {
      key: 'currency',
      label: 'Currency',
      required: true,
      default: 'EUR',
      helpText: 'The three-letter currency code, such as `EUR`.',
    },
    {
      key: 'lines',
      label: 'Invoice lines',
      required: true,
      children: [
        { key: 'name', label: 'Item name', required: true },
        { key: 'description', label: 'Description' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true },
        {
          key: 'unit',
          label: 'Unit code',
          helpText: '`H87` (piece) when left empty, `HUR` for hours, `KGM` for kilograms.',
        },
        { key: 'unit_price', label: 'Net unit price', type: 'number', required: true },
        {
          key: 'vat_rate',
          label: 'VAT rate',
          type: 'number',
          helpText: 'In percent, such as `19`. Leave empty only outside the scope of VAT.',
        },
        {
          key: 'vat_category',
          label: 'VAT category',
          choices: VAT_CATEGORIES,
          helpText: 'Standard rate when left empty.',
        },
      ],
    },
    ...partyFields('seller', 'Seller'),
    { key: 'seller_tax_number', label: 'Tax number', group: 'seller' },
    {
      key: 'seller_registration_number',
      label: 'Registration number',
      group: 'seller',
      helpText: 'Such as the commercial register entry.',
    },
    {
      key: 'seller_contact_name',
      label: 'Contact name',
      group: 'seller',
      helpText: 'Required for XRechnung, like the phone and email.',
    },
    { key: 'seller_contact_phone', label: 'Contact phone', group: 'seller' },
    { key: 'seller_contact_email', label: 'Contact email', group: 'seller' },
    ...partyFields('buyer', 'Buyer'),
    {
      key: 'buyer_reference',
      label: 'Buyer reference',
      group: 'buyer',
      helpText: 'The Leitweg-ID for German public authorities. Required for XRechnung.',
    },
    {
      key: 'order_reference',
      label: 'Order number',
      group: 'buyer',
      helpText: 'The purchase order number of the buyer.',
    },
    {
      key: 'payment_method',
      label: 'Payment method',
      choices: PAYMENT_METHODS,
      group: 'payment',
      helpText: 'Bank transfer when an IBAN is given.',
    },
    { key: 'iban', label: 'IBAN', group: 'payment', helpText: 'The account to transfer to.' },
    { key: 'bic', label: 'BIC', group: 'payment' },
    { key: 'account_name', label: 'Account holder', group: 'payment' },
    {
      key: 'debtor_iban',
      label: 'Debited IBAN',
      group: 'payment',
      helpText: 'For a direct debit, with the creditor ID and mandate reference.',
    },
    { key: 'creditor_identifier', label: 'Creditor ID', group: 'payment' },
    { key: 'mandate_reference', label: 'Mandate reference', group: 'payment' },
    { key: 'payment_reference', label: 'Payment reference', group: 'payment' },
    { key: 'payment_terms', label: 'Payment terms', group: 'payment', helpText: 'Such as `Payable within 14 days`.' },
    { key: 'paid_amount', label: 'Amount already paid', type: 'number', group: 'payment' },
    adjustmentField('discount', 'Discounts on the whole invoice, such as an early payment discount.'),
    adjustmentField('charge', 'Charges on the whole invoice, such as shipping.'),
    {
      key: 'vat_exemption_reason',
      label: 'VAT exemption reason',
      helpText: 'Required when a line has no VAT, such as `Reverse charge`.',
    },
    {
      key: 'preceding_invoice_number',
      label: 'Original invoice number',
      helpText: 'For a credit note or corrected invoice.',
    },
    dateField('preceding_invoice_date', 'Original invoice date'),
  ],
  inputFieldGroups: [
    { key: 'seller', label: 'Seller' },
    { key: 'buyer', label: 'Buyer' },
    { key: 'payment', label: 'Payment' },
  ],
  body: eInvoiceBody,
  result: producedFile,
  sample: producedFileSample({ level: 'EN 16931' }),
  outputFields: [...producedFileOutputFields, { key: 'level', label: 'Profile' }],
});

export const getEInvoiceData = definePdfOperation({
  key: 'getEInvoiceData',
  label: 'Get E-Invoice Data',
  description:
    'Reads the invoice data and XML of a ZUGFeRD, Factur-X or XRechnung PDF, such as an invoice you received.',
  path: '/pdf/einvoice/read',
  inputFields: [pdfFileField({ label: 'E-invoice PDF' })],
  result: eInvoiceData,
  sample: eInvoiceDataSample,
  outputFields: [
    { key: 'job_id', label: 'Job ID' },
    { key: 'level', label: 'Profile' },
    { key: 'number', label: 'Invoice Number' },
    { key: 'type', label: 'Document Type' },
    { key: 'issue_date', label: 'Issue Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'currency', label: 'Currency' },
    { key: 'seller__name', label: 'Seller Name' },
    { key: 'seller__vat_id', label: 'Seller VAT ID' },
    { key: 'buyer__name', label: 'Buyer Name' },
    { key: 'buyer__vat_id', label: 'Buyer VAT ID' },
    { key: 'payment__iban', label: 'IBAN' },
    { key: 'lines[]name', label: 'Line Item Name' },
    { key: 'lines[]quantity', label: 'Line Quantity', type: 'number' },
    { key: 'lines[]unit_price', label: 'Line Net Unit Price', type: 'number' },
    { key: 'lines[]vat_rate', label: 'Line VAT Rate', type: 'number' },
    { key: 'lines[]amount', label: 'Line Net Amount', type: 'number' },
    { key: 'totals__net_total', label: 'Net Total', type: 'number' },
    { key: 'totals__vat_total', label: 'VAT Total', type: 'number' },
    { key: 'totals__gross_total', label: 'Gross Total', type: 'number' },
    { key: 'totals__amount_due', label: 'Amount Due', type: 'number' },
    { key: 'xml', label: 'Invoice XML' },
  ] satisfies PlainOutputField[],
});

export const validateEInvoice = definePdfOperation({
  key: 'validateEInvoice',
  label: 'Validate E-Invoice',
  description: 'Checks a ZUGFeRD, Factur-X or XRechnung PDF against the e-invoice rules and lists every violation.',
  path: '/pdf/einvoice/validate',
  inputFields: [pdfFileField({ label: 'E-invoice PDF' })],
  result: eInvoiceValidation,
  sample: eInvoiceValidationSample,
  outputFields: [
    { key: 'job_id', label: 'Job ID' },
    { key: 'valid', label: 'Valid', type: 'boolean' },
    { key: 'level', label: 'Profile' },
    { key: 'error_summary', label: 'Errors as Text' },
    { key: 'errors[]source', label: 'Error Source' },
    { key: 'errors[]rule', label: 'Error Rule' },
    { key: 'errors[]message', label: 'Error Message' },
    { key: 'warnings[]rule', label: 'Warning Rule' },
    { key: 'warnings[]message', label: 'Warning Message' },
  ],
});
