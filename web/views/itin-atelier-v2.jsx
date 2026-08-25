// ════════════════════════════════════════════════════════════
// itin-atelier-v2.jsx — Vue Itinéraire Atelier refactorisée
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Afficher l’itinéraire du voyage actif.
// - Gérer la journée sélectionnée.
// - Afficher la timeline centrale avec StepCard.
// - Afficher la colonne droite avec MealRail.
// - Ouvrir StepEditor pour ajouter / modifier.
// - Gérer le titre et la note du jour.
// - Réordonner les étapes par drag & drop.
// - Utiliser les composants extraits progressivement.
//
// Dépendances globales :
// - React
// - ReactDOM
// - Store
// - Icon
// - window.SB
// - window.StepEditor
// - window.StepCard
// - window.MealRail
// - window.ItineraryUtils
//
// Export :
// - window.AtelierV2
//
// ════════════════════════════════════════════════════════════

(function initAtelierV2() {
  const U = window.ItineraryUtils || {};

  const ATELIER_CSS = `
  .atelier-v2{
    flex:1;
    min-width:0;
    min-height:0;
    height:100%;
    display:flex;
    flex-direction:column;
    background:var(--bg);
    color:var(--text);
    overflow:hidden;
  }

  .atelier-v2-main{
    flex:1;
    min-height:0;
    min-width:0;
    display:flex;
    flex-direction:column;
    overflow-y:auto;
    overflow-x:hidden;
    scrollbar-gutter:stable;
  }

  /* ── Hero : encadré 3/3 pleine largeur ── */
  .atelier-v2-hero{
    position:relative;
    min-height:270px;
    border-radius:24px;
    overflow:hidden;
    margin:22px 28px 16px;
    background:var(--card);
    border:1px solid var(--line);
    box-shadow:0 14px 38px rgba(54,42,27,.10);
    animation:atelier-day-enter .28s ease both;
  }

  .atelier-v2-hero-img{
    position:absolute;
    inset:0;
    width:100%;
    height:100%;
    object-fit:cover;
    opacity:.74;
    transform:scale(1.01);
    transition:transform .7s ease;
  }

  .atelier-v2-hero:hover .atelier-v2-hero-img{
    transform:scale(1.045);
  }

  .atelier-v2-hero-overlay{
    position:absolute;
    inset:0;
    background:linear-gradient(90deg,var(--card) 0%,rgba(254,249,239,.94) 42%,rgba(254,249,239,.30) 100%);
  }

  .atelier-v2-hero-inner{
    position:relative;
    z-index:1;
    display:flex;
    flex-direction:column;
    justify-content:center;
    min-height:270px;
    padding:32px 36px;
    max-width:720px;
  }

  .atelier-v2-hero-badges{
    display:flex;
    align-items:center;
    gap:10px;
    margin-bottom:12px;
    flex-wrap:wrap;
  }

  .atelier-v2-hero-badge{
    display:inline-flex;
    align-items:center;
    min-height:28px;
    padding:0 12px;
    background:var(--accent-soft);
    border-radius:7px;
    font-family:var(--font-mono,monospace);
    font-size:11px;
    font-weight:900;
    letter-spacing:.12em;
    text-transform:uppercase;
    color:var(--accent);
    border:1px solid rgba(124,84,16,.18);
  }

  .atelier-v2-hero-date{
    display:inline-flex;
    align-items:center;
    min-height:28px;
    padding:0 12px;
    border-radius:7px;
    background:var(--surface-container,#f2ede3);
    font-family:var(--font-mono,monospace);
    font-size:11px;
    font-weight:700;
    color:var(--muted);
  }

  .atelier-v2-hero-title{
    font-family:var(--font-serif);
    font-size:42px;
    line-height:46px;
    color:var(--text);
    font-weight:400;
    letter-spacing:-.035em;
    margin-bottom:10px;
  }

  .atelier-v2-hero-note{
    max-width:560px;
    font-size:14.5px;
    line-height:22px;
    color:var(--muted);
    margin:0;
  }

  .atelier-v2-hero-actions{
    position:relative;
    z-index:2;
    display:flex;
    gap:10px;
    margin-top:22px;
    flex-wrap:wrap;
  }

  .atelier-v2-hero-btn{
    border:1px solid var(--line);
    background:var(--card);
    color:var(--text);
    border-radius:11px;
    min-height:44px;
    padding:0 16px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    cursor:pointer;
    font-family:inherit;
    font-size:12.5px;
    font-weight:900;
    box-shadow:0 5px 14px rgba(54,42,27,.07);
    transition:
      transform .18s var(--ease-out),
      border-color .18s ease,
      background .18s ease,
      color .18s ease;
  }

  .atelier-v2-hero-btn:hover{
    transform:translateY(-1px);
    border-color:var(--accent);
    color:var(--accent);
    background:var(--accent-soft);
  }

  .atelier-v2-hero-btn:focus-visible{
    outline:3px solid var(--accent-soft);
    outline-offset:2px;
  }

  .atelier-v2-hero-btn.primary{
    background:var(--accent);
    border-color:var(--accent);
    color:var(--accent-ink,#fff);
  }

  .atelier-v2-hero-btn.primary:hover{
    filter:brightness(.96);
  }

  /* ── Body 2/3 + 1/3 ── */
    .atelier-v2-body{
    display:grid;
    grid-template-columns:minmax(0,2fr) minmax(280px,1fr);
    gap:14px;
    flex:1;
    min-height:0;
    padding:0 34px 34px;
  }

  .atelier-v2-content{
    min-width:0;
    min-height:0;
  }

  .atelier-v2-sidebar{
    min-width:0;
    min-height:0;
  }

  .atelier-v2-sidebar > aside{
    width:100% !important;
    border-left:none !important;
    height:auto !important;
    overflow:visible !important;
    background:transparent !important;
  }

  .atelier-v2-sidebar > aside > div{
    padding:0 !important;
    overflow:visible !important;
  }

  .atelier-v2-plan-card{
    min-height:372px;
    background:var(--card);
    border:1px solid var(--line);
    border-radius:20px;
    box-shadow:0 10px 30px rgba(54,42,27,.075);
    overflow:hidden;
  }

  .atelier-v2-plan-head{
    min-height:60px;
    padding:13px 16px;
    border-bottom:1px solid var(--line);
    background:
      linear-gradient(
        90deg,
        rgba(243,238,228,.78),
        rgba(255,253,249,.94)
      );
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:12px;
  }

  .atelier-v2-plan-title{
    display:flex;
    align-items:center;
    gap:8px;
    font-size:13px;
    font-weight:900;
    color:var(--text);
  }

  .atelier-v2-plan-actions{
    display:flex;
    align-items:center;
    gap:8px;
  }

  .atelier-v2-plan-icon-btn{
    width:32px;
    height:32px;
    border:0;
    border-radius:8px;
    background:transparent;
    color:var(--muted);
    cursor:pointer;
    display:grid;
    place-items:center;
  }

  .atelier-v2-plan-icon-btn:hover{
    background:var(--inset);
    color:var(--accent);
  }

  .atelier-v2-kicker{
    font-size:11px;
    font-weight:800;
    letter-spacing:.17em;
    text-transform:uppercase;
    color:var(--accent);
  }

  .atelier-v2-actions{
    display:flex;
    align-items:center;
    gap:8px;
    flex-wrap:wrap;
    justify-content:flex-end;
  }

  .atelier-v2-btn{
    border:1px solid var(--outline-variant);
    background:var(--card);
    color:var(--text);
    border-radius:999px;
    min-height:38px;
    padding:0 14px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:7px;
    cursor:pointer;
    font-family:inherit;
    font-size:12.5px;
    font-weight:800;
    box-shadow:0 2px 8px rgba(82,98,91,.05);
  }

  .atelier-v2-btn:hover{
    border-color:var(--accent);
    color:var(--accent);
  }

  .atelier-v2-btn.primary{
    border-color:var(--accent);
    background:var(--accent);
    color:var(--accent-ink);
  }

  .atelier-v2-btn.danger{
    border-color:rgba(192,86,63,.34);
    background:rgba(192,86,63,.08);
    color:#c0563f;
  }

  .atelier-v2-stats{
    display:grid;
    grid-template-columns:repeat(4,minmax(0,1fr));
    gap:10px;
    margin-bottom:22px;
  }

  .atelier-v2-stat{
    background:var(--card);
    border:1px solid var(--outline-variant);
    border-radius:16px;
    padding:13px 14px;
    box-shadow:var(--shadow);
    min-width:0;
  }

  .atelier-v2-stat-value{
    font-family:var(--font-serif);
    font-size:28px;
    line-height:32px;
    color:var(--text);
  }

  .atelier-v2-stat-label{
    margin-top:3px;
    color:var(--muted);
    font-size:11px;
    font-weight:800;
    letter-spacing:.08em;
    text-transform:uppercase;
  }

  .atelier-v2-note{
    background:var(--soft);
    border:1px solid rgba(217,182,126,.32);
    border-radius:16px;
    padding:16px 18px;
    color:var(--muted);
    font-size:14px;
    line-height:21px;
    font-style:italic;
    margin-bottom:22px;
    position:relative;
    overflow:hidden;
  }

  .atelier-v2-note:before{
    content:'';
    position:absolute;
    right:0;
    top:0;
    width:42px;
    height:42px;
    border-radius:0 0 0 16px;
    background:rgba(217,182,126,.12);
  }

  .atelier-v2-timeline{
    display:flex;
    flex-direction:column;
    gap:10px;
    padding:12px 12px 30px;
    background:var(--card);
  }

  .atelier-v2-drop{
    transition:transform .15s,border-color .15s;
  }

  .atelier-v2-touch-order{
    display:none;
  }

  .atelier-v2-drop.over{
    transform:translateY(5px);
  }

  .atelier-v2-drop.over:before{
    content:'';
    display:block;
    height:3px;
    border-radius:999px;
    background:var(--accent);
    margin-bottom:10px;
    box-shadow:0 0 0 4px var(--accent-soft);
  }

  .atelier-v2-add{
    width:100%;
    min-height:58px;
    border:2px dashed var(--outline-variant);
    background:var(--inset);
    color:var(--muted);
    border-radius:16px;
    cursor:pointer;
    font-family:inherit;
    font-size:13px;
    font-weight:900;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
  }

  .atelier-v2-add:hover{
    border-color:var(--accent);
    color:var(--accent);
    background:var(--accent-soft);
  }

  .atelier-v2-empty{
    min-height:150px;
    border:1px dashed rgba(150,100,13,.28);
    background:
      linear-gradient(
        135deg,
        var(--inset),
        rgba(255,253,249,.96)
      );
    border-radius:16px;
    padding:30px 24px;
    color:var(--muted);
    text-align:center;
    line-height:21px;
    margin-bottom:14px;
    display:flex;
    align-items:center;
    justify-content:center;
  }

  .atelier-v2-reminder{
    border:1px solid var(--outline-variant);
    background:var(--card);
    border-radius:14px;
    padding:13px 15px;
    display:flex;
    align-items:center;
    gap:13px;
    cursor:pointer;
    box-shadow:var(--shadow);
  }

  .atelier-v2-reminder:hover{
    border-color:var(--accent);
  }

  .atelier-v2-reminder-icon{
    width:38px;
    height:38px;
    border-radius:13px;
    background:var(--accent-soft);
    color:var(--accent);
    display:grid;
    place-items:center;
    flex-shrink:0;
  }

  .atelier-v2-reminder-title{
    font-size:13px;
    font-weight:900;
    color:var(--text);
    line-height:18px;
  }

  .atelier-v2-reminder-sub{
    margin-top:2px;
    font-size:12px;
    color:var(--muted);
    line-height:17px;
  }

  .atelier-v2-modal-backdrop{
    position:fixed;
    inset:0;
    z-index:320;
    background:rgba(21,48,42,.36);
    backdrop-filter:blur(7px);
    -webkit-backdrop-filter:blur(7px);
    display:flex;
    align-items:flex-start;
    justify-content:center;
    padding:86px 24px 24px;
  }

  .atelier-v2-modal{
    width:100%;
    max-width:500px;
    background:var(--card);
    color:var(--text);
    border:1px solid var(--outline-variant);
    border-radius:20px;
    box-shadow:0 40px 90px rgba(0,0,0,.34);
    overflow:hidden;
  }

  .atelier-v2-modal-head{
    padding:18px 20px;
    border-bottom:1px solid var(--outline-variant);
    background:var(--soft);
    display:flex;
    justify-content:space-between;
    gap:16px;
    align-items:flex-start;
  }

  .atelier-v2-modal-body{
    padding:20px;
  }

  .atelier-v2-field{
    margin-bottom:14px;
  }

  .atelier-v2-label{
    display:block;
    font-size:11px;
    font-weight:800;
    letter-spacing:.08em;
    text-transform:uppercase;
    color:var(--muted);
    margin-bottom:6px;
  }

  .atelier-v2-input,
  .atelier-v2-textarea{
    width:100%;
    border:1px solid var(--outline-variant);
    background:var(--inset);
    color:var(--text);
    border-radius:12px;
    padding:10px 12px;
    font-family:inherit;
    font-size:14px;
    outline:none;
  }

  .atelier-v2-textarea{
    min-height:92px;
    resize:vertical;
    line-height:20px;
  }

    .atelier-v2-hero{
    background:var(--card);
  }

  .atelier-v2-hero-img{
    opacity:1;
  }

  .atelier-v2-hero-overlay{
    display:none;
  }

  .atelier-v2-hero.has-cover .atelier-v2-hero-overlay{
    display:block;
    background:rgba(13,27,23,.42);
  }

  .atelier-v2-hero.has-cover .atelier-v2-hero-title,
  .atelier-v2-hero.has-cover .atelier-v2-hero-note{
    color:#fff;
    text-shadow:0 2px 14px rgba(0,0,0,.45);
  }

.atelier-v2-hero.has-cover .atelier-v2-hero-badge,
.atelier-v2-hero.has-cover .atelier-v2-hero-date{
  color:#fff;
  border-color:rgba(255,255,255,.52);
  background:rgba(13,27,23,.74);
  box-shadow:0 5px 16px rgba(0,0,0,.18);
  backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);
}

  .atelier-v2-hero.has-cover .atelier-v2-hero-btn:not(.primary){
    background:rgba(255,255,255,.92);
  }

  .atelier-v2-hero-credit{
    position:absolute;
    z-index:3;
    right:16px;
    bottom:14px;
    max-width:calc(100% - 32px);
    padding:6px 9px;
    border-radius:6px;
    background:rgba(13,27,23,.62);
    color:rgba(255,255,255,.94);
    font-size:10px;
    line-height:14px;
    text-decoration:none;
  }

  .atelier-v2-cover-modal{
    max-width:900px;
  }

  .atelier-v2-cover-modal-title{
    margin-top:3px;
    font-family:var(--font-serif);
    font-size:26px;
    line-height:32px;
  }

  .atelier-v2-cover-search{
    display:flex;
    gap:10px;
    margin-bottom:16px;
  }

  .atelier-v2-cover-search .atelier-v2-input{
    min-width:0;
    flex:1;
  }

  .atelier-v2-cover-grid{
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:12px;
  }

  .atelier-v2-cover-option{
    position:relative;
    min-height:185px;
    overflow:hidden;
    border:1px solid var(--outline-variant);
    border-radius:12px;
    background:var(--inset);
    cursor:pointer;
    text-align:left;
  }

  .atelier-v2-cover-option:hover{
    border-color:var(--accent);
    box-shadow:var(--shadow-lg);
    transform:translateY(-2px);
  }

  .atelier-v2-cover-option img{
    width:100%;
    height:185px;
    display:block;
    object-fit:cover;
  }

  .atelier-v2-cover-option-info{
    position:absolute;
    left:0;
    right:0;
    bottom:0;
    padding:11px 12px;
    background:rgba(13,27,23,.72);
    color:#fff;
  }

  .atelier-v2-cover-option-info strong,
  .atelier-v2-cover-option-info small{
    display:block;
  }

  .atelier-v2-cover-option-info strong{
    font-size:12px;
  }

  .atelier-v2-cover-option-info small{
    margin-top:2px;
    font-size:10px;
    opacity:.82;
  }

  .atelier-v2-cover-error,
  .atelier-v2-cover-empty{
    margin-bottom:14px;
    padding:12px;
    border-radius:10px;
    background:var(--inset);
    color:var(--muted);
    font-size:13px;
  }

  .atelier-v2-cover-error{
    color:var(--danger);
  }

  .atelier-v2-cover-empty{
    display:flex;
    align-items:center;
    gap:9px;
  }

    .atelier-v2-hero-icon-btn{
    width:40px;
    min-width:40px;
    height:40px;
    border:1px solid var(--outline-variant);
    border-radius:8px;
    background:var(--card);
    color:var(--text);
    display:grid;
    place-items:center;
    cursor:pointer;
    box-shadow:0 2px 8px rgba(82,98,91,.06);
  }

  .atelier-v2-hero-icon-btn:hover{
    border-color:var(--accent);
    color:var(--accent);
    background:var(--accent-soft);
  }

  .atelier-v2-hero.has-cover .atelier-v2-hero-icon-btn{
    background:rgba(255,255,255,.92);
  }

  .atelier-v2-hero.crop-editable{
    touch-action:none;
  }

  .atelier-v2-hero.crop-editable .atelier-v2-hero-img{
    cursor:grab;
  }

  @keyframes atelier-day-enter{
  from{
    opacity:.84;
    transform:translateY(4px);
  }

  to{
    opacity:1;
    transform:translateY(0);
  }
}

@media (prefers-reduced-motion:reduce){
  .atelier-v2-hero{
    animation:none;
  }
}

  @media(max-width:620px){
    .atelier-v2-cover-search,
    .atelier-v2-cover-grid{
      grid-template-columns:1fr;
    }

    .atelier-v2-cover-search{
      flex-direction:column;
    }
  }

  @media(max-width:1180px){
    .atelier-v2-body{
      grid-template-columns:minmax(0,1fr);
      padding:0 24px 34px;
    }

    .atelier-v2-sidebar{
      border-left:none;
      padding-left:0;
      border-top:1px solid var(--outline-variant);
      padding-top:22px;
      margin-top:14px;
    }
  }

  @media(max-width:760px){
    .atelier-v2-main{
      width:100%;
      scrollbar-gutter:auto;
      overscroll-behavior:contain;
      -webkit-overflow-scrolling:touch;
    }

        .atelier-v2-drop{
      touch-action:pan-y pinch-zoom;
    }

    .atelier-v2-touch-order{
      display:flex;
      align-items:center;
      justify-content:flex-end;
      gap:6px;
      margin:0 2px 6px;
    }

    .atelier-v2-touch-order button{
      width:38px;
      height:34px;
      display:grid;
      place-items:center;
      padding:0;
      border:1px solid var(--outline-variant);
      border-radius:10px;
      background:var(--card);
      color:var(--accent);
      font:inherit;
      font-size:17px;
      font-weight:900;
      cursor:pointer;
      touch-action:manipulation;
    }

    .atelier-v2-touch-order button:disabled{
      opacity:.3;
      cursor:not-allowed;
    }

    .atelier-v2-hero{
      min-height:0;
      margin:10px 10px 8px;
      border-radius:14px;
    }

    .atelier-v2-hero-inner{
      max-width:none;
      min-height:220px;
      padding:18px 14px 16px;
    }

    .atelier-v2-hero-overlay{
      background:linear-gradient(
        90deg,
        var(--card) 0%,
        rgba(254,249,239,.94) 58%,
        rgba(254,249,239,.38) 100%
      );
    }

    .atelier-v2-hero-title{
      max-width:100%;
      margin-bottom:7px;
      font-size:clamp(28px,9vw,36px);
      line-height:1.08;
      overflow-wrap:anywhere;
    }

    .atelier-v2-hero-note{
      max-width:100%;
      font-size:13px;
      line-height:19px;
    }

    .atelier-v2-hero-badges{
      gap:6px;
      margin-bottom:10px;
    }

    .atelier-v2-hero-badge,
    .atelier-v2-hero-date{
      min-height:26px;
      padding:0 9px;
      font-size:10px;
    }

    .atelier-v2-hero-actions{
      position:relative;
      top:auto;
      right:auto;
      gap:6px;
      margin-top:16px;
    }

    .atelier-v2-hero-btn{
      min-height:44px;
      padding:0 11px;
      touch-action:manipulation;
    }

    .atelier-v2-hero-icon-btn{
      width:44px;
      min-width:44px;
      height:44px;
      touch-action:manipulation;
    }

    .atelier-v2-body{
      width:100%;
      gap:12px;
      padding:
        0
        10px
        calc(96px + env(safe-area-inset-bottom));
    }

    .atelier-v2-plan-card{
      min-height:0;
      border-radius:14px;
    }

    .atelier-v2-plan-head{
      min-height:0;
      align-items:flex-start;
      flex-direction:column;
      padding:12px;
    }

    .atelier-v2-plan-actions{
      width:100%;
    }

    .atelier-v2-plan-actions .atelier-v2-btn.primary{
      flex:1;
      min-height:42px !important;
    }

    .atelier-v2-plan-icon-btn{
      width:42px;
      min-width:42px;
      height:42px;
    }

    .atelier-v2-timeline{
      gap:10px;
      padding:8px 6px 24px;
    }

    .atelier-v2-reminder{
      align-items:flex-start;
      gap:9px;
      padding:12px 10px;
      border-radius:12px;
    }

    .atelier-v2-reminder > span:last-child{
      max-width:42%;
      white-space:normal !important;
      text-align:center;
    }

    .atelier-v2-sidebar{
      width:100%;
      min-width:0;
      height:auto;
      min-height:0;
      padding-top:16px;
      margin-top:4px;
      overflow:visible;
      position:relative;
      isolation:isolate;
    }

    .atelier-v2-sidebar > .web-meal-rail{
      display:block !important;
      width:100% !important;
      max-width:100% !important;
      height:auto !important;
      min-height:0 !important;
      overflow:visible !important;
      border-left:0 !important;
      background:transparent !important;
    }

    .atelier-v2-sidebar .web-meal-rail-scroll{
      display:flex !important;
      flex:none !important;
      flex-direction:column !important;
      width:100% !important;
      height:auto !important;
      min-height:0 !important;
      overflow:visible !important;
      scrollbar-gutter:auto !important;
      padding:0 !important;
      gap:14px !important;
      position:static !important;
      transform:none !important;
    }

    .atelier-v2-sidebar .web-meal-rail-scroll > section{
      position:relative !important;
      z-index:1;
      flex:none !important;
      width:100% !important;
      max-width:100% !important;
      height:auto !important;
      min-height:0 !important;
      margin:0 !important;
      padding:16px !important;
      overflow:visible !important;
      border:1px solid var(--line) !important;
      border-radius:16px;
      background:var(--card);
      box-shadow:0 7px 22px rgba(54,42,27,.065);
    }

    .atelier-v2-sidebar .web-meal-rail-scroll > section > div:first-child{
      display:grid !important;
      grid-template-columns:minmax(0,1fr) auto;
      align-items:start !important;
      gap:10px !important;
      width:100%;
      min-width:0;
    }

    .atelier-v2-sidebar .web-meal-rail-scroll > section > div:first-child > div:first-child{
      min-width:0;
      overflow-wrap:anywhere;
    }

    .atelier-v2-sidebar .web-meal-rail-scroll > section button{
      min-height:44px;
      touch-action:manipulation;
    }

    .atelier-v2-sidebar .web-meal-card-title,
    .atelier-v2-sidebar .web-meal-card-subtitle{
      white-space:normal !important;
      overflow:visible !important;
      text-overflow:clip !important;
      overflow-wrap:anywhere;
    }

    .atelier-v2-modal-backdrop{
      align-items:flex-end;
      padding:0;
    }

    .atelier-v2-modal{
      max-width:none;
      max-height:92dvh;
      border-radius:18px 18px 0 0;
      padding-bottom:env(safe-area-inset-bottom);
    }

    .atelier-v2-modal-head{
      padding:15px 14px;
    }

    .atelier-v2-modal-body{
      max-height:calc(92dvh - 74px);
      overflow-y:auto;
      padding:16px 14px;
      -webkit-overflow-scrolling:touch;
    }

    .atelier-v2-cover-modal{
      max-width:none;
    }

    .atelier-v2-cover-search,
    .atelier-v2-cover-grid{
      grid-template-columns:1fr;
    }

    .atelier-v2-cover-search{
      flex-direction:column;
    }
  }
  `;

  function injectAtelierCss() {
    if (document.getElementById('atelier-v2-refactor-css')) return;

    const style = document.createElement('style');
    style.id = 'atelier-v2-refactor-css';
    style.textContent = ATELIER_CSS;
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

  function countStepTypes(day) {
    if (U.countStepTypes) return U.countStepTypes(day);

    const steps = Array.isArray(day && day.steps) ? day.steps : [];

    return {
      total: steps.length,
      timeline: steps.length,
      restaurants: steps.filter(step => step.type === 'restaurant').length,
      transports: steps.filter(step => step.type === 'transport').length,
      lodgings: steps.filter(step => step.type === 'logement').length
    };
  }

  function isVisibleTimelineStep(step) {
    if (U.isVisibleTimelineStep) return U.isVisibleTimelineStep(step);

    return step && step.type !== 'restaurant' && step.type !== 'table' && step.type !== 'logement';
  }

  function sortStepsByTime(steps) {
    if (U.sortStepsByTime) return U.sortStepsByTime(steps);

    return (Array.isArray(steps) ? steps : []).slice();
  }

  function stepDisplayName(step, fallback) {
    if (U.stepDisplayName) return U.stepDisplayName(step, fallback || 'Étape');

    return safeString(
      step &&
      (
        step.label ||
        step.lieu ||
        step.place ||
        step.arrivee ||
        step.depart ||
        fallback ||
        'Étape'
      )
    );
  }

  function stepImportant(step) {
    if (U.stepImportant) return U.stepImportant(step);

    return !!(step && step.important);
  }

  function getLodgingTimelineReminders(days, index) {
    if (U.getLodgingTimelineReminders) {
      return U.getLodgingTimelineReminders(days, index);
    }

    return [];
  }

  function getDayById(trip, dayId) {
    if (!trip || !Array.isArray(trip.days)) return null;

    return trip.days.find(function findDay(day) {
      return String(day.id) === String(dayId);
    }) || null;
  }

  function findStepLocation(trip, stepId) {
    if (!trip || !Array.isArray(trip.days) || !stepId) return null;

    for (let dayIndex = 0; dayIndex < trip.days.length; dayIndex += 1) {
      const day = trip.days[dayIndex];
      const steps = Array.isArray(day.steps) ? day.steps : [];

      const step = steps.find(function findStep(item) {
        return String(item.id) === String(stepId);
      });

      if (step) {
        return {
          day,
          dayIndex,
          step
        };
      }
    }

    return null;
  }

  function buildNewStepPreset(type, preset, day) {
    const base = {
      type: type || 'activite',
      label: '',
      lieu: '',
      note: '',
      time: '',
      link: '',
      important: false
    };

    if (type === 'logement') {
      const startISO = day && day.dateISO ? day.dateISO : '';

      return {
        ...base,
        type: 'logement',
        lockedType: 'logement',
        dateStart: startISO,
        dateEnd: startISO && U.addDaysISO ? U.addDaysISO(startISO, 1) : '',
        timeCheckIn: '15:00',
        timeCheckOut: '11:00',
        nuits: 1,
        nights: 1,
        ...(preset || {})
      };
    }

    return {
      ...base,
      ...(preset || {}),
      type: type || (preset && preset.type) || 'activite'
    };
  }

  function StatCard({ value, label }) {
    return (
      <div className="atelier-v2-stat">
        <div className="atelier-v2-stat-value">{value}</div>
        <div className="atelier-v2-stat-label">{label}</div>
      </div>
    );
  }

  function DayEditModal({
    day,
    onClose,
    onSaved
  }) {
    const [title, setTitle] = React.useState(day ? day.title || '' : '');
    const [note, setNote] = React.useState(day ? day.note || '' : '');
    const [busy, setBusy] = React.useState(false);

    if (!day) return null;

    async function saveDay() {
      if (!day.id || busy) return;

      setBusy(true);

      try {
        await window.SB.updateDay(day.id, {
          title,
          note
        });

        if (onSaved) await onSaved();

        Store.showToast('Journée mise à jour');
        onClose();
      } catch (error) {
        Store.showToast('Erreur journée : ' + (error.message || error));
      } finally {
        setBusy(false);
      }
    }

    return ReactDOM.createPortal(
      <div
        className="atelier-v2-modal-backdrop"
        onClick={busy ? undefined : onClose}
      >
        <div
          className="atelier-v2-modal"
          onClick={event => event.stopPropagation()}
        >
          <div className="atelier-v2-modal-head">
            <div>
              <div className="atelier-v2-kicker">Journée</div>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 25,
                lineHeight: '31px',
                marginTop: 3
              }}>
                Modifier le titre et la note
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="atelier-v2-btn"
              style={{ minHeight: 34, padding: '0 10px' }}
            >
              ×
            </button>
          </div>

          <div className="atelier-v2-modal-body">
            <div className="atelier-v2-field">
              <label className="atelier-v2-label">Titre</label>
              <input
                className="atelier-v2-input"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="Journée libre, Palais & ruelles…"
              />
            </div>

            <div className="atelier-v2-field">
              <label className="atelier-v2-label">Note du jour</label>
              <textarea
                className="atelier-v2-textarea"
                value={note}
                onChange={event => setNote(event.target.value)}
                placeholder="Conseils, rappels, ambiance de la journée…"
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 18
            }}>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="atelier-v2-btn"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={saveDay}
                disabled={busy}
                className="atelier-v2-btn primary"
              >
                {busy ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function LodgingReminderCard({
    reminder,
    dayIndex,
    onEdit,
    onAddLodging
  }) {
    if (!reminder || !reminder.step) {
      return (
        <button
          type="button"
          className="atelier-v2-reminder"
          onClick={onAddLodging}
          style={{
            borderStyle: 'dashed',
            background: 'var(--surface-container-lowest,#fff)'
          }}
        >
          <span className="atelier-v2-reminder-icon">
            <Icon name="bed" size={18} />
          </span>

          <span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
            <span className="atelier-v2-reminder-title">
              Où dormir ?
            </span>
          </span>

          <span style={{
            border: '1px solid rgba(154,101,8,.20)',
            borderRadius: 999,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            flexShrink: 0,
            fontFamily: 'var(--font-mono, ui-monospace)',
            fontSize: 10.5,
            fontWeight: 900,
            lineHeight: '14px',
            padding: '5px 10px',
            whiteSpace: 'nowrap'
          }}>
            Ajouter un hébergement
          </span>
        </button>
      );
    }

    const nightNumber = reminder.kind === 'checkout'
      ? reminder.nights || 1
      : Math.max(1, (Number(dayIndex) || 0) - (Number(reminder.sourceDayIndex) || 0) + 1);

    const nightLabel = reminder.nights
      ? 'Nuit ' + Math.min(nightNumber, reminder.nights) + '/' + reminder.nights
      : '';

    return (
      <button
        type="button"
        className="atelier-v2-reminder"
        onClick={() => onEdit(reminder.sourceDay, reminder.step)}
      >
        <span className="atelier-v2-reminder-icon">
          <Icon name="bed" size={18} />
        </span>

        <span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
          <span className="atelier-v2-reminder-title">
            {reminder.label} · {stepDisplayName(reminder.step, 'Hébergement')}
          </span>

          <span className="atelier-v2-reminder-sub">
            {reminder.time || ''}
            {reminder.nights ? ' · ' + reminder.nights + ' nuit' + (reminder.nights > 1 ? 's' : '') : ''}
          </span>
        </span>

        {nightLabel && (
          <span style={{
            border: '1px solid rgba(154,101,8,.20)',
            borderRadius: 999,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            flexShrink: 0,
            fontFamily: 'var(--font-mono, ui-monospace)',
            fontSize: 10.5,
            fontWeight: 900,
            lineHeight: '14px',
            padding: '5px 9px',
            whiteSpace: 'nowrap'
          }}>
            {nightLabel}
          </span>
        )}
      </button>
    );
  }

    function TripCoverPickerModal({ tripId, tripName, day, onClose, onSaved }) {
    const [query, setQuery] = React.useState(tripName || day?.title || '');
    const [photos, setPhotos] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');

    React.useEffect(function loadInitialPhotos() {
      searchPhotos(tripName || day?.title || '');
    }, []);

    async function searchPhotos(nextQuery) {
      const value = String(nextQuery ?? query).trim();

      if (value.length < 2) {
        setErrorMessage('Indique une destination ou une ambiance.');
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const results = await window.SB.searchTripCoverPhotos(tripId, value);
        setPhotos(results);
      } catch (error) {
        setPhotos([]);
        setErrorMessage(error.message || 'Recherche photo impossible.');
      } finally {
        setLoading(false);
      }
    }

    async function choosePhoto(photo) {
      if (saving) return;

      setSaving(true);

      try {
        await window.SB.saveDayCover(day.id, photo);
        await onSaved();
        Store.showToast('Photo de cette journée enregistrée');
        onClose();
      } catch (error) {
        setErrorMessage(error.message || 'Enregistrement impossible.');
      } finally {
        setSaving(false);
      }
    }

    async function removePhoto() {
      if (saving || !window.confirm('Retirer la photo de cette journée ?')) return;

      setSaving(true);

      try {
        await window.SB.saveDayCover(day.id, null);
        await onSaved();
        Store.showToast('Photo retirée');
        onClose();
      } catch (error) {
        setErrorMessage(error.message || 'Suppression impossible.');
      } finally {
        setSaving(false);
      }
    }

    return ReactDOM.createPortal(
      <div className="atelier-v2-modal-backdrop" onClick={saving ? undefined : onClose}>
        <div className="atelier-v2-modal atelier-v2-cover-modal" onClick={event => event.stopPropagation()}>
          <div className="atelier-v2-modal-head">
            <div>
              <div className="atelier-v2-kicker">Photo de la journée</div>
              <div className="atelier-v2-cover-modal-title">Choisir une photo</div>
            </div>

            <button type="button" className="atelier-v2-btn" onClick={onClose} disabled={saving}>
              <Icon name="x" size={16} />
            </button>
          </div>

          <div className="atelier-v2-modal-body">
            <form
              className="atelier-v2-cover-search"
              onSubmit={event => {
                event.preventDefault();
                searchPhotos();
              }}
            >
              <input
                className="atelier-v2-input"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Narbonne, plage, musée, fjords..."
              />

              <button type="submit" className="atelier-v2-btn primary" disabled={loading || saving}>
                {loading ? 'Recherche...' : 'Rechercher'}
              </button>
            </form>

            {errorMessage && <div className="atelier-v2-cover-error">{errorMessage}</div>}

            <div className="atelier-v2-cover-grid">
              {photos.map(photo => (
                <button
                  key={photo.id}
                  type="button"
                  className="atelier-v2-cover-option"
                  onClick={() => choosePhoto(photo)}
                  disabled={saving}
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.alt || query}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                  />
                  <span className="atelier-v2-cover-option-info">
                    <strong>Choisir cette photo</strong>
                    <small>Photo par {photo.photographer || 'Pexels'}</small>
                  </span>
                </button>
              ))}
            </div>

            {!loading && !photos.length && !errorMessage && (
              <div className="atelier-v2-cover-empty">
                <Icon name="camera" size={22} />
                Aucune photo trouvée.
              </div>
            )}

            {day.coverImageUrl && (
              <button
                type="button"
                className="atelier-v2-btn danger"
                onClick={removePhoto}
                disabled={saving}
                style={{ marginTop: 18 }}
              >
                Retirer la photo
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function AtelierV2() {
    injectAtelierCss();

    const {
      trip,
      user,
      selectedDayIndex = 0,
      pendingEditStepId
    } = Store.useStore(function select(state) {
return {
        trip: state.trip,
        user: state.user,
        selectedDayIndex: state.selectedDayIndex || 0,
        pendingEditStepId: state.pendingEditStepId
      };
    });

    const [editor, setEditor] = React.useState({
      open: false,
      dayId: null,
      step: null
    });

    const [dayEditorOpen, setDayEditorOpen] = React.useState(false);
    const [coverPickerOpen, setCoverPickerOpen] = React.useState(false);
    const [coverPositionY, setCoverPositionY] = React.useState(50);
    const cropDragRef = React.useRef(null);
    const [dragIndex, setDragIndex] = React.useState(null);
    const [dragOverIndex, setDragOverIndex] = React.useState(null);
    const [reorderingSteps, setReorderingSteps] = React.useState(false);
    const [quickAdd, setQuickAdd] = React.useState({
      open: false,
      type: 'activite',
      label: '',
      time: ''
    });
    const [quickAddBusy, setQuickAddBusy] = React.useState(false);
    const canUseNativeDrag =
      typeof window.matchMedia !== 'function' ||
      window.matchMedia(
        '(pointer: fine)'
      ).matches;

    const days = Array.isArray(trip && trip.days) ? trip.days : [];
    const safeDayIndex = Math.min(
      Math.max(0, Number(selectedDayIndex) || 0),
      Math.max(0, days.length - 1)
    );

    const day = days[safeDayIndex] || null;
        const savedCoverPositionY = Number.isFinite(Number(day?.coverPositionY))
      ? Number(day.coverPositionY)
      : 50;

    const isCoverCropLocked = day?.coverCropLocked !== false;

    React.useEffect(function syncCoverPosition() {
      setCoverPositionY(savedCoverPositionY);
      cropDragRef.current = null;
    }, [day?.id, savedCoverPositionY]);

    function clampCoverPosition(value) {
      return Math.max(0, Math.min(100, value));
    }

    function handleCoverPointerDown(event) {
      if (!day?.coverImageUrl || isCoverCropLocked) return;
      if (event.target.closest && event.target.closest('button, a')) return;

      cropDragRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startPosition: coverPositionY,
        positionY: coverPositionY,
        moved: false
      };

      event.currentTarget.setPointerCapture(event.pointerId);
    }

    function handleCoverPointerMove(event) {
      const drag = cropDragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) return;

      const delta = event.clientY - drag.startY;
      const nextPosition = clampCoverPosition(drag.startPosition - delta * 0.18);

      drag.positionY = nextPosition;
      drag.moved = drag.moved || Math.abs(delta) > 3;
      setCoverPositionY(nextPosition);
    }

    async function handleCoverPointerUp(event) {
      const drag = cropDragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) return;

      cropDragRef.current = null;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (!drag.moved) return;

      try {
        await window.SB.updateDayCoverCrop(day.id, {
          positionY: drag.positionY
        });
        await reloadTrip();
      } catch (error) {
        Store.showToast(error.message || 'Recadrage impossible.');
        setCoverPositionY(savedCoverPositionY);
      }
    }

    async function toggleCoverCropLock() {
      try {
        await window.SB.updateDayCoverCrop(day.id, {
          positionY: coverPositionY,
          locked: !isCoverCropLocked
        });

        await reloadTrip();
        Store.showToast(
          isCoverCropLocked
            ? 'Recadrage déverrouillé'
            : 'Recadrage verrouillé'
        );
      } catch (error) {
        Store.showToast(error.message || 'Modification impossible.');
      }
    }

    const allSteps = Array.isArray(day && day.steps) ? day.steps : [];
    const timelineSteps = allSteps
      .filter(isVisibleTimelineStep)
      .slice()
      .sort(function compareStepOrder(a, b) {
        const aIndex = Number(a?.stepIndex);
        const bIndex = Number(b?.stepIndex);

        const aHasIndex =
          Number.isFinite(aIndex);

        const bHasIndex =
          Number.isFinite(bIndex);

        if (aHasIndex && bHasIndex) {
          return aIndex - bIndex;
        }

        if (aHasIndex) return -1;
        if (bHasIndex) return 1;

        return 0;
      });
    const counts = countStepTypes(day);

    React.useEffect(function keepSelectedDayValid() {
      if (!days.length) return;

      if (safeDayIndex !== selectedDayIndex) {
        Store.set({ selectedDayIndex: safeDayIndex });
      }
    }, [days.length, selectedDayIndex, safeDayIndex]);

    React.useEffect(function openPendingEditor() {
      if (!pendingEditStepId || !trip) return;

      const found = findStepLocation(trip, pendingEditStepId);

      if (!found) {
        Store.set({ pendingEditStepId: null });
        return;
      }

      setEditor({
        open: true,
        dayId: found.day.id,
        step: found.step
      });

      Store.set({
        selectedDayIndex: found.dayIndex,
        selectedStepId: found.step.id,
        pendingEditStepId: null
      });
    }, [pendingEditStepId, trip && trip.id]);

    async function reloadTrip() {
      if (!trip || !trip.id) return null;

      const refreshed = await window.SB.loadTrip(trip.id);

      Store.set({
        trip: refreshed
      });

      return refreshed;
    }

    function openEditorForStep(targetDay, step) {
      if (!targetDay) return;

      setEditor({
        open: true,
        dayId: targetDay.id,
        step: step || null
      });

      if (step && step.id) {
        Store.set({
          selectedStepId: step.id
        });
      }
    }

function openAddStep(type, preset) {
      if (!day) return;

      setEditor({
        open: true,
        dayId: day.id,
        step: buildNewStepPreset(type, preset, day)
      });
    }

    function closeQuickAdd() {
      setQuickAdd({
        open: false,
        type: 'activite',
        label: '',
        time: ''
      });
    }

    function openQuickAddInEditor() {
      openAddStep(quickAdd.type, {
        label: quickAdd.label.trim(),
        time: quickAdd.time
      });

      closeQuickAdd();
    }

    async function saveQuickStep(event) {
      event.preventDefault();

      const label = quickAdd.label.trim();

      if (!label || quickAddBusy) {
        if (!label) {
          Store.showToast(
            'Donne un nom à cette étape.'
          );
        }

        return;
      }

      if (
        !trip ||
        !trip.id ||
        !day ||
        !day.id ||
        !window.SB?.saveStep
      ) {
        Store.showToast(
          'Ajout rapide indisponible.'
        );

        return;
      }

      const payload = {
        ...buildNewStepPreset(
          quickAdd.type,
          {
            label,
            time: quickAdd.time
          },
          day
        ),
        stepIndex: allSteps.length
      };

      if (quickAdd.type === 'transport') {
        Object.assign(payload, {
          transportType: 'train',
          depart: '',
          arrivee: '',
          timeEnd: '',
          nextDay: false,
          duree: '',
          ref: '',
          escales: []
        });
      } else {
        payload.dureeEstimee = '';
      }

      setQuickAddBusy(true);

      try {
        await window.SB.saveStep(
          trip.id,
          day.id,
          payload
        );

        await reloadTrip();
        closeQuickAdd();

        Store.showToast(
          'Étape ajoutée au programme.'
        );
      } catch (error) {
        Store.showToast(
          'Ajout impossible : ' +
          (error.message || error)
        );
      } finally {
        setQuickAddBusy(false);
      }
    }

    function closeEditor() {
      setEditor({
        open: false,
        dayId: null,
        step: null
      });
    }

    async function handleEditorSaved() {
      await reloadTrip();
    }

    async function reorderTimelineSteps(
      fromVisibleIndex,
      toVisibleIndex
    ) {
      if (
        !trip ||
        !trip.id ||
        !day ||
        reorderingSteps
      ) {
        return;
      }

      if (
        fromVisibleIndex === toVisibleIndex
      ) {
        return;
      }

      const visible = timelineSteps.slice();

      const moved = visible.splice(
        fromVisibleIndex,
        1
      )[0];

      if (!moved) return;

      visible.splice(
        toVisibleIndex,
        0,
        moved
      );

      const hidden = allSteps.filter(
        function keepHidden(step) {
          return !isVisibleTimelineStep(step);
        }
      );

      const nextSteps = visible
        .concat(hidden)
        .map(function assignIndex(
          step,
          index
        ) {
          return {
            ...step,
            stepIndex: index
          };
        });

      setDragIndex(null);
      setDragOverIndex(null);
      setReorderingSteps(true);

      Store.set({
        trip: {
          ...trip,
          days: days.map(function mapDay(
            item,
            index
          ) {
            if (index !== safeDayIndex) {
              return item;
            }

            return {
              ...item,
              steps: nextSteps
            };
          })
        }
      });

      try {
        if (!window.SB?.reorderSteps) {
          throw new Error(
            'Réorganisation indisponible.'
          );
        }

        await window.SB.reorderSteps(
          nextSteps
        );

        const refreshed =
          await reloadTrip();

        const refreshedDay = (
          refreshed?.days || []
        ).find(function findDay(item) {
          return String(item.id) ===
            String(day.id);
        });

        const persistedOrder = (
          refreshedDay?.steps || []
        )
          .filter(isVisibleTimelineStep)
          .slice()
          .sort(function compareOrder(a, b) {
            return (
              Number(a.stepIndex) -
              Number(b.stepIndex)
            );
          })
          .map(step => String(step.id));

        const expectedOrder = visible.map(
          step => String(step.id)
        );

        if (
          persistedOrder.join('|') !==
          expectedOrder.join('|')
        ) {
          throw new Error(
            'Le nouvel ordre n’a pas été conservé.'
          );
        }

        Store.showToast(
          'Nouvel ordre enregistré.'
        );
      } catch (error) {
        console.error(
          'Step reorder failed:',
          error
        );

        await reloadTrip();

        Store.showToast(
          error.message ||
          'Le nouvel ordre n’a pas pu être enregistré.'
        );
      } finally {
        setReorderingSteps(false);
      }
    }

    function selectMapForDay() {
      Store.set({
        view: 'map',
        selectedDayIndex: safeDayIndex
      });
    }

    if (!trip) {
      return (
        <div className="atelier-v2">
          <div style={{
            flex: 1,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--muted)'
          }}>
            Chargement de l’itinéraire…
          </div>
        </div>
      );
    }

    if (!day) {
      return (
        <div className="atelier-v2">
          <div style={{
            flex: 1,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--muted)',
            padding: 30,
            textAlign: 'center'
          }}>
            Aucune journée trouvée pour ce voyage.
          </div>
        </div>
      );
    }

    const dayTitle = getDisplayDayTitle(day);
    const dayDate = formatDayDate(day.dateISO);
    const importantCount = allSteps.filter(stepImportant).length;
    const hasDayCover = Boolean(String(day.coverImageUrl || '').trim());
    const isTripOwner = Boolean(
      user &&
      trip.ownerId &&
      String(user.id) === String(trip.ownerId)
    );

    return (
      <div className="atelier-v2">
        <div className="atelier-v2-main">

          {/* ── Hero ── */}
          <div
  key={day.id || safeDayIndex}
  className={
    'atelier-v2-hero' +
    (hasDayCover ? ' has-cover' : '') +
    (hasDayCover && !isCoverCropLocked ? ' crop-editable' : '')
  }
  onPointerDown={handleCoverPointerDown}
  onPointerMove={handleCoverPointerMove}
  onPointerUp={handleCoverPointerUp}
  onPointerCancel={() => {
    cropDragRef.current = null;
    setCoverPositionY(savedCoverPositionY);
  }}
>
            {hasDayCover && (
              <img
                className="atelier-v2-hero-img"
                src={day.coverImageUrl}
                alt={day.coverImageAlt || 'Photo de couverture du voyage'}
                style={{ objectPosition: `center ${coverPositionY}%` }}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                draggable="false"
              />
            )}

            <div className="atelier-v2-hero-overlay" />

            <div className="atelier-v2-hero-inner">
              <div className="atelier-v2-hero-badges">
                <span className="atelier-v2-hero-badge">
                  Jour {safeDayIndex + 1}
                </span>

                {dayDate && (
                  <span className="atelier-v2-hero-date">{dayDate}</span>
                )}
              </div>

              <h1 className="atelier-v2-hero-title">{dayTitle}</h1>

              {day.note && (
                <p className="atelier-v2-hero-note">{day.note}</p>
              )}

              <div className="atelier-v2-hero-actions">
  <button
    type="button"
    className="atelier-v2-hero-btn"
    onClick={selectMapForDay}
  >
    <Icon name="map" size={14} />
    Carte
  </button>

  <button
    type="button"
    className="atelier-v2-hero-btn"
    onClick={() => setDayEditorOpen(true)}
  >
    Modifier
  </button>

  <button
    type="button"
    className="atelier-v2-hero-icon-btn"
    title="Changer la photo"
    aria-label="Changer la photo"
    onClick={() => setCoverPickerOpen(true)}
  >
    <Icon name="camera" size={17} />
  </button>

  {hasDayCover && (
    <button
      type="button"
      className="atelier-v2-hero-icon-btn"
      title={isCoverCropLocked ? 'Déverrouiller le recadrage' : 'Verrouiller le recadrage'}
      aria-label={isCoverCropLocked ? 'Déverrouiller le recadrage' : 'Verrouiller le recadrage'}
      onClick={toggleCoverCropLock}
    >
      <Icon name={isCoverCropLocked ? 'lock' : 'unlock'} size={17} />
    </button>
  )}
</div>
            </div>

            {hasDayCover && day.coverSourceUrl && (
              <a
                className="atelier-v2-hero-credit"
                href={day.coverSourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Photo par {day.coverPhotographerName || 'Pexels'} via Pexels
              </a>
            )}
          </div>

          {/* ── Body : 2/3 timeline + 1/3 sidebar ── */}
          <div className="atelier-v2-body">
            <section className="atelier-v2-content">
              <div className="atelier-v2-plan-card">
                <div className="atelier-v2-plan-head">
<div>
                    <div className="atelier-v2-plan-title">
                      <span aria-hidden="true">☷</span>
                      Plan d’action
                    </div>

                    <div style={{
                      marginTop: 2,
                      color: 'var(--muted)',
                      fontSize: 11.5,
                      lineHeight: '16px'
                    }}>
                      {timelineSteps.length
                        ? timelineSteps.length +
                          ' étape' +
                          (timelineSteps.length > 1 ? 's' : '') +
                          ' dans cette journée'
                        : 'Journée à construire'}
                    </div>
                  </div>

                  <div className="atelier-v2-plan-actions">
<button
                      type="button"
                      className="atelier-v2-btn primary"
                      style={{
                        minHeight: 32,
                        borderRadius: 8,
                        padding: '0 12px'
                      }}
                      aria-expanded={quickAdd.open}
                      onClick={() => {
                        setQuickAdd(function toggleQuickAdd(previous) {
                          return {
                            ...previous,
                            open: !previous.open
                          };
                        });
                      }}
                    >
                      {quickAdd.open ? 'Fermer' : '+ Ajouter'}
                    </button>
                  </div>
                </div>

                {quickAdd.open && (
                  <form
                    onSubmit={saveQuickStep}
                    style={{
                      margin: '12px 14px 0',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 13,
                      background: 'var(--inset)',
                      padding: 10,
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 7
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      gap: 5
                    }}>
                      {[
                        ['activite', 'Activité'],
                        ['transport', 'Transport']
                      ].map(function renderQuickType(option) {
                        const selected =
                          quickAdd.type === option[0];

                        return (
                          <button
                            key={option[0]}
                            type="button"
                            aria-pressed={selected}
                            disabled={quickAddBusy}
                            onClick={() => {
                              setQuickAdd(function selectType(previous) {
                                return {
                                  ...previous,
                                  type: option[0]
                                };
                              });
                            }}
                            style={{
                              minHeight: 34,
                              border: selected
                                ? '1px solid var(--accent)'
                                : '1px solid var(--outline-variant)',
                              borderRadius: 9,
                              background: selected
                                ? 'var(--accent-soft)'
                                : 'var(--card)',
                              color: selected
                                ? 'var(--accent)'
                                : 'var(--text)',
                              padding: '0 10px',
                              fontFamily: 'inherit',
                              fontSize: 11.5,
                              fontWeight: 900,
                              cursor: 'pointer'
                            }}
                          >
                            {option[1]}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      autoFocus
                      type="text"
                      aria-label="Nom de la nouvelle étape"
                      placeholder={
                        quickAdd.type === 'transport'
                          ? 'Ex. Train vers Kyoto'
                          : 'Ex. Visiter le musée'
                      }
                      value={quickAdd.label}
                      disabled={quickAddBusy}
                      onChange={event => {
                        setQuickAdd(function updateLabel(previous) {
                          return {
                            ...previous,
                            label: event.target.value
                          };
                        });
                      }}
                      style={{
                        flex: '1 1 190px',
                        minWidth: 0,
                        minHeight: 36,
                        border: '1px solid var(--outline-variant)',
                        borderRadius: 9,
                        background: 'var(--card)',
                        color: 'var(--text)',
                        padding: '0 10px',
                        fontFamily: 'inherit',
                        fontSize: 13
                      }}
                    />

                    <input
                      type="time"
                      aria-label="Heure de la nouvelle étape"
                      value={quickAdd.time}
                      disabled={quickAddBusy}
                      onChange={event => {
                        setQuickAdd(function updateTime(previous) {
                          return {
                            ...previous,
                            time: event.target.value
                          };
                        });
                      }}
                      style={{
                        flex: '0 0 108px',
                        minHeight: 36,
                        border: '1px solid var(--outline-variant)',
                        borderRadius: 9,
                        background: 'var(--card)',
                        color: 'var(--text)',
                        padding: '0 8px',
                        fontFamily: 'inherit',
                        fontSize: 12
                      }}
                    />

                    <button
                      type="submit"
                      className="atelier-v2-btn primary"
                      disabled={quickAddBusy}
                      style={{
                        minHeight: 36,
                        borderRadius: 9
                      }}
                    >
                      {quickAddBusy ? 'Ajout…' : 'Ajouter'}
                    </button>

                    <button
                      type="button"
                      className="atelier-v2-btn"
                      disabled={quickAddBusy}
                      onClick={openQuickAddInEditor}
                      style={{
                        minHeight: 36,
                        borderRadius: 9
                      }}
                    >
                      Plus de détails
                    </button>
                  </form>
                )}

                <div className="atelier-v2-timeline">
                {!timelineSteps.length && (
<div
                    className="atelier-v2-empty"
                    role="status"
                    aria-live="polite"
                    style={{
                      display: 'grid',
                      justifyItems: 'center',
                      gap: 6,
                      textAlign: 'center'
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 11,
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 17
                      }}
                    >
                      ✦
                    </span>

                    <strong style={{ color: 'var(--text)' }}>
                      Cette journée est encore libre
                    </strong>

                    <span>
                      Utilise « + Ajouter » pour prévoir une activité ou un
                      transport. Les repas et hébergements restent disponibles
                      dans la colonne de droite.
                    </span>
                  </div>
                )}

                {reorderingSteps && (
                  <div
                    className="atelier-v2-empty"
                    role="status"
                    aria-live="polite"
                  >
                    Enregistrement du nouvel ordre…
                  </div>
                )}

                {timelineSteps.map(function renderStep(step, index) {
                  return (
                    <div
                      key={step.id || index}
                      className={'atelier-v2-drop' + (dragOverIndex === index && dragIndex !== null && dragIndex !== index ? ' over' : '')}
                      draggable={
                        !!step.id &&
                        !reorderingSteps &&
                        canUseNativeDrag
                      }
                      onDragStart={function onDragStart(event) {
                        setDragIndex(index);
                        setDragOverIndex(null);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', String(index));
                      }}
                      onDragOver={function onDragOver(event) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';

                        if (dragOverIndex !== index) {
                          setDragOverIndex(index);
                        }
                      }}
                      onDragLeave={function onDragLeave() {
                        if (dragOverIndex === index) {
                          setDragOverIndex(null);
                        }
                      }}
                      onDrop={function onDrop(event) {
                        event.preventDefault();

                        const raw = event.dataTransfer.getData('text/plain');
                        const from = dragIndex !== null ? dragIndex : Number(raw);

                        if (!Number.isFinite(from)) return;

                        reorderTimelineSteps(from, index);
                      }}
                      onDragEnd={function onDragEnd() {
                        setDragIndex(null);
                        setDragOverIndex(null);
                      }}
                      style={{
                        opacity: dragIndex === index ? 0.55 : 1,
                        cursor: reorderingSteps
                          ? 'wait'
                          : step.id
                            ? 'grab'
                            : 'default'
                      }}
                    >
                      <div
                        className="atelier-v2-touch-order"
                        aria-label="Modifier l’ordre de cette étape"
                      >
                        <button
                          type="button"
                          disabled={
                            index === 0 ||
                            reorderingSteps
                          }
                          aria-label="Déplacer l’étape vers le haut"
                          title="Déplacer vers le haut"
                          onPointerDown={event =>
                            event.stopPropagation()
                          }
                          onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();

                            reorderTimelineSteps(
                              index,
                              index - 1
                            );
                          }}
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          disabled={
                            index ===
                              timelineSteps.length - 1 ||
                            reorderingSteps
                          }
                          aria-label="Déplacer l’étape vers le bas"
                          title="Déplacer vers le bas"
                          onPointerDown={event =>
                            event.stopPropagation()
                          }
                          onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();

                            reorderTimelineSteps(
                              index,
                              index + 1
                            );
                          }}
                        >
                          ↓
                        </button>
                      </div>

                      <window.StepCard
                        step={step}
                        day={day}
                        trip={trip}
                        dayIndex={safeDayIndex}
                        onEdit={function onEdit(targetStep) {
                          openEditorForStep(day, targetStep);
                        }}
                        onReload={reloadTrip}
                      />
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="atelier-v2-add"
                  onClick={() => openAddStep('activite')}
                >
                  <Icon name="plus" size={16} />
                  Ajouter avec tous les détails
                </button>
                </div>
              </div>
            </section>

            <div className="atelier-v2-sidebar">
              <window.MealRail
                trip={trip}
                day={day}
                dayIndex={safeDayIndex}
                onEditStep={openEditorForStep}
                onAddStep={openAddStep}
                onReload={reloadTrip}
              />
            </div>
          </div>
        </div>

                {coverPickerOpen && (
          <TripCoverPickerModal
  tripId={trip.id}
  tripName={trip.name}
  day={day}
            onClose={() => setCoverPickerOpen(false)}
            onSaved={reloadTrip}
          />
        )}

        <window.StepEditor
          open={editor.open}
          tripId={trip && trip.id}
          dayId={editor.dayId}
          days={days}
          step={editor.step}
          stepCount={getDayById(trip, editor.dayId)?.steps?.length || 0}
          onClose={closeEditor}
          onSaved={handleEditorSaved}
        />

        {dayEditorOpen && (
          <DayEditModal
            day={day}
            onClose={() => setDayEditorOpen(false)}
            onSaved={reloadTrip}
          />
        )}
      </div>
    );
  }

  window.AtelierV2 = AtelierV2;
})();
