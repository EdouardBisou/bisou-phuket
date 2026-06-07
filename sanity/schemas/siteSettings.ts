import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({ name: 'brandName', title: 'Brand name', type: 'string', initialValue: 'Bisou' }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
    defineField({ name: 'concept', title: 'Concept paragraph', type: 'text', rows: 6 }),
    defineField({ name: 'address', title: 'Address', type: 'text', rows: 2 }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({ name: 'openingHours', title: 'Opening hours', type: 'string' }),
    defineField({ name: 'reservationUrl', title: 'Reservation URL', type: 'url' }),
    defineField({ name: 'mapsUrl', title: 'Google Maps URL', type: 'url' }),
    defineField({
      name: 'socials',
      title: 'Social links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string' }),
            defineField({ name: 'url', title: 'URL', type: 'url' })
          ]
        }
      ]
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
            defineField({ name: 'caption', title: 'Caption', type: 'string' })
          ]
        }
      ]
    })
  ],
  preview: {
    prepare: () => ({ title: 'Site settings' })
  }
});
