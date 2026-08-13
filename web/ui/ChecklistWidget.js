// ════════════════════════════════════════════════════════════
// ChecklistWidget.js — Widget “À ne pas oublier”
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Afficher la checklist d’une journée.
// - Ajouter / supprimer des éléments.
// - Cocher localement les éléments faits.
// - Sauvegarder day.todo via window.SB.updateDay.
// - Recharger le voyage après modification.
//
// Dépendances globales :
// - React
// - Store
// - Icon
// - window.SB
//
// API :
//   <window.ChecklistWidget
//     day={day}
//     trip={trip}
//     editMode={editMode}
//     onRemove={onRemove}
//   />
//
// ════════════════════════════════════════════════════════════

(function initChecklistWidget() {
  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeItem(value) {
    return String(value == null ? '' : value).trim();
  }

  function widgetCardStyle() {
    return {
      background: 'var(--card)',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(82,98,91,0.05)',
      border: '1px solid var(--outline-variant)',
      overflow: 'hidden'
    };
  }

  function widgetHeaderStyle() {
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
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

function ChecklistHeader({ editMode, onRemove, hideHeader }) {
  if (hideHeader) return null;

  return (
    <div style={widgetHeaderStyle()}>
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
        <Icon name="check" size={16} style={{ color: 'var(--accent)' }} />
        À ne pas oublier
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
  );
}

  function ChecklistEmpty() {
    return (
      <div
        style={{
          fontSize: 13,
          color: 'var(--faint)',
          fontStyle: 'italic',
          lineHeight: '19px'
        }}
      >
        Ajoute tes rappels pour cette journée.
      </div>
    );
  }

  function ChecklistRow({
    item,
    index,
    checked,
    disabled,
    onToggle,
    onDelete
  }) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 0',
          borderBottom: '1px solid var(--line2)'
        }}
      >
        <button
          type="button"
          onClick={() => onToggle(index)}
          disabled={disabled}
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            flexShrink: 0,
            border: checked ? 'none' : '1.5px solid var(--outline)',
            background: checked ? 'var(--accent)' : 'var(--card)',
            display: 'grid',
            placeItems: 'center',
            cursor: disabled ? 'wait' : 'pointer'
          }}
        >
          {checked && (
            <Icon
              name="check"
              size={14}
              sw={2.4}
              style={{ color: '#fff' }}
            />
          )}
        </button>

        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13.5,
            color: checked ? 'var(--faint)' : 'var(--text)',
            textDecoration: checked ? 'line-through' : 'none',
            opacity: checked ? 0.7 : 1,
            lineHeight: '19px',
            overflowWrap: 'anywhere'
          }}
        >
          {item}
        </span>

        <button
          type="button"
          onClick={() => onDelete(index)}
          title="Supprimer"
          disabled={disabled}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--faint)',
            cursor: disabled ? 'wait' : 'pointer',
            padding: 4,
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <Icon name="x" size={13} />
        </button>
      </div>
    );
  }

  function ChecklistComposer({
    value,
    disabled,
    inputRef,
    onChange,
    onSubmit
  }) {
    return (
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 12
        }}
      >
        <input
          ref={inputRef}
          aria-label="Ajouter un élément à la checklist"
          value={value}
          onChange={event => onChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Passeport, billets, adaptateur…"
          disabled={disabled}
          style={{
            flex: 1,
            minWidth: 0,
            border: '1px solid var(--line)',
            background: 'var(--inset)',
            color: 'var(--text)',
            borderRadius: 10,
            padding: '8px 10px',
            fontFamily: 'inherit',
            fontSize: 13,
            outline: 'none'
          }}
        />

        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !normalizeItem(value)}
          style={{
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            borderRadius: 10,
            padding: '0 12px',
            minWidth: 38,
            fontFamily: 'inherit',
            fontSize: 15,
            fontWeight: 900,
            cursor: disabled ? 'wait' : 'pointer',
            opacity: disabled || !normalizeItem(value) ? 0.65 : 1
          }}
        >
          +
        </button>
      </div>
    );
  }

  function ChecklistWidget({ day, trip, editMode, onRemove, hideHeader }) {
    const [draft, setDraft] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    const [checkedMap, setCheckedMap] = React.useState({});
    const inputRef = React.useRef(null);

    const items = safeArray(day && day.todo);

    React.useEffect(function resetOnDayChange() {
      setDraft('');
      setCheckedMap({});
    }, [day && day.id]);

    if (!day || !trip) {
      return (
        <div style={widgetCardStyle()}>
          <ChecklistHeader  editMode={editMode}  onRemove={onRemove}  hideHeader={hideHeader}/>
          <div style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 13,
                color: 'var(--muted)',
                lineHeight: '19px'
              }}
            >
              Sélectionne une journée pour afficher sa checklist.
            </div>
          </div>
        </div>
      );
    }

    function itemKey(index) {
      return String(day.id || 'day') + '_' + index;
    }

    function isChecked(index) {
      return !!checkedMap[itemKey(index)];
    }

    function toggleChecked(index) {
      const key = itemKey(index);

      setCheckedMap(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }

    async function saveItems(nextItems) {
      if (!day.id || !trip.id || saving) return;

      setSaving(true);

      try {
        await window.SB.updateDay(day.id, {
          todo: nextItems
        });

        const refreshedTrip = await window.SB.loadTrip(trip.id);

        Store.set({
          trip: refreshedTrip
        });
      } catch (error) {
        Store.showToast('Impossible de sauvegarder la checklist.');
      } finally {
        setSaving(false);
      }
    }

    async function addItem() {
      const text = normalizeItem(draft);

      if (!text || saving) return;

      const nextItems = [
        ...items,
        text
      ];

      setDraft('');
      await saveItems(nextItems);

      window.setTimeout(function focusInput() {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }

    async function deleteItem(index) {
      if (saving) return;

      const nextItems = items.filter(function keepItem(_, itemIndex) {
        return itemIndex !== index;
      });

      setCheckedMap(prev => {
        const next = { ...prev };
        delete next[itemKey(index)];
        return next;
      });

      await saveItems(nextItems);
    }

    return (
      <div style={widgetCardStyle()}>
        <ChecklistHeader  editMode={editMode}  onRemove={onRemove}  hideHeader={hideHeader}/>

        <div style={{ padding: 16 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {items.length > 0 ? (
              items.map(function renderItem(item, index) {
                return (
                  <ChecklistRow
                    key={index}
                    item={item}
                    index={index}
                    checked={isChecked(index)}
                    disabled={saving}
                    onToggle={toggleChecked}
                    onDelete={deleteItem}
                  />
                );
              })
            ) : (
              <ChecklistEmpty />
            )}

            <ChecklistComposer
              value={draft}
              disabled={saving}
              inputRef={inputRef}
              onChange={setDraft}
              onSubmit={addItem}
            />

            {saving && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11.5,
                  color: 'var(--faint)',
                  fontWeight: 700
                }}
              >
                Sauvegarde…
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  window.ChecklistWidget = ChecklistWidget;
})();
