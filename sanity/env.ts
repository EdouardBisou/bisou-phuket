// Project ID and dataset name are not secrets — both appear in every Sanity Studio URL.
// Hardcoded here so the deployed studio bundle (which doesn't get build-time env vars
// the way Next.js does) always has the values it needs.
export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  'phukettodo';

export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  'production';

export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ||
  process.env.SANITY_STUDIO_API_VERSION ||
  '2024-10-01';
