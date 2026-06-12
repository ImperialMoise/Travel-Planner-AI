// ════════════════════════════════════════════════════════════
// Docs.js — Coffre-fort de documents, design Atelier v2
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
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' Ko';
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
  const [tab, setTab]       = React.useState('resume');    // 'resume' | 'detail'
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

  // ══════════════════════════════════════════════════════════
  // Styles Atelier v2
  // ══════════════════════════════════════════════════════════
  const card = {
    background: 'var(--card)', border: '1px solid var(--line)',
    borderRadius: 16, boxShadow: 'var(--shadow)'
  };
  const kicker = {
    fontSize: 11, fontWeight: 700, letterSpacing: '.16em',
    textTransform: 'uppercase', color: 'var(--accent)'
  };
  const serif = 'var(--font-serif)';
  const tabBtn = on => ({
    flex: 1, border: 'none', cursor: 'pointer', padding: '9px 0',
    borderRadius: 999, fontSize: 13, fontWeight: 700,
    background: on ? 'var(--accent)' : 'transparent',
    color: on ? 'var(--accent-ink)' : 'var(--muted)',
    transition: 'all .2s', fontFamily: 'inherit'
  });
  const chipStyle = (active) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 13px', borderRadius: 999, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .2s',
    border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--accent-ink)' : 'var(--muted)',
    fontFamily: 'inherit'
  });
  const inp = {
    width: '100%', padding: '10px 12px 10px 36px',
    border: '1px solid var(--line)', borderRadius: 11,
    background: 'var(--inset)', color: 'var(--text)',
    fontFamily: 'inherit', fontSize: 14, outline: 'none'
  };


  // ══════════════════════════════════════════════════════════
  // ONGLET RÉSUMÉ — Vue Timeline chronologique
  // ══════════════════════════════════════════════════════════
  const renderResume = () => {
    // Grouper les documents par section de la timeline
    const sections = TIMELINE_SECTIONS.map(sec => ({
      ...sec,
      docs: documents.filter(d => sec.categories.includes(d.category))
    })).filter(sec => sec.docs.length > 0); // Ne montrer que les sections avec des docs

    if (total === 0) {
      return (
        <div style={{ ...card, padding: '52px 24px', textAlign: 'center', marginTop: 8 }}>
          <Icon name="folder" size={44} style={{ color: 'var(--faint)', margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>
            Aucun document
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            Ajoute tes billets, réservations ou passeports<br/>pour les voir apparaître dans la timeline.
          </p>
        </div>
      );
    }

    return (
      <div style={{ position: 'relative', paddingTop: 8 }}>
        {/* Ligne verticale de la timeline (desktop uniquement) */}
        <div style={{
          position: 'absolute', left: '50%', top: 0, bottom: 0,
          width: 1, background: 'var(--line)', transform: 'translateX(-0.5px)',
          display: window.innerWidth < 700 ? 'none' : 'block'
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {sections.map((sec, si) => {
            const isRight = si % 2 === 0; // Alterne gauche/droite

            return (
              <div key={sec.id} style={{
                position: 'relative',
                display: 'flex', alignItems: 'flex-start',
                flexDirection: window.innerWidth < 700 ? 'column' : (isRight ? 'row' : 'row-reverse'),
                gap: window.innerWidth < 700 ? 12 : 0
              }}>

                {/* Côté titre (50%) */}
                <div style={{
                  width: window.innerWidth < 700 ? '100%' : '50%',
                  textAlign: window.innerWidth < 700 ? 'left' : (isRight ? 'right' : 'left'),
                  padding: window.innerWidth < 700 ? '0' : (isRight ? '0 32px 0 0' : '0 0 0 32px'),
                  paddingTop: 2
                }}>
                  <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: 'var(--text)' }}>
                    {sec.label}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                    {sec.subtitle}
                  </div>
                </div>

                {/* Point sur la timeline (desktop) */}
                {window.innerWidth >= 700 && (
                  <div style={{
                    position: 'absolute', left: '50%', top: 6,
                    width: 12, height: 12, borderRadius: '50%',
                    background: sec.dotColor, border: '2.5px solid var(--bg)',
                    transform: 'translateX(-50%)', zIndex: 2,
                    boxShadow: '0 0 0 3px ' + sec.dotColor + '30'
                  }} />
                )}

                {/* Côté documents (50%) */}
                <div style={{
                  width: window.innerWidth < 700 ? '100%' : '50%',
                  padding: window.innerWidth < 700 ? '0' : (isRight ? '0 0 0 32px' : '0 32px 0 0'),
                  display: 'flex', flexDirection: 'column', gap: 10
                }}>
                  {sec.docs.map(doc => {
                    const meta = catMeta(doc.category);
                    const isImage = doc.mime?.includes('image');
                    return (
                      <div key={doc.id}
                        onClick={() => { setTab('detail'); setSelectedId(doc.id); }}
                        style={{
                          ...card, display: 'flex', alignItems: 'center',
                          gap: 14, padding: '14px 16px', cursor: 'pointer',
                          transition: 'box-shadow .2s, border-color .2s'
                        }}>

                        {/* Icône */}
                        <div style={{
                          width: 42, height: 42, borderRadius: 12,
                          background: meta.tone + '18', color: meta.tone,
                          display: 'grid', placeItems: 'center', flexShrink: 0,
                          transition: 'background .2s'
                        }}>
                          <Icon name={isImage ? 'camera' : meta.icon} size={20} />
                        </div>

                        {/* Infos */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 14.5, fontWeight: 700, color: 'var(--text)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {doc.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                            {(doc.mime || 'FICHIER').split('/').pop().toUpperCase()}
                            {doc.size ? ' · ' + formatDocSize(doc.size) : ''}
                          </div>
                        </div>

                        {/* Badge catégorie */}
                        <span style={{
                          padding: '4px 10px', borderRadius: 999, fontSize: 10.5,
                          fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                          background: meta.tone + '18', color: meta.tone,
                          whiteSpace: 'nowrap'
                        }}>
                          {meta.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  // ══════════════════════════════════════════════════════════
  // ONGLET DÉTAIL — Vue explorateur (liste + prévisualisation)
  // ══════════════════════════════════════════════════════════
  const renderDetail = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: window.innerWidth < 700 ? '1fr' : '380px 1fr',
      gap: 0, minHeight: 'calc(100vh - 240px)',
      ...card, overflow: 'hidden', marginTop: 8
    }}>

      {/* ── Panneau gauche : recherche + filtres + liste ── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        borderRight: window.innerWidth >= 700 ? '1px solid var(--line)' : 'none',
        background: 'var(--card)'
      }}>

        {/* Barre de recherche */}
        <div style={{ padding: '18px 18px 0' }}>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Icon name="search" size={16} style={{
              position: 'absolute', left: 11, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--faint)'
            }} />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Rechercher…"
              style={inp}
            />
          </div>

          {/* Chips filtre */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
            <button onClick={() => setFilter('__all__')} style={chipStyle(filter === '__all__')}>Tous</button>
            {DOC_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setFilter(cat.id)} style={chipStyle(filter === cat.id)}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste scrollable */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px' }}>
          {filteredDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--faint)', fontSize: 13, fontStyle: 'italic' }}>
              {total === 0 ? 'Aucun document ajouté.' : 'Aucun résultat.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredDocs.map(doc => {
                const meta = catMeta(doc.category);
                const isSelected = doc.id === selectedId;
                const isImage = doc.mime?.includes('image');
                return (
                  <button key={doc.id}
                    onClick={() => setSelectedId(doc.id)}
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      padding: '14px 14px', borderRadius: 14,
                      border: '1px solid ' + (isSelected ? 'var(--accent)' : 'var(--line)'),
                      background: isSelected ? 'var(--accent-soft)' : 'var(--card)',
                      boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,.06)' : 'none',
                      transition: 'all .15s', display: 'flex', alignItems: 'flex-start', gap: 12,
                      fontFamily: 'inherit'
                    }}>

                    {/* Icône */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: isSelected ? meta.tone + '22' : 'var(--inset)',
                      color: isSelected ? meta.tone : 'var(--muted)',
                      display: 'grid', placeItems: 'center',
                      border: '1px solid var(--line)'
                    }}>
                      <Icon name={isImage ? 'camera' : meta.icon} size={20} />
                    </div>

                    {/* Infos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 2 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 700, color: 'var(--text)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                          {doc.name}
                        </div>
                        <span style={{ fontSize: 11.5, color: 'var(--faint)', flexShrink: 0 }}>
                          {new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {formatDocSize(doc.size)}
                      </div>
                      {/* Tags */}
                      <div style={{ display: 'flex', gap: 5 }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800,
                          letterSpacing: '.04em', textTransform: 'uppercase',
                          background: meta.tone + '18', color: meta.tone
                        }}>{meta.label}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800,
                          letterSpacing: '.04em', textTransform: 'uppercase',
                          background: 'var(--inset)', color: 'var(--muted)',
                          border: '1px solid var(--line)'
                        }}>{(doc.mime || '').split('/').pop().toUpperCase() || 'FICHIER'}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Panneau droit : prévisualisation ── */}
      <div style={{
        display: window.innerWidth < 700 && !selected ? 'none' : 'flex',
        flexDirection: 'column', background: 'var(--inset)', position: 'relative',
        minHeight: window.innerWidth < 700 ? 300 : 'auto'
      }}>
        {selected ? (
          <>
            {/* Boutons d'action flottants */}
            <div style={{
              position: 'absolute', top: 18, right: 20, zIndex: 5,
              display: 'flex', gap: 8, alignItems: 'center'
            }}>
              {selectedUrl && (
                <>
                  <button onClick={() => { if (selectedUrl) window.open(selectedUrl, '_blank'); }}
                    title="Ouvrir"
                    style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: 'var(--card)', border: '1px solid var(--line)',
                      boxShadow: 'var(--shadow)', display: 'grid', placeItems: 'center',
                      cursor: 'pointer', color: 'var(--text)'
                    }}>
                    <Icon name="share" size={16} />
                  </button>

                  <a href={selectedUrl} download={selected.name}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '8px 16px', borderRadius: 999, fontSize: 12.5, fontWeight: 700,
                      background: 'var(--accent)', color: 'var(--accent-ink)',
                      textDecoration: 'none', boxShadow: 'var(--shadow)',
                      fontFamily: 'inherit'
                    }}>
                    <Icon name="download" size={15} />
                    Télécharger
                  </a>
                </>
              )}
            </div>

            {/* Zone de prévisualisation */}
            <div style={{
              flex: 1, padding: '24px 32px', overflow: 'auto',
              display: 'grid', placeItems: 'center'
            }}>
              {!selectedUrl ? (
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>Chargement…</div>
              ) : selectedType === 'image' ? (
                /* Aperçu image dans un "papier" */
                <div style={{
                  background: 'var(--card)', borderRadius: 16,
                  boxShadow: '0 8px 30px rgba(0,0,0,.06)', border: '1px solid var(--line)',
                  overflow: 'hidden', maxWidth: '100%'
                }}>
                  <img src={selectedUrl} alt={selected.name}
                    style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 340px)', display: 'block' }} />
                  <div style={{
                    padding: '12px 18px', borderTop: '1px solid var(--line)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 11, color: 'var(--faint)', letterSpacing: '.08em', textTransform: 'uppercase'
                  }}>
                    <span>{selected.name}</span>
                    <span>{formatDocSize(selected.size)}</span>
                  </div>
                </div>
              ) : selectedType === 'pdf' ? (
                /* Aperçu PDF dans un cadre "papier" */
                <div style={{
                  width: '100%', maxWidth: 720,
                  background: 'var(--card)', borderRadius: 16,
                  boxShadow: '0 8px 30px rgba(0,0,0,.06)', border: '1px solid var(--line)',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}>
                  <iframe src={selectedUrl} title={selected.name}
                    style={{ width: '100%', height: 'calc(100vh - 340px)', border: 0, background: '#fff' }} />
                  <div style={{
                    padding: '10px 18px', borderTop: '1px solid var(--line)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 11, color: 'var(--faint)', letterSpacing: '.08em', textTransform: 'uppercase'
                  }}>
                    <span>{selected.name}</span>
                    <button onClick={() => deleteDoc(selected.id)} disabled={busy}
                      style={{
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        color: '#c0563f', fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                        display: 'inline-flex', alignItems: 'center', gap: 5
                      }}>
                      <Icon name="x" size={13} />
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                  <Icon name="file" size={44} style={{ display: 'block', margin: '0 auto 12px', color: 'var(--faint)' }} />
                  <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 18 }}>Aperçu indisponible</div>
                  <p style={{ fontSize: 13, marginTop: 6 }}>Ce fichier peut être téléchargé mais pas prévisualisé ici.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Aucun document sélectionné */
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 30 }}>
            <div>
              <Icon name="eye" size={44} style={{ display: 'block', margin: '0 auto 14px', color: 'var(--faint)' }} />
              <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: 'var(--text)', marginBottom: 6 }}>
                Prévisualisation
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
                Sélectionne un document dans la liste pour l'afficher ici.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );


  // ══════════════════════════════════════════════════════════
  // RENDU PRINCIPAL
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ flex: 1, minHeight: 'calc(100vh - 60px)', overflowY: 'auto' }}>
      <div style={{ maxWidth: tab === 'detail' ? 1200 : 860, margin: '0 auto', padding: '24px 22px 40px', transition: 'max-width .3s' }}>

        {/* ── En-tête ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={kicker}>Coffre-fort</div>
            <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 26, color: 'var(--text)', marginTop: 3 }}>
              Documents
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
              {trip?.name || 'Mon voyage'} · {total} document{total > 1 ? 's' : ''}
            </p>
          </div>

          {/* Bouton upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <select value={uploadCat} onChange={e => setUploadCat(e.target.value)}
              style={{
                border: '1px solid var(--line)', background: 'var(--inset)', color: 'var(--text)',
                borderRadius: 10, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit'
              }}>
              {DOC_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>

            <button onClick={() => inputRef.current?.click()} disabled={busy}
              style={{
                border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)',
                borderRadius: 11, padding: '9px 16px', fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13,
                fontFamily: 'inherit', opacity: busy ? .6 : 1
              }}>
              <Icon name="plus" size={14} />
              {busy ? 'Envoi…' : 'Ajouter'}
            </button>

            <input ref={inputRef} type="file" multiple accept="image/*,.pdf"
              onChange={e => addFiles(e.target.files)} hidden />
          </div>
        </div>

        {/* ── Onglets Résumé / Détail ── */}
        <div style={{
          display: 'flex', gap: 2, background: 'var(--inset)',
          border: '1px solid var(--line)', borderRadius: 999,
          padding: 3, marginBottom: 20
        }}>
          <button style={tabBtn(tab === 'resume')} onClick={() => setTab('resume')}>
            Résumé
          </button>
          <button style={tabBtn(tab === 'detail')} onClick={() => setTab('detail')}>
            Détail
          </button>
        </div>

        {/* ── Contenu de l'onglet actif ── */}
        {tab === 'resume' && renderResume()}
        {tab === 'detail' && renderDetail()}
      </div>
    </div>
  );
}

window.DocsView = DocsView;