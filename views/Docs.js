function DocsView() {
  const { trip } = Store.useStore();
  return (
    <div style={{ flex: 1, minHeight: 'calc(100vh - 60px)', display: 'grid', placeItems: 'center', padding: 30 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>Documents</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 24, color: 'var(--text)', marginTop: 4 }}>{trip?.name || 'Mon voyage'}</div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>Cet onglet arrive bientôt.</p>
      </div>
    </div>
  );
}
window.DocsView = DocsView;