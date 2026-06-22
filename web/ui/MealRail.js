// ════════════════════════════════════════════════════════════
// MealRail.js — Colonne droite de l’itinéraire
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Afficher les restaurants du jour.
// - Afficher l’hébergement actif du jour.
// - Afficher un bloc météo simple.
// - Ouvrir l’éditeur pour ajouter/modifier.
// - Marquer un restaurant comme étape clé.
// - Ouvrir les documents liés.
// - Garder un scroll propre dans la colonne.
//
// Dépendances globales :
// - React
// - Store
// - Icon
// - window.SB
// - window.ItineraryUtils
// - window.RailSection
// - window.RailActionButton
// - window.RailEmptyState
// - window.RailCard
//
// API :
//   <window.MealRail
//     trip={realTrip}
//     day={day}
//     dayIndex={sel}
//     onEditStep={(day, step) => ...}
//     onAddStep={(type, preset) => ...}
//     onReload={() => ...}
//   />
//
// ════════════════════════════════════════════════════════════

(function initMealRail() {
  const U = window.ItineraryUtils || {};

  function safeString(value) {
    if (U.safeString) return U.safeString(value);
    return String(value == null ? '' : value).trim();
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

  function stepSubtitle(step) {
    if (U.stepSubtitle) return U.stepSubtitle(step);

    return safeString(step && (step.lieu || step.place || step.note));
  }

  function isRestaurantStep(step) {
    if (U.isRestaurantStep) return U.isRestaurantStep(step);

    const type = safeString(step && step.type).toLowerCase();
    return type === 'restaurant' || type === 'table';
  }

  function isLodgingStep(step) {
    if (U.isLodgingStep) return U.isLodgingStep(step);

    return safeString(step && step.type).toLowerCase() === 'logement';
  }

  function stepImportant(step) {
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

  function stepRangeLabel(step) {
    if (U.stepRangeLabel) return U.stepRangeLabel(step);

    const time = safeString(step && step.time);
    const end = safeString(step && step.timeEnd);

    if (time && end) return time + '–' + end;
    if (time) return time;

    return '';
  }

  function lodgingName(step) {
    if (U.lodgingName) return U.lodgingName(step);

    return stepDisplayName(step, 'Hébergement');
  }

  function lodgingNightCount(step) {
    if (U.lodgingNightCount) return U.lodgingNightCount(step);

    return Math.max(1, Number(step && (step.nights || step.nuits || 1)) || 1);
  }

  function findActiveLodgingStay(days, selectedDayIndex) {
    if (U.findActiveLodgingStay) {
      return U.findActiveLodgingStay(days, selectedDayIndex);
    }

    const safeDays = Array.isArray(days) ? days : [];
    const day = safeDays[selectedDayIndex || 0];

    if (!day) return null;

    const lodging = (day.steps || []).find(isLodgingStep);

    if (!lodging) return null;

    return {
      step: lodging,
      sourceDay: day,
      sourceDayIndex: selectedDayIndex || 0,
      nights: lodgingNightCount(lodging),
      status: 'checkin',
      nightNumber: 1
    };
  }

  function formatDate(iso) {
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

  function getRestaurants(day) {
    return (day && Array.isArray(day.steps) ? day.steps : [])
      .filter(isRestaurantStep)
      .sort(function sortMeals(a, b) {
        return safeString(a.time).localeCompare(safeString(b.time));
      });
  }

  function getWeatherSummary(day) {
    const date = formatDate(day && day.dateISO);
    const stepCount = Array.isArray(day && day.steps) ? day.steps.length : 0;

    if (!day) {
      return {
        title: 'Météo',
        text: 'Sélectionne une journée pour préparer les conditions météo.',
        details: []
      };
    }

    return {
      title: date || 'Journée sélectionnée',
      text: 'Ajoute plus tard une météo connectée. Pour l’instant, ce bloc sert de rappel de préparation.',
      details: [
        stepCount + ' étape' + (stepCount > 1 ? 's' : '') + ' prévue' + (stepCount > 1 ? 's' : ''),
        'Vérifier pluie, température et vent la veille',
        'Prévoir une alternative intérieure si besoin'
      ]
    };
  }

  function SmallPill({ children, accent, muted }) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          borderRadius: 999,
          padding: '4px 8px',
          background: accent ? 'var(--accent-soft)' : 'var(--inset)',
          color: accent ? 'var(--accent)' : muted ? 'var(--muted)' : 'var(--text)',
          fontSize: 10.5,
          fontWeight: 800,
          whiteSpace: 'nowrap'
        }}
      >
        {children}
      </span>
    );
  }

  function InlineButton({
    children,
    onClick,
    title,
    accent,
    disabled
  }) {
    return (
      <button
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
              : 'var(--text)',
          borderRadius: 999,
          padding: '6px 10px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          fontSize: 11,
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        {children}
      </button>
    );
  }

  function RestaurantCard({
    step,
    day,
    trip,
    onEditStep,
    onReload
  }) {
    const important = stepImportant(step);
    const documentUrl = stepDocumentUrl(step);
    const title = stepDisplayName(step, 'Restaurant');
    const subtitle = stepSubtitle(step);
    const time = stepRangeLabel(step);

    async function toggleImportant(event) {
      event.stopPropagation();

      if (!trip || !trip.id || !day || !day.id || !step || !step.id) {
        Store.showToast('Restaurant introuvable');
        return;
      }

      const nextImportant = !important;

      try {
        await window.SB.saveStep(trip.id, day.id, {
          ...step,
          important: nextImportant,
          stepIndex: step.stepIndex || 0
        });

        if (onReload) {
          onReload();
        } else {
          const refreshed = await window.SB.loadTrip(trip.id);
          Store.set({ trip: refreshed });
        }

        Store.showToast(
          nextImportant
            ? 'Restaurant marqué comme étape clé'
            : 'Restaurant retiré des étapes clés'
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

    function openMap(event) {
      event.stopPropagation();

      if (step.lat != null && step.lng != null && step.id) {
        Store.openMapForStep
          ? Store.openMapForStep(step.id)
          : Store.set({ view: 'map', mapFocusStepId: step.id });

        return;
      }

      Store.startLocateStep
        ? Store.startLocateStep({
            tripId: trip && trip.id,
            dayId: day && day.id,
            stepId: step && step.id
          })
        : Store.set({
            view: 'map',
            mapPickMode: 'locate-step',
            mapLocateStep: {
              tripId: trip && trip.id,
              dayId: day && day.id,
              stepId: step && step.id
            }
          });
    }

    return (
      <window.RailCard
        compact
        onClick={() => onEditStep && onEditStep(day, step)}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              flexWrap: 'wrap',
              marginBottom: 6
            }}>
              {time && (
                <SmallPill accent>
                  {time}
                </SmallPill>
              )}

              {important && (
                <SmallPill accent>
                  ★ Étape clé
                </SmallPill>
              )}
            </div>

            <div style={{
              fontSize: 14,
              fontWeight: 900,
              color: 'var(--text)',
              lineHeight: '18px',
              marginBottom: subtitle ? 4 : 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {title}
            </div>

            {subtitle && (
              <div style={{
                fontSize: 12,
                lineHeight: '17px',
                color: 'var(--muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {subtitle}
              </div>
            )}
          </div>

          <button
            type="button"
            title={important ? 'Retirer des étapes clés' : 'Marquer comme étape clé'}
            onClick={toggleImportant}
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              border: important
                ? '1px solid var(--accent)'
                : '1px solid var(--outline-variant)',
              background: important ? 'var(--accent)' : 'var(--inset)',
              color: important ? 'var(--accent-ink)' : 'var(--muted)',
              cursor: 'pointer',
              flexShrink: 0,
              fontSize: 14,
              lineHeight: 1
            }}
          >
            {important ? '★' : '☆'}
          </button>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginTop: 10
        }}>
          {documentUrl && (
            <InlineButton onClick={openDocument} accent>
              <Icon name="paperclip" size={13} />
              Document
            </InlineButton>
          )}

          <InlineButton onClick={openMap}>
            <span style={{ fontSize: 13 }}>⌖</span>
            {step.lat != null && step.lng != null ? 'Carte' : 'Localiser'}
          </InlineButton>

          <InlineButton
            onClick={event => {
              event.stopPropagation();
              if (onEditStep) onEditStep(day, step);
            }}
          >
            ✎ Modifier
          </InlineButton>
        </div>
      </window.RailCard>
    );
  }

  function LodgingCard({
    stay,
    day,
    trip,
    onEditStep
  }) {
    if (!stay || !stay.step) return null;

    const step = stay.step;
    const title = lodgingName(step);
    const subtitle = stepSubtitle(step);
    const documentUrl = stepDocumentUrl(step);

    const statusLabel =
      stay.status === 'checkin'
        ? 'Check-in'
        : stay.status === 'checkout'
          ? 'Check-out'
          : 'Nuitée';
    const nightLabel = 'Nuit ' + Math.min(stay.nightNumber || 1, stay.nights || 1) + '/' + (stay.nights || 1);

    function openDocument(event) {
      event.stopPropagation();

      if (!documentUrl) return;

      window.open(documentUrl, '_blank', 'noopener,noreferrer');
    }

    function openMap(event) {
      event.stopPropagation();

      if (step.lat != null && step.lng != null && step.id) {
        Store.openMapForStep
          ? Store.openMapForStep(step.id)
          : Store.set({ view: 'map', mapFocusStepId: step.id });

        return;
      }

      Store.startLocateStep
        ? Store.startLocateStep({
            tripId: trip && trip.id,
            dayId: stay.sourceDay && stay.sourceDay.id,
            stepId: step && step.id
          })
        : Store.set({
            view: 'map',
            mapPickMode: 'locate-step',
            mapLocateStep: {
              tripId: trip && trip.id,
              dayId: stay.sourceDay && stay.sourceDay.id,
              stepId: step && step.id
            }
          });
    }

    return (
      <window.RailCard
        onClick={() => onEditStep && onEditStep(stay.sourceDay || day, step)}
      >
        <div style={{
          position: 'absolute',
          inset: '0 auto 0 0',
          width: 3,
          background: 'var(--accent)'
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10
        }}>
          <div style={{ minWidth: 0 }}>
            <SmallPill accent>
              {statusLabel}
            </SmallPill>

            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 21,
              lineHeight: '27px',
              color: 'var(--text)',
              marginTop: 8
            }}>
              {title}
            </div>

            {subtitle && (
              <div style={{
                marginTop: 4,
                color: 'var(--muted)',
                fontSize: 12.5,
                lineHeight: '18px'
              }}>
                {subtitle}
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0
          }}>
            <span style={{
              border: '1px solid rgba(154,101,8,.20)',
              borderRadius: 999,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono, ui-monospace)',
              fontSize: 10.5,
              fontWeight: 900,
              lineHeight: '14px',
              padding: '5px 9px',
              whiteSpace: 'nowrap'
            }}>
              {nightLabel}
            </span>

            <span style={{
              width: 38,
              height: 38,
              borderRadius: 13,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0
            }}>
              <Icon name="bed" size={18} />
            </span>
          </div>
        </div>

        <div style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8
        }}>
          <div style={{
            borderRadius: 10,
            background: 'var(--inset)',
            padding: 10
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'var(--faint)',
              marginBottom: 3
            }}>
              Arrivée
            </div>

            <div style={{
              fontSize: 12.5,
              fontWeight: 900,
              color: 'var(--text)'
            }}>
              {step.timeCheckIn || '15:00'}
            </div>
          </div>

          <div style={{
            borderRadius: 10,
            background: 'var(--inset)',
            padding: 10
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'var(--faint)',
              marginBottom: 3
            }}>
              Départ
            </div>

            <div style={{
              fontSize: 12.5,
              fontWeight: 900,
              color: 'var(--text)'
            }}>
              {step.timeCheckOut || '11:00'}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginTop: 12
        }}>
          {documentUrl && (
            <InlineButton onClick={openDocument} accent>
              <Icon name="paperclip" size={13} />
              Document
            </InlineButton>
          )}

          <InlineButton onClick={openMap}>
            <span style={{ fontSize: 13 }}>⌖</span>
            {step.lat != null && step.lng != null ? 'Carte' : 'Localiser'}
          </InlineButton>

          <InlineButton
            onClick={event => {
              event.stopPropagation();
              if (onEditStep) onEditStep(stay.sourceDay || day, step);
            }}
          >
            ✎ Modifier
          </InlineButton>
        </div>
      </window.RailCard>
    );
  }

  function EmptyLodgingCard({ onAdd }) {
    return (
      <button
        type="button"
        onClick={onAdd}
        style={{
          width: '100%',
          minHeight: 196,
          border: '1px dashed var(--accent)',
          borderRadius: 14,
          background: 'var(--inset)',
          color: 'var(--accent)',
          boxShadow: 'var(--shadow)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          textAlign: 'center'
        }}
      >
        <span style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          display: 'grid',
          placeItems: 'center'
        }}>
          <Icon name="bed" size={19} />
        </span>

        <span style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 21,
          lineHeight: '26px',
          color: 'var(--text)'
        }}>
          Ajouter un hébergement
        </span>

        <span style={{
          maxWidth: 220,
          color: 'var(--muted)',
          fontSize: 12.5,
          lineHeight: '18px'
        }}>
          Renseigne l’adresse, les horaires de check-in/check-out et le nombre de nuits.
        </span>
      </button>
    );
  }

  function WeatherBlock({ day }) {
    const weather = getWeatherSummary(day);

    return (
      <div style={{
        border: '1px solid var(--outline-variant)',
        background: 'var(--inset)',
        borderRadius: 14,
        padding: 14
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 10
        }}>
          <div>
            <div style={{
              fontSize: 13,
              fontWeight: 900,
              color: 'var(--text)',
              marginBottom: 3
            }}>
              {weather.title}
            </div>

            <div style={{
              fontSize: 12.5,
              lineHeight: '18px',
              color: 'var(--muted)'
            }}>
              {weather.text}
            </div>
          </div>

          <div style={{
            width: 38,
            height: 38,
            borderRadius: 13,
            background: 'var(--card)',
            color: 'var(--accent)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0
          }}>
            ☁
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          {weather.details.map(function renderDetail(item, index) {
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: 7,
                  color: 'var(--muted)',
                  fontSize: 12.5,
                  lineHeight: '18px'
                }}
              >
                <span style={{ color: 'var(--accent)', fontWeight: 900 }}>•</span>
                <span>{item}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function MealRail({
    trip,
    day,
    dayIndex,
    onEditStep,
    onAddStep,
    onReload
  }) {
    const [openSections, setOpenSections] = React.useState({
      restaurants: true,
      lodging: true,
      weather: true
    });

    const restaurants = getRestaurants(day);
    const stay = findActiveLodgingStay(
      trip && trip.days,
      dayIndex || 0
    );

    function toggleSection(key) {
      setOpenSections(function update(prev) {
        return {
          ...prev,
          [key]: !prev[key]
        };
      });
    }

    function addRestaurant() {
      if (onAddStep) {
        onAddStep('restaurant', {
          type: 'restaurant'
        });
      }
    }

    function addLodging() {
      const dateStart = day && day.dateISO ? day.dateISO : '';

      if (onAddStep) {
        onAddStep('logement', {
          type: 'logement',
          lockedType: 'logement',
          dateStart,
          dateEnd: dateStart && U.addDaysISO ? U.addDaysISO(dateStart, 1) : '',
          timeCheckIn: '15:00',
          timeCheckOut: '11:00',
          nuits: 1,
          nights: 1
        });
      }
    }

    return (
      <aside
        style={{
          width: 320,
          flexShrink: 0,
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderLeft: '1px solid var(--outline-variant)',
          background: 'var(--bg)'
        }}
      >
        <div
          style={{
            flex: '1 1 0',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarGutter: 'stable',
            padding: '22px 18px 26px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18
          }}
        >
          <window.RailSection
            noBorder
            kicker="Restaurants"
            title="Où manger ?"
            subtitle={restaurants.length
              ? restaurants.length + ' adresse' + (restaurants.length > 1 ? 's' : '') + ' prévue' + (restaurants.length > 1 ? 's' : '')
              : 'Ajoute les repas importants de la journée.'}
            icon="fork"
            open={openSections.restaurants}
            onToggle={() => toggleSection('restaurants')}
            actions={
              <window.RailActionButton
                title="Ajouter un restaurant"
                onClick={addRestaurant}
                primary
              >
                +
              </window.RailActionButton>
            }
          >
            {restaurants.length ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                {restaurants.map(function renderRestaurant(step) {
                  return (
                    <RestaurantCard
                      key={step.id || step.stepIndex || step.label}
                      step={step}
                      day={day}
                      trip={trip}
                      onEditStep={onEditStep}
                      onReload={onReload}
                    />
                  );
                })}
              </div>
            ) : (
              <window.RailEmptyState
                actionLabel="Ajouter un restaurant"
                actionIcon="fork"
                onAction={addRestaurant}
              >
                Aucun restaurant prévu pour cette journée.
              </window.RailEmptyState>
            )}
          </window.RailSection>

          <window.RailSection
            kicker="Hébergement"
            title="Nuit du jour"
            subtitle={stay
              ? 'Hébergement actif sur cette journée.'
              : 'Aucun hébergement associé à ce jour.'}
            icon="bed"
            open={openSections.lodging}
            onToggle={() => toggleSection('lodging')}
            actions={
              !stay ? (
                <window.RailActionButton
                  title="Ajouter un hébergement"
                  onClick={addLodging}
                  primary
                >
                  +
                </window.RailActionButton>
              ) : null
            }
          >
            {stay ? (
              <LodgingCard
                stay={stay}
                day={day}
                trip={trip}
                onEditStep={onEditStep}
              />
            ) : (
              <window.RailEmptyState
                actionLabel="Ajouter un hébergement"
                actionIcon="bed"
                onAction={addLodging}
              >
                Ajoute un logement multi-nuits pour suivre check-in, check-out et documents.
              </window.RailEmptyState>
            )}
          </window.RailSection>

          <window.RailSection
            noBorder
            kicker="Météo"
            title="Préparer la journée"
            subtitle="Bloc indicatif avant météo connectée."
            icon="sparkle"
            open={openSections.weather}
            onToggle={() => toggleSection('weather')}
          >
            <WeatherBlock day={day} />
          </window.RailSection>
      </aside>
    );
  }

  window.MealRail = MealRail;
  window.ItineraryMealRail = MealRail;
})();
