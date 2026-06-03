// ════════════════════════════════════════════════════════════
// AppShell.js — coquille principale de l'app.
// Topbar (logo + sélecteur voyage + actions) + zone de vue.
// ════════════════════════════════════════════════════════════

function AppShell() {
  const { user, authReady, view, trips, activeTripId, trip, toast, settingsOpen } = Store.useStore();

  // ─── Vue active ───────────────────────────────────────────
  let CurrentView = null;
  if (view === 'itinerary') CurrentView = window.ItineraryView;
  else if (view === 'map')   CurrentView = window.MapView;
  else if (view === 'budget')CurrentView = window.BudgetView;
  else if (view === 'docs')  CurrentView = window.DocsView;

  if (!authReady) {
    return (
      <div className="boot">
        <div className="boot-mark">VP</div>
        <div className="boot-label">Connexion à Supabase…</div>
      </div>
    );
  }

  return (
    <>
      {/* On cache la Topbar de l'app si le design de Claude est affiché (car il a la sienne) */}
      <Topbar />
      
      <main style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {!user ? <LoggedOutHome /> :
         !activeTripId ? <NoTripHome /> :
         !trip ? <LoadingTrip /> :
         CurrentView ? <CurrentView /> : <div style={{ padding: 40, color: 'var(--muted)' }}>Vue inconnue : {view}</div>}
      </main>
      
      {/* On cache aussi la BottomNav si on est sur l'Itinéraire */}
      <BottomNav />
      
      {settingsOpen && window.SettingsModal && <window.SettingsModal />}
      {toast && <div className="toast show">{toast.msg}</div>}
    </>
  );
}

// ─── Topbar ─────────────────────────────────────────────────
function Topbar() {
  const { user, trips, activeTripId, trip } = Store.useStore();
  const [authOpen, setAuthOpen] = React.useState(false);
  const [tripMenuOpen, setTripMenuOpen] = React.useState(false);
  const [newTripOpen, setNewTripOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (!tripMenuOpen) return;
    const onClick = (e) => { if (!menuRef.current?.contains(e.target)) setTripMenuOpen(false); };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [tripMenuOpen]);

  const pseudo = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
  const initials = pseudo.slice(0, 2).toUpperCase();

  return (
    <header style={{
      height: 60, flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '0 18px',
      borderBottom: '1px solid var(--line)',
      background: 'rgba(20,42,36,.7)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: 'var(--accent)', color: 'var(--bg)',
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16
        }}>VP</div>
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--text)' }}>L'Atelier</div>
      </div>

      {/* Sélecteur voyage */}
      {user && (
        <div ref={menuRef} style={{ position: 'relative', marginLeft: 12 }}>
          <button
            onClick={() => setTripMenuOpen(o => !o)}
            style={{
              background: 'var(--inset)', border: '1px solid var(--line)',
              color: 'var(--text)', borderRadius: 12,
              padding: '7px 12px', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              maxWidth: 220
            }}
          >
            <Icon name="cal" size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {trip?.name || (activeTripId ? 'Chargement…' : 'Choisir un voyage')}
            </span>
            <Icon name="chevdown" size={14} style={{ color: 'var(--muted)' }} />
          </button>
          {tripMenuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              minWidth: 260, maxHeight: 360, overflowY: 'auto',
              background: 'var(--card)', border: '1px solid var(--line)',
              borderRadius: 14, padding: 6,
              boxShadow: 'var(--shadow-lg)', zIndex: 200
            }}>
              {trips.length === 0 && (
                <div style={{ padding: '12px 10px', fontSize: 13, color: 'var(--muted)' }}>
                  Aucun voyage pour l'instant.
                </div>
              )}
              {trips.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTripMenuOpen(false); selectTrip(t.id); }}
                  style={{
                    width: '100%', textAlign: 'left',
                    background: t.id === activeTripId ? 'var(--accent-soft)' : 'transparent',
                    color: t.id === activeTripId ? 'var(--accent)' : 'var(--text)',
                    border: 'none', borderRadius: 10,
                    padding: '9px 10px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 8
                  }}
                >
                  <Icon name="map" size={13} />
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                  {t.start_date && <span style={{ fontSize: 11, color: 'var(--faint)' }}>{fmtDate(t.start_date)}</span>}
                </button>
              ))}
              <div style={{ height: 1, background: 'var(--line)', margin: '6px 4px' }} />
              <button
                onClick={() => { setTripMenuOpen(false); setNewTripOpen(true); }}
                style={{
                  width: '100%', textAlign: 'left',
                  background: 'transparent', color: 'var(--accent)',
                  border: 'none', borderRadius: 10,
                  padding: '9px 10px', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <Icon name="plus" size={13} />
                Nouveau voyage
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Actions à droite */}
      {user ? (
        <>
          <button
            onClick={() => Store.set({ settingsOpen: true })}
            title="Paramètres"
            style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'var(--inset)', border: '1px solid var(--line)',
              color: 'var(--text)', cursor: 'pointer',
              display: 'grid', placeItems: 'center'
            }}
          ><Icon name="gear" size={16} /></button>
          <button
            onClick={() => Store.set({ settingsOpen: true })}
            title={pseudo}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--accent-soft)', color: 'var(--accent)',
              border: '1px solid rgba(217,182,126,.3)',
              padding: '6px 10px 6px 6px', borderRadius: 999,
              cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit'
            }}
          >
            <span style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--accent)', color: 'var(--bg)',
              display: 'grid', placeItems: 'center',
              fontSize: 11, fontWeight: 800
            }}>{initials}</span>
            <span style={{ whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{pseudo}</span>
          </button>
        </>
      ) : (
        <Btn variant="primary" icon="user" onClick={() => setAuthOpen(true)}>Connexion</Btn>
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {newTripOpen && <NewTripModal onClose={() => setNewTripOpen(false)} />}
    </header>
  );
}

