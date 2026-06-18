// ════════════════════════════════════════════════════════════
// itin-atelier-v2.jsx — Vue Itinéraire Atelier refactorisée
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Afficher l’itinéraire du voyage actif.
// - Gérer la journée sélectionnée.
// - Afficher la timeline centrale avec StepCard.
// - Afficher la colonne droite avec MealRail.
// - Ouvrir StepEditor pour ajouter / modifier.
// - Gérer le titre et la note du jour.
// - Réordonner les étapes par drag & drop.
// - Utiliser les composants extraits progressivement.
//
// Dépendances globales :
// - React
// - ReactDOM
// - Store
// - Icon
// - window.SB
// - window.StepEditor
// - window.StepCard
// - window.MealRail
// - window.ItineraryUtils
//
// Export :
// - window.AtelierV2
//
// ════════════════════════════════════════════════════════════

(function initAtelierV2() {
  const U = window.ItineraryUtils || {};

  const ATELIER_CSS = `
  .atelier-v2{
    flex:1;
    min-width:0;
    min-height:0;
    height:100%;
    display:flex;
    flex-direction:column;
    background:var(--bg);
    color:var(--text);
    overflow:hidden;
  }

  .atelier-v2-main{
    flex:1;
    min-height:0;
    min-width:0;
    display:grid;
    grid-template-columns:minmax(0,1fr) 320px;
    overflow:hidden;
  }

  .atelier-v2-content{
    min-width:0;
    min-height:0;
    display:flex;
    flex-direction:column;
    overflow:hidden;
  }

  .atelier-v2-scroll{
    flex:1;
    min-height:0;
    overflow-y:auto;
    overflow-x:hidden;
    scrollbar-gutter:stable;
    padding:26px 34px 34px;
  }

  .atelier-v2-day-head{
    display:grid;
    grid-template-columns:minmax(0,1fr) auto;
    gap:18px;
    align-items:start;
    margin-bottom:22px;
  }

  .atelier-v2-kicker{
    font-size:11px;
    font-weight:800;
    letter-spacing:.17em;
    text-transform:uppercase;
    color:var(--accent);
  }

  .atelier-v2-title{
    margin-top:5px;
    font-family:var(--font-serif);
    font-style:italic;
    font-size:42px;
    line-height:48px;
    color:var(--text);
  }

  .atelier-v2-subtitle{
    margin-top:8px;
    color:var(--muted);
    font-size:14px;
    line-height:21px;
    max-width:780px;
  }

  .atelier-v2-actions{
    display:flex;
    align-items:center;
    gap:8px;
    flex-wrap:wrap;
    justify-content:flex-end;
  }

  .atelier-v2-btn{
    border:1px solid var(--outline-variant);
    background:var(--card);
    color:var(--text);
    border-radius:999px;
    min-height:38px;
    padding:0 14px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:7px;
    cursor:pointer;
    font-family:inherit;
    font-size:12.5px;
    font-weight:800;
    box-shadow:0 2px 8px rgba(82,98,91,.05);
  }

  .atelier-v2-btn:hover{
    border-color:var(--accent);
    color:var(--accent);
  }

  .atelier-v2-btn.primary{
    border-color:var(--accent);
    background:var(--accent);
    color:var(--accent-ink);
  }

  .atelier-v2-btn.danger{
    border-color:rgba(192,86,63,.34);
    background:rgba(192,86,63,.08);
    color:#c0563f;
  }

  .atelier-v2-stats{
    display:grid;
    grid-template-columns:repeat(4,minmax(0,1fr));
    gap:10px;
    margin-bottom:22px;
  }

  .atelier-v2-stat{
    background:var(--card);
    border:1px solid var(--outline-variant);
    border-radius:16px;
    padding:13px 14px;
    box-shadow:var(--shadow);
    min-width:0;
  }

  .atelier-v2-stat-value{
    font-family:var(--font-serif);
    font-size:28px;
    line-height:32px;
    color:var(--text);
  }

  .atelier-v2-stat-label{
    margin-top:3px;
    color:var(--muted);
    font-size:11px;
    font-weight:800;
    letter-spacing:.08em;
    text-transform:uppercase;
  }

  .atelier-v2-note{
    background:var(--soft);
    border:1px solid rgba(217,182,126,.32);
    border-radius:16px;
    padding:16px 18px;
    color:var(--muted);
    font-size:14px;
    line-height:21px;
    font-style:italic;
    margin-bottom:22px;
    position:relative;
    overflow:hidden;
  }

  .atelier-v2-note:before{
    content:'';
    position:absolute;
    right:0;
    top:0;
    width:42px;
    height:42px;
    border-radius:0 0 0 16px;
    background:rgba(217,182,126,.12);
  }

  .atelier-v2-timeline{
    display:flex;
    flex-direction:column;
    gap:14px;
    padding-bottom:28px;
  }

  .atelier-v2-drop{
    transition:transform .15s,border-color .15s;
  }

  .atelier-v2-drop.over{
    transform:translateY(5px);
  }

  .atelier-v2-drop.over:before{
    content:'';
    display:block;
    height:3px;
    border-radius:999px;
    background:var(--accent);
    margin-bottom:10px;
    box-shadow:0 0 0 4px var(--accent-soft);
  }

  .atelier-v2-add{
    width:100%;
    min-height:58px;
    border:2px dashed var(--outline-variant);
    background:var(--inset);
    color:var(--muted);
    border-radius:16px;
    cursor:pointer;
    font-family:inherit;
    font-size:13px;
    font-weight:900;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
  }

  .atelier-v2-add:hover{
    border-color:var(--accent);
    color:var(--accent);
    background:var(--accent-soft);
  }

  .atelier-v2-empty{
    border:1px dashed var(--outline-variant);
    background:var(--inset);
    border-radius:18px;
    padding:28px;
    color:var(--muted);
    text-align:center;
    line-height:21px;
    margin-bottom:14px;
  }

  .atelier-v2-reminder{
    border:1px solid var(--outline-variant);
    background:var(--card);
    border-radius:14px;
    padding:13px 15px;
    display:flex;
    align-items:center;
    gap:13px;
    cursor:pointer;
    box-shadow:var(--shadow);
  }

  .atelier-v2-reminder:hover{
    border-color:var(--accent);
  }

  .atelier-v2-reminder-icon{
    width:38px;
    height:38px;
    border-radius:13px;
    background:var(--accent-soft);
    color:var(--accent);
    display:grid;
    place-items:center;
    flex-shrink:0;
  }

  .atelier-v2-reminder-title{
    font-size:13px;
    font-weight:900;
    color:var(--text);
    line-height:18px;
  }

  .atelier-v2-reminder-sub{
    margin-top:2px;
    font-size:12px;
    color:var(--muted);
    line-height:17px;
  }

  .atelier-v2-modal-backdrop{
    position:fixed;
    inset:0;
    z-index:320;
    background:rgba(21,48,42,.36);
    backdrop-filter:blur(7px);
    -webkit-backdrop-filter:blur(7px);
    display:flex;
    align-items:flex-start;
    justify-content:center;
    padding:86px 24px 24px;
  }

  .atelier-v2-modal{
    width:100%;
    max-width:500px;
    background:var(--card);
    color:var(--text);
    border:1px solid var(--outline-variant);
    border-radius:20px;
    box-shadow:0 40px 90px rgba(0,0,0,.34);
    overflow:hidden;
  }

  .atelier-v2-modal-head{
    padding:18px 20px;
    border-bottom:1px solid var(--outline-variant);
    background:var(--soft);
    display:flex;
    justify-content:space-between;
    gap:16px;
    align-items:flex-start;
  }

  .atelier-v2-modal-body{
    padding:20px;
  }

  .atelier-v2-field{
    margin-bottom:14px;
  }

  .atelier-v2-label{
    display:block;
    font-size:11px;
    font-weight:800;
    letter-spacing:.08em;
    text-transform:uppercase;
    color:var(--muted);
    margin-bottom:6px;
  }

  .atelier-v2-input,
  .atelier-v2-textarea{
    width:100%;
    border:1px solid var(--outline-variant);
    background:var(--inset);
    color:var(--text);
    border-radius:12px;
    padding:10px 12px;
    font-family:inherit;
    font-size:14px;
    outline:none;
  }

  .atelier-v2-textarea{
    min-height:92px;
    resize:vertical;
    line-height:20px;
  }

  @media(max-width:1180px){
    .atelier-v2-main{
      grid-template-columns:minmax(0,1fr);
    }

    .atelier-v2-main > aside{
      display:none !important;
    }
  }

  @media(max-width:760px){
    .atelier-v2-scroll{
      padding:22px 18px 90px;
    }

    .atelier-v2-day-head{
      grid-template-columns:1fr;
    }

    .atelier-v2-actions{
      justify-content:flex-start;
    }

    .atelier-v2-title{
      font-size:33px;
      line-height:39px;
    }

    .atelier-v2-stats{
      grid-template-columns:repeat(2,minmax(0,1fr));
    }
  }
  `;

  function injectAtelierCss() {
    if (document.getElementById('atelier-v2-refactor-css')) return;

    const style = document.createElement('style');
    style.id = 'atelier-v2-refactor-css';
    style.textContent = ATELIER_CSS;
    document.head.appendChild(style);
  }

  function safeString(value) {
    if (U.safeString) return U.safeString(value);
    return String(value == null ? '' : value).trim();
  }

  function formatDayDate(iso) {
    if (U.formatDayDate) return U.formatDayDate(iso);

    if (!iso) return '';

    const date = new Date(String(iso) + 'T12:00:00');

    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  function getDisplayDayTitle(day) {
    if (U.getDisplayDayTitle) return U.getDisplayDayTitle(day);

    return safeString(day && day.title) || 'Journée libre';
  }

  function countStepTypes(day) {
    if (U.countStepTypes) return U.countStepTypes(day);

    const steps = Array.isArray(day && day.steps) ? day.steps : [];

    return {
      total: steps.length,
      timeline: steps.length,
      restaurants: steps.filter(step => step.type === 'restaurant').length,
      transports: steps.filter(step => step.type === 'transport').length,
      lodgings: steps.filter(step => step.type === 'logement').length
    };
  }

  function isVisibleTimelineStep(step) {
    if (U.isVisibleTimelineStep) return U.isVisibleTimelineStep(step);

    return step && step.type !== 'restaurant' && step.type !== 'table' && step.type !== 'logement';
  }

  function sortStepsByTime(steps) {
    if (U.sortStepsByTime) return U.sortStepsByTime(steps);

    return (Array.isArray(steps) ? steps : []).slice();
  }

  function stepDisplayName(step, fallback) {
    if (U.stepDisplayName) return U.stepDisplayName(step, fallback || 'Étape');

    return safeString(
      step &&
      (
        step.label ||
        step.lieu ||
        step.place ||
        step.arrivee ||
        step.depart ||
        fallback ||
        'Étape'
      )
    );
  }

  function stepImportant(step) {
    if (U.stepImportant) return U.stepImportant(step);

    return !!(step && step.important);
  }

  function getLodgingTimelineReminders(days, index) {
    if (U.getLodgingTimelineReminders) {
      return U.getLodgingTimelineReminders(days, index);
    }

    return [];
  }

  function getDayById(trip, dayId) {
    if (!trip || !Array.isArray(trip.days)) return null;

    return trip.days.find(function findDay(day) {
      return String(day.id) === String(dayId);
    }) || null;
  }

  function findStepLocation(trip, stepId) {
    if (!trip || !Array.isArray(trip.days) || !stepId) return null;

    for (let dayIndex = 0; dayIndex < trip.days.length; dayIndex += 1) {
      const day = trip.days[dayIndex];
      const steps = Array.isArray(day.steps) ? day.steps : [];

      const step = steps.find(function findStep(item) {
        return String(item.id) === String(stepId);
      });

      if (step) {
        return {
          day,
          dayIndex,
          step
        };
      }
    }

    return null;
  }

  function buildNewStepPreset(type, preset, day) {
    const base = {
      type: type || 'activite',
      label: '',
      lieu: '',
      note: '',
      time: '',
      link: '',
      important: false
    };

    if (type === 'logement') {
      const startISO = day && day.dateISO ? day.dateISO : '';

      return {
        ...base,
        type: 'logement',
        lockedType: 'logement',
        dateStart: startISO,
        dateEnd: startISO && U.addDaysISO ? U.addDaysISO(startISO, 1) : '',
        timeCheckIn: '15:00',
        timeCheckOut: '11:00',
        nuits: 1,
        nights: 1,
        ...(preset || {})
      };
    }

    return {
      ...base,
      ...(preset || {}),
      type: type || (preset && preset.type) || 'activite'
    };
  }

  function StatCard({ value, label }) {
    return (
      <div className="atelier-v2-stat">
        <div className="atelier-v2-stat-value">{value}</div>
        <div className="atelier-v2-stat-label">{label}</div>
      </div>
    );
  }

  function DayEditModal({
    day,
    onClose,
    onSaved
  }) {
    const [title, setTitle] = React.useState(day ? day.title || '' : '');
    const [note, setNote] = React.useState(day ? day.note || '' : '');
    const [busy, setBusy] = React.useState(false);

    if (!day) return null;

    async function saveDay() {
      if (!day.id || busy) return;

      setBusy(true);

      try {
        await window.SB.updateDay(day.id, {
          title,
          note
        });

        if (onSaved) await onSaved();

        Store.showToast('Journée mise à jour');
        onClose();
      } catch (error) {
        Store.showToast('Erreur journée : ' + (error.message || error));
      } finally {
        setBusy(false);
      }
    }

    return ReactDOM.createPortal(
      <div
        className="atelier-v2-modal-backdrop"
        onClick={busy ? undefined : onClose}
      >
        <div
          className="atelier-v2-modal"
          onClick={event => event.stopPropagation()}
        >
          <div className="atelier-v2-modal-head">
            <div>
              <div className="atelier-v2-kicker">Journée</div>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 25,
                lineHeight: '31px',
                marginTop: 3
              }}>
                Modifier le titre et la note
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="atelier-v2-btn"
              style={{ minHeight: 34, padding: '0 10px' }}
            >
              ×
            </button>
          </div>

          <div className="atelier-v2-modal-body">
            <div className="atelier-v2-field">
              <label className="atelier-v2-label">Titre</label>
              <input
                className="atelier-v2-input"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="Journée libre, Palais & ruelles…"
              />
            </div>

            <div className="atelier-v2-field">
              <label className="atelier-v2-label">Note du jour</label>
              <textarea
                className="atelier-v2-textarea"
                value={note}
                onChange={event => setNote(event.target.value)}
                placeholder="Conseils, rappels, ambiance de la journée…"
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 18
            }}>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="atelier-v2-btn"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={saveDay}
                disabled={busy}
                className="atelier-v2-btn primary"
              >
                {busy ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function LodgingReminderCard({
    reminder,
    onEdit
  }) {
    if (!reminder || !reminder.step) return null;

    return (
      <button
        type="button"
        className="atelier-v2-reminder"
        onClick={() => onEdit(reminder.sourceDay, reminder.step)}
      >
        <span className="atelier-v2-reminder-icon">
          <Icon name="bed" size={18} />
        </span>

        <span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
          <span className="atelier-v2-reminder-title">
            {reminder.label} · {stepDisplayName(reminder.step, 'Hébergement')}
          </span>

          <span className="atelier-v2-reminder-sub">
            {reminder.time || ''}
            {reminder.nights ? ' · ' + reminder.nights + ' nuit' + (reminder.nights > 1 ? 's' : '') : ''}
          </span>
        </span>
      </button>
    );
  }

  function AtelierV2() {
    injectAtelierCss();

    const {
      trip,
      selectedDayIndex = 0,
      pendingEditStepId
    } = Store.useStore(function select(state) {
      return {
        trip: state.trip,
        selectedDayIndex: state.selectedDayIndex || 0,
        pendingEditStepId: state.pendingEditStepId
      };
    });

    const [editor, setEditor] = React.useState({
      open: false,
      dayId: null,
      step: null
    });

    const [dayEditorOpen, setDayEditorOpen] = React.useState(false);
    const [dragIndex, setDragIndex] = React.useState(null);
    const [dragOverIndex, setDragOverIndex] = React.useState(null);

    const days = Array.isArray(trip && trip.days) ? trip.days : [];
    const safeDayIndex = Math.min(
      Math.max(0, Number(selectedDayIndex) || 0),
      Math.max(0, days.length - 1)
    );

    const day = days[safeDayIndex] || null;
    const allSteps = Array.isArray(day && day.steps) ? day.steps : [];
    const timelineSteps = sortStepsByTime(
      allSteps.filter(isVisibleTimelineStep)
    );
    const reminders = getLodgingTimelineReminders(days, safeDayIndex);
    const counts = countStepTypes(day);

    React.useEffect(function keepSelectedDayValid() {
      if (!days.length) return;

      if (safeDayIndex !== selectedDayIndex) {
        Store.set({ selectedDayIndex: safeDayIndex });
      }
    }, [days.length, selectedDayIndex, safeDayIndex]);

    React.useEffect(function openPendingEditor() {
      if (!pendingEditStepId || !trip) return;

      const found = findStepLocation(trip, pendingEditStepId);

      if (!found) {
        Store.set({ pendingEditStepId: null });
        return;
      }

      setEditor({
        open: true,
        dayId: found.day.id,
        step: found.step
      });

      Store.set({
        selectedDayIndex: found.dayIndex,
        selectedStepId: found.step.id,
        pendingEditStepId: null
      });
    }, [pendingEditStepId, trip && trip.id]);

    async function reloadTrip() {
      if (!trip || !trip.id) return null;

      const refreshed = await window.SB.loadTrip(trip.id);

      Store.set({
        trip: refreshed
      });

      return refreshed;
    }

    function openEditorForStep(targetDay, step) {
      if (!targetDay) return;

      setEditor({
        open: true,
        dayId: targetDay.id,
        step: step || null
      });

      if (step && step.id) {
        Store.set({
          selectedStepId: step.id
        });
      }
    }

    function openAddStep(type, preset) {
      if (!day) return;

      setEditor({
        open: true,
        dayId: day.id,
        step: buildNewStepPreset(type, preset, day)
      });
    }

    function closeEditor() {
      setEditor({
        open: false,
        dayId: null,
        step: null
      });
    }

    async function handleEditorSaved() {
      await reloadTrip();
    }

    async function reorderTimelineSteps(fromVisibleIndex, toVisibleIndex) {
      if (!trip || !trip.id || !day) return;
      if (fromVisibleIndex === toVisibleIndex) return;

      const visible = timelineSteps.slice();
      const moved = visible.splice(fromVisibleIndex, 1)[0];

      visible.splice(toVisibleIndex, 0, moved);

      const hidden = allSteps.filter(function keepHidden(step) {
        return !isVisibleTimelineStep(step);
      });

      const nextSteps = visible.concat(hidden).map(function assignIndex(step, index) {
        return {
          ...step,
          stepIndex: index
        };
      });

      Store.set({
        trip: {
          ...trip,
          days: days.map(function mapDay(item, index) {
            if (index !== safeDayIndex) return item;

            return {
              ...item,
              steps: nextSteps
            };
          })
        }
      });

      setDragIndex(null);
      setDragOverIndex(null);

      try {
        if (window.SB.reorderSteps) {
          await window.SB.reorderSteps(nextSteps);
        } else {
          await Promise.all(nextSteps.map(function saveStepOrder(step) {
            return window.SB.saveStep(trip.id, day.id, step);
          }));
        }

        Store.showToast('Étapes réordonnées');
      } catch (error) {
        Store.showToast('Erreur ordre : ' + (error.message || error));
        await reloadTrip();
      }
    }

    function selectMapForDay() {
      Store.set({
        view: 'map',
        selectedDayIndex: safeDayIndex
      });
    }

    if (!trip) {
      return (
        <div className="atelier-v2">
          <div style={{
            flex: 1,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--muted)'
          }}>
            Chargement de l’itinéraire…
          </div>
        </div>
      );
    }

    if (!day) {
      return (
        <div className="atelier-v2">
          <div style={{
            flex: 1,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--muted)',
            padding: 30,
            textAlign: 'center'
          }}>
            Aucune journée trouvée pour ce voyage.
          </div>
        </div>
      );
    }

    const dayTitle = getDisplayDayTitle(day);
    const dayDate = formatDayDate(day.dateISO);
    const importantCount = allSteps.filter(stepImportant).length;

    return (
      <div className="atelier-v2">
        <div className="atelier-v2-main">
          <section className="atelier-v2-content">
            <div className="atelier-v2-scroll">
              <header className="atelier-v2-day-head">
                <div>
                  <div className="atelier-v2-kicker">
                    Jour {safeDayIndex + 1}
                    {dayDate ? ' · ' + dayDate : ''}
                  </div>

                  <h1 className="atelier-v2-title">
                    {dayTitle}
                  </h1>

                  <div className="atelier-v2-subtitle">
                    {trip.name || 'Mon voyage'}
                    {trip.startDate && trip.endDate
                      ? ' · ' + formatDayDate(trip.startDate) + ' → ' + formatDayDate(trip.endDate)
                      : ''}
                  </div>
                </div>

                <div className="atelier-v2-actions">
                  <button
                    type="button"
                    className="atelier-v2-btn"
                    onClick={() => setDayEditorOpen(true)}
                  >
                    ✎ Modifier le jour
                  </button>

                  <button
                    type="button"
                    className="atelier-v2-btn"
                    onClick={selectMapForDay}
                  >
                    <Icon name="map" size={15} />
                    Carte
                  </button>

                  <button
                    type="button"
                    className="atelier-v2-btn primary"
                    onClick={() => openAddStep('activite')}
                  >
                    <Icon name="plus" size={15} />
                    Ajouter
                  </button>
                </div>
              </header>

              <div className="atelier-v2-stats">
                <StatCard
                  value={counts.timeline}
                  label={counts.timeline > 1 ? 'étapes visibles' : 'étape visible'}
                />

                <StatCard
                  value={counts.restaurants || 0}
                  label={counts.restaurants > 1 ? 'restaurants' : 'restaurant'}
                />

                <StatCard
                  value={counts.transports || 0}
                  label={counts.transports > 1 ? 'transports' : 'transport'}
                />

                <StatCard
                  value={importantCount || '—'}
                  label="étapes clés"
                />
              </div>

              {day.note && (
                <div className="atelier-v2-note">
                  {day.note}
                </div>
              )}

              <div className="atelier-v2-timeline">
                {reminders.map(function renderReminder(reminder) {
                  return (
                    <LodgingReminderCard
                      key={reminder.key}
                      reminder={reminder}
                      onEdit={openEditorForStep}
                    />
                  );
                })}

                {!timelineSteps.length && (
                  <div className="atelier-v2-empty">
                    Aucune étape visible dans la timeline pour cette journée.
                    <br />
                    Les restaurants et hébergements sont affichés dans la colonne droite.
                  </div>
                )}

                {timelineSteps.map(function renderStep(step, index) {
                  return (
                    <div
                      key={step.id || index}
                      className={'atelier-v2-drop' + (dragOverIndex === index && dragIndex !== null && dragIndex !== index ? ' over' : '')}
                      draggable={!!step.id}
                      onDragStart={function onDragStart(event) {
                        setDragIndex(index);
                        setDragOverIndex(null);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', String(index));
                      }}
                      onDragOver={function onDragOver(event) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';

                        if (dragOverIndex !== index) {
                          setDragOverIndex(index);
                        }
                      }}
                      onDragLeave={function onDragLeave() {
                        if (dragOverIndex === index) {
                          setDragOverIndex(null);
                        }
                      }}
                      onDrop={function onDrop(event) {
                        event.preventDefault();

                        const raw = event.dataTransfer.getData('text/plain');
                        const from = dragIndex !== null ? dragIndex : Number(raw);

                        if (!Number.isFinite(from)) return;

                        reorderTimelineSteps(from, index);
                      }}
                      onDragEnd={function onDragEnd() {
                        setDragIndex(null);
                        setDragOverIndex(null);
                      }}
                      style={{
                        opacity: dragIndex === index ? 0.55 : 1,
                        cursor: step.id ? 'grab' : 'default'
                      }}
                    >
                      <window.StepCard
                        step={step}
                        day={day}
                        trip={trip}
                        dayIndex={safeDayIndex}
                        onEdit={function onEdit(targetStep) {
                          openEditorForStep(day, targetStep);
                        }}
                        onReload={reloadTrip}
                      />
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="atelier-v2-add"
                  onClick={() => openAddStep('activite')}
                >
                  <Icon name="plus" size={16} />
                  Ajouter une étape
                </button>
              </div>
            </div>
          </section>

          <window.MealRail
            trip={trip}
            day={day}
            dayIndex={safeDayIndex}
            onEditStep={openEditorForStep}
            onAddStep={openAddStep}
            onReload={reloadTrip}
          />
        </div>

        <window.StepEditor
          open={editor.open}
          tripId={trip && trip.id}
          dayId={editor.dayId}
          step={editor.step}
          stepCount={getDayById(trip, editor.dayId)?.steps?.length || 0}
          onClose={closeEditor}
          onSaved={handleEditorSaved}
        />

        {dayEditorOpen && (
          <DayEditModal
            day={day}
            onClose={() => setDayEditorOpen(false)}
            onSaved={reloadTrip}
          />
        )}
      </div>
    );
  }

  window.AtelierV2 = AtelierV2;
})();
