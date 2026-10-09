import zapier from 'zapier-platform-core';

import App from '../../index.js';

/** Bundle fields a test may set; the rest is filled in. */
export interface TestBundle {
  inputData?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  targetUrl?: string;
  subscribeData?: Record<string, unknown>;
  cleanedRequest?: unknown;
  outputData?: unknown;
}

interface InvokeOptions {
  token?: string;
  /** Where z.generateCallbackUrl() points, so a local server can play Zapier's callback. */
  callbackUrl?: string;
}

/** The handler Zapier runs the app with; exported by core, though missing from its typings. */
type AppHandler = (event: Record<string, unknown>) => Promise<{ results: unknown }>;

const handler = (zapier as unknown as { createAppHandler: (app: unknown) => AppHandler }).createAppHandler(App);

/** How often a throttled call is retried before the test gives up. */
const THROTTLE_RETRIES = 8;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The seconds Zapier would wait before retrying, read from a ThrottledError; null for any other
 * error.
 */
const throttleDelay = (error: unknown): number | null => {
  if (!(error instanceof Error) || error.name !== 'ThrottledError') {
    return null;
  }

  return Number(JSON.parse(error.message).delay) || 1;
};

/**
 * Run one method of the app the way Zapier runs it, for example "creates.mergePdfs.operation.perform".
 *
 * It is the app tester with what the tests need on top: a callback URL of our choosing, and
 * retries when Apdf throttles the test workspace.
 */
export const invoke = async (method: string, bundle: TestBundle = {}, options: InvokeOptions = {}): Promise<any> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run(method, bundle, options);
    } catch (error) {
      const delay = throttleDelay(error);

      // Apdf rate-limits each workspace; Zapier retries throttled steps, and so do the tests.
      if (delay === null || attempt === THROTTLE_RETRIES) {
        throw error;
      }

      await sleep(delay * 1000);
    }
  }
};

/**
 * Run the method once.
 */
const run = async (method: string, bundle: TestBundle, options: InvokeOptions): Promise<any> => {
  const response = await handler({
    command: 'execute',
    method,
    bundle: {
      authData: { api_token: options.token ?? process.env.APDF_TEST_TOKEN },
      inputData: {},
      ...bundle,
      meta: { isLoadingSample: false, page: 0, ...bundle.meta },
    },
    callback_url: options.callbackUrl ?? 'http://127.0.0.1:9/never-called',
  });

  return response.results;
};

/** The app definition, for tests that read it directly. */
export { App };
