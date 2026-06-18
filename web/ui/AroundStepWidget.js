// ════════════════════════════════════════════════════════════
// AroundStepWidget.js — Widget “Autour de ce lieu”
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Prendre l'étape sélectionnée dans l'itinéraire.
// - Chercher des lieux proches via window.SB.searchPlaces.
// - Afficher les distances depuis l'étape sélectionnée.
// - Ajouter un lieu à la journée active.
// - Ouvrir la carte interne de l'app sur le lieu sélectionné.
//
// Dépendances globales :
// - React
// - Store
// - Icon
// - window.SB.searchPlaces
// - window.SB.saveStep
// - window.SB.loadTrip
//
// ════════════════════════════════════════════════════════════

const AROUND_SEARCH_RADIUS_METERS = 8000;

const AROUND_CATEGORIES = [
  {
    id: 'restaurant',
    label: 'Restaurants',
    type: 'restaurant',
    stepType: 'restaurant',
    query: 'restaurant'
  },
  {
    id: 'cafe',
    label: 'Cafés',
    type: 'restaurant',
    stepType: 'restaurant',
    query: 'cafe coffee'
  },
  {
    id: 'activity',
    label: 'Activités',
    type: 'activite',
    stepType: 'activite',
    query: 'tourism attraction point of interest'
  },
  {
    id: 'museum',
    label: 'Musées',
    type: 'activite',
    stepType: 'activite',
    query: 'museum gallery cultural attraction'
  },
  {
    id: 'shop',
    label: 'Commerces',
    type: 'activite',
    stepType: 'activite',
    query: 'shop store market'
  },
  {
    id: 'transport',
    label: 'Transports',
    type: 'transport',
    stepType: 'transport',
    query: 'metro subway bus train station'
  }
];

function aroundCategoryById(id) {
  return AROUND_CATEGORIES.find(function findCategory(category) {
    return category.id === id;
  }) || AROUND_CATEGORIES[0];
}

function aroundStepName(step) {
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

function aroundStepSub(step) {
  if (!step) return '';

  return String(
    step.lieu ||
    step.place ||
    step.address ||
    step.note ||
    ''
  ).trim();
}

function aroundNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function aroundStepCoords(step) {
  if (!step) return null;

  const lat = aroundNumber(step.lat);
  const lng = aroundNumber(step.lng);

  if (lat === null || lng === null) return null;

  return {
    lat,
    lng
  };
}

function aroundItemCoords(item) {
  if (!item) return null;

  const lat =
    aroundNumber(item.lat) ??
    aroundNumber(item.latitude) ??
    aroundNumber(item.location && item.location.lat) ??
    aroundNumber(item.properties && item.properties.lat) ??
    aroundNumber(item.geometry && item.geometry.coordinates && item.geometry.coordinates[1]);

  const lng =
    aroundNumber(item.lng) ??
    aroundNumber(item.lon) ??
    aroundNumber(item.longitude) ??
    aroundNumber(item.location && item.location.lng) ??
    aroundNumber(item.properties && item.properties.lon) ??
    aroundNumber(item.properties && item.properties.lng) ??
    aroundNumber(item.geometry && item.geometry.coordinates && item.geometry.coordinates[0]);

  if (lat === null || lng === null) return null;

  return {
    lat,
    lng
  };
}

function aroundItemName(item, fallback) {
  if (!item) return fallback || 'Lieu';

  const properties = item.properties || {};

  return String(
    item.label ||
    item.name ||
    item.title ||
    item.place ||
    item.formatted ||
    properties.name ||
    properties.label ||
    properties.formatted ||
    fallback ||
    'Lieu'
  ).trim();
}

function aroundItemAddress(item) {
  if (!item) return '';

  const properties = item.properties || {};

  return String(
    item.place ||
    item.formatted ||
    item.address ||
    item.context ||
    item.city ||
    properties.formatted ||
    properties.address_line2 ||
    properties.address_line1 ||
    properties.city ||
    ''
  ).trim();
}

function aroundItemWebsite(item) {
  if (!item) return '';

  const properties = item.properties || {};

  return String(
    item.website ||
    item.url ||
    properties.website ||
    properties.url ||
    ''
  ).trim();
}

function aroundItemId(item, index) {
  if (!item) return 'nearby_' + index;

  const properties = item.properties || {};
  const datasource = properties.datasource || {};
  const raw = datasource.raw || {};

  return String(
    item.id ||
    item.placeId ||
    item.place_id ||
    properties.place_id ||
    properties.osm_id ||
    raw.osm_id ||
    'nearby_' + index
  );
}

function aroundDistanceMeters(fromCoords, toCoords) {
  if (!fromCoords || !toCoords) return null;

  const lat1 = Number(fromCoords.lat);
  const lng1 = Number(fromCoords.lng);
  const lat2 = Number(toCoords.lat);
  const lng2 = Number(toCoords.lng);

  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lng1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lng2)
  ) {
    return null;
  }

  const earthRadius = 6371000;
  const toRad = Math.PI / 180;

  const phi1 = lat1 * toRad;
  const phi2 = lat2 * toRad;
  const deltaPhi = (lat2 - lat1) * toRad;
  const deltaLambda = (lng2 - lng1) * toRad;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  return Math.round(
    earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

function aroundDistanceLabel(meters) {
  if (meters === null || meters === undefined) return '';

  if (meters < 1000) {
    return meters + ' m';
  }

  return (meters / 1000).toLocaleString('fr-FR', {
    maximumFractionDigits: 1
  }) + ' km';
}

function aroundExtractResults(response) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response && response.items)) return response.items;
  if (Array.isArray(response && response.results)) return response.results;
  if (Array.isArray(response && response.features)) return response.features;

  if (
    response &&
    response.data &&
    Array.isArray(response.data.results)
  ) {
    return response.data.results;
  }

  return [];
}

