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
      label: 'Carnet du voyage',
      description: 'Notes globales du voyage.',
      icon: 'file',
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

    const tools = normalizeToolIds(saved && saved.tools);

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
      borderRadius: 12,
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
            minHeight: 46,
            padding: '10px 12px',
            borderBottom: open ? '1px solid var(--outline-variant)' : 'none',
            background: 'var(--soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
          }}
        >
          <div
            style={{
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 9
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
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

            <span style={{ minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 900,
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {definition.label}
              </span>

              <span
                style={{
                  display: 'block',
                  marginTop: 1,
                  fontSize: 11.5,
                  lineHeight: '15px',
                  color: 'var(--muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {definition.description}
              </span>
            </span>
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
              title={open ? 'Réduire' : 'Développer'}
              onClick={onToggle}
            >
              {open ? '⌄' : '›'}
            </ToolboxButton>

            {editMode && (
              <ToolboxButton
                title="Retirer ce widget"
                onClick={onRemove}
                danger
              >
                ×
              </ToolboxButton>
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

  function PlaceholderWidget({ title, children }) {
    return (
      <div
        style={{
          padding: 16,
          color: 'var(--muted)',
          fontSize: 13,
          lineHeight: '19px'
        }}
      >
        <strong style={{ color: 'var(--text)' }}>{title}</strong>
        <br />
        {children}
      </div>
    );
  }

  function Toolbox({ width = 320 }) {
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
        open: openMap
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

      Object.keys(TOOL_DEFINITIONS).forEach(function resetOpen(id) {
        nextOpen[id] = !!TOOL_DEFINITIONS[id].defaultOpen;
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
          />
        ) : (
          <PlaceholderWidget title="Checklist">
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
          />
        ) : (
          <PlaceholderWidget title="Journal du jour">
            Le widget Journal n’est pas chargé.
          </PlaceholderWidget>
        );
      }

      if (id === 'globalNote') {
        return window.GlobalNoteWidget ? (
          <window.GlobalNoteWidget
            trip={trip}
            editMode={false}
          />
        ) : (
          <PlaceholderWidget title="Carnet du voyage">
            Le widget Carnet n’est pas chargé.
          </PlaceholderWidget>
        );
      }

      if (id === 'currency') {
        return window.CurrencyWidget ? (
          <window.CurrencyWidget editMode={false} />
        ) : (
          <PlaceholderWidget title="Convertisseur">
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
          <PlaceholderWidget title="Calendrier">
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
          <PlaceholderWidget title="Score & trajets">
            Le widget Score n’est pas chargé.
          </PlaceholderWidget>
        );
      }

      if (id === 'around') {
        return window.AroundStepWidgetV2 ? (
          <window.AroundStepWidgetV2
            step={selectedStep}
            editMode={false}
          />
        ) : (
          <PlaceholderWidget title="Autour de ce lieu">
            Le widget Autour de ce lieu n’est pas chargé.
          </PlaceholderWidget>
        );
      }

      return (
        <PlaceholderWidget title="Widget inconnu">
          Ce widget n’existe plus.
        </PlaceholderWidget>
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
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '-4px 0 24px rgba(45,73,63,0.05)'
        }}
      >
        <div
          style={{
            padding: '20px 18px 16px',
            borderBottom: '1px solid var(--outline-variant)',
            background: 'var(--card)',
            flexShrink: 0
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  color: 'var(--accent)'
                }}
              >
                Atelier
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 24,
                  lineHeight: '30px',
                  color: 'var(--text)',
                  marginTop: 3
                }}
              >
                Boîte à outils
              </div>

              <div
                style={{
                  marginTop: 5,
                  fontSize: 12.5,
                  lineHeight: '18px',
                  color: 'var(--muted)'
                }}
              >
                {day
                  ? 'Jour ' + (selectedDayIndex + 1)
                  : 'Aucune journée sélectionnée'}
                {selectedStep ? ' · ' + (selectedStep.label || selectedStep.lieu || 'Étape') : ''}
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
        </div>

        <div
          data-toolbox-scroll="true"
          style={{
            flex: '1 1 0',
            minHeight: 0,
            overflowY: 'scroll',
            overflowX: 'hidden',
            scrollbarGutter: 'stable',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14
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

  window.Toolbox = Toolbox;
  window.ToolboxV2 = Toolbox;
})();
