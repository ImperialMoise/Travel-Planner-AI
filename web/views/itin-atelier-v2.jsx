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
    .atelier-v2-btn {
      min-height:44px;padding:9px 13px;border:1px solid var(--line);
      border-radius:8px;background:var(--card);color:var(--text);
      font:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:7px;
    }
    .atelier-v2-btn.primary { background:var(--accent);color:var(--accent-ink); }
    .atelier-v2-btn.danger { color:var(--danger); }
    .atelier-v2-modal-backdrop {
      position:fixed;inset:0;z-index:6000;background:rgba(12,22,18,.55);
      display:flex;align-items:flex-start;justify-content:center;
      padding:24px;overflow-y:auto;overscroll-behavior:contain;
    }
    .atelier-v2-modal {
      width:100%;max-width:540px;max-height:calc(100dvh - 48px);overflow:auto;
      background:var(--card);color:var(--text);border:1px solid var(--line);border-radius:16px;
      box-shadow:0 20px 60px #0003;
    }
    .atelier-v2-modal-head {
      padding:20px;border-bottom:1px solid var(--line);display:flex;
      justify-content:space-between;gap:16px;align-items:flex-start;
    }
    .atelier-v2-modal-body { padding:20px; }
    .atelier-v2-field { margin-bottom:16px; }
    .atelier-v2-label { display:block;font-size:13px;font-weight:600;margin-bottom:6px; }
    .atelier-v2-input,.atelier-v2-textarea {
      width:100%;min-width:0;min-height:44px;padding:10px 12px;border:1px solid var(--line);
      border-radius:8px;background:var(--card);color:var(--text);font:inherit;
    }
    .atelier-v2-textarea { min-height:120px;resize:vertical; }
    .atelier-v2-cover-modal { max-width:860px; }
    .atelier-v2-cover-modal-title { font-family:var(--font-serif);font-size:24px;font-weight:400; }
    .atelier-v2-cover-search { display:flex;gap:10px;padding:20px; }
    .atelier-v2-cover-search .atelier-v2-input { flex:1; }
    .atelier-v2-cover-grid { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:0 20px 20px; }
    .atelier-v2-cover-option {
      border:1px solid var(--line);background:var(--card);color:var(--text);
      border-radius:10px;overflow:hidden;cursor:pointer;text-align:left;
    }
    .atelier-v2-cover-option img { display:block;width:100%;height:130px;object-fit:cover; }
    .atelier-v2-cover-option-info { padding:10px; }
    .atelier-v2-cover-option-info strong,.atelier-v2-cover-option-info small { display:block;overflow-wrap:anywhere; }
    .atelier-v2-cover-option-info small { color:var(--muted); }
    .atelier-v2-cover-error,.atelier-v2-cover-empty { padding:20px;color:var(--muted); }
    .atelier-v2-cover-error { color:var(--danger); }
    @media(max-width:600px) {
      .atelier-v2-modal-backdrop { padding:12px; }
      .atelier-v2-modal { max-height:calc(100dvh - 24px); }
      .atelier-v2-cover-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .atelier-v2-cover-search { flex-wrap:wrap; }
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

  function timeToMinutes(value) {
    const match = String(
      value || ''
    ).trim().match(
      /^(\d{1,2}):(\d{2})/
    );

    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    return hours * 60 + minutes;
  }

  function analyzeDayPlan(steps) {
    const visibleSteps =
      Array.isArray(steps)
        ? steps
        : [];

    if (!visibleSteps.length) {
      return [];
    }

    const warnings = [];

    const missingTimeSteps =
      visibleSteps.filter(
        function hasNoTime(step) {
          return (
            timeToMinutes(
              step?.time
            ) === null
          );
        }
      );

    const missingPlaceSteps =
      visibleSteps.filter(
        function hasNoPlace(step) {
          const hasCoordinates =
            step?.lat != null &&
            step?.lng != null;

          if (hasCoordinates) {
            return false;
          }

          if (
            step?.type ===
            'transport'
          ) {
            return !(
              safeString(
                step.depart
              ) &&
              safeString(
                step.arrivee
              )
            );
          }

          return !safeString(
            step?.lieu ||
            step?.place
          );
        }
      );

    const timedSteps =
      visibleSteps
        .map(function prepareStep(
          step,
          index
        ) {
          return {
            step,
            index,
            start:
              timeToMinutes(
                step?.time
              ),
            end:
              timeToMinutes(
                step?.timeEnd
              )
          };
        })
        .filter(function keepTimed(
          item
        ) {
          return item.start !== null;
        })
        .sort(function sortTimed(
          first,
          second
        ) {
          return (
            first.start -
              second.start ||
            first.index -
              second.index
          );
        });

    let overlaps = 0;
    let tightConnections = 0;
    let overlapStep = null;
    let tightStep = null;

    for (
      let index = 1;
      index < timedSteps.length;
      index += 1
    ) {
      const previous =
        timedSteps[index - 1];

      const current =
        timedSteps[index];

      if (
        previous.end === null
      ) {
        continue;
      }

      const gap =
        current.start -
        previous.end;

      if (gap < 0) {
        overlaps += 1;

        if (!overlapStep) {
          overlapStep =
            current.step;
        }
      } else if (gap < 30) {
        tightConnections += 1;

        if (!tightStep) {
          tightStep =
            current.step;
        }
      }
    }

    if (visibleSteps.length >= 6) {
      warnings.push({
        id: 'dense',
        label:
          'Journée dense : ' +
          visibleSteps.length +
          ' étapes prévues.',
        stepId: null
      });
    }

    if (overlaps > 0) {
      warnings.push({
        id: 'overlap',
        label:
          overlaps +
          ' chevauchement' +
          (overlaps > 1 ? 's' : '') +
          ' horaire' +
          (overlaps > 1 ? 's' : '') +
          ' à vérifier.',
        stepId:
          overlapStep?.id ||
          null
      });
    }

    if (tightConnections > 0) {
      warnings.push({
        id: 'tight',
        label:
          tightConnections +
          ' enchaînement' +
          (
            tightConnections > 1
              ? 's'
              : ''
          ) +
          ' avec moins de 30 minutes de marge.',
        stepId:
          tightStep?.id ||
          null
      });
    }

    if (missingTimeSteps.length > 0) {
      warnings.push({
        id: 'missing-time',
        label:
          missingTimeSteps.length +
          ' étape' +
          (
            missingTimeSteps.length > 1
              ? 's'
              : ''
          ) +
          ' sans horaire.',
        stepId:
          missingTimeSteps[0]?.id ||
          null
      });
    }

    if (missingPlaceSteps.length > 0) {
      warnings.push({
        id: 'missing-place',
        label:
          missingPlaceSteps.length +
          ' étape' +
          (
            missingPlaceSteps.length > 1
              ? 's'
              : ''
          ) +
          ' à localiser.',
        stepId:
          missingPlaceSteps[0]?.id ||
          null
      });
    }

    return warnings.slice(0, 4);
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
    dayIndex,
    onEdit,
    onAddLodging
  }) {
    if (!reminder || !reminder.step) {
      return (
        <button
          type="button"
          className="atelier-v2-reminder"
          onClick={onAddLodging}
          style={{
            borderStyle: 'dashed',
            background: 'var(--surface-container-lowest,#fff)'
          }}
        >
          <span className="atelier-v2-reminder-icon">
            <Icon name="bed" size={18} />
          </span>

          <span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
            <span className="atelier-v2-reminder-title">
              Où dormir ?
            </span>
          </span>

          <span style={{
            border: '1px solid rgba(154,101,8,.20)',
            borderRadius: 999,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            flexShrink: 0,
            fontFamily: 'var(--font-mono, ui-monospace)',
            fontSize: 10.5,
            fontWeight: 900,
            lineHeight: '14px',
            padding: '5px 10px',
            whiteSpace: 'nowrap'
          }}>
            Ajouter un hébergement
          </span>
        </button>
      );
    }

    const nightNumber = reminder.kind === 'checkout'
      ? reminder.nights || 1
      : Math.max(1, (Number(dayIndex) || 0) - (Number(reminder.sourceDayIndex) || 0) + 1);

    const nightLabel = reminder.nights
      ? 'Nuit ' + Math.min(nightNumber, reminder.nights) + '/' + reminder.nights
      : '';

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

        {nightLabel && (
          <span style={{
            border: '1px solid rgba(154,101,8,.20)',
            borderRadius: 999,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            flexShrink: 0,
            fontFamily: 'var(--font-mono, ui-monospace)',
            fontSize: 10.5,
            fontWeight: 900,
            lineHeight: '14px',
            padding: '5px 9px',
            whiteSpace: 'nowrap'
          }}>
            {nightLabel}
          </span>
        )}
      </button>
    );
  }

    function TripCoverPickerModal({ tripId, tripName, day, onClose, onSaved }) {
    const [query, setQuery] = React.useState(tripName || day?.title || '');
    const [photos, setPhotos] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');

    React.useEffect(function loadInitialPhotos() {
      searchPhotos(tripName || day?.title || '');
    }, []);

    async function searchPhotos(nextQuery) {
      const value = String(nextQuery ?? query).trim();

      if (value.length < 2) {
        setErrorMessage('Indique une destination ou une ambiance.');
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const results = await window.SB.searchTripCoverPhotos(tripId, value);
        setPhotos(results);
      } catch (error) {
        setPhotos([]);
        setErrorMessage(error.message || 'Recherche photo impossible.');
      } finally {
        setLoading(false);
      }
    }

    async function choosePhoto(photo) {
      if (saving) return;

      setSaving(true);

      try {
        await window.SB.saveDayCover(day.id, photo);
        await onSaved();
        Store.showToast('Photo de cette journée enregistrée');
        onClose();
      } catch (error) {
        setErrorMessage(error.message || 'Enregistrement impossible.');
      } finally {
        setSaving(false);
      }
    }

    async function removePhoto() {
      if (saving || !window.confirm('Retirer la photo de cette journée ?')) return;

      setSaving(true);

      try {
        await window.SB.saveDayCover(day.id, null);
        await onSaved();
        Store.showToast('Photo retirée');
        onClose();
      } catch (error) {
        setErrorMessage(error.message || 'Suppression impossible.');
      } finally {
        setSaving(false);
      }
    }

    return ReactDOM.createPortal(
      <div className="atelier-v2-modal-backdrop" onClick={saving ? undefined : onClose}>
        <div className="atelier-v2-modal atelier-v2-cover-modal" onClick={event => event.stopPropagation()}>
          <div className="atelier-v2-modal-head">
            <div>
              <div className="atelier-v2-kicker">Photo de la journée</div>
              <div className="atelier-v2-cover-modal-title">Choisir une photo</div>
            </div>

            <button type="button" className="atelier-v2-btn" onClick={onClose} disabled={saving}>
              <Icon name="x" size={16} />
            </button>
          </div>

          <div className="atelier-v2-modal-body">
            <form
              className="atelier-v2-cover-search"
              onSubmit={event => {
                event.preventDefault();
                searchPhotos();
              }}
            >
              <input
                className="atelier-v2-input"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Narbonne, plage, musée, fjords..."
              />

              <button type="submit" className="atelier-v2-btn primary" disabled={loading || saving}>
                {loading ? 'Recherche...' : 'Rechercher'}
              </button>
            </form>

            {errorMessage && <div className="atelier-v2-cover-error">{errorMessage}</div>}

            <div className="atelier-v2-cover-grid">
              {photos.map(photo => (
                <button
                  key={photo.id}
                  type="button"
                  className="atelier-v2-cover-option"
                  onClick={() => choosePhoto(photo)}
                  disabled={saving}
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.alt || query}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                  />
                  <span className="atelier-v2-cover-option-info">
                    <strong>Choisir cette photo</strong>
                    <small>Photo par {photo.photographer || 'Pexels'}</small>
                  </span>
                </button>
              ))}
            </div>

            {!loading && !photos.length && !errorMessage && (
              <div className="atelier-v2-cover-empty">
                <Icon name="camera" size={22} />
                Aucune photo trouvée.
              </div>
            )}

            {day.coverImageUrl && (
              <button
                type="button"
                className="atelier-v2-btn danger"
                onClick={removePhoto}
                disabled={saving}
                style={{ marginTop: 18 }}
              >
                Retirer la photo
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function AtelierV2() {
    injectAtelierCss();

    const {
      trip,
      user,
      selectedDayIndex = 0,
      pendingEditStepId
    } = Store.useStore(function select(state) {
return {
        trip: state.trip,
        user: state.user,
        selectedDayIndex: state.selectedDayIndex || 0,
        pendingEditStepId: state.pendingEditStepId
      };
    });

    const [editor, setEditor] = React.useState({
      open: false,
      dayId: null,
      step: null
    });

    const [organizingSteps, setOrganizingSteps] = React.useState(false);
    const [dayEditorOpen, setDayEditorOpen] = React.useState(false);
    const [coverPickerOpen, setCoverPickerOpen] = React.useState(false);
    const [coverDetailsOpen, setCoverDetailsOpen] = React.useState(false);
    const closeCoverDetails = React.useCallback(() => setCoverDetailsOpen(false), []);
    const mainPanelRef = React.useRef(null);
    const [coverPositionY, setCoverPositionY] = React.useState(50);
    const cropDragRef = React.useRef(null);
    const [dragIndex, setDragIndex] = React.useState(null);
    const [dragOverIndex, setDragOverIndex] = React.useState(null);
    const [reorderingSteps, setReorderingSteps] = React.useState(false);
    const [quickAdd, setQuickAdd] = React.useState({
      open: false,
      type: 'activite',
      label: '',
      time: ''
    });
    const [quickAddBusy, setQuickAddBusy] = React.useState(false);
    const canUseNativeDrag =
      typeof window.matchMedia !== 'function' ||
      window.matchMedia(
        '(pointer: fine)'
      ).matches;

    const days = Array.isArray(trip && trip.days) ? trip.days : [];
    const safeDayIndex = Math.min(
      Math.max(0, Number(selectedDayIndex) || 0),
      Math.max(0, days.length - 1)
    );

    const day = days[safeDayIndex] || null;

    const dayNavRef = React.useRef(null);

    React.useEffect(() => {
      const nav = dayNavRef.current;
      const button = nav?.querySelector('[aria-current="date"]');
      if (!nav || !button) return;
      const listBox = nav.getBoundingClientRect();
      const buttonBox = button.getBoundingClientRect();
      if (buttonBox.top < listBox.top) {
        nav.scrollTop += buttonBox.top - listBox.top - 6;
      } else if (buttonBox.bottom > listBox.bottom) {
        nav.scrollTop += buttonBox.bottom - listBox.bottom + 6;
      }
    }, [safeDayIndex, days.length, trip?.id]);

    React.useEffect(() => {
      if (mainPanelRef.current) mainPanelRef.current.scrollTop = 0;
      setCoverDetailsOpen(false);
    }, [day?.id]);

    function runDayOption(event, action) {
      const menu = event.currentTarget.closest('details');
      if (menu) {
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }
      action();
    }

    React.useEffect(
      function resetQuickAddWhenDayChanges() {
        setQuickAdd({
          open: false,
          type: 'activite',
          label: '',
          time: ''
        });

        setQuickAddBusy(false);
      },
      [day?.id]
    );
        const savedCoverPositionY = Number.isFinite(Number(day?.coverPositionY))
      ? Number(day.coverPositionY)
      : 50;

    const isCoverCropLocked = day?.coverCropLocked !== false;

    React.useEffect(function syncCoverPosition() {
      setCoverPositionY(savedCoverPositionY);
      cropDragRef.current = null;
    }, [day?.id, savedCoverPositionY]);

    function clampCoverPosition(value) {
      return Math.max(0, Math.min(100, value));
    }

    function handleCoverPointerDown(event) {
      if (!day?.coverImageUrl || isCoverCropLocked) return;
      if (event.target.closest && event.target.closest('button, a')) return;

      cropDragRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startPosition: coverPositionY,
        positionY: coverPositionY,
        moved: false
      };

      event.currentTarget.setPointerCapture(event.pointerId);
    }

    function handleCoverPointerMove(event) {
      const drag = cropDragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) return;

      const delta = event.clientY - drag.startY;
      const nextPosition = clampCoverPosition(drag.startPosition - delta * 0.18);

      drag.positionY = nextPosition;
      drag.moved = drag.moved || Math.abs(delta) > 3;
      setCoverPositionY(nextPosition);
    }

    async function handleCoverPointerUp(event) {
      const drag = cropDragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) return;

      cropDragRef.current = null;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (!drag.moved) return;

      try {
        await window.SB.updateDayCoverCrop(day.id, {
          positionY: drag.positionY
        });
        await reloadTrip();
      } catch (error) {
        Store.showToast(error.message || 'Recadrage impossible.');
        setCoverPositionY(savedCoverPositionY);
      }
    }

    async function toggleCoverCropLock() {
      try {
        await window.SB.updateDayCoverCrop(day.id, {
          positionY: coverPositionY,
          locked: !isCoverCropLocked
        });

        await reloadTrip();
        Store.showToast(
          isCoverCropLocked
            ? 'Recadrage déverrouillé'
            : 'Recadrage verrouillé'
        );
      } catch (error) {
        Store.showToast(error.message || 'Modification impossible.');
      }
    }

    const allSteps = Array.isArray(day && day.steps) ? day.steps : [];
    const timelineSteps = allSteps
      .filter(isVisibleTimelineStep)
      .slice()
      .sort(function compareStepOrder(a, b) {
        const aIndex = Number(a?.stepIndex);
        const bIndex = Number(b?.stepIndex);

        const aHasIndex =
          Number.isFinite(aIndex);

        const bHasIndex =
          Number.isFinite(bIndex);

        if (aHasIndex && bHasIndex) {
          return aIndex - bIndex;
        }

        if (aHasIndex) return -1;
        if (bHasIndex) return 1;

        return 0;
      });
    const counts = countStepTypes(day);
    const dayPlanWarnings =
      analyzeDayPlan(
        timelineSteps
      );

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

    function closeQuickAdd() {
      setQuickAdd({
        open: false,
        type: 'activite',
        label: '',
        time: ''
      });
    }

    function openQuickAddInEditor() {
      openAddStep(quickAdd.type, {
        label: quickAdd.label.trim(),
        time: quickAdd.time
      });

      closeQuickAdd();
    }

    async function saveQuickStep(event) {
      event.preventDefault();

      const label = quickAdd.label.trim();

      if (!label || quickAddBusy) {
        if (!label) {
          Store.showToast(
            'Donne un nom à cette étape.'
          );
        }

        return;
      }

      if (
        !trip ||
        !trip.id ||
        !day ||
        !day.id ||
        !window.SB?.saveStep
      ) {
        Store.showToast(
          'Ajout rapide indisponible.'
        );

        return;
      }

      const payload = {
        ...buildNewStepPreset(
          quickAdd.type,
          {
            label,
            time: quickAdd.time
          },
          day
        ),
        stepIndex: allSteps.length
      };

      if (quickAdd.type === 'transport') {
        Object.assign(payload, {
          transportType: 'train',
          depart: '',
          arrivee: '',
          timeEnd: '',
          nextDay: false,
          duree: '',
          ref: '',
          escales: []
        });
      } else {
        payload.dureeEstimee = '';
      }

      setQuickAddBusy(true);

      try {
        await window.SB.saveStep(
          trip.id,
          day.id,
          payload
        );

        await reloadTrip();
        closeQuickAdd();

        Store.showToast(
          'Étape ajoutée au programme.'
        );
      } catch (error) {
        Store.showToast(
          'Ajout impossible : ' +
          (error.message || error)
        );
      } finally {
        setQuickAddBusy(false);
      }
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

    async function reorderTimelineSteps(
      fromVisibleIndex,
      toVisibleIndex
    ) {
      if (
        !trip ||
        !trip.id ||
        !day ||
        reorderingSteps
      ) {
        return;
      }

      if (
        fromVisibleIndex === toVisibleIndex
      ) {
        return;
      }

      const visible = timelineSteps.slice();

      const moved = visible.splice(
        fromVisibleIndex,
        1
      )[0];

      if (!moved) return;

      visible.splice(
        toVisibleIndex,
        0,
        moved
      );

      const hidden = allSteps.filter(
        function keepHidden(step) {
          return !isVisibleTimelineStep(step);
        }
      );

      const nextSteps = visible
        .concat(hidden)
        .map(function assignIndex(
          step,
          index
        ) {
          return {
            ...step,
            stepIndex: index
          };
        });

      setDragIndex(null);
      setDragOverIndex(null);
      setReorderingSteps(true);

      Store.set({
        trip: {
          ...trip,
          days: days.map(function mapDay(
            item,
            index
          ) {
            if (index !== safeDayIndex) {
              return item;
            }

            return {
              ...item,
              steps: nextSteps
            };
          })
        }
      });

      try {
        if (!window.SB?.reorderSteps) {
          throw new Error(
            'Réorganisation indisponible.'
          );
        }

        await window.SB.reorderSteps(
          nextSteps
        );

        const refreshed =
          await reloadTrip();

        const refreshedDay = (
          refreshed?.days || []
        ).find(function findDay(item) {
          return String(item.id) ===
            String(day.id);
        });

        const persistedOrder = (
          refreshedDay?.steps || []
        )
          .filter(isVisibleTimelineStep)
          .slice()
          .sort(function compareOrder(a, b) {
            return (
              Number(a.stepIndex) -
              Number(b.stepIndex)
            );
          })
          .map(step => String(step.id));

        const expectedOrder = visible.map(
          step => String(step.id)
        );

        if (
          persistedOrder.join('|') !==
          expectedOrder.join('|')
        ) {
          throw new Error(
            'Le nouvel ordre n’a pas été conservé.'
          );
        }

        Store.showToast(
          'Nouvel ordre enregistré.'
        );
      } catch (error) {
        console.error(
          'Step reorder failed:',
          error
        );

        await reloadTrip();

        Store.showToast(
          error.message ||
          'Le nouvel ordre n’a pas pu être enregistré.'
        );
      } finally {
        setReorderingSteps(false);
      }
    }

    async function sortTimelineByTime() {
      if (
        reorderingSteps ||
        timelineSteps.length < 2
      ) {
        return;
      }

      const timedStepCount =
        timelineSteps.filter(
          function hasTime(step) {
            return Boolean(
              String(
                step?.time || ''
              ).trim()
            );
          }
        ).length;

      if (timedStepCount < 2) {
        Store.showToast(
          'Ajoute au moins deux horaires pour effectuer le tri.'
        );

        return;
      }

      const sortedVisible =
        timelineSteps
          .map(function prepareStep(
            step,
            index
          ) {
            return {
              step,
              index,
              time: String(
                step?.time || ''
              ).trim()
            };
          })
          .sort(function compareTimes(
            first,
            second
          ) {
            if (
              first.time &&
              second.time
            ) {
              return (
                first.time.localeCompare(
                  second.time
                ) ||
                first.index -
                  second.index
              );
            }

            if (first.time) return -1;
            if (second.time) return 1;

            return (
              first.index -
              second.index
            );
          })
          .map(function getStep(item) {
            return item.step;
          });

      const currentOrder =
        timelineSteps
          .map(step =>
            String(step.id)
          )
          .join('|');

      const sortedOrder =
        sortedVisible
          .map(step =>
            String(step.id)
          )
          .join('|');

      if (
        currentOrder === sortedOrder
      ) {
        Store.showToast(
          'La journée est déjà classée par heure.'
        );

        return;
      }

      const hiddenSteps =
        allSteps.filter(
          function keepHidden(step) {
            return !isVisibleTimelineStep(
              step
            );
          }
        );

      const nextSteps =
        sortedVisible
          .concat(hiddenSteps)
          .map(function assignIndex(
            step,
            index
          ) {
            return {
              ...step,
              stepIndex: index
            };
          });

      setDragIndex(null);
      setDragOverIndex(null);
      setReorderingSteps(true);

      Store.set({
        trip: {
          ...trip,
          days: days.map(
            function updateDay(
              currentDay,
              index
            ) {
              if (
                index !== safeDayIndex
              ) {
                return currentDay;
              }

              return {
                ...currentDay,
                steps: nextSteps
              };
            }
          )
        }
      });

      try {
        if (
          !window.SB
            ?.reorderSteps
        ) {
          throw new Error(
            'Tri chronologique indisponible.'
          );
        }

        await window.SB
          .reorderSteps(
            nextSteps
          );

        await reloadTrip();

        Store.showToast(
          'Journée classée par heure.'
        );
      } catch (error) {
        console.error(
          'Chronological sort failed:',
          error
        );

        await reloadTrip();

        Store.showToast(
          error.message ||
          'Le tri n’a pas pu être enregistré.'
        );
      } finally {
        setReorderingSteps(false);
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
    const hasDayCover = Boolean(String(day.coverImageUrl || '').trim());
    const isTripOwner = Boolean(
      user &&
      trip.ownerId &&
      String(user.id) === String(trip.ownerId)
    );

    return (
      <div className="fv-itinerary">
        <aside className="fv-days" aria-label="Journées du voyage">
          <div className="fv-days-heading">
            <span>Les journées</span><Icon name="cal" size={16} />
          </div>
          <div className="fv-days-list" ref={dayNavRef}>
            {days.map((item, index) => (
              <button type="button" className="fv-day" key={item.id || index}
                aria-current={index === safeDayIndex ? 'date' : undefined}
                onClick={() => Store.set({ selectedDayIndex: index, selectedStepId: null })}>
                <span className="fv-number">J{index + 1}</span>
                <span><strong>{getDisplayDayTitle(item)}</strong>
                  <small>{formatDayDate(item.dateISO) || 'Date à définir'}</small>
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="fv-button fv-organize"
            onClick={() => window.dispatchEvent(new Event('open-day-organizer'))}>
            <Icon name="cal" size={16} />Organiser les jours
          </button>
        </aside>
        <section className="fv-main" ref={mainPanelRef} tabIndex="0" aria-label="Programme de la journée">
          <div className="fv-main-inner">
          <label className="fv-mobile-day">
            Journée
            <select aria-label="Choisir une journée" value={safeDayIndex}
              onChange={event => Store.set({
                selectedDayIndex: Number(event.target.value), selectedStepId: null
              })}>
              {days.map((item, index) => (
                <option key={item.id || index} value={index}>
                  J{index + 1} · {formatDayDate(item.dateISO)} · {getDisplayDayTitle(item)}
                </option>
              ))}
            </select>
          </label>
          <div className="fv-daymeta">{dayDate}{day.city ? ' · ' + day.city : ''}</div>

          <div className="fv-dayhead">
            <h2>{dayTitle}</h2>
            <div className="fv-day-controls">
              <button type="button" className="fv-iconbutton"
                aria-label="Modifier la journée" title="Modifier la journée"
                onClick={() => setDayEditorOpen(true)}>
                <Icon name="edit" size={17} />
              </button>
              <details className="fv-day-options" key={'options-' + day.id}
                onKeyDown={event => {
                  if (event.key !== 'Escape') return;
                  event.preventDefault();
                  event.stopPropagation();
                  event.currentTarget.open = false;
                  event.currentTarget.querySelector('summary')?.focus();
                }}>
                <summary aria-label="Options de la journée" title="Options de la journée">
                  <span aria-hidden="true">⋯</span>
                </summary>

                <div className="fv-day-options-panel">
                  <button type="button" className="fv-button"
                    onClick={event => runDayOption(event, selectMapForDay)}>
                    <Icon name="map" size={16} />Carte du jour
                  </button>
                  <button type="button" className="fv-button"
                    onClick={event => runDayOption(event, () => setCoverDetailsOpen(true))}>
                    <Icon name="camera" size={16} />Photo et recadrage
                  </button>
                  <button type="button" className="fv-button"
                    onClick={event => runDayOption(event, () =>
                      window.dispatchEvent(new Event('open-day-organizer')))}>
                    <Icon name="cal" size={16} />Organiser les jours
                  </button>
                </div>
              </details>
            </div>
          </div>
          {day.note && <p className="fv-intro">{day.note}</p>}
          <div className="fv-program-head">
            <span>{timelineSteps.length} étape{timelineSteps.length > 1 ? 's' : ''} au programme</span>
            <button type="button" className="fv-textbutton" aria-pressed={organizingSteps}
              onClick={() => setOrganizingSteps(value => !value)}>
              ↕ {organizingSteps ? 'Terminer' : 'Organiser'}
            </button>
          </div>
          {organizingSteps && (
            <div className="fv-order-help">
              <p>Déplace les étapes avec les flèches ou par glisser-déposer.</p>
              {timelineSteps.filter(step => String(step?.time || '').trim()).length > 1 && (
                <button type="button" className="fv-button" disabled={reorderingSteps}
                  onClick={sortTimelineByTime}>
                  {reorderingSteps ? 'Tri…' : 'Classer par heure'}
                </button>
              )}
            </div>
          )}
                {quickAdd.open && (
<form
                    className="atelier-v2-quick-add"
                    onSubmit={saveQuickStep}
                    onKeyDown={event => {
                      if (
                        event.key === 'Escape' &&
                        !quickAddBusy
                      ) {
                        event.preventDefault();
                        closeQuickAdd();
                      }
                    }}
                    style={{
                      margin: '12px 14px 0',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 13,
                      background: 'var(--inset)',
                      padding: 10,
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 7
                    }}
                  >
                    <div
                      className="atelier-v2-quick-types"
                      style={{
                        display: 'flex',
                        gap: 5
                      }}
                    >
                      {[
                        ['activite', 'Activité'],
                        ['transport', 'Transport']
                      ].map(function renderQuickType(option) {
                        const selected =
                          quickAdd.type === option[0];

                        return (
                          <button
                            key={option[0]}
                            type="button"
                            aria-pressed={selected}
                            disabled={quickAddBusy}
                            onClick={() => {
                              setQuickAdd(function selectType(previous) {
                                return {
                                  ...previous,
                                  type: option[0]
                                };
                              });
                            }}
                            style={{
                              minHeight: 34,
                              border: selected
                                ? '1px solid var(--accent)'
                                : '1px solid var(--outline-variant)',
                              borderRadius: 9,
                              background: selected
                                ? 'var(--accent-soft)'
                                : 'var(--card)',
                              color: selected
                                ? 'var(--accent)'
                                : 'var(--text)',
                              padding: '0 10px',
                              fontFamily: 'inherit',
                              fontSize: 11.5,
                              fontWeight: 900,
                              cursor: 'pointer'
                            }}
                          >
                            {option[1]}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      className="atelier-v2-quick-label"
                      autoFocus
                      type="text"
                      aria-label="Nom de la nouvelle étape"
                      placeholder={
                        quickAdd.type === 'transport'
                          ? 'Ex. Train vers Kyoto'
                          : 'Ex. Visiter le musée'
                      }
                      value={quickAdd.label}
                      disabled={quickAddBusy}
                      onChange={event => {
                        setQuickAdd(function updateLabel(previous) {
                          return {
                            ...previous,
                            label: event.target.value
                          };
                        });
                      }}
                      style={{
                        flex: '1 1 190px',
                        minWidth: 0,
                        minHeight: 36,
                        border: '1px solid var(--outline-variant)',
                        borderRadius: 9,
                        background: 'var(--card)',
                        color: 'var(--text)',
                        padding: '0 10px',
                        fontFamily: 'inherit',
                        fontSize: 13
                      }}
                    />

                    <input
                      className="atelier-v2-quick-time"
                      type="time"
                      aria-label="Heure de la nouvelle étape"
                      value={quickAdd.time}
                      disabled={quickAddBusy}
                      onChange={event => {
                        setQuickAdd(function updateTime(previous) {
                          return {
                            ...previous,
                            time: event.target.value
                          };
                        });
                      }}
                      style={{
                        flex: '0 0 108px',
                        minHeight: 36,
                        border: '1px solid var(--outline-variant)',
                        borderRadius: 9,
                        background: 'var(--card)',
                        color: 'var(--text)',
                        padding: '0 8px',
                        fontFamily: 'inherit',
                        fontSize: 12
                      }}
                    />

                    <button
                      type="submit"
                      className="atelier-v2-btn primary"
                      disabled={quickAddBusy}
                      style={{
                        minHeight: 36,
                        borderRadius: 9
                      }}
                    >
                      {quickAddBusy ? 'Ajout…' : 'Ajouter'}
                    </button>

                    <button
                      type="button"
                      className="atelier-v2-btn"
                      disabled={quickAddBusy}
                      onClick={openQuickAddInEditor}
                      style={{
                        minHeight: 36,
                        borderRadius: 9
                      }}
                    >
                      Plus de détails
                    </button>
                  </form>
                )}

                {dayPlanWarnings.length > 0 && (
<div
                    className="atelier-v2-diagnostics"
                    role="status"
                    aria-label="Points à vérifier dans cette journée"
                    style={{
                      margin: '10px 14px 0',
                      border: '1px solid rgba(150,100,13,.22)',
                      borderRadius: 11,
                      background: 'var(--accent-soft)',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: 7
                    }}
                  >
                    <span style={{
                      borderRadius: 999,
                      background: 'var(--accent)',
                      color: 'var(--accent-ink)',
                      padding: '3px 7px',
                      fontSize: 9.5,
                      lineHeight: '14px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                      whiteSpace: 'nowrap'
                    }}>
                      À vérifier
                    </span>

                    <div
                      className="atelier-v2-diagnostic-items"
                      style={{
                        flex: '1 1 220px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px 12px',
                        color: 'var(--muted)',
                        fontSize: 11.5,
                        lineHeight: '17px'
                      }}
                    >
{dayPlanWarnings.map(
                        function renderWarning(
                          warning
                        ) {
                          const content = (
                            <>
                              <span
                                aria-hidden="true"
                                style={{
                                  color: 'var(--accent)',
                                  fontWeight: 900
                                }}
                              >
                                •
                              </span>{' '}
                              {warning.label}
                            </>
                          );

                          if (!warning.stepId) {
                            return (
                              <span
                                key={warning.id}
                              >
                                {content}
                              </span>
                            );
                          }

                          return (
                            <button
                              key={warning.id}
                              type="button"
                              title="Modifier la première étape concernée"
                              onClick={() => {
                                const targetStep =
                                  timelineSteps.find(
                                    step =>
                                      String(
                                        step.id
                                      ) ===
                                      String(
                                        warning.stepId
                                      )
                                  );

                                if (targetStep) {
                                  openEditorForStep(
                                    day,
                                    targetStep
                                  );
                                }
                              }}
                              style={{
                                border: 0,
                                background: 'transparent',
                                color: 'var(--muted)',
                                padding: 0,
                                fontFamily: 'inherit',
                                fontSize: 'inherit',
                                lineHeight: 'inherit',
                                textAlign: 'left',
                                textDecoration: 'underline',
                                textDecorationStyle: 'dotted',
                                textUnderlineOffset: 3,
                                cursor: 'pointer'
                              }}
                            >
                              {content}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}


          {reorderingSteps && (
            <p className="fv-muted" role="status" aria-live="polite">Enregistrement du nouvel ordre…</p>
          )}
          <div className="fv-program">
            {!timelineSteps.length && (
              <p className="fv-empty" role="status">
                Aucune activité ni trajet pour cette journée. Ajoute une étape ci-dessous.
                Les hébergements et repas restent dans les informations de la journée.
              </p>
            )}
                {timelineSteps.map(function renderStep(step, index) {
                  return (
                    <div
                      key={step.id || index}
                      className={'atelier-v2-drop' + (dragOverIndex === index && dragIndex !== null && dragIndex !== index ? ' over' : '')}
                      draggable={
                        organizingSteps && !!step.id &&
                        !reorderingSteps &&
                        canUseNativeDrag
                      }
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
                        cursor: reorderingSteps
                          ? 'wait'
                          : organizingSteps && step.id
                            ? 'grab'
                            : 'default'
                      }}
                    >
                      {organizingSteps && <div
                        className="atelier-v2-touch-order"
                        aria-label="Modifier l’ordre de cette étape"
                      >
                        <button
                          type="button"
                          disabled={
                            index === 0 ||
                            reorderingSteps
                          }
                          aria-label="Déplacer l’étape vers le haut"
                          title="Déplacer vers le haut"
                          onPointerDown={event =>
                            event.stopPropagation()
                          }
                          onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();

                            reorderTimelineSteps(
                              index,
                              index - 1
                            );
                          }}
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          disabled={
                            index ===
                              timelineSteps.length - 1 ||
                            reorderingSteps
                          }
                          aria-label="Déplacer l’étape vers le bas"
                          title="Déplacer vers le bas"
                          onPointerDown={event =>
                            event.stopPropagation()
                          }
                          onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();

                            reorderTimelineSteps(
                              index,
                              index + 1
                            );
                          }}
                        >
                          ↓
                        </button>
                      </div>}

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

          </div>
          <button type="button" className="fv-button fv-add" onClick={() => openAddStep('activite')}>
            <Icon name="plus" size={16} />Ajouter une étape
          </button>
          <button type="button" className="fv-textbutton" aria-expanded={quickAdd.open}
            onClick={() => setQuickAdd(previous => ({ ...previous, open: !previous.open }))}>
            {quickAdd.open ? 'Fermer l’ajout rapide' : 'Ajout rapide'}
          </button>
          </div>
        </section>
        <window.MealRail trip={trip} day={day} dayIndex={safeDayIndex}
          onEditStep={openEditorForStep} onAddStep={openAddStep} onReload={reloadTrip} />

        {coverDetailsOpen && (
          <window.WorkspaceModal title="Photo de la journée" onClose={closeCoverDetails}>
            <div className="fv-app fv-photo-panel" data-workspace-accent="forest">
              <p className="fv-muted">
                La photo est conservée sans prendre de place dans le programme.
              </p>
            {hasDayCover && (
              <>
                <div className={'fv-cover-editor' + (isCoverCropLocked ? '' : ' unlocked')}
                  onPointerDown={handleCoverPointerDown} onPointerMove={handleCoverPointerMove}
                  onPointerUp={handleCoverPointerUp} onPointerCancel={() => {
                    cropDragRef.current = null;
                    setCoverPositionY(savedCoverPositionY);
                  }}>
                  <img src={day.coverImageUrl} alt={day.coverImageAlt || 'Photo de la journée'}
                    style={{ objectPosition: `center ${coverPositionY}%` }}
                    loading="lazy" decoding="async" draggable="false" />
                </div>
                <button type="button" className="fv-textbutton" onClick={toggleCoverCropLock}>
                  {isCoverCropLocked ? 'Déverrouiller le recadrage' : 'Verrouiller le recadrage'}
                </button>
                {day.coverSourceUrl && (
                  <a className="fv-credit" href={day.coverSourceUrl} target="_blank" rel="noreferrer">
                    Photo par {day.coverPhotographerName || 'Pexels'} via Pexels
                  </a>
                )}
              </>
            )}
              <div className="fv-actions">
                <button type="button" className="fv-button" onClick={() => {
                  setCoverDetailsOpen(false);
                  setCoverPickerOpen(true);
                }}>
                  <Icon name="camera" size={16} />{hasDayCover ? 'Changer la photo' : 'Choisir une photo'}
                </button>
                <button type="button" className="fv-button" onClick={closeCoverDetails}>Terminé</button>
              </div>
            </div>
          </window.WorkspaceModal>
        )}
        {coverPickerOpen && (
          <TripCoverPickerModal
  tripId={trip.id}
  tripName={trip.name}
  day={day}
            onClose={() => setCoverPickerOpen(false)}
            onSaved={reloadTrip}
          />
        )}

        <window.StepEditor
          open={editor.open}
          tripId={trip && trip.id}
          dayId={editor.dayId}
          days={days}
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
