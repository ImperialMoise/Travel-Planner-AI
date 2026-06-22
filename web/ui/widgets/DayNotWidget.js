// ════════════════════════════════════════════════════════════
// DayNoteWidget.js — Widget “Journal du jour”
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Afficher et modifier la note d’une journée.
// - Sauvegarder day.note via window.SB.updateDay.
// - Recharger le voyage après sauvegarde.
// - Garder l’état visuel propre : brouillon, dirty, sauvegarde.
//
// Dépendances globales :
// - React
// - Store
// - Icon
// - window.SB
//
// API :
//   <window.DayNoteWidget
//     day={day}
//     trip={trip}
//     editMode={editMode}
//     onRemove={onRemove}
//   />
//
// ════════════════════════════════════════════════════════════

(function initDayNoteWidget() {
  function safeString(value) {
    return String(value == null ? '' : value);
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

  function saveButtonStyle(active, saving) {
    return {
      border: 'none',
      cursor: saving || !active ? 'default' : 'pointer',
      background: active ? 'var(--accent)' : 'var(--inset)',
      color: active ? 'var(--accent-ink)' : 'var(--faint)',
      borderRadius: 8,
      padding: '5px 9px',
      fontSize: 11,
      fontWeight: 800,
      fontFamily: 'inherit',
      opacity: saving ? 0.75 : 1
    };
  }

  function DayNoteWidget({ day, trip, editMode, onRemove }) {
    const [draft, setDraft] = React.useState(day && day.note ? day.note : '');
    const [saving, setSaving] = React.useState(false);
    const textareaRef = React.useRef(null);

    React.useEffect(function syncDayNote() {
      setDraft(day && day.note ? day.note : '');
    }, [day && day.id, day && day.note]);

    if (!day || !trip) {
      return (
        <div style={cardStyle()}>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10
          }}>
            <Icon name="sparkle" size={16} style={{ color: 'var(--tan)' }} />
            Journal du jour
          </div>

          <div style={{
            color: 'var(--muted)',
            fontSize: 13,
            lineHeight: '19px'
          }}>
            Sélectionne une journée pour écrire une note.
          </div>
        </div>
      );
    }

    const currentNote = safeString(day.note);
    const dirty = draft !== currentNote;

    async function saveNote() {
      if (!day.id || !trip.id || saving) return;

      setSaving(true);

      try {
        await window.SB.updateDay(day.id, {
          note: draft
        });

        const refreshedTrip = await window.SB.loadTrip(trip.id);

        Store.set({
          trip: refreshedTrip
        });

        Store.showToast(draft.trim() ? 'Journal sauvegardé' : 'Journal vidé');
      } catch (error) {
        Store.showToast('Erreur journal : ' + (error.message || error));
      } finally {
        setSaving(false);
      }
    }

    function clearNote() {
      setDraft('');
      window.setTimeout(function focusTextarea() {
        if (textareaRef.current) textareaRef.current.focus();
      }, 0);
    }

<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  padding: '12px 16px',
  borderBottom: '1px solid var(--outline-variant)',
  background: 'var(--soft)'
}}>
  <span style={{
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  }}>
    <Icon name="sparkle" size={16} style={{ color: 'var(--tan)' }} />
    Note du jour
  </span>

  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0
  }}>
    <button
      type="button"
      onClick={saveNote}
      disabled={saving || !dirty}
      style={saveButtonStyle(dirty, saving)}
    >
      {saving ? '...' : dirty ? 'Sauver' : 'À jour'}
    </button>

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
</div>

<div style={{ padding: 16 }}>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder="Écris une note pour cette journée..."
          rows={5}
          style={{
            width: '100%',
            minHeight: 92,
            resize: 'vertical',
            border: '1px solid var(--outline-variant)',
            borderRadius: 11,
            background: 'var(--card)',
            color: 'var(--text)',
            padding: '10px 12px',
            fontFamily: 'inherit',
            fontSize: 13.5,
            lineHeight: '20px',
            outline: 'none',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
          }}
        />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginTop: 8
        }}>
          <div style={{
            fontSize: 11.5,
            color: dirty ? 'var(--accent)' : 'var(--faint)',
            fontWeight: 700,
            lineHeight: '16px'
          }}>
            {dirty ? 'Modifications non sauvegardées' : 'Sauvegardé sur ce jour'}
          </div>

          {draft.trim() && (
            <button
              type="button"
              onClick={clearNote}
              disabled={saving}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--faint)',
                cursor: saving ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                fontSize: 11.5,
                fontWeight: 800,
                padding: 0
              }}
            >
              Effacer
            </button>
          )}
        </div>
      </div>
    );
  }

  window.DayNoteWidget = DayNoteWidget;
})();
