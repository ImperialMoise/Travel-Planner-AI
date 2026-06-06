/* ════════════════════════════════════════════════════════════════
   Atomes partagés entre les deux directions.
   Exporte sur window : Icon, ItIcons (markup), ItHelpers, Avatars,
   AbstractMap.  Aucune dépendance hors React (global).
   ════════════════════════════════════════════════════════════════ */

/* ---- Icônes monolignes (24×24, stroke=currentColor) ------------- */
const IT_ICONS = {
  avion: '<path d="M21 16v-2l-8-5V3.6a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.4V19l-2 1.4V22l3.5-1 3.5 1v-1.6L13 19v-5.4z"/>',
  train: '<rect x="5" y="3.5" width="14" height="13" rx="3.5"/><path d="M5 11h14"/><circle cx="9" cy="13.8" r="1"/><circle cx="15" cy="13.8" r="1"/><path d="M8 16.5 6 20M16 16.5 18 20"/>',
  metro: '<rect x="5" y="4" width="14" height="12" rx="4"/><path d="M5 10.5h14"/><circle cx="9" cy="13.4" r="1"/><circle cx="15" cy="13.4" r="1"/><path d="M7.5 16 6 20M16.5 16 18 20"/>',
  bus: '<rect x="4" y="4" width="16" height="12" rx="2.5"/><path d="M4 11h16"/><circle cx="8" cy="13.4" r="1"/><circle cx="16" cy="13.4" r="1"/><path d="M7 16.5V19M17 16.5V19"/>',
  car: '<path d="M3 13.2l1.8-4.6A2 2 0 0 1 6.7 7.3h10.6a2 2 0 0 1 1.9 1.3L21 13.2v4.6a1 1 0 0 1-1 1h-1.4a1 1 0 0 1-1-1v-1H6.4v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13.2h18"/><circle cx="7" cy="15.8" r=".9"/><circle cx="17" cy="15.8" r=".9"/>',
  ferry: '<path d="M3.5 16.5h17l-2.2 4.2a1 1 0 0 1-.9.5H6.6a1 1 0 0 1-.9-.5z"/><path d="M5.5 16.5V9l6.5-2.6L18.5 9v7.5M9 7.6V5h6v2.6"/>',
  walk: '<circle cx="13" cy="4.4" r="1.6"/><path d="M10.5 8.2 8.5 12.5l2.2 1 1.3 5.5M12.6 9.2l3 2 2.2-1M9 21.5l1.7-4M14 21.5l-1.3-4"/>',
  bed: '<path d="M3 19v-8a2 2 0 0 1 2-2h8.5a4.5 4.5 0 0 1 4.5 4.5V19M3 14.5h18M3 19v1.5M21 16.5V20.5"/><circle cx="7.6" cy="12" r="1.4"/>',
  fork: '<path d="M6.5 3v6.5a2 2 0 0 0 4 0V3M8.5 3v18M16.5 3c-1.6 0-2.6 2.1-2.6 5.2s1 4.3 2.6 4.3M16.5 3v18"/>',
  camera: '<rect x="3" y="7" width="18" height="12.5" rx="2.5"/><path d="M8.6 7 10 4.5h4L15.4 7"/><circle cx="12" cy="13.2" r="3.2"/>',
  pin: '<path d="M12 21.5s6.5-5.8 6.5-11A6.5 6.5 0 0 0 5.5 10.5c0 5.2 6.5 11 6.5 11z"/><circle cx="12" cy="10.2" r="2.4"/>',
  map: '<path d="M9 4 3 6.6v13.4L9 17.4l6 2.6 6-2.6V4l-6 2.6L9 4z"/><path d="M9 4v13.4M15 6.6V20"/>',
  users: '<circle cx="9" cy="8" r="3.1"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M16 5.4a3.1 3.1 0 0 1 0 6M21.2 20a6.2 6.2 0 0 0-4.6-6"/>',
  arrow: '<path d="M4.5 12h15M13 6l6.5 6-6.5 6"/>',
  arrowsm: '<path d="M5 12h12M12 7l5 5-5 5"/>',
  chevdown: '<path d="m6 9.5 6 6 6-6"/>',
  chevright: '<path d="m9.5 6 6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.4V12l3.2 2"/>',
  cal: '<rect x="4" y="5" width="16" height="16" rx="2.6"/><path d="M4 9.6h16M8.2 3v4M15.8 3v4"/>',
  moon: '<path d="M20 14.6A8.2 8.2 0 1 1 9.4 4 6.6 6.6 0 0 0 20 14.6z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.4M12 19v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.6 12h2.4M19 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/>',
  check: '<path d="m5 12.6 4.5 4.4L19 7"/>',
  plus: '<path d="M12 5.2v13.6M5.2 12h13.6"/>',
  sparkle: '<path d="M12 3.2l1.9 5.4 5.4 1.9-5.4 1.9L12 17.8l-1.9-5.4L4.7 10.5l5.4-1.9z"/>',
  expand: '<path d="M8.5 3.5H4v4.5M15.5 3.5H20v4.5M8.5 20.5H4V16M15.5 20.5H20V16"/>',
  flag: '<path d="M5 21V4M5 4.5h11l-2 3 2 3H5"/>',
  route: '<circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8 6h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5"/>'
};
function Icon({ name, size = 18, sw = 1.6, style }) {
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round',
    strokeLinejoin: 'round', style: { display: 'block', flexShrink: 0, ...style },
    dangerouslySetInnerHTML: { __html: IT_ICONS[name] || IT_ICONS.pin }
  });
}

