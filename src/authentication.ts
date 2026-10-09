import type { Authentication, Bundle, ZObject } from 'zapier-platform-core';

import { request } from './lib/api.js';

/**
 * Prove the token works by listing a single document, which every token of a workspace may do.
 */
const test = (z: ZObject, bundle: Bundle) => request(z, 'GET', '/docs', { params: { per_page: 1 } });

export default {
  type: 'custom',
  fields: [
    {
      key: 'api_token',
      label: 'API Token',
      type: 'password',
      required: true,
      helpText:
        'Create a token in your Apdf dashboard under [API → Tokens](https://apdf.io/dashboard/api/tokens). A token belongs to one workspace, so every step acts on that workspace.',
    },
  ],
  test,
} satisfies Authentication;
