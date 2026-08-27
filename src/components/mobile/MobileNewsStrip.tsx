import { Radio } from 'lucide-react';

interface MobileNewsItem {
  id: string;
  title: string;
  description?: string;
}

export default function MobileNewsStrip({ items }: { items: MobileNewsItem[] }) {
  if (!items.length) return null;

  return (
    <details className="mobile-news-strip">
      <summary>
        <span className="mobile-news-live"><Radio size={14} aria-hidden="true" /> Liga</span>
        <span className="mobile-news-headline">{items[0].title}</span>
        <span className="mobile-news-expand">+{items.length}</span>
      </summary>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong>
            {item.description && <span>{item.description}</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}
