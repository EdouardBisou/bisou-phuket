import type { StructureResolver, StructureBuilder } from 'sanity/structure';

const orderAsc = [{ field: 'order', direction: 'asc' as const }];

const kindGroup = (S: StructureBuilder, label: string, kind: 'food' | 'drink' | 'wine') =>
  S.listItem()
    .title(label)
    .child(
      S.documentList()
        .title(`${label} categories`)
        .filter('_type == "menuCategory" && kind == $kind')
        .params({ kind })
        .defaultOrdering(orderAsc)
        .child((catId) =>
          S.documentList()
            .title('Dishes')
            .filter('_type == "menuItem" && references($catId)')
            .params({ catId })
            .defaultOrdering(orderAsc)
        )
    );

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Bisou Content')
    .items([
      S.listItem()
        .title('Site Settings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),

      S.divider(),

      kindGroup(S, 'Food', 'food'),
      kindGroup(S, 'Cocktails', 'drink'),
      kindGroup(S, 'Wine', 'wine'),

      S.divider(),

      S.listItem()
        .title('Team')
        .child(
          S.documentList()
            .title('Team members')
            .filter('_type == "teamMember"')
            .defaultOrdering(orderAsc)
        ),

      S.divider(),

      S.documentTypeListItem('menuCategory').title('All categories'),
      S.documentTypeListItem('menuItem').title('All dishes'),

      S.divider(),

      S.documentTypeListItem('page').title('Pages')
    ]);
