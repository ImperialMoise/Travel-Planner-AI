const DOC_CATEGORIES = [
  { id: 'flights', label: "Billets d'avion", icon: 'flight', tone: '#7c5410' },
  { id: 'hotels', label: 'Hébergements', icon: 'bed', tone: '#b4843e' },
  { id: 'identity', label: 'Identité', icon: 'badge', tone: '#597b72' },
  { id: 'insurance', label: 'Assurances', icon: 'shield', tone: '#40625a' },
  { id: 'other', label: 'Autres documents', icon: 'file', tone: '#827567' }
];

function formatDocSize(bytes) {
  if (!bytes) return 'Taille inconnue';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function DocsView() {
  const { trip } = Store.useStore();
  const inputRef = React.useRef(null);
  const [documents, setDocuments] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState(null);
  const [selectedUrl, setSelectedUrl] = React.useState('');
  const [category, setCategory] = React.useState('other');
  const [busy, setBusy] = React.useState(false);

  async function loadDocuments() {
    if (!trip?.id || !window.SB?.listDocuments) {
      setDocuments([]);
      setSelectedId(null);
      return;
    }

    try {
      const docs = await window.SB.listDocuments(trip.id);
      setDocuments(docs);
      setSelectedId(current => current || docs[0]?.id || null);
    } catch (error) {
      alert('Erreur chargement documents : ' + (error.message || error));
    }
  }

  React.useEffect(() => {
    loadDocuments();
  }, [trip?.id]);

  const selected = documents.find(doc => doc.id === selectedId) || documents[0] || null;

  React.useEffect(() => {
    let cancelled = false;

    async function loadUrl() {
      if (!selected?.filePath || !window.SB?.getDocumentUrl) {
        setSelectedUrl('');
        return;
      }

      try {
        const url = await window.SB.getDocumentUrl(selected.filePath);
        if (!cancelled) setSelectedUrl(url);
      } catch (error) {
        if (!cancelled) setSelectedUrl('');
      }
    }

    loadUrl();
    return () => { cancelled = true; };
  }, [selected?.id, selected?.filePath]);

  async function addFiles(files) {
    const selectedFiles = [...files || []];
    if (!selectedFiles.length) return;

    if (!trip?.id) {
      alert('Sélectionne un voyage avant d’ajouter un document.');
      return;
    }

    try {
      setBusy(true);
      for (const file of selectedFiles) {
        await window.SB.uploadDocument(trip.id, file, category);
      }

      if (inputRef.current) inputRef.current.value = '';
      await loadDocuments();
    } catch (error) {
      alert('Erreur upload document : ' + (error.message || error));
    } finally {
      setBusy(false);
    }
  }

  async function deleteDoc(id) {
    if (!confirm('Supprimer ce document ?')) return;

    try {
      setBusy(true);
      await window.SB.deleteDocument(id);
      setSelectedId(null);
      await loadDocuments();
    } catch (error) {
      alert('Erreur suppression document : ' + (error.message || error));
    } finally {
      setBusy(false);
    }
  }

  const grouped = DOC_CATEGORIES.map(cat => ({
    ...cat,
    files: documents.filter(doc => doc.category === cat.id)
  }));
  const total = documents.length;
  const selectedType = selected?.mime?.includes('pdf') ? 'pdf' : selected?.mime?.includes('image') ? 'image' : 'file';

  return (
    <div style={{
      flex: 1,
      minHeight: 0,
      display: 'grid',
      gridTemplateColumns: '360px 1fr',
      gap: 18,
      padding: 24,
      background: 'var(--bg)',
      color: 'var(--text)'
    }}>
      <aside style={{
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 18,
          padding: 18,
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            color: 'var(--accent)'
          }}>
            Coffre-fort
          </div>

          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 30,
            margin: '6px 0 6px',
            color: 'var(--text)'
          }}>
            Documents
          </h2>

          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>
            {trip?.name || 'Mon voyage'} · {total} document{total > 1 ? 's' : ''}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 16 }}>
            <select
              value={category}
              onChange={event => setCategory(event.target.value)}
              disabled={busy}
              style={{
                border: '1px solid var(--line)',
                background: 'var(--inset)',
                color: 'var(--text)',
                borderRadius: 12,
                padding: '10px 12px',
                fontFamily: 'inherit'
              }}
            >
              {DOC_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>

            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              style={{
                border: 'none',
                background: 'var(--accent)',
                color: 'var(--accent-ink)',
                borderRadius: 12,
                padding: '0 14px',
                fontWeight: 800,
                cursor: busy ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                opacity: busy ? .7 : 1
              }}
            >
              <Icon name="plus" size={15} />
              {busy ? '...' : 'Ajouter'}
            </button>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={event => addFiles(event.target.files)}
              hidden
            />
          </div>
        </div>

        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'grid',
          gap: 12,
          paddingRight: 4
        }}>
          {grouped.map(cat => (
            <section
              key={cat.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--line)',
                borderRadius: 16,
                padding: 14,
                boxShadow: 'var(--shadow)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: 'var(--accent-soft)',
                  color: cat.tone,
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  <Icon name={cat.icon} size={17} />
                </span>
                <strong style={{ flex: 1, fontSize: 14 }}>{cat.label}</strong>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>{cat.files.length}</span>
              </div>

              <div style={{ display: 'grid', gap: 7 }}>
                {cat.files.length ? cat.files.map(doc => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedId(doc.id)}
                    style={{
                      width: '100%',
                      border: `1px solid ${selected?.id === doc.id ? 'var(--accent)' : 'var(--line)'}`,
                      background: selected?.id === doc.id ? 'var(--accent-soft)' : 'var(--inset)',
                      color: 'var(--text)',
                      borderRadius: 12,
                      padding: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <Icon name={doc.mime?.includes('pdf') ? 'file' : 'camera'} size={16} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.name}
                      </span>
                      <span style={{ color: 'var(--muted)', fontSize: 11 }}>
                        {new Date(doc.createdAt).toLocaleDateString('fr-FR')} · {formatDocSize(doc.size)}
                      </span>
                    </span>
                  </button>
                )) : (
                  <p style={{ color: 'var(--muted)', fontSize: 12, margin: '4px 0 0' }}>
                    Aucun document.
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </aside>

      <main style={{
        minHeight: 0,
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 22,
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {selected ? (
          <>
            <header style={{
              padding: '16px 18px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selected.name}
                </strong>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                  {(selected.mime || 'FICHIER').toUpperCase()} · {formatDocSize(selected.size)}
                </span>
              </div>

              {selectedUrl && (
                <a
                  href={selectedUrl}
                  download={selected.name}
                  style={{
                    textDecoration: 'none',
                    border: '1px solid var(--line)',
                    background: 'var(--inset)',
                    color: 'var(--text)',
                    borderRadius: 12,
                    padding: '9px 12px',
                    fontSize: 13,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Icon name="download" size={15} />
                  Télécharger
                </a>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={() => deleteDoc(selected.id)}
                style={{
                  border: '1px solid rgba(192,86,63,.35)',
                  background: 'rgba(192,86,63,.08)',
                  color: '#c0563f',
                  borderRadius: 12,
                  padding: '9px 12px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: busy ? 'wait' : 'pointer'
                }}
              >
                Supprimer
              </button>
            </header>

            <div style={{
              flex: 1,
              minHeight: 0,
              padding: 18,
              background: 'var(--inset)',
              display: 'grid',
              placeItems: 'center'
            }}>
              {!selectedUrl ? (
                <div style={{ color: 'var(--muted)' }}>Chargement du document...</div>
              ) : selectedType === 'image' ? (
                <img
                  src={selectedUrl}
                  alt={selected.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    borderRadius: 14,
                    boxShadow: '0 18px 45px rgba(31,46,40,.18)'
                  }}
                />
              ) : selectedType === 'pdf' ? (
                <iframe
                  src={selectedUrl}
                  title={selected.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 0,
                    borderRadius: 14,
                    background: '#fff'
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                  <Icon name="file" size={42} />
                  <p>Aperçu indisponible pour ce type de fichier.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 30 }}>
            <div>
              <Icon name="file" size={46} />
              <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 28, margin: '12px 0 6px' }}>
                Aucun document
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                Ajoute tes billets, réservations, passeports ou assurances depuis ton ordinateur.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

window.DocsView = DocsView;