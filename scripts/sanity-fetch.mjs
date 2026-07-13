/**
 * Sanity fetcher for the build script. Read-only public CDN access.
 * No token required: project 5oq4q4y4 / dataset production are public reads.
 */

import { createClient } from '@sanity/client';

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  '5oq4q4y4';

const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  'production';

const apiVersion = '2024-10-01';

export const sanity = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published'
});

const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  brandName,
  tagline,
  concept,
  address,
  phone,
  email,
  openingHours,
  reservationUrl,
  socials,
  mapsUrl
}`;

const MENU_QUERY = `*[_type == "menuCategory"] | order(order asc){
  _id,
  title,
  titleRu,
  "slug": slug.current,
  kind,
  order,
  description,
  footnote,
  "items": *[_type == "menuItem" && references(^._id)] | order(order asc){
    _id,
    name,
    nameRu,
    description,
    descriptionRu,
    price,
    priceNote,
    tags,
    "image": image{
      "url": asset->url,
      "lqip": asset->metadata.lqip,
      "alt": coalesce(alt, ^.name)
    }
  }
}`;

const TEAM_QUERY = `*[_type == "teamMember"] | order(order asc){
  _id,
  name,
  role,
  tagline,
  order,
  "photo": photo{
    "url": asset->url,
    "lqip": asset->metadata.lqip
  }
}`;

// Journal posts are NOT fetched from Sanity. They are authored in-repo as
// markdown (content/journal/*.md) and loaded by the build script. Sanity is
// the editing surface for menu + team + site settings only.

/**
 * Fetch everything the build needs in one round trip.
 * Returns an object with sensible defaults if Sanity is unreachable so the build never fails on a network blip.
 */
async function safeFetch(client, query, fallback) {
  try {
    const data = await client.fetch(query);
    return data == null ? fallback : data;
  } catch (err) {
    console.error('[sanity-fetch] query failed, using fallback:', err.message);
    return fallback;
  }
}

export async function fetchAll() {
  // Each source fails independently so a missing Phuket project (settings/team)
  // never breaks the Bangkok menu fetch, and vice versa.
  const [settings, categories, team] = await Promise.all([
    safeFetch(sanity, SITE_SETTINGS_QUERY, null),
    safeFetch(sanity, MENU_QUERY, []),
    safeFetch(sanity, TEAM_QUERY, [])
  ]);
  return {
    settings: settings || null,
    categories: Array.isArray(categories) ? categories : [],
    team: Array.isArray(team) ? team : []
  };
}
