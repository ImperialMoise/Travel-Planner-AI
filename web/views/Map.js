// ════════════════════════════════════════════════════════════
// Map.js — Globe 3D interactif, design Atelier (version propre)
// MapLibre GL JS + tuiles MapTiler (français, POIs, satellite)
// ════════════════════════════════════════════════════════════

const MAPLIBRE_VERSION = '5.24.0';

const MAPLIBRE_CDN =
  'https://unpkg.com/maplibre-gl@' +
  MAPLIBRE_VERSION +
  '/dist/';

let mapLibrePromise = null;

function loadMapLibre() {
  if (window.maplibregl) {
    return Promise.resolve(
      window.maplibregl
    );
  }

  if (mapLibrePromise) {
    return mapLibrePromise;
  }

  const existingStyle =
    document.querySelector(
      'link[href*="maplibre-gl"]'
    );

  if (!existingStyle) {
    const style =
      document.createElement('link');

    style.rel = 'stylesheet';
    style.href =
      MAPLIBRE_CDN +
      'maplibre-gl.css';
    style.crossOrigin = 'anonymous';

    document.head.appendChild(style);
  }

  mapLibrePromise =
    new Promise(function loadLibrary(
      resolve,
      reject
    ) {
      const existingScript =
        document.querySelector(
          'script[src*="maplibre-gl"]'
        );

      function finishLoading() {
        if (window.maplibregl) {
          resolve(window.maplibregl);
          return;
        }

        reject(
          new Error(
            'MapLibre ne s’est pas initialisé.'
          )
        );
      }

      function failLoading() {
        if (existingScript) {
          existingScript.remove();
        }

        reject(
          new Error(
            'Impossible de télécharger MapLibre.'
          )
        );
      }

      if (existingScript) {
        existingScript.addEventListener(
          'load',
          finishLoading,
          {
            once: true
          }
        );

        existingScript.addEventListener(
          'error',
          failLoading,
          {
            once: true
          }
        );

        return;
      }

      const script =
        document.createElement('script');

      script.src =
        MAPLIBRE_CDN +
        'maplibre-gl.js';
      script.async = true;
      script.crossOrigin = 'anonymous';

      script.addEventListener(
        'load',
        finishLoading,
        {
          once: true
        }
      );

      script.addEventListener(
        'error',
        function handleError() {
          script.remove();

          reject(
            new Error(
              'Impossible de télécharger MapLibre.'
            )
          );
        },
        {
          once: true
        }
      );

      document.head.appendChild(script);
    })
      .catch(function resetLoader(error) {
        mapLibrePromise = null;
        throw error;
      });

  return mapLibrePromise;
}

/* ═══ DONNÉES DÉMO (coordonnées GPS réelles) ═══ */
const MAP_TRIP={name:"Corée du Sud",dates:"1 oct. — 15 oct. 2025",days:[
{n:1,date:"2025-10-01",wd:"Mer",region:"Vol",city:"Paris → Séoul",title:"Le grand départ",tag:"ROISSY-CDG · TERMINAL 2E",note:"Vol de nuit.",c:[2.5479,49.0097],z:9,steps:[{t:"transport",mode:"avion",l:"Paris CDG → Séoul ICN",s:"AF 267 · 11 h 25",time:"13:05",c:[2.5479,49.0097]}]},
{n:2,date:"2025-10-02",wd:"Jeu",region:"Séoul",city:"Séoul",title:"Arrivée à Myeongdong",tag:"MYEONGDONG",note:"Journée douce.",c:[126.985,37.5637],z:14,steps:[{t:"transport",mode:"train",l:"AREX express",s:"ICN → Séoul · 43 min",time:"10:10",c:[126.9707,37.5547]},{t:"logement",l:"Stay Myeongdong",s:"Jung-gu · 5 nuits",time:"15:00",c:[126.985,37.5637]},{t:"restaurant",l:"Premier BBQ coréen",s:"Myeongdong",time:"20:00",c:[126.9863,37.561]}]},
{n:3,date:"2025-10-03",wd:"Ven",region:"Séoul",city:"Séoul",title:"Palais & ruelles hanok",tag:"GYEONGBOKGUNG",note:"Louer un hanbok.",c:[126.977,37.5796],z:14.4,steps:[{t:"activite",l:"Palais de Gyeongbokgung",s:"Jongno-gu · 2 h",time:"09:30",c:[126.977,37.5796]},{t:"activite",l:"Village hanok de Bukchon",s:"1 h 30",time:"12:30",c:[126.9849,37.5826]},{t:"restaurant",l:"Tosokchon Samgyetang",s:"Sejong-daero",time:"14:00",c:[126.9718,37.5759]}]},
{n:4,date:"2025-10-04",wd:"Sam",region:"Séoul",city:"Séoul",title:"Marchés & panorama",tag:"N SEOUL TOWER",note:"Coucher de soleil.",c:[126.9883,37.5512],z:14,steps:[{t:"restaurant",l:"Marché de Gwangjang",s:"Jongno-gu",time:"11:00",c:[126.9999,37.5701]},{t:"activite",l:"Ruelles d'Insadong",s:"2 h",time:"14:00",c:[126.985,37.574]},{t:"activite",l:"N Seoul Tower",s:"Mont Namsan · 2 h",time:"17:30",c:[126.9883,37.5512]}]},
{n:5,date:"2025-10-05",wd:"Dim",region:"Séoul",city:"Séoul",title:"Jeunesse & rivière Han",tag:"RIVIÈRE HAN",note:"Pique-nique à Yeouido.",c:[126.93,37.54],z:13.6,steps:[{t:"activite",l:"Quartier de Hongdae",s:"Mapo-gu · 3 h",time:"11:00",c:[126.9237,37.5563]},{t:"activite",l:"Parc de la rivière Han",s:"Yeouido · 2 h",time:"17:00",c:[126.9343,37.5283]}]},
{n:6,date:"2025-10-06",wd:"Lun",region:"Séoul",city:"Excursion DMZ",title:"Frontière du Nord",tag:"DMZ",note:"Passeport indispensable.",c:[126.677,37.8997],z:12,steps:[{t:"transport",mode:"bus",l:"Navette excursion",s:"Séoul → DMZ · 1 h 10",time:"07:30",c:[126.7794,37.7]},{t:"activite",l:"Tunnel n°3 & observatoire",s:"Paju · 4 h",time:"09:30",c:[126.677,37.8997]}]},
{n:7,date:"2025-10-07",wd:"Mar",region:"Busan",city:"Séoul → Busan",title:"Cap au sud",tag:"KTX",note:"Train à grande vitesse.",c:[129.11,35.155],z:13.4,steps:[{t:"transport",mode:"train",l:"KTX 045",s:"Séoul → Busan · 2 h 40",time:"09:00",c:[129.0414,35.1151]},{t:"logement",l:"Haeundae Sea Hotel",s:"Haeundae · 2 nuits",time:"14:00",c:[129.1603,35.1631]},{t:"restaurant",l:"Dîner à Gwangalli",s:"Plage de Gwangalli",time:"19:30",c:[129.1186,35.1532]}]},
{n:8,date:"2025-10-08",wd:"Mer",region:"Busan",city:"Busan",title:"Couleurs de Gamcheon",tag:"GAMCHEON",note:"Bonnes chaussures.",c:[129.02,35.097],z:14.2,steps:[{t:"activite",l:"Village de Gamcheon",s:"Saha-gu · 3 h",time:"10:00",c:[129.0107,35.0975]},{t:"restaurant",l:"Marché Jagalchi",s:"Jung-gu",time:"13:30",c:[129.0306,35.0967]}]},
{n:9,date:"2025-10-09",wd:"Jeu",region:"Busan",city:"Busan",title:"Plage & temple",tag:"HAEDONG YONGGUNGSA",note:"Temple au bord de l'océan.",c:[129.19,35.173],z:13.4,steps:[{t:"activite",l:"Plage de Haeundae",s:"2 h",time:"09:00",c:[129.1603,35.1587]},{t:"activite",l:"Temple Haedong Yonggungsa",s:"Gijang-gun · 2 h",time:"12:00",c:[129.2233,35.1885]}]},
{n:10,date:"2025-10-10",wd:"Ven",region:"Séoul",city:"Busan → Séoul",title:"Retour vers la capitale",tag:"RETOUR KTX",note:"Hongdae le soir.",c:[126.9237,37.5563],z:14,steps:[{t:"transport",mode:"train",l:"KTX 112",s:"Busan → Séoul · 2 h 40",time:"11:20",c:[129.0414,35.1151]},{t:"logement",l:"Hongdae Loft",s:"Mapo-gu · 5 nuits",time:"15:30",c:[126.9237,37.5563]}]},
{n:11,date:"2025-10-11",wd:"Sam",region:"Séoul",city:"Séoul",title:"Design & ruisseau",tag:"DONGDAEMUN",note:"Cheonggyecheon le soir.",c:[127.005,37.568],z:14.2,steps:[{t:"activite",l:"Dongdaemun Design Plaza",s:"2 h",time:"11:00",c:[127.0094,37.567]},{t:"activite",l:"Ruisseau Cheonggyecheon",s:"1 h 30",time:"16:00",c:[126.9784,37.5696]}]},
{n:12,date:"2025-10-12",wd:"Dim",region:"Séoul",city:"Séoul",title:"Jardin secret",tag:"CHANGDEOKGUNG",note:"Réserver la veille.",c:[126.991,37.579],z:14.4,steps:[{t:"activite",l:"Palais Changdeokgung",s:"1 h 30",time:"10:00",c:[126.992,37.5794]},{t:"activite",l:"Jardin secret (Huwon)",s:"Visite guidée · 1 h",time:"11:30",c:[126.9945,37.582]},{t:"restaurant",l:"Café à Ikseon-dong",s:"Ikseon-dong",time:"15:00",c:[126.9905,37.5742]}]},
{n:13,date:"2025-10-13",wd:"Lun",region:"Séoul",city:"Excursion Nami",title:"Île de Nami",tag:"ÎLE DE NAMI",note:"Allée de metasequoias.",c:[127.5256,37.7902],z:13.4,steps:[{t:"transport",mode:"train",l:"ITX-Cheongchun",s:"Séoul → Gapyeong · 1 h 10",time:"08:40",c:[127.5106,37.8128]},{t:"activite",l:"Île de Nami",s:"4 h",time:"10:30",c:[127.5256,37.7902]}]},
{n:14,date:"2025-10-14",wd:"Mar",region:"Séoul",city:"Séoul",title:"Derniers instants",tag:"SEONGSU",note:"Place pour les souvenirs.",c:[127.05,37.546],z:14,steps:[{t:"activite",l:"Quartier de Seongsu",s:"3 h",time:"11:00",c:[127.0557,37.5445]},{t:"autre",l:"Achats souvenirs",s:"Myeongdong",time:"16:00",c:[126.985,37.561]}]},
{n:15,date:"2025-10-15",wd:"Mer",region:"Vol",city:"Séoul → Paris",title:"Le vol retour",tag:"ICN · EMBARQUEMENT",note:"Navette AREX à 06:30.",c:[126.4407,37.4602],z:11,steps:[{t:"transport",mode:"train",l:"AREX express",s:"Séoul → ICN · 43 min",time:"06:30",c:[126.9707,37.5547]},{t:"transport",mode:"avion",l:"Séoul ICN → Paris CDG",s:"AF 265 · 12 h 15",time:"10:35",c:[126.4407,37.4602]}]}
]};
const MAP_LEGS=[{a:[2.5479,49.0097],b:[126.4407,37.4602],mode:"avion"},{a:[126.9707,37.5547],b:[129.0414,35.1151],mode:"train"},{a:[129.0414,35.1151],b:[126.9707,37.5547],mode:"train"}];

