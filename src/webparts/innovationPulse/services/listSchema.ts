/** EDIT POINT: SharePoint column display OR internal names. No list IDs or data here.
 * Internal names are resolved from /fields; do not guess encoded names.
 * See src/docs/live-lists.md before changing the schema.
 */
export const newsFields: { [property: string]: string } = {
  Title: 'article title', articledate: 'upload date', articlebody: 'article body',
  sourceurl: 'source url', Category: 'category', SubCategory: 'sub category',
  Region: 'region', SourcePublishDate: 'source publish date', Country: 'country',
  DBSImplication: 'DBS implication', SourcePublisher: 'source publisher',
  ArticleImageUrl: 'article image url', InDib: 'in_dib'
};
export const requiredNewsFields = ['Title', 'articledate', 'articlebody', 'Category'];
export const viewFields: { [property: string]: string } = {
  Title: 'article', ArticleId: 'article ID', ViewerName: 'viewer name',
  ViewerAccount: 'viewer account', SourceUrl: 'original source URL',
  ViewedAt: 'viewed at', InteractionType: 'interaction type'
};
