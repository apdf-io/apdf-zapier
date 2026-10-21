import { defineCreate, type Bundle, type ZObject } from 'zapier-platform-core';

import { annotationField, documentField, documentPath } from '../fields/records.js';
import { fetchData } from '../lib/api.js';
import { annotationOutputFields, annotationSample } from '../lib/outputs.js';
import type { Annotation } from '../lib/types.js';

export const addAnnotationComment = defineCreate({
  key: 'addAnnotationComment',
  noun: 'comment',
  display: {
    label: 'Add Comment to Annotation',
    description:
      'Adds a comment to an annotation, shown to readers in the document. It opens the thread when the annotation has no comment yet, otherwise it is added as a reply.',
  },
  operation: {
    inputFields: [
      documentField(),
      annotationField(),
      {
        key: 'author',
        label: 'Author name',
        required: true,
        helpText: 'Shown as the comment author in the document.',
      },
      {
        key: 'text',
        label: 'Comment',
        type: 'text',
        required: true,
        helpText: "Readers see it in the annotation's thread. It doesn't start reader event triggers.",
      },
    ],
    perform: (z: ZObject, bundle: Bundle) =>
      fetchData<Annotation>(
        z,
        'POST',
        documentPath(bundle, `/annotations/${encodeURIComponent(String(bundle.inputData.annotation_id))}/comments`),
        { body: { author: bundle.inputData.author, text: bundle.inputData.text } },
      ),
    sample: annotationSample,
    outputFields: annotationOutputFields,
  },
});
