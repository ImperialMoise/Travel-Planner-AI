// ════════════════════════════════════════════════════════════
// Toolbox.js — Boîte à outils latérale
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Afficher les widgets du voyage / jour actif.
// - Ajouter / retirer des widgets.
// - Réduire / développer chaque widget.
// - Garder un scroll propre.
// - Utiliser les widgets extraits dans ui/widgets.
//
// Dépendances globales :
// - React
// - Store
// - Icon
// - window.ChecklistWidget
// - window.DayNoteWidget
// - window.GlobalNoteWidget
// - window.CurrencyWidget
// - window.DayScoreWidget
// - window.CalendarWidget
// - window.AroundStepWidgetV2
//
// API :
//   <window.Toolbox width={320} />
//
// ════════════════════════════════════════════════════════════

(function initToolbox() {
  const STORAGE_KEY = 'atelier_toolbox_v2';

  const TOOL_DEFINITIONS = {
    checklist: {
      id: 'checklist',
      label: 'Checklist',
      description: 'À ne pas oublier pour la journée.',
      icon: 'check',
      defaultOpen: true
    },
    dayNote: {
      id: 'dayNote',
      label: 'Journal du jour',
      description: 'Note liée à la journée sélectionnée.',
      icon: 'sparkle',
      defaultOpen: true
    },
globalNote: {
  id: 'globalNote',
  label: 'Notes',
  description: 'Notes globales du voyage.',
  icon: 'file',
  defaultOpen: true
},
    ideas: {
      id: 'ideas',
      label: 'Boîte à idées',
      description: 'Lieux, activités et liens à étudier.',
      icon: 'sparkle',
      defaultOpen: true
    },
    currency: {
      id: 'currency',
      label: 'Convertisseur',
      description: 'Conversion rapide de devises.',
      icon: 'arrow',
      defaultOpen: false
    },
    calendar: {
      id: 'calendar',
      label: 'Calendrier',
      description: 'Repères et dates importantes.',
      icon: 'cal',
      defaultOpen: false
    },
    score: {
      id: 'score',
      label: 'Score & trajets',
      description: 'Diagnostic indicatif de la journée.',
      icon: 'route',
      defaultOpen: false
    },
    around: {
      id: 'around',
      label: 'Autour de ce lieu',
      description: 'Lieux proches de l’étape sélectionnée.',
      icon: 'pin',
      defaultOpen: true
    }
  };

  const DEFAULT_TOOLS = [
    'checklist',
    'dayNote',
    'globalNote',
    'ideas',
    'around',
    'score',
    'currency'
  ];

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function readStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;

      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      return parsed;
    } catch (error) {
      return null;
    }
  }

  function writeStorage(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      // localStorage peut être indisponible : on ignore.
    }
  }

  function normalizeToolIds(ids) {
    const clean = safeArray(ids).filter(function keepKnownTool(id) {
      return !!TOOL_DEFINITIONS[id];
    });

    return clean.length ? clean : DEFAULT_TOOLS.slice();
  }

  function createInitialState() {
    const saved = readStorage();

    let tools = normalizeToolIds(saved && saved.tools);

    if (
      saved &&
      saved.ideasIntroduced !== true &&
      !tools.includes('ideas')
    ) {
      tools = [
        'ideas',
        ...tools
      ];
    }

    const open = {};

    Object.keys(TOOL_DEFINITIONS).forEach(function initOpen(id) {
      const definition = TOOL_DEFINITIONS[id];

      open[id] =
        saved &&
        saved.open &&
        Object.prototype.hasOwnProperty.call(saved.open, id)
          ? !!saved.open[id]
          : !!definition.defaultOpen;
    });

    return {
      tools,
      open,
      libraryOpen: false,
      editMode: false
    };
  }

  function findSelectedStep(trip, selectedStepId) {
    if (!trip || !Array.isArray(trip.days) || !selectedStepId) return null;

    for (let dayIndex = 0; dayIndex < trip.days.length; dayIndex += 1) {
      const day = trip.days[dayIndex];
      const steps = Array.isArray(day.steps) ? day.steps : [];

      const found = steps.find(function findStep(step) {
        return String(step.id) === String(selectedStepId);
      });

      if (found) {
        return found;
      }
    }

    return null;
  }

  function widgetShellStyle() {
  return {
    background: 'var(--card)',
    borderRadius: 14,
    boxShadow: '0 2px 8px rgba(82,98,91,0.05)',
    border: '1px solid var(--outline-variant)',
    overflow: 'hidden'
  };
}

  function ToolboxButton({
    children,
    onClick,
    title,
    active,
    danger,
    disabled
  }) {
    return (
      <button
        type="button"
        title={title}
        onClick={onClick}
        disabled={disabled}
        style={{
          height: 34,
          minWidth: 34,
          padding: children && typeof children === 'string' ? '0 12px' : '0 10px',
          borderRadius: 999,
          border: active
            ? '1px solid var(--accent)'
            : danger
              ? '1px solid rgba(192,86,63,.35)'
              : '1px solid var(--outline-variant)',
          background: active
            ? 'var(--accent)'
            : danger
              ? 'rgba(192,86,63,.10)'
              : 'var(--inset)',
          color: active
            ? 'var(--accent-ink)'
            : danger
              ? '#c0563f'
              : 'var(--text)',
          cursor: disabled ? 'default' : 'pointer',
          fontFamily: 'inherit',
          fontSize: 12,
          fontWeight: 900,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          opacity: disabled ? 0.6 : 1,
          flexShrink: 0
        }}
      >
        {children}
      </button>
    );
  }

  function ToolFrame({
  tool,
  open,
  editMode,
  onToggle,
  onRemove,
  children
}) {
  const definition = TOOL_DEFINITIONS[tool];

  if (!definition) return null;

  return (
    <div
      style={{
        width: '100%',
        flexShrink: 0,
        ...widgetShellStyle()
      }}
    >
      <div
        style={{
          minHeight: 42,
          padding: '9px 10px',
          borderBottom: open ? '1px solid var(--outline-variant)' : 'none',
          background: 'var(--card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          position: 'sticky',
          top: 0,
          zIndex: 2
        }}
      >
        <div
          style={{
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span
            aria-hidden="true"
            style={{
              color: 'var(--faint)',
              fontSize: 15,
              lineHeight: 1,
              letterSpacing: -4,
              transform: 'rotate(90deg)',
              opacity: 0.8,
              flexShrink: 0
            }}
          >
            ⋮⋮
          </span>

          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 999,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0
            }}
          >
            <Icon name={definition.icon} size={13} />
          </span>

          <span
            style={{
              minWidth: 0,
              display: 'block',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {definition.label}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            flexShrink: 0
          }}
        >
          <button
            type="button"
            title={open ? 'Réduire' : 'Développer'}
            onClick={onToggle}
            style={{
              width: 24,
              height: 24,
              borderRadius: 999,
              border: 'none',
              background: 'transparent',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 900,
              lineHeight: 1
            }}
          >
            {open ? '⌃' : '⌄'}
          </button>

          {editMode && (
            <button
              type="button"
              title="Retirer ce widget"
              onClick={onRemove}
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                border: 'none',
                background: 'rgba(192,86,63,.08)',
                color: '#c0563f',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'inherit',
                fontSize: 15,
                fontWeight: 900,
                lineHeight: 1
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {open && (
        <div>
          {children}
        </div>
      )}
    </div>
  );
}

  function ToolboxLibrary({
    tools,
    onAdd,
    onClose
  }) {
    const availableTools = Object.keys(TOOL_DEFINITIONS);

    return (
      <div
        style={{
          border: '1px solid var(--outline-variant)',
          background: 'var(--card)',
          borderRadius: 14,
          padding: 12,
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flexShrink: 0
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 2
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'var(--accent)'
              }}
            >
              Ajouter
            </div>

            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                lineHeight: '25px',
                color: 'var(--text)',
                marginTop: 2
              }}
            >
              Widgets
            </div>
          </div>

          <ToolboxButton title="Fermer" onClick={onClose}>
            ×
          </ToolboxButton>
        </div>

        {availableTools.map(function renderTool(id) {
          const definition = TOOL_DEFINITIONS[id];
          const alreadyAdded = tools.includes(id);

          return (
            <button
              key={id}
              type="button"
              disabled={alreadyAdded}
              onClick={() => onAdd(id)}
              style={{
                border: '1px solid var(--outline-variant)',
                background: alreadyAdded ? 'var(--inset)' : 'var(--card)',
                color: alreadyAdded ? 'var(--faint)' : 'var(--text)',
                borderRadius: 12,
                padding: 10,
                cursor: alreadyAdded ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: alreadyAdded ? 0.62 : 1
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0
                }}
              >
                <Icon name={definition.icon} size={15} />
              </span>

              <span style={{ minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 900,
                    color: alreadyAdded ? 'var(--faint)' : 'var(--text)'
                  }}
                >
                  {definition.label}
                </span>

                <span
                  style={{
                    display: 'block',
                    marginTop: 2,
                    color: 'var(--muted)',
                    fontSize: 11.5,
                    lineHeight: '16px'
                  }}
                >
                  {alreadyAdded ? 'Déjà ajouté' : definition.description}
                </span>
              </span>

              <span
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: alreadyAdded ? 'var(--faint)' : 'var(--accent)'
                }}
              >
                {alreadyAdded ? '✓' : '+'}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

function PlaceholderWidget({ children }) {
  return (
    <div
      style={{
        padding: 16,
        color: 'var(--muted)',
        fontSize: 13,
        lineHeight: '19px'
      }}
    >
      {children}
    </div>
  );
}

  function Toolbox({ width = 320, activeTool = null }) {
    const {
      trip,
      selectedDayIndex = 0,
      selectedStepId
    } = Store.useStore(function select(state) {
      return {
        trip: state.trip,
        selectedDayIndex: state.selectedDayIndex || 0,
        selectedStepId: state.selectedStepId
      };
    });

    const initial = React.useMemo(createInitialState, []);

    const [tools, setTools] = React.useState(initial.tools);
    const [openMap, setOpenMap] = React.useState(initial.open);
    const [libraryOpen, setLibraryOpen] = React.useState(initial.libraryOpen);
    const [editMode, setEditMode] = React.useState(initial.editMode);

    const day = trip && Array.isArray(trip.days)
      ? trip.days[selectedDayIndex] || null
      : null;

    const selectedStep = findSelectedStep(trip, selectedStepId);

    React.useEffect(function persistToolbox() {
      writeStorage({
        tools,
        open: openMap,
        ideasIntroduced: true
      });
    }, [tools, openMap]);

    function toggleTool(id) {
      setOpenMap(function update(prev) {
        return {
          ...prev,
          [id]: !prev[id]
        };
      });
    }

    function addTool(id) {
      if (!TOOL_DEFINITIONS[id]) return;

      setTools(function update(prev) {
        if (prev.includes(id)) return prev;

        return [
          ...prev,
          id
        ];
      });

      setOpenMap(function update(prev) {
        return {
          ...prev,
          [id]: true
        };
      });
    }

    function removeTool(id) {
      setTools(function update(prev) {
        return prev.filter(function keepTool(toolId) {
          return toolId !== id;
        });
      });
    }

    function resetTools() {
  setTools(DEFAULT_TOOLS.slice());

  const nextOpen = {};

  Object.keys(TOOL_DEFINITIONS).forEach(function closeTool(id) {
    nextOpen[id] = false;
  });

  setOpenMap(nextOpen);
  setLibraryOpen(false);
  setEditMode(false);
}

    function renderToolContent(id) {
      if (id === 'checklist') {
        return window.ChecklistWidget ? (
          <window.ChecklistWidget
           day={day}
           trip={trip}
           editMode={false}
           hideHeader
          />
        ) : (
          <PlaceholderWidget>
            Le widget Checklist n’est pas chargé.
          </PlaceholderWidget>
        );
      }

      if (id === 'dayNote') {
        return window.DayNoteWidget ? (
          <window.DayNoteWidget
            day={day}
            trip={trip}
            editMode={false}
            hideHeader
          />
        ) : (
          <PlaceholderWidget>
            Le widget Journal n’est pas chargé.
          </PlaceholderWidget>
        );
      }

      if (id === 'globalNote') {
        return window.GlobalNoteWidget ? (
          <window.GlobalNoteWidget
           trip={trip}
           editMode={false}
           hideHeader
          />
        ) : (
          <PlaceholderWidget>
            Le widget Carnet n’est pas chargé.
          </PlaceholderWidget>
        );
      }

      if (id === 'ideas') {
        return window.TripIdeasWidget ? (
          <window.TripIdeasWidget
            trip={trip}
          />
        ) : (
          <PlaceholderWidget>
            Le widget Boîte à idées n’est pas chargé.
          </PlaceholderWidget>
        );
      }

      if (id === 'currency') {
        return window.CurrencyWidget ? (
          <window.CurrencyWidget editMode={false} />
        ) : (
          <PlaceholderWidget>
            Le widget Convertisseur n’est pas chargé.
          </PlaceholderWidget>
        );
      }

      if (id === 'calendar') {
        return window.CalendarWidget ? (
          <window.CalendarWidget
            trip={trip}
            editMode={false}
          />
        ) : (
          <PlaceholderWidget>
            Le widget Calendrier n’est pas chargé.
          </PlaceholderWidget>
        );
      }

      if (id === 'score') {
        return window.DayScoreWidget ? (
          <window.DayScoreWidget
            day={day}
            editMode={false}
          />
        ) : (
          <PlaceholderWidget>
            Le widget Score n’est pas chargé.
          </PlaceholderWidget>
        );
      }

      if (id === 'around') {
        return window.AroundStepWidgetV2 ? (
          <window.AroundStepWidgetV2
            step={selectedStep}
            editMode={false}
            hideHeader
          />
        ) : (
          <PlaceholderWidget>
            Le widget Autour de ce lieu n’est pas chargé.
          </PlaceholderWidget>
        );
      }

      return (
        <PlaceholderWidget>
          Ce widget n’existe plus.
        </PlaceholderWidget>
      );
    }

   if (activeTool === 'ideas-notes') {
      return (
        <div className="fv-notebooks">
          {['ideas', 'dayNote', 'globalNote'].map(id => (
            <section key={id}>
              <h3>{TOOL_DEFINITIONS[id].label}</h3>
              {renderToolContent(id)}
            </section>
          ))}
        </div>
      );
    }

    if (activeTool && TOOL_DEFINITIONS[activeTool]) {
      return (
        <section className="workspace-tool-detail">
          <h3>{TOOL_DEFINITIONS[activeTool].label}</h3>
          {renderToolContent(activeTool)}
        </section>
      );
    }

    return (
      <aside
        style={{
          width,
          flexShrink: 0,
          height: '100%',
          minHeight: 0,
          borderLeft: '1px solid var(--outline-variant)',
          background: 'var(--surface-container-low,#f8f3e9)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
<div
  style={{
    padding: '14px 14px 12px',
    borderBottom: '1px solid var(--outline-variant)',
    background: 'var(--surface-container-low, #f8f3e9)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  }}
>
  <div style={{ minWidth: 0 }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        color: 'var(--text)'
      }}
    >
      Boîte à outils
    </div>

    <div
      style={{
        marginTop: 2,
        fontSize: 10.5,
        fontWeight: 700,
        color: 'var(--faint)'
      }}
    >
      Widgets utiles au voyage
    </div>
  </div>

  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0
    }}
  >
    <ToolboxButton
      title="Ajouter un widget"
      onClick={() => setLibraryOpen(value => !value)}
      active={libraryOpen}
    >
      +
    </ToolboxButton>

    <ToolboxButton
      title={editMode ? 'Terminer l’édition' : 'Organiser les widgets'}
      onClick={() => setEditMode(value => !value)}
      active={editMode}
    >
      ✎
    </ToolboxButton>
  </div>
</div>
        <div
          data-toolbox-scroll="true"
          style={{
            flex: '1 1 0',
            minHeight: 0,
            overflowY: 'scroll',
            overflowX: 'hidden',
            scrollbarGutter: 'stable',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          {libraryOpen && (
            <ToolboxLibrary
              tools={tools}
              onAdd={addTool}
              onClose={() => setLibraryOpen(false)}
            />
          )}

          {tools.map(function renderTool(id) {
            const definition = TOOL_DEFINITIONS[id];

            if (!definition) return null;

            return (
              <ToolFrame
                key={id}
                tool={id}
                open={openMap[id] !== false}
                editMode={editMode}
                onToggle={() => toggleTool(id)}
                onRemove={() => removeTool(id)}
              >
                {renderToolContent(id)}
              </ToolFrame>
            );
          })}

          {editMode && (
            <button
              type="button"
              onClick={resetTools}
              style={{
                width: '100%',
                minHeight: 42,
                border: '1px solid rgba(192,86,63,.35)',
                background: 'rgba(192,86,63,.08)',
                color: '#c0563f',
                borderRadius: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12.5,
                fontWeight: 900,
                flexShrink: 0
              }}
            >
              Réinitialiser la boîte à outils
            </button>
          )}
        </div>
      </aside>
    );
  }

  const SHORTCUT_KEY = 'fabrique_tool_shortcuts_v1';
  const SHORTCUT_EVENT = 'fabrique-tool-shortcuts-changed';
  const SHORTCUTS = [
    { id: 'ideas-notes', label: 'Idées & notes', icon: 'file', context: 'Voyage et journée' },
    { id: 'checklist', label: 'Checklist', icon: 'check', context: 'Journée sélectionnée' },
    { id: 'print', label: 'Imprimer / PDF', icon: 'print', context: 'Voyage entier' },
    ...Object.values(TOOL_DEFINITIONS)
      .filter(tool => tool.id !== 'checklist')
      .map(tool => ({
        ...tool,
        context: ['dayNote', 'score'].includes(tool.id)
          ? 'Journée sélectionnée'
          : tool.id === 'around' ? 'Étape sélectionnée' : 'Voyage'
      }))
  ];
  const DEFAULT_SHORTCUTS = ['ideas-notes', 'checklist', 'print'];

  function readShortcuts() {
    try {
      const saved = JSON.parse(localStorage.getItem(SHORTCUT_KEY));
      if (Array.isArray(saved)) {
        return [...new Set(saved.filter(id => SHORTCUTS.some(tool => tool.id === id)))];
      }
    } catch (error) {}
    return DEFAULT_SHORTCUTS.slice();
  }

  function WorkspaceTools() {
    const { trip } = Store.useStore(state => ({ trip: state.trip }));
    const [favorites, setFavorites] = React.useState(readShortcuts);
    const [editing, setEditing] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const catalogueId = React.useId();
    const menuRef = React.useRef(null);
    const triggerRef = React.useRef(null);
    React.useEffect(() => {
      if (!editing) return;
      const dismiss = event => {
        if (!menuRef.current?.contains(event.target)) setEditing(false);
      };
      document.addEventListener('pointerdown', dismiss);
      return () => document.removeEventListener('pointerdown', dismiss);
    }, [editing]);

    React.useEffect(() => {
      const sync = event => {
        if (event.type === SHORTCUT_EVENT) setFavorites(event.detail.slice());
        else if (event.key === SHORTCUT_KEY || event.key === null) setFavorites(readShortcuts());
      };
      window.addEventListener(SHORTCUT_EVENT, sync);
      window.addEventListener('storage', sync);
      return () => {
        window.removeEventListener(SHORTCUT_EVENT, sync);
        window.removeEventListener('storage', sync);
      };
    }, []);

    function save(next, announcement) {
      setFavorites(next);
      let persisted = true;
      try {
        localStorage.setItem(SHORTCUT_KEY, JSON.stringify(next));
      } catch (error) {
        persisted = false;
      }
      window.dispatchEvent(new CustomEvent(SHORTCUT_EVENT, { detail: next }));
      setMessage(announcement + (persisted ? '' : ' Sauvegarde indisponible : changement temporaire.'));
    }

    function toggleFavorite(tool) {
      const pinned = favorites.includes(tool.id);
      save(
        pinned ? favorites.filter(id => id !== tool.id) : [...favorites, tool.id],
        tool.label + (pinned ? ' désépinglé. Son contenu est conservé.' : ' épinglé.')
      );
    }

    function move(id, direction) {
      const next = favorites.slice();
      const index = next.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= next.length) return;
      [next[index], next[target]] = [next[target], next[index]];
      save(next, SHORTCUTS.find(tool => tool.id === id).label + ' : position ' + (target + 1) + '.');
    }

    function openTool(id) {
      setEditing(false);
      if (id === 'print') {
        if (trip && window.TripPrint?.open) window.TripPrint.open(trip);
        else Store.showToast('L’export PDF est indisponible.');
        return;
      }
      window.dispatchEvent(new CustomEvent('open-workspace-tools', { detail: { tool: id } }));
    }

    return (
      <section className="fv-toolstrip" aria-label="Outils du voyage">
        <div className="fv-toolstrip-favorites">
          {favorites.map(id => {
            const tool = SHORTCUTS.find(item => item.id === id);
            return (
              <button key={id} type="button" className="fv-toolstrip-button" onClick={() => openTool(id)}>
                <Icon name={tool.icon} size={16} /><span>{tool.label}</span>
              </button>
            );
          })}
          {!favorites.length && <span className="fv-toolstrip-empty">Épingle tes outils utiles.</span>}
        </div>
        <div className="fv-toolstrip-settings" ref={menuRef}
          onKeyDown={event => {
            if (event.key === 'Escape' && editing) {
              event.preventDefault();
              event.stopPropagation();
              setEditing(false);
              triggerRef.current?.focus();
            }
          }}>
          <button id="workspace-tools-trigger" ref={triggerRef} type="button"
            className="fv-toolstrip-button" aria-expanded={editing} aria-controls={catalogueId}
            onClick={() => setEditing(value => !value)}>
            <Icon name="gear" size={16} />Personnaliser
          </button>
          <div id={catalogueId} className="fv-toolstrip-menu" hidden={!editing}>
            <div className="fv-toolstrip-menu-heading">
              <strong>Mes raccourcis</strong>
              <button type="button" className="fv-tools-control" onClick={() => {
                setEditing(false); triggerRef.current?.focus();
              }}>Terminer</button>
            </div>
            <p>Les étoiles ajoutent ou retirent un favori. Les flèches changent son ordre.</p>
            <ul>
              {SHORTCUTS.map(tool => {
                const index = favorites.indexOf(tool.id);
                return (
                  <li key={tool.id}>
                    <button type="button" className="fv-toolstrip-open" onClick={() => openTool(tool.id)}>
                      <span>{tool.label}</span><small>{tool.context}</small>
                    </button>
                    <div className="fv-toolstrip-order">
                      {index >= 0 && (
                        <>
                          <button type="button" className="fv-tools-control"
                            aria-label={'Avancer ' + tool.label} aria-disabled={index === 0}
                            onClick={() => move(tool.id, -1)}>←</button>
                          <span aria-label={'Position ' + (index + 1)}>{index + 1}</span>
                          <button type="button" className="fv-tools-control"
                            aria-label={'Reculer ' + tool.label} aria-disabled={index === favorites.length - 1}
                            onClick={() => move(tool.id, 1)}>→</button>
                        </>
                      )}
                      <button type="button" className="fv-tools-control"
                        aria-label={'Épingler ' + tool.label} aria-pressed={index >= 0}
                        onClick={() => toggleFavorite(tool)}>
                        <span aria-hidden="true">{index >= 0 ? '★' : '☆'}</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="fv-tools-control"
              onClick={() => save(DEFAULT_SHORTCUTS.slice(), 'Raccourcis par défaut restaurés.')}>
              Restaurer les raccourcis
            </button>
            <p>Préférences enregistrées dans ce navigateur. Aucun contenu n’est supprimé.</p>
          </div>
        </div>
        <span className="screen-reader-only" role="status" aria-live="polite">{message}</span>
      </section>
    );
  }

  window.WorkspaceToolDefinitions = TOOL_DEFINITIONS;
  window.WorkspaceTools = WorkspaceTools;
  window.Toolbox = Toolbox;
  window.ToolboxV2 = Toolbox;
})();