/* ═══ HELPERS ═══ */
const MAP_IC={avion:'<path d="M21 16v-2l-8-5V3.6a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.4V19l-2 1.4V22l3.5-1 3.5 1v-1.6L13 19v-5.4z"/>',train:'<rect x="5" y="3.5" width="14" height="13" rx="3.5"/><path d="M5 11h14"/><circle cx="9" cy="13.8" r="1"/><circle cx="15" cy="13.8" r="1"/><path d="M8 16.5 6 20M16 16.5 18 20"/>',bus:'<rect x="4" y="4" width="16" height="12" rx="2.5"/><path d="M4 11h16"/><circle cx="8" cy="13.4" r="1"/><circle cx="16" cy="13.4" r="1"/><path d="M7 16.5V19M17 16.5V19"/>',bed:'<path d="M3 19v-8a2 2 0 0 1 2-2h8.5a4.5 4.5 0 0 1 4.5 4.5V19M3 14.5h18M3 19v1.5M21 16.5V20.5"/><circle cx="7.6" cy="12" r="1.4"/>',fork:'<path d="M6.5 3v6.5a2 2 0 0 0 4 0V3M8.5 3v18M16.5 3c-1.6 0-2.6 2.1-2.6 5.2s1 4.3 2.6 4.3M16.5 3v18"/>',camera:'<rect x="3" y="7" width="18" height="12.5" rx="2.5"/><path d="M8.6 7 10 4.5h4L15.4 7"/><circle cx="12" cy="13.2" r="3.2"/>',pin:'<path d="M12 21.5s6.5-5.8 6.5-11A6.5 6.5 0 0 0 5.5 10.5c0 5.2 6.5 11 6.5 11z"/><circle cx="12" cy="10.2" r="2.4"/>',route:'<circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8 6h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5"/>'};
function mvSvg(n,sz,c){return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="'+(c||'currentColor')+'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(MAP_IC[n]||MAP_IC.pin)+'</svg>';}
function mvStepIcon(s){if(s.t==='transport')return s.mode||'route';return({logement:'bed',restaurant:'fork',activite:'camera',autre:'pin'})[s.t]||'pin';}
function mvRegClass(r){return r==='Busan'?'mv-r-busan':r==='Vol'?'mv-r-vol':'mv-r-seoul';}
function regionClass(r){return mvRegClass(r);}
function regionPretty(r){return r||'Voyage';}
function fmtDate(iso){return mvFmtDate(iso);}
function gcPoints(a,b,n){n=n||80;const R=d=>d*Math.PI/180,D=r=>r*180/Math.PI;const la1=R(a[1]),lo1=R(a[0]),la2=R(b[1]),lo2=R(b[0]);const d=2*Math.asin(Math.sqrt(Math.sin((la2-la1)/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin((lo2-lo1)/2)**2));if(d===0)return[a,b];const pts=[];for(let i=0;i<=n;i++){const f=i/n;const A=Math.sin((1-f)*d)/Math.sin(d),B=Math.sin(f*d)/Math.sin(d);const x=A*Math.cos(la1)*Math.cos(lo1)+B*Math.cos(la2)*Math.cos(lo2);const y=A*Math.cos(la1)*Math.sin(lo1)+B*Math.cos(la2)*Math.sin(lo2);const z=A*Math.sin(la1)+B*Math.sin(la2);pts.push([D(Math.atan2(y,x)),D(Math.atan2(z,Math.sqrt(x*x+y*y)))]);}return pts;}
function gcDist(a,b){const R=6371,r=d=>d*Math.PI/180;const dLa=r(b[1]-a[1]),dLo=r(b[0]-a[0]);const s=Math.sin(dLa/2)**2+Math.cos(r(a[1]))*Math.cos(r(b[1]))*Math.sin(dLo/2)**2;return 2*R*Math.asin(Math.sqrt(s));}
const MONTHS_MAP=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
function fmtDuration(sec){if(sec<60)return '< 1 min';if(sec<3600)return Math.round(sec/60)+' min';var h=Math.floor(sec/3600),m=Math.round((sec%3600)/60);return h+'h'+(m>0?String(m).padStart(2,'0'):'');}
function fmtDistKm(m){if(m<1000)return Math.round(m)+' m';return (m/1000).toFixed(1)+' km';}
function mvFmtDate(iso){const d=new Date(iso);return d.getDate()+' '+MONTHS_MAP[d.getMonth()];}

/* ═══ CSS ═══ */
const MV_CSS=`
.mv-frame { flex:1;display:flex;flex-direction:column;min-height:0;min-width:0; }
.mv-workspace-map { color:var(--text);font-family:var(--font-sans);padding:0 24px 20px; }
.mv-map-toolbar { display:flex;align-items:center;flex-wrap:wrap;gap:8px;position:relative;z-index:50;padding:12px;background:var(--card);border:1px solid var(--line);border-radius:16px 16px 0 0;flex-shrink:0; }
.web-map-search { position:relative;flex:1 1 280px;min-width:160px; }
.map-search-field { position:relative; }
.map-search-field input { width:100%;height:46px;padding:10px 44px 10px 38px;border:1px solid var(--line);border-radius:10px;background:var(--inset);color:var(--text);font:400 16px var(--font-sans); }
.map-search-field input::-webkit-search-cancel-button { -webkit-appearance:none; }
.map-search-icon { position:absolute;left:13px;top:15px;color:var(--muted);pointer-events:none; }
.map-search-clear { position:absolute;right:1px;top:1px;display:grid;place-items:center;width:44px;height:44px;padding:0;border:0;background:transparent;color:var(--muted);cursor:pointer; }
.map-search-feedback,.map-search-results { position:absolute;top:100%;left:0;right:0;z-index:2;margin:8px 0 0;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--text);box-shadow:0 8px 28px #0002;font-size:13px; }
.map-search-results { list-style:none;padding:4px;max-height:min(300px,38dvh);overflow:auto;overscroll-behavior:contain; }
.map-search-results button { display:flex;align-items:flex-start;gap:10px;width:100%;min-height:44px;padding:12px 10px;border:0;border-radius:8px;background:none;color:var(--text);font:inherit;text-align:left;cursor:pointer; }
.map-search-results button:hover { background:var(--inset); }
.map-search-results strong,.map-search-results small { display:block;line-height:1.45;overflow-wrap:anywhere; }
.map-search-results small { margin-top:3px;font-size:12px;color:var(--muted); }
.map-search-results button>span:first-child { flex-shrink:0; }
.map-search-retry { min-height:44px;margin-top:8px;padding:8px 14px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--text);font:inherit;cursor:pointer; }
.web-map-search:has(.map-search-retry) .map-search-feedback { position:static; }
.mv-map-day-select { flex:0 1 240px;min-width:140px; }
.mv-map-day-select select { width:100%;min-height:46px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--text);font:400 14px var(--font-sans);text-overflow:ellipsis; }
.mv-map-button,.web-map-toolbox summary { display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:44px;min-height:46px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--text);font:500 13px/1.4 var(--font-sans);cursor:pointer; }
.mv-map-button:hover,.web-map-toolbox summary:hover { background:var(--inset); }
.mv-map-button[aria-pressed="true"] { background:var(--fv-primary,var(--accent));color:var(--fv-onprimary,var(--accent-ink));border-color:transparent; }
.web-map-toolbox summary { list-style:none; }
.web-map-toolbox summary::-webkit-details-marker { display:none; }
.web-map-controls { position:absolute;top:calc(100% + 8px);right:0;display:grid;gap:10px;width:min(280px,100%);max-height:min(440px,50dvh);overflow:auto;overscroll-behavior:contain;padding:14px;background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:0 8px 28px #0002; }
.mv-map-control-group { display:flex;gap:6px; }
.mv-map-control-group button { flex:1; }
.mv-map-section-label { font-size:12px;font-weight:600;color:var(--muted); }
.web-map-readout { font-size:12px;text-align:center;color:var(--muted);padding:6px; }
.mv-map-wrap { flex:1;position:relative;min-width:0;min-height:0;background:var(--inset);overflow:hidden;border:1px solid var(--line);border-top:0;border-radius:0 0 16px 16px; }
#mv-map { position:absolute;inset:0; }
#mv-map .maplibregl-ctrl-attrib { font-size:11px; }
.mv-map-loading { position:absolute;inset:0;z-index:40;display:grid;place-items:center;padding:24px;text-align:center;background:var(--inset);color:var(--muted);font-size:14px; }
.mv-map-loading[data-error="true"] { color:var(--text); }
.web-map-pick-banner { position:absolute;left:12px;right:12px;top:12px;z-index:25;display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--card);font-size:13px; }
.web-map-pick-banner button { margin-left:auto;flex-shrink:0;min-width:44px;min-height:44px; }
.web-map-day-card,.web-map-found-place { position:absolute;left:12px;bottom:32px;z-index:5;width:360px;max-width:calc(100% - 24px);max-height:55%;overflow:auto;overscroll-behavior:contain;border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:0 8px 24px #0002; }
.mv-card { width:100%;color:var(--text);background:var(--card); }
.mv-card-head { padding:14px 16px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;border-bottom:1px solid var(--line); }
.mv-card-title,.mv-found-title { font:600 18px/1.3 var(--font-sans);margin-top:4px;overflow-wrap:anywhere; }
.mv-card-status { font-size:12px;color:var(--muted); }
.mv-card-toggle { flex-shrink:0;min-width:44px;min-height:44px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--text);font:inherit;cursor:pointer; }
.mv-card-body { padding:12px 16px 16px; }
.mv-card-summary { margin:0;font-size:13px;color:var(--muted); }
.mv-card-note { margin:10px 0;padding:10px;background:var(--inset);border-radius:10px;font-size:13px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere; }
.mv-card-steps { display:none;margin-top:12px;border-top:1px solid var(--line);padding-top:12px; }
.mv-card-body.expanded .mv-card-steps { display:block; }
.mv-steps-heading { font-size:12px;font-weight:600;color:var(--muted);margin:0 0 8px; }
.mv-step-row { display:flex;align-items:center;gap:10px;width:100%;min-height:48px;padding:10px 0;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--text);font:inherit;text-align:left;cursor:pointer; }
.mv-step-row:hover,.mv-step-row.is-active { background:var(--inset); }
.mv-step-ico,.mv-step-ic { display:grid;place-items:center;width:30px;height:30px;flex-shrink:0;border-radius:8px;background:var(--inset);color:var(--text); }
.mv-step-txt { min-width:0; }
.mv-step-txt strong { font-size:14px;font-weight:600;line-height:1.4;overflow-wrap:anywhere; }
.mv-step-meta { display:flex;flex-wrap:wrap;gap:6px;margin-top:3px;font-size:12px;color:var(--muted); }
.mv-step-empty { padding:12px 0;font-size:13px;color:var(--muted); }
.mv-card-foot { display:flex;gap:8px;flex-wrap:wrap;margin-top:12px; }
.mv-card-foot button { flex:1;min-height:44px;padding:8px 10px;display:flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--text);font:500 12px/1.4 var(--font-sans);cursor:pointer; }
.mv-card-foot button:first-child { background:var(--fv-primary,var(--accent));color:var(--fv-onprimary,var(--accent-ink));border-color:transparent; }
.mv-welcome-pad { padding:16px; }
.mv-welcome-line { font-size:13px;line-height:1.5;color:var(--muted);margin-top:8px; }
.web-map-found-place button { min-width:44px;min-height:44px; }
.mv-glass { background:var(--card);border:1px solid var(--line);border-radius:12px; }
.mv-pin{cursor:pointer;width:30px;height:30px}
.mv-pin .badge{width:30px;height:30px;border-radius:50%;background:var(--accent);color:#fff;display:grid;place-items:center;font-family:var(--font-mono,ui-monospace);font-weight:700;font-size:12.5px;border:2.5px solid var(--card);box-shadow:0 3px 9px rgba(31,46,40,.4);transition:transform .2s}
.mv-r-busan .badge{background:#c98a3c}
.mv-r-vol .badge{background:var(--faint)}
.mv-pin:hover .badge{transform:scale(1.14)}
.mv-pin.active .badge{transform:scale(1.22);box-shadow:0 0 0 5px var(--accent-soft),0 6px 16px rgba(0,0,0,.32)}
.mv-pin.faded{opacity:.35;pointer-events:none;transition:opacity .5s}
.mv-pin.faded .badge{transform:scale(.85)}
.mv-step-pin{display:flex;flex-direction:column;align-items:center;cursor:pointer;pointer-events:auto}
.mv-step-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono,ui-monospace);font-size:12px;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,.25);transition:all .25s ease;position:relative}
.mv-step-dot::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid transparent;transition:border-color .25s}
.mv-step-pin:hover .mv-step-dot{transform:scale(1.15)}
.mv-step-pin:hover .mv-step-dot::after{border-color:var(--accent)}
.mv-step-label{margin-top:4px;padding:3px 8px;border-radius:6px;font-size:10.5px;font-weight:700;color:var(--text);max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;opacity:0;transition:opacity .2s;pointer-events:none}
.mv-step-pin:hover .mv-step-label{opacity:1}
.mv-time-pill{padding:4px 10px;border-radius:999px;font-size:10px;font-weight:700;display:flex;align-items:center;gap:4px;white-space:nowrap;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.1)}

.mv-workspace-map :is(button,input,select,summary):focus-visible { outline:3px solid var(--fv-focus,var(--accent));outline-offset:2px; }
.mv-workspace-map button:disabled { opacity:.5;cursor:not-allowed; }
@media(max-width:760px) {
  .mv-workspace-map { padding:0 12px 12px; }
  .web-map-search { flex-basis:100%; }
  .mv-map-day-select { flex:1;min-width:100px; }
  .mv-map-toolbar { gap:6px;padding:8px; }
  .mv-map-button,.web-map-toolbox summary { font-size:12px;padding:8px; }
  .web-map-day-card,.web-map-found-place { width:calc(100% - 24px);max-height:45%; }
}
@media(max-height:560px) {
  .mv-workspace-map { overflow:auto; }
  .mv-map-wrap { flex:1 0 260px; }
}
@media(prefers-reduced-motion:reduce) {
  .mv-pin .badge,.mv-step-dot,.mv-step-label { transition:none; }
}
`;

/* ═══ TILES ═══ */
const MT_KEY='08IwMKKAkP3BQJss5poF';
const MV_LIGHT='https://api.maptiler.com/maps/streets-v2/style.json?key='+MT_KEY+'&language=fr';
const MV_DARK='https://api.maptiler.com/maps/streets-v2-dark/style.json?key='+MT_KEY+'&language=fr';
const MV_SAT='https://api.maptiler.com/maps/hybrid/style.json?key='+MT_KEY+'&language=fr';

function mapStepCoords(step) {
  if (step && Number.isFinite(Number(step.lat)) && Number.isFinite(Number(step.lng))) {
    return [Number(step.lng), Number(step.lat)];
  }

  return null;
}

function tripToMapTrip(realTrip) {
  if (!realTrip || !Array.isArray(realTrip.days) || !realTrip.days.length) {
    return { name: realTrip?.name || 'Voyage', dates: '', days: [] };
  }

  const days = realTrip.days.map(function(day, index) {

    const steps = (day.steps || []).reduce(function(list, step) {
      const coords = mapStepCoords(step);

      if (step.type === 'transport') {
        (step.escales || []).forEach(function(escale, escaleIndex) {
          const escaleCoords = mapStepCoords(escale);
          if (!escaleCoords) return;

          list.push({
            id: step.id + '-escale-' + escaleIndex,
            t: 'transport',
            mode: step.transportType || 'route',
            l: escale.place || 'Escale ' + (escaleIndex + 1),
            s: [
              'Escale',
              escale.arrivalTime ? 'arr. ' + escale.arrivalTime : '',
              escale.departureTime ? 'dép. ' + escale.departureTime : ''
            ].filter(Boolean).join(' · '),
            time: escale.arrivalTime || escale.departureTime || step.time || '',
            c: escaleCoords,
            raw: { ...step, escale, isEscale: true }
          });
        });
      }

      if (coords) {
        list.push({
          id: step.id,
          t: step.type || 'autre',
          mode: step.transportType || step.type || 'pin',
          l: step.label || step.lieu || step.arrivee || step.depart || 'Étape',
          s: step.type === 'transport'
            ? [step.depart, step.arrivee].filter(Boolean).join(' → ')
            : (step.lieu || step.note || ''),
          time: step.time || '',
          c: coords,
          raw: step
        });
      }

      return list;
    }, []);

    const firstCoords = steps.find(function(step) {
      return step.c;
    });

    return {
      id: day.id,
      n: day.index != null ? day.index + 1 : index + 1,
      date: day.dateISO || '',
      wd: '',
      region: day.title || realTrip.destination || realTrip.name || 'Voyage',
      city: day.title || realTrip.destination || realTrip.name || 'Journée',
      title: day.title || 'Journée ' + (index + 1),
      tag: realTrip.destination || realTrip.name || 'Voyage',
      note: day.note || '',
      c: firstCoords ? firstCoords.c : null,
      z: firstCoords ? 13.5 : 2,
      steps
    };
  });

  return {
    name: realTrip.name || 'Voyage',
    dates: [realTrip.startDate, realTrip.endDate].filter(Boolean).join(' — ') || '',
    days
  };
}

function MapView(){
  const {trip:realTrip,theme=localStorage.getItem('it_theme')||'light'}=Store.useStore();
  const mapEl=React.useRef(null),mapRef=React.useRef(null),cardRef=React.useRef(null);
  const readoutRef=React.useRef(null),needleRef=React.useRef(null);
  const spinRef=React.useRef(true),markersRef=React.useRef({day:[],step:[]});
  const tourRef=React.useRef({on:false,timer:null}),styleCache=React.useRef({});
  const searchTimer=React.useRef(null);
  const previewMarkerRef=React.useRef(null);
  const T=tripToMapTrip(realTrip);

  const [sel,setSel]=React.useState(null);

  const [
    mapLibraryState,
    setMapLibraryState
  ] = React.useState(
    window.maplibregl
      ? 'ready'
      : 'idle'
  );

  React.useEffect(function prepareMapLibrary() {
    if (!realTrip) {
      setMapLibraryState('idle');
      return undefined;
    }

    if (window.maplibregl) {
      setMapLibraryState('ready');
      return undefined;
    }

    let active = true;

    setMapLibraryState('loading');

    loadMapLibre()
      .then(function handleMapLibrary() {
        if (active) {
          setMapLibraryState('ready');
        }
      })
      .catch(function handleMapLibraryError(
        error
      ) {
        console.error(
          'Erreur chargement MapLibre',
          error
        );

        if (active) {
          setMapLibraryState('error');
        }
      });

    return function cancelMapLibrary() {
      active = false;
    };
  }, [
    realTrip && realTrip.id
  ]);
  const { selectedDayIndex, mapFocusStepId, mapLocateStep, mapPickResult, mapPreviewPlace } = Store.useStore();
  const locatingStepName = React.useMemo(function() {
  if (!mapLocateStep || !realTrip || !Array.isArray(realTrip.days)) return '';

  for (const day of realTrip.days) {
    const step = (day.steps || []).find(function(item) {
      return String(item.id || '') === String(mapLocateStep.stepId || '');
    });

    if (step) {
      return step.label || step.lieu || step.arrivee || step.depart || step.type || 'cette étape';
    }
  }

  
  return '';
}, [mapLocateStep, realTrip]);
  React.useEffect(() => {
    let frame;
    const resize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => mapRef.current?.resize());
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    if (mapEl.current) observer?.observe(mapEl.current);
    window.addEventListener('resize', resize);
    resize();
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(frame);
    };
  }, [mapLibraryState]);

  const firstRender=React.useRef(true);
  React.useEffect(()=>{
  if (firstRender.current) {
    firstRender.current = false;
    return;
  }

  if (selectedDayIndex != null && selectedDayIndex !== sel) {
    doSelect(selectedDayIndex, true);
  }
}, [selectedDayIndex]);

React.useEffect(() => {
  if (!mapFocusStepId) return;

  const timer = setTimeout(() => {
    focusStepById(mapFocusStepId);
  }, 220);

  return () => clearTimeout(timer);
}, [mapFocusStepId, realTrip && realTrip.id]);

React.useEffect(() => {
  if (!mapPreviewPlace) return;

  const timer = setTimeout(function() {
    focusPreviewPlace(mapPreviewPlace);
  }, 260);

  return function() {
    clearTimeout(timer);
  };
}, [
  mapPreviewPlace && mapPreviewPlace.id,
  mapPreviewPlace && mapPreviewPlace.lat,
  mapPreviewPlace && mapPreviewPlace.lng
]);

  const [curStyle,setCurStyle]=React.useState('minimal');
  const [layersOpen,setLayersOpen]=React.useState(false);
  const [query,setQuery]=React.useState('');
  const [results,setResults]=React.useState([]);
  const [searchState, setSearchState] = React.useState('idle');
  const searchVersion = React.useRef(0);
  const searchInputRef = React.useRef(null);

  React.useEffect(function cleanupPlaceSearch() {
    return function cleanup() {
      clearTimeout(searchTimer.current);
      searchVersion.current += 1;
    };
  }, []);
  const [foundPlace,setFoundPlace]=React.useState(null);
  const [pickingDay,setPickingDay]=React.useState(false);
  const [editorOpen,setEditorOpen]=React.useState(null);
  const [touring,setTouring]=React.useState(false);

  // ── Style builders ──
  async function fetchS(u){if(styleCache.current[u])return styleCache.current[u];const j=await(await fetch(u)).json();styleCache.current[u]=j;return j;}
  const clone=o=>JSON.parse(JSON.stringify(o));
  async function buildBase(){return clone(await fetchS(theme==='dark'?MV_DARK:MV_LIGHT));}
  async function buildSat(){return clone(await fetchS(MV_SAT));}
  function applyGlobe(map){
    try{map.setProjection({type:'globe'});}catch(e){}
    const dk=theme==='dark';
    try{map.setSky(dk?{'sky-color':'#0d251f','horizon-color':'#1b4b3f','fog-color':'#143a31','sky-horizon-blend':.6,'horizon-fog-blend':.6,'fog-ground-blend':.5,'atmosphere-blend':['interpolate',['linear'],['zoom'],0,.8,5,.4,9,0]}:{'sky-color':'#a8c9e6','horizon-color':'#f4efe5','fog-color':'#f7f2e8','sky-horizon-blend':.6,'horizon-fog-blend':.6,'fog-ground-blend':.55,'atmosphere-blend':['interpolate',['linear'],['zoom'],0,.85,5,.45,9,0]});}catch(e){}
  }
  function addRoutes(map){
    if(map.getSource('legs'))return;
    const feats=MAP_LEGS.map(l=>({type:'Feature',properties:{mode:l.mode},geometry:{type:'LineString',coordinates:gcPoints(l.a,l.b,96)}}));
    map.addSource('legs',{type:'geojson',data:{type:'FeatureCollection',features:feats}});
    map.addLayer({id:'legs-glow',type:'line',source:'legs',layout:{'line-cap':'round'},paint:{'line-color':'#b4843e','line-width':6,'line-opacity':.18,'line-blur':4}});
    map.addLayer({id:'legs-line',type:'line',source:'legs',layout:{'line-cap':'round'},paint:{'line-color':'#b4843e','line-width':2,'line-dasharray':[1.5,2.5]}});
  }

  // ── Markers ──
function buildDayMarkers(map){
  T.days.forEach((d,i)=>{
    if (!d.c) return;

    const el=document.createElement('div');
    el.className='mv-pin '+mvRegClass(d.region);
    el.innerHTML='<div class="badge">'+d.n+'</div>';

    el.addEventListener('click',e=>{
      e.stopPropagation();

      var pick=Store.get().mapPickMode;

      if(pick){
        Store.set({
          mapPickResult:{
            field:pick,
            text:d.city+' (J'+d.n+')',
            coords:d.c
          },
          mapPickMode:null
        });
        return;
      }

      doSelect(i,true);
    });

    const m=new maplibregl.Marker({
      element:el,
      anchor:'center'
    }).setLngLat(d.c).addTo(map);

    markersRef.current.day.push({m,el});
  });
}

function clearStepMarkers(){
  markersRef.current.step.forEach(function removeStepMarker(marker){
    try{marker.remove();}catch(e){}
  });
  markersRef.current.step=[];

  const map=mapRef.current;
  if(!map||!map.style)return;

  try{if(map.getLayer&&map.getLayer('step-route-glow'))map.removeLayer('step-route-glow');}catch(e){}
  try{if(map.getLayer&&map.getLayer('step-route-line'))map.removeLayer('step-route-line');}catch(e){}
  try{if(map.getSource&&map.getSource('step-route'))map.removeSource('step-route');}catch(e){}
}
function showStepMarkers(map,day){
  if(!map||!day)return;

  if(map.isStyleLoaded&&!map.isStyleLoaded()){
    try{
      map.once('idle',function retryShowStepMarkers(){
        if(mapRef.current===map)showStepMarkers(map,day);
      });
    }catch(e){}
    return;
  }

  clearStepMarkers();
  var withCoords=[];
    day.steps.forEach(function(s,k){if(s.c)withCoords.push({s:s,idx:k});});
    if(!withCoords.length)return;
    var coords=withCoords.map(function(w){return w.s.c;});
    var borderCol={transport:'#597b72',logement:'#7c5410',restaurant:'#d9b67e',activite:'#7c5410',autre:'#827567'};
    var bgCol={transport:'#edf5f2',logement:'#fdf6ec',restaurant:'#fdf3e0',activite:'#fdf6ec',autre:'#f2f0ed'};

    /* ── Marqueurs d'étape ── */
    withCoords.forEach(function(w,i){
      var s=w.s;
      var bc=borderCol[s.t]||'#7c5410';
      var bg=bgCol[s.t]||'#fdf6ec';

      var pin=document.createElement('div');
      pin.className='mv-step-pin';

      var dot=document.createElement('div');
      dot.className='mv-step-dot';
      dot.style.background=bg;
      dot.style.border='2.5px solid '+bc;
      dot.style.color=bc;
      dot.textContent=String(i+1);
      pin.appendChild(dot);

      var lbl=document.createElement('div');
      lbl.className='mv-step-label mv-glass';
      lbl.textContent=s.l||'';
      pin.appendChild(lbl);

      pin.onclick=function(e){e.stopPropagation();var pick=Store.get().mapPickMode;if(pick){Store.set({mapPickResult:{field:pick,text:s.l||'Point',coords:s.c},mapPickMode:null});return;}map.flyTo({center:s.c,zoom:Math.max(map.getZoom(),16),duration:1200});};

      var m=new maplibregl.Marker({element:pin,anchor:'center'}).setLngLat(s.c).addTo(map);
      markersRef.current.step.push(m);
    });

    if(coords.length<2)return;

/* ── Tracé droit (instantané) ── */
if(map.getSource&&map.getSource('step-route')){
  try{map.getSource('step-route').setData({type:'Feature',geometry:{type:'LineString',coordinates:coords}});}catch(e){}
}else{
  map.addSource('step-route',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:coords}}});
}
if(!map.getLayer||!map.getLayer('step-route-glow')){
  map.addLayer({id:'step-route-glow',type:'line',source:'step-route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#e67e22','line-width':12,'line-opacity':0.25,'line-blur':5}});
}
if(!map.getLayer||!map.getLayer('step-route-line')){
  map.addLayer({id:'step-route-line',type:'line',source:'step-route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#e67e22','line-width':4.5,'line-opacity':0.95}});
}

    /* ── Route réelle + pilules temps/distance ── */
    var pairMode=coords.length<=6?'driving':'driving';
    var coordStr=coords.map(function(c){return c[0]+','+c[1];}).join(';');
    fetch('https://routing.openstreetmap.de/routed-foot/route/v1/driving/'+coordStr+'?overview=full&geometries=geojson')
      .then(function(r){return r.json();})
      .then(function(data){
        if(!data.routes||!data.routes[0])return;
        var route=data.routes[0];

        /* Remplacer le tracé droit par la vraie route */
if(!mapRef.current||mapRef.current!==map)return;
if(!map.getSource||!map.getSource('step-route'))return;

var src=map.getSource('step-route');
if(src)src.setData({type:'Feature',geometry:route.geometry});

        /* Pilules temps + distance entre chaque paire */
        if(!route.legs)return;
        route.legs.forEach(function(leg,i){
          if(i>=coords.length-1)return;
          var mid=[(coords[i][0]+coords[i+1][0])/2,(coords[i][1]+coords[i+1][1])/2];
          var pill=document.createElement('div');
          pill.className='mv-time-pill mv-glass';
          var dur=leg.duration;var dist=leg.distance;
          var durTxt=dur<60?'< 1 min':dur<3600?Math.round(dur/60)+' min':Math.floor(dur/3600)+'h'+String(Math.round((dur%3600)/60)).padStart(2,'0');
          var distTxt=dist<1000?Math.round(dist)+' m':(dist/1000).toFixed(1)+' km';
          pill.innerHTML='<span style="color:var(--accent)">'+durTxt+'</span><span style="color:var(--faint)">\u00b7</span><span style="color:var(--muted)">'+distTxt+'</span>';
          var pm=new maplibregl.Marker({element:pill,anchor:'center'}).setLngLat(mid).addTo(map);
          markersRef.current.step.push(pm);
        });
      })+'</div></div></div>';
  }

  // ── Cards ──
 function mapEscape(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  }

  function renderWelcome() {
    if (!cardRef.current) return;
    const count = T.days.reduce((total, day) => total + (day.steps || []).length, 0);
    cardRef.current.innerHTML =
      '<div class="mv-card"><div class="mv-welcome-pad">' +
      '<div class="mv-card-status">Vue du voyage</div>' +
      '<div class="mv-card-title">' + mapEscape(T.name) + '</div>' +
      '<div class="mv-welcome-line">' + T.days.length + ' jours · ' + count + ' points localisés.' +
      '<br>' + (T.days.length ? 'Choisis une journée dans le sélecteur au-dessus de la carte.' : 'Ajoute une journée dans l’itinéraire pour commencer.') +
      '</div></div></div>';
  }

  function renderDayCard(i) {
    if (!cardRef.current) return;
    const d = T.days[i];
    if (!d) return;
    const date = d.date && !Number.isNaN(new Date(d.date).getTime()) ? fmtDate(d.date) : 'Date à définir';
    const labels = { activite: 'Activité', restaurant: 'Restaurant', logement: 'Hébergement', transport: 'Transport', autre: 'Étape' };
    const rows = d.steps.map((step, index) =>
      '<button type="button" class="mv-step-row" data-step="' + index + '">' +
      '<span class="mv-step-ico">' + mvSvg(mvStepIcon(step), 14) + '</span>' +
      '<span class="mv-step-txt"><strong>' + mapEscape(step.l) + '</strong>' +
      '<span class="mv-step-meta"><span>' + mapEscape(step.time || 'Horaire libre') +
      '</span><span>' + mapEscape(labels[step.t] || 'Étape') + '</span></span></span></button>'
    ).join('') || '<div class="mv-step-empty">Aucun point localisé pour cette journée. Complète les lieux dans l’itinéraire.</div>';

    cardRef.current.innerHTML =
      '<div class="mv-card"><div class="mv-card-head"><div>' +
      '<div class="mv-card-status">J' + (i + 1) + ' · ' + mapEscape(date) + '</div>' +
      '<div class="mv-card-title">' + mapEscape(d.title) + '</div></div>' +
      '<button id="mv-toggle-btn" class="mv-card-toggle" type="button" aria-label="Afficher les étapes" aria-expanded="false" aria-controls="mv-map-day-steps" title="Déplier la journée">⌃</button></div>' +
      '<div id="mv-card-body" class="mv-card-body">' +
      '<p class="mv-card-summary">' + d.steps.length + ' points localisés dans cette journée.</p>' +
      (d.note ? '<div class="mv-card-note">' + mapEscape(d.note) + '</div>' : '') +
      '<div id="mv-map-day-steps" class="mv-card-steps"><p class="mv-steps-heading">Lieux de la journée</p>' + rows + '</div>' +
      '<div class="mv-card-foot">' +
      '<button id="mv-itinerary-btn" type="button">' + mvSvg('route', 14) + 'Voir dans l’itinéraire</button>' +
      '<button id="mv-expand-btn" type="button" aria-expanded="false" aria-controls="mv-map-day-steps">Étapes (' + d.steps.length + ')</button>' +
      '</div></div></div>';

  const map = mapRef.current;

cardRef.current.querySelectorAll('.mv-step-row').forEach(function bindStep(btn) {
  btn.addEventListener('click', function clickStep() {
    const s = d.steps[Number(btn.getAttribute('data-step'))];

    if (s && s.c && map) {
      cardRef.current.querySelectorAll('.mv-step-row.is-active').forEach(function clearActive(row) {
        row.classList.remove('is-active');
      });

      btn.classList.add('is-active');

      map.flyTo({
        center: s.c,
        zoom: 15,
        duration: 700
      });
    } else if (s) {
      locateModeRef.current = {
        dayIndex: i,
        stepIndex: Number(btn.getAttribute('data-step'))
      };

      Store.showToast('Clique sur la carte pour placer : ' + s.l);
    }
  });
});

const itineraryBtn = document.getElementById('mv-itinerary-btn');

if (itineraryBtn) {
  itineraryBtn.addEventListener('click', function openItinerary() {
    Store.set({
      view: 'itinerary',
      selectedDayIndex: i
    });
  });
}

  const cardBody = document.getElementById('mv-card-body');
  const toggleBtn = document.getElementById('mv-toggle-btn');
  const expandBtn = document.getElementById('mv-expand-btn');

  function setExpanded(expanded) {
    if (!cardBody) return;

    cardBody.classList.toggle('expanded', expanded);

    if (toggleBtn) {
      toggleBtn.textContent = expanded ? '⌄' : '⌃';
      toggleBtn.title = expanded ? 'Replier la journée' : 'Déplier la journée';
      toggleBtn.setAttribute('aria-expanded', String(expanded));
    }

    if (expandBtn) {
      expandBtn.setAttribute('aria-expanded', String(expanded));
      expandBtn.innerHTML = mvSvg(expanded ? 'chevup' : 'chevdown', 12) +
        (expanded ? 'Replier' : 'Étapes (' + d.steps.length + ')');
    }
  }

  function toggleExpanded() {
    if (!cardBody) return;

    setExpanded(!cardBody.classList.contains('expanded'));
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleExpanded);
  }

  if (expandBtn) {
    expandBtn.addEventListener('click', toggleExpanded);
  }
}

  // ── Navigation ──
