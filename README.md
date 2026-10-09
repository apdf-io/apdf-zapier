# Apdf for Zapier

The Zapier integration for [Apdf](https://apdf.io), the PDF engagement layer for apps and agents.
Share a PDF through per-recipient tracking links, start Zaps when someone reads it, and run the
full Apdf PDF toolset as Zap actions.

Built with the [Zapier Platform CLI](https://docs.zapier.com/platform/build-cli/overview) in
TypeScript, from the CLI's own `custom-auth` TypeScript template.

## What it offers

**Triggers**

- One trigger per reader event: Document Opened, Downloaded and Printed; Page Viewed, Read and
  Left; Text Copied; Link Clicked; Form Submitted; Annotation Created, Updated and Deleted. Each
  can be limited to some documents and narrowed by the conditions Apdf supports for that event,
  such as a page number or a minimum completion rate.
- New Document, a polling trigger.

**Actions**

- Documents: create, archive, unarchive, make public, make private, delete.
- Tracking links: create, activate, deactivate, delete.
- PDF: create from HTML, convert Office documents, merge, split, compress, convert to images,
  extract, delete and rotate pages, overlay, underlay, extract and search text (with and without
  OCR), make searchable with OCR, add and remove a password, read metadata.

**Searches**

- Find Document, Find Document Analytics, Find Reading Session, Find Tracking Link (by
  recipient email), and Find or Create Tracking Link.

## How it works

- **Authentication** is an Apdf API token, sent as a bearer token. A token belongs to one
  workspace.
- **Reader event triggers are REST hooks.** Turning a Zap on creates an Apdf automation whose
  webhook is the Zap's hook URL; turning it off deletes the automation. Apdf evaluates the
  document filter and the conditions before it calls Zapier. Automations need a Pro or Business
  plan, so on Hobby the Zap fails to turn on with an upgrade message. Samples in the Zap editor
  come from the workspace's recent automation runs, with a static sample as the fallback.
- **PDF actions always run as Apdf jobs.** A live Zap passes Zapier's callback URL as the job's
  `webhook_url` and waits until Apdf posts the finished job back (`performResume`), so large
  files and slow OCR or Office conversions never hit a time limit. While the Zap editor loads a
  sample, where Zapier advises against callbacks, the step polls the job status instead.
- **Result files are copied into Zapier's file storage** (`z.stashFile`), because Apdf deletes
  generated files after an hour. Each result also carries Apdf's own `file_url`.
- **Dropdowns** for documents, tracking links and reading sessions are backed by hidden list
  triggers.
- **Errors** read like the API means them: plan and quota refusals name the limit and link to
  the pricing page, validation failures list the offending fields, and a rejected token expires
  the connection. Rate limits (HTTP 429) are retried by Zapier.

## Project layout

```
src/
  index.ts             App definition: registers everything below
  authentication.ts    API token auth
  middleware.ts        Bearer token on Apdf requests, readable API errors
  lib/                 API client, error mapping, event catalogue, jobs, file stashing, types
  fields/              Input fields shared across steps (document, link and session pickers)
  triggers/            Reader event REST hooks, New Document, hidden dropdown lists
  creates/             Document and link actions
  creates/pdf/         PDF actions: one factory (operation.ts) and their definitions
  searches/            Searches
  test/                Vitest suites and their support code
```

## Development

Requires Node.js 22 or newer; Zapier runs the integration on Node.js 22.

```sh
npm install
cp .env.example .env    # then fill in the tokens
```

| Command                                           | What it does                                               |
| ------------------------------------------------- | ---------------------------------------------------------- |
| `npm run build`                                   | Compile TypeScript into `dist/`                            |
| `npm test`                                        | Build, then run the whole test suite                       |
| `npm run lint`                                    | Check formatting and types, tests included                 |
| `npm run format`                                  | Format everything with Prettier                            |
| `npx zapier-platform validate`                    | Zapier's schema and publishing checks                      |
| `npx zapier-platform invoke trigger documentList` | Run one step locally with `authData_api_token` from `.env` |

### Tests

Most tests are integration tests against a real Apdf, usually a local one: `APDF_BASE_URL`
points the integration at it. They need two API tokens: `APDF_TEST_TOKEN` of a workspace with
automations (Pro or Business) and `APDF_TEST_HOBBY_TOKEN` of a Hobby workspace. Apdf has to run
its queue workers, since PDF jobs and automation webhooks are queued.

The tests start a small local server that plays the outside world: Apdf downloads the fixture
PDFs from it, and posts to it where it would post to Zapier's hook and callback URLs. So a test
can turn a trigger on, play a reader opening the document in the viewer, receive the webhook
Apdf sends, and run the trigger on it. File stashing needs Zapier's storage, which only exists
on Zapier, so the PDF tests replace it with a marker.

Apdf rate-limits each workspace, so the test files run one after another and throttled calls are
retried. A full run takes a couple of minutes.

## Deployment

```sh
npx zapier-platform login
npx zapier-platform register "Apdf"   # once, creates the integration on Zapier
npx zapier-platform push              # uploads the version in package.json
npx zapier-platform promote 0.1.0     # makes a version the public one, once published
```

Never set `APDF_BASE_URL` on Zapier; without it the integration talks to `https://apdf.io/api`.
