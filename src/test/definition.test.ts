import type { Bundle } from 'zapier-platform-core';
import { describe, expect, it } from 'vitest';

import { withoutEmptyValues } from '../lib/api.js';
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

  it('follows the Zapier naming conventions for every visible step', () => {
    const steps = [
      ...Object.values(App.triggers ?? {}).map((step) => ({ step, verb: /^Triggers when /u })),
      ...Object.values(App.searches ?? {}).map((step) => ({ step, verb: /^Finds /u })),
      ...Object.values(App.creates ?? {}).map((step) => ({ step, verb: /^[A-Z][a-z-]+s\b/u })),
    ].filter(({ step }) => !step.display.hidden);

    for (const { step, verb } of steps) {
      expect(step.display.description, step.key).toMatch(verb);
      expect(step.display.description, step.key).toMatch(/\.$/u);
      expect(step.display.description, step.key).not.toMatch(/apdf/iu);
      expect(step.noun, step.key).toMatch(/^(PDF|[a-z ]+)$/u);

      // Field labels are in sentence case; only acronyms such as PDF or HTML stay capitalized.
      for (const field of (step.operation.inputFields ?? []).flatMap((field) =>
        typeof field === 'object' ? [field, ...('children' in field ? (field.children ?? []) : [])] : [],
      )) {
        const laterWords = (field.label ?? '').split(' ').slice(1);

        expect(
          laterWords.filter((word) => /^[A-Z][a-z]/u.test(word)),
          `${step.key}: ${field.label}`,
        ).toEqual([]);
      }
    }
  });

  it('leaves blank input data to the app instead of Zapier', () => {
    expect(App.flags?.cleanInputData).toBe(false);
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

describe('withoutEmptyValues', () => {
  it('drops blank values at every depth and keeps everything else', () => {
    expect(
      withoutEmptyValues({
        file: 'https://example.com/a.pdf',
        user_password: '',
        dpi: null,
        pages: [],
        options: {},
        async: false,
        scale: 0,
        rotations: [
          { angle: '90', pages: '' },
          { angle: '', pages: '' },
        ],
      }),
    ).toEqual({ file: 'https://example.com/a.pdf', async: false, scale: 0, rotations: [{ angle: '90' }] });
  });
});
