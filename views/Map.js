function MapView() {
  const { trip } = Store.useStore();
  return (
    <div style={{ flex: 1, minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Placeholder
        kicker="Carte"
        title={trip.name}
        subtitle="Vue géographique"
        hint="L'onglet Carte sera repris depuis le travail précédent."
      />
    </div>
  );
}
window.MapView = MapView;