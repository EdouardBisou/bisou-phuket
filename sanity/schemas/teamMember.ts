import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'teamMember',
  title: 'Team member',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Full name',
      type: 'string',
      validation: (r) => r.required()
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'e.g. "Chef & Co-Founder", "Sommelier", "Restaurant Manager"',
      validation: (r) => r.required()
    }),
    defineField({
      name: 'photo',
      title: 'Photograph',
      type: 'image',
      options: { hotspot: true },
      description: 'Vertical portrait works best. Visible on the website team section.'
    }),
    defineField({
      name: 'tagline',
      title: 'Short tagline',
      type: 'string',
      description: 'Optional one-line description shown under the name.'
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      initialValue: 100,
      description: 'Lower numbers show first. Co-founders typically 1 and 2.'
    })
  ],
  orderings: [
    {
      title: 'Display order',
      name: 'displayOrder',
      by: [{ field: 'order', direction: 'asc' }]
    }
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'photo', order: 'order' },
    prepare: ({ title, subtitle, media, order }) => ({
      title,
      subtitle: `${subtitle}${order ? ` · #${order}` : ''}`,
      media
    })
  }
});
