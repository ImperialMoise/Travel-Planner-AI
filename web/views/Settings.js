// ════════════════════════════════════════════════════════════
// Settings.js — Modale paramètres (compte + mes voyages)
// Version Phase 1, sera enrichie plus tard (membres, journal…)
// ════════════════════════════════════════════════════════════

function SettingsModal() {
  const { user, trips, activeTripId } = Store.useStore();
  const [section, setSection] = React.useState('account');
  const close = () => Store.set({ settingsOpen: false });

  React.useEffect(() => {
    const onEsc = e => e.key === 'Escape' && close();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, []);

  return (
    <div onClick={close} style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,.6)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'grid', placeItems: 'center', padding: 16
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 820, height: 'min(86vh, 640px)',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 18, boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden', display: 'grid',
        gridTemplateColumns: '220px 1fr'
      }}>
        {/* Sidebar */}
        <aside style={{
          background: 'var(--bg-2)', borderRight: '1px solid var(--line)',
          padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: 4
        }}>
          <div style={{ padding: '0 8px 12px', borderBottom: '1px solid var(--line)', marginBottom: 6 }}>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22 }}>Paramètres</div>
          </div>
          <NavItem icon="user" on={section === 'account'} onClick={() => setSection('account')}>Compte</NavItem>
          <NavItem icon="map"  on={section === 'trips'}   onClick={() => setSection('trips')}>Mes voyages</NavItem>
          <NavItem icon="users" on={section === 'share'} onClick={() => setSection('share')}>Partage</NavItem>
        </aside>

        {/* Contenu */}
        <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <header style={{
            padding: '18px 24px 14px',
            borderBottom: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 24 }}>
              {section === 'account' ? 'Compte' : section === 'trips' ? 'Mes voyages' : 'Partage'}
            </div>
            <button onClick={close} style={{
              background: 'transparent', border: '1px solid var(--line)',
              color: 'var(--muted)', cursor: 'pointer',
              width: 32, height: 32, borderRadius: 9,
              display: 'grid', placeItems: 'center'
            }}><Icon name="x" size={16} /></button>
          </header>
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {section === 'account' && <AccountSection user={user} />}
            {section === 'trips' && <TripsSection trips={trips} activeTripId={activeTripId} onClose={close} />}
            {section === 'share' && <ShareSection activeTripId={activeTripId} />}
          </div>
        </section>
      </div>
    </div>
  );
}

function NavItem({ icon, on, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 9,
      padding: '9px 11px', border: 'none', cursor: 'pointer',
      background: on ? 'var(--accent-soft)' : 'transparent',
      color: on ? 'var(--accent)' : 'var(--muted)',
      borderRadius: 9, fontSize: 13.5, fontWeight: 600,
      fontFamily: 'inherit', textAlign: 'left'
    }}>
      <Icon name={icon} size={15} />{children}
    </button>
  );
}

