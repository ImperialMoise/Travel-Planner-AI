// ════════════════════════════════════════════════════════════
// Map.js — Carte interactive Atelier
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Afficher les journées et étapes du voyage sur MapLibre.
// - Zoomer sur une journée, une étape ou un lieu externe.
// - Permettre de localiser une étape en cliquant sur la carte.
// - Recevoir les intentions depuis Store :
//   - mapFocusStepId
//   - mapPreviewPlace
//   - mapPickMode / mapLocateStep / mapPickResult
//
// Dépendances globales : React, maplibregl, Store, Icon, window.SB
// ════════════════════════════════════════════════════════════

const MAPTILER_KEY = '08IwMKKAkP3BQJss5poF';

const MAP_STYLES = {
  light: 'https://api.maptiler.com/maps/streets-v2/style.json?key=' + MAPTILER_KEY + '&language=fr',
  dark: 'https://api.maptiler.com/maps/streets-v2-dark/style.json?key=' + MAPTILER_KEY + '&language=fr',
  satellite: 'https://api.maptiler.com/maps/hybrid/style.json?key=' + MAPTILER_KEY + '&language=fr'
};

const MAP_FALLBACK_CENTER = [2.3522, 48.8566];

const MAP_DEMO_TRIP = {
  name: 'Voyage',
  days: [
    {
      id: 'demo-1',
      n: 1,
      title: 'Première journée',
      dateISO: '',
      city: 'Paris',
      region: 'Démo',
      center: MAP_FALLBACK_CENTER,
      zoom: 12,
      note: '',
      steps: []
    }
  ]
};

