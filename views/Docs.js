function DocsView() {
  const { trip } = Store.useStore();
  return (
    <div style={{ flex: 1, minHeight: 'calc(100vh - 60px)' }}>
      <Placeholder
        kicker="Documents"
        title={trip.name}
        subtitle="Réservations, billets, contacts"
        hint="Stockage des références clés du voyage (numéros, liens, codes). Catégorisable."
      />
    </div>
  );
}
window.DocsView = DocsView;