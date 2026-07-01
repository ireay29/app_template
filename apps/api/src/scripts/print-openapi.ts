import { createApp } from '../app.js';
import type { AppDependencies } from '../app-dependencies.js';

const schemaOnlyDependencies: AppDependencies = {
  async checkDatabase() {
    return;
  },
  handleAuth() {
    return new Response(null, { status: 501 });
  },
  notesService: {
    async createForUser() {
      throw new Error('The OpenAPI schema export must not execute note mutations.');
    },
    async listForUser() {
      return [];
    },
  },
};

const app = createApp(schemaOnlyDependencies);
const response = await app.request('/api/openapi.json');

if (!response.ok) {
  throw new Error(`Failed to export OpenAPI schema: ${response.status}`);
}

const document = await response.json();

process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
