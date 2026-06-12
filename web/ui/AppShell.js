// ════════════════════════════════════════════════════════════
// AppShell.js — coquille principale de l'app.
// Topbar (logo + sélecteur voyage + actions) + zone de vue.
// ════════════════════════════════════════════════════════════

// ─── Écran d'erreur ─────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return React.createElement('div', { style: {
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at center, var(--bg), var(--soft))',
      padding: 24, textAlign: 'center'
    } },
      /* Compass SVG */
      React.createElement('div', { style: { marginBottom: 48, opacity: 0.9, color: 'var(--petrol)', animation: 'errSpin 80s linear infinite' } },
        React.createElement('svg', { width: 160, height: 160, viewBox: '0 0 160 160', fill: 'none', stroke: 'currentColor', strokeWidth: 1, strokeLinecap: 'round', strokeLinejoin: 'round' },
          React.createElement('circle', { cx: 80, cy: 80, r: 75, strokeOpacity: 0.3 }),
          React.createElement('circle', { cx: 80, cy: 80, r: 70 }),
          React.createElement('circle', { cx: 80, cy: 80, r: 62, strokeDasharray: '2 6', strokeOpacity: 0.7 }),
          React.createElement('path', { d: 'M80 5V25M80 135V155M5 80H25M135 80H155', strokeWidth: 1.5 }),
          React.createElement('path', { d: 'M80 15L88 80L80 145L72 80Z', fill: 'currentColor', fillOpacity: 0.05, strokeWidth: 0.5 }),
          React.createElement('path', { d: 'M80 15L88 80L80 80Z', fill: 'currentColor', fillOpacity: 0.8, stroke: 'none' }),
          React.createElement('path', { d: 'M80 145L72 80L80 80Z', fill: 'currentColor', fillOpacity: 0.1, stroke: 'none' }),
          React.createElement('circle', { cx: 80, cy: 80, r: 8, fill: 'var(--bg)', strokeWidth: 1.5 }),
          React.createElement('circle', { cx: 80, cy: 80, r: 3, fill: 'currentColor' }))),
      /* Texte */
      React.createElement('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 } }, 'Interruption de voyage'),
      React.createElement('div', { style: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 40, lineHeight: '48px', color: 'var(--petrol)', marginBottom: 16 } }, "L\u2019Atelier fait une pause"),
      React.createElement('p', { style: { fontSize: 15.5, lineHeight: '22px', color: 'var(--muted)', maxWidth: 480, marginBottom: 32 } },
        "Nous rencontrons un l\u00e9ger contretemps. Nos artisans travaillent \u00e0 r\u00e9tablir la connexion."),
      /* Boutons */
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, width: 280 } },
        React.createElement('button', { onClick: function() { window.location.reload(); }, style: {
          width: '100%', padding: '14px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
          background: 'var(--tan)', color: 'var(--petrol)',
          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,.1)'
        } }, '\u21bb Recharger la page'),
        React.createElement('button', { onClick: function() { this.setState({ hasError: false, error: null }); }.bind(this), style: {
          width: '100%', padding: '14px 0', borderRadius: 999, cursor: 'pointer',
          background: 'transparent', color: 'var(--outline)',
          border: '1px solid var(--outline-variant)',
          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        } }, 'Retenter sans recharger'))
    );
  }
}
window.ErrorBoundary = ErrorBoundary;

function AppShell() {
  const { user, authReady, view, trips, activeTripId, trip, toast, settingsOpen } = Store.useStore();
  const isCompactShell = typeof window !== 'undefined' && window.innerWidth < 1320;
  const isNarrowShell = typeof window !== 'undefined' && window.innerWidth < 1100;
  const sideWidth = isCompactShell ? 260 : 300;
  const toolWidth = isCompactShell ? 280 : 320;
  const [toolboxOpen, setToolboxOpen] = React.useState(false);
  const isTinyShell = typeof window !== 'undefined' && window.innerWidth < 900;
  const [daySpineOpen, setDaySpineOpen] = React.useState(false);
  const isTopbarCompact = typeof window !== 'undefined' && window.innerWidth < 1180;

  // ─── Vue active ───────────────────────────────────────────
  let CurrentView = null;
  if (view === 'itinerary') CurrentView = window.ItineraryView;
  else if (view === 'map')   CurrentView = window.MapView;
  else if (view === 'budget')CurrentView = window.BudgetView;
  else if (view === 'docs')  CurrentView = window.DocsView;

  if (!authReady) {
    return (
      <div className="boot">
        <div className="boot-mark">VP</div>
        <div className="boot-label">Connexion à Supabase…</div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100dvh',
      maxHeight: '100dvh',
      width: '100vw',
      maxWidth: '100vw',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--bg)'
    }}>
      {/* On cache la Topbar de l'app si le design de Claude est affiché (car il a la sienne) */}
      <Topbar compact={isTopbarCompact} />
      
      <main style={{
        flex: '1 1 0',
        height: 0,
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {!user ? <LoggedOutHome /> :
         !activeTripId ? <NoTripHome /> :
         !trip ? <LoadingTrip /> :
         <>
           {!isTinyShell && <DaySpine width={sideWidth} />}
{isTinyShell && daySpineOpen && (
  <div
    onClick={() => setDaySpineOpen(false)}
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 790,
      background: 'rgba(21,48,42,.28)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'flex-start'
    }}
  >
    <div onClick={e => e.stopPropagation()} style={{ height: '100%', maxWidth: 320, width: '86vw' }}>
      <DaySpine width="100%" onPickDay={() => setDaySpineOpen(false)} />
    </div>
  </div>
)}
           <div style={{
             flex: '1 1 0',
             width: 0,
             minWidth: 0,
             height: '100%',
             minHeight: 0,
             display: 'flex',
             flexDirection: 'column',
             overflow: 'hidden'
            }}>
             {CurrentView ? <CurrentView /> : <div style={{ padding: 40, color: 'var(--muted)' }}>Vue inconnue : {view}</div>}
           </div>
           {!isNarrowShell && <Toolbox width={toolWidth} />}
{isNarrowShell && toolboxOpen && (
  <div
    onClick={() => setToolboxOpen(false)}
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 800,
      background: 'rgba(21,48,42,.28)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'flex-end'
    }}
  >
    <div onClick={e => e.stopPropagation()} style={{ height: '100%', maxWidth: 320, width: '86vw' }}>
      <Toolbox width="100%" />
    </div>
  </div>
)}
         </>}
      </main>

