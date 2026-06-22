// ════════════════════════════════════════════════════════════
// GlobalNoteWidget.js — Widget “Carnet du voyage”
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Afficher et modifier une note globale du voyage.
// - Supporter un mini éditeur riche : gras, italique, souligné,
//   listes, tailles de texte, suppression du style.
// - Nettoyer le HTML avant sauvegarde.
// - Sauvegarder trip.globalNote via window.SB.updateTrip.
//
// Dépendances globales :
// - React
// - Store
// - Icon
// - window.SB
//
// API :
//   <window.GlobalNoteWidget
//     trip={trip}
//     editMode={editMode}
//     onRemove={onRemove}
//   />
//
// ════════════════════════════════════════════════════════════

(function initGlobalNoteWidget() {
  function safeString(value) {
    return String(value == null ? '' : value);
  }

  function sanitizeHtml(html) {
    const template = document.createElement('template');

    template.innerHTML = safeString(html);

    template.content
      .querySelectorAll('script, style, iframe, object, embed')
      .forEach(element => element.remove());

    template.content
      .querySelectorAll('*')
      .forEach(element => {
        Array.from(element.attributes).forEach(attribute => {
          const name = attribute.name.toLowerCase();
          const value = safeString(attribute.value).toLowerCase();

          if (name.startsWith('on')) {
            element.removeAttribute(attribute.name);
          }

          if (
            (name === 'href' || name === 'src') &&
            value.startsWith('javascript:')
          ) {
            element.removeAttribute(attribute.name);
          }
        });
      });

    return template.innerHTML;
  }

  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = safeString(html);
    return safeString(div.textContent || div.innerText || '');
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

  function ToolButton({
    children,
    title,
    onClick,
    danger,
    disabled
  }) {
    return (
      <button
        type="button"
        title={title}
        onMouseDown={event => event.preventDefault()}
        onClick={onClick}
        disabled={disabled}
        style={{
          minWidth: 30,
          height: 30,
          padding: '0 9px',
          borderRadius: 9,
          border: '1px solid var(--outline-variant)',
          background: danger ? 'rgba(192,86,63,.08)' : 'var(--inset)',
          color: danger ? '#c0563f' : 'var(--text)',
          cursor: disabled ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          fontSize: 12,
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          opacity: disabled ? 0.65 : 1
        }}
      >
        {children}
      </button>
    );
  }

  function SaveButton({
    dirty,
    saving,
    onClick
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={saving || !dirty}
        style={{
          border: 'none',
          cursor: saving || !dirty ? 'default' : 'pointer',
          background: dirty ? 'var(--accent)' : 'var(--inset)',
          color: dirty ? 'var(--accent-ink)' : 'var(--faint)',
          borderRadius: 8,
          padding: '5px 9px',
          fontSize: 11,
          fontWeight: 800,
          fontFamily: 'inherit',
          opacity: saving ? 0.75 : 1
        }}
      >
        {saving ? '...' : dirty ? 'Sauver' : 'À jour'}
      </button>
    );
  }

  function GlobalNoteWidget({ trip, editMode, onRemove, hideHeader }) {
    const editorRef = React.useRef(null);

    const [draft, setDraft] = React.useState(trip && trip.globalNote ? trip.globalNote : '');
    const [saving, setSaving] = React.useState(false);
    const [focused, setFocused] = React.useState(false);

    React.useEffect(function syncTripNote() {
      const next = trip && trip.globalNote ? trip.globalNote : '';

      setDraft(next);

      if (editorRef.current && editorRef.current.innerHTML !== next) {
        editorRef.current.innerHTML = next;
      }
    }, [trip && trip.id, trip && trip.globalNote]);

    if (!trip) {
      return (
        <div style={cardStyle()}>
          {!hideHeader && (
  <div style={headerStyle()}>
    <span style={{
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--text)',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}>
      <Icon name="file" size={16} style={{ color: 'var(--tan)' }} />
      Notes
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
)}

          <div style={{ padding: 16, color: 'var(--muted)', fontSize: 13, lineHeight: '19px' }}>
            Aucun voyage sélectionné.
          </div>
        </div>
      );
    }

    const cleanTripNote = safeString(trip.globalNote);
    const cleanDraft = sanitizeHtml(draft);
    const dirty = cleanDraft !== cleanTripNote;
    const empty = !stripHtml(cleanDraft).trim();

    function syncDraftFromEditor() {
      const html = sanitizeHtml(editorRef.current ? editorRef.current.innerHTML : '');

      setDraft(html);
    }

    function runCommand(command, value) {
      if (!editorRef.current) return;

      editorRef.current.focus();
      document.execCommand(command, false, value || null);
      syncDraftFromEditor();
    }

    async function saveGlobalNote() {
      if (!trip.id || saving) return;

      const html = sanitizeHtml(editorRef.current ? editorRef.current.innerHTML : '');

      setSaving(true);

      try {
        await window.SB.updateTrip(trip.id, {
          globalNote: html
        });

        const refreshedTrip = await window.SB.loadTrip(trip.id);

        Store.set({
          trip: refreshedTrip
        });

        setDraft(html);

        Store.showToast(
          stripHtml(html).trim()
            ? 'Notes sauvegardées'
            : 'Notes vidées'
        );
      } catch (error) {
        Store.showToast('Erreur notes : ' + (error.message || error));
      } finally {
        setSaving(false);
      }
    }

    function clearGlobalNote() {
      if (!editorRef.current || saving) return;

      editorRef.current.innerHTML = '';
      setDraft('');
      editorRef.current.focus();
    }

    return (
      <div style={cardStyle()}>
        {!hideHeader && (
  <div style={headerStyle()}>
    <span style={{
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--text)',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}>
      <Icon name="file" size={16} style={{ color: 'var(--tan)' }} />
      Notes
    </span>

    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }}>
      <SaveButton
        dirty={dirty}
        saving={saving}
        onClick={saveGlobalNote}
      />

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
)}

        <div style={{
          padding: 14,
          background: 'var(--card)'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            padding: 8,
            borderRadius: 12,
            background: 'var(--inset)',
            border: '1px solid var(--outline-variant)',
            marginBottom: 10
          }}>
            <ToolButton
              title="Gras"
              disabled={saving}
              onClick={() => runCommand('bold')}
            >
              <b>B</b>
            </ToolButton>

            <ToolButton
              title="Italique"
              disabled={saving}
              onClick={() => runCommand('italic')}
            >
              <i>I</i>
            </ToolButton>

            <ToolButton
              title="Souligné"
              disabled={saving}
              onClick={() => runCommand('underline')}
            >
              <u>U</u>
            </ToolButton>

            <ToolButton
              title="Petit texte"
              disabled={saving}
              onClick={() => runCommand('fontSize', '2')}
            >
              A-
            </ToolButton>

            <ToolButton
              title="Texte normal"
              disabled={saving}
              onClick={() => runCommand('fontSize', '3')}
            >
              A
            </ToolButton>

            <ToolButton
              title="Grand texte"
              disabled={saving}
              onClick={() => runCommand('fontSize', '5')}
            >
              A+
            </ToolButton>

            <ToolButton
              title="Liste à puces"
              disabled={saving}
              onClick={() => runCommand('insertUnorderedList')}
            >
              • liste
            </ToolButton>

            <ToolButton
              title="Liste numérotée"
              disabled={saving}
              onClick={() => runCommand('insertOrderedList')}
            >
              1. liste
            </ToolButton>

            <ToolButton
              title="Effacer le style"
              danger
              disabled={saving}
              onClick={() => runCommand('removeFormat')}
            >
              Effacer
            </ToolButton>

            {!empty && (
              <ToolButton
                title="Vider les notes"
                danger
                disabled={saving}
                onClick={clearGlobalNote}
              >
                Vider
              </ToolButton>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            {empty && !focused && (
              <div style={{
                position: 'absolute',
                top: 13,
                left: 14,
                right: 14,
                color: 'var(--faint)',
                fontSize: 13.5,
                lineHeight: '20px',
                pointerEvents: 'none',
                fontStyle: 'italic'
              }}>
                Notes du voyage : idées, rappels, adresses, choses à vérifier…
              </div>
            )}

            <div
              ref={editorRef}
              contentEditable={!saving}
              suppressContentEditableWarning
              onInput={syncDraftFromEditor}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                syncDraftFromEditor();
              }}
              style={{
                width: '100%',
                minHeight: 150,
                maxHeight: 320,
                overflowY: 'auto',
                border: '1px solid var(--outline-variant)',
                borderRadius: 12,
                background: 'var(--card)',
                color: 'var(--text)',
                padding: '12px 14px',
                fontFamily: 'inherit',
                fontSize: 13.5,
                lineHeight: '21px',
                outline: 'none',
                boxShadow: focused
                  ? '0 0 0 3px rgba(217,182,126,.18)'
                  : 'inset 0 1px 2px rgba(0,0,0,0.03)'
              }}
            />
          </div>

{hideHeader && (
  <div style={{
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 10
  }}>
    <SaveButton
      dirty={dirty}
      saving={saving}
      onClick={saveGlobalNote}
    />
  </div>
)}

          <div style={{
            marginTop: 8,
            fontSize: 11.5,
            color: dirty ? 'var(--accent)' : 'var(--faint)',
            fontWeight: 700,
            lineHeight: '16px'
          }}>
            {dirty
              ? 'Modifications non sauvegardées'
              : 'Sauvegardé sur tout le voyage'}
          </div>
        </div>
      </div>
    );
  }

  window.GlobalNoteWidget = GlobalNoteWidget;
})();
