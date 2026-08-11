// ════════════════════════════════════════════════════════════
// StepEditor.js — Modale d’ajout / modification d’étape
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Ajouter, modifier ou supprimer une étape.
// - Gérer les types : transport, hébergement, restaurant,
//   activité, autre.
// - Gérer les champs propres à chaque type.
// - Normaliser les liens document/réservation.
// - Sauvegarder via window.SB.saveStep / window.SB.deleteStep.
//
// Dépendances globales :
// - React
// - ReactDOM
// - Store
// - Icon
// - LocationInput
// - window.SB
// - window.ItineraryUtils
//
// ════════════════════════════════════════════════════════════

(function initStepEditor() {
  const U = window.ItineraryUtils || {};

  const STEP_TYPES = [
    {
      id: 'transport',
      label: 'Transport',
      icon: 'route'
    },
    {
      id: 'logement',
      label: 'Logement',
      icon: 'bed'
    },
    {
      id: 'restaurant',
      label: 'Restaurant',
      icon: 'fork'
    },
    {
      id: 'activite',
      label: 'Activité',
      icon: 'camera'
    },
    {
      id: 'autre',
      label: 'Autre',
      icon: 'pin'
    }
  ];

  const TRANSPORT_OPTIONS = [
    ['train', '🚆 Train'],
    ['avion', '✈️ Avion'],
    ['bus', '🚌 Bus'],
    ['voiture', '🚗 Voiture'],
    ['ferry', '⛴️ Ferry'],
    ['metro', '🚇 Métro'],
    ['pied', '🚶 À pied'],
    ['taxi', '🚕 Taxi']
  ];

  const DEFAULT_STEP = {
    type: 'activite',
    lockedType: null,

    label: '',
    lieu: '',
    note: '',
    link: '',

    time: '',
    timeEnd: '',

    transportType: 'train',
    depart: '',
    arrivee: '',
    nextDay: false,
    ref: '',
    escales: [],

    dateStart: '',
    dateEnd: '',
    timeCheckIn: '15:00',
    timeCheckOut: '11:00',
    nuits: 1,
    nights: 1,

    dureeEstimee: '',

    lat: null,
    lng: null,

    important: false
  };

  function safeString(value) {
    if (U.safeString) return U.safeString(value);
    return String(value == null ? '' : value).trim();
  }

  function normalizeStepLink(value) {
    if (U.normalizeStepLink) return U.normalizeStepLink(value);

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

  function addDaysISO(baseISO, count) {
    if (U.addDaysISO) return U.addDaysISO(baseISO, count);

    if (!baseISO) return '';

    const date = new Date(String(baseISO) + 'T12:00:00');
    date.setDate(date.getDate() + Number(count || 0));

    return date.toISOString().slice(0, 10);
  }

  function lodgingDiffNights(startISO, endISO) {
    if (U.lodgingDiffNights) return U.lodgingDiffNights(startISO, endISO);

    if (!startISO || !endISO) return 1;

    const start = new Date(String(startISO) + 'T12:00:00');
    const end = new Date(String(endISO) + 'T12:00:00');
    const diff = Math.round((end - start) / 86400000);

    return Math.max(1, diff);
  }

  function calcDuration(startTime, endTime, nextDay) {
    if (U.calcDuration) return U.calcDuration(startTime, endTime, nextDay);

    if (!startTime || !endTime) return '';

    const startParts = String(startTime).split(':').map(Number);
    const endParts = String(endTime).split(':').map(Number);

    if (startParts.length !== 2 || endParts.length !== 2) return '';

    let minutes =
      (endParts[0] * 60 + endParts[1]) -
      (startParts[0] * 60 + startParts[1]);

    if (nextDay || minutes < 0) minutes += 1440;

    if (minutes <= 0) return '';

    if (minutes < 60) return minutes + ' min';

    return Math.floor(minutes / 60) + 'h' + String(minutes % 60).padStart(2, '0');
  }

  function stepName(step) {
    return safeString(
      step &&
      (
        step.label ||
        step.lieu ||
        step.place ||
        step.arrivee ||
        step.depart ||
        'cette étape'
      )
    );
  }

  function buildInitialStep(step) {
    if (!step) {
      return {
        ...DEFAULT_STEP,
        escales: []
      };
    }

    const merged = {
      ...DEFAULT_STEP,
      ...step
    };

    merged.type = merged.lockedType || merged.type || DEFAULT_STEP.type;
    merged.transportType = merged.transportType || DEFAULT_STEP.transportType;
    merged.timeCheckIn = merged.timeCheckIn || merged.checkin || DEFAULT_STEP.timeCheckIn;
    merged.timeCheckOut = merged.timeCheckOut || merged.checkout || DEFAULT_STEP.timeCheckOut;
    merged.dateStart = merged.dateStart || '';
    merged.dateEnd = merged.dateEnd || '';
    merged.escales = Array.isArray(merged.escales) ? merged.escales : [];
    merged.important = !!merged.important;

    if (!merged.nuits && merged.nights) merged.nuits = merged.nights;
    if (!merged.nights && merged.nuits) merged.nights = merged.nuits;

    return merged;
  }

  function inputBaseStyle() {
    return {
      width: '100%',
      minHeight: 44,
      padding: '10px 12px',
      border: '1px solid var(--outline-variant)',
      borderRadius: 11,
      background: 'var(--inset)',
      color: 'var(--text)',
      fontFamily: 'inherit',
      fontSize: 16,
      outline: 'none'
    };
  }

  function labelStyle() {
    return {
      display: 'block',
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: 'var(--muted)',
      marginBottom: 6
    };
  }

  function ghostButtonStyle() {
    return {
      minHeight: 44,
      border: '1px solid var(--outline-variant)',
      background: 'var(--inset)',
      color: 'var(--text)',
      borderRadius: 11,
      padding: '9px 16px',
      fontSize: 13.5,
      fontWeight: 700,
      cursor: 'pointer',
      fontFamily: 'inherit'
    };
  }

  function primaryButtonStyle() {
    return {
      minHeight: 44,
      border: 'none',
      background: 'var(--accent)',
      color: 'var(--accent-ink)',
      borderRadius: 11,
      padding: '9px 18px',
      fontSize: 13.5,
      fontWeight: 800,
      cursor: 'pointer',
      fontFamily: 'inherit'
    };
  }

  function dangerButtonStyle() {
    return {
      ...primaryButtonStyle(),
      background: '#c0563f',
      color: '#fff'
    };
  }

  function Field({ label, children }) {
    return (
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle()}>{label}</label>
        {children}
      </div>
    );
  }

  function TwoColumns({ children }) {
    return (
      <div className="web-step-editor-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12
      }}>
        {children}
      </div>
    );
  }

  function Badge({ children, icon }) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        fontWeight: 800,
        color: 'var(--accent)',
        background: 'var(--accent-soft)',
        borderRadius: 999,
        padding: '5px 11px'
      }}>
        {icon ? <Icon name={icon} size={12} /> : null}
        {children}
      </span>
    );
  }

  function BasicLocationInput(props) {
    return (
      <input
        style={props.style}
        value={props.value || ''}
        onChange={event => props.onChange && props.onChange(event.target.value)}
        placeholder={props.placeholder || ''}
      />
    );
  }

  function LocationField(props) {
    const Component = window.LocationInput || BasicLocationInput;

    return <Component {...props} />;
  }

  function StepEditor({
    open,
    tripId,
    dayId,
    days = [],
    step,
    stepCount,
    onClose,
    onSaved
  }) {
    const [form, setForm] = React.useState(() => buildInitialStep(step));
    const [busy, setBusy] = React.useState(false);
    const [deleteAsk, setDeleteAsk] = React.useState(false);
    const [targetDayId, setTargetDayId] = React.useState(
      dayId || ''
    );

    const safeDays = Array.isArray(days)
      ? days
      : [];

    React.useEffect(function syncStepWhenOpened() {
      if (!open) return;

      setForm(buildInitialStep(step));
      setTargetDayId(dayId || '');
      setDeleteAsk(false);
      setBusy(false);
    }, [open, step && step.id, dayId]);

    if (!open) return null;

    const inputStyle = inputBaseStyle();
    const isEditing = !!(step && step.id);

    const effectiveDayId =
      targetDayId || dayId || '';

    const changingDay =
      String(effectiveDayId) !==
      String(dayId || '');

    const targetDayIndex =
      safeDays.findIndex(function findTargetDay(
        item
      ) {
        return String(item.id) ===
          String(effectiveDayId);
      });

    const targetDay =
      targetDayIndex >= 0
        ? safeDays[targetDayIndex]
        : null;

    const targetStepCount = (
      targetDay?.steps || []
    ).filter(function excludeCurrentStep(item) {
      return String(item.id) !==
        String(step?.id || '');
    }).length;

    const lockedType = form.lockedType || null;
    const isLodgingLocked = lockedType === 'logement';

    const currentDuration = calcDuration(form.time, form.timeEnd, form.nextDay);
    const currentNights = lodgingDiffNights(form.dateStart, form.dateEnd);

    const modalKicker = isLodgingLocked
      ? 'Hébergement'
      : isEditing
        ? 'Modification'
        : 'Nouvelle étape';

    const modalTitle = isLodgingLocked
      ? isEditing
        ? "Modifier l’hébergement"
        : 'Ajouter un hébergement'
      : isEditing
        ? "Modifier l’étape"
        : 'Ajouter au programme';

    function setField(key, value) {
      setForm(function update(prev) {
        return {
          ...prev,
          [key]: value
        };
      });
    }

    function patchForm(patch) {
      setForm(function update(prev) {
        return {
          ...prev,
          ...patch
        };
      });
    }

    function selectPlace(field, place) {
      if (!place) return;

      patchForm({
        [field]: place.label || place.name || '',
        lat: place.lat != null ? place.lat : form.lat,
        lng: place.lng != null ? place.lng : form.lng
      });
    }

    function selectArrivalPlace(place) {
      if (!place) return;

      patchForm({
        arrivee: place.label || place.name || '',
        lat: place.lat,
        lng: place.lng
      });
    }

    function selectGenericPlace(field, place) {
      if (!place) return;

      patchForm({
        [field]: place.label || place.name || '',
        lat: place.lat,
        lng: place.lng
      });
    }

    function updateLodgingStart(value) {
      setForm(function update(prev) {
        const nextEnd = prev.dateEnd || (value ? addDaysISO(value, 1) : '');
        const nights = lodgingDiffNights(value, nextEnd);

        return {
          ...prev,
          dateStart: value,
          dateEnd: nextEnd,
          nuits: nights,
          nights
        };
      });
    }

    function updateLodgingEnd(value) {
      setForm(function update(prev) {
        const nights = lodgingDiffNights(prev.dateStart, value);

        return {
          ...prev,
          dateEnd: value,
          nuits: nights,
          nights
        };
      });
    }

    function updateLodgingNights(value) {
      const nights = Math.max(1, Number(value) || 1);

      setForm(function update(prev) {
        const nextEnd = prev.dateStart
          ? addDaysISO(prev.dateStart, nights)
          : prev.dateEnd;

        return {
          ...prev,
          nuits: nights,
          nights,
          dateEnd: nextEnd
        };
      });
    }

    function addStopover() {
      setForm(function update(prev) {
        return {
          ...prev,
          escales: [
            ...(prev.escales || []),
            {
              place: '',
              arrivalTime: '',
              departureTime: '',
              lat: null,
              lng: null
            }
          ]
        };
      });
    }

    function updateStopover(index, patch) {
      setForm(function update(prev) {
        return {
          ...prev,
          escales: (prev.escales || []).map(function mapStopover(item, i) {
            return i === index
              ? {
                  ...item,
                  ...patch
                }
              : item;
          })
        };
      });
    }

    function removeStopover(index) {
      setForm(function update(prev) {
        return {
          ...prev,
          escales: (prev.escales || []).filter(function keepStopover(_, i) {
            return i !== index;
          })
        };
      });
    }

    function cleanStopovers() {
      return (form.escales || [])
        .filter(function keepStopover(item) {
          return item.place || item.arrivalTime || item.departureTime;
        })
        .map(function normalizeStopover(item) {
          return {
            place: item.place || '',
            arrivalTime: item.arrivalTime || '',
            departureTime: item.departureTime || '',
            lat: item.lat || null,
            lng: item.lng || null
          };
        });
    }

    function buildPayload() {
      const type = lockedType || form.type || 'autre';

      const payload = {
        id: step && step.id ? step.id : undefined,
        stepIndex: changingDay
          ? targetStepCount
          : step && step.stepIndex != null
            ? step.stepIndex
            : (stepCount || 0),
        type,
        label: form.label || '',
        note: form.note || '',
        link: normalizeStepLink(form.link),
        time: form.time || '',
        important: !!form.important
      };

      if (form.lat !== null && form.lat !== undefined && form.lat !== '') {
        payload.lat = form.lat;
      }

      if (form.lng !== null && form.lng !== undefined && form.lng !== '') {
        payload.lng = form.lng;
      }

      if (type === 'transport') {
        Object.assign(payload, {
          transportType: form.transportType || 'train',
          depart: form.depart || '',
          arrivee: form.arrivee || '',
          timeEnd: form.timeEnd || '',
          nextDay: !!form.nextDay,
          duree: currentDuration,
          ref: form.ref || '',
          escales: cleanStopovers()
        });

        if (!payload.label) {
          payload.label = [form.depart, form.arrivee].filter(Boolean).join(' → ');
        }

        return payload;
      }

      if (type === 'logement') {
        Object.assign(payload, {
          lieu: form.lieu || '',
          dateStart: form.dateStart || null,
          dateEnd: form.dateEnd || null,
          timeCheckIn: form.timeCheckIn || '15:00',
          timeCheckOut: form.timeCheckOut || '11:00',
          nuits: currentNights,
          nights: currentNights
        });

        return payload;
      }

      if (type === 'activite') {
        Object.assign(payload, {
          lieu: form.lieu || '',
          dureeEstimee: form.dureeEstimee || ''
        });

        return payload;
      }

      Object.assign(payload, {
        lieu: form.lieu || ''
      });

      return payload;
    }

    async function handleSave() {
      const saveDayId =
        targetDayId || dayId;

      if (!tripId || !saveDayId) {
        Store.showToast(
          'Voyage ou journée introuvable'
        );

        return;
      }

      const payload = buildPayload();

      setBusy(true);

      try {
        await window.SB.saveStep(
          tripId,
          saveDayId,
          payload
        );

        if (onSaved) {
          await onSaved();
        }

        if (onClose) {
          onClose();
        }

        if (changingDay) {
          Store.showToast(
            isEditing
              ? 'Étape déplacée vers J' +
                (targetDayIndex + 1) +
                '.'
              : 'Étape ajoutée à J' +
                (targetDayIndex + 1) +
                '.'
          );
        } else {
          Store.showToast(
            isEditing
              ? 'Étape mise à jour'
              : 'Étape ajoutée'
          );
        }
      } catch (error) {
        Store.showToast(
          'Erreur : ' +
          (error.message || error)
        );
      } finally {
        setBusy(false);
      }
    }

    async function confirmDelete() {
      if (!step || !step.id || busy) return;

      setBusy(true);

      try {
        await window.SB.deleteStep(step.id);

        if (onSaved) onSaved();
        if (onClose) onClose();

        Store.showToast('Étape supprimée');
      } catch (error) {
        Store.showToast('Erreur suppression : ' + (error.message || error));
      } finally {
        setBusy(false);
        setDeleteAsk(false);
      }
    }

    function renderTypeSelector() {
      if (isLodgingLocked) {
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 18,
            border: '1px solid var(--outline-variant)',
            background: 'var(--inset)',
            color: 'var(--muted)',
            borderRadius: 14,
            padding: '11px 13px',
            fontSize: 13,
            lineHeight: '18px'
          }}>
            <span style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0
            }}>
              <Icon name="bed" size={17} />
            </span>

            <span>
              Ce formulaire est dédié à l’hébergement : arrivée, départ, horaires et nombre de nuits.
            </span>
          </div>
        );
      }

      return (
        <div className="web-step-editor-types" style={{
          display: 'flex',
          gap: 6,
          marginBottom: 18
        }}>
          {STEP_TYPES.map(function renderType(type) {
            const selected = form.type === type.id;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setField('type', type.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  padding: '10px 4px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: '1px solid ' + (
                    selected
                      ? 'var(--accent)'
                      : 'var(--outline-variant)'
                  ),
                  background: selected ? 'var(--accent)' : 'var(--inset)',
                  color: selected ? 'var(--accent-ink)' : 'var(--muted)',
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: 'inherit'
                }}
              >
                <Icon name={type.icon} size={18} />
                {type.label}
              </button>
            );
          })}
        </div>
      );
    }

    function renderTransportFields() {
      return (
        <>
          <Field label="Mode de transport">
            <select
              style={inputStyle}
              value={form.transportType}
              onChange={event => setField('transportType', event.target.value)}
            >
              {TRANSPORT_OPTIONS.map(function renderOption(option) {
                return (
                  <option key={option[0]} value={option[0]}>
                    {option[1]}
                  </option>
                );
              })}
            </select>
          </Field>

          <TwoColumns>
            <Field label="Départ">
              <LocationField
                style={inputStyle}
                value={form.depart}
                onChange={value => setField('depart', value)}
                onSelect={place => selectPlace('depart', place)}
                placeholder="Ville, gare…"
              />
            </Field>

            <Field label="Heure départ">
              <input
                type="time"
                style={inputStyle}
                value={form.time}
                onChange={event => setField('time', event.target.value)}
              />
            </Field>
          </TwoColumns>

          <TwoColumns>
            <Field label="Arrivée">
              <LocationField
                style={inputStyle}
                value={form.arrivee}
                onChange={value => setField('arrivee', value)}
                onSelect={selectArrivalPlace}
                placeholder="Ville, aéroport…"
              />
            </Field>

            <Field label="Heure arrivée">
              <input
                type="time"
                style={inputStyle}
                value={form.timeEnd}
                onChange={event => setField('timeEnd', event.target.value)}
              />
            </Field>
          </TwoColumns>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 12
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 13,
              color: 'var(--muted)',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={!!form.nextDay}
                onChange={event => setField('nextDay', event.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              Arrivée le lendemain
            </label>

            {currentDuration && (
              <Badge icon="clock">
                {currentDuration}
              </Badge>
            )}
          </div>

          <TwoColumns>
            <Field label="Référence">
              <input
                style={inputStyle}
                value={form.ref}
                onChange={event => setField('ref', event.target.value)}
                placeholder="TGV 6601…"
              />
            </Field>

            <Field label="Titre optionnel">
              <input
                style={inputStyle}
                value={form.label}
                onChange={event => setField('label', event.target.value)}
                placeholder="Paris → Lyon"
              />
            </Field>
          </TwoColumns>

          <div style={{ marginTop: 4, marginBottom: 12 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 8
            }}>
              <label style={labelStyle()}>
                Escales
              </label>

              <button
                type="button"
                onClick={addStopover}
                style={{
                  ...ghostButtonStyle(),
                  padding: '7px 11px',
                  fontSize: 12
                }}
              >
                + Ajouter une escale
              </button>
            </div>

            {(form.escales || []).map(function renderStopover(stopover, index) {
              return (
                <div
                  key={index}
                  style={{
                    border: '1px solid var(--outline-variant)',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                    background: 'var(--inset)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10
                  }}>
                    <strong style={{
                      fontSize: 13,
                      color: 'var(--text)'
                    }}>
                      Escale {index + 1}
                    </strong>

                    <button
                      type="button"
                      onClick={() => removeStopover(index)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#c0563f',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 12,
                        fontWeight: 800
                      }}
                    >
                      Supprimer
                    </button>
                  </div>

                  <Field label="Ville / gare / aéroport">
                    <LocationField
                      style={inputStyle}
                      value={stopover.place || ''}
                      onChange={value => updateStopover(index, { place: value })}
                      onSelect={place => updateStopover(index, {
                        place: place.label,
                        lat: place.lat,
                        lng: place.lng
                      })}
                      placeholder="Ville ou lieu d’escale…"
                    />
                  </Field>

                  <TwoColumns>
                    <Field label="Arrivée">
                      <input
                        type="time"
                        style={inputStyle}
                        value={stopover.arrivalTime || ''}
                        onChange={event => updateStopover(index, {
                          arrivalTime: event.target.value
                        })}
                      />
                    </Field>

                    <Field label="Départ">
                      <input
                        type="time"
                        style={inputStyle}
                        value={stopover.departureTime || ''}
                        onChange={event => updateStopover(index, {
                          departureTime: event.target.value
                        })}
                      />
                    </Field>
                  </TwoColumns>
                </div>
              );
            })}
          </div>
        </>
      );
    }

    function renderLodgingFields() {
      return (
        <>
          <Field label="Nom du logement">
            <input
              style={inputStyle}
              value={form.label}
              onChange={event => setField('label', event.target.value)}
              placeholder="Hôtel, appartement, auberge…"
            />
          </Field>

          <Field label="Adresse / lieu">
            <LocationField
              style={inputStyle}
              value={form.lieu}
              onChange={value => setField('lieu', value)}
              onSelect={place => selectGenericPlace('lieu', place)}
              placeholder="Adresse, ville…"
            />
          </Field>

          <TwoColumns>
            <Field label="Arrivée">
              <input
                type="date"
                style={inputStyle}
                value={form.dateStart || ''}
                onChange={event => updateLodgingStart(event.target.value)}
              />
            </Field>

            <Field label="Départ">
              <input
                type="date"
                style={inputStyle}
                value={form.dateEnd || ''}
                min={form.dateStart || undefined}
                onChange={event => updateLodgingEnd(event.target.value)}
              />
            </Field>
          </TwoColumns>

          <TwoColumns>
            <Field label="Heure check-in">
              <input
                type="time"
                style={inputStyle}
                value={form.timeCheckIn || '15:00'}
                onChange={event => setField('timeCheckIn', event.target.value)}
              />
            </Field>

            <Field label="Heure check-out">
              <input
                type="time"
                style={inputStyle}
                value={form.timeCheckOut || '11:00'}
                onChange={event => setField('timeCheckOut', event.target.value)}
              />
            </Field>
          </TwoColumns>

          <TwoColumns>
            <Field label="Nuits">
              <input
                type="number"
                min="1"
                style={inputStyle}
                value={currentNights || form.nuits || form.nights || 1}
                onChange={event => updateLodgingNights(event.target.value)}
              />
            </Field>

            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              marginBottom: 12
            }}>
              <Badge icon="moon">
                {currentNights} {currentNights > 1 ? 'nuits' : 'nuit'}
              </Badge>
            </div>
          </TwoColumns>
        </>
      );
    }

    function renderRestaurantFields() {
      return (
        <>
          <Field label="Nom du restaurant">
            <input
              style={inputStyle}
              value={form.label}
              onChange={event => setField('label', event.target.value)}
              placeholder="Nom du restaurant…"
            />
          </Field>

          <Field label="Adresse / lieu">
            <LocationField
              style={inputStyle}
              value={form.lieu}
              onChange={value => setField('lieu', value)}
              onSelect={place => selectGenericPlace('lieu', place)}
              placeholder="Adresse, quartier…"
            />
          </Field>

          <Field label="Heure">
            <input
              type="time"
              style={inputStyle}
              value={form.time}
              onChange={event => setField('time', event.target.value)}
            />
          </Field>
        </>
      );
    }

    function renderActivityFields() {
      return (
        <>
          <Field label="Nom">
            <input
              style={inputStyle}
              value={form.label}
              onChange={event => setField('label', event.target.value)}
              placeholder="Musée, visite, activité…"
            />
          </Field>

          <Field label="Lieu">
            <LocationField
              style={inputStyle}
              value={form.lieu}
              onChange={value => setField('lieu', value)}
              onSelect={place => selectGenericPlace('lieu', place)}
              placeholder="Adresse, ville…"
            />
          </Field>

          <TwoColumns>
            <Field label="Heure">
              <input
                type="time"
                style={inputStyle}
                value={form.time}
                onChange={event => setField('time', event.target.value)}
              />
            </Field>

            <Field label="Durée estimée">
              <input
                style={inputStyle}
                value={form.dureeEstimee}
                onChange={event => setField('dureeEstimee', event.target.value)}
                placeholder="2h, 45 min…"
              />
            </Field>
          </TwoColumns>
        </>
      );
    }

    function renderOtherFields() {
      return (
        <>
          <Field label="Titre">
            <input
              style={inputStyle}
              value={form.label}
              onChange={event => setField('label', event.target.value)}
              placeholder="Titre de l’étape"
            />
          </Field>

          <Field label="Lieu optionnel">
            <LocationField
              style={inputStyle}
              value={form.lieu}
              onChange={value => setField('lieu', value)}
              onSelect={place => selectGenericPlace('lieu', place)}
              placeholder="Lieu…"
            />
          </Field>

          <Field label="Heure optionnelle">
            <input
              type="time"
              style={inputStyle}
              value={form.time}
              onChange={event => setField('time', event.target.value)}
            />
          </Field>
        </>
      );
    }

    function renderTypeFields() {
      const type = lockedType || form.type;

      if (type === 'transport') return renderTransportFields();
      if (type === 'logement') return renderLodgingFields();
      if (type === 'restaurant') return renderRestaurantFields();
      if (type === 'activite') return renderActivityFields();

      return renderOtherFields();
    }

    return ReactDOM.createPortal(
      <div
        className="web-step-editor-overlay"
        onClick={busy ? undefined : onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 300,
          background: 'rgba(21,48,42,.36)',
          backdropFilter: 'blur(7px)',
          WebkitBackdropFilter: 'blur(7px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '76px 24px 24px'
        }}
      >
        <div
          className="web-step-editor-panel"
          onClick={event => event.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 540,
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 40px 90px rgba(0,0,0,.36)',
            position: 'relative'
          }}
        >
          <div className="web-step-editor-header" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '18px 20px',
            borderBottom: '1px solid var(--outline-variant)',
            background: 'var(--soft)'
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: 'var(--accent)'
              }}>
                {modalKicker}
              </div>

              <div style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 23,
                lineHeight: '29px',
                color: 'var(--text)',
                marginTop: 2
              }}>
                {modalTitle}
              </div>
            </div>

            <button
              className="web-step-editor-close"
              type="button"
              onClick={busy ? undefined : onClose}
              disabled={busy}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--muted)',
                cursor: busy ? 'default' : 'pointer',
                padding: 6,
                borderRadius: 8
              }}
            >
              <Icon name="x" size={20} />
            </button>
          </div>

          <div className="web-step-editor-body" style={{
            padding: 20,
            overflowY: 'auto',
            minHeight: 0
          }}>
            {safeDays.length > 1 && (
              <Field label="Journée">
                <select
                  style={inputStyle}
                  value={effectiveDayId}
                  disabled={busy}
                  onChange={event =>
                    setTargetDayId(
                      event.target.value
                    )
                  }
                >
                  {safeDays.map(function renderDayOption(
                    item,
                    index
                  ) {
                    const title =
                      item.title ||
                      item.label ||
                      item.name ||
                      '';

                    const date =
                      item.dateLabel ||
                      item.dateISO ||
                      '';

                    return (
                      <option
                        key={item.id || index}
                        value={item.id}
                      >
                        {'J' + (index + 1)}
                        {title
                          ? ' — ' + title
                          : ''}
                        {date
                          ? ' · ' + date
                          : ''}
                      </option>
                    );
                  })}
                </select>

                {changingDay && (
                  <div
                    role="status"
                    style={{
                      marginTop: 7,
                      color: 'var(--accent)',
                      fontSize: 12,
                      fontWeight: 800
                    }}
                  >
                    L’étape sera déplacée vers
                    {' J' + (targetDayIndex + 1)}.
                  </div>
                )}
              </Field>
            )}

            {renderTypeSelector()}

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              border: '1px solid var(--outline-variant)',
              background: form.important ? 'var(--accent-soft)' : 'var(--inset)',
              color: form.important ? 'var(--accent)' : 'var(--muted)',
              borderRadius: 12,
              padding: '10px 12px',
              marginBottom: 14,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 800
            }}>
              <input
                type="checkbox"
                checked={!!form.important}
                onChange={event => setField('important', event.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              Marquer comme étape clé
            </label>

            {renderTypeFields()}

            <Field label="Document / réservation">
              <input
                style={inputStyle}
                value={form.link}
                onChange={event => setField('link', event.target.value)}
                placeholder="Billet, réservation, PDF, Google Drive…"
              />
            </Field>

            <Field label="Note optionnelle">
              <textarea
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: 72,
                  lineHeight: '20px'
                }}
                value={form.note}
                onChange={event => setField('note', event.target.value)}
                placeholder="Informations utiles, consignes, rappels…"
              />
            </Field>
          </div>

          <div className="web-step-editor-footer" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 20px',
            borderTop: '1px solid var(--outline-variant)',
            background: 'var(--card)'
          }}>
            {isEditing && (
              <button
                type="button"
                onClick={() => setDeleteAsk(true)}
                disabled={busy}
                style={{
                  ...ghostButtonStyle(),
                  color: '#c0563f',
                  borderColor: 'rgba(192,86,63,.35)'
                }}
              >
                Supprimer
              </button>
            )}

            <div style={{ flex: 1 }} />

            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              style={ghostButtonStyle()}
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              style={primaryButtonStyle()}
            >
              {busy
                ? changingDay
                  ? 'Déplacement…'
                  : 'Enregistrement…'
                : isEditing
                  ? 'Enregistrer'
                  : 'Ajouter'}
            </button>
          </div>

          {deleteAsk && (
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              display: 'grid',
              placeItems: 'center',
              padding: 24,
              background: 'rgba(21,48,42,.34)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}>
              <div style={{
                width: '100%',
                maxWidth: 370,
                border: '1px solid var(--outline-variant)',
                borderRadius: 18,
                padding: 22,
                background: 'var(--card)',
                boxShadow: '0 30px 70px rgba(0,0,0,.28)'
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  color: '#c0563f',
                  marginBottom: 8
                }}>
                  Suppression
                </div>

                <div style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 25,
                  lineHeight: '30px',
                  color: 'var(--text)',
                  marginBottom: 10
                }}>
                  Supprimer cette étape ?
                </div>

                <p style={{
                  margin: '0 0 18px',
                  color: 'var(--muted)',
                  fontSize: 13.5,
                  lineHeight: '20px'
                }}>
                  “{stepName(form)}” sera retirée définitivement de votre programme.
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10
                }}>
                  <button
                    type="button"
                    onClick={() => setDeleteAsk(false)}
                    disabled={busy}
                    style={ghostButtonStyle()}
                  >
                    Annuler
                  </button>

                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={busy}
                    style={dangerButtonStyle()}
                  >
                    {busy ? '…' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }

  window.normalizeStepLink = normalizeStepLink;
  window.StepEditor = StepEditor;
})();