const MAP_VIEW_CSS = `
.mv2-frame{
  flex:1;
  min-height:0;
  min-width:0;
  display:flex;
  background:var(--bg);
  color:var(--text);
  overflow:hidden;
}
.mv2-side{
  width:300px;
  flex-shrink:0;
  min-height:0;
  display:flex;
  flex-direction:column;
  border-right:1px solid var(--outline-variant);
  background:var(--card);
  box-shadow:4px 0 24px rgba(45,73,63,.05);
}
.mv2-side-head{
  padding:22px 22px 18px;
  border-bottom:1px solid var(--outline-variant);
  background:var(--soft);
}
.mv2-kicker{
  font-size:11px;
  font-weight:800;
  letter-spacing:.16em;
  text-transform:uppercase;
  color:var(--accent);
}
.mv2-title{
  margin-top:4px;
  font-family:var(--font-serif);
  font-style:italic;
  font-size:25px;
  line-height:31px;
  color:var(--text);
}
.mv2-muted{
  color:var(--muted);
}
.mv2-days{
  flex:1;
  min-height:0;
  overflow-y:auto;
  padding:12px;
}
.mv2-day-btn{
  width:100%;
  border:1px solid transparent;
  background:transparent;
  color:var(--text);
  border-radius:14px;
  padding:12px 12px;
  text-align:left;
  cursor:pointer;
  font-family:inherit;
  display:flex;
  gap:10px;
  transition:background .15s,border-color .15s,transform .15s;
}
.mv2-day-btn:hover{background:var(--inset)}
.mv2-day-btn.active{
  background:var(--accent-soft);
  border-color:var(--accent);
}
.mv2-day-num{
  width:30px;
  height:30px;
  border-radius:999px;
  background:var(--inset);
  color:var(--muted);
  display:grid;
  place-items:center;
  flex-shrink:0;
  font-size:11px;
  font-weight:900;
  font-family:var(--font-mono,ui-monospace);
}
.mv2-day-btn.active .mv2-day-num{
  background:var(--accent);
  color:var(--accent-ink);
}
.mv2-day-name{
  font-size:13.5px;
  font-weight:800;
  line-height:18px;
  color:var(--text);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.mv2-day-meta{
  margin-top:3px;
  font-size:11.5px;
  line-height:16px;
  color:var(--muted);
}
.mv2-map-area{
  flex:1;
  min-width:0;
  min-height:0;
  position:relative;
  background:var(--inset);
}
#mv2-map{
  position:absolute;
  inset:0;
}
.mv2-panel{
  position:absolute;
  left:18px;
  bottom:18px;
  width:340px;
  max-width:calc(100% - 36px);
  max-height:calc(100% - 36px);
  display:flex;
  flex-direction:column;
  border:1px solid var(--outline-variant);
  background:var(--card);
  color:var(--text);
  border-radius:18px;
  box-shadow:0 24px 70px rgba(0,0,0,.22);
  overflow:hidden;
  z-index:5;
}
.mv2-panel-head{
  padding:16px 16px 14px;
  border-bottom:1px solid var(--outline-variant);
  background:var(--soft);
}
.mv2-panel-body{
  padding:13px 14px 14px;
  overflow-y:auto;
  min-height:0;
}
.mv2-step-row{
  border:1px solid var(--outline-variant);
  background:var(--inset);
  border-radius:12px;
  padding:10px;
  display:flex;
  align-items:center;
  gap:10px;
  cursor:pointer;
  margin-bottom:8px;
  font-family:inherit;
  color:var(--text);
  width:100%;
  text-align:left;
}
.mv2-step-row:hover{border-color:var(--accent)}
.mv2-step-row.missing{
  border-style:dashed;
  background:var(--accent-soft);
}
.mv2-step-icon{
  width:30px;
  height:30px;
  border-radius:10px;
  display:grid;
  place-items:center;
  flex-shrink:0;
  background:var(--card);
  color:var(--accent);
}
.mv2-step-name{
  font-size:13px;
  font-weight:800;
  line-height:17px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.mv2-step-sub{
  margin-top:2px;
  font-size:11.5px;
  line-height:16px;
  color:var(--muted);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.mv2-step-time{
  margin-left:auto;
  flex-shrink:0;
  font-size:11px;
  font-weight:800;
  color:var(--muted);
  font-family:var(--font-mono,ui-monospace);
}
.mv2-controls{
  position:absolute;
  top:16px;
  left:16px;
  right:16px;
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
  pointer-events:none;
  z-index:6;
}
.mv2-search{
  width:min(430px,calc(100% - 140px));
  border:1px solid var(--outline-variant);
  background:var(--card);
  color:var(--text);
  border-radius:999px;
  box-shadow:0 12px 32px rgba(0,0,0,.14);
  display:flex;
  align-items:center;
  gap:8px;
  padding:8px 10px 8px 13px;
  pointer-events:auto;
}
.mv2-search input{
  flex:1;
  min-width:0;
  border:none;
  outline:none;
  background:transparent;
  color:var(--text);
  font-family:inherit;
  font-size:13px;
}
.mv2-search button,
.mv2-layer button,
.mv2-small-btn{
  border:1px solid var(--outline-variant);
  background:var(--inset);
  color:var(--text);
  border-radius:999px;
  height:32px;
  padding:0 11px;
  cursor:pointer;
  font-family:inherit;
  font-size:12px;
  font-weight:800;
}
.mv2-layer{
  display:flex;
  gap:6px;
  border:1px solid var(--outline-variant);
  background:var(--card);
  border-radius:999px;
  padding:6px;
  box-shadow:0 12px 32px rgba(0,0,0,.14);
  pointer-events:auto;
}
.mv2-layer button.active{
  background:var(--accent);
  color:var(--accent-ink);
  border-color:var(--accent);
}
.mv2-results{
  position:absolute;
  top:64px;
  left:16px;
  width:min(430px,calc(100% - 32px));
  max-height:310px;
  overflow-y:auto;
  background:var(--card);
  border:1px solid var(--outline-variant);
  border-radius:16px;
  box-shadow:0 18px 46px rgba(0,0,0,.18);
  z-index:7;
}
.mv2-result{
  width:100%;
  border:none;
  border-bottom:1px solid var(--outline-variant);
  background:transparent;
  color:var(--text);
  padding:11px 13px;
  cursor:pointer;
  text-align:left;
  font-family:inherit;
}
.mv2-result:hover{background:var(--inset)}
.mv2-result:last-child{border-bottom:none}
.mv2-toastbar{
  position:absolute;
  top:76px;
  right:16px;
  max-width:360px;
  background:var(--card);
  color:var(--text);
  border:1px solid var(--outline-variant);
  border-radius:14px;
  padding:12px 14px;
  box-shadow:0 18px 46px rgba(0,0,0,.18);
  z-index:8;
  font-size:13px;
  line-height:18px;
}
.mv2-marker-day{
  width:32px;
  height:32px;
  border-radius:999px;
  background:var(--accent);
  color:var(--accent-ink);
  border:2px solid var(--card);
  box-shadow:0 6px 18px rgba(0,0,0,.28);
  display:grid;
  place-items:center;
  font-size:12px;
  font-weight:900;
  font-family:var(--font-mono,ui-monospace);
  cursor:pointer;
}
.mv2-marker-day.active{
  transform:scale(1.15);
  box-shadow:0 0 0 6px var(--accent-soft),0 8px 24px rgba(0,0,0,.28);
}
.mv2-marker-step{
  width:30px;
  height:30px;
  border-radius:999px;
  background:var(--card);
  color:var(--accent);
  border:2px solid var(--accent);
  box-shadow:0 6px 18px rgba(0,0,0,.22);
  display:grid;
  place-items:center;
  font-size:11px;
  font-weight:900;
  cursor:pointer;
}
.mv2-marker-preview{
  width:38px;
  height:38px;
  border-radius:999px;
  background:var(--accent);
  color:var(--accent-ink);
  border:2px solid var(--card);
  box-shadow:0 0 0 7px var(--accent-soft),0 12px 28px rgba(0,0,0,.32);
  display:grid;
  place-items:center;
  font-size:18px;
  font-weight:900;
}
@media(max-width:900px){
  .mv2-side{display:none}
  .mv2-panel{width:auto;left:12px;right:12px;bottom:12px;max-width:none}
  .mv2-controls{left:12px;right:12px;top:12px}
  .mv2-search{width:100%}
  .mv2-layer{display:none}
}
`;

