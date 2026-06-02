// ════════════════════════════════════════════════════════════
// Shared.js — atomes réutilisables (Icon, Avatars, helpers)
// Tirés de itin-shared.jsx fourni par Claude Design.
// ════════════════════════════════════════════════════════════

const IT_ICONS = {
  avion:   '<path d="M21 16v-2l-8-5V3.6a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.4V19l-2 1.4V22l3.5-1 3.5 1v-1.6L13 19v-5.4z"/>',
  train:   '<rect x="5" y="3.5" width="14" height="13" rx="3.5"/><path d="M5 11h14"/><circle cx="9" cy="13.8" r="1"/><circle cx="15" cy="13.8" r="1"/><path d="M8 16.5 6 20M16 16.5 18 20"/>',
  metro:   '<rect x="5" y="4" width="14" height="12" rx="4"/><path d="M5 10.5h14"/><circle cx="9" cy="13.4" r="1"/><circle cx="15" cy="13.4" r="1"/><path d="M7.5 16 6 20M16.5 16 18 20"/>',
  bus:     '<rect x="4" y="4" width="16" height="12" rx="2.5"/><path d="M4 11h16"/><circle cx="8" cy="13.4" r="1"/><circle cx="16" cy="13.4" r="1"/><path d="M7 16.5V19M17 16.5V19"/>',
  car:     '<path d="M3 13.2l1.8-4.6A2 2 0 0 1 6.7 7.3h10.6a2 2 0 0 1 1.9 1.3L21 13.2v4.6a1 1 0 0 1-1 1h-1.4a1 1 0 0 1-1-1v-1H6.4v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13.2h18"/><circle cx="7" cy="15.8" r=".9"/><circle cx="17" cy="15.8" r=".9"/>',
  ferry:   '<path d="M3.5 16.5h17l-2.2 4.2a1 1 0 0 1-.9.5H6.6a1 1 0 0 1-.9-.5z"/><path d="M5.5 16.5V9l6.5-2.6L18.5 9v7.5M9 7.6V5h6v2.6"/>',
  walk:    '<circle cx="13" cy="4.4" r="1.6"/><path d="M10.5 8.2 8.5 12.5l2.2 1 1.3 5.5M12.6 9.2l3 2 2.2-1M9 21.5l1.7-4M14 21.5l-1.3-4"/>',
  bed:     '<path d="M3 19v-8a2 2 0 0 1 2-2h8.5a4.5 4.5 0 0 1 4.5 4.5V19M3 14.5h18M3 19v1.5M21 16.5V20.5"/><circle cx="7.6" cy="12" r="1.4"/>',
  fork:    '<path d="M6.5 3v6.5a2 2 0 0 0 4 0V3M8.5 3v18M16.5 3c-1.6 0-2.6 2.1-2.6 5.2s1 4.3 2.6 4.3M16.5 3v18"/>',
  camera:  '<rect x="3" y="7" width="18" height="12.5" rx="2.5"/><path d="M8.6 7 10 4.5h4L15.4 7"/><circle cx="12" cy="13.2" r="3.2"/>',
  pin:     '<path d="M12 21.5s6.5-5.8 6.5-11A6.5 6.5 0 0 0 5.5 10.5c0 5.2 6.5 11 6.5 11z"/><circle cx="12" cy="10.2" r="2.4"/>',
  map:     '<path d="M9 4 3 6.6v13.4L9 17.4l6 2.6 6-2.6V4l-6 2.6L9 4z"/><path d="M9 4v13.4M15 6.6V20"/>',
  users:   '<circle cx="9" cy="8" r="3.1"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M16 5.4a3.1 3.1 0 0 1 0 6M21.2 20a6.2 6.2 0 0 0-4.6-6"/>',
  arrow:   '<path d="M4.5 12h15M13 6l6.5 6-6.5 6"/>',
  arrowsm: '<path d="M5 12h12M12 7l5 5-5 5"/>',
  chevdown:'<path d="m6 9.5 6 6 6-6"/>',
  chevright:'<path d="m9.5 6 6 6-6 6"/>',
  chevleft:'<path d="m14.5 6-6 6 6 6"/>',
  clock:   '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.4V12l3.2 2"/>',
  cal:     '<rect x="4" y="5" width="16" height="16" rx="2.6"/><path d="M4 9.6h16M8.2 3v4M15.8 3v4"/>',
  moon:    '<path d="M20 14.6A8.2 8.2 0 1 1 9.4 4 6.6 6.6 0 0 0 20 14.6z"/>',
  check:   '<path d="m5 12.6 4.5 4.4L19 7"/>',
  plus:    '<path d="M12 5.2v13.6M5.2 12h13.6"/>',
  x:       '<path d="M6 6l12 12M18 6 6 18"/>',
  sparkle: '<path d="M12 3.2l1.9 5.4 5.4 1.9-5.4 1.9L12 17.8l-1.9-5.4L4.7 10.5l5.4-1.9z"/>',
  expand:  '<path d="M8.5 3.5H4v4.5M15.5 3.5H20v4.5M8.5 20.5H4V16M15.5 20.5H20V16"/>',
  flag:    '<path d="M5 21V4M5 4.5h11l-2 3 2 3H5"/>',
  route:   '<circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8 6h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5"/>',
  gear:    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  user:    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
};

