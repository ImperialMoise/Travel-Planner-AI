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

  function Pill({ children, tone, icon, strong }) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: strong ? '5px 9px' : '4px 10px',
        borderRadius: strong ? 999 : 6,
        background: tone && tone.soft ? tone.soft : 'var(--soft)',
        color: tone && tone.accent ? tone.accent : 'var(--muted)',
        fontFamily: strong ? 'inherit' : 'var(--font-mono, ui-monospace)',
        fontSize: strong ? 10 : 10,
        fontWeight: strong ? 900 : 700,
        letterSpacing: strong ? '.14em' : 'normal',
        textTransform: strong ? 'uppercase' : 'none'
      }}>
        {icon ? <Icon name={icon} size={12} /> : null}
        {children}
      </span>
    );
  }

  function IconButton({
    title,
    children,
    onClick,
    active,
    danger,
    top,
    right
  }) {
    return (
      <button
        className="web-step-icon-button"
        type="button"
        title={title}
        onClick={onClick}
        style={{
          position: 'absolute',
          top,
          right,
          zIndex: 4,
          width: 30,
          height: 30,
          borderRadius: 999,
          border: active
            ? '1px solid rgba(180,132,62,.45)'
            : danger
              ? '1px solid rgba(192,86,63,.35)'
              : '1px solid var(--outline-variant)',
          background: active
            ? 'var(--accent)'
            : danger
              ? 'rgba(192,86,63,.10)'
              : 'var(--inset)',
          color: active
            ? 'var(--accent-ink)'
            : danger
              ? '#c0563f'
              : 'var(--text)',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 14,
          lineHeight: 1,
          boxShadow: active ? '0 6px 14px rgba(180,132,62,.22)' : 'none'
        }}
      >
        {children}
      </button>
    );
  }

  function ActionButton({
    children,
    onClick,
    title,
    accent,
    muted,
    disabled
  }) {
    return (
      <button
        className="web-step-action-button"
        type="button"
        title={title}
        onClick={onClick}
        disabled={disabled}
        style={{
          border: '1px solid var(--outline-variant)',
          background: accent ? 'var(--accent-soft)' : 'var(--inset)',
          color: disabled
            ? 'var(--faint)'
            : accent
              ? 'var(--accent)'
              : muted
                ? 'var(--muted)'
                : 'var(--text)',
          borderRadius: 10,
          minHeight: 44,
          padding: '8px 12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          fontSize: 11,
          fontWeight: 800
        }}
      >
        {children}
      </button>
    );
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
      <article
        className="web-step-card"
        data-selected={selected ? 'true' : 'false'}
        onClick={selectStep}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          gap: 16,
          padding: 18,
          minWidth: 0,
          borderRadius: 14,
          border: '1px solid ' + (
            selected ? 'var(--accent)' : 'var(--line)'
          ),
          borderLeft: '3px solid ' + tone.accent,
          background: selected
            ? 'var(--accent-soft)'
            : 'var(--card)',
          boxShadow: 'none'
        }}
      >
        <div
          className="web-step-time-column"
          style={{
            flex: '0 0 76px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 5
          }}
        >
          <strong style={{
            fontSize: startTime ? 16 : 12,
            lineHeight: 1.4,
            color: startTime ? 'var(--text)' : 'var(--muted)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {startTime || 'Horaire libre'}
          </strong>

          {endTime && (
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              → {endTime}
            </span>
          )}

          {duration && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {duration}
            </span>
          )}
        </div>

        <div
          className="web-step-card-content"
          style={{
            flex: '1 1 180px',
            minWidth: 0,
            paddingRight: 0,
            overflowWrap: 'anywhere'
          }}
        >
          <div style={{
            marginBottom: 8,
            color: tone.accent,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            fontSize: 12,
            fontWeight: 600
          }}>
            <Icon name={stepIcon(step)} size={14} />
            {tone.label}
            {important && <span>★ Étape clé</span>}
          </div>

          <h3
            className="web-step-card-title"
            style={{
              margin: '0 0 8px',
              fontFamily: 'var(--font-serif)',
              fontSize: 23,
              lineHeight: 1.25,
              fontWeight: 400,
              color: 'var(--text)'
            }}
          >
            {title}
          </h3>

          {subtitle && (
            <p style={{
              margin: '0 0 10px',
              color: 'var(--muted)',
              fontSize: 14,
              lineHeight: 1.5
            }}>
              {subtitle}
            </p>
          )}

          {step.note && (
            <p style={{
              margin: '0 0 14px',
              color: 'var(--text)',
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {step.note}
            </p>
          )}

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8
          }}>
            <ActionButton title="Modifier cette étape" onClick={editStep}>
              Modifier
            </ActionButton>

            <ActionButton
              title={hasCoords ? 'Voir sur la carte' : 'Localiser cette étape'}
              onClick={openOnMap}
            >
              <Icon name="map" size={14} />
              {hasCoords ? 'Carte' : 'Localiser'}
            </ActionButton>

            {documentUrl && (
              <ActionButton
                title="Ouvrir le document lié"
                onClick={openDocument}
              >
                <Icon name="paperclip" size={14} />
                Document
              </ActionButton>
            )}

            <button
              type="button"
              className="web-step-action-button"
              aria-pressed={important}
              aria-label={important
                ? 'Retirer des étapes clés'
                : 'Marquer comme étape clé'}
              onClick={toggleImportant}
              style={{
                minWidth: 44,
                minHeight: 44,
                padding: 8,
                border: '1px solid var(--outline-variant)',
                borderRadius: 10,
                background: important
                  ? 'var(--accent-soft)'
                  : 'var(--card)',
                color: important ? 'var(--accent)' : 'var(--muted)',
                fontSize: 20,
                cursor: 'pointer'
              }}
            >
              <span aria-hidden="true">{important ? '★' : '☆'}</span>
            </button>
          </div>
        </div>
      </article>
    );
  }

  window.StepCard = StepCard;
  window.ItineraryStepCard = StepCard;
})();
