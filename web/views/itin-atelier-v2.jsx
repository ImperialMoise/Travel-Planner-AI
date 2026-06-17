/* ════════════════════════════════════════════════════════════════
   DIRECTION B — « L'Atelier » v2
   · Bi-thème : sombre (vert pétrole) ↔ clair (crème) commutable
   · Colonne droite ÉPINGLABLE : l'utilisateur choisit ses blocs
     (carte · check-list · note · voyageurs · repères)
   · Synthèse refondue (tableau de bord narratif)
   Cadre 1380×860.
   ════════════════════════════════════════════════════════════════ */
function palette(mode) {
  if (mode === 'light') return {
    mode, bgCss: 'radial-gradient(1100px 700px at 78% -12%,rgba(180,132,62,.07),transparent 60%),linear-gradient(180deg,#f4efe5,#efe9dc)',
    card: '#ffffff', soft: '#f1ebde', inset: '#f6f1e7', shadow: '0 3px 14px rgba(31,46,40,.09)',
    text: '#1f2e28', muted: '#5e7068', faint: '#9aa89f',
    accent: '#b4843e', accentSoft: 'rgba(180,132,62,.13)', accentInk: '#fff',
    line: 'rgba(45,73,63,.13)', line2: 'rgba(45,73,63,.07)', topbar: 'rgba(244,239,229,.78)'
  };
  return {
    mode, bgCss: 'radial-gradient(1100px 700px at 75% -10%,rgba(217,182,126,.06),transparent 60%),linear-gradient(180deg,#15302a,#173a31)',
    card: '#21433b', soft: '#2a5046', inset: 'rgba(0,0,0,.18)', shadow: '0 3px 14px rgba(0,0,0,.3)',
    text: '#f3ede2', muted: '#9db5ab', faint: '#6f8a80',
    accent: '#d9b67e', accentSoft: 'rgba(217,182,126,.14)', accentInk: '#15302a',
    line: 'rgba(255,255,255,.08)', line2: 'rgba(255,255,255,.05)', topbar: 'rgba(20,42,36,.7)'
  };
}

/* ════════════════════════════════════════════════════════════════
   ÉDITEUR D'ÉTAPE — fenêtre modale (ajout / modification / suppression)
   Style « L'Atelier ». Les champs s'adaptent au type choisi.
   ════════════════════════════════════════════════════════════════ */
function calcDuree(dep, arr, nextDay) {
  if (!dep || !arr) return '';
  const [dh, dm] = dep.split(':').map(Number);
  const [ah, am] = arr.split(':').map(Number);
  let mins = (ah * 60 + am) - (dh * 60 + dm);
  if (nextDay || mins < 0) mins += 1440;
  if (mins <= 0) return '';
  return mins >= 60 ? `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}` : `${mins} min`;
}
function calcNuits(a, b) {
  if (!a || !b) return 0;
  const n = Math.round((new Date(b) - new Date(a)) / 86400000);
  return n > 0 ? n : 0;
}

