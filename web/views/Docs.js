// ════════════════════════════════════════════════════════════
// Docs.js — Documents de voyage, design Atelier v2
// Deux onglets : Résumé (timeline) et Détail (explorateur)
// ════════════════════════════════════════════════════════════

// ── Constantes ────────────────────────────────────────────
const DOC_CATEGORIES = [
  { id: 'flights',   label: "Billets d'avion", icon: 'flight',  tone: '#7c5410' },
  { id: 'hotels',    label: 'Hébergements',    icon: 'bed',     tone: '#b4843e' },
  { id: 'identity',  label: 'Identité',        icon: 'badge',   tone: '#597b72' },
  { id: 'insurance', label: 'Assurances',       icon: 'shield',  tone: '#40625a' },
  { id: 'other',     label: 'Autres',           icon: 'file',    tone: '#827567' }
];

// Sections de la timeline (onglet Résumé)
// Chaque section regroupe certaines catégories de documents
const TIMELINE_SECTIONS = [
  { id: 'predeparture', label: 'Pré-départ',  subtitle: 'Préparation essentielle', categories: ['identity', 'insurance'], dotColor: 'var(--accent)' },
  { id: 'transit',      label: 'Transit',      subtitle: 'Vols & transferts',       categories: ['flights'],              dotColor: '#c07d56' },
  { id: 'stay',         label: 'Séjour',       subtitle: 'Hébergements',            categories: ['hotels'],               dotColor: '#8f7da8' },
  { id: 'other',        label: 'Divers',       subtitle: 'Autres documents',        categories: ['other'],                dotColor: '#827567' }
];

function formatDocSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' Ko';
  return (bytes / 1024 / 1024).toFixed(1) + ' Mo';
}

function catMeta(catId) {
  return DOC_CATEGORIES.find(c => c.id === catId) || DOC_CATEGORIES[4];
}


