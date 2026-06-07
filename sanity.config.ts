import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './sanity/schemas';
import { structure } from './sanity/structure';
import { apiVersion, dataset, projectId } from './sanity/env';

export default defineConfig({
  name: 'bisou',
  title: 'Bisou Phuket',
  basePath: '/studio',
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
  schema: { types: schemaTypes }
});
