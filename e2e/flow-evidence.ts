import { writeFile } from 'node:fs/promises';

import { test as base } from '@playwright/test';

type Observation = { event: string; state: string; path: string };

function toMermaid(observations: Observation[]): string {
  const states = new Map<string, string>();
  const transitions: string[] = [];
  let previous = '[*]';
  for (const { event, state, path } of observations) {
    const label = `${state} (${path})`;
    const id = states.get(label) ?? `s${states.size}`;
    states.set(label, id);
    transitions.push(`  ${previous} --> ${id}: ${event}`);
    previous = id;
  }
  const declarations = Array.from(
    states,
    ([label, id]) => `  state ${JSON.stringify(label)} as ${id}`,
  );
  return ['stateDiagram-v2', ...declarations, ...transitions, ''].join('\n');
}

export const test = base.extend<{ observeState: (event: string, state: string) => void }>({
  observeState: async ({ page }, use, testInfo) => {
    const observations: Observation[] = [];
    await use((event, state) => {
      observations.push({ event, state, path: new URL(page.url()).pathname });
    });
    if (observations.length) {
      const path = testInfo.outputPath('observed-states.mmd');
      await writeFile(path, toMermaid(observations), 'utf8');
      await testInfo.attach('observed-states.mmd', {
        path,
        contentType: 'text/plain',
      });
    }
  },
});
