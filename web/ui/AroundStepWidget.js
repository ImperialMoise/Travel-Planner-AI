function aroundStepDisplayName(step) {
  if (!step) return 'Étape';

  return String(
    step.label ||
    step.lieu ||
    step.place ||
    step.arrivee ||
    step.depart ||
    'Étape'
  ).trim();
}

function getStepThemeIdeas(step) {
  if (!step) return [];

  var type = String(step.type || '').toLowerCase();
  var label = String((step.label || '') + ' ' + (step.lieu || '')).toLowerCase();

  if (type === 'restaurant') {
    return [
      'Regarder s’il y a une balade courte à faire avant ou après le repas.',
      'Vérifier les horaires, la réservation et les avis récents.',
      'Prévoir une alternative proche si le lieu est complet.'
    ];
  }

  if (type === 'logement') {
    return [
      'Vérifier le temps vers les transports principaux.',
      'Repérer une supérette, une pharmacie ou un café proche.',
      'Contrôler l’heure de check-in, la consigne bagage et les conditions d’annulation.'
    ];
  }

  if (type === 'transport') {
    return [
      'Prévoir une marge avant le départ, surtout avec bagages.',
      'Vérifier le terminal, le quai ou le point de rendez-vous.',
      'Garder les documents utiles accessibles hors ligne.'
    ];
  }

  if (label.indexOf('musée') > -1 || label.indexOf('museum') > -1) {
    return [
      'Regarder les monuments ou jardins proches pour compléter la visite.',
      'Vérifier les horaires, jours de fermeture et billets coupe-file.',
      'Prévoir une pause café ou une balade après la visite.'
    ];
  }

  if (type === 'activite') {
    return [
      'Chercher les incontournables à proximité immédiate.',
      'Vérifier si le quartier se visite mieux à pied.',
      'Prévoir une pause ou un repas dans la même zone.'
    ];
  }

  return [
    'Regarder les lieux connus à proximité.',
    'Vérifier les horaires, l’accès et le temps de trajet.',
    'Comparer avec les autres étapes de la journée pour éviter les allers-retours.'
  ];
}

function getStepPracticalChecks(step) {
  if (!step) return [];

  var checks = [];

  if (!step.lat || !step.lng) {
    checks.push('Localisation imprécise : ajoute des coordonnées pour améliorer la carte et les trajets.');
  }

  if (!step.time) {
    checks.push('Aucun horaire indiqué : ajoute une heure si cette étape est importante.');
  }

  if (step.type === 'restaurant') {
    checks.push('Vérifier réservation, horaires et temps d’attente.');
  }

  if (step.type === 'logement') {
    checks.push('Vérifier check-in, check-out et accès depuis les transports.');
  }

  if (step.type === 'transport') {
    checks.push('Vérifier confirmation, horaires réels et marge de sécurité.');
  }

  if (!checks.length) {
    checks.push('Aucun point bloquant détecté, mais vérifie les horaires réels et conditions sur place.');
  }

  return checks;
}

const AROUND_CATEGORIES = [
  {
    id: 'restaurant',
    label: 'Restaurants',
    type: 'restaurant',
    query: 'restaurant'
  },
  {
    id: 'cafe',
    label: 'Cafés',
    type: 'restaurant',
    query: 'cafe coffee'
  },
  {
    id: 'activity',
    label: 'Activités',
    type: 'activite',
    query: 'tourism attraction point of interest'
  },
  {
    id: 'museum',
    label: 'Musées',
    type: 'activite',
    query: 'museum gallery cultural attraction'
  },
  {
    id: 'shop',
    label: 'Commerces',
    type: 'activite',
    query: 'shop store market'
  },
  {
    id: 'transport',
    label: 'Transports',
    type: 'transport',
    query: 'metro subway bus train station'
  }
];

function aroundCategoryById(id) {
  return AROUND_CATEGORIES.find(function(category) {
    return category.id === id;
  }) || AROUND_CATEGORIES[0];
}

