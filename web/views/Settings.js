function useSettingsCompact() {
  const [compact, setCompact] = React.useState(() => window.innerWidth < 760);

  React.useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < 760);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return compact;
}

const SETTINGS_SECTIONS = {
  account: {
    title: 'Mon profil',
    description: 'Tes informations et ta session.',
    icon: 'user'
  },
  preferences: {
    title: 'Paramètres',
    description: 'Apparence et recherche de lieux.',
    icon: 'gear'
  },
  trips: {
    title: 'Mes voyages',
    description: 'Ouvre ou organise tes voyages.',
    icon: 'map'
  },
  share: {
    title: 'Partage',
    description: 'Invite et gère les membres du voyage actif.',
    icon: 'users'
  },
  reminders: {
    title: 'Rappels',
    description: 'Programme tes alertes personnelles.',
    icon: 'clock'
  },
  activity: {
    title: 'Journal',
    description: 'Les dernières modifications de chaque voyage.',
    icon: 'clock'
  }
};

function SettingsModal() {
  const { user, trips, activeTripId, trip } = Store.useStore();
  const [section, setSection] = React.useState('account');
  const compact = useSettingsCompact();
  const close = () => Store.set({ settingsOpen: false });
  const current = SETTINGS_SECTIONS[section];

  React.useEffect(() => {
    const onEsc = event => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, []);

  function openTrip(id) {
    if (window.selectTrip) {
      window.selectTrip(id);
      close();
    }
  }

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        padding: compact ? 0 : 18,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(30, 25, 18, .48)',
        backdropFilter: 'blur(7px)'
      }}
    >
<div
        className="web-settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Paramètres du compte"
        onClick={event => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 1040,
          height: compact ? '100dvh' : 'min(88dvh, 720px)',
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : '238px minmax(0, 1fr)',
          overflow: 'hidden',
          background: 'var(--card)',
          border: compact ? 'none' : '1px solid var(--line)',
          borderRadius: compact ? 0 : 14,
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <aside className="web-settings-nav" style={{
          display: 'flex',
          flexDirection: compact ? 'row' : 'column',
          gap: compact ? 4 : 6,
          overflowX: compact ? 'auto' : 'visible',
          padding: compact ? '10px 12px' : '22px 14px',
          background: 'var(--inset)',
          borderRight: compact ? 'none' : '1px solid var(--line)',
          borderBottom: compact ? '1px solid var(--line)' : 'none'
        }}>
          {!compact && (
            <div style={{ padding: '0 10px 18px' }}>
              <div style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 25,
                color: 'var(--text)'
              }}>
                La Fabrique à Voyages
              </div>
              <div style={{ marginTop: 5, fontSize: 12, color: 'var(--muted)' }}>
                Espace personnel
              </div>
            </div>
          )}

          {Object.entries(SETTINGS_SECTIONS).map(([key, item]) => (
            <SettingsNavItem
              key={key}
              compact={compact}
              icon={item.icon}
              active={section === key}
              onClick={() => setSection(key)}
            >
              {key === 'account' ? 'Mon compte' : item.title}
            </SettingsNavItem>
          ))}

          {!compact && (
            <div style={{
              marginTop: 'auto',
              padding: '16px 10px 4px',
              borderTop: '1px solid var(--line)'
            }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: 'var(--accent)',
                color: 'var(--bg)',
                fontWeight: 900,
                fontSize: 12
              }}>
                {initials(user)}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800 }}>
                {displayName(user)}
              </div>
              <div style={{
                marginTop: 2,
                color: 'var(--muted)',
                fontSize: 11,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user?.email || ''}
              </div>
            </div>
          )}
        </aside>

        <section style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <header className="web-settings-header" style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 18,
            padding: compact ? '18px 18px 14px' : '26px 30px 20px',
            borderBottom: '1px solid var(--line)'
          }}>
            <div>
              <div style={{
                color: 'var(--accent)',
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: '.12em',
                textTransform: 'uppercase'
              }}>
                Espace personnel
              </div>
              <h1 style={{
                margin: '5px 0 0',
                fontFamily: 'var(--serif)',
                fontSize: compact ? 27 : 32,
                lineHeight: 1.05,
                fontWeight: 500
              }}>
                {current.title}
              </h1>
              <p style={{ margin: '7px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                {current.description}
              </p>
            </div>

            <button
              type="button"
              onClick={close}
              title="Fermer"
              aria-label="Fermer"
              style={settingsIconButtonStyle}
            >
              <Icon name="x" size={17} />
            </button>
          </header>

          <div className="web-settings-content" style={{
            flex: 1,
            overflowY: 'auto',
            padding: compact ? 18 : 30
          }}>
            {section === 'account' && (
  user?.is_anonymous
    ? <GuestAccountSection user={user} />
    : <AccountSection user={user} />
)}
            {section === 'preferences' && <PreferencesSection user={user} />}
            {section === 'trips' && (
              <TripsSection
                trips={trips || []}
                activeTripId={activeTripId}
                onOpen={openTrip}
              />
            )}
            {section === 'share' && (
  <ShareSection
    trips={trips || []}
    activeTripId={activeTripId}
    user={user}
  />
)}

{section === 'reminders' &&
  window.RemindersSection && (
    <window.RemindersSection
      trips={trips || []}
      activeTripId={activeTripId}
    />
)}

{section === 'activity' && (
  <ActivitySection
    trips={trips || []}
    activeTripId={activeTripId}
  />
)}

          </div>
        </section>
      </div>
    </div>
  );
}

function SettingsNavItem({ icon, active, onClick, children, compact }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={compact ? children : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: compact ? 'center' : 'flex-start',
        gap: 10,
        minWidth: compact ? 42 : 0,
        padding: compact ? '9px 11px' : '11px 12px',
        border: '1px solid ' + (active ? 'rgba(157, 104, 12, .22)' : 'transparent'),
        borderRadius: 8,
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--muted)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 800,
        whiteSpace: 'nowrap',
        textAlign: 'left'
      }}
    >
      <Icon name={icon} size={16} />
      {!compact && children}
    </button>
  );
}

