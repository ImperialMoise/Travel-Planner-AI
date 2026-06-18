// ════════════════════════════════════════════════════════════
// DayScoreWidget.js — Widget “Score & trajets”
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Analyser la cohérence d’une journée.
// - Détecter les coordonnées manquantes.
// - Détecter les marges horaires trop courtes.
// - Détecter les distances potentiellement longues.
// - Donner des conseils simples.
// - Fonctionne sans API externe.
//
// Dépendances globales :
// - React
// - Icon
// - window.ItineraryUtils
//
// API :
//   <window.DayScoreWidget
//     day={day}
//     editMode={editMode}
//     onRemove={onRemove}
//   />
//
// ════════════════════════════════════════════════════════════

(function initDayScoreWidget() {
  const U = window.ItineraryUtils || {};

  function safeString(value) {
    if (U.safeString) return U.safeString(value);
    return String(value == null ? '' : value).trim();
  }

  function parseTimeToMinutes(value) {
    if (U.parseTimeToMinutes) return U.parseTimeToMinutes(value);

    const text = safeString(value);
    const match = text.match(/^(\d{1,2}):(\d{2})$/);

    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

    return hours * 60 + minutes;
  }

  function distanceMetersBetweenSteps(a, b) {
    if (U.distanceMetersBetweenSteps) {
      return U.distanceMetersBetweenSteps(a, b);
    }

    if (!a || !b) return null;

    const lat1 = Number(a.lat);
    const lng1 = Number(a.lng);
    const lat2 = Number(b.lat);
    const lng2 = Number(b.lng);

    if (
      !Number.isFinite(lat1) ||
      !Number.isFinite(lng1) ||
      !Number.isFinite(lat2) ||
      !Number.isFinite(lng2)
    ) {
      return null;
    }

    const R = 6371000;
    const toRad = Math.PI / 180;

    const dLat = (lat2 - lat1) * toRad;
    const dLng = (lng2 - lng1) * toRad;
    const rLat1 = lat1 * toRad;
    const rLat2 = lat2 * toRad;

    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rLat1) *
        Math.cos(rLat2) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
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

  function stepType(step) {
    if (U.stepType) return U.stepType(step);
    return safeString(step && step.type).toLowerCase();
  }

  function isTransportLike(step) {
    if (!step) return false;

    if (U.isTransportStep && U.isTransportStep(step)) return true;

    const type = stepType(step);
    const text = safeString(
      (step.transportType || '') + ' ' +
      (step.label || '') + ' ' +
      (step.lieu || '') + ' ' +
      (step.depart || '') + ' ' +
      (step.arrivee || '')
    ).toLowerCase();

    return (
      type === 'transport' ||
      text.includes('avion') ||
      text.includes('vol') ||
      text.includes('aéroport') ||
      text.includes('airport') ||
      text.includes('train') ||
      text.includes('gare') ||
      text.includes('bus') ||
      text.includes('ferry') ||
      text.includes('metro') ||
      text.includes('métro')
    );
  }

  function isLodgingLike(step) {
    if (U.isLodgingStep) return U.isLodgingStep(step);
    return stepType(step) === 'logement';
  }

  function isRestaurantLike(step) {
    if (U.isRestaurantStep) return U.isRestaurantStep(step);

    const type = stepType(step);
    return type === 'restaurant' || type === 'table';
  }

  function hasCoords(step) {
    if (U.hasStepCoords) return U.hasStepCoords(step);

    return (
      step &&
      Number.isFinite(Number(step.lat)) &&
      Number.isFinite(Number(step.lng))
    );
  }

  function shouldCompareDistance(a, b) {
    if (!a || !b) return false;

    if (isTransportLike(a) || isTransportLike(b)) return false;

    if (isLodgingLike(a) || isLodgingLike(b)) {
      const distance = distanceMetersBetweenSteps(a, b);
      return distance !== null && distance <= 25000;
    }

    return true;
  }

  function addUnique(list, text) {
    if (!text) return;
    if (!list.includes(text)) list.push(text);
  }

  function computeDayScore(day) {
    const steps = Array.isArray(day && day.steps) ? day.steps : [];

    let score = 100;
    const issues = [];
    const tips = [];

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
      addUnique(tips, 'Une seule étape : tu peux ajouter un repas, un transport ou une idée à proximité.');
    }

    if (steps.length > 8) {
      score -= 12;
      addUnique(issues, 'Journée assez dense : plus de 8 étapes prévues.');
      addUnique(tips, 'Prévois des marges ou regroupe certaines étapes par quartier.');
    }

    const usefulForCoords = steps.filter(function filterUseful(step) {
      return !isTransportLike(step);
    });

    const missingCoords = usefulForCoords.filter(function filterMissing(step) {
      return !hasCoords(step);
    });

    if (missingCoords.length) {
      score -= Math.min(18, missingCoords.length * 4);

      addUnique(
        issues,
        missingCoords.length +
          ' étape' +
          (missingCoords.length > 1 ? 's' : '') +
          ' sans coordonnées précises.'
      );

      addUnique(
        tips,
        'Ajoute une localisation précise aux visites, restaurants et logements pour améliorer la carte.'
      );
    }

    const timedSteps = steps
      .map(function mapTimed(step, index) {
        return {
          step,
          index,
          start: parseTimeToMinutes(step.time),
          end: parseTimeToMinutes(step.timeEnd)
        };
      })
      .filter(function keepTimed(item) {
        return item.start !== null;
      })
      .sort(function sortTimed(a, b) {
        return a.start - b.start;
      });

    for (let i = 0; i < timedSteps.length - 1; i += 1) {
      const current = timedSteps[i];
      const next = timedSteps[i + 1];

      if (isTransportLike(current.step) || isTransportLike(next.step)) {
        continue;
      }

      const currentEnd = current.end !== null
        ? current.end
        : current.start + 60;

      const gap = next.start - currentEnd;

      if (gap < 0) {
        score -= 14;

        addUnique(
          issues,
          'Chevauchement possible entre “' +
            stepDisplayName(current.step) +
            '” et “' +
            stepDisplayName(next.step) +
            '”.'
        );

        addUnique(
          tips,
          'Décale une des deux étapes ou ajoute une marge.'
        );
      } else if (gap < 20) {
        score -= 6;

        addUnique(
          issues,
          'Marge courte entre “' +
            stepDisplayName(current.step) +
            '” et “' +
            stepDisplayName(next.step) +
            '”.'
        );

        addUnique(
          tips,
          'Prévois au moins 20 à 30 min entre deux lieux différents.'
        );
      } else if (gap > 240) {
        score -= 3;

        addUnique(
          tips,
          'Grand trou dans la journée : tu peux ajouter une pause, une balade ou laisser ce temps libre volontairement.'
        );
      }
    }

    let longDistanceTipAdded = false;

    for (let i = 0; i < steps.length - 1; i += 1) {
      const current = steps[i];
      const next = steps[i + 1];

      if (!shouldCompareDistance(current, next)) continue;

      const distance = distanceMetersBetweenSteps(current, next);

      if (distance !== null && distance > 8000) {
        score -= 8;

        addUnique(
          issues,
          'Trajet probablement long entre “' +
            stepDisplayName(current) +
            '” et “' +
            stepDisplayName(next) +
            '”.'
        );

        if (!longDistanceTipAdded) {
          addUnique(
            tips,
            'Teste métro, bus, voiture ou vélo dans l’outil carte pour vérifier le meilleur mode.'
          );
          longDistanceTipAdded = true;
        }
      } else if (distance !== null && distance > 3000) {
        score -= 4;

        if (!longDistanceTipAdded) {
          addUnique(
            tips,
            'Un trajet de plus de 3 km peut être pénible à pied : compare avec vélo, bus ou transport.'
          );
          longDistanceTipAdded = true;
        }
      }
    }

    const hasRestaurant = steps.some(isRestaurantLike);
    const nonTransportCount = steps.filter(function filterNonTransport(step) {
      return !isTransportLike(step);
    }).length;

    if (!hasRestaurant && nonTransportCount >= 3) {
      score -= 5;
      addUnique(tips, 'Aucun repas prévu : pense à réserver une pause déjeuner ou dîner.');
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let label = 'Très cohérent';

    if (score < 50) label = 'À revoir';
    else if (score < 70) label = 'Correct, à ajuster';
    else if (score < 85) label = 'Bien équilibré';

    if (!issues.length) {
      issues.push('Aucun gros problème détecté avec les informations disponibles.');
    }

    if (!tips.length) {
      tips.push('La journée semble cohérente. Vérifie quand même les horaires réels, réservations et temps de transport.');
    }

    let summary = issues[0];

    if (summary === 'Aucun gros problème détecté avec les informations disponibles.') {
      summary = tips[0] || summary;
    }

    return {
      score,
      label,
      summary,
      issues: issues.slice(0, 4),
      tips: tips.slice(0, 4)
    };
  }

  function scoreColor(score) {
    if (score < 50) return '#c0563f';
    if (score < 70) return 'var(--tan)';
    return 'var(--accent)';
  }

  function cardStyle() {
    return {
      background: 'var(--card)',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(82,98,91,0.05)',
      border: '1px solid var(--outline-variant)',
      overflow: 'hidden'
    };
  }

  function headerStyle() {
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      padding: '12px 16px',
      borderBottom: '1px solid var(--outline-variant)',
      background: 'var(--soft)'
    };
  }

  function removeButtonStyle() {
    return {
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
    };
  }

  function ScoreCircle({ result }) {
    const color = scoreColor(result.score);

    return (
      <div
        style={{
          width: 62,
          height: 62,
          borderRadius: '50%',
          background: 'var(--bg)',
          border: '2px solid ' + color,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 23,
              lineHeight: 1,
              color
            }}
          >
            {result.score}
          </div>

          <div
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: 'var(--faint)'
            }}
          >
            /100
          </div>
        </div>
      </div>
    );
  }

  function DetailList({ title, items, type }) {
    const color = type === 'issue'
      ? '#c0563f'
      : 'var(--tan)';

    return (
      <div>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 900,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: 'var(--faint)',
            marginBottom: 7
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          {items.map(function renderItem(item, index) {
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: 8,
                  fontSize: 12.5,
                  lineHeight: '18px',
                  color: type === 'issue' ? 'var(--text)' : 'var(--muted)'
                }}
              >
                {type === 'issue' ? (
                  <span style={{ color, fontWeight: 900 }}>•</span>
                ) : (
                  <Icon
                    name="sparkle"
                    size={12}
                    style={{
                      color,
                      flexShrink: 0,
                      marginTop: 2
                    }}
                  />
                )}

                <span>{item}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function DayScoreWidget({ day, editMode, onRemove }) {
    const [expanded, setExpanded] = React.useState(false);

    React.useEffect(function resetExpanded() {
      setExpanded(false);
    }, [day && day.id]);

    const result = computeDayScore(day);
    const color = scoreColor(result.score);

    return (
      <div style={cardStyle()}>
        <div style={headerStyle()}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
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
              type="button"
              onClick={onRemove}
              style={removeButtonStyle()}
            >
              {'\u00d7'}
            </button>
          )}
        </div>

        <div
          style={{
            padding: 16,
            background: 'var(--card)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}
          >
            <ScoreCircle result={result} />

            <div
              style={{
                minWidth: 0,
                flex: 1
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 900,
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
                {result.summary}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(value => !value)}
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
              fontWeight: 800,
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
              <DetailList
                title="Points à vérifier"
                items={result.issues}
                type="issue"
              />

              <DetailList
                title="Pistes pratiques"
                items={result.tips}
                type="tip"
              />

              <div
                style={{
                  borderRadius: 10,
                  background: 'var(--inset)',
                  padding: '9px 10px',
                  fontSize: 11.5,
                  color: 'var(--muted)',
                  lineHeight: '16px',
                  borderLeft: '3px solid ' + color
                }}
              >
                Ce score est indicatif : il dépend des horaires, coordonnées et types d’étapes déjà renseignés.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  window.DayScoreWidget = DayScoreWidget;
  window.computeDayScore = computeDayScore;
})();
