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
  function createClientPerformanceLog() {
    const metrics = {
      ttfbMs: null,
      domContentLoadedMs: null,
      loadMs: null,
      lcpMs: null,
      cls: 0
    };

    function roundMilliseconds(
      value
    ) {
      const number =
        Number(value);

      return Number.isFinite(number)
        ? Math.round(number)
        : null;
    }

    function readNavigationMetrics() {
      const navigation =
        performance
          .getEntriesByType(
            'navigation'
          )?.[0];

      if (!navigation) return;

      metrics.ttfbMs =
        roundMilliseconds(
          navigation.responseStart
        );

      metrics.domContentLoadedMs =
        roundMilliseconds(
          navigation
            .domContentLoadedEventEnd
        );

      metrics.loadMs =
        navigation.loadEventEnd > 0
          ? roundMilliseconds(
              navigation.loadEventEnd
            )
          : null;
    }

    function observePerformance(
      type,
      callback
    ) {
      if (
        !window.PerformanceObserver ||
        !window.PerformanceObserver
          .supportedEntryTypes
          ?.includes(type)
      ) {
        return;
      }

      try {
        const observer =
          new PerformanceObserver(
            function readEntries(list) {
              callback(
                list.getEntries()
              );
            }
          );

        observer.observe({
          type,
          buffered: true
        });
      } catch (error) {
        console.warn(
          `Mesure ${type} indisponible :`,
          error
        );
      }
    }

    readNavigationMetrics();

    window.addEventListener(
      'load',
      readNavigationMetrics,
      {
        once: true
      }
    );

    observePerformance(
      'largest-contentful-paint',
      function recordLargestPaint(
        entries
      ) {
        const lastEntry =
          entries[
            entries.length - 1
          ];

        if (lastEntry) {
          metrics.lcpMs =
            roundMilliseconds(
              lastEntry.startTime
            );
        }
      }
    );

    observePerformance(
      'layout-shift',
      function recordLayoutShift(
        entries
      ) {
        entries.forEach(
          function addLayoutShift(
            entry
          ) {
            if (
              !entry.hadRecentInput
            ) {
              metrics.cls +=
                Number(
                  entry.value
                ) || 0;
            }
          }
        );
      }
    );

    function snapshot() {
      readNavigationMetrics();

      return {
        ...metrics,
        cls:
          Number(
            metrics.cls.toFixed(4)
          ),
        connection:
          navigator.connection
            ?.effectiveType ||
          'inconnue',
        dataSaver:
          Boolean(
            navigator.connection
              ?.saveData
          ),
        viewport:
          `${window.innerWidth}x${window.innerHeight}`
      };
    }

    return {
      snapshot
    };
  }

  if (
    !window.ClientPerformance
  ) {
    window.ClientPerformance =
      createClientPerformanceLog();
  }

  function createClientErrorLog() {
    const STORAGE_KEY =
      'lfav_client_errors';

    function sanitizeText(
      value,
      maximumLength = 800
    ) {
      return String(value || '')
        .replace(
          /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
          '[email masqué]'
        )
        .replace(
          /(access_token|refresh_token|token|code|invite)=([^&\s]+)/gi,
          '$1=[masqué]'
        )
        .slice(0, maximumLength);
    }

    function readErrors() {
      try {
        const storedErrors =
          JSON.parse(
            sessionStorage.getItem(
              STORAGE_KEY
            ) || '[]'
          );

        return Array.isArray(
          storedErrors
        )
          ? storedErrors
          : [];
      } catch (error) {
        return [];
      }
    }

    function capture(
      error,
      context = {}
    ) {
      const entry = {
        id:
          window.crypto?.randomUUID
            ? window.crypto.randomUUID()
            : String(Date.now()),
        date: new Date().toISOString(),
        source: sanitizeText(
          context.source ||
          'javascript',
          80
        ),
        message: sanitizeText(
          error?.message ||
          error ||
          'Erreur inconnue'
        ),
        file: sanitizeText(
          context.file || '',
          240
        ),
        line:
          Number(context.line) || null,
        column:
          Number(context.column) || null,
        page:
          window.location.pathname,
        online:
          navigator.onLine
      };

      try {
        const nextErrors = [
          ...readErrors(),
          entry
        ].slice(-5);

        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(nextErrors)
        );
      } catch (storageError) {
        console.warn(
          'Journal local indisponible :',
          storageError
        );
      }

      return entry;
    }

    function buildDiagnostic(
      currentError
    ) {
      return [
        'Diagnostic — La Fabrique à Voyages',
        '',
        'Date : ' +
          new Date().toISOString(),
        'Page : ' +
          window.location.pathname,
        'Connexion : ' +
          (
            navigator.onLine
              ? 'en ligne'
              : 'hors ligne'
          ),
        'Navigateur : ' +
          navigator.userAgent,
        '',
        'Performances :',
        JSON.stringify(
          window.ClientPerformance
            ?.snapshot?.() || {},
          null,
          2
        ),
        '',
        'Erreur actuelle : ' +
          sanitizeText(
            currentError?.message ||
            currentError ||
            'Non précisée'
          ),
        '',
        'Erreurs récentes :',
        JSON.stringify(
          readErrors(),
          null,
          2
        )
      ].join('\n');
    }

    return {
      capture,
      buildDiagnostic
    };
  }

  if (!window.ClientErrorLog) {
    window.ClientErrorLog =
      createClientErrorLog();

    window.addEventListener(
      'error',
      function captureWindowError(
        event
      ) {
        window.ClientErrorLog.capture(
          event.error ||
          event.message,
          {
            source: 'window.error',
            file: event.filename,
            line: event.lineno,
            column: event.colno
          }
        );
      }
    );

    window.addEventListener(
      'unhandledrejection',
      function captureRejectedPromise(
        event
      ) {
        window.ClientErrorLog.capture(
          event.reason,
          {
            source:
              'unhandledrejection'
          }
        );
      }
    );
  }

  const U = window.ItineraryUtils || {};
  const ANDROID_APK_URL =
    'https://github.com/ImperialMoise/Travel-Planner-AI/releases/download/android-latest/la-fabrique-a-voyages.apk';
    const TRIP_ACCENTS = {
    ochre: { accent: '#9d680c', soft: '#f4ead7', ink: '#fffaf1', shadow: 'rgba(157,104,12,.26)' },
    forest: { accent: '#2f6a55', soft: '#e2f0e8', ink: '#f7fffb', shadow: 'rgba(47,106,85,.25)' },
    ocean: { accent: '#2f617b', soft: '#e2eef4', ink: '#f8fcff', shadow: 'rgba(47,97,123,.25)' },
    terracotta: { accent: '#a45132', soft: '#f6e6df', ink: '#fffaf8', shadow: 'rgba(164,81,50,.25)' },
    plum: { accent: '#71506c', soft: '#efe5ed', ink: '#fffaff', shadow: 'rgba(113,80,108,.25)' }
  };

  function getTripAccent(theme) {
    return TRIP_ACCENTS[theme] || TRIP_ACCENTS.ochre;
  }

  const APP_SHELL_CSS = `
  .skip-link{
    position:fixed;
    top:10px;
    left:50%;
    z-index:3000;
    padding:10px 16px;
    border-radius:999px;
    background:var(--accent);
    color:var(--accent-ink);
    font-size:13px;
    font-weight:900;
    text-decoration:none;
    box-shadow:var(--shadow-lg);
    transform:translate(-50%,-180%);
    transition:transform .18s ease;
  }

  .skip-link:focus{
    transform:translate(-50%,0);
    outline:3px solid var(--card);
    outline-offset:3px;
  }

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

  .web-mobile-banner{
    display:none;
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
    height:68px;
    flex-shrink:0;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:16px;
    padding:0 22px;
    background:var(--topbar);
    border-bottom:1px solid var(--line);
    box-shadow:0 4px 18px rgba(54,42,27,.055);
    backdrop-filter:blur(18px) saturate(135%);
    -webkit-backdrop-filter:blur(18px) saturate(135%);
    position:relative;
    z-index:100;
  }

  .topbar.compact{
    height:58px;
    padding:0 12px;
    gap:10px;
  }

  .topbar-brand{
    display:flex;
    align-items:center;
    gap:7px;
    border:0;
    background:transparent;
    font-family:var(--font-serif);
    font-style:italic;
    font-size:26px;
    line-height:1;
    letter-spacing:-.025em;
    color:var(--text);
    white-space:nowrap;
    cursor:pointer;
    transition:
      transform .2s var(--ease-out),
      color .2s ease;
  }

  .topbar-brand:hover{
    transform:translateY(-1px);
    color:var(--accent);
  }

  .topbar-brand:focus-visible{
    outline:3px solid var(--accent-soft);
    outline-offset:5px;
    border-radius:6px;
  }

  .topbar-brand:hover{
    transform:translateY(-1px);
    filter:brightness(.92);
  }

  .topbar-brand-short{
  display:none;
}

.topbar-brand-suffix{
  font-family:inherit;
  font-size:inherit;
  font-style:inherit;
  font-weight:inherit;
  letter-spacing:0;
  text-transform:none;
  color:inherit;
}

  .topbar.compact .topbar-brand{
    font-size:22px;
  }

  .topbar.compact .topbar-brand-suffix{
    display:none;
  }

  .topbar-left,
  .topbar-right,
  .topbar-nav{
    display:flex;
    align-items:center;
  }

  .topbar-left{
    gap:22px;
    min-width:0;
  }

  .topbar.compact .topbar-left{
    gap:10px;
  }

  .topbar-right{
    gap:10px;
    flex-shrink:0;
  }

  .topbar-nav{
    gap:4px;
    flex-shrink:0;
    padding:4px;
    border:1px solid var(--line);
    border-radius:13px;
    background:rgba(243,238,228,.74);
  }

  .topbar-nav-btn{
    min-height:40px;
    border:1px solid transparent;
    background:transparent;
    color:var(--muted);
    cursor:pointer;
    font-size:13px;
    font-weight:800;
    font-family:inherit;
    padding:8px 15px;
    border-radius:9px;
    transition:
      transform .18s var(--ease-out),
      box-shadow .18s ease,
      background .18s ease,
      color .18s ease;
  }

  .topbar-nav-btn:hover{
    transform:translateY(-1px);
    background:rgba(255,253,249,.84);
    color:var(--text);
  }

  .topbar-nav-btn:focus-visible{
    outline:3px solid var(--accent-soft);
    outline-offset:2px;
  }

  .topbar-nav-btn.active{
    background:var(--accent);
    color:var(--accent-ink);
    box-shadow:0 5px 14px var(--accent-shadow);
  }

  .topbar-nav-btn.active:hover{
    transform:translateY(-1px);
    box-shadow:0 7px 18px var(--accent-shadow);
  }

  .topbar.compact .topbar-nav-btn{
    min-height:40px;
    font-size:12px;
    padding:7px 10px;
  }

  .trip-switcher{
    position:relative;
  }

  .trip-switcher-btn{
    display:flex;
    align-items:center;
    gap:9px;
    min-height:40px;
    padding:7px 12px;
    background:var(--card);
    border:1px solid var(--line);
    border-radius:12px;
    cursor:pointer;
    font-size:13px;
    font-weight:800;
    font-family:inherit;
    color:var(--text);
    max-width:250px;
    box-shadow:0 3px 12px rgba(54,42,27,.045);
    transition:
      transform .18s var(--ease-out),
      box-shadow .18s ease,
      border-color .18s ease;
  }

  .trip-switcher-btn:hover{
    transform:translateY(-1px);
    border-color:rgba(150,100,13,.34);
    box-shadow:0 8px 20px rgba(54,42,27,.09);
  }

  .trip-switcher-btn:focus-visible{
    outline:3px solid var(--accent-soft);
    outline-offset:2px;
  }

  .trip-switcher-btn:hover{
    transform:translateY(-1px);
    border-color:rgba(157, 104, 12, .35);
    box-shadow:0 5px 12px rgba(66, 48, 18, .09);
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
    top:calc(100% + 8px);
    left:0;
    min-width:285px;
    max-height:365px;
    overflow-y:auto;
    background:var(--card);
    border:1px solid var(--outline-variant);
    border-radius:12px;
    padding:6px;
    box-shadow:var(--shadow-lg);
    z-index:300;
  }

  .trip-menu-btn{
    width:100%;
    border:1px solid transparent;
    border-radius:8px;
    padding:10px;
    cursor:pointer;
    font-size:13px;
    font-weight:800;
    font-family:inherit;
    text-align:left;
    display:flex;
    align-items:center;
    gap:8px;
    background:transparent;
    color:var(--text);
    transition:background .16s ease, transform .16s ease;
  }

  .trip-menu-btn:hover{
    background:var(--bg-2);
    transform:translateX(2px);
  }

  .trip-menu-btn.active{
    background:var(--accent-soft);
    color:var(--accent);
  }

  .places-control{
    position:relative;
    display:flex;
    align-items:center;
    gap:5px;
    padding:4px 6px 4px 8px;
    border:1px solid var(--outline-variant);
    border-radius:9px;
    background:var(--inset);
  }

  .places-usage{
    min-height:26px;
    display:inline-flex;
    align-items:center;
    gap:5px;
    padding:0 5px;
    border:none;
    border-radius:6px;
    background:transparent;
    color:var(--muted);
    font-family:var(--font-mono, ui-monospace);
    font-size:11px;
    font-weight:900;
    white-space:nowrap;
    cursor:pointer;
  }

  .places-usage:hover{
    color:var(--accent);
    background:var(--card);
  }

  .places-usage.reached{
    color:var(--danger, #c0563f);
  }

  .places-mode-control{
    display:inline-flex;
    align-items:center;
    gap:5px;
    padding-left:7px;
    border-left:1px solid var(--outline-variant);
    color:var(--muted);
    font-size:11px;
    font-weight:900;
    cursor:pointer;
    white-space:nowrap;
  }

  .places-mode-input{
    position:absolute;
    opacity:0;
    pointer-events:none;
  }

  .places-mode-track{
    width:28px;
    height:16px;
    padding:2px;
    display:flex;
    align-items:center;
    border-radius:999px;
    background:var(--line);
    transition:background .18s ease;
  }

  .places-mode-knob{
    width:12px;
    height:12px;
    border-radius:50%;
    background:var(--card);
    box-shadow:0 1px 3px rgba(0,0,0,.2);
    transition:transform .18s ease;
  }

  .places-mode-input:checked + .places-mode-track{
    background:var(--accent);
  }

  .places-mode-input:checked + .places-mode-track .places-mode-knob{
    transform:translateX(12px);
  }

  .places-help-btn{
    width:28px;
    height:28px;
    padding:0;
    border:1px solid var(--outline-variant);
    border-radius:50%;
    background:var(--card);
    color:var(--muted);
    display:grid;
    place-items:center;
    font-size:11px;
    font-weight:900;
    cursor:help;
  }

  .topbar-account{
    display:flex;
    align-items:center;
    gap:7px;
    padding-left:10px;
    border-left:1px solid var(--outline-variant);
  }

  .topbar-settings-btn{
    width:34px;
    height:34px;
    border:1px solid transparent;
    border-radius:8px;
    background:transparent;
    color:var(--muted);
    cursor:pointer;
    display:grid;
    place-items:center;
    transition:transform .18s ease, background .18s ease, box-shadow .18s ease, color .18s ease;
  }

  .topbar-settings-btn:hover{
    transform:translateY(-2px) rotate(10deg);
    background:var(--card);
    color:var(--accent);
    box-shadow:0 5px 12px rgba(66, 48, 18, .10);
  }

  .topbar-settings-btn.topbar-print-btn{
    display:grid;
  }

  .topbar-settings-btn.topbar-print-btn:hover{
    transform:translateY(-2px);
  }

  .user-pill{
    display:flex;
    align-items:center;
    gap:8px;
    min-height:34px;
    padding:4px 7px 4px 11px;
    background:var(--card);
    border:1px solid var(--outline-variant);
    border-radius:9px;
    cursor:pointer;
    font-size:13px;
    font-weight:800;
    font-family:inherit;
    color:var(--text);
    transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  }

  .user-pill:hover{
    transform:translateY(-2px);
    border-color:rgba(157, 104, 12, .35);
    box-shadow:0 5px 12px rgba(66, 48, 18, .10);
  }

  .user-avatar{
    width:25px;
    height:25px;
    border-radius:50%;
    background:var(--accent);
    color:var(--accent-ink);
    display:grid;
    place-items:center;
    font-size:10px;
    font-weight:900;
    flex-shrink:0;
  }

  @media(max-width:900px){
    .places-mode-label,
    .user-name{
      display:none;
    }

    .topbar-account{
      padding-left:6px;
    }
  }

  @media(max-width:760px){
    .places-usage-label{
      display:none;
    }

    .places-control{
      gap:4px;
      padding-left:5px;
    }

    .places-mode-control{
      padding-left:5px;
    }
  }


.day-spine{
  height:100%;
  min-height:0;
  flex-shrink:0;
  display:flex;
  flex-direction:column;
  width:292px;
  background:
    linear-gradient(
      180deg,
      rgba(255,253,249,.98),
      rgba(243,238,228,.92)
    );
  border-right:1px solid var(--line);
  box-shadow:8px 0 28px rgba(54,42,27,.045);
  overflow:hidden;
}

.day-spine-head{
  padding:24px 20px 20px;
  border-bottom:1px solid var(--line);
  background:rgba(255,253,249,.82);
  backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);
}

.day-spine-eyebrow,
.day-spine-kicker{
  font-family:var(--font-mono);
  font-size:10px;
  line-height:14px;
  letter-spacing:.16em;
  text-transform:uppercase;
  color:var(--muted);
  font-weight:800;
}

.day-spine-title{
  margin-top:7px;
  font-family:var(--font-serif);
  font-size:26px;
  line-height:31px;
  letter-spacing:-.025em;
  color:var(--text);
}

.day-spine-meta{
  margin-top:8px;
  display:flex;
  align-items:center;
  gap:7px;
  font-size:12px;
  line-height:16px;
  color:var(--muted);
}

.day-spine-scroll{
  position:relative;
  flex:1;
  min-height:0;
  overflow:auto;
  padding:18px 14px 24px;
}

.day-spine-scroll::before{
  content:"";
  position:absolute;
  left:35px;
  top:24px;
  bottom:24px;
  width:1px;
  background:linear-gradient(180deg,transparent,var(--outline-variant),var(--outline-variant),transparent);
  opacity:.9;
}

.day-card{
  position:relative;
  z-index:1;
  width:100%;
  display:grid;
  grid-template-columns:42px minmax(0,1fr);
  gap:12px;
  align-items:flex-start;
  padding:12px 10px;
  margin:0 0 9px;
  border:1px solid transparent;
  border-radius:16px;
  background:transparent;
  cursor:pointer;
  text-align:left;
  color:inherit;
  font-family:inherit;
  transition:
    background .2s ease,
    border-color .2s ease,
    box-shadow .2s ease,
    transform .2s var(--ease-out);
}

.day-card:hover{
  transform:translateX(2px);
  background:rgba(255,253,249,.82);
  border-color:var(--line);
}

.day-card:focus-visible{
  outline:3px solid var(--accent-soft);
  outline-offset:2px;
}

.day-card.active{
  transform:translateX(3px);
  background:var(--card);
  border-color:rgba(150,100,13,.28);
  box-shadow:0 12px 28px rgba(54,42,27,.10);
}

.day-card.active::before{
  content:"";
  position:absolute;
  left:-1px;
  top:12px;
  bottom:12px;
  width:4px;
  border-radius:0 999px 999px 0;
  background:var(--accent);
}

.day-card-num{
  width:40px;
  height:40px;
  border-radius:13px;
  border:1px solid var(--line);
  background:var(--card);
  color:var(--muted);
  display:grid;
  place-items:center;
  flex-shrink:0;
  font-family:var(--font-mono);
  font-size:12px;
  line-height:14px;
  font-weight:900;
  box-shadow:0 4px 12px rgba(54,42,27,.055);
}

.day-card.active .day-card-num{
  background:var(--accent);
  border-color:var(--accent);
  color:var(--accent-ink);
  box-shadow:0 8px 18px var(--accent-shadow);
}

.day-card-body{
  min-width:0;
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  padding-top:1px;
}

.day-card-title{
  width:100%;
  display:block;
  color:var(--text);
  font-size:14px;
  line-height:18px;
  font-weight:900;
  letter-spacing:-.01em;
  white-space:normal;
  overflow-wrap:anywhere;
}

.day-card-date{
  margin-top:5px;
  display:inline-flex;
  align-items:center;
  gap:5px;
  color:var(--muted);
  font-family:var(--font-mono);
  font-size:10.5px;
  line-height:14px;
  font-weight:700;
}

.day-card-progress{
  margin-top:8px;
  display:inline-flex;
  align-items:center;
  gap:7px;
  color:var(--muted);
  font-family:var(--font-mono);
  font-size:10px;
  line-height:14px;
  font-weight:900;
}

.day-card-progress-track{
  width:42px;
  height:5px;
  overflow:hidden;
  border-radius:999px;
  background:var(--line);
}

.day-card-progress-fill{
  display:block;
  height:100%;
  border-radius:inherit;
  background:var(--accent);
  transition:width .24s ease;
}

.day-card-progress.complete{
  color:var(--accent);
}

.day-card-tags{
  margin-top:8px;
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}

.day-card-tag{
  display:inline-flex;
  align-items:center;
  min-height:22px;
  border-radius:999px;
  padding:3px 8px 2px;
  border:1px solid rgba(124,84,16,.22);
  background:rgba(255,255,255,.66);
  color:var(--accent);
  font-family:var(--font-mono);
  font-size:9px;
  line-height:12px;
  font-weight:900;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.day-card-tag.alert{
  border-color:rgba(192,86,63,.35);
  background:rgba(255,248,244,.9);
  color:#a8422a;
}

.day-card-note{
  width:100%;
  min-height:16px;
  margin-top:7px;
  color:rgba(80,69,56,.52);
  font-size:12px;
  line-height:16px;
  font-style:italic;
  outline:none;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.day-card-note:focus{
  color:var(--text);
  white-space:normal;
  background:rgba(255,255,255,.78);
  border:1px solid rgba(212,196,179,.78);
  border-radius:10px;
  padding:6px 8px;
}

.day-card-note:empty::before{
  content:attr(data-placeholder);
  color:rgba(80,69,56,.34);
}

.home-hero{
  position:relative;
  flex:1;
  min-height:calc(100dvh - 48px);
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  background:var(--bg);
  color:#fff;
}

.home-hero-bg{
  position:absolute;
  inset:0;
  background-size:cover;
  background-position:center;
  transform:scale(1.02);
  transition:background-image .8s ease, transform 8s ease;
}

.home-hero::after{
  content:'';
  position:absolute;
  inset:0;
  background:
    linear-gradient(180deg, rgba(31,27,22,.10) 0%, rgba(31,27,22,.66) 100%),
    radial-gradient(circle at center, rgba(31,27,22,.05) 0%, rgba(31,27,22,.48) 100%);
  pointer-events:none;
}

.home-hero-inner{
  position:relative;
  z-index:1;
  width:min(980px, calc(100% - 32px));
  margin:0 auto;
  text-align:center;
  transform:translateY(-4vh);
}

.home-hero-kicker{
  display:inline-flex;
  align-items:center;
  gap:8px;
  margin-bottom:14px;
  padding:6px 10px;
  border:1px solid rgba(255,255,255,.32);
  border-radius:999px;
  background:rgba(255,248,244,.14);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  color:rgba(255,255,255,.88);
  font-family:var(--font-mono, ui-monospace);
  font-size:11px;
  font-weight:800;
  letter-spacing:.14em;
  text-transform:uppercase;
}

.home-hero-title{
  margin:0;
  color:#fff;
  font-family:var(--font-serif);
  font-size:clamp(42px, 6vw, 76px);
  font-weight:400;
  line-height:.98;
  letter-spacing:-.04em;
  text-shadow:0 12px 36px rgba(0,0,0,.34);
}

.home-hero-text{
  max-width:650px;
  margin:18px auto 30px;
  color:rgba(255,255,255,.88);
  font-size:16px;
  line-height:1.65;
  font-weight:700;
  text-shadow:0 8px 24px rgba(0,0,0,.32);
}

.home-trip-bar{
  width:min(780px, 100%);
  margin:0 auto;
  padding:12px;
  display:grid;
  grid-template-columns:1.35fr 1fr 1fr auto;
  align-items:center;
  gap:0;
  border:1px solid rgba(255,255,255,.28);
  border-radius:18px;
  background:rgba(255,248,244,.88);
  backdrop-filter:blur(16px);
  -webkit-backdrop-filter:blur(16px);
  box-shadow:0 22px 70px rgba(0,0,0,.25);
  color:var(--text);
}

.home-trip-field{
  min-width:0;
  display:flex;
  align-items:center;
  gap:10px;
  padding:6px 16px;
  border-right:1px solid var(--outline-variant);
  text-align:left;
}

.home-trip-field:last-of-type{
  border-right:none;
}

.home-trip-field .icon{
  width:30px;
  height:30px;
  border-radius:999px;
  display:grid;
  place-items:center;
  flex-shrink:0;
  color:var(--muted);
  background:rgba(255,255,255,.48);
}

.home-trip-label{
  display:block;
  margin-bottom:2px;
  color:var(--faint);
  font-family:var(--font-mono, ui-monospace);
  font-size:10px;
  font-weight:900;
  letter-spacing:.12em;
  text-transform:uppercase;
}

.home-trip-input{
  width:100%;
  padding:0;
  border:none;
  outline:none;
  background:transparent;
  color:var(--text);
  font-family:inherit;
  font-size:14px;
  font-weight:900;
}

.home-trip-input::placeholder{
  color:var(--muted);
  opacity:.82;
}

.home-trip-action{
  width:48px;
  height:48px;
  border:none;
  border-radius:13px;
  display:grid;
  place-items:center;
  cursor:pointer;
  background:var(--accent);
  color:var(--accent-ink);
  box-shadow:0 8px 18px rgba(124,84,16,.22);
  transition:transform .15s ease, filter .15s ease;
}

.home-trip-action:hover{
  transform:translateY(-1px);
  filter:brightness(.98);
}

.home-trip-action:disabled{
  cursor:wait;
  opacity:.72;
  transform:none;
}

.home-hero-error{
  width:min(780px, 100%);
  margin:12px auto 0;
  padding:10px 12px;
  border:1px solid rgba(192,86,63,.35);
  border-radius:12px;
  background:rgba(255,218,214,.88);
  color:#93000a;
  font-size:13px;
  font-weight:800;
}

.home-hero-caption{
  margin-top:18px;
  color:rgba(255,255,255,.72);
  font-family:var(--font-mono, ui-monospace);
  font-size:10.5px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
}

@media(max-width:820px){
  .home-hero{
    min-height:calc(100dvh - 56px);
    padding:56px 0;
  }

  .home-hero-inner{
    transform:none;
  }

  .home-trip-bar{
    grid-template-columns:1fr;
    gap:8px;
    padding:12px;
  }

  .home-trip-field{
    border-right:none;
    border-bottom:1px solid var(--outline-variant);
    padding:10px 8px 14px;
  }

  .home-trip-field:last-of-type{
    border-bottom:none;
  }

  .home-trip-action{
    width:100%;
  }
}

.home-page{
  flex:1;
  width:100%;
  height:100%;
  min-height:0;
  overflow-y:auto;
  overflow-x:hidden;
  background:var(--bg);
  scroll-behavior:smooth;
}

.home-scroll-cue{
  position:absolute;
  left:50%;
  bottom:24px;
  z-index:2;
  transform:translateX(-50%);
  border:none;
  background:rgba(255,248,244,.86);
  color:var(--text);
  border-radius:999px;
  padding:10px 14px;
  display:inline-flex;
  align-items:center;
  gap:10px;
  cursor:pointer;
  font-family:inherit;
  font-size:12px;
  font-weight:900;
  box-shadow:0 14px 40px rgba(0,0,0,.22);
  border:1px solid rgba(255,255,255,.42);
  backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);
}

.home-scroll-cue-arrow{
  width:28px;
  height:28px;
  border-radius:999px;
  display:grid;
  place-items:center;
  background:var(--accent);
  color:var(--accent-ink);
  animation:homeArrowBounce 1.35s ease-in-out infinite;
}

@keyframes homeArrowBounce{
  0%,100%{
    transform:translateY(0);
  }
  50%{
    transform:translateY(5px);
  }
}

.home-library{
  padding:56px clamp(18px,4vw,56px) 72px;
  background:var(--bg);
  color:var(--text);
}

.home-library-inner{
  width:min(1180px,100%);
  margin:0 auto;
}

.home-library-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:24px;
  margin-bottom:24px;
}

.home-library-kicker{
  color:var(--accent);
  font-family:var(--font-mono,ui-monospace);
  font-size:11px;
  font-weight:900;
  letter-spacing:.16em;
  text-transform:uppercase;
  margin-bottom:8px;
}

.home-library-title{
  margin:0;
  color:var(--text);
  font-family:var(--font-serif);
  font-size:clamp(30px,4vw,46px);
  font-weight:400;
  line-height:1.05;
  letter-spacing:-.035em;
}

.home-library-text{
  margin:10px 0 0;
  max-width:620px;
  color:var(--muted);
  font-size:15px;
  line-height:1.65;
  font-weight:700;
}

.home-library-count{
  flex-shrink:0;
  border:1px solid var(--outline-variant);
  border-radius:999px;
  background:var(--card);
  color:var(--muted);
  padding:8px 12px;
  font-family:var(--font-mono,ui-monospace);
  font-size:11px;
  font-weight:900;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.home-trip-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:18px;
}

.home-trip-card{
  border:1px solid var(--outline-variant);
  border-radius:18px;
  background:var(--card);
  overflow:hidden;
  box-shadow:0 2px 8px rgba(82,98,91,.05);
  transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}

.home-trip-card:hover{
  transform:translateY(-3px);
  border-color:rgba(124,84,16,.38);
  box-shadow:0 14px 36px rgba(82,98,91,.12);
}

.home-trip-cover{
  position:relative;
  height:170px;
  overflow:hidden;
  background:var(--soft);
}

.home-trip-cover img{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:center;
  pointer-events:none;
  user-select:none;
}

.home-trip-cover::after{
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(180deg,rgba(31,27,22,.08),rgba(31,27,22,.48));
}

.home-trip-chip{
  position:absolute;
  left:12px;
  top:12px;
  z-index:1;
  border:1px solid rgba(255,255,255,.44);
  border-radius:999px;
  background:rgba(255,248,244,.82);
  color:var(--accent);
  padding:5px 8px;
  font-family:var(--font-mono,ui-monospace);
  font-size:10px;
  font-weight:900;
  letter-spacing:.08em;
  text-transform:uppercase;
  backdrop-filter:blur(10px);
  -webkit-backdrop-filter:blur(10px);
}

.home-trip-card-body{
  padding:16px;
}

.home-trip-card-title{
  margin:0;
  color:var(--text);
  font-family:var(--font-serif);
  font-size:25px;
  font-weight:400;
  line-height:1.08;
  letter-spacing:-.025em;
}

.home-trip-card-meta{
  margin-top:7px;
  color:var(--muted);
  font-size:12.5px;
  font-weight:700;
  line-height:1.45;
}

.home-trip-card-actions{
  display:flex;
  align-items:center;
  gap:8px;
  margin-top:16px;
}

.home-trip-resume{
  flex:1;
  border:none;
  border-radius:999px;
  background:var(--accent);
  color:var(--accent-ink);
  min-height:38px;
  padding:0 14px;
  cursor:pointer;
  font-family:inherit;
  font-size:12.5px;
  font-weight:900;
}

.home-trip-map{
  width:38px;
  height:38px;
  border-radius:999px;
  border:1px solid var(--outline-variant);
  background:var(--card);
  color:var(--accent);
  display:grid;
  place-items:center;
  cursor:pointer;
}

.home-trip-empty{
  border:1px dashed var(--outline-variant);
  border-radius:18px;
  background:var(--surface-container-low,#f8f3e9);
  padding:30px;
  text-align:center;
  color:var(--muted);
}

.home-trip-empty-title{
  color:var(--text);
  font-family:var(--font-serif);
  font-size:30px;
  line-height:1.1;
  margin-bottom:8px;
}

@media(max-width:980px){
  .home-library-head{
    align-items:flex-start;
    flex-direction:column;
  }

  .home-trip-grid{
    grid-template-columns:1fr;
  }
}

@media(max-width:720px){
  .home-scroll-cue{
    width:calc(100% - 32px);
    justify-content:center;
    bottom:16px;
  }

  .home-library{
    padding:38px 16px 56px;
  }
}

.home-page.is-public .home-library{
  display:none;
}

.home-public-inner{
  width:min(1180px,calc(100% - 40px));
  margin:0 auto;
}

.home-public-flow{
  padding:96px 0;
  background:var(--card);
  color:var(--text);
}

.home-public-heading{
  max-width:760px;
  margin-bottom:68px;
}

.home-public-kicker{
  margin-bottom:12px;
  color:var(--accent);
  font-family:var(--font-mono,ui-monospace);
  font-size:11px;
  font-weight:900;
  letter-spacing:.14em;
  text-transform:uppercase;
}

.home-public-heading h2,
.home-public-tools-heading h2,
.home-public-cta h2{
  margin:0;
  font-family:var(--font-serif);
  font-size:clamp(38px,5vw,62px);
  font-weight:400;
  line-height:1.02;
  letter-spacing:0;
}

.home-public-heading p{
  max-width:660px;
  margin:20px 0 0;
  color:var(--muted);
  font-size:17px;
  font-weight:700;
  line-height:1.7;
}

.home-public-steps{
  display:grid;
  grid-template-columns:minmax(0,1fr) 70px minmax(0,1fr);
  align-items:stretch;
  border-top:1px solid var(--outline-variant);
  border-bottom:1px solid var(--outline-variant);
}

.home-public-step{
  display:grid;
  grid-template-columns:54px minmax(0,1fr);
  gap:22px;
  padding:42px 24px 42px 0;
}

.home-public-step:last-child{
  padding-left:24px;
  padding-right:0;
}

.home-public-step-index{
  width:46px;
  height:46px;
  display:grid;
  place-items:center;
  border:1px solid var(--outline-variant);
  border-radius:50%;
  color:var(--accent);
  font-family:var(--font-mono,ui-monospace);
  font-size:11px;
  font-weight:900;
}

.home-public-step-label{
  margin-bottom:7px;
  color:var(--accent);
  font-size:11px;
  font-weight:900;
  text-transform:uppercase;
}

.home-public-step h3{
  margin:0;
  font-family:var(--font-serif);
  font-size:36px;
  font-weight:400;
  line-height:1.1;
}

.home-public-step p{
  margin:14px 0 22px;
  color:var(--muted);
  font-size:14px;
  font-weight:700;
  line-height:1.65;
}

.home-public-step-details{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}

.home-public-step-details span{
  padding:7px 10px;
  border:1px solid var(--outline-variant);
  border-radius:999px;
  color:var(--muted);
  font-size:11px;
  font-weight:800;
}

.home-public-transition{
  display:grid;
  place-items:center;
  border-left:1px solid var(--outline-variant);
  border-right:1px solid var(--outline-variant);
  color:var(--accent);
  font-size:25px;
}

.home-public-tools{
  padding:96px 0;
  background:var(--soft);
  color:var(--text);
}

.home-public-tools-heading{
  display:grid;
  grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);
  align-items:end;
  gap:60px;
  margin-bottom:54px;
}

.home-public-tools-heading p{
  margin:0;
  color:var(--muted);
  font-size:15px;
  font-weight:700;
  line-height:1.7;
}

.home-public-tools-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:28px;
}

.home-public-tool{
  padding-top:22px;
  border-top:2px solid var(--outline-variant);
  color:var(--accent);
}

.home-public-tool h3{
  margin:18px 0 7px;
  color:var(--text);
  font-family:var(--font-serif);
  font-size:25px;
  font-weight:400;
}

.home-public-tool p{
  margin:0;
  color:var(--muted);
  font-size:13px;
  font-weight:700;
  line-height:1.55;
}

.home-dashboard{
  padding:70px 20px 30px;
  background:var(--bg);
}

.home-dashboard-cover{
  position:relative;
  width:min(1180px,100%);
  min-height:390px;
  margin:0 auto;
  overflow:hidden;
  border-radius:8px;
  background-position:center;
  background-size:cover;
  color:#fff;
  box-shadow:0 18px 45px rgba(45,33,18,.18);
}

.home-dashboard-overlay{
  position:absolute;
  inset:0;
  background:linear-gradient(
    90deg,
    rgba(18,14,10,.9) 0%,
    rgba(18,14,10,.57) 55%,
    rgba(18,14,10,.18) 100%
  );
}

.home-dashboard-content{
  position:relative;
  z-index:1;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  min-height:390px;
  padding:34px;
}

.home-dashboard-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
}

.home-dashboard-top span,
.home-dashboard-top strong{
  padding:7px 10px;
  border:1px solid rgba(255,255,255,.3);
  border-radius:6px;
  background:rgba(18,14,10,.3);
  font-size:10px;
  font-weight:900;
  text-transform:uppercase;
  backdrop-filter:blur(8px);
}

.home-dashboard-main{
  display:grid;
  grid-template-columns:minmax(0,1fr) 300px;
  align-items:end;
  gap:55px;
}

.home-dashboard-main h2{
  margin:10px 0 8px;
  font-family:var(--font-serif);
  font-size:clamp(46px,6vw,76px);
  font-weight:400;
  line-height:.95;
}

.home-dashboard-main p{
  margin:0;
  color:rgba(255,255,255,.75);
  font-size:13px;
  font-weight:800;
}

.home-dashboard-preparation > div{
  display:flex;
  justify-content:space-between;
  margin-bottom:9px;
  font-size:11px;
  font-weight:900;
}

.home-dashboard-progress{
  display:block;
  height:6px;
  overflow:hidden;
  border-radius:3px;
  background:rgba(255,255,255,.25);
}

.home-dashboard-progress > span{
  display:block;
  height:100%;
  border-radius:inherit;
  background:var(--tan);
}

.home-dashboard-actions{
  display:flex;
  flex-wrap:wrap;
  gap:9px;
  margin-top:25px;
}

.home-dashboard-actions button{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  min-height:45px;
  padding:0 16px;
  border:1px solid rgba(255,255,255,.4);
  border-radius:7px;
  background:rgba(255,255,255,.94);
  color:var(--petrol);
  cursor:pointer;
  font-size:12px;
  font-weight:900;
}

.home-dashboard-actions button.travel{
  border-color:#76506f;
  background:#76506f;
  color:#fff;
}

.home-inspiration{
  padding:96px 20px;
  background:var(--bg);
  color:var(--text);
}

.home-inspiration-inner{
  width:min(1180px,100%);
  margin:0 auto;
}

.home-inspiration-heading{
  display:grid;
  grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);
  align-items:end;
  gap:60px;
  margin-bottom:42px;
}

.home-inspiration-heading h2{
  max-width:750px;
  margin:12px 0 0;
  font-family:var(--font-serif);
  font-size:clamp(38px,5vw,62px);
  font-weight:400;
  line-height:1;
}

.home-dashboard-cover,
.home-trip-card,
.home-trip-cover {
  touch-action: pan-y pinch-zoom;
}

.home-dashboard-trip-strip {
  width: min(1180px, 100%);
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(220px, 280px);
  gap: 12px;
  margin: 18px auto 0;
  padding: 2px 0 10px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x proximity;
  overscroll-behavior-x: contain;
  touch-action: pan-x pan-y pinch-zoom;
  scrollbar-width: thin;
}

.home-dashboard-trip-card {
  position: relative;
  min-height: 120px;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--outline-variant);
  border-radius: 10px;
  background: #252018;
  color: #fff;
  cursor: pointer;
  text-align: left;
  scroll-snap-align: start;
  touch-action: pan-x pan-y pinch-zoom;
}

.home-dashboard-trip-thumb {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}

.home-dashboard-trip-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
  user-select: none;
}

.home-dashboard-trip-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgba(18, 14, 10, 0.08),
      rgba(18, 14, 10, 0.82)
    );
  pointer-events: none;
}

.home-dashboard-trip-copy {
  position: relative;
  z-index: 1;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
  padding: 16px;
  pointer-events: none;
}

.home-dashboard-trip-copy strong {
  font-family: var(--font-serif);
  font-size: 21px;
  font-weight: 500;
  line-height: 1.05;
}

.home-dashboard-trip-copy small {
  color: rgba(255, 255, 255, 0.78);
  font-size: 11px;
  font-weight: 800;
}

.home-inspiration-grid,
.home-inspiration-item,
.home-inspiration-item img {
  touch-action: pan-x pan-y pinch-zoom;
}

.home-inspiration-item img {
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.home-inspiration-heading p{
  margin:0;
  color:var(--muted);
  font-size:14px;
  font-weight:700;
  line-height:1.7;
}

.home-inspiration-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:16px;
}

.home-inspiration-item{
  position:relative;
  min-width:0;
  aspect-ratio:4 / 5;
  overflow:hidden;
  padding:0;
  border:0;
  border-radius:8px;
  background:#252018;
  color:#fff;
  cursor:pointer;
  text-align:left;
  box-shadow:0 8px 22px rgba(46,34,17,.12);
}

.home-inspiration-item img{
  width:100%;
  height:100%;
  object-fit:cover;
  transition:transform .45s ease;
}

.home-inspiration-item:hover img{
  transform:scale(1.045);
}

.home-inspiration-item:hover{
  transform:translateY(-4px);
  box-shadow:0 16px 32px rgba(46,34,17,.2);
}

.home-inspiration-overlay{
  position:absolute;
  inset:0;
  background:linear-gradient(
    to bottom,
    rgba(15,12,8,.05) 25%,
    rgba(15,12,8,.86) 100%
  );
}

.home-inspiration-content{
  position:absolute;
  inset:auto 0 0;
  z-index:1;
  display:flex;
  flex-direction:column;
  padding:22px;
}

.home-inspiration-country{
  margin-bottom:7px;
  color:var(--tan);
  font-size:10px;
  font-weight:900;
  text-transform:uppercase;
}

.home-inspiration-content strong{
  font-family:var(--font-serif);
  font-size:29px;
  font-weight:400;
}

.home-inspiration-content small{
  margin-top:5px;
  color:rgba(255,255,255,.75);
  font-size:11px;
  line-height:1.45;
}

.home-inspiration-action{
  display:flex;
  justify-content:space-between;
  margin-top:18px;
  padding-top:13px;
  border-top:1px solid rgba(255,255,255,.28);
  font-size:11px;
  font-weight:900;
}

.home-info-footer{
  padding:24px 20px;
  border-top:1px solid var(--outline-variant);
  background:var(--card);
}

.home-info-footer-inner{
  width:min(1180px,100%);
  margin:0 auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:24px;
}

.home-info-footer strong{
  color:var(--accent);
  font-family:var(--font-serif);
  font-size:18px;
}

.home-info-footer nav{
  display:flex;
  flex-wrap:wrap;
  justify-content:flex-end;
  gap:8px 20px;
}

.home-info-footer a{
  color:var(--muted);
  font-size:12px;
  font-weight:800;
  text-decoration:none;
}

.home-info-footer a:hover{
  color:var(--accent);
  text-decoration:underline;
}

@media(max-width:640px){
  .home-info-footer-inner{
    align-items:flex-start;
    flex-direction:column;
  }

  .home-info-footer nav{
    justify-content:flex-start;
  }
}

.home-public-install{
  padding:96px 20px;
  background:var(--card);
  color:var(--text);
}

.home-public-install-inner{
  width:min(1040px,100%);
  margin:0 auto;
  display:grid;
  grid-template-columns:minmax(0,1fr) 280px;
  align-items:center;
  gap:80px;
}

.home-public-install-copy h2{
  margin:14px 0 18px;
  font-family:var(--font-serif);
  font-size:clamp(38px,5vw,66px);
  font-weight:400;
  line-height:1;
}

.home-public-install-copy p{
  max-width:650px;
  margin:0 0 25px;
  color:var(--muted);
  font-size:15px;
  font-weight:700;
  line-height:1.7;
}

.home-public-apk-button{
  display:inline-flex;
  align-items:center;
  gap:10px;
  min-height:48px;
  padding:0 18px;
  border-radius:8px;
  background:var(--accent);
  color:var(--accent-ink);
  font-size:13px;
  font-weight:900;
  text-decoration:none;
  box-shadow:0 8px 20px rgba(80,53,12,.15);
}

.home-public-apk-button:hover{
  transform:translateY(-2px);
  box-shadow:0 12px 26px rgba(80,53,12,.22);
}

.home-public-store-list{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:18px;
}

.home-public-store-badge{
  min-width:150px;
  padding:10px 13px;
  border:1px solid var(--outline-variant);
  border-radius:8px;
  background:var(--soft);
}

.home-public-store-badge strong,
.home-public-store-badge span{
  display:block;
}

.home-public-store-badge strong{
  font-size:12px;
}

.home-public-store-badge span{
  margin-top:2px;
  color:var(--muted);
  font-size:10px;
  font-weight:800;
}

.home-public-install-warning{
  display:block;
  max-width:620px;
  margin-top:18px;
  color:var(--muted);
  font-size:10px;
  line-height:1.5;
}

.home-public-qr{
  text-align:center;
}

.home-public-qr-frame{
  padding:14px;
  border:1px solid var(--outline-variant);
  border-radius:8px;
  background:#fff;
  box-shadow:var(--shadow-lg);
}

.home-public-qr-frame img{
  display:block;
  width:100%;
  aspect-ratio:1;
}

.home-public-qr strong,
.home-public-qr span{
  display:block;
}

.home-public-qr strong{
  margin-top:16px;
  font-size:13px;
}

.home-public-qr span{
  margin-top:3px;
  color:var(--muted);
  font-size:11px;
}

.home-public-cta{
  padding:84px 20px;
  background:var(--petrol);
  color:#fff;
}

.home-public-cta-inner{
  width:min(1180px,100%);
  margin:0 auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:60px;
}

.home-public-cta .home-public-kicker{
  color:var(--tan);
}

.home-public-cta h2{
  max-width:700px;
  color:#fff;
}

.home-public-cta p{
  max-width:650px;
  margin:18px 0 0;
  color:rgba(255,255,255,.72);
  font-size:15px;
  font-weight:700;
  line-height:1.7;
}

.home-public-cta-actions{
  width:250px;
  flex-shrink:0;
  display:flex;
  flex-direction:column;
  gap:10px;
}

.home-public-start,
.home-public-login{
  min-height:48px;
  border-radius:8px;
  padding:0 16px;
  cursor:pointer;
  font-family:inherit;
  font-size:13px;
  font-weight:900;
}

.home-public-start{
  border:1px solid var(--tan);
  display:flex;
  align-items:center;
  justify-content:space-between;
  background:var(--tan);
  color:var(--petrol);
}

.home-public-login{
  border:1px solid rgba(255,255,255,.3);
  background:transparent;
  color:#fff;
}

@media(max-width:900px){
  .home-dashboard-main{
    grid-template-columns:1fr;
    gap:25px;
  }

  .home-dashboard-preparation{
    max-width:420px;
  }
  .home-inspiration-heading{
    grid-template-columns:1fr;
    gap:18px;
  }

  .home-inspiration-grid{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
  .home-public-flow,
  .home-public-tools{
    padding:64px 0;
  }

  .home-public-steps{
    grid-template-columns:1fr;
  }

  .home-public-step,
  .home-public-step:last-child{
    padding:32px 0;
  }

  .home-public-transition{
    min-height:54px;
    border:0;
    border-top:1px solid var(--outline-variant);
    border-bottom:1px solid var(--outline-variant);
  }

  .home-public-transition span{
    transform:rotate(90deg);
  }

  .home-public-tools-heading{
    grid-template-columns:1fr;
    gap:20px;
  }

  .home-public-tools-grid{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }

  .home-public-cta-inner{
    align-items:flex-start;
    flex-direction:column;
  }

  .home-public-cta-actions{
    width:100%;
  }
}

@media(max-width:560px){
  .home-dashboard{
    padding:40px 14px 20px;
  }

  .home-dashboard-content{
    padding:22px;
  }

  .home-dashboard-actions{
    display:grid;
    grid-template-columns:1fr;
  }
  .home-inspiration{
    padding:64px 14px;
  }

  .home-inspiration-grid{
    grid-template-columns:none;
    grid-auto-flow:column;
    grid-auto-columns:minmax(235px,82vw);
    overflow-x:auto;
    scroll-snap-type:x mandatory;
    padding-bottom:10px;
  }

  .home-inspiration-item{
    scroll-snap-align:start;
  }
  .home-public-install{
    padding:64px 16px;
  }

  .home-public-install-inner{
    grid-template-columns:1fr;
    gap:42px;
  }

  .home-public-qr{
    width:min(240px,100%);
    margin:0 auto;
  }

  .home-public-apk-button{
    width:100%;
    justify-content:center;
  }

  .home-public-store-list{
    display:grid;
    grid-template-columns:1fr 1fr;
  }
  .home-public-inner{
    width:min(100% - 28px,1180px);
  }

  .home-public-heading{
    margin-bottom:42px;
  }

  .home-public-step{
    grid-template-columns:42px minmax(0,1fr);
    gap:14px;
  }

  .home-public-step-index{
    width:38px;
    height:38px;
  }

  .home-public-tools-grid{
    grid-template-columns:1fr;
  }

  .home-public-cta{
    padding:64px 16px;
  }
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
    min-height:44px;
    padding:10px 12px;
    color:var(--text);
    font-family:inherit;
    font-size:16px;
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
    min-height:44px;
    padding:9px 12px;
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
    min-height:44px;
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

  .topbar-center{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  min-width:0;
  flex:1;
}

.topbar-center .topbar-nav{
  order:1;
}

.workspace-mode{
  order:2;
  display:inline-flex;
  align-items:center;
  gap:3px;
  padding:3px;
  border:1px solid var(--outline-variant);
  border-radius:9px;
  background:var(--card);
  box-shadow:0 2px 8px rgba(66,48,18,.08);
}

.workspace-mode-btn{
  min-width:88px;
  height:30px;
  padding:0 9px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:5px;
  border:1px solid transparent;
  border-radius:6px;
  background:transparent;
  color:var(--muted);
  cursor:pointer;
  font-family:inherit;
  font-size:11px;
  font-weight:900;
  transition:background .18s ease, color .18s ease, transform .18s ease, box-shadow .18s ease;
}

.workspace-mode-btn:hover{
  transform:translateY(-1px);
  background:var(--accent-soft);
  color:var(--accent);
}

.workspace-mode-btn.active{
  background:var(--accent);
  color:var(--accent-ink);
  box-shadow:0 3px 8px var(--accent-shadow);
}

.workspace-mode-btn:focus-visible{
  outline:2px solid var(--accent);
  outline-offset:2px;
}

  @media(max-width:1180px){
    .topbar{
      gap:8px;
    }

    .topbar-nav{
      gap:2px;
    }
   .workspace-mode-btn{
    min-width:76px;
    padding:0 7px;
  }
}

  @media(max-width:760px){
    .topbar,
    .topbar.compact{
      height:auto;
      min-height:54px;
      display:grid;
      grid-template-columns:minmax(0,1fr) auto;
      grid-template-areas:
        "left right"
        "center center";
      align-items:center;
      gap:8px;
      padding-top:8px;
      padding-bottom:8px;
      padding-left:max(10px,env(safe-area-inset-left));
      padding-right:max(10px,env(safe-area-inset-right));
      overflow:visible;
    }

    .topbar-left{
      grid-area:left;
      width:100%;
      min-width:0;
      gap:8px;
    }

    .topbar-right{
      grid-area:right;
      gap:6px;
    }

    .topbar-center{
      grid-area:center;
      width:100%;
      min-width:0;
      display:grid;
      grid-template-columns:minmax(0,1fr);
      gap:6px;
    }

    .topbar-brand,
    .topbar.compact .topbar-brand{
      flex-shrink:0;
      font-size:18px;
    }

    .topbar-brand-long,
    .topbar-brand-suffix{
      display:none;
    }

    .topbar-brand-short{
      display:inline;
    }

    .trip-switcher{
      flex:1;
      min-width:0;
    }

    .trip-switcher-btn{
      width:100%;
      max-width:none;
      min-width:0;
      padding:6px 8px;
    }

    .trip-switcher-label,
    .topbar.compact .trip-switcher-label{
      flex:1;
      max-width:none;
      min-width:0;
    }

    .trip-menu{
      min-width:0;
      width:min(285px,calc(100vw - 70px));
      max-width:calc(100vw - 70px);
    }

    .workspace-mode{
      order:1;
      width:100%;
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
    }

    .workspace-mode-btn,
    .topbar.compact .workspace-mode-btn{
      width:100%;
      min-width:0;
      height:44px;
      padding:0 7px;
    }

    .topbar-center .topbar-nav{
      order:2;
      width:100%;
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:4px;
    }

    .topbar-nav-btn,
    .topbar.compact .topbar-nav-btn{
      width:100%;
      min-width:0;
      min-height:44px;
      padding:7px 3px;
      font-size:12px;
    }

    .places-control{
      display:none;
    }

    .topbar-settings-btn{
      display:none;
    }

    .topbar-account{
      padding-left:0;
    }

    .user-pill{
      min-width:44px;
      min-height:44px;
      padding:4px;
      justify-content:center;
    }

    .trip-switcher-btn{
      min-height:44px;
    }

    .web-mobile-banner{
      display:flex;
      align-items:center;
      gap:10px;
      flex-shrink:0;
      padding:
        10px max(12px,env(safe-area-inset-right))
        10px max(12px,env(safe-area-inset-left));
      border-bottom:1px solid rgba(150,100,13,.16);
      background:
        linear-gradient(
          110deg,
          rgba(150,100,13,.13),
          rgba(255,253,249,.96)
        );
      color:var(--text);
      box-shadow:0 5px 16px rgba(54,42,27,.045);
      font-size:12px;
      line-height:1.4;
    }

    .web-mobile-banner-copy{
      flex:1;
      min-width:0;
    }

    .web-mobile-banner-copy strong{
      display:block;
      color:var(--accent);
      font-size:12px;
    }

    .web-mobile-banner-actions{
      display:flex;
      align-items:center;
      gap:8px;
      flex-shrink:0;
    }

    .web-mobile-banner-link{
      min-height:42px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      flex-shrink:0;
      padding:0 14px;
      border:1px solid rgba(255,255,255,.22);
      border-radius:999px;
      background:var(--accent);
      color:var(--accent-ink);
      box-shadow:0 6px 16px var(--accent-shadow);
      font:inherit;
      font-weight:900;
      text-decoration:none;
      white-space:nowrap;
      cursor:pointer;
      transition:
        transform .18s var(--ease-out),
        box-shadow .18s ease;
    }

    .web-mobile-banner-install{
      border-color:rgba(150,100,13,.3);
      background:var(--card);
      color:var(--accent);
      box-shadow:none;
    }

    .web-mobile-banner-link:hover{
      transform:translateY(-1px);
      box-shadow:0 9px 20px var(--accent-shadow);
    }

    .web-mobile-banner-close{
      width:40px;
      height:40px;
      flex-shrink:0;
      display:grid;
      place-items:center;
      border:0;
      border-radius:50%;
      background:transparent;
      color:var(--muted);
      cursor:pointer;
    }

    .topbar-right .user-name{
      display:none;
    }

        .app-floating{
      bottom:max(12px,env(safe-area-inset-bottom));
      height:48px;
      min-width:48px;
      box-shadow:0 10px 28px rgba(21,48,42,.22);
      touch-action:manipulation;
    }

    .app-floating.days{
      left:max(12px,env(safe-area-inset-left));
      padding:0 14px;
    }

    .app-floating.tools{
      right:max(12px,env(safe-area-inset-right));
      width:48px;
    }

    .app-overlay > div{
      max-width:min(92vw,360px) !important;
    }

    .home-hero-title{
      font-size:42px;
      line-height:44px;
    }

    .home-trip-input{
      min-height:24px;
      font-size:16px;
    }
  }

  /* Déplacement des journées */

.day-spine-reorder-hint {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 4px 13px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 800;
  line-height: 14px;
  letter-spacing: 0.04em;
}

.day-spine-empty {
  min-height: 180px;
  display: grid;
  place-content: center;
  gap: 7px;
  padding: 22px;
  text-align: center;
  color: var(--muted);
}

.day-spine-empty strong {
  color: var(--text);
  font-size: 15px;
}

.day-spine-empty span {
  max-width: 210px;
  font-size: 12px;
  line-height: 18px;
}

.day-card {
  display: block;
  padding: 0;
  cursor: default;
}

.day-card-select {
  width: 100%;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  align-items: flex-start;
  padding: 12px 92px 8px 10px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.day-card-move-actions {
  position: absolute;
  top: 10px;
  right: 8px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.38;
  transition: opacity 0.18s ease;
}

.day-card:hover .day-card-move-actions,
.day-card.active .day-card-move-actions,
.day-card:focus-within .day-card-move-actions {
  opacity: 1;
}

.day-card-drag-handle,
.day-card-move-btn {
  width: 24px;
  height: 26px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  color: var(--muted);
  font: inherit;
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
}

.day-card-drag-handle {
  cursor: grab;
  user-select: none;
}

.day-card-drag-handle:active {
  cursor: grabbing;
}

.day-card-move-btn {
  cursor: pointer;
}

.day-card-move-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.day-card-move-btn:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.day-card > .day-card-note {
  width: calc(100% - 64px);
  margin: 0 10px 11px 64px;
}

.day-card.dragging {
  opacity: 0.45;
  transform: scale(0.985);
}

.day-card.drag-over {
  border-color: var(--accent);
  background: var(--accent-soft);
  box-shadow:
    0 0 0 3px var(--accent-soft),
    0 12px 28px rgba(54, 42, 27, 0.1);
}

.day-card.moving {
  opacity: 0.68;
}

@media (max-width: 900px) {
  .day-spine-reorder-hint {
    margin-right: 2px;
    margin-left: 2px;
  }

  .day-card-select {
    padding-right: 72px;
  }

  .day-card-move-actions {
    opacity: 1;
  }

  .day-card-drag-handle {
    display: none;
  }

  .day-card-move-btn {
    width: 28px;
    height: 30px;
  }
}

/* Réseau et chargement */

.network-status-banner {
  position: relative;
  z-index: 45;
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding:
    8px
    max(14px, env(safe-area-inset-right))
    8px
    max(14px, env(safe-area-inset-left));
  background: #7d2e20;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
}

.network-status-banner.online {
  background: #286443;
}

.network-status-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.14);
}

.trip-loading {
  flex: 1;
  min-width: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--bg);
}

.trip-loading-card {
  width: min(560px, 100%);
  padding: 26px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: var(--card);
  box-shadow: var(--shadow-md);
}

.trip-loading-heading {
  margin-bottom: 20px;
  color: var(--text);
  font-family: var(--font-serif);
  font-size: 25px;
  font-style: italic;
}

.trip-loading-line {
  height: 13px;
  margin-top: 11px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--inset);
}

.trip-loading-line::after {
  content: "";
  display: block;
  width: 45%;
  height: 100%;
  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(150, 100, 13, 0.15),
      transparent
    );
  animation: trip-loading-shimmer 1.15s ease-in-out infinite;
}

.trip-loading-line.short {
  width: 58%;
}

.trip-loading-slow {
  margin-top: 20px;
  color: var(--muted);
  font-size: 12px;
  line-height: 18px;
}

@keyframes trip-loading-shimmer {
  from {
    transform: translateX(-120%);
  }

  to {
    transform: translateX(250%);
  }
}

  /* =========================================================
   Accueil, authentification et petits téléphones
   ========================================================= */

.home-hero-inner {
  width: min(1040px, calc(100% - 36px));
}

.home-trip-bar {
  border-radius: 22px;
  border-color: rgba(255, 255, 255, 0.38);
  background: rgba(255, 253, 249, 0.92);
  box-shadow:
    0 24px 75px rgba(24, 18, 12, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.74);
}

.home-trip-field {
  min-height: 60px;
}

.home-trip-field .icon {
  border: 1px solid rgba(150, 100, 13, 0.12);
  background: var(--accent-soft);
  color: var(--accent);
}

.home-trip-input:focus-visible {
  outline: none;
}

.home-trip-field:focus-within {
  background: rgba(150, 100, 13, 0.045);
  border-radius: 13px;
}

.home-trip-action {
  box-shadow: 0 10px 26px rgba(91, 59, 10, 0.25);
}

.home-trip-action:focus-visible,
.home-scroll-cue:focus-visible {
  outline: 3px solid rgba(255, 255, 255, 0.66);
  outline-offset: 3px;
}

.home-public-apk-button,
.home-public-start,
.home-public-login {
  border-radius: 13px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

/* Fenêtres de connexion, inscription et création */

.modal-backdrop {
  background: rgba(27, 21, 15, 0.62);
  backdrop-filter: blur(9px);
  -webkit-backdrop-filter: blur(9px);
}

.modal-card {
  border-radius: 22px;
  border-color: rgba(150, 100, 13, 0.18);
  box-shadow: 0 30px 90px rgba(27, 21, 15, 0.3);
}

.modal-head {
  padding: 18px 20px;
  background:
    linear-gradient(
      135deg,
      var(--card),
      var(--accent-soft)
    );
}

.modal-title {
  font-size: 26px;
  letter-spacing: -0.025em;
}

.modal-body {
  padding: 22px;
}

.field {
  margin-bottom: 15px;
}

.field-label {
  margin-bottom: 7px;
  color: var(--muted);
  letter-spacing: 0.1em;
}

.field input {
  min-height: 48px;
  border-radius: 12px;
  border-color: var(--line);
  background: var(--card);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.field input:hover {
  border-color: rgba(150, 100, 13, 0.28);
}

.field input:focus {
  border-color: var(--accent);
  background: var(--card);
  box-shadow: 0 0 0 4px rgba(150, 100, 13, 0.12);
}

.field input[readonly] {
  color: var(--muted);
  background: var(--inset);
  cursor: default;
}

.mode-tabs {
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 14px;
}

.mode-tab {
  border-radius: 11px;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.mode-tab.active {
  box-shadow: 0 6px 16px var(--accent-shadow);
}

.modal-body .simple-btn {
  min-height: 48px;
  border-radius: 12px;
}

.modal-body .simple-btn.primary {
  box-shadow: 0 8px 20px var(--accent-shadow);
}

.modal-card button:focus-visible,
.modal-card input:focus-visible {
  outline: 3px solid rgba(150, 100, 13, 0.22);
  outline-offset: 2px;
}

/* Survols réservés aux appareils avec souris */

@media (hover: hover) and (pointer: fine) {
  .home-public-apk-button:hover,
  .home-public-start:hover,
  .home-public-login:hover {
    transform: translateY(-2px);
  }

  .modal-body .simple-btn:hover {
    transform: translateY(-1px);
  }
}

/* Accueil et modales sur téléphone */

@media (max-width: 560px) {
  .home-hero {
    min-height: auto;
    padding: 46px 0 64px;
  }

  .home-hero-inner {
    width: calc(100% - 24px);
    text-align: left;
  }

  .home-hero-kicker {
    margin-bottom: 16px;
  }

  .home-hero-title {
    max-width: 340px;
    font-size: clamp(38px, 12vw, 54px);
    line-height: 0.98;
  }

  .home-hero-text {
    margin: 18px 0 24px;
    font-size: 15px;
    line-height: 1.55;
  }

  .home-trip-bar {
    gap: 0;
    padding: 10px;
    border-radius: 18px;
  }

  .home-trip-field {
    min-height: 62px;
    padding: 10px 8px 13px;
  }

  .home-trip-field .icon {
    width: 34px;
    height: 34px;
  }

  .home-trip-action {
    height: 50px;
    border-radius: 14px;
  }

  .home-hero-caption {
    margin-top: 16px;
    text-align: center;
    line-height: 1.45;
  }

  .home-scroll-cue {
    display: none;
  }

  .modal-backdrop {
    align-items: flex-end;
    padding: 0;
  }

  .modal-card {
    max-width: none;
    max-height: min(92dvh, 760px);
    border-right: none;
    border-bottom: none;
    border-left: none;
    border-radius: 22px 22px 0 0;
  }

  .modal-head {
    padding:
      16px
      max(18px, env(safe-area-inset-right))
      16px
      max(18px, env(safe-area-inset-left));
  }

  .modal-title {
    font-size: 24px;
  }

  .modal-body {
    padding:
      18px
      max(16px, env(safe-area-inset-right))
      calc(20px + env(safe-area-inset-bottom))
      max(16px, env(safe-area-inset-left));
  }

  .field input {
    min-height: 50px;
    font-size: 16px;
  }
}

/* Navigation et bandeau sur les très petits téléphones */

@media (max-width: 430px) {
  .topbar-center .topbar-nav {
    display: flex;
    gap: 5px;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }

  .topbar-center .topbar-nav::-webkit-scrollbar {
    display: none;
  }

  .topbar-nav-btn,
  .topbar.compact .topbar-nav-btn {
    flex: 0 0 84px;
    width: 84px;
    scroll-snap-align: start;
    white-space: nowrap;
  }

  .web-mobile-banner {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      auto;
    grid-template-areas:
      "copy close"
      "actions actions";
    gap: 8px 10px;
  }

  .web-mobile-banner-copy {
    grid-area: copy;
  }

  .web-mobile-banner-actions {
    grid-area: actions;
    display: grid;
    grid-template-columns:
      repeat(
        auto-fit,
        minmax(130px, 1fr)
      );
    width: 100%;
  }

  .web-mobile-banner-link {
    width: 100%;
  }

  .web-mobile-banner-close {
    grid-area: close;
  }

  .mode-tab {
    padding-right: 7px;
    padding-left: 7px;
    font-size: 12px;
  }
}

@media (max-width: 360px) {
  .home-hero-inner {
    width: calc(100% - 18px);
  }

  .home-trip-bar {
    padding: 8px;
  }

  .modal-body {
    padding-right: 13px;
    padding-left: 13px;
  }
}

.modal-form {
  margin: 0;
}

.auth-form-error,
.new-trip-form-error {
  padding: 10px 12px;
  border: 1px solid rgba(192, 86, 63, 0.24);
  border-radius: 11px;
  background: rgba(192, 86, 63, 0.08);
  line-height: 1.45;
  animation: modal-error-arrival 0.2s ease-out;
}

@keyframes modal-error-arrival {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
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
        error: null,
        diagnosticCopied: false
      };
    }

    static getDerivedStateFromError(error) {
      return {
        hasError: true,
        error
      };
    }

    componentDidCatch(error, info) {
      console.error(
        'ErrorBoundary:',
        error,
        info
      );

      window.ClientErrorLog?.capture(
        error,
        {
          source:
            'react-error-boundary'
        }
      );
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
              onClick={() => this.setState({
                hasError: false,
                error: null,
                diagnosticCopied: false
              })}
              style={{ width: '100%' }}
            >
              Retenter sans recharger
            </AppButton>

            <AppButton
              onClick={async () => {
                const diagnostic =
                  window.ClientErrorLog
                    ?.buildDiagnostic(
                      this.state.error
                    ) ||
                  'Diagnostic indisponible';

                try {
                  if (
                    !navigator.clipboard
                      ?.writeText
                  ) {
                    throw new Error(
                      'Presse-papiers indisponible'
                    );
                  }

                  await navigator.clipboard
                    .writeText(
                      diagnostic
                    );

                  this.setState({
                    diagnosticCopied: true
                  });
                } catch (error) {
                  window.prompt(
                    'Copie ce diagnostic :',
                    diagnostic
                  );
                }
              }}
              style={{ width: '100%' }}
            >
              {this.state.diagnosticCopied
                ? 'Diagnostic copié'
                : 'Copier le diagnostic'}
            </AppButton>
          </div>
        </div>
      );
    }
  }

  function NetworkStatusBanner() {
  const [online, setOnline] =
    React.useState(function initialNetworkState() {
      return navigator.onLine;
    });

  const [restored, setRestored] =
    React.useState(false);

  const restoredTimer =
    React.useRef(null);

  React.useEffect(function listenNetwork() {
    function handleOffline() {
      if (restoredTimer.current) {
        window.clearTimeout(
          restoredTimer.current
        );
      }

      setRestored(false);
      setOnline(false);
    }

    function handleOnline() {
      setOnline(true);
      setRestored(true);

      if (restoredTimer.current) {
        window.clearTimeout(
          restoredTimer.current
        );
      }

      restoredTimer.current =
        window.setTimeout(function hideSuccess() {
          setRestored(false);
        }, 2500);
    }

    window.addEventListener(
      'offline',
      handleOffline
    );

    window.addEventListener(
      'online',
      handleOnline
    );

    return function cleanupNetwork() {
      window.removeEventListener(
        'offline',
        handleOffline
      );

      window.removeEventListener(
        'online',
        handleOnline
      );

      if (restoredTimer.current) {
        window.clearTimeout(
          restoredTimer.current
        );
      }
    };
  }, []);

  if (online && !restored) {
    return null;
  }

  return (
    <div
      className={
        'network-status-banner' +
        (online ? ' online' : '')
      }
      role="status"
      aria-live="polite"
    >
      <span
        className="network-status-dot"
        aria-hidden="true"
      />

      {online
        ? 'Connexion rétablie.'
        : 'Tu es hors ligne. Les modifications ne pourront pas être enregistrées.'}
    </div>
  );
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
      settingsOpen,
      appMode = 'plan'
    } = Store.useStore(function select(state) {
      return {
        user: state.user,
        authReady: state.authReady,
        view: state.view || 'itinerary',
        activeTripId: state.activeTripId,
        trip: state.trip,
        toast: state.toast,
        settingsOpen: state.settingsOpen,
        appMode: state.appMode || 'plan'
      };
    });

    const routeAnnouncement =
      !user
        ? 'Accueil public'
        : !activeTripId
          ? 'Accueil de vos voyages'
          : appMode === 'travel'
            ? 'Mode Voyager'
            : {
                itinerary: 'Itinéraire du voyage',
                map: 'Carte du voyage',
                budget: 'Budget du voyage',
                docs: 'Documents du voyage'
              }[view] ||
              'Voyage';

    const width = useWindowWidth();

    const isCompactShell = width < 1320;
    const isNarrowShell = width < 1100;
    const isTinyShell = width < 900;
    const isTopbarCompact = width < 1180;
   const accent = getTripAccent(trip?.accentTheme);

    const sideWidth = isCompactShell ? 260 : 300;
    const toolWidth = isCompactShell ? 280 : 320;

const [toolboxOpen, setToolboxOpen] = React.useState(false);
const [daySpineOpen, setDaySpineOpen] = React.useState(false);
const [toolboxCollapsed, setToolboxCollapsed] = React.useState(
  () => localStorage.getItem('toolbox_collapsed') === 'true'
);

function toggleToolboxCollapsed() {
  setToolboxCollapsed(current => {
    const next = !current;
    localStorage.setItem('toolbox_collapsed', String(next));
    return next;
  });
}

    const CurrentView = appMode === 'travel'
  ? window.TravelModeView
  : getCurrentView(view);

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
      <div
  className="app-shell"
  style={{
    '--accent': accent.accent,
    '--accent-soft': accent.soft,
    '--accent-ink': accent.ink,
    '--accent-shadow': accent.shadow
  }}
>
        <a
          className="skip-link"
          href="#app-main-content"
        >
          Aller au contenu principal
        </a>

        <div
          className="screen-reader-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Page affichée : {routeAnnouncement}
        </div>

        <Topbar compact={isTopbarCompact} />
        <WebMobileBanner />
        <NetworkStatusBanner />

                <main
          id="app-main-content"
          className="app-main"
          tabIndex="-1"
        >
          {!user ? (
            <LoggedOutHome />
          ) : !activeTripId ? (
            <NoTripHome />
          ) : !trip ? (
            <LoadingTrip />
          ) : (
            <>
              {appMode !== 'travel' && !isTinyShell && (
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

              {appMode !== 'travel' && !isNarrowShell && window.Toolbox && (
  <div style={{
    width: toolboxCollapsed ? 48 : toolWidth + 48,
    height: '100%',
    flexShrink: 0,
    display: 'flex',
    background: 'var(--surface-container-low, var(--bg-2))',
    borderLeft: '1px solid var(--outline-variant, var(--line))'
  }}>
    {!toolboxCollapsed && (
      <div style={{ width: toolWidth, minWidth: 0, height: '100%' }}>
        <window.Toolbox width="100%" />
      </div>
    )}

    <button
      type="button"
      onClick={toggleToolboxCollapsed}
      title={toolboxCollapsed ? 'Déployer la boîte à outils' : 'Ranger la boîte à outils'}
      aria-label={toolboxCollapsed ? 'Déployer la boîte à outils' : 'Ranger la boîte à outils'}
      style={{
        width: 48,
        minWidth: 48,
        height: '100%',
        border: 'none',
        borderLeft: toolboxCollapsed ? 'none' : '1px solid var(--outline-variant, var(--line))',
        background: 'transparent',
        color: 'var(--accent)',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'start center',
        paddingTop: 18
      }}
    >
      <Icon name={toolboxCollapsed ? 'chevleft' : 'chevright'} size={19} />
    </button>
  </div>
)}

              {appMode !== 'travel' && isNarrowShell && toolboxOpen && window.Toolbox && (
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

        {appMode !== 'travel' && isNarrowShell && user && activeTripId && trip && (
          <button
            type="button"
            className="app-floating tools"
            onClick={() => setToolboxOpen(true)}
            title="Ouvrir la boîte à outils"
          >
            <Icon name="gear" size={20} />
          </button>
        )}

        {user && window.ReminderNotifier && (
          <window.ReminderNotifier
            user={user}
          />
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

  function WebMobileBanner() {
    const [
      hidden,
      setHidden
    ] = React.useState(
      function initialBannerState() {
        return (
          sessionStorage.getItem(
            'web_mobile_banner_hidden'
          ) === 'true'
        );
      }
    );

    const [
      installPrompt,
      setInstallPrompt
    ] = React.useState(null);

    const isStandalone =
      window.matchMedia(
        '(display-mode: standalone)'
      ).matches ||
      window.navigator.standalone ===
        true;

    React.useEffect(
      function watchInstallation() {
        function captureInstallPrompt(
          event
        ) {
          event.preventDefault();
          setInstallPrompt(event);
        }

        function hideAfterInstallation() {
          setInstallPrompt(null);

          sessionStorage.setItem(
            'web_mobile_banner_hidden',
            'true'
          );

          setHidden(true);
        }

        window.addEventListener(
          'beforeinstallprompt',
          captureInstallPrompt
        );

        window.addEventListener(
          'appinstalled',
          hideAfterInstallation
        );

        return function stopWatching() {
          window.removeEventListener(
            'beforeinstallprompt',
            captureInstallPrompt
          );

          window.removeEventListener(
            'appinstalled',
            hideAfterInstallation
          );
        };
      },
      []
    );

    async function installWebApp() {
      if (!installPrompt) {
        return;
      }

      await installPrompt.prompt();

      const choice =
        await installPrompt.userChoice;

      setInstallPrompt(null);

      if (
        choice.outcome === 'accepted'
      ) {
        sessionStorage.setItem(
          'web_mobile_banner_hidden',
          'true'
        );

        setHidden(true);
      }
    }

    if (
      hidden ||
      isStandalone
    ) {
      return null;
    }

    return (
      <aside
        className="web-mobile-banner"
        aria-label="Versions disponibles"
      >
        <div className="web-mobile-banner-copy">
          <strong>
            Version web complète.
          </strong>

          Installe-la sur ton écran
          d’accueil ou télécharge
          séparément l’application Android.
        </div>

        <div className="web-mobile-banner-actions">
          {installPrompt && (
            <button
              type="button"
              className="
                web-mobile-banner-link
                web-mobile-banner-install
              "
              onClick={installWebApp}
            >
              Installer le web
            </button>
          )}

          <a
            className="web-mobile-banner-link"
            href={ANDROID_APK_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            APK Android
          </a>
        </div>

        <button
          type="button"
          className="web-mobile-banner-close"
          aria-label="Masquer ce message"
          onClick={() => {
            sessionStorage.setItem(
              'web_mobile_banner_hidden',
              'true'
            );

            setHidden(true);
          }}
        >
          <Icon
            name="x"
            size={16}
          />
        </button>
      </aside>
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
      appMode = 'plan',
      theme = localStorage.getItem('it_theme') || 'light'
    } = Store.useStore(function select(state) {
      return {
        user: state.user,
        trips: state.trips || [],
        activeTripId: state.activeTripId,
        trip: state.trip,
        view: state.view || 'itinerary',
        appMode: state.appMode || 'plan',
        theme: state.theme || localStorage.getItem('it_theme') || 'light'
      };
    });

    const [authOpen, setAuthOpen] = React.useState(false);
    const [tripMenuOpen, setTripMenuOpen] = React.useState(false);
    const [newTripOpen, setNewTripOpen] = React.useState(false);

        const [placesUsage, setPlacesUsage] = React.useState(null);
        const [placesMode, setPlacesMode] = React.useState(
      () => localStorage.getItem('places_search_mode') === 'google' ? 'google' : 'basic'
    );
        const [placesHelpOpen, setPlacesHelpOpen] = React.useState(false);

    React.useEffect(function syncPlacesUsage() {
      if (!user) {
        setPlacesUsage(null);
        return undefined;
      }

      let alive = true;

      function applyUsage(event) {
        if (alive && event.detail) {
          setPlacesUsage(event.detail);
        }
      }

      window.addEventListener('places-usage', applyUsage);

      if (window.SB && window.SB.getPlacesUsage) {
        window.SB.getPlacesUsage()
          .then(function setInitialUsage(usage) {
            if (alive && usage) setPlacesUsage(usage);
          })
          .catch(function ignoreUsageError() {});
      }

      return function cleanup() {
        alive = false;
        window.removeEventListener('places-usage', applyUsage);
      };
    }, [user]);

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
    const isGuestUser = user?.is_anonymous === true;

    const compactDisplayName = isGuestUser
  ? 'Enregistrer'
  : displayName.length > 14
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
    label: 'Docs'
  }
];

function setAppMode(nextMode) {
  const patch = { appMode: nextMode };

  if (nextMode === 'travel' && Array.isArray(trip?.days)) {
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');

    const todayIndex = trip.days.findIndex(day => day.dateISO === today);

    if (todayIndex >= 0) {
      patch.selectedDayIndex = todayIndex;
    }
  }

  localStorage.setItem('atelier_app_mode', nextMode);
  Store.set(patch);
}


        function updatePlacesMode(enabled) {
      const nextMode = enabled ? 'google' : 'basic';

      localStorage.setItem('places_search_mode', nextMode);
      setPlacesMode(nextMode);

      window.dispatchEvent(new CustomEvent('places-search-mode', {
        detail: nextMode
      }));
    }

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
            <span className="topbar-brand-long">La Fabrique</span>
            <span className="topbar-brand-suffix">à Voyages</span>
            <span className="topbar-brand-short">LFV</span>
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
                <Icon
                  name="map"
                  size={14}
                  style={{ color: 'var(--accent)', flexShrink: 0 }}
                />
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

{trip && (
  <div className="topbar-center">
    <div className="workspace-mode" aria-label="Mode d’utilisation">
      <button
        type="button"
        className={'workspace-mode-btn' + (appMode === 'plan' ? ' active' : '')}
        onClick={() => setAppMode('plan')}
>
  <Icon name="cal" size={13} />
  Préparer
</button>

      <button
        type="button"
        className={'workspace-mode-btn' + (appMode === 'travel' ? ' active' : '')}
        onClick={() => setAppMode('travel')}
>
  <Icon name="pin" size={13} />
  Voyager
</button>
    </div>

    {appMode !== 'travel' && (
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
    )}
  </div>
)}

        <div className="topbar-right">
          {user ? (
            <>
              <div className="places-control">
                <button
                  type="button"
                  className={'places-usage' + (placesUsage?.reached ? ' reached' : '')}
                  onClick={() => setPlacesHelpOpen(open => !open)}
                  title="Consulter le fonctionnement des recherches de lieux"
                  style={{ opacity: placesUsage ? 1 : .65 }}
                >
                  <Icon name="search" size={14} />
                  <span className="places-usage-label">Places</span>
                  <span>
                    {placesUsage ? placesUsage.count : '…'} / {placesUsage ? placesUsage.limit : 100}
                  </span>
                </button>

                <label className="places-mode-control" title="Recherche précise Google Places">
                  <input
                    className="places-mode-input"
                    type="checkbox"
                    checked={placesMode === 'google'}
                    onChange={event => updatePlacesMode(event.target.checked)}
                  />
                  <span className="places-mode-track">
                    <span className="places-mode-knob" />
                  </span>
                  <span className="places-mode-label">Précis</span>
                </label>

                <div
                  onMouseEnter={() => setPlacesHelpOpen(true)}
                  onMouseLeave={() => setPlacesHelpOpen(false)}
                  style={{ position: 'relative' }}
                >
                  <button
                    type="button"
                    className="places-help-btn"
                    onClick={() => setPlacesHelpOpen(open => !open)}
                    aria-label="Comprendre le compteur Google Places"
                  >
                    ?
                  </button>

                  {placesHelpOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: 300,
                      padding: 14,
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 10,
                      background: 'var(--card)',
                      color: 'var(--text)',
                      boxShadow: 'var(--shadow-lg)',
                      fontSize: 12,
                      lineHeight: 1.45,
                      zIndex: 6000
                    }}>
                      <div style={{ fontWeight: 900, marginBottom: 7 }}>
                        Recherche de lieux
                      </div>

                      <div>
                        Chaque utilisateur dispose de <strong>100 recherches Google Places par mois</strong>.
                      </div>

                      <div style={{ marginTop: 8, color: 'var(--muted)' }}>
                        Active Précis pour les musées, restaurants, hôtels et lieux exacts. Désactive-le pour utiliser la recherche simple, sans consommation Google.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="topbar-account">
                {trip && (
                  <button
                    type="button"
                    className="topbar-settings-btn topbar-print-btn"
                    title="Imprimer ou enregistrer le voyage en PDF"
                    aria-label="Imprimer le voyage"
                    onClick={() => {
                      if (
                        !window.TripPrint?.open
                      ) {
                        Store.showToast(
                          'L’export PDF est indisponible.'
                        );

                        return;
                      }

                      window.TripPrint.open(
                        trip
                      );
                    }}
                  >
                    <Icon
                      name="print"
                      size={17}
                    />
                  </button>
                )}

                <button
                  type="button"
                  className="topbar-settings-btn"
                  title="Paramètres"
                  aria-label="Paramètres"
                  onClick={() => Store.set({ settingsOpen: true })}
                >
                  <Icon name="gear" size={17} />
                </button>

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
              </div>
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

function DaySpine({
  width = 300,
  onPickDay
}) {
  const {
    trip,
    selectedDayIndex = 0
  } = Store.useStore(function select(state) {
    return {
      trip: state.trip,
      selectedDayIndex:
        state.selectedDayIndex || 0
    };
  });

  const [
    draggedDayIndex,
    setDraggedDayIndex
  ] = React.useState(null);

  const [
    dragTargetIndex,
    setDragTargetIndex
  ] = React.useState(null);

  const [
    movingDayId,
    setMovingDayId
  ] = React.useState(null);

  if (
    !trip ||
    !Array.isArray(trip.days)
  ) {
    return null;
  }

  const days = trip.days;

  const selected = Math.min(
    Math.max(0, selectedDayIndex),
    Math.max(0, days.length - 1)
  );

  function selectDay(index) {
    localStorage.setItem(
      'atelier_app_mode',
      'plan'
    );

    Store.set({
      appMode: 'plan',
      view: 'itinerary',
      selectedDayIndex: index,
      selectedStepId: null
    });

    if (onPickDay) {
      onPickDay(index);
    }
  }

  async function handleNoteBlur(
    day,
    event
  ) {
    const noteElement = event.currentTarget;

    const newNote = (
      noteElement.textContent || ''
    ).trim();

    const oldNote = (
      day.note || ''
    ).trim();

    if (newNote === oldNote) return;

    try {
      if (
        !window.SB?.updateDay ||
        !trip.id
      ) {
        throw new Error(
          'Sauvegarde indisponible'
        );
      }

      await window.SB.updateDay(
        day.id,
        { note: newNote }
      );

      const refreshed =
        await window.SB.loadTrip(trip.id);

      if (refreshed) {
        Store.set({ trip: refreshed });
      }
    } catch (error) {
      console.error(
        'Note save failed:',
        error
      );

      noteElement.textContent = oldNote;

      Store.showToast(
        'La note n’a pas pu être enregistrée.'
      );
    }
  }

  function handleNoteKeyDown(event) {
    event.stopPropagation();

    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  async function moveDay(
    fromIndex,
    toIndex
  ) {
    const sourceIndex = Number(fromIndex);
    const destinationIndex = Number(toIndex);

    if (
      movingDayId ||
      sourceIndex === destinationIndex ||
      sourceIndex < 0 ||
      destinationIndex < 0 ||
      sourceIndex >= days.length ||
      destinationIndex >= days.length
    ) {
      return;
    }

    const movedDay = days[sourceIndex];

    if (
      !movedDay ||
      !window.SB?.moveTripDayInsideFixedRange
    ) {
      Store.showToast(
        'Le déplacement des journées est indisponible.'
      );
      return;
    }

    const selectedDayId =
      days[selected]?.id || null;

    setMovingDayId(
      movedDay.id ||
      'day-' + sourceIndex
    );

    try {
      await window.SB
        .moveTripDayInsideFixedRange(
          trip.id,
          sourceIndex,
          destinationIndex
        );

      const refreshed =
        await window.SB.loadTrip(trip.id);

      const refreshedDays =
        Array.isArray(refreshed?.days)
          ? refreshed.days
          : [];

      let nextSelectedIndex =
        destinationIndex;

      if (selectedDayId) {
        const foundIndex =
          refreshedDays.findIndex(
            day => day.id === selectedDayId
          );

        if (foundIndex >= 0) {
          nextSelectedIndex = foundIndex;
        }
      }

      Store.set({
        trip: refreshed,
        selectedDayIndex:
          nextSelectedIndex,
        selectedStepId: null
      });

      Store.showToast(
        'Journée déplacée vers J' +
        (destinationIndex + 1) +
        '.'
      );
    } catch (error) {
      console.error(
        'Day move failed:',
        error
      );

      Store.showToast(
        'La journée n’a pas pu être déplacée.'
      );

      try {
        const refreshed =
          await window.SB.loadTrip(trip.id);

        if (refreshed) {
          Store.set({ trip: refreshed });
        }
      } catch (refreshError) {
        console.error(
          'Trip refresh failed:',
          refreshError
        );
      }
    } finally {
      setMovingDayId(null);
      setDraggedDayIndex(null);
      setDragTargetIndex(null);
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

        {trip.startDate &&
          trip.endDate && (
            <div className="day-spine-meta">
              <Icon name="cal" size={12} />

              {formatDayDate(
                trip.startDate
              )}

              {' → '}

              {formatDayDate(
                trip.endDate
              )}
            </div>
          )}
      </div>

      <div className="day-spine-scroll">
        {!!days.length && (
          <div className="day-spine-reorder-hint">
            <span aria-hidden="true">↕</span>
            Glisse une journée ou utilise les flèches
          </div>
        )}

        {!days.length && (
          <div className="day-spine-empty">
            <strong>
              Aucune journée
            </strong>

            <span>
              Vérifie les dates du voyage pour créer son itinéraire.
            </span>
          </div>
        )}

        {days.map(function renderDay(
          day,
          index
        ) {
          const active =
            index === selected;

          const tags =
            countDayTags(day);

          const title =
            getDisplayDayTitle(day) ||
            'Journée à préciser';

          const dateStr =
            formatDayDate(day.dateISO) ||
            'Date à définir';

          const preparation = [
            {
              label: 'programme',
              ready: tags.steps > 0
            },
            {
              label: 'repas',
              ready:
                tags.restaurants > 0
            },
            {
              label: 'hébergement',
              ready:
                tags.lodgings > 0
            }
          ];

          const preparationDone =
            preparation.filter(
              item => item.ready
            ).length;

          const preparationMissing =
            preparation
              .filter(
                item => !item.ready
              )
              .map(item => item.label)
              .join(', ');

          const dayIdentity =
            day.id ||
            'day-' + index;

          const moving =
            movingDayId === dayIdentity;

          return (
            <article
              key={dayIdentity}
              className={
                'day-card' +
                (active ? ' active' : '') +
                (
                  draggedDayIndex === index
                    ? ' dragging'
                    : ''
                ) +
                (
                  dragTargetIndex === index
                    ? ' drag-over'
                    : ''
                ) +
                (
                  moving
                    ? ' moving'
                    : ''
                )
              }
              aria-busy={moving}
              onDragOver={event => {
                if (
                  draggedDayIndex === null ||
                  draggedDayIndex === index
                ) {
                  return;
                }

                event.preventDefault();
                event.dataTransfer.dropEffect =
                  'move';

                setDragTargetIndex(index);
              }}
              onDrop={event => {
                event.preventDefault();

                const transferredIndex =
                  Number(
                    event.dataTransfer.getData(
                      'text/plain'
                    )
                  );

                const sourceIndex =
                  Number.isInteger(
                    transferredIndex
                  )
                    ? transferredIndex
                    : draggedDayIndex;

                setDragTargetIndex(null);

                moveDay(
                  sourceIndex,
                  index
                );
              }}
            >
              <button
                type="button"
                className="day-card-select"
                onClick={() =>
                  selectDay(index)
                }
                aria-current={
                  active
                    ? 'date'
                    : undefined
                }
              >
                <span className="day-card-num">
                  J{index + 1}
                </span>

                <span className="day-card-body">
                  <span className="day-card-title">
                    {title}
                  </span>

                  <span className="day-card-date">
                    <Icon
                      name="cal"
                      size={11}
                    />

                    {dateStr}
                  </span>

                  <span
                    className={
                      'day-card-progress' +
                      (
                        preparationDone === 3
                          ? ' complete'
                          : ''
                      )
                    }
                    title={
                      preparationDone === 3
                        ? 'Journée entièrement préparée'
                        : 'À compléter : ' +
                          preparationMissing
                    }
                  >
                    <span
                      className="day-card-progress-track"
                      aria-hidden="true"
                    >
                      <span
                        className="day-card-progress-fill"
                        style={{
                          width:
                            (
                              preparationDone /
                              preparation.length
                            ) *
                              100 +
                            '%'
                        }}
                      />
                    </span>

                    <span>
                      {preparationDone === 3
                        ? 'Prête'
                        : preparationDone +
                          '/3 préparé'}
                    </span>
                  </span>
                </span>
              </button>

              <div className="day-card-move-actions">
                <span
                  className="day-card-drag-handle"
                  role="button"
                  tabIndex="-1"
                  draggable={!movingDayId}
                  title="Faire glisser la journée"
                  aria-label="Faire glisser la journée"
                  onDragStart={event => {
                    event.dataTransfer
                      .setData(
                        'text/plain',
                        String(index)
                      );

                    event.dataTransfer
                      .effectAllowed =
                        'move';

                    setDraggedDayIndex(
                      index
                    );
                  }}
                  onDragEnd={() => {
                    setDraggedDayIndex(
                      null
                    );

                    setDragTargetIndex(
                      null
                    );
                  }}
                >
                  ↕
                </span>

                <button
                  type="button"
                  className="day-card-move-btn"
                  disabled={
                    index === 0 ||
                    Boolean(movingDayId)
                  }
                  aria-label={
                    'Déplacer ' +
                    title +
                    ' vers le jour précédent'
                  }
                  title="Jour précédent"
                  onPointerDown={event =>
                    event.stopPropagation()
                  }
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();

                    localStorage.setItem(
                      'atelier_app_mode',
                      'plan'
                    );

                    Store.set({
                      appMode: 'plan',
                      view: 'itinerary'
                    });

                    moveDay(
                      index,
                      index - 1
                    );
                  }}
                >
                  ↑
                </button>

                <button
                  type="button"
                  className="day-card-move-btn"
                  disabled={
                    index ===
                      days.length - 1 ||
                    Boolean(movingDayId)
                  }
                  aria-label={
                    'Déplacer ' +
                    title +
                    ' vers le jour suivant'
                  }
                  title="Jour suivant"
                  onPointerDown={event =>
                    event.stopPropagation()
                  }
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();

                    localStorage.setItem(
                      'atelier_app_mode',
                      'plan'
                    );

                    Store.set({
                      appMode: 'plan',
                      view: 'itinerary'
                    });

                    moveDay(
                      index,
                      index + 1
                    );
                  }}
                >
                  ↓
                </button>
              </div>

              <div
                className="day-card-note"
                contentEditable
                suppressContentEditableWarning
                data-placeholder="+ note..."
                onKeyDown={
                  handleNoteKeyDown
                }
                onBlur={event =>
                  handleNoteBlur(
                    day,
                    event
                  )
                }
              >
                {day.note || ''}
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}

  function getHomeTripSummary(trip) {
  const days = Array.isArray(trip?.days) ? trip.days : [];
  const startDate = trip?.startDate || trip?.start_date || '';
  const endDate = trip?.endDate || trip?.end_date || '';

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  let countdown = 'Dates à préciser';

  if (startDate) {
    const start = new Date(startDate + 'T12:00:00');
    const difference = Math.round(
      (start.getTime() - today.getTime()) / 86400000
    );

    if (difference > 1) countdown = `Dans ${difference} jours`;
    else if (difference === 1) countdown = 'Départ demain';
    else if (difference === 0) countdown = "Départ aujourd’hui";
    else countdown = 'Voyage en cours';

    if (
      endDate &&
      today.getTime() > new Date(endDate + 'T12:00:00').getTime()
    ) {
      countdown = 'Voyage terminé';
    }
  }

  let completed = 0;
  const total = days.length * 3;

  days.forEach(function inspectDay(day) {
    const steps = Array.isArray(day.steps) ? day.steps : [];

    const types = steps.map(step =>
      String(step.type || '').toLowerCase()
    );

    if (
      steps.some(step => ![
        'logement',
        'lodging',
        'restaurant',
        'repas',
        'meal'
      ].includes(String(step.type || '').toLowerCase()))
    ) {
      completed += 1;
    }

    if (types.includes('logement') || types.includes('lodging')) {
      completed += 1;
    }

    if (
      types.includes('restaurant') ||
      types.includes('repas') ||
      types.includes('meal')
    ) {
      completed += 1;
    }
  });

  return {
    countdown,
    progress: total
      ? Math.round((completed / total) * 100)
      : 0
  };
}

 function HomeHero({
  mode,
  trips,
  onAuthOpen
}) {
  const heroImages = React.useMemo(function buildHeroImages() {
    return [
      {
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=82',
        label: 'Lac alpin au lever du soleil'
      },
      {
        url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=82',
        label: 'Côte amalfitaine, Italie'
      },
      {
        url: 'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=1600&q=82',
        label: 'Kyoto, Japon'
      },
      {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=82',
        label: 'Désert et lumière dorée'
      },
      {
        url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1600&q=82',
        label: 'Cascade et grands espaces'
      }
    ];
  }, []);

  const tripImages = React.useMemo(function buildTripImages() {
    return [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=82',
      'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=900&q=82',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=82',
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=900&q=82',
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=82'
    ];
  }, []);

  const inspirationTrips = React.useMemo(function buildInspirations() {
  return [
    {
      name: 'Kyoto',
      country: 'Japon',
      promise: 'Temples, ruelles et jardins',
      image:
        'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=1200&q=88'
    },
    {
      name: 'Côte amalfitaine',
      country: 'Italie',
      promise: 'Villages suspendus et Méditerranée',
      image:
        'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=88'
    },
    {
      name: 'Paris',
      country: 'France',
      promise: 'Musées, quartiers et bonnes tables',
      image:
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=88'
    },
    {
      name: 'Dubaï',
      country: 'Émirats arabes unis',
      promise: 'Architecture, désert et démesure',
      image:
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=88'
    }
  ];
}, []);

  function startFromInspiration(destinationName) {
  setDestination(destinationName);
  setError('');

  const page = document.querySelector('.home-page');

  if (page) {
    page.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  window.setTimeout(function focusInspiredDestination() {
    const destinationInput =
      document.querySelector('.home-trip-input');

    if (destinationInput) {
      destinationInput.focus();
      destinationInput.select();
    }
  }, 500);
}

  const webCoverSearchStarted = React.useRef(false);
  const [imageIndex, setImageIndex] = React.useState(0);
  const [destination, setDestination] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const destinationRef = React.useRef(null);
  const startDateRef = React.useRef(null);
  const endDateRef = React.useRef(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const loggedOut = mode === 'loggedOut';
  const safeTrips = Array.isArray(trips) ? trips : [];
  const [featuredTrip, setFeaturedTrip] = React.useState(null);

const featuredTripMeta = React.useMemo(function pickFeaturedTrip() {
  if (!safeTrips.length) return null;

  const todayISO = new Date().toISOString().slice(0, 10);

  const upcomingTrips = safeTrips
    .filter(item => {
      const start = item.start_date || item.startDate;
      return start && start >= todayISO;
    })
    .slice()
    .sort((a, b) => {
      const first = a.start_date || a.startDate || '';
      const second = b.start_date || b.startDate || '';
      return first.localeCompare(second);
    });

  return upcomingTrips[0] || safeTrips[0];
}, [safeTrips]);

React.useEffect(function loadFeaturedTrip() {
  if (
    loggedOut ||
    !featuredTripMeta?.id ||
    !window.SB?.loadTrip
  ) {
    setFeaturedTrip(null);
    return undefined;
  }

  let alive = true;

  window.SB.loadTrip(featuredTripMeta.id)
    .then(function applyFeaturedTrip(fullTrip) {
      if (alive) setFeaturedTrip(fullTrip);
    })
    .catch(function useTripSummary() {
      if (alive) setFeaturedTrip(featuredTripMeta);
    });

  return function stopFeaturedTripLoading() {
    alive = false;
  };
}, [loggedOut, featuredTripMeta?.id]);

const featuredSummary =
  getHomeTripSummary(featuredTrip || featuredTripMeta);

const featuredCover =
  featuredTrip?.coverImageUrl ||
  featuredTrip?.cover_image_url ||
  featuredTripMeta?.cover_image_url ||
  featuredTripMeta?.coverImageUrl ||
  heroImages[0].url;
  const activeImage = heroImages[imageIndex] || heroImages[0];
  const androidApkUrl = ANDROID_APK_URL;

  const androidQrUrl =
  'https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=' +
  encodeURIComponent(androidApkUrl);

  React.useEffect(function rotateHeroImage() {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    const saveData =
      Boolean(connection?.saveData);

    const reducedMotion =
      window.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
      ).matches;

    const slowConnection =
      ['slow-2g', '2g'].includes(
        connection?.effectiveType
      );

    if (
      saveData ||
      reducedMotion ||
      slowConnection ||
      heroImages.length < 2
    ) {
      return undefined;
    }

    const timer = window.setInterval(
      function nextImage() {
        setImageIndex(function updateIndex(current) {
          return (
            current + 1
          ) % heroImages.length;
        });
      },
      7000
    );

    return function cleanupHeroImageRotation() {
      window.clearInterval(timer);
    };
  }, [heroImages.length]);

  React.useEffect(function ensureWebTripCovers() {
  if (
    loggedOut ||
    webCoverSearchStarted.current ||
    !safeTrips.length ||
    !window.SB?.searchTripCoverPhotos ||
    !window.SB?.saveTripCover
  ) {
    return undefined;
  }

  const missingTrips = safeTrips
    .filter(function withoutCover(item) {
      return (
        item?.id &&
        item?.name &&
        !item.cover_image_url &&
        !item.coverImageUrl
      );
    })
    .slice(0, 2);

  if (!missingTrips.length) {
    return undefined;
  }

  webCoverSearchStarted.current = true;
  let cancelled = false;

  async function loadCovers() {
    for (const item of missingTrips) {
      try {
        const photos = await window.SB.searchTripCoverPhotos(
          item.id,
          item.name
        );

        const photo = photos?.[0];

        if (cancelled || !photo?.imageUrl) continue;

        await window.SB.saveTripCover(item.id, photo);

        const currentTrips = Store.get().trips || [];

        Store.set({
          trips: currentTrips.map(function applyCover(currentTrip) {
            if (currentTrip.id !== item.id) return currentTrip;

            return {
              ...currentTrip,
              cover_image_url: photo.imageUrl,
              cover_image_alt: photo.alt || '',
              cover_photographer_name: photo.photographerName || '',
              cover_photographer_url: photo.photographerUrl || ''
            };
          })
        });
      } catch (error) {
        console.warn(
          'Couverture indisponible pour ' + item.name,
          error
        );
      }
    }
  }

  loadCovers();

  return function stopCoverLoading() {
    cancelled = true;
  };
}, [loggedOut, safeTrips.length]);

function scrollToTrips() {
  const target = document.getElementById(
    loggedOut
      ? 'home-public-section'
      : 'home-trips-section'
  );

  if (target) {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

function startFromPublicSection() {
  const page = document.querySelector('.home-page');
  const destinationInput = document.querySelector('.home-trip-input');

  if (page) {
    page.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  window.setTimeout(function focusDestination() {
    if (destinationInput) {
      destinationInput.focus();
    }
  }, 450);
}

  function daysBetweenInclusive(start, end) {
    if (!start || !end) return 7;

    const startTime = new Date(start + 'T12:00:00').getTime();
    const endTime = new Date(end + 'T12:00:00').getTime();

    if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime < startTime) {
      return 7;
    }

    return Math.max(1, Math.round((endTime - startTime) / 86400000) + 1);
  }

  function tripDateRange(trip) {
    const start = trip && (trip.start_date || trip.startDate);
    const end = trip && (trip.end_date || trip.endDate);

    if (start && end) {
      return formatDayDate(start) + ' → ' + formatDayDate(end);
    }

    if (start) {
      return 'Départ ' + formatDayDate(start);
    }

    return 'Dates à préciser';
  }

async function createTripFromHero() {
  const requestedDestination = destinationRef.current
    ? destinationRef.current.value
    : destination;
  const requestedStartDate = startDateRef.current
    ? startDateRef.current.value
    : startDate;
  const requestedEndDate = endDateRef.current
    ? endDateRef.current.value
    : endDate;
  const cleanDestination = safeString(requestedDestination);

  if (!cleanDestination) {
    setError(
      'Indique une destination pour commencer ton voyage.'
    );
    return;
  }

  if (
    requestedStartDate &&
    requestedEndDate &&
    requestedEndDate < requestedStartDate
  ) {
    setError('La date de retour doit être postérieure à la date de départ.');
    return;
  }

  setError('');
  setBusy(true);

  try {
    if (loggedOut) {
      await window.SB.startGuestSession();
    }

    const created = await window.SB.createTrip({
      name: cleanDestination,
      startDate: requestedStartDate || null,
      endDate: requestedEndDate || null,
      days: daysBetweenInclusive(requestedStartDate, requestedEndDate)
    });

    const nextTrips = await window.SB.listMyTrips();
    const fullTrip = await window.SB.loadTrip(created.id);

    Store.set({
      trips: nextTrips,
      activeTripId: created.id,
      trip: fullTrip,
      selectedDayIndex: 0,
      selectedStepId: null,
      view: 'itinerary'
    });

    Store.showToast(
      'Voyage « ' + created.name + ' » créé ✓'
    );
  } catch (err) {
    setError(
      err.message || 'Impossible de créer le voyage.'
    );
  } finally {
    setBusy(false);
  }
}

  function openTrip(tripId) {
    if (!tripId) return;
    selectTrip(tripId);
  }
  
  function openTripInMode(tripId, nextMode) {
  if (!tripId) return;

  const safeMode = nextMode === 'travel' ? 'travel' : 'plan';

  localStorage.setItem('atelier_app_mode', safeMode);

  Store.set({
    appMode: safeMode,
    view: 'itinerary'
  });

  openTrip(tripId);
}

  return (
    <div className={'home-page' + (loggedOut ? ' is-public' : '')}>
      <section className="home-hero">
        <div
          className="home-hero-bg"
          role="img"
          aria-label={activeImage.label}
          style={{
            backgroundImage: 'url("' + activeImage.url + '")'
          }}
        />

        <div className="home-hero-inner">
          <div className="home-hero-kicker">
            <Icon name="map" size={14} />
            De l’idée au départ
          </div>

          <h1 className="home-hero-title">
            La Fabrique à Voyages
          </h1>

          <p className="home-hero-text">
            Prépare chaque journée sur ordinateur ou téléphone,
            puis passe en mode Voyager pour suivre simplement ton programme pendant le séjour.
          </p>

          <div className="home-trip-bar">
            <label className="home-trip-field">
              <span className="icon">
                <Icon name="pin" size={16} />
              </span>

              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="home-trip-label">
                  Destination
                </span>

                <input
                  ref={destinationRef}
                  className="home-trip-input"
                  value={destination}
                  onChange={event => setDestination(event.target.value)}
                  placeholder="Corée du Sud, Lisbonne, Kyoto…"
                />
              </span>
            </label>

            <label className="home-trip-field">
              <span className="icon">
                <Icon name="cal" size={16} />
              </span>

              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="home-trip-label">
                  Départ
                </span>

                <input
                  ref={startDateRef}
                  className="home-trip-input"
                  type="date"
                  value={startDate}
                  onChange={event => {
                    setStartDate(event.target.value);

                    if (endDate && event.target.value && endDate < event.target.value) {
                      setEndDate(event.target.value);
                    }
                  }}
                />
              </span>
            </label>

            <label className="home-trip-field">
              <span className="icon">
                <Icon name="cal" size={16} />
              </span>

              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="home-trip-label">
                  Retour
                </span>

                <input
                  ref={endDateRef}
                  className="home-trip-input"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={event => setEndDate(event.target.value)}
                />
              </span>
            </label>

            <button
              type="button"
              className="home-trip-action"
              aria-label={busy ? 'Création du voyage en cours' : 'Créer le voyage'}
              aria-busy={busy}
              onClick={createTripFromHero}
              disabled={busy}
              title="Créer le voyage"
            >
              {busy ? '…' : <Icon name="search" size={20} />}
            </button>
          </div>

          {error && (
            <div className="home-hero-error">
              {error}
            </div>
          )}

          <div className="home-hero-caption">
            {loggedOut
              ? 'Commence librement. Tu pourras rendre ce voyage permanent ensuite.'
              : safeTrips.length
                ? 'Tu peux aussi retrouver tes voyages déjà créés plus bas'
                : 'Ton premier itinéraire commence ici'}
          </div>
        </div>

        <button
          type="button"
          className="home-scroll-cue"
          onClick={scrollToTrips}
        >
          <span>
          {loggedOut
           ? 'Découvrir comment ça marche'
            : 'Voir mes voyages déjà créés'}
          </span>

          <span className="home-scroll-cue-arrow">
            ↓
          </span>
        </button>
      </section>

{loggedOut && (
  <React.Fragment>
    <section
      id="home-public-section"
      className="home-public-flow"
    >
      <div className="home-public-inner">
        <div className="home-public-heading">
          <div className="home-public-kicker">
            Un seul voyage, deux moments
          </div>

          <h2>
            Prépare tranquillement.<br />
            Voyage simplement.
          </h2>

          <p>
            La même application t’accompagne avant le départ
            et pendant le voyage, sans recréer ton programme ailleurs.
          </p>
        </div>

        <div className="home-public-steps">
          <article className="home-public-step">
            <div className="home-public-step-index">
              01
            </div>

            <div className="home-public-step-content">
              <div className="home-public-step-label">
                Avant le départ
              </div>

              <h3>Préparer</h3>

              <p>
                Organise les journées, ajoute les transports,
                hébergements et restaurants, construis ton budget
                et rassemble tes documents.
              </p>

              <div className="home-public-step-details">
                <span>Itinéraire jour par jour</span>
                <span>Carte et lieux</span>
                <span>Budget partagé</span>
                <span>Documents du voyage</span>
              </div>
            </div>
          </article>

          <div
            className="home-public-transition"
            aria-hidden="true"
          >
            <span>→</span>
          </div>

          <article className="home-public-step">
            <div className="home-public-step-index">
              02
            </div>

            <div className="home-public-step-content">
              <div className="home-public-step-label">
                Pendant le séjour
              </div>

              <h3>Voyager</h3>

              <p>
                Ouvre ton voyage et retrouve immédiatement
                la journée en cours, la prochaine étape,
                les horaires, les lieux et les informations utiles.
              </p>

              <div className="home-public-step-details">
                <span>Programme du jour</span>
                <span>Prochaine étape</span>
                <span>Accès rapide à la carte</span>
                <span>Informations essentielles</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section className="home-public-tools">
      <div className="home-public-inner">
        <div className="home-public-tools-heading">
          <div>
            <div className="home-public-kicker">
              Tout au même endroit
            </div>

            <h2>
              Moins d’applications.<br />
              Plus de voyage.
            </h2>
          </div>

          <p>
            Ton programme reste le même partout :
            sur ordinateur pour préparer confortablement,
            sur téléphone pour l’avoir avec toi.
          </p>
        </div>

        <div className="home-public-tools-grid">
          <div className="home-public-tool">
            <Icon name="cal" size={22} />
            <h3>Itinéraire</h3>
            <p>
              Chaque journée, chaque horaire et chaque étape.
            </p>
          </div>

          <div className="home-public-tool">
            <Icon name="map" size={22} />
            <h3>Carte</h3>
            <p>
              Les lieux enregistrés et les trajets du voyage.
            </p>
          </div>

          <div className="home-public-tool">
            <Icon name="budget" size={22} />
            <h3>Budget</h3>
            <p>
              Les dépenses, les catégories et les remboursements.
            </p>
          </div>

          <div className="home-public-tool">
            <Icon name="docs" size={22} />
            <h3>Documents</h3>
            <p>
              Billets, réservations et fichiers importants.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section className="home-public-cta">
      <div className="home-public-cta-inner">
        <div>
          <div className="home-public-kicker">
            Commencer librement
          </div>

          <h2>
            Ton prochain voyage peut commencer ici.
          </h2>

          <p>
            Indique une destination et quelques dates.
            Tu créeras ton compte uniquement lorsque tu voudras
            conserver définitivement ton voyage.
          </p>
        </div>

        <div className="home-public-cta-actions">
          <button
            type="button"
            className="home-public-start"
            onClick={startFromPublicSection}
          >
            Préparer un voyage
            <span aria-hidden="true">↑</span>
          </button>

          <button
            type="button"
            className="home-public-login"
            onClick={onAuthOpen}
          >
            J’ai déjà un compte
          </button>
        </div>
      </div>
    </section>
  </React.Fragment>
)}

{!loggedOut && featuredTripMeta && (
  <section className="home-dashboard">
    <div
      className="home-dashboard-cover"
      style={{
        backgroundImage: 'url("' + featuredCover + '")'
      }}
    >
      <div className="home-dashboard-overlay" />

      <div className="home-dashboard-content">
        <div className="home-dashboard-top">
          <span>Prochain voyage</span>
          <strong>{featuredSummary.countdown}</strong>
        </div>

        <div className="home-dashboard-main">
          <div>
            <div className="home-public-kicker">
              Ton carnet en cours
            </div>

            <h2>
              {featuredTripMeta.name || 'Voyage sans titre'}
            </h2>

            <p>
              {tripDateRange(featuredTripMeta)}
            </p>
          </div>

          <div className="home-dashboard-preparation">
            <div>
              <span>Préparation du voyage</span>
              <strong>{featuredSummary.progress}%</strong>
            </div>

            <span className="home-dashboard-progress">
              <span
                style={{
                  width: featuredSummary.progress + '%'
                }}
              />
            </span>
          </div>
        </div>

        <div className="home-dashboard-actions">
          <button
            type="button"
            onClick={() =>
              openTripInMode(featuredTripMeta.id, 'plan')
            }
          >
            <Icon name="cal" size={16} />
            Continuer à préparer
          </button>

          <button
            type="button"
            className="travel"
            onClick={() =>
              openTripInMode(featuredTripMeta.id, 'travel')
            }
          >
            <Icon name="pin" size={16} />
            Ouvrir en mode Voyager
          </button>
        </div>
      </div>
    </div>

    <div
      className="home-dashboard-trip-strip"
      role="list"
      aria-label="Tous mes voyages"
    >
      {safeTrips.map(function renderDashboardTrip(
        tripItem,
        index
      ) {
        const image =
          tripItem.cover_image_url ||
          tripItem.coverImageUrl ||
          tripImages[
            index % tripImages.length
          ];

        return (
          <button
            key={tripItem.id || index}
            type="button"
            className="home-dashboard-trip-card"
            role="listitem"
            onClick={() =>
              openTripInMode(
                tripItem.id,
                'plan'
              )
            }
          >
            <span
              className="home-dashboard-trip-thumb"
              aria-hidden="true"
            >
              <img
                src={image}
                alt=""
                width="560"
                height="240"
                loading={
                  index === 0
                    ? 'eager'
                    : 'lazy'
                }
                fetchPriority={
                  index === 0
                    ? 'high'
                    : 'low'
                }
                decoding="async"
                draggable="false"
              />
            </span>

            <span className="home-dashboard-trip-copy">
              <strong>
                {tripItem.name ||
                  'Voyage sans titre'}
              </strong>

              <small>
                {tripDateRange(tripItem)}
              </small>
            </span>
          </button>
        );
      })}
    </div>
  </section>
)}

<section className="home-inspiration">
  <div className="home-inspiration-inner">
    <div className="home-inspiration-heading">
      <div>
        <div className="home-public-kicker">
          Quelques idées pour partir
        </div>

        <h2>Où commencera le prochain voyage ?</h2>
      </div>

      <p>
        Choisis une destination pour préparer immédiatement
        ton propre itinéraire. Rien n’est ajouté tant que tu
        ne crées pas le voyage.
      </p>
    </div>

    <div className="home-inspiration-grid">
      {inspirationTrips.map(function renderInspiration(item) {
        return (
          <button
            key={item.name}
            type="button"
            className="home-inspiration-item"
            onClick={() => startFromInspiration(item.name)}
            aria-label={'Préparer un voyage à ' + item.name}
          >
            <img
              src={item.image}
              alt={item.name + ', ' + item.country}
              width="720"
              height="900"
              loading="lazy"
              decoding="async"
              draggable="false"
            />

            <span className="home-inspiration-overlay" />

            <span className="home-inspiration-content">
              <span className="home-inspiration-country">
                {item.country}
              </span>

              <strong>{item.name}</strong>
              <small>{item.promise}</small>

              <span className="home-inspiration-action">
                Préparer ce voyage
                <span aria-hidden="true">→</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  </div>
</section>

    <section className="home-public-install">
      <div className="home-public-install-inner">
        <div className="home-public-install-copy">
          <div className="home-public-kicker">
            L’application avec toi
          </div>

          <h2>
            Ton voyage directement<br />
            sur ton téléphone.
          </h2>

          <p>
            Scanne le QR code avec ton téléphone Android pour télécharger
            la version de test de La Fabrique à Voyages.
          </p>

          <a
            className="home-public-apk-button"
            href={androidApkUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span aria-hidden="true">↓</span>
            Télécharger l’APK Android
          </a>

          <div className="home-public-store-list">
            <div className="home-public-store-badge">
              <strong>Google Play</strong>
              <span>Bientôt disponible</span>
            </div>

            <div className="home-public-store-badge">
              <strong>App Store</strong>
              <span>Bientôt disponible</span>
            </div>
          </div>

          <small className="home-public-install-warning">
            Version Android de test. Ton téléphone pourra demander
            l’autorisation d’installer une application provenant du navigateur.
          </small>
        </div>

        <div className="home-public-qr">
          <div className="home-public-qr-frame">
            <img
              src={androidQrUrl}
              alt="QR code pour télécharger l’application Android"
              width="320"
              height="320"
              loading="lazy"
              decoding="async"
              draggable="false"
            />
          </div>

          <strong>Scanner pour installer</strong>
          <span>Android uniquement pour le moment</span>
        </div>
      </div>
    </section>

      <section
        id="home-trips-section"
        className="home-library"
      >
        <div className="home-library-inner">
          <div className="home-library-head">
            <div>
              <div className="home-library-kicker">
                Reprendre la planification
              </div>

              <h2 className="home-library-title">
                Tes voyages t’attendent.
              </h2>

              <p className="home-library-text">
                Retrouve les itinéraires déjà créés, reprends une journée en cours,
                ajoute des étapes ou complète les logements, restaurants et documents.
              </p>
            </div>

            <div className="home-library-count">
              {safeTrips.length
                ? safeTrips.length + ' voyage' + (safeTrips.length > 1 ? 's' : '')
                : 'Aucun voyage'}
            </div>
          </div>

          {loggedOut ? (
            <div className="home-trip-empty">
              <div className="home-trip-empty-title">
                Connecte-toi pour retrouver tes voyages.
              </div>

              <div>
                Tes itinéraires sauvegardés apparaîtront ici une fois connecté.
              </div>
            </div>
          ) : safeTrips.length ? (
            <div className="home-trip-grid">
              {safeTrips.map(function renderTripCard(trip, index) {
                const image =  trip.cover_image_url ||  trip.coverImageUrl ||  tripImages[index % tripImages.length];

                return (
                  <article
                    key={trip.id || index}
                    className="home-trip-card"
                  >
                    <div className="home-trip-cover">
                      <img
                        src={image}
                        alt=""
                        width="680"
                        height="340"
                        loading="lazy"
                        decoding="async"
                        draggable="false"
                        aria-hidden="true"
                      />

                      <div className="home-trip-chip">
                        {tripDateRange(trip)}
                      </div>
                    </div>

                    <div className="home-trip-card-body">
                      <h3 className="home-trip-card-title">
                        {trip.name || 'Voyage sans titre'}
                      </h3>

                      <div className="home-trip-card-meta">
                        Reprendre la planification, compléter les étapes et préparer les détails du voyage.
                      </div>

                      <div className="home-trip-card-actions">
                        <button
                          type="button"
                          className="home-trip-resume"
                          onClick={() => openTrip(trip.id)}
                        >
                          Reprendre
                        </button>

                        <button
                          type="button"
                          className="home-trip-map"
                          title="Ouvrir le voyage"
                          aria-label={
                            'Ouvrir le voyage ' +
                            (
                              trip.name ||
                              'sans titre'
                            )
                          }
                          onClick={() => openTrip(trip.id)}
                        >
                          <Icon name="map" size={17} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="home-trip-empty">
              <div className="home-trip-empty-title">
                Aucun voyage pour le moment.
              </div>

              <div>
                Crée ton premier itinéraire avec la barre au-dessus.
                Il apparaîtra ici automatiquement.
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="home-info-footer">
        <div className="home-info-footer-inner">
          <strong>La Fabrique à Voyages</strong>

          <nav aria-label="Informations légales">
            <a href="./informations.html#confidentialite">
              Confidentialité
            </a>

            <a href="./informations.html#conditions">
              Conditions d’utilisation
            </a>

            <a href="./informations.html#assistance">
              Assistance
            </a>

            <a href="./informations.html#mentions-legales">
              Mentions légales
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function LoggedOutHome() {
  const [authOpen, setAuthOpen] = React.useState(false);

  return (
    <React.Fragment>
      <HomeHero
        mode="loggedOut"
        onAuthOpen={() => setAuthOpen(true)}
      />

      {authOpen && (
        <AuthModal onClose={() => setAuthOpen(false)} />
      )}
    </React.Fragment>
  );
}

function NoTripHome() {
  const { trips = [] } = Store.useStore(function select(state) {
    return {
      trips: state.trips || []
    };
  });

  return (
    <HomeHero
      mode="create"
      trips={trips}
    />
  );
}

function LoadingTrip() {
  const [slow, setSlow] =
    React.useState(false);

  React.useEffect(function detectSlowLoading() {
    const timer = window.setTimeout(
      function showSlowMessage() {
        setSlow(true);
      },
      4500
    );

    return function cleanup() {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <section
      className="trip-loading"
      role="status"
      aria-live="polite"
      aria-label="Chargement du voyage"
    >
      <div className="trip-loading-card">
        <div className="trip-loading-heading">
          Préparation du carnet…
        </div>

        <div className="trip-loading-line" />
        <div className="trip-loading-line" />
        <div className="trip-loading-line short" />

        {slow && (
          <div className="trip-loading-slow">
            Le chargement prend plus de temps que prévu.
            Vérifie ta connexion si rien ne s’affiche.
          </div>
        )}
      </div>
    </section>
  );
}

  function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value || '').trim()
  );
}

function friendlyAuthError(error) {
  const message = safeString(
    error && error.message ? error.message : error
  );

  const normalized = message.toLowerCase();

  if (!message) {
    return 'Une erreur est survenue. Réessaie dans quelques instants.';
  }

  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid credentials')
  ) {
    return 'Adresse e-mail ou mot de passe incorrect.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Confirme d’abord ton adresse e-mail avec le code reçu.';
  }

  if (
    normalized.includes('user already registered') ||
    normalized.includes('user already exists')
  ) {
    return 'Impossible de créer ce compte. Essaie de te connecter ou utilise “Mot de passe oublié”.';
  }

  if (
    normalized.includes('rate limit') ||
    normalized.includes('over_email_send_rate_limit')
  ) {
    return 'Trop de demandes ont été envoyées. Attends quelques minutes avant de réessayer.';
  }

  if (
    normalized.includes('otp expired') ||
    normalized.includes('token has expired') ||
    normalized.includes('invalid token') ||
    normalized.includes('token is invalid')
  ) {
    return 'Ce code est incorrect ou a expiré. Demande un nouveau code.';
  }

  if (
    normalized.includes('weak password') ||
    normalized.includes('password should be at least') ||
    normalized.includes('password must be at least')
  ) {
    return 'Le mot de passe doit contenir au moins 8 caractères.';
  }

  if (
    normalized.includes('email address is invalid') ||
    normalized.includes('invalid email')
  ) {
    return 'L’adresse e-mail indiquée n’est pas valide.';
  }

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network request failed')
  ) {
    return 'Connexion impossible. Vérifie ton accès à Internet puis réessaie.';
  }

  if (normalized.includes('signup is disabled')) {
    return 'La création de compte est temporairement indisponible.';
  }

  return message;
}

  function AuthModal({ onClose }) {
    const [mode, setMode] = React.useState('login');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [passwordConfirmation, setPasswordConfirmation] = React.useState('');
    const [pseudo, setPseudo] = React.useState('');
    const [confirmationSent, setConfirmationSent] = React.useState(false);
    const [confirmationCode, setConfirmationCode] = React.useState('');
    const [recoveryStep, setRecoveryStep] = React.useState('email');
    const [recoveryCode, setRecoveryCode] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [newPasswordConfirmation, setNewPasswordConfirmation] = React.useState('');
    const [error, setError] = React.useState('');
    const [busy, setBusy] = React.useState(false);

async function submit() {
  if (busy) return;

  const cleanEmail = email.trim().toLowerCase();

  setError('');

  try {
    if (!isValidEmail(cleanEmail)) {
      throw new Error('Indique une adresse e-mail valide.');
    }

    setBusy(true);

    if (mode === 'recovery') {
      if (recoveryStep === 'email') {
        await window.SB.requestPasswordReset(cleanEmail);
        setRecoveryStep('code');
        return;
      }

      if (!/^\d{8}$/.test(recoveryCode)) {
        throw new Error(
          'Le code de réinitialisation doit contenir exactement 8 chiffres.'
        );
      }

      if (newPassword.length < 8) {
        throw new Error(
          'Le nouveau mot de passe doit contenir au moins 8 caractères.'
        );
      }

      if (newPassword !== newPasswordConfirmation) {
        throw new Error('Les deux mots de passe sont différents.');
      }

      await window.SB.completePasswordReset({
        email: cleanEmail,
        token: recoveryCode,
        password: newPassword
      });

      Store.showToast('Ton mot de passe a été modifié.');
      onClose();
      return;
    }

    if (mode === 'login') {
      if (!password) {
        throw new Error('Indique ton mot de passe.');
      }

      await window.SB.signIn(cleanEmail, password);
      onClose();
      return;
    }

    if (confirmationSent) {
      if (!/^\d{8}$/.test(confirmationCode)) {
        throw new Error(
          'Le code de confirmation doit contenir exactement 8 chiffres.'
        );
      }

      await window.SB.confirmSignUp(
        cleanEmail,
        confirmationCode
      );

      Store.showToast('Adresse confirmée, bienvenue !');
      onClose();
      return;
    }

    if (password.length < 8) {
      throw new Error(
        'Le mot de passe doit contenir au moins 8 caractères.'
      );
    }

    if (password !== passwordConfirmation) {
      throw new Error('Les deux mots de passe sont différents.');
    }

    await window.SB.signUp(
      cleanEmail,
      password,
      pseudo.trim() || null
    );

    setPassword('');
    setPasswordConfirmation('');
    setConfirmationSent(true);
  } catch (err) {
    console.error('Authentification :', err);
    setError(friendlyAuthError(err));
  } finally {
    setBusy(false);
  }
}

    return (
      <ModalShell
        title={
          confirmationSent
            ? 'Confirme ton adresse'
            : mode === 'recovery'
              ? 'Nouveau mot de passe'
              : mode === 'login'
                ? 'Connexion'
                : 'Créer un compte'
        }
        onClose={onClose}
        onSubmit={submit}
      >
        {!confirmationSent && mode !== 'recovery' && (
          <div className="mode-tabs">
            <button
              type="button"
              className={'mode-tab' + (mode === 'login' ? ' active' : '')}
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              Se connecter
            </button>

            <button
              type="button"
              className={'mode-tab' + (mode === 'signup' ? ' active' : '')}
              onClick={() => {
                setMode('signup');
                setError('');
              }}
            >
              Créer un compte
            </button>
          </div>
        )}

        {mode === 'recovery' && (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setRecoveryStep('email');
              setRecoveryCode('');
              setNewPassword('');
              setNewPasswordConfirmation('');
              setError('');
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--accent)',
              padding: '0 0 12px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            ← Retour à la connexion
          </button>
        )}

        {mode === 'signup' && !confirmationSent && (
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
                        readOnly={
              confirmationSent ||
              (mode === 'recovery' && recoveryStep === 'code')
            }
          />
        </Field>

        {!confirmationSent && mode !== 'recovery' && (
          <Field label="Mot de passe">
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </Field>
)}

{mode === 'signup' && !confirmationSent && (
  <Field label="Confirmer le mot de passe">
    <input
      type="password"
      value={passwordConfirmation}
      onChange={event => setPasswordConfirmation(event.target.value)}
      placeholder="Répète ton mot de passe"
      autoComplete="new-password"
    />
  </Field>
)}

        {mode === 'login' && !confirmationSent && (
          <button
            type="button"
            onClick={() => {
              setMode('recovery');
              setRecoveryStep('email');
              setError('');
            }}
            style={{
              display: 'block',
              marginLeft: 'auto',
              marginTop: 8,
              border: 'none',
              background: 'transparent',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700
            }}
          >
            Mot de passe oublié ?
          </button>
        )}

        {confirmationSent && (
          <React.Fragment>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--muted)',
                marginBottom: 12
              }}
            >
              Un code de confirmation a été envoyé à <strong>{email}</strong>.
              Saisis-le ci-dessous pour activer ton compte.
            </div>

            <Field label="Code de confirmation">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={confirmationCode}
                onChange={event => setConfirmationCode(
                  event.target.value.replace(/\D/g, '').slice(0, 8)
                )}
                placeholder="00000000"
                maxLength={8}
                autoFocus
              />
            </Field>
          </React.Fragment>
        )}

        {mode === 'recovery' && recoveryStep === 'email' && (
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: 'var(--muted)',
              marginTop: 8
            }}
          >
            Indique l’adresse associée à ton compte. Nous t’enverrons un
            code de réinitialisation à 8 chiffres.
          </div>
        )}

        {mode === 'recovery' && recoveryStep === 'code' && (
          <React.Fragment>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--muted)',
                marginBottom: 12
              }}
            >
              Un code a été envoyé à <strong>{email}</strong>.
            </div>

            <Field label="Code de réinitialisation">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={recoveryCode}
                onChange={event => setRecoveryCode(
                  event.target.value.replace(/\D/g, '').slice(0, 8)
                )}
                placeholder="00000000"
                maxLength={8}
                autoFocus
              />
            </Field>

            <Field label="Nouveau mot de passe">
              <input
                type="password"
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                placeholder="8 caractères minimum"
                autoComplete="new-password"
              />
            </Field>

            <Field label="Confirmer le mot de passe">
              <input
                type="password"
                value={newPasswordConfirmation}
                onChange={event => setNewPasswordConfirmation(
                  event.target.value
                )}
                placeholder="Répète ton mot de passe"
                autoComplete="new-password"
              />
            </Field>
          </React.Fragment>
        )}

        {error && (
          <div
            className="auth-form-error"
            role="alert"
            aria-live="assertive"
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
            type="submit"
            variant="primary"
            disabled={busy}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '11px'
            }}
          >
            {
              busy
                ? '...'
                : mode === 'recovery'
                  ? recoveryStep === 'email'
                    ? 'Envoyer le code'
                    : 'Enregistrer le nouveau mot de passe'
                  : confirmationSent
                    ? 'Confirmer mon compte'
                    : mode === 'login'
                      ? 'Se connecter'
                      : 'Créer mon compte'
            }
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
  const cleanName = name.trim();

  if (!cleanName) {
    setError('Donne un nom à ton voyage.');
    return;
  }

  if (startDate && endDate && endDate < startDate) {
    setError('La date de retour doit être postérieure à la date de départ.');
    return;
  }

  setError('');
  setBusy(true);

  try {
    const created = await window.SB.createTrip({
      name: cleanName,
      startDate: startDate || null,
      endDate: endDate || null,
      days: Math.max(1, Number(days) || 1)
    });

    const nextTrips = await window.SB.listMyTrips();
    const fullTrip = await window.SB.loadTrip(created.id);

    Store.set({
      trips: nextTrips,
      activeTripId: created.id,
      trip: fullTrip,
      selectedDayIndex: 0,
      selectedStepId: null,
      pendingEditStepId: null,
      view: 'itinerary'
    });

    Store.showToast(
      'Voyage « ' + created.name + ' » créé ✓'
    );

    onClose();
  } catch (err) {
    setError(
      err.message || 'Impossible de créer le voyage.'
    );
  } finally {
    setBusy(false);
  }
}

    return (
      <ModalShell
        title="Nouveau voyage"
        onClose={onClose}
        onSubmit={submit}
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
            className="new-trip-form-error"
            role="alert"
            aria-live="assertive"
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
            type="submit"
            variant="primary"
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
      <label className="field">
        <span className="field-label">
          {label}
        </span>

        {children}
      </label>
    );
  }

  function ModalShell({
    title,
    onClose,
    onSubmit,
    children
  }) {
    const cardRef = React.useRef(null);

    React.useEffect(function manageDialogFocus() {
      const previousOverflow =
        document.body.style.overflow;

      const previousActiveElement =
        document.activeElement;

      function getFocusableElements() {
        const card = cardRef.current;

        if (!card) return [];

        return Array.from(
          card.querySelectorAll(
            [
              'a[href]',
              'button:not([disabled])',
              'input:not([disabled])',
              'select:not([disabled])',
              'textarea:not([disabled])',
              '[tabindex]:not([tabindex="-1"])'
            ].join(',')
          )
        ).filter(function keepVisible(element) {
          return (
            element.getAttribute(
              'aria-hidden'
            ) !== 'true'
          );
        });
      }

      function handleKeyDown(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
          return;
        }

        if (event.key !== 'Tab') {
          return;
        }

        const card = cardRef.current;

        if (!card) return;

        const focusableElements =
          getFocusableElements();

        if (!focusableElements.length) {
          event.preventDefault();
          card.focus();
          return;
        }

        const firstElement =
          focusableElements[0];

        const lastElement =
          focusableElements[
            focusableElements.length - 1
          ];

        const activeElement =
          document.activeElement;

        if (
          event.shiftKey &&
          (
            activeElement === firstElement ||
            !card.contains(activeElement)
          )
        ) {
          event.preventDefault();
          lastElement.focus();
          return;
        }

        if (
          !event.shiftKey &&
          activeElement === lastElement
        ) {
          event.preventDefault();
          firstElement.focus();
        }
      }

      document.body.style.overflow =
        'hidden';

      document.addEventListener(
        'keydown',
        handleKeyDown
      );

      const focusFrame =
        window.requestAnimationFrame(
          function focusDialog() {
            const card = cardRef.current;

            if (!card) return;

            const preferredElement =
              card.querySelector(
                [
                  'input:not([disabled]):not([readonly])',
                  'select:not([disabled])',
                  'textarea:not([disabled])'
                ].join(',')
              );

            const firstFocusable =
              getFocusableElements()[0];

            (
              preferredElement ||
              firstFocusable ||
              card
            ).focus();
          }
        );

      return function cleanupDialog() {
        window.cancelAnimationFrame(
          focusFrame
        );

        document.body.style.overflow =
          previousOverflow;

        document.removeEventListener(
          'keydown',
          handleKeyDown
        );

        if (
          previousActiveElement &&
          previousActiveElement.isConnected &&
          typeof previousActiveElement.focus ===
            'function'
        ) {
          previousActiveElement.focus();
        }
      };
    }, [onClose]);

    return ReactDOM.createPortal(
      <div
        className="modal-backdrop"
        onClick={onClose}
      >
        <div
          ref={cardRef}
          className="modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-modal-title"
          tabIndex="-1"
          onClick={event =>
            event.stopPropagation()
          }
        >
          <div className="modal-head">
            <div
              className="modal-title"
              id="app-modal-title"
            >
              {title}
            </div>

            <button
              type="button"
              className="topbar-icon-btn"
              aria-label="Fermer la fenêtre"
              onClick={onClose}
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          <div className="modal-body">
            {onSubmit ? (
              <form
                className="modal-form"
                noValidate
                onSubmit={event => {
                  event.preventDefault();
                  onSubmit();
                }}
              >
                {children}
              </form>
            ) : (
              children
            )}
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