// ─── Bottom Nav ─────────────────────────────────────────────
function BottomNav() {
  const { view, trip } = Store.useStore();
  if (!trip) return null;
  const items = [
    { id: 'itinerary', label: 'Plan',   icon: 'route' },
    { id: 'map',       label: 'Carte',  icon: 'map' },
    { id: 'budget',    label: 'Budget', icon: 'sparkle' },
    { id: 'docs',      label: 'Docs',   icon: 'flag' }
  ];
  return (
    <nav style={{
      height: 64, flexShrink: 0,
      display: 'grid', gridTemplateColumns: `repeat(${items.length},1fr)`,
      borderTop: '1px solid var(--line)',
      background: 'rgba(20,42,36,.85)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      position: 'sticky', bottom: 0, zIndex: 90
    }}>
      {items.map(it => {
        const on = view === it.id;
        return (
          <button
            key={it.id}
            onClick={() => Store.set({ view: it.id })}
            style={{
              border: 'none', background: 'transparent',
              color: on ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              fontSize: 11, fontWeight: 700,
              fontFamily: 'inherit', letterSpacing: '.02em'
            }}
          >
            <Icon name={it.icon} size={20} />
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── Écrans vides ───────────────────────────────────────────
function LoggedOutHome() {
  const [authOpen, setAuthOpen] = React.useState(false);
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 40, gap: 16
    }}>
      <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 38, lineHeight: 1.1 }}>
        Bienvenue dans <span style={{ color: 'var(--accent)' }}>L'Atelier</span>
      </div>
      <p style={{ color: 'var(--muted)', maxWidth: 420, lineHeight: 1.6 }}>
        Planifie tes voyages à plusieurs : itinéraire, carte, budget et documents au même endroit.
      </p>
      <Btn variant="primary" icon="user" onClick={() => setAuthOpen(true)}>
        Se connecter / Créer un compte
      </Btn>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}

function NoTripHome() {
  const [newOpen, setNewOpen] = React.useState(false);
  const { trips } = Store.useStore();
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 40, gap: 14
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 14,
        background: 'var(--accent-soft)', color: 'var(--accent)',
        display: 'grid', placeItems: 'center', marginBottom: 6
      }}>
        <Icon name="map" size={28} />
      </div>
      <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 30, lineHeight: 1.1 }}>
        {trips.length ? 'Choisis un voyage' : 'Crée ton premier voyage'}
      </div>
      <p style={{ color: 'var(--muted)', maxWidth: 380, lineHeight: 1.6 }}>
        {trips.length
          ? 'Utilise le sélecteur en haut pour ouvrir un voyage existant, ou crée-en un nouveau.'
          : 'Donne-lui un nom, des dates, et commence à planifier.'}
      </p>
      <Btn variant="primary" icon="plus" onClick={() => setNewOpen(true)}>Nouveau voyage</Btn>
      {newOpen && <NewTripModal onClose={() => setNewOpen(false)} />}
    </div>
  );
}

function LoadingTrip() {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: 'var(--muted)'
    }}>
      Chargement du voyage…
    </div>
  );
}

