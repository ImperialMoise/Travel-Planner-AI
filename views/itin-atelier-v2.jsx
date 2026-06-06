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
    dateStart: '', dateEnd: '', timeCheckIn: '15:00', timeCheckOut: '11:00',
    dureeEstimee: '', link: '', note: ''
  };
  const [f, setF] = React.useState(blank);
  const [busy, setBusy] = React.useState(false);
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  React.useEffect(() => {
    if (!open) return;
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
        Object.assign(p, { transportType: f.transportType, depart: f.depart, arrivee: f.arrivee, timeEnd: f.timeEnd, nextDay: f.nextDay, duree, ref: f.ref });
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

  async function handleDelete() {
    if (!step || !step.id) return;
    if (!window.confirm('Supprimer cette étape définitivement ?')) return;
    setBusy(true);
    try {
      await window.SB.deleteStep(step.id);
      onSaved && onSaved();
      onClose();
    } catch (e) {
      alert('Erreur : ' + e.message);
    } finally {
      setBusy(false);
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: theme === 'light' ? 'rgba(31,46,40,.34)' : 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,.4)' }}>

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
            {field('Mode de transport', <select style={inp} value={f.transportType} onChange={e => set('transportType', e.target.value)}>{TRANSPORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>)}
            {twoCol(
              field('Départ', <LocationInput style={inp} value={f.depart} onChange={v => set('depart', v)} placeholder="Ville, gare…" />),
              field('Heure départ', <input type="time" style={inp} value={f.time} onChange={e => set('time', e.target.value)} />)
            )}
            {twoCol(
              field('Arrivée', <LocationInput style={inp} value={f.arrivee} onChange={v => set('arrivee', v)} placeholder="Ville, aéroport…" />),
              field('Heure arrivée', <input type="time" style={inp} value={f.timeEnd} onChange={e => set('timeEnd', e.target.value)} />)
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: C.muted, cursor: 'pointer' }}><input type="checkbox" checked={f.nextDay} onChange={e => set('nextDay', e.target.checked)} style={{ accentColor: C.accent }} />Arrivée le lendemain</label>
              {duree && <span style={badge}><Icon name="clock" size={12} />{duree}</span>}
            </div>
            {twoCol(
              field('Référence', <input style={inp} value={f.ref} onChange={e => set('ref', e.target.value)} placeholder="TGV 6601…" />),
              field('Titre (option.)', <input style={inp} value={f.label} onChange={e => set('label', e.target.value)} placeholder="Paris → Lyon" />)
            )}
          </>}

          {f.type === 'logement' && <>
            {field('Nom du logement', <input style={inp} value={f.label} onChange={e => set('label', e.target.value)} placeholder="Hôtel Le Bristol…" />)}
            {field('Adresse / lieu', <LocationInput style={inp} value={f.lieu} onChange={v => set('lieu', v)} placeholder="Adresse, ville…" />)}
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
            {field('Adresse / lieu', <LocationInput style={inp} value={f.lieu} onChange={v => set('lieu', v)} placeholder="Adresse, quartier…" />)}
            {field('Heure', <input type="time" style={inp} value={f.time} onChange={e => set('time', e.target.value)} />)}
          </>}

          {f.type === 'activite' && <>
            {field('Nom', <input style={inp} value={f.label} onChange={e => set('label', e.target.value)} placeholder="Musée d’Orsay…" />)}
            {field('Lieu', <LocationInput style={inp} value={f.lieu} onChange={v => set('lieu', v)} placeholder="Adresse, ville…" />)}
            {twoCol(
              field('Heure', <input type="time" style={inp} value={f.time} onChange={e => set('time', e.target.value)} />),
              field('Durée estimée', <input style={inp} value={f.dureeEstimee} onChange={e => set('dureeEstimee', e.target.value)} placeholder="2h, 45 min…" />)
            )}
          </>}

          {f.type === 'autre' && <>
            {field('Titre', <input style={inp} value={f.label} onChange={e => set('label', e.target.value)} placeholder="Titre de l’étape" />)}
            {field('Lieu (option.)', <LocationInput style={inp} value={f.lieu} onChange={v => set('lieu', v)} placeholder="Lieu…" />)}
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
      </div>
    </div>,
    document.body
  );
}

window.StepEditor = StepEditor;

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
        title: d.title || 'Journée libre',
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
          dur: s.dureeEstimee || s.duree,
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
  const [editor, setEditor] = React.useState({ open: false, dayId: null, step: null });
  const reload = () => { if (realTrip) window.SB.loadTrip(realTrip.id).then(t => Store.set({ trip: t })).catch(() => {}); };

  React.useEffect(() => { localStorage.setItem('it_pins', JSON.stringify(pinned)); }, [pinned]);

  const C = palette(mode);
  const day = T.days[sel];
  const stt = statusOf(sel, T.todayIndex);
  const pct = Math.round((T.todayIndex + 1) / T.duration * 100);
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
    ctx: { width: 304, flexShrink: 0, borderLeft: `1px solid ${C.line}`, padding: '18px 20px', display: 'flex',
      flexDirection: 'column', gap: 13, minHeight: 0, background: mode === 'light' ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.08)', overflow: 'hidden' }
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

  /* ——— step card ——— */
  function StepCard({ s: step }) {
    const v = stepView(step);
    return React.createElement('div', { onClick: () => setEditor({ open: true, dayId: day.id, step }), title: 'Modifier cette étape', style: { display: 'flex', gap: 14, padding: 14, borderRadius: 14, background: C.inset, border: `1px solid ${C.line2}`, cursor: 'pointer' } },
      React.createElement('div', { style: { width: 58, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' } },
        React.createElement('div', { style: { fontFamily: mono, fontSize: 12, color: C.text, background: C.soft, borderRadius: 8, padding: '4px 7px', whiteSpace: 'nowrap' } }, (v.range || '—').split('–')[0]),
        React.createElement('div', { style: { width: 36, height: 36, borderRadius: 10, background: C.accentSoft, color: C.accent, display: 'grid', placeItems: 'center' } },
          React.createElement(Icon, { name: v.icon, size: 18 }))),
      React.createElement('div', { style: { flex: 1, minWidth: 0 } },
        React.createElement('div', { style: { fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: C.accent } }, v.kind),
        step.type === 'transport' && !step.label
          ? React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 15.5, fontWeight: 700, marginTop: 3, color: C.text } },
              React.createElement('span', null, step.from), React.createElement(Icon, { name: 'arrowsm', size: 16, style: { color: C.faint } }), React.createElement('span', null, step.to))
          : React.createElement('div', { style: { fontSize: 15.5, fontWeight: 700, marginTop: 3, color: C.text } }, v.title),
        v.sub && React.createElement('div', { style: { fontSize: 12.5, color: C.muted, marginTop: 3 } }, v.sub),
        step.note && React.createElement('div', { style: { fontSize: 12, color: C.faint, marginTop: 5, fontStyle: 'italic' } }, step.note)),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 } },
        v.badge && React.createElement('div', { style: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: C.accent, background: C.accentSoft, borderRadius: 999, padding: '4px 9px' } }, React.createElement(Icon, { name: 'moon', size: 11 }), v.badge),
        v.range && v.range.includes('–') && React.createElement('div', { style: { fontFamily: mono, fontSize: 11, color: C.muted } }, v.range.split('–')[1]))
    );
  }

  /* ——— blocs épinglables ——— */
  const dayPts = (() => {
    const idxs = [Math.max(0, sel - 1), sel, Math.min(T.days.length - 1, sel + 1)].filter((v, i, a) => a.indexOf(v) === i);
    return idxs.map(i => ({ x: T.days[i].coords[0], y: T.days[i].coords[1], n: T.days[i].n, region: T.days[i].region, active: i === sel }));
  })();
  const lodging = day.steps.find(x => x.type === 'logement');
  const transport = day.steps.find(x => x.type === 'transport');

  function BlockShell({ id, title, icon, children, pad = 15 }) {
    return React.createElement('div', { style: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: C.shadow } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px 0' } },
        React.createElement(Icon, { name: icon, size: 13, style: { color: C.faint } }),
        React.createElement('div', { style: { flex: 1, fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: C.faint } }, title),
        editPins && React.createElement('button', { onClick: () => togglePin(id), title: 'Détacher',
          style: { width: 22, height: 22, borderRadius: 7, border: 'none', cursor: 'pointer', background: C.accentSoft, color: C.accent, display: 'grid', placeItems: 'center', fontSize: 15, lineHeight: 1 } }, '×')),
      React.createElement('div', { style: { padding: pad } }, children));
  }

  const BLOCKS = {
    map: { label: 'Aperçu géographique', icon: 'map', render: () => React.createElement('div', { style: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden', boxShadow: C.shadow, position: 'relative' } },
      editPins && React.createElement('button', { onClick: () => togglePin('map'), title: 'Détacher', style: { position: 'absolute', zIndex: 3, right: 8, top: 8, width: 22, height: 22, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,.4)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 15, lineHeight: 1 } }, '×'),
      React.createElement('div', { style: { height: 158 } }, React.createElement(AbstractMap, { points: dayPts, theme: mode, cities: T.cities, label: day.region.toUpperCase() })),
      React.createElement('button', { onClick: () => setMapOpen(true), style: { width: '100%', border: 'none', borderTop: `1px solid ${C.line}`, background: 'transparent', color: C.accent, fontSize: 12.5, fontWeight: 700, padding: '11px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } },
        React.createElement(Icon, { name: 'map', size: 15 }), 'Carte complète')) },
    checklist: { label: 'Check-list', icon: 'check', render: () => {
      const items = day.todo || [];
      return React.createElement(BlockShell, { id: 'checklist', title: 'Check-list', icon: 'check', pad: 13 },
        items.length ? items.map((t, i) => {
          const key = sel + '_' + i; const ok = done[key];
          return React.createElement('button', { key: i, onClick: () => setDone(d => ({ ...d, [key]: !d[key] })),
            style: { width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: i < items.length - 1 ? `1px solid ${C.line2}` : 'none' } },
            React.createElement('div', { style: { width: 19, height: 19, borderRadius: 6, flexShrink: 0, border: `1.5px solid ${ok ? C.accent : C.faint}`, background: ok ? C.accent : 'transparent', color: C.accentInk, display: 'grid', placeItems: 'center' } },
              ok && React.createElement(Icon, { name: 'check', size: 12, sw: 2.4 })),
            React.createElement('span', { style: { fontSize: 12.5, color: ok ? C.faint : C.text, textDecoration: ok ? 'line-through' : 'none', lineHeight: 1.35 } }, t));
        }) : React.createElement('div', { style: { fontSize: 12.5, color: C.faint, fontStyle: 'italic', padding: '4px 0' } }, 'Rien à préparer ce jour-là.'));
    } },
    note: { label: 'Note de journée', icon: 'sparkle', render: () => React.createElement(BlockShell, { id: 'note', title: 'Note de journée', icon: 'sparkle' },
      day.note ? React.createElement('div', { style: { fontSize: 13, color: C.muted, lineHeight: 1.55, fontStyle: 'italic' } }, day.note)
        : React.createElement('div', { style: { fontSize: 12.5, color: C.faint, fontStyle: 'italic' } }, 'Aucune note.')) },
    people: { label: 'Voyageurs', icon: 'users', render: () => React.createElement(BlockShell, { id: 'people', title: 'Voyageurs', icon: 'users', pad: 13 },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
        React.createElement(Avatars, { people: T.participants, size: 34, dark: mode === 'light' }),
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 13, fontWeight: 700 } }, 'Mathis & Margot'),
          React.createElement('div', { style: { fontSize: 11, color: C.muted } }, 'Voyagent ensemble')))) },
    stats: { label: 'Repères du jour', icon: 'route', render: () => React.createElement(BlockShell, { id: 'stats', title: 'Repères du jour', icon: 'route', pad: 13 },
      React.createElement('div', { style: { display: 'flex', gap: 10 } },
        React.createElement('div', { style: { flex: 1, background: C.inset, borderRadius: 11, padding: '10px 12px' } },
          React.createElement('div', { style: { fontFamily: serif, fontSize: 24, lineHeight: 1 } }, day.steps.length),
          React.createElement('div', { style: { fontSize: 10.5, color: C.muted, marginTop: 3 } }, day.steps.length > 1 ? 'étapes' : 'étape')),
        React.createElement('div', { style: { flex: 1, background: C.inset, borderRadius: 11, padding: '10px 12px' } },
          React.createElement('div', { style: { fontFamily: serif, fontSize: 24, lineHeight: 1 } }, transport ? '1' : '0'),
          React.createElement('div', { style: { fontSize: 10.5, color: C.muted, marginTop: 3 } }, 'transport')),
        React.createElement('div', { style: { flex: 1, background: C.inset, borderRadius: 11, padding: '10px 12px' } },
          React.createElement('div', { style: { fontFamily: serif, fontSize: 24, lineHeight: 1 } }, lodging ? lodging.nights : '—'),
          React.createElement('div', { style: { fontSize: 10.5, color: C.muted, marginTop: 3 } }, 'nuits'))) ) }
  };
  const ORDER = ['map', 'checklist', 'note', 'stats', 'people'];

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

  return React.createElement('div', { style: { flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', position: 'relative' } },
    React.createElement('style', null, '@keyframes itdash{to{stroke-dashoffset:-160}} .it-journey{animation:itdash 9s linear infinite}'),

    /* COLONNE CENTRALE */
    React.createElement('div', { style: { ...s.detail, overflowY: 'auto' } },
      React.createElement('div', { key: 'hero' + day.n, style: { position: 'relative', height: 190, borderRadius: 18, overflow: 'hidden', flexShrink: 0, background: heroGrad(heroHue(day), mode === 'light'), boxShadow: C.shadow } },
        React.createElement('image-slot', { id: 'koreahero-day-' + day.n, shape: 'rect', placeholder: 'Déposez une photo \u00b7 ' + day.region, style: { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' } }),
        React.createElement('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(18,30,24,0) 38%, rgba(13,26,20,.74) 100%)' } }),
        React.createElement('div', { style: { position: 'absolute', right: 14, top: 12, pointerEvents: 'none', fontFamily: mono, fontSize: 9.5, letterSpacing: '.14em', color: 'rgba(255,255,255,.82)', textShadow: '0 1px 6px rgba(0,0,0,.5)' } }, day.hero),
        React.createElement('div', { style: { position: 'absolute', left: 22, right: 22, bottom: 18, pointerEvents: 'none', color: '#fff' } },
          React.createElement('div', { style: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, marginBottom: 7, textShadow: '0 1px 8px rgba(0,0,0,.5)' } },
            React.createElement('span', { style: { width: 7, height: 7, borderRadius: '50%', background: pillCol } }), pillTxt + ' \u00b7 ' + day.weekday + ' ' + fmtDate(day.dateISO) + ' \u00b7 ' + day.region),
          React.createElement('div', { style: { display: 'flex', alignItems: 'flex-end', gap: 13 } },
            React.createElement('div', { style: { fontFamily: serif, fontStyle: 'italic', fontSize: 40, lineHeight: .82, textShadow: '0 2px 16px rgba(0,0,0,.5)' } }, 'J' + day.n),
            React.createElement('div', { style: { fontFamily: serif, fontStyle: 'italic', fontSize: 26, lineHeight: 1, whiteSpace: 'nowrap', textShadow: '0 2px 14px rgba(0,0,0,.55)' } }, day.title)))),
      React.createElement('div', { style: { flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 11 } },
        day.steps.map(function(step, k) { return React.createElement(StepCard, { key: k, s: step }); }),
        React.createElement('button', {
          onClick: function() { setEditor({ open: true, dayId: day.id, step: null }); },
          style: Object.assign({}, s.ghost, { alignSelf: 'flex-start', borderStyle: 'dashed', background: 'transparent', color: C.muted })
        }, React.createElement(Icon, { name: 'plus', size: 15 }), 'Ajouter une \u00e9tape'))),

    /* COLONNE DROITE */
    React.createElement('aside', { style: s.ctx },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
        React.createElement('div', { style: s.kicker }, '\u00c9pingl\u00e9'),
        React.createElement('button', { onClick: function() { setEditPins(function(e) { return !e; }); }, style: { border: 'none', background: editPins ? C.accent : 'transparent', color: editPins ? C.accentInk : C.accent, cursor: 'pointer', fontSize: 12, fontWeight: 700, borderRadius: 8, padding: '4px 10px' } }, editPins ? 'Termin\u00e9' : 'Personnaliser')),
      React.createElement('div', { style: { flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 13, paddingRight: 2, marginRight: -2 } },
        pinned.map(function(id) { return BLOCKS[id] && React.createElement('div', { key: id }, BLOCKS[id].render()); }),
        editPins && unpinned.length > 0 && React.createElement('div', { style: { borderRadius: 14, border: '1px dashed ' + C.line, padding: 12 } },
          React.createElement('div', { style: { fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: C.faint, marginBottom: 9 } }, 'Ajouter un bloc'),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 7 } },
            unpinned.map(function(id) { return React.createElement('button', { key: id, onClick: function() { togglePin(id); }, style: { display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, border: '1px solid ' + C.line, background: C.inset, color: C.text, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, textAlign: 'left' } },
              React.createElement('div', { style: { width: 26, height: 26, borderRadius: 8, background: C.accentSoft, color: C.accent, display: 'grid', placeItems: 'center', flexShrink: 0 } }, React.createElement(Icon, { name: BLOCKS[id].icon, size: 14 })),
              React.createElement('span', { style: { flex: 1 } }, BLOCKS[id].label),
              React.createElement(Icon, { name: 'plus', size: 14, style: { color: C.faint } })); }))))),

    mapOpen && React.createElement(MapOverlay, null),
    React.createElement(StepEditor, {
      open: editor.open,
      tripId: realTrip && realTrip.id,
      dayId: editor.dayId,
      step: editor.step,
      stepCount: day.steps.length,
      onClose: function() { setEditor({ open: false, dayId: null, step: null }); },
      onSaved: reload
    })
  );
}
window.AtelierV2 = AtelierV2;
