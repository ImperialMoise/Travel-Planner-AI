// ════════════════════════════════════════════════════════════
// Map.js — Carte 3D Interactive (façon Polarsteps) via Mapbox
// ════════════════════════════════════════════════════════════

function MapView() {
  const { trip, theme = localStorage.getItem('it_theme') || 'light' } = Store.useStore();
  const mapContainer = React.useRef(null);
  const map = React.useRef(null);

  React.useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Empêche de recréer la carte si elle existe déjà

    // Token public de test Mapbox (tu pourras créer le tien gratuitement plus tard sur mapbox.com)
    mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emIyeW4zMGFuNzE2YXkifQ.E_8E4E_7E2W1pUSd1XU3LQ';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      projection: 'globe', // La magie opère ici : on demande un globe 3D !
      zoom: 1.5,
      center: [10, 20], // On commence avec une vue globale de la terre
      scrollZoom: true
    });

    // Ajout des contrôles de navigation (Zoom + / -)
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('style.load', () => {
      // On personnalise l'atmosphère du globe avec tes couleurs "Atelier"
      map.current.setFog({
        'color': theme === 'dark' ? '#15302a' : '#f4efe5', // Couleur de l'atmosphère basse
        'high-color': 'var(--accent)', // Lueur dorée en haute atmosphère
        'space-color': theme === 'dark' ? '#0a1714' : '#1f2e28', // Couleur de l'espace
        'star-intensity': 0.8
      });

      // ─── FAUSSES DONNÉES GPS POUR LA DÉMO ───
      // (Bientôt, Claude Pro t'aidera à extraire ça des vraies étapes Supabase)
      const demoPoints = [
        { lng: 126.9780, lat: 37.5665, label: "Séoul (J1-J6)" },
        { lng: 126.6800, lat: 37.9000, label: "DMZ (J6)" },
        { lng: 129.0756, lat: 35.1796, label: "Busan (J7-J9)" },
        { lng: 127.5255, lat: 37.7955, label: "Île de Nami (J13)" }
      ];

      // On dessine les points sur la carte
      demoPoints.forEach((pt) => {
        // On crée un petit cercle HTML stylisé aux couleurs de ton site
        const el = document.createElement('div');
        el.style.width = '18px';
        el.style.height = '18px';
        el.style.borderRadius = '50%';
        el.style.background = 'var(--accent)';
        el.style.border = '3px solid var(--card)';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
        el.style.cursor = 'pointer';

        // On crée le popup qui s'ouvre au clic
        const popup = new mapboxgl.Popup({ offset: 15, closeButton: false })
          .setHTML(`<div style="font-family: var(--font-sans); font-size: 13px; font-weight: 700; color: #1f2e28; padding: 4px;">${pt.label}</div>`);

        // On accroche tout ça au globe
        new mapboxgl.Marker(el)
          .setLngLat([pt.lng, pt.lat])
          .setPopup(popup)
          .addTo(map.current);
      });

      // Animation spectaculaire : le globe tourne et zoome vers la Corée du Sud !
      setTimeout(() => {
        map.current.flyTo({
          center: [128.0, 36.5], // Coordonnées centrales de la Corée
          zoom: 5.5,
          speed: 0.7, // Vitesse du vol
          curve: 1.5,
          essential: true
        });
      }, 800); // Démarre après 800ms
    });

    return () => map.current.remove();
  }, [theme]);

  if (!trip) return null;

  return (
    <div style={{ flex: 1, minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', padding: '24px 32px' }}>
      
      {/* En-tête de la page */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>Exploration</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 32, color: 'var(--text)', marginTop: 4 }}>
            Carte du voyage
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', background: 'var(--inset)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--line)' }}>
          Mode Globe 3D actif
        </div>
      </div>
      
      {/* Conteneur du Globe */}
      <div style={{ flex: 1, borderRadius: 20, overflow: 'hidden', border: '1px solid var(--line)', boxShadow: 'var(--shadow)', position: 'relative' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      </div>

    </div>
  );
}

window.MapView = MapView;
