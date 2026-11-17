export type InteractionType = 'Tile click' | 'Source article click' | 'Page view';
export interface INewsItem {
  Id: number; Title: string; articlebody: string; sourceurl: string; articledate: string;
  Order: number; Category: string; SubCategory: string; Region: string; Country: string;
  SourcePublishDate: string; DBSImplication: string; SourcePublisher: string;
  ArticleImageUrl: string; InDib: boolean;
}
export interface IViewEvent {
  Id: number; Title: string; ArticleId: number; ViewerName: string; ViewerAccount: string;
  SourceUrl: string; ViewedAt: string; InteractionType: InteractionType;
}