/* ---- Helpers ---------------------------------------------------- */
const IT_MODE_ICON = { avion: 'avion', train: 'train', metro: 'metro', bus: 'bus', voiture: 'car', car: 'car', ferry: 'ferry', pied: 'walk', walk: 'walk', taxi: 'car' };
const IT_TYPE_ICON = { transport: 'route', logement: 'bed', restaurant: 'fork', activite: 'camera', autre: 'pin' };
const IT_TYPE_LABEL = { transport: 'Transport', logement: 'Logement', restaurant: 'Table', activite: 'Activité', autre: 'Étape' };

function statusOf(i, todayIndex) {
  if (i < todayIndex) return 'past';
  if (i === todayIndex) return 'today';
  return 'future';
}
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
function fmtDate(iso) { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; }
function dayRange(startISO, endISO) {
  const a = new Date(startISO), b = new Date(endISO);
  return `${a.getDate()} ${MONTHS[a.getMonth()]} — ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
}

/* step → lignes d'affichage {kind, icon, title, sub, range, badge} */
function stepView(s) {
  const icon = s.type === 'transport' ? (IT_MODE_ICON[s.mode] || 'route') : IT_TYPE_ICON[s.type];
  let title = s.label || '', sub = '', range = s.time || '', badge = null;
  if (s.type === 'transport') {
    title = s.label || `${s.from} → ${s.to}`;
    if (!s.label) title = null; // route rendered specially
    range = s.timeEnd ? `${s.time}–${s.timeEnd}${s.over || ''}` : s.time;
    sub = [s.ref, s.dur].filter(Boolean).join(' · ');
  } else if (s.type === 'logement') {
    sub = s.place; badge = `${s.nights} ${s.nights > 1 ? 'nuits' : 'nuit'}`;
    range = s.checkin ? `arr. ${s.checkin}` : '';
  } else if (s.type === 'activite') {
    sub = [s.place, s.dur].filter(Boolean).join(' · ');
  } else { sub = s.place || ''; }
  return { icon, kind: IT_TYPE_LABEL[s.type], title, sub, range, badge, raw: s };
}

/* ---- Avatars participants --------------------------------------- */
function Avatars({ people, size = 30, dark }) {
  const aStyles = {
    wrap: { display: 'flex', alignItems: 'center' },
    av: (i, hue) => ({
      width: size, height: size, borderRadius: '50%', marginLeft: i ? -8 : 0,
      display: 'grid', placeItems: 'center', fontSize: size * 0.36, fontWeight: 700,
      letterSpacing: '.01em',
      color: dark ? '#15302a' : '#fff',
      background: `linear-gradient(150deg, oklch(0.7 0.12 ${hue}), oklch(0.58 0.13 ${hue + 18}))`,
      border: `2px solid ${dark ? '#1c3a33' : '#fbf8f1'}`,
      boxShadow: '0 2px 6px rgba(0,0,0,.18)', zIndex: 10 - i
    })
  };
  return React.createElement('div', { style: aStyles.wrap },
    people.map((p, i) => React.createElement('div', { key: i, style: aStyles.av(i, p.hue), title: p.name }, p.initials))
  );
}

/* ---- Carte abstraite (placeholder géographique élégant) --------- */
/* points: [{x,y,n,region,active}]  — coords fraction 0..1            */
let _mapUid = 0;
function AbstractMap({ points, theme = 'dark', big = false, height = 150, label, cities }) {
  const uid = React.useMemo(() => 'itm' + (++_mapUid), []);
  const dark = theme === 'dark';
  const W = 600, H = 420;
  const water = dark ? 'linear-gradient(160deg,#143029,#173b33)' : 'linear-gradient(160deg,#e8e1d2,#f0e9da)';
  const waterDot = dark ? 'rgba(255,255,255,.05)' : 'rgba(45,73,63,.07)';
  const landFill = dark ? 'rgba(217,182,126,.10)' : 'rgba(45,73,63,.055)';
  const landStroke = dark ? 'rgba(217,182,126,.30)' : 'rgba(45,73,63,.22)';
  const landDot = dark ? 'rgba(217,182,126,.22)' : 'rgba(45,73,63,.16)';
  const routeCol = dark ? '#d9b67e' : '#b4843e';
  const ringBg = dark ? '#143029' : '#e8e1d2';
  const labelCol = dark ? 'rgba(243,237,226,.62)' : 'rgba(31,46,40,.5)';
  const regColor = (r) => r === 'Busan' ? (dark ? '#e0a96d' : '#c98a3c') : (dark ? '#d9b67e' : '#b4843e');

  // silhouette stylisée de péninsule (fractions du viewBox), lissée
  const fr = [[0.42,0.05],[0.54,0.09],[0.585,0.19],[0.64,0.30],[0.73,0.41],[0.71,0.54],[0.77,0.67],[0.66,0.85],[0.55,0.93],[0.45,0.90],[0.40,0.79],[0.31,0.73],[0.25,0.59],[0.33,0.47],[0.22,0.37],[0.30,0.25],[0.30,0.12]];
  const sp = fr.map(([x, y]) => [x * W, y * H]);
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(sp[sp.length - 1], sp[0]);
  let land = `M ${m0[0].toFixed(1)} ${m0[1].toFixed(1)}`;
  for (let i = 0; i < sp.length; i++) { const cur = sp[i], nx = sp[(i + 1) % sp.length]; const m = mid(cur, nx); land += ` Q ${cur[0].toFixed(1)} ${cur[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`; }
  land += ' Z';

  const pts = points.map(p => ({ ...p, px: p.x * W, py: p.y * H }));
  const routeD = pts.map((p, i) => (i ? 'L' : 'M') + ` ${p.px.toFixed(1)} ${p.py.toFixed(1)}`).join(' ');

  const mStyles = {
    wrap: { position: 'relative', width: '100%', height: big ? '100%' : height, minHeight: big ? 240 : height,
      borderRadius: big ? 18 : 14, overflow: 'hidden', border: `1px solid ${dark ? 'rgba(255,255,255,.07)' : 'rgba(45,73,63,.10)'}`,
      background: `radial-gradient(${waterDot} 1px, transparent 1px) 0 0/15px 15px, ${water}` },
    cap: { position: 'absolute', left: 12, bottom: 10, fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
      fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: labelCol }
  };
  return React.createElement('div', { style: mStyles.wrap },
    React.createElement('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: { display: 'block' } },
      React.createElement('defs', null,
        React.createElement('clipPath', { id: uid + 'clip' }, React.createElement('path', { d: land })),
        React.createElement('pattern', { id: uid + 'dots', width: 13, height: 13, patternUnits: 'userSpaceOnUse' },
          React.createElement('circle', { cx: 2, cy: 2, r: 1.2, fill: landDot }))),
      React.createElement('path', { d: land, fill: landFill, stroke: landStroke, strokeWidth: 1.2 }),
      React.createElement('rect', { width: W, height: H, fill: `url(#${uid}dots)`, clipPath: `url(#${uid}clip)` }),
      pts.length > 1 && React.createElement('path', { className: 'it-journey', d: routeD, fill: 'none', stroke: routeCol, strokeWidth: 1.8, strokeDasharray: '1 7', strokeLinecap: 'round', opacity: .9 }),
      (cities || []).map((c, i) => React.createElement('text', { key: 'c' + i, x: c.x * W, y: c.y * H, textAnchor: 'middle',
        fontSize: 12.5, fontWeight: 700, letterSpacing: 2, fill: labelCol, fontFamily: 'system-ui' }, c.name.toUpperCase())),
      pts.map((p, i) => React.createElement('g', { key: i },
        p.active && React.createElement('circle', { cx: p.px, cy: p.py, r: 14, fill: 'none', stroke: regColor(p.region), strokeWidth: 1.4, opacity: .55 }),
        React.createElement('circle', { cx: p.px, cy: p.py, r: p.active ? 9 : 6.5, fill: regColor(p.region), stroke: ringBg, strokeWidth: 2.4 }),
        p.n && React.createElement('text', { x: p.px, y: p.py + 0.5, textAnchor: 'middle', dominantBaseline: 'central',
          fontSize: p.active ? 9 : 8, fontWeight: 700, fill: ringBg, fontFamily: 'system-ui' }, p.n)
      ))
    ),
    label && React.createElement('div', { style: mStyles.cap }, label)
  );
}

/* ---- Auto-image (Unsplash + Wikimedia fallback) --------- */
const UNSPLASH_KEY = 'A6cXFWLMDJeyJqZhlwijRcvlqq8IvepxwBiYwD95Vmo'; // ← remplace par ta clé

async function fetchAutoImage(query) {
  if (!query || query === 'Journ\u00e9e libre') return null;

  /* 1. Unsplash (priorité) */
  if (UNSPLASH_KEY && UNSPLASH_KEY !== 'A6cXFWLMDJeyJqZhlwijRcvlqq8IvepxwBiYwD95Vmo') {
    try {
      var res = await fetch('https://api.unsplash.com/search/photos?query=' + encodeURIComponent(query) + '&per_page=1&orientation=landscape', {
        headers: { 'Authorization': 'Client-ID ' + UNSPLASH_KEY }
      });
      var data = await res.json();
      if (data.results && data.results.length > 0) {
        return {
          url: data.results[0].urls.regular,
          credit: data.results[0].user.name,
          link: data.results[0].user.links.html
        };
      }
    } catch (e) { console.warn('Unsplash err:', e); }
  }

  /* 2. Wikimedia Commons (fallback gratuit illimité) */
  try {
    var res2 = await fetch('https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=' + encodeURIComponent(query) + '&gsrlimit=3&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json&origin=*');
    var data2 = await res2.json();
    var pages = data2.query && data2.query.pages;
    if (pages) {
      var best = Object.values(pages).find(function(p) {
        var info = p.imageinfo && p.imageinfo[0];
        if (!info) return false;
        var mime = info.extmetadata && info.extmetadata.MIMEType;
        return !mime || mime.value.indexOf('svg') === -1;
      });
      if (best && best.imageinfo && best.imageinfo[0]) {
        return {
          url: best.imageinfo[0].thumburl || best.imageinfo[0].url,
          credit: 'Wikimedia Commons',
          link: 'https://commons.wikimedia.org'
        };
      }
    }
  } catch (e) { console.warn('Wikimedia err:', e); }

  return null;
}
Object.assign(window, { Icon, IT_ICONS, IT_MODE_ICON, IT_TYPE_ICON, IT_TYPE_LABEL, statusOf, fmtDate, dayRange, stepView, Avatars, AbstractMap, fetchAutoImage });