function flyDay(i){
  const map=mapRef.current;
  if(!map)return;

  const d=T.days[i];
  if(!d)return;

  var pts=d.steps.filter(function(s){
    return s.c;
  }).map(function(s){
    return s.c;
  });

  if(pts.length>1){
    var b=new maplibregl.LngLatBounds();
    pts.forEach(function(p){
      b.extend(p);
    });

    map.fitBounds(b,{
      padding:{top:80,bottom:140,left:60,right:60},
      pitch:42,
      bearing:0,
      duration:2200,
      maxZoom:15.5
    });

    return;
  }

  if(d.c){
    map.flyTo({
      center:d.c,
      zoom:d.z,
      pitch:d.region==='Vol'?0:42,
      bearing:0,
      duration:2200,
      curve:1.5,
      essential:true
    });
    return;
  }

  if (Store.showToast) {
    Store.showToast('Ajoute une localisation à cette journée pour l’afficher sur la carte.');
  }
}
    function focusStepById(stepId) {
  const map = mapRef.current;
  if (!map || !stepId || !T || !Array.isArray(T.days)) return false;

  for (let dayIndex = 0; dayIndex < T.days.length; dayIndex += 1) {
    const currentDay = T.days[dayIndex];
    const steps = currentDay.steps || [];

    const foundStep = steps.find(function(item) {
      return String(item.id || '') === String(stepId || '');
    });

    if (!foundStep) continue;

    spinRef.current = false;
    doSelect(dayIndex, false);

    if (foundStep.c) {
      map.flyTo({
        center: foundStep.c,
        zoom: Math.max(map.getZoom(), 16),
        pitch: 42,
        bearing: 0,
        duration: 1200,
        essential: true
      });
    } else {
      flyDay(dayIndex);
      if (Store.showToast) Store.showToast('Cette étape n’a pas encore de localisation.');
    }

    Store.set({ mapFocusStepId: null });
    return true;
  }

  Store.set({ mapFocusStepId: null });
  return false;
}

  function doSelect(i,fly){spinRef.current=false;setSel(i);Store.set({selectedDayIndex:i});const map=mapRef.current;if(!map)return;markersRef.current.day.forEach((dm,k)=>{dm.el.classList.toggle('active',k===i);dm.el.classList.toggle('faded',k!==i);});showStepMarkers(map,T.days[i]);renderDayCard(i);if(fly)flyDay(i);}
  function showGlobe(){spinRef.current=true;setSel(null);clearStepMarkers();markersRef.current.day.forEach(dm=>{dm.el.classList.remove('active');dm.el.classList.remove('faded');});renderWelcome();const map=mapRef.current;if(!map)return;map.flyTo({center:[64,44],zoom:1.6,pitch:0,bearing:0,duration:2400,curve:1.4});setTimeout(()=>{if(spinRef.current)spinGlobe();},2500);}
