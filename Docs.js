function DocsView() {
  const { trip } = Store.useStore();
  return (
    <Placeholder
      kicker="Documents"
      title={trip.name}
      subtitle="Réservations, billets, contacts"
      hint="Stockage des références clés du voyage (numéros, liens, codes). Catégorisable."
    />
  );
}
window.DocsView = DocsView;
