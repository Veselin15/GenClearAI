export default function AppLoading() {
  return (
    <div className="app-shell">
      <div className="topbar skeleton" style={{ height: 56, borderRadius: 0 }} />
      <div className="page container">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="grid-2" style={{ marginTop: 28 }}>
          <div className="stack">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
          <div className="skeleton skeleton-card tall" />
        </div>
      </div>
    </div>
  );
}
