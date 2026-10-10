import type { Authentication, Bundle, ZObject } from 'zapier-platform-core';

import { fetchData } from './lib/api.js';
import type { Account } from './lib/types.js';

/**
 * Prove the token works by asking Apdf who it acts as, which also names the connection.
 */
const test = (z: ZObject, bundle: Bundle) => fetchData<Account>(z, 'GET', '/me');

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
  connectionLabel: '{{user.email}}',
} satisfies Authentication;
