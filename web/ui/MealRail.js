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

  function findLodgingStaysForDay(
    days,
    selectedDayIndex
  ) {
    if (
      U.findLodgingStaysForDay
    ) {
      return (
        U.findLodgingStaysForDay(
          days,
          selectedDayIndex
        )
      );
    }

    const stay =
      findActiveLodgingStay(
        days,
        selectedDayIndex
      );

    return stay ? [stay] : [];
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

  function getWeatherLocation(day) {
    if (!day) return '';

    return safeString(
      day.city ||
      day.region ||
      day.location ||
      day.place ||
      ''
    );
  }

  function monthClimateHint(day) {
    const iso = safeString(day && day.dateISO);
    const month = iso ? Number(iso.slice(5, 7)) : 0;
    const city = getWeatherLocation(day) || 'la destination';

    const hints = {
      1: 'Janvier est souvent froid dans l’hémisphère nord et chaud dans l’hémisphère sud. Prévois une vérification locale avant le départ.',
      2: 'Février peut être frais ou instable selon la région. Prévois une marge pour pluie, vent ou froid.',
      3: 'Mars est une période de transition : météo variable, couches légères recommandées.',
      4: 'Avril peut être changeant, avec alternance de pluie et d’éclaircies.',
      5: 'Mai est souvent doux, mais les averses restent possibles selon la destination.',
      6: 'Juin est généralement plus chaud, avec parfois des épisodes orageux.',
      7: 'Juillet est souvent chaud. Prévois eau, protection solaire et pauses.',
      8: 'Août est souvent chaud et parfois humide selon la destination.',
      9: 'Septembre est souvent agréable, mais la météo peut changer vite en bord de mer ou montagne.',
      10: 'Octobre peut être plus frais et parfois pluvieux. Prévois une veste légère et une option intérieure.',
      11: 'Novembre est souvent plus froid ou humide. Prévois des vêtements chauds et imperméables.',
      12: 'Décembre peut être froid dans l’hémisphère nord. Vérifie aussi les risques de neige ou fortes pluies.'
    };

    return {
      title: city,
      text: hints[month] || 'Prévision exacte indisponible pour cette date. Utilise cette tendance générale et vérifie la météo quelques jours avant.',
      details: [
        'Prévision exacte indisponible pour cette date',
        'Tendance générale basée sur le mois du voyage',
        'À confirmer quelques jours avant le départ'
      ],
      source: 'Tendance générale · à confirmer avec Open-Meteo'
    };
  }

  async function fetchWeatherSummary(day) {
    const city = getWeatherLocation(day);
    const dateISO = safeString(day && day.dateISO);

    if (!day || !city || !dateISO) {
      return monthClimateHint(day);
    }

    try {
      const geoUrl =
        'https://geocoding-api.open-meteo.com/v1/search?name=' +
        encodeURIComponent(city) +
        '&count=1&language=fr&format=json';

      const geoRes = await fetch(geoUrl);
      const geoJson = await geoRes.json();
      const place = geoJson && geoJson.results && geoJson.results[0];

      if (!place) {
        return monthClimateHint(day);
      }

      const weatherUrl =
        'https://api.open-meteo.com/v1/forecast' +
        '?latitude=' + encodeURIComponent(place.latitude) +
        '&longitude=' + encodeURIComponent(place.longitude) +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max' +
        '&timezone=auto' +
        '&start_date=' + encodeURIComponent(dateISO) +
        '&end_date=' + encodeURIComponent(dateISO);

      const weatherRes = await fetch(weatherUrl);
      const weatherJson = await weatherRes.json();

      if (!weatherJson || !weatherJson.daily || !weatherJson.daily.time || !weatherJson.daily.time.length) {
        return monthClimateHint(day);
      }

      const daily = weatherJson.daily;
      const max = daily.temperature_2m_max && daily.temperature_2m_max[0];
      const min = daily.temperature_2m_min && daily.temperature_2m_min[0];
      const rain = daily.precipitation_sum && daily.precipitation_sum[0];
      const rainProb = daily.precipitation_probability_max && daily.precipitation_probability_max[0];

      return {
        title: place.name || city,
        text: 'Prévision météo connectée pour cette journée.',
        details: [
          Number.isFinite(Number(min)) && Number.isFinite(Number(max))
            ? 'Températures : ' + Math.round(min) + '°C à ' + Math.round(max) + '°C'
            : 'Températures indisponibles',
          Number.isFinite(Number(rainProb))
            ? 'Risque de pluie : ' + Math.round(rainProb) + '%'
            : 'Risque de pluie indisponible',
          Number.isFinite(Number(rain))
            ? 'Précipitations : ' + Number(rain).toFixed(1) + ' mm'
            : 'Précipitations indisponibles'
        ],
        source: 'Source : Open-Meteo · modèle météo best_match'
      };
    } catch (error) {
      return monthClimateHint(day);
    }
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
  function handleClick(event) {
    event.stopPropagation();

    if (onClick) onClick(event);
  }

  return (
    <button
      type="button"
      title={title}
      onClick={handleClick}
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
    const important =
      stepImportant(step);

    const documentUrl =
      stepDocumentUrl(step);

    const title =
      stepDisplayName(
        step,
        'Restaurant'
      );
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

            <div
              className="web-meal-card-title"
              style={{
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
              <div
                className="web-meal-card-subtitle"
                style={{
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

    const documentUrl =
      stepDocumentUrl(step);

    const checkInDate =
      formatDate(
        stay.startISO
      );

    const checkOutDate =
      formatDate(
        stay.endISO
      );

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
        compact
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
              fontSize: 17,
              lineHeight: '22px',
              color: 'var(--text)',
              marginTop: 5
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
          marginTop: 8,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6
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
              {checkInDate
                ? ' · ' +
                  checkInDate
                : ''}
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
              {checkOutDate
                ? ' · ' +
                  checkOutDate
                : ''}
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
          minHeight: 124,
          border: '1px dashed var(--accent)',
          borderRadius: 14,
          background: 'var(--inset)',
          color: 'var(--accent)',
          boxShadow: 'var(--shadow)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
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
    const [weather, setWeather] = React.useState(function initialWeather() {
      return monthClimateHint(day);
    });

    React.useEffect(function loadWeather() {
      let cancelled = false;

      setWeather(monthClimateHint(day));

      fetchWeatherSummary(day).then(function updateWeather(nextWeather) {
        if (!cancelled && nextWeather) {
          setWeather(nextWeather);
        }
      });

      return function cleanup() {
        cancelled = true;
      };
    }, [
      day && day.dateISO,
      day && day.city,
      day && day.region
    ]);

    return (
      <div style={{
        border: '1px solid var(--outline-variant)',
        background: 'var(--surface-container-lowest,#fff)',
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
            background: 'var(--accent-soft)',
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

        <div style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid var(--outline-variant)',
          color: 'var(--faint)',
          fontSize: 10.5,
          lineHeight: '15px',
          fontFamily: 'var(--font-mono, ui-monospace)'
        }}>
          {weather.source}
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
      weather: false
    });

    const restaurants = getRestaurants(day);
    const stays =
      findLodgingStaysForDay(
        trip && trip.days,
        dayIndex || 0
      );

    const stay =
      stays[0] || null;

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
        className="web-meal-rail"
        style={{
          width: 292,
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
          className="web-meal-rail-scroll"
          style={{
            flex: '1 1 0',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarGutter: 'stable',
            padding: '16px 14px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <window.RailSection
            noBorder
            kicker="Hébergement"
            title="Hébergement"
            subtitle={
              stays.length === 1
                ? lodgingName(
                    stay.step
                  ) +
                  ' · ' +
                  stay.nights +
                  ' nuit' +
                  (
                    stay.nights > 1
                      ? 's'
                      : ''
                  )
                : stays.length > 1
                  ? stays.length +
                    ' hébergements concernés aujourd’hui'
                  : 'Aucun hébergement pour cette nuit.'
            }
            icon="bed"
            open={openSections.lodging}
            onToggle={() => toggleSection('lodging')}
          >
            {stays.length ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection:
                    'column',
                  gap: 8
                }}
              >
                {stays.map(
                  function renderStay(
                    currentStay,
                    index
                  ) {
                    return (
                      <LodgingCard
                        key={
                          String(
                            currentStay
                              .step
                              ?.id ||
                              index
                          ) +
                          '-' +
                          currentStay
                            .status
                        }
                        stay={
                          currentStay
                        }
                        day={day}
                        trip={trip}
                        onEditStep={
                          onEditStep
                        }
                      />
                    );
                  }
                )}
              </div>
            ) : (
              <EmptyLodgingCard
                onAdd={addLodging}
              />
            )}
          </window.RailSection>

          <window.RailSection
            kicker="Où manger"
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
            kicker="Conditions"
            title="Météo"
            subtitle="Prévision ou tendance pour cette journée."
            icon="sparkle"
            open={openSections.weather}
            onToggle={() => toggleSection('weather')}
          >
            <WeatherBlock day={day} />
          </window.RailSection>
        </div>
      </aside>
    );
  }

  window.MealRail = MealRail;
  window.ItineraryMealRail = MealRail;
})();