function fitAll(){
  spinRef.current=false;
  setSel(null);
  clearStepMarkers();

  markersRef.current.day.forEach(dm=>{
    dm.el.classList.remove('active');
    dm.el.classList.remove('faded');
  });

  renderWelcome();

  const map=mapRef.current;
  if(!map)return;

  const daysWithCoords = T.days.filter(function(day){
    return day.c;
  });

  if (!daysWithCoords.length) {
    showGlobe();

    if (Store.showToast) {
      Store.showToast('Aucun point localisé pour ce voyage.');
    }

    return;
  }

  const b=new maplibregl.LngLatBounds();

  daysWithCoords.forEach(function(day){
    b.extend(day.c);
  });

  map.fitBounds(b,{
    padding:90,
    duration:2000,
    pitch:0,
    bearing:0
  });
}
  function spinGlobe(){const map=mapRef.current;if(!map||!spinRef.current||map.getZoom()>3.2)return;const c=map.getCenter();c.lng-=.55;map.easeTo({center:c,duration:1300,easing:t=>t});}

  // ── Tour ──
  function stopTour(){tourRef.current.on=false;clearTimeout(tourRef.current.timer);setTouring(false);}
  function startTour(){tourRef.current.on=true;spinRef.current=false;setTouring(true);let i=0;const step=()=>{if(!tourRef.current.on)return;doSelect(i,true);i++;if(i>=T.days.length){tourRef.current.timer=setTimeout(()=>{if(tourRef.current.on)stopTour();},2600);return;}tourRef.current.timer=setTimeout(step,2700);};step();}

  // ── Search ──
    function hasKoreanText(value) {
    return /[\u3130-\u318F\uAC00-\uD7AF]/.test(String(value || ''));
  }

  function frenchKoreaName(value) {
    const raw = String(value || '').trim();
    const key = raw.toLowerCase();

    const map = {
      '서울': 'Séoul',
      '서울특별시': 'Séoul',
      'seoul': 'Séoul',

      '부산': 'Busan',
      '부산광역시': 'Busan',
      'busan': 'Busan',

      '인천': 'Incheon',
      '인천광역시': 'Incheon',
      'incheon': 'Incheon',

      '대구': 'Daegu',
      'daegu': 'Daegu',

      '대전': 'Daejeon',
      'daejeon': 'Daejeon',

      '광주': 'Gwangju',
      'gwangju': 'Gwangju',

      '제주': 'Jeju',
      'jeju': 'Jeju',

      '경주': 'Gyeongju',
      'gyeongju': 'Gyeongju',

      '전주': 'Jeonju',
      'jeonju': 'Jeonju',

      '강릉': 'Gangneung',
      'gangneung': 'Gangneung',

      '수원': 'Suwon',
      'suwon': 'Suwon'
    };

    return map[key] || map[raw] || raw;
  }

  function cleanFrenchPlaceText(value) {
    const text = String(value || '').trim();
    if (!text) return '';

    return text
      .replaceAll('서울특별시', 'Séoul')
      .replaceAll('서울', 'Séoul')
      .replaceAll('부산광역시', 'Busan')
      .replaceAll('부산', 'Busan')
      .replaceAll('인천광역시', 'Incheon')
      .replaceAll('인천', 'Incheon')
      .replaceAll('대구', 'Daegu')
      .replaceAll('대전', 'Daejeon')
      .replaceAll('광주', 'Gwangju')
      .replaceAll('제주', 'Jeju')
      .replaceAll('경주', 'Gyeongju')
      .replaceAll('전주', 'Jeonju')
      .replaceAll('강릉', 'Gangneung')
      .replaceAll('수원', 'Suwon');
  }

  function preferredPlaceLabel(f) {
    const candidates = [
      f.label,
      f.name,
      f.text,
      f.address,
      f.formatted,
      f.place_name
    ].filter(Boolean).map(cleanFrenchPlaceText);

    const latin = candidates.find(function(item) {
      return item && !hasKoreanText(item);
    });

    return latin || candidates[0] || 'Lieu';
  }

  function preferredPlaceSubtitle(f) {
    const parts = [
      f.address,
      f.city,
      f.country
    ].filter(Boolean).map(cleanFrenchPlaceText);

    const subtitle = parts.join(' · ');

    if (subtitle) return subtitle;

    return cleanFrenchPlaceText(f.formatted || f.place_name || '');
  }
  function dismissSearch() {
    clearTimeout(searchTimer.current);
    searchVersion.current += 1;
    setResults([]);
    setSearchState('idle');
  }

  function doSearch(q) {
    setQuery(q);
    clearTimeout(searchTimer.current);
    const version = ++searchVersion.current;
    const text = q.trim();

    setResults([]);

    if (text.length < 2) {
      setSearchState('idle');
      return;
    }

    setSearchState('loading');

    searchTimer.current = setTimeout(async function searchPlaces() {
      let timeout;

      try {
        if (!window.SB || !window.SB.searchPlaces) {
          throw new Error('Recherche indisponible');
        }

        const data = await Promise.race([
          window.SB.searchPlaces({
            query: text,
            language: 'fr',
            country: '',
            type: 'place',
            limit: 6
          }),
          new Promise((resolve, reject) => {
            timeout = setTimeout(
              () => reject(new Error('Recherche trop longue')),
              12000
            );
          })
        ]);

        if (version !== searchVersion.current) return;

        const nextResults = Array.isArray(data?.results)
          ? data.results
          : [];

        setResults(nextResults);
        setSearchState(nextResults.length ? 'ready' : 'empty');
      } catch {
        if (version !== searchVersion.current) return;
        setResults([]);
        setSearchState('error');
      } finally {
        clearTimeout(timeout);
      }
    }, 350);
  }

