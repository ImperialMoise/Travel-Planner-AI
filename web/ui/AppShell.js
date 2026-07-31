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
    height:62px;
    flex-shrink:0;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:18px;
    padding:0 18px;
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
    display:flex;
    align-items:baseline;
    gap:7px;
    font-family:var(--font-serif);
    font-style:italic;
    font-size:25px;
    line-height:1;
    color:var(--accent);
    white-space:nowrap;
    cursor:pointer;
    transition:transform .18s ease, filter .18s ease;
  }

  .topbar-brand:hover{
    transform:translateY(-1px);
    filter:brightness(.92);
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
    gap:5px;
    flex-shrink:0;
  }

  .topbar-nav-btn{
    min-height:34px;
    border:1px solid transparent;
    background:transparent;
    color:var(--muted);
    cursor:pointer;
    font-size:13px;
    font-weight:800;
    font-family:inherit;
    padding:7px 15px;
    border-radius:8px;
    transition:transform .18s ease, box-shadow .18s ease, background .18s ease, color .18s ease;
  }

  .topbar-nav-btn:hover{
    transform:translateY(-2px);
    background:var(--card);
    color:var(--text);
    box-shadow:0 5px 12px rgba(66, 48, 18, .10);
  }

  .topbar-nav-btn.active{
    background:var(--accent);
    color:var(--accent-ink);
    box-shadow:0 4px 10px var(--accent-shadow);
  }

  .topbar-nav-btn.active:hover{
    transform:translateY(-1px);
    box-shadow:0 6px 14px var(--accent-shadow);
  }

  .topbar.compact .topbar-nav-btn{
    font-size:12px;
    padding:7px 10px;
  }

  .trip-switcher{
    position:relative;
  }

  .trip-switcher-btn{
    display:flex;
    align-items:center;
    gap:8px;
    min-height:34px;
    padding:6px 11px;
    background:var(--inset);
    border:1px solid var(--outline-variant);
    border-radius:8px;
    cursor:pointer;
    font-size:13px;
    font-weight:800;
    font-family:inherit;
    color:var(--text);
    max-width:250px;
    transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
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
    width:19px;
    height:19px;
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
  width:280px;
  background:var(--surface-container-low,#f8f3e9);
  border-right:1px solid var(--outline-variant);
  overflow:hidden;
}

.day-spine-head{
  padding:22px 18px 18px;
  border-bottom:1px solid rgba(212,196,179,.72);
  background:linear-gradient(180deg,rgba(254,249,239,.96),rgba(248,243,233,.92));
}

.day-spine-eyebrow{
  font-family:var(--font-mono);
  font-size:10px;
  line-height:14px;
  letter-spacing:.16em;
  text-transform:uppercase;
  color:var(--muted);
  font-weight:800;
}

.day-spine-title{
  margin-top:6px;
  font-family:var(--font-serif);
  font-size:24px;
  line-height:29px;
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
  padding:10px 8px;
  margin:0 0 10px;
  border:1px solid transparent;
  border-radius:18px;
  background:transparent;
  cursor:pointer;
  text-align:left;
  color:inherit;
  font-family:inherit;
  transition:
    background .18s ease,
    border-color .18s ease,
    box-shadow .18s ease,
    transform .18s ease;
}

.day-card:hover{
  background:rgba(255,255,255,.58);
  border-color:rgba(212,196,179,.78);
}

.day-card.active{
  background:rgba(255,255,255,.88);
  border-color:rgba(124,84,16,.28);
  box-shadow:0 14px 30px rgba(82,98,91,.11);
  transform:translateX(2px);
}

.day-card.active::before{
  content:"";
  position:absolute;
  left:0;
  top:14px;
  bottom:14px;
  width:3px;
  border-radius:0 999px 999px 0;
  background:var(--accent);
}

.day-card-num{
  width:40px;
  height:40px;
  border-radius:14px;
  border:1px solid rgba(212,196,179,.95);
  background:rgba(255,255,255,.88);
  color:var(--muted);
  display:grid;
  place-items:center;
  flex-shrink:0;
  font-family:var(--font-mono);
  font-size:12px;
  line-height:14px;
  font-weight:900;
  box-shadow:0 4px 14px rgba(82,98,91,.06);
}

.day-card.active .day-card-num{
  background:var(--accent);
  border-color:var(--accent);
  color:var(--accent-ink);
  box-shadow:0 10px 20px rgba(124,84,16,.18);
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
  background-size:cover;
  background-position:center;
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

    .home-hero-title{
    font-size:42px;
    line-height:44px;
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
            <span>La Fabrique</span>
            <span className="topbar-brand-suffix">à Voyages</span>
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
  const title = getDisplayDayTitle(day) || 'Journée à préciser';
  const dateStr = formatDayDate(day.dateISO) || 'Date à définir';

  const preparation = [
    { label: 'programme', ready: tags.steps > 0 },
    { label: 'repas', ready: tags.restaurants > 0 },
    { label: 'hébergement', ready: tags.lodgings > 0 }
  ];

  const preparationDone = preparation.filter(item => item.ready).length;
  const preparationMissing = preparation
    .filter(item => !item.ready)
    .map(item => item.label)
    .join(', ');

  return (
    <button
      key={day.id || index}
      type="button"
      className={'day-card' + (active ? ' active' : '')}
      onClick={() => Store.set({ selectedDayIndex: index })}
    >
      <span className="day-card-num">
        J{index + 1}
      </span>

      <span className="day-card-body">
        <span className="day-card-title">
          {title}
        </span>

        <span className="day-card-date">
          <Icon name="cal" size={11} />
          {dateStr}
        </span>

        <span
  className={'day-card-progress' + (preparationDone === 3 ? ' complete' : '')}
  title={
    preparationDone === 3
      ? 'Journée entièrement préparée'
      : 'À compléter : ' + preparationMissing
  }
>
  <span className="day-card-progress-track" aria-hidden="true">
    <span
      className="day-card-progress-fill"
      style={{ width: `${(preparationDone / preparation.length) * 100}%` }}
    />
  </span>

  <span>
    {preparationDone === 3 ? 'Prête' : `${preparationDone}/3 préparé`}
  </span>
</span>

        <span
          className="day-card-note"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="+ note..."
          onBlur={event => handleDayNoteBlur(day, event)}
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

 function HomeHero({
  mode,
  trips,
  onAuthOpen
}) {
  const heroImages = React.useMemo(function buildHeroImages() {
    return [
      {
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=90',
        label: 'Lac alpin au lever du soleil'
      },
      {
        url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=2200&q=90',
        label: 'Côte amalfitaine, Italie'
      },
      {
        url: 'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=2200&q=90',
        label: 'Kyoto, Japon'
      },
      {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=2200&q=90',
        label: 'Désert et lumière dorée'
      },
      {
        url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=2200&q=90',
        label: 'Cascade et grands espaces'
      }
    ];
  }, []);

  const tripImages = React.useMemo(function buildTripImages() {
    return [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=86',
      'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=1200&q=86',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=86',
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=86',
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=86'
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
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const loggedOut = mode === 'loggedOut';
  const safeTrips = Array.isArray(trips) ? trips : [];
  const activeImage = heroImages[imageIndex] || heroImages[0];
  const androidApkUrl =
  'https://github.com/ImperialMoise/Travel-Planner-AI/releases/download/android-latest/la-fabrique-a-voyages.apk';

  const androidQrUrl =
  'https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=' +
  encodeURIComponent(androidApkUrl);

  React.useEffect(function rotateHeroImage() {
    const timer = window.setInterval(function nextImage() {
      setImageIndex(function updateIndex(current) {
        return (current + 1) % heroImages.length;
      });
    }, 7000);

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
  const cleanDestination = safeString(destination);

  if (!cleanDestination) {
    setError(
      'Indique une destination pour commencer ton voyage.'
    );
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
      startDate: startDate || null,
      endDate: endDate || null,
      days: daysBetweenInclusive(startDate, endDate)
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
              loading="lazy"
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
              loading="lazy"
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
                    <div
                      className="home-trip-cover"
                      style={{
                        backgroundImage: 'url("' + image + '")'
                      }}
                    >
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