function GuestAccountSection({ user }) {
  const savedUpgrade = SB.getPendingGuestAccountUpgrade?.();

  const [step, setStep] = React.useState(
    savedUpgrade ? 'verification' : 'identity'
  );

  const [pseudo, setPseudo] = React.useState(
    user?.user_metadata?.display_name === 'Voyageur'
      ? ''
      : user?.user_metadata?.display_name || ''
  );

  const [email, setEmail] = React.useState(savedUpgrade?.email || '');
  const [token, setToken] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordConfirmation, setPasswordConfirmation] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  async function sendCode() {
    setError('');

    if (!pseudo.trim()) {
      setError('Indique ton prénom ou ton pseudo.');
      return;
    }

    if (!email.trim()) {
      setError('Indique ton adresse e-mail.');
      return;
    }

    setBusy(true);

    try {
      const pending = await SB.beginGuestAccountUpgrade(
        email.trim(),
        pseudo.trim()
      );

      setEmail(pending.email);
      setStep('verification');
      Store.showToast('Code de confirmation envoyé');
    } catch (err) {
      setError(err.message || "Impossible d'envoyer le code.");
    } finally {
      setBusy(false);
    }
  }

  async function finishAccount() {
    setError('');

    if (password !== passwordConfirmation) {
      setError('Les deux mots de passe sont différents.');
      return;
    }

    setBusy(true);

    try {
      const permanentUser = await SB.completeGuestAccountUpgrade({
        email,
        token,
        password,
        pseudo
      });

      Store.set({ user: permanentUser });
      Store.showToast('Ton voyage est maintenant enregistré');
    } catch (err) {
      setError(err.message || "Impossible d'enregistrer le compte.");
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setBusy(true);
    setError('');

    try {
      await SB.resendGuestAccountUpgradeCode(email);
      Store.showToast('Nouveau code envoyé');
    } catch (err) {
      setError(err.message || "Impossible de renvoyer le code.");
    } finally {
      setBusy(false);
    }
  }

  function changeEmail() {
    SB.clearPendingGuestAccountUpgrade?.();
    setStep('identity');
    setToken('');
    setPassword('');
    setPasswordConfirmation('');
    setError('');
  }

  return (
    <div style={{
      maxWidth: 740,
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }}>
      <SettingsCard
        eyebrow="Voyage temporaire"
        title="Enregistre ton voyage"
      >
        <p style={{
          margin: 0,
          color: 'var(--muted)',
          fontSize: 14,
          lineHeight: 1.6
        }}>
          Ton voyage est disponible sur cet appareil. Crée ton accès pour le
          conserver, le retrouver ailleurs et inviter tes compagnons.
        </p>
      </SettingsCard>

      {step === 'identity' ? (
        <SettingsCard
          eyebrow="Première étape"
          title="Tes informations"
        >
          <SettingsField
            label="Pseudo"
            description="Le nom visible par tes compagnons."
          >
            <input
              value={pseudo}
              onChange={event => setPseudo(event.target.value)}
              placeholder="Ton prénom ou pseudo"
              autoComplete="nickname"
              style={settingsInputStyle}
            />
          </SettingsField>

          <SettingsField
            label="Adresse e-mail"
            description="Un code de confirmation sera envoyé à cette adresse."
          >
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="vous@email.com"
              autoComplete="email"
              style={settingsInputStyle}
            />
          </SettingsField>

          <SettingsButton
            variant="primary"
            icon="mail"
            onClick={sendCode}
            disabled={busy}
          >
            {busy ? 'Envoi en cours' : 'Recevoir mon code'}
          </SettingsButton>
        </SettingsCard>
      ) : (
        <SettingsCard
          eyebrow="Dernière étape"
          title="Confirme ton compte"
        >
          <SettingsField
            label="Adresse e-mail"
            description="Le code a été envoyé à cette adresse."
          >
            <div style={{ fontWeight: 800, wordBreak: 'break-word' }}>
              {email}
            </div>
          </SettingsField>

          <SettingsField
            label="Code de confirmation"
            description="Saisis les huit chiffres reçus par e-mail."
          >
            <input
              value={token}
              onChange={event => setToken(
                event.target.value.replace(/\D/g, '').slice(0, 8)
              )}
              placeholder="00000000"
              maxLength={8}
              inputMode="numeric"
              autoComplete="one-time-code"
              style={settingsInputStyle}
            />
          </SettingsField>

          <SettingsField label="Mot de passe">
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="8 caractères minimum"
              autoComplete="new-password"
              style={settingsInputStyle}
            />
          </SettingsField>

          <SettingsField label="Confirmer le mot de passe">
            <input
              type="password"
              value={passwordConfirmation}
              onChange={event => setPasswordConfirmation(event.target.value)}
              placeholder="Répète ton mot de passe"
              autoComplete="new-password"
              style={settingsInputStyle}
            />
          </SettingsField>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <SettingsButton
              variant="primary"
              icon="check"
              onClick={finishAccount}
              disabled={busy}
            >
              {busy ? 'Enregistrement' : 'Enregistrer mon voyage'}
            </SettingsButton>

            <SettingsButton onClick={resendCode} disabled={busy}>
              Renvoyer le code
            </SettingsButton>

            <SettingsButton onClick={changeEmail} disabled={busy}>
              Modifier l’e-mail
            </SettingsButton>
          </div>
        </SettingsCard>
      )}

      {error && (
        <div style={{
          padding: '11px 13px',
          borderRadius: 8,
          background: 'rgba(192, 86, 63, .10)',
          color: '#b64f38',
          fontSize: 13,
          fontWeight: 700
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

function AccountSection({ user }) {
  const initialPseudo = displayName(user);
  const [pseudo, setPseudo] = React.useState(initialPseudo);
  const [editing, setEditing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [passwordStep, setPasswordStep] = React.useState('idle');
  const [passwordCode, setPasswordCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [emailStep, setEmailStep] = React.useState('idle');
  const [newEmail, setNewEmail] = React.useState('');
  const [emailBusy, setEmailBusy] = React.useState(false);
  const [emailError, setEmailError] = React.useState('');
  const [deleteStep, setDeleteStep] = React.useState('idle');
  const [deletePassword, setDeletePassword] = React.useState('');
  const [deleteConfirmation, setDeleteConfirmation] = React.useState('');
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');

    React.useEffect(() => {
    if (!user?.id || !user?.email) return;

    SB.sb
      .from('profiles')
      .update({ email: user.email })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) {
          console.warn(
            "Impossible de synchroniser l'adresse e-mail du profil :",
            error.message
          );
        }
      });
  }, [user?.id, user?.email]);

  async function savePseudo() {
    const next = pseudo.trim();

    if (!next) {
      Store.showToast('Choisis un pseudo.');
      return;
    }

    setBusy(true);

    try {
      await SB.sb.auth.updateUser({ data: { display_name: next } });
      await SB.sb.from('profiles').update({ display_name: next }).eq('id', user.id);

      Store.set({
        user: {
          ...user,
          user_metadata: {
            ...(user.user_metadata || {}),
            display_name: next
          }
        }
      });

      setEditing(false);
      Store.showToast('Profil mis à jour');
    } catch (error) {
      Store.showToast('Erreur : ' + error.message);
    } finally {
      setBusy(false);
    }
  }

  async function requestEmailChange() {
    const cleanEmail = newEmail.trim().toLowerCase();

    setEmailError('');

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setEmailError('Indique une adresse e-mail valide.');
      return;
    }

    if (cleanEmail === String(user.email || '').toLowerCase()) {
      setEmailError(
        'Cette adresse est déjà associée à ton compte.'
      );
      return;
    }

    setEmailBusy(true);

    try {
      const { error } = await SB.sb.auth.updateUser({
        email: cleanEmail
      });

      if (error) throw error;

      setEmailStep('sent');
      Store.showToast('Demande de changement envoyée');
    } catch (error) {
      setEmailError(
        error.message || "Impossible de modifier l'adresse e-mail."
      );
    } finally {
      setEmailBusy(false);
    }
  }

  function cancelEmailChange() {
    setEmailStep('idle');
    setNewEmail('');
    setEmailError('');
  }

  async function sendPasswordCode() {
    setPasswordError('');
    setBusy(true);

    try {
      await SB.requestPasswordReset(user.email);
      setPasswordStep('code');
      Store.showToast('Code de sécurité envoyé par e-mail');
    } catch (error) {
      setPasswordError(
        error.message || "Impossible d'envoyer le code."
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveNewPassword() {
    setPasswordError('');

    if (newPassword !== newPasswordConfirmation) {
      setPasswordError('Les deux mots de passe sont différents.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        'Le nouveau mot de passe doit contenir au moins 8 caractères.'
      );
      return;
    }

    setBusy(true);

    try {
      await SB.completePasswordReset({
        email: user.email,
        token: passwordCode,
        password: newPassword
      });

      setPasswordStep('idle');
      setPasswordCode('');
      setNewPassword('');
      setNewPasswordConfirmation('');
      Store.showToast('Ton mot de passe a été modifié');
    } catch (error) {
      setPasswordError(
        error.message || 'Impossible de modifier le mot de passe.'
      );
    } finally {
      setBusy(false);
    }
  }

  function cancelPasswordChange() {
    setPasswordStep('idle');
    setPasswordCode('');
    setNewPassword('');
    setNewPasswordConfirmation('');
    setPasswordError('');
  }

  async function deleteAccount() {
    setDeleteError('');

    if (!deletePassword) {
      setDeleteError('Indique ton mot de passe actuel.');
      return;
    }

    if (deleteConfirmation.trim() !== 'SUPPRIMER') {
      setDeleteError('Écris exactement SUPPRIMER pour confirmer.');
      return;
    }

    setDeleteBusy(true);

    try {
      const { data, error } = await SB.sb.functions.invoke(
        'delete-account',
        {
          body: {
            password: deletePassword,
            confirmation: deleteConfirmation.trim()
          }
        }
      );

      if (error) {
        let detailedMessage = '';

        try {
          if (
            error.context &&
            typeof error.context.json === 'function'
          ) {
            const errorBody = await error.context.json();
            detailedMessage = errorBody?.error || '';
          }
        } catch (_) {
          // Le message générique sera utilisé.
        }

        throw new Error(
          detailedMessage ||
          error.message ||
          'Impossible de supprimer le compte.'
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.error || 'Impossible de supprimer le compte.'
        );
      }

      try {
        await SB.signOut();
      } catch (_) {
        // Le compte et ses sessions ont déjà été supprimés.
      }

      Store.set({
        user: null,
        trips: [],
        activeTripId: null,
        trip: null,
        settingsOpen: false
      });

      Store.showToast('Ton compte a été supprimé');
    } catch (error) {
      setDeleteError(
        error.message || 'Impossible de supprimer le compte.'
      );
    } finally {
      setDeleteBusy(false);
    }
  }

  async function signOut() {
    await SB.signOut();
    Store.set({
      user: null,
      trips: [],
      activeTripId: null,
      trip: null,
      settingsOpen: false
    });
    Store.showToast('Déconnecté');
  }

  return (
    <div style={{ maxWidth: 740, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 18,
        border: '1px solid var(--line)',
        borderRadius: 12,
        background: 'var(--inset)'
      }}>
        <div style={{
          width: 62,
          height: 62,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          background: 'var(--accent)',
          color: 'var(--bg)',
          fontSize: 19,
          fontWeight: 900
        }}>
          {initials(user)}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'var(--serif)',
            fontSize: 24
          }}>
            {displayName(user)}
          </div>
          <div style={{
            marginTop: 3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'var(--muted)',
            fontSize: 13
          }}>
            {user?.email || 'Adresse e-mail indisponible'}
          </div>
        </div>
      </div>

      <SettingsCard eyebrow="Identité" title="Tes informations">
        <SettingsField label="Pseudo" description="Le nom affiché dans La Fabrique à Voyages.">
          <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
            <input
              value={pseudo}
              disabled={!editing}
              onChange={event => setPseudo(event.target.value)}
              style={{
                ...settingsInputStyle,
                opacity: editing ? 1 : .72
              }}
            />

            {editing ? (
              <SettingsButton
                variant="primary"
                icon="check"
                onClick={savePseudo}
                disabled={busy}
              >
                {busy ? 'Enregistrement' : 'Enregistrer'}
              </SettingsButton>
            ) : (
              <SettingsButton icon="gear" onClick={() => setEditing(true)}>
                Modifier
              </SettingsButton>
            )}
          </div>
        </SettingsField>

        <SettingsField
          label="Adresse e-mail"
          description="L'adresse utilisée pour te connecter et recevoir les messages de sécurité."
        >
          {emailStep === 'idle' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              width: '100%'
            }}>
              <div style={{
                flex: 1,
                minWidth: 180,
                color: 'var(--text)',
                fontSize: 13,
                wordBreak: 'break-word'
              }}>
                {user?.email || 'Non renseigné'}
              </div>

              <SettingsButton
                icon="gear"
                onClick={() => {
                  setNewEmail('');
                  setEmailError('');
                  setEmailStep('editing');
                }}
              >
                Modifier
              </SettingsButton>
            </div>
          )}

          {emailStep === 'editing' && (
            <div style={{ width: '100%' }}>
              <input
                type="email"
                value={newEmail}
                onChange={event => setNewEmail(event.target.value)}
                placeholder="nouvelle@adresse.com"
                autoComplete="email"
                style={settingsInputStyle}
              />

              {emailError && (
                <div style={{
                  marginTop: 10,
                  color: '#b64f38',
                  fontSize: 13,
                  fontWeight: 700
                }}>
                  {emailError}
                </div>
              )}

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 12
              }}>
                <SettingsButton
                  variant="primary"
                  icon="check"
                  onClick={requestEmailChange}
                  disabled={emailBusy}
                >
                  {emailBusy ? 'Envoi en cours' : 'Confirmer la modification'}
                </SettingsButton>

                <SettingsButton
                  icon="x"
                  onClick={cancelEmailChange}
                  disabled={emailBusy}
                >
                  Annuler
                </SettingsButton>
              </div>
            </div>
          )}

          {emailStep === 'sent' && (
            <div style={{ width: '100%' }}>
              <div style={{
                padding: '11px 13px',
                borderRadius: 8,
                background: 'var(--accent-soft)',
                color: 'var(--text)',
                fontSize: 13,
                lineHeight: 1.55
              }}>
                La modification a été demandée pour{' '}
                <strong>{newEmail}</strong>.
                <br />
                Consulte l’ancienne et la nouvelle boîte de réception pour
                confirmer le changement.
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 12
              }}>
                <SettingsButton
                  onClick={requestEmailChange}
                  disabled={emailBusy}
                >
                  {emailBusy ? 'Envoi en cours' : 'Renvoyer les confirmations'}
                </SettingsButton>

                <SettingsButton
                  icon="x"
                  onClick={cancelEmailChange}
                  disabled={emailBusy}
                >
                  Fermer
                </SettingsButton>
              </div>

              {emailError && (
                <div style={{
                  marginTop: 10,
                  color: '#b64f38',
                  fontSize: 13,
                  fontWeight: 700
                }}>
                  {emailError}
                </div>
              )}
            </div>
          )}
        </SettingsField>
      </SettingsCard>

            <SettingsCard eyebrow="Sécurité" title="Mot de passe">
        {passwordStep === 'idle' ? (
          <SettingsField
            label="Modifier le mot de passe"
            description="Un code de sécurité sera envoyé à ton adresse e-mail."
          >
            <SettingsButton
              variant="primary"
              icon="gear"
              onClick={sendPasswordCode}
              disabled={busy}
            >
              {busy ? 'Envoi en cours' : 'Recevoir un code'}
            </SettingsButton>
          </SettingsField>
        ) : (
          <React.Fragment>
            <div style={{
              marginBottom: 16,
              padding: '11px 13px',
              borderRadius: 8,
              background: 'var(--accent-soft)',
              color: 'var(--text)',
              fontSize: 13,
              lineHeight: 1.5
            }}>
              Un code à 8 chiffres a été envoyé à{' '}
              <strong>{user.email}</strong>.
            </div>

            <SettingsField
              label="Code de sécurité"
              description="Saisis les huit chiffres reçus par e-mail."
            >
              <input
                value={passwordCode}
                onChange={event => setPasswordCode(
                  event.target.value.replace(/\D/g, '').slice(0, 8)
                )}
                placeholder="00000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                autoFocus
                style={settingsInputStyle}
              />
            </SettingsField>

            <SettingsField label="Nouveau mot de passe">
              <input
                type="password"
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                placeholder="8 caractères minimum"
                autoComplete="new-password"
                style={settingsInputStyle}
              />
            </SettingsField>

            <SettingsField label="Confirmer le nouveau mot de passe">
              <input
                type="password"
                value={newPasswordConfirmation}
                onChange={event => setNewPasswordConfirmation(event.target.value)}
                placeholder="Répète ton nouveau mot de passe"
                autoComplete="new-password"
                style={settingsInputStyle}
              />
            </SettingsField>

            {passwordError && (
              <div style={{
                marginBottom: 14,
                padding: '11px 13px',
                borderRadius: 8,
                background: 'rgba(192, 86, 63, .10)',
                color: '#b64f38',
                fontSize: 13,
                fontWeight: 700
              }}>
                {passwordError}
              </div>
            )}

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8
            }}>
              <SettingsButton
                variant="primary"
                icon="check"
                onClick={saveNewPassword}
                disabled={busy}
              >
                {busy ? 'Modification' : 'Modifier le mot de passe'}
              </SettingsButton>

              <SettingsButton
                onClick={sendPasswordCode}
                disabled={busy}
              >
                Renvoyer le code
              </SettingsButton>

              <SettingsButton
                icon="x"
                onClick={cancelPasswordChange}
                disabled={busy}
              >
                Annuler
              </SettingsButton>
            </div>
          </React.Fragment>
        )}

        {passwordStep === 'idle' && passwordError && (
          <div style={{
            marginTop: 12,
            padding: '11px 13px',
            borderRadius: 8,
            background: 'rgba(192, 86, 63, .10)',
            color: '#b64f38',
            fontSize: 13,
            fontWeight: 700
          }}>
            {passwordError}
          </div>
        )}
      </SettingsCard>

      <SettingsCard eyebrow="Session" title="Connexion">
        <SettingsField
          label="Déconnexion"
          description="Ferme la session sur cet appareil."
        >
          <SettingsButton
            variant="danger"
            icon="x"
            onClick={signOut}
          >
            Se déconnecter
          </SettingsButton>
        </SettingsField>
      </SettingsCard>

      <SettingsCard
        eyebrow="Zone dangereuse"
        title="Supprimer le compte"
      >
        {deleteStep === 'idle' ? (
          <SettingsField
            label="Suppression définitive"
            description="Supprime ton compte, tes voyages personnels et tes fichiers. Cette action est irréversible."
          >
            <SettingsButton
              variant="danger"
              icon="x"
              onClick={() => {
                setDeleteStep('confirmation');
                setDeletePassword('');
                setDeleteConfirmation('');
                setDeleteError('');
              }}
            >
              Supprimer mon compte
            </SettingsButton>
          </SettingsField>
        ) : (
          <React.Fragment>
            <div style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid rgba(192, 86, 63, .28)',
              background: 'rgba(192, 86, 63, .10)',
              color: '#a94632',
              fontSize: 13,
              lineHeight: 1.55
            }}>
              <strong>Cette action est irréversible.</strong>
              <br />
              Tes voyages personnels et leurs fichiers seront supprimés.
              Les voyages appartenant à d’autres personnes seront conservés,
              mais tu n’en seras plus membre.
            </div>

            <SettingsField
              label="Mot de passe actuel"
              description="Confirme ton identité avant la suppression."
            >
              <input
                type="password"
                value={deletePassword}
                onChange={event => setDeletePassword(event.target.value)}
                placeholder="Ton mot de passe actuel"
                autoComplete="current-password"
                style={settingsInputStyle}
              />
            </SettingsField>

            <SettingsField
              label="Confirmation"
              description="Écris exactement SUPPRIMER en lettres majuscules."
            >
              <input
                value={deleteConfirmation}
                onChange={event => setDeleteConfirmation(
                  event.target.value.toUpperCase()
                )}
                placeholder="SUPPRIMER"
                autoComplete="off"
                style={settingsInputStyle}
              />
            </SettingsField>

            {deleteError && (
              <div style={{
                marginBottom: 14,
                padding: '11px 13px',
                borderRadius: 8,
                background: 'rgba(192, 86, 63, .10)',
                color: '#b64f38',
                fontSize: 13,
                fontWeight: 700
              }}>
                {deleteError}
              </div>
            )}

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8
            }}>
              <SettingsButton
                variant="danger"
                icon="x"
                onClick={deleteAccount}
                disabled={deleteBusy}
              >
                {deleteBusy
                  ? 'Suppression en cours'
                  : 'Supprimer définitivement'}
              </SettingsButton>

              <SettingsButton
                onClick={() => {
                  setDeleteStep('idle');
                  setDeletePassword('');
                  setDeleteConfirmation('');
                  setDeleteError('');
                }}
                disabled={deleteBusy}
              >
                Annuler
              </SettingsButton>
            </div>
          </React.Fragment>
        )}
      </SettingsCard>
    </div>
  );
}