function aroundNormalizeResults(rawResults, category, sourceCoords) {
  return rawResults
    .map(function normalize(raw, index) {
      const coords = aroundItemCoords(raw);
      const distance = aroundDistanceMeters(sourceCoords, coords);
      const name = aroundItemName(raw, category.label);
      const address = aroundItemAddress(raw);

      return {
        id: aroundItemId(raw, index),
        label: name,
        place: address,
        lat: coords ? coords.lat : null,
        lng: coords ? coords.lng : null,
        website: aroundItemWebsite(raw),
        distance,
        categoryId: category.id,
        stepType: category.stepType,
        raw
      };
    })
    .filter(function keepValid(item) {
      if (!item.label) return false;
      if (item.label === category.label) return false;

      if (item.distance === null) return true;

      return item.distance <= AROUND_SEARCH_RADIUS_METERS;
    })
    .sort(function sortByDistance(a, b) {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;

      return a.distance - b.distance;
    });
}

function aroundIsSamePlace(a, b) {
  if (!a || !b) return false;

  const aLabel = String(a.label || a.lieu || a.place || '').trim().toLowerCase();
  const bLabel = String(b.label || b.lieu || b.place || '').trim().toLowerCase();

  const aPlace = String(a.lieu || a.place || '').trim().toLowerCase();
  const bPlace = String(b.lieu || b.place || '').trim().toLowerCase();

  if (aLabel && bLabel && aLabel === bLabel) return true;
  if (aPlace && bPlace && aPlace === bPlace) return true;

  const aCoords = aroundStepCoords(a);
  const bCoords = aroundStepCoords(b);

  if (!aCoords || !bCoords) return false;

  return aroundDistanceMeters(aCoords, bCoords) <= 4;
}

function aroundCardStyle() {
  return {
    background: 'var(--card)',
    borderRadius: 12,
    border: '1px solid var(--outline-variant)',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(82,98,91,0.05)'
  };
}

