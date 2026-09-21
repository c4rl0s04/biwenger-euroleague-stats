export type NewsType = 'transfer' | 'price_up' | 'price_down' | 'match' | 'result';
export interface NewsFeedItem {
  type: NewsType;
  text: string;
  /** Preserve the historical transfer wire value, including string/null. */
  timestamp: number | string | null;
}
export interface MobileNewsInput {
  id?: string | number;
  title?: string;
  text?: string;
  description?: string;
  message?: string;
}
export interface MobileNewsItem {
  id: string;
  title: string;
  description: string;
}
