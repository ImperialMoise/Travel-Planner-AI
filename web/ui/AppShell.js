// ════════════════════════════════════════════════════════════
// AppShell.js — Coquille principale refactorisée
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Gérer la structure globale de l’app.
// - Afficher la topbar.
// - Afficher le sélecteur de jours.
// - Afficher la vue active : itinéraire, carte, budget, docs.
// - Afficher la Toolbox refactorisée.
// - Gérer connexion, création voyage, chargement voyage.
// - Ne plus contenir les widgets Toolbox internes.
//
// Dépendances globales :
// - React
// - ReactDOM
// - Store
// - Icon
// - Btn
// - window.SB
// - window.Toolbox
// - window.ItineraryView
// - window.MapView
// - window.BudgetView
// - window.DocsView
// - window.SettingsModal
// - window.ItineraryUtils
//
// Export :
// - window.AppShell
// - window.ErrorBoundary
// - window.selectTrip
//
// ════════════════════════════════════════════════════════════

(function initAppShell() {
  const U = window.ItineraryUtils || {};

  const APP_SHELL_CSS = `
  .app-shell{
    height:100dvh;
    max-height:100dvh;
    width:100vw;
    max-width:100vw;
    display:flex;
    flex-direction:column;
    overflow:hidden;
    background:var(--bg);
    color:var(--text);
  }

  .app-main{
    flex:1 1 0;
    height:0;
    min-height:0;
    min-width:0;
    display:flex;
    overflow:hidden;
  }

  .app-view{
    flex:1 1 0;
    width:0;
    min-width:0;
    height:100%;
    min-height:0;
    display:flex;
    flex-direction:column;
    overflow:hidden;
  }

  .app-overlay{
    position:fixed;
    inset:0;
    background:rgba(21,48,42,.28);
    backdrop-filter:blur(4px);
    -webkit-backdrop-filter:blur(4px);
    display:flex;
    z-index:800;
  }

  .app-overlay.left{
    justify-content:flex-start;
  }

  .app-overlay.right{
    justify-content:flex-end;
  }

  .app-floating{
    position:fixed;
    bottom:18px;
    z-index:700;
    height:52px;
    min-width:52px;
    border-radius:999px;
    border:1px solid var(--outline-variant);
    background:var(--card);
    color:var(--text);
    box-shadow:var(--shadow-lg);
    cursor:pointer;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    font-family:inherit;
    font-size:13px;
    font-weight:900;
  }

  .app-floating.days{
    left:18px;
    padding:0 16px;
  }

  .app-floating.tools{
    right:18px;
    width:52px;
    background:var(--accent);
    color:var(--accent-ink);
  }

  .topbar{
    height:64px;
    flex-shrink:0;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:16px;
    padding:0 16px;
    background:var(--topbar);
    border-bottom:1px solid var(--outline-variant);
    position:relative;
    z-index:100;
  }

  .topbar.compact{
    height:56px;
    padding:0 10px;
    gap:10px;
  }

  .topbar-brand{
    font-family:var(--font-serif);
    font-style:italic;
    font-size:26px;
    line-height:32px;
    color:var(--accent);
    white-space:nowrap;
    cursor:pointer;
  }

  .topbar.compact .topbar-brand{
    font-size:22px;
    line-height:28px;
  }

  .topbar-left,
  .topbar-right,
  .topbar-nav{
    display:flex;
    align-items:center;
  }

  .topbar-left{
    gap:24px;
    min-width:0;
  }

  .topbar.compact .topbar-left{
    gap:10px;
  }

  .topbar-right{
    gap:8px;
    flex-shrink:0;
  }

  .topbar-nav{
    gap:4px;
    flex-shrink:0;
  }

  .topbar-nav-btn{
    border:none;
    background:transparent;
    color:var(--muted);
    cursor:pointer;
    font-size:13px;
    font-weight:700;
    font-family:inherit;
    padding:8px 16px;
    border-radius:999px;
    transition:all .2s;
  }

  .topbar-nav-btn.active{
    background:var(--accent);
    color:var(--accent-ink);
  }

  .topbar.compact .topbar-nav-btn{
    font-size:12px;
    padding:7px 10px;
  }

  .topbar-icon-btn{
    width:36px;
    height:36px;
    border-radius:50%;
    background:transparent;
    border:none;
    color:var(--faint);
    cursor:pointer;
    display:grid;
    place-items:center;
  }

  .trip-switcher{
    position:relative;
  }

  .trip-switcher-btn{
    display:flex;
    align-items:center;
    gap:8px;
    padding:6px 12px;
    background:var(--inset);
    border:1px solid var(--outline-variant);
    border-radius:9px;
    cursor:pointer;
    font-size:13px;
    font-weight:700;
    font-family:inherit;
    color:var(--text);
    max-width:240px;
  }

  .trip-switcher-label{
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    max-width:180px;
  }

  .topbar.compact .trip-switcher-label{
    max-width:110px;
  }

  .trip-menu{
    position:absolute;
    top:calc(100% + 7px);
    left:0;
    min-width:275px;
    max-height:365px;
    overflow-y:auto;
    background:var(--card);
    border:1px solid var(--outline-variant);
    border-radius:14px;
    padding:6px;
    box-shadow:var(--shadow-lg);
    z-index:300;
  }

  .trip-menu-btn{
    width:100%;
    border:none;
    border-radius:10px;
    padding:9px 10px;
    cursor:pointer;
    font-size:13px;
    font-weight:700;
    font-family:inherit;
    text-align:left;
    display:flex;
    align-items:center;
    gap:8px;
    background:transparent;
    color:var(--text);
  }

  .trip-menu-btn.active{
    background:var(--accent-soft);
    color:var(--accent);
  }

  .user-pill{
    display:flex;
    align-items:center;
    gap:8px;
    padding:6px 10px 6px 12px;
    background:transparent;
    border:1px solid var(--outline-variant);
    border-radius:999px;
    cursor:pointer;
    font-size:13px;
    font-weight:700;
    font-family:inherit;
    color:var(--text);
  }

  .user-avatar{
    width:26px;
    height:26px;
    border-radius:50%;
    background:var(--accent);
    color:var(--accent-ink);
    display:grid;
    place-items:center;
    font-size:11px;
    font-weight:900;
    flex-shrink:0;
  }

  .day-spine{
    height:100%;
    min-height:0;
    flex-shrink:0;
    border-right:1px solid var(--outline-variant);
    background:var(--inset);
    display:flex;
    flex-direction:column;
    overflow:hidden;
  }

  .day-spine-head{
    flex-shrink:0;
    padding:18px 16px 14px;
    border-bottom:1px solid var(--outline-variant);
    background:var(--card);
  }

  .day-spine-kicker{
    font-size:11px;
    font-weight:800;
    letter-spacing:.14em;
    text-transform:uppercase;
    color:var(--faint,#827567);
  }

  .day-spine-title{
    margin-top:4px;
    font-family:var(--font-sans);
    font-weight:800;
    font-size:17px;
    line-height:22px;
    color:var(--text);
  }

  .day-spine-meta{
    margin-top:6px;
    display:inline-flex;
    align-items:center;
    gap:5px;
    font-size:11px;
    color:var(--faint,#827567);
    font-family:var(--font-mono,monospace);
    background:var(--inset);
    padding:4px 8px;
    border-radius:6px;
  }

  .day-spine-scroll{
    flex:1 1 0;
    min-height:0;
    overflow-y:auto;
    padding:10px 10px 18px;
  }

  .day-card{
    position:relative;
    width:100%;
    border:none;
    background:transparent;
    color:var(--text);
    border-radius:10px;
    padding:8px 10px;
    text-align:left;
    cursor:pointer;
    font-family:inherit;
    display:flex;
    align-items:flex-start;
    gap:10px;
    transition:background .15s;
    margin-bottom:2px;
  }

  .day-card:hover{
    background:var(--card);
  }

  .day-card.active{
    background:rgba(124,84,16,.08);
    border:1px solid rgba(124,84,16,.18);
    border-radius:12px;
    padding:10px;
    margin-bottom:4px;
  }

  .day-card-num{
    width:34px;
    height:34px;
    border-radius:10px;
    background:var(--card);
    border:1px solid var(--outline-variant);
    color:var(--faint,#827567);
    display:grid;
    place-items:center;
    flex-shrink:0;
    font-size:12px;
    font-weight:800;
    font-family:var(--font-serif);
    transition:all .15s;
  }

  .day-card:hover .day-card-num{
    border-color:var(--accent);
  }

  .day-card.active .day-card-num{
    width:38px;
    height:38px;
    background:var(--accent);
    border-color:var(--accent);
    color:var(--accent-ink);
    font-size:14px;
    box-shadow:0 2px 8px rgba(124,84,16,.20);
  }

  .day-card-body{
    flex:1;
    min-width:0;
    padding-top:1px;
  }

  .day-card-title{
    font-size:13.5px;
    font-weight:700;
    line-height:18px;
    color:var(--text);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }

  .day-card.active .day-card-title{
    font-weight:800;
    color:var(--text);
  }

  .day-card-date{
    margin-top:2px;
    font-size:11.5px;
    line-height:15px;
    color:var(--faint,#827567);
    font-weight:500;
  }

  .day-card.active .day-card-date{
    color:var(--accent);
    font-weight:600;
  }

  .day-card-tags{
    display:flex;
    flex-wrap:wrap;
    gap:4px;
    margin-top:6px;
  }

  .day-card-tag{
    display:inline-flex;
    align-items:center;
    gap:3px;
    font-size:10px;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:.03em;
    padding:2px 7px;
    border-radius:999px;
    background:var(--card);
    color:var(--faint,#827567);
    border:1px solid var(--outline-variant);
  }

  .day-card.active .day-card-tag{
    background:var(--accent);
    color:var(--accent-ink);
    border-color:var(--accent);
    box-shadow:0 1px 3px rgba(124,84,16,.15);
  }

  .day-card-note{
    display:block;
    margin-top:3px;
    margin-left:-4px;
    max-width:100%;
    border-radius:6px;
    padding:2px 4px;
    color:var(--faint,#827567);
    cursor:text;
    font-size:11px;
    font-style:italic;
    line-height:15px;
    outline:none;
    overflow:hidden;
    text-overflow:ellipsis;
    transition:background .15s;
    white-space:nowrap;
  }

  .day-card-note:hover{
    background:rgba(124,84,16,.05);
  }

  .day-card-note:focus{
    background:var(--card);
    border:1px solid var(--outline-variant);
    white-space:normal;
    box-shadow:0 2px 8px rgba(82,98,91,.08);
  }

  .day-card-note:empty::before{
    content:'+ note…';
    color:var(--outline-variant);
    font-style:italic;
  }

  .empty-screen{
    flex:1;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    text-align:center;
    padding:40px;
    gap:15px;
    color:var(--text);
  }

  .empty-screen-title{
    font-family:var(--font-serif);
    font-style:italic;
    font-size:36px;
    line-height:42px;
    color:var(--text);
  }

  .empty-screen-text{
    color:var(--muted);
    max-width:440px;
    line-height:1.6;
    font-size:15px;
  }

  .modal-backdrop{
    position:fixed;
    inset:0;
    z-index:5000;
    background:rgba(0,0,0,.56);
    backdrop-filter:blur(6px);
    -webkit-backdrop-filter:blur(6px);
    display:flex;
    align-items:center;
    justify-content:center;
    padding:16px;
  }

  .modal-card{
    width:100%;
    max-width:430px;
    max-height:90vh;
    display:flex;
    flex-direction:column;
    background:var(--card);
    border:1px solid var(--outline-variant);
    border-radius:18px;
    box-shadow:var(--shadow-lg);
    overflow:hidden;
    color:var(--text);
  }

  .modal-head{
    padding:16px 20px;
    flex-shrink:0;
    display:flex;
    align-items:center;
    justify-content:space-between;
    border-bottom:1px solid var(--outline-variant);
    background:var(--soft);
  }

  .modal-title{
    font-family:var(--font-serif);
    font-style:italic;
    font-size:24px;
    line-height:30px;
  }

  .modal-body{
    padding:20px;
    overflow-y:auto;
  }

  .field{
    margin-bottom:12px;
  }

  .field-label{
    font-size:11px;
    font-weight:900;
    color:var(--muted);
    text-transform:uppercase;
    letter-spacing:.08em;
    margin-bottom:6px;
  }

  .field input{
    width:100%;
    background:var(--inset);
    border:1px solid var(--outline-variant);
    border-radius:10px;
    padding:10px 12px;
    color:var(--text);
    font-family:inherit;
    font-size:14px;
    outline:none;
  }

  .mode-tabs{
    display:flex;
    gap:6px;
    background:var(--inset);
    border-radius:999px;
    padding:4px;
    margin-bottom:14px;
  }

  .mode-tab{
    flex:1;
    border:none;
    cursor:pointer;
    background:transparent;
    color:var(--muted);
    border-radius:999px;
    padding:7px 12px;
    font-size:13px;
    font-weight:900;
    font-family:inherit;
  }

  .mode-tab.active{
    background:var(--accent);
    color:var(--accent-ink);
  }

  .simple-btn{
    border:1px solid var(--outline-variant);
    background:var(--card);
    color:var(--text);
    border-radius:999px;
    min-height:38px;
    padding:0 14px;
    cursor:pointer;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:7px;
    font-family:inherit;
    font-size:13px;
    font-weight:900;
  }

  .simple-btn.primary{
    border-color:var(--accent);
    background:var(--accent);
    color:var(--accent-ink);
  }

  .simple-btn.ghost{
    background:transparent;
  }

  .boot{
    min-height:100dvh;
    display:grid;
    place-items:center;
    background:var(--bg);
    color:var(--muted);
  }

  .boot-inner{
    text-align:center;
  }

  .boot-mark{
    width:58px;
    height:58px;
    border-radius:18px;
    display:grid;
    place-items:center;
    margin:0 auto 14px;
    background:var(--accent);
    color:var(--accent-ink);
    font-family:var(--font-serif);
    font-style:italic;
    font-size:24px;
  }

  .boot-label{
    font-size:13px;
    font-weight:800;
    letter-spacing:.08em;
    text-transform:uppercase;
  }

  @media(max-width:1180px){
    .topbar{
      gap:8px;
    }

    .topbar-nav{
      gap:2px;
    }
  }

  @media(max-width:760px){
    .topbar{
      overflow-x:auto;
      scrollbar-width:none;
    }

    .topbar::-webkit-scrollbar{
      display:none;
    }

    .topbar-right .user-name{
      display:none;
    }

    .empty-screen-title{
      font-size:30px;
      line-height:36px;
    }
  }
  `;

  function injectCss() {
    if (document.getElementById('app-shell-refactor-css')) return;

    const style = document.createElement('style');
    style.id = 'app-shell-refactor-css';
    style.textContent = APP_SHELL_CSS;
    document.head.appendChild(style);
  }

  function safeString(value) {
    if (U.safeString) return U.safeString(value);
    return String(value == null ? '' : value).trim();
  }

  function formatDayDate(iso) {
    if (U.formatDayDate) return U.formatDayDate(iso);

    if (!iso) return '';

    const date = new Date(String(iso) + 'T12:00:00');

    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  function getDisplayDayTitle(day) {
    if (U.getDisplayDayTitle) return U.getDisplayDayTitle(day);

    return safeString(day && day.title) || 'Journée libre';
  }

  function isRestaurantStep(step) {
    if (U.isRestaurantStep) return U.isRestaurantStep(step);

    const type = safeString(step && step.type).toLowerCase();
    return type === 'restaurant' || type === 'table';
  }

  function isLodgingStep(step) {
    if (U.isLodgingStep) return U.isLodgingStep(step);

    return safeString(step && step.type).toLowerCase() === 'logement';
  }

  function isTransportStep(step) {
    if (U.isTransportStep) return U.isTransportStep(step);

    return safeString(step && step.type).toLowerCase() === 'transport';
  }

  function countDayTags(day) {
    const steps = Array.isArray(day && day.steps) ? day.steps : [];

    return {
      steps: steps.length,
      restaurants: steps.filter(isRestaurantStep).length,
      lodgings: steps.filter(isLodgingStep).length,
      transports: steps.filter(isTransportStep).length
    };
  }

  function useWindowWidth() {
    const [width, setWidth] = React.useState(function initialWidth() {
      return typeof window === 'undefined' ? 1440 : window.innerWidth;
    });

    React.useEffect(function listenResize() {
      function update() {
        setWidth(window.innerWidth);
      }

      window.addEventListener('resize', update);
      return function cleanup() {
        window.removeEventListener('resize', update);
      };
    }, []);

    return width;
  }

  function AppButton({
    children,
    onClick,
    variant,
    icon,
    style,
    type,
    disabled,
    title
  }) {
    return (
      <button
        type={type || 'button'}
        title={title}
        onClick={onClick}
        disabled={disabled}
        className={'simple-btn' + (variant ? ' ' + variant : '')}
        style={style}
      >
        {icon ? <Icon name={icon} size={15} /> : null}
        {children}
      </button>
    );
  }

  function ErrorBoundary(props) {
    return (
      <ErrorBoundaryClass>
        {props.children}
      </ErrorBoundaryClass>
    );
  }

  class ErrorBoundaryClass extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        hasError: false,
        error: null
      };
    }

    static getDerivedStateFromError(error) {
      return {
        hasError: true,
        error
      };
    }

    componentDidCatch(error, info) {
      console.error('ErrorBoundary:', error, info);
    }

    render() {
      if (!this.state.hasError) return this.props.children;

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, var(--bg), var(--soft))',
            padding: 24,
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 24,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              marginBottom: 24
            }}
          >
            <Icon name="map" size={34} />
          </div>

          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 8
            }}
          >
            Interruption de voyage
          </div>

          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 40,
              lineHeight: '48px',
              color: 'var(--text)',
              marginBottom: 16
            }}
          >
            L’Atelier fait une pause
          </div>

          <p
            style={{
              fontSize: 15.5,
              lineHeight: '22px',
              color: 'var(--muted)',
              maxWidth: 480,
              marginBottom: 28
            }}
          >
            Une erreur a interrompu l’affichage. Recharge la page ou retente sans recharger.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              width: 280
            }}
          >
            <AppButton
              variant="primary"
              onClick={() => window.location.reload()}
              style={{ width: '100%' }}
            >
              Recharger la page
            </AppButton>

            <AppButton
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ width: '100%' }}
            >
              Retenter sans recharger
            </AppButton>
          </div>
        </div>
      );
    }
  }

  function AppShell() {
    injectCss();

    const {
      user,
      authReady,
      view,
      activeTripId,
      trip,
      toast,
      settingsOpen
    } = Store.useStore(function select(state) {
      return {
        user: state.user,
        authReady: state.authReady,
        view: state.view || 'itinerary',
        activeTripId: state.activeTripId,
        trip: state.trip,
        toast: state.toast,
        settingsOpen: state.settingsOpen
      };
    });

    const width = useWindowWidth();

    const isCompactShell = width < 1320;
    const isNarrowShell = width < 1100;
    const isTinyShell = width < 900;
    const isTopbarCompact = width < 1180;

    const sideWidth = isCompactShell ? 260 : 300;
    const toolWidth = isCompactShell ? 280 : 320;

    const [toolboxOpen, setToolboxOpen] = React.useState(false);
    const [daySpineOpen, setDaySpineOpen] = React.useState(false);

    const CurrentView = getCurrentView(view);

    if (!authReady) {
      return (
        <div className="boot">
          <div className="boot-inner">
            <div className="boot-mark">VP</div>
            <div className="boot-label">Connexion à Supabase…</div>
          </div>
        </div>
      );
    }

    return (
      <div className="app-shell">
        <Topbar compact={isTopbarCompact} />

        <main className="app-main">
          {!user ? (
            <LoggedOutHome />
          ) : !activeTripId ? (
            <NoTripHome />
          ) : !trip ? (
            <LoadingTrip />
          ) : (
            <>
              {!isTinyShell && (
                <DaySpine width={sideWidth} />
              )}

              {isTinyShell && daySpineOpen && (
                <div
                  className="app-overlay left"
                  onClick={() => setDaySpineOpen(false)}
                >
                  <div
                    onClick={event => event.stopPropagation()}
                    style={{
                      height: '100%',
                      maxWidth: 320,
                      width: '86vw'
                    }}
                  >
                    <DaySpine
                      width="100%"
                      onPickDay={() => setDaySpineOpen(false)}
                    />
                  </div>
                </div>
              )}

              <section className="app-view">
                {CurrentView ? (
                  <CurrentView />
                ) : (
                  <div
                    style={{
                      padding: 40,
                      color: 'var(--muted)'
                    }}
                  >
                    Vue inconnue : {view}
                  </div>
                )}
              </section>

              {!isNarrowShell && window.Toolbox && (
                <window.Toolbox width={toolWidth} />
              )}

              {isNarrowShell && toolboxOpen && window.Toolbox && (
                <div
                  className="app-overlay right"
                  onClick={() => setToolboxOpen(false)}
                >
                  <div
                    onClick={event => event.stopPropagation()}
                    style={{
                      height: '100%',
                      maxWidth: 330,
                      width: '88vw'
                    }}
                  >
                    <window.Toolbox width="100%" />
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {isTinyShell && user && activeTripId && trip && (
          <button
            type="button"
            className="app-floating days"
            onClick={() => setDaySpineOpen(true)}
            title="Ouvrir les jours"
          >
            <Icon name="cal" size={18} />
            Jours
          </button>
        )}

        {isNarrowShell && user && activeTripId && trip && (
          <button
            type="button"
            className="app-floating tools"
            onClick={() => setToolboxOpen(true)}
            title="Ouvrir la boîte à outils"
          >
            <Icon name="gear" size={20} />
          </button>
        )}

        {settingsOpen && window.SettingsModal && (
          <window.SettingsModal />
        )}

        {toast && (
          <div className="toast show">
            {toast.msg}
          </div>
        )}
      </div>
    );
  }

  function getCurrentView(view) {
    if (view === 'itinerary') return window.ItineraryView;
    if (view === 'map') return window.MapView;
    if (view === 'budget') return window.BudgetView;
    if (view === 'docs') return window.DocsView;

    return window.ItineraryView;
  }

  function Topbar({ compact }) {
    const {
      user,
      trips,
      activeTripId,
      trip,
      view,
      theme = localStorage.getItem('it_theme') || 'light'
    } = Store.useStore(function select(state) {
      return {
        user: state.user,
        trips: state.trips || [],
        activeTripId: state.activeTripId,
        trip: state.trip,
        view: state.view || 'itinerary',
        theme: state.theme || localStorage.getItem('it_theme') || 'light'
      };
    });

    const [authOpen, setAuthOpen] = React.useState(false);
    const [tripMenuOpen, setTripMenuOpen] = React.useState(false);
    const [newTripOpen, setNewTripOpen] = React.useState(false);

    const menuRef = React.useRef(null);

    React.useEffect(function openInviteAuth() {
      if (!user && localStorage.getItem('pendingTripInvite')) {
        setAuthOpen(true);
      }
    }, [user]);

    React.useEffect(function closeTripMenuOnOutsideClick() {
      if (!tripMenuOpen) return;

      function onClick(event) {
        if (!menuRef.current || menuRef.current.contains(event.target)) return;
        setTripMenuOpen(false);
      }

      document.addEventListener('click', onClick);
      return function cleanup() {
        document.removeEventListener('click', onClick);
      };
    }, [tripMenuOpen]);

    const pseudo =
      user &&
      (
        user.user_metadata?.display_name ||
        user.email?.split('@')[0] ||
        ''
      );

    const initials = safeString(pseudo || 'VP').slice(0, 2).toUpperCase();
    const displayName = safeString(pseudo);
    const compactDisplayName = displayName.length > 14
      ? displayName.slice(0, 13) + '…'
      : displayName;

    const navItems = [
      {
        id: 'itinerary',
        label: compact ? 'Plan' : 'Itinéraire'
      },
      {
        id: 'map',
        label: 'Carte'
      },
      {
        id: 'budget',
        label: compact ? '€' : 'Budget'
      },
      {
        id: 'docs',
        label: compact ? 'Docs' : 'Docs'
      }
    ];

    function toggleTheme() {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';

      localStorage.setItem('it_theme', nextTheme);
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');

      Store.set({
        theme: nextTheme
      });
    }

    return (
      <header className={'topbar' + (compact ? ' compact' : '')}>
        <div className="topbar-left">
          <div
            className="topbar-brand"
            onClick={() => Store.set({
              activeTripId: null,
              trip: null,
              selectedDayIndex: 0,
              selectedStepId: null
            })}
          >
            L&apos;Atelier
          </div>

          {user && (
            <div
              ref={menuRef}
              className="trip-switcher"
            >
              <button
                type="button"
                className="trip-switcher-btn"
                onClick={() => setTripMenuOpen(open => !open)}
              >
                <span className="trip-switcher-label">
                  {trip?.name || (activeTripId ? 'Chargement…' : 'Choisir un voyage')}
                </span>

                <Icon
                  name="chevdown"
                  size={14}
                  style={{ color: 'var(--faint)', flexShrink: 0 }}
                />
              </button>

              {tripMenuOpen && (
                <div className="trip-menu">
                  {!trips.length && (
                    <div
                      style={{
                        padding: '12px 10px',
                        fontSize: 13,
                        color: 'var(--faint)'
                      }}
                    >
                      Aucun voyage pour le moment.
                    </div>
                  )}

                  {trips.map(function renderTripButton(item) {
                    const active = item.id === activeTripId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={'trip-menu-btn' + (active ? ' active' : '')}
                        onClick={() => {
                          setTripMenuOpen(false);
                          selectTrip(item.id);
                        }}
                      >
                        <Icon name="map" size={13} />

                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.name}
                        </span>

                        {item.start_date && (
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--faint)',
                              flexShrink: 0
                            }}
                          >
                            {formatDayDate(item.start_date)}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <div
                    style={{
                      height: 1,
                      background: 'var(--outline-variant)',
                      margin: '6px 4px'
                    }}
                  />

                  <button
                    type="button"
                    className="trip-menu-btn"
                    style={{ color: 'var(--accent)' }}
                    onClick={() => {
                      setTripMenuOpen(false);
                      setNewTripOpen(true);
                    }}
                  >
                    <Icon name="plus" size={13} />
                    Nouveau voyage
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="topbar-nav">
          {navItems.map(function renderNavItem(item) {
            const active = view === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={'topbar-nav-btn' + (active ? ' active' : '')}
                onClick={() => Store.set({ view: item.id })}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="topbar-right">
          {user ? (
            <>
              <button
                type="button"
                className="topbar-icon-btn"
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                onClick={toggleTheme}
              >
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
              </button>

              <button
                type="button"
                className="topbar-icon-btn"
                title="Paramètres"
                onClick={() => Store.set({ settingsOpen: true })}
              >
                <Icon name="gear" size={18} />
              </button>

              <div
                style={{
                  width: 1,
                  height: 24,
                  background: 'var(--outline-variant)',
                  margin: '0 4px',
                  opacity: 0.5
                }}
              />

              <button
                type="button"
                className="user-pill"
                onClick={() => Store.set({ settingsOpen: true })}
                title={displayName}
              >
                <span className="user-name">
                  {compactDisplayName}
                </span>

                <span className="user-avatar">
                  {initials}
                </span>
              </button>
            </>
          ) : (
            <AppButton
              variant="primary"
              icon="user"
              onClick={() => setAuthOpen(true)}
            >
              Connexion
            </AppButton>
          )}
        </div>

        {authOpen && (
          <AuthModal onClose={() => setAuthOpen(false)} />
        )}

        {newTripOpen && (
          <NewTripModal onClose={() => setNewTripOpen(false)} />
        )}
      </header>
    );
  }

  function DaySpine({ width = 300, onPickDay }) {
    const {
      trip,
      selectedDayIndex = 0
    } = Store.useStore(function select(state) {
      return {
        trip: state.trip,
        selectedDayIndex: state.selectedDayIndex || 0
      };
    });

    if (!trip || !Array.isArray(trip.days)) return null;

    const days = trip.days;
    const selected = Math.min(
      Math.max(0, selectedDayIndex),
      Math.max(0, days.length - 1)
    );

    function selectDay(index) {
      Store.set({
        selectedDayIndex: index,
        selectedStepId: null
      });

      if (onPickDay) onPickDay(index);
    }

    function handleNoteBlur(day, event) {
      const newNote = (event.target.textContent || '').trim();
      const oldNote = (day.note || '').trim();

      if (newNote === oldNote) return;

      if (window.SB && window.SB.updateDay && trip.id) {
        window.SB.updateDay(day.id, { note: newNote }).then(function () {
          return window.SB.loadTrip(trip.id);
        }).then(function (refreshed) {
          if (refreshed) Store.set({ trip: refreshed });
        }).catch(function (err) {
          console.error('Note save failed:', err);
        });
      }
    }

    function handleNoteKeyDown(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.target.blur();
      }
    }

    return (
      <aside
        className="day-spine"
        style={{ width }}
      >
        <div className="day-spine-head">
          <div className="day-spine-kicker">
            Itinéraire actif
          </div>

          <div className="day-spine-title">
            {trip.name || 'Mon voyage'}
          </div>

          {trip.startDate && trip.endDate && (
            <div className="day-spine-meta">
              <Icon name="cal" size={12} />
              {formatDayDate(trip.startDate)} → {formatDayDate(trip.endDate)}
            </div>
          )}
        </div>

        <div className="day-spine-scroll">

          {days.map(function renderDay(day, index) {
            const active = index === selected;
            const tags = countDayTags(day);
            const title = getDisplayDayTitle(day);
            const dateStr = formatDayDate(day.dateISO) || '';
            const stepCount = tags.steps || 0;

            return (
              <button
                key={day.id || index}
                type="button"
                className={'day-card' + (active ? ' active' : '')}
                onClick={() => selectDay(index)}
              >
                <span className="day-card-num">
                  J{index + 1}
                </span>

                <span className="day-card-body">
                  <span className="day-card-title">
                    {title}
                  </span>

                  <span className="day-card-date">
                    {dateStr}
                    {dateStr && stepCount ? ' · ' : ''}
                    {stepCount ? stepCount + ' étape' + (stepCount > 1 ? 's' : '') : ''}
                  </span>

                  <span className="day-card-tags">
                    {tags.transports > 0 && (
                      <span className="day-card-tag">
                        {tags.transports} Transport{tags.transports > 1 ? 's' : ''}
                      </span>
                    )}

                    {tags.restaurants > 0 && (
                      <span className="day-card-tag">
                        {tags.restaurants} Resto{tags.restaurants > 1 ? 's' : ''}
                      </span>
                    )}

                    {tags.lodgings > 0 && (
                      <span className="day-card-tag">
                        Logement
                      </span>
                    )}
                  </span>

                  <span
                    className="day-card-note"
                    contentEditable
                    suppressContentEditableWarning
                    onClick={function (e) { e.stopPropagation(); }}
                    onBlur={function (e) { handleNoteBlur(day, e); }}
                    onKeyDown={handleNoteKeyDown}
                    dangerouslySetInnerHTML={{
                      __html: day.note || ''
                    }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  function LoggedOutHome() {
    const [authOpen, setAuthOpen] = React.useState(false);

    return (
      <div className="empty-screen">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <Icon name="map" size={30} />
        </div>

        <div className="empty-screen-title">
          Bienvenue dans <span style={{ color: 'var(--accent)' }}>L&apos;Atelier</span>
        </div>

        <p className="empty-screen-text">
          Planifie tes voyages à plusieurs : itinéraire, carte, budget et documents au même endroit.
        </p>

        <AppButton
          variant="primary"
          icon="user"
          onClick={() => setAuthOpen(true)}
        >
          Se connecter / Créer un compte
        </AppButton>

        {authOpen && (
          <AuthModal onClose={() => setAuthOpen(false)} />
        )}
      </div>
    );
  }

  function NoTripHome() {
    const [newOpen, setNewOpen] = React.useState(false);

    const { trips = [] } = Store.useStore(function select(state) {
      return {
        trips: state.trips || []
      };
    });

    return (
      <div className="empty-screen">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <Icon name="map" size={30} />
        </div>

        <div className="empty-screen-title">
          {trips.length ? 'Choisis un voyage' : 'Crée ton premier voyage'}
        </div>

        <p className="empty-screen-text">
          {trips.length
            ? 'Utilise le sélecteur en haut pour ouvrir un voyage existant, ou crée-en un nouveau.'
            : 'Donne-lui un nom, des dates, et commence à planifier.'}
        </p>

        <AppButton
          variant="primary"
          icon="plus"
          onClick={() => setNewOpen(true)}
        >
          Nouveau voyage
        </AppButton>

        {newOpen && (
          <NewTripModal onClose={() => setNewOpen(false)} />
        )}
      </div>
    );
  }

  function LoadingTrip() {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)'
        }}
      >
        Chargement du voyage…
      </div>
    );
  }

  function AuthModal({ onClose }) {
    const [mode, setMode] = React.useState('login');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [pseudo, setPseudo] = React.useState('');
    const [error, setError] = React.useState('');
    const [busy, setBusy] = React.useState(false);

    async function submit() {
      setError('');
      setBusy(true);

      try {
        if (mode === 'login') {
          await window.SB.signIn(email.trim(), password);
        } else {
          await window.SB.signUp(email.trim(), password, pseudo.trim() || null);
        }

        onClose();
      } catch (err) {
        setError(err.message || 'Erreur');
      } finally {
        setBusy(false);
      }
    }

    return (
      <ModalShell
        title={mode === 'login' ? 'Connexion' : 'Créer un compte'}
        onClose={onClose}
      >
        <div className="mode-tabs">
          <button
            type="button"
            className={'mode-tab' + (mode === 'login' ? ' active' : '')}
            onClick={() => setMode('login')}
          >
            Se connecter
          </button>

          <button
            type="button"
            className={'mode-tab' + (mode === 'signup' ? ' active' : '')}
            onClick={() => setMode('signup')}
          >
            Créer un compte
          </button>
        </div>

        {mode === 'signup' && (
          <Field label="Pseudo">
            <input
              value={pseudo}
              onChange={event => setPseudo(event.target.value)}
              placeholder="Ton prénom ou pseudo"
              autoComplete="nickname"
            />
          </Field>
        )}

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="votre@email.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Mot de passe">
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </Field>

        {error && (
          <div
            style={{
              color: 'var(--danger, #c0563f)',
              fontSize: 13,
              marginTop: 4
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <AppButton
            variant="primary"
            onClick={submit}
            disabled={busy}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '11px'
            }}
          >
            {busy ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </AppButton>
        </div>
      </ModalShell>
    );
  }

  function NewTripModal({ onClose }) {
    const [name, setName] = React.useState('');
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');
    const [days, setDays] = React.useState(7);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState('');

    function diffDaysInclusive(startISO, endISO) {
      if (U.diffDaysInclusive) return U.diffDaysInclusive(startISO, endISO);

      if (!startISO || !endISO) return 1;

      const start = new Date(String(startISO) + 'T12:00:00');
      const end = new Date(String(endISO) + 'T12:00:00');
      const diff = Math.round((end - start) / 86400000);

      return Math.max(1, diff + 1);
    }

    function addDaysISO(baseISO, diff) {
      if (U.addDaysISO) return U.addDaysISO(baseISO, diff);

      if (!baseISO) return '';

      const date = new Date(String(baseISO) + 'T12:00:00');
      date.setDate(date.getDate() + Number(diff || 0));

      return date.toISOString().slice(0, 10);
    }

    function updateStartDate(value) {
      setStartDate(value);

      if (value && days) {
        setEndDate(addDaysISO(value, Math.max(1, Number(days) || 1) - 1));
      }
    }

    function updateEndDate(value) {
      setEndDate(value);

      if (startDate && value) {
        setDays(diffDaysInclusive(startDate, value));
      }
    }

    function updateDays(value) {
      const nextDays = Math.max(1, Number(value) || 1);

      setDays(nextDays);

      if (startDate) {
        setEndDate(addDaysISO(startDate, nextDays - 1));
      }
    }

    async function submit() {
      if (!name.trim() || busy) return;

      setError('');
      setBusy(true);

      try {
        const created = await window.SB.createTrip({
          name: name.trim(),
          startDate: startDate || null,
          endDate: endDate || null,
          days: Math.max(1, Number(days) || 1)
        });

        const trips = await window.SB.listMyTrips();
        const fullTrip = await window.SB.loadTrip(created.id);

        Store.set({
          trips,
          activeTripId: created.id,
          trip: fullTrip,
          selectedDayIndex: 0,
          selectedStepId: null,
          view: 'itinerary'
        });

        Store.showToast('Voyage « ' + created.name + ' » créé ✓');
        onClose();
      } catch (err) {
        setError(err.message || 'Erreur de création');
      } finally {
        setBusy(false);
      }
    }

    return (
      <ModalShell
        title="Nouveau voyage"
        onClose={onClose}
      >
        <Field label="Nom du voyage">
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Corée du Sud, Lisbonne…"
            autoFocus
          />
        </Field>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12
          }}
        >
          <Field label="Départ">
            <input
              type="date"
              value={startDate}
              onChange={event => updateStartDate(event.target.value)}
            />
          </Field>

          <Field label="Retour">
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={event => updateEndDate(event.target.value)}
            />
          </Field>
        </div>

        <Field label="Nombre de jours">
          <input
            type="number"
            min="1"
            max="90"
            value={days}
            onChange={event => updateDays(event.target.value)}
          />
        </Field>

        {error && (
          <div
            style={{
              color: 'var(--danger, #c0563f)',
              fontSize: 13,
              marginTop: 4
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            display: 'flex',
            gap: 8
          }}
        >
          <AppButton
            variant="ghost"
            onClick={onClose}
            disabled={busy}
            style={{
              flex: 1,
              justifyContent: 'center'
            }}
          >
            Annuler
          </AppButton>

          <AppButton
            variant="primary"
            onClick={submit}
            disabled={busy}
            style={{
              flex: 1,
              justifyContent: 'center'
            }}
          >
            {busy ? '...' : 'Créer le voyage'}
          </AppButton>
        </div>
      </ModalShell>
    );
  }

  function Field({ label, children }) {
    return (
      <div className="field">
        <div className="field-label">
          {label}
        </div>

        {children}
      </div>
    );
  }

  function ModalShell({ title, onClose, children }) {
    React.useEffect(function listenEscape() {
      function onKeyDown(event) {
        if (event.key === 'Escape') onClose();
      }

      document.addEventListener('keydown', onKeyDown);
      return function cleanup() {
        document.removeEventListener('keydown', onKeyDown);
      };
    }, [onClose]);

    return ReactDOM.createPortal(
      <div
        className="modal-backdrop"
        onClick={onClose}
      >
        <div
          className="modal-card"
          onClick={event => event.stopPropagation()}
        >
          <div className="modal-head">
            <div className="modal-title">
              {title}
            </div>

            <button
              type="button"
              className="topbar-icon-btn"
              onClick={onClose}
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          <div className="modal-body">
            {children}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  async function selectTrip(tripId) {
    if (!tripId) return;

    Store.set({
      activeTripId: tripId,
      trip: null,
      selectedDayIndex: 0,
      selectedStepId: null,
      pendingEditStepId: null,
      view: 'itinerary'
    });

    try {
      const fullTrip = await window.SB.loadTrip(tripId);

      Store.set({
        trip: fullTrip
      });

      if (window.SB.subscribeTrip) {
        window.SB.subscribeTrip(tripId, function onTripChanged() {
          window.SB.loadTrip(tripId)
            .then(function updateTrip(nextTrip) {
              if (Store.get().activeTripId === tripId) {
                Store.set({
                  trip: nextTrip
                });
              }
            })
            .catch(function ignoreRealtimeError() {});
        });
      }
    } catch (error) {
      Store.showToast('Erreur chargement : ' + (error.message || error));

      Store.set({
        activeTripId: null,
        trip: null
      });
    }
  }

  window.ErrorBoundary = ErrorBoundaryClass;
  window.AppShell = AppShell;
  window.selectTrip = selectTrip;
})();