function focusPreviewPlace(place) {
  const map = mapRef.current;
  if (!map || !place) return false;

  const lat = Number(place.lat);
  const lng = Number(place.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    Store.set({ mapPreviewPlace: null });
    return false;
  }

  spinRef.current = false;

  if (previewMarkerRef.current) {
    previewMarkerRef.current.remove();
    previewMarkerRef.current = null;
  }

  const el = document.createElement('div');
  el.style.cssText = [
    'width:34px',
    'height:34px',
    'border-radius:999px',
    'background:var(--accent)',
    'color:var(--accent-ink)',
    'display:grid',
    'place-items:center',
    'font-weight:900',
    'font-size:16px',
    'box-shadow:0 0 0 6px var(--accent-soft),0 10px 24px rgba(0,0,0,.28)',
    'border:2px solid var(--card)'
  ].join(';');
  el.textContent = '•';

  previewMarkerRef.current = new maplibregl.Marker({
    element: el,
    anchor: 'center'
  })
    .setLngLat([lng, lat])
    .addTo(map);

  setFoundPlace({
    name: place.label || 'Lieu',
    address: place.place || '',
    lat: lat,
    lng: lng
  });

  setPickingDay(false);
  setEditorOpen(null);

  map.flyTo({
    center: [lng, lat],
    zoom: 17,
    pitch: 45,
    bearing: 0,
    duration: 1300,
    essential: true
  });

  Store.set({ mapPreviewPlace: null });

  return true;
}

  function pickMapPoint(text, coords, address) {
  const map = mapRef.current;
  if (!map || !coords) return;

  const pick = Store.get().mapPickMode;

  if (pick) {
    Store.set({
      mapPickResult: {
        field: pick,
        text: text || address || 'Point sélectionné',
        coords: coords
      },
      mapPickMode: null
    });
    return;
  }

  map.flyTo({
    center: coords,
    zoom: 15,
    duration: 1600
  });

  setFoundPlace({
    name: text || '',
    address: address || '',
    lat: coords[1],
    lng: coords[0]
  });

  setPickingDay(false);
  setEditorOpen(null);
}