function AroundStepWidgetV2({ step, editMode, onRemove }) {
  const [expanded, setExpanded] = React.useState(false);
  const [nearbyType, setNearbyType] = React.useState('restaurant');
  const [nearbyItems, setNearbyItems] = React.useState([]);
  const [nearbyState, setNearbyState] = React.useState('idle');

  const { trip, selectedDayIndex = 0 } = Store.useStore();
  const activeDay = trip && Array.isArray(trip.days)
    ? trip.days[selectedDayIndex]
    : null;

    React.useEffect(() => {
    setExpanded(false);
    setNearbyItems([]);
    setNearbyState('idle');
  }, [step?.id]);

  if (!step) {
    return (
      <div style={{
        background: 'var(--card)',
        borderRadius: 12,
        border: '1px solid var(--outline-variant)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '12px 16px',
          background: 'var(--soft)',
          borderBottom: '1px solid var(--outline-variant)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="pin" size={16} style={{ color: 'var(--tan)' }} />
            Autour de ce lieu
          </span>
          {editMode && (
            <button onClick={onRemove} style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              border: 'none',
              cursor: 'pointer',
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 15
            }}>
              {'\u00d7'}
            </button>
          )}
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: '19px' }}>
            Sélectionne une étape dans l’itinéraire pour afficher des pistes utiles autour de ce lieu.
          </div>
        </div>
      </div>
    );
  }