function getStepCoords(step) {
  const lat = Number(step && step.lat);
  const lng = Number(step && step.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

function getDayCoords(day) {
  const steps = (day && day.steps) || [];

  for (const step of steps) {
    const coords = getStepCoords(step);
    if (coords) return coords;
  }

  return null;
}

function weatherCodeLabel(code) {
  const map = {
    0: 'Ciel clair',
    1: 'Plutôt clair',
    2: 'Partiellement nuageux',
    3: 'Couvert',
    45: 'Brouillard',
    48: 'Brouillard givrant',
    51: 'Bruine légère',
    53: 'Bruine',
    55: 'Bruine forte',
    61: 'Pluie légère',
    63: 'Pluie',
    65: 'Forte pluie',
    71: 'Neige légère',
    73: 'Neige',
    75: 'Forte neige',
    80: 'Averses légères',
    81: 'Averses',
    82: 'Fortes averses',
    95: 'Orage'
  };

  return map[code] || 'Météo variable';
}

function weatherAdvice(weather) {
  if (!weather) return 'À vérifier';
  if ((weather.precipitation || 0) >= 5) return 'Prévoir pluie';
  if ((weather.wind || 0) >= 35) return 'Vent fort';
  if ((weather.tempMax || 0) >= 30) return 'Hydratation';
  if ((weather.tempMin || 20) <= 5) return 'Veste chaude';
  return 'RAS';
}

function weatherExternalUrl(coords) {
  if (!coords) return 'https://www.windy.com/';
  const lat = Number(coords.lat).toFixed(4);
  const lng = Number(coords.lng).toFixed(4);
  return 'https://www.windy.com/?' + lat + ',' + lng + ',8';
}

async function fetchOpenMeteoDay(coords, dateISO) {
  if (!coords || !dateISO) return null;

  const url = 'https://api.open-meteo.com/v1/forecast'
    + '?latitude=' + encodeURIComponent(coords.lat)
    + '&longitude=' + encodeURIComponent(coords.lng)
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max'
    + '&timezone=auto'
    + '&forecast_days=16';

  const res = await fetch(url);
  if (!res.ok) throw new Error('Météo indisponible');

  const data = await res.json();
  const times = (data.daily && data.daily.time) || [];
  const index = times.indexOf(dateISO);

  if (index === -1) return null;

  return {
    kind: 'forecast',
    code: data.daily.weather_code[index],
    label: weatherCodeLabel(data.daily.weather_code[index]),
    tempMax: Math.round(data.daily.temperature_2m_max[index]),
    tempMin: Math.round(data.daily.temperature_2m_min[index]),
    precipitation: Math.round(data.daily.precipitation_sum[index] || 0),
    wind: Math.round(data.daily.wind_speed_10m_max[index] || 0)
  };
}

async function fetchOpenMeteoClimateEstimate(coords, dateISO) {
  if (!coords || !dateISO) return null;

  const url = 'https://climate-api.open-meteo.com/v1/climate'
    + '?latitude=' + encodeURIComponent(coords.lat)
    + '&longitude=' + encodeURIComponent(coords.lng)
    + '&start_date=' + encodeURIComponent(dateISO)
    + '&end_date=' + encodeURIComponent(dateISO)
    + '&models=EC_Earth3P_HR'
    + '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max'
    + '&timezone=auto';

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const daily = data.daily || {};

  if (!daily.temperature_2m_max || daily.temperature_2m_max[0] == null) return null;

  const rain = Math.round(daily.precipitation_sum && daily.precipitation_sum[0] || 0);

  return {
    kind: 'climate',
    label: rain >= 8 ? 'Tendance humide' : rain >= 2 ? 'Pluie possible' : 'Tendance saisonnière',
    tempMax: Math.round(daily.temperature_2m_max[0]),
    tempMin: Math.round(daily.temperature_2m_min && daily.temperature_2m_min[0] || daily.temperature_2m_max[0]),
    precipitation: rain,
    wind: Math.round(daily.wind_speed_10m_max && daily.wind_speed_10m_max[0] || 0)
  };
}

async function searchNearbyRestaurants(coords) {
  if (!coords) return [];

  const url = 'https://api.maptiler.com/geocoding/restaurant.json'
    + '?key=08IwMKKAkP3BQJss5poF'
    + '&language=fr,en,ko,ja'
    + '&proximity=' + encodeURIComponent(coords.lng + ',' + coords.lat)
    + '&types=poi'
    + '&limit=6';

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();

  return ((data && data.features) || []).map(function(feature) {
    const center = feature.center || [];
    const context = feature.context || [];
    const localName = feature.text || feature.place_name || 'Restaurant';
    const fullName = feature.place_name_fr || feature.place_name_en || feature.place_name || localName;

    return {
      id: feature.id || localName,
      label: localName,
      place: fullName,
      lat: center[1],
      lng: center[0],
      context: context.map(function(item) { return item.text; }).filter(Boolean).join(', ')
    };
  });
}

function StepEditor({ open, tripId, dayId, step, stepCount, onClose, onSaved }) {
  const { theme = localStorage.getItem('it_theme') || 'light' } = Store.useStore();
  const C = palette(theme);
  const serif = '"DM Serif Display",Georgia,serif';

  const TYPES = [
    { id: 'transport', label: 'Transport', icon: 'route' },
    { id: 'logement', label: 'Logement', icon: 'bed' },
    { id: 'restaurant', label: 'Table', icon: 'fork' },
    { id: 'activite', label: 'Activité', icon: 'camera' },
    { id: 'autre', label: 'Autre', icon: 'pin' }
  ];
  const TRANSPORTS = [
    ['train', '🚆 Train'], ['avion', '✈️ Avion'], ['bus', '🚌 Bus'],
    ['voiture', '🚗 Voiture'], ['ferry', '⛴️ Ferry'], ['metro', '🚇 Métro'],
    ['pied', '🚶 À pied'], ['taxi', '🚕 Taxi']
  ];

  const blank = {
    type: 'activite', label: '', lieu: '', time: '', timeEnd: '',
    transportType: 'train', depart: '', arrivee: '', nextDay: false, ref: '',
    escales: [],
    dateStart: '', dateEnd: '', timeCheckIn: '15:00', timeCheckOut: '11:00',
    dureeEstimee: '', link: '', note: ''
  };
  const [f, setF] = React.useState(blank);
  const [busy, setBusy] = React.useState(false);
  const [deleteAsk, setDeleteAsk] = React.useState(false);
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const addEscale = () => setF(prev => ({
    ...prev,
    escales: [...(prev.escales || []), { place: '', arrivalTime: '', departureTime: '' }]
  }));

  const updateEscale = (index, patch) => setF(prev => ({
    ...prev,
    escales: (prev.escales || []).map((escale, i) => i === index ? { ...escale, ...patch } : escale)
  }));

  const removeEscale = index => setF(prev => ({
    ...prev,
    escales: (prev.escales || []).filter((_, i) => i !== index)
  }));

  React.useEffect(() => {
    if (!open) return;
        setDeleteAsk(false);
    if (step) {
      setF({
        ...blank, ...step,
        dateStart: step.dateStart || '', dateEnd: step.dateEnd || '',
        timeCheckIn: step.timeCheckIn || '15:00', timeCheckOut: step.timeCheckOut || '11:00',
        transportType: step.transportType || 'train'
      });
    } else {
      setF(blank);
    }
  }, [open, step]);

  if (!open) return null;

  const duree = calcDuree(f.time, f.timeEnd, f.nextDay);
  const nuits = calcNuits(f.dateStart, f.dateEnd);

  async function handleSave() {
    setBusy(true);
    try {
      const p = {
        id: step ? step.id : undefined,
        stepIndex: step ? step.stepIndex : (stepCount || 0),
        type: f.type, label: f.label, note: f.note, link: f.link, time: f.time
      };
      if (f.type === 'transport') {
        Object.assign(p, {
          transportType: f.transportType,
          depart: f.depart,
          arrivee: f.arrivee,
          timeEnd: f.timeEnd,
          nextDay: f.nextDay,
          duree,
          ref: f.ref,
          escales: (f.escales || [])
            .filter(escale => escale.place || escale.arrivalTime || escale.departureTime)
            .map(escale => ({
              place: escale.place || '',
              arrivalTime: escale.arrivalTime || '',
              departureTime: escale.departureTime || '',
              lat: escale.lat || null,
              lng: escale.lng || null
            }))
        });
      } else if (f.type === 'logement') {
        Object.assign(p, { lieu: f.lieu, dateStart: f.dateStart || null, dateEnd: f.dateEnd || null, timeCheckIn: f.timeCheckIn, timeCheckOut: f.timeCheckOut, nuits });
      } else if (f.type === 'activite') {
        Object.assign(p, { lieu: f.lieu, dureeEstimee: f.dureeEstimee });
      } else {
        Object.assign(p, { lieu: f.lieu });
      }
      if (f.lat) p.lat = f.lat;
      if (f.lng) p.lng = f.lng;
      await window.SB.saveStep(tripId, dayId, p);
      onSaved && onSaved();
      onClose();
    } catch (e) {
      alert('Erreur : ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    if (!step || !step.id) return;
    setDeleteAsk(true);
  }

  async function confirmDelete() {
    if (!step || !step.id) return;

    setBusy(true);
    try {
      await window.SB.deleteStep(step.id);
      onSaved && onSaved();
      onClose();
    } catch (e) {
      alert('Erreur : ' + e.message);
    } finally {
      setBusy(false);
      setDeleteAsk(false);
    }
  }

  const inp = { width: '100%', padding: '10px 12px', border: `1px solid ${C.line}`, borderRadius: 11, background: C.inset, color: C.text, fontFamily: 'inherit', fontSize: 14, outline: 'none' };
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 };
  const ghost = { border: `1px solid ${C.line}`, background: C.inset, color: C.text, borderRadius: 11, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
  const primary = { border: 'none', background: C.accent, color: C.accentInk, borderRadius: 11, padding: '9px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
  const badge = { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: C.accent, background: C.accentSoft, borderRadius: 999, padding: '5px 11px' };

  const field = (label, child) => <div style={{ marginBottom: 12 }}><label style={lbl}>{label}</label>{child}</div>;
  const twoCol = (a, b) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{a}{b}</div>;

  return ReactDOM.createPortal(
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: theme === 'light' ? 'rgba(31,46,40,.34)' : 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '76px 24px 24px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,.4)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${C.line}` }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: C.accent }}>{step ? 'Modifier' : 'Nouvelle étape'}</div>
            <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: C.text, marginTop: 2 }}>{step ? "Modifier l'étape" : "Ajouter au programme"}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: C.muted, cursor: 'pointer', padding: 6, borderRadius: 8 }}><Icon name="x" size={20} /></button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {TYPES.map(t => {
              const on = f.type === t.id;
              return <button key={t.id} onClick={() => set('type', t.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 4px', borderRadius: 12, cursor: 'pointer', transition: 'all .15s', border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accent : C.inset, color: on ? C.accentInk : C.muted, fontSize: 11, fontWeight: 700 }}><Icon name={t.icon} size={18} />{t.label}</button>;
            })}
          </div>

                    {f.type === 'transport' && <>
            {field('Mode de transport', (
              <select
                style={inp}
                value={f.transportType}
                onChange={e => set('transportType', e.target.value)}
              >
                {TRANSPORTS.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            ))}

            {twoCol(
              field('Départ', (
                <LocationInput
                  style={inp}
                  value={f.depart}
                  onChange={v => set('depart', v)}
                  onSelect={place => setF(prev => ({
                    ...prev,
                    depart: place.label,
                    lat: prev.lat || place.lat,
                    lng: prev.lng || place.lng
                  }))}
                  placeholder="Ville, gare…"
                />
              )),
              field('Heure départ', (
                <input
                  type="time"
                  style={inp}
                  value={f.time}
                  onChange={e => set('time', e.target.value)}
                />
              ))
            )}

            {twoCol(
              field('Arrivée', (
                <LocationInput
                  style={inp}
                  value={f.arrivee}
                  onChange={v => set('arrivee', v)}
                  onSelect={place => setF(prev => ({
                    ...prev,
                    arrivee: place.label,
                    lat: place.lat,
                    lng: place.lng
                  }))}
                  placeholder="Ville, aéroport…"
                />
              )),
              field('Heure arrivée', (
                <input
                  type="time"
                  style={inp}
                  value={f.timeEnd}
                  onChange={e => set('timeEnd', e.target.value)}
                />
              ))
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: C.muted, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={f.nextDay}
                  onChange={e => set('nextDay', e.target.checked)}
                  style={{ accentColor: C.accent }}
                />
                Arrivée le lendemain
              </label>

              {duree && (
                <span style={badge}>
                  <Icon name="clock" size={12} />
                  {duree}
                </span>
              )}
            </div>

            {twoCol(
              field('Référence', (
                <input
                  style={inp}
                  value={f.ref}
                  onChange={e => set('ref', e.target.value)}
                  placeholder="TGV 6601…"
                />
              )),
              field('Titre (option.)', (
                <input
                  style={inp}
                  value={f.label}
                  onChange={e => set('label', e.target.value)}
                  placeholder="Paris → Lyon"
                />
              ))
            )}

            <div style={{ marginTop: 4, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={lbl}>Escales</label>
                <button
                  type="button"
                  onClick={addEscale}
                  style={{ ...ghost, padding: '7px 11px', fontSize: 12 }}
                >
                  + Ajouter une escale
                </button>
              </div>

              {(f.escales || []).map((escale, index) => (
                <div
                  key={index}
                  style={{
                    border: `1px solid ${C.line}`,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                    background: C.inset
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <strong style={{ fontSize: 13, color: C.text }}>Escale {index + 1}</strong>
                    <button
                      type="button"
                      onClick={() => removeEscale(index)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#c0563f',
                        cursor: 'pointer'
                      }}
                    >
                      Supprimer
                    </button>
                  </div>

                  {field('Ville / gare / aéroport', (
                    <LocationInput
                      style={inp}
                      value={escale.place || ''}
                      onChange={v => updateEscale(index, { place: v })}
                      onSelect={place => updateEscale(index, {
                        place: place.label,
                        lat: place.lat,
                        lng: place.lng
                      })}
                      placeholder="Ville ou lieu d'escale…"
                    />
                  ))}

                  {twoCol(
                    field('Arrivée', (
                      <input
                        type="time"
                        style={inp}
                        value={escale.arrivalTime || ''}
                        onChange={e => updateEscale(index, { arrivalTime: e.target.value })}
                      />
                    )),
                    field('Départ', (
                      <input
                        type="time"
                        style={inp}
                        value={escale.departureTime || ''}
                        onChange={e => updateEscale(index, { departureTime: e.target.value })}
                      />
                    ))
                  )}
                </div>
              ))}
            </div>
          </>}

          {f.type === 'logement' && <>
            {field('Nom du logement', <input style={inp} value={f.label} onChange={e => set('label', e.target.value)} placeholder="Hôtel Le Bristol…" />)}
            {field('Adresse / lieu', <LocationInput
             style={inp}
             value={f.lieu}
             onChange={v => set('lieu', v)}
             onSelect={place => setF(prev => ({ ...prev, lieu: place.label, lat: place.lat, lng: place.lng }))}
             placeholder="Adresse, ville…"
            />)}
            {twoCol(
              field('Arrivée (date)', <input type="date" style={inp} value={f.dateStart} onChange={e => set('dateStart', e.target.value)} />),
              field('Départ (date)', <input type="date" style={inp} value={f.dateEnd} onChange={e => set('dateEnd', e.target.value)} />)
            )}
            {twoCol(
              field('Heure check-in', <input type="time" style={inp} value={f.timeCheckIn} onChange={e => set('timeCheckIn', e.target.value)} />),
              field('Heure check-out', <input type="time" style={inp} value={f.timeCheckOut} onChange={e => set('timeCheckOut', e.target.value)} />)
            )}
            {nuits > 0 && <div style={{ marginBottom: 12 }}><span style={badge}><Icon name="moon" size={12} />{nuits} {nuits > 1 ? 'nuits' : 'nuit'}</span></div>}
          </>}

          {f.type === 'restaurant' && <>
            {field('Nom du restaurant', <input style={inp} value={f.label} onChange={e => set('label', e.target.value)} placeholder="Le Comptoir…" />)}
            {field('Adresse / lieu', <LocationInput
              style={inp}
              value={f.lieu}
              onChange={v => set('lieu', v)}
             onSelect={place => setF(prev => ({ ...prev, lieu: place.label, lat: place.lat, lng: place.lng }))}
              placeholder="Adresse, quartier…"
            />)}
            {field('Heure', <input type="time" style={inp} value={f.time} onChange={e => set('time', e.target.value)} />)}
          </>}

          {f.type === 'activite' && <>
            {field('Nom', <input style={inp} value={f.label} onChange={e => set('label', e.target.value)} placeholder="Musée d’Orsay…" />)}
            {field('Lieu', <LocationInput
              style={inp}
              value={f.lieu}
               onChange={v => set('lieu', v)}
               onSelect={place => setF(prev => ({ ...prev, lieu: place.label, lat: place.lat, lng: place.lng }))}
               placeholder="Adresse, ville…"
            />)}
            {twoCol(
              field('Heure', <input type="time" style={inp} value={f.time} onChange={e => set('time', e.target.value)} />),
              field('Durée estimée', <input style={inp} value={f.dureeEstimee} onChange={e => set('dureeEstimee', e.target.value)} placeholder="2h, 45 min…" />)
            )}
          </>}

          {f.type === 'autre' && <>
            {field('Titre', <input style={inp} value={f.label} onChange={e => set('label', e.target.value)} placeholder="Titre de l’étape" />)}
            {field('Lieu (option.)', <LocationInput
             style={inp}
             value={f.lieu}
             onChange={v => set('lieu', v)}
             onSelect={place => setF(prev => ({ ...prev, lieu: place.label, lat: place.lat, lng: place.lng }))}
             placeholder="Lieu…"
            />)}
            {field('Heure (option.)', <input type="time" style={inp} value={f.time} onChange={e => set('time', e.target.value)} />)}
          </>}

          {field('Lien (option.)', <input style={inp} value={f.link} onChange={e => set('link', e.target.value)} placeholder="Réservation, billet…" />)}
          {field('Note (option.)', <textarea style={{ ...inp, resize: 'vertical', minHeight: 60 }} value={f.note} onChange={e => set('note', e.target.value)} placeholder="Informations…" />)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: `1px solid ${C.line}` }}>
          {step && <button onClick={handleDelete} disabled={busy} style={{ ...ghost, color: '#c0563f', borderColor: 'rgba(192,86,63,.35)' }}>Supprimer</button>}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} disabled={busy} style={ghost}>Annuler</button>
          <button onClick={handleSave} disabled={busy} style={primary}>{busy ? '…' : (step ? 'Enregistrer' : 'Ajouter')}</button>
        </div>
                {deleteAsk && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'grid', placeItems: 'center', padding: 24, background: theme === 'light' ? 'rgba(31,46,40,.22)' : 'rgba(0,0,0,.38)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <div style={{ width: '100%', maxWidth: 360, border: `1px solid ${C.line}`, borderRadius: 18, padding: 22, background: C.card, boxShadow: '0 30px 70px rgba(0,0,0,.28)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: C.accent, marginBottom: 8 }}>Suppression</div>
              <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 25, lineHeight: '30px', color: C.text, marginBottom: 10 }}>Supprimer cette étape ?</div>
              <p style={{ margin: '0 0 18px', color: C.muted, fontSize: 13.5, lineHeight: '20px' }}>
                “{f.label || step.label || step.lieu || 'Cette étape'}” sera retirée définitivement de votre programme.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setDeleteAsk(false)} disabled={busy} style={ghost}>Annuler</button>
                <button type="button" onClick={confirmDelete} disabled={busy} style={{ ...primary, background: '#c0563f', color: '#fff' }}>
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

window.StepEditor = StepEditor;

function dayTitleStepName(step) {
  if (!step) return '';

  var text = String(
    step.label ||
    step.lieu ||
    step.place ||
    step.arrivee ||
    step.depart ||
    ''
  ).trim();

  return text
    .replace(/^visite\s+(de|du|des|d’|d')\s+/i, '')
    .replace(/^découverte\s+(de|du|des|d’|d')\s+/i, '')
    .replace(/^balade\s+(le long de|le long du|dans|à|au|aux|de|du|des|d’|d')\s+/i, '')
    .replace(/^promenade\s+(dans|à|au|aux|de|du|des|d’|d')\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function dayTitleStepType(step) {
  return String(step && step.type || '').toLowerCase();
}

function dayTitleIsRestaurant(step) {
  return dayTitleStepType(step) === 'restaurant';
}

function dayTitleIsActivity(step) {
  return dayTitleStepType(step) === 'activite';
}

function dayTitleIsTransport(step) {
  return dayTitleStepType(step) === 'transport';
}

function dayTitleIsLodging(step) {
  return dayTitleStepType(step) === 'logement';
}

function dayTitleMainStep(day) {
  var steps = Array.isArray(day && day.steps) ? day.steps : [];
  if (!steps.length) return null;

  var important = steps.find(function(step) {
    return step.important || step.favorite || step.favori || step.isImportant;
  });
  if (important) return important;

  var activity = steps.find(dayTitleIsActivity);
  if (activity) return activity;

  var transport = steps.find(dayTitleIsTransport);
  if (transport) return transport;

  var lodging = steps.find(dayTitleIsLodging);
  if (lodging) return lodging;

  var other = steps.find(function(step) {
    return !dayTitleIsRestaurant(step);
  });
  if (other) return other;

  return steps[0];
}

function getAutoDayTitle(day) {
  var main = dayTitleMainStep(day);
  var name = dayTitleStepName(main);

  return name || 'Journée libre';
}

function getDisplayDayTitle(day) {
  var manual = String(day && day.title || '').trim();

  if (manual && manual.toLowerCase() !== 'journée libre') {
    return manual;
  }

  return getAutoDayTitle(day);
}

function itDateFromISO(iso) {
  if (!iso) return null;
  return new Date(String(iso) + 'T12:00:00');
}

function itISOFromDate(date) {
  if (!date) return '';
  return date.toISOString().slice(0, 10);
}

function itAddDaysISO(baseISO, diff) {
  var d = itDateFromISO(baseISO);
  if (!d) return '';

  d.setDate(d.getDate() + diff);
  return itISOFromDate(d);
}

function itDayDateLabel(iso) {
  var d = itDateFromISO(iso);
  if (!d) return '';

  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

function itHeaderDateLabel(iso, fallbackWeekday) {
  var d = itDateFromISO(iso);
  if (!d) return fallbackWeekday || '';

  var weekday = d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return weekday + ' ' + fmtDate(iso);
}

function AtelierV2() {
  // --- 1. CONNEXION À TA BASE DE DONNÉES SUPABASE ---
  const { trip: realTrip, selectedDayIndex } = Store.useStore();

  const T = realTrip ? {
    ...window.TRIP, // On garde les éléments graphiques (avatars, chapitres, carte) de la démo de Claude
    name: realTrip.name,
    startISO: realTrip.startDate,
    endISO: realTrip.days.length > 0 ? realTrip.days[realTrip.days.length - 1].dateISO : realTrip.startDate,
    duration: realTrip.days.length || 1,
    todayIndex: 0, // Par défaut on affiche le premier jour de ton voyage
    days: realTrip.days.map((d, i) => {
      // On pioche une journée de démo pour hériter de sa couleur et de sa position sur la carte
      const demoDay = window.TRIP.days[i % window.TRIP.days.length]; 
      return {
        ...demoDay, 
        id: d.id,
        n: d.index + 1,
        dateISO: d.dateISO,
        title: getDisplayDayTitle(d),
        note: d.note,
        steps: d.steps.map(s => ({
          ...s, // garde l'id + tous les champs bruts (indispensable pour la modification)
          label: s.label || s.lieu,
          place: s.lieu,
            mode: s.transportType || 'car',
          from: s.depart,
          to: s.arrivee,
          nights: s.nuits,
          checkin: s.timeCheckIn,
          checkout: s.timeCheckOut,
          ref: s.ref,
          dur: s.dureeEstimee || s.duree,
            escales: s.escales || [],
          over: s.nextDay ? ' +1' : ''
        }))
      };
    })
  } : window.TRIP;
  // ---------------------------------------------------

  const serif = '"DM Serif Display",Georgia,serif';
  const mono = 'ui-monospace,SFMono-Regular,Menlo,monospace';
  // dégradé de placeholder « photo de lieu » — hsl (portable, capturable)
  const HUE_MAP = { 168: 152, 28: 30, 220: 212, 200: 198 };
  function heroGrad(hue, light) {
    const h = HUE_MAP[hue] != null ? HUE_MAP[hue] : hue;
    return light
      ? `linear-gradient(150deg, hsl(${h} 36% 64%), hsl(${h} 40% 50%))`
      : `linear-gradient(150deg, hsl(${h} 30% 34%), hsl(${h} 32% 23%))`;
  }

  const { theme = localStorage.getItem('it_theme') || 'light' } = Store.useStore();
  const mode = theme;
  const sel = Math.min(selectedDayIndex || 0, T.days.length - 1);
  const [mapOpen, setMapOpen] = React.useState(false);
  const [editPins, setEditPins] = React.useState(false);
  const [pinned, setPinned] = React.useState(() => {
    try { const s = JSON.parse(localStorage.getItem('it_pins')); if (Array.isArray(s) && s.length) return s; } catch (e) {}
    return ['map', 'checklist', 'note'];
  });
  const [done, setDone] = React.useState({});  // checklist coché
  
  const reload = () => { if (realTrip) window.SB.loadTrip(realTrip.id).then(t => Store.set({ trip: t })).catch(() => {}); };

  async function moveDayToDateInsideTrip(anchorDay, nextDateISO) {
  if (!realTrip || !realTrip.id || !anchorDay || !nextDateISO) return;

  function parseLocalDate(iso) {
    if (!iso) return null;
    return new Date(String(iso) + 'T12:00:00');
  }

  function diffDays(startISO, endISO) {
    const start = parseLocalDate(startISO);
    const end = parseLocalDate(endISO);

    if (!start || !end) return 0;

    return Math.round((end - start) / 86400000);
  }

  const startISO = realTrip.startDate;
  const endISO = realTrip.endDate || (
    realTrip.days && realTrip.days.length
      ? realTrip.days[realTrip.days.length - 1].dateISO
      : ''
  );

  if (!startISO || !endISO) {
    Store.showToast('Dates globales du voyage manquantes.');
    return;
  }

  const targetIndex = diffDays(startISO, nextDateISO);

  if (targetIndex < 0 || targetIndex >= realTrip.days.length) {
    Store.showToast('Choisis une date entre ' + fmtDate(startISO) + ' et ' + fmtDate(endISO) + '.');
    return;
  }

  const fromIndex = realTrip.days.findIndex(function(d) {
    return String(d.id) === String(anchorDay.id);
  });

  if (fromIndex < 0) return;
  if (fromIndex === targetIndex) return;

  try {
    await window.SB.moveTripDayInsideFixedRange(realTrip.id, fromIndex, targetIndex);

    const refreshed = await window.SB.loadTrip(realTrip.id);

    Store.set({
      trip: refreshed,
      selectedDayIndex: targetIndex
    });

    Store.showToast('Journée déplacée');
  } catch (error) {
    Store.showToast('Erreur déplacement : ' + (error.message || error));
  }
}

  // ── Drag & drop : réordonne les étapes puis sauvegarde ──
  async function handleDrop(fromIndex, toIndex) {
    if (fromIndex === toIndex || !day || !day.steps) return;
    const otherSteps = day.steps.filter(s => s.type !== 'restaurant');
    const movedStep = otherSteps[fromIndex];
    if (!movedStep) return;
    const reordered = [...otherSteps];
    reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedStep);
    const updates = reordered.map((s, i) => ({ id: s.id, stepIndex: i }));
    setReorderAlert(true);
    try {
      await window.SB.reorderSteps(updates);
      reload();
    } catch (e) { console.error('Erreur réordonnancement :', e); }
  }

  // ── Tri automatique par horaire après sauvegarde ──
  function autoSortStepsByTime() {
    if (!day || !day.steps) return;
    const otherSteps = day.steps.filter(s => s.type !== 'restaurant');
    const sorted = [...otherSteps].sort((a, b) => {
      const ta = a.time || '', tb = b.time || '';
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      return ta.localeCompare(tb);
    });
    const changed = sorted.some((s, i) => s.id !== otherSteps[i]?.id);
    if (!changed) return;
    const updates = sorted.map((s, i) => ({ id: s.id, stepIndex: i }));
    window.SB.reorderSteps(updates).then(reload).catch(() => {});
  }

  // ── Sauvegarde du titre / note du jour ──
  async function saveDayTitle() {
    if (!day || !day.id) return;
    try {
      await window.SB.updateDay(day.id, { title: dayEditor.title, note: dayEditor.note });
      setDayEditor({ open: false, title: '', note: '' });
      reload();
    } catch (e) { alert('Erreur : ' + e.message); }
  }

  React.useEffect(() => { localStorage.setItem('it_pins', JSON.stringify(pinned)); }, [pinned]);

  const C = palette(mode);
  const day = T.days[sel];
  const stt = statusOf(sel, T.todayIndex);
  const pct = Math.round((T.todayIndex + 1) / T.duration * 100);
  const [editor, setEditor] = React.useState({ open: false, dayId: null, step: null });

  // ── Drag & drop des étapes ──
  const [dragIdx, setDragIdx] = React.useState(null);
  const [dragOverIdx, setDragOverIdx] = React.useState(null);
  const [reorderAlert, setReorderAlert] = React.useState(false);

  // ── Éditeur de titre du jour ──
  const [dayEditor, setDayEditor] = React.useState({ open: false, title: '', note: '' });

    const [weather, setWeather] = React.useState(null);
  const [weatherState, setWeatherState] = React.useState('idle');
  const [restaurantSuggestions, setRestaurantSuggestions] = React.useState([]);
  const [restaurantState, setRestaurantState] = React.useState('idle');

  React.useEffect(function() {
    let alive = true;
    const coords = getDayCoords(day);

    setWeather(null);

    if (!coords || !day.dateISO) {
      setWeatherState('missing');
      return function() { alive = false; };
    }

    setWeatherState('loading');

     fetchOpenMeteoDay(coords, day.dateISO)
      .then(async function(result) {
        if (!alive) return;

        if (result) {
          setWeather(result);
          setWeatherState('ready');
          return;
        }

        const climate = await fetchOpenMeteoClimateEstimate(coords, day.dateISO);
        if (!alive) return;

        setWeather(climate);
        setWeatherState(climate ? 'climate' : 'future');
      })
      .catch(async function() {
        if (!alive) return;

        try {
          const climate = await fetchOpenMeteoClimateEstimate(coords, day.dateISO);
          if (!alive) return;
          setWeather(climate);
          setWeatherState(climate ? 'climate' : 'error');
        } catch (error) {
          if (!alive) return;
          setWeatherState('error');
        }
      });
    return function() { alive = false; };
  }, [day.id, day.dateISO, day.steps.length]);

  /* ── Auto-image du hero ── */
  const [heroImg, setHeroImg] = React.useState(null);
  React.useEffect(function() {
    setHeroImg(null); // reset pendant le chargement
    if (!day || !day.id) return;
    // Chercher dans le cache localStorage
    var cached = localStorage.getItem('hero_img_' + day.id);
    if (cached) { try { setHeroImg(JSON.parse(cached)); } catch(e){} return; }
    // Construire la requête à partir du jour
    var parts = [];
    if (day.title && day.title !== 'Journ\u00e9e libre') parts.push(day.title);
    (day.steps || []).forEach(function(st) {
      if (st.lieu) parts.push(st.lieu);
      else if (st.label) parts.push(st.label);
    });
    var q = parts.slice(0, 3).join(' ').trim();
    if (!q) return;
    fetchAutoImage(q).then(function(result) {
      if (result && result.url) {
        setHeroImg(result);
        localStorage.setItem('hero_img_' + day.id, JSON.stringify(result));
      }
    });
  }, [day.id, day.steps.length]);
  const heroHue = (d) => d.region === 'Busan' ? 28 : d.region === 'Vol' ? 220 : 168;
  const heroL = mode === 'light' ? [0.72, 0.56] : [0.58, 0.4];

  const togglePin = (id) => setPinned(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const s = {
    frame: { width: '100%', flex: 1, minHeight: 0, color: C.text, fontFamily: '"DM Sans",system-ui,sans-serif',
      position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      background: C.bgCss, transition: 'background .4s' },
    top: { height: 64, flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
      padding: '0 24px', borderBottom: `1px solid ${C.line}`, background: C.topbar },
    brand: { display: 'flex', alignItems: 'center', gap: 9, justifySelf: 'start' },
    mark: { width: 26, height: 26, borderRadius: 8, background: C.accent, display: 'grid', placeItems: 'center', color: C.accentInk },
    wordmark: { fontFamily: serif, fontStyle: 'italic', fontSize: 18, color: C.text },
    seg: { display: 'flex', background: C.inset, borderRadius: 999, padding: 3, gap: 2, border: `1px solid ${C.line}` },
    segBtn: (on) => ({ border: 'none', cursor: 'pointer', padding: '7px 18px', borderRadius: 999, fontSize: 13,
      fontWeight: 700, transition: 'all .2s', background: on ? C.accent : 'transparent', color: on ? C.accentInk : C.muted }),
    topRight: { display: 'flex', alignItems: 'center', gap: 12, justifySelf: 'end' },
    ghost: { display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${C.line}`, background: C.inset,
      color: C.text, borderRadius: 11, padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    iconBtn: { width: 38, height: 38, borderRadius: 11, border: `1px solid ${C.line}`, background: C.inset, color: C.text,
      display: 'grid', placeItems: 'center', cursor: 'pointer' },
    track: (v) => ({ display: 'flex', width: '200%', height: '100%',
      transform: v === 'itin' ? 'translateX(0)' : 'translateX(-50%)', transition: 'transform .55s cubic-bezier(.65,0,.18,1)' }),
    panel: { width: '50%', height: '100%', display: 'flex', minHeight: 0 },
    kicker: { fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: C.accent },
    spine: { width: 258, flexShrink: 0, borderRight: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column',
      minHeight: 0, background: mode === 'light' ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.12)' },
    spineHead: { padding: '16px 22px 12px', borderBottom: `1px solid ${C.line2}` },
    spineList: { flex: 1, overflow: 'hidden', padding: '8px 14px 12px', position: 'relative' },
    detail: { flex: 1, minWidth: 0, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 },
    ctx: { width: 320, flexShrink: 0, borderLeft: '1px solid var(--outline-variant)', padding: 16, display: 'flex',
      flexDirection: 'column', gap: 16, minHeight: 0, background: 'var(--bg)', overflow: 'hidden' }
  };

  /* ——— spine ——— */
  function SpineDay({ i }) {
    const d = T.days[i]; const dst = statusOf(i, T.todayIndex); const on = i === sel;
    const col = d.region === 'Busan' ? (mode === 'light' ? '#c98a3c' : '#e0a96d') : C.accent;
    const future = dst === 'future';
    return React.createElement('button', { onClick: () => setSel(i),
      style: { width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '5px 12px 5px 8px', border: 'none',
        cursor: 'pointer', borderRadius: 10, textAlign: 'left', position: 'relative', background: on ? C.card : 'transparent',
        boxShadow: on ? C.shadow : 'none', opacity: dst === 'past' && !on ? .55 : 1, transition: 'all .18s' } },
      React.createElement('div', { style: { width: 22, display: 'flex', justifyContent: 'center', flexShrink: 0, zIndex: 1 } },
        React.createElement('div', { style: { width: dst === 'today' ? 13 : 10, height: dst === 'today' ? 13 : 10, borderRadius: '50%',
          background: future ? (mode === 'light' ? '#fff' : 'transparent') : col, border: `2px solid ${future ? C.faint : col}`,
          boxShadow: dst === 'today' ? `0 0 0 4px ${C.accentSoft}` : 'none' } })),
      React.createElement('div', { style: { flex: 1, minWidth: 0 } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'baseline', gap: 7 } },
          React.createElement('span', { style: { fontFamily: serif, fontSize: 14.5, color: on ? C.accent : C.text } }, 'J' + d.n),
          React.createElement('span', { style: { fontSize: 12.5, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, d.city)),
        React.createElement('div', { style: { fontSize: 10, color: C.muted } }, `${d.weekday} ${fmtDate(d.dateISO)}`))
    );
  }

  /* ——— step card (Stitch) ——— */
   function StepCard({ s: step }) {
  const { selectedStepId } = Store.useStore();
  const isSelectedStep = selectedStepId && step.id === selectedStepId;
  var v = stepView(step);
  var toneMap = {
    transport: { accent: '#597b72', soft: 'rgba(89,123,114,.12)', label: 'Transport' },
    logement: { accent: '#9a6508', soft: 'rgba(154,101,8,.12)', label: 'Logement' },
    restaurant: { accent: '#b4843e', soft: 'rgba(180,132,62,.14)', label: 'Table' },
    activite: { accent: '#496f92', soft: 'rgba(73,111,146,.12)', label: 'Activité' },
    autre: { accent: '#827567', soft: 'rgba(130,117,103,.12)', label: 'Étape' }
  };
  var tone = toneMap[step.type] || toneMap.autre;
  var ac = tone.accent;
  var rangeParts = String(v.range || '').split('–').map(function(part) { return part.trim(); });
  var startTime = step.time || rangeParts[0] || '';
  var endTime = step.timeEnd || rangeParts[1] || '';
  if (step.type === 'logement') {
    startTime = step.timeCheckIn ? 'arr. ' + step.timeCheckIn : startTime;
    endTime = step.timeCheckOut ? 'dep. ' + step.timeCheckOut : endTime;
  }
  var hasCoords = Number.isFinite(Number(step.lat)) && Number.isFinite(Number(step.lng));
  var needsLocation = !hasCoords;

  function openStepOnMap(e) {
    e.stopPropagation();

    if (!hasCoords) {
      Store.set({
        view: 'map',
        selectedDayIndex: sel,
        mapPickMode: 'locate-step',
        mapLocateStep: {
          tripId: realTrip && realTrip.id,
          dayId: day && day.id,
          stepId: step.id || null
        }
      });
      return;
    }

    Store.set({
      view: 'map',
      selectedDayIndex: sel,
      mapFocusStepId: step.id || null
    });
  }

  function locateStep(e) {
    e.stopPropagation();

    Store.set({
      view: 'map',
      selectedDayIndex: sel,
      mapPickMode: 'locate-step',
      mapLocateStep: {
        tripId: realTrip && realTrip.id,
        dayId: day && day.id,
        stepId: step.id || null
      }
    });
  }

  return React.createElement('article', {
    onClick: function() {
      Store.set({ selectedStepId: step.id || null });
      setEditor({ open: true, dayId: day.id, step: step });
    },
    style: {
      background: 'var(--card)',
      borderRadius: 12,
      padding: '18px 20px',
      boxShadow: isSelectedStep ? '0 0 0 3px rgba(217,182,126,0.16), var(--shadow)' : 'var(--shadow)',
      border: isSelectedStep ? '1px solid var(--tan)' : '1px solid var(--outline-variant)',
      display: 'flex',
      gap: 16,
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'box-shadow .3s',
      flexShrink: 0,
      minHeight: 124
    }
  },
    React.createElement('div', {
      style: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: ac
      }
    }),

    React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 60,
        paddingTop: 2
      }
    },
      React.createElement('div', {
        style: {
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          lineHeight: '14px',
          fontWeight: 800,
          color: ac,
          textAlign: 'center'
        }
      }, startTime || '—'),
      endTime && React.createElement('div', {
        style: {
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          lineHeight: '13px',
          fontWeight: 700,
          color: 'var(--muted)',
          textAlign: 'center',
          marginTop: 3
        }
      }, endTime),
      React.createElement('div', {
        style: {
          width: 1,
          flex: 1,
          background: 'var(--outline-variant)',
          margin: '8px 0',
          minHeight: 12
        }
      }),
      React.createElement('div', { style: { color: ac } },
        React.createElement(Icon, { name: v.icon, size: 20 })
      )
    ),

    React.createElement('div', { style: { flex: 1, minWidth: 0 } },
      React.createElement('div', {
        style: {
          display: 'inline-flex',
          width: 'fit-content',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '.16em',
          textTransform: 'uppercase',
          color: ac,
          background: tone.soft,
          borderRadius: 999,
          padding: '5px 9px',
          marginBottom: 7
        }
      }, tone.label),

      step.type === 'transport' && !step.label
        ? React.createElement('div', {
            style: {
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              lineHeight: '28px',
              color: 'var(--text)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }
          },
            React.createElement('span', null, step.from),
            React.createElement(Icon, { name: 'arrowsm', size: 16, style: { color: 'var(--faint)' } }),
            React.createElement('span', null, step.to)
          )
        : React.createElement('div', {
            style: {
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              lineHeight: '28px',
              color: 'var(--text)',
              marginBottom: 8
            }
          }, v.title),

      v.sub && React.createElement('p', {
        style: {
          fontSize: 13.5,
          lineHeight: '20px',
          color: 'var(--muted)',
          marginBottom: 10
        }
      }, v.sub),

      step.note && React.createElement('p', {
        style: {
          fontSize: 13.5,
          lineHeight: '20px',
          color: 'var(--muted)',
          fontStyle: 'italic',
          marginBottom: 10
        }
      }, step.note),

      React.createElement('div', {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8
        }
      },
        v.badge && React.createElement('span', {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 6,
            background: 'var(--soft)',
            color: 'var(--muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10
          }
        },
          React.createElement(Icon, { name: 'moon', size: 12 }),
          v.badge
        ),

        step.dur && React.createElement('span', {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 6,
            background: 'var(--soft)',
            color: 'var(--muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10
          }
        },
          React.createElement(Icon, { name: 'clock', size: 12 }),
          step.dur
        ),

        v.range && v.range.indexOf('\u2013') > -1 && React.createElement('span', {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 6,
            background: 'var(--soft)',
            color: 'var(--muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10
          }
        },
          React.createElement(Icon, { name: 'clock', size: 12 }),
          v.range
        ),

        needsLocation && React.createElement('span', {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 999,
            background: C.accentSoft,
            color: C.accent,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 800
          }
        },
          React.createElement('span', { style: { fontSize: 12, lineHeight: 1 } }, '⌖'),
          'À localiser'
        ),

        React.createElement('button', {
          type: 'button',
          onClick: openStepOnMap,
          title: hasCoords ? 'Voir sur la carte' : 'Localiser cette étape',
          style: {
            border: `1px solid ${C.line}`,
            background: C.inset,
            color: C.text,
            borderRadius: 999,
            padding: '6px 10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 11,
            fontWeight: 800
          }
        },
          React.createElement('span', { style: { fontSize: 14, lineHeight: 1 } }, '⌖'),
          'Carte'
        ),

        needsLocation && React.createElement('button', {
          type: 'button',
          onClick: locateStep,
          title: 'Choisir la position de cette étape',
          style: {
            border: `1px solid ${C.line}`,
            background: C.accentSoft,
            color: C.accent,
            borderRadius: 999,
            padding: '6px 10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 11,
            fontWeight: 800
          }
        },
          React.createElement('span', { style: { fontSize: 14, lineHeight: 1 } }, '+'),
          'Localiser'
        )
      )
    )
  );
}

  /* ——— blocs épinglables ——— */
  const dayPts = (() => {
    const idxs = [Math.max(0, sel - 1), sel, Math.min(T.days.length - 1, sel + 1)].filter((v, i, a) => a.indexOf(v) === i);
    return idxs.map(i => ({ x: T.days[i].coords[0], y: T.days[i].coords[1], n: T.days[i].n, region: T.days[i].region, active: i === sel }));
  })();
  const lodging = day.steps.find(x => x.type === 'logement');
  const transport = day.steps.find(x => x.type === 'transport');

  /* ——— widget shell (Stitch) ——— */
  function BlockShell({ id, title, icon, iconColor, children, noPad }) {
    return React.createElement('div', { style: {
      background: 'var(--card)', borderRadius: 12,
      boxShadow: '0 2px 8px rgba(82,98,91,0.05)',
      border: '1px solid var(--outline-variant)',
      overflow: 'hidden', position: 'relative'
    } },
      React.createElement('div', { style: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--outline-variant)',
        background: 'var(--soft)'
      } },
        React.createElement('span', { style: {
          fontSize: 13, fontWeight: 600, lineHeight: '18px', color: 'var(--text)',
          display: 'flex', alignItems: 'center', gap: 8
        } },
          React.createElement(Icon, { name: icon, size: 16, style: { color: iconColor || 'var(--tertiary)' } }),
          title),
        editPins && React.createElement('button', { onClick: function() { togglePin(id); },
          style: { width: 22, height: 22, borderRadius: 7, border: 'none', cursor: 'pointer',
            background: 'var(--accent-soft)', color: 'var(--accent)',
            display: 'grid', placeItems: 'center', fontSize: 15, lineHeight: 1 }
        }, '\u00d7')),
      React.createElement('div', { style: noPad ? {} : { padding: 16 } }, children));
  }

  var BLOCKS = {
    map: { label: 'Carte du jour', icon: 'map', render: function() {
      return React.createElement(BlockShell, { id: 'map', title: 'Carte du jour', icon: 'map', iconColor: 'var(--tertiary)', noPad: true },
        React.createElement('div', { style: { height: 160 } },
          React.createElement(AbstractMap, { points: dayPts, theme: mode, cities: T.cities, label: day.region ? day.region.toUpperCase() : '' })));
    } },

    checklist: { label: '\u00c0 ne pas oublier', icon: 'check', render: function() {
      var items = day.todo || [];
      return React.createElement(BlockShell, { id: 'checklist', title: '\u00c0 ne pas oublier', icon: 'check', iconColor: 'var(--accent)' },
        items.length ? items.map(function(t, i) {
          var key = sel + '_' + i; var ok = done[key];
          return React.createElement('label', { key: i,
            onClick: function() { setDone(function(d) { var n = {}; for (var k in d) n[k] = d[k]; n[key] = !d[key]; return n; }); },
            style: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              padding: '7px 0', borderBottom: i < items.length - 1 ? '1px solid var(--line2)' : 'none' }
          },
            React.createElement('div', { style: {
              width: 20, height: 20, borderRadius: 4, flexShrink: 0,
              border: ok ? 'none' : '1.5px solid var(--outline)',
              background: ok ? 'var(--accent)' : 'var(--card)',
              display: 'grid', placeItems: 'center'
            } },
              ok && React.createElement(Icon, { name: 'check', size: 14, sw: 2.4, style: { color: '#fff' } })),
            React.createElement('span', { style: {
              fontSize: 13.5, lineHeight: '20px',
              color: ok ? 'var(--faint)' : 'var(--text)',
              textDecoration: ok ? 'line-through' : 'none',
              opacity: ok ? 0.7 : 1
            } }, t));
        }) : React.createElement('div', { style: { fontSize: 13, color: 'var(--faint)', fontStyle: 'italic' } }, 'Rien \u00e0 pr\u00e9parer.'));
    } },

    note: { label: 'Journal du jour', icon: 'sparkle', render: function() {
      return React.createElement('div', { style: {
        background: 'var(--soft)', borderRadius: 12,
        boxShadow: '0 2px 8px rgba(82,98,91,0.05)',
        border: '1px solid rgba(217,182,126,0.3)',
        padding: 16, position: 'relative', overflow: 'hidden'
      } },
        React.createElement('div', { style: { position: 'absolute', top: 0, right: 0, width: 32, height: 32, background: 'rgba(217,182,126,0.1)', borderRadius: '0 0 0 12px' } }),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } },
          React.createElement('span', { style: { fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 } },
            React.createElement(Icon, { name: 'sparkle', size: 16, style: { color: 'var(--tan)' } }), 'Journal du jour'),
          editPins && React.createElement('button', { onClick: function() { togglePin('note'); },
            style: { width: 22, height: 22, borderRadius: 7, border: 'none', cursor: 'pointer',
              background: 'var(--accent-soft)', color: 'var(--accent)',
              display: 'grid', placeItems: 'center', fontSize: 15, lineHeight: 1 }
          }, '\u00d7')),
        day.note
          ? React.createElement('div', { style: { fontSize: 13.5, lineHeight: '20px', color: 'var(--muted)', fontStyle: 'italic' } }, day.note)
          : React.createElement('div', { style: { fontSize: 13, color: 'var(--faint)', fontStyle: 'italic' } }, 'Aucune note pour ce jour.'));
    } },

    people: { label: 'Voyageurs', icon: 'users', render: function() {
      return React.createElement(BlockShell, { id: 'people', title: 'Voyageurs', icon: 'users', iconColor: 'var(--tertiary)' },
        React.createElement(Avatars, { people: T.participants, size: 34, dark: mode === 'light' }));
    } },

    stats: { label: 'Rep\u00e8res du jour', icon: 'route', render: function() {
      return React.createElement(BlockShell, { id: 'stats', title: 'Rep\u00e8res du jour', icon: 'route', iconColor: 'var(--accent)' },
        React.createElement('div', { style: { display: 'flex', gap: 10 } },
          React.createElement('div', { style: { flex: 1, background: 'var(--inset)', borderRadius: 10, padding: '10px 12px' } },
            React.createElement('div', { style: { fontFamily: 'var(--font-serif)', fontSize: 24, lineHeight: 1 } }, day.steps.length),
            React.createElement('div', { style: { fontSize: 10.5, color: 'var(--muted)', marginTop: 3 } }, day.steps.length > 1 ? '\u00e9tapes' : '\u00e9tape')),
          React.createElement('div', { style: { flex: 1, background: 'var(--inset)', borderRadius: 10, padding: '10px 12px' } },
            React.createElement('div', { style: { fontFamily: 'var(--font-serif)', fontSize: 24, lineHeight: 1 } }, transport ? '1' : '0'),
            React.createElement('div', { style: { fontSize: 10.5, color: 'var(--muted)', marginTop: 3 } }, 'transport')),
          React.createElement('div', { style: { flex: 1, background: 'var(--inset)', borderRadius: 10, padding: '10px 12px' } },
            React.createElement('div', { style: { fontFamily: 'var(--font-serif)', fontSize: 24, lineHeight: 1 } }, lodging ? lodging.nights : '\u2014'),
            React.createElement('div', { style: { fontSize: 10.5, color: 'var(--muted)', marginTop: 3 } }, 'nuits'))));
    } }
  };
  var ORDER = ['map', 'checklist', 'note', 'stats', 'people'];

  /* ——— Synthèse refondue ——— */
  function Synthese() {
    const allPts = T.days.map((d, i) => ({ x: d.coords[0], y: d.coords[1], n: d.n, region: d.region, active: i === T.todayIndex }));
    const ws = {
      wrap: { flex: 1, padding: '30px 40px 26px', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' },
      grid: { display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 24, flex: 1, minHeight: 0, marginTop: 22 }
    };
    const metric = (k, l, sub) => React.createElement('div', { style: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '13px 15px', boxShadow: C.shadow } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'baseline', gap: 5 } },
        React.createElement('span', { style: { fontFamily: serif, fontSize: 30, lineHeight: 1 } }, k),
        sub && React.createElement('span', { style: { fontSize: 12, color: C.muted } }, sub)),
      React.createElement('div', { style: { fontSize: 11.5, color: C.muted, marginTop: 6 } }, l));
    return React.createElement('div', { style: ws.wrap },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 } },
        React.createElement('div', null,
          React.createElement('div', { style: s.kicker }, 'Synthèse du voyage'),
          React.createElement('div', { style: { fontFamily: serif, fontStyle: 'italic', fontSize: 37, lineHeight: 1.05, marginTop: 6 } }, 'La Corée,'),
          React.createElement('div', { style: { fontFamily: serif, fontStyle: 'italic', fontSize: 37, lineHeight: 1.05, color: C.accent, whiteSpace: 'nowrap' } }, 'd’un seul regard.')),
        React.createElement('div', { style: { textAlign: 'right' } },
          React.createElement(Avatars, { people: T.participants, size: 36, dark: mode === 'light' }),
          React.createElement('div', { style: { fontSize: 12, color: C.muted, marginTop: 8 } }, '1 → 15 octobre · 14 nuits'))),
      React.createElement('div', { style: ws.grid },
        /* gauche : carte + métriques */
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 } },
          React.createElement('div', { style: { flex: 1, minHeight: 0 } },
            React.createElement(AbstractMap, { points: allPts, theme: mode, big: true, cities: T.cities, label: 'SÉOUL · BUSAN · SÉOUL' })),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 11 } },
            metric('15', 'jours de voyage'),
            metric('2', 'villes'),
            metric('4', 'trajets longs'),
            metric('27', 'étapes', null))),
        /* droite : itinéraire en chapitres + timeline */
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 } },
          React.createElement('div', { style: { ...s.kicker, color: C.faint } }, 'L’itinéraire en trois temps'),
          T.chapters.map((c, i) => React.createElement('div', { key: c.id, style: { display: 'flex', gap: 13, background: C.card, border: `1px solid ${C.line}`, borderRadius: 15, padding: 13, flex: 1, boxShadow: C.shadow } },
            React.createElement('div', { style: { width: 64, flexShrink: 0, borderRadius: 11, position: 'relative', overflow: 'hidden', background: heroGrad(c.hue, mode === 'light') } },
              React.createElement('image-slot', { id: 'koreachapter-' + c.id, shape: 'rect', placeholder: '', style: { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' } }),
              React.createElement('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,.55))' } }),
              React.createElement('div', { style: { position: 'absolute', left: 0, right: 0, bottom: 7, textAlign: 'center', color: '#fff', fontSize: 10.5, fontWeight: 700, pointerEvents: 'none', textShadow: '0 1px 4px rgba(0,0,0,.5)' } }, c.days.replace(/\s/g, ''))),
            React.createElement('div', { style: { flex: 1, minWidth: 0 } },
              React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' } },
                React.createElement('span', { style: { fontFamily: serif, fontStyle: 'italic', fontSize: 19 } }, c.city),
                React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.muted, fontWeight: 600 } }, React.createElement(Icon, { name: 'moon', size: 11 }), c.nights)),
              React.createElement('div', { style: { fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.45 } }, c.blurb),
              React.createElement('div', { style: { display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, fontWeight: 700, color: C.accent } },
                React.createElement(Icon, { name: c.link.mode, size: 13 }), c.link.text))))) ),
      React.createElement('div', { style: { marginTop: 16, paddingTop: 15, borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 16 } },
        React.createElement('div', { style: { flex: 1, display: 'flex', gap: 4 } },
          T.days.map((d, i) => React.createElement('div', { key: i, title: 'J' + d.n, style: { flex: 1, height: 8, borderRadius: 3, background: i <= T.todayIndex ? C.accent : (mode === 'light' ? 'rgba(45,73,63,.14)' : 'rgba(255,255,255,.12)'), outline: i === T.todayIndex ? `2px solid ${C.accent}` : 'none', outlineOffset: 2 } }))),
        React.createElement('div', { style: { fontSize: 12.5, color: C.muted, whiteSpace: 'nowrap' } }, React.createElement('b', { style: { color: C.text } }, `J${T.todayIndex + 1} / ${T.duration}`), ` · ${pct} %`),
        React.createElement('button', { onClick: () => setView('itin'), style: { ...s.ghost, background: C.accent, color: C.accentInk, border: 'none', fontWeight: 700 } },
          'Ouvrir l’itinéraire', React.createElement(Icon, { name: 'arrow', size: 15 })))
    );
  }

  function MapOverlay() {
    const pts = T.days.map((d, i) => ({ x: d.coords[0], y: d.coords[1], n: d.n, region: d.region, active: i === sel }));
    return React.createElement('div', { onClick: () => setMapOpen(false), style: { position: 'absolute', inset: 0, zIndex: 40, background: mode === 'light' ? 'rgba(31,46,40,.3)' : 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', padding: 40 } },
      React.createElement('div', { onClick: (e) => e.stopPropagation(), style: { width: '100%', maxWidth: 940, background: C.card, borderRadius: 22, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,.45)', border: `1px solid ${C.line}` } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: `1px solid ${C.line}` } },
          React.createElement('div', null,
            React.createElement('div', { style: s.kicker }, 'Carte du voyage'),
            React.createElement('div', { style: { fontFamily: serif, fontStyle: 'italic', fontSize: 22, marginTop: 2 } }, 'Séoul → Busan → Séoul')),
          React.createElement('button', { onClick: () => setMapOpen(false), style: s.ghost }, 'Fermer')),
        React.createElement('div', { style: { padding: 22, height: 480 } }, React.createElement(AbstractMap, { points: pts, theme: mode, big: true, cities: T.cities, label: 'ITINÉRAIRE COMPLET · 15 ÉTAPES' })))
    );
  }

  const pillTxt = stt === 'today' ? "Aujourd'hui" : stt === 'past' ? 'Passé' : 'À venir';
  const pillCol = stt === 'today' ? C.accent : stt === 'past' ? C.faint : C.muted;
  const unpinned = ORDER.filter(id => !pinned.includes(id));
    const mealSteps = (day.steps || []).filter(function(step) {
    return step.type === 'restaurant' || step.type === 'table';
  });

  const otherSteps = (day.steps || []).filter(function(step) {
    return step.type !== 'restaurant' && step.type !== 'table';
  });

  function MealRail() {
        async function findRestaurantsAroundDay() {
      const coords = getDayCoords(day);

      if (!coords) {
        setRestaurantState('missing');
        setRestaurantSuggestions([]);
        return;
      }

      setRestaurantState('loading');

      try {
        const results = await searchNearbyRestaurants(coords);
        setRestaurantSuggestions(results);
        setRestaurantState(results.length ? 'ready' : 'empty');
      } catch (error) {
        setRestaurantSuggestions([]);
        setRestaurantState('error');
      }
    }
    return React.createElement('aside', {
      style: {
        minWidth: 0,
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: 'rgba(255,255,255,.42)',
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: 16,
        overflow: 'hidden'
      }
    },
      React.createElement('div', {
        style: {
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }
      },
        React.createElement('div', null,
          React.createElement('div', { style: s.kicker }, 'Tables & pauses'),
          React.createElement('div', {
            style: {
              fontFamily: serif,
              fontSize: 22,
              lineHeight: '28px',
              color: C.text,
              marginTop: 4
            }
          }, 'Où manger ?')
        ),
                React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }
        },
          React.createElement('button', {
            type: 'button',
            onClick: findRestaurantsAroundDay,
            title: 'Chercher des restaurants autour',
            style: {
              height: 38,
              padding: '0 13px',
              borderRadius: 999,
              border: `1px solid ${C.line}`,
              background: C.inset,
              color: C.text,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 800
            }
          },
            restaurantState === 'loading' ? '…' : 'Autour'
          ),
          React.createElement('button', {
            type: 'button',
            onClick: function() {
              setEditor({ open: true, dayId: day.id, step: { type: 'restaurant' } });
            },
            style: {
              width: 38,
              height: 38,
              borderRadius: 999,
              border: `1px solid ${C.line}`,
              background: C.accent,
              color: C.accentInk,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer'
            }
          }, React.createElement(Icon, { name: 'plus', size: 16 }))
        )
      ),

       React.createElement('div', {
        style: {
          flex: '1 1 0',
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          paddingRight: 4
        }
      },
        mealSteps.length ? mealSteps.map(function(step, k) {
          var v = stepView(step);
          return React.createElement('button', {
            key: step.id || k,
            type: 'button',
            onClick: function() {
              Store.set({ selectedStepId: step.id || null });
              setEditor({ open: true, dayId: day.id, step: step });
            },
            style: {
              width: '100%',
              textAlign: 'left',
              border: `1px solid ${C.line}`,
              background: C.card,
              color: C.text,
              borderRadius: 13,
              padding: 14,
              cursor: 'pointer',
              boxShadow: C.shadow,
              fontFamily: 'inherit'
            }
          },
            React.createElement('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                marginBottom: 8
              }
            },
              React.createElement('span', {
                style: {
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  color: C.accent
                }
              }, v.kind || 'Table'),
              React.createElement('span', {
                style: {
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: C.muted
                }
              }, v.range || step.time || '')
            ),
            React.createElement('div', {
              style: {
                fontFamily: serif,
                fontSize: 18,
                lineHeight: '23px',
                color: C.text,
                marginBottom: 6
              }
            }, v.title || step.label || 'Adresse à choisir'),
            React.createElement('div', {
              style: {
                fontSize: 12.5,
                lineHeight: '18px',
                color: C.muted,
                marginBottom: 10
              }
            }, v.sub || step.lieu || step.place || 'Aucun lieu renseigné'),

            React.createElement('button', {
              type: 'button',
              onClick: function(e) {
                e.stopPropagation();
                Store.set({ selectedStepId: step.id || null });
                Store.showToast('Étape envoyée dans la toolbox');
              },
              style: {
                border: `1px solid ${C.line}`,
                background: C.accentSoft,
                color: C.accent,
                borderRadius: 999,
                padding: '6px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11,
                fontWeight: 800
              }
            },
              React.createElement(Icon, { name: 'sparkle', size: 13 }),
              'Autour'
            )
          );
        }) : React.createElement('div', {
          style: {
            border: `1px dashed ${C.line}`,
            borderRadius: 14,
            padding: 16,
            color: C.muted,
            fontSize: 13,
            lineHeight: '19px',
            background: C.inset
          }
        }, 'Aucune table prévue pour ce jour.')
      ),

      React.createElement('section', {
        style: {
          flex: '1 1 0',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          borderTop: `1px solid ${C.line}`,
          paddingTop: 16,
          overflow: 'hidden'
        }
      },
        React.createElement('div', {
          style: {
            flexShrink: 0,
            marginBottom: 12
          }
        },
          React.createElement('div', { style: s.kicker }, 'Météo'),
          React.createElement('div', {
            style: {
              fontFamily: serif,
              fontSize: 22,
              lineHeight: '28px',
              color: C.text,
              marginTop: 4
            }
          }, weatherState === 'climate' ? 'Tendance saisonnière' : 'Prévoir la journée')
        ),

                React.createElement('div', {
          style: {
            flex: 1,
            minHeight: 0,
            border: `1px solid ${C.line}`,
            background: C.card,
            borderRadius: 14,
            padding: 16,
            boxShadow: C.shadow,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16
          }
        },
          React.createElement('div', null,
            React.createElement('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 10
              }
            },
              React.createElement('div', {
                style: {
                  fontFamily: serif,
                  fontSize: 32,
                  lineHeight: '34px',
                  color: C.text
                }
              }, weather ? weather.tempMax + '°' : '—°'),
              React.createElement('button', {
                type: 'button',
                title: 'Ouvrir la météo détaillée',
                onClick: function() {
                  window.open(weatherExternalUrl(getDayCoords(day)), '_blank', 'noopener,noreferrer');
                },
                style: {
                  width: 46,
                  height: 46,
                  borderRadius: 999,
                  border: `1px solid ${C.line}`,
                  background: C.accentSoft,
                  color: C.accent,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer'
                }
              }, React.createElement(Icon, { name: 'map', size: 21 }))
            ),
            React.createElement('div', {
              style: {
                fontSize: 13.5,
                lineHeight: '20px',
                color: C.muted
              }
            },
              weatherState === 'loading' ? 'Chargement de la météo…' :
              weatherState === 'missing' ? 'Localisez une étape du jour pour afficher la météo.' :
              weatherState === 'climate' ? 'Prévision réelle disponible 16 jours avant. En attendant : tendance saisonnière.' :
              weatherState === 'future' ? 'La météo précise sera disponible 16 jours avant cette date.' :
              weatherState === 'error' ? 'Météo indisponible pour le moment.' :
              weather ? weather.label + ' · min. ' + weather.tempMin + '°' :
              'Météo non disponible.'
            )
          ),

          React.createElement('div', {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8
            }
          },
            React.createElement('div', {
              style: {
                background: C.inset,
                borderRadius: 10,
                padding: '10px 8px'
              }
            },
              React.createElement('div', { style: { fontSize: 10, color: C.faint, marginBottom: 4 } }, 'Pluie'),
              React.createElement('div', { style: { fontWeight: 800, color: C.text } }, weather ? weather.precipitation + ' mm' : '—')
            ),
            React.createElement('div', {
              style: {
                background: C.inset,
                borderRadius: 10,
                padding: '10px 8px'
              }
            },
              React.createElement('div', { style: { fontSize: 10, color: C.faint, marginBottom: 4 } }, 'Vent'),
              React.createElement('div', { style: { fontWeight: 800, color: C.text } }, weather ? weather.wind + ' km/h' : '—')
            ),
            React.createElement('div', {
              style: {
                background: C.inset,
                borderRadius: 10,
                padding: '10px 8px'
              }
            },
              React.createElement('div', { style: { fontSize: 10, color: C.faint, marginBottom: 4 } }, 'Conseil'),
              React.createElement('div', { style: { fontWeight: 800, color: C.text } }, weatherAdvice(weather))
            )
          )
        )
      )
    );
  }

  return React.createElement('div', { style: { flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', position: 'relative' } },
    React.createElement('style', null, '@keyframes itdash{to{stroke-dashoffset:-160}} .it-journey{animation:itdash 9s linear infinite}'),

    /* COLONNE CENTRALE */
    React.createElement('div', { style: { ...s.detail, overflowY: 'auto' } },
      React.createElement('div', { key: 'hero' + day.n, style: {
        position: 'relative', height: 320,
        margin: '-20px -24px 24px', borderRadius: '0 0 16px 16px',
        overflow: 'hidden', flexShrink: 0,
        background: heroGrad(heroHue(day), mode === 'light'),
        boxShadow: 'var(--shadow-lg)'
      } },
        heroImg && React.createElement('div', { style: { position: 'absolute', inset: 0, backgroundImage: 'url(' + heroImg.url + ')', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0, transition: 'opacity .6s', opacity: 1 } }),
        React.createElement('image-slot', { id: 'koreahero-day-' + day.n, shape: 'rect', placeholder: !heroImg ? 'Photo du jour' : '', style: { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 1 } }),
        React.createElement('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to top, rgba(21,48,42,0.9) 0%, rgba(21,48,42,0.4) 40%, transparent 100%)' } }),
        React.createElement('div', { style: { position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '0 24px', color: '#fff', zIndex: 5 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } },
            React.createElement('span', { style: { display: 'inline-block', padding: '5px 14px', background: 'rgba(254,249,239,0.2)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 999, border: '1px solid rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#fff' } }, 'Jour ' + day.n),
            React.createElement('label', {
  title: 'Modifier la date de cette journée',
  style: {
    position: 'relative',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 8px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.16)'
  }
},
  itHeaderDateLabel(day.dateISO, day.weekday),
  React.createElement('span', {
    style: {
      opacity: 0.75,
      fontSize: 10
    }
  }, '✎'),
  React.createElement('input', {
    type: 'date',
    value: day.dateISO || '',
    min: realTrip.startDate || undefined,
    max: realTrip.endDate || undefined,
    onChange: function(e) {
      moveDayToDateInsideTrip(day, e.target.value);
    },
    style: {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  cursor: 'pointer',
  display: 'block',
  appearance: 'none',
  WebkitAppearance: 'none'
}
  })
)),
          React.createElement('h2', { style: { fontFamily: 'var(--font-serif)', fontSize: 40, lineHeight: '48px', color: '#fff', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 14 } },
            day.title,
            React.createElement('button', {
              onClick: function(e) {
                e.stopPropagation();
                setDayEditor({ open: true, title: day.title || '', note: day.note || '' });
              },
              title: 'Modifier le titre du jour',
              style: {
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                color: '#fff', cursor: 'pointer', flexShrink: 0, transition: 'all .2s'
              }
            }, React.createElement(Icon, { name: 'sparkle', size: 16 }))
          ),
          day.note && React.createElement('p', { style: { fontSize: 13.5, lineHeight: '20px', color: 'rgba(255,255,255,0.8)', maxWidth: 640, borderLeft: '2px solid var(--tan)', paddingLeft: 16, marginBottom: 24 } }, day.note),
          !day.note && React.createElement('div', { style: { marginBottom: 24 } }))),
        heroImg && heroImg.credit && React.createElement('a', { href: heroImg.link, target: '_blank', rel: 'noopener', style: { position: 'absolute', bottom: 8, right: 12, fontSize: 10, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', zIndex: 5 } }, '\u00a9 ' + heroImg.credit),
      
            React.createElement('div', {
        style: {
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)',
          gap: 16,
          overflow: 'hidden'
        }
      },
        React.createElement('section', {
          style: {
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 11,
            overflow: 'hidden'
          }
        },
          React.createElement('div', {
            style: {
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 11,
              paddingRight: 6
            }
          },
            // ── Alerte horaires après drag & drop ──
            reorderAlert && React.createElement('div', {
              style: {
                padding: '12px 16px',
                background: 'rgba(180,132,62,.12)',
                border: '1px solid rgba(180,132,62,.3)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 13,
                color: C.text,
                lineHeight: '18px',
                flexShrink: 0
              }
            },
              React.createElement('span', { style: { fontSize: 18, flexShrink: 0 } }, '\u26a0\ufe0f'),
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('div', { style: { fontWeight: 700, marginBottom: 2 } }, '\u00c9tapes r\u00e9organis\u00e9es'),
                React.createElement('div', { style: { color: C.muted, fontSize: 12 } }, 'Les horaires peuvent ne plus \u00eatre coh\u00e9rents. V\u00e9rifiez et ajustez si besoin.')
              ),
              React.createElement('button', {
                onClick: function() { setReorderAlert(false); },
                style: {
                  border: '1px solid ' + C.line, background: C.card, color: C.text,
                  borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 700, flexShrink: 0
                }
              }, 'Compris')
            ),
            otherSteps.map(function(step, k) {
              return React.createElement('div', {
                key: step.id || k,
                draggable: true,
                onDragStart: function(e) {
                  setDragIdx(k);
                  e.dataTransfer.effectAllowed = 'move';
                  e.currentTarget.style.opacity = '0.5';
                },
                onDragEnd: function(e) {
                  e.currentTarget.style.opacity = '1';
                  if (dragOverIdx !== null && dragIdx !== null && dragIdx !== dragOverIdx) {
                    handleDrop(dragIdx, dragOverIdx);
                  }
                  setDragIdx(null);
                  setDragOverIdx(null);
                },
                onDragOver: function(e) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverIdx(k);
                },
                onDragLeave: function() { setDragOverIdx(null); },
                style: {
                  position: 'relative',
                  transition: 'transform .15s',
                  transform: dragOverIdx === k ? 'translateY(4px)' : 'none',
                  borderTop: dragOverIdx === k && dragIdx !== null && dragIdx !== k ? '3px solid ' + C.accent : '3px solid transparent',
                  cursor: 'grab'
                }
              },
                React.createElement(StepCard, { s: step })
              );
            })
          ),
          React.createElement('button', {
            onClick: function() { setEditor({ open: true, dayId: day.id, step: null }); },
            style: {
              flexShrink: 0,
              width: '100%',
              padding: '15px 0',
              borderRadius: 12,
              border: '2px dashed var(--outline-variant)',
              background: 'rgba(254,249,239,0.5)',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 700,
              transition: 'all .2s'
            }
          }, React.createElement(Icon, { name: 'plus', size: 16 }), 'Ajouter une étape')
        ),

        React.createElement(MealRail, null)
      )
    ),

        mapOpen && React.createElement(MapOverlay, null),
    React.createElement(StepEditor, {
      open: editor.open,
      tripId: realTrip && realTrip.id,
      dayId: editor.dayId,
      step: editor.step,
      stepCount: day.steps.length,
      onClose: function() { setEditor({ open: false, dayId: null, step: null }); },
      onSaved: function() {
        reload();
        setTimeout(autoSortStepsByTime, 600);
      }
    }),

    // ── Modale d'édition du titre / note du jour ──
    dayEditor.open && ReactDOM.createPortal(
      React.createElement('div', {
        onClick: function() { setDayEditor({ open: false, title: '', note: '' }); },
        style: {
          position: 'fixed', inset: 0, zIndex: 300,
          background: mode === 'light' ? 'rgba(31,46,40,.34)' : 'rgba(0,0,0,.55)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '100px 24px 24px'
        }
      },
        React.createElement('div', {
          onClick: function(e) { e.stopPropagation(); },
          style: {
            width: '100%', maxWidth: 440,
            background: C.card, border: '1px solid ' + C.line,
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 40px 90px rgba(0,0,0,.4)'
          }
        },
          React.createElement('div', {
            style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid ' + C.line }
          },
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: C.accent } }, 'Jour ' + day.n),
              React.createElement('div', { style: { fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: C.text, marginTop: 2 } }, 'Modifier la journ\u00e9e')
            ),
            React.createElement('button', {
              onClick: function() { setDayEditor({ open: false, title: '', note: '' }); },
              style: { border: 'none', background: 'transparent', color: C.muted, cursor: 'pointer', padding: 6, borderRadius: 8 }
            }, React.createElement(Icon, { name: 'x', size: 20 }))
          ),
          React.createElement('div', { style: { padding: 20 } },
            React.createElement('div', { style: { marginBottom: 12 } },
              React.createElement('label', { style: { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 } }, 'Titre du jour'),
              React.createElement('input', {
                value: dayEditor.title,
                onChange: function(e) { setDayEditor(function(prev) { return { ...prev, title: e.target.value }; }); },
                placeholder: 'Ex : Journ\u00e9e libre, S\u00e9oul historique\u2026',
                style: { width: '100%', padding: '10px 12px', border: '1px solid ' + C.line, borderRadius: 11, background: C.inset, color: C.text, fontFamily: 'inherit', fontSize: 14, outline: 'none' }
              })
            ),
            React.createElement('div', { style: { marginBottom: 12 } },
              React.createElement('label', { style: { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 } }, 'Note (optionnel)'),
              React.createElement('textarea', {
                value: dayEditor.note,
                onChange: function(e) { setDayEditor(function(prev) { return { ...prev, note: e.target.value }; }); },
                placeholder: 'Notes pour cette journ\u00e9e\u2026',
                style: { width: '100%', padding: '10px 12px', border: '1px solid ' + C.line, borderRadius: 11, background: C.inset, color: C.text, fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 70 }
              })
            )
          ),
          React.createElement('div', {
            style: { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid ' + C.line }
          },
            React.createElement('button', {
              onClick: function() { setDayEditor({ open: false, title: '', note: '' }); },
              style: { border: '1px solid ' + C.line, background: C.inset, color: C.text, borderRadius: 11, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
            }, 'Annuler'),
            React.createElement('button', {
              onClick: saveDayTitle,
              style: { border: 'none', background: C.accent, color: C.accentInk, borderRadius: 11, padding: '9px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
            }, 'Enregistrer')
          )
        )
      ),
      document.body
    )
  );
}
window.AtelierV2 = AtelierV2;