function pickResult(f) {
  dismissSearch();
  setQuery('');

  const label = preferredPlaceLabel(f);
  const address = preferredPlaceSubtitle(f) || label;

  let coords = null;

  if (Number.isFinite(Number(f.lng)) && Number.isFinite(Number(f.lat))) {
    coords = [Number(f.lng), Number(f.lat)];
  } else if (Array.isArray(f.center)) {
    coords = f.center;
  }

  if (!coords) return;

  pickMapPoint(label, coords, address);
}

  function openEditorForDay(i){if(!realTrip)return;const day=realTrip.days[i];if(!day)return;setPickingDay(false);setEditorOpen({dayId:day.id,dayIndex:i,stepCount:day.steps.length});}
  function onEditorClose(){setEditorOpen(null);setFoundPlace(null);}
  function onEditorSaved(){if(realTrip)window.SB.loadTrip(realTrip.id).then(t=>Store.set({trip:t}));}
  function geolocate(){if(!navigator.geolocation){alert('G\u00e9olocalisation non disponible.');return;}navigator.geolocation.getCurrentPosition(function(pos){var map=mapRef.current;if(!map)return;spinRef.current=false;map.flyTo({center:[pos.coords.longitude,pos.coords.latitude],zoom:15,duration:1600});},function(){alert('Impossible de vous localiser.');},{enableHighAccuracy:true,timeout:8000});}

  // ── Init map ──
  React.useEffect(()=>{
    if(
      mapLibraryState !== 'ready' ||
      !realTrip ||
      !mapEl.current ||
      mapRef.current ||
      !window.maplibregl
    ) return;

    const map=new window.maplibregl.Map({container:mapEl.current,style:theme==='dark'?MV_DARK:MV_LIGHT,center:[64,44],zoom:1.6,attributionControl:{compact:true},dragRotate:true,maxPitch:70});
    mapRef.current=map;
map.on('style.load',()=>{
  applyGlobe(map);

  if (!realTrip) {
    addRoutes(map);
  }

  map.getStyle().layers.forEach(l=>{
    if(l.type==='symbol'&&map.getLayoutProperty(l.id,'text-field')){
      try{
        map.setLayoutProperty(l.id,'text-field',['coalesce',['get','name:fr'],['get','name:latin'],['get','name']]);
      }catch(e){}
    }
  });
});
    let inited = false;
function initContent() {
  if (inited) return;
  inited = true;

  buildDayMarkers(map);

  const focusId = Store.get().mapFocusStepId;
  if (focusId) {
    setTimeout(function() {
      focusStepById(focusId);
    }, 300);
  } else {
    setTimeout(spinGlobe, 400);
  }
}
    map.on('load',initContent);setTimeout(initContent,3000);
    map.on('click',e=>{
      if (e.originalEvent && e.originalEvent.target && e.originalEvent.target.closest && e.originalEvent.target.closest('.mv-glass, .mv-card, button, input')) {
        return;
      }

      /* Mode pick pour le calculateur d'itinéraire */
      var pick=Store.get().mapPickMode;
      /* Mode pick pour le calculateur d'itinéraire */
      var pick=Store.get().mapPickMode;
      if(pick){
        var lat=e.lngLat.lat,lng=e.lngLat.lng;
        /* Reverse geocode pour avoir le nom */
        fetch('https://api.maptiler.com/geocoding/'+lng+','+lat+'.json?key='+MT_KEY+'&language=fr&limit=1')
          .then(function(r){return r.json();})
          .then(function(j){
            var name=(j.features&&j.features[0])?(j.features[0].place_name||j.features[0].text):(lat.toFixed(4)+', '+lng.toFixed(4));
            pickMapPoint(name, [lng, lat], name);
          })
          .catch(function(){
            pickMapPoint(lat.toFixed(4) + ', ' + lng.toFixed(4), [lng, lat], '');
          });
        return;
      }
      const fs=map.queryRenderedFeatures(e.point).filter(f=>f.layer.type==='symbol'&&(f.properties.name||f.properties['name:fr']));if(!fs.length)return;const f=fs[0];const name=f.properties['name:fr']||f.properties['name:latin']||f.properties.name||'';if(!name)return;const cls=f.properties.class||f.properties.subclass||'';setFoundPlace({name,address:cls?cls.charAt(0).toUpperCase()+cls.slice(1).replace(/_/g,' '):'',lat:e.lngLat.lat,lng:e.lngLat.lng});setPickingDay(false);setEditorOpen(null);map.flyTo({center:[e.lngLat.lng,e.lngLat.lat],zoom:Math.max(map.getZoom(),15),duration:800});
    });
    map.on('moveend',()=>{if(spinRef.current&&map.getZoom()<=3.2)setTimeout(spinGlobe,0);});
    ['dragstart','mousedown','touchstart','wheel'].forEach(ev=>map.on(ev,()=>{spinRef.current=false;}));
    map.on('move',()=>{const c=map.getCenter(),z=map.getZoom();if(readoutRef.current){if(z<3.4)readoutRef.current.innerHTML='<b>GLOBE</b> · z'+z.toFixed(1);else{const ns=c.lat>=0?'N':'S',ew=c.lng>=0?'E':'O';readoutRef.current.innerHTML='<b>'+Math.abs(c.lat).toFixed(3)+'°'+ns+'</b> · '+Math.abs(c.lng).toFixed(3)+'°'+ew+' · z'+z.toFixed(1);}}if(needleRef.current)needleRef.current.style.transform='rotate('+(-map.getBearing())+'deg)';});
    renderWelcome();
    return()=>{
  stopTour();

  if (previewMarkerRef.current) {
    previewMarkerRef.current.remove();
    previewMarkerRef.current = null;
  }

  map.remove();
  mapRef.current=null;
  markersRef.current={day:[],step:[]};
};
  },[
    mapLibraryState,
    realTrip && realTrip.id
  ]);
  React.useEffect(()=>{const map=mapRef.current;if(!map)return;(async()=>{map.setStyle(curStyle==='sat'?await buildSat():await buildBase());})();},[theme,curStyle]);