function aroundHeaderStyle() {
  return {
    padding: '12px 16px',
    background: 'var(--soft)',
    borderBottom: '1px solid var(--outline-variant)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  };
}

function AroundStepWidgetV2({ step, editMode, onRemove }) {
  const { trip, selectedDayIndex = 0 } = Store.useStore();

  const [categoryId, setCategoryId] = React.useState('restaurant');
  const [items, setItems] = React.useState([]);
  const [state, setState] = React.useState('idle');
  const [lastError, setLastError] = React.useState('');

  const activeDay = trip && Array.isArray(trip.days)
    ? trip.days[selectedDayIndex]
    : null;

  const category = aroundCategoryById(categoryId);
  const sourceCoords = aroundStepCoords(step);

  React.useEffect(function resetOnStepChange() {
    setItems([]);
    setState('idle');
    setLastError('');
  }, [step && step.id]);

  function selectCategory(nextCategoryId) {
    setCategoryId(nextCategoryId);
    setItems([]);
    setState('idle');
    setLastError('');
  }

  async function searchPlacesAroundStep() {
    if (!step) {
      setItems([]);
      setState('idle');
      return;
    }

    if (!sourceCoords) {
      setItems([]);
      setState('missing');
      return;
    }

    const currentCategory = aroundCategoryById(categoryId);

    setState('loading');
    setItems([]);
    setLastError('');

    try {
      const response = await window.SB.searchPlaces({
        query: currentCategory.query,
        type: currentCategory.type,
        lat: sourceCoords.lat,
        lng: sourceCoords.lng,
        limit: 16,
        language: 'fr'
      });

      const rawResults = aroundExtractResults(response);
      const normalized = aroundNormalizeResults(
        rawResults,
        currentCategory,
        sourceCoords
      );

      setItems(normalized);
      setState(normalized.length ? 'ready' : 'empty');
    } catch (error) {
      setItems([]);
      setState('error');
      setLastError(error && error.message ? error.message : String(error || 'Erreur inconnue'));
    }
  }

  function isAlreadyInDay(item) {
    if (!activeDay || !Array.isArray(activeDay.steps)) return false;

    const comparable = {
      label: item.label,
      lieu: item.place,
      lat: item.lat,
      lng: item.lng
    };

    return activeDay.steps.some(function compare(stepInDay) {
      return aroundIsSamePlace(stepInDay, comparable);
    });
  }

  function itemToStepPayload(item) {
    const stepType = item.stepType || category.stepType || 'activite';

    const payload = {
      stepIndex: Array.isArray(activeDay && activeDay.steps)
        ? activeDay.steps.length
        : 0,
      type: stepType,
      label: item.label || 'Lieu',
      lieu: item.place || item.label || '',
      note: 'Ajouté depuis “Autour de ce lieu”'
    };

    if (item.lat !== null && item.lat !== undefined) payload.lat = item.lat;
    if (item.lng !== null && item.lng !== undefined) payload.lng = item.lng;
    if (item.website) payload.link = item.website;

    return payload;
  }

  async function addItemToDay(item) {
    if (!trip || !trip.id || !activeDay || !activeDay.id) {
      Store.showToast('Aucune journée active trouvée');
      return;
    }

    if (isAlreadyInDay(item)) {
      Store.showToast('Ce lieu est déjà dans la journée');
      return;
    }

    const payload = itemToStepPayload(item);

    try {
      const savedStep = await window.SB.saveStep(trip.id, activeDay.id, payload);
      const refreshedTrip = await window.SB.loadTrip(trip.id);

      const refreshedDay = refreshedTrip && Array.isArray(refreshedTrip.days)
        ? refreshedTrip.days[selectedDayIndex]
        : null;

      const addedStep = refreshedDay && Array.isArray(refreshedDay.steps)
        ? refreshedDay.steps.find(function findAddedStep(stepInDay) {
            if (savedStep && savedStep.id && stepInDay.id === savedStep.id) {
              return true;
            }

            return aroundIsSamePlace(stepInDay, payload);
          })
        : null;

      Store.set({
        trip: refreshedTrip,
        selectedDayIndex,
        selectedStepId: addedStep && addedStep.id ? addedStep.id : null,
        pendingEditStepId: addedStep && addedStep.id ? addedStep.id : null
      });

      Store.showToast(
        payload.type === 'restaurant'
          ? 'Restaurant ajouté à la journée'
          : 'Lieu ajouté à la journée'
      );
    } catch (error) {
      Store.showToast('Erreur ajout : ' + (error.message || error));
    }
  }

  function openItemOnInternalMap(item) {
    if (item.lat === null || item.lng === null) {
      Store.showToast('Coordonnées manquantes pour ce lieu');
      return;
    }

    Store.openMapPreview({
      id: item.id || item.label,
      label: item.label,
      place: item.place || item.label,
      lat: item.lat,
      lng: item.lng,
      type: item.stepType || category.stepType || 'activite',
      sourceStepId: step && step.id ? step.id : null,
      sourceStepLabel: aroundStepName(step)
    });
  }

  function renderEmptyState() {
    return (
      <div style={{
        padding: 16,
        fontSize: 13,
        color: 'var(--muted)',
        lineHeight: '19px'
      }}>
        Sélectionne une étape dans l’itinéraire pour chercher des lieux autour d’elle.
      </div>
    );
  }

  function renderStatusMessage() {
    if (state === 'idle') {
      return (
        <div style={{
          fontSize: 12.5,
          lineHeight: '18px',
          color: 'var(--muted)',
          background: 'var(--inset)',
          borderRadius: 10,
          padding: '10px 12px'
        }}>
          Choisis une catégorie, puis clique sur “Voir les lieux”.
        </div>
      );
    }

    if (state === 'missing') {
      return (
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
      );
    }

    if (state === 'loading') {
      return (
        <div style={{
          fontSize: 12.5,
          color: 'var(--muted)',
          background: 'var(--inset)',
          borderRadius: 10,
          padding: '10px 12px'
        }}>
          Recherche des lieux proches…
        </div>
      );
    }

    if (state === 'empty') {
      return (
        <div style={{
          fontSize: 12.5,
          lineHeight: '18px',
          color: 'var(--muted)',
          background: 'var(--inset)',
          borderRadius: 10,
          padding: '10px 12px'
        }}>
          Aucun lieu proche trouvé dans un rayon d’environ 8 km. Vérifie la localisation de l’étape ou essaie une autre catégorie.
        </div>
      );
    }

    if (state === 'error') {
      return (
        <div style={{
          fontSize: 12.5,
          lineHeight: '18px',
          color: '#c0563f',
          background: 'rgba(192,86,63,.10)',
          borderRadius: 10,
          padding: '10px 12px'
        }}>
          Recherche indisponible pour le moment.
          {lastError ? (
            <span style={{ display: 'block', marginTop: 4, opacity: 0.75 }}>
              {lastError}
            </span>
          ) : null}
        </div>
      );
    }

    return null;
  }

  function renderCategoryButtons() {
    return (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6
      }}>
        {AROUND_CATEGORIES.map(function renderCategoryButton(item) {
          const selected = categoryId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectCategory(item.id)}
              style={{
                border: '1px solid ' + (
                  selected
                    ? 'var(--accent)'
                    : 'var(--outline-variant)'
                ),
                background: selected ? 'var(--accent)' : 'var(--inset)',
                color: selected ? 'var(--accent-ink)' : 'var(--muted)',
                borderRadius: 999,
                padding: '6px 10px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11,
                fontWeight: 800
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  function renderResultItem(item, index) {
    const alreadyAdded = isAlreadyInDay(item);

    return (
      <div
        key={item.id || index}
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
            minWidth: 0,
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--text)',
            lineHeight: '17px'
          }}>
            {item.label}
          </div>

          {item.distance !== null && (
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
              {aroundDistanceLabel(item.distance)}
            </span>
          )}
        </div>

        <div style={{
          fontSize: 12,
          lineHeight: '17px',
          color: 'var(--muted)',
          marginBottom: 9
        }}>
          {item.place || 'Lieu proche'}
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6
        }}>
          <button
            type="button"
            disabled={alreadyAdded}
            onClick={() => addItemToDay(item)}
            style={{
              border: '1px solid var(--outline-variant)',
              background: alreadyAdded ? 'var(--inset)' : 'var(--accent-soft)',
              color: alreadyAdded ? 'var(--faint)' : 'var(--accent)',
              borderRadius: 999,
              padding: '6px 10px',
              cursor: alreadyAdded ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              fontSize: 11,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {alreadyAdded ? 'Déjà ajouté' : '+ Ajouter à la journée'}
          </button>

          <button
            type="button"
            onClick={() => openItemOnInternalMap(item)}
            style={{
              border: '1px solid var(--outline-variant)',
              background: 'var(--card)',
              color: 'var(--text)',
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
    );
  }

  return (
    <div style={aroundCardStyle()}>
      <div style={aroundHeaderStyle()}>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Icon name="pin" size={16} style={{ color: 'var(--tan)' }} />
          Autour de ce lieu
        </span>

        {editMode && (
          <button
            type="button"
            onClick={onRemove}
            style={{
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
            }}
          >
            {'\u00d7'}
          </button>
        )}
      </div>

      {!step ? renderEmptyState() : (
        <div style={{ padding: 16 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: 'var(--faint)',
            marginBottom: 5
          }}>
            Étape sélectionnée
          </div>

          <div style={{
            fontSize: 15,
            fontWeight: 800,
            color: 'var(--text)',
            marginBottom: 4,
            lineHeight: '20px'
          }}>
            {aroundStepName(step)}
          </div>

          {aroundStepSub(step) && (
            <div style={{
              fontSize: 12.5,
              color: 'var(--muted)',
              lineHeight: '18px',
              marginBottom: 12
            }}>
              {aroundStepSub(step)}
            </div>
          )}

          {!aroundStepSub(step) && (
            <div style={{
              fontSize: 12.5,
              color: 'var(--muted)',
              lineHeight: '18px',
              marginBottom: 12
            }}>
              Recherche de lieux proches à partir des coordonnées de cette étape.
            </div>
          )}

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            {renderCategoryButtons()}

            <button
              type="button"
              onClick={searchPlacesAroundStep}
              disabled={state === 'loading'}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid var(--outline-variant)',
                background: state === 'loading' ? 'var(--soft)' : 'var(--accent)',
                color: state === 'loading' ? 'var(--muted)' : 'var(--accent-ink)',
                cursor: state === 'loading' ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <Icon name="chevright" size={13} />
              {state === 'loading'
                ? 'Recherche…'
                : 'Voir les lieux · ' + category.label}
            </button>

            {renderStatusMessage()}

            {items.length > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                {items.map(renderResultItem)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

window.AroundStepWidgetV2 = AroundStepWidgetV2;
window.AroundStepWidget = AroundStepWidgetV2;