function mapInjectCss() {
  if (document.getElementById('mv2-css')) return;

  const style = document.createElement('style');
  style.id = 'mv2-css';
  style.textContent = MAP_VIEW_CSS;
  document.head.appendChild(style);
}

function mapDateLabel(iso) {
  if (!iso) return '';

  const date = new Date(String(iso) + 'T12:00:00');

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

function mapSafeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapStepCoords(step) {
  if (!step) return null;

  const lat = mapSafeNumber(step.lat);
  const lng = mapSafeNumber(step.lng);

  if (lat === null || lng === null) return null;

  return [lng, lat];
}

function mapStepName(step) {
  if (!step) return 'Étape';

  return String(
    step.label ||
    step.lieu ||
    step.place ||
    step.arrivee ||
    step.depart ||
    step.type ||
    'Étape'
  ).trim();
}

function mapStepSub(step) {
  if (!step) return '';

  if (step.type === 'transport') {
    return [step.depart, step.arrivee].filter(Boolean).join(' → ');
  }

  return String(step.lieu || step.place || step.note || '').trim();
}

function mapStepIcon(step) {
  const type = String(step && step.type || '').toLowerCase();

  if (type === 'transport') return 'route';
  if (type === 'logement') return 'bed';
  if (type === 'restaurant' || type === 'table') return 'fork';
  if (type === 'activite') return 'camera';

  return 'pin';
}

function mapStepTypeLabel(step) {
  const type = String(step && step.type || '').toLowerCase();

  if (type === 'transport') return 'Transport';
  if (type === 'logement') return 'Hébergement';
  if (type === 'restaurant' || type === 'table') return 'Restaurant';
  if (type === 'activite') return 'Activité';

  return 'Étape';
}

function mapBoundsFromPoints(points) {
  const bounds = new maplibregl.LngLatBounds();
  let count = 0;

  points.forEach(function addPoint(point) {
    if (!Array.isArray(point)) return;
    if (!Number.isFinite(Number(point[0])) || !Number.isFinite(Number(point[1]))) return;

    bounds.extend(point);
    count += 1;
  });

  return count ? bounds : null;
}

function mapTripFromRealTrip(realTrip) {
  if (!realTrip || !Array.isArray(realTrip.days) || !realTrip.days.length) {
    return MAP_DEMO_TRIP;
  }

  const days = realTrip.days.map(function buildDay(day, index) {
    const rawSteps = Array.isArray(day.steps) ? day.steps : [];

    const steps = rawSteps.map(function buildStep(step, stepIndex) {
      const coords = mapStepCoords(step);

      return {
        id: step.id || 'step-' + index + '-' + stepIndex,
        raw: step,
        index: stepIndex,
        type: step.type || 'autre',
        label: mapStepName(step),
        sub: mapStepSub(step),
        time: step.time || step.timeCheckIn || step.timeCheckOut || '',
        coords
      };
    });

    const firstStepWithCoords = steps.find(function hasCoords(step) {
      return !!step.coords;
    });

    const center = firstStepWithCoords
      ? firstStepWithCoords.coords
      : MAP_FALLBACK_CENTER;

    return {
      id: day.id || 'day-' + index,
      raw: day,
      index,
      n: day.index != null ? day.index + 1 : index + 1,
      title: day.title || 'Journée libre',
      dateISO: day.dateISO || '',
      note: day.note || '',
      center,
      zoom: firstStepWithCoords ? 13.5 : 5,
      steps
    };
  });

  return {
    id: realTrip.id,
    name: realTrip.name || 'Mon voyage',
    startDate: realTrip.startDate || '',
    endDate: realTrip.endDate || '',
    days
  };
}

function mapFormatTripDates(trip) {
  const parts = [trip && trip.startDate, trip && trip.endDate].filter(Boolean);

  if (!parts.length) return '';
  if (parts.length === 1) return mapDateLabel(parts[0]);

  return mapDateLabel(parts[0]) + ' → ' + mapDateLabel(parts[1]);
}

function mapSearchLabel(feature) {
  const props = feature && feature.properties ? feature.properties : {};

  return String(
    props.name ||
    props.label ||
    props.formatted ||
    feature.place_name ||
    feature.text ||
    'Lieu'
  ).trim();
}

function mapSearchSub(feature) {
  const props = feature && feature.properties ? feature.properties : {};

  return String(
    props.formatted ||
    feature.place_name ||
    props.address_line2 ||
    props.city ||
    ''
  ).trim();
}

function mapSearchCoords(feature) {
  if (!feature) return null;

  if (Array.isArray(feature.center)) return feature.center;

  if (feature.geometry && Array.isArray(feature.geometry.coordinates)) {
    return feature.geometry.coordinates;
  }

  const props = feature.properties || {};
  const lat = mapSafeNumber(props.lat);
  const lng = mapSafeNumber(props.lon || props.lng);

  if (lat === null || lng === null) return null;

  return [lng, lat];
}

function MapView() {
  mapInjectCss();

  const {
    trip: realTrip,
    theme = localStorage.getItem('it_theme') || 'light',
    selectedDayIndex = 0,
    mapFocusStepId,
    mapPreviewPlace,
    mapPickMode,
    mapLocateStep,
    mapPickResult
  } = Store.useStore();

  const mapTrip = React.useMemo(function memoTrip() {
    return mapTripFromRealTrip(realTrip);
  }, [realTrip]);

  const mapNodeRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const dayMarkersRef = React.useRef([]);
  const stepMarkersRef = React.useRef([]);
  const previewMarkerRef = React.useRef(null);
  const initializedRef = React.useRef(false);

  const [selectedIndex, setSelectedIndex] = React.useState(
    Math.min(selectedDayIndex || 0, Math.max(0, mapTrip.days.length - 1))
  );
  const [mapStyle, setMapStyle] = React.useState('auto');
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [searching, setSearching] = React.useState(false);
  const [focusedPlace, setFocusedPlace] = React.useState(null);

  const selectedDay = mapTrip.days[selectedIndex] || mapTrip.days[0];
  const isLocatingStep = mapPickMode === 'locate-step' && !!mapLocateStep;

  React.useEffect(function syncSelectedDayFromStore() {
    const nextIndex = Math.min(
      selectedDayIndex || 0,
      Math.max(0, mapTrip.days.length - 1)
    );

    if (nextIndex !== selectedIndex) {
      selectDay(nextIndex, true);
    }
  }, [selectedDayIndex, mapTrip.days.length]);

  React.useEffect(function initMap() {
    if (!mapNodeRef.current || mapRef.current) return;

    const styleUrl = theme === 'dark' ? MAP_STYLES.dark : MAP_STYLES.light;

    const map = new maplibregl.Map({
      container: mapNodeRef.current,
      style: styleUrl,
      center: selectedDay ? selectedDay.center : MAP_FALLBACK_CENTER,
      zoom: selectedDay ? selectedDay.zoom : 3,
      pitch: 36,
      bearing: 0,
      attributionControl: true
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({
      visualizePitch: true
    }), 'bottom-right');

    map.on('load', function handleLoad() {
      initializedRef.current = true;
      rebuildDayMarkers();
      selectDay(selectedIndex, true);
    });

    map.on('click', function handleMapClick(event) {
      const current = Store.get();

      if (current.mapPickMode === 'locate-step') {
        pickMapPoint('Position choisie', [event.lngLat.lng, event.lngLat.lat], '');
      }
    });

    return function cleanupMap() {
      clearPreviewMarker();
      clearDayMarkers();
      clearStepMarkers();

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  React.useEffect(function rebuildMarkersWhenTripChanges() {
    if (!initializedRef.current) return;

    rebuildDayMarkers();

    const safeIndex = Math.min(selectedIndex, Math.max(0, mapTrip.days.length - 1));
    selectDay(safeIndex, false);
  }, [mapTrip.id, mapTrip.days.length]);

  React.useEffect(function applyThemeStyle() {
    const map = mapRef.current;
    if (!map || !initializedRef.current) return;

    const styleUrl = mapStyle === 'satellite'
      ? MAP_STYLES.satellite
      : theme === 'dark'
        ? MAP_STYLES.dark
        : MAP_STYLES.light;

    map.setStyle(styleUrl);

    map.once('styledata', function afterStyleChange() {
      rebuildDayMarkers();
      selectDay(selectedIndex, false);
    });
  }, [theme, mapStyle]);

  React.useEffect(function focusRequestedStep() {
    if (!mapFocusStepId) return;

    const timer = window.setTimeout(function runFocus() {
      focusStepById(mapFocusStepId);
    }, 220);

    return function cleanup() {
      window.clearTimeout(timer);
    };
  }, [mapFocusStepId, mapTrip.id]);

  React.useEffect(function focusRequestedPreviewPlace() {
    if (!mapPreviewPlace) return;

    const timer = window.setTimeout(function runFocus() {
      focusPreviewPlace(mapPreviewPlace);
    }, 240);

    return function cleanup() {
      window.clearTimeout(timer);
    };
  }, [
    mapPreviewPlace && mapPreviewPlace.id,
    mapPreviewPlace && mapPreviewPlace.lat,
    mapPreviewPlace && mapPreviewPlace.lng
  ]);

  React.useEffect(function saveLocatedStepWhenPicked() {
    if (!mapPickResult || mapPickResult.field !== 'locate-step') return;
    if (!mapLocateStep || !realTrip || !window.SB) return;

    const coords = mapPickResult.coords || [];
    const lng = mapSafeNumber(coords[0]);
    const lat = mapSafeNumber(coords[1]);

    if (lat === null || lng === null) {
      Store.set({
        mapPickResult: null,
        mapPickMode: null,
        mapLocateStep: null
      });
      return;
    }

    const sourceDay = (realTrip.days || []).find(function findDay(day) {
      return String(day.id) === String(mapLocateStep.dayId);
    });

    const sourceStep = sourceDay && (sourceDay.steps || []).find(function findStep(step) {
      return String(step.id) === String(mapLocateStep.stepId);
    });

    if (!sourceDay || !sourceStep) {
      Store.showToast('Étape introuvable');
      Store.set({
        mapPickResult: null,
        mapPickMode: null,
        mapLocateStep: null
      });
      return;
    }

    async function saveLocation() {
      try {
        await window.SB.saveStep(realTrip.id, sourceDay.id, {
          ...sourceStep,
          lat,
          lng,
          lieu: sourceStep.lieu || mapPickResult.text || sourceStep.label || '',
          stepIndex: sourceStep.stepIndex || 0
        });

        const refreshed = await window.SB.loadTrip(realTrip.id);
        const nextIndex = refreshed.days.findIndex(function findRefreshedDay(day) {
          return String(day.id) === String(sourceDay.id);
        });

        Store.set({
          trip: refreshed,
          selectedDayIndex: nextIndex >= 0 ? nextIndex : selectedDayIndex,
          selectedStepId: sourceStep.id,
          mapPickResult: null,
          mapPickMode: null,
          mapLocateStep: null,
          mapFocusStepId: sourceStep.id
        });

        Store.showToast('Localisation enregistrée');
      } catch (error) {
        Store.showToast('Erreur localisation : ' + (error.message || error));
        Store.set({
          mapPickResult: null,
          mapPickMode: null,
          mapLocateStep: null
        });
      }
    }

    saveLocation();
  }, [mapPickResult, mapLocateStep, realTrip && realTrip.id]);

  function clearDayMarkers() {
    dayMarkersRef.current.forEach(function removeMarker(item) {
      item.marker.remove();
    });

    dayMarkersRef.current = [];
  }

  function clearStepMarkers() {
    stepMarkersRef.current.forEach(function removeMarker(marker) {
      marker.remove();
    });

    stepMarkersRef.current = [];
  }

  function clearPreviewMarker() {
    if (previewMarkerRef.current) {
      previewMarkerRef.current.remove();
      previewMarkerRef.current = null;
    }
  }

  function rebuildDayMarkers() {
    const map = mapRef.current;
    if (!map || !initializedRef.current) return;

    clearDayMarkers();

    mapTrip.days.forEach(function addDayMarker(day, index) {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'mv2-marker-day' + (index === selectedIndex ? ' active' : '');
      element.textContent = String(day.n);
      element.title = 'Jour ' + day.n + ' · ' + day.title;

      element.addEventListener('click', function onMarkerClick(event) {
        event.stopPropagation();
        selectDay(index, true);
      });

      const marker = new maplibregl.Marker({
        element,
        anchor: 'center'
      })
        .setLngLat(day.center)
        .addTo(map);

      dayMarkersRef.current.push({
        marker,
        element,
        index
      });
    });
  }

  function setActiveDayMarker(index) {
    dayMarkersRef.current.forEach(function updateMarker(item) {
      item.element.classList.toggle('active', item.index === index);
    });
  }

  function showStepMarkers(day) {
    const map = mapRef.current;
    if (!map || !day) return;

    clearStepMarkers();
    clearPreviewMarker();

    const stepsWithCoords = (day.steps || []).filter(function hasCoords(step) {
      return !!step.coords;
    });

    stepsWithCoords.forEach(function addStepMarker(step, index) {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'mv2-marker-step';
      element.textContent = String(index + 1);
      element.title = step.label;

      element.addEventListener('click', function onStepMarkerClick(event) {
        event.stopPropagation();
        focusStep(step, false);
      });

      const marker = new maplibregl.Marker({
        element,
        anchor: 'center'
      })
        .setLngLat(step.coords)
        .addTo(map);

      stepMarkersRef.current.push(marker);
    });
  }

  function selectDay(index, shouldFly) {
    const safeIndex = Math.min(
      Math.max(0, Number(index) || 0),
      Math.max(0, mapTrip.days.length - 1)
    );

    const nextDay = mapTrip.days[safeIndex];

    setSelectedIndex(safeIndex);
    setFocusedPlace(null);
    setSearchResults([]);
    setActiveDayMarker(safeIndex);
    showStepMarkers(nextDay);

    if (Store.get().selectedDayIndex !== safeIndex) {
      Store.set({ selectedDayIndex: safeIndex });
    }

    if (shouldFly) {
      flyToDay(nextDay);
    }
  }

  function flyToDay(day) {
    const map = mapRef.current;
    if (!map || !day) return;

    const points = (day.steps || [])
      .map(function getCoords(step) {
        return step.coords;
      })
      .filter(Boolean);

    if (points.length >= 2) {
      const bounds = mapBoundsFromPoints(points);

      if (bounds) {
        map.fitBounds(bounds, {
          padding: {
            top: 100,
            bottom: 220,
            left: 90,
            right: 90
          },
          maxZoom: 15.5,
          duration: 1200
        });
        return;
      }
    }

    map.flyTo({
      center: points[0] || day.center,
      zoom: points[0] ? 15 : day.zoom || 6,
      pitch: points[0] ? 42 : 20,
      bearing: 0,
      duration: 1100,
      essential: true
    });
  }

  function fitWholeTrip() {
    const map = mapRef.current;
    if (!map) return;

    setFocusedPlace(null);
    clearPreviewMarker();
    clearStepMarkers();
    setSelectedIndex(null);
    Store.set({ selectedStepId: null });

    const points = mapTrip.days
      .map(function getCenter(day) {
        return day.center;
      })
      .filter(Boolean);

    const bounds = mapBoundsFromPoints(points);

    if (!bounds) return;

    map.fitBounds(bounds, {
      padding: 90,
      duration: 1200,
      maxZoom: 7
    });
  }

  function focusStep(step, updateStore) {
    const map = mapRef.current;
    if (!map || !step) return;

    if (!step.coords) {
      startLocateStep(step);
      return;
    }

    setFocusedPlace({
      kind: 'step',
      label: step.label,
      place: step.sub,
      lat: step.coords[1],
      lng: step.coords[0],
      type: step.type,
      step
    });

    if (updateStore !== false) {
      Store.set({ selectedStepId: step.id });
    }

    map.flyTo({
      center: step.coords,
      zoom: Math.max(map.getZoom(), 16.5),
      pitch: 48,
      bearing: 0,
      duration: 1100,
      essential: true
    });
  }

  function focusStepById(stepId) {
    if (!stepId) return false;

    for (let dayIndex = 0; dayIndex < mapTrip.days.length; dayIndex += 1) {
      const day = mapTrip.days[dayIndex];
      const step = (day.steps || []).find(function findStep(item) {
        return String(item.id) === String(stepId);
      });

      if (!step) continue;

      selectDay(dayIndex, false);
      focusStep(step, true);

      Store.set({ mapFocusStepId: null });
      return true;
    }

    Store.set({ mapFocusStepId: null });
    return false;
  }

  function focusPreviewPlace(place) {
    const map = mapRef.current;
    if (!map || !place) return false;

    const lat = mapSafeNumber(place.lat);
    const lng = mapSafeNumber(place.lng);

    if (lat === null || lng === null) {
      Store.set({ mapPreviewPlace: null });
      return false;
    }

    clearPreviewMarker();

    const element = document.createElement('div');
    element.className = 'mv2-marker-preview';
    element.textContent = '•';

    previewMarkerRef.current = new maplibregl.Marker({
      element,
      anchor: 'center'
    })
      .setLngLat([lng, lat])
      .addTo(map);

    setFocusedPlace({
      kind: 'preview',
      label: place.label || 'Lieu',
      place: place.place || '',
      lat,
      lng,
      type: place.type || 'activite',
      sourceStepLabel: place.sourceStepLabel || ''
    });

    map.flyTo({
      center: [lng, lat],
      zoom: 17,
      pitch: 50,
      bearing: 0,
      duration: 1200,
      essential: true
    });

    Store.set({ mapPreviewPlace: null });
    return true;
  }

  function startLocateStep(step) {
    const selectedDay = mapTrip.days[selectedIndex];

    Store.startLocateStep({
      tripId: realTrip && realTrip.id,
      dayId: selectedDay && selectedDay.id,
      stepId: step && step.id
    });
  }

  function pickMapPoint(text, coords, address) {
    Store.set({
      mapPickResult: {
        field: 'locate-step',
        text: text || address || 'Position choisie',
        coords
      }
    });
  }

  async function runSearch() {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    try {
      const url =
        'https://api.maptiler.com/geocoding/' +
        encodeURIComponent(cleanQuery) +
        '.json?key=' +
        encodeURIComponent(MAPTILER_KEY) +
        '&language=fr,en' +
        '&limit=7';

      const response = await fetch(url);
      if (!response.ok) throw new Error('Recherche indisponible');

      const data = await response.json();
      setSearchResults(Array.isArray(data.features) ? data.features : []);
    } catch (error) {
      Store.showToast('Recherche carte indisponible');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function chooseSearchResult(feature) {
    const coords = mapSearchCoords(feature);

    if (!coords) {
      Store.showToast('Coordonnées manquantes');
      return;
    }

    const label = mapSearchLabel(feature);
    const sub = mapSearchSub(feature);

    setSearchResults([]);
    setQuery(label);

    if (isLocatingStep) {
      pickMapPoint(label, coords, sub);
      return;
    }

    focusPreviewPlace({
      id: feature.id || label,
      label,
      place: sub,
      lat: coords[1],
      lng: coords[0],
      type: 'search'
    });
  }

  function clearLocateMode() {
    Store.set({
      mapPickMode: null,
      mapPickResult: null,
      mapLocateStep: null
    });
  }

  function renderSide() {
    return (
      <aside className="mv2-side">
        <div className="mv2-side-head">
          <div className="mv2-kicker">Carte du voyage</div>
          <div className="mv2-title">{mapTrip.name || 'Mon voyage'}</div>
          <div style={{ marginTop: 5, fontSize: 12.5, color: 'var(--muted)' }}>
            {mapTrip.days.length} jour{mapTrip.days.length > 1 ? 's' : ''}
            {mapFormatTripDates(mapTrip) ? ' · ' + mapFormatTripDates(mapTrip) : ''}
          </div>

          <button
            type="button"
            onClick={fitWholeTrip}
            className="mv2-small-btn"
            style={{ marginTop: 12 }}
          >
            Voir tout le voyage
          </button>
        </div>

        <div className="mv2-days">
          {mapTrip.days.map(function renderDayButton(day, index) {
            const active = index === selectedIndex;
            const stepCount = day.steps.length;
            const locatedCount = day.steps.filter(function hasCoords(step) {
              return !!step.coords;
            }).length;

            return (
              <button
                key={day.id || index}
                type="button"
                onClick={() => selectDay(index, true)}
                className={'mv2-day-btn' + (active ? ' active' : '')}
              >
                <span className="mv2-day-num">{String(day.n).padStart(2, '0')}</span>

                <span style={{ minWidth: 0, flex: 1 }}>
                  <span className="mv2-day-name">{day.title || 'Journée libre'}</span>
                  <span className="mv2-day-meta">
                    {mapDateLabel(day.dateISO) || 'Date non définie'}
                    {' · '}
                    {stepCount} étape{stepCount > 1 ? 's' : ''}
                    {stepCount ? ' · ' + locatedCount + ' localisée' + (locatedCount > 1 ? 's' : '') : ''}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  function renderControls() {
    return (
      <>
        <div className="mv2-controls">
          <form
            className="mv2-search"
            onSubmit={function handleSubmit(event) {
              event.preventDefault();
              runSearch();
            }}
          >
            <Icon name="pin" size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={isLocatingStep ? 'Chercher le lieu de cette étape…' : 'Rechercher un lieu sur la carte…'}
            />
            <button type="submit">
              {searching ? '…' : 'Chercher'}
            </button>
          </form>

          <div className="mv2-layer">
            <button
              type="button"
              className={mapStyle !== 'satellite' ? 'active' : ''}
              onClick={() => setMapStyle('auto')}
            >
              Plan
            </button>
            <button
              type="button"
              className={mapStyle === 'satellite' ? 'active' : ''}
              onClick={() => setMapStyle('satellite')}
            >
              Satellite
            </button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="mv2-results">
            {searchResults.map(function renderResult(feature) {
              const label = mapSearchLabel(feature);
              const sub = mapSearchSub(feature);

              return (
                <button
                  key={feature.id || label}
                  type="button"
                  className="mv2-result"
                  onClick={() => chooseSearchResult(feature)}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
                    {label}
                  </div>
                  {sub && (
                    <div style={{ marginTop: 3, fontSize: 12, color: 'var(--muted)', lineHeight: '16px' }}>
                      {sub}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {isLocatingStep && (
          <div className="mv2-toastbar">
            <div style={{ fontWeight: 900, color: 'var(--accent)', marginBottom: 4 }}>
              Localisation d’étape
            </div>
            <div>
              Clique sur la carte ou cherche une adresse pour définir la position de cette étape.
            </div>
            <button
              type="button"
              onClick={clearLocateMode}
              className="mv2-small-btn"
              style={{ marginTop: 10 }}
            >
              Annuler
            </button>
          </div>
        )}
      </>
    );
  }

  function renderPanel() {
    const place = focusedPlace;

    if (place) {
      return (
        <div className="mv2-panel">
          <div className="mv2-panel-head">
            <div className="mv2-kicker">
              {place.kind === 'preview' ? 'Lieu sélectionné' : mapStepTypeLabel(place.step && place.step.raw)}
            </div>
            <div className="mv2-title">{place.label}</div>
            {place.place && (
              <div style={{ marginTop: 5, color: 'var(--muted)', fontSize: 12.5, lineHeight: '18px' }}>
                {place.place}
              </div>
            )}
          </div>

          <div className="mv2-panel-body">
            {place.sourceStepLabel && (
              <div style={{ marginBottom: 10, color: 'var(--muted)', fontSize: 12.5, lineHeight: '18px' }}>
                Depuis : <b style={{ color: 'var(--text)' }}>{place.sourceStepLabel}</b>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: 'var(--inset)', borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10, color: 'var(--faint)', marginBottom: 3 }}>Latitude</div>
                <div style={{ fontSize: 12, fontWeight: 900 }}>{Number(place.lat).toFixed(5)}</div>
              </div>
              <div style={{ background: 'var(--inset)', borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10, color: 'var(--faint)', marginBottom: 3 }}>Longitude</div>
                <div style={{ fontSize: 12, fontWeight: 900 }}>{Number(place.lng).toFixed(5)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                type="button"
                className="mv2-small-btn"
                style={{ flex: 1 }}
                onClick={() => {
                  clearPreviewMarker();
                  setFocusedPlace(null);
                  if (selectedDay) flyToDay(selectedDay);
                }}
              >
                Retour journée
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!selectedDay) return null;

    return (
      <div className="mv2-panel">
        <div className="mv2-panel-head">
          <div className="mv2-kicker">Jour {selectedDay.n}</div>
          <div className="mv2-title">{selectedDay.title || 'Journée libre'}</div>
          <div style={{ marginTop: 5, color: 'var(--muted)', fontSize: 12.5 }}>
            {mapDateLabel(selectedDay.dateISO) || 'Date non définie'}
          </div>
        </div>

        <div className="mv2-panel-body">
          {selectedDay.note && (
            <div style={{ marginBottom: 12, color: 'var(--muted)', fontSize: 13, lineHeight: '19px', fontStyle: 'italic' }}>
              {selectedDay.note}
            </div>
          )}

          {selectedDay.steps.length ? selectedDay.steps.map(function renderStep(step) {
            const missing = !step.coords;

            return (
              <button
                key={step.id}
                type="button"
                className={'mv2-step-row' + (missing ? ' missing' : '')}
                onClick={() => focusStep(step, true)}
              >
                <span className="mv2-step-icon">
                  <Icon name={missing ? 'pin' : mapStepIcon(step.raw)} size={15} />
                </span>

                <span style={{ minWidth: 0, flex: 1 }}>
                  <span className="mv2-step-name">{step.label}</span>
                  <span className="mv2-step-sub">
                    {missing ? 'Position à définir' : (step.sub || mapStepTypeLabel(step.raw))}
                  </span>
                </span>

                <span className="mv2-step-time">
                  {missing ? 'À localiser' : (step.time || '')}
                </span>
              </button>
            );
          }) : (
            <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: '19px' }}>
              Aucune étape localisée pour cette journée.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mv2-frame">
      {renderSide()}

      <section className="mv2-map-area">
        <div id="mv2-map" ref={mapNodeRef} />
        {renderControls()}
        {renderPanel()}
      </section>
    </div>
  );
}

window.MapView = MapView;