async function searchAroundStep(categoryId) {
  if (!step || !step.lat || !step.lng) {
    setNearbyItems([]);
    setNearbyState('missing');
    return;
  }

  const category = aroundCategoryById(categoryId);

  setNearbyType(category.id);
  setNearbyState('loading');
  setNearbyItems([]);

  try {
    const results = await window.SB.searchPlaces({
      query: category.query,
      type: category.type,
      lat: Number(step.lat),
      lng: Number(step.lng),
      limit: 12,
      language: 'fr'
    });

    const rawItems = Array.isArray(results)
      ? results
      : Array.isArray(results && results.items)
        ? results.items
        : Array.isArray(results && results.results)
          ? results.results
          : Array.isArray(results && results.features)
            ? results.features
            : [];

    const items = rawItems.map(function(raw, index) {
      const props = raw && raw.properties ? raw.properties : (raw || {});
      const coords = raw && raw.geometry && Array.isArray(raw.geometry.coordinates)
        ? raw.geometry.coordinates
        : [];

      return {
        id: raw.id || props.place_id || props.osm_id || props.datasource && props.datasource.raw && props.datasource.raw.osm_id || ('nearby_' + index),
        label: props.name || props.label || props.formatted || raw.label || raw.name || category.label,
        place: props.formatted || props.address_line2 || props.address_line1 || raw.place || raw.address || '',
        lat: Number(props.lat || props.latitude || coords[1] || raw.lat),
        lng: Number(props.lon || props.lng || props.longitude || coords[0] || raw.lng),
        website: props.website || raw.website || raw.url || '',
        url: props.website || raw.url || '',
        distance: props.distance || raw.distance || '',
        category: category.id,
        raw: raw
      };
    }).filter(function(item) {
      return item.label &&
        item.label !== category.label &&
        isNearbyCloseEnough(item);
    });

    setNearbyItems(items);
    setNearbyState(items.length ? 'ready' : 'empty');
  } catch (error) {
    setNearbyItems([]);
    setNearbyState('error');
  }
}

  function nearbyLabel(item) {
    return String(
      item.label ||
      item.name ||
      item.title ||
      item.place ||
      item.formatted ||
      item.address ||
      'Lieu'
    ).trim();
  }

  function nearbySub(item) {
    return String(
      item.place ||
      item.formatted ||
      item.address ||
      item.context ||
      item.city ||
      ''
    ).trim();
  }
  function nearbyLat(item) {
    const direct = Number(item && item.lat);
    if (Number.isFinite(direct)) return direct;

    const locationLat = Number(item && item.location && item.location.lat);
    if (Number.isFinite(locationLat)) return locationLat;

    const geometryLat = Number(
      item &&
      item.geometry &&
      item.geometry.coordinates &&
      item.geometry.coordinates[1]
    );
    if (Number.isFinite(geometryLat)) return geometryLat;

    return null;
  }

  function nearbyLng(item) {
    const direct = Number(item && item.lng);
    if (Number.isFinite(direct)) return direct;

    const locationLng = Number(item && item.location && item.location.lng);
    if (Number.isFinite(locationLng)) return locationLng;

    const geometryLng = Number(
      item &&
      item.geometry &&
      item.geometry.coordinates &&
      item.geometry.coordinates[0]
    );
    if (Number.isFinite(geometryLng)) return geometryLng;

    return null;
  }

  function nearbyStepType() {
  const category = aroundCategoryById(nearbyType);

  if (category.type === 'restaurant') return 'restaurant';
  if (category.type === 'transport') return 'transport';

  return 'activite';
}

    function distanceMetersFromStep(item) {
    if (!step || !step.lat || !step.lng) return null;

    const lat1 = Number(step.lat);
    const lng1 = Number(step.lng);
    const lat2 = nearbyLat(item);
    const lng2 = nearbyLng(item);

    if (
      !Number.isFinite(lat1) ||
      !Number.isFinite(lng1) ||
      lat2 === null ||
      lng2 === null
    ) {
      return null;
    }

    const R = 6371000;
    const toRad = Math.PI / 180;

    const p1 = lat1 * toRad;
    const p2 = lat2 * toRad;
    const dp = (lat2 - lat1) * toRad;
    const dl = (lng2 - lng1) * toRad;

    const a =
      Math.sin(dp / 2) * Math.sin(dp / 2) +
      Math.cos(p1) * Math.cos(p2) *
      Math.sin(dl / 2) * Math.sin(dl / 2);

    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function distanceLabelFromStep(item) {
    const meters = distanceMetersFromStep(item);

    if (meters === null) return '';

    if (meters < 1000) {
      return meters + ' m';
    }

    return (meters / 1000).toLocaleString('fr-FR', {
      maximumFractionDigits: 1
    }) + ' km';
  }

  function isNearbyCloseEnough(item) {
  const meters = distanceMetersFromStep(item);

  if (meters === null) return true;

  return meters <= 8000;
}

function openNearbyOnMap(item) {
  const lat = nearbyLat(item);
  const lng = nearbyLng(item);
  const label = nearbyLabel(item);
  const sub = nearbySub(item);

  if (lat === null || lng === null) {
    Store.showToast('Coordonnées manquantes pour ce lieu');
    return;
  }

  Store.set({
    view: 'map',
    mapPreviewPlace: {
      id: item.id || label,
      label: label,
      place: sub || label,
      lat: lat,
      lng: lng,
      type: nearbyStepType()
    }
  });
}

    function isNearbyAlreadyInDay(item) {
    if (!activeDay || !Array.isArray(activeDay.steps)) return false;

    const label = nearbyLabel(item).toLowerCase();
    const sub = nearbySub(item).toLowerCase();
    const lat = nearbyLat(item);
    const lng = nearbyLng(item);

    return activeDay.steps.some(function(step) {
      const stepName = String(step.label || step.lieu || step.place || '').trim().toLowerCase();
      const stepPlace = String(step.lieu || step.place || '').trim().toLowerCase();

      if (label && stepName && stepName === label) return true;
      if (sub && stepPlace && stepPlace === sub) return true;

      const stepLat = Number(step.lat);
      const stepLng = Number(step.lng);

      if (
        Number.isFinite(stepLat) &&
        Number.isFinite(stepLng) &&
        lat !== null &&
        lng !== null
      ) {
        const closeLat = Math.abs(stepLat - lat) < 0.00002;
        const closeLng = Math.abs(stepLng - lng) < 0.00002;

        if (closeLat && closeLng) return true;
      }

      return false;
    });
  }

  async function addNearbyToDay(item) {
    if (!trip || !trip.id || !activeDay || !activeDay.id) {
      Store.showToast('Aucune journée active trouvée');
      return;
    }

        if (isNearbyAlreadyInDay(item)) {
      Store.showToast('Ce lieu est déjà dans la journée');
      return;
    }

    const label = nearbyLabel(item);
    const lieu = nearbySub(item) || label;
    const lat = nearbyLat(item);
    const lng = nearbyLng(item);
    const type = nearbyStepType();

    const payload = {
      stepIndex: Array.isArray(activeDay.steps) ? activeDay.steps.length : 0,
      type: type,
      label: label,
      lieu: lieu,
      note: 'Ajouté depuis “Autour de ce lieu”'
    };

    if (lat !== null) payload.lat = lat;
    if (lng !== null) payload.lng = lng;

    if (item.website || item.url) {
      payload.link = item.website || item.url;
    }

    try {
         const savedStep = await window.SB.saveStep(trip.id, activeDay.id, payload);

      const refreshed = await window.SB.loadTrip(trip.id);

      const refreshedDay = refreshed && Array.isArray(refreshed.days)
        ? refreshed.days[selectedDayIndex]
        : null;

      const addedStep = refreshedDay && Array.isArray(refreshedDay.steps)
        ? refreshedDay.steps.find(function(step) {
            if (savedStep && savedStep.id && step.id === savedStep.id) return true;

            const sameLabel = String(step.label || '').trim() === String(label || '').trim();
            const sameLieu = String(step.lieu || '').trim() === String(lieu || '').trim();

            if (sameLabel && sameLieu) return true;

            if (lat !== null && lng !== null) {
              const stepLat = Number(step.lat);
              const stepLng = Number(step.lng);

              if (
                Number.isFinite(stepLat) &&
                Number.isFinite(stepLng) &&
                Math.abs(stepLat - lat) < 0.00002 &&
                Math.abs(stepLng - lng) < 0.00002
              ) {
                return true;
              }
            }

            return false;
          })
        : null;

      Store.set({
        trip: refreshed,
        selectedDayIndex: selectedDayIndex,
        pendingEditStepId: addedStep && addedStep.id ? addedStep.id : null
      });

      Store.showToast(
        type === 'restaurant'
          ? 'Restaurant ajouté à la journée'
          : 'Lieu ajouté à la journée'
      );
    } catch (error) {
      Store.showToast('Erreur ajout : ' + (error.message || error));
    }
  }

  var title = aroundStepDisplayName(step);
  var ideas = getStepThemeIdeas(step);
  var checks = getStepPracticalChecks(step);

  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: 12,
      border: '1px solid var(--outline-variant)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px 16px',
        background: 'var(--soft)',
        borderBottom: '1px solid var(--outline-variant)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="pin" size={16} style={{ color: 'var(--tan)' }} />
          Autour de ce lieu
        </span>

        {editMode && (
          <button onClick={onRemove} style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            border: 'none',
            cursor: 'pointer',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 15
          }}>
            {'\u00d7'}
          </button>
        )}
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 5 }}>
          Étape sélectionnée
        </div>

        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 5 }}>
          {title}
        </div>

        <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: '18px', marginBottom: 12 }}>
          Pistes générales pour compléter cette étape sans imposer de programme.
        </div>

        <button
  onClick={() => searchAroundStep(nearbyType)}
  disabled={nearbyState === 'loading'}
  style={{
    width: '100%',
    padding: '9px 12px',
    borderRadius: 10,
    border: '1px solid var(--outline-variant)',
    background: 'var(--inset)',
    color: 'var(--text)',
    cursor: nearbyState === 'loading' ? 'wait' : 'pointer',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  }}
