import type { ZObject } from 'zapier-platform-core';

import { send } from './api.js';
import { describeApiError } from './errors.js';
import type { ApiJob } from './types.js';

/** How often to ask Apdf whether a job is done while the Zap editor loads a sample. */
const POLL_INTERVAL_MS = 2000;

/** How long a sample may wait for a job, safely inside Zapier's time limit for one step. */
const SAMPLE_WAIT_MS = 25000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Start a PDF operation as an Apdf job and return its ID. Every operation runs asynchronously,
 * so large files never meet Zapier's time limit for a single request.
 */
export const startJob = async (z: ZObject, path: string, body: Record<string, unknown>): Promise<string> =>
  (await send<{ job_id: string }>(z, 'POST', path, { body: { ...body, async: true } })).job_id;

/**
 * Wait for a job by polling its status. Only used while the Zap editor loads a sample; live
 * runs let Apdf call back instead.
 */
export const waitForJob = async (z: ZObject, jobId: string): Promise<ApiJob> => {
  const deadline = Date.now() + SAMPLE_WAIT_MS;

  for (;;) {
    const job = await send<ApiJob>(z, 'POST', '/job/status/check', { body: { id: jobId } });

    if (job.status === 'successful' || job.status === 'failed') {
      return job;
    }

    if (Date.now() + POLL_INTERVAL_MS > deadline) {
      throw new z.errors.Error(
        `Apdf is still working on job ${jobId}. Live Zaps wait for the result automatically; to finish setting up, test again or skip the test.`,
        'JobStillRunning',
      );
    }

    await sleep(POLL_INTERVAL_MS);
  }
};

/**
 * The result of a finished job, or the error it failed with.
 */
export const jobResult = (z: ZObject, job: ApiJob): unknown => {
  if (job.status !== 'failed') {
    return job.result;
  }

  const { message, code } = describeApiError(500, {
    message: 'The PDF operation failed.',
    ...((job.result ?? {}) as Record<string, unknown>),
  });

  throw new z.errors.Error(message, code);
};
