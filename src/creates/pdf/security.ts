import { definePdfOperation } from './operation.js';
import { pdfFileField } from './fields.js';
import { producedFile, producedFileOutputFields } from './results.js';
import { producedFileSample } from './samples.js';

/*
 * Zapier reserves field keys that name passwords for account credentials (check D001), so the
 * PDF passwords below use neutral keys and are renamed to Apdf's parameters in the request.
 */

export const addPdfPassword = definePdfOperation({
  key: 'addPdfPassword',
  label: 'Add PDF Password',
  description: 'Password-protects a PDF.',
  path: '/pdf/security/add',
  inputFields: [
    pdfFileField(),
    {
      key: 'owner_code',
      label: 'Owner password',
      type: 'password',
      required: true,
      helpText: 'Grants full control over the PDF, including changing its permissions.',
    },
    {
      key: 'user_code',
      label: 'User password',
      type: 'password',
      helpText: 'Needed to open the PDF. Leave empty to let anyone open it.',
    },
  ],
  body: ({ owner_code, user_code, ...rest }) => ({ ...rest, owner_password: owner_code, user_password: user_code }),
  result: producedFile,
  sample: producedFileSample(),
  outputFields: producedFileOutputFields,
});

export const removePdfPassword = definePdfOperation({
  key: 'removePdfPassword',
  label: 'Remove PDF Password',
  description: 'Creates an unprotected copy of a password-protected PDF.',
  path: '/pdf/security/remove',
  inputFields: [
    pdfFileField(),
    {
      key: 'current_code',
      label: 'Password',
      type: 'password',
      helpText: 'The password that currently opens the PDF.',
    },
  ],
  body: ({ current_code, ...rest }) => ({ ...rest, password: current_code }),
  result: producedFile,
  sample: producedFileSample(),
  outputFields: producedFileOutputFields,
});
