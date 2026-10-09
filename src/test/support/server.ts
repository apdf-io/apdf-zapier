import { readFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';

const FIXTURES = join(import.meta.dirname, '..', 'fixtures');

const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * A local stand-in for the outside world while testing against a local Apdf: it serves the
 * fixture files Apdf downloads, and receives the POSTs Apdf would send to Zapier's hook and
 * callback URLs.
 */
export interface TestServer {
  /** A URL Apdf can download the named fixture from. */
  fileUrl: (name: string) => string;
  /** A URL Apdf can post to, standing in for a Zapier hook or callback URL. */
  inboxUrl: (name: string) => string;
  /** Resolve with the next body posted to the named inbox. */
  nextPost: (name: string, timeoutMs?: number) => Promise<unknown>;
  close: () => Promise<void>;
}

/**
 * Start the server on a free port of the loopback interface.
 */
export const startTestServer = async (): Promise<TestServer> => {
  const received = new Map<string, unknown[]>();
  const waiting = new Map<string, (body: unknown) => void>();

  const deliver = (inbox: string, body: unknown) => {
    const resolve = waiting.get(inbox);

    if (resolve) {
      waiting.delete(inbox);
      resolve(body);

      return;
    }

    received.set(inbox, [...(received.get(inbox) ?? []), body]);
  };

  const server: Server = createServer(async (request, response) => {
    const [, kind, name = ''] = (request.url ?? '').split('/');

    if (request.method === 'GET' && kind === 'files') {
      try {
        const extension = name.split('.').pop() ?? '';

        response.writeHead(200, { 'Content-Type': CONTENT_TYPES[extension] ?? 'application/octet-stream' });
        response.end(await readFile(join(FIXTURES, name)));
      } catch {
        response.writeHead(404).end();
      }

      return;
    }

    if (request.method === 'POST' && kind === 'inbox') {
      const chunks: Buffer[] = [];

      for await (const chunk of request) {
        chunks.push(chunk as Buffer);
      }

      response.writeHead(200, { 'Content-Type': 'application/json' }).end('{}');
      deliver(name, JSON.parse(Buffer.concat(chunks).toString() || '{}'));

      return;
    }

    response.writeHead(404).end();
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  return {
    fileUrl: (name) => `${origin}/files/${name}`,
    inboxUrl: (name) => `${origin}/inbox/${name}`,
    nextPost: (name, timeoutMs = 60000) => {
      const queued = received.get(name)?.shift();

      if (queued !== undefined) {
        return Promise.resolve(queued);
      }

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Nothing was posted to "${name}" in time`)), timeoutMs);

        waiting.set(name, (body) => {
          clearTimeout(timer);
          resolve(body);
        });
      });
    },
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
};
