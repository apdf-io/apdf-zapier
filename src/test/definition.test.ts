import type { Bundle } from 'zapier-platform-core';
import { describe, expect, it } from 'vitest';

import { readerEvents } from '../lib/events.js';
import { automationBody } from '../triggers/readerEvent.js';
import { App } from './support/zapier.js';

const pageRead = readerEvents.find((readerEvent) => readerEvent.key === 'pageRead')!;

const bundle = (inputData: Record<string, unknown>) =>
  ({ inputData, targetUrl: 'https://hooks.zapier.com/hooks/standard/1/abc' }) as unknown as Bundle;

describe('the app definition', () => {
  it('shows one trigger per reader event besides the new document trigger', () => {
    const visible = Object.values(App.triggers ?? {}).filter((trigger) => !trigger.display.hidden);

    expect(visible.map((trigger) => trigger.key).sort()).toEqual(
      [...readerEvents.map((readerEvent) => readerEvent.key), 'newDocument'].sort(),
    );
  });

  it('backs every dynamic dropdown with a trigger', () => {
    const operations = [
      ...Object.values(App.creates ?? {}),
      ...Object.values(App.searches ?? {}),
      ...Object.values(App.triggers ?? {}),
    ];
    const dropdowns = operations.flatMap((operation) =>
      (operation.operation.inputFields ?? []).flatMap((field) =>
        'dynamic' in field && field.dynamic ? [field.dynamic] : [],
      ),
    );

    for (const dynamic of dropdowns) {
      expect(App.triggers).toHaveProperty(String(dynamic).split('.')[0] ?? '');
    }
  });

  it('pairs the tracking link search with its create', () => {
    const searchOrCreate = App.searchOrCreates?.findTrackingLink;

    expect(App.searches?.[searchOrCreate!.search]).toBeDefined();
    expect(App.creates?.[searchOrCreate!.create]).toBeDefined();
  });
});

describe('automationBody', () => {
  it('watches every document and sends no conditions when none are set', () => {
    expect(automationBody(pageRead, bundle({}))).toEqual({
      name: 'Zapier: Page Read',
      events: ['page:read'],
      webhook_url: 'https://hooks.zapier.com/hooks/standard/1/abc',
      scope: 'all',
    });
  });

  it('limits the automation to the chosen documents and the filled-in conditions', () => {
    expect(
      automationBody(pageRead, bundle({ doc_ids: ['a', 'b'], page_number: '7', time_on_page: 30, pages_viewed: '' })),
    ).toMatchObject({
      scope: 'specific',
      doc_ids: ['a', 'b'],
      conditions: [
        { type: 'page_number', value: 7 },
        { type: 'time_on_page', value: 30 },
      ],
    });
  });

  it('ignores conditions the event does not accept', () => {
    const documentOpened = readerEvents.find((readerEvent) => readerEvent.key === 'documentOpened')!;

    expect(automationBody(documentOpened, bundle({ page_number: 2 }))).not.toHaveProperty('conditions');
  });
});
