import { defineCreate, type Bundle, type ZObject } from 'zapier-platform-core';

import { documentField, documentPath } from '../fields/records.js';
import { fetchData } from '../lib/api.js';
import { signatureRequestOutputFields, signatureRequestSample } from '../lib/outputs.js';
import type { SignatureRequest } from '../lib/types.js';

/** A signer, as the line items of the signers input arrive. */
interface SignerItem {
  role?: unknown;
  name?: unknown;
  email?: unknown;
  member?: unknown;
  company?: unknown;
}

/** A field to place, as the line items of the fields input arrive. */
interface FieldItem {
  field_role?: unknown;
  field_type?: unknown;
  anchor?: unknown;
  pdf_field?: unknown;
  page?: unknown;
  x?: unknown;
  y?: unknown;
}

/**
 * Whether a line item value is set to true. Booleans in line items may arrive as text.
 */
const isTrue = (value: unknown): boolean => value === true || value === 'true';

/**
 * A number for the API, or nothing when the line item left it blank.
 */
const numberOrBlank = (value: unknown): number | undefined =>
  value === undefined || value === null || value === '' ? undefined : Number(value);

/**
 * The signers as the API expects them: the company approves, a member signs by their email, and
 * anyone else is a recipient with a name and an email.
 */
const signersBody = (signers: unknown) =>
  ([] as SignerItem[])
    .concat((signers as SignerItem[] | undefined) ?? [])
    .map(({ role, name, email, member, company }) => {
      if (isTrue(company)) {
        return { role, company: true };
      }

      return member ? { role, member } : { role, name, email };
    });

/**
 * The fields to place, each at an anchor text, on a signature box of the PDF or at coordinates.
 * Line items without a role or type are left out.
 */
const fieldsBody = (fields: unknown) =>
  ([] as FieldItem[])
    .concat((fields as FieldItem[] | undefined) ?? [])
    .filter(({ field_role, field_type }) => field_role && field_type)
    .map(({ field_role, field_type, anchor, pdf_field, page, x, y }) => ({
      role: field_role,
      type: field_type,
      anchor,
      pdf_field,
      page: numberOrBlank(page),
      x: numberOrBlank(x),
      y: numberOrBlank(y),
    }));

export const requestSignatures = defineCreate({
  key: 'requestSignatures',
  noun: 'signature request',
  display: {
    label: 'Request Signatures',
    description:
      'Sends a document for e-signature. Each signer signs their own part, and once everyone has signed, you get the signed PDF with its audit trail.',
  },
  operation: {
    inputFields: [
      documentField(),
      {
        key: 'signers',
        label: 'Signers',
        required: true,
        children: [
          {
            key: 'role',
            label: 'Role',
            required: true,
            helpText: 'The part of the document the signer signs, like `Client`. Each signer has their own role.',
          },
          {
            key: 'name',
            label: 'Name',
            helpText:
              'The name of a recipient, who signs in their tracking link and confirms with a code sent to their email.',
          },
          { key: 'email', label: 'Email', helpText: 'The email address of the recipient.' },
          {
            key: 'member',
            label: 'Workspace member email',
            helpText:
              'Instead of a name and email: a member of your workspace, who signs their own part after logging in. They get an email asking them to sign.',
          },
          {
            key: 'company',
            label: 'Company approval',
            type: 'boolean',
            helpText:
              'Whether your company approves this part automatically once everyone else has signed. Needs the company name in your account settings.',
          },
        ],
      },
      {
        key: 'fields',
        label: 'Fields',
        children: [
          {
            key: 'field_role',
            label: 'Field role',
            helpText:
              'The role of the signer who fills the field. Leave the fields empty to use the ones placed in the dashboard, or, with a single signer, the empty signature boxes of the PDF.',
          },
          {
            key: 'field_type',
            label: 'Field type',
            choices: { signature: 'Signature', initials: 'Initials', name: 'Name', text: 'Text', date: 'Date' },
            helpText: 'Date fields are filled in with the signing date.',
          },
          {
            key: 'anchor',
            label: 'Anchor text',
            helpText:
              'A text in the PDF, like `[client_signature]`. The field is placed at every place the text appears.',
          },
          { key: 'pdf_field', label: 'PDF signature box', helpText: 'The name of an empty signature box in the PDF.' },
          { key: 'page', label: 'Page', type: 'integer', helpText: 'Placing by coordinates instead: the page number.' },
          { key: 'x', label: 'X (points)', type: 'number', helpText: 'Distance from the left edge of the page.' },
          { key: 'y', label: 'Y (points)', type: 'number', helpText: 'Distance from the top edge of the page.' },
        ],
      },
      {
        key: 'message',
        label: 'Message',
        type: 'text',
        helpText: 'A personal message for the signers in the invitation email.',
      },
      {
        key: 'send_email',
        label: 'Email the recipients',
        type: 'boolean',
        default: 'true',
        helpText:
          'Whether to email the recipients their signing link. Turn it off to share the links from a later step. Workspace members are always emailed.',
      },
      {
        key: 'metadata',
        label: 'Metadata',
        dict: true,
        helpText:
          'Your own keys and values, like a deal ID. They come back with the request and in the signature triggers.',
      },
    ],
    perform: (z: ZObject, bundle: Bundle) =>
      fetchData<SignatureRequest>(z, 'POST', documentPath(bundle, '/signature-request'), {
        body: {
          signers: signersBody(bundle.inputData.signers),
          fields: fieldsBody(bundle.inputData.fields),
          message: bundle.inputData.message,
          send_email: isTrue(bundle.inputData.send_email),
          metadata: bundle.inputData.metadata,
        },
      }),
    sample: signatureRequestSample,
    outputFields: signatureRequestOutputFields,
  },
});

export const cancelSignatureRequest = defineCreate({
  key: 'cancelSignatureRequest',
  noun: 'signature request',
  display: {
    label: 'Cancel Signature Request',
    description: 'Cancels the pending signature request of a document, so nobody can sign it anymore.',
  },
  operation: {
    inputFields: [documentField()],
    perform: (z: ZObject, bundle: Bundle) =>
      fetchData<SignatureRequest>(z, 'POST', documentPath(bundle, '/signature-request/cancel')),
    sample: { ...signatureRequestSample, status: 'cancelled', cancelled_at: '2026-10-28T10:15:31.000000Z' },
    outputFields: signatureRequestOutputFields,
  },
});
