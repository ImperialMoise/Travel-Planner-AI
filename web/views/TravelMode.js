(function initTravelMode() {
  const TRAVEL_MODE_CSS = `
  .travel-mode{
    flex:1;
    min-width:0;
    min-height:0;
    overflow:auto;
    padding:26px;
    background:var(--bg);
  }

  .travel-mode-shell{
    width:min(980px, 100%);
    margin:0 auto;
  }

  .travel-mode-hero{
    position:relative;
    min-height:230px;
    overflow:hidden;
    padding:28px;
    border:1px solid var(--outline-variant);
    border-radius:14px;
    background:var(--card);
    background-size:cover;
    background-position:center;
    box-shadow:var(--shadow-lg);
  }

  .travel-mode-hero.has-cover::after{
    content:"";
    position:absolute;
    inset:0;
    background:rgba(13,27,23,.48);
  }

  .travel-mode-hero-content{
    position:relative;
    z-index:1;
    max-width:650px;
  }

  .travel-mode-hero.has-cover .travel-mode-kicker,
  .travel-mode-hero.has-cover .travel-mode-date,
  .travel-mode-hero.has-cover .travel-mode-title{
    color:#fff;
    text-shadow:0 2px 14px rgba(0,0,0,.32);
  }

  .travel-mode-kicker{
    color:var(--accent);
    font-family:var(--font-mono);
    font-size:11px;
    font-weight:900;
    letter-spacing:.13em;
    text-transform:uppercase;
  }

  .travel-mode-date{
    margin-top:10px;
    font-size:14px;
    font-weight:800;
    color:var(--muted);
  }

  .travel-mode-title{
    margin:7px 0 0;
    font-family:var(--font-serif);
    font-size:34px;
    line-height:1.08;
    font-weight:500;
    color:var(--text);
  }

  .travel-mode-day-nav{
    display:flex;
    align-items:center;
    gap:9px;
    margin-top:22px;
  }

  .travel-mode-icon-btn{
    width:36px;
    height:36px;
    padding:0;
    border:1px solid var(--outline-variant);
    border-radius:8px;
    display:grid;
    place-items:center;
    background:var(--card);
    color:var(--text);
    cursor:pointer;
  }

  .travel-mode-icon-btn:disabled{
    opacity:.42;
    cursor:default;
  }

  .travel-mode-day-label{
    min-width:105px;
    text-align:center;
    color:var(--text);
    font-size:13px;
    font-weight:900;
  }

  .travel-mode-grid{
    display:grid;
    grid-template-columns:minmax(0, 1.35fr) minmax(260px, .65fr);
    gap:16px;
    margin-top:16px;
  }

  .travel-mode-panel{
    padding:20px;
    border:1px solid var(--outline-variant);
    border-radius:12px;
    background:var(--card);
  }

  .travel-mode-panel-kicker{
    color:var(--accent);
    font-family:var(--font-mono);
    font-size:10px;
    font-weight:900;
    letter-spacing:.12em;
    text-transform:uppercase;
  }

  .travel-mode-next-time{
    margin-top:13px;
    color:var(--accent);
    font-family:var(--font-mono);
    font-size:13px;
    font-weight:900;
  }

  .travel-mode-next-title{
    margin-top:5px;
    font-family:var(--font-serif);
    font-size:27px;
    line-height:1.12;
  }

  .travel-mode-place{
    margin-top:8px;
    color:var(--muted);
    font-size:13px;
    line-height:1.45;
  }

  .travel-mode-map-btn{
    margin-top:18px;
    min-height:38px;
    padding:0 13px;
    border:1px solid var(--accent);
    border-radius:8px;
    background:var(--accent);
    color:var(--accent-ink);
    cursor:pointer;
    font-family:inherit;
    font-size:12px;
    font-weight:900;
  }

  .travel-mode-list{
    display:flex;
    flex-direction:column;
    gap:0;
    margin-top:12px;
  }

  .travel-mode-item{
    display:grid;
    grid-template-columns:56px minmax(0, 1fr);
    gap:12px;
    padding:14px 0;
    border-top:1px solid var(--outline-variant);
  }

  .travel-mode-item-time{
    color:var(--accent);
    font-family:var(--font-mono);
    font-size:12px;
    font-weight:900;
  }

  .travel-mode-item-title{
    font-size:14px;
    font-weight:900;
  }

  .travel-mode-empty{
    margin-top:13px;
    color:var(--muted);
    font-size:13px;
    line-height:1.5;
  }

  @media(max-width:760px){
    .travel-mode{ padding:14px; }
    .travel-mode-hero{ min-height:210px; padding:22px; }
    .travel-mode-title{ font-size:29px; }
    .travel-mode-grid{ grid-template-columns:1fr; }
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
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
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
    return match ? Number(match[1]) * 60 + Number(match[2]) : Number.POSITIVE_INFINITY;
  }

  function stepLabel(step) {
    return step?.label || step?.lieu || 'Étape à préciser';
  }

  function stepPlace(step) {
    return step?.lieu || step?.arrivee || step?.depart || '';
  }

  function TravelModeView() {
    injectCss();

    const { trip, selectedDayIndex = 0 } = Store.useStore(state => ({
      trip: state.trip,
      selectedDayIndex: state.selectedDayIndex || 0
    }));

    const [now, setNow] = React.useState(Date.now());

    React.useEffect(() => {
      const timer = window.setInterval(() => setNow(Date.now()), 60000);
      return () => window.clearInterval(timer);
    }, []);

    if (!trip?.days?.length) return null;

    const days = trip.days;
    const dayIndex = Math.max(0, Math.min(selectedDayIndex, days.length - 1));
    const day = days[dayIndex];
    const today = localDateISO();
    const isToday = day.dateISO === today;

    const steps = (day.steps || [])
      .filter(step => String(step.type || '').toLowerCase() !== 'logement')
      .slice()
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    const nowDate = new Date(now);
    const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

    let startIndex = 0;

    if (isToday) {
      const nextIndex = steps.findIndex(step => timeToMinutes(step.time) >= nowMinutes);
      startIndex = nextIndex >= 0 ? nextIndex : steps.length;
    }

    const nextStep = steps[startIndex] || null;
    const upcomingSteps = steps.slice(startIndex + 1, startIndex + 4);
    const lodging = (day.steps || []).find(
      step => String(step.type || '').toLowerCase() === 'logement'
    );

    function changeDay(offset) {
      Store.set({
        selectedDayIndex: Math.max(0, Math.min(dayIndex + offset, days.length - 1))
      });
    }

    function returnToPlanning(view = 'itinerary') {
      localStorage.setItem('atelier_app_mode', 'plan');
      Store.set({ appMode: 'plan', view, selectedDayIndex: dayIndex });
    }

    return (
      <main className="travel-mode">
        <div className="travel-mode-shell">
          <section
            className={'travel-mode-hero' + (day.coverImageUrl ? ' has-cover' : '')}
            style={day.coverImageUrl ? { backgroundImage: `url("${day.coverImageUrl}")` } : undefined}
          >
            <div className="travel-mode-hero-content">
              <div className="travel-mode-kicker">
                {isToday ? 'Aujourd’hui' : 'Mode voyage'}
              </div>

              <div className="travel-mode-date">{formatDate(day.dateISO)}</div>
              <h1 className="travel-mode-title">{day.title || 'Journée à préciser'}</h1>

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

                <div className="travel-mode-day-label">Jour {dayIndex + 1}</div>

                <button
                  type="button"
                  className="travel-mode-icon-btn"
                  onClick={() => changeDay(1)}
                  disabled={dayIndex === days.length - 1}
                  aria-label="Journée suivante"
                >
                  <Icon name="chevright" size={18} />
                </button>
              </div>
            </div>
          </section>

          <div className="travel-mode-grid">
            <section className="travel-mode-panel">
              <div className="travel-mode-panel-kicker">Prochaine étape</div>

              {nextStep ? (
                <>
                  <div className="travel-mode-next-time">{nextStep.time || 'Horaire à confirmer'}</div>
                  <div className="travel-mode-next-title">{stepLabel(nextStep)}</div>

                  {stepPlace(nextStep) && (
                    <div className="travel-mode-place">{stepPlace(nextStep)}</div>
                  )}

                  <button
                    type="button"
                    className="travel-mode-map-btn"
                    onClick={() => returnToPlanning('map')}
                  >
                    <Icon name="map" size={14} /> Voir sur la carte
                  </button>
                </>
              ) : (
                <div className="travel-mode-empty">
                  Aucune autre étape programmée pour cette journée.
                </div>
              )}
            </section>

            <aside className="travel-mode-panel">
              <div className="travel-mode-panel-kicker">Ce soir</div>

              {lodging ? (
                <>
                  <div className="travel-mode-next-title">{stepLabel(lodging)}</div>
                  {stepPlace(lodging) && (
                    <div className="travel-mode-place">{stepPlace(lodging)}</div>
                  )}
                </>
              ) : (
                <div className="travel-mode-empty">
                  Aucun hébergement renseigné pour cette journée.
                </div>
              )}
            </aside>
          </div>

          <section className="travel-mode-panel" style={{ marginTop: 16 }}>
            <div className="travel-mode-panel-kicker">Ensuite</div>

            {upcomingSteps.length ? (
              <div className="travel-mode-list">
                {upcomingSteps.map((step, index) => (
                  <div key={step.id || index} className="travel-mode-item">
                    <div className="travel-mode-item-time">{step.time || '—'}</div>
                    <div>
                      <div className="travel-mode-item-title">{stepLabel(step)}</div>
                      {stepPlace(step) && (
                        <div className="travel-mode-place">{stepPlace(step)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="travel-mode-empty">
                Le reste de la journée est libre pour le moment.
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  window.TravelModeView = TravelModeView;
})();