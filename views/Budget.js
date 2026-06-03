// ════════════════════════════════════════════════════════════
// Budget.js — Comptes partagés (style Tricount), design Atelier
// ════════════════════════════════════════════════════════════

const BUDGET_CATS = [
  { id: 'Transport', icon: 'route',  color: '#6d8aa8' },
  { id: 'Logement',  icon: 'bed',    color: '#8f7da8' },
  { id: 'Activité',  icon: 'camera', color: '#c07d56' },
  { id: 'Repas',     icon: 'fork',   color: '#7b9e89' },
  { id: 'Divers',    icon: 'pin',    color: '#b4843e' }
];
const PERSON_COLORS = ['#b4843e', '#7b9e89', '#6d8aa8', '#c07d56', '#8f7da8', '#a8895f'];
const eur = n => (parseFloat(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

function BudgetView() {
  const { trip } = Store.useStore();
  if (!trip) return null;

  const participants = trip.participants || [];
  const names = participants.map(p => p.name);
  const budget = trip.budget || [];

  const [tab, setTab] = React.useState('overview');
  const [newName, setNewName] = React.useState('');
  const [form, setForm] = React.useState(null);   // null = fermé
  const [busy, setBusy] = React.useState(false);

  const reload = () => window.SB.loadTrip(trip.id).then(t => Store.set({ trip: t })).catch(() => {});

  // ── Calculs ─────────────────────────────────────────────
  const total = budget.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const perHead = names.length ? total / names.length : 0;
  const paidByP = {}; names.forEach(n => paidByP[n] = 0);
  const soldes = {};  names.forEach(n => soldes[n] = 0);
  const catTotals = {};
  const targetsOf = b => {
    const f = b.forParticipants || ['__all__'];
    return f.includes('__all__') ? names : f.filter(n => names.includes(n));
  };
  budget.forEach(b => {
    const amt = parseFloat(b.amount) || 0;
    catTotals[b.cat] = (catTotals[b.cat] || 0) + amt;
    if (paidByP[b.paidBy] !== undefined) { paidByP[b.paidBy] += amt; soldes[b.paidBy] += amt; }
    const tg = targetsOf(b);
    if (tg.length) { const share = amt / tg.length; tg.forEach(n => { if (soldes[n] !== undefined) soldes[n] -= share; }); }
  });
  const colorOf = name => PERSON_COLORS[Math.max(0, names.indexOf(name)) % PERSON_COLORS.length];
  const catMeta = c => BUDGET_CATS.find(x => x.id === c) || BUDGET_CATS[4];

  // ── Actions ─────────────────────────────────────────────
  async function addPerson() {
    const n = newName.trim(); if (!n) return;
    setNewName('');
    try { await window.SB.addParticipant(trip.id, n, names.length); await reload(); }
    catch (e) { alert('Erreur : ' + e.message); }
  }
  async function delPerson(p) {
    if (!window.confirm(`Retirer ${p.name} des voyageurs ?`)) return;
    try { await window.SB.removeParticipant(p.id); await reload(); }
    catch (e) { alert('Erreur : ' + e.message); }
  }
  function openAdd() { setForm({ cat: 'Repas', desc: '', amount: '', paidBy: names[0] || '', forAll: true, forNames: new Set(names) }); }
  function openEdit(b) {
    const all = (b.forParticipants || ['__all__']).includes('__all__');
    setForm({ id: b.id, cat: b.cat, desc: b.desc, amount: String(b.amount ?? ''), paidBy: b.paidBy || names[0] || '', forAll: all, forNames: new Set(all ? names : (b.forParticipants || [])) });
  }
  async function saveExpense() {
    if (!form) return;
    setBusy(true);
    try {
      await window.SB.saveBudgetItem(trip.id, {
        id: form.id, cat: form.cat, desc: form.desc,
        amount: parseFloat(form.amount) || 0, paidBy: form.paidBy,
        forParticipants: form.forAll ? ['__all__'] : Array.from(form.forNames)
      });
      setForm(null); await reload();
    } catch (e) { alert('Erreur : ' + e.message); } finally { setBusy(false); }
  }
  async function delExpense(b) {
    if (!window.confirm('Supprimer cette dépense ?')) return;
    try { await window.SB.deleteBudgetItem(b.id); await reload(); }
    catch (e) { alert('Erreur : ' + e.message); }
  }

  // ── Styles ──────────────────────────────────────────────
  const card = { background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow)' };
  const kicker = { fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--accent)' };
  const serif = 'var(--font-serif)';
  const inp = { width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 11, background: 'var(--inset)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, outline: 'none' };
  const chip = (active, col) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (active ? (col || 'var(--accent)') : 'var(--line)'), background: active ? (col || 'var(--accent)') : 'var(--inset)', color: active ? '#fff' : 'var(--muted)' });
  const tabBtn = on => ({ flex: 1, border: 'none', cursor: 'pointer', padding: '9px 0', borderRadius: 999, fontSize: 13, fontWeight: 700, background: on ? 'var(--accent)' : 'transparent', color: on ? 'var(--accent-ink)' : 'var(--muted)', transition: 'all .2s' });

  const dot = col => <span style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />;

  // ── État vide : pas encore de voyageurs ─────────────────
  if (names.length === 0) {
    return (
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'grid', placeItems: 'center', padding: 30 }}>
        <div style={{ ...card, maxWidth: 420, width: '100%', padding: 28, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
            <Icon name="users" size={26} />
          </div>
          <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 24, color: 'var(--text)' }}>Qui voyage ?</div>
          <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.55, margin: '8px 0 16px' }}>
            Ajoute les voyageurs pour pouvoir partager les dépenses et calculer qui doit quoi à qui.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={inp} value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPerson()} placeholder="Prénom…" autoFocus />
            <button onClick={addPerson} style={{ border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 11, padding: '0 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Ajouter</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Onglet : Aperçu ─────────────────────────────────────
  const overview = () => {
    const cats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    return <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
        {names.map(n => {
          const diff = soldes[n] || 0;
          return (
            <div key={n} style={{ ...card, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{dot(colorOf(n))}{n}</div>
              <div style={{ fontFamily: serif, fontSize: 26, color: 'var(--text)', marginTop: 6 }}>{eur(paidByP[n])}</div>
              <div style={{ fontSize: 12, marginTop: 3, color: Math.abs(diff) < 0.005 ? 'var(--faint)' : (diff > 0 ? '#5c8a6f' : '#c0563f') }}>
                {Math.abs(diff) < 0.005 ? 'à jour' : (diff > 0 ? 'récupère ' : 'doit ') + eur(Math.abs(diff))}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ ...kicker, color: 'var(--faint)', marginBottom: 10 }}>Répartition par catégorie</div>
      {cats.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cats.map(([c, amt]) => {
            const m = catMeta(c); const pct = total > 0 ? Math.round(amt / total * 100) : 0;
            return (
              <div key={c}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600, color: 'var(--text)' }}><Icon name={m.icon} size={14} style={{ color: m.color }} />{c}</span>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{eur(amt)} · {pct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--inset)', overflow: 'hidden' }}>
                  <div style={{ width: pct + '%', height: '100%', background: m.color, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : <div style={{ color: 'var(--faint)', fontSize: 13, fontStyle: 'italic' }}>Aucune dépense à analyser.</div>}
    </>;
  };

  // ── Onglet : Dépenses ───────────────────────────────────
  const isFor = n => form.forAll || form.forNames.has(n);
  function toggleAll() { setForm({ ...form, forAll: true, forNames: new Set(names) }); }
  function toggleName(n) {
    const base = form.forAll ? new Set(names) : new Set(form.forNames);
    base.has(n) ? base.delete(n) : base.add(n);
    setForm({ ...form, forAll: base.size === names.length, forNames: base });
  }

  const expenses = () => <>
    {form ? (
      <div style={{ ...card, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {BUDGET_CATS.map(c => {
            const on = form.cat === c.id;
            return <button key={c.id} onClick={() => setForm({ ...form, cat: c.id })} style={chip(on, c.color)}><Icon name={c.icon} size={13} />{c.id}</button>;
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input style={{ ...inp, flex: 2 }} value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Description…" autoFocus />
          <input style={{ ...inp, flex: 1 }} type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00 €" />
        </div>
        <div style={{ ...kicker, color: 'var(--faint)', marginBottom: 7 }}>Qui a payé ?</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {names.map(n => <button key={n} onClick={() => setForm({ ...form, paidBy: n })} style={chip(form.paidBy === n, colorOf(n))}>{n}</button>)}
        </div>
        <div style={{ ...kicker, color: 'var(--faint)', marginBottom: 7 }}>Pour qui ?</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          <button onClick={toggleAll} style={chip(form.forAll, '#9aa89f')}>Tout le monde</button>
          {names.map(n => <button key={n} onClick={() => toggleName(n)} style={chip(isFor(n), colorOf(n))}>{n}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setForm(null)} disabled={busy} style={{ border: '1px solid var(--line)', background: 'var(--inset)', color: 'var(--text)', borderRadius: 11, padding: '9px 16px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
          <button onClick={saveExpense} disabled={busy} style={{ border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 11, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{busy ? '…' : (form.id ? 'Enregistrer' : 'Ajouter')}</button>
        </div>
      </div>
    ) : (
      <button onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px dashed var(--line)', background: 'transparent', color: 'var(--muted)', borderRadius: 12, padding: '10px 14px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>
        <Icon name="plus" size={15} />Ajouter une dépense
      </button>
    )}

    {budget.length ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {budget.map(b => {
          const m = catMeta(b.cat);
          const tl = (b.forParticipants || ['__all__']).includes('__all__') ? 'tout le monde' : targetsOf(b).join(', ');
          return (
            <div key={b.id} onClick={() => openEdit(b)} style={{ ...card, display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: m.color + '22', color: m.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={m.icon} size={18} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{b.desc || m.id}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  <span style={{ color: colorOf(b.paidBy), fontWeight: 700 }}>{b.paidBy || '?'}</span> a payé · pour {tl}
                </div>
              </div>
              <div style={{ fontFamily: serif, fontSize: 18, color: 'var(--text)' }}>{eur(b.amount)}</div>
              <button onClick={e => { e.stopPropagation(); delExpense(b); }} title="Supprimer" style={{ border: 'none', background: 'transparent', color: 'var(--faint)', cursor: 'pointer', padding: 4, borderRadius: 7 }}><Icon name="x" size={16} /></button>
            </div>
          );
        })}
      </div>
    ) : <div style={{ color: 'var(--faint)', fontSize: 13, fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Aucune dépense pour l'instant.</div>}
  </>;

  // ── Onglet : Équilibre ──────────────────────────────────
  const balance = () => {
    const debt = Object.entries(soldes).filter(([, v]) => v < -0.005).map(([p, v]) => ({ p, v })).sort((a, b) => a.v - b.v);
    const cred = Object.entries(soldes).filter(([, v]) => v > 0.005).map(([p, v]) => ({ p, v })).sort((a, b) => b.v - a.v);
    const transfers = [];
    const d = debt.map(x => ({ ...x })), r = cred.map(x => ({ ...x }));
    let i = 0, j = 0;
    while (i < d.length && j < r.length) {
      const amt = Math.min(-d[i].v, r[j].v);
      if (amt > 0.005) transfers.push({ from: d[i].p, to: r[j].p, amount: amt });
      d[i].v += amt; r[j].v -= amt;
      if (Math.abs(d[i].v) < 0.005) i++;
      if (Math.abs(r[j].v) < 0.005) j++;
    }
    return <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
        {names.map(n => {
          const diff = soldes[n] || 0; const pos = diff >= 0;
          return (
            <div key={n} style={{ ...card, padding: '14px 16px', borderLeft: '3px solid ' + colorOf(n) }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{n}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{eur(paidByP[n])} payés</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6, color: Math.abs(diff) < 0.005 ? 'var(--faint)' : (pos ? '#5c8a6f' : '#c0563f') }}>
                {Math.abs(diff) < 0.005 ? 'équilibré' : (pos ? 'récupère ' : 'doit ') + eur(Math.abs(diff))}
              </div>
            </div>
          );
        })}
      </div>
      {transfers.length === 0 ? (
        <div style={{ ...card, padding: 20, textAlign: 'center', color: '#5c8a6f', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon name="check" size={18} />Tout est équilibré !</div>
      ) : <>
        <div style={{ ...kicker, color: 'var(--faint)', marginBottom: 10 }}>Remboursements à faire</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {transfers.map((t, k) => (
            <div key={k} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <span style={{ fontWeight: 700, color: colorOf(t.from) }}>{t.from}</span>
              <Icon name="arrowsm" size={16} style={{ color: 'var(--faint)' }} />
              <span style={{ fontWeight: 700, color: colorOf(t.to) }}>{t.to}</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontFamily: serif, fontSize: 18 }}>{eur(t.amount)}</span>
            </div>
          ))}
        </div>
      </>}
    </>;
  };

  // ── Rendu ───────────────────────────────────────────────
  return (
    <div style={{ flex: 1, minHeight: 'calc(100vh - 60px)', overflowY: 'auto' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 22px 40px' }}>

        <div style={kicker}>Budget</div>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 26, color: 'var(--text)', marginTop: 3, marginBottom: 16 }}>{trip.name}</div>

        {/* Total */}
        <div style={{ ...card, padding: '20px 22px', marginBottom: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Total du voyage</div>
            <div style={{ fontFamily: serif, fontSize: 40, lineHeight: 1, color: 'var(--text)' }}>{eur(total).replace(' €', '')}<span style={{ fontSize: 22, color: 'var(--accent)' }}> €</span></div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>{budget.length} dépense{budget.length > 1 ? 's' : ''} · {eur(perHead)} / personne</div>
          </div>
        </div>

        {/* Voyageurs */}
        <div style={{ ...card, padding: 14, marginBottom: 18 }}>
          <div style={{ ...kicker, color: 'var(--faint)', marginBottom: 9 }}>Voyageurs</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {participants.map(p => (
              <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 8px 6px 12px', borderRadius: 999, background: 'var(--inset)', border: '1px solid var(--line)', fontSize: 13, fontWeight: 600 }}>
                {dot(colorOf(p.name))}{p.name}
                <button onClick={() => delPerson(p)} title="Retirer" style={{ border: 'none', background: 'transparent', color: 'var(--faint)', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 2 }}><Icon name="x" size={13} /></button>
              </span>
            ))}
            <input style={{ ...inp, width: 130 }} value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPerson()} placeholder="+ voyageur" />
          </div>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--inset)', border: '1px solid var(--line)', borderRadius: 999, padding: 3, marginBottom: 18 }}>
          <button style={tabBtn(tab === 'overview')} onClick={() => setTab('overview')}>Aperçu</button>
          <button style={tabBtn(tab === 'expenses')} onClick={() => setTab('expenses')}>Dépenses</button>
          <button style={tabBtn(tab === 'balance')} onClick={() => setTab('balance')}>Équilibre</button>
        </div>

        {tab === 'overview' && overview()}
        {tab === 'expenses' && expenses()}
        {tab === 'balance' && balance()}
      </div>
    </div>
  );
}
window.BudgetView = BudgetView;