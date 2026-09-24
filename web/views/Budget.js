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

  const isFor = n => form.forAll || form.forNames.has(n);
  function toggleAll() { setForm({ ...form, forAll: true, forNames: new Set(names) }); }
  function toggleName(n) {
    const base = form.forAll ? new Set(names) : new Set(form.forNames);
    base.has(n) ? base.delete(n) : base.add(n);
    setForm({ ...form, forAll: base.size === names.length, forNames: base });
  }

  const travelers = (
    <section className="fv-panel fv-budget-travelers">
      <header className="fv-panel-head"><h2>Voyageurs</h2><span>{names.length}</span></header>
      <p className="fv-muted">Les personnes qui partagent les dépenses.</p>
      <ul className="fv-people">
        {participants.map(p => <li key={p.id}>
          <span className="fv-person-dot" style={{ background: colorOf(p.name) }} aria-hidden="true" />
          <strong>{p.name}</strong>
          <button type="button" className="fv-control" aria-label={'Retirer ' + p.name} onClick={() => delPerson(p)}><Icon name="x" size={16} /></button>
        </li>)}
      </ul>
      <form className="fv-person-add" onSubmit={event => { event.preventDefault(); addPerson(); }}>
        <label>Nouveau voyageur<input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Prénom" /></label>
        <button type="submit" className="fv-control" disabled={!newName.trim()}>Ajouter</button>
      </form>
    </section>
  );

  const overview = () => {
    const cats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    return <>
      <h2>Qui a payé ?</h2>
      <div className="fv-balance-list">
        {names.map(n => {
          const diff = soldes[n] || 0;
          return <div key={n}>
            <span><span className="fv-person-dot" style={{ background: colorOf(n) }} />{n}</span>
            <strong>{eur(paidByP[n])}<small>{Math.abs(diff) < 0.005 ? 'À jour' : (diff > 0 ? 'Récupère ' : 'Doit ') + eur(Math.abs(diff))}</small></strong>
          </div>;
        })}
      </div>
      <h2 className="fv-section-space">Répartition par catégorie</h2>
      {cats.length ? <div className="fv-bars">{cats.map(([c, amt]) => {
        const m = catMeta(c), pct = total > 0 ? Math.round(amt / total * 100) : 0;
        return <div key={c}>
          <div className="fv-bar-label"><span><Icon name={m.icon} size={16} />{c}</span><strong>{eur(amt)} · {pct}%</strong></div>
          <div className="fv-bar-track" aria-hidden="true"><span style={{ width: Math.max(0, Math.min(100, pct)) + '%' }} /></div>
        </div>;
      })}</div> : <p className="fv-empty-note">Aucune dépense pour l'instant.</p>}
    </>;
  };

  const expenses = () => budget.length ? (
    <div className="fv-expenses">
      {budget.map(b => {
        const m = catMeta(b.cat);
        const tl = (b.forParticipants || ['__all__']).includes('__all__') ? 'tout le monde' : targetsOf(b).join(', ');
        return <article className="fv-expense" key={b.id}>
          <span className="fv-symbol"><Icon name={m.icon} size={20} /></span>
          <div className="fv-expense-info">
            <button type="button" className="fv-link-title" aria-label={'Modifier la dépense ' + (b.desc || m.id)} onClick={() => openEdit(b)}>{b.desc || m.id}</button>
            <p>{b.paidBy || '?'} a payé · pour {tl}</p>
            <small>{b.cat}</small>
          </div>
          <strong className="fv-money">{eur(b.amount)}</strong>
          <button type="button" className="fv-control" aria-label={'Supprimer la dépense ' + (b.desc || m.id)} onClick={() => delExpense(b)}><Icon name="x" size={16} /></button>
        </article>;
      })}
    </div>
  ) : <div className="fv-empty-note"><h2>Aucune dépense pour l'instant.</h2><p>Ajoute la première dépense pour suivre les comptes du voyage.</p></div>;

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
      <h2>Soldes des voyageurs</h2>
      <div className="fv-balance-list">
        {names.map(n => {
          const diff = soldes[n] || 0;
          return <div key={n}><span>{n}<small>{eur(paidByP[n])} payés</small></span>
            <strong>{Math.abs(diff) < 0.005 ? 'Équilibré' : (diff > 0 ? 'Récupère ' : 'Doit ') + eur(Math.abs(diff))}</strong></div>;
        })}
      </div>
      <h2 className="fv-section-space">Remboursements à faire</h2>
      <p className="fv-muted">Calculés à partir des dépenses et de leur répartition.</p>
      {transfers.length ? <ul className="fv-transfers">
        {transfers.map((t, k) => <li key={k}><span><strong>{t.from}</strong> → {t.to}</span><strong>{eur(t.amount)}</strong></li>)}
      </ul> : <p className="fv-empty-note">Tout est équilibré !</p>}
    </>;
  };

  const expenseForm = form && (
    <section className="fv-expense-form" aria-label={form.id ? 'Modifier une dépense' : 'Nouvelle dépense'}>
      <h2>{form.id ? 'Modifier la dépense' : 'Nouvelle dépense'}</h2>
      <div className="fv-choice-row" role="group" aria-label="Catégorie de dépense">
        {BUDGET_CATS.map(c => <button type="button" className="fv-control" key={c.id} aria-pressed={form.cat === c.id}
          onClick={() => setForm({ ...form, cat: c.id })}><Icon name={c.icon} size={16} />{c.id}</button>)}
      </div>
      <div className="fv-form-columns">
        <label>Description<input value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Ex. Train pour Paris" autoFocus /></label>
        <label>Montant (€)<input type="number" step="0.01" min="0" inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0,00" /></label>
      </div>
      <fieldset><legend>Qui a payé ?</legend><div className="fv-choice-row">
        {names.map(n => <button type="button" className="fv-control" key={n} aria-pressed={form.paidBy === n} onClick={() => setForm({ ...form, paidBy: n })}>{n}</button>)}
      </div></fieldset>
      <fieldset><legend>Pour qui ?</legend><div className="fv-choice-row">
        <button type="button" className="fv-control" aria-pressed={form.forAll} onClick={toggleAll}>Tout le monde</button>
        {names.map(n => <button type="button" className="fv-control" key={n} aria-pressed={isFor(n)} onClick={() => toggleName(n)}>{n}</button>)}
      </div></fieldset>
      <div className="fv-form-actions">
        <button type="button" className="fv-control" onClick={() => setForm(null)} disabled={busy}>Annuler</button>
        <button type="button" className="fv-control fv-control-primary" onClick={saveExpense} disabled={busy}>{busy ? 'Enregistrement…' : (form.id ? 'Enregistrer' : 'Ajouter')}</button>
      </div>
    </section>
  );

  return (
    <div className="web-budget-page fv-workpage">
      <div className="fv-workcontent">
        <header className="fv-workhead"><div><span className="fv-eyebrow">Les comptes du voyage</span><h1>Budget</h1>
          <p>Dépenses partagées, voyageurs et remboursements.</p></div>
          {!!names.length && <button type="button" className="fv-control fv-control-primary" onClick={() => { setTab('expenses'); openAdd(); }}><Icon name="plus" size={18} />Ajouter une dépense</button>}
        </header>
        {!names.length ? <div className="fv-budget-start"><div><span className="fv-symbol"><Icon name="users" size={24} /></span><h2>Qui voyage ?</h2><p>Ajoute les voyageurs pour pouvoir partager les dépenses et calculer qui doit quoi à qui.</p></div>{travelers}</div> : <>
          <dl className="fv-metrics">
            <div><dt>Total enregistré</dt><dd>{eur(total)}</dd><small>{budget.length} dépense{budget.length > 1 ? 's' : ''}</small></div>
            <div><dt>Moyenne par personne</dt><dd>{eur(perHead)}</dd><small>Les soldes réels sont dans Équilibre</small></div>
            <div><dt>Voyageurs</dt><dd>{names.length}</dd><small>Dans ce budget partagé</small></div>
          </dl>
          <div className="fv-budget-layout">
            <section className="fv-panel fv-budget-main">
              <div className="fv-subnav" role="group" aria-label="Vues du budget">
                {[['overview','Aperçu'],['expenses','Dépenses'],['balance','Équilibre']].map(([id,label]) =>
                  <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}
              </div>
              {expenseForm}
              {tab === 'overview' && overview()}
              {tab === 'expenses' && expenses()}
              {tab === 'balance' && balance()}
            </section>
            {travelers}
          </div>
        </>}
      </div>
    </div>
  );
}
window.BudgetView = BudgetView;
