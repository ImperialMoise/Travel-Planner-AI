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


  function weatherAvailability(day) {
    const city = getWeatherLocation(day);
    const iso = safeString(day && day.dateISO);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T12:00:00') : null;
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const offset = date && !Number.isNaN(date.getTime())
      ? Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - today) / 86400000)
      : null;

    let reason = '';
    let text = 'La prévision locale est indisponible pour cette journée.';
    if (offset === null) {
      reason = 'date';
      text = 'Renseigne la date de la journée pour consulter la météo.';
    } else if (offset < 0) {
      reason = 'past';
      text = 'Aucune donnée météo historique n’est chargée pour cette journée.';
    } else if (!city) {
      reason = 'location';
      text = 'Renseigne une ville dans la journée pour consulter la météo.';
    } else if (offset > 15) {
      reason = 'future';
      text = 'Cette date est trop éloignée pour une prévision. Consulte cette rubrique à l’approche du départ.';
    }

    return {
      kind: 'unavailable',
      eligible: !reason,
      reason,
      title: city || 'Météo locale',
      text,
      dateLabel: formatDate(iso),
      details: [],
      source: ''
    };
  }

  async function fetchWeatherSummary(day, signal) {
    const fallback = weatherAvailability(day);
    if (!fallback.eligible) return fallback;
    const city = getWeatherLocation(day);
    const dateISO = safeString(day && day.dateISO);

    try {
      const geoUrl =
        'https://geocoding-api.open-meteo.com/v1/search?name=' +
        encodeURIComponent(city) + '&count=1&language=fr&format=json';
      const geoRes = await fetch(geoUrl, { signal });
      if (!geoRes.ok) return fallback;
      const geoJson = await geoRes.json();
      const place = geoJson && geoJson.results && geoJson.results[0];
      if (!place) return fallback;

      const weatherUrl =
        'https://api.open-meteo.com/v1/forecast' +
        '?latitude=' + encodeURIComponent(place.latitude) +
        '&longitude=' + encodeURIComponent(place.longitude) +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max' +
        '&timezone=auto' +
        '&start_date=' + encodeURIComponent(dateISO) +
        '&end_date=' + encodeURIComponent(dateISO);
      const weatherRes = await fetch(weatherUrl, { signal });
      if (!weatherRes.ok) return fallback;
      const weatherJson = await weatherRes.json();
      const daily = weatherJson && weatherJson.daily;
      if (!daily || !Array.isArray(daily.time)) return fallback;
      const index = daily.time.indexOf(dateISO);
      if (index < 0) return fallback;

      const numberAt = values => {
        const value = values && values[index];
        return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
          ? Number(value) : null;
      };
      const min = numberAt(daily.temperature_2m_min);
      const max = numberAt(daily.temperature_2m_max);
      const rain = numberAt(daily.precipitation_sum);
      const rainProb = numberAt(daily.precipitation_probability_max);
      if ([min, max, rain, rainProb].every(value => value === null)) return fallback;

      return {
        kind: 'forecast',
        title: place.name || city,
        text: min !== null && max !== null
          ? Math.round(min) + ' à ' + Math.round(max) + ' °C'
          : 'Prévision locale disponible',
        dateLabel: formatDate(dateISO),
        details: [
          rainProb !== null ? 'Risque de pluie : ' + Math.round(rainProb) + ' %' : '',
          rain !== null ? 'Précipitations : ' + rain.toFixed(1) + ' mm' : ''
        ].filter(Boolean),
        source: 'Source : Open-Meteo'
      };
    } catch (error) {
      return fallback;
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
        ? 'Arrivée aujourd’hui'
        : stay.status === 'checkout'
          ? 'Départ aujourd’hui'
          : 'Tu dors ici ce soir';

    const nightLabel = stay.status === 'checkout'
      ? 'Dernière nuit passée'
      : 'Nuit ' +
        Math.min(stay.nightNumber || 1, stay.nights || 1) +
        ' / ' + (stay.nights || 1);

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
              {step.timeCheckIn || 'Horaire à préciser'}
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
              {step.timeCheckOut || 'Horaire à préciser'}
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
          minHeight: 48,
          border: '1px dashed var(--accent)',
          borderRadius: 12,
          background: 'var(--inset)',
          color: 'var(--accent)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          textAlign: 'center'
        }}
      >
        <span style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0
        }}>
          <Icon name="bed" size={15} />
        </span>

        <span style={{
          fontSize: 13,
          lineHeight: '18px',
          fontWeight: 900
        }}>
          Ajouter un hébergement
        </span>
      </button>
    );
  }

 function WeatherBlock({ day }) {
    const key = [day?.id, day?.dateISO, getWeatherLocation(day)].join('|');
    const [result, setResult] = React.useState(null);
    const fallback = weatherAvailability(day);
    const weather = result?.key === key ? result.weather : fallback;

    React.useEffect(function loadWeather() {
      let cancelled = false;
      const controller = new AbortController();
      const initial = weatherAvailability(day);
      setResult({
        key,
        weather: initial.eligible
          ? { ...initial, kind: 'loading', text: 'Chargement de la prévision locale…' }
          : initial
      });
      if (!initial.eligible) return () => controller.abort();

      const timeout = window.setTimeout(() => controller.abort(), 10000);
      fetchWeatherSummary(day, controller.signal).then(nextWeather => {
        window.clearTimeout(timeout);
        if (!cancelled) setResult({ key, weather: nextWeather });
      });

      return function cleanup() {
        cancelled = true;
        window.clearTimeout(timeout);
        controller.abort();
      };
    }, [key]);

    return (
      <div className="fv-weather" aria-busy={weather.kind === 'loading'}>
        <div className="fv-weather-summary">
          <Icon name="cal" size={18} />
          <div>
            <strong>{weather.title}</strong>
            {weather.dateLabel && <span className="fv-weather-date">{weather.dateLabel}</span>}
            <p>{weather.text}</p>
          </div>
        </div>
        {!!weather.details.length && (
          <details className="fv-rail-details" key={'weather-' + key}>
            <summary>Détails météo</summary>
            <ul>{weather.details.map((item, index) => <li key={index}>{item}</li>)}</ul>
          </details>
        )}
        {weather.source && <small>{weather.source}</small>}
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

    const restaurants = getRestaurants(day);
    const stays =
      findLodgingStaysForDay(
        trip && trip.days,
        dayIndex || 0
      );

    const tonightStay =
      stays.find(item => item.status !== 'checkout') || null;

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
      <aside className="fv-right" aria-label="Outils et informations de la journée">
        {window.WorkspaceTools && <window.WorkspaceTools />}
        <section className="fv-rail-section">
          <h3>{day?.dateISO ? 'Nuit du ' + formatDate(day.dateISO) : 'Hébergement'}</h3>
          {tonightStay ? (
            <div className="fv-stay">
              <strong>{lodgingName(tonightStay.step)}</strong>
              <p>{[formatDate(tonightStay.startISO), formatDate(tonightStay.endISO)]
                .filter(Boolean).join(' — ')} · {tonightStay.nights || 1} nuit{tonightStay.nights > 1 ? 's' : ''}</p>
              {tonightStay.nights > 1 && (
                <span className="fv-night">
                  Nuit {Math.min(tonightStay.nightNumber || 1, tonightStay.nights)} sur {tonightStay.nights}
                </span>
              )}
            </div>
          ) : <p className="fv-muted">Aucun hébergement pour cette nuit.</p>}
          {stays.length > 0 && (
            <details className="fv-rail-details" key={'stays-' + day?.id}>
              <summary>{stays.length > 1 ? 'Détails des séjours' : 'Détails du séjour'}</summary>
              <div className="fv-reservations">
                {stays.map((stay, index) => (
                  <LodgingCard key={String(stay.step?.id || index) + '-' + stay.status}
                    stay={stay} day={day} trip={trip} onEditStep={onEditStep} />
                ))}
              </div>
            </details>
          )}
          <button type="button" className="fv-textbutton" onClick={addLodging}>
            + Ajouter un hébergement
          </button>
        </section>
        <section className="fv-rail-section">
          <h3>À table</h3>
          {restaurants.length ? (
            <>
              <div className="fv-meal">
                <strong>{stepDisplayName(restaurants[0], 'Restaurant')}</strong>
                <small>{stepRangeLabel(restaurants[0]) || 'Horaire à préciser'}
                  {restaurants.length > 1 ? ' · ' + restaurants.length + ' adresses' : ''}
                </small>
              </div>
              <details className="fv-rail-details" key={'meals-' + day?.id}>
                <summary>Détails des repas</summary>
                <div className="fv-reservations">
                  {restaurants.map((step, index) => (
                    <RestaurantCard key={step.id || index} step={step} day={day}
                      trip={trip} onEditStep={onEditStep} onReload={onReload} />
                  ))}
                </div>
              </details>
            </>
          ) : <p className="fv-muted">Repas libres — aucune adresse ajoutée.</p>}
          <button type="button" className="fv-textbutton" onClick={addRestaurant}>
            + Ajouter un restaurant
          </button>
        </section>
        <section className="fv-rail-section">
          <h3>Météo</h3>
          <WeatherBlock day={day} />
        </section>
      </aside>
    );
  }

  window.MealRail = MealRail;
  window.ItineraryMealRail = MealRail;
})();