{isTinyShell && user && activeTripId && trip && (
  <button
    onClick={() => setDaySpineOpen(true)}
    title="Ouvrir les jours"
    style={{
      position: 'fixed',
      left: 18,
      bottom: 18,
      zIndex: 700,
      height: 52,
      minWidth: 52,
      padding: '0 16px',
      borderRadius: 999,
      border: '1px solid var(--outline-variant)',
      background: 'var(--card)',
      color: 'var(--text)',
      boxShadow: 'var(--shadow-lg)',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      fontFamily: 'inherit',
      fontSize: 13,
      fontWeight: 800
    }}
  >
    <Icon name="cal" size={18} />
    Jours
  </button>
)}

{isNarrowShell && user && activeTripId && trip && (
  <button
    onClick={() => setToolboxOpen(true)}
    title="Ouvrir la boîte à outils"
    style={{
      position: 'fixed',
      right: 18,
      bottom: 18,
      zIndex: 700,
      width: 52,
      height: 52,
      borderRadius: '50%',
      border: '1px solid var(--outline-variant)',
      background: 'var(--accent)',
      color: 'var(--accent-ink)',
      boxShadow: 'var(--shadow-lg)',
      cursor: 'pointer',
      display: 'grid',
      placeItems: 'center'
    }}
  >
    <Icon name="gear" size={20} />
  </button>
)}

      {settingsOpen && window.SettingsModal && <window.SettingsModal />}
      {toast && <div className="toast show">{toast.msg}</div>}
    </div>
  );
}

// ─── Topbar ─────────────────────────────────────────────────
function DaySpine({ width = 300, onPickDay }) {
  const { trip, selectedDayIndex } = Store.useStore();
  if (!trip || !trip.days) return null;
  const days = trip.days;
  const sel = selectedDayIndex || 0;

  // ── Grouper les jours par semaine (7 jours max par groupe) ──
  // On essaye d'extraire la ville principale du premier logement de chaque semaine
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    // Cherche un logement dans cette semaine pour nommer le groupe
    let city = '';
    for (const d of chunk) {
      const lodge = (d.steps || []).find(s => s.type === 'logement');
      if (lodge && (lodge.place || lodge.label)) { city = lodge.place || lodge.label; break; }
    }
    weeks.push({
      label: `Semaine ${weeks.length + 1}${city ? ' : ' + city : ''}`,
      startIndex: i,
      days: chunk
    });
  }

  // La semaine qui contient le jour sélectionné est ouverte par défaut
  const activeWeekIdx = Math.floor(sel / 7);
  const [openWeeks, setOpenWeeks] = React.useState({ [activeWeekIdx]: true });

  // Quand le jour sélectionné change, ouvrir sa semaine
  React.useEffect(() => {
    const wi = Math.floor(sel / 7);
    setOpenWeeks(prev => ({ ...prev, [wi]: true }));
  }, [sel]);

  function toggleWeek(wi) {
    setOpenWeeks(prev => ({ ...prev, [wi]: !prev[wi] }));
  }

  // ── Couleurs des tags de type d'étape ──
  const TAG_COLORS = {
    transport: { bg: 'rgba(192,125,86,0.12)', color: '#c07d56', label: 'Transport' },
    logement:  { bg: 'rgba(180,132,62,0.12)',  color: '#b4843e', label: 'Logement' },
    activite:  { bg: 'rgba(89,123,114,0.12)',  color: '#597b72', label: 'Activité' },
    restaurant:{ bg: 'rgba(123,158,137,0.12)', color: '#7b9e89', label: 'Table' },
    autre:     { bg: 'rgba(130,117,103,0.12)', color: '#827567', label: 'Étape' }
  };

  return (
    <aside style={{
      width, flexShrink: 0, height: '100%', minHeight: 0,
      overflow: 'hidden', borderRight: '1px solid var(--outline-variant)',
      background: 'var(--bg)', display: 'flex', flexDirection: 'column',
      boxShadow: '4px 0 24px rgba(45,73,63,0.05)'
    }}>

      {/* ── En-tête ── */}
      <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--outline-variant)' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '.2em',
          textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4
        }}>Itinéraire</div>
        <div style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 24, lineHeight: '30px', color: 'var(--text)'
        }}>{trip.name || 'Mon voyage'}</div>
        <div style={{
          fontSize: 13, color: 'var(--muted)', marginTop: 6,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <Icon name="cal" size={15} style={{ color: 'var(--muted)' }} />
          {days.length} jour{days.length > 1 ? 's' : ''}
          {trip.startDate ? ' · ' + fmtDate(trip.startDate) : ''}
        </div>
      </div>

      {/* ── Semaines pliables ── */}
      <div style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto', padding: '12px 12px 20px' }}>

        {weeks.map((week, wi) => {
          const isOpen = !!openWeeks[wi];
          const containsSelected = sel >= week.startIndex && sel < week.startIndex + week.days.length;

          return (
            <div key={wi} style={{ marginBottom: 10 }}>

              {/* ── Header de semaine (cliquer pour plier/déplier) ── */}
              <button onClick={() => toggleWeek(wi)} style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10, border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                background: containsSelected ? 'var(--accent)' : 'var(--inset)',
                color: containsSelected ? 'var(--accent-ink)' : 'var(--muted)'
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '.12em',
                  textTransform: 'uppercase'
                }}>{week.label}</span>
                <Icon name={isOpen ? 'chevdown' : 'chevright'} size={14}
                  style={{ opacity: 0.7 }} />
              </button>

              {/* ── Liste des jours de cette semaine ── */}
              {isOpen && (
                <div style={{ paddingLeft: 8, paddingTop: 6 }}>
                  {week.days.map((d, di) => {
                    const globalIdx = week.startIndex + di;
                    const on = globalIdx === sel;
                    const dayTitle = d.title || 'Journée libre';
                    const steps = d.steps || [];

                    // Extraire les types d'étapes uniques pour les tags
                    const stepTypes = [...new Set(steps.map(s => s.type))];

                    return (
                      <div key={d.id || globalIdx}
                        onClick={() => {
                          Store.set({ selectedDayIndex: globalIdx });
                          if (onPickDay) onPickDay();
                        }}
                        style={{
                          position: 'relative', cursor: 'pointer',
                          padding: on ? '14px 14px 14px 16px' : '10px 14px 10px 16px',
                          borderLeft: on ? '3px solid var(--accent)' : '3px solid transparent',
                          marginBottom: 2, borderRadius: '0 8px 8px 0',
                          background: on ? 'var(--accent-soft)' : 'transparent',
                          opacity: globalIdx < sel && !on ? 0.5 : 1,
                          transition: 'all .15s'
                        }}>

                        {/* Numéro du jour + label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: on ? 6 : 2 }}>
                          {on && (
                            <span style={{
                              width: 22, height: 22, borderRadius: '50%',
                              background: 'var(--accent)', color: 'var(--accent-ink)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 800, flexShrink: 0
                            }}>{String(globalIdx + 1).padStart(2, '0')}</span>
                          )}
                          <span style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: '.12em',
                            textTransform: 'uppercase',
                            color: on ? 'var(--accent)' : 'var(--faint)'
                          }}>{on ? 'Aujourd\'hui' : 'Jour ' + (globalIdx + 1)}</span>
                        </div>

                        {/* Titre du jour */}
                        <div style={{
                          fontFamily: on ? 'var(--font-serif)' : 'inherit',
                          fontSize: on ? 17 : 14, fontWeight: on ? 400 : 600,
                          fontStyle: on ? 'italic' : 'normal',
                          lineHeight: '22px', color: 'var(--text)',
                          marginBottom: on && stepTypes.length > 0 ? 10 : 0
                        }}>{dayTitle}</div>

                        {/* Tags des étapes (jour actif seulement : détaillés) */}
                        {on && steps.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {steps.slice(0, 4).map((st, k) => {
                              const v = stepView(st);
                              const tag = TAG_COLORS[st.type] || TAG_COLORS.autre;
                              return (
                                <div key={k} style={{
                                  display: 'flex', alignItems: 'center', gap: 8
                                }}>
                                  <span style={{
                                    fontSize: 9, fontWeight: 800, letterSpacing: '.05em',
                                    textTransform: 'uppercase', padding: '3px 7px',
                                    borderRadius: 4, background: tag.bg, color: tag.color,
                                    flexShrink: 0
                                  }}>{tag.label}</span>
                                  <span style={{
                                    fontSize: 12.5, color: 'var(--muted)',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                  }}>{v.title || st.label || st.lieu || st.place || ''}</span>
                                </div>
                              );
                            })}
                            {steps.length > 4 && (
                              <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 600 }}>
                                + {steps.length - 4} étape{steps.length - 4 > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Tags résumé (jours non-actifs) */}
                        {!on && stepTypes.length > 0 && (
                          <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                            {stepTypes.slice(0, 3).map(type => {
                              const tag = TAG_COLORS[type] || TAG_COLORS.autre;
                              return (
                                <span key={type} style={{
                                  fontSize: 9, fontWeight: 700, letterSpacing: '.04em',
                                  textTransform: 'uppercase', padding: '2px 6px',
                                  borderRadius: 3, background: tag.bg, color: tag.color
                                }}>{tag.label}</span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Bouton ajouter (bas de sidebar) ── */}
      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--outline-variant)' }}>
        <button onClick={() => {
          // Bascule sur l'itinéraire si on n'y est pas déjà
          Store.set({ view: 'itinerary' });
        }} style={{
          width: '100%', padding: '11px 0', borderRadius: 10,
          border: '1px solid var(--accent)', background: 'transparent',
          color: 'var(--accent)', fontSize: 11, fontWeight: 700,
          letterSpacing: '.14em', textTransform: 'uppercase',
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all .15s'
        }}>
          <Icon name="plus" size={14} />
          Nouvelle étape
        </button>
      </div>
    </aside>
  );
}

// ─── Boîte à outils (colonne droite, tous onglets) ──────────
function Toolbox({ width = 320 }) {
  const st = Store.useStore();
  const trip = st.trip, view = st.view || 'itinerary', selIdx = st.selectedDayIndex || 0;
  if (!trip || !trip.days || !trip.days.length) return null;

  const day = trip.days[Math.min(selIdx, trip.days.length - 1)] || {};
  const steps = day.steps || [];
  const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  const DEFAULTS = {
    itinerary: ['checklist', 'note', 'stats'],
    map: ['calc', 'checklist'],
    budget: ['stats', 'note'],
    docs: ['checklist', 'note']
  };

  function loadPins(v) {
    try { const s = JSON.parse(localStorage.getItem('atelier_pins_' + v)); return s || DEFAULTS[v] || ['checklist']; }
    catch(e) { return DEFAULTS[v] || ['checklist']; }
  }

  const [pinned, setPinned] = React.useState(() => loadPins(view));
  const [editMode, setEditMode] = React.useState(false);
  const [done, setDone] = React.useState({});
  
  /* ── Calculateur d'itinéraire ── */
  const [calcFrom, setCalcFrom] = React.useState('');
  const [calcTo, setCalcTo] = React.useState('');
  const [calcFromCoords, setCalcFromCoords] = React.useState(null);
  const [calcToCoords, setCalcToCoords] = React.useState(null);
  const [calcStops, setCalcStops] = React.useState([]);
  const [calcMode, setCalcMode] = React.useState('driving');
  const [calcResult, setCalcResult] = React.useState(null);
  const [calcBusy, setCalcBusy] = React.useState(false);
  const [calcSugg, setCalcSugg] = React.useState({ field: null, items: [] });
  const calcSearchRef = React.useRef(null);

  function calcPickFromMap(fieldId) {
    Store.set({ mapPickMode: fieldId, view: 'map' });
  }

  function calcAutocomplete(text, fieldId) {
    clearTimeout(calcSearchRef.current);
    setCalcSugg({ field: null, items: [] });
    if (!text || text.length < 2) return;
    calcSearchRef.current = setTimeout(async () => {
      try {
        const r = await fetch('https://api.maptiler.com/geocoding/' + encodeURIComponent(text) + '.json?key=08IwMKKAkP3BQJss5poF&language=fr&limit=5');
        const j = await r.json();
        if (j.features && j.features.length) setCalcSugg({ field: fieldId, items: j.features });
      } catch (e) {}
    }, 350);
  }

  function calcUseMyPos(which) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function(pos) {
      var c = [pos.coords.longitude, pos.coords.latitude];
      if (which === 'from') { setCalcFrom('Ma position'); setCalcFromCoords(c); }
      else { setCalcTo('Ma position'); setCalcToCoords(c); }
    }, function() { alert('Impossible de vous localiser.'); }, { enableHighAccuracy: true, timeout: 8000 });
  }

  async function calcGeocode(text) {
    var r = await fetch('https://api.maptiler.com/geocoding/' + encodeURIComponent(text) + '.json?key=08IwMKKAkP3BQJss5poF&language=fr&limit=1');
    var j = await r.json();
    if (j.features && j.features[0]) return j.features[0].center;
    return null;
  }

  async function calcRoute() {
    if (!calcFrom.trim() || !calcTo.trim()) return;
    setCalcBusy(true); setCalcResult(null);
    try {
      var from = calcFromCoords || (await calcGeocode(calcFrom));
      var to = calcToCoords || (await calcGeocode(calcTo));
      if (!from || !to) { alert('Lieu introuvable.'); setCalcBusy(false); return; }
      setCalcFromCoords(from); setCalcToCoords(to);
      // Résoudre les étapes intermédiaires
      var resolvedStops = [];
      for (var si = 0; si < calcStops.length; si++) {
        var st = calcStops[si];
        if (!st.text.trim()) continue;
        var sc = st.coords || (await calcGeocode(st.text));
        if (sc) resolvedStops.push(sc);
      }
      var allPts = [from].concat(resolvedStops).concat([to]);
      var coordStr = allPts.map(function(c) { return c[0] + ',' + c[1]; }).join(';');
      var osrmServer = { driving: 'routed-car', walking: 'routed-foot', cycling: 'routed-bike' }[calcMode] || 'routed-car';
      var r = await fetch('https://routing.openstreetmap.de/' + osrmServer + '/route/v1/driving/' + coordStr + '?overview=full&geometries=geojson');
      var data = await r.json();
      if (!data.routes || !data.routes[0]) { alert('Aucun itin\u00e9raire trouv\u00e9.'); setCalcBusy(false); return; }
      var route = data.routes[0];
      setCalcResult({ duration: route.duration, distance: route.distance, geometry: route.geometry, from: from, to: to, stops: resolvedStops, mode: calcMode });
    } catch (e) { alert('Erreur : ' + e.message); }
    setCalcBusy(false);
  }

  function calcShowOnMap() {
    if (!calcResult) return;
    Store.set({ mapRoute: calcResult, view: 'map' });
  }

  function calcOpenGoogleMaps() {
    if (!calcResult) return;
    var origin = calcResult.from[1] + ',' + calcResult.from[0];
    var dest = calcResult.to[1] + ',' + calcResult.to[0];
    var gMode = { driving: 'driving', walking: 'walking', cycling: 'bicycling' }[calcResult.mode] || 'driving';
    var url = 'https://www.google.com/maps/dir/?api=1&origin=' + origin + '&destination=' + dest + '&travelmode=' + gMode;
    if (calcResult.stops && calcResult.stops.length > 0) {
      url += '&waypoints=' + calcResult.stops.map(function(s) { return s[1] + ',' + s[0]; }).join('|');
    }
    window.open(url, '_blank');
  }

  React.useEffect(() => { setPinned(loadPins(view)); setEditMode(false); }, [view]);
  /* Recevoir le résultat du pick carte */
  const { mapPickResult } = Store.useStore();
  React.useEffect(() => {
  if (!mapPickResult) return;
  if (mapPickResult.field === 'locate-step') return;

  var f = mapPickResult.field, t = mapPickResult.text, c = mapPickResult.coords;
  if (f === 'from') { setCalcFrom(t); setCalcFromCoords(c); }
  else if (f === 'to') { setCalcTo(t); setCalcToCoords(c); }
  else if (f && f.startsWith('stop-')) {
    var idx = parseInt(f.split('-')[1]);
    setCalcStops(s => s.map((st, i) => i === idx ? { text: t, coords: c } : st));
  }
  setCalcResult(null);
  Store.set({ mapPickResult: null });
}, [mapPickResult]);

  function togglePin(id) {
    setPinned(prev => {
      const has = prev.indexOf(id) > -1;
      const next = has ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('atelier_pins_' + view, JSON.stringify(next));
      return next;
    });
  }

  const lodging = steps.find(x => x.type === 'logement');
  const transportStep = steps.find(x => x.type === 'transport');
  const participants = trip.participants || [{ name: 'Moi', initials: 'ME', hue: 140 }];

  function WidgetShell({ id, title, icon, iconColor, children, noPad }) {
    return (
      <div style={{ background: 'var(--card)', borderRadius: 12, boxShadow: '0 2px 8px rgba(82,98,91,0.05)', border: '1px solid var(--outline-variant)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--outline-variant)', background: 'var(--soft)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name={icon} size={16} style={{ color: iconColor || 'var(--tertiary)' }} />
            {title}
          </span>
          {editMode && <button onClick={() => togglePin(id)} style={{ width: 22, height: 22, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 15 }}>{'\u00d7'}</button>}
        </div>
        <div style={noPad ? {} : { padding: 16 }}>{children}</div>
      </div>
    );
  }

  const BLOCKS = {
    checklist: { label: '\u00c0 ne pas oublier', icon: 'check', render() {
      const items = day.todo || [];
      return (
        <WidgetShell key="checklist" id="checklist" title={'\u00c0 ne pas oublier'} icon="check" iconColor="var(--accent)">
          {items.length > 0 ? items.map((t, i) => {
            const k = selIdx + '_' + i; const ok = done[k];
            return (
              <label key={i} onClick={() => setDone(d => ({ ...d, [k]: !d[k] }))} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '7px 0', borderBottom: i < items.length - 1 ? '1px solid var(--line2)' : 'none' }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, border: ok ? 'none' : '1.5px solid var(--outline)', background: ok ? 'var(--accent)' : 'var(--card)', display: 'grid', placeItems: 'center' }}>
                  {ok && <Icon name="check" size={14} sw={2.4} style={{ color: '#fff' }} />}
                </div>
                <span style={{ fontSize: 13.5, color: ok ? 'var(--faint)' : 'var(--text)', textDecoration: ok ? 'line-through' : 'none', opacity: ok ? 0.7 : 1 }}>{t}</span>
              </label>
            );
          }) : <div style={{ fontSize: 13, color: 'var(--faint)', fontStyle: 'italic' }}>Rien de pr{'\u00e9'}vu pour ce jour.</div>}
        </WidgetShell>
      );
    }},

    note: { label: 'Journal du jour', icon: 'sparkle', render() {
      return (
        <div key="note" style={{ background: 'var(--soft)', borderRadius: 12, boxShadow: '0 2px 8px rgba(82,98,91,0.05)', border: '1px solid rgba(217,182,126,0.3)', padding: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 32, height: 32, background: 'rgba(217,182,126,0.1)', borderRadius: '0 0 0 12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="sparkle" size={16} style={{ color: 'var(--tan)' }} />
              Journal du jour
            </span>
            {editMode && <button onClick={() => togglePin('note')} style={{ width: 22, height: 22, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 15 }}>{'\u00d7'}</button>}
          </div>
          {day.note
            ? <div style={{ fontSize: 13.5, lineHeight: '20px', color: 'var(--muted)', fontStyle: 'italic' }}>{day.note}</div>
            : <div style={{ fontSize: 13, color: 'var(--faint)', fontStyle: 'italic' }}>Aucune note pour ce jour.</div>}
        </div>
      );
    }},

    people: { label: 'Voyageurs', icon: 'users', render() {
      return (
        <WidgetShell key="people" id="people" title="Voyageurs" icon="users" iconColor="var(--tertiary)">
          <Avatars people={participants} size={34} dark={mode === 'light'} />
        </WidgetShell>
      );
    }},

    calc: { label: 'Itin\u00e9raire', icon: 'route', render() {
      var modes = [
        { id: 'driving', label: 'Voiture', icon: 'car' },
        { id: 'walking', label: '\u00c0 pied', icon: 'walk' },
        { id: 'cycling', label: 'V\u00e9lo', icon: 'route' }
      ];
      var durTxt = '', distTxt = '';
      if (calcResult) {
        var d = calcResult.duration, m = calcResult.distance;
        durTxt = d < 60 ? '< 1 min' : d < 3600 ? Math.round(d / 60) + ' min' : Math.floor(d / 3600) + 'h' + String(Math.round((d % 3600) / 60)).padStart(2, '0');
        distTxt = m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(1) + ' km';
      }

      var inputStyle = { flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'var(--inset)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, outline: 'none' };
      var gpsBtn = { width: 34, height: 34, borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'var(--inset)', color: 'var(--accent)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 };

      function renderSuggestions(fieldId, onPick) {
        if (calcSugg.field !== fieldId || !calcSugg.items.length) return null;
        return (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, borderRadius: 10, overflow: 'hidden', marginTop: 4, border: '1px solid var(--outline-variant)', background: 'var(--card)', boxShadow: 'var(--shadow-lg)', maxHeight: 180, overflowY: 'auto' }}>
            {calcSugg.items.map((f, k) => (
              <button key={k} onClick={() => { onPick(f.place_name || f.text, f.center); setCalcSugg({ field: null, items: [] }); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: 'none', borderBottom: '1px solid var(--line2)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', color: 'var(--text)', fontSize: 12 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-soft)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Icon name="pin" size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.place_name || f.text}</span>
              </button>
            ))}
          </div>
        );
      }

      return (
        <WidgetShell key="calc" id="calc" title={'Itin\u00e9raire'} icon="route" iconColor="var(--tertiary)">
          {/* Point A */}
          <div style={{ marginBottom: 10, position: 'relative' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 4 }}>D{'\u00e9'}part</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={calcFrom}
                onChange={e => { setCalcFrom(e.target.value); setCalcFromCoords(null); setCalcResult(null); calcAutocomplete(e.target.value, 'from'); }}
                onFocus={e => { if (e.target.value.length >= 2) calcAutocomplete(e.target.value, 'from'); }}
                placeholder="Adresse, lieu..." style={inputStyle} />
              <button onClick={() => calcUseMyPos('from')} title="Ma position" style={gpsBtn}><Icon name="pin" size={14} /></button>
              <button onClick={() => calcPickFromMap('from')} title="Choisir sur la carte" style={gpsBtn}><Icon name="map" size={14} /></button>
            </div>
            {renderSuggestions('from', (text, coords) => { setCalcFrom(text); setCalcFromCoords(coords); })}
          </div>

          {/* Étapes intermédiaires */}
          {calcStops.map((stop, idx) => (
            <div key={idx} style={{ marginBottom: 10, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 4 }}>{'\u00c9'}tape {idx + 1}</div>
                <button onClick={() => setCalcStops(s => s.filter((_, i) => i !== idx))}
                  style={{ border: 'none', background: 'transparent', color: 'var(--faint)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 2 }}>{'\u00d7'}</button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={stop.text}
                  onChange={e => { var v = e.target.value; setCalcStops(s => s.map((st, i) => i === idx ? { text: v, coords: null } : st)); setCalcResult(null); calcAutocomplete(v, 'stop-' + idx); }}
                  onFocus={e => { if (e.target.value.length >= 2) calcAutocomplete(e.target.value, 'stop-' + idx); }}
                  placeholder="Adresse, lieu..." style={inputStyle} />
                <button onClick={() => calcUseMyPos('stop-' + idx)} title="Ma position" style={gpsBtn}><Icon name="pin" size={14} /></button>
                <button onClick={() => calcPickFromMap('stop-' + idx)} title="Choisir sur la carte" style={gpsBtn}><Icon name="map" size={14} /></button>
              </div>
              {renderSuggestions('stop-' + idx, (text, coords) => { setCalcStops(s => s.map((st, i) => i === idx ? { text: text, coords: coords } : st)); })}
            </div>
          ))}

          {/* Bouton ajouter étape */}
          <button onClick={() => { setCalcStops(s => [...s, { text: '', coords: null }]); setCalcResult(null); }}
            style={{ width: '100%', padding: '6px 0', marginBottom: 12, borderRadius: 8, border: '1px dashed var(--outline-variant)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="plus" size={12} /> Ajouter une {'\u00e9'}tape
          </button>

          {/* Point B */}
          <div style={{ marginBottom: 12, position: 'relative' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 4 }}>Arriv{'\u00e9'}e</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={calcTo}
                onChange={e => { setCalcTo(e.target.value); setCalcToCoords(null); setCalcResult(null); calcAutocomplete(e.target.value, 'to'); }}
                onFocus={e => { if (e.target.value.length >= 2) calcAutocomplete(e.target.value, 'to'); }}
                placeholder="Adresse, lieu..." style={inputStyle} />
              <button onClick={() => calcUseMyPos('to')} title="Ma position" style={gpsBtn}><Icon name="pin" size={14} /></button>
              <button onClick={() => calcPickFromMap('to')} title="Choisir sur la carte" style={gpsBtn}><Icon name="map" size={14} /></button>
            </div>
            {renderSuggestions('to', (text, coords) => { setCalcTo(text); setCalcToCoords(coords); })}
          </div>

          {/* Mode */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {modes.map(m => (
              <button key={m.id} onClick={() => { setCalcMode(m.id); setCalcResult(null); }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                  border: calcMode === m.id ? '2px solid var(--accent)' : '1px solid var(--outline-variant)',
                  background: calcMode === m.id ? 'var(--accent-soft)' : 'var(--inset)',
                  color: calcMode === m.id ? 'var(--accent)' : 'var(--muted)', fontSize: 10, fontWeight: 700, fontFamily: 'inherit' }}>
                <Icon name={m.icon} size={16} />{m.label}
              </button>
            ))}
          </div>

          {/* Calculer */}
          <button onClick={calcRoute} disabled={calcBusy || !calcFrom.trim() || !calcTo.trim()}
            style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              background: (!calcFrom.trim() || !calcTo.trim()) ? 'var(--outline-variant)' : 'var(--accent)',
              color: (!calcFrom.trim() || !calcTo.trim()) ? 'var(--faint)' : 'var(--accent-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s' }}>
            <Icon name="route" size={14} />{calcBusy ? 'Calcul\u2026' : 'Calculer'}
          </button>

          {/* Résultat */}
          {calcResult && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, background: 'var(--inset)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, lineHeight: 1, color: 'var(--accent)' }}>{durTxt}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>dur{'\u00e9'}e</div>
                </div>
                <div style={{ flex: 1, background: 'var(--inset)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, lineHeight: 1, color: 'var(--text)' }}>{distTxt}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>distance</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={calcShowOnMap}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                    background: 'transparent', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="map" size={13} />Voir sur carte
                </button>
                <button onClick={calcOpenGoogleMaps}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--outline-variant)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                    background: 'var(--inset)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="arrow" size={13} />Ouvrir Maps
                </button>
              </div>
            </div>
          )}
        </WidgetShell>
      );
    }},
    stats: { label: 'Rep\u00e8res du jour', icon: 'route', render() {
      return (
        <WidgetShell key="stats" id="stats" title={'Rep\u00e8res du jour'} icon="route" iconColor="var(--accent)">
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: 'var(--inset)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, lineHeight: 1 }}>{steps.length}</div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>{steps.length > 1 ? '\u00e9tapes' : '\u00e9tape'}</div>
            </div>
            <div style={{ flex: 1, background: 'var(--inset)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, lineHeight: 1 }}>{transportStep ? '1' : '0'}</div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>transport</div>
            </div>
            <div style={{ flex: 1, background: 'var(--inset)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, lineHeight: 1 }}>{lodging ? (lodging.nights || 1) : '\u2014'}</div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>nuits</div>
            </div>
          </div>
        </WidgetShell>
      );
    }}
  };

  const ORDER = ['calc', 'checklist', 'note', 'stats', 'people'];
  const unpinned = ORDER.filter(id => pinned.indexOf(id) === -1);

  return (
<aside style={{
  width: width,
  flexShrink: 0,
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
  borderLeft: '1px solid var(--outline-variant)',
  background: 'var(--bg)',
  display: 'flex',
  flexDirection: 'column'
}}>
      <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>Bo{'\u00ee'}te {'\u00e0'} outils</div>
        <button onClick={() => setEditMode(e => !e)} title={editMode ? 'Termin\u00e9' : 'Personnaliser'} style={{ width: 28, height: 28, borderRadius: '50%', background: editMode ? 'var(--accent)' : 'transparent', border: 'none', cursor: 'pointer', color: editMode ? 'var(--accent-ink)' : 'var(--faint)', display: 'grid', placeItems: 'center' }}>
          <Icon name="gear" size={16} />
        </button>
      </div>
      <div style={{
  flex: '1 1 0',
  minHeight: 0,
  overflowY: 'auto',
  padding: '8px 16px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16
}}>
        {pinned.map(id => BLOCKS[id] ? BLOCKS[id].render() : null)}
        {editMode && unpinned.length > 0 && (
          <div style={{ borderRadius: 12, border: '1px dashed var(--outline-variant)', padding: 12 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 9 }}>Ajouter un bloc</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {unpinned.map(id => {
                const b = BLOCKS[id]; if (!b) return null;
                return (
                  <button key={id} onClick={() => togglePin(id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--outline-variant)', background: 'var(--inset)', color: 'var(--text)', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, textAlign: 'left', fontFamily: 'inherit' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={b.icon} size={14} /></div>
                    <span style={{ flex: 1 }}>{b.label}</span>
                    <Icon name="plus" size={14} style={{ color: 'var(--faint)' }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function Topbar({ compact = false }) {
  const { user, trips, activeTripId, trip, view, theme = localStorage.getItem('it_theme') || 'light' } = Store.useStore();
  const [authOpen, setAuthOpen] = React.useState(false);
    React.useEffect(() => {
    if (!user && localStorage.getItem('pendingTripInvite')) {
      setAuthOpen(true);
    }
  }, [user]);
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('it_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    Store.set({ theme: newTheme });
  };
  const [tripMenuOpen, setTripMenuOpen] = React.useState(false);
  const [newTripOpen, setNewTripOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (!tripMenuOpen) return;
    const onClick = (e) => { if (!menuRef.current?.contains(e.target)) setTripMenuOpen(false); };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [tripMenuOpen]);

  const pseudo = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
  const initials = pseudo.slice(0, 2).toUpperCase();
  const displayName = pseudo.length > 14 ? pseudo.slice(0, 13) + '…' : pseudo;
  const navLabels = {
  itinerary: compact ? 'Plan' : 'Itinéraire',
  map: 'Carte',
  budget: compact ? '€' : 'Budget',
  docs: compact ? 'Docs' : 'Docs'
};

  return (
    <header style={{
  height: compact ? 56 : 64,
  flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: compact ? '0 10px' : '0 16px',
      background: 'var(--topbar)',
      borderBottom: '1px solid var(--outline-variant)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      {/* ── Gauche : marque + sélecteur voyage ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 10 : 24, minWidth: 0 }}>
         <div
          onClick={() => Store.set({ activeTripId: null, trip: null })}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: compact ? 22 : 26,
            lineHeight: compact ? '28px' : '32px',
            color: 'var(--accent)',
            whiteSpace: 'nowrap',
            cursor: 'pointer'
          }}
        >L'Atelier</div>

        {user && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setTripMenuOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px',
                background: 'var(--inset)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 8, cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                color: 'var(--text)', transition: 'background .15s'
              }}
            >
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: compact ? 110 : 180 }}>
                {trip?.name || (activeTripId ? 'Chargement\u2026' : 'Choisir un voyage')}
              </span>
              <Icon name="chevdown" size={14} style={{ color: 'var(--faint)' }} />
            </button>

            {tripMenuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                minWidth: 260, maxHeight: 360, overflowY: 'auto',
                background: 'var(--card)', border: '1px solid var(--outline-variant)',
                borderRadius: 14, padding: 6,
                boxShadow: 'var(--shadow-lg)', zIndex: 200
              }}>
                {trips.length === 0 && (
                  <div style={{ padding: '12px 10px', fontSize: 13, color: 'var(--faint)' }}>
                    Aucun voyage pour le moment.
                  </div>
                )}
                {trips.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTripMenuOpen(false); selectTrip(t.id); }}
                    style={{
                      width: '100%', textAlign: 'left',
                      background: t.id === activeTripId ? 'var(--accent-soft)' : 'transparent',
                      color: t.id === activeTripId ? 'var(--accent)' : 'var(--text)',
                      border: 'none', borderRadius: 10,
                      padding: '9px 10px', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 8
                    }}
                  >
                    <Icon name="map" size={13} />
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                    {t.start_date && <span style={{ fontSize: 11, color: 'var(--faint)' }}>{fmtDate(t.start_date)}</span>}
                  </button>
                ))}
                <div style={{ height: 1, background: 'var(--line)', margin: '6px 4px' }} />
                <button
                  onClick={() => { setTripMenuOpen(false); setNewTripOpen(true); }}
                  style={{
                    width: '100%', textAlign: 'left',
                    background: 'transparent', color: 'var(--accent)',
                    border: 'none', borderRadius: 10,
                    padding: '9px 10px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 8
                  }}
                >
                  <Icon name="plus" size={13} />
                  Nouveau voyage
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Centre : onglets navigation ── */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[
          { id: 'itinerary', label: 'Itin\u00e9raire' },
          { id: 'map',       label: 'Carte' },
          { id: 'budget',    label: 'Budget' },
          { id: 'docs',      label: 'Docs' }
        ].map(it => {
          const on = view === it.id;
          return (
            <button
              key={it.id}
              onClick={() => Store.set({ view: it.id })}
              style={{
                border: 'none',
                background: on ? 'var(--accent)' : 'transparent',
                color: on ? 'var(--accent-ink)' : 'var(--muted)',
                cursor: 'pointer',
                fontSize: compact ? 12 : 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                padding: compact ? '7px 10px' : '8px 16px',
                borderRadius: 999,
                transition: 'all .2s'
              }}
            >
              {navLabels[it.id] || it.label}
            </button>
          );
        })}
      </nav>

      {/* ── Droite : outils + compte ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'transparent', border: 'none',
                  color: 'var(--faint)', cursor: 'pointer',
                  display: 'grid', placeItems: 'center'
                }}
              ><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} /></button>
              <button
                onClick={() => Store.set({ settingsOpen: true })}
                title="Param\u00e8tres"
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'transparent', border: 'none',
                  color: 'var(--faint)', cursor: 'pointer',
                  display: 'grid', placeItems: 'center'
                }}
              ><Icon name="gear" size={18} /></button>
            </div>

            <div style={{ width: 1, height: 24, background: 'var(--outline-variant)', margin: '0 4px', opacity: 0.5 }} />

            <button
              onClick={() => Store.set({ settingsOpen: true })}
              title={!compact && displayName}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid var(--outline-variant)',
                borderRadius: 999, cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                color: 'var(--text)', transition: 'background .15s'
              }}
            >
              <span style={{ whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{pseudo}</span>
              <span style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--accent)', color: 'var(--accent-ink)',
                display: 'grid', placeItems: 'center',
                fontSize: 11, fontWeight: 800
              }}>{initials}</span>
            </button>
          </>
        ) : (
          <Btn variant="primary" icon="user" onClick={() => setAuthOpen(true)}>Connexion</Btn>
        )}
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {newTripOpen && <NewTripModal onClose={() => setNewTripOpen(false)} />}
    </header>
  );
}


// ─── Écrans vides ───────────────────────────────────────────
function LoggedOutHome() {
  const [authOpen, setAuthOpen] = React.useState(false);
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 40, gap: 16
    }}>
      <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 38, lineHeight: 1.1 }}>
        Bienvenue dans <span style={{ color: 'var(--accent)' }}>L'Atelier</span>
      </div>
      <p style={{ color: 'var(--muted)', maxWidth: 420, lineHeight: 1.6 }}>
        Planifie tes voyages à plusieurs : itinéraire, carte, budget et documents au même endroit.
      </p>
      <Btn variant="primary" icon="user" onClick={() => setAuthOpen(true)}>
        Se connecter / Créer un compte
      </Btn>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}

function NoTripHome() {
  const [newOpen, setNewOpen] = React.useState(false);
  const { trips } = Store.useStore();
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 40, gap: 14
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 14,
        background: 'var(--accent-soft)', color: 'var(--accent)',
        display: 'grid', placeItems: 'center', marginBottom: 6
      }}>
        <Icon name="map" size={28} />
      </div>
      <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 30, lineHeight: 1.1 }}>
        {trips.length ? 'Choisis un voyage' : 'Crée ton premier voyage'}
      </div>
      <p style={{ color: 'var(--muted)', maxWidth: 380, lineHeight: 1.6 }}>
        {trips.length
          ? 'Utilise le sélecteur en haut pour ouvrir un voyage existant, ou crée-en un nouveau.'
          : 'Donne-lui un nom, des dates, et commence à planifier.'}
      </p>
      <Btn variant="primary" icon="plus" onClick={() => setNewOpen(true)}>Nouveau voyage</Btn>
      {newOpen && <NewTripModal onClose={() => setNewOpen(false)} />}
    </div>
  );
}

function LoadingTrip() {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: 'var(--muted)'
    }}>
      Chargement du voyage…
    </div>
  );
}

// ─── Modale Auth ────────────────────────────────────────────
function AuthModal({ onClose }) {
  const [mode, setMode] = React.useState('login'); // 'login' | 'signup'
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pseudo, setPseudo] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function onSubmit() {
    setError(''); setBusy(true);
    try {
      if (mode === 'login') {
        await SB.signIn(email.trim(), password);
      } else {
        await SB.signUp(email.trim(), password, pseudo.trim() || null);
      }
      onClose();
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  return <ModalShell title={mode === 'login' ? 'Connexion' : 'Créer un compte'} onClose={onClose}>
    <div style={{ display: 'flex', gap: 6, background: 'var(--inset)', borderRadius: 999, padding: 4, marginBottom: 14 }}>
      <ModeTab on={mode === 'login'} onClick={() => setMode('login')}>Se connecter</ModeTab>
      <ModeTab on={mode === 'signup'} onClick={() => setMode('signup')}>Créer un compte</ModeTab>
    </div>
    {mode === 'signup' && (
      <Field label="Pseudo">
        <input value={pseudo} onChange={e => setPseudo(e.target.value)} placeholder="Ton prénom ou pseudo" autoComplete="nickname" />
      </Field>
    )}
    <Field label="Email">
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" autoComplete="email" />
    </Field>
    <Field label="Mot de passe">
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
    </Field>
    {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 4 }}>{error}</div>}
    <div style={{ marginTop: 16 }}>
      <Btn variant="primary" onClick={onSubmit} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
        {busy ? '...' : (mode === 'login' ? 'Se connecter' : 'Créer mon compte')}
      </Btn>
    </div>
  </ModalShell>;
}

// ─── Modale Nouveau voyage ──────────────────────────────────
function NewTripModal({ onClose }) {
  const [name, setName] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [days, setDays] = React.useState(7);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  async function onSubmit() {
    if (!name.trim()) return;
    setError(''); setBusy(true);
    try {
      const trip = await SB.createTrip({ name: name.trim(), startDate: startDate || null, days: Math.max(1, +days || 1) });
      // Rafraîchir la liste + activer le nouveau
      const trips = await SB.listMyTrips();
      Store.set({ trips, activeTripId: trip.id });
      const full = await SB.loadTrip(trip.id);
      Store.set({ trip: full });
      Store.showToast(`Voyage « ${trip.name} » créé ✓`);
      onClose();
    } catch (e) {
      setError(e.message || 'Erreur de création');
    } finally {
      setBusy(false);
    }
  }

  return <ModalShell title="Nouveau voyage" onClose={onClose}>
    <Field label="Nom du voyage">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Corée du Sud, Lisbonne…" autoFocus />
    </Field>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Field label="Date de départ">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </Field>
      <Field label="Nombre de jours">
        <input type="number" min="1" max="60" value={days} onChange={e => setDays(e.target.value)} />
      </Field>
    </div>
    {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 4 }}>{error}</div>}
    <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
      <Btn variant="ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Annuler</Btn>
      <Btn variant="primary" onClick={onSubmit} style={{ flex: 1, justifyContent: 'center' }}>
        {busy ? '...' : 'Créer le voyage'}
      </Btn>
    </div>
  </ModalShell>;
}

// ─── Atomes UI ──────────────────────────────────────────────
function ModeTab({ on, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, border: 'none', cursor: 'pointer',
      background: on ? 'var(--accent)' : 'transparent',
      color: on ? 'var(--bg)' : 'var(--muted)',
      borderRadius: 999, padding: '7px 12px',
      fontSize: 13, fontWeight: 700, fontFamily: 'inherit'
    }}>{children}</button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{label}</div>
      {React.cloneElement(children, {
        style: {
          width: '100%',
          background: 'var(--inset)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: '10px 12px',
          color: 'var(--text)',
          fontFamily: 'inherit',
          fontSize: 14,
          outline: 'none',
          ...(children.props.style || {})
        }
      })}
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  React.useEffect(() => {
    const onEsc = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);
  
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 5000,
      background: 'rgba(0,0,0,.6)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 420, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 18, boxShadow: 'var(--shadow-lg)', overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--line)'
        }}>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22 }}>{title}</div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', padding: 6, borderRadius: 8
          }}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ─── Helper : sélectionner un voyage ────────────────────────
async function selectTrip(tripId) {
  Store.set({ activeTripId: tripId, trip: null });
  try {
    const full = await SB.loadTrip(tripId);
    Store.set({ trip: full });
    SB.subscribeTrip(tripId, () => {
      // Sur changement realtime, recharger
      SB.loadTrip(tripId).then(t => Store.set({ trip: t })).catch(() => {});
    });
  } catch (e) {
    Store.showToast('Erreur chargement : ' + e.message);
    Store.set({ activeTripId: null });
  }
}

window.AppShell = AppShell;
window.selectTrip = selectTrip;
