import {
  defineCreate,
  type Bundle,
  type InputFieldGroup,
  type PlainInputField,
  type PlainOutputField,
  type ZObject,
} from 'zapier-platform-core';

import { jobResult, startJob, waitForJob } from '../../lib/jobs.js';
import type { ApiJob } from '../../lib/types.js';
import type { ResultShaper } from './results.js';

/** Everything that tells one PDF operation apart from another. */
export interface PdfOperation {
  key: string;
  label: string;
  description: string;
  /** The API path, such as "/pdf/file/merge". */
  path: string;
  /** Input fields, keyed by the API parameter they fill. */
  inputFields: PlainInputField[];
  inputFieldGroups?: InputFieldGroup[];
  /** Reshape the input into the request body when it is not a one-to-one copy. */
  body?: (inputData: Record<string, unknown>) => Record<string, unknown>;
  /** Turn the finished job's result into the step's output. */
  result: ResultShaper;
  sample: Record<string, unknown>;
  outputFields: PlainOutputField[];
}

/**
 * Zapier may hand booleans over as the strings "true" and "false", which Laravel's boolean rule
 * rejects, so they are converted before the request.
 */
const withBooleans = (inputData: Record<string, unknown>, fields: PlainInputField[]): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(inputData).map(([key, value]) =>
      fields.some((field) => field.key === key && field.type === 'boolean')
        ? [key, value === true || value === 'true']
        : [key, value],
    ),
  );

/**
 * Build the Zapier action for one PDF operation.
 *
 * Every operation runs as an Apdf job. In a live Zap Apdf posts the finished job to Zapier's
 * callback URL, so even long OCR or Office conversions never hit a time limit. While the Zap
 * editor loads a sample, where Zapier advises against callbacks, the step polls the job instead.
 */
export const definePdfOperation = (operation: PdfOperation) => {
  const requestBody = (bundle: Bundle) => {
    const inputData = withBooleans(bundle.inputData, operation.inputFields);

    return operation.body ? operation.body(inputData) : inputData;
  };

  const output = async (z: ZObject, job: ApiJob) => ({
    job_id: job.id,
    ...(await operation.result(z, jobResult(z, job))),
  });

  return defineCreate({
    key: operation.key,
    noun: 'PDF',
    display: {
      label: operation.label,
      description: operation.description,
    },
    operation: {
      inputFields: operation.inputFields,
      ...(operation.inputFieldGroups ? { inputFieldGroups: operation.inputFieldGroups } : {}),

      perform: async (z: ZObject, bundle: Bundle) => {
        if (bundle.meta.isLoadingSample) {
          return output(z, await waitForJob(z, await startJob(z, operation.path, requestBody(bundle))));
        }

        const jobId = await startJob(z, operation.path, {
          ...requestBody(bundle),
          webhook_url: z.generateCallbackUrl(),
        });

        return { job_id: jobId };
      },

      // Apdf posts the job, as its status endpoint would return it, to the callback URL.
      performResume: (z: ZObject, bundle: Bundle) => output(z, bundle.cleanedRequest as ApiJob),

      sample: operation.sample,
      outputFields: operation.outputFields,
    },
  });
};