if(!realTrip)return null;
  const segBtn=(on)=>({border:'none',cursor:'pointer',padding:'7px 14px',borderRadius:9,fontSize:12.5,fontWeight:700,fontFamily:'inherit',background:on?'var(--accent)':'transparent',color:on?'var(--accent-ink)':'var(--muted)',transition:'all .15s'});

  /* ── Route calculée depuis la Toolbox ── */
  const {mapRoute}=Store.useStore();
  const prevRouteRef=React.useRef(null);
  React.useEffect(()=>{
    const map=mapRef.current;
    if(!map||!mapRoute||mapRoute===prevRouteRef.current)return;
    prevRouteRef.current=mapRoute;
/* Nettoyer l'ancienne route calculée */
try{if(map.getLayer&&map.getLayer('calc-route-glow'))map.removeLayer('calc-route-glow');}catch(e){}
try{if(map.getLayer&&map.getLayer('calc-route-line'))map.removeLayer('calc-route-line');}catch(e){}
try{if(map.getSource&&map.getSource('calc-route'))map.removeSource('calc-route');}catch(e){}
    /* Marqueurs A et B */
    if(window._calcMarkers){window._calcMarkers.forEach(function(m){m.remove();});} window._calcMarkers=[];
    function makeLabel(text,col,coords){
      var el=document.createElement('div');
      el.style.cssText='padding:5px 12px;border-radius:999px;font-size:11px;font-weight:700;color:#fff;background:'+col+';box-shadow:0 2px 8px rgba(0,0,0,.2);';
      el.textContent=text;
      var m=new maplibregl.Marker({element:el,anchor:'center'}).setLngLat(coords).addTo(map);
      window._calcMarkers.push(m);
    }
    makeLabel('A','#2563eb',mapRoute.from);
    makeLabel('B','#dc2626',mapRoute.to);
/* Dessiner la route */
if(!mapRef.current||mapRef.current!==map||!map.getSource)return;
if(map.isStyleLoaded&&!map.isStyleLoaded())return;

if(map.getSource('calc-route')){
  try{map.getSource('calc-route').setData({type:'Feature',geometry:mapRoute.geometry});}catch(e){}
}else{
  map.addSource('calc-route',{type:'geojson',data:{type:'Feature',geometry:mapRoute.geometry}});
}
if(!map.getLayer||!map.getLayer('calc-route-glow')){
  map.addLayer({id:'calc-route-glow',type:'line',source:'calc-route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#2563eb','line-width':14,'line-opacity':0.2,'line-blur':6}});
}
if(!map.getLayer||!map.getLayer('calc-route-line')){
  map.addLayer({id:'calc-route-line',type:'line',source:'calc-route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#2563eb','line-width':5,'line-opacity':0.9}});
}
    /* Cadrer la vue */
    var b=new maplibregl.LngLatBounds();b.extend(mapRoute.from);b.extend(mapRoute.to);
    spinRef.current=false;
    map.fitBounds(b,{padding:{top:80,bottom:80,left:60,right:60},duration:1800,maxZoom:15});
  },[mapRoute]);

  /* ── Mode pick : curseur + bannière ── */
  const {mapPickMode: pickMode}=Store.useStore();
  React.useEffect(() => {
  if (!mapPickResult || mapPickResult.field !== 'locate-step') return;
  if (!mapLocateStep || !realTrip || !window.SB) return;

  const coords = mapPickResult.coords || [];
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    Store.set({ mapPickResult: null, mapLocateStep: null, mapPickMode: null });
    return;
  }

  const sourceDay = (realTrip.days || []).find(function(item) {
    return String(item.id) === String(mapLocateStep.dayId);
  });

  const sourceStep = sourceDay && (sourceDay.steps || []).find(function(item) {
    return String(item.id) === String(mapLocateStep.stepId);
  });

  if (!sourceDay || !sourceStep) {
    Store.set({ mapPickResult: null, mapLocateStep: null, mapPickMode: null });
    return;
  }

  (async function() {
    try {
      await window.SB.saveStep(realTrip.id, sourceDay.id, {
        ...sourceStep,
        lat: lat,
        lng: lng,
        lieu: sourceStep.lieu || mapPickResult.text || sourceStep.label || ''
      });

      const updatedTrip = await window.SB.loadTrip(realTrip.id);

      const updatedDayIndex = (updatedTrip.days || []).findIndex(function(item) {
  return String(item.id) === String(sourceDay.id);
});

Store.set({
  trip: updatedTrip,
  selectedDayIndex: updatedDayIndex >= 0 ? updatedDayIndex : selectedDayIndex,
  mapPickResult: null,
  mapLocateStep: null,
  mapPickMode: null,
  mapFocusStepId: sourceStep.id
});
      if (Store.showToast) Store.showToast('Étape localisée sur la carte.');
    } catch (error) {
  console.error('Erreur localisation étape', error);
  Store.set({ mapPickResult: null, mapLocateStep: null, mapPickMode: null });

  if (Store.showToast) {
    Store.showToast('Impossible de localiser cette étape.');
  } else {
    alert('Impossible de localiser cette étape.');
  }
}
  })();
}, [mapPickResult, mapLocateStep, realTrip && realTrip.id]);
  React.useEffect(()=>{
    const map=mapRef.current;if(!map)return;
    if(pickMode){map.getCanvas().style.cursor='crosshair';}
    else{map.getCanvas().style.cursor='';}
  },[pickMode]);
  // Curseur pointeur sur les POIs
  React.useEffect(()=>{
    const map=mapRef.current;if(!map)return;
    const onMove=e=>{
  if (Store.get().mapPickMode) {
    map.getCanvas().style.cursor = 'crosshair';
    return;
  }

  const fs=map.queryRenderedFeatures(e.point).filter(f=>f.layer.type==='symbol'&&(f.properties.name||f.properties['name:fr']));
  map.getCanvas().style.cursor=fs.length?'pointer':'';
};
    map.on('mousemove',onMove);
    return()=>map.off('mousemove',onMove);
  });

