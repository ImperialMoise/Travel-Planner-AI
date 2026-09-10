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
        aria-label={title}
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
  function handleKeyDown(event) {
    if (!onClick) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(event);
    }
  }

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
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
    </div>
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
    const contentId = React.useId();
    const Header = onToggle ? 'button' : 'div';

    return (
      <section style={{
        flexShrink: 0,
        minWidth: 0,
        minHeight: 0,
        borderTop: noBorder
          ? 'none'
          : '1px solid var(--outline-variant)',
        paddingTop: noBorder ? 0 : 14,
        ...style
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: isOpen ? 12 : 0
        }}>
          <Header
            type={onToggle ? 'button' : undefined}
            aria-expanded={onToggle ? isOpen : undefined}
            aria-controls={onToggle ? contentId : undefined}
            onClick={onToggle ? event => {
              event.preventDefault();
              event.stopPropagation();
              onToggle();
            } : undefined}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              flex: 1,
              gap: 10,
              minWidth: 0,
              minHeight: 44,
              padding: '6px 0',
              border: 0,
              borderRadius: 6,
              background: 'transparent',
              color: 'var(--text)',
              font: 'inherit',
              textAlign: 'left',
              cursor: onToggle ? 'pointer' : 'default'
            }}
          >
            {icon && (
              <span aria-hidden="true" style={{
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: 9,
                background: 'var(--accent-soft)',
                color: 'var(--accent)'
              }}>
                <Icon name={icon} size={16} />
              </span>
            )}

            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                display: 'block',
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                lineHeight: '26px',
                overflowWrap: 'anywhere'
              }}>
                {title || kicker}
              </span>

              {subtitle && (
                <span style={{
                  display: 'block',
                  marginTop: 4,
                  color: 'var(--muted)',
                  fontSize: 12,
                  lineHeight: '18px',
                  overflowWrap: 'anywhere'
                }}>
                  {subtitle}
                </span>
              )}
            </span>

            {onToggle && (
              <span aria-hidden="true" style={{
                flexShrink: 0,
                padding: '4px 2px',
                color: 'var(--muted)',
                fontSize: 18
              }}>
                {isOpen ? '⌄' : '›'}
              </span>
            )}
          </Header>

          {actions && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              gap: 6,
              paddingTop: 5
            }}>
              {actions}
            </div>
          )}
        </div>

        <div id={contentId}>
          {isOpen && children}
        </div>
      </section>
    );
  }

  window.RailSection = RailSection;
  window.RailIconButton = RailIconButton;
  window.RailActionButton = RailActionButton;
  window.RailEmptyState = RailEmptyState;
  window.RailCard = RailCard;
})();
