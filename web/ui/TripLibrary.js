(function initTripLibrary() {
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
        <div className="trip-library">
          <header className="trip-library-header">
            <div>
              <h1>Mes voyages</h1>
              <p>Prépare le prochain départ. Garde chaque voyage à portée de main.</p>
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
                <div className="trip-library-group-head">
                  <h2 id={'library-' + key}>{title}</h2>
                  <span>{items.length} voyage{items.length > 1 ? 's' : ''}</span>
                </div>
                <div className="trip-library-grid">
                  {items.map(trip => (
                    <article key={trip.id} className="trip-library-card" data-status={key}>
                      <button type="button" className="trip-library-cover-button"
                        aria-label={'Ouvrir le voyage ' + (trip.name || 'sans titre')}
                        onClick={() => onOpen(trip.id)}>
                        <Cover
                          src={trip.cover_image_url || trip.coverImageUrl}
                          name={trip.name}
                        />
                      </button>
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
                        <p>{dateRange(trip) || 'Dates à définir'}</p>
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
