// ════════════════════════════════════════════════════════════
// AccountModal.js — Modale “Mon compte”
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Afficher le profil utilisateur.
// - Modifier le pseudo public.
// - Afficher l’email de connexion.
// - Afficher les infos utiles du compte.
// - Permettre la déconnexion.
// - Séparer clairement “Mon compte” des “Paramètres”.
//
// Dépendances globales :
// - React
// - ReactDOM
// - Store
// - Icon
// - window.SB
//
// Export :
// - window.AccountModal
//
// ════════════════════════════════════════════════════════════

(function initAccountModal() {
  function safeString(value) {
    return String(value == null ? '' : value).trim();
  }

  function getDisplayName(user) {
    if (!user) return '';

    const metadata = user.user_metadata || {};

    return (
      safeString(metadata.display_name) ||
      safeString(metadata.full_name) ||
      safeString(metadata.name) ||
      safeString(user.email && user.email.split('@')[0])
    );
  }

  function getInitials(value) {
    const clean = safeString(value || 'VP');

    const parts = clean
      .split(/[.\s_-]+/)
      .filter(Boolean)
      .slice(0, 2);

    if (!parts.length) return 'VP';

    return parts
      .map(function getFirstLetter(part) {
        return part[0];
      })
      .join('')
      .toUpperCase();
  }

  function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function inputStyle() {
    return {
      width: '100%',
      border: '1px solid var(--outline-variant)',
      background: 'var(--inset)',
      color: 'var(--text)',
      borderRadius: 12,
      padding: '10px 12px',
      fontFamily: 'inherit',
      fontSize: 14,
      outline: 'none'
    };
  }

  function labelStyle() {
    return {
      fontSize: 11,
      fontWeight: 900,
      color: 'var(--muted)',
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      marginBottom: 6
    };
  }

  function Field({ label, children }) {
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={labelStyle()}>{label}</div>
        {children}
      </div>
    );
  }

  function Button({
    children,
    onClick,
    variant,
    disabled,
    icon,
    style
  }) {
    const primary = variant === 'primary';
    const danger = variant === 'danger';

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          minHeight: 40,
          borderRadius: 999,
          border: primary
            ? '1px solid var(--accent)'
            : danger
              ? '1px solid rgba(192,86,63,.35)'
              : '1px solid var(--outline-variant)',
          background: primary
            ? 'var(--accent)'
            : danger
              ? 'rgba(192,86,63,.10)'
              : 'var(--card)',
          color: primary
            ? 'var(--accent-ink)'
            : danger
              ? '#c0563f'
              : 'var(--text)',
          padding: '0 15px',
          cursor: disabled ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          fontSize: 13,
          fontWeight: 900,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.68 : 1,
          ...style
        }}
      >
        {icon ? <Icon name={icon} size={15} /> : null}
        {children}
      </button>
    );
  }

  function InfoRow({ label, value }) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 0',
          borderBottom: '1px solid var(--outline-variant)'
        }}
      >
        <span
          style={{
            color: 'var(--muted)',
            fontSize: 13
          }}
        >
          {label}
        </span>

        <span
          style={{
            color: 'var(--text)',
            fontSize: 13,
            fontWeight: 800,
            textAlign: 'right',
            overflowWrap: 'anywhere'
          }}
        >
          {value || '—'}
        </span>
      </div>
    );
  }

  function AccountModal({ onClose }) {
    const {
      user,
      trips = [],
      activeTripId
    } = Store.useStore(function select(state) {
      return {
        user: state.user,
        trips: state.trips || [],
        activeTripId: state.activeTripId
      };
    });

    const initialName = getDisplayName(user);

    const [displayName, setDisplayName] = React.useState(initialName);
    const [saving, setSaving] = React.useState(false);
    const [signingOut, setSigningOut] = React.useState(false);
    const [error, setError] = React.useState('');

    React.useEffect(function syncUserName() {
      setDisplayName(getDisplayName(user));
    }, [user && user.id]);

    React.useEffect(function listenEscape() {
      function onKeyDown(event) {
        if (event.key === 'Escape') onClose();
      }

      document.addEventListener('keydown', onKeyDown);

      return function cleanup() {
        document.removeEventListener('keydown', onKeyDown);
      };
    }, [onClose]);

    if (!user) return null;

    const cleanName = safeString(displayName);
    const email = safeString(user.email);
    const initials = getInitials(cleanName || email);
    const dirty = cleanName !== initialName;

    async function saveProfile() {
      if (!cleanName || saving) return;

      setSaving(true);
      setError('');

      try {
        if (!window.SB || !window.SB.sb) {
          throw new Error('Client Supabase indisponible');
        }

        const { data, error: authError } = await window.SB.sb.auth.updateUser({
          data: {
            display_name: cleanName
          }
        });

        if (authError) throw authError;

        try {
          await window.SB.sb
            .from('profiles')
            .upsert(
              {
                id: user.id,
                email,
                display_name: cleanName
              },
              {
                onConflict: 'id'
              }
            );
        } catch (profileError) {
          console.warn('Profil DB non mis à jour, auth metadata OK :', profileError);
        }

        const updatedUser = data && data.user
          ? data.user
          : {
              ...user,
              user_metadata: {
                ...(user.user_metadata || {}),
                display_name: cleanName
              }
            };

        Store.set({
          user: updatedUser
        });

        Store.showToast('Profil mis à jour');
      } catch (err) {
        setError(err.message || 'Erreur profil');
      } finally {
        setSaving(false);
      }
    }

    async function signOut() {
      if (signingOut) return;

      setSigningOut(true);
      setError('');

      try {
        await window.SB.signOut();

        Store.set({
          user: null,
          activeTripId: null,
          trip: null,
          selectedDayIndex: 0,
          selectedStepId: null,
          pendingEditStepId: null,
          view: 'itinerary'
        });

        Store.showToast('Déconnecté');
        onClose();
      } catch (err) {
        setError(err.message || 'Erreur déconnexion');
      } finally {
        setSigningOut(false);
      }
    }

    return ReactDOM.createPortal(
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 5200,
          background: 'rgba(0,0,0,.56)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}
      >
        <div
          onClick={event => event.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 22,
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              padding: '18px 20px',
              borderBottom: '1px solid var(--outline-variant)',
              background: 'var(--soft)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  color: 'var(--accent)',
                  marginBottom: 4
                }}
              >
                Mon compte
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 28,
                  lineHeight: '34px',
                  color: 'var(--text)'
                }}
              >
                Profil utilisateur
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: '1px solid var(--outline-variant)',
                background: 'var(--card)',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          <div
            style={{
              padding: 22,
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 22
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 24,
                  background: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 24,
                  fontWeight: 900,
                  fontFamily: 'var(--font-serif)',
                  flexShrink: 0
                }}
              >
                {initials}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: 'var(--text)',
                    marginBottom: 4
                  }}
                >
                  {cleanName || email}
                </div>

                <div
                  style={{
                    fontSize: 13.5,
                    color: 'var(--muted)',
                    overflowWrap: 'anywhere'
                  }}
                >
                  {email}
                </div>
              </div>
            </div>

            <Field label="Pseudo affiché">
              <input
                value={displayName}
                onChange={event => setDisplayName(event.target.value)}
                placeholder="Ton pseudo"
                style={inputStyle()}
              />
            </Field>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: 20
              }}
            >
              <Button
                variant="primary"
                onClick={saveProfile}
                disabled={saving || !dirty || !cleanName}
              >
                {saving ? 'Sauvegarde…' : dirty ? 'Sauvegarder le profil' : 'Profil à jour'}
              </Button>
            </div>

            <div
              style={{
                border: '1px solid var(--outline-variant)',
                background: 'var(--inset)',
                borderRadius: 16,
                padding: '4px 14px',
                marginBottom: 18
              }}
            >
              <InfoRow label="Email de connexion" value={email} />
              <InfoRow label="Voyages accessibles" value={String(trips.length || 0)} />
              <InfoRow label="Voyage actif" value={activeTripId ? 'Oui' : 'Aucun'} />
              <InfoRow label="Compte créé le" value={formatDate(user.created_at)} />
              <InfoRow label="Identifiant" value={user.id ? user.id.slice(0, 8) + '…' : '—'} />
            </div>

            {error && (
              <div
                style={{
                  color: '#c0563f',
                  background: 'rgba(192,86,63,.10)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  fontSize: 13,
                  lineHeight: '18px',
                  marginBottom: 16
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              <Button
                icon="gear"
                onClick={() => {
                  Store.set({ settingsOpen: true });
                  onClose();
                }}
                style={{
                  width: '100%',
                  justifyContent: 'center'
                }}
              >
                Ouvrir les paramètres de l’app
              </Button>

              <Button
                variant="danger"
                onClick={signOut}
                disabled={signingOut}
                style={{
                  width: '100%',
                  justifyContent: 'center'
                }}
              >
                {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
              </Button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  window.AccountModal = AccountModal;
})();