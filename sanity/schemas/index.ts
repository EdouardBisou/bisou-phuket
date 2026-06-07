import menuCategory from './menuCategory';
import menuItem from './menuItem';
import siteSettings from './siteSettings';
import page from './page';
import teamMember from './teamMember';

// Journal posts are authored in-repo as markdown (content/journal/*.md),
// not in Sanity. Sanity is the editing surface for menu + team + settings.
export const schemaTypes = [siteSettings, menuCategory, menuItem, teamMember, page];
