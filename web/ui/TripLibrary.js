(function initTripLibrary() {
  const css = `
    .trip-library-page {
      --library-ink: #183e35;
      --library-muted: #646c66;
      --library-line: #dedfd6;
      flex: 1; min-height: 0; min-width: 0; overflow: auto;
      background: #f7f6f0; color: #222d28;
      padding: 36px clamp(16px, 4vw, 56px);
    }
    .trip-library { max-width: 1180px; margin: 0 auto; }
    .trip-library *, .trip-library *::before, .trip-library *::after {
      box-sizing: border-box;
    }
    .trip-library h1, .trip-library h2, .trip-library h3 {
      margin: 0; color: var(--library-ink); font-family: var(--font-serif);
      overflow-wrap: anywhere;
    }
    .trip-library h1 { font-size: clamp(30px, 4vw, 44px); line-height: 1.15; }
    .trip-library h2 { font-size: 25px; }
    .trip-library p { margin: 8px 0 0; color: var(--library-muted); line-height: 1.5; }
    .trip-library-header, .trip-library-actions, .trip-library-tools,
    .trip-library-card-foot, .trip-library-footer, .trip-library-manage-actions {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }
    .trip-library-header {
      justify-content: space-between; gap: 24px; margin-bottom: 28px;
    }
    .trip-library button, .trip-library select, .trip-library input,
    .trip-library summary { font: inherit; font-size: 15px; }
    .trip-library-button, .trip-library select, .trip-library input {
      min-height: 44px; border: 1px solid var(--library-line);
      border-radius: 10px; padding: 10px 14px;
      background: #fffefa; color: var(--library-ink);
    }
    .trip-library button, .trip-library summary { cursor: pointer; }
    .trip-library-primary {
      background: #96640d; color: white; border-color: #96640d;
    }
    .trip-library :is(button, input, select, summary, a):focus-visible {
      outline: 3px solid #96640d; outline-offset: 3px;
    }
    .trip-library-tools { margin-bottom: 30px; }
    .trip-library-search { flex: 1 1 260px; }
    .trip-library label {
      display: grid; gap: 6px; color: var(--library-muted); font-size: 13px;
    }
    .trip-library input, .trip-library select {
      width: 100%; min-width: 0; font-size: 16px;
    }
    .trip-library-count {
      color: var(--library-muted); font-size: 13px; margin: 0 0 24px;
    }
    .trip-library-group { margin: 0 0 32px; }
    .trip-library-group h2 { margin-bottom: 14px; }
    .trip-library-grid {
      display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px;
    }
    .trip-library-card {
      display: flex; flex-direction: column; min-width: 0; overflow: hidden;
      border: 1px solid var(--library-line); border-radius: 14px;
      background: #fffefa;
    }
    .trip-library-cover {
      aspect-ratio: 16 / 9; flex-shrink: 0; overflow: hidden;
      display: grid; place-items: center; background: #e8ece2;
      color: #557467; touch-action: pan-y pinch-zoom;
    }
    .trip-library-cover img {
      width: 100%; height: 100%; object-fit: cover; pointer-events: none;
    }
    .trip-library-cover span {
      font-family: var(--font-serif); font-size: 38px;
    }
    .trip-library-card-body {
      flex: 1; min-width: 0; padding: 18px;
      display: flex; flex-direction: column;
    }
    .trip-library .trip-library-title {
      padding: 0; border: 0; background: none; text-align: left; width: 100%;
      color: inherit; font-family: var(--font-serif);
      font-size: 24px; line-height: 1.2; min-height: 44px;
      overflow-wrap: anywhere;
    }
    .trip-library-title:hover {
      text-decoration: underline; text-underline-offset: 4px;
    }
    .trip-library-card-body p {
      font-size: 14px; margin: 4px 0 18px;
    }
    .trip-library-card-foot {
      margin-top: auto; justify-content: space-between; align-items: flex-start;
    }
    .trip-library-manage { margin-left: auto; }
    .trip-library-manage summary {
      min-height: 44px; padding: 12px 4px; color: var(--library-muted);
    }
    .trip-library-manage-actions { padding-top: 8px; }
    .trip-library-compact .trip-library-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .trip-library-compact .trip-library-card {
      display: grid; grid-template-columns: 100px minmax(0, 1fr);
    }
    .trip-library-compact .trip-library-cover {
      aspect-ratio: auto; height: 100%; min-height: 120px;
    }
    .trip-library-compact .trip-library-title { font-size: 21px; }
    .trip-library-empty { padding: 32px 0 48px; max-width: 540px; }
    .trip-library-empty .trip-library-button { margin-top: 18px; }
    .trip-library-footer {
      border-top: 1px solid var(--library-line); padding: 24px 0;
      justify-content: space-between; color: var(--library-muted); font-size: 13px;
    }
    .trip-library-footer nav {
      display: flex; gap: 16px; flex-wrap: wrap;
    }
    .trip-library-footer a {
      color: var(--library-ink); text-underline-offset: 3px;
    }
    @media (max-width: 960px) {
      .trip-library-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 600px) {
      .trip-library-page {
        padding: 24px 16px calc(24px + env(safe-area-inset-bottom));
      }
      .trip-library-header { gap: 18px; margin-bottom: 22px; }
      .trip-library-actions { width: 100%; }
      .trip-library-actions .trip-library-primary { flex: 1; }
      .trip-library-tools { align-items: stretch; gap: 12px; }
      .trip-library-search { flex-basis: 100%; }
      .trip-library-tools > label { width: 100%; }
      .trip-library-grid, .trip-library-compact .trip-library-grid {
        grid-template-columns: minmax(0, 1fr);
      }
      .trip-library-compact .trip-library-card {
        grid-template-columns: 80px minmax(0, 1fr);
      }
      .trip-library-card-body { padding: 16px; }
    }
  `;

  function Cover({ src, name }) {
    const [failed, setFailed] = React.useState(false);
    React.useEffect(() => setFailed(false), [src]);

    return (
      <div className="trip-library-cover" aria-hidden="true">
        {src && !failed ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            draggable="false"
            onError={() => setFailed(true)}
          />
        ) : (
          <span>{(name || 'Voyage').slice(0, 1).toUpperCase()}</span>
        )}
      </div>
    );
  }

  window.TripLibrary = function TripLibrary({
    trips, query, status, onQuery, onStatus, onOpen, onDuplicate,
    onArchive, onCreate, onGuided, getStatus, dateRange, apkUrl
  }) {
    const groups = [
      ['current', 'En cours'],
      ['upcoming', 'À venir'],
      ['undated', 'Dates à définir'],
      ['completed', 'Terminés'],
      ['archived', 'Archivés']
    ];
    const filtered = Boolean(query.trim()) || status !== 'all';

    return (
      <div className="trip-library-page">
        <style>{css}</style>
        <div className="trip-library">
          <header className="trip-library-header">
            <div>
              <h1>Mes voyages</h1>
              <p>Un prochain départ, un itinéraire à retrouver.</p>
            </div>
            <div className="trip-library-actions">
              <button
                type="button"
                className="trip-library-button trip-library-primary"
                onClick={onCreate}
              >
                + Nouveau voyage
              </button>
              <button
                type="button"
                className="trip-library-button"
                onClick={onGuided}
              >
                Décrire mon voyage
              </button>
            </div>
          </header>

          <div className="trip-library-tools">
            <label className="trip-library-search">
              Rechercher un voyage
              <input
                type="search"
                value={query}
                onChange={e => onQuery(e.target.value)}
                placeholder="Nom ou destination…"
              />
            </label>
            <label>
              Afficher
              <select value={status} onChange={e => onStatus(e.target.value)}>
                <option value="all">Tous sauf archivés</option>
                <option value="current">En cours</option>
                <option value="upcoming">À venir</option>
                <option value="undated">Dates à définir</option>
                <option value="completed">Terminés</option>
                <option value="archived">Archivés</option>
              </select>
            </label>
          </div>

          <div className="trip-library-count" role="status" aria-live="polite">
            {trips.length} voyage{trips.length > 1 ? 's' : ''}
          </div>

          {groups.map(([key, title]) => {
            const items = trips.filter(trip => getStatus(trip) === key);
            if (!items.length) return null;
            const compact = key === 'completed' || key === 'archived';

            return (
              <section
                key={key}
                aria-labelledby={'library-' + key}
                className={'trip-library-group' + (compact ? ' trip-library-compact' : '')}
              >
                <h2 id={'library-' + key}>{title}</h2>
                <div className="trip-library-grid">
                  {items.map(trip => (
                    <article key={trip.id} className="trip-library-card">
                      <Cover
                        src={trip.cover_image_url || trip.coverImageUrl}
                        name={trip.name}
                      />
                      <div className="trip-library-card-body">
                        <h3>
                          <button
                            type="button"
                            className="trip-library-title"
                            onClick={() => onOpen(trip.id)}
                          >
                            {trip.name || 'Voyage sans titre'}
                          </button>
                        </h3>
                        <p>{dateRange(trip)}</p>
                        <div className="trip-library-card-foot">
                          <button
                            type="button"
                            className="trip-library-button"
                            onClick={() => onOpen(trip.id)}
                          >
                            {compact ? 'Consulter' : 'Ouvrir le programme'}
                          </button>
                          <details className="trip-library-manage">
                            <summary aria-label={'Gérer ' + (trip.name || 'ce voyage')}>
                              Gérer
                            </summary>
                            <div className="trip-library-manage-actions">
                              <button
                                type="button"
                                className="trip-library-button"
                                onClick={() => onDuplicate(trip)}
                              >
                                Dupliquer
                              </button>
                              <button
                                type="button"
                                className="trip-library-button"
                                onClick={() => onArchive(trip)}
                              >
                                {trip.archived_at ? 'Restaurer' : 'Archiver'}
                              </button>
                            </div>
                          </details>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}

          {!trips.length && (
            <section className="trip-library-empty">
              <h2>
                {filtered
                  ? 'Aucun voyage correspondant'
                  : 'Le prochain départ commence ici'}
              </h2>
              <p>
                {filtered
                  ? 'Essaie un autre nom ou affiche une autre catégorie.'
                  : 'Crée un voyage, ou retrouve tes anciens voyages dans le filtre Archivés.'}
              </p>
              <button
                type="button"
                className="trip-library-button"
                onClick={filtered
                  ? () => { onQuery(''); onStatus('all'); }
                  : onCreate}
              >
                {filtered ? 'Réinitialiser les filtres' : 'Créer un voyage'}
              </button>
            </section>
          )}

          <footer className="trip-library-footer">
            <a href={apkUrl}>Télécharger l’application Android</a>
            <nav aria-label="Informations légales">
              <a href="./informations.html#confidentialite">Confidentialité</a>
              <a href="./informations.html#conditions">Conditions d’utilisation</a>
              <a href="./informations.html#assistance">Assistance</a>
              <a href="./informations.html#mentions-legales">Mentions légales</a>
            </nav>
          </footer>
        </div>
      </div>
    );
  };
})();