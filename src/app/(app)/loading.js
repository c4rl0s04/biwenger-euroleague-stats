export default function AppLoading() {
  return (
    <div className="app-route-loading" aria-hidden="true">
      <div className="app-route-loading-header">
        <div className="app-route-loading-kicker" />
        <div className="app-route-loading-title" />
        <div className="app-route-loading-copy" />
      </div>
      <div className="app-route-loading-grid">
        <div className="app-route-loading-card" />
        <div className="app-route-loading-card" />
        <div className="app-route-loading-card app-route-loading-card-wide" />
      </div>
    </div>
  );
}