>
  <Icon name="chevright" size={13} />
  {nearbyState === 'loading' ? 'Recherche…' : 'Voir les lieux'}
</button>

        <div style={{ marginTop: 14 }}>
          <div style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'var(--faint)',
            marginBottom: 8
          }}>
            Rechercher autour
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 10
          }}>
            {AROUND_CATEGORIES.map(function(category) {
  const on = nearbyType === category.id;

  return (
    <button
      key={category.id}
      type="button"
      onClick={() => {
  setNearbyType(category.id);
  setNearbyItems([]);
  setNearbyState('idle');
}}
      style={{
        border: '1px solid ' + (on ? 'var(--accent)' : 'var(--outline-variant)'),
        background: on ? 'var(--accent)' : 'var(--inset)',
        color: on ? 'var(--accent-ink)' : 'var(--muted)',
        borderRadius: 999,
        padding: '6px 10px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 11,
        fontWeight: 800
      }}
    >
      {nearbyState === 'loading' && nearbyType === category.id ? '…' : category.label}
    </button>
  );
})}
          </div>

          {nearbyState === 'missing' && (
            <div style={{
              fontSize: 12.5,
              lineHeight: '18px',
              color: 'var(--muted)',
              background: 'var(--inset)',
              borderRadius: 10,
              padding: '10px 12px'
            }}>
              Cette étape n’a pas encore de coordonnées. Localise-la sur la carte pour chercher autour.
            </div>
          )}

          {nearbyState === 'loading' && (
            <div style={{
              fontSize: 12.5,
              color: 'var(--muted)',
              background: 'var(--inset)',
              borderRadius: 10,
              padding: '10px 12px'
            }}>
              Recherche des lieux proches…
            </div>
          )}

          {nearbyState === 'empty' && (
            <div style={{
              fontSize: 12.5,
              color: 'var(--muted)',
              background: 'var(--inset)',
              borderRadius: 10,
              padding: '10px 12px'
            }}>
              Aucun lieu trouvé autour de cette étape.
            </div>
          )}

          {nearbyState === 'error' && (
            <div style={{
              fontSize: 12.5,
              color: '#c0563f',
              background: 'rgba(192,86,63,.10)',
              borderRadius: 10,
              padding: '10px 12px'
            }}>
              Recherche indisponible pour le moment.
            </div>
          )}

          {nearbyItems.length > 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              {nearbyItems.map((item, index) => (
                <div
                  key={item.id || item.placeId || index}
                  style={{
                    border: '1px solid var(--outline-variant)',
                    background: 'var(--inset)',
                    borderRadius: 11,
                    padding: '10px 11px'
                  }}
                >
                                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginBottom: 3
                  }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--text)',
                      minWidth: 0
                    }}>
                      {nearbyLabel(item)}
                    </div>

                    {distanceLabelFromStep(item) && (
                      <span style={{
                        flexShrink: 0,
                        borderRadius: 999,
                        padding: '3px 7px',
                        background: 'var(--soft)',
                        color: 'var(--muted)',
                        fontSize: 10.5,
                        fontWeight: 800,
                        whiteSpace: 'nowrap'
                      }}>
                        {distanceLabelFromStep(item)}
                      </span>
                    )}
                  </div>

                                    <div style={{
                    fontSize: 12,
                    lineHeight: '17px',
                    color: 'var(--muted)',
                    marginBottom: 9
                  }}>
                    {nearbySub(item) || 'Lieu proche'}
                  </div>

                                     <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6
                  }}>
                    <button
                      type="button"
                      disabled={isNearbyAlreadyInDay(item)}
                      onClick={() => addNearbyToDay(item)}
                      style={{
                        border: '1px solid var(--outline-variant)',
                        background: isNearbyAlreadyInDay(item) ? 'var(--inset)' : 'var(--accent-soft)',
                        color: isNearbyAlreadyInDay(item) ? 'var(--faint)' : 'var(--accent)',
                        borderRadius: 999,
                        padding: '6px 10px',
                        cursor: isNearbyAlreadyInDay(item) ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 11,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      {isNearbyAlreadyInDay(item) ? 'Déjà ajouté' : '+ Ajouter à la journée'}
                    </button>

                    <button
                      type="button"
                      onClick={() => openNearbyOnMap(item)}
                      style={{
                        border: '1px solid var(--outline-variant)',
                        background: 'var(--inset)',
                        color: 'var(--muted)',
                        borderRadius: 999,
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 11,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      Voir carte
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {expanded && (
          <div style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--outline-variant)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 7 }}>
                Idées classiques
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ideas.map(function(item, i) {
                  return (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, lineHeight: '18px', color: 'var(--muted)' }}>
                      <Icon name="sparkle" size={12} style={{ color: 'var(--tan)', flexShrink: 0, marginTop: 2 }} />
                      <span>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 7 }}>
                À vérifier
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {checks.map(function(item, i) {
                  return (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, lineHeight: '18px', color: 'var(--text)' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 900 }}>•</span>
                      <span>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.AroundStepWidgetV2 = AroundStepWidgetV2;