import { definePdfOperation } from './operation.js';
import { layerFields, PAGE_SYNTAX, pagesField, pdfFileField } from './fields.js';
import { pageCountOutputFields, producedFile, producedFileOutputFields } from './results.js';
import { producedFileSample } from './samples.js';

export const extractPdfPages = definePdfOperation({
  key: 'extractPdfPages',
  label: 'Extract PDF Pages',
  description: 'Creates a new PDF from selected pages.',
  path: '/pdf/page/extract',
  inputFields: [pdfFileField(), pagesField('The pages to keep.')],
  result: producedFile,
  sample: producedFileSample({ pages: 3, size: 210554 }),
  outputFields: [...producedFileOutputFields, ...pageCountOutputFields],
});

export const deletePdfPages = definePdfOperation({
  key: 'deletePdfPages',
  label: 'Delete PDF Pages',
  description: 'Creates a copy of a PDF without the selected pages.',
  path: '/pdf/page/delete',
  inputFields: [pdfFileField(), pagesField('The pages to remove.')],
  result: producedFile,
  sample: producedFileSample({ pages: 9, size: 512200 }),
  outputFields: [...producedFileOutputFields, ...pageCountOutputFields],
});

export const rotatePdfPages = definePdfOperation({
  key: 'rotatePdfPages',
  label: 'Rotate PDF Pages',
  description: 'Turns pages of a PDF by 90, 180 or 270 degrees.',
  path: '/pdf/page/rotate',
  inputFields: [
    pdfFileField(),
    {
      key: 'rotations',
      label: 'Rotations',
      required: true,
      children: [
        {
          key: 'angle',
          label: 'Angle',
          required: true,
          choices: { '90': '90° clockwise', '180': '180°', '270': '270° clockwise', '0': '0° (reset)' },
        },
        {
          key: 'pages',
          label: 'Pages',
          helpText: `Which pages to turn. Leave empty for every page. ${PAGE_SYNTAX}`,
        },
      ],
    },
  ],
  result: producedFile,
  sample: producedFileSample(),
  outputFields: producedFileOutputFields,
});

export const overlayPdf = definePdfOperation({
  key: 'overlayPdf',
  label: 'Overlay PDF',
  description: 'Stamps another PDF on top of the pages, such as a watermark or a signature block.',
  path: '/pdf/page/overlay',
  inputFields: layerFields('overlay'),
  result: producedFile,
  sample: producedFileSample(),
  outputFields: producedFileOutputFields,
});

export const underlayPdf = definePdfOperation({
  key: 'underlayPdf',
  label: 'Underlay PDF',
  description: 'Places another PDF behind the pages, such as letterhead or a background.',
  path: '/pdf/page/underlay',
  inputFields: layerFields('underlay'),
  result: producedFile,
  sample: producedFileSample(),
  outputFields: producedFileOutputFields,
});
