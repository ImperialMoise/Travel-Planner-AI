// ════════════════════════════════════════════════════════════
// RailSection.js — Section réductible de colonne latérale
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Uniformiser les blocs de colonne droite.
// - Gérer proprement les sections ouvertes / réduites.
// - Éviter de répéter les mêmes styles dans MealRail.
//
// Dépendances globales :
// - React
// - Icon
//
// API :
//   <window.RailSection
//     kicker="Restaurants"
//     title="Où manger ?"
//     icon="fork"
//     open={true}
//     onToggle={() => ...}
//     actions={...}
//   >
//     contenu
//   </window.RailSection>
//
// ════════════════════════════════════════════════════════════

(function initRailSection() {
  function RailIconButton({
    title,
    children,
    onClick,
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
          width: 34,
          height: 34,
          borderRadius: 999,
          border: danger
            ? '1px solid rgba(192,86,63,.32)'
            : active
              ? '1px solid var(--accent)'
              : '1px solid var(--outline-variant)',
          background: danger
            ? 'rgba(192,86,63,.10)'
            : active
              ? 'var(--accent)'
              : 'var(--inset)',
          color: danger
            ? '#c0563f'
            : active
              ? 'var(--accent-ink)'
              : 'var(--text)',
          display: 'grid',
          placeItems: 'center',
          cursor: disabled ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          fontSize: 13,
          fontWeight: 900,
          flexShrink: 0,
          opacity: disabled ? 0.65 : 1
        }}
      >
        {children}
      </button>
    );
  }

  function RailActionButton({
    children,
    title,
    onClick,
    active,
    primary,
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
          padding: '0 12px',
          borderRadius: 999,
          border: primary || active
            ? '1px solid var(--accent)'
            : danger
              ? '1px solid rgba(192,86,63,.32)'
              : '1px solid var(--outline-variant)',
          background: primary || active
            ? 'var(--accent)'
            : danger
              ? 'rgba(192,86,63,.10)'
              : 'var(--inset)',
          color: primary || active
            ? 'var(--accent-ink)'
            : danger
              ? '#c0563f'
              : 'var(--text)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          cursor: disabled ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          fontSize: 12,
          fontWeight: 800,
          whiteSpace: 'nowrap',
          opacity: disabled ? 0.65 : 1
        }}
      >
        {children}
      </button>
    );
  }

  function RailEmptyState({
    children,
    actionLabel,
    actionIcon,
    onAction
  }) {
    return (
      <div
        style={{
          border: '1px dashed var(--outline-variant)',
          borderRadius: 14,
          padding: 16,
          color: 'var(--muted)',
          fontSize: 13,
          lineHeight: '19px',
          background: 'var(--inset)'
        }}
      >
        <div style={{ marginBottom: onAction ? 12 : 0 }}>
          {children}
        </div>

        {onAction && (
          <button
            type="button"
            onClick={onAction}
            style={{
              width: '100%',
              height: 38,
              borderRadius: 999,
              border: '1px solid var(--accent)',
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7
            }}
          >
            {actionIcon ? <Icon name={actionIcon} size={14} /> : null}
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  function RailCard({
    children,
    onClick,
    selected,
    compact
  }) {
    const Component = onClick ? 'button' : 'div';

    return (
      <Component
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        style={{
          width: '100%',
          textAlign: 'left',
          border: selected
            ? '1px solid var(--accent)'
            : '1px solid var(--outline-variant)',
          background: selected ? 'var(--accent-soft)' : 'var(--card)',
          color: 'var(--text)',
          borderRadius: 14,
          padding: compact ? 12 : 16,
          cursor: onClick ? 'pointer' : 'default',
          boxShadow: 'var(--shadow)',
          fontFamily: 'inherit',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {children}
      </Component>
    );
  }

  function RailSection({
    kicker,
    title,
    subtitle,
    icon,
    open,
    onToggle,
    actions,
    children,
    noBorder,
    style
  }) {
    const isOpen = open !== false;

    return (
      <section
        style={{
          flexShrink: 0,
          borderTop: noBorder ? 'none' : '1px solid var(--outline-variant)',
          paddingTop: noBorder ? 0 : 16,
          minHeight: 0,
          ...style
        }}
      >
        <div
          style={{
            marginBottom: isOpen ? 12 : 0,
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
                fontWeight: 800,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: 7
              }}
            >
              {icon ? <Icon name={icon} size={13} /> : null}
              {kicker}
            </div>

            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                lineHeight: '28px',
                color: 'var(--text)',
                marginTop: 4
              }}
            >
              {title}
            </div>

            {subtitle && (
              <div
                style={{
                  marginTop: 3,
                  fontSize: 12.5,
                  lineHeight: '18px',
                  color: 'var(--muted)'
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0
            }}
          >
            {actions}

            {onToggle && (
              <RailIconButton
                title={isOpen ? 'Réduire' : 'Développer'}
                onClick={function handleToggle(event) {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggle();
                }}
              >
                {isOpen ? '⌄' : '›'}
              </RailIconButton>
            )}
          </div>
        </div>

        {isOpen && children}
      </section>
    );
  }

  window.RailSection = RailSection;
  window.RailIconButton = RailIconButton;
  window.RailActionButton = RailActionButton;
  window.RailEmptyState = RailEmptyState;
  window.RailCard = RailCard;
})();