function PreferencesSection({ user }) {
  const [theme, setTheme] = React.useState(
    () => Store.get().theme || localStorage.getItem('it_theme') || 'light'
  );
  const [placesMode, setPlacesMode] = React.useState(
    () => localStorage.getItem('places_search_mode') === 'google' ? 'google' : 'basic'
  );
  const [
    analyticsEnabled,
    setAnalyticsEnabled
  ] = React.useState(
    () =>
      localStorage.getItem(
        'lfav_analytics_disabled'
      ) !== 'true'
  );

  const [usage, setUsage] = React.useState(null);

  async function refreshUsage() {
    if (!user || !window.SB?.getPlacesUsage) return;

    try {
      const nextUsage = await window.SB.getPlacesUsage();
      setUsage(nextUsage);
    } catch (error) {
      setUsage(null);
    }
  }

  React.useEffect(() => {
    refreshUsage();
  }, [user?.id]);

  function applyTheme(nextTheme) {
    localStorage.setItem('it_theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    Store.set({ theme: nextTheme });
    setTheme(nextTheme);
  }

  function applyPlacesMode(enabled) {
    const nextMode = enabled ? 'google' : 'basic';
    localStorage.setItem('places_search_mode', nextMode);
    window.dispatchEvent(new CustomEvent('places-search-mode', { detail: nextMode }));
    setPlacesMode(nextMode);
  }

  function applyAnalyticsPreference(enabled) {
    if (enabled) {
      localStorage.removeItem(
        'lfav_analytics_disabled'
      );
    } else {
      localStorage.setItem(
        'lfav_analytics_disabled',
        'true'
      );
    }

    setAnalyticsEnabled(enabled);

    Store.showToast(
      enabled
        ? 'Mesure anonyme activée'
        : 'Mesure anonyme désactivée'
    );
  }

  function savePreferences() {
    localStorage.setItem('atelier_preferences', JSON.stringify({
      theme,
      placesMode
    }));
    Store.showToast('Paramètres enregistrés');
  }

  return (
    <div style={{ maxWidth: 740, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SettingsCard eyebrow="Apparence" title="Choisis ton ambiance">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10
        }}>
          <SettingsChoice
            icon="sun"
            label="Mode clair"
            description="L’interface lumineuse actuelle."
            active={theme === 'light'}
            onClick={() => applyTheme('light')}
          />
          <SettingsChoice
            icon="moon"
            label="Mode sombre"
            description="Une interface plus douce le soir."
            active={theme === 'dark'}
            onClick={() => applyTheme('dark')}
          />
        </div>
      </SettingsCard>

      <SettingsCard eyebrow="Recherche" title="Lieux et Google Places">
        <SettingsToggle
          checked={placesMode === 'google'}
          onChange={applyPlacesMode}
          label="Utiliser Google Places"
          description="Pour les musées, restaurants, hôtels et lieux précis. Décoche cette option pour revenir à la recherche simple, sans consommation Google."
        />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 16,
          paddingTop: 15,
          borderTop: '1px solid var(--line)'
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900 }}>
              Compteur personnel Google Places
            </div>
            <div style={{ marginTop: 3, color: 'var(--muted)', fontSize: 12 }}>
              100 recherches Google Places par utilisateur et par mois.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{
              whiteSpace: 'nowrap',
              color: 'var(--accent)',
              fontSize: 13
            }}>
              {usage ? `${usage.count} / ${usage.limit}` : '... / 100'}
            </strong>
            <button
              type="button"
              onClick={refreshUsage}
              title="Actualiser le compteur"
              aria-label="Actualiser le compteur"
              style={settingsIconButtonStyle}
            >
              <Icon name="arrowsm" size={16} />
            </button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        eyebrow="Confidentialité"
        title="Mesure anonyme du site"
      >
        <SettingsToggle
          checked={analyticsEnabled}
          onChange={applyAnalyticsPreference}
          label="Partager les statistiques anonymes"
          description="Aide à connaître les pages utilisées et à détecter les problèmes de rapidité. Aucun contenu de voyage, email, document ou position précise n’est transmis."
        />

        <p style={{
          margin: '14px 0 0',
          color: 'var(--muted)',
          fontSize: 11,
          lineHeight: 1.55
        }}>
          Les mesures sont fournies par Vercel Analytics et
          Speed Insights, sans cookie publicitaire. Les liens
          contenant un code de connexion ou d’invitation sont
          automatiquement exclus.
          {' '}
          <a
            href="/informations.html#confidentialite"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--accent)',
              fontWeight: 800
            }}
          >
            Politique de confidentialité
          </a>
        </p>
      </SettingsCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SettingsButton variant="primary" icon="check" onClick={savePreferences}>
          Enregistrer les paramètres
        </SettingsButton>
      </div>
    </div>
  );
}

