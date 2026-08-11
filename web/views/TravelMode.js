(function initTravelMode() {
  const TRAVEL_MODE_CSS = `
    .travel-mode {
      flex: 1;
      min-width: 0;
      min-height: 0;
      overflow: auto;
      padding: 30px;
      background:
        radial-gradient(
          circle at 8% 0,
          rgba(150, 100, 13, 0.09),
          transparent 28rem
        ),
        linear-gradient(180deg, var(--bg), var(--inset));
      scroll-behavior: smooth;
    }

    .travel-mode-shell {
      width: min(1240px, 100%);
      margin: 0 auto;
    }

    .travel-mode-hero {
      position: relative;
      min-height: 260px;
      overflow: hidden;
      padding: 34px;
      border: 1px solid rgba(150, 100, 13, 0.18);
      border-radius: 24px;
      background: var(--card);
      background-position: center;
      background-size: cover;
      box-shadow: 0 20px 54px rgba(54, 42, 27, 0.12);
    }

    .travel-mode-hero.has-cover::after {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(
          90deg,
          rgba(13, 27, 23, 0.78) 0%,
          rgba(13, 27, 23, 0.48) 52%,
          rgba(13, 27, 23, 0.16) 100%
        );
    }

    .travel-mode-hero-content {
      position: relative;
      z-index: 1;
      max-width: 720px;
    }

    .travel-mode-kicker {
      width: fit-content;
      padding: 6px 10px;
      border: 1px solid rgba(150, 100, 13, 0.18);
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.13em;
      text-transform: uppercase;
    }

    .travel-mode-date {
      margin-top: 12px;
      color: var(--muted);
      font-size: 14px;
      font-weight: 800;
    }

    .travel-mode-title {
      max-width: 680px;
      margin: 7px 0 0;
      color: var(--text);
      font-family: var(--font-serif);
      font-size: clamp(34px, 5vw, 52px);
      font-weight: 500;
      line-height: 1.08;
      letter-spacing: -0.035em;
    }

    .travel-mode-hero.has-cover .travel-mode-kicker,
    .travel-mode-hero.has-cover .travel-mode-date,
    .travel-mode-hero.has-cover .travel-mode-title {
      color: #fff;
      text-shadow: 0 2px 14px rgba(0, 0, 0, 0.32);
    }

    .travel-mode-hero.has-cover .travel-mode-kicker {
      border-color: rgba(255, 255, 255, 0.28);
      background: rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    .travel-mode-day-nav {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 24px;
    }

    .travel-mode-icon-btn {
      width: 46px;
      height: 46px;
      padding: 0;
      border: 1px solid rgba(150, 100, 13, 0.18);
      border-radius: 13px;
      display: grid;
      place-items: center;
      background: var(--card);
      color: var(--text);
      cursor: pointer;
      box-shadow: 0 5px 16px rgba(54, 42, 27, 0.08);
      touch-action: manipulation;
      transition:
        transform 0.18s ease,
        border-color 0.18s ease,
        background 0.18s ease,
        box-shadow 0.18s ease;
    }

    .travel-mode-icon-btn:disabled {
      opacity: 0.42;
      cursor: default;
      box-shadow: none;
    }

    .travel-mode-day-label {
      min-width: 128px;
      min-height: 46px;
      display: grid;
      place-items: center;
      padding: 0 13px;
      border: 1px solid rgba(150, 100, 13, 0.16);
      border-radius: 13px;
      background: var(--card);
      color: var(--text);
      box-shadow: 0 5px 16px rgba(54, 42, 27, 0.06);
      font-size: 13px;
      font-weight: 900;
      text-align: center;
    }

    .travel-mode-today-btn {
      min-height: 46px;
      padding: 0 16px;
      border: 1px solid rgba(150, 100, 13, 0.22);
      border-radius: 13px;
      background: var(--accent-soft);
      color: var(--accent);
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      font-weight: 900;
      touch-action: manipulation;
      transition:
        transform 0.18s ease,
        background 0.18s ease,
        box-shadow 0.18s ease;
    }

    .travel-mode-progress {
      width: min(360px, 100%);
      height: 6px;
      margin-top: 14px;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(150, 100, 13, 0.12);
    }

    .travel-mode-progress span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--accent);
      transition: width 0.3s ease;
    }

    .travel-mode-hero.has-cover .travel-mode-progress {
      background: rgba(255, 255, 255, 0.22);
    }

    .travel-mode-hero.has-cover .travel-mode-progress span {
      background: #fff;
    }

    .travel-quick-tools {
      margin-top: 22px;
    }

    .travel-quick-tools-head {
      margin-bottom: 10px;
      color: var(--muted);
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .travel-quick-tools-row {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 2px 2px 8px;
      scrollbar-width: none;
      scroll-snap-type: x proximity;
      overscroll-behavior-x: contain;
    }

    .travel-quick-tools-row::-webkit-scrollbar {
      display: none;
    }

    .travel-quick-tool {
      min-width: 150px;
      min-height: 46px;
      flex: 0 0 auto;
      padding: 0 15px;
      border: 1px solid rgba(150, 100, 13, 0.16);
      border-radius: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      background: var(--card);
      color: var(--text);
      cursor: pointer;
      box-shadow: 0 5px 16px rgba(54, 42, 27, 0.055);
      font-family: inherit;
      font-size: 12px;
      font-weight: 900;
      white-space: nowrap;
      scroll-snap-align: start;
      touch-action: manipulation;
      transition:
        transform 0.18s ease,
        background 0.18s ease,
        border-color 0.18s ease,
        box-shadow 0.18s ease;
    }

    .travel-quick-tool.active {
      border-color: var(--accent);
      background: var(--accent);
      color: var(--accent-ink);
      box-shadow: 0 7px 20px var(--accent-shadow);
    }

    .travel-quick-panel {
      margin-top: 14px;
      padding: 20px;
      border: 1px solid rgba(150, 100, 13, 0.16);
      border-radius: 20px;
      background: var(--card);
      box-shadow: 0 10px 30px rgba(54, 42, 27, 0.07);
    }

    .travel-quick-panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
      color: var(--text);
      font-size: 13px;
    }

    .travel-mode-grid {
      display: grid;
      grid-template-columns:
        minmax(0, 1.35fr)
        minmax(260px, 0.65fr);
      gap: 18px;
      margin-top: 20px;
    }

    .travel-mode-panel {
      padding: 22px;
      border: 1px solid rgba(150, 100, 13, 0.14);
      border-radius: 20px;
      background: var(--card);
      box-shadow: 0 9px 28px rgba(54, 42, 27, 0.065);
    }

    .travel-mode-grid > .travel-mode-panel:first-child {
      border-color: rgba(150, 100, 13, 0.22);
      background:
        linear-gradient(
          135deg,
          var(--card),
          var(--accent-soft)
        );
    }

    .travel-mode-panel-kicker {
      color: var(--accent);
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .travel-mode-next-time {
      margin-top: 16px;
      color: var(--accent);
      font-family: var(--font-mono);
      font-size: 14px;
      font-weight: 900;
    }

    .travel-mode-next-title {
      margin-top: 7px;
      font-family: var(--font-serif);
      font-size: clamp(25px, 3vw, 34px);
      line-height: 1.12;
      letter-spacing: -0.025em;
    }

    .travel-mode-place {
      margin-top: 8px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.55;
    }

    .travel-mode-map-btn {
      min-height: 46px;
      margin-top: 18px;
      padding: 0 16px;
      border: 1px solid var(--accent);
      border-radius: 12px;
      background: var(--accent);
      color: var(--accent-ink);
      cursor: pointer;
      box-shadow: 0 7px 18px var(--accent-shadow);
      font-family: inherit;
      font-size: 12px;
      font-weight: 900;
      touch-action: manipulation;
      transition:
        transform 0.18s ease,
        box-shadow 0.18s ease;
    }

    .travel-mode-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
    }

    .travel-mode-item {
      display: grid;
      grid-template-columns: 62px minmax(0, 1fr);
      gap: 14px;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--inset);
      transition:
        transform 0.18s ease,
        border-color 0.18s ease,
        box-shadow 0.18s ease;
    }

    .travel-mode-item-time {
      color: var(--accent);
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 900;
    }

    .travel-mode-item-title {
      font-size: 14px;
      font-weight: 900;
      line-height: 1.4;
    }

    .travel-mode-empty {
      margin-top: 13px;
      padding: 12px 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
    }

    .travel-mode button:focus-visible {
      outline: 3px solid rgba(150, 100, 13, 0.24);
      outline-offset: 3px;
    }

    @media (hover: hover) and (pointer: fine) {
      .travel-mode-icon-btn:not(:disabled):hover,
      .travel-mode-today-btn:hover,
      .travel-quick-tool:hover,
      .travel-mode-map-btn:hover {
        transform: translateY(-2px);
      }

      .travel-mode-icon-btn:not(:disabled):hover {
        border-color: var(--accent);
        background: var(--accent-soft);
      }

      .travel-quick-tool:hover {
        border-color: var(--accent);
        background: var(--accent-soft);
        color: var(--accent);
      }

      .travel-quick-tool.active:hover {
        background: var(--accent);
        color: var(--accent-ink);
      }

      .travel-mode-item:hover {
        transform: translateY(-2px);
        border-color: rgba(150, 100, 13, 0.24);
        box-shadow: 0 8px 20px rgba(54, 42, 27, 0.07);
      }
    }

    @media (max-width: 760px) {
      .travel-mode {
        padding:
          12px
          max(12px, env(safe-area-inset-right))
          calc(28px + env(safe-area-inset-bottom))
          max(12px, env(safe-area-inset-left));
        background: var(--bg);
      }

      .travel-mode-hero {
        min-height: 240px;
        padding: 20px;
        border-radius: 20px;
      }

      .travel-mode-hero.has-cover::after {
        background:
          linear-gradient(
            180deg,
            rgba(13, 27, 23, 0.28),
            rgba(13, 27, 23, 0.76)
          );
      }

      .travel-mode-title {
        font-size: clamp(30px, 9vw, 40px);
      }

      .travel-mode-day-nav {
        width: 100%;
      }

      .travel-mode-icon-btn {
        width: 48px;
        height: 48px;
      }

      .travel-mode-day-label {
        min-width: 110px;
        min-height: 48px;
        flex: 1;
      }

      .travel-mode-today-btn {
        min-height: 48px;
      }

      .travel-mode-progress {
        width: 100%;
      }

      .travel-quick-tools-row {
        margin-right: -12px;
        padding-right: 12px;
      }

      .travel-quick-tool {
        min-width: 145px;
        min-height: 48px;
      }

      .travel-quick-panel,
      .travel-mode-panel {
        padding: 17px;
        border-radius: 17px;
      }

      .travel-mode-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .travel-mode-map-btn {
        width: 100%;
        min-height: 48px;
      }

      .travel-mode-item {
        grid-template-columns: 54px minmax(0, 1fr);
        padding: 13px;
      }
    }

    @media (max-width: 380px) {
      .travel-mode-hero {
        padding: 17px;
      }

      .travel-mode-title {
        font-size: 29px;
      }

      .travel-mode-day-nav {
        display: grid;
        grid-template-columns: 48px minmax(0, 1fr) 48px;
      }

      .travel-mode-today-btn {
        grid-column: 1 / -1;
        width: 100%;
      }

      .travel-mode-next-title {
        font-size: 25px;
      }

      .travel-mode-item {
        grid-template-columns: 46px minmax(0, 1fr);
        gap: 10px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .travel-mode,
      .travel-mode * {
        scroll-behavior: auto !important;
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;

  let cssLoaded = false;

  function injectCss() {
    if (cssLoaded) return;

    cssLoaded = true;

    const style = document.createElement('style');
    style.textContent = TRAVEL_MODE_CSS;
    document.head.appendChild(style);
  }

  function localDateISO() {
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset)
      .toISOString()
      .slice(0, 10);
  }

  function formatDate(iso) {
    if (!iso) return 'Date à préciser';

    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date(String(iso) + 'T12:00:00'));
  }

  function timeToMinutes(value) {
    const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);

    return match
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
    injectCss();

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
          String(step.type || '').toLowerCase() !== 'logement'
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
        step => timeToMinutes(step.time) >= nowMinutes
      );

      startIndex =
        nextIndex >= 0
          ? nextIndex
          : steps.length;
    }

    const nextStep = steps[startIndex] || null;

    const upcomingSteps = steps.slice(
      startIndex + 1,
      startIndex + 4
    );

    const lodging = (day.steps || []).find(
      step =>
        String(step.type || '').toLowerCase() === 'logement'
    );

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
      localStorage.setItem(
        'atelier_app_mode',
        'plan'
      );

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
      <main className="travel-mode">
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

                <div className="travel-mode-day-label">
                  Jour {dayIndex + 1} sur {days.length}
                </div>

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
                aria-label="Progression dans le voyage"
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

          <div className="travel-mode-grid">
            <section
              className="travel-mode-panel"
              aria-live="polite"
            >
              <div className="travel-mode-panel-kicker">
                Prochaine étape
              </div>

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
                    onClick={() =>
                      returnToPlanning('map')
                    }
                  >
                    <Icon name="map" size={14} />
                    {' '}
                    Voir sur la carte
                  </button>
                </>
              ) : (
                <div className="travel-mode-empty">
                  Aucune autre étape programmée pour cette
                  journée.
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
            <div className="travel-mode-panel-kicker">
              Ensuite
            </div>

            {upcomingSteps.length ? (
              <div className="travel-mode-list">
                {upcomingSteps.map((step, index) => (
                  <div
                    key={step.id || index}
                    className="travel-mode-item"
                  >
                    <div className="travel-mode-item-time">
                      {step.time || '—'}
                    </div>

                    <div>
                      <div className="travel-mode-item-title">
                        {stepLabel(step)}
                      </div>

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
                Le reste de la journée est libre pour le
                moment.
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  window.TravelModeView = TravelModeView;
})();