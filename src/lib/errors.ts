import type { HttpResponse, ZObject } from 'zapier-platform-core';

const PRICING_URL = 'https://apdf.io/pricing';

/** What went wrong, phrased for the person reading the Zap history. */
export interface ErrorDescription {
  message: string;
  code: string;
}

type ErrorBody = Record<string, unknown>;

/**
 * Join Laravel's validation errors into one sentence. Validation failures carry arrays of
 * messages; errors raised while a PDF job runs carry a single string per field.
 */
const describeFieldErrors = (errors: Record<string, string | string[]>): string =>
  Object.entries(errors)
    .map(([field, messages]) => `${field}: ${([] as string[]).concat(messages).join(' ')}`)
    .join('; ');

/**
 * Decide what an Apdf error response means, as a plain function of status and body so the
 * mapping can be read and tested on its own.
 */
export const describeApiError = (status: number, body: ErrorBody = {}): ErrorDescription => {
  const upgradeUrl = String(body.upgrade_url ?? PRICING_URL);

  // Plan and quota refusals both arrive as 403 with an "error" discriminator.
  if (body.error === 'quota_exceeded') {
    return {
      code: 'QuotaExceeded',
      message: `Your Apdf plan limit for ${String(body.quota ?? 'this resource')} is reached (${String(
        body.used,
      )} of ${String(body.limit)} used). Upgrade at ${upgradeUrl}.`,
    };
  }

  if (body.error === 'feature_not_available') {
    return {
      code: 'FeatureNotAvailable',
      message: [
        String(body.message ?? 'This feature is not available on your Apdf plan.'),
        `Upgrade at ${upgradeUrl}.`,
      ].join(' '),
    };
  }

  const message = String(body.message ?? `Apdf returned status ${status}.`);

  if (body.errors !== undefined && body.errors !== null && typeof body.errors === 'object') {
    return {
      code: 'ValidationFailed',
      message: `${message} ${describeFieldErrors(body.errors as Record<string, string | string[]>)}`,
    };
  }

  if (status === 401) {
    return {
      code: 'AuthenticationFailed',
      message: 'Apdf rejected the API token. Create a new one under Dashboard → API → Tokens and reconnect.',
    };
  }

  if (status === 404) {
    return {
      code: 'NotFound',
      message: 'Apdf could not find that record. Check the ID; it must belong to the workspace of the API token.',
    };
  }

  return { code: 'ApiError', message };
};

/**
 * Read the JSON body of an error response, tolerating bodies that are not JSON.
 */
const errorBody = (response: HttpResponse): ErrorBody => {
  const data: unknown = response.data;

  return data !== null && typeof data === 'object' ? (data as ErrorBody) : {};
};

/**
 * Throw the Zapier error that fits an Apdf error response. A rejected token expires the
 * connection; everything else fails the step with a message the user can act on. Rate limits
 * never get here: the platform turns a 429 into a retrying ThrottledError on its own.
 */
export const throwApiError = (z: ZObject, response: HttpResponse): never => {
  const { message, code } = describeApiError(response.status, errorBody(response));

  if (response.status === 401) {
    throw new z.errors.ExpiredAuthError(message);
  }

  throw new z.errors.Error(message, code, response.status);
};

/**
 * Throw for an error status, and pass any successful response through.
 */
export const ensureSuccessful = (z: ZObject, response: HttpResponse): HttpResponse =>
  response.status >= 400 ? throwApiError(z, response) : response;
