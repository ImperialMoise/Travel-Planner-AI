// ════════════════════════════════════════════════════════════
// Itinerary.js — PLACEHOLDER (Phase 1)
// La vraie refonte « L'Atelier » arrive en Phase 2.
// ════════════════════════════════════════════════════════════

function ItineraryView() {
  const { trip } = Store.useStore();
  return (
    <Placeholder
      kicker="Itinéraire"
      title={trip.name}
      subtitle={`${trip.days.length} jour${trip.days.length > 1 ? 's' : ''}`}
      hint="La vue Atelier complète (spine + détail + contexte) arrive à la prochaine étape."
    />
  );
}

function Placeholder({ kicker, title, subtitle, hint }) {
  return (
    <div style={{ flex: 1, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={{
          fontSize: 11, fontWeight: 800, color: 'var(--accent)',
          letterSpacing: '.12em', textTransform: 'uppercase'
        }}>{kicker}</div>
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 38, lineHeight: 1.05, marginTop: 4 }}>{title}</div>
        {subtitle && <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{subtitle}</div>}
      </div>
      <div style={{
        background: 'var(--card)', border: '1px dashed var(--line)',
        borderRadius: 'var(--r-lg)', padding: 28, textAlign: 'center', color: 'var(--muted)'
      }}>
        <Icon name="sparkle" size={28} style={{ color: 'var(--accent)', margin: '0 auto 10px' }} />
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--text)', marginBottom: 6 }}>En construction</div>
        <div>{hint}</div>
      </div>
    </div>
  );
}

window.ItineraryView = ItineraryView;
window.Placeholder = Placeholder;
