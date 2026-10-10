import { describe, expect, it } from 'vitest';

import { invoke } from './support/zapier.js';

describe('authentication', () => {
  it('accepts a valid API token and reports the account it acts as', async () => {
    const account = await invoke('authentication.test');

    expect(account).toMatchObject({
      user: { email: 'zapier-pro@zapier.local' },
      workspace: { handle: 'zapier-pro', plan: { name: 'Pro' } },
    });
  });

  it('expires the connection when Apdf rejects the token', async () => {
    await expect(invoke('authentication.test', {}, { token: 'not-a-token' })).rejects.toThrow(
      /Apdf rejected the API token/,
    );
  });
});