// ══════════════════════════════════════════════════════════
// Composant principal
// ══════════════════════════════════════════════════════════
function DocsView() {
  const { trip } = Store.useStore();
  const inputRef = React.useRef(null);

  // ── State ──
  const [documents, setDocuments] = React.useState([]);
  const [tab, setTab] = React.useState('detail');
  const [uploadCat, setUploadCat] = React.useState('other');
  const [busy, setBusy]     = React.useState(false);

  // State spécifique à l'onglet Détail
  const [filter, setFilter]       = React.useState('__all__');
  const [searchQ, setSearchQ]     = React.useState('');
  const [selectedId, setSelectedId] = React.useState(null);
  const [selectedUrl, setSelectedUrl] = React.useState('');

  // ── Chargement des documents ──
  async function loadDocuments() {
    if (!trip?.id || !window.SB?.listDocuments) { setDocuments([]); return; }
    try {
      const docs = await window.SB.listDocuments(trip.id);
      setDocuments(docs);
    } catch (e) { console.error('Docs load error:', e); }
  }

  React.useEffect(() => { loadDocuments(); }, [trip?.id]);

  // ── Charger l'URL du document sélectionné (onglet Détail) ──
  const selected = documents.find(d => d.id === selectedId) || null;

  React.useEffect(() => {
    let cancelled = false;
    if (!selected?.filePath || !window.SB?.getDocumentUrl) { setSelectedUrl(''); return; }
    window.SB.getDocumentUrl(selected.filePath)
      .then(url => { if (!cancelled) setSelectedUrl(url); })
      .catch(() => { if (!cancelled) setSelectedUrl(''); });
    return () => { cancelled = true; };
  }, [selected?.id, selected?.filePath]);

  // ── Upload ──
  async function addFiles(files) {
    const list = [...(files || [])];
    if (!list.length || !trip?.id) return;
    setBusy(true);
    try {
      for (const f of list) await window.SB.uploadDocument(trip.id, f, uploadCat);
      if (inputRef.current) inputRef.current.value = '';
      await loadDocuments();
    } catch (e) { alert('Erreur upload : ' + (e.message || e)); }
    finally { setBusy(false); }
  }

  // ── Suppression ──
  async function deleteDoc(id) {
    if (!confirm('Supprimer ce document ?')) return;
    setBusy(true);
    try {
      await window.SB.deleteDocument(id);
      if (selectedId === id) { setSelectedId(null); setSelectedUrl(''); }
      await loadDocuments();
    } catch (e) { alert('Erreur : ' + (e.message || e)); }
    finally { setBusy(false); }
  }

  // ── Données calculées ──
  const total = documents.length;
  const selectedType = selected?.mime?.includes('pdf') ? 'pdf'
                     : selected?.mime?.includes('image') ? 'image' : 'file';

  // Filtrage pour l'onglet Détail
  let filteredDocs = filter === '__all__' ? documents : documents.filter(d => d.category === filter);
  if (searchQ.trim()) {
    const q = searchQ.toLowerCase();
    filteredDocs = filteredDocs.filter(d => (d.name || '').toLowerCase().includes(q));
  }

  function documentRow(doc) {
    const meta = catMeta(doc.category);
    return <button type="button" key={doc.id} className="fv-document-row" aria-pressed={doc.id === selectedId}
      onClick={() => { setTab('detail'); setSelectedId(doc.id); }} title={doc.name}>
      <span className="fv-symbol"><Icon name={doc.mime?.includes('image') ? 'camera' : meta.icon} size={20} /></span>
      <span className="fv-document-name"><strong>{doc.name}</strong><small>{meta.label} · {formatDocSize(doc.size) || 'Fichier'}</small></span>
      <span className="fv-filetype">{(doc.mime || '').split('/').pop().toUpperCase() || 'FICHIER'}</span>
    </button>;
  }

  const renderResume = () => {
    const sections = TIMELINE_SECTIONS.map(sec => ({
      ...sec, docs: documents.filter(d => sec.categories.includes(d.category))
    })).filter(sec => sec.docs.length > 0);
    return sections.length ? <div className="fv-document-groups">
      {sections.map(sec => <section className="fv-panel" key={sec.id}>
        <header className="fv-panel-head"><div><h2>{sec.label}</h2><p>{sec.subtitle}</p></div><span>{sec.docs.length}</span></header>
        <div className="fv-document-list">{sec.docs.map(documentRow)}</div>
      </section>)}
    </div> : <div className="fv-panel fv-empty-note"><Icon name="folder" size={32} /><h2>Aucun document</h2><p>Ajoute tes billets, réservations et fichiers avec le bouton Ajouter.</p></div>;
  };

  const renderDetail = () => (
    <div className={'fv-document-explorer' + (selected ? ' has-selection' : '')}>
      <section className="fv-document-library" aria-label="Liste des documents">
        <div className="fv-document-search">
          <label>Rechercher un document<input type="search" value={searchQ}
            onChange={e => setSearchQ(e.target.value)} placeholder="Nom du billet, de la réservation…" /></label>
          <label>Catégorie<select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="__all__">Toutes les catégories</option>
            {DOC_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
          </select></label>
          <span className="fv-muted" role="status">{filteredDocs.length} document{filteredDocs.length > 1 ? 's' : ''}</span>
        </div>
        <div className="fv-document-list">
          {filteredDocs.length ? filteredDocs.map(documentRow) : <div className="fv-empty-note" role="status">
            <h2>{total === 0 ? 'Tes documents, au même endroit' : 'Aucun document correspondant'}</h2>
            <p>{total === 0 ? 'Utilise Ajouter pour conserver un billet, une réservation ou une image.' : 'Essaie un autre nom ou affiche toutes les catégories.'}</p>
            {total > 0 && <button type="button" className="fv-control" onClick={() => { setSearchQ(''); setFilter('__all__'); }}>Réinitialiser les filtres</button>}
          </div>}
        </div>
      </section>
      <section className="fv-document-preview" aria-label="Aperçu du document">
        {selected ? <>
          <header className="fv-preview-header">
            <div><small>{catMeta(selected.category).label}</small><h2>{selected.name}</h2>
              <p>{formatDocSize(selected.size)}{selected.createdAt && !Number.isNaN(new Date(selected.createdAt).getTime())
                ? ' · Ajouté le ' + new Date(selected.createdAt).toLocaleDateString('fr-FR') : ''}</p></div>
            <button type="button" className="fv-control" onClick={() => setSelectedId(null)}>Retour à la liste</button>
          </header>
          <div className="fv-preview-actions">
            {selectedUrl && <>
              <a className="fv-control" href={selectedUrl} target="_blank" rel="noopener noreferrer"><Icon name="share" size={16} />Ouvrir</a>
              <a className="fv-control fv-control-primary" href={selectedUrl} download={selected.name}><Icon name="download" size={16} />Télécharger</a>
            </>}
            <button type="button" className="fv-control fv-control-danger" onClick={() => deleteDoc(selected.id)} disabled={busy}><Icon name="x" size={16} />Supprimer</button>
          </div>
          <div className="fv-preview-stage">
            {!selectedUrl ? <p className="fv-muted" role="status">Chargement de l’aperçu…</p>
              : selectedType === 'image' ? <img src={selectedUrl} alt={selected.name} />
              : selectedType === 'pdf' ? <iframe src={selectedUrl} title={selected.name} />
              : <div className="fv-empty-note"><Icon name="file" size={32} /><h2>Aperçu indisponible</h2><p>Utilise Ouvrir ou Télécharger pour consulter ce fichier.</p></div>}
          </div>
        </> : <div className="fv-empty-note"><Icon name="eye" size={32} /><h2>Un document à consulter ?</h2><p>Sélectionne un fichier dans la liste. Son aperçu et ses actions apparaîtront ici.</p></div>}
      </section>
    </div>
  );

  return (
    <div className="web-docs-page fv-workpage">
      <div className="fv-workcontent">
        <header className="fv-workhead">
          <div><span className="fv-eyebrow">Le dossier du voyage</span><h1>Documents</h1><p>{total} document{total > 1 ? 's' : ''} · Billets, réservations et fichiers utiles.</p></div>
          <div className="fv-upload">
            <label>Classer dans<select value={uploadCat} disabled={busy} onChange={e => setUploadCat(e.target.value)}>
              {DOC_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select></label>
            <button type="button" className="fv-control fv-control-primary" onClick={() => inputRef.current?.click()} disabled={busy}>
              <Icon name="plus" size={18} />{busy ? 'Envoi…' : 'Ajouter'}
            </button>
            <input ref={inputRef} type="file" aria-label="Choisir des documents" multiple accept="image/*,.pdf" onChange={e => addFiles(e.target.files)} hidden />
          </div>
        </header>
        <div className="fv-subnav" role="group" aria-label="Vues des documents">
          <button type="button" aria-pressed={tab === 'detail'} onClick={() => setTab('detail')}>Détail</button>
          <button type="button" aria-pressed={tab === 'resume'} onClick={() => setTab('resume')}>Résumé</button>
        </div>
        {tab === 'resume' && renderResume()}
        {tab === 'detail' && renderDetail()}
      </div>
    </div>
  );
}
window.DocsView = DocsView;