// ─── Modale Auth ────────────────────────────────────────────
function AuthModal({ onClose }) {
  const [mode, setMode] = React.useState('login'); // 'login' | 'signup'
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pseudo, setPseudo] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function onSubmit() {
    setError(''); setBusy(true);
    try {
      if (mode === 'login') {
        await SB.signIn(email.trim(), password);
      } else {
        await SB.signUp(email.trim(), password, pseudo.trim() || null);
      }
      onClose();
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  return <ModalShell title={mode === 'login' ? 'Connexion' : 'Créer un compte'} onClose={onClose}>
    <div style={{ display: 'flex', gap: 6, background: 'var(--inset)', borderRadius: 999, padding: 4, marginBottom: 14 }}>
      <ModeTab on={mode === 'login'} onClick={() => setMode('login')}>Se connecter</ModeTab>
      <ModeTab on={mode === 'signup'} onClick={() => setMode('signup')}>Créer un compte</ModeTab>
    </div>
    {mode === 'signup' && (
      <Field label="Pseudo">
        <input value={pseudo} onChange={e => setPseudo(e.target.value)} placeholder="Ton prénom ou pseudo" autoComplete="nickname" />
      </Field>
    )}
    <Field label="Email">
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" autoComplete="email" />
    </Field>
    <Field label="Mot de passe">
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
    </Field>
    {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 4 }}>{error}</div>}
    <div style={{ marginTop: 16 }}>
      <Btn variant="primary" onClick={onSubmit} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
        {busy ? '...' : (mode === 'login' ? 'Se connecter' : 'Créer mon compte')}
      </Btn>
    </div>
  </ModalShell>;
}

// ─── Modale Nouveau voyage ──────────────────────────────────
function NewTripModal({ onClose }) {
  const [name, setName] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [days, setDays] = React.useState(7);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  async function onSubmit() {
    if (!name.trim()) return;
    setError(''); setBusy(true);
    try {
      const trip = await SB.createTrip({ name: name.trim(), startDate: startDate || null, days: Math.max(1, +days || 1) });
      // Rafraîchir la liste + activer le nouveau
      const trips = await SB.listMyTrips();
      Store.set({ trips, activeTripId: trip.id });
      const full = await SB.loadTrip(trip.id);
      Store.set({ trip: full });
      Store.showToast(`Voyage « ${trip.name} » créé ✓`);
      onClose();
    } catch (e) {
      setError(e.message || 'Erreur de création');
    } finally {
      setBusy(false);
    }
  }

  return <ModalShell title="Nouveau voyage" onClose={onClose}>
    <Field label="Nom du voyage">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Corée du Sud, Lisbonne…" autoFocus />
    </Field>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Field label="Date de départ">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </Field>
      <Field label="Nombre de jours">
        <input type="number" min="1" max="60" value={days} onChange={e => setDays(e.target.value)} />
      </Field>
    </div>
    {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 4 }}>{error}</div>}
    <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
      <Btn variant="ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Annuler</Btn>
      <Btn variant="primary" onClick={onSubmit} style={{ flex: 1, justifyContent: 'center' }}>
        {busy ? '...' : 'Créer le voyage'}
      </Btn>
    </div>
  </ModalShell>;
}

// ─── Atomes UI ──────────────────────────────────────────────
function ModeTab({ on, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, border: 'none', cursor: 'pointer',
      background: on ? 'var(--accent)' : 'transparent',
      color: on ? 'var(--bg)' : 'var(--muted)',
      borderRadius: 999, padding: '7px 12px',
      fontSize: 13, fontWeight: 700, fontFamily: 'inherit'
    }}>{children}</button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{label}</div>
      {React.cloneElement(children, {
        style: {
          width: '100%',
          background: 'var(--inset)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: '10px 12px',
          color: 'var(--text)',
          fontFamily: 'inherit',
          fontSize: 14,
          outline: 'none',
          ...(children.props.style || {})
        }
      })}
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  React.useEffect(() => {
    const onEsc = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);
  
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 5000,
      background: 'rgba(0,0,0,.6)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 420, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 18, boxShadow: 'var(--shadow-lg)', overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--line)'
        }}>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22 }}>{title}</div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', padding: 6, borderRadius: 8
          }}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ─── Helper : sélectionner un voyage ────────────────────────
async function selectTrip(tripId) {
  Store.set({ activeTripId: tripId, trip: null });
  try {
    const full = await SB.loadTrip(tripId);
    Store.set({ trip: full });
    SB.subscribeTrip(tripId, () => {
      // Sur changement realtime, recharger
      SB.loadTrip(tripId).then(t => Store.set({ trip: t })).catch(() => {});
    });
  } catch (e) {
    Store.showToast('Erreur chargement : ' + e.message);
    Store.set({ activeTripId: null });
  }
}

window.AppShell = AppShell;
window.selectTrip = selectTrip;
