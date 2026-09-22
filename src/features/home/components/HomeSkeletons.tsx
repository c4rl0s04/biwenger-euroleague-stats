export function HomeSummarySkeleton() {
  return (
    <div className="mobile-home-skeleton-summary" aria-label="Cargando resumen">
      <div className="mobile-home-skeleton-header skeleton" />
      <div className="mobile-home-skeleton-filters">
        <span className="skeleton" />
        <span className="skeleton" />
        <span className="skeleton" />
      </div>
      <div className="mobile-home-skeleton-pulse skeleton" />
    </div>
  );
}

export function HomeFeedSkeleton() {
  return (
    <section className="mobile-home-feed-section" aria-label="Cargando actividad">
      <div className="mobile-home-feed-heading">
        <span className="skeleton" />
      </div>
      <div className="mobile-home-timeline is-loading">
        <span className="skeleton" />
        <span className="skeleton" />
        <span className="skeleton" />
      </div>
    </section>
  );
}
