import { describe, expect, it } from 'vitest';

import { invoke } from './support/zapier.js';

describe('authentication', () => {
  it('accepts a valid API token', async () => {
    const response = await invoke('authentication.test');

    expect(response.status).toBe(200);
  });

  it('expires the connection when Apdf rejects the token', async () => {
    await expect(invoke('authentication.test', {}, { token: 'not-a-token' })).rejects.toThrow(
      /Apdf rejected the API token/,
    );
  });
});
