import type { AfterResponseMiddleware, BeforeRequestMiddleware } from 'zapier-platform-core';

import { isApiUrl } from './lib/api.js';
import { ensureSuccessful } from './lib/errors.js';

/**
 * Authenticate every request to the Apdf API with the connected token. Other hosts, such as the
 * storage result files are downloaded from, never see it.
 */
const authenticate: BeforeRequestMiddleware = (request, z, bundle) => {
  if (!isApiUrl(request.url)) {
    return request;
  }

  request.headers = {
    ...request.headers,
    Accept: 'application/json',
    ...(bundle.authData.api_token ? { Authorization: `Bearer ${bundle.authData.api_token}` } : {}),
  };

  return request;
};

/**
 * Turn Apdf error responses into errors worth reading in the Zap history, unless the caller
 * asked to inspect the status itself.
 */
const handleErrors: AfterResponseMiddleware = (response, z) => {
  if (!isApiUrl(response.request.url) || response.skipThrowForStatus) {
    return response;
  }

  return ensureSuccessful(z, response);
};

export const befores = [authenticate];

export const afters = [handleErrors];
