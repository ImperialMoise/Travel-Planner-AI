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
function spineStepName(step) {
  if (!step) return '';

  return String(
    step.label ||
    step.lieu ||
    step.place ||
    step.arrivee ||
    step.depart ||
    ''
  ).trim();
}

function spineStepType(step) {
  return String(step && step.type || '').toLowerCase();
}

function spineIsRestaurant(step) {
  return spineStepType(step) === 'restaurant';
}

function spineIsTransport(step) {
  return spineStepType(step) === 'transport';
}

function spineIsLodging(step) {
  return spineStepType(step) === 'logement';
}

function spineIsActivity(step) {
  return spineStepType(step) === 'activite';
}

function spineMainStep(day) {
  var steps = Array.isArray(day && day.steps) ? day.steps : [];
  if (!steps.length) return null;

  var important = steps.find(function(step) {
    return step.important || step.favorite || step.favori || step.isImportant;
  });
  if (important) return important;

  var activity = steps.find(spineIsActivity);
  if (activity) return activity;

  var transport = steps.find(spineIsTransport);
  if (transport) return transport;

  var lodging = steps.find(spineIsLodging);
  if (lodging) return lodging;

  var other = steps.find(function(step) {
    return !spineIsRestaurant(step);
  });
  if (other) return other;

  return steps[0];
}

function spineCountLabel(day) {
  var steps = Array.isArray(day && day.steps) ? day.steps : [];

  if (!steps.length) return '';

  var restaurants = steps.filter(spineIsRestaurant).length;
  var transports = steps.filter(spineIsTransport).length;
  var lodgings = steps.filter(spineIsLodging).length;

  var parts = [
    steps.length + ' étape' + (steps.length > 1 ? 's' : '')
  ];

  if (restaurants) parts.push(restaurants + ' repas');
  if (transports) parts.push(transports + ' transport' + (transports > 1 ? 's' : ''));
  if (lodgings) parts.push(lodgings + ' logement' + (lodgings > 1 ? 's' : ''));

  return parts.join(' · ');
}

