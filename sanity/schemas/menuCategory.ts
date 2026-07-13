import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'menuCategory',
  title: 'Menu category',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'titleRu',
      title: 'Title (Russian)',
      type: 'string',
      description: 'Название категории по-русски. Shown when guests switch /menu to Russian; falls back to English when empty.'
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required()
    }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {
        list: [
          { title: 'Food', value: 'food' },
          { title: 'Cocktails / Drinks', value: 'drink' },
          { title: 'Wine', value: 'wine' }
        ],
        layout: 'radio'
      },
      validation: (r) => r.required()
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      description: 'Lower numbers show first within their kind.',
      initialValue: 100
    }),
    defineField({
      name: 'description',
      title: 'Short description',
      type: 'text',
      rows: 2
    }),
    defineField({
      name: 'footnote',
      title: 'Footnote',
      type: 'string',
      description: 'Small note shown under the category (e.g. service charge info).'
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
    select: { title: 'title', subtitle: 'kind', order: 'order' },
    prepare: ({ title, subtitle, order }) => ({
      title,
      subtitle: `${subtitle} · #${order}`
    })
  }
});
