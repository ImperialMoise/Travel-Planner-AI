// ════════════════════════════════════════════════════════════
// StepCard.js — Carte d’étape centrale de l’itinéraire
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Afficher une étape dans la timeline principale.
// - Sélectionner l’étape au clic.
// - Ouvrir l’éditeur via le bouton modifier.
// - Marquer / retirer l’étape clé.
// - Ouvrir un document lié.
// - Ouvrir ou localiser l’étape sur la carte interne.
//
// Dépendances globales :
// - React
// - Store
// - Icon
// - window.SB
// - window.ItineraryUtils
//
// API :
//   <window.StepCard
//     step={step}
//     day={day}
//     trip={realTrip}
//     dayIndex={sel}
//     onEdit={(step) => ...}
//     onReload={() => ...}
//   />
//
// ════════════════════════════════════════════════════════════

(function initStepCard() {
  const U = window.ItineraryUtils || {};

  const STEP_TONES = {
    transport: {
      accent: '#597b72',
      soft: 'rgba(89,123,114,.12)',
      label: 'Transport',
      icon: 'route'
    },
    logement: {
      accent: '#9a6508',
      soft: 'rgba(154,101,8,.12)',
      label: 'Hébergement',
      icon: 'bed'
    },
    restaurant: {
      accent: '#b4843e',
      soft: 'rgba(180,132,62,.14)',
      label: 'Restaurant',
      icon: 'fork'
    },
    table: {
      accent: '#b4843e',
      soft: 'rgba(180,132,62,.14)',
      label: 'Restaurant',
      icon: 'fork'
    },
    activite: {
      accent: '#496f92',
      soft: 'rgba(73,111,146,.12)',
      label: 'Activité',
      icon: 'camera'
    },
    autre: {
      accent: '#827567',
      soft: 'rgba(130,117,103,.12)',
      label: 'Étape',
      icon: 'pin'
    }
  };

  function safeString(value) {
    if (U.safeString) return U.safeString(value);
    return String(value == null ? '' : value).trim();
  }

  function stepType(step) {
    if (U.stepType) return U.stepType(step);
    return safeString(step && step.type).toLowerCase() || 'autre';
  }

  function stepTone(step) {
    return STEP_TONES[stepType(step)] || STEP_TONES.autre;
  }

  function stepDisplayName(step) {
    if (U.stepDisplayName) return U.stepDisplayName(step, 'Étape');

    return safeString(
      step &&
      (
        step.label ||
        step.lieu ||
        step.place ||
        step.arrivee ||
        step.depart ||
        'Étape'
      )
    );
  }

  function stepSubtitle(step) {
    if (U.stepSubtitle) return U.stepSubtitle(step);

    if (!step) return '';

    if (stepType(step) === 'transport') {
      return [step.depart, step.arrivee]
        .map(safeString)
        .filter(Boolean)
        .join(' → ');
    }

    return safeString(step.lieu || step.place || step.note || '');
  }

  function stepCoords(step) {
    if (U.stepCoords) return U.stepCoords(step);

    const lat = Number(step && step.lat);
    const lng = Number(step && step.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng };
  }

  function stepHasCoords(step) {
    return !!stepCoords(step);
  }

  function stepRangeLabel(step) {
    if (U.stepRangeLabel) return U.stepRangeLabel(step);

    const start = safeString(step && step.time);
    const end = safeString(step && step.timeEnd);

    if (start && end) return start + '–' + end;
    if (start) return start;

    return '';
  }

  function stepIcon(step) {
    if (U.stepTypeIcon) return U.stepTypeIcon(step);
    return stepTone(step).icon || 'pin';
  }

  function stepDocumentUrl(step) {
    if (U.stepDocumentUrl) return U.stepDocumentUrl(step);

    const raw = safeString(step && step.link);

    if (!raw) return '';

    if (
      raw.startsWith('http://') ||
      raw.startsWith('https://') ||
      raw.startsWith('mailto:') ||
      raw.startsWith('tel:')
    ) {
      return raw;
    }

    return 'https://' + raw;
  }

  function isImportant(step) {
    if (U.stepImportant) return U.stepImportant(step);

    return !!(
      step &&
      (
        step.important ||
        step.favorite ||
        step.favori ||
        step.isImportant
      )
    );
  }

  function getDurationLabel(step) {
    return safeString(
      step &&
      (
        step.dur ||
        step.duree ||
        step.dureeEstimee
      )
    );
  }

  function getTransportTitle(step) {
    const from = safeString(step && (step.from || step.depart));
    const to = safeString(step && (step.to || step.arrivee));

    if (!from && !to) return '';

    return [from, to].filter(Boolean).join(' → ');
  }

  function buildUpdatedStep(step, patch) {
    return {
      ...step,
      ...patch,
      stepIndex: step && step.stepIndex != null ? step.stepIndex : 0
    };
  }

  function StepCard({
    step,
    day,
    trip,
    dayIndex,
    onEdit,
    onReload
  }) {
    const { selectedStepId } = Store.useStore(function select(state) {
      return {
        selectedStepId: state.selectedStepId
      };
    });

    if (!step) return null;

    const selected = !!selectedStepId && String(selectedStepId) === String(step.id);
    const tone = stepTone(step);
    const important = isImportant(step);
    const hasCoords = stepHasCoords(step);
    const needsLocation = !hasCoords;
    const range = stepRangeLabel(step);
    const duration = getDurationLabel(step);
    const subtitle = stepSubtitle(step);
    const documentUrl = stepDocumentUrl(step);

    const title = stepType(step) === 'transport' && !safeString(step.label)
      ? getTransportTitle(step) || stepDisplayName(step)
      : stepDisplayName(step);

    const startTime = safeString(step.time) || (range.includes('–') ? range.split('–')[0] : '');
    const endTime = safeString(step.timeEnd) || (range.includes('–') ? range.split('–')[1] : '');

    function selectStep() {
      Store.selectStep
        ? Store.selectStep(step.id || null)
        : Store.set({ selectedStepId: step.id || null });
    }

    function editStep(event) {
      event.stopPropagation();
      selectStep();

      if (onEdit) {
        onEdit(step);
      }
    }

    async function toggleImportant(event) {
      event.stopPropagation();

      if (!trip || !trip.id || !day || !day.id || !step || !step.id) {
        Store.showToast('Étape introuvable');
        return;
      }

      const nextImportant = !important;

      try {
        await window.SB.saveStep(
          trip.id,
          day.id,
          buildUpdatedStep(step, {
            important: nextImportant
          })
        );

        if (onReload) {
          onReload();
        } else {
          const refreshed = await window.SB.loadTrip(trip.id);
          Store.set({ trip: refreshed });
        }

        Store.showToast(
          nextImportant
            ? 'Étape marquée comme clé'
            : 'Étape retirée des étapes clés'
        );
      } catch (error) {
        Store.showToast('Erreur favori : ' + (error.message || error));
      }
    }

    function openDocument(event) {
      event.stopPropagation();

      if (!documentUrl) return;

      window.open(documentUrl, '_blank', 'noopener,noreferrer');
    }

    function openOnMap(event) {
      event.stopPropagation();

      selectStep();

      if (hasCoords) {
        if (Store.openMapForStep) {
          Store.openMapForStep(step.id);
        } else {
          Store.set({
            view: 'map',
            mapFocusStepId: step.id || null
          });
        }

        return;
      }

      const payload = {
        tripId: trip && trip.id,
        dayId: day && day.id,
        stepId: step.id || null
      };

      if (Store.startLocateStep) {
        Store.startLocateStep(payload);
      } else {
        Store.set({
          view: 'map',
          mapPickMode: 'locate-step',
          mapLocateStep: payload
        });
      }
    }


    return (
      <article className="fv-event" data-selected={selected ? 'true' : 'false'}>
        <div className="fv-time">
          <strong>{startTime || '—'}</strong>
          {endTime && <small>{endTime}</small>}
        </div>
        <details className="fv-event-body" onToggle={event => {
          if (event.currentTarget.open) selectStep();
        }}>
          <summary aria-label={'Détails de l’étape : ' + title}>
            <span className="fv-kind">
              <Icon name={stepIcon(step)} size={13} />
              {tone.label}
              {important && <span>★ Étape clé</span>}
            </span>
            <span className="fv-event-title">
              <span>{title}</span>
              <span className="fv-event-affordance" aria-hidden="true"><span>Détails</span><span className="fv-chevron">›</span></span>
            </span>
            {step.note && (
              <span className="fv-event-note">
                {String(step.note).length > 180
                  ? String(step.note).slice(0, 180) + '…'
                  : step.note}
              </span>
            )}

            {(!startTime || subtitle || duration) && (
              <span className="fv-event-meta">
                {!startTime && <span className="fv-unscheduled"><Icon name="clock" size={15} />Horaire à préciser</span>}
                {subtitle && <span><Icon name="pin" size={15} />{subtitle}</span>}
                {duration && <span><Icon name="clock" size={15} />{duration}</span>}
              </span>
            )}
          </summary>
          <div className="fv-event-details">
            {step.note && String(step.note).length > 180 && (
              <p className="fv-full-note">{step.note}</p>
            )}
            <div className="fv-actions">
              <button type="button" className="fv-button" onClick={editStep}>
                Modifier
              </button>
              <button type="button" className="fv-button" onClick={openOnMap}>
                <Icon name="map" size={14} />{hasCoords ? 'Carte' : 'Localiser'}
              </button>
              {documentUrl && (
                <button type="button" className="fv-button" onClick={openDocument}>
                  <Icon name="paperclip" size={14} />Document
                </button>
              )}
              <button type="button" className="fv-button"
                aria-pressed={important} onClick={toggleImportant}>
                {important ? '★ Retirer des étapes clés' : '☆ Marquer comme étape clé'}
              </button>
            </div>
          </div>
        </details>
      </article>
    );
  }

  window.StepCard = StepCard;
  window.ItineraryStepCard = StepCard;
})();