function Icon({ name, size = 18, sw = 1.6, style }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: IT_ICONS[name] || IT_ICONS.pin }}
    />
  );
}

// ─── Helpers de format ───────────────────────────────────────
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function dayRange(startISO, endISO) {
  if (!startISO || !endISO) return '';
  const a = new Date(startISO), b = new Date(endISO);
  return `${a.getDate()} ${MONTHS[a.getMonth()]} — ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function statusOf(dayISO, todayStr = todayISO()) {
  if (!dayISO) return 'future';
  if (dayISO < todayStr) return 'past';
  if (dayISO === todayStr) return 'today';
  return 'future';
}

// ─── Avatars participants ───────────────────────────────────
function hashHue(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

function Avatars({ people = [], size = 30 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {people.map((p, i) => {
        const hue = p.hue ?? hashHue(p.name || p.email || '');
        const initials = (p.initials || (p.name || p.email || '?').slice(0, 2)).toUpperCase();
        return (
          <div
            key={i}
            title={p.name || p.email}
            style={{
              width: size, height: size, borderRadius: '50%',
              marginLeft: i ? -8 : 0,
              display: 'grid', placeItems: 'center',
              fontSize: size * 0.36, fontWeight: 700, color: '#15302a',
              background: `linear-gradient(150deg, oklch(0.7 0.12 ${hue}), oklch(0.58 0.13 ${hue + 18}))`,
              border: '2px solid #1c3a33',
              boxShadow: 'var(--shadow-sm)',
              zIndex: 10 - i
            }}
          >{initials}</div>
        );
      })}
    </div>
  );
}

// ─── Bouton générique ───────────────────────────────────────
function Btn({ variant = 'ghost', icon, children, onClick, style, ...rest }) {
  const base = {
    border: 'none', cursor: 'pointer', borderRadius: 12,
    padding: '8px 13px', fontSize: 13, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 7,
    transition: 'all .15s', fontFamily: 'inherit'
  };
  const variants = {
    primary: { background: 'var(--accent)', color: 'var(--bg)', fontWeight: 700 },
    ghost:   { background: 'var(--inset)', color: 'var(--text)', border: '1px solid var(--line)' },
    soft:    { background: 'var(--accent-soft)', color: 'var(--accent)' }
  };
  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  );
}

// ─── Expose globalement ─────────────────────────────────────
window.Icon = Icon;
window.Avatars = Avatars;
window.Btn = Btn;
window.fmtDate = fmtDate;
window.dayRange = dayRange;
window.todayISO = todayISO;
window.statusOf = statusOf;
window.hashHue = hashHue;
