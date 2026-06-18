// ════════════════════════════════════════════════════════════
// CalendarWidget.js — Widget “Calendrier”
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Afficher un calendrier mensuel.
// - Montrer la période du voyage.
// - Ajouter des repères ponctuels.
// - Ajouter des plages de dates.
// - Sauvegarder localement les repères par voyage.
// - Garder une légende personnalisable.
//
// Dépendances globales :
// - React
// - Store
// - Icon
// - window.ItineraryUtils
//
// API :
//   <window.CalendarWidget
//     trip={trip}
//     editMode={editMode}
//     onRemove={onRemove}
//   />
//
// ════════════════════════════════════════════════════════════

(function initCalendarWidget() {
  const U = window.ItineraryUtils || {};

  const DEFAULT_LEGEND = {
    tan: 'Voyage',
    green: 'Réservé',
    blue: 'À vérifier',
    red: 'Important'
  };

  const COLORS = {
    tan: {
      label: 'Doré',
      value: 'var(--tan)',
      soft: 'rgba(217,182,126,.22)'
    },
    green: {
      label: 'Vert',
      value: '#6f9d7b',
      soft: 'rgba(111,157,123,.18)'
    },
    blue: {
      label: 'Bleu',
      value: '#5e87a5',
      soft: 'rgba(94,135,165,.18)'
    },
    red: {
      label: 'Rouge',
      value: '#c0563f',
      soft: 'rgba(192,86,63,.16)'
    }
  };

  function safeString(value) {
    if (U.safeString) return U.safeString(value);
    return String(value == null ? '' : value).trim();
  }

  function parseLocalDate(iso) {
    if (U.parseLocalDate) return U.parseLocalDate(iso);

    if (!iso) return null;

    const date = new Date(String(iso) + 'T12:00:00');

    if (Number.isNaN(date.getTime())) return null;

    return date;
  }

  function toISODate(date) {
    if (U.toISODate) return U.toISODate(date);

    if (!date || Number.isNaN(date.getTime())) return '';

    return date.toISOString().slice(0, 10);
  }

  function addDaysISO(baseISO, diff) {
    if (U.addDaysISO) return U.addDaysISO(baseISO, diff);

    const date = parseLocalDate(baseISO);

    if (!date) return '';

    date.setDate(date.getDate() + Number(diff || 0));

    return toISODate(date);
  }

  function formatDate(iso) {
    if (U.formatDayDate) return U.formatDayDate(iso);

    const date = parseLocalDate(iso);

    if (!date) return '';

    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  function monthKeyFromISO(iso) {
    const date = parseLocalDate(iso) || new Date();

    return (
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0')
    );
  }

  function monthLabel(monthKey) {
    const date = parseLocalDate(monthKey + '-01') || new Date();

    return date.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
  }

  function safeId() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }

    return 'cal_' + Date.now() + '_' + Math.random().toString(16).slice(2);
  }

  function readJsonStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;

      return parsed || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJsonStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // localStorage peut être bloqué : on ignore pour ne pas casser le widget.
    }
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

  function smallButtonStyle(active) {
    return {
      border: '1px solid ' + (active ? 'var(--accent)' : 'var(--outline-variant)'),
      background: active ? 'var(--accent)' : 'var(--inset)',
      color: active ? 'var(--accent-ink)' : 'var(--text)',
      borderRadius: 999,
      padding: '7px 10px',
      fontFamily: 'inherit',
      fontSize: 11.5,
      fontWeight: 800,
      cursor: 'pointer'
    };
  }

  function inputStyle() {
    return {
      width: '100%',
      border: '1px solid var(--outline-variant)',
      background: 'var(--inset)',
      color: 'var(--text)',
      borderRadius: 9,
      padding: '8px 9px',
      fontFamily: 'inherit',
      fontSize: 12.5,
      outline: 'none'
    };
  }

  function fieldLabelStyle() {
    return {
      fontSize: 10.5,
      fontWeight: 900,
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      color: 'var(--faint)',
      marginBottom: 5
    };
  }

  function Field({ label, children }) {
    return (
      <div>
        <div style={fieldLabelStyle()}>{label}</div>
        {children}
      </div>
    );
  }

  function CalendarWidget({ trip, editMode, onRemove }) {
    const { selectedDayIndex = 0 } = Store.useStore(function select(state) {
      return {
        selectedDayIndex: state.selectedDayIndex || 0
      };
    });

    const tripId = trip && trip.id ? trip.id : 'global';
    const tripDays = Array.isArray(trip && trip.days) ? trip.days : [];
    const selectedDay = tripDays[selectedDayIndex] || null;

    const tripStart = safeString(trip && trip.startDate);
    const tripEnd = safeString(trip && trip.endDate);
    const selectedISO = safeString(selectedDay && selectedDay.dateISO);

    const marksStorageKey = 'atelier_calendar_marks_' + tripId;
    const legendStorageKey = 'atelier_calendar_legend_' + tripId;

    const initialMonth = monthKeyFromISO(
      selectedISO ||
      tripStart ||
      toISODate(new Date())
    );

    const [linkedMode, setLinkedMode] = React.useState(true);
    const [monthKey, setMonthKey] = React.useState(initialMonth);

    const [marks, setMarks] = React.useState(function initMarks() {
      return readJsonStorage(marksStorageKey, {
        points: [],
        ranges: []
      });
    });

    const [legend, setLegend] = React.useState(function initLegend() {
      return readJsonStorage(legendStorageKey, DEFAULT_LEGEND);
    });

    const [kind, setKind] = React.useState('point');
    const [label, setLabel] = React.useState('');
    const [date, setDate] = React.useState(selectedISO || tripStart || toISODate(new Date()));
    const [start, setStart] = React.useState(selectedISO || tripStart || toISODate(new Date()));
    const [end, setEnd] = React.useState(selectedISO || tripStart || toISODate(new Date()));
    const [color, setColor] = React.useState('tan');
    const [legendOpen, setLegendOpen] = React.useState(false);

    React.useEffect(function reloadStorageWhenTripChanges() {
      setMarks(readJsonStorage(marksStorageKey, {
        points: [],
        ranges: []
      }));

      setLegend(readJsonStorage(legendStorageKey, DEFAULT_LEGEND));
    }, [marksStorageKey, legendStorageKey]);

    React.useEffect(function saveMarks() {
      writeJsonStorage(marksStorageKey, marks);
    }, [marksStorageKey, marks]);

    React.useEffect(function saveLegend() {
      writeJsonStorage(legendStorageKey, legend);
    }, [legendStorageKey, legend]);

    React.useEffect(function followSelectedDay() {
      if (selectedISO) {
        setMonthKey(monthKeyFromISO(selectedISO));
        setDate(selectedISO);
        setStart(selectedISO);
        setEnd(selectedISO);
      }
    }, [selectedISO]);

    function previousMonth() {
      const date = parseLocalDate(monthKey + '-01');

      if (!date) return;

      date.setMonth(date.getMonth() - 1);
      setMonthKey(monthKeyFromISO(toISODate(date)));
    }

    function nextMonth() {
      const date = parseLocalDate(monthKey + '-01');

      if (!date) return;

      date.setMonth(date.getMonth() + 1);
      setMonthKey(monthKeyFromISO(toISODate(date)));
    }

    function goToTripMonth() {
      if (tripStart) {
        setMonthKey(monthKeyFromISO(tripStart));
      }
    }

    function isInCurrentMonth(iso) {
      return iso && iso.slice(0, 7) === monthKey;
    }

    function isToday(iso) {
      return iso === toISODate(new Date());
    }

    function isTripDate(iso) {
      if (!linkedMode || !tripStart || !tripEnd || !iso) return false;

      return iso >= tripStart && iso <= tripEnd;
    }

    function isSelectedDate(iso) {
      return selectedISO && iso === selectedISO;
    }

    function pointsForDay(iso) {
      return (marks.points || []).filter(function filterPoint(point) {
        return point.date === iso;
      });
    }

    function rangesForDay(iso) {
      return (marks.ranges || []).filter(function filterRange(range) {
        if (!range.start || !range.end || !iso) return false;

        return iso >= range.start && iso <= range.end;
      });
    }

    function savePoint() {
      if (!date) return;

      setMarks(function update(prev) {
        return {
          ...prev,
          points: [
            ...(prev.points || []),
            {
              id: safeId(),
              date,
              color,
              label: label.trim()
            }
          ]
        };
      });

      setLabel('');
    }

    function saveRange() {
      if (!start || !end) return;

      const a = start <= end ? start : end;
      const b = start <= end ? end : start;

      setMarks(function update(prev) {
        return {
          ...prev,
          ranges: [
            ...(prev.ranges || []),
            {
              id: safeId(),
              start: a,
              end: b,
              color,
              label: label.trim()
            }
          ]
        };
      });

      setLabel('');
    }

    function saveMark() {
      if (kind === 'range') {
        saveRange();
      } else {
        savePoint();
      }
    }

    function deleteMark(type, id) {
      setMarks(function update(prev) {
        if (type === 'point') {
          return {
            ...prev,
            points: (prev.points || []).filter(function keepPoint(point) {
              return point.id !== id;
            })
          };
        }

        return {
          ...prev,
          ranges: (prev.ranges || []).filter(function keepRange(range) {
            return range.id !== id;
          })
        };
      });
    }

    function updateLegend(key, value) {
      setLegend(function update(prev) {
        return {
          ...prev,
          [key]: value
        };
      });
    }

    function dayNumber(iso) {
      const date = parseLocalDate(iso);

      return date ? date.getDate() : '';
    }

    function selectCalendarDay(iso) {
      if (!tripDays.length) {
        setDate(iso);
        setStart(iso);
        setEnd(iso);
        return;
      }

      const dayIndex = tripDays.findIndex(function findDay(day) {
        return day.dateISO === iso;
      });

      if (dayIndex >= 0) {
        Store.set({
          selectedDayIndex: dayIndex
        });
      }

      setDate(iso);
      setStart(iso);
      setEnd(iso);
    }

    const monthStart = parseLocalDate(monthKey + '-01') || new Date();
    const gridStart = new Date(monthStart);
    const mondayOffset = (gridStart.getDay() + 6) % 7;

    gridStart.setDate(gridStart.getDate() - mondayOffset);

    const cells = [];

    for (let i = 0; i < 42; i += 1) {
      cells.push(addDaysISO(toISODate(gridStart), i));
    }

    const weekLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    const allMarks = [
      ...(marks.points || []).map(function mapPoint(point) {
        return {
          ...point,
          type: 'point',
          sortDate: point.date
        };
      }),
      ...(marks.ranges || []).map(function mapRange(range) {
        return {
          ...range,
          type: 'range',
          sortDate: range.start
        };
      })
    ].sort(function sortMarks(a, b) {
      return safeString(a.sortDate).localeCompare(safeString(b.sortDate));
    });

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
            <Icon name="cal" size={16} style={{ color: 'var(--tan)' }} />
            Calendrier
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

        <div style={{ padding: 14 }}>
          <div
            style={{
              display: 'flex',
              gap: 6,
              background: 'var(--inset)',
              borderRadius: 999,
              padding: 4,
              marginBottom: 12
            }}
          >
            <button
              type="button"
              onClick={() => setLinkedMode(true)}
              style={{
                ...smallButtonStyle(linkedMode),
                flex: 1
              }}
            >
              Voyage
            </button>

            <button
              type="button"
              onClick={() => setLinkedMode(false)}
              style={{
                ...smallButtonStyle(!linkedMode),
                flex: 1
              }}
            >
              Libre
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 10
            }}
          >
            <button
              type="button"
              onClick={previousMonth}
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                border: '1px solid var(--outline-variant)',
                background: 'var(--inset)',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: 18
              }}
            >
              ‹
            </button>

            <button
              type="button"
              onClick={goToTripMonth}
              title="Revenir au mois du voyage"
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text)',
                cursor: tripStart ? 'pointer' : 'default',
                fontFamily: 'var(--font-serif)',
                fontSize: 18,
                fontStyle: 'italic',
                textTransform: 'capitalize'
              }}
            >
              {monthLabel(monthKey)}
            </button>

            <button
              type="button"
              onClick={nextMonth}
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                border: '1px solid var(--outline-variant)',
                background: 'var(--inset)',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: 18
              }}
            >
              ›
            </button>
          </div>

          {linkedMode && tripStart && tripEnd && (
            <div
              style={{
                marginBottom: 10,
                padding: '8px 10px',
                borderRadius: 10,
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                fontSize: 11.5,
                fontWeight: 800,
                lineHeight: '16px'
              }}
            >
              Voyage : {formatDate(tripStart)} → {formatDate(tripEnd)}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7,1fr)',
              gap: 4,
              marginBottom: 5
            }}
          >
            {weekLabels.map(function renderWeekLabel(label) {
              return (
                <div
                  key={label}
                  style={{
                    textAlign: 'center',
                    fontSize: 10,
                    fontWeight: 900,
                    color: 'var(--faint)'
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7,1fr)',
              gap: 4
            }}
          >
            {cells.map(function renderCell(iso) {
              const currentMonth = isInCurrentMonth(iso);
              const inTrip = isTripDate(iso);
              const today = isToday(iso);
              const selected = isSelectedDate(iso);
              const pointMarks = pointsForDay(iso);
              const rangeMarks = rangesForDay(iso);
              const activeMarks = [...rangeMarks, ...pointMarks].slice(0, 3);

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => selectCalendarDay(iso)}
                  style={{
                    minHeight: 38,
                    borderRadius: 10,
                    border: selected
                      ? '1px solid var(--accent)'
                      : today
                        ? '1px solid var(--tan)'
                        : '1px solid transparent',
                    background: selected
                      ? 'var(--accent)'
                      : inTrip
                        ? 'var(--accent-soft)'
                        : currentMonth
                          ? 'var(--inset)'
                          : 'transparent',
                    color: selected
                      ? 'var(--accent-ink)'
                      : currentMonth
                        ? 'var(--text)'
                        : 'var(--faint)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    position: 'relative',
                    padding: 4,
                    opacity: currentMonth ? 1 : 0.45
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      lineHeight: '14px'
                    }}
                  >
                    {dayNumber(iso)}
                  </div>

                  {activeMarks.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 5,
                        right: 5,
                        bottom: 5,
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 2
                      }}
                    >
                      {activeMarks.map(function renderDot(mark, index) {
                        const dotColor = COLORS[mark.color] || COLORS.tan;

                        return (
                          <span
                            key={(mark.id || index) + '_' + index}
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: 999,
                              background: selected
                                ? 'currentColor'
                                : dotColor.value
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--outline-variant)'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                marginBottom: 10
              }}
            >
              <button
                type="button"
                onClick={() => setKind('point')}
                style={smallButtonStyle(kind === 'point')}
              >
                Point
              </button>

              <button
                type="button"
                onClick={() => setKind('range')}
                style={smallButtonStyle(kind === 'range')}
              >
                Période
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Field label="Libellé">
                <input
                  value={label}
                  onChange={event => setLabel(event.target.value)}
                  placeholder="Réservation, visa, train…"
                  style={inputStyle()}
                />
              </Field>

              {kind === 'point' ? (
                <Field label="Date">
                  <input
                    type="date"
                    value={date}
                    onChange={event => setDate(event.target.value)}
                    style={inputStyle()}
                  />
                </Field>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8
                  }}
                >
                  <Field label="Début">
                    <input
                      type="date"
                      value={start}
                      onChange={event => setStart(event.target.value)}
                      style={inputStyle()}
                    />
                  </Field>

                  <Field label="Fin">
                    <input
                      type="date"
                      value={end}
                      onChange={event => setEnd(event.target.value)}
                      style={inputStyle()}
                    />
                  </Field>
                </div>
              )}

              <Field label="Couleur">
                <select
                  value={color}
                  onChange={event => setColor(event.target.value)}
                  style={inputStyle()}
                >
                  {Object.keys(COLORS).map(function renderColor(key) {
                    return (
                      <option key={key} value={key}>
                        {COLORS[key].label} · {legend[key] || DEFAULT_LEGEND[key] || key}
                      </option>
                    );
                  })}
                </select>
              </Field>

              <button
                type="button"
                onClick={saveMark}
                style={{
                  width: '100%',
                  border: '1px solid var(--accent)',
                  background: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  borderRadius: 10,
                  padding: '9px 10px',
                  fontFamily: 'inherit',
                  fontSize: 12.5,
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                Ajouter au calendrier
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--outline-variant)'
            }}
          >
            <button
              type="button"
              onClick={() => setLegendOpen(value => !value)}
              style={{
                width: '100%',
                border: '1px solid var(--outline-variant)',
                background: 'var(--inset)',
                color: 'var(--text)',
                borderRadius: 10,
                padding: '8px 10px',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7
              }}
            >
              <Icon name={legendOpen ? 'chevdown' : 'chevright'} size={13} />
              Légende
            </button>

            {legendOpen && (
              <div
                style={{
                  marginTop: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                {Object.keys(COLORS).map(function renderLegendLine(key) {
                  const itemColor = COLORS[key];

                  return (
                    <div
                      key={key}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '18px 1fr',
                        gap: 8,
                        alignItems: 'center'
                      }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          background: itemColor.value,
                          justifySelf: 'center'
                        }}
                      />

                      <input
                        value={legend[key] || ''}
                        onChange={event => updateLegend(key, event.target.value)}
                        style={inputStyle()}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {allMarks.length > 0 && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid var(--outline-variant)',
                display: 'flex',
                flexDirection: 'column',
                gap: 7
              }}
            >
              <div style={fieldLabelStyle()}>
                Repères
              </div>

              {allMarks.slice(0, 8).map(function renderMark(mark) {
                const itemColor = COLORS[mark.color] || COLORS.tan;
                const markLabel = mark.label || (mark.type === 'range' ? 'Période' : 'Point');

                return (
                  <div
                    key={mark.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      border: '1px solid var(--outline-variant)',
                      background: 'var(--inset)',
                      borderRadius: 10,
                      padding: '8px 9px'
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 999,
                        background: itemColor.value,
                        flexShrink: 0
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 900,
                          color: 'var(--text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {markLabel}
                      </div>

                      <div
                        style={{
                          fontSize: 11.5,
                          color: 'var(--muted)',
                          marginTop: 2
                        }}
                      >
                        {mark.type === 'range'
                          ? formatDate(mark.start) + ' → ' + formatDate(mark.end)
                          : formatDate(mark.date)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteMark(mark.type, mark.id)}
                      title="Supprimer"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--faint)',
                        cursor: 'pointer',
                        padding: 4
                      }}
                    >
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  window.CalendarWidget = CalendarWidget;
})();
