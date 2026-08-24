
(function initTripIdeaComments() {
  const Store = window.Store;

  function formatCommentDate(value) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(date);
  }

  function TripIdeaComments({
    idea,
    members = []
  }) {
    const [open, setOpen] =
      React.useState(false);

    const [loaded, setLoaded] =
      React.useState(false);

    const [loading, setLoading] =
      React.useState(false);

    const [saving, setSaving] =
      React.useState(false);

    const [deletingId, setDeletingId] =
      React.useState(null);

    const [comments, setComments] =
      React.useState([]);

    const [draft, setDraft] =
      React.useState('');

    const [error, setError] =
      React.useState('');

    const currentUserId =
      Store?.get()?.user?.id || null;

    const loadComments = React.useCallback(
      async function loadComments() {
        if (!idea?.id) return;

        setLoading(true);
        setError('');

        try {
          const nextComments =
            await window.SB.listTripIdeaComments(
              idea.id
            );

          setComments(nextComments);
          setLoaded(true);
        } catch (loadError) {
          setError(
            loadError?.message ||
            'Impossible de charger les commentaires.'
          );
        } finally {
          setLoading(false);
        }
      },
      [idea?.id]
    );

    React.useEffect(
      function loadWhenOpened() {
        if (open && !loaded) {
          loadComments();
        }
      },
      [
        open,
        loaded,
        loadComments
      ]
    );

    function authorName(comment) {
      if (
        currentUserId &&
        comment.userId === currentUserId
      ) {
        return 'Moi';
      }

      const member =
        members.find(
          item =>
            item.userId === comment.userId
        );

      return member?.name || 'Voyageur';
    }

    async function submitComment(event) {
      event.preventDefault();

      const cleanDraft =
        String(draft || '').trim();

      if (
        !cleanDraft ||
        !idea?.id ||
        saving
      ) {
        return;
      }

      setSaving(true);
      setError('');

      try {
        const saved =
          await window.SB.createTripIdeaComment(
            idea.id,
            cleanDraft
          );

        setComments(function update(current) {
          return [
            ...current,
            saved
          ];
        });

        setDraft('');
        setLoaded(true);
      } catch (saveError) {
        setError(
          saveError?.message ||
          'Impossible d’ajouter le commentaire.'
        );
      } finally {
        setSaving(false);
      }
    }

    async function removeComment(comment) {
      if (
        !comment?.id ||
        deletingId
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          'Supprimer ce commentaire ?'
        );

      if (!confirmed) return;

      setDeletingId(comment.id);
      setError('');

      try {
        await window.SB.deleteTripIdeaComment(
          comment.id
        );

        setComments(function update(current) {
          return current.filter(
            item =>
              item.id !== comment.id
          );
        });
      } catch (deleteError) {
        setError(
          deleteError?.message ||
          'Impossible de supprimer le commentaire.'
        );
      } finally {
        setDeletingId(null);
      }
    }

    return (
      <div
        style={{
          marginTop: 8,
          borderTop:
            '1px solid var(--outline-variant)',
          paddingTop: 8
        }}
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={() =>
            setOpen(current => !current)
          }
          style={{
            border: 0,
            background: 'transparent',
            color: 'var(--muted)',
            padding: 0,
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 11.5,
            fontWeight: 800
          }}
        >
          {open ? 'Masquer' : 'Commentaires'}
          {loaded
            ? ' (' + comments.length + ')'
            : ''}
        </button>

        {open && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginTop: 8
            }}
          >
            {loading && (
              <div
                role="status"
                style={{
                  color: 'var(--muted)',
                  fontSize: 11.5
                }}
              >
                Chargement…
              </div>
            )}

            {!loading &&
              loaded &&
              comments.length === 0 && (
                <div
                  style={{
                    color: 'var(--muted)',
                    fontSize: 11.5
                  }}
                >
                  Aucun commentaire pour le moment.
                </div>
              )}

            {comments.map(
              function renderComment(comment) {
                const mine =
                  currentUserId ===
                  comment.userId;

                return (
                  <div
                    key={comment.id}
                    style={{
                      padding: 8,
                      borderRadius: 10,
                      background:
                        'var(--inset)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <strong
                        style={{
                          color: 'var(--text)',
                          fontSize: 11.5
                        }}
                      >
                        {authorName(comment)}
                      </strong>

                      <span
                        style={{
                          color: 'var(--faint)',
                          fontSize: 10
                        }}
                      >
                        {formatCommentDate(
                          comment.createdAt
                        )}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: '5px 0 0',
                        color: 'var(--muted)',
                        fontSize: 11.5,
                        lineHeight: 1.45,
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere'
                      }}
                    >
                      {comment.body}
                    </p>

                    {mine && (
                      <button
                        type="button"
                        disabled={
                          deletingId ===
                          comment.id
                        }
                        onClick={() =>
                          removeComment(comment)
                        }
                        style={{
                          marginTop: 5,
                          border: 0,
                          background:
                            'transparent',
                          color: '#b54838',
                          padding: 0,
                          cursor: 'pointer',
                          font: 'inherit',
                          fontSize: 10.5,
                          fontWeight: 750
                        }}
                      >
                        {deletingId ===
                        comment.id
                          ? 'Suppression…'
                          : 'Supprimer'}
                      </button>
                    )}
                  </div>
                );
              }
            )}

            <form
              onSubmit={submitComment}
              style={{
                display: 'flex',
                gap: 6
              }}
            >
              <input
                value={draft}
                maxLength={1000}
                onChange={event =>
                  setDraft(event.target.value)
                }
                placeholder="Ajouter un commentaire…"
                aria-label={
                  'Commenter ' + idea.title
                }
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 36,
                  border:
                    '1px solid var(--outline-variant)',
                  borderRadius: 10,
                  background: 'var(--card)',
                  color: 'var(--text)',
                  padding: '7px 9px',
                  font: 'inherit',
                  fontSize: 11.5
                }}
              />

              <button
                type="submit"
                disabled={
                  saving ||
                  !String(draft).trim()
                }
                style={{
                  minWidth: 38,
                  minHeight: 36,
                  border: 0,
                  borderRadius: 10,
                  background: 'var(--accent)',
                  color: '#fff',
                  cursor:
                    saving
                      ? 'wait'
                      : 'pointer',
                  font: 'inherit',
                  fontWeight: 900
                }}
              >
                {saving ? '…' : '↑'}
              </button>
            </form>

            {error && (
              <div
                role="alert"
                style={{
                  color: '#b54838',
                  fontSize: 11.5
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  window.TripIdeaComments =
    TripIdeaComments;
})();