function dayTitleStepName(step) {
  if (!step) return '';

  var text = String(
    step.label ||
    step.lieu ||
    step.place ||
    step.arrivee ||
    step.depart ||
    ''
  ).trim();

  return text
    .replace(/^visite\s+(de|du|des|d’|d')\s+/i, '')
    .replace(/^découverte\s+(de|du|des|d’|d')\s+/i, '')
    .replace(/^balade\s+(le long de|le long du|dans|à|au|aux|de|du|des|d’|d')\s+/i, '')
    .replace(/^promenade\s+(dans|à|au|aux|de|du|des|d’|d')\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function dayTitleStepType(step) {
  return String(step && step.type || '').toLowerCase();
}

function dayTitleIsRestaurant(step) {
  return dayTitleStepType(step) === 'restaurant';
}

function dayTitleIsActivity(step) {
  return dayTitleStepType(step) === 'activite';
}

function dayTitleIsTransport(step) {
  return dayTitleStepType(step) === 'transport';
}

function dayTitleIsLodging(step) {
  return dayTitleStepType(step) === 'logement';
}

function dayTitleMainStep(day) {
  var steps = Array.isArray(day && day.steps) ? day.steps : [];
  if (!steps.length) return null;

  var important = steps.find(function(step) {
    return step.important || step.favorite || step.favori || step.isImportant;
  });
  if (important) return important;

  var activity = steps.find(dayTitleIsActivity);
  if (activity) return activity;

  var transport = steps.find(dayTitleIsTransport);
  if (transport) return transport;

  var lodging = steps.find(dayTitleIsLodging);
  if (lodging) return lodging;

  var other = steps.find(function(step) {
    return !dayTitleIsRestaurant(step);
  });
  if (other) return other;

  return steps[0];
}

function getAutoDayTitle(day) {
  var main = dayTitleMainStep(day);
  var name = dayTitleStepName(main);

  return name || 'Journée libre';
}

function getDisplayDayTitle(day) {
  var manual = String(day && day.title || '').trim();

  if (manual && manual.toLowerCase() !== 'journée libre') {
    return manual;
  }

  return getAutoDayTitle(day);
}

function TripDatesModal({ trip, onClose }) {
  const [startDate, setStartDate] = React.useState(trip?.startDate || '');
  const [endDate, setEndDate] = React.useState(trip?.endDate || '');
  const [busy, setBusy] = React.useState(false);

  function addDaysISO(baseISO, count) {
    if (!baseISO) return '';

    const d = new Date(String(baseISO) + 'T12:00:00');
    d.setDate(d.getDate() + count);

    return d.toISOString().slice(0, 10);
  }

  function diffDaysInclusive(startISO, endISO) {
    if (!startISO || !endISO) return 1;

    const start = new Date(String(startISO) + 'T12:00:00');
    const end = new Date(String(endISO) + 'T12:00:00');

    return Math.max(1, Math.round((end - start) / 86400000) + 1);
  }

  const currentCount = Array.isArray(trip?.days) ? trip.days.length : 0;
  const nextCount = startDate && endDate ? diffDaysInclusive(startDate, endDate) : currentCount;
  const willRemoveDays = nextCount < currentCount;
  const removedDays = willRemoveDays ? trip.days.slice(nextCount) : [];
  const removedWithSteps = removedDays.filter(d => Array.isArray(d.steps) && d.steps.length > 0).length;

  async function saveDates() {
    if (!trip?.id || !startDate || !endDate || busy) return;

    if (willRemoveDays) {
      const ok = window.confirm(
        'Tu réduis le voyage de ' +
        currentCount +
        ' à ' +
        nextCount +
        ' jours.\n\n' +
        (removedWithSteps
          ? removedWithSteps + ' journée(s) supprimée(s) contiennent des étapes.\n\n'
          : '') +
        'Continuer ?'
      );

      if (!ok) return;
    }

    setBusy(true);

    try {
      await window.SB.updateTripDateRange(trip.id, {
        startDate,
        endDate
      });

      const refreshed = await window.SB.loadTrip(trip.id);

      Store.set({
        trip: refreshed,
        selectedDayIndex: Math.min(Store.get().selectedDayIndex || 0, refreshed.days.length - 1)
      });

      Store.showToast('Dates du voyage mises à jour');
      onClose();
    } catch (error) {
      Store.showToast('Erreur dates : ' + (error.message || error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Dates du voyage" onClose={onClose}>
      <Field label="Date de départ">
        <input
          type="date"
          value={startDate}
          onChange={e => {
            const nextStart = e.target.value;
            setStartDate(nextStart);

            if (nextStart && !endDate && currentCount) {
              setEndDate(addDaysISO(nextStart, currentCount - 1));
            }
          }}
        />
      </Field>

      <Field label="Date de fin">
        <input
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={e => setEndDate(e.target.value)}
        />
      </Field>

      {startDate && endDate && (
        <div style={{
          fontSize: 13,
          color: 'var(--muted)',
          background: 'var(--inset)',
          borderRadius: 10,
          padding: '10px 12px',
          marginTop: 8,
          lineHeight: '19px'
        }}>
          Nouveau voyage : <b style={{ color: 'var(--text)' }}>{nextCount} jour{nextCount > 1 ? 's' : ''}</b>
          <br />
          {fmtDate(startDate)} → {fmtDate(endDate)}
        </div>
      )}

      {willRemoveDays && (
        <div style={{
          fontSize: 12,
          color: 'var(--danger)',
          marginTop: 10,
          lineHeight: '18px'
        }}>
          Attention : cela supprimera {currentCount - nextCount} journée{currentCount - nextCount > 1 ? 's' : ''}.
          {removedWithSteps ? ' Certaines contiennent des étapes.' : ''}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Btn
          variant="primary"
          onClick={saveDates}
          style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
        >
          {busy ? 'Mise à jour…' : 'Mettre à jour les dates'}
        </Btn>
      </div>
    </ModalShell>
  );
}

function DayDeleteConfirmModal({ day, dayIndex, busy, onCancel, onConfirm }) {
  const countSteps = day && Array.isArray(day.steps) ? day.steps.length : 0;
  const title = getDisplayDayTitle(day);

  return ReactDOM.createPortal(
    <div
      onClick={busy ? undefined : onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5200,
        background: 'rgba(21,48,42,.38)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: 18
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 430,
          background: 'var(--card)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 20,
          boxShadow: '0 34px 90px rgba(0,0,0,.28)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--outline-variant)',
            background: 'var(--soft)',
            display: 'flex',
            alignItems: 'center',
            gap: 13
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: 'rgba(192,86,63,.12)',
              color: '#c0563f',
              display: 'grid',
              placeItems: 'center',
              fontSize: 19,
              flexShrink: 0
            }}
          >
            🗑
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: '#c0563f',
                marginBottom: 3
              }}
            >
              Suppression
            </div>

            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 24,
                lineHeight: '29px',
                color: 'var(--text)'
              }}
            >
              Supprimer cette journée ?
            </div>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <div
            style={{
              border: '1px solid var(--outline-variant)',
              background: 'var(--inset)',
              borderRadius: 14,
              padding: '12px 14px',
              marginBottom: 14
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: 'var(--faint)',
                marginBottom: 5
              }}
            >
              Jour {dayIndex + 1}
            </div>

            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                lineHeight: '25px',
                color: 'var(--text)'
              }}
            >
              {title || 'Journée libre'}
            </div>

            <div
              style={{
                fontSize: 12.5,
                color: 'var(--muted)',
                marginTop: 5
              }}
            >
              {countSteps
                ? countSteps + ' étape' + (countSteps > 1 ? 's' : '') + ' seront supprimées avec cette journée.'
                : 'Cette journée ne contient aucune étape.'}
            </div>
          </div>

          <p
            style={{
              margin: 0,
              color: 'var(--muted)',
              fontSize: 13.5,
              lineHeight: '20px'
            }}
          >
            Les journées suivantes seront avancées automatiquement et la date de fin du voyage sera recalculée.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 18
            }}
          >
            <Btn
              variant="ghost"
              onClick={onCancel}
              disabled={busy}
              style={{
                flex: 1,
                justifyContent: 'center',
                padding: '11px'
              }}
            >
              Annuler
            </Btn>

            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: 999,
                padding: '11px',
                background: '#c0563f',
                color: '#fff',
                cursor: busy ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 800,
                boxShadow: '0 8px 18px rgba(192,86,63,.22)'
              }}
            >
              {busy ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

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
  const [datesOpen, setDatesOpen] = React.useState(false);
  const [draggingDayIndex, setDraggingDayIndex] = React.useState(null);
  const [dragOverDayIndex, setDragOverDayIndex] = React.useState(null);
  const [dayDeleteAsk, setDayDeleteAsk] = React.useState(null);
  const [deletingDay, setDeletingDay] = React.useState(false);

  // Quand le jour sélectionné change, ouvrir sa semaine
  React.useEffect(() => {
    const wi = Math.floor(sel / 7);
    setOpenWeeks(prev => ({ ...prev, [wi]: true }));
  }, [sel]);

  function toggleWeek(wi) {
    setOpenWeeks(prev => ({ ...prev, [wi]: !prev[wi] }));
  }

  async function moveDayInSpine(fromIndex, toIndex) {
  if (!trip || !trip.id) return;
  if (fromIndex === toIndex) return;

  try {
    await window.SB.moveTripDayInsideFixedRange(trip.id, fromIndex, toIndex);

    const refreshed = await window.SB.loadTrip(trip.id);

    Store.set({
      trip: refreshed,
      selectedDayIndex: toIndex
    });

    Store.showToast('Journée déplacée');
  } catch (error) {
    Store.showToast('Erreur déplacement : ' + (error.message || error));
  }
}

function deleteDayInSpine(dayIndex) {
  if (!trip || !trip.id) return;

  if (!Array.isArray(trip.days) || trip.days.length <= 1) {
    Store.showToast('Impossible de supprimer la dernière journée');
    return;
  }

  const day = trip.days[dayIndex];
  setDayDeleteAsk({
    dayIndex,
    day
  });
}

async function confirmDeleteDayInSpine() {
  if (!trip || !trip.id || !dayDeleteAsk || deletingDay) return;

  const dayIndex = dayDeleteAsk.dayIndex;

  setDeletingDay(true);

  try {
    await window.SB.deleteTripDayInsideFixedRange(trip.id, dayIndex);

    const refreshed = await window.SB.loadTrip(trip.id);
    const nextIndex = Math.min(dayIndex, refreshed.days.length - 1);

    Store.set({
      trip: refreshed,
      selectedDayIndex: nextIndex
    });

    Store.showToast('Journée supprimée');
    setDayDeleteAsk(null);
  } catch (error) {
    Store.showToast('Erreur suppression : ' + (error.message || error));
  } finally {
    setDeletingDay(false);
  }
}

  // ── Couleurs des tags de type d'étape ──
  const TAG_COLORS = {
  transport: {
    bg: 'rgba(192, 125, 86, 0.18)',
    color: '#b96535',
    border: 'rgba(192, 125, 86, 0.35)',
    label: 'Transport'
  },
  logement: {
    bg: 'rgba(46, 111, 124, 0.16)',
    color: '#2e6f7c',
    border: 'rgba(46, 111, 124, 0.32)',
    label: 'Logement'
  },
  activite: {
    bg: 'rgba(89, 123, 114, 0.17)',
    color: '#426f63',
    border: 'rgba(89, 123, 114, 0.34)',
    label: 'Activité'
  },
  restaurant: {
    bg: 'rgba(123, 158, 137, 0.20)',
    color: '#4f8a63',
    border: 'rgba(123, 158, 137, 0.38)',
    label: 'Table'
  },
  autre: {
    bg: 'rgba(130, 117, 103, 0.16)',
    color: '#6f6258',
    border: 'rgba(130, 117, 103, 0.32)',
    label: 'Étape'
  }
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
        <button
  type="button"
  onClick={() => setDatesOpen(true)}
  title="Modifier les dates du voyage"
  style={{
    marginTop: 6,
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: 'var(--muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: 'inherit',
    fontSize: 13,
    textAlign: 'left'
  }}
>
  <Icon name="cal" size={15} style={{ color: 'var(--muted)' }} />
  <span>
    {days.length} jour{days.length > 1 ? 's' : ''}
    {trip.startDate ? ' · ' + fmtDate(trip.startDate) : ''}
    {trip.endDate ? ' → ' + fmtDate(trip.endDate) : ''}
  </span>
  <span style={{ color: 'var(--faint)', fontSize: 12 }}>✎</span>
</button>
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
                    const dayTitle = getDisplayDayTitle(d);
                    const steps = d.steps || [];

                    // Extraire les types d'étapes uniques pour les tags
                    const stepTypes = [...new Set(steps.map(s => s.type))];

                    return (
                      <div
  key={d.id || globalIdx}
  draggable={true}
  data-draggable-day="true"
  onDragStart={(e) => {
  document.body.classList.add('is-dragging-day');

  setDraggingDayIndex(globalIdx);
  setDragOverDayIndex(null);

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(globalIdx));
}}
onDragOver={(e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  if (dragOverDayIndex !== globalIdx) {
    setDragOverDayIndex(globalIdx);
  }
}}
onDragLeave={() => {
  if (dragOverDayIndex === globalIdx) {
    setDragOverDayIndex(null);
  }
}}
onDrop={(e) => {
  e.preventDefault();

  document.body.classList.remove('is-dragging-day');

  const raw = e.dataTransfer.getData('text/plain');
  const from = draggingDayIndex !== null ? draggingDayIndex : Number(raw);
  const to = globalIdx;

  setDraggingDayIndex(null);
  setDragOverDayIndex(null);

  if (!Number.isFinite(from)) return;
  moveDayInSpine(from, to);
}}
onDragEnd={() => {
  document.body.classList.remove('is-dragging-day');

  setDraggingDayIndex(null);
  setDragOverDayIndex(null);
}}
                        onClick={() => {
                          Store.set({ selectedDayIndex: globalIdx });
                          if (onPickDay) onPickDay();
                        }}
                        style={{
                          position: 'relative',
                          padding: on ? '14px 14px 14px 16px' : '10px 14px 10px 16px',
                          borderLeft: on ? '3px solid var(--accent)' : '3px solid transparent',
                          marginBottom: 2, borderRadius: '0 8px 8px 0',
                          background: on ? 'var(--accent-soft)' : 'transparent',
                          opacity: draggingDayIndex === globalIdx
  ? 0.42
  : draggingDayIndex !== null
    ? 0.62
    : (globalIdx < sel && !on ? 0.5 : 1),
                          transition: 'all .15s',
transform: dragOverDayIndex === globalIdx && draggingDayIndex !== null && draggingDayIndex !== globalIdx
  ? 'translateY(3px)'
  : 'none',
outline: dragOverDayIndex === globalIdx && draggingDayIndex !== null && draggingDayIndex !== globalIdx
  ? '1px dashed var(--tan)'
  : 'none',
outlineOffset: -2
                        }}>

{dragOverDayIndex === globalIdx && draggingDayIndex !== null && draggingDayIndex !== globalIdx && (
  <div style={{
    position: 'absolute',
    left: 10,
    right: 10,
    top: -2,
    height: 3,
    borderRadius: 999,
    background: 'var(--tan)',
    boxShadow: '0 0 0 3px rgba(217,182,126,.18)',
    pointerEvents: 'none'
  }} />
)}

<button
  type="button"
  title="Supprimer cette journée"
  onClick={(e) => {
    e.stopPropagation();
    deleteDayInSpine(globalIdx);
  }}
  style={{
    position: 'absolute',
    top: on ? 10 : 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 999,
    border: '1px solid rgba(192,86,63,.28)',
    background: 'rgba(192,86,63,.08)',
    color: '#c0563f',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    fontSize: 12,
    lineHeight: 1,
    opacity: on ? 1 : 0.72,
    zIndex: 3
  }}
>
  🗑
</button>
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
                          marginBottom: steps.length > 0 ? 8 : 0,
paddingRight: 28
                        }}>{dayTitle}</div>

{/* Résumé lisible du jour actif */}
{on && steps.length > 0 && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {steps.slice(0, 3).map((st, k) => {
      const v = stepView(st);
      const name = v.title || spineStepName(st);
      const time = st.time || st.departureTime || st.arrivalTime || '';

      return (
        <div key={k} style={{
          display: 'grid',
          gridTemplateColumns: '34px 1fr',
          gap: 7,
          alignItems: 'baseline'
        }}>
          <span style={{
            fontSize: 10.5,
            color: 'var(--faint)',
            fontWeight: 800,
            fontFamily: 'var(--font-mono, ui-monospace)'
          }}>
            {time || '—'}
          </span>

          <span style={{
            fontSize: 12.5,
            color: 'var(--muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {name}
          </span>
        </div>
      );
    })}

    {steps.length > 3 && (
      <span style={{
        fontSize: 11,
        color: 'var(--faint)',
        fontWeight: 700,
        marginTop: 2
      }}>
        + {steps.length - 3} étape{steps.length - 3 > 1 ? 's' : ''}
      </span>
    )}

    <div style={{
      fontSize: 11,
      color: 'var(--faint)',
      fontWeight: 800,
      marginTop: 4
    }}>
      {spineCountLabel(d)}
    </div>
  </div>
)}

                        {/* Résumé compact des jours non-actifs */}
{!on && steps.length > 0 && (
  <div style={{
    marginTop: 5,
    display: 'flex',
    flexDirection: 'column',
    gap: 3
  }}>
    {spineMainStep(d) && (
      <div style={{
        fontSize: 12,
        color: 'var(--muted)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: '16px'
      }}>
        {spineStepName(spineMainStep(d))}
      </div>
    )}

    <div style={{
      fontSize: 11,
      color: 'var(--faint)',
      fontWeight: 800
    }}>
      {spineCountLabel(d)}
    </div>
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

      {/* Bouton "Nouvelle étape" retiré : l'ajout se fait depuis la journée active. */}
      {dayDeleteAsk && (
  <DayDeleteConfirmModal
    day={dayDeleteAsk.day}
    dayIndex={dayDeleteAsk.dayIndex}
    busy={deletingDay}
    onCancel={() => {
      if (!deletingDay) setDayDeleteAsk(null);
    }}
    onConfirm={confirmDeleteDayInSpine}
  />
)}
      {datesOpen && (
  <TripDatesModal
    trip={trip}
    onClose={() => setDatesOpen(false)}
  />
)}
    </aside>
  );
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

function AroundStepWidget({ step, editMode, onRemove }) {
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    setExpanded(false);
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

  var title = stepDisplayName(step);
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
          onClick={() => setExpanded(v => !v)}
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: 10,
            border: '1px solid var(--outline-variant)',
            background: 'var(--inset)',
            color: 'var(--text)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <Icon name={expanded ? 'chevdown' : 'chevright'} size={13} />
          {expanded ? 'Masquer les pistes' : 'Voir les pistes'}
        </button>

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

function parseTimeToMinutes(value) {
  if (!value || typeof value !== 'string') return null;

  var match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  var h = parseInt(match[1], 10);
  var m = parseInt(match[2], 10);

  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function distanceKmBetweenSteps(a, b) {
  if (!a || !b) return null;

  var lat1 = a.lat;
  var lng1 = a.lng;
  var lat2 = b.lat;
  var lng2 = b.lng;

  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;

  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lng2 - lng1) * Math.PI / 180;
  var rLat1 = lat1 * Math.PI / 180;
  var rLat2 = lat2 * Math.PI / 180;

  var x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function stepDisplayName(step) {
  if (!step) return 'Étape';
  return step.label || step.lieu || step.place || step.arrivee || step.depart || 'Étape';
}

function computeDayScore(day) {
  var steps = (day && day.steps) || [];
  var score = 100;
  var issues = [];
  var tips = [];

  function addIssue(text) {
    if (issues.indexOf(text) === -1) issues.push(text);
  }

  function addTip(text) {
    if (tips.indexOf(text) === -1) tips.push(text);
  }

  function isTransportLike(step) {
    if (!step) return false;

    var type = String(step.type || '').toLowerCase();
    var label = String(
      (step.transportType || '') + ' ' +
      (step.label || '') + ' ' +
      (step.lieu || '') + ' ' +
      (step.depart || '') + ' ' +
      (step.arrivee || '')
    ).toLowerCase();

    return (
      type === 'transport' ||
      label.indexOf('avion') > -1 ||
      label.indexOf('vol') > -1 ||
      label.indexOf('aéroport') > -1 ||
      label.indexOf('airport') > -1 ||
      label.indexOf('train') > -1 ||
      label.indexOf('gare') > -1 ||
      label.indexOf('bus') > -1 ||
      label.indexOf('ferry') > -1
    );
  }

  function isLodgingLike(step) {
    if (!step) return false;
    return String(step.type || '').toLowerCase() === 'logement';
  }

  function shouldCompareDistance(a, b) {
    if (!a || !b) return false;

    if (isTransportLike(a) || isTransportLike(b)) return false;

    if (isLodgingLike(a) || isLodgingLike(b)) {
      var dist = distanceKmBetweenSteps(a, b);
      return dist !== null && dist <= 25;
    }

    return true;
  }

  if (!steps.length) {
    return {
      score: 0,
      label: 'Journée vide',
      summary: 'Aucune étape prévue pour cette journée.',
      issues: ['Aucune étape prévue pour cette journée.'],
      tips: ['Ajoute quelques étapes avant de demander un diagnostic.']
    };
  }

  if (steps.length === 1) {
    score -= 10;
    addTip('Une seule étape : tu peux ajouter un repas, un transport ou une idée à proximité.');
  }

  if (steps.length > 8) {
    score -= 12;
    addIssue('Journée assez dense : plus de 8 étapes prévues.');
    addTip('Prévois des marges ou regroupe certaines étapes par quartier.');
  }

  var usefulStepsForCoords = steps.filter(function(step) {
    return !isTransportLike(step);
  });

  var missingCoords = usefulStepsForCoords.filter(function(step) {
    return step.lat == null || step.lng == null;
  });

  if (missingCoords.length) {
    score -= Math.min(18, missingCoords.length * 4);
    addIssue(missingCoords.length + ' étape' + (missingCoords.length > 1 ? 's' : '') + ' sans coordonnées précises.');
    addTip('Ajoute une localisation précise aux visites, restaurants et logements pour améliorer la carte.');
  }

  var timedSteps = steps
    .map(function(step, index) {
      return {
        step: step,
        index: index,
        start: parseTimeToMinutes(step.time),
        end: parseTimeToMinutes(step.timeEnd)
      };
    })
    .filter(function(item) {
      return item.start !== null;
    })
    .sort(function(a, b) {
      return a.start - b.start;
    });

  for (var i = 0; i < timedSteps.length - 1; i++) {
    var current = timedSteps[i];
    var next = timedSteps[i + 1];

    if (isTransportLike(current.step) || isTransportLike(next.step)) {
      continue;
    }

    var currentEnd = current.end !== null ? current.end : current.start + 60;
    var gap = next.start - currentEnd;

    if (gap < 0) {
      score -= 14;
      addIssue('Chevauchement possible entre “' + stepDisplayName(current.step) + '” et “' + stepDisplayName(next.step) + '”.');
      addTip('Décale une des deux étapes ou ajoute une marge.');
    } else if (gap < 20) {
      score -= 6;
      addIssue('Marge courte entre “' + stepDisplayName(current.step) + '” et “' + stepDisplayName(next.step) + '”.');
      addTip('Prévois au moins 20 à 30 min entre deux lieux différents.');
    } else if (gap > 240) {
      score -= 3;
      addTip('Grand trou dans la journée : tu peux ajouter une pause, une balade ou laisser ce temps libre volontairement.');
    }
  }

  var longWalkWarningAdded = false;

  for (var j = 0; j < steps.length - 1; j++) {
    if (!shouldCompareDistance(steps[j], steps[j + 1])) continue;

    var dist = distanceKmBetweenSteps(steps[j], steps[j + 1]);

    if (dist !== null && dist > 8) {
      score -= 8;
      addIssue('Trajet probablement long entre “' + stepDisplayName(steps[j]) + '” et “' + stepDisplayName(steps[j + 1]) + '”.');

      if (!longWalkWarningAdded) {
        addTip('Teste métro, bus, voiture ou vélo dans l’outil Itinéraire pour vérifier le meilleur mode.');
        longWalkWarningAdded = true;
      }
    } else if (dist !== null && dist > 3) {
      score -= 4;

      if (!longWalkWarningAdded) {
        addTip('Un trajet de plus de 3 km peut être pénible à pied : compare avec vélo, bus ou transport.');
        longWalkWarningAdded = true;
      }
    }
  }

  var hasRestaurant = steps.some(function(step) {
    return step.type === 'restaurant';
  });

  var hasLongNonTransportDay = steps.filter(function(step) {
    return !isTransportLike(step);
  }).length >= 3;

  if (!hasRestaurant && hasLongNonTransportDay) {
    score -= 5;
    addTip('Aucun repas prévu : pense à réserver une pause déjeuner ou dîner.');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  var label = 'Très cohérent';
  if (score < 50) label = 'À revoir';
  else if (score < 70) label = 'Correct, à ajuster';
  else if (score < 85) label = 'Bien équilibré';

  if (!issues.length) {
    issues.push('Aucun gros problème détecté avec les informations disponibles.');
  }

  if (!tips.length) {
    tips.push('La journée semble cohérente. Vérifie quand même les horaires réels, réservations et temps de transport.');
  }

  var summary = issues[0];
  if (summary === 'Aucun gros problème détecté avec les informations disponibles.') {
    summary = tips[0] || summary;
  }

  return {
    score: score,
    label: label,
    summary: summary,
    issues: issues.slice(0, 4),
    tips: tips.slice(0, 4)
  };
}

function DayScoreWidget({ day, editMode, onRemove }) {
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    setExpanded(false);
  }, [day?.id]);

  var result = computeDayScore(day);

  var scoreColor = 'var(--accent)';
  if (result.score < 50) scoreColor = 'var(--danger)';
  else if (result.score < 70) scoreColor = 'var(--tan)';

  var summary = result.summary || result.issues[0] || result.tips[0] || 'Diagnostic indicatif basé sur les étapes disponibles.';

  return (
    <div
      key="dayScore"
      style={{
        background: 'var(--card)',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(82,98,91,0.05)',
        border: '1px solid var(--outline-variant)',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--outline-variant)',
          background: 'var(--soft)'
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Icon name="route" size={16} style={{ color: 'var(--tan)' }} />
          Score & trajets
        </span>

        {editMode && (
          <button
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

      <div style={{ padding: 16, background: 'var(--card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'var(--bg)',
              border: '2px solid ' + scoreColor,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 22,
                  lineHeight: 1,
                  color: scoreColor
                }}
              >
                {result.score}
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--faint)' }}>
                /100
              </div>
            </div>
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: 'var(--text)',
                marginBottom: 4
              }}
            >
              {result.label}
            </div>

            <div
              style={{
                fontSize: 12.5,
                lineHeight: '18px',
                color: 'var(--muted)'
              }}
            >
              {summary}
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '9px 12px',
            borderRadius: 10,
            border: '1px solid var(--outline-variant)',
            background: 'var(--inset)',
            color: 'var(--text)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <Icon name={expanded ? 'chevdown' : 'chevright'} size={13} />
          {expanded ? 'Masquer les conseils' : 'Voir les conseils'}
        </button>

        {expanded && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'var(--faint)',
                  marginBottom: 7
                }}
              >
                Points à vérifier
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.issues.map(function(issue, i) {
                  return (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, lineHeight: '18px', color: 'var(--text)' }}>
                      <span style={{ color: scoreColor, fontWeight: 900 }}>•</span>
                      <span>{issue}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'var(--faint)',
                  marginBottom: 7
                }}
              >
                Pistes pratiques
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.tips.map(function(tip, i) {
                  return (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, lineHeight: '18px', color: 'var(--muted)' }}>
                      <Icon name="sparkle" size={12} style={{ color: 'var(--tan)', flexShrink: 0, marginTop: 2 }} />
                      <span>{tip}</span>
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

function GlobalNoteWidget({ trip, editMode, onRemove }) {
  const editorRef = React.useRef(null);
  const [draft, setDraft] = React.useState(trip?.globalNote || '');
  const [saving, setSaving] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    const next = trip?.globalNote || '';
    setDraft(next);

    if (editorRef.current && editorRef.current.innerHTML !== next) {
      editorRef.current.innerHTML = next;
    }
  }, [trip?.id, trip?.globalNote]);

  if (!trip) return null;

  function sanitizeNoteHtml(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = String(html || '');

    tpl.content.querySelectorAll('script, style, iframe, object, embed').forEach(el => el.remove());

    tpl.content.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        const name = attr.name.toLowerCase();
        const value = String(attr.value || '').toLowerCase();

        if (name.startsWith('on')) el.removeAttribute(attr.name);
        if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return tpl.innerHTML;
  }

  function syncDraft() {
    const html = sanitizeNoteHtml(editorRef.current?.innerHTML || '');
    setDraft(html);
  }

  function plainText() {
    return String(editorRef.current?.innerText || '').trim();
  }

  function runCommand(command, value) {
    if (!editorRef.current) return;

    editorRef.current.focus();
    document.execCommand(command, false, value || null);
    syncDraft();
  }

  const dirty = draft !== (trip.globalNote || '');
  const empty = !plainText() && !draft.replace(/<[^>]*>/g, '').trim();

  async function saveGlobalNote() {
    if (!trip.id || saving) return;

    const html = sanitizeNoteHtml(editorRef.current?.innerHTML || '');

    setSaving(true);

    try {
      await window.SB.updateTrip(trip.id, { globalNote: html });

      const updatedTrip = await window.SB.loadTrip(trip.id);
      Store.set({ trip: updatedTrip });

      setDraft(html);
      Store.showToast(html ? 'Carnet du voyage sauvegardé' : 'Carnet du voyage vidé');
    } catch (error) {
      Store.showToast('Erreur carnet : ' + (error.message || error));
    } finally {
      setSaving(false);
    }
  }

  function ToolButton({ children, title, onClick, danger }) {
    return (
      <button
        type="button"
        title={title}
        onMouseDown={e => e.preventDefault()}
        onClick={onClick}
        style={{
          minWidth: 30,
          height: 30,
          padding: '0 9px',
          borderRadius: 9,
          border: '1px solid var(--outline-variant)',
          background: danger ? 'rgba(192,86,63,.08)' : 'var(--inset)',
          color: danger ? '#c0563f' : 'var(--text)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 12,
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      key="globalNote"
      style={{
        background: 'var(--card)',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(82,98,91,0.05)',
        border: '1px solid var(--outline-variant)',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--outline-variant)',
          background: 'var(--soft)'
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Icon name="file" size={16} style={{ color: 'var(--tan)' }} />
          Carnet du voyage
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={saveGlobalNote}
            disabled={saving || !dirty}
            style={{
              border: 'none',
              cursor: saving || !dirty ? 'default' : 'pointer',
              background: dirty ? 'var(--accent)' : 'var(--inset)',
              color: dirty ? 'var(--accent-ink)' : 'var(--faint)',
              borderRadius: 8,
              padding: '5px 9px',
              fontSize: 11,
              fontWeight: 800,
              fontFamily: 'inherit'
            }}
          >
            {saving ? '...' : dirty ? 'Sauver' : 'À jour'}
          </button>

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
      </div>

      <div style={{ padding: 14, background: 'var(--card)' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            padding: 8,
            borderRadius: 12,
            background: 'var(--inset)',
            border: '1px solid var(--outline-variant)',
            marginBottom: 10
          }}
        >
          <ToolButton title="Gras" onClick={() => runCommand('bold')}>
            <b>B</b>
          </ToolButton>

          <ToolButton title="Italique" onClick={() => runCommand('italic')}>
            <i>I</i>
          </ToolButton>

          <ToolButton title="Souligné" onClick={() => runCommand('underline')}>
            <u>U</u>
          </ToolButton>

          <ToolButton title="Petit texte" onClick={() => runCommand('fontSize', '2')}>
            A-
          </ToolButton>

          <ToolButton title="Texte normal" onClick={() => runCommand('fontSize', '3')}>
            A
          </ToolButton>

          <ToolButton title="Grand texte" onClick={() => runCommand('fontSize', '5')}>
            A+
          </ToolButton>

          <ToolButton title="Liste à puces" onClick={() => runCommand('insertUnorderedList')}>
            • liste
          </ToolButton>

          <ToolButton title="Liste numérotée" onClick={() => runCommand('insertOrderedList')}>
            1. liste
          </ToolButton>

          <ToolButton title="Effacer le style" onClick={() => runCommand('removeFormat')} danger>
            Effacer
          </ToolButton>
        </div>

        <div style={{ position: 'relative' }}>
          {empty && !focused && (
            <div
              style={{
                position: 'absolute',
                top: 13,
                left: 14,
                right: 14,
                color: 'var(--faint)',
                fontSize: 13.5,
                lineHeight: '20px',
                pointerEvents: 'none',
                fontStyle: 'italic'
              }}
            >
              Notes globales du voyage : idées, rappels, adresses, choses à vérifier…
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={syncDraft}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              syncDraft();
            }}
            style={{
              width: '100%',
              minHeight: 150,
              maxHeight: 320,
              overflowY: 'auto',
              border: '1px solid var(--outline-variant)',
              borderRadius: 12,
              background: 'var(--bg)',
              color: 'var(--text)',
              padding: '12px 14px',
              fontFamily: 'inherit',
              fontSize: 13.5,
              lineHeight: '21px',
              outline: 'none',
              boxShadow: focused ? '0 0 0 3px rgba(217,182,126,.18)' : 'inset 0 1px 2px rgba(0,0,0,0.03)'
            }}
          />
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 11.5,
            color: dirty ? 'var(--accent)' : 'var(--faint)',
            fontWeight: 700,
            lineHeight: '16px'
          }}
        >
          {dirty
            ? 'Modifications non sauvegardées'
            : 'Sauvegardé sur tout le voyage'}
        </div>
      </div>
    </div>
  );
}

function ChecklistWidget({ day, trip, editMode, onRemove }) {
  const [todoDraft, setTodoDraft] = React.useState('');
  const [savingTodo, setSavingTodo] = React.useState(false);
  const [done, setDone] = React.useState({});
  const inputRef = React.useRef(null);

  const items = Array.isArray(day?.todo) ? day.todo : [];

  React.useEffect(() => {
    setTodoDraft('');
  }, [day?.id]);

  async function saveTodoItems(nextItems) {
  if (!day?.id || !trip?.id || !window.SB || !window.SB.updateDay) return;

  setSavingTodo(true);

  try {
    await window.SB.updateDay(day.id, { todo: nextItems });

    const refreshed = await window.SB.loadTrip(trip.id);
    Store.set({ trip: refreshed });
  } catch (e) {
    console.error('Erreur checklist :', e);
    Store.showToast('Impossible de sauvegarder la checklist.');
  } finally {
    setSavingTodo(false);
  }
}

async function addTodoItem() {
  const text = todoDraft.trim();
  if (!text || savingTodo) return;

  const next = [...items, text];

  setTodoDraft('');
  await saveTodoItems(next);

  setTimeout(() => {
    if (inputRef.current) inputRef.current.focus();
  }, 0);
}

async function deleteTodoItem(index) {
  if (savingTodo) return;

  const next = items.filter((_, i) => i !== index);
  await saveTodoItems(next);
}

     return (
    <div style={{
      background: 'var(--card)',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(82,98,91,0.05)',
      border: '1px solid var(--outline-variant)',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--outline-variant)',
        background: 'var(--soft)'
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Icon name="check" size={16} style={{ color: 'var(--accent)' }} />
          À ne pas oublier
        </span>

        {editMode && (
          <button
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

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.length > 0 ? items.map((t, i) => {
            const k = (day?.id || 'day') + '_' + i;
            const ok = !!done[k];

            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 0',
                borderBottom: i < items.length - 1 ? '1px solid var(--line2)' : 'none'
              }}>
                <button
                  type="button"
                  onClick={() => setDone(d => ({ ...d, [k]: !d[k] }))}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    flexShrink: 0,
                    border: ok ? 'none' : '1.5px solid var(--outline)',
                    background: ok ? 'var(--accent)' : 'var(--card)',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {ok && <Icon name="check" size={14} sw={2.4} style={{ color: '#fff' }} />}
                </button>

                <span style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 13.5,
                  color: ok ? 'var(--faint)' : 'var(--text)',
                  textDecoration: ok ? 'line-through' : 'none',
                  opacity: ok ? 0.7 : 1,
                  lineHeight: '19px'
                }}>
                  {t}
                </span>

                <button
                  type="button"
                  onClick={() => deleteTodoItem(i)}
                  title="Supprimer"
                  disabled={savingTodo}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--faint)',
                    cursor: savingTodo ? 'wait' : 'pointer',
                    padding: 4
                  }}
                >
                  <Icon name="x" size={13} />
                </button>
              </div>
            );
          }) : (
            <div style={{
              fontSize: 13,
              color: 'var(--faint)',
              fontStyle: 'italic'
            }}>
              Ajoute tes rappels pour cette journée.
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <input
              ref={inputRef}
              value={todoDraft}
              onChange={e => setTodoDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addTodoItem();
              }}
              placeholder="Passeport, billets, adaptateur…"
              style={{
                flex: 1,
                minWidth: 0,
                border: '1px solid var(--line)',
                background: 'var(--inset)',
                color: 'var(--text)',
                borderRadius: 10,
                padding: '8px 10px',
                fontFamily: 'inherit',
                fontSize: 13,
                outline: 'none'
              }}
            />

            <button
              type="button"
              onClick={addTodoItem}
              disabled={savingTodo || !todoDraft.trim()}
              style={{
                border: 'none',
                background: 'var(--accent)',
                color: 'var(--accent-ink)',
                borderRadius: 10,
                padding: '0 11px',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 800,
                cursor: savingTodo ? 'wait' : 'pointer',
                opacity: savingTodo || !todoDraft.trim() ? 0.65 : 1
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayNoteWidget({ day, trip, editMode, onRemove }) {
  const [noteDraft, setNoteDraft] = React.useState(day?.note || '');
  const [savingNote, setSavingNote] = React.useState(false);

  React.useEffect(() => {
    setNoteDraft(day?.note || '');
  }, [day?.id, day?.note]);

  const dirty = noteDraft !== (day?.note || '');

  async function saveNote() {
    if (!day?.id || savingNote) return;

    setSavingNote(true);

    try {
      await window.SB.updateDay(day.id, { note: noteDraft });

      const updatedTrip = await window.SB.loadTrip(trip.id);
      Store.set({ trip: updatedTrip });

      Store.showToast(dirty ? 'Journal sauvegardé' : 'Journal à jour');
    } catch (error) {
      Store.showToast('Erreur journal : ' + (error.message || error));
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div key="note" style={{
      background: 'var(--soft)',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(82,98,91,0.05)',
      border: '1px solid rgba(217,182,126,0.3)',
      padding: 16,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 32,
        height: 32,
        background: 'rgba(217,182,126,0.1)',
        borderRadius: '0 0 0 12px'
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Icon name="sparkle" size={16} style={{ color: 'var(--tan)' }} />
          Journal du jour
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={saveNote}
            disabled={savingNote || !dirty}
            style={{
              border: 'none',
              cursor: savingNote || !dirty ? 'default' : 'pointer',
              background: dirty ? 'var(--accent)' : 'var(--inset)',
              color: dirty ? 'var(--accent-ink)' : 'var(--faint)',
              borderRadius: 8,
              padding: '5px 9px',
              fontSize: 11,
              fontWeight: 800,
              fontFamily: 'inherit'
            }}
          >
            {savingNote ? '...' : dirty ? 'Sauver' : 'À jour'}
          </button>

          {editMode && (
            <button
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
      </div>

      <textarea
        value={noteDraft}
        onChange={e => setNoteDraft(e.target.value)}
        placeholder="Écris une note pour cette journée..."
        rows={5}
        style={{
          width: '100%',
          minHeight: 92,
          resize: 'vertical',
          border: '1px solid var(--outline-variant)',
          borderRadius: 11,
          background: 'var(--card)',
          color: 'var(--text)',
          padding: '10px 12px',
          fontFamily: 'inherit',
          fontSize: 13.5,
          lineHeight: '20px',
          outline: 'none',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
        }}
      />

      <div style={{
        marginTop: 8,
        fontSize: 11.5,
        color: dirty ? 'var(--accent)' : 'var(--faint)',
        fontWeight: 700
      }}>
        {dirty ? 'Modifications non sauvegardées' : 'Sauvegardé sur ce jour'}
      </div>
    </div>
  );
}

function CurrencyWidget({ editMode, onRemove }) {
  const CURRENCY_OPTIONS = [
    { code: 'EUR', label: 'Euro' },
    { code: 'KRW', label: 'Won sud-coréen' },
    { code: 'USD', label: 'Dollar américain' },
    { code: 'JPY', label: 'Yen japonais' },
    { code: 'GBP', label: 'Livre sterling' },
    { code: 'CHF', label: 'Franc suisse' },
    { code: 'CAD', label: 'Dollar canadien' },
    { code: 'AUD', label: 'Dollar australien' }
  ];

  const FALLBACK_RATES = {
    EUR_KRW: 1600,
    KRW_EUR: 0.000625,
    EUR_USD: 1.08,
    USD_EUR: 0.93,
    EUR_JPY: 165,
    JPY_EUR: 0.0061,
    EUR_GBP: 0.86,
    GBP_EUR: 1.16,
    EUR_CHF: 0.95,
    CHF_EUR: 1.05
  };

  const [amount, setAmount] = React.useState('100');
  const [from, setFrom] = React.useState('EUR');
  const [to, setTo] = React.useState('KRW');
  const [rate, setRate] = React.useState(1600);
  const [manualRate, setManualRate] = React.useState('1600');
  const [rateDate, setRateDate] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [autoRate, setAutoRate] = React.useState(true);

  function pairKey(a, b) {
    return a + '_' + b;
  }

  function fallbackRate(a, b) {
    if (a === b) return 1;
    return FALLBACK_RATES[pairKey(a, b)] || 1;
  }

  function formatMoney(value, code) {
    const n = Number(value) || 0;
    const max = code === 'KRW' || code === 'JPY' ? 0 : 2;

    return n.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: max
    }) + ' ' + code;
  }

  async function fetchRate(a, b) {
    if (!a || !b) return;
    if (a === b) {
      setRate(1);
      setManualRate('1');
      setRateDate('');
      return;
    }

    setLoading(true);

    try {
      const url =
        'https://api.frankfurter.dev/v1/latest?from=' +
        encodeURIComponent(a) +
        '&to=' +
        encodeURIComponent(b);

      const res = await fetch(url);
      if (!res.ok) throw new Error('Taux indisponible');

      const data = await res.json();
      const nextRate = data && data.rates ? Number(data.rates[b]) : 0;

      if (!nextRate) throw new Error('Taux introuvable');

      setRate(nextRate);
      setManualRate(String(nextRate));
      setRateDate(data.date || '');

      localStorage.setItem('atelier_currency_rate_' + pairKey(a, b), String(nextRate));
      if (data.date) localStorage.setItem('atelier_currency_date_' + pairKey(a, b), data.date);
    } catch (e) {
      const saved = Number(localStorage.getItem('atelier_currency_rate_' + pairKey(a, b)));
      const nextRate = saved || fallbackRate(a, b);

      setRate(nextRate);
      setManualRate(String(nextRate));
      setRateDate(localStorage.getItem('atelier_currency_date_' + pairKey(a, b)) || 'manuel');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (autoRate) {
      fetchRate(from, to);
    } else {
      const saved = Number(localStorage.getItem('atelier_currency_rate_' + pairKey(from, to)));
      const nextRate = saved || fallbackRate(from, to);
      setRate(nextRate);
      setManualRate(String(nextRate));
      setRateDate(localStorage.getItem('atelier_currency_date_' + pairKey(from, to)) || 'manuel');
    }
  }, [from, to, autoRate]);

  const amountNumber = Number(String(amount || '').replace(',', '.')) || 0;
  const rateNumber = Number(String(manualRate || '').replace(',', '.')) || 0;
  const converted = amountNumber * rateNumber;

  const selectStyle = {
    width: '100%',
    padding: '8px 9px',
    borderRadius: 9,
    border: '1px solid var(--outline-variant)',
    background: 'var(--inset)',
    color: 'var(--text)',
    fontFamily: 'inherit',
    fontSize: 12.5,
    outline: 'none'
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 10px',
    borderRadius: 9,
    border: '1px solid var(--outline-variant)',
    background: 'var(--inset)',
    color: 'var(--text)',
    fontFamily: 'inherit',
    fontSize: 13,
    outline: 'none'
  };

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function saveManualRate(value) {
    setManualRate(value);
    setRate(Number(String(value || '').replace(',', '.')) || 0);
    localStorage.setItem('atelier_currency_rate_' + pairKey(from, to), value);
    localStorage.setItem('atelier_currency_date_' + pairKey(from, to), 'manuel');
    setRateDate('manuel');
  }

  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(82,98,91,0.05)',
      border: '1px solid var(--outline-variant)',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--outline-variant)',
        background: 'var(--soft)'
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Icon name="arrow" size={16} style={{ color: 'var(--accent)' }} />
          Convertisseur
        </span>

        {editMode && (
          <button
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

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: 'var(--faint)',
            marginBottom: 5
          }}>
            Montant
          </div>

          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="100"
            style={{
              ...inputStyle,
              fontSize: 18,
              fontWeight: 800
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 34px 1fr', gap: 8, alignItems: 'end' }}>
          <div>
            <div style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: 'var(--faint)',
              marginBottom: 5
            }}>
              Depuis
            </div>

            <select value={from} onChange={e => setFrom(e.target.value)} style={selectStyle}>
              {CURRENCY_OPTIONS.map(c => (
                <option key={c.code} value={c.code}>{c.code} · {c.label}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={swap}
            title="Inverser"
            style={{
              height: 34,
              width: 34,
              borderRadius: 9,
              border: '1px solid var(--outline-variant)',
              background: 'var(--card)',
              color: 'var(--accent)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <Icon name="arrow" size={14} />
          </button>

          <div>
            <div style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: 'var(--faint)',
              marginBottom: 5
            }}>
              Vers
            </div>

            <select value={to} onChange={e => setTo(e.target.value)} style={selectStyle}>
              {CURRENCY_OPTIONS.map(c => (
                <option key={c.code} value={c.code}>{c.code} · {c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{
          background: 'var(--inset)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 12,
          padding: '12px 13px'
        }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
            Résultat estimé
          </div>

          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 26,
            lineHeight: '30px',
            color: 'var(--accent)'
          }}>
            {formatMoney(converted, to)}
          </div>

          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            {formatMoney(amountNumber, from)} ≈ {formatMoney(converted, to)}
          </div>
        </div>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12.5,
          color: 'var(--muted)',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={autoRate}
            onChange={e => setAutoRate(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          Taux automatique
        </label>

        <div>
          <div style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: 'var(--faint)',
            marginBottom: 5
          }}>
            Taux utilisé
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              1 {from} =
            </span>

            <input
              value={manualRate}
              onChange={e => {
                setAutoRate(false);
                saveManualRate(e.target.value);
              }}
              inputMode="decimal"
              style={inputStyle}
            />

            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {to}
            </span>
          </div>

          <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 6, lineHeight: '16px' }}>
            {loading
              ? 'Mise à jour du taux…'
              : autoRate
                ? 'Taux récupéré automatiquement' + (rateDate ? ' · ' + rateDate : '')
                : 'Taux manuel' + (rateDate ? ' · ' + rateDate : '')}
          </div>

          <button
            type="button"
            onClick={() => fetchRate(from, to)}
            style={{
              marginTop: 8,
              width: '100%',
              border: '1px solid var(--outline-variant)',
              background: 'var(--card)',
              color: 'var(--text)',
              borderRadius: 9,
              padding: '8px 10px',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {loading ? 'Mise à jour…' : 'Actualiser le taux'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarWidget({ trip, editMode, onRemove }) {
  const { selectedDayIndex } = Store.useStore();

  function parseLocalDate(iso) {
    if (!iso) return null;
    return new Date(String(iso) + 'T12:00:00');
  }

  function toISO(date) {
    if (!date) return '';
    return date.toISOString().slice(0, 10);
  }

  function addDaysISO(baseISO, diff) {
    const d = parseLocalDate(baseISO);
    if (!d) return '';

    d.setDate(d.getDate() + diff);
    return toISO(d);
  }

  function monthKeyFromISO(iso) {
    const d = parseLocalDate(iso) || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function monthLabel(monthKey) {
    const d = parseLocalDate(monthKey + '-01') || new Date();

    return d.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
  }

  function safeId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'cal_' + Date.now() + '_' + Math.random().toString(16).slice(2);
  }

  const tripStart = trip?.startDate || '';
  const tripEnd = trip?.endDate || '';
  const selectedDay = Array.isArray(trip?.days) ? trip.days[selectedDayIndex || 0] : null;
  const selectedISO = selectedDay?.dateISO || '';

  const storageKey = 'atelier_calendar_marks_' + (trip?.id || 'global');

  const [linkedMode, setLinkedMode] = React.useState(true);
  const [monthKey, setMonthKey] = React.useState(monthKeyFromISO(selectedISO || tripStart || toISO(new Date())));
  const legendStorageKey = 'atelier_calendar_legend_' + (trip?.id || 'global');
  const [marks, setMarks] = React.useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : null;

      return parsed || {
        points: [],
        ranges: []
      };
    } catch (e) {
      return {
        points: [],
        ranges: []
      };
    }
  });

  const [legend, setLegend] = React.useState(() => {
  try {
    const raw = localStorage.getItem(legendStorageKey);
    const parsed = raw ? JSON.parse(raw) : null;

    return parsed || {
      tan: 'Voyage',
      green: 'Réservé',
      blue: 'À vérifier',
      red: 'Important'
    };
  } catch (e) {
    return {
      tan: 'Voyage',
      green: 'Réservé',
      blue: 'À vérifier',
      red: 'Important'
    };
  }
});

  const [kind, setKind] = React.useState('point');
  const [label, setLabel] = React.useState('');
  const [date, setDate] = React.useState(selectedISO || tripStart || toISO(new Date()));
  const [start, setStart] = React.useState(selectedISO || tripStart || toISO(new Date()));
  const [end, setEnd] = React.useState(selectedISO || tripStart || toISO(new Date()));
  const [color, setColor] = React.useState('tan');

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : null;

      setMarks(parsed || {
        points: [],
        ranges: []
      });
    } catch (e) {
      setMarks({
        points: [],
        ranges: []
      });
    }
  }, [storageKey]);

  React.useEffect(() => {
  try {
    const raw = localStorage.getItem(legendStorageKey);
    const parsed = raw ? JSON.parse(raw) : null;

    setLegend(parsed || {
      tan: 'Voyage',
      green: 'Réservé',
      blue: 'À vérifier',
      red: 'Important'
    });
  } catch (e) {
    setLegend({
      tan: 'Voyage',
      green: 'Réservé',
      blue: 'À vérifier',
      red: 'Important'
    });
  }
}, [legendStorageKey]);

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(marks));
  }, [storageKey, marks]);
  React.useEffect(() => {
  localStorage.setItem(legendStorageKey, JSON.stringify(legend));
}, [legendStorageKey, legend]);

  React.useEffect(() => {
    if (selectedISO) {
      setMonthKey(monthKeyFromISO(selectedISO));
    }
  }, [selectedISO]);

  const COLORS = {
    tan: {
      label: 'Doré',
      value: 'var(--tan)',
      soft: 'rgba(217,182,126,.22)'
    },
    green: {
      label: 'Vert',
      value: '#6f9d7b',
      soft: 'rgba(111,157,123,.18)'
    },
    blue: {
      label: 'Bleu',
      value: '#5e87a5',
      soft: 'rgba(94,135,165,.18)'
    },
    red: {
      label: 'Rouge',
      value: '#c0563f',
      soft: 'rgba(192,86,63,.16)'
    }
  };

  function savePoint() {
    if (!date) return;

    const next = {
      ...marks,
      points: [
        ...(marks.points || []),
        {
          id: safeId(),
          date,
          color,
          label: label.trim()
        }
      ]
    };

    setMarks(next);
    setLabel('');
  }

  function saveRange() {
    if (!start || !end) return;

    const a = start <= end ? start : end;
    const b = start <= end ? end : start;

    const next = {
      ...marks,
      ranges: [
        ...(marks.ranges || []),
        {
          id: safeId(),
          start: a,
          end: b,
          color,
          label: label.trim()
        }
      ]
    };

    setMarks(next);
    setLabel('');
  }

  function deleteMark(type, id) {
    if (type === 'point') {
      setMarks({
        ...marks,
        points: (marks.points || []).filter(item => item.id !== id)
      });
    } else {
      setMarks({
        ...marks,
        ranges: (marks.ranges || []).filter(item => item.id !== id)
      });
    }
  }

  function previousMonth() {
    const d = parseLocalDate(monthKey + '-01');
    d.setMonth(d.getMonth() - 1);
    setMonthKey(monthKeyFromISO(toISO(d)));
  }

  function nextMonth() {
    const d = parseLocalDate(monthKey + '-01');
    d.setMonth(d.getMonth() + 1);
    setMonthKey(monthKeyFromISO(toISO(d)));
  }

  function goToTrip() {
    if (tripStart) {
      setMonthKey(monthKeyFromISO(tripStart));
    }
  }

  const monthStart = parseLocalDate(monthKey + '-01');
  const firstDay = new Date(monthStart);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  firstDay.setDate(firstDay.getDate() - mondayOffset);

  const cells = [];

  for (let i = 0; i < 42; i += 1) {
    cells.push(addDaysISO(toISO(firstDay), i));
  }

  const weekLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  function isInCurrentMonth(iso) {
    return iso && iso.slice(0, 7) === monthKey;
  }

  function isTripDate(iso) {
    if (!linkedMode || !tripStart || !tripEnd || !iso) return false;
    return iso >= tripStart && iso <= tripEnd;
  }

  function isToday(iso) {
    return iso === toISO(new Date());
  }

  function pointsForDay(iso) {
    return (marks.points || []).filter(p => p.date === iso);
  }

  function rangesForDay(iso) {
    return (marks.ranges || []).filter(r => {
      if (!r.start || !r.end || !iso) return false;
      return iso >= r.start && iso <= r.end;
    });
  }

  function dayNumber(iso) {
    const d = parseLocalDate(iso);
    return d ? d.getDate() : '';
  }

  const allMarks = [
    ...(marks.points || []).map(item => ({ ...item, type: 'point' })),
    ...(marks.ranges || []).map(item => ({ ...item, type: 'range' }))
  ].sort((a, b) => {
    const da = a.date || a.start || '';
    const db = b.date || b.start || '';
    return da.localeCompare(db);
  });

  return (
    <div
      key="calendar"
      style={{
        background: 'var(--card)',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(82,98,91,0.05)',
        border: '1px solid var(--outline-variant)',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--outline-variant)',
          background: 'var(--soft)'
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Icon name="cal" size={16} style={{ color: 'var(--tan)' }} />
          Calendrier
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

      <div style={{ padding: 14 }}>
        <div
          style={{
            display: 'flex',
            gap: 6,
            background: 'var(--inset)',
            borderRadius: 999,
            padding: 4,
            marginBottom: 12
          }}
        >
          <button
            type="button"
            onClick={() => setLinkedMode(true)}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 999,
              padding: '7px 8px',
              background: linkedMode ? 'var(--accent)' : 'transparent',
              color: linkedMode ? 'var(--accent-ink)' : 'var(--muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 11.5,
              fontWeight: 800
            }}
          >
            Voyage
          </button>

          <button
            type="button"
            onClick={() => setLinkedMode(false)}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 999,
              padding: '7px 8px',
              background: !linkedMode ? 'var(--accent)' : 'transparent',
              color: !linkedMode ? 'var(--accent-ink)' : 'var(--muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 11.5,
              fontWeight: 800
            }}
          >
            Libre
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10
          }}
        >
          <button
            type="button"
            onClick={previousMonth}
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              border: '1px solid var(--outline-variant)',
              background: 'var(--inset)',
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            ‹
          </button>

          <button
            type="button"
            onClick={goToTrip}
            title="Revenir au voyage"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text)',
              cursor: tripStart ? 'pointer' : 'default',
              fontFamily: 'var(--font-serif)',
              fontSize: 18,
              fontStyle: 'italic',
              textTransform: 'capitalize'
            }}
          >
            {monthLabel(monthKey)}
          </button>

          <button
            type="button"
            onClick={nextMonth}
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              border: '1px solid var(--outline-variant)',
              background: 'var(--inset)',
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            ›
          </button>
        </div>

        {linkedMode && tripStart && tripEnd && (
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--muted)',
              marginBottom: 10,
              lineHeight: '16px'
            }}
          >
            Voyage affiché : {fmtDate(tripStart)} → {fmtDate(tripEnd)}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
            marginBottom: 4
          }}
        >
          {weekLabels.map((label, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                fontSize: 10,
                fontWeight: 900,
                color: 'var(--faint)',
                paddingBottom: 3
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4
          }}
        >
          {cells.map((iso) => {
            const inMonth = isInCurrentMonth(iso);
            const tripDay = isTripDate(iso);
            const today = isToday(iso);
            const selected = selectedISO && iso === selectedISO;
            const dayPoints = pointsForDay(iso);
            const dayRanges = rangesForDay(iso);

            return (
              <div
                key={iso}
                title={iso}
                style={{
                  position: 'relative',
                  minHeight: 34,
                  borderRadius: 10,
                  border: selected
                    ? '1.5px solid var(--accent)'
                    : today
                      ? '1px solid var(--tan)'
                      : '1px solid transparent',
                  background: tripDay
                    ? 'var(--accent-soft)'
                    : inMonth
                      ? 'var(--bg)'
                      : 'transparent',
                  color: inMonth ? 'var(--text)' : 'var(--faint)',
                  opacity: inMonth ? 1 : 0.45,
                  padding: 4,
                  overflow: 'hidden'
                }}
              >
                {dayRanges.slice(0, 2).map((r, idx) => {
                  const c = COLORS[r.color] || COLORS.tan;

                  return (
                    <div
                      key={r.id + '_' + idx}
                      style={{
                        position: 'absolute',
                        left: 3,
                        right: 3,
                        bottom: 4 + idx * 5,
                        height: 4,
                        borderRadius: 999,
                        background: c.value,
                        opacity: 0.78
                      }}
                    />
                  );
                })}

                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    fontSize: 11,
                    fontWeight: selected ? 900 : 700,
                    textAlign: 'center'
                  }}
                >
                  {dayNumber(iso)}
                </div>

                {dayPoints.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 3,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 3,
                      zIndex: 2
                    }}
                  >
                    {dayPoints.slice(0, 3).map(p => {
                      const c = COLORS[p.color] || COLORS.tan;

                      return (
                        <span
                          key={p.id}
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: c.value,
                            boxShadow: '0 0 0 1px var(--card)'
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 12,
            border: '1px solid var(--outline-variant)',
            background: 'var(--inset)',
            borderRadius: 12,
            padding: '9px 10px'
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 900,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'var(--faint)',
              marginBottom: 8
            }}
          >
            Légende
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.keys(COLORS).map(key => {
              const c = COLORS[key];

              return (
                <div
                  key={key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '12px 1fr',
                    gap: 8,
                    alignItems: 'center'
                  }}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: c.value,
                      boxShadow: '0 0 0 2px var(--card)'
                    }}
                  />

                  <input
                    value={legend[key] || ''}
                    onChange={e => {
                      const value = e.target.value;
                      setLegend(prev => ({
                        ...prev,
                        [key]: value
                      }));
                    }}
                    placeholder={c.label}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--muted)',
                      fontFamily: 'inherit',
                      fontSize: 11.5,
                      fontWeight: 700,
                      outline: 'none',
                      padding: '2px 0'
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            height: 1,
            background: 'var(--outline-variant)',
            margin: '14px 0'
          }}
        />

        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 10
          }}
        >
          <button
            type="button"
            onClick={() => setKind('point')}
            style={{
              flex: 1,
              border: '1px solid var(--outline-variant)',
              borderRadius: 9,
              padding: '7px 8px',
              background: kind === 'point' ? 'var(--accent-soft)' : 'var(--inset)',
              color: kind === 'point' ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 11.5,
              fontWeight: 800
            }}
          >
            Point
          </button>

          <button
            type="button"
            onClick={() => setKind('range')}
            style={{
              flex: 1,
              border: '1px solid var(--outline-variant)',
              borderRadius: 9,
              padding: '7px 8px',
              background: kind === 'range' ? 'var(--accent-soft)' : 'var(--inset)',
              color: kind === 'range' ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 11.5,
              fontWeight: 800
            }}
          >
            Période
          </button>
        </div>

        {kind === 'point' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid var(--outline-variant)',
                background: 'var(--inset)',
                color: 'var(--text)',
                borderRadius: 10,
                padding: '8px 10px',
                fontFamily: 'inherit',
                fontSize: 12.5,
                outline: 'none'
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              type="date"
              value={start}
              onChange={e => setStart(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid var(--outline-variant)',
                background: 'var(--inset)',
                color: 'var(--text)',
                borderRadius: 10,
                padding: '8px 10px',
                fontFamily: 'inherit',
                fontSize: 12.5,
                outline: 'none'
              }}
            />

            <input
              type="date"
              value={end}
              onChange={e => setEnd(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid var(--outline-variant)',
                background: 'var(--inset)',
                color: 'var(--text)',
                borderRadius: 10,
                padding: '8px 10px',
                fontFamily: 'inherit',
                fontSize: 12.5,
                outline: 'none'
              }}
            />
          </div>
        )}

        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder={kind === 'point' ? 'Repère : avion, visa, appel…' : 'Période : Tokyo, road trip…'}
          style={{
            width: '100%',
            marginTop: 8,
            border: '1px solid var(--outline-variant)',
            background: 'var(--inset)',
            color: 'var(--text)',
            borderRadius: 10,
            padding: '8px 10px',
            fontFamily: 'inherit',
            fontSize: 12.5,
            outline: 'none'
          }}
        />

        <div
          style={{
            display: 'flex',
            gap: 6,
            marginTop: 8,
            alignItems: 'center'
          }}
        >
          {Object.keys(COLORS).map(key => {
            const c = COLORS[key];

            return (
              <button
                key={key}
                type="button"
                title={legend[key] || c.label}
                onClick={() => setColor(key)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: color === key ? '2px solid var(--text)' : '1px solid var(--outline-variant)',
                  background: c.value,
                  cursor: 'pointer'
                }}
              />
            );
          })}

          <button
            type="button"
            onClick={kind === 'point' ? savePoint : saveRange}
            style={{
              marginLeft: 'auto',
              border: 'none',
              borderRadius: 999,
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              cursor: 'pointer',
              padding: '8px 12px',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 800
            }}
          >
            Ajouter
          </button>
        </div>

        {allMarks.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 900,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: 'var(--faint)',
                marginBottom: 7
              }}
            >
              Repères
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {allMarks.slice(0, 8).map(item => {
                const c = COLORS[item.color] || COLORS.tan;
                const isPoint = item.type === 'point';

                return (
                  <div
                    key={item.type + '_' + item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      border: '1px solid var(--outline-variant)',
                      background: 'var(--inset)',
                      borderRadius: 10,
                      padding: '7px 8px'
                    }}
                  >
                    <span
                      style={{
                        width: isPoint ? 8 : 18,
                        height: 8,
                        borderRadius: 999,
                        background: c.value,
                        flexShrink: 0
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: 'var(--text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.label || legend[item.color] || (isPoint ? 'Repère' : 'Période')}
                      </div>

                      <div
                        style={{
                          fontSize: 10.5,
                          color: 'var(--faint)',
                          marginTop: 1
                        }}
                      >
                        {isPoint
                          ? fmtDate(item.date)
                          : fmtDate(item.start) + ' → ' + fmtDate(item.end)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteMark(item.type, item.id)}
                      title="Supprimer"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#c0563f',
                        cursor: 'pointer',
                        padding: 4,
                        fontSize: 13
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Boîte à outils (colonne droite, tous onglets) ──────────
function Toolbox({ width = 320 }) {
  const st = Store.useStore();
  const trip = st.trip, view = st.view || 'itinerary', selIdx = st.selectedDayIndex || 0, selectedStepId = st.selectedStepId || null;
  if (!trip || !trip.days || !trip.days.length) return null;

  const day = trip.days[Math.min(selIdx, trip.days.length - 1)] || {};
  const steps = day.steps || [];
  const selectedStep = steps.find(function(step) {
  return step.id === selectedStepId;
}) || null;
  const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  const DEFAULTS = {
    itinerary: ['calendar', 'dayScore', 'aroundStep', 'checklist', 'currency', 'note', 'globalNote', 'stats'],
    map: ['calendar', 'calc', 'currency', 'dayScore', 'globalNote', 'checklist'],
    budget: ['calendar', 'currency', 'stats', 'globalNote', 'note'],
    docs: ['calendar', 'globalNote', 'checklist', 'currency', 'note']
  };

  function loadPins(v) {
    try { const s = JSON.parse(localStorage.getItem('atelier_pins_' + v)); return s || DEFAULTS[v] || ['checklist']; }
    catch(e) { return DEFAULTS[v] || ['checklist']; }
  }

  const [pinned, setPinned] = React.useState(() => loadPins(view));
  const [editMode, setEditMode] = React.useState(false);
  
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
  if (!navigator.geolocation) {
    alert('La géolocalisation n’est pas disponible sur cet appareil.');
    return;
  }

  navigator.geolocation.getCurrentPosition(function(pos) {
    var c = [pos.coords.longitude, pos.coords.latitude];

    if (which === 'from') {
      setCalcFrom('Ma position');
      setCalcFromCoords(c);
    } else if (which === 'to') {
      setCalcTo('Ma position');
      setCalcToCoords(c);
    } else if (which && String(which).startsWith('stop-')) {
      var idx = parseInt(String(which).split('-')[1], 10);
      setCalcStops(function(stops) {
        return stops.map(function(stop, i) {
          return i === idx ? { text: 'Ma position', coords: c } : stop;
        });
      });
    }

    setCalcResult(null);
  }, function() {
    alert('Impossible de vous localiser.');
  }, {
    enableHighAccuracy: true,
    timeout: 8000
  });
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
      var osrmServer = {
  driving: 'routed-car',
  walking: 'routed-foot',
  cycling: 'routed-bike'
}[calcMode] || 'routed-car';

var osrmProfile = {
  driving: 'driving',
  walking: 'foot',
  cycling: 'bike'
}[calcMode] || 'driving';

var r = await fetch(
  'https://routing.openstreetmap.de/' +
  osrmServer +
  '/route/v1/' +
  osrmProfile +
  '/' +
  coordStr +
  '?overview=full&geometries=geojson'
);
      if (!r.ok) {
  throw new Error('Le service de calcul d’itinéraire ne répond pas correctement.');
}

var data = await r.json();

if (!data.routes || !data.routes[0]) {
  alert('Aucun itinéraire trouvé pour ce trajet. Essaie un autre mode ou vérifie les lieux.');
  setCalcBusy(false);
  return;
}
      var route = data.routes[0];
      setCalcResult({
  duration: route.duration,
  distance: route.distance,
  geometry: route.geometry,
  from: from,
  to: to,
  stops: resolvedStops,
  mode: calcMode,
  fromText: calcFrom,
  toText: calcTo,
  stopsText: calcStops
    .filter(function(stop) { return stop.text && stop.text.trim(); })
    .map(function(stop) { return stop.text.trim(); })
});
    } catch (e) { alert('Erreur : ' + e.message); }
    setCalcBusy(false);
  }

  function calcShowOnMap() {
    if (!calcResult) return;
    Store.set({ mapRoute: calcResult, view: 'map' });
  }

  async function calcSaveAsTransportStep() {
  if (!calcResult || !trip || !day || !day.id) return;

  var modeLabel = {
    driving: 'Voiture',
    walking: 'À pied',
    cycling: 'Vélo'
  }[calcResult.mode] || 'Transport';

  var durationMinutes = Math.round((calcResult.duration || 0) / 60);
  var distanceKm = calcResult.distance ? (calcResult.distance / 1000).toFixed(1) : '';

  var durationText = durationMinutes < 60
    ? durationMinutes + ' min'
    : Math.floor(durationMinutes / 60) + 'h' + String(durationMinutes % 60).padStart(2, '0');

  var stepIndex = (day.steps || []).length;

  var step = {
    stepIndex: stepIndex,
    type: 'transport',
    label: modeLabel + ' · ' + durationText + (distanceKm ? ' · ' + distanceKm + ' km' : ''),
    transportType: modeLabel,
    depart: calcResult.fromText || calcFrom || '',
    arrivee: calcResult.toText || calcTo || '',
    duree: durationText,
    escales: (calcResult.stopsText || []).map(function(text) {
      return { lieu: text };
    }),
    note: 'Trajet ajouté depuis l’outil Itinéraire.',
    lat: calcResult.from ? calcResult.from[1] : null,
    lng: calcResult.from ? calcResult.from[0] : null
  };

  try {
    await window.SB.saveStep(trip.id, day.id, step);

    const updatedTrip = await window.SB.loadTrip(trip.id);
    Store.set({ trip: updatedTrip });

    Store.showToast('Étape transport ajoutée');
  } catch (error) {
    Store.showToast('Erreur ajout transport : ' + (error.message || error));
  }
}

 function calcOpenGoogleMaps() {
  if (!calcResult) return;

  var origin = calcResult.fromText && calcResult.fromText.trim()
    ? encodeURIComponent(calcResult.fromText.trim())
    : encodeURIComponent(calcResult.from[1] + ',' + calcResult.from[0]);

  var dest = calcResult.toText && calcResult.toText.trim()
    ? encodeURIComponent(calcResult.toText.trim())
    : encodeURIComponent(calcResult.to[1] + ',' + calcResult.to[0]);

  var gMode = {
    driving: 'driving',
    walking: 'walking',
    cycling: 'bicycling'
  }[calcResult.mode] || 'driving';

  var url = 'https://www.google.com/maps/dir/?api=1&origin=' + origin + '&destination=' + dest + '&travelmode=' + gMode;

  if (calcResult.stopsText && calcResult.stopsText.length > 0) {
    url += '&waypoints=' + calcResult.stopsText.map(function(text) {
      return encodeURIComponent(text);
    }).join('|');
  } else if (calcResult.stops && calcResult.stops.length > 0) {
    url += '&waypoints=' + calcResult.stops.map(function(s) {
      return encodeURIComponent(s[1] + ',' + s[0]);
    }).join('|');
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

  function getUsefulAroundIdeas(step, day, trip) {
  const text = [
    step && step.label,
    step && step.lieu,
    step && step.place,
    step && step.arrivee,
    step && step.depart,
    day && day.title,
    trip && trip.name
  ].filter(Boolean).join(' ').toLowerCase();

  const ideas = [];

  if (!step) return ideas;

  if (text.includes('séoul') || text.includes('seoul')) {
    ideas.push('Regarder s’il y a un marché, une rue commerçante ou un palais accessible à pied.');
    ideas.push('Vérifier la station de métro la plus proche avant de partir.');
    ideas.push('Prévoir un café ou une pause intérieure si la journée est longue.');
  }

  if (text.includes('busan')) {
    ideas.push('Regarder si une plage, un marché ou un point de vue est proche.');
    ideas.push('Vérifier les temps de trajet : Busan est étendue.');
    ideas.push('Prévoir une marge si tu relies Haeundae, Gamcheon ou Jagalchi.');
  }

  if (text.includes('palais') || text.includes('temple') || text.includes('museum') || text.includes('musée')) {
    ideas.push('Vérifier les horaires et jours de fermeture.');
    ideas.push('Regarder s’il faut réserver un créneau ou acheter un billet à l’avance.');
    ideas.push('Chercher un café ou une balade courte juste après la visite.');
  }

  if (text.includes('gare') || text.includes('station') || text.includes('aéroport') || text.includes('airport')) {
    ideas.push('Repérer la sortie exacte, pas seulement la station.');
    ideas.push('Prévoir une marge pour les correspondances et les bagages.');
    ideas.push('Vérifier s’il y a une consigne ou un point de retrait proche.');
  }

  if (text.includes('marché') || text.includes('market') || text.includes('restaurant') || step.type === 'restaurant') {
    ideas.push('Regarder les horaires réels : certains marchés ferment tôt ou changent selon les jours.');
    ideas.push('Prévoir une alternative proche si c’est complet ou fermé.');
    ideas.push('Repérer une rue animée autour plutôt qu’une seule adresse.');
  }

  if (ideas.length === 0) {
    ideas.push('Chercher les points d’intérêt dans un rayon de 10 à 20 minutes à pied.');
    ideas.push('Vérifier les horaires, avis récents et accès avant d’ajouter une étape.');
    ideas.push('Prévoir une option courte à proximité : café, point de vue, parc ou rue commerçante.');
  }

  return ideas.slice(0, 3);
}

function getUsefulAroundTip(step) {
  if (!step) return '';

  const t = [
    step.label,
    step.lieu,
    step.place,
    step.type
  ].filter(Boolean).join(' ').toLowerCase();

  if (t.includes('aéroport') || t.includes('airport')) return 'Astuce : pour un aéroport, vérifie surtout le terminal, le temps de transfert et la marge de sécurité.';
  if (t.includes('gare') || t.includes('station')) return 'Astuce : une station peut avoir plusieurs sorties ; la bonne sortie peut économiser 10 à 15 minutes.';
  if (t.includes('restaurant')) return 'Astuce : garde une option B proche, surtout le soir ou le week-end.';
  if (t.includes('palais') || t.includes('temple') || t.includes('musée')) return 'Astuce : vérifie les horaires et la dernière entrée, pas seulement l’heure de fermeture.';

  return 'Astuce : ajoute seulement ce qui aide vraiment ta journée, pas tout ce qui semble “bien noté”.';
}

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
        calendar: { label: 'Calendrier', icon: 'cal', render() {
  return (
    <CalendarWidget
      key="calendar"
      trip={trip}
      editMode={editMode}
      onRemove={() => togglePin('calendar')}
    />
  );
}},
    checklist: { label: 'À ne pas oublier', icon: 'check', render() {
  return (
    <ChecklistWidget
      key="checklist"
      day={day}
      trip={trip}
      editMode={editMode}
      onRemove={() => togglePin('checklist')}
    />
  );
}},

    note: { label: 'Journal du jour', icon: 'sparkle', render() {
  return (
    <DayNoteWidget
      key="note"
      day={day}
      trip={trip}
      editMode={editMode}
      onRemove={() => togglePin('note')}
    />
  );
}},

    currency: { label: 'Convertisseur', icon: 'arrow', render() {
  return (
    <CurrencyWidget
      key="currency"
      editMode={editMode}
      onRemove={() => togglePin('currency')}
    />
  );
}},

    globalNote: { label: 'Carnet du voyage', icon: 'file', render() {
  return (
    <GlobalNoteWidget
      key="globalNote"
      trip={trip}
      editMode={editMode}
      onRemove={() => togglePin('globalNote')}
    />
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
        <div key="calc" style={{ background: 'var(--card)', borderRadius: 12, boxShadow: '0 2px 8px rgba(82,98,91,0.05)', border: '1px solid var(--outline-variant)', overflow: 'hidden' }}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--outline-variant)', background: 'var(--soft)' }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon name="route" size={16} style={{ color: 'var(--tertiary)' }} />
      Itinéraire
    </span>
    {editMode && (
      <button
        onClick={() => togglePin('calc')}
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

  <div style={{ padding: 16 }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
  <div style={{ display: 'flex', gap: 8 }}>
    <button onClick={calcShowOnMap}
      style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
        background: 'transparent', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <Icon name="map" size={13} />Voir carte
    </button>

    <button onClick={calcOpenGoogleMaps}
      style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--outline-variant)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
        background: 'var(--inset)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <Icon name="arrow" size={13} />Maps
    </button>
  </div>

  <button onClick={calcSaveAsTransportStep}
    style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800,
      background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
    <Icon name="plus" size={13} />
    Ajouter comme transport
  </button>
</div>
            </div>
          )}
          </div>
</div>
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

  const ORDER = ['calendar', 'calc', 'currency', 'dayScore', 'aroundStep', 'checklist', 'globalNote', 'note', 'stats', 'people'];
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
  const [mode, setMode] = React.useState('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pseudo, setPseudo] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function onSubmit() {
    setError('');
    setBusy(true);

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

  return (
    <ModalShell title={mode === 'login' ? 'Connexion' : 'Créer un compte'} onClose={onClose}>
      <div style={{
        display: 'flex',
        gap: 6,
        background: 'var(--inset)',
        borderRadius: 999,
        padding: 4,
        marginBottom: 14
      }}>
        <ModeTab on={mode === 'login'} onClick={() => setMode('login')}>
          Se connecter
        </ModeTab>

        <ModeTab on={mode === 'signup'} onClick={() => setMode('signup')}>
          Créer un compte
        </ModeTab>
      </div>

      {mode === 'signup' && (
        <Field label="Pseudo">
          <input
            value={pseudo}
            onChange={e => setPseudo(e.target.value)}
            placeholder="Ton prénom ou pseudo"
            autoComplete="nickname"
          />
        </Field>
      )}

      <Field label="Email">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="votre@email.com"
          autoComplete="email"
        />
      </Field>

      <Field label="Mot de passe">
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </Field>

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 4 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Btn
          variant="primary"
          onClick={onSubmit}
          style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
        >
          {busy ? '...' : (mode === 'login' ? 'Se connecter' : 'Créer mon compte')}
        </Btn>
      </div>
    </ModalShell>
  );
}

// ─── Modale Nouveau voyage ──────────────────────────────────
function NewTripModal({ onClose }) {
  const [name, setName] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [days, setDays] = React.useState(7);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  function addDaysISO(baseISO, count) {
  if (!baseISO) return '';

  const d = new Date(String(baseISO) + 'T12:00:00');
  d.setDate(d.getDate() + count);

  return d.toISOString().slice(0, 10);
}

function diffDaysInclusive(startISO, endISO) {
  if (!startISO || !endISO) return 1;

  const start = new Date(String(startISO) + 'T12:00:00');
  const end = new Date(String(endISO) + 'T12:00:00');

  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

React.useEffect(() => {
  if (!startDate) return;

  setEndDate(addDaysISO(startDate, Math.max(1, Number(days) || 1) - 1));
}, [startDate]);
  
  async function onSubmit() {
    if (!name.trim()) return;
    setError(''); setBusy(true);
    try {
      const trip = await SB.createTrip({
  name: name.trim(),
  startDate: startDate || null,
  endDate: endDate || null,
  days: Math.max(1, +days || 1)
});
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
    <Field label="Date de départ">
  <input
    type="date"
    value={startDate}
    onChange={e => setStartDate(e.target.value)}
  />
</Field>

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
  <Field label="Nombre de jours">
    <input
      type="number"
      min="1"
      max="90"
      value={days}
      onChange={e => {
        const nextDays = Math.max(1, Number(e.target.value) || 1);
        setDays(nextDays);

        if (startDate) {
          setEndDate(addDaysISO(startDate, nextDays - 1));
        }
      }}
    />
  </Field>

  <Field label="Date de fin">
    <input
      type="date"
      value={endDate}
      min={startDate || undefined}
      onChange={e => {
        const nextEndDate = e.target.value;
        setEndDate(nextEndDate);

        if (startDate && nextEndDate) {
          setDays(diffDaysInclusive(startDate, nextEndDate));
        }
      }}
    />
  </Field>
</div>

{startDate && endDate && (
  <div style={{
    fontSize: 12,
    color: 'var(--muted)',
    marginTop: 4
  }}>
    Voyage de {days} jour{Number(days) > 1 ? 's' : ''} · {fmtDate(startDate)} → {fmtDate(endDate)}
  </div>
)}
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
