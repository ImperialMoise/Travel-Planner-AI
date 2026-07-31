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
        <aside style={{
          display: 'flex',
          flexDirection: compact ? 'row' : 'column',
          gap: compact ? 4 : 6,
          overflowX: compact ? 'auto' : 'visible',
          padding: compact ? '10px 12px' : '22px 14px',
          background: 'var(--bg-2)',
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
                L&apos;Atelier
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
          <header style={{
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

          <div style={{
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
            description="Saisis les six chiffres reçus par e-mail."
          >
            <input
              value={token}
              onChange={event => setToken(
                event.target.value.replace(/\D/g, '').slice(0, 6)
              )}
              placeholder="000000"
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
        background: 'var(--bg-2)'
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
        <SettingsField label="Pseudo" description="Le nom affiché dans L’Atelier.">
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

        <SettingsField label="E-mail" description="Géré par ton compte de connexion.">
          <div style={{ color: 'var(--text)', fontSize: 13, wordBreak: 'break-word' }}>
            {user?.email || 'Non renseigné'}
          </div>
        </SettingsField>
      </SettingsCard>

      <SettingsCard eyebrow="Session" title="Connexion">
        <SettingsField label="Déconnexion" description="Ferme la session sur cet appareil.">
          <SettingsButton variant="danger" icon="x" onClick={signOut}>
            Se déconnecter
          </SettingsButton>
        </SettingsField>
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

function TripsSection({ trips, activeTripId, onOpen }) {
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

  if (!trips.length) {
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
    <div style={{ maxWidth: 740, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {trips.map(trip => (
        <div key={trip.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          padding: 14,
          border: '1px solid ' + (trip.id === activeTripId ? 'rgba(157, 104, 12, .35)' : 'var(--line)'),
          borderLeft: '4px solid ' + getTripAccentTheme(trip.accent_theme).accent,
          borderRadius: 10,
          background: trip.id === activeTripId ? 'var(--accent-soft)' : 'var(--bg-2)'
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
                <span style={{
                  padding: '2px 6px',
                  borderRadius: 5,
                  background: 'var(--accent)',
                  color: 'var(--bg)',
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: '.08em'
                }}>
                  ACTIF
                </span>
              )}
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

          <SettingsButton icon="arrow" onClick={() => onOpen(trip.id)}>
            Ouvrir
          </SettingsButton>
          <SettingsButton variant="danger" icon="x" onClick={() => removeTrip(trip)}>
            Supprimer
          </SettingsButton>
        </div>
      ))}
    </div>
  );
}

function ShareSection({ trips, activeTripId, user }) {
  const [managedTripId, setManagedTripId] = React.useState(activeTripId || trips[0]?.id || '');
  const [members, setMembers] = React.useState([]);
  const [managedTrip, setManagedTrip] = React.useState(null);
  const [invite, setInvite] = React.useState(null);
  const [inviteRole, setInviteRole] = React.useState('editor');
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

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
      return;
    }

    let alive = true;
    setInvite(null);
    setLoading(true);

    Promise.all([
      SB.listTripMembers(managedTripId),
      SB.loadTrip(managedTripId)
    ])
      .then(([memberList, fullTrip]) => {
        if (!alive) return;
        setMembers(memberList);
        setManagedTrip(fullTrip);

        if (managedTripId === activeTripId) {
          Store.set({ trip: fullTrip });
        }
      })
      .catch(error => {
        if (alive) Store.showToast('Erreur : ' + error.message);
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

    const [memberList, fullTrip] = await Promise.all([
      SB.listTripMembers(managedTripId),
      SB.loadTrip(managedTripId)
    ]);

    setMembers(memberList);
    setManagedTrip(fullTrip);

    if (managedTripId === activeTripId) {
      Store.set({ trip: fullTrip });
    }
  }

  async function createInvite() {
    if (!canManage) {
      Store.showToast('Seul le propriétaire peut inviter des membres.');
      return;
    }

    setBusy(true);

    try {
      const created = await SB.createTripInvite(managedTripId, inviteRole);
      setInvite(created);

      try {
        await navigator.clipboard.writeText(created.url);
        Store.showToast('Lien créé et copié');
      } catch (error) {
        Store.showToast('Lien créé : copie-le depuis le champ');
      }
    } catch (error) {
      Store.showToast('Erreur invitation : ' + error.message);
    } finally {
      setBusy(false);
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

        <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 12 }}>
          {canManage
            ? 'Tu es propriétaire de ce voyage : tu peux inviter et retirer des membres.'
            : 'Tu participes à ce voyage, mais seul son propriétaire peut gérer les invitations.'}
        </div>
      </SettingsCard>

      <SettingsCard eyebrow="Invitation" title="Voyager à plusieurs">
        <div style={{ display: 'flex', alignItems: 'end', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 210 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 900 }}>
              Rôle de l’invitation
            </label>
            <select
              value={inviteRole}
              disabled={!canManage}
              onChange={event => setInviteRole(event.target.value)}
              style={settingsInputStyle}
            >
              <option value="editor">Éditeur : peut modifier le voyage</option>
              <option value="viewer">Lecteur : peut uniquement consulter</option>
            </select>
          </div>

          <SettingsButton
            variant="primary"
            icon="share"
            onClick={createInvite}
            disabled={!canManage || busy}
          >
            {busy ? 'Création' : 'Créer un lien'}
          </SettingsButton>
        </div>

        {invite && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <input readOnly value={invite.url} style={settingsInputStyle} />
            <SettingsButton
              icon="check"
              onClick={() => {
                navigator.clipboard?.writeText(invite.url);
                Store.showToast('Lien copié');
              }}
            >
              Copier
            </SettingsButton>
          </div>
        )}
      </SettingsCard>

      <SettingsCard eyebrow="Membres" title={`Personnes de ${selectedTrip?.name || 'ce voyage'}`}>
        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            Chargement des membres…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map(member => (
              <div key={member.id} style={{
                display: 'flex',
                alignItems: 'center',
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
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                    {member.role === 'owner'
                      ? 'Propriétaire'
                      : member.role === 'viewer'
                        ? 'Lecteur'
                        : 'Éditeur'}
                  </span>
                </div>

                {canManage && member.role !== 'owner' && (
                  <>
                    {!SB.isMemberAlreadyParticipant(member, managedTrip?.participants || []) && (
                      <SettingsButton onClick={() => addToBudget(member)}>
                        Budget
                      </SettingsButton>
                    )}

                    <SettingsButton
                      variant="danger"
                      onClick={() => removeMember(member)}
                    >
                      Retirer
                    </SettingsButton>
                  </>
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
    if (activity.action === 'joined') {
      return <><strong>{details.member_name || 'Un membre'}</strong> a rejoint le voyage.</>;
    }

    return <><strong>{details.member_name || 'Un membre'}</strong> a quitté ou a été retiré du voyage.</>;
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
    <section style={{
      padding: 18,
      border: '1px solid var(--line)',
      borderRadius: 12,
      background: 'var(--bg-2)'
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
    <div style={{
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
        minHeight: 34,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        padding: '7px 10px',
        borderRadius: 8,
        cursor: props.disabled ? 'default' : 'pointer',
        opacity: props.disabled ? .6 : 1,
        fontFamily: 'inherit',
        fontSize: 12,
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
  width: 34,
  height: 34,
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
  padding: '9px 10px',
  border: '1px solid var(--line)',
  borderRadius: 8,
  outline: 'none',
  background: 'var(--inset)',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 13
};

window.SettingsModal = SettingsModal;