return (
    <>
      <style>{MV_CSS}</style>
      <div className="mv-frame mv-workspace-map">
        <div className="mv-map-toolbar" aria-label="Recherche et navigation sur la carte">
      <div
        className="web-map-search map-search-v2"
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            dismissSearch();
            searchInputRef.current?.focus();
          }
        }}
      >
        <div className="map-search-field">
          <span className="map-search-icon" aria-hidden="true">
            <Icon name="pin" size={16} />
          </span>

          <input
            ref={searchInputRef}
            type="search"
            aria-label="Rechercher un lieu"
            aria-describedby="map-search-status"
            value={query}
            onChange={event => doSearch(event.target.value)}
            placeholder="Ville, adresse, lieu…"
            autoComplete="off"
            spellCheck={false}
          />

          {query && (
            <button
              type="button"
              className="map-search-clear"
              aria-label="Effacer la recherche"
              onClick={() => {
                doSearch('');
                searchInputRef.current?.focus();
              }}
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>

        <div
          id="map-search-status"
          role="status"
          aria-live="polite"
          className={
            searchState === 'loading' ||
            searchState === 'empty' ||
            searchState === 'error'
              ? 'map-search-feedback'
              : 'sr-only'
          }
        >
          {searchState === 'loading'
            ? 'Recherche en cours…'
            : searchState === 'empty'
              ? 'Aucun lieu trouvé. Essaie une ville ou une adresse plus précise.'
              : searchState === 'error'
                ? 'Recherche indisponible. Vérifie ta connexion puis réessaie.'
                : searchState === 'ready'
                  ? `${results.length} résultat${results.length > 1 ? 's' : ''}.`
                  : ''}
        </div>

        {searchState === 'error' && (
          <button
            type="button"
            className="map-search-retry"
            onClick={() => doSearch(query)}
          >
            Réessayer
          </button>
        )}

        {results.length > 0 && (
          <ul className="map-search-results" aria-label="Lieux trouvés">
            {results.map((place, index) => (
              <li key={index}>
                <button type="button" onClick={() => pickResult(place)}>
                  <span aria-hidden="true">
                    <Icon name="pin" size={16} />
                  </span>
                  <span>
                    <strong>{preferredPlaceLabel(place)}</strong>
                    <small>{preferredPlaceSubtitle(place)}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>


        <label className="mv-map-day-select">
          <span className="screen-reader-only">Journée affichée sur la carte</span>
          <select value={sel == null ? '' : String(sel)} disabled={mapLibraryState !== 'ready'}
            onChange={event => {
              stopTour();
              if (event.target.value === '') fitAll();
              else doSelect(Number(event.target.value), true);
            }}>
            <option value="">Tout le voyage</option>
            {T.days.map((day, index) => (
              <option key={index} value={index}>J{index + 1} · {day.title || day.city || 'Journée'}</option>
            ))}
          </select>
        </label>
        <button type="button" className="mv-map-button" disabled={mapLibraryState !== 'ready'}
          onClick={sel != null ? showGlobe : fitAll}>
          <Icon name="expand" size={16}/><span>{sel != null ? 'Vue globale' : 'Recentrer'}</span>
        </button>
        <details className="web-map-toolbox" onKeyDown={event => {
          if (event.key === 'Escape') {
            event.preventDefault(); event.stopPropagation();
            event.currentTarget.open = false;
            event.currentTarget.querySelector('summary')?.focus();
          }
        }}>
          <summary><Icon name="map" size={16}/>Réglages</summary>
          <div className="web-map-controls">
            <div className="mv-map-control-group" role="group" aria-label="Zoom et orientation">
              <button type="button" className="mv-map-button" aria-label="Zoomer"
                onClick={() => { spinRef.current=false; mapRef.current?.zoomIn({duration:400}); }}>＋</button>
              <button type="button" className="mv-map-button" aria-label="Dézoomer"
                onClick={() => { spinRef.current=false; mapRef.current?.zoomOut({duration:400}); }}>−</button>
              <button type="button" className="mv-map-button" aria-label="Remettre le nord en haut"
                onClick={() => mapRef.current?.easeTo({bearing:0,pitch:0,duration:600})}>
                <svg ref={needleRef} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 3l3.2 8L12 9.4 8.8 11z" fill="currentColor"/>
                  <path d="M12 9.4 8.8 13 12 21l3.2-8z" stroke="currentColor"/>
                </svg>
              </button>
            </div>
            <span className="mv-map-section-label">Fond de carte</span>
            <div className="mv-map-control-group" role="group" aria-label="Fond de carte">
              <button type="button" className="mv-map-button" aria-pressed={curStyle === 'minimal'}
                onClick={() => { setCurStyle('minimal'); setLayersOpen(false); }}>Plan</button>
              <button type="button" className="mv-map-button" aria-pressed={curStyle === 'sat'}
                onClick={() => { setCurStyle('sat'); setLayersOpen(false); }}>Satellite</button>
            </div>
            <button type="button" className="mv-map-button" aria-pressed={touring}
              disabled={!T.days.length || mapLibraryState !== 'ready'}
              onClick={() => { if(tourRef.current.on) stopTour(); else startTour(); }}>
              <Icon name="route" size={16}/>{touring ? 'Arrêter le survol' : 'Survoler le voyage'}
            </button>
            <button type="button" className="mv-map-button" onClick={geolocate}>
              <Icon name="pin" size={16}/>Ma position
            </button>
            <div className="web-map-readout" ref={readoutRef}>
              <b>GLOBE</b><span> · z1.6</span>
            </div>
          </div>
        </details>

        </div>
        <div className="mv-map-wrap map-redesign">
      <div id="mv-map" ref={mapEl}/>

      {mapLibraryState !== 'ready' && (
        <div
          className="mv-map-loading"
          data-error={
            mapLibraryState === 'error'
              ? 'true'
              : 'false'
          }
          role={
            mapLibraryState === 'error'
              ? 'alert'
              : 'status'
          }
          aria-live="polite"
        >
          {mapLibraryState === 'error'
            ? 'Impossible de charger la carte. Vérifie ta connexion puis recharge la page.'
            : 'Chargement de la carte…'}
        </div>
      )}
      {/* Bannière mode pick */}
      {pickMode && (
        <div className="mv-glass web-map-pick-banner" role="status">
          <Icon name="pin" size={16}/>
          {pickMode === 'locate-step'
  ? 'Cliquez sur la position exacte de ' + (locatingStepName || 'cette étape')
  : 'Cliquez sur la carte pour choisir un point'}
          <button type="button" aria-label="Annuler le placement sur la carte" onClick={() => Store.set({ mapPickMode: null, mapLocateStep: null })} style={{border:'none',background:'transparent',color:'var(--faint)',cursor:'pointer',padding:2,marginLeft:4}}><Icon name="x" size={14}/></button>
        </div>
      )}


      {/* ═══ LIEU TROUVÉ (au-dessus de la carte du jour) ═══ */}
{foundPlace && !editorOpen && (
  <div
    className="mv-glass web-map-found-place"

  >
    <div style={{padding:16}}>
      <div style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:12}}>
        <div
          style={{
            width:36,
            height:36,
            borderRadius:10,
            background:'var(--accent-soft)',
            color:'var(--accent)',
            display:'grid',
            placeItems:'center',
            flexShrink:0
          }}
        >
          <Icon name="pin" size={17}/>
        </div>

        <div style={{flex:1,minWidth:0}}>
          <div className="mv-found-title">
            {foundPlace.name}
          </div>
          <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>
            {foundPlace.address}
          </div>
        </div>

        <button
          type="button"
          aria-label="Fermer les détails du lieu"
          onClick={() => {
            setFoundPlace(null);
            setPickingDay(false);
          }}
          style={{border:'none',background:'transparent',color:'var(--faint)',cursor:'pointer',padding:2}}
        >
          <Icon name="x" size={16}/>
        </button>
      </div>

      {!pickingDay ? (
        <button
          onClick={()=>setPickingDay(true)}
          style={{
            width:'100%',
            border:'none',
            background:'var(--accent)',
            color:'var(--accent-ink)',
            borderRadius:10,
            padding:'9px 0',
            fontSize:13,
            fontWeight:700,
            cursor:'pointer',
            fontFamily:'inherit',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            gap:7
          }}
        >
          <Icon name="plus" size={14}/>
          Ajouter au séjour
        </button>
      ) : (
        <div>
          <div
            style={{
              fontSize:10,
              fontWeight:700,
              letterSpacing:'.08em',
              textTransform:'uppercase',
              color:'var(--faint)',
              marginBottom:8
            }}
          >
            Choisir le jour
          </div>

          <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
            {realTrip && realTrip.days.map((d,i)=>(
              <button
                key={d.id}
                onClick={()=>openEditorForDay(i)}
                title={`J${i+1}`}
                style={{
                  width:34,
                  height:34,
                  borderRadius:10,
                  border:'1px solid var(--line)',
                  background:'var(--inset)',
                  color:'var(--text)',
                  fontFamily:'var(--font-serif)',
                  fontSize:14,
                  fontWeight:700,
                  cursor:'pointer',
                  display:'grid',
                  placeItems:'center',
                  transition:'all .12s'
                }}
                onMouseEnter={e=>{
                  e.currentTarget.style.background='var(--accent)';
                  e.currentTarget.style.color='var(--accent-ink)';
                  e.currentTarget.style.borderColor='var(--accent)';
                }}
                onMouseLeave={e=>{
                  e.currentTarget.style.background='var(--inset)';
                  e.currentTarget.style.color='var(--text)';
                  e.currentTarget.style.borderColor='var(--line)';
                }}
              >
                {i+1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
)}

{/* ═══ CARTE DU JOUR (toujours visible) ═══ */}
<div
  className="web-map-day-card"
  ref={cardRef}
  style={{ display:foundPlace && !editorOpen ? 'none' : 'block' }}
/>

{editorOpen && foundPlace && window.StepEditor && React.createElement(window.StepEditor,{
  open:true,
  tripId:realTrip && realTrip.id,
  dayId:editorOpen.dayId,
  step:{
    type:'activite',
    label:foundPlace.name,
    lieu:foundPlace.address,
    lat:foundPlace.lat,
    lng:foundPlace.lng
  },
  stepCount:editorOpen.stepCount,
  onClose:onEditorClose,
  onSaved:onEditorSaved
})}

        </div>
      </div>
    </>
  );
}

window.MapView=MapView;
 
