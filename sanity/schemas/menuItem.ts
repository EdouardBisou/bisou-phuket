import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'menuItem',
  title: 'Menu item',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (r) => r.required()
    }),
    defineField({
      name: 'nameRu',
      title: 'Name (Russian)',
      type: 'string',
      description: 'Название по-русски. Shown when guests switch /menu to Russian; falls back to English when empty.'
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'menuCategory' }],
      validation: (r) => r.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2
    }),
    defineField({
      name: 'descriptionRu',
      title: 'Description (Russian)',
      type: 'text',
      rows: 2,
      description: 'Описание по-русски. Optional; falls back to English when empty.'
    }),
    defineField({
      name: 'price',
      title: 'Price (THB)',
      type: 'number',
      description: 'Leave empty if a price note is used instead.'
    }),
    defineField({
      name: 'priceNote',
      title: 'Price note',
      type: 'string',
      description: 'e.g. "per 100g", "caviar +400", "from 2,400"'
    }),
    defineField({
      name: 'order',
      title: 'Order within category',
      type: 'number',
      initialValue: 100
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Signature', value: 'signature' },
          { title: 'Vegetarian', value: 'veg' },
          { title: 'New', value: 'new' },
          { title: 'Spicy', value: 'spicy' }
        ]
      }
    }),
    defineField({
      name: 'image',
      title: 'Dish photograph',
      type: 'image',
      options: { hotspot: true },
      description: 'Optional. When set, replaces the "Coming soon" placeholder shown on hover or in the mobile bottom sheet.'
    })
  ],
  orderings: [
    {
      title: 'Order within category',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }]
    }
  ],
  preview: {
    select: {
      title: 'name',
      category: 'category.title',
      price: 'price',
      priceNote: 'priceNote',
      media: 'image'
    },
    prepare: ({ title, category, price, priceNote, media }) => ({
      title,
      subtitle: [category, price ? `${price} THB` : priceNote].filter(Boolean).join(' · '),
      media
    })
  }
});