const TRIP_ACCENT_THEMES = [
  { key: 'ochre', label: 'Ocre', accent: '#9d680c' },
  { key: 'forest', label: 'Vert forêt', accent: '#2f6a55' },
  { key: 'ocean', label: 'Bleu océan', accent: '#2f617b' },
  { key: 'terracotta', label: 'Terre cuite', accent: '#a45132' },
  { key: 'plum', label: 'Prune', accent: '#71506c' }
];

function getTripAccentTheme(key) {
  return TRIP_ACCENT_THEMES.find(theme => theme.key === key) || TRIP_ACCENT_THEMES[0];
}

function TripsSection({
  trips,
  activeTripId,
  onOpen
}) {
  const [
    duplicatingTripId,
    setDuplicatingTripId
  ] = React.useState(null);

  const [
    tripToDuplicate,
    setTripToDuplicate
  ] = React.useState(null);

  const [
    duplicateName,
    setDuplicateName
  ] = React.useState('');

    const [
    managedTrips,
    setManagedTrips
  ] = React.useState(trips);

  const [
    archivingTripId,
    setArchivingTripId
  ] = React.useState(null);

  const currentUserId =
    Store.get().user?.id ||
    null;

  React.useEffect(() => {
    let cancelled = false;

    window.SB
      .listMyTrips({
        includeArchived: true
      })
      .then(function saveTrips(
        nextTrips
      ) {
        if (!cancelled) {
          setManagedTrips(
            nextTrips
          );
        }
      })
      .catch(function reportError(
        error
      ) {
        console.warn(
          'Chargement des archives impossible :',
          error.message
        );
      });

    return function cancelLoad() {
      cancelled = true;
    };
  }, [trips]);

  const [
    tripSearch,
    setTripSearch
  ] = React.useState('');

  const [
    tripFilter,
    setTripFilter
  ] = React.useState(
    'all'
  );

  const [
    backupBusy,
    setBackupBusy
  ] = React.useState(false);

  const [
    restoreBusy,
    setRestoreBusy
  ] = React.useState(false);

  const backupInputRef =
    React.useRef(null);

  async function downloadBackup() {
    if (
      backupBusy ||
      !window.TripBackup
        ?.downloadAll
    ) {
      return;
    }

    setBackupBusy(true);

    try {
      const result =
        await window.TripBackup
          .downloadAll();

      Store.showToast(
        result.tripCount +
          (
            result.tripCount > 1
              ? ' voyages sauvegardés.'
              : ' voyage sauvegardé.'
          )
      );
    } catch (error) {
      Store.showToast(
        error.message ||
          'La sauvegarde a échoué.'
      );
    } finally {
      setBackupBusy(false);
    }
  }

  async function restoreBackup(
    event
  ) {
    const file =
      event.target
        .files?.[0] ||
      null;

    event.target.value = '';

    if (
      !file ||
      restoreBusy ||
      !window.TripBackup
        ?.restoreFile
    ) {
      return;
    }

    setRestoreBusy(true);

    try {
      const result =
        await window.TripBackup
          .restoreFile(file);

      if (result.cancelled) {
        return;
      }

      const nextTrips =
        await window.SB
          .listMyTrips();

      Store.set({
        trips: nextTrips
      });

      Store.showToast(
        result.tripCount +
          (
            result.tripCount > 1
              ? ' voyages restaurés.'
              : ' voyage restauré.'
          )
      );
    } catch (error) {
      Store.showToast(
        error.message ||
          'La restauration a échoué.'
      );
    } finally {
      setRestoreBusy(false);
    }
  }

  const now = new Date();

  const today = [
    now.getFullYear(),
    String(
      now.getMonth() + 1
    ).padStart(2, '0'),
    String(
      now.getDate()
    ).padStart(2, '0')
  ].join('-');

  function getTripStatus(
    trip
  ) {
        if (trip.archived_at) {
      return 'archived';
    }
    const startDate =
      trip.start_date || '';

    const endDate =
      trip.end_date || '';

    if (!startDate) {
      return 'undated';
    }

    if (startDate > today) {
      return 'upcoming';
    }

    if (
      endDate &&
      endDate < today
    ) {
      return 'past';
    }

    return 'current';
  }

  const TRIP_STATUS_META = { 
        archived: {
      label: 'Archivé',
      color: '#71506c',
      background:
        'rgba(113, 80, 108, .12)'
    },
    current: {
      label: 'En cours',
      color: '#27644f',
      background:
        'rgba(39, 100, 79, .12)'
    },
    upcoming: {
      label: 'À venir',
      color: '#32637e',
      background:
        'rgba(50, 99, 126, .12)'
    },
    past: {
      label: 'Terminé',
      color: 'var(--muted)',
      background:
        'var(--card)'
    },
    undated: {
      label: 'Sans dates',
      color: '#96640d',
      background:
        'rgba(150, 100, 13, .12)'
    }
  };

  const TRIP_STATUS_ORDER = {
    current: 0,
    upcoming: 1,
    undated: 2,
    past: 3,
    archived: 4
  };

  function compareTrips(
    first,
    second
  ) {
    const firstStatus =
      getTripStatus(first);

    const secondStatus =
      getTripStatus(second);

    const statusDifference =
      TRIP_STATUS_ORDER[
        firstStatus
      ] -
      TRIP_STATUS_ORDER[
        secondStatus
      ];

    if (statusDifference) {
      return statusDifference;
    }

    if (
      firstStatus ===
      'upcoming'
    ) {
      return String(
        first.start_date || ''
      ).localeCompare(
        String(
          second.start_date ||
            ''
        )
      );
    }

    if (
      firstStatus === 'past'
    ) {
      return String(
        second.end_date ||
          second.start_date ||
          ''
      ).localeCompare(
        String(
          first.end_date ||
            first.start_date ||
            ''
        )
      );
    }

    return String(
      first.name || ''
    ).localeCompare(
      String(
        second.name || ''
      ),
      'fr'
    );
  }

  function renderTripStatusBadge(
    trip
  ) {
    const status =
      getTripStatus(trip);

    const meta =
      TRIP_STATUS_META[status];

    return (
      <span
        style={{
          padding: '2px 6px',
          borderRadius: 999,
          color: meta.color,
          background:
            meta.background,
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: '.06em',
          whiteSpace: 'nowrap',
          textTransform:
            'uppercase'
        }}
      >
        {meta.label}
      </span>
    );
  }

  const normalizedSearch =
    tripSearch
      .trim()
      .toLocaleLowerCase(
        'fr-FR'
      );

  const visibleTrips =
    managedTrips
      .filter(
        function filterTrip(
          trip
        ) {
          const matchesSearch =
            !normalizedSearch ||
            String(
              trip.name || ''
            )
              .toLocaleLowerCase(
                'fr-FR'
              )
              .includes(
                normalizedSearch
              );

          const status =
            getTripStatus(trip);

          const matchesFilter =
            tripFilter ===
              'all' ||
            tripFilter === status;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      )
      .sort(compareTrips);

  function openDuplicateDialog(
    trip
  ) {
    if (duplicatingTripId) {
      return;
    }

    setTripToDuplicate(trip);
    setDuplicateName(
      trip.name + ' (copie)'
    );
  }

  function closeDuplicateDialog() {
    if (duplicatingTripId) {
      return;
    }

    setTripToDuplicate(null);
    setDuplicateName('');
  }

  async function duplicateTrip(
    event
  ) {
    event.preventDefault();

    const trip = tripToDuplicate;

    if (
      !trip ||
      duplicatingTripId ||
      !window.SB?.duplicateTrip
    ) {
      return;
    }

    const cleanName =
      duplicateName.trim();

    if (!cleanName) {
      Store.showToast(
        'Donne un nom à la copie.'
      );

      return;
    }

    setDuplicatingTripId(
      trip.id
    );

    try {
      const created =
        await window.SB
          .duplicateTrip(
            trip.id,
            cleanName
          );

      const nextTrips =
        await window.SB
          .listMyTrips();

      Store.set({
        trips: nextTrips
      });

      setDuplicatingTripId(null);
      setTripToDuplicate(null);
      setDuplicateName('');

      Store.showToast(
        'Voyage dupliqué.'
      );

      onOpen(created.id);
    } catch (error) {
      setDuplicatingTripId(null);

      Store.showToast(
        error.message ||
          'La duplication a échoué.'
      );
    }
  }

    async function changeArchiveState(
    trip
  ) {
    if (
      archivingTripId ||
      duplicatingTripId
    ) {
      return;
    }

    const shouldArchive =
      !trip.archived_at;

    if (
      shouldArchive &&
      !confirm(
        `Archiver « ${trip.name} » ? Le voyage ne sera pas supprimé.`
      )
    ) {
      return;
    }

    setArchivingTripId(
      trip.id
    );

    try {
      await SB.setTripArchived(
        trip.id,
        shouldArchive
      );

      const [
        nextTrips,
        nextManagedTrips
      ] = await Promise.all([
        SB.listMyTrips(),
        SB.listMyTrips({
          includeArchived: true
        })
      ]);

      setManagedTrips(
        nextManagedTrips
      );

      const wasActive =
        shouldArchive &&
        trip.id === activeTripId;

      Store.set({
        trips: nextTrips,
        activeTripId: wasActive
          ? null
          : activeTripId,
        trip: wasActive
          ? null
          : Store.get().trip
      });

      if (
        wasActive &&
        nextTrips[0]?.id &&
        window.selectTrip
      ) {
        try {
          await window.selectTrip(
            nextTrips[0].id
          );
        } catch (error) {
          console.warn(
            'Sélection du voyage suivant impossible :',
            error.message
          );
        }
      }

      Store.showToast(
        shouldArchive
          ? 'Voyage archivé.'
          : 'Voyage restauré.'
      );
    } catch (error) {
      Store.showToast(
        'Erreur : ' +
          (
            error.message ||
            'Modification impossible.'
          )
      );
    } finally {
      setArchivingTripId(null);
    }
  }

  async function removeTrip(trip) {
    if (!confirm(`Supprimer « ${trip.name} » définitivement ?`)) return;

    try {
      await SB.deleteTrip(trip.id);
      const remaining = await SB.listMyTrips();
      const wasActive = trip.id === activeTripId;

      Store.set({
        trips: remaining,
        activeTripId: wasActive ? null : activeTripId,
        trip: wasActive ? null : Store.get().trip
      });

      Store.showToast('Voyage supprimé');
    } catch (error) {
      Store.showToast('Erreur : ' + error.message);
    }
  }

    async function saveTripAccent(trip, accentTheme) {
    if (trip.accent_theme === accentTheme) return;

    try {
      await SB.updateTrip(trip.id, { accentTheme });

      const nextTrips = await SB.listMyTrips();

      if (trip.id === activeTripId) {
        const nextTrip = await SB.loadTrip(trip.id);
        Store.set({ trips: nextTrips, trip: nextTrip });
      } else {
        Store.set({ trips: nextTrips });
      }

      Store.showToast('Couleur du voyage mise à jour');
    } catch (error) {
      Store.showToast('Erreur : ' + error.message);
    }
  }

  if (!managedTrips.length) {
    return (
      <SettingsCard title="Aucun voyage">
        <div style={{ textAlign: 'center', padding: '22px 8px', color: 'var(--muted)' }}>
          <Icon name="map" size={28} />
          <div style={{ marginTop: 10, fontSize: 13 }}>
            Crée ton premier voyage depuis le sélecteur en haut.
          </div>
        </div>
      </SettingsCard>
    );
  }

  return (
    <div
      style={{
        maxWidth: 740,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 6
        }}
      >
        <div>
          <strong
            style={{
              display: 'block',
              fontSize: 13
            }}
          >
            {
              managedTrips.length === 1
                ? '1 voyage'
                : managedTrips.length +
                  ' voyages'
            }
          </strong>

          <span
            style={{
              color:
                'var(--muted)',
              fontSize: 11
            }}
          >
            Télécharge une copie de tes données.
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8
          }}
        >
          <input
            ref={backupInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={
              restoreBackup
            }
          />

          <SettingsButton
            icon="upload"
            disabled={
              backupBusy ||
              restoreBusy
            }
            onClick={() =>
              backupInputRef
                .current
                ?.click()
            }
          >
            {
              restoreBusy
                ? 'Restauration…'
                : 'Restaurer'
            }
          </SettingsButton>

          <SettingsButton
            icon="download"
            disabled={
              backupBusy ||
              restoreBusy
            }
            onClick={
              downloadBackup
            }
          >
            {
              backupBusy
                ? 'Sauvegarde…'
                : 'Sauvegarder'
            }
          </SettingsButton>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1fr) minmax(150px, 210px)',
          gap: 10,
          marginBottom: 4
        }}
      >
        <label>
          <span
            style={{
              display: 'block',
              marginBottom: 5,
              color:
                'var(--muted)',
              fontSize: 11,
              fontWeight: 900
            }}
          >
            Rechercher
          </span>

          <input
            type="search"
            value={tripSearch}
            placeholder="Nom du voyage…"
            aria-label="Rechercher un voyage"
            onChange={event =>
              setTripSearch(
                event.target.value
              )
            }
            style={{
              width: '100%',
              minHeight: 44,
              padding: '0 12px',
              border:
                '1px solid var(--line)',
              borderRadius: 8,
              color: 'var(--text)',
              background:
                'var(--card)',
              font: 'inherit'
            }}
          />
        </label>

        <label>
          <span
            style={{
              display: 'block',
              marginBottom: 5,
              color:
                'var(--muted)',
              fontSize: 11,
              fontWeight: 900
            }}
          >
            Période
          </span>

          <select
            value={tripFilter}
            aria-label="Filtrer les voyages"
            onChange={event =>
              setTripFilter(
                event.target.value
              )
            }
            style={{
              width: '100%',
              minHeight: 44,
              padding: '0 10px',
              border:
                '1px solid var(--line)',
              borderRadius: 8,
              color: 'var(--text)',
              background:
                'var(--card)',
              font: 'inherit'
            }}
          >
            <option value="all">
              Tous les voyages
            </option>

            <option value="upcoming">
              À venir
            </option>

            <option value="current">
              En cours
            </option>

            <option value="past">
              Terminés
            </option>

            <option value="undated">
              Sans dates
            </option>
            <option value="archived">
              Archivés
            </option>
          </select>
        </label>
      </div>

      {!visibleTrips.length && (
        <div
          role="status"
          style={{
            padding: 24,
            border:
              '1px dashed var(--line)',
            borderRadius: 10,
            color:
              'var(--muted)',
            background:
              'var(--inset)',
            textAlign: 'center',
            fontSize: 13
          }}
        >
          Aucun voyage ne correspond à cette recherche.
        </div>
      )}

      {visibleTrips.map(trip => (
        <div
          key={trip.id}
          className="settings-trip-row"
          data-trip-name={trip.name}
          style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 13,
          padding: 14,
          border: '1px solid ' + (trip.id === activeTripId ? 'rgba(157, 104, 12, .35)' : 'var(--line)'),
          borderLeft: '4px solid ' + getTripAccentTheme(trip.accent_theme).accent,
          borderRadius: 10,
          background: trip.id === activeTripId ? 'var(--accent-soft)' : 'var(--inset)'
        }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            background: 'var(--card)',
            color: 'var(--accent)'
          }}>
            <Icon name="map" size={17} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <strong style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 14
              }}>
                {trip.name}
              </strong>
              {trip.id === activeTripId && (
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: 5,
                    background:
                      'var(--accent)',
                    color: 'var(--bg)',
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing:
                      '.08em'
                  }}
                >
                  ACTIF
                </span>
              )}

              {
                renderTripStatusBadge(
                  trip
                )
              }
            </div>
            <div style={{ marginTop: 4, color: 'var(--muted)', fontSize: 12 }}>
              {trip.start_date ? `Départ ${fmtDate(trip.start_date)}` : 'Sans date définie'}
            </div>
            <div
  aria-label={'Couleur de ' + trip.name}
  style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}
