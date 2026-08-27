import type { ReactNode } from 'react';

interface MobileChartFrameProps {
  title: string;
  summary: string;
  children: ReactNode;
  table?: ReactNode;
}

export default function MobileChartFrame({ title, summary, children, table }: MobileChartFrameProps) {
  return (
    <figure className="mobile-chart-frame">
      <figcaption>
        <h2>{title}</h2>
        <p>{summary}</p>
      </figcaption>
      <div className="mobile-chart-viewport">{children}</div>
      {table && (
        <details className="mobile-chart-alternative">
          <summary>Ver datos de la gráfica</summary>
          <div className="mobile-chart-table">{table}</div>
        </details>
      )}
    </figure>
  );
}
