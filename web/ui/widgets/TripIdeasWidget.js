(function initTripIdeasWidget() {
  const Icon = window.Icon;

  function emptyDraft() {
    return {
      title: '',
      note: '',
      link: ''
    };
  }

  function normalizeExternalLink(value) {
    const raw = String(value || '').trim();

    if (!raw) return '';

    const candidate = /^https?:\/\//i.test(raw)
      ? raw
      : 'https://' + raw;

    try {
      const url = new URL(candidate);

      if (
        url.protocol !== 'http:' &&
        url.protocol !== 'https:'
      ) {
        return '';
      }

      return url.href;
    } catch (error) {
      return '';
    }
  }

  function friendlyError(error) {
    const message = String(
      error?.message || ''
    );

    if (
      error?.code === '42501' ||
      /row-level security|permission denied/i.test(message)
    ) {
      return 'Ce voyage est en lecture seule. Seuls le propriétaire et les éditeurs peuvent modifier les idées.';
    }

    return message || 'Une erreur est survenue.';
  }

  function TripIdeasWidget({ trip }) {
    const [ideas, setIdeas] =
      React.useState([]);

    const [loading, setLoading] =
      React.useState(true);

    const [saving, setSaving] =
      React.useState(false);

    const [busyId, setBusyId] =
      React.useState(null);

    const [formOpen, setFormOpen] =
      React.useState(false);

    const [editingId, setEditingId] =
      React.useState(null);

    const [draft, setDraft] =
      React.useState(emptyDraft);

    const [error, setError] =
      React.useState('');

    const [notice, setNotice] =
      React.useState('');

    const requestRef = React.useRef(0);

    const loadIdeas = React.useCallback(
      async function loadIdeas(silent) {
        if (!trip?.id) {
          setIdeas([]);
          setLoading(false);
          return;
        }

        const requestId =
          requestRef.current + 1;

        requestRef.current = requestId;

        if (!silent) {
          setLoading(true);
        }

        try {
          const nextIdeas =
            await window.SB.listTripIdeas(
              trip.id
            );

          if (
            requestRef.current === requestId
          ) {
            setIdeas(nextIdeas);
            setError('');
          }
        } catch (loadError) {
          if (
            requestRef.current === requestId
          ) {
            setError(
              friendlyError(loadError)
            );
          }
        } finally {
          if (
            requestRef.current === requestId
          ) {
            setLoading(false);
          }
        }
      },
      [trip?.id]
    );

    React.useEffect(
      function refreshIdeas() {
        loadIdeas(false);

        return function cleanup() {
          requestRef.current += 1;
        };
      },
      [loadIdeas]
    );

    function openCreateForm() {
      setDraft(emptyDraft());
      setEditingId(null);
      setError('');
      setNotice('');
      setFormOpen(true);
    }

    function openEditForm(idea) {
      setDraft({
        title: idea.title || '',
        note: idea.note || '',
        link: idea.link || ''
      });

      setEditingId(idea.id);
      setError('');
      setNotice('');
      setFormOpen(true);
    }

    function closeForm() {
      if (saving) return;

      setFormOpen(false);
      setEditingId(null);
      setDraft(emptyDraft());
      setError('');
    }

    function updateDraft(field, value) {
      setDraft(function update(current) {
        return {
          ...current,
          [field]: value
        };
      });
    }

    async function submitIdea(event) {
      event.preventDefault();

      if (!trip?.id || saving) return;

      const title =
        String(draft.title || '').trim();

      const rawLink =
        String(draft.link || '').trim();

      const cleanLink =
        normalizeExternalLink(rawLink);

      if (!title) {
        setError(
          'Donne un titre à cette idée.'
        );
        return;
      }

      if (rawLink && !cleanLink) {
        setError(
          'Le lien indiqué n’est pas valide.'
        );
        return;
      }

      setSaving(true);
      setError('');
      setNotice('');

      try {
        const input = {
          title,
          note:
            String(draft.note || '').trim(),
          link: cleanLink
        };

        if (editingId) {
          const saved =
            await window.SB.updateTripIdea(
              editingId,
              input
            );

          setIdeas(function update(current) {
            return current.map(function mapIdea(
              idea
            ) {
              return idea.id === saved.id
                ? saved
                : idea;
            });
          });

          setNotice('Idée modifiée.');
        } else {
          const saved =
            await window.SB.createTripIdea(
              trip.id,
              input
            );

          setIdeas(function update(current) {
            return [
              saved,
              ...current
            ];
          });

          setNotice('Idée ajoutée.');
        }

        setFormOpen(false);
        setEditingId(null);
        setDraft(emptyDraft());
      } catch (saveError) {
        setError(
          friendlyError(saveError)
        );
      } finally {
        setSaving(false);
      }
    }

    async function removeIdea(idea) {
      const confirmed = window.confirm(
        'Supprimer l’idée « ' +
        idea.title +
        ' » ?'
      );

      if (!confirmed) return;

      setBusyId(idea.id);
      setError('');
      setNotice('');

      try {
        await window.SB.deleteTripIdea(
          idea.id
        );

        setIdeas(function update(current) {
          return current.filter(
            function keepIdea(item) {
              return item.id !== idea.id;
            }
          );
        });

        setNotice('Idée supprimée.');
      } catch (deleteError) {
        setError(
          friendlyError(deleteError)
        );
      } finally {
        setBusyId(null);
      }
    }

    if (!trip?.id) {
      return (
        <div
          style={{
            color: 'var(--muted)',
            fontSize: 12.5,
            lineHeight: 1.5
          }}
        >
          Ouvre un voyage pour ajouter des idées.
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8
          }}
        >
          <div
            style={{
              color: 'var(--muted)',
              fontSize: 12,
              lineHeight: 1.4
            }}
          >
            {ideas.length
              ? ideas.length +
                (ideas.length > 1
                  ? ' idées à explorer'
                  : ' idée à explorer')
              : 'Garde ici les lieux et activités à étudier.'}
          </div>

          {!formOpen && (
            <button
              type="button"
              onClick={openCreateForm}
              aria-label="Ajouter une idée"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                border:
                  '1px solid var(--accent)',
                background: 'var(--accent)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <Icon name="plus" size={16} />
            </button>
          )}
        </div>

        {formOpen && (
          <form
            onSubmit={submitIdea}
            style={{
              padding: 10,
              border:
                '1px solid var(--outline-variant)',
              borderRadius: 12,
              background:
                'var(--surface-container-low, var(--inset))',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                color: 'var(--muted)',
                fontSize: 11,
                fontWeight: 800
              }}
            >
              TITRE
              <input
                autoFocus
                required
                maxLength={160}
                value={draft.title}
                onChange={event =>
                  updateDraft(
                    'title',
                    event.target.value
                  )
                }
                placeholder="Ex. Musée à réserver"
                style={{
                  width: '100%',
                  minHeight: 38,
                  border:
                    '1px solid var(--outline-variant)',
                  borderRadius: 10,
                  background: 'var(--card)',
                  color: 'var(--text)',
                  padding: '8px 10px',
                  font: 'inherit'
                }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                color: 'var(--muted)',
                fontSize: 11,
                fontWeight: 800
              }}
            >
              NOTE
              <textarea
                maxLength={2000}
                rows={3}
                value={draft.note}
                onChange={event =>
                  updateDraft(
                    'note',
                    event.target.value
                  )
                }
                placeholder="Prix, horaires, conseils…"
                style={{
                  width: '100%',
                  resize: 'vertical',
                  border:
                    '1px solid var(--outline-variant)',
                  borderRadius: 10,
                  background: 'var(--card)',
                  color: 'var(--text)',
                  padding: '8px 10px',
                  font: 'inherit',
                  lineHeight: 1.45
                }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                color: 'var(--muted)',
                fontSize: 11,
                fontWeight: 800
              }}
            >
              LIEN
              <input
                maxLength={2048}
                value={draft.link}
                onChange={event =>
                  updateDraft(
                    'link',
                    event.target.value
                  )
                }
                placeholder="https://…"
                inputMode="url"
                style={{
                  width: '100%',
                  minHeight: 38,
                  border:
                    '1px solid var(--outline-variant)',
                  borderRadius: 10,
                  background: 'var(--card)',
                  color: 'var(--text)',
                  padding: '8px 10px',
                  font: 'inherit'
                }}
              />
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 7
              }}
            >
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                style={{
                  minHeight: 34,
                  border:
                    '1px solid var(--outline-variant)',
                  borderRadius: 10,
                  background: 'var(--card)',
                  color: 'var(--text)',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontWeight: 700
                }}
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  minHeight: 34,
                  border: 0,
                  borderRadius: 10,
                  background: 'var(--accent)',
                  color: '#fff',
                  padding: '6px 11px',
                  cursor:
                    saving
                      ? 'wait'
                      : 'pointer',
                  font: 'inherit',
                  fontWeight: 800
                }}
              >
                {saving
                  ? 'Enregistrement…'
                  : editingId
                    ? 'Modifier'
                    : 'Ajouter'}
              </button>
            </div>
          </form>
        )}

        {error && (
          <div
            role="alert"
            style={{
              color: '#b54838',
              fontSize: 12,
              lineHeight: 1.45
            }}
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            aria-live="polite"
            style={{
              color: 'var(--accent)',
              fontSize: 12,
              fontWeight: 750
            }}
          >
            {notice}
          </div>
        )}

        {loading ? (
          <div
            role="status"
            style={{
              padding: '12px 4px',
              color: 'var(--muted)',
              fontSize: 12
            }}
          >
            Chargement des idées…
          </div>
        ) : ideas.length === 0 ? (
          !formOpen && (
            <button
              type="button"
              onClick={openCreateForm}
              style={{
                width: '100%',
                padding: 12,
                border:
                  '1px dashed var(--outline-variant)',
                borderRadius: 12,
                background: 'transparent',
                color: 'var(--muted)',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: 12.5,
                lineHeight: 1.45
              }}
            >
              <strong
                style={{
                  display: 'block',
                  color: 'var(--text)',
                  marginBottom: 3
                }}
              >
                Ta boîte à idées est vide
              </strong>
              Ajoute un lieu, une activité ou un lien à regarder plus tard.
            </button>
          )
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            {ideas.map(function renderIdea(
              idea
            ) {
              const safeLink =
                normalizeExternalLink(
                  idea.link
                );

              const disabled =
                busyId === idea.id;

              return (
                <article
                  key={idea.id}
                  style={{
                    padding: 10,
                    border:
                      '1px solid var(--outline-variant)',
                    borderRadius: 12,
                    background: 'var(--card)',
                    opacity:
                      disabled ? 0.6 : 1
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      color: 'var(--text)',
                      fontSize: 13,
                      lineHeight: 1.35,
                      overflowWrap: 'anywhere'
                    }}
                  >
                    {idea.title}
                  </strong>

                  {idea.note && (
                    <p
                      style={{
                        margin: '6px 0 0',
                        color: 'var(--muted)',
                        fontSize: 12,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere'
                      }}
                    >
                      {idea.note}
                    </p>
                  )}

                  {safeLink && (
                    <a
                      href={safeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        marginTop: 7,
                        color: 'var(--accent)',
                        fontSize: 12,
                        fontWeight: 800,
                        overflowWrap: 'anywhere'
                      }}
                    >
                      Ouvrir le lien
                    </a>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      marginTop: 8
                    }}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        openEditForm(idea)
                      }
                      style={{
                        border: 0,
                        background: 'transparent',
                        color: 'var(--accent)',
                        padding: 0,
                        cursor: 'pointer',
                        font: 'inherit',
                        fontSize: 11.5,
                        fontWeight: 800
                      }}
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        removeIdea(idea)
                      }
                      style={{
                        border: 0,
                        background: 'transparent',
                        color: '#b54838',
                        padding: 0,
                        cursor: 'pointer',
                        font: 'inherit',
                        fontSize: 11.5,
                        fontWeight: 800
                      }}
                    >
                      {disabled
                        ? 'Suppression…'
                        : 'Supprimer'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  window.TripIdeasWidget =
    TripIdeasWidget;
})();