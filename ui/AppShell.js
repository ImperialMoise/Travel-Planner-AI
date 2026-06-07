// ════════════════════════════════════════════════════════════
// AppShell.js — coquille principale de l'app.
// Topbar (logo + sélecteur voyage + actions) + zone de vue.
// ════════════════════════════════════════════════════════════

function AppShell() {
  const { user, authReady, view, trips, activeTripId, trip, toast, settingsOpen } = Store.useStore();

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
    <>
      {/* On cache la Topbar de l'app si le design de Claude est affiché (car il a la sienne) */}
      <Topbar />
      
      <main style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        {!user ? <LoggedOutHome /> :
         !activeTripId ? <NoTripHome /> :
         !trip ? <LoadingTrip /> :
         <>
           <DaySpine />
           <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
             {CurrentView ? <CurrentView /> : <div style={{ padding: 40, color: 'var(--muted)' }}>Vue inconnue : {view}</div>}
           </div>
           <Toolbox />
         </>}
      </main>
                
      {settingsOpen && window.SettingsModal && <window.SettingsModal />}
      {toast && <div className="toast show">{toast.msg}</div>}
    </>
  );
}

// ─── Topbar ─────────────────────────────────────────────────
function DaySpine() {
  const { trip, selectedDayIndex } = Store.useStore();
  if (!trip || !trip.days) return null;
  const days = trip.days;
  const sel = selectedDayIndex || 0;

  return (
    <aside style={{
      width: 300, flexShrink: 0,
      borderRight: '1px solid var(--outline-variant)',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', minHeight: 0,
      boxShadow: '4px 0 24px rgba(45,73,63,0.05)'
    }}>
      {/* ── En-tête ── */}
      <div style={{
        padding: '24px 24px 20px',
        borderBottom: '1px solid var(--outline-variant)'
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '.2em',
          textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8
        }}>{trip.name ? 'Itin\u00e9raire' : 'Voyage'}</div>
        <div style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 26, lineHeight: '32px', color: 'var(--text)'
        }}>{trip.name || 'Mon voyage'}</div>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 13.5, lineHeight: '20px',
          color: 'var(--muted)', marginTop: 8,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <Icon name="cal" size={16} style={{ color: 'var(--muted)' }} />
          {days.length} jour{days.length > 1 ? 's' : ''}
          {trip.startDate ? ' \u00b7 ' + fmtDate(trip.startDate) : ''}
        </div>
      </div>

      {/* ── Timeline ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 16px 32px',
        position: 'relative'
      }}>
        {days.map((d, i) => {
          const on = i === sel;
          const past = i < sel;
          const future = i > sel;
          const isLast = i === days.length - 1;
          const dayTitle = d.title || 'Journ\u00e9e libre';
          const steps = d.steps || [];

          return (
            <div
              key={d.id || i}
              style={{
                position: 'relative', paddingLeft: 40,
                marginBottom: isLast ? 0 : on ? 32 : 24,
                opacity: past && !on ? 0.55 : 1,
                cursor: 'pointer'
              }}
              onClick={() => Store.set({ selectedDayIndex: i })}
            >
              {/* Ligne verticale */}
              {!isLast && (
                <div style={{
                  position: 'absolute', left: 18, top: 22, bottom: -24,
                  width: 2, background: 'var(--outline-variant)', zIndex: 0
                }} />
              )}

              {/* Cercle */}
              {on ? (
                <div style={{
                  position: 'absolute', left: 8, top: 0,
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--tan)', color: 'var(--petrol)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(217,182,126,0.4)',
                  zIndex: 1
                }}>{String(i + 1).padStart(2, '0')}</div>
              ) : past ? (
                <div style={{
                  position: 'absolute', left: 12, top: 4,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--bg)',
                  border: '2px solid var(--outline-variant)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 1
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--outline-variant)'
                  }} />
                </div>
              ) : (
                <div style={{
                  position: 'absolute', left: 12, top: 4,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--bg)',
                  border: '2px solid var(--outline-variant)',
                  zIndex: 1
                }} />
              )}

              {/* Contenu */}
              <div>
                {on ? (
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '.16em',
                    textTransform: 'uppercase', color: 'var(--accent)',
                    marginBottom: 2
                  }}>{"Aujourd\u0027hui"}</div>
                ) : (
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: '14px',
                    textTransform: 'uppercase', letterSpacing: '.1em',
                    color: past ? 'var(--muted)' : 'var(--faint)',
                    marginBottom: 2
                  }}>Jour {i + 1}</div>
                )}

                <div style={{
                  fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: '28px',
                  color: 'var(--text)'
                }}>{dayTitle}</div>

                {/* Détails des étapes pour le jour actif */}
                {on && steps.length > 0 && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12
                  }}>
                    {steps.slice(0, 3).map((st, k) => {
                      const v = stepView(st);
                      return (
                        <div key={k} style={{
                          padding: '12px 14px',
                          background: 'var(--surface-high)',
                          borderRadius: 12,
                          border: '1px solid rgba(217,182,126,0.3)',
                          boxShadow: '0 1px 4px rgba(82,98,91,0.04)'
                        }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6
                          }}>
                            <Icon name={v.icon} size={16} style={{ color: 'var(--accent)' }} />
                            {v.range && (
                              <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: 11,
                                color: 'var(--accent)', fontWeight: 700
                              }}>{(v.range || '').split('\u2013')[0]}</span>
                            )}
                          </div>
                          <div style={{
                            fontSize: 15.5, fontWeight: 700, lineHeight: '22px',
                            color: 'var(--text)'
                          }}>{v.title || st.label || st.lieu || 'Sans titre'}</div>
                          {v.sub && (
                            <div style={{
                              fontSize: 13.5, lineHeight: '20px',
                              color: 'var(--muted)', marginTop: 2
                            }}>{v.sub}</div>
                          )}
                        </div>
                      );
                    })}
                    {steps.length > 3 && (
                      <div style={{
                        fontSize: 12, color: 'var(--faint)', fontWeight: 600,
                        paddingLeft: 4
                      }}>+ {steps.length - 3} {'\u00e9tape'}{steps.length - 3 > 1 ? 's' : ''}</div>
                    )}
                  </div>
                )}

                {/* Résumé transport pour les jours non-actifs */}
                {!on && steps.length > 0 && (() => {
                  const transport = steps.find(st => st.type === 'transport');
                  if (!transport) return null;
                  const v = stepView(transport);
                  return (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      marginTop: 6, paddingLeft: 2
                    }}>
                      <Icon name={v.icon} size={16} style={{ color: 'var(--muted)' }} />
                      <span style={{
                        fontSize: 13.5, color: 'var(--muted)'
                      }}>{v.title || (transport.from + ' \u2192 ' + transport.to)}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
// ─── Boîte à outils (colonne droite, tous onglets) ──────────
function Toolbox() {
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
  const [calcMode, setCalcMode] = React.useState('driving');
  const [calcResult, setCalcResult] = React.useState(null);
  const [calcBusy, setCalcBusy] = React.useState(false);

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
      var mode = calcMode === 'transit' ? 'driving' : calcMode;
      var r = await fetch('https://api.maptiler.com/directions/v1/' + mode + '/' + from[0] + ',' + from[1] + ';' + to[0] + ',' + to[1] + '?key=08IwMKKAkP3BQJss5poF&geometries=geojson&overview=full');
      var data = await r.json();
      if (!data.routes || !data.routes[0]) { alert('Aucun itin\u00e9raire trouv\u00e9.'); setCalcBusy(false); return; }
      var route = data.routes[0];
      var dur = route.duration;
      var dist = route.distance;
      setCalcResult({ duration: dur, distance: dist, geometry: route.geometry, from: from, to: to, mode: calcMode });
    } catch (e) { alert('Erreur : ' + e.message); }
    setCalcBusy(false);
  }

  function calcShowOnMap() {
    if (!calcResult) return;
    Store.set({ mapRoute: calcResult });
    Store.set({ view: 'map' });
  }

  React.useEffect(() => { setPinned(loadPins(view)); setEditMode(false); }, [view]);

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
      var durTxt = '';
      var distTxt = '';
      if (calcResult) {
        var d = calcResult.duration;
        var m = calcResult.distance;
        durTxt = d < 60 ? '< 1 min' : d < 3600 ? Math.round(d / 60) + ' min' : Math.floor(d / 3600) + 'h' + String(Math.round((d % 3600) / 60)).padStart(2, '0');
        distTxt = m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(1) + ' km';
      }
      return (
        <WidgetShell key="calc" id="calc" title={'Itin\u00e9raire'} icon="route" iconColor="var(--tertiary)">
          {/* Point A */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 4 }}>D{'\u00e9'}part</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={calcFrom}
                onChange={e => { setCalcFrom(e.target.value); setCalcFromCoords(null); setCalcResult(null); }}
                placeholder="Adresse, lieu..."
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'var(--inset)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, outline: 'none' }}
              />
              <button
                onClick={() => calcUseMyPos('from')}
                title="Ma position"
                style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'var(--inset)', color: 'var(--accent)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}
              ><Icon name="pin" size={14} /></button>
            </div>
          </div>

          {/* Point B */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 4 }}>Arriv{'\u00e9'}e</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={calcTo}
                onChange={e => { setCalcTo(e.target.value); setCalcToCoords(null); setCalcResult(null); }}
                placeholder="Adresse, lieu..."
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'var(--inset)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, outline: 'none' }}
              />
              <button
                onClick={() => calcUseMyPos('to')}
                title="Ma position"
                style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'var(--inset)', color: 'var(--accent)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}
              ><Icon name="pin" size={14} /></button>
            </div>
          </div>

          {/* Mode de transport */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {modes.map(m => (
              <button
                key={m.id}
                onClick={() => { setCalcMode(m.id); setCalcResult(null); }}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                  border: calcMode === m.id ? '2px solid var(--accent)' : '1px solid var(--outline-variant)',
                  background: calcMode === m.id ? 'var(--accent-soft)' : 'var(--inset)',
                  color: calcMode === m.id ? 'var(--accent)' : 'var(--muted)',
                  fontSize: 10, fontWeight: 700, fontFamily: 'inherit'
                }}
              >
                <Icon name={m.icon} size={16} />
                {m.label}
              </button>
            ))}
          </div>

          {/* Bouton calculer */}
          <button
            onClick={calcRoute}
            disabled={calcBusy || !calcFrom.trim() || !calcTo.trim()}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 10,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 700,
              background: (!calcFrom.trim() || !calcTo.trim()) ? 'var(--outline-variant)' : 'var(--accent)',
              color: (!calcFrom.trim() || !calcTo.trim()) ? 'var(--faint)' : 'var(--accent-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .2s'
            }}
          >
            <Icon name="route" size={14} />
            {calcBusy ? 'Calcul en cours\u2026' : 'Calculer'}
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
              <button
                onClick={calcShowOnMap}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10,
                  border: '1px solid var(--accent)', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 700,
                  background: 'transparent', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <Icon name="map" size={14} />
                Afficher sur la carte
              </button>
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
    <aside style={{ width: 320, flexShrink: 0, borderLeft: '1px solid var(--outline-variant)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>Bo{'\u00ee'}te {'\u00e0'} outils</div>
        <button onClick={() => setEditMode(e => !e)} title={editMode ? 'Termin\u00e9' : 'Personnaliser'} style={{ width: 28, height: 28, borderRadius: '50%', background: editMode ? 'var(--accent)' : 'transparent', border: 'none', cursor: 'pointer', color: editMode ? 'var(--accent-ink)' : 'var(--faint)', display: 'grid', placeItems: 'center' }}>
          <Icon name="gear" size={16} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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

function Topbar() {
  const { user, trips, activeTripId, trip, view, theme = localStorage.getItem('it_theme') || 'light' } = Store.useStore();
  const [authOpen, setAuthOpen] = React.useState(false);

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

  return (
    <header style={{
      height: 64, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px',
      background: 'var(--topbar)',
      borderBottom: '1px solid var(--outline-variant)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      {/* ── Gauche : marque + sélecteur voyage ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 26, lineHeight: '32px', color: 'var(--accent)'
        }}>L'Atelier</div>

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
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
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
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                padding: '8px 16px', borderRadius: 999,
                transition: 'all .2s'
              }}
            >
              {it.label}
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
              title={pseudo}
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
