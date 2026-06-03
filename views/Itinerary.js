// ════════════════════════════════════════════════════════════
// Itinerary.js — Le fameux design "L'Atelier v2"
// ════════════════════════════════════════════════════════════

function ItineraryView() {
  // On appelle directement le composant global créé par Claude
  // Il va utiliser window.TRIP (les fausses données) pour garantir le design parfait.
  return React.createElement(window.AtelierV2);
}

window.ItineraryView = ItineraryView;