import type { MobileNewsInput, MobileNewsItem } from '../models/news';

export function toMobileNewsItems(news: readonly MobileNewsInput[]): MobileNewsItem[] {
  return news.slice(0, 3).map((item, index) => ({
    id: String(item.id ?? index),
    title: String(item.title ?? item.text ?? 'Actualidad de la liga'),
    description: String(item.description ?? item.message ?? ''),
  }));
}