>
  <span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 800 }}>
    Couleur
  </span>

  {TRIP_ACCENT_THEMES.map(theme => {
    const active = (trip.accent_theme || 'ochre') === theme.key;

    return (
      <button
        key={theme.key}
        type="button"
        title={theme.label}
        aria-label={theme.label}
        aria-pressed={active}
        onClick={() => saveTripAccent(trip, theme.key)}
        style={{
          width: 20,
          height: 20,
          padding: 0,
          border: '2px solid ' + (active ? 'var(--text)' : 'transparent'),
          borderRadius: '50%',
          background: theme.accent,
          boxShadow: active ? '0 0 0 2px var(--card)' : 'none',
          cursor: 'pointer'
        }}
      />
    );
  })}
</div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent:
                'flex-end',
              gap: 8,
              marginLeft: 'auto'
            }}
          >
            {!trip.archived_at && (
              <SettingsButton
                icon="arrow"
                disabled={Boolean(
                  duplicatingTripId ||
                  archivingTripId
                )}
                onClick={() =>
                  onOpen(trip.id)
                }
              >
                Ouvrir
              </SettingsButton>
            )}

            <SettingsButton
              icon="plus"
              disabled={Boolean(
                duplicatingTripId
              )}
              onClick={() =>
                openDuplicateDialog(
                  trip
                )
              }
            >
              {
                duplicatingTripId ===
                  trip.id
                  ? 'Copie…'
                  : 'Dupliquer'
              }
            </SettingsButton>

            {trip.owner_id ===
              currentUserId && (
              <SettingsButton
                disabled={Boolean(
                  duplicatingTripId ||
                  archivingTripId
                )}
                onClick={() =>
                  changeArchiveState(
                    trip
                  )
                }
              >
                {archivingTripId ===
                trip.id
                  ? 'Modification…'
                  : trip.archived_at
                    ? 'Restaurer'
                    : 'Archiver'}
              </SettingsButton>
            )}

            <SettingsButton
              variant="danger"
              icon="x"
              disabled={Boolean(
                duplicatingTripId
              )}
              onClick={() =>
                removeTrip(trip)
              }
            >
              Supprimer
            </SettingsButton>
          </div>
        </div>
      ))}

      {tripToDuplicate && (
        <div
          onClick={
            closeDuplicateDialog
          }
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 700,
            display: 'grid',
            placeItems: 'center',
            padding: 18,
            background:
              'rgba(30, 25, 18, .56)',
            backdropFilter:
              'blur(5px)'
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-trip-title"
            onClick={event =>
              event.stopPropagation()
            }
            onKeyDown={event => {
              if (
                event.key ===
                'Escape'
              ) {
                event.preventDefault();
                event.stopPropagation();
                closeDuplicateDialog();
              }
            }}
            onSubmit={duplicateTrip}
            style={{
              width: '100%',
              maxWidth: 440,
              padding: 22,
              border:
                '1px solid var(--line)',
              borderRadius: 14,
              background:
                'var(--card)',
              boxShadow:
                'var(--shadow-lg)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems:
                  'flex-start',
                justifyContent:
                  'space-between',
                gap: 16
              }}
            >
              <div>
                <div
                  style={{
                    color:
                      'var(--accent)',
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing:
                      '.12em',
                    textTransform:
                      'uppercase'
                  }}
                >
                  Nouvelle copie
                </div>

                <h2
                  id="duplicate-trip-title"
                  style={{
                    margin: '5px 0 0',
                    fontFamily:
                      'var(--serif)',
                    fontSize: 25
                  }}
                >
                  Dupliquer le voyage
                </h2>
              </div>

              <button
                type="button"
                aria-label="Fermer la duplication"
                disabled={Boolean(
                  duplicatingTripId
                )}
                onClick={
                  closeDuplicateDialog
                }
                style={{
                  width: 36,
                  height: 36,
                  border:
                    '1px solid var(--line)',
                  borderRadius: 8,
                  color:
                    'var(--text)',
                  background:
                    'var(--inset)',
                  fontSize: 20,
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <p
              style={{
                margin: '12px 0 18px',
                color: 'var(--muted)',
                fontSize: 13,
                lineHeight: 1.5
              }}
            >
              Toutes les journées et les informations du voyage seront copiées.
            </p>

            <label
              htmlFor="duplicate-trip-name"
              style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing:
                  '.06em',
                textTransform:
                  'uppercase'
              }}
            >
              Nom de la copie
            </label>

            <input
              id="duplicate-trip-name"
              autoFocus
              required
              maxLength={120}
              value={duplicateName}
              onChange={event =>
                setDuplicateName(
                  event.target.value
                )
              }
              style={{
                width: '100%',
                minHeight: 46,
                padding: '0 12px',
                border:
                  '1px solid var(--line)',
                borderRadius: 8,
                color: 'var(--text)',
                background:
                  'var(--inset)',
                font: 'inherit'
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 20
              }}
            >
              <SettingsButton
                disabled={Boolean(
                  duplicatingTripId
                )}
                onClick={
                  closeDuplicateDialog
                }
              >
                Annuler
              </SettingsButton>

              <button
                type="submit"
                disabled={Boolean(
                  duplicatingTripId
                )}
                style={{
                  minHeight: 40,
                  padding: '0 16px',
                  border: 0,
                  borderRadius: 8,
                  color: '#fff',
                  background:
                    'var(--accent)',
                  fontWeight: 900,
                  cursor:
                    duplicatingTripId
                      ? 'wait'
                      : 'pointer'
                }}
              >
                {
                  duplicatingTripId
                    ? 'Duplication…'
                    : 'Créer la copie'
                }
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ShareSection({ trips, activeTripId, user }) {
  const [managedTripId, setManagedTripId] = React.useState(activeTripId || trips[0]?.id || '');
  const [members, setMembers] = React.useState([]);
  const [managedTrip, setManagedTrip] = React.useState(null);
  const [invite, setInvite] = React.useState(null);
  const [invites, setInvites] = React.useState([]);
  const [inviteRole, setInviteRole] = React.useState('editor');
  const [busy, setBusy] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [inviteError, setInviteError] = React.useState('');
  const [loadError, setLoadError] = React.useState('');
  const [
    revokingInviteId,
    setRevokingInviteId
  ] = React.useState(null);

  const [
    updatingMemberId,
    setUpdatingMemberId
  ] = React.useState(null);

  const [
    transferringMemberId,
    setTransferringMemberId
  ] = React.useState(null);

  const selectedTrip = trips.find(trip => trip.id === managedTripId) || null;
  const canManage = selectedTrip?.owner_id === user?.id;

  React.useEffect(() => {
    if (activeTripId && !managedTripId) {
      setManagedTripId(activeTripId);
    }
  }, [activeTripId, managedTripId]);

  React.useEffect(() => {
    if (!managedTripId) {
      setMembers([]);
      setManagedTrip(null);
      setInvites([]);
      return;
    }

    let alive = true;
    setInvite(null);
    setInviteError('');
    setLoadError('');
    setLoading(true);

    Promise.all([
      SB.listTripMembers(
        managedTripId
      ),
      SB.loadTrip(
        managedTripId
      ),
      SB.listTripInvites(
        managedTripId
      )
    ])
      .then(([
        memberList,
        fullTrip,
        inviteList
      ]) => {
        if (!alive) return;

        setMembers(memberList);
        setManagedTrip(fullTrip);
        setInvites(inviteList);

        if (managedTripId === activeTripId) {
          Store.set({ trip: fullTrip });
        }
      })
      .catch(error => {
        if (alive) {
          setLoadError(
            error.message ||
              'Impossible de charger les membres.'
          );
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [managedTripId]);

  async function refreshTrip() {
    if (!managedTripId) return;

    const [
      memberList,
      fullTrip,
      inviteList
    ] = await Promise.all([
      SB.listTripMembers(
        managedTripId
      ),
      SB.loadTrip(
        managedTripId
      ),
      SB.listTripInvites(
        managedTripId
      )
    ]);

    setMembers(memberList);
    setManagedTrip(fullTrip);
    setInvites(inviteList);

    if (managedTripId === activeTripId) {
      Store.set({ trip: fullTrip });
    }
  }

  async function createInvite() {
    setInviteError('');

    if (!canManage) {
      Store.showToast(
        'Seul le propriétaire peut inviter des membres.'
      );
      return;
    }

    setBusy(true);

    try {
      const created =
        await SB.createTripInvite(
          managedTripId,
          inviteRole
        );

      setInvite(created);

      setInvites(current => [
        created,
        ...current.filter(
          item =>
            item.id !== created.id
        )
      ]);

      try {
        await navigator.clipboard.writeText(
          created.url
        );

        Store.showToast(
          'Lien créé et copié.'
        );
      } catch (error) {
        Store.showToast(
          'Lien créé : copie-le depuis le champ.'
        );
      }
    } catch (error) {
      setInviteError(
        error.message ||
          "Impossible de créer l'invitation."
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyInviteLink(
    invitation = invite
  ) {
    if (!invitation?.url) return;

    setInviteError('');

    try {
      await navigator.clipboard.writeText(
        invitation.url
      );

      Store.showToast(
        'Lien copié.'
      );
    } catch (error) {
      setInviteError(
        'La copie automatique a échoué. Sélectionne le lien et copie-le manuellement.'
      );
    }
  }

  async function shareInviteLink(
    invitation = invite
  ) {
    if (!invitation?.url) return;

    setInviteError('');

    if (!navigator.share) {
      await copyInviteLink(
        invitation
      );
      return;
    }

    try {
      await navigator.share({
        title:
          selectedTrip?.name ||
          'Invitation au voyage',
        text:
          'Rejoins mon voyage sur La Fabrique à Voyages.',
        url: invitation.url
      });
    } catch (error) {
      if (
        error?.name !==
        'AbortError'
      ) {
        setInviteError(
          "Le partage n'a pas pu être ouvert. Tu peux toujours copier le lien."
        );
      }
    }
  }

   function inviteExpirationLabel(
    invitation
  ) {
    if (!invitation?.expiresAt) {
      return 'sans date limite';
    }

    return (
      'expire le ' +
      new Intl.DateTimeFormat(
        'fr-FR',
        {
          dateStyle: 'medium',
          timeStyle: 'short'
        }
      ).format(
        new Date(
          invitation.expiresAt
        )
      )
    );
  }

  async function revokeInviteLink(
    invitation
  ) {
    if (
      !canManage ||
      revokingInviteId
    ) {
      return;
    }

    setInviteError('');
    setRevokingInviteId(
      invitation.id
    );

    try {
      await SB.revokeTripInvite(
        invitation.id
      );

      setInvites(current =>
        current.filter(
          item =>
            item.id !==
            invitation.id
        )
      );

      if (
        invite?.id ===
        invitation.id
      ) {
        setInvite(null);
      }

      Store.showToast(
        'Invitation révoquée.'
      );
    } catch (error) {
      setInviteError(
        error.message ||
          "Impossible de révoquer l'invitation."
      );
    } finally {
      setRevokingInviteId(null);
    }
  }

    async function leaveManagedTrip() {
    if (
      canManage ||
      !selectedTrip ||
      leaving
    ) {
      return;
    }

    const confirmed = confirm(
      `Quitter « ${selectedTrip.name} » ? Tu n’auras plus accès à ce voyage.`
    );

    if (!confirmed) return;

    setLeaving(true);

    try {
      await SB.leaveTrip(
        managedTripId
      );

      const remaining =
        await SB.listMyTrips();

      const wasActive =
        managedTripId ===
        activeTripId;

      setManagedTripId(
        remaining[0]?.id || ''
      );

      setMembers([]);
      setManagedTrip(null);
      setInvites([]);

      Store.set({
        trips: remaining,
        activeTripId:
          wasActive
            ? null
            : activeTripId,
        trip:
          wasActive
            ? null
            : Store.get().trip
      });

      Store.showToast(
        'Tu as quitté le voyage.'
      );
    } catch (error) {
      Store.showToast(
        'Erreur : ' +
          (
            error.message ||
            'Impossible de quitter ce voyage.'
          )
      );
    } finally {
      setLeaving(false);
    }
  }

  async function transferOwnership(
    member
  ) {
    if (
      !canManage ||
      member.role === 'owner' ||
      transferringMemberId ||
      updatingMemberId
    ) {
      return;
    }

    const confirmed = confirm(
      `Transférer définitivement « ${selectedTrip.name} » à ${member.name || 'ce membre'} ? Tu deviendras éditeur du voyage.`
    );

    if (!confirmed) return;

    setTransferringMemberId(
      member.id
    );

    try {
      await SB.transferTripOwnership(
        managedTripId,
        member.id
      );

      const [
        nextTrips,
        nextTrip,
        nextMembers
      ] = await Promise.all([
        SB.listMyTrips(),
        SB.loadTrip(
          managedTripId
        ),
        SB.listTripMembers(
          managedTripId
        )
      ]);

      setMembers(nextMembers);
      setManagedTrip(nextTrip);
      setInvites([]);
      setInvite(null);

      Store.set({
        trips: nextTrips,
        trip:
          managedTripId ===
          activeTripId
            ? nextTrip
            : Store.get().trip
      });

      Store.showToast(
        'Propriété du voyage transférée.'
      );
    } catch (error) {
      Store.showToast(
        'Erreur : ' +
          (
            error.message ||
            'Impossible de transférer le voyage.'
          )
      );
    } finally {
      setTransferringMemberId(null);
    }
  }

    async function changeMemberRole(
    member,
    nextRole
  ) {
    if (
      !canManage ||
      member.role === 'owner' ||
      member.role === nextRole ||
      updatingMemberId
    ) {
      return;
    }

    setUpdatingMemberId(member.id);

    try {
      await SB.updateTripMemberRole(
        managedTripId,
        member.id,
        nextRole
      );

      setMembers(current =>
        current.map(item =>
          item.id === member.id
            ? {
                ...item,
                role: nextRole
              }
            : item
        )
      );

      Store.showToast(
        nextRole === 'viewer'
          ? 'Le membre est maintenant lecteur.'
          : 'Le membre est maintenant éditeur.'
      );
    } catch (error) {
      Store.showToast(
        'Erreur : ' +
          (
            error.message ||
            'Impossible de modifier le rôle.'
          )
      );
    } finally {
      setUpdatingMemberId(null);
    }
  }


  async function addToBudget(member) {
    try {
      await SB.addMemberAsParticipant(
        managedTripId,
        member,
        managedTrip?.participants?.length || 0
      );

      await refreshTrip();
      Store.showToast('Membre ajouté au budget');
    } catch (error) {
      Store.showToast('Erreur : ' + error.message);
    }
  }

  async function removeMember(member) {
    if (!confirm(`Retirer ${member.name} de « ${selectedTrip.name} » ?`)) return;

    try {
      await SB.removeTripMember(managedTripId, member.id);
      await refreshTrip();
      Store.showToast('Membre retiré');
    } catch (error) {
      Store.showToast('Erreur : ' + error.message);
    }
  }

  if (!trips.length) {
    return (
      <SettingsCard title="Aucun voyage">
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>
          Crée un voyage avant de gérer le partage.
        </div>
      </SettingsCard>
    );
  }

  return (
    <div style={{ maxWidth: 740, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SettingsCard eyebrow="Voyage" title="Quel voyage veux-tu gérer ?">
        <select
          value={managedTripId}
          onChange={event => setManagedTripId(event.target.value)}
          style={{ ...settingsInputStyle, maxWidth: 420 }}
        >
          {trips.map(trip => (
            <option key={trip.id} value={trip.id}>
              {trip.name}
              {trip.id === activeTripId ? ' — voyage ouvert' : ''}
            </option>
          ))}
        </select>

        <div
          style={{
            marginTop: 10,
            color: 'var(--muted)',
            fontSize: 12
          }}
        >
          {canManage
            ? 'Tu es propriétaire de ce voyage : tu peux inviter et retirer des membres.'
            : 'Tu participes à ce voyage, mais seul son propriétaire peut gérer les invitations.'}
        </div>

        {!canManage && (
          <div
            style={{
              display: 'flex',
              marginTop: 14
            }}
          >
            <SettingsButton
              variant="danger"
              icon="x"
              disabled={leaving}
              onClick={leaveManagedTrip}
            >
              {leaving
                ? 'Départ…'
                : 'Quitter ce voyage'}
            </SettingsButton>
          </div>
        )}
      </SettingsCard>

            <SettingsCard
        eyebrow="Invitation"
        title="Voyager à plusieurs"
      >
        <p
          style={{
            margin: '0 0 16px',
            color: 'var(--muted)',
            fontSize: 13,
            lineHeight: 1.5
          }}
        >
          Choisis les droits de la personne, puis partage-lui un lien personnel valable une seule fois.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'end',
            gap: 10,
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 210
            }}
          >
            <label
              htmlFor="trip-invite-role"
              style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 900
              }}
            >
              Droits accordés
            </label>

            <select
              id="trip-invite-role"
              value={inviteRole}
              disabled={!canManage}
              onChange={event => {
                setInviteRole(
                  event.target.value
                );
                setInvite(null);
                setInviteError('');
              }}
              style={settingsInputStyle}
            >
              <option value="editor">
                Éditeur — peut modifier le voyage
              </option>

              <option value="viewer">
                Lecteur — peut uniquement consulter
              </option>
            </select>
          </div>

          <SettingsButton
            variant="primary"
            icon="share"
            onClick={createInvite}
            disabled={
              !canManage ||
              busy ||
              loading
            }
          >
            {
              busy
                ? 'Création…'
                : 'Créer le lien'
            }
          </SettingsButton>
        </div>

        {!canManage && (
          <div
            style={{
              marginTop: 14,
              padding: '11px 13px',
              borderRadius: 8,
              color: 'var(--muted)',
              background: 'var(--card)',
              fontSize: 12,
              lineHeight: 1.45
            }}
          >
            Seul le propriétaire du voyage peut créer des invitations.
          </div>
        )}

        {inviteError && (
          <div
            role="alert"
            style={{
              marginTop: 14,
              padding: '11px 13px',
              borderRadius: 8,
              color: '#b64f38',
              background:
                'rgba(192, 86, 63, .10)',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.45
            }}
          >
            {inviteError}
          </div>
        )}

                {canManage && (
          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop:
                '1px solid var(--line)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between',
                gap: 10,
                marginBottom: 10
              }}
            >
              <strong
                style={{
                  fontSize: 13
                }}
              >
                Invitations actives
              </strong>

              <span
                style={{
                  color: 'var(--muted)',
                  fontSize: 11
                }}
              >
                {invites.length}
              </span>
            </div>

            {!invites.length ? (
              <div
                style={{
                  padding: 14,
                  border:
                    '1px dashed var(--line)',
                  borderRadius: 9,
                  color: 'var(--muted)',
                  background: 'var(--card)',
                  fontSize: 12,
                  textAlign: 'center'
                }}
              >
                Aucun lien actif. Crée une invitation lorsque tu es prêt à la partager.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                {invites.map(
                  activeInvite => (
                    <div
                      key={activeInvite.id}
                      className="settings-invite-row"
                      data-invite-id={
                        activeInvite.id
                      }
                      aria-live={
                        activeInvite.id ===
                        invite?.id
                          ? 'polite'
                          : undefined
                      }
                      style={{
                        padding: 14,
                        border:
                          '1px solid ' +
                          (
                            activeInvite.id ===
                            invite?.id
                              ? 'rgba(39, 100, 79, .3)'
                              : 'var(--line)'
                          ),
                        borderRadius: 10,
                        background:
                          activeInvite.id ===
                          invite?.id
                            ? 'rgba(39, 100, 79, .08)'
                            : 'var(--card)'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems:
                            'flex-start',
                          justifyContent:
                            'space-between',
                          flexWrap: 'wrap',
                          gap: 10
                        }}
                      >
                        <div>
                          <strong
                            style={{
                              display: 'block',
                              fontSize: 13
                            }}
                          >
                            {
                              activeInvite.role ===
                              'viewer'
                                ? 'Accès lecteur'
                                : 'Accès éditeur'
                            }
                          </strong>

                          <span
                            style={{
                              display: 'block',
                              marginTop: 4,
                              color:
                                'var(--muted)',
                              fontSize: 11
                            }}
                          >
                            {
                              inviteExpirationLabel(
                                activeInvite
                              )
                            }
                            {' · une seule utilisation'}
                          </span>
                        </div>

                        <span
                          style={{
                            padding: '4px 7px',
                            borderRadius: 999,
                            color: '#27644f',
                            background:
                              'rgba(39, 100, 79, .12)',
                            fontSize: 9,
                            fontWeight: 900,
                            letterSpacing:
                              '.06em',
                            textTransform:
                              'uppercase'
                          }}
                        >
                          {
                            activeInvite.id ===
                            invite?.id
                              ? 'Nouveau'
                              : 'Actif'
                          }
                        </span>
                      </div>

                      <input
                        readOnly
                        value={activeInvite.url}
                        aria-label={
                          "Lien d'invitation " +
                          activeInvite.role
                        }
                        onFocus={event =>
                          event.target.select()
                        }
                        style={{
                          ...settingsInputStyle,
                          marginTop: 12,
                          background:
                            'var(--inset)'
                        }}
                      />

                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                          marginTop: 10
                        }}
                      >
                        <SettingsButton
                          icon="check"
                          onClick={() =>
                            copyInviteLink(
                              activeInvite
                            )
                          }
                        >
                          Copier
                        </SettingsButton>

                        <SettingsButton
                          variant="primary"
                          icon="share"
                          onClick={() =>
                            shareInviteLink(
                              activeInvite
                            )
                          }
                        >
                          Partager
                        </SettingsButton>

                        <SettingsButton
                          variant="danger"
                          icon="x"
                          disabled={Boolean(
                            revokingInviteId
                          )}
                          onClick={() =>
                            revokeInviteLink(
                              activeInvite
                            )
                          }
                        >
                          {
                            revokingInviteId ===
                            activeInvite.id
                              ? 'Révocation…'
                              : 'Révoquer'
                          }
                        </SettingsButton>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </SettingsCard>

      <SettingsCard eyebrow="Membres" title={`Personnes de ${selectedTrip?.name || 'ce voyage'}`}>
        {loading ? (
          <div
            role="status"
            style={{
              color: 'var(--muted)',
              fontSize: 13
            }}
          >
            Chargement des membres…
          </div>
        ) : loadError ? (
          <div
            role="alert"
            style={{
              padding: '11px 13px',
              borderRadius: 8,
              color: '#b64f38',
              background:
                'rgba(192, 86, 63, .10)',
              fontSize: 12,
              fontWeight: 700
            }}
          >
            {loadError}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map(member => (
              <div key={member.id} style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 11,
                padding: 11,
                border: '1px solid var(--line)',
                borderRadius: 9,
                background: 'var(--card)'
              }}>
                <div style={{
                  width: 33,
                  height: 33,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  fontWeight: 900
                }}>
                  {(member.name || member.email || 'M').slice(0, 1).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: 13 }}>
                    {member.name || 'Membre'}
                  </strong>
                  {canManage && member.role !== 'owner' ? (
                    <select
                      aria-label={`Rôle de ${member.name || 'ce membre'}`}
                      value={member.role}
                      disabled={
                        updatingMemberId ===
                        member.id
                      }
                      onChange={event =>
                        changeMemberRole(
                          member,
                          event.target.value
                        )
                      }
                      style={{
                        ...settingsInputStyle,
                        width: 'auto',
                        minWidth: 110,
                        marginTop: 4,
                        padding:
                          '7px 30px 7px 9px',
                        fontSize: 12
                      }}
                    >
                      <option value="editor">
                        Éditeur
                      </option>

                      <option value="viewer">
                        Lecteur
                      </option>
                    </select>
                  ) : (
                    <span
                      style={{
                        color: 'var(--muted)',
                        fontSize: 12
                      }}
                    >
                      {member.role === 'owner'
                        ? 'Propriétaire'
                        : member.role === 'viewer'
                          ? 'Lecteur'
                          : 'Éditeur'}
                    </span>
                  )}
                </div>

                {canManage && member.role !== 'owner' && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                      gap: 6,
                      marginLeft: 'auto'
                    }}
                  >
                    {!SB.isMemberAlreadyParticipant(
                      member,
                      managedTrip?.participants || []
                    ) && (
                      <SettingsButton
                        onClick={() =>
                          addToBudget(member)
                        }
                      >
                        Budget
                      </SettingsButton>
                    )}

                    <SettingsButton
                      disabled={Boolean(
                        transferringMemberId ||
                        updatingMemberId
                      )}
                      onClick={() =>
                        transferOwnership(member)
                      }
                    >
                      {transferringMemberId ===
                      member.id
                        ? 'Transfert…'
                        : 'Transférer'}
                    </SettingsButton>

                    <SettingsButton
                      variant="danger"
                      disabled={Boolean(
                        transferringMemberId
                      )}
                      onClick={() =>
                        removeMember(member)
                      }
                    >
                      Retirer
                    </SettingsButton>
                  </div>
                )}
              </div>
            ))}

            {!members.length && (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                Aucun membre pour le moment.
              </div>
            )}
          </div>
        )}
      </SettingsCard>
    </div>
  );
}

function ActivitySection({ trips, activeTripId }) {
  const [tripId, setTripId] = React.useState(activeTripId || trips[0]?.id || '');
  const [activities, setActivities] = React.useState([]);
  const [members, setMembers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const selectedTrip = trips.find(trip => trip.id === tripId);

  React.useEffect(() => {
    if (activeTripId && !tripId) {
      setTripId(activeTripId);
    }
  }, [activeTripId, tripId]);

  async function loadActivity() {
    if (!tripId) {
      setActivities([]);
      return;
    }

    setLoading(true);

    try {
      const [activityRows, memberRows] = await Promise.all([
        SB.listTripActivity(tripId, 40),
        SB.listTripMembers(tripId)
      ]);

      setActivities(activityRows);
      setMembers(memberRows);
    } catch (error) {
      Store.showToast('Erreur journal : ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadActivity();
  }, [tripId]);

  const names = Object.fromEntries(
    members.map(member => [member.userId, member.name])
  );

  if (!trips.length) {
    return (
      <SettingsCard title="Aucun voyage">
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>
          Crée un voyage pour voir son journal.
        </div>
      </SettingsCard>
    );
  }

  return (
    <div style={{ maxWidth: 740, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SettingsCard eyebrow="Voyage" title="Journal de quel voyage ?">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={tripId}
            onChange={event => setTripId(event.target.value)}
            style={{ ...settingsInputStyle, flex: 1 }}
          >
            {trips.map(trip => (
              <option key={trip.id} value={trip.id}>
                {trip.name}
                {trip.id === activeTripId ? ' — voyage ouvert' : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadActivity}
            title="Actualiser le journal"
            aria-label="Actualiser le journal"
            style={settingsIconButtonStyle}
          >
            <Icon name="arrowsm" size={16} />
          </button>
        </div>
      </SettingsCard>

      <SettingsCard
        eyebrow="Historique"
        title={`Modifications récentes — ${selectedTrip?.name || 'Voyage'}`}
      >
        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            Chargement du journal…
          </div>
        ) : !activities.length ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            Aucune modification enregistrée pour le moment. Les nouvelles actions apparaîtront ici.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px minmax(0, 1fr)',
                  gap: 11,
                  padding: index === 0 ? '0 0 14px' : '14px 0',
                  borderTop: index === 0 ? 'none' : '1px solid var(--line)'
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  marginTop: 1,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)'
                }}>
                  <Icon name={activityIcon(activity.entity_type)} size={14} />
                </div>

                <div>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                    {activityDescription(activity, names)}
                  </div>
                  <div style={{ marginTop: 4, color: 'var(--muted)', fontSize: 11 }}>
                    {activityDate(activity.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsCard>
    </div>
  );
}

function activityIcon(type) {
  const icons = {
    trips: 'map',
    trip_days: 'cal',
    trip_steps: 'pin',
    budget_items: 'badge',
    trip_documents: 'file',
    trip_members: 'users',
    trip_participants: 'users',
    trip_invites: 'share'
  };

  return icons[type] || 'clock';
}

function activityDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function activityDescription(activity, names) {
  const details = activity.details || {};
  const actor = names[activity.actor_id] || 'Quelqu’un';
  const label = details.label || details.name || 'un élément';

  if (activity.entity_type === 'trip_members') {
    const memberName =
      details.member_name ||
      'Un membre';

    if (activity.action === 'joined') {
      return (
        <>
          <strong>{memberName}</strong> a rejoint le voyage.
        </>
      );
    }

    if (activity.action === 'role_changed') {
      const roleNames = {
        owner: 'Propriétaire',
        editor: 'Éditeur',
        viewer: 'Lecteur'
      };

      const oldRole =
        roleNames[details.old_role] ||
        details.old_role;

      const newRole =
        roleNames[details.new_role] ||
        details.new_role;

      if (details.new_role === 'owner') {
        return (
          <>
            <strong>{memberName}</strong> est maintenant
            propriétaire du voyage.
          </>
        );
      }

      if (
        activity.actor_id ===
        details.member_user_id
      ) {
        return (
          <>
            <strong>{memberName}</strong> est maintenant{' '}
            {String(newRole).toLowerCase()}.
          </>
        );
      }

      return (
        <>
          <strong>{actor}</strong> a changé le rôle de{' '}
          <strong>{memberName}</strong> : {oldRole} → {newRole}.
        </>
      );
    }

    return (
      <>
        <strong>{memberName}</strong> a quitté ou a été
        retiré du voyage.
      </>
    );
  }

  if (activity.entity_type === 'trip_invites') {
    return <><strong>{actor}</strong> a créé une invitation {details.role === 'viewer' ? 'en lecture seule' : 'avec modification'}.</>;
  }

  const entityNames = {
    trips: 'le voyage',
    trip_days: 'la journée',
    trip_steps: 'une étape',
    budget_items: 'une dépense',
    trip_documents: 'un document',
    trip_participants: 'un participant'
  };

  const verbs = {
    created: 'a ajouté',
    updated: 'a modifié',
    deleted: 'a supprimé'
  };

  const target = activity.entity_type === 'trips'
    ? details.name || 'le voyage'
    : label;

  return (
    <>
      <strong>{actor}</strong> {verbs[activity.action] || 'a modifié'}{' '}
      {entityNames[activity.entity_type] || 'un élément'} : <strong>{target}</strong>.
    </>
  );
}

function SettingsCard({ eyebrow, title, children }) {
  return (
    <section className="web-settings-card" style={{
      padding: 18,
      border: '1px solid var(--line)',
      borderRadius: 12,
      background: 'var(--inset)'
    }}>
      {eyebrow && (
        <div style={{
          color: 'var(--accent)',
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '.12em',
          textTransform: 'uppercase'
        }}>
          {eyebrow}
        </div>
      )}
      {title && (
        <h2 style={{
          margin: eyebrow ? '6px 0 15px' : '0 0 15px',
          fontFamily: 'var(--serif)',
          fontSize: 21,
          fontWeight: 500
        }}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

function SettingsField({ label, description, children }) {
  return (
    <div className="web-settings-field" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(120px, .7fr) minmax(0, 1.3fr)',
      gap: 16,
      alignItems: 'center',
      padding: '14px 0',
      borderTop: '1px solid var(--line)'
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 900 }}>{label}</div>
        <div style={{ marginTop: 3, color: 'var(--muted)', fontSize: 12, lineHeight: 1.35 }}>
          {description}
        </div>
      </div>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

function SettingsChoice({ icon, label, description, active, onClick }) {
  return (
    <button
      className="web-settings-choice"
      type="button"
      onClick={onClick}
      style={{
        minHeight: 106,
        padding: 14,
        border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
        borderRadius: 9,
        background: active ? 'var(--accent-soft)' : 'var(--card)',
        color: active ? 'var(--accent)' : 'var(--text)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit'
      }}
    >
      <Icon name={icon} size={18} />
      <div style={{ marginTop: 11, fontSize: 13, fontWeight: 900 }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.35, color: 'var(--muted)' }}>
        {description}
      </div>
    </button>
  );
}

function SettingsToggle({ checked, onChange, label, description }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 25,
          padding: 3,
          border: 'none',
          borderRadius: 20,
          flexShrink: 0,
          background: checked ? 'var(--accent)' : 'var(--line)',
          cursor: 'pointer'
        }}
      >
        <span style={{
          display: 'block',
          width: 19,
          height: 19,
          borderRadius: '50%',
          background: 'white',
          transform: checked ? 'translateX(19px)' : 'translateX(0)',
          transition: 'transform .16s ease'
        }} />
      </button>

      <div>
        <div style={{ fontSize: 13, fontWeight: 900 }}>{label}</div>
        <div style={{ marginTop: 3, color: 'var(--muted)', fontSize: 12, lineHeight: 1.35 }}>
          {description}
        </div>
      </div>
    </div>
  );
}

function SettingsButton({ variant = 'secondary', icon, children, style, ...props }) {
  const colors = {
    primary: {
      background: 'var(--accent)',
      border: '1px solid var(--accent)',
      color: 'var(--bg)'
    },
    danger: {
      background: 'transparent',
      border: '1px solid rgba(193, 93, 72, .35)',
      color: 'var(--danger)'
    },
    secondary: {
      background: 'var(--card)',
      border: '1px solid var(--line)',
      color: 'var(--text)'
    }
  };

  return (
    <button
      type="button"
      {...props}
      style={{
        minHeight: 44,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        padding: '7px 10px',
        borderRadius: 8,
        cursor: props.disabled ? 'default' : 'pointer',
        opacity: props.disabled ? .6 : 1,
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 900,
        whiteSpace: 'nowrap',
        ...colors[variant],
        ...style
      }}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  );
}

function displayName(user) {
  return user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Voyageur';
}

function initials(user) {
  return displayName(user)
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

const settingsIconButtonStyle = {
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  border: '1px solid var(--line)',
  borderRadius: 8,
  background: 'var(--card)',
  color: 'var(--muted)',
  cursor: 'pointer'
};

const settingsInputStyle = {
  width: '100%',
  minWidth: 0,
  minHeight: 44,
  padding: '10px 12px',
  border: '1px solid var(--line)',
  borderRadius: 8,
  outline: 'none',
  background: 'var(--inset)',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 16
};

window.SettingsModal = SettingsModal;
