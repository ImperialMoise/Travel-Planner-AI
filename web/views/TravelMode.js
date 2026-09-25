(function initTravelMode() {
  function localDateISO() {
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset)
      .toISOString()
      .slice(0, 10);
  }

  function formatDate(iso) {
    if (!iso || Number.isNaN(new Date(String(iso).slice(0, 10) + 'T12:00:00').getTime())) return 'Date à préciser';

    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date(String(iso).slice(0, 10) + 'T12:00:00'));
  }

  function timeToMinutes(value) {
    const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);

    return match && Number(match[1]) < 24 && Number(match[2]) < 60
      ? Number(match[1]) * 60 + Number(match[2])
      : Number.POSITIVE_INFINITY;
  }

  function stepLabel(step) {
    return step?.label || step?.lieu || 'Étape à préciser';
  }

  function stepPlace(step) {
    return step?.lieu || step?.arrivee || step?.depart || '';
  }

  const QUICK_TOOLS = [
    {
      id: 'checklist',
      label: 'Checklist',
      icon: 'check'
    },
    {
      id: 'dayNote',
      label: 'Journal du jour',
      icon: 'sparkle'
    },
    {
      id: 'globalNote',
      label: 'Notes du voyage',
      icon: 'file'
    },
    {
      id: 'currency',
      label: 'Convertisseur',
      icon: 'arrow'
    }
  ];

  function TravelModeView() {
    const {
      trip,
      selectedDayIndex = 0
    } = Store.useStore(state => ({
      trip: state.trip,
      selectedDayIndex: state.selectedDayIndex || 0
    }));

    const [now, setNow] = React.useState(Date.now());
    const [quickTool, setQuickTool] = React.useState(null);

    React.useEffect(() => {
      const timer = window.setInterval(
        () => setNow(Date.now()),
        60000
      );

      return () => window.clearInterval(timer);
    }, []);

    if (!trip?.days?.length) return null;

    const days = trip.days;

    const dayIndex = Math.max(
      0,
      Math.min(selectedDayIndex, days.length - 1)
    );

    const day = days[dayIndex];
    const today = localDateISO();

    const todayIndex = days.findIndex(
      candidate => candidate.dateISO === today
    );

    const isToday = day.dateISO === today;

    const steps = (day.steps || [])
      .filter(
        step =>
          !['logement', 'lodging'].includes(String(step.type || '').toLowerCase())
      )
      .slice()
      .sort(
        (a, b) =>
          timeToMinutes(a.time) - timeToMinutes(b.time)
      );

    const nowDate = new Date(now);
    const nowMinutes =
      nowDate.getHours() * 60 + nowDate.getMinutes();

    let startIndex = 0;

    if (isToday) {
      const nextIndex = steps.findIndex(
        step => {
          const start = timeToMinutes(step.time);
          const end = timeToMinutes(step.timeEnd);
          return Number.isFinite(start) && (start >= nowMinutes ||
            (Number.isFinite(end) && end + (step.nextDay ? 1440 : 0) > nowMinutes));
        }
      );

      startIndex =
        nextIndex >= 0
          ? nextIndex
          : steps.findIndex(step => !Number.isFinite(timeToMinutes(step.time)));
    }

    const nextStep = steps[startIndex] || null;

    const upcomingSteps = steps;

    const lodgingStay =
      window.ItineraryUtils
        ?.findLodgingStaysForDay(days, dayIndex)
        .find(stay => stay.status !== 'checkout') || null;

    const lodging = lodgingStay?.step || null;

    const currentQuickTool = QUICK_TOOLS.find(
      tool => tool.id === quickTool
    );

    function changeDay(offset) {
      Store.set({
        selectedDayIndex: Math.max(
          0,
          Math.min(
            dayIndex + offset,
            days.length - 1
          )
        )
      });
    }

    function goToToday() {
      if (todayIndex < 0) return;

      Store.set({
        selectedDayIndex: todayIndex
      });
    }

    function returnToPlanning(view = 'itinerary') {
      try { localStorage.setItem('atelier_app_mode', 'plan'); } catch (_) {}

      Store.set({
        appMode: 'plan',
        view,
        selectedDayIndex: dayIndex
      });
    }

    function renderQuickTool() {
      if (
        quickTool === 'checklist' &&
        window.ChecklistWidget
      ) {
        return (
          <window.ChecklistWidget
            day={day}
            trip={trip}
            editMode={false}
            hideHeader
          />
        );
      }

      if (
        quickTool === 'dayNote' &&
        window.DayNoteWidget
      ) {
        return (
          <window.DayNoteWidget
            day={day}
            trip={trip}
            editMode={false}
            hideHeader
          />
        );
      }

      if (
        quickTool === 'globalNote' &&
        window.GlobalNoteWidget
      ) {
        return (
          <window.GlobalNoteWidget
            trip={trip}
            editMode={false}
            hideHeader
          />
        );
      }

      if (
        quickTool === 'currency' &&
        window.CurrencyWidget
      ) {
        return (
          <window.CurrencyWidget
            editMode={false}
          />
        );
      }

      return (
        <div className="travel-mode-empty">
          Cet outil n’est pas disponible pour le moment.
        </div>
      );
    }

    return (
      <section className="travel-mode travel-mode-v2" aria-label="Carnet de voyage">
        <div className="travel-mode-shell">
          <section
            className={
              'travel-mode-hero' +
              (day.coverImageUrl ? ' has-cover' : '')
            }
            style={
              day.coverImageUrl
                ? {
                    backgroundImage:
                      `url("${day.coverImageUrl}")`
                  }
                : undefined
            }
          >
            <div className="travel-mode-hero-content">
              <div className="travel-mode-kicker">
                {isToday ? 'Aujourd’hui' : 'Mode voyage'}
              </div>

              <div className="travel-mode-date">
                {formatDate(day.dateISO)}
              </div>

              <h1 className="travel-mode-title">
                {day.title || 'Journée à préciser'}
              </h1>

              <div className="travel-mode-day-nav">
                <button
                  type="button"
                  className="travel-mode-icon-btn"
                  onClick={() => changeDay(-1)}
                  disabled={dayIndex === 0}
                  aria-label="Journée précédente"
                >
                  <Icon name="chevleft" size={18} />
                </button>

                <label className="travel-mode-day-label">
                  <span className="screen-reader-only">Choisir une journée</span>
                  <select value={dayIndex} onChange={event => Store.set({ selectedDayIndex: Number(event.target.value) })}>
                    {days.map((item, index) => <option key={item.id || index} value={index}>Jour {index + 1} · {formatDate(item.dateISO)}</option>)}
                  </select>
                </label>

                <button
                  type="button"
                  className="travel-mode-icon-btn"
                  onClick={() => changeDay(1)}
                  disabled={dayIndex === days.length - 1}
                  aria-label="Journée suivante"
                >
                  <Icon name="chevright" size={18} />
                </button>

                {todayIndex >= 0 &&
                  dayIndex !== todayIndex && (
                    <button
                      type="button"
                      className="travel-mode-today-btn"
                      onClick={goToToday}
                    >
                      Aujourd’hui
                    </button>
                  )}
              </div>

              <div
                className="travel-mode-progress"
                role="progressbar"
                aria-label="Position de la journée sélectionnée dans le voyage"
                aria-valuemin="1"
                aria-valuemax={days.length}
                aria-valuenow={dayIndex + 1}
              >
                <span
                  style={{
                    width:
                      ((dayIndex + 1) / days.length * 100) +
                      '%'
                  }}
                />
              </div>
            </div>
          </section>

          <nav className="travel-essentials" aria-label="Essentiels du voyage">
            <button type="button" onClick={() => returnToPlanning('map')}><Icon name="map" size={20} /><span>Carte<small>Lieux et trajets</small></span></button>
            <button type="button" onClick={() => returnToPlanning('docs')}><Icon name="file" size={20} /><span>Documents<small>Billets et réservations</small></span></button>
            <button type="button" onClick={() => returnToPlanning('budget')}><Icon name="wallet" size={20} /><span>Budget<small>Suivre les dépenses</small></span></button>
          </nav>
          <div className="travel-mode-grid">
            <section
              className="travel-mode-panel"
              aria-live="polite"
            >
              <div className="travel-mode-panel-kicker">
                {isToday ? (nextStep && !Number.isFinite(timeToMinutes(nextStep.time)) ? 'À horaire libre' : 'Votre prochain repère') : 'Première étape du jour'}
              </div>
              {isToday && (
                <p className="travel-mode-clock-note">
                  Repère selon l’heure de cet appareil, sans validation des activités réalisées.
                </p>
              )}

              {nextStep ? (
                <>
                  <div className="travel-mode-next-time">
                    {nextStep.time || 'Horaire à confirmer'}
                  </div>

                  <div className="travel-mode-next-title">
                    {stepLabel(nextStep)}
                  </div>

                  {stepPlace(nextStep) && (
                    <div className="travel-mode-place">
                      {stepPlace(nextStep)}
                    </div>
                  )}

                  <button
                    type="button"
                    className="travel-mode-map-btn"
                    onClick={() => showStepOnMap(nextStep)}
                  >
                    <Icon name="map" size={14} />
                    {' '}
                    Voir sur la carte
                  </button>
                </>
              ) : (
                <div className="travel-mode-empty">
                  Aucune autre étape avec un horaire à venir. Le programme reste consultable ci-dessous.
                </div>
              )}
            </section>

            <aside className="travel-mode-panel">
              <div className="travel-mode-panel-kicker">
                Ce soir
              </div>

              {lodging ? (
                <>
                  <div className="travel-mode-next-title">
                    {stepLabel(lodging)}
                  </div>

                  {lodgingStay && (
                    <div className="travel-mode-night-label">
                      Nuit {lodgingStay.nightNumber} sur {lodgingStay.nights}
                    </div>
                  )}

                  <button
                    type="button"
                    className="travel-mode-map-btn"
                    onClick={() => returnToPlanning('itinerary')}
                  >
                    Voir les détails de l’hébergement
                  </button>

                  {stepPlace(lodging) && (
                    <div className="travel-mode-place">
                      {stepPlace(lodging)}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="travel-mode-empty">
                    Aucun hébergement renseigné pour cette
                    journée.
                  </div>

                  <button
                    type="button"
                    className="travel-mode-map-btn"
                    onClick={() =>
                      returnToPlanning('itinerary')
                    }
                  >
                    Préparer l’hébergement
                  </button>
                </>
              )}
            </aside>
          </div>

          <section
            className="travel-mode-panel"
            style={{ marginTop: 16 }}
          >
            <div className="travel-mode-program-header">
              <h2>Programme de la journée</h2>
              <span>
                {upcomingSteps.length} étape{upcomingSteps.length > 1 ? 's' : ''}
              </span>
            </div>

            {upcomingSteps.length ? (
              <div className="travel-mode-list">
                {upcomingSteps.map((step, index) => (
                  <div
                    key={step.id || index}
                    className="travel-mode-item"
                    data-next={step === nextStep ? 'true' : 'false'}
                  >
                    <div className="travel-mode-item-time">
                      {step.time || '—'}
                    </div>

                    <div>
                      <button
                        type="button"
                        className="travel-mode-item-title travel-mode-step-link"
                        onClick={() => showStepOnMap(step)}
                        aria-label={'Voir sur la carte : ' + stepLabel(step)}
                      >
                        {stepLabel(step)}
                        <Icon name="map" size={16} />
                      </button>

                      {stepPlace(step) && (
                        <div className="travel-mode-place">
                          {stepPlace(step)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="travel-mode-empty">
                Aucune activité ni aucun trajet enregistré pour cette journée.
              </div>
            )}
          </section>
          <section
            className="travel-quick-tools"
            aria-label="Outils rapides"
          >
            <div className="travel-quick-tools-head">
              Outils rapides
            </div>

            <div className="travel-quick-tools-row">
              {QUICK_TOOLS.map(tool => {
                const active = quickTool === tool.id;

                return (
                  <button
                    key={tool.id}
                    type="button"
                    className={
                      'travel-quick-tool' +
                      (active ? ' active' : '')
                    }
                    aria-pressed={active}
                    aria-controls="travel-quick-panel"
                    onClick={() =>
                      setQuickTool(
                        active ? null : tool.id
                      )
                    }
                  >
                    <Icon name={tool.icon} size={16} />
                    {tool.label}
                  </button>
                );
              })}
            </div>
          </section>

          {quickTool && (
            <section
              id="travel-quick-panel"
              className="travel-quick-panel"
              aria-live="polite"
            >
              <div className="travel-quick-panel-head">
                <strong>
                  {currentQuickTool?.label}
                </strong>

                <button
                  type="button"
                  className="travel-mode-icon-btn"
                  onClick={() => setQuickTool(null)}
                  title="Fermer cet outil"
                  aria-label="Fermer cet outil"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              {renderQuickTool()}
            </section>
          )}

        </div>
      </section>
    );
  }

  window.TravelModeView = TravelModeView;
})();
