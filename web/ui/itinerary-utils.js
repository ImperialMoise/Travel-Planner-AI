// ════════════════════════════════════════════════════════════
// itinerary-utils.js — utilitaires partagés de l’itinéraire
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Centraliser les helpers utilisés par l’itinéraire, la carte,
//   la toolbox et les futurs composants extraits.
// - Éviter les doublons entre AppShell.js, itin-atelier-v2.jsx,
//   AroundStepWidget.js et Map.js.
// - Garder une API globale simple : window.ItineraryUtils.
//
// Dépendances : aucune.
// ════════════════════════════════════════════════════════════

(function initItineraryUtils() {
  const MS_PER_DAY = 86400000;

  const STEP_TYPES = {
    TRANSPORT: 'transport',
    LODGING: 'logement',
    RESTAURANT: 'restaurant',
    TABLE: 'table',
    ACTIVITY: 'activite',
    OTHER: 'autre'
  };

  const STEP_TYPE_LABELS = {
    transport: 'Transport',
    logement: 'Hébergement',
    restaurant: 'Restaurant',
    table: 'Restaurant',
    activite: 'Activité',
    autre: 'Étape'
  };

  const STEP_TYPE_ICONS = {
    transport: 'route',
    logement: 'bed',
    restaurant: 'fork',
    table: 'fork',
    activite: 'camera',
    autre: 'pin'
  };

  function safeString(value) {
    return String(value == null ? '' : value).trim();
  }

  function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function clamp(value, min, max) {
    const n = Number(value);

    if (!Number.isFinite(n)) return min;

    return Math.min(max, Math.max(min, n));
  }

  function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  // ════════════════════════════════════════════════════════════
  // Dates
  // ════════════════════════════════════════════════════════════

  function parseLocalDate(iso) {
    if (!iso) return null;

    const date = new Date(String(iso) + 'T12:00:00');

    if (Number.isNaN(date.getTime())) return null;

    return date;
  }

  function toISODate(date) {
    if (!date || Number.isNaN(date.getTime())) return '';

    return date.toISOString().slice(0, 10);
  }

  function addDaysISO(baseISO, diff) {
    const date = parseLocalDate(baseISO);

    if (!date) return '';

    date.setDate(date.getDate() + Number(diff || 0));

    return toISODate(date);
  }

  function diffDays(startISO, endISO) {
    const start = parseLocalDate(startISO);
    const end = parseLocalDate(endISO);

    if (!start || !end) return 0;

    return Math.round((end - start) / MS_PER_DAY);
  }

  function diffDaysInclusive(startISO, endISO) {
    if (!startISO || !endISO) return 1;

    return Math.max(1, diffDays(startISO, endISO) + 1);
  }

  function formatDate(iso, options) {
    const date = parseLocalDate(iso);

    if (!date) return '';

    return date.toLocaleDateString('fr-FR', options || {
      day: 'numeric',
      month: 'short'
    });
  }

  function formatDayDate(iso) {
    return formatDate(iso, {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  function formatLongDate(iso) {
    return formatDate(iso, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function isISODate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
  }

  // ════════════════════════════════════════════════════════════
  // Horaires
  // ════════════════════════════════════════════════════════════

  function parseTimeToMinutes(value) {
    const text = safeString(value);
    const match = text.match(/^(\d{1,2}):(\d{2})$/);

    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes) ||
      hours < 0 ||
      hours > 29 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    return hours * 60 + minutes;
  }

  function formatDurationMinutes(minutes) {
    const total = Math.round(Number(minutes) || 0);

    if (total <= 0) return '';

    if (total < 60) {
      return total + ' min';
    }

    const hours = Math.floor(total / 60);
    const rest = total % 60;

    return hours + 'h' + String(rest).padStart(2, '0');
  }

  function calcDuration(startTime, endTime, nextDay) {
    const start = parseTimeToMinutes(startTime);
    const end = parseTimeToMinutes(endTime);

    if (start === null || end === null) return '';

    let minutes = end - start;

    if (nextDay || minutes < 0) {
      minutes += 1440;
    }

    return formatDurationMinutes(minutes);
  }

  function sortStepsByTime(steps) {
    return (Array.isArray(steps) ? steps : []).slice().sort(function compare(a, b) {
      const aMinutes = parseTimeToMinutes(a && a.time);
      const bMinutes = parseTimeToMinutes(b && b.time);

      if (aMinutes === null && bMinutes === null) return 0;
      if (aMinutes === null) return 1;
      if (bMinutes === null) return -1;

      return aMinutes - bMinutes;
    });
  }

  // ════════════════════════════════════════════════════════════
  // Étapes
  // ════════════════════════════════════════════════════════════

  function stepType(step) {
    return safeString(step && step.type).toLowerCase() || STEP_TYPES.OTHER;
  }

  function isTransportStep(step) {
    return stepType(step) === STEP_TYPES.TRANSPORT;
  }

  function isLodgingStep(step) {
    return stepType(step) === STEP_TYPES.LODGING;
  }

  function isRestaurantStep(step) {
    const type = stepType(step);
    return type === STEP_TYPES.RESTAURANT || type === STEP_TYPES.TABLE;
  }

  function isActivityStep(step) {
    return stepType(step) === STEP_TYPES.ACTIVITY;
  }

  function isVisibleTimelineStep(step) {
    return !isRestaurantStep(step) && !isLodgingStep(step);
  }

  function stepDisplayName(step, fallback) {
    if (!step) return fallback || 'Étape';

    return safeString(
      step.label ||
      step.lieu ||
      step.place ||
      step.arrivee ||
      step.depart ||
      step.name ||
      fallback ||
      'Étape'
    );
  }

  function stepPlace(step) {
    if (!step) return '';

    return safeString(
      step.lieu ||
      step.place ||
      step.address ||
      step.context ||
      ''
    );
  }

  function stepSubtitle(step) {
    if (!step) return '';

    if (isTransportStep(step)) {
      return [step.depart, step.arrivee]
        .map(safeString)
        .filter(Boolean)
        .join(' → ');
    }

    return stepPlace(step) || safeString(step.note);
  }

  function stepTypeLabel(step) {
    return STEP_TYPE_LABELS[stepType(step)] || STEP_TYPE_LABELS.autre;
  }

  function stepTypeIcon(step) {
    return STEP_TYPE_ICONS[stepType(step)] || STEP_TYPE_ICONS.autre;
  }

  function stepCoords(step) {
    if (!step) return null;

    const lat = safeNumber(step.lat);
    const lng = safeNumber(step.lng);

    if (lat === null || lng === null) return null;

    return {
      lat,
      lng
    };
  }

  function hasStepCoords(step) {
    return !!stepCoords(step);
  }

  function stepImportant(step) {
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

  function normalizeStepLink(value) {
    const raw = safeString(value);

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

  function stepDocumentUrl(step) {
    return normalizeStepLink(step && step.link);
  }

  function stepRangeLabel(step) {
    if (!step) return '';

    const start = safeString(step.time);
    const end = safeString(step.timeEnd);

    if (start && end) return start + '–' + end;
    if (start) return start;

    if (isLodgingStep(step)) {
      const checkin = safeString(step.timeCheckIn || step.checkin);
      const checkout = safeString(step.timeCheckOut || step.checkout);

      if (checkin && checkout) return 'arr. ' + checkin + ' · dép. ' + checkout;
      if (checkin) return 'arr. ' + checkin;
      if (checkout) return 'dép. ' + checkout;
    }

    return '';
  }

  function cleanDayTitleName(value) {
    return safeString(value)
      .replace(/^visite\s+(de|du|des|d’|d')\s+/i, '')
      .replace(/^découverte\s+(de|du|des|d’|d')\s+/i, '')
      .replace(/^balade\s+(le long de|le long du|dans|à|au|aux|de|du|des|d’|d')\s+/i, '')
      .replace(/^promenade\s+(dans|à|au|aux|de|du|des|d’|d')\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function dayMainStep(day) {
    const steps = Array.isArray(day && day.steps) ? day.steps : [];

    if (!steps.length) return null;

    const important = steps.find(stepImportant);
    if (important) return important;

    const activity = steps.find(isActivityStep);
    if (activity) return activity;

    const transport = steps.find(isTransportStep);
    if (transport) return transport;

    const lodging = steps.find(isLodgingStep);
    if (lodging) return lodging;

    const other = steps.find(function findOther(step) {
      return !isRestaurantStep(step);
    });

    return other || steps[0];
  }

  function getAutoDayTitle(day) {
    const mainStep = dayMainStep(day);
    const name = cleanDayTitleName(stepDisplayName(mainStep, ''));

    return name || 'Journée libre';
  }

  function getDisplayDayTitle(day) {
    const manual = safeString(day && day.title);

    if (manual && manual.toLowerCase() !== 'journée libre') {
      return manual;
    }

    return getAutoDayTitle(day);
  }

  function countStepTypes(day) {
    const steps = Array.isArray(day && day.steps) ? day.steps : [];

    return {
      total: steps.length,
      visible: steps.filter(function countVisible(step) {
        return !isLodgingStep(step);
      }).length,
      timeline: steps.filter(isVisibleTimelineStep).length,
      restaurants: steps.filter(isRestaurantStep).length,
      transports: steps.filter(isTransportStep).length,
      lodgings: steps.filter(isLodgingStep).length,
      activities: steps.filter(isActivityStep).length
    };
  }

  // ════════════════════════════════════════════════════════════
  // Distances / coordonnées
  // ════════════════════════════════════════════════════════════

  function distanceMetersBetweenCoords(a, b) {
    if (!a || !b) return null;

    const lat1 = safeNumber(a.lat);
    const lng1 = safeNumber(a.lng);
    const lat2 = safeNumber(b.lat);
    const lng2 = safeNumber(b.lng);

    if (
      lat1 === null ||
      lng1 === null ||
      lat2 === null ||
      lng2 === null
    ) {
      return null;
    }

    const earthRadius = 6371000;
    const toRad = Math.PI / 180;

    const phi1 = lat1 * toRad;
    const phi2 = lat2 * toRad;
    const deltaPhi = (lat2 - lat1) * toRad;
    const deltaLambda = (lng2 - lng1) * toRad;

    const x =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);

    return Math.round(
      earthRadius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
    );
  }

  function distanceMetersBetweenSteps(a, b) {
    return distanceMetersBetweenCoords(stepCoords(a), stepCoords(b));
  }

  function formatDistance(meters) {
    if (meters === null || meters === undefined) return '';

    const n = Number(meters);

    if (!Number.isFinite(n)) return '';

    if (n < 1000) {
      return Math.round(n) + ' m';
    }

    return (n / 1000).toLocaleString('fr-FR', {
      maximumFractionDigits: 1
    }) + ' km';
  }

  function samePlace(a, b, toleranceMeters) {
    if (!a || !b) return false;

    const aName = stepDisplayName(a, '').toLowerCase();
    const bName = stepDisplayName(b, '').toLowerCase();

    const aPlace = stepPlace(a).toLowerCase();
    const bPlace = stepPlace(b).toLowerCase();

    if (aName && bName && aName === bName) return true;
    if (aPlace && bPlace && aPlace === bPlace) return true;

    const distance = distanceMetersBetweenSteps(a, b);

    if (distance === null) return false;

    return distance <= (toleranceMeters || 5);
  }

  function firstCoordsInDay(day) {
    const steps = Array.isArray(day && day.steps) ? day.steps : [];

    for (let i = 0; i < steps.length; i += 1) {
      const coords = stepCoords(steps[i]);

      if (coords) return coords;
    }

    return null;
  }

  // ════════════════════════════════════════════════════════════
  // Hébergements multi-nuits
  // ════════════════════════════════════════════════════════════

  function lodgingNightCount(step) {
    return Math.max(
      1,
      Number(step && (step.nights || step.nuits || 1)) || 1
    );
  }

  function lodgingName(step) {
    return stepDisplayName(step, 'Hébergement');
  }

  function lodgingDateStart(step, fallbackISO) {
    return safeString(step && step.dateStart) || safeString(fallbackISO);
  }

  function lodgingDateEnd(step, fallbackStartISO) {
    const explicitEnd = safeString(step && step.dateEnd);

    if (explicitEnd) return explicitEnd;

    const start = lodgingDateStart(step, fallbackStartISO);
    const nights = lodgingNightCount(step);

    return start ? addDaysISO(start, nights) : '';
  }

  function lodgingDiffNights(startISO, endISO) {
    if (!startISO || !endISO) return 1;

    return Math.max(1, diffDays(startISO, endISO));
  }

  function findActiveLodgingStay(days, selectedDayIndex) {
    const safeDays = Array.isArray(days) ? days : [];
    const sel = Number(selectedDayIndex) || 0;

    if (!safeDays.length || !safeDays[sel]) return null;

    for (let dayIndex = 0; dayIndex < safeDays.length; dayIndex += 1) {
      const sourceDay = safeDays[dayIndex];
      const lodgings = (sourceDay.steps || []).filter(isLodgingStep);

      for (let lodgingIndex = 0; lodgingIndex < lodgings.length; lodgingIndex += 1) {
        const step = lodgings[lodgingIndex];
        const nights = lodgingNightCount(step);

        const startISO = lodgingDateStart(step, sourceDay.dateISO);
        const endISO = lodgingDateEnd(step, startISO);

        let startIndex = dayIndex;
        let endIndex = dayIndex + nights;

        if (startISO) {
          const foundStart = safeDays.findIndex(function findStart(day) {
            return day.dateISO === startISO;
          });

          if (foundStart >= 0) startIndex = foundStart;
        }

        if (endISO) {
          const foundEnd = safeDays.findIndex(function findEnd(day) {
            return day.dateISO === endISO;
          });

          if (foundEnd >= 0) {
            endIndex = foundEnd;
          } else {
            endIndex = startIndex + nights;
          }
        }

        if (sel >= startIndex && sel <= endIndex) {
          let status = 'stay';

          if (sel === startIndex) status = 'checkin';
          else if (sel === endIndex) status = 'checkout';

          return {
            step,
            sourceDay,
            sourceDayIndex: dayIndex,
            startIndex,
            endIndex,
            startISO,
            endISO,
            nights,
            status,
            nightNumber: Math.max(1, sel - startIndex)
          };
        }
      }
    }

    return null;
  }

  function getLodgingTimelineReminders(days, selectedDayIndex) {
    const safeDays = Array.isArray(days) ? days : [];
    const sel = Number(selectedDayIndex) || 0;
    const reminders = [];

    for (let dayIndex = 0; dayIndex < safeDays.length; dayIndex += 1) {
      const sourceDay = safeDays[dayIndex];
      const lodgings = (sourceDay.steps || []).filter(isLodgingStep);

      lodgings.forEach(function addReminder(step, lodgingIndex) {
        const nights = lodgingNightCount(step);
        const startISO = lodgingDateStart(step, sourceDay.dateISO);
        const endISO = lodgingDateEnd(step, startISO);

        let startIndex = dayIndex;
        let endIndex = dayIndex + nights;

        if (startISO) {
          const foundStart = safeDays.findIndex(function findStart(day) {
            return day.dateISO === startISO;
          });

          if (foundStart >= 0) startIndex = foundStart;
        }

        if (endISO) {
          const foundEnd = safeDays.findIndex(function findEnd(day) {
            return day.dateISO === endISO;
          });

          if (foundEnd >= 0) endIndex = foundEnd;
        }

        if (sel === startIndex) {
          reminders.push({
            key: 'checkin_' + (step.id || lodgingIndex),
            kind: 'checkin',
            label: 'Check-in',
            time: step.timeCheckIn || step.checkin || '15:00',
            step,
            sourceDay,
            sourceDayIndex: dayIndex,
            startISO,
            endISO,
            nights
          });
        }

        if (sel === endIndex) {
          reminders.push({
            key: 'checkout_' + (step.id || lodgingIndex),
            kind: 'checkout',
            label: 'Check-out',
            time: step.timeCheckOut || step.checkout || '11:00',
            step,
            sourceDay,
            sourceDayIndex: dayIndex,
            startISO,
            endISO,
            nights
          });
        }
      });
    }

    return reminders.sort(function sortByTime(a, b) {
      return safeString(a.time).localeCompare(safeString(b.time));
    });
  }

  // ════════════════════════════════════════════════════════════
  // Export global
  // ════════════════════════════════════════════════════════════

  window.ItineraryUtils = {
    STEP_TYPES,
    STEP_TYPE_LABELS,
    STEP_TYPE_ICONS,

    safeString,
    safeNumber,
    clamp,
    isPlainObject,

    parseLocalDate,
    toISODate,
    addDaysISO,
    diffDays,
    diffDaysInclusive,
    formatDate,
    formatDayDate,
    formatLongDate,
    isISODate,

    parseTimeToMinutes,
    formatDurationMinutes,
    calcDuration,
    sortStepsByTime,

    stepType,
    isTransportStep,
    isLodgingStep,
    isRestaurantStep,
    isActivityStep,
    isVisibleTimelineStep,
    stepDisplayName,
    stepPlace,
    stepSubtitle,
    stepTypeLabel,
    stepTypeIcon,
    stepCoords,
    hasStepCoords,
    stepImportant,
    normalizeStepLink,
    stepDocumentUrl,
    stepRangeLabel,

    cleanDayTitleName,
    dayMainStep,
    getAutoDayTitle,
    getDisplayDayTitle,
    countStepTypes,

    distanceMetersBetweenCoords,
    distanceMetersBetweenSteps,
    formatDistance,
    samePlace,
    firstCoordsInDay,

    lodgingNightCount,
    lodgingName,
    lodgingDateStart,
    lodgingDateEnd,
    lodgingDiffNights,
    findActiveLodgingStay,
    getLodgingTimelineReminders
  };
})();
