import { INewsItem, IViewEvent, InteractionType } from '../models/NewsModels';

/** The UI consumes this contract; it never reads lists or seeds local records. */
export interface IInnovationPulseService {
  getNews(): Promise<INewsItem[]>;
  canReadInsights(): Promise<boolean>;
  getViews(): Promise<IViewEvent[]>;
  track(item: { Id: number; Title: string; sourceurl?: string }, kind: InteractionType): Promise<void>;
}
