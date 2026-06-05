// ════════════════════════════════════════════════════════════
// Map.js — Globe 3D interactif, design Atelier (version propre)
// MapLibre GL JS + tuiles MapTiler (français, POIs, satellite)
// ════════════════════════════════════════════════════════════

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
function gcPoints(a,b,n){n=n||80;const R=d=>d*Math.PI/180,D=r=>r*180/Math.PI;const la1=R(a[1]),lo1=R(a[0]),la2=R(b[1]),lo2=R(b[0]);const d=2*Math.asin(Math.sqrt(Math.sin((la2-la1)/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin((lo2-lo1)/2)**2));if(d===0)return[a,b];const pts=[];for(let i=0;i<=n;i++){const f=i/n;const A=Math.sin((1-f)*d)/Math.sin(d),B=Math.sin(f*d)/Math.sin(d);const x=A*Math.cos(la1)*Math.cos(lo1)+B*Math.cos(la2)*Math.cos(lo2);const y=A*Math.cos(la1)*Math.sin(lo1)+B*Math.cos(la2)*Math.sin(lo2);const z=A*Math.sin(la1)+B*Math.sin(la2);pts.push([D(Math.atan2(y,x)),D(Math.atan2(z,Math.sqrt(x*x+y*y)))]);}return pts;}
function gcDist(a,b){const R=6371,r=d=>d*Math.PI/180;const dLa=r(b[1]-a[1]),dLo=r(b[0]-a[0]);const s=Math.sin(dLa/2)**2+Math.cos(r(a[1]))*Math.cos(r(b[1]))*Math.sin(dLo/2)**2;return 2*R*Math.asin(Math.sqrt(s));}
const MONTHS_MAP=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
function mvFmtDate(iso){const d=new Date(iso);return d.getDate()+' '+MONTHS_MAP[d.getMonth()];}

/* ═══ CSS ═══ */
const MV_CSS=`
.mv-frame{flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden}
.mv-body{flex:1;display:flex;min-height:0}
.mv-spine{width:258px;flex-shrink:0;border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:0;background:var(--card)}
.mv-spine-list{flex:1;overflow-y:auto;padding:8px 14px 12px;position:relative}
.mv-spine-line{position:absolute;left:30px;top:16px;bottom:16px;width:2px;background:var(--line2)}
.mv-map-wrap{flex:1;position:relative;min-width:0;background:var(--inset)}
#mv-map{position:absolute;inset:0}
#mv-map .maplibregl-ctrl-attrib{font-size:9px;background:rgba(255,255,255,.7);border-radius:8px 0 0 0}
.mv-card{width:320px;background:var(--card);border:1px solid var(--line);border-radius:18px;box-shadow:0 18px 50px rgba(31,46,40,.22);overflow:hidden}
.mv-card .mv-hero{position:relative;height:120px;background:linear-gradient(150deg,hsl(152,36%,64%),hsl(152,40%,50%))}
.mv-card.mv-r-busan .mv-hero{background:linear-gradient(150deg,hsl(30,42%,62%),hsl(30,46%,48%))}
.mv-card.mv-r-vol .mv-hero{background:linear-gradient(150deg,hsl(212,28%,60%),hsl(212,32%,46%))}
.mv-card .mv-hero-ov{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(18,30,24,0) 36%,rgba(13,26,20,.72))}
.mv-card .mv-hero-tag{position:absolute;right:12px;top:11px;font-size:9px;letter-spacing:.12em;color:rgba(255,255,255,.85);text-shadow:0 1px 5px rgba(0,0,0,.5);text-transform:uppercase;pointer-events:none;font-family:var(--font-mono,ui-monospace)}
.mv-card .mv-hero-cap{position:absolute;left:16px;right:16px;bottom:12px;color:#fff;pointer-events:none}
.mv-card .mv-hero-pill{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;margin-bottom:5px;text-shadow:0 1px 6px rgba(0,0,0,.5)}
.mv-card .mv-hj{font-family:var(--font-serif);font-style:italic;font-size:28px;line-height:.82;text-shadow:0 2px 12px rgba(0,0,0,.5)}
.mv-card .mv-hn{font-family:var(--font-serif);font-style:italic;font-size:17.5px;line-height:1.05;text-shadow:0 2px 10px rgba(0,0,0,.55)}
.mv-card-body{padding:13px 15px 15px}
.mv-card-note{font-size:12px;color:var(--muted);font-style:italic;line-height:1.5;margin-bottom:11px}
.mv-step-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--line2);cursor:pointer}
.mv-step-row:last-child{border-bottom:none}
.mv-step-row:hover .mv-step-name{color:var(--accent)}
.mv-step-ic{width:30px;height:30px;border-radius:9px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;flex-shrink:0}
.mv-step-name{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text)}
.mv-step-sub{font-size:11px;color:var(--muted)}
.mv-step-time{font-family:var(--font-mono,ui-monospace);font-size:11px;color:var(--muted);flex-shrink:0}
.mv-card-foot{display:flex;gap:8px;margin-top:12px;padding-top:11px;border-top:1px solid var(--line)}
.mv-card-foot button{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:7px;border:none;border-radius:10px;padding:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;background:var(--accent-soft);color:var(--accent)}
.mv-card-foot button:hover{background:var(--accent);color:var(--accent-ink)}
.mv-welcome-pad{padding:18px}
.mv-welcome-line{font-size:12.5px;color:var(--muted);line-height:1.55;margin-top:8px}
.mv-legend{display:flex;flex-direction:column;gap:8px;margin-top:14px;padding-top:13px;border-top:1px solid var(--line2)}
.mv-lg-row{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--text)}
.mv-lg-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;border:2px solid var(--card);box-shadow:0 1px 3px rgba(0,0,0,.2)}
.mv-pin{cursor:pointer;width:30px;height:30px}
.mv-pin .badge{width:30px;height:30px;border-radius:50%;background:var(--accent);color:#fff;display:grid;place-items:center;font-family:var(--font-mono,ui-monospace);font-weight:700;font-size:12.5px;border:2.5px solid var(--card);box-shadow:0 3px 9px rgba(31,46,40,.4);transition:transform .2s}
.mv-r-busan .badge{background:#c98a3c}
.mv-r-vol .badge{background:var(--faint)}
.mv-pin:hover .badge{transform:scale(1.14)}
.mv-pin.active .badge{transform:scale(1.22);box-shadow:0 0 0 5px var(--accent-soft),0 6px 16px rgba(0,0,0,.32)}
.mv-ctrl{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:13px;box-shadow:var(--shadow);overflow:hidden}
.mv-ctrl button{width:42px;height:42px;border:none;background:transparent;color:var(--text);cursor:pointer;display:grid;place-items:center}
.mv-ctrl button:hover{background:var(--accent-soft);color:var(--accent)}
.mv-ctrl button+button{border-top:1px solid var(--line2)}
.mv-readout{font-family:var(--font-mono,ui-monospace);font-size:10.5px;letter-spacing:.04em;color:var(--muted);background:var(--card);border:1px solid var(--line);border-radius:10px;padding:7px 11px;box-shadow:var(--shadow);white-space:nowrap}
.mv-readout b{color:var(--accent);font-weight:700}
`;

/* ═══ TILES ═══ */
const MT_KEY='08IwMKKAkP3BQJss5poF';
const MV_LIGHT='https://api.maptiler.com/maps/streets-v2/style.json?key='+MT_KEY+'&language=fr';
const MV_DARK='https://api.maptiler.com/maps/streets-v2-dark/style.json?key='+MT_KEY+'&language=fr';
const MV_SAT='https://api.maptiler.com/maps/hybrid/style.json?key='+MT_KEY+'&language=fr';

function MapView(){
  const {trip,theme=localStorage.getItem('it_theme')||'light'}=Store.useStore();
  const mapEl=React.useRef(null),mapRef=React.useRef(null),cardRef=React.useRef(null);
  const readoutRef=React.useRef(null),needleRef=React.useRef(null);
  const spinRef=React.useRef(true),markersRef=React.useRef({day:[],step:[]});
  const tourRef=React.useRef({on:false,timer:null}),styleCache=React.useRef({});
  const searchTimer=React.useRef(null);
  const T=MAP_TRIP;
  const {trip:realTrip}=Store.useStore();

  const [sel,setSel]=React.useState(null);
  const [curStyle,setCurStyle]=React.useState('minimal');
  const [layersOpen,setLayersOpen]=React.useState(false);
  const [query,setQuery]=React.useState('');
  const [results,setResults]=React.useState([]);
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
  function buildDayMarkers(map){T.days.forEach((d,i)=>{const el=document.createElement('div');el.className='mv-pin '+mvRegClass(d.region);el.innerHTML='<div class="badge">'+d.n+'</div>';el.addEventListener('click',e=>{e.stopPropagation();doSelect(i,true);});const m=new maplibregl.Marker({element:el,anchor:'center'}).setLngLat(d.c).addTo(map);markersRef.current.day.push({m,el});});}
  function clearStepMarkers(){markersRef.current.step.forEach(m=>m.remove());markersRef.current.step=[];}
  function showStepMarkers(map,day){clearStepMarkers();day.steps.forEach((s,k)=>{if(!s.c)return;const el=document.createElement('div');el.style.cssText='width:28px;height:28px;border-radius:50%;background:var(--card);border:2px solid var(--accent);color:var(--accent);display:grid;place-items:center;box-shadow:0 3px 8px rgba(0,0,0,.2);cursor:pointer;transition:transform .2s';el.innerHTML=mvSvg(mvStepIcon(s),14);el.onmouseover=()=>el.style.transform='scale(1.15)';el.onmouseout=()=>el.style.transform='none';el.onclick=()=>{if(s.c)map.flyTo({center:s.c,zoom:Math.max(map.getZoom(),15.5),duration:1400});};const m=new maplibregl.Marker({element:el,anchor:'center'}).setLngLat(s.c).addTo(map);markersRef.current.step.push(m);});}

  // ── Cards ──
  function renderWelcome(){if(!cardRef.current)return;cardRef.current.innerHTML='<div class="mv-card"><div class="mv-welcome-pad"><div style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)">Le voyage</div><div style="font-family:var(--font-serif);font-style:italic;font-size:24px;margin-top:3px;color:var(--text)">'+T.name+'</div><div class="mv-welcome-line">Un fil d\'or relie chaque étape. Cliquez un jour pour plonger du globe jusqu\'au niveau des rues.</div><div class="mv-legend"><div class="mv-lg-row"><span class="mv-lg-dot" style="background:var(--accent)"></span>Séoul & environs</div><div class="mv-lg-row"><span class="mv-lg-dot" style="background:#c98a3c"></span>Busan, l\'échappée du Sud</div><div class="mv-lg-row"><span class="mv-lg-dot" style="background:var(--card);border-color:var(--faint)"></span>Vols Paris ⇄ Séoul</div></div></div></div>';}
  function renderDayCard(i){if(!cardRef.current)return;const d=T.days[i];const rc=mvRegClass(d.region);const pc=d.region==='Busan'?'#c98a3c':d.region==='Vol'?'var(--faint)':'var(--accent)';let rows='';d.steps.forEach((s,k)=>{rows+='<div class="mv-step-row" data-si="'+k+'"><div class="mv-step-ic">'+mvSvg(mvStepIcon(s),16)+'</div><div style="flex:1;min-width:0"><div class="mv-step-name">'+s.l+'</div><div class="mv-step-sub">'+(s.s||'')+'</div></div><div class="mv-step-time">'+(s.time||'')+'</div></div>';});cardRef.current.innerHTML='<div class="mv-card '+rc+'"><div class="mv-hero"><div class="mv-hero-ov"></div><div class="mv-hero-tag">'+d.tag+'</div><div class="mv-hero-cap"><div class="mv-hero-pill"><span class="pdot" style="background:'+pc+'"></span>'+d.wd+' '+mvFmtDate(d.date)+' · '+d.region+'</div><div style="display:flex;align-items:flex-end;gap:9px"><span class="mv-hj">J'+d.n+'</span><span class="mv-hn">'+d.title+'</span></div></div></div><div class="mv-card-body">'+(d.note?'<div class="mv-card-note">'+d.note+'</div>':'')+rows+'<div class="mv-card-foot"><button id="mv-fly-btn">'+mvSvg('route',14)+'Recadrer</button></div></div></div>';const map=mapRef.current;cardRef.current.querySelectorAll('.mv-step-row').forEach(r=>{r.addEventListener('click',()=>{const s=d.steps[+r.dataset.si];if(s.c&&map)map.flyTo({center:s.c,zoom:Math.max(map.getZoom(),15.5),duration:1400});});});const fb=document.getElementById('mv-fly-btn');if(fb)fb.addEventListener('click',()=>flyDay(i));}

  // ── Navigation ──
  function flyDay(i){const map=mapRef.current;if(!map)return;const d=T.days[i];map.flyTo({center:d.c,zoom:d.z,pitch:d.region==='Vol'?0:42,bearing:0,duration:2200,curve:1.5,essential:true});}
  function doSelect(i,fly){spinRef.current=false;setSel(i);const map=mapRef.current;if(!map)return;markersRef.current.day.forEach((dm,k)=>dm.el.classList.toggle('active',k===i));showStepMarkers(map,T.days[i]);renderDayCard(i);if(fly)flyDay(i);}
  function showGlobe(){spinRef.current=true;setSel(null);clearStepMarkers();markersRef.current.day.forEach(dm=>dm.el.classList.remove('active'));renderWelcome();const map=mapRef.current;if(!map)return;map.flyTo({center:[64,44],zoom:1.6,pitch:0,bearing:0,duration:2400,curve:1.4});setTimeout(()=>{if(spinRef.current)spinGlobe();},2500);}
  function fitAll(){spinRef.current=false;setSel(null);clearStepMarkers();markersRef.current.day.forEach(dm=>dm.el.classList.remove('active'));renderWelcome();const map=mapRef.current;if(!map)return;const b=new maplibregl.LngLatBounds();T.days.forEach(d=>b.extend(d.c));map.fitBounds(b,{padding:90,duration:2000,pitch:0,bearing:0});}
  function spinGlobe(){const map=mapRef.current;if(!map||!spinRef.current||map.getZoom()>3.2)return;const c=map.getCenter();c.lng-=.55;map.easeTo({center:c,duration:1300,easing:t=>t});}

  // ── Tour ──
  function stopTour(){tourRef.current.on=false;clearTimeout(tourRef.current.timer);setTouring(false);}
  function startTour(){tourRef.current.on=true;spinRef.current=false;setTouring(true);let i=0;const step=()=>{if(!tourRef.current.on)return;doSelect(i,true);i++;if(i>=T.days.length){tourRef.current.timer=setTimeout(()=>{if(tourRef.current.on)stopTour();},2600);return;}tourRef.current.timer=setTimeout(step,2700);};step();}

  // ── Search ──
  function doSearch(q){setQuery(q);clearTimeout(searchTimer.current);if(!q.trim()){setResults([]);return;}searchTimer.current=setTimeout(async()=>{try{const r=await fetch('https://api.maptiler.com/geocoding/'+encodeURIComponent(q)+'.json?key='+MT_KEY+'&language=fr&limit=6');const j=await r.json();setResults(j.features||[]);}catch(e){setResults([]);}},350);}
  function pickResult(f){setResults([]);setQuery('');const map=mapRef.current;if(!map)return;map.flyTo({center:f.center,zoom:15,duration:1600});setFoundPlace({name:f.text||'',address:f.place_name||'',lat:f.center[1],lng:f.center[0]});setPickingDay(false);setEditorOpen(null);}
  function openEditorForDay(i){if(!realTrip)return;const day=realTrip.days[i];if(!day)return;setPickingDay(false);setEditorOpen({dayId:day.id,dayIndex:i,stepCount:day.steps.length});}
  function onEditorClose(){setEditorOpen(null);setFoundPlace(null);}
  function onEditorSaved(){if(realTrip)window.SB.loadTrip(realTrip.id).then(t=>Store.set({trip:t}));}

  // ── Init map ──
  React.useEffect(()=>{
    if(!mapEl.current||mapRef.current)return;
    const map=new maplibregl.Map({container:mapEl.current,style:theme==='dark'?MV_DARK:MV_LIGHT,center:[64,44],zoom:1.6,attributionControl:{compact:true},dragRotate:true,maxPitch:70});
    mapRef.current=map;
    map.on('style.load',()=>{applyGlobe(map);addRoutes(map);map.getStyle().layers.forEach(l=>{if(l.type==='symbol'&&map.getLayoutProperty(l.id,'text-field')){try{map.setLayoutProperty(l.id,'text-field',['coalesce',['get','name:fr'],['get','name:latin'],['get','name']]);}catch(e){}}});});
    let inited=false;function initContent(){if(inited)return;inited=true;buildDayMarkers(map);setTimeout(spinGlobe,400);}
    map.on('load',initContent);setTimeout(initContent,3000);
    map.on('click',e=>{const fs=map.queryRenderedFeatures(e.point).filter(f=>f.layer.type==='symbol'&&(f.properties.name||f.properties['name:fr']));if(!fs.length)return;const f=fs[0];const name=f.properties['name:fr']||f.properties['name:latin']||f.properties.name||'';if(!name)return;const cls=f.properties.class||f.properties.subclass||'';setFoundPlace({name,address:cls?cls.charAt(0).toUpperCase()+cls.slice(1).replace(/_/g,' '):'',lat:e.lngLat.lat,lng:e.lngLat.lng});setPickingDay(false);setEditorOpen(null);map.flyTo({center:[e.lngLat.lng,e.lngLat.lat],zoom:Math.max(map.getZoom(),15),duration:800});});
    map.on('moveend',()=>{if(spinRef.current&&map.getZoom()<=3.2)setTimeout(spinGlobe,0);});
    ['dragstart','mousedown','touchstart','wheel'].forEach(ev=>map.on(ev,()=>{spinRef.current=false;}));
    map.on('move',()=>{const c=map.getCenter(),z=map.getZoom();if(readoutRef.current){if(z<3.4)readoutRef.current.innerHTML='<b>GLOBE</b> · z'+z.toFixed(1);else{const ns=c.lat>=0?'N':'S',ew=c.lng>=0?'E':'O';readoutRef.current.innerHTML='<b>'+Math.abs(c.lat).toFixed(3)+'°'+ns+'</b> · '+Math.abs(c.lng).toFixed(3)+'°'+ew+' · z'+z.toFixed(1);}}if(needleRef.current)needleRef.current.style.transform='rotate('+(-map.getBearing())+'deg)';});
    renderWelcome();
    return()=>{stopTour();map.remove();mapRef.current=null;markersRef.current={day:[],step:[]};};
  },[]);
  React.useEffect(()=>{const map=mapRef.current;if(!map)return;(async()=>{map.setStyle(curStyle==='sat'?await buildSat():await buildBase());})();},[theme,curStyle]);

  if(!trip)return null;
  const segBtn=(on)=>({border:'none',cursor:'pointer',padding:'7px 14px',borderRadius:9,fontSize:12.5,fontWeight:700,fontFamily:'inherit',background:on?'var(--accent)':'transparent',color:on?'var(--accent-ink)':'var(--muted)',transition:'all .15s'});

  return(
    <>
    <style>{MV_CSS}</style>
    <div className="mv-frame">

      {/* ═══ TOOLBAR ═══ */}
      <div style={{height:50,flexShrink:0,display:'flex',alignItems:'center',gap:12,padding:'0 18px',borderBottom:'1px solid var(--line)',background:'var(--card)'}}>
        <div style={{position:'relative'}}>
          <button onClick={()=>setLayersOpen(p=>!p)} style={{display:'inline-flex',alignItems:'center',gap:7,border:'1px solid var(--line)',background:layersOpen?'var(--accent-soft)':'var(--inset)',color:layersOpen?'var(--accent)':'var(--muted)',borderRadius:10,padding:'6px 12px',fontSize:12.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}><Icon name="map" size={14}/>Affichage</button>
          {layersOpen&&(
            <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,background:'var(--card)',border:'1px solid var(--line)',borderRadius:14,padding:14,boxShadow:'0 12px 40px rgba(31,46,40,.2)',minWidth:210,zIndex:100}}>
              <div style={{fontSize:10.5,fontWeight:800,color:'var(--faint)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Fond de carte</div>
              <div style={{display:'flex',background:'var(--inset)',border:'1px solid var(--line)',borderRadius:10,padding:3,gap:2,marginBottom:14}}>
                <button style={segBtn(curStyle==='minimal')} onClick={()=>setCurStyle('minimal')}>Plan</button>
                <button style={segBtn(curStyle==='sat')} onClick={()=>setCurStyle('sat')}>Satellite</button>
              </div>
            </div>
          )}
        </div>
        <button onClick={()=>{if(tourRef.current.on)stopTour();else startTour();}} style={{display:'inline-flex',alignItems:'center',gap:7,border:'none',background:touring?'var(--accent)':'var(--text)',color:touring?'var(--accent-ink)':'var(--card)',borderRadius:10,padding:'7px 14px',fontSize:12.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}><Icon name="route" size={14}/>{touring?'Stop':'Survoler'}</button>
        <div style={{flex:1,display:'flex',justifyContent:'center'}}>
          <div style={{position:'relative',width:380,maxWidth:'100%'}}>
            <input value={query} onChange={e=>doSearch(e.target.value)} placeholder="Rechercher un lieu…" style={{width:'100%',padding:'9px 14px 9px 36px',borderRadius:999,border:'1.5px solid var(--accent)',background:'var(--inset)',color:'var(--text)',fontFamily:'inherit',fontSize:13.5,outline:'none'}}/>
            <Icon name="pin" size={14} style={{position:'absolute',left:12,top:11,color:'var(--accent)'}}/>
            {results.length>0&&(
              <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'var(--card)',border:'1px solid var(--line)',borderRadius:14,boxShadow:'0 18px 50px rgba(31,46,40,.22)',overflow:'hidden',maxHeight:280,overflowY:'auto',zIndex:200}}>
                {results.map((f,k)=>(
                  <button key={k} onClick={()=>pickResult(f)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 14px',border:'none',borderBottom:'1px solid var(--line2)',background:'transparent',cursor:'pointer',fontFamily:'inherit',textAlign:'left',color:'var(--text)'}} onMouseEnter={e=>e.currentTarget.style.background='var(--inset)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:28,height:28,borderRadius:8,background:'var(--accent-soft)',color:'var(--accent)',display:'grid',placeItems:'center',flexShrink:0}}><Icon name="pin" size={13}/></div>
                    <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700}}>{f.text}</div><div style={{fontSize:11,color:'var(--muted)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.place_name}</div></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button onClick={fitAll} style={{display:'inline-flex',alignItems:'center',gap:7,border:'1px solid var(--line)',background:'var(--inset)',color:'var(--muted)',borderRadius:10,padding:'6px 12px',fontSize:12.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}><Icon name="expand" size={14}/>Vue globale</button>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="mv-body">
        <aside className="mv-spine">
          <div style={{padding:'16px 22px 12px',borderBottom:'1px solid var(--line2)'}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--accent)'}}>{T.name}</div>
            <div style={{fontFamily:'var(--font-serif)',fontStyle:'italic',fontSize:20,marginTop:4,color:'var(--text)'}}>{T.days.length} jours</div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:3}}>{T.dates}</div>
          </div>
          <div className="mv-spine-list">
            <div className="mv-spine-line"/>
            {T.days.map((d,i)=>{const on=sel===i;return(
              <button key={i} onClick={()=>doSelect(i,true)} style={{width:'100%',display:'flex',alignItems:'center',gap:13,padding:'5px 12px 5px 8px',border:'none',cursor:'pointer',borderRadius:10,textAlign:'left',fontFamily:'inherit',color:'var(--text)',background:on?'var(--card)':'transparent',boxShadow:on?'var(--shadow)':'none',marginBottom:2,position:'relative',transition:'all .16s'}}>
                <div style={{width:22,display:'flex',justifyContent:'center',flexShrink:0,zIndex:1}}>
                  <div style={{width:on?13:10,height:on?13:10,borderRadius:'50%',background:d.region==='Busan'?'#c98a3c':'var(--accent)',border:'2px solid '+(d.region==='Busan'?'#c98a3c':'var(--accent)'),boxShadow:on?'0 0 0 4px var(--accent-soft)':'none',transition:'all .16s'}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'baseline',gap:7}}>
                    <span style={{fontFamily:'var(--font-serif)',fontSize:14.5,color:on?'var(--accent)':'var(--text)'}}>J{d.n}</span>
                    <span style={{fontSize:12.5,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{d.city}</span>
                  </div>
                  <div style={{fontSize:10,color:'var(--muted)',marginTop:1}}>{d.wd} {mvFmtDate(d.date)}</div>
                </div>
              </button>
            );})}
          </div>
        </aside>

        <div className="mv-map-wrap">
          <div id="mv-map" ref={mapEl}/>
          {/* Contrôles droite */}
          <div style={{position:'absolute',top:16,right:16,zIndex:5,display:'flex',flexDirection:'column',gap:10,alignItems:'flex-end'}}>
            <div className="mv-ctrl">
              <button onClick={()=>{spinRef.current=false;mapRef.current?.zoomIn({duration:400});}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg></button>
              <button onClick={()=>{spinRef.current=false;mapRef.current?.zoomOut({duration:400});}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M5 12h14"/></svg></button>
              <button onClick={()=>mapRef.current?.easeTo({bearing:0,pitch:0,duration:600})}><svg ref={needleRef} width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l3.2 8L12 9.4 8.8 11z" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1.5"/><path d="M12 9.4 8.8 13 12 21l3.2-8z" fill="var(--muted)" stroke="var(--muted)" strokeWidth="1.5"/></svg></button>
            </div>
            <div className="mv-ctrl">
              <button onClick={()=>{const p=mapRef.current?.getPitch()>10?0:55;mapRef.current?.easeTo({pitch:p,duration:700});}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-5 9 5-9 5z"/><path d="M3 9v6l9 5 9-5V9"/></svg></button>
            </div>
            <div className="mv-readout" ref={readoutRef}><b>GLOBE</b> · z1.6</div>
          </div>
          {/* Day card */}
          <div ref={cardRef} style={{position:'absolute',bottom:16,left:16,zIndex:5}}/>
          {/* Fiche lieu */}
          {foundPlace&&!editorOpen&&(
            <div style={{position:'absolute',bottom:20,left:'50%',transform:'translateX(-50%)',zIndex:8,width:360}}>
              <div style={{background:'var(--card)',border:'1px solid var(--line)',borderRadius:18,boxShadow:'0 20px 60px rgba(31,46,40,.25)',overflow:'hidden'}}>
                <div style={{padding:'16px 18px',display:'flex',gap:12,alignItems:'flex-start'}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'var(--accent-soft)',color:'var(--accent)',display:'grid',placeItems:'center',flexShrink:0}}><Icon name="pin" size={20}/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:'var(--font-serif)',fontStyle:'italic',fontSize:20,color:'var(--text)',lineHeight:1.15}}>{foundPlace.name}</div>
                    <div style={{fontSize:12,color:'var(--muted)',marginTop:3}}>{foundPlace.address}</div>
                  </div>
                  <button onClick={()=>setFoundPlace(null)} style={{border:'none',background:'transparent',color:'var(--faint)',cursor:'pointer',padding:4}}><Icon name="x" size={18}/></button>
                </div>
                {!pickingDay?(
                  <div style={{padding:'0 18px 16px'}}>
                    <button onClick={()=>setPickingDay(true)} style={{width:'100%',border:'none',background:'var(--accent)',color:'var(--accent-ink)',borderRadius:12,padding:'11px 0',fontSize:13.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><Icon name="plus" size={15}/>Ajouter au séjour</button>
                  </div>
                ):(
                  <div style={{padding:'0 14px 14px'}}>
                    <div style={{fontSize:10.5,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--faint)',marginBottom:8,paddingLeft:4}}>Ajouter au jour…</div>
                    <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:180,overflowY:'auto'}}>
                      {realTrip&&realTrip.days.map((d,i)=>(
                        <button key={d.id} onClick={()=>openEditorForDay(i)} style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'8px 10px',border:'1px solid var(--line2)',borderRadius:10,background:'transparent',cursor:'pointer',fontFamily:'inherit',color:'var(--text)',transition:'all .12s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.background='var(--accent-soft)';}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--line2)';e.currentTarget.style.background='transparent';}}>
                          <span style={{fontFamily:'var(--font-serif)',fontSize:15,color:'var(--accent)',width:28}}>J{i+1}</span>
                          <span style={{fontSize:12.5,fontWeight:600,flex:1,textAlign:'left'}}>{d.dateLabel||d.title||''}</span>
                          <Icon name="plus" size={14} style={{color:'var(--accent)'}}/>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {editorOpen&&foundPlace&&window.StepEditor&&React.createElement(window.StepEditor,{open:true,tripId:realTrip&&realTrip.id,dayId:editorOpen.dayId,step:{type:'activite',label:foundPlace.name,lieu:foundPlace.address,lat:foundPlace.lat,lng:foundPlace.lng},stepCount:editorOpen.stepCount,onClose:onEditorClose,onSaved:onEditorSaved})}
        </div>
      </div>
    </div>
    </>
  );
}
window.MapView=MapView;