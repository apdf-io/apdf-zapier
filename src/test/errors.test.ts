import { describe, expect, it } from 'vitest';

import { describeApiError } from '../lib/errors.js';

describe('describeApiError', () => {
  it('names the quota and the upgrade page when a plan limit is reached', () => {
    const description = describeApiError(403, {
      error: 'quota_exceeded',
      quota: 'pdf_operations_monthly',
      limit: 500,
      used: 500,
      upgrade_url: 'https://apdf.io/pricing',
    });

    expect(description).toEqual({
      code: 'QuotaExceeded',
      message:
        'Your Apdf plan limit for pdf_operations_monthly is reached (500 of 500 used). Upgrade at https://apdf.io/pricing.',
    });
  });

  it('passes on the reason when a feature is not on the plan', () => {
    const description = describeApiError(403, {
      error: 'feature_not_available',
      feature: 'automations',
      message: 'Automations are not available on your current plan.',
      upgrade_url: 'https://apdf.io/pricing',
    });

    expect(description.code).toBe('FeatureNotAvailable');
    expect(description.message).toBe(
      'Automations are not available on your current plan. Upgrade at https://apdf.io/pricing.',
    );
  });

  it('lists the offending fields of a validation failure', () => {
    const description = describeApiError(422, {
      message: 'The name field is required. (and 1 more error)',
      errors: { name: ['The name field is required.'], file: ['The file field must be a valid URL.'] },
    });

    expect(description.message).toBe(
      'The name field is required. (and 1 more error) name: The name field is required.; file: The file field must be a valid URL.',
    );
  });

  it('reads the single-string field errors a failed PDF job carries', () => {
    const description = describeApiError(500, {
      message: 'An error occured during the merge operation.',
      errors: { pages: 'Invalid pages syntax' },
    });

    expect(description.message).toBe('An error occured during the merge operation. pages: Invalid pages syntax');
  });

  it('explains a rejected token and a missing record', () => {
    expect(describeApiError(401, { message: 'Unauthenticated.' }).code).toBe('AuthenticationFailed');
    expect(describeApiError(404, { message: 'Not found.' }).code).toBe('NotFound');
  });
});
