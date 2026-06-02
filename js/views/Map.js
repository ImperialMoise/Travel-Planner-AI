function MapView() {
  const { trip } = Store.useStore();
  return (
    <Placeholder
      kicker="Carte"
      title={trip.name}
      subtitle="Vue géographique"
      hint="L'onglet Carte sera repris depuis le travail précédent : tuiles teintées DA, pins par jour, fil du voyage, recherche, mode lecture."
    />
  );
}
window.MapView = MapView;
