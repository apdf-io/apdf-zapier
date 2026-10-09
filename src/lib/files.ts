import type { ZObject } from 'zapier-platform-core';

/**
 * Copy a result file into Zapier's file storage. Apdf deletes generated files after an hour,
 * which a Zap with a delay or a held task can outlast; the stashed copy stays available to every
 * later step.
 */
export const stashFile = async (z: ZObject, url: string): Promise<string> =>
  // The core typings declare a string, but stashing is asynchronous and resolves to the URL.
  z.stashFile(z.request({ url, raw: true }));
