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
          borderRadius: 999,
          padding: '6px 10px',
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
        onClick={selectStep}
        style={{
          borderRadius: 12,
          padding: '18px 20px',
          boxShadow: selected
            ? '0 0 0 4px rgba(180,132,62,.22), 0 10px 28px rgba(31,46,40,.14)'
            : 'var(--shadow)',
          border: selected
            ? '1px solid var(--accent)'
            : '1px solid var(--outline-variant)',
          background: selected ? 'var(--accent-soft)' : 'var(--surface-container-lowest,#fff)',
          display: 'flex',
          gap: 16,
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'box-shadow .2s, border-color .2s, background .2s',
          flexShrink: 0,
          minHeight: 124
        }}
      >
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: tone.accent
        }} />

        <IconButton
          title={important ? 'Retirer des étapes clés' : 'Marquer comme étape clé'}
          onClick={toggleImportant}
          active={important}
          top={12}
          right={12}
        >
          {important ? '★' : '☆'}
        </IconButton>

        <IconButton
          title="Modifier cette étape"
          onClick={editStep}
          top={48}
          right={12}
        >
          ✎
        </IconButton>

        <div
          className="web-step-time-column"
          style={{
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          justifyItems: 'center',
          minWidth: 62,
          paddingTop: 2,
          paddingBottom: 2
        }}>
          <div style={{
            fontFamily: 'var(--font-mono, ui-monospace)',
            fontSize: 11,
            lineHeight: '14px',
            fontWeight: 900,
            color: tone.accent,
            textAlign: 'center'
          }}>
            {startTime || '—'}
          </div>

          <div style={{
            position: 'relative',
            width: 1,
            minHeight: 76,
            background: 'var(--outline-variant)',
            margin: '8px 0'
          }}>
            {duration && (
              <span style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 999,
                background: 'var(--card)',
                color: 'var(--muted)',
                boxShadow: '0 2px 8px rgba(82,98,91,.08)',
                fontFamily: 'var(--font-mono, ui-monospace)',
                fontSize: 10,
                fontWeight: 900,
                lineHeight: '14px',
                padding: '3px 7px',
                whiteSpace: 'nowrap'
              }}>
                {duration}
              </span>
            )}
          </div>

          <div style={{
            fontFamily: 'var(--font-mono, ui-monospace)',
            fontSize: 11,
            lineHeight: '14px',
            fontWeight: 900,
            color: endTime ? tone.accent : 'var(--faint)',
            textAlign: 'center'
          }}>
            {endTime || '—'}
          </div>
        </div>

        <div
          className="web-step-card-content"
          style={{
          flex: 1,
          minWidth: 0,
          paddingRight: 38
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 7,
            marginBottom: 7
          }}>
            <Pill tone={tone} icon={stepIcon(step)} strong>
              {tone.label}
            </Pill>

            {important && (
              <Pill
                tone={{
                  accent: 'var(--accent)',
                  soft: 'var(--accent-soft)'
                }}
                strong
              >
                ★ Étape clé
              </Pill>
            )}
          </div>

          <div
            className="web-step-card-title"
            style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            lineHeight: '28px',
            color: 'var(--text)',
            marginBottom: 8
          }}>
            {title}
          </div>

          {subtitle && (
            <p style={{
              fontSize: 13.5,
              lineHeight: '20px',
              color: 'var(--muted)',
              margin: '0 0 10px'
            }}>
              {subtitle}
            </p>
          )}

          {step.note && (
            <p style={{
              fontSize: 13.5,
              lineHeight: '20px',
              color: 'var(--muted)',
              fontStyle: 'italic',
              margin: '0 0 10px'
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
           
            {needsLocation && (
              <Pill
                tone={{
                  accent: 'var(--accent)',
                  soft: 'var(--accent-soft)'
                }}
                strong
              >
                ⌖ À localiser
              </Pill>
            )}

            {documentUrl && (
              <ActionButton
                title="Ouvrir le document lié"
                onClick={openDocument}
                accent
              >
                <Icon name="paperclip" size={13} />
                Document
              </ActionButton>
            )}

            <ActionButton
              title={hasCoords ? 'Voir sur la carte' : 'Localiser cette étape'}
              onClick={openOnMap}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>⌖</span>
              {hasCoords ? 'Carte' : 'Localiser'}
            </ActionButton>
          </div>
        </div>
      </article>
    );
  }

  window.StepCard = StepCard;
  window.ItineraryStepCard = StepCard;
})();