function AccountSection({ user }) {
  const pseudo = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
  const [val, setVal] = React.useState(pseudo);
  const [busy, setBusy] = React.useState(false);

  async function savePseudo() {
    if (!val.trim()) return;
    setBusy(true);
    try {
      await SB.sb.auth.updateUser({ data: { display_name: val.trim() } });
      await SB.sb.from('profiles').update({ display_name: val.trim() }).eq('id', user.id);
      // Mettre à jour le user dans le store
      Store.set({ user: { ...user, user_metadata: { ...(user.user_metadata||{}), display_name: val.trim() } } });
      Store.showToast('Pseudo mis à jour ✓');
    } catch (e) {
      Store.showToast('Erreur : ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function doSignOut() {
    await SB.signOut();
    Store.set({ user: null, trips: [], activeTripId: null, trip: null, settingsOpen: false });
    Store.showToast('Déconnecté');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card title="Profil">
        <Row label="Pseudo">
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            <input value={val} onChange={e => setVal(e.target.value)} style={inputStyle} />
            <Btn variant="primary" onClick={savePseudo}>{busy ? '…' : 'Sauver'}</Btn>
          </div>
        </Row>
        <Row label="Email">
          <span style={{ color: 'var(--muted)' }}>{user.email}</span>
        </Row>
      </Card>
      <Card title="Session">
        <Row label="Déconnexion">
          <Btn variant="ghost" onClick={doSignOut} style={{ color: 'var(--danger)', borderColor: 'rgba(224,169,109,.3)' }}>
            Se déconnecter
          </Btn>
        </Row>
      </Card>
    </div>
  );
}

function ShareSection({ activeTripId }) {
  const [members, setMembers] = React.useState([]);
  const [invite, setInvite] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  async function loadMembers() {
    if (!activeTripId) {
      setMembers([]);
      return;
    }

    try {
      const list = await SB.listTripMembers(activeTripId);
      setMembers(list);
    } catch (error) {
      Store.showToast('Erreur membres : ' + error.message);
    }
  }

  React.useEffect(() => {
    loadMembers();
    setInvite(null);
  }, [activeTripId]);

  async function createInvite() {
    if (!activeTripId) return;

    setBusy(true);
    try {
      const created = await SB.createTripInvite(activeTripId, 'editor');
      setInvite(created);

      try {
        await navigator.clipboard.writeText(created.url);
        Store.showToast('Lien copié');
      } catch (error) {
        Store.showToast('Lien créé');
      }
    } catch (error) {
      Store.showToast('Erreur invitation : ' + error.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(member) {
    if (member.role === 'owner') {
      Store.showToast('Le propriétaire ne peut pas être retiré ici.');
      return;
    }

    if (!confirm(`Retirer ${member.name} du voyage ?`)) return;

    try {
      await SB.removeTripMember(member.id);
      await loadMembers();
      Store.showToast('Membre retiré');
    } catch (error) {
      Store.showToast('Erreur : ' + error.message);
    }
  }

  if (!activeTripId) {
    return (
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>
        Sélectionne un voyage pour gérer le partage.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card title="Inviter quelqu’un">
        <Row label="Lien">
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            <Btn variant="primary" onClick={createInvite} disabled={busy}>
              {busy ? 'Création...' : 'Créer un lien'}
            </Btn>
          </div>
        </Row>

        {invite && (
          <Row label="Invitation">
            <div style={{
              flex: 1,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              minWidth: 0
            }}>
              <input readOnly value={invite.url} style={{ ...inputStyle, flex: 1 }} />
              <Btn
                variant="ghost"
                onClick={() => {
                  navigator.clipboard?.writeText(invite.url);
                  Store.showToast('Lien copié');
                }}
              >
                Copier
              </Btn>
            </div>
          </Row>
        )}
      </Card>

      <Card title="Membres du voyage">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          {members.length ? members.map(member => (
            <div key={member.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 12,
              background: 'var(--bg-2)',
              border: '1px solid var(--line)'
            }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                fontWeight: 800
              }}>
                {(member.name || member.email || 'M').slice(0, 1).toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: 13 }}>
                  {member.name}
                </strong>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                  {member.email || 'Email masqué'} · {member.role}
                </span>
              </div>

              {member.role !== 'owner' && (
                <Btn
                  variant="ghost"
                  onClick={() => removeMember(member)}
                  style={{ color: 'var(--danger)' }}
                >
                  Retirer
                </Btn>
              )}
            </div>
          )) : (
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
              Aucun membre pour le moment.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function TripsSection({ trips, activeTripId, onClose }) {
  async function del(t) {
    if (!confirm(`Supprimer « ${t.name} » définitivement ?`)) return;
    try {
      await SB.deleteTrip(t.id);
      const remaining = await SB.listMyTrips();
      const wasActive = t.id === activeTripId;
      Store.set({
        trips: remaining,
        activeTripId: wasActive ? null : activeTripId,
        trip: wasActive ? null : Store.get().trip
      });
      Store.showToast('Voyage supprimé');
    } catch (e) {
      Store.showToast('Erreur : ' + e.message);
    }
  }

  if (!trips.length) {
    return (
      <div style={{
        textAlign: 'center', color: 'var(--muted)', padding: '40px 20px'
      }}>
        <div style={{ fontSize: 32, marginBottom: 8, opacity: .5 }}>✈️</div>
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--text)' }}>Aucun voyage</div>
        <div style={{ marginTop: 6, fontSize: 13 }}>Crée ton premier voyage depuis le sélecteur en haut.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {trips.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px',
          background: t.id === activeTripId ? 'var(--accent-soft)' : 'var(--bg-2)',
          border: '1px solid ' + (t.id === activeTripId ? 'rgba(217,182,126,.3)' : 'var(--line)'),
          borderRadius: 12
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'rgba(217,182,126,.12)', color: 'var(--accent)',
            display: 'grid', placeItems: 'center'
          }}><Icon name="map" size={16} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              {t.name}
              {t.id === activeTripId && (
                <span style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '.05em',
                  background: 'var(--accent)', color: 'var(--bg)',
                  padding: '2px 6px', borderRadius: 5
                }}>ACTIF</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>
              {t.start_date ? `Départ ${fmtDate(t.start_date)}` : 'Sans date'}
              {' · '}Modifié {fmtDate(t.updated_at)}
            </div>
          </div>
          <Btn variant="ghost" onClick={() => del(t)} style={{ color: 'var(--danger)', borderColor: 'rgba(224,169,109,.3)' }}>
            Supprimer
          </Btn>
        </div>
      ))}
    </div>
  );
}

// ─── Atomes ─────────────────────────────────────────────────
function Card({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--line)',
      borderRadius: 14, padding: '14px 16px'
    }}>
      {title && <div style={{
        fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em',
        textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10
      }}>{title}</div>}
      {children}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 0',
      borderBottom: '1px solid var(--line-2)'
    }}>
      <div style={{ fontSize: 13, color: 'var(--muted)', minWidth: 100, fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', minWidth: 0 }}>{children}</div>
    </div>
  );
}

const inputStyle = {
  flex: 1, background: 'var(--inset)', border: '1px solid var(--line)',
  borderRadius: 9, padding: '8px 11px', color: 'var(--text)',
  fontFamily: 'inherit', fontSize: 13.5, outline: 'none'
};

window.SettingsModal = SettingsModal;
