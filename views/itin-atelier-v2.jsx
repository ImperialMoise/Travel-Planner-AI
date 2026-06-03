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

function AtelierV2() {
  // --- 1. CONNEXION À TA BASE DE DONNÉES SUPABASE ---
  const { trip: realTrip } = Store.useStore();

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
          type: s.type || 'autre',
          label: s.label || s.lieu,
          place: s.lieu,
          time: s.time,
          note: s.note,
          mode: s.transportType || 'car',
          from: s.depart,
          to: s.arrivee
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

  const [mode, setMode] = React.useState(() => localStorage.getItem('it_theme') || 'light');
  const [view, setView] = React.useState('itin');
  const [sel, setSel] = React.useState(T.todayIndex);
  const [mapOpen, setMapOpen] = React.useState(false);
  const [editPins, setEditPins] = React.useState(false);
  const [pinned, setPinned] = React.useState(() => {
    try { const s = JSON.parse(localStorage.getItem('it_pins')); if (Array.isArray(s) && s.length) return s; } catch (e) {}
    return ['map', 'checklist', 'note'];
  });
  const [done, setDone] = React.useState({});  // checklist coché

  React.useEffect(() => { localStorage.setItem('it_theme', mode); }, [mode]);
  React.useEffect(() => { localStorage.setItem('it_pins', JSON.stringify(pinned)); }, [pinned]);

  const C = palette(mode);
  const day = T.days[sel];
  const stt = statusOf(sel, T.todayIndex);
  const pct = Math.round((T.todayIndex + 1) / T.duration * 100);
  const heroHue = (d) => d.region === 'Busan' ? 28 : d.region === 'Vol' ? 220 : 168;
  const heroL = mode === 'light' ? [0.72, 0.56] : [0.58, 0.4];

  const togglePin = (id) => setPinned(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const s = {
    frame: { width: '100%', height: 860, color: C.text, fontFamily: '"DM Sans",system-ui,sans-serif',
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
    return React.createElement('div', { style: { display: 'flex', gap: 14, padding: 14, borderRadius: 14, background: C.inset, border: `1px solid ${C.line2}` } },
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

  return React.createElement('div', { style: s.frame },
    React.createElement('style', null, `@keyframes itdash{to{stroke-dashoffset:-160}} .it-journey{animation:itdash 9s linear infinite}`),
    
    /* TOPBAR DE CLAUDE RESTAURÉE */
    React.createElement('div', { style: s.top },
      React.createElement('div', { style: s.brand },
        React.createElement('div', { style: s.mark }, React.createElement(Icon, { name: 'route', size: 15 })),
        React.createElement('div', { style: s.wordmark }, 'Atelier')),
      React.createElement('div', { style: s.seg },
        React.createElement('button', { style: s.segBtn(view === 'itin'), onClick: () => setView('itin') }, 'Itinéraire'),
        React.createElement('button', { style: s.segBtn(view === 'recit'), onClick: () => setView('recit') }, 'Synthèse')),
      React.createElement('div', { style: s.topRight },
        React.createElement(Avatars, { people: T.participants, size: 30, dark: mode === 'light' }),
        React.createElement('button', { style: s.iconBtn, title: mode === 'dark' ? 'Passer en clair' : 'Passer en sombre', onClick: () => setMode(m => m === 'dark' ? 'light' : 'dark') },
          React.createElement(Icon, { name: mode === 'dark' ? 'sun' : 'moon', size: 17, style: { color: C.accent } })),
        React.createElement('button', { style: s.ghost, onClick: () => setMapOpen(true) }, React.createElement(Icon, { name: 'map', size: 16, style: { color: C.accent } }), 'Carte'))),
    
    /* BODY */
    React.createElement('div', { style: { flex: 1, overflow: 'hidden', position: 'relative' } },
      React.createElement('div', { style: s.track(view) },
        /* ITIN */
        React.createElement('div', { style: s.panel },
          React.createElement('aside', { style: s.spine },
            React.createElement('div', { style: s.spineHead },
              React.createElement('div', { style: s.kicker }, T.name),
              React.createElement('div', { style: { fontFamily: serif, fontStyle: 'italic', fontSize: 20, marginTop: 4, color: C.text } }, realTrip ? `${realTrip.days.length} jours` : '15 jours'),
              React.createElement('div', { style: { fontSize: 12, color: C.muted, marginTop: 3 } }, dayRange(T.startISO, T.endISO))),
            React.createElement('div', { style: s.spineList },
              React.createElement('div', { style: { position: 'absolute', left: 30, top: 16, bottom: 16, width: 2, background: C.line2 } }),
              T.days.map((d, i) => React.createElement(SpineDay, { key: d.n, i })))),
          
          /* détail */
          React.createElement('div', { style: s.detail },
            React.createElement('div', { key: 'hero' + day.n, style: { position: 'relative', height: 190, borderRadius: 18, overflow: 'hidden', flexShrink: 0, background: heroGrad(heroHue(day), mode === 'light'), boxShadow: C.shadow } },
              React.createElement('image-slot', { id: 'koreahero-day-' + day.n, shape: 'rect', placeholder: 'Déposez une photo · ' + day.region, style: { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' } }),
              React.createElement('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(18,30,24,0) 38%, rgba(13,26,20,.74) 100%)' } }),
              React.createElement('div', { style: { position: 'absolute', right: 14, top: 12, pointerEvents: 'none', fontFamily: mono, fontSize: 9.5, letterSpacing: '.14em', color: 'rgba(255,255,255,.82)', textShadow: '0 1px 6px rgba(0,0,0,.5)' } }, day.hero),
              React.createElement('div', { style: { position: 'absolute', left: 22, right: 22, bottom: 18, pointerEvents: 'none', color: '#fff' } },
                React.createElement('div', { style: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, marginBottom: 7, textShadow: '0 1px 8px rgba(0,0,0,.5)' } },
                  React.createElement('span', { style: { width: 7, height: 7, borderRadius: '50%', background: pillCol } }), `${pillTxt} · ${day.weekday} ${fmtDate(day.dateISO)} · ${day.region}`),
                React.createElement('div', { style: { display: 'flex', alignItems: 'flex-end', gap: 13 } },
                  React.createElement('div', { style: { fontFamily: serif, fontStyle: 'italic', fontSize: 40, lineHeight: .82, textShadow: '0 2px 16px rgba(0,0,0,.5)' } }, 'J' + day.n),
                  React.createElement('div', { style: { fontFamily: serif, fontStyle: 'italic', fontSize: 26, lineHeight: 1, whiteSpace: 'nowrap', textShadow: '0 2px 14px rgba(0,0,0,.55)' } }, day.title)))),
            React.createElement('div', { style: { flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 11 } },
              day.steps.map((step, k) => React.createElement(StepCard, { key: k, s: step })),
              
              /* BOUTON AJOUTER RELIÉ À SUPABASE */
              React.createElement('button', { 
                onClick: async () => {
                  const titre = window.prompt("Nom de la nouvelle étape ? (ex: Visite du musée)");
                  if (!titre) return;
                  try {
                    await window.SB.sb.from('trip_steps').insert({
                      trip_id: realTrip.id,
                      day_id: day.id,
                      type: 'activite',
                      label: titre,
                      time: '10:00'
                    });
                  } catch (e) {
                    alert("Erreur : " + e.message);
                  }
                },
                style: { ...s.ghost, alignSelf: 'flex-start', borderStyle: 'dashed', background: 'transparent', color: C.muted } 
              }, React.createElement(Icon, { name: 'plus', size: 15 }), 'Ajouter une étape'))),
          
          /* COLONNE ÉPINGLÉE */
          React.createElement('aside', { style: s.ctx },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
              React.createElement('div', { style: s.kicker }, 'Épinglé'),
              React.createElement('button', { onClick: () => setEditPins(e => !e), style: { border: 'none', background: editPins ? C.accent : 'transparent', color: editPins ? C.accentInk : C.accent, cursor: 'pointer', fontSize: 12, fontWeight: 700, borderRadius: 8, padding: '4px 10px' } }, editPins ? 'Terminé' : 'Personnaliser')),
            React.createElement('div', { style: { flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 13, paddingRight: 2, marginRight: -2 } },
              pinned.map(id => BLOCKS[id] && React.createElement('div', { key: id }, BLOCKS[id].render())),
              editPins && unpinned.length > 0 && React.createElement('div', { style: { borderRadius: 14, border: `1px dashed ${C.line}`, padding: 12 } },
                React.createElement('div', { style: { fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: C.faint, marginBottom: 9 } }, 'Ajouter un bloc'),
                React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 7 } },
                  unpinned.map(id => React.createElement('button', { key: id, onClick: () => togglePin(id), style: { display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.line}`, background: C.inset, color: C.text, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, textAlign: 'left' } },
                    React.createElement('div', { style: { width: 26, height: 26, borderRadius: 8, background: C.accentSoft, color: C.accent, display: 'grid', placeItems: 'center', flexShrink: 0 } }, React.createElement(Icon, { name: BLOCKS[id].icon, size: 14 })),
                    React.createElement('span', { style: { flex: 1 } }, BLOCKS[id].label),
                    React.createElement(Icon, { name: 'plus', size: 14, style: { color: C.faint } })))))) )),
        /* SYNTHÈSE */
        React.createElement('div', { style: s.panel }, React.createElement(Synthese, null)))),
    mapOpen && React.createElement(MapOverlay, null)
  );
}
window.AtelierV2 = AtelierV2;
