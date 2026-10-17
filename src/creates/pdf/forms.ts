import { definePdfOperation } from './operation.js';
import { pagesField, pdfFileField } from './fields.js';
import {
  asIs,
  formFieldsOutputFields,
  formPages,
  formPagesOutputFields,
  producedFile,
  producedFileOutputFields,
} from './results.js';
import { formFieldsSample, formPagesSample, producedFileSample } from './samples.js';

/** A form field to fill, as the line items of the fields input arrive. */
interface FieldToFill {
  name?: unknown;
  value?: unknown;
}

/**
 * The fields to fill that have a name and a value. Blank values are left out, so a field mapped
 * from an empty step output keeps the value it has.
 */
const fieldsToFill = (fields: unknown): FieldToFill[] =>
  ([] as FieldToFill[])
    .concat((fields as FieldToFill[] | undefined) ?? [])
    .filter(({ name, value }) => name !== undefined && name !== '' && value !== undefined && value !== '');

export const getPdfFormFields = definePdfOperation({
  key: 'getPdfFormFields',
  label: 'Get PDF Form Fields',
  description: 'Reads the form fields of a PDF with their names, types, values, options and labels.',
  path: '/pdf/form/read',
  inputFields: [pdfFileField()],
  result: asIs,
  sample: formFieldsSample,
  outputFields: formFieldsOutputFields,
});

export const fillPdfForm = definePdfOperation({
  key: 'fillPdfForm',
  label: 'Fill PDF Form',
  description: 'Fills the form fields of a PDF by name and creates the filled PDF.',
  path: '/pdf/form/fill',
  inputFields: [
    pdfFileField(),
    {
      key: 'fields',
      label: 'Fields',
      required: true,
      children: [
        {
          key: 'name',
          label: 'Field name',
          required: true,
          helpText: 'The name of the form field, as Get PDF Form Fields returns it.',
        },
        {
          key: 'value',
          label: 'Value',
          helpText:
            'Text for a text field, `true` or `false` for a checkbox, or the option to select for radio buttons, dropdowns and list boxes. Fields with a blank value keep their value.',
        },
      ],
    },
    {
      key: 'flatten',
      label: 'Flatten',
      type: 'boolean',
      default: 'false',
      helpText: 'Whether to merge the filled fields into the pages, so they can no longer be changed.',
    },
  ],
  body: ({ fields, ...rest }) => ({ ...rest, fields: fieldsToFill(fields) }),
  result: producedFile,
  sample: producedFileSample({ calculations: { updated: ['total'], unsupported: [] } }),
  outputFields: [
    ...producedFileOutputFields,
    { key: 'calculations__updated', label: 'Recalculated Fields', list: true },
    { key: 'calculations__unsupported', label: 'Calculated Fields Not Updated', list: true },
  ],
});

export const visualizePdfForm = definePdfOperation({
  key: 'visualizePdfForm',
  label: 'Visualize PDF Form',
  description:
    'Renders the form pages of a PDF as images with a numbered box on every field, so an AI step can see which field is which.',
  path: '/pdf/form/visualize',
  inputFields: [
    pdfFileField(),
    pagesField('Which pages to render. Leave empty for every page with a field to fill.', { required: false }),
    { key: 'dpi', label: 'Resolution (DPI)', type: 'integer', helpText: 'Between 50 and 200. Defaults to 100.' },
  ],
  result: formPages,
  sample: formPagesSample,
  outputFields: formPagesOutputFields,
});
