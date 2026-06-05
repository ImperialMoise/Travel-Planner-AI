// ════════════════════════════════════════════════════════════
// Map.js — Globe 3D interactif (façon Polarsteps), design Atelier
// Porté depuis Carte.html (Claude Design) vers le composant React.
// Utilise MapLibre GL JS + tuiles CARTO (gratuit, sans token).
// ════════════════════════════════════════════════════════════

/* ═══ DONNÉES DÉMO avec coordonnées GPS réelles ═══ */
const MAP_TRIP = {
  name:"Corée du Sud", dates:"1 oct. — 15 oct. 2025",
  days:[
    {n:1,date:"2025-10-01",wd:"Mer",region:"Vol",city:"Paris → Séoul",title:"Le grand départ",tag:"ROISSY-CDG · TERMINAL 2E",note:"Vol de nuit.",c:[2.5479,49.0097],z:9,
      steps:[{t:"transport",mode:"avion",l:"Paris CDG → Séoul ICN",s:"AF 267 · 11 h 25",time:"13:05",c:[2.5479,49.0097]}]},
    {n:2,date:"2025-10-02",wd:"Jeu",region:"Séoul",city:"Séoul",title:"Arrivée à Myeongdong",tag:"MYEONGDONG",note:"Journée douce pour récupérer du vol.",c:[126.985,37.5637],z:14,
      steps:[{t:"transport",mode:"train",l:"AREX express",s:"ICN → Séoul · 43 min",time:"10:10",c:[126.9707,37.5547]},{t:"logement",l:"Stay Myeongdong",s:"Jung-gu · 5 nuits",time:"15:00",c:[126.985,37.5637]},{t:"restaurant",l:"Premier BBQ coréen",s:"Myeongdong",time:"20:00",c:[126.9863,37.561]}]},
    {n:3,date:"2025-10-03",wd:"Ven",region:"Séoul",city:"Séoul",title:"Palais & ruelles hanok",tag:"GYEONGBOKGUNG",note:"Louer un hanbok.",c:[126.977,37.5796],z:14.4,
      steps:[{t:"activite",l:"Palais de Gyeongbokgung",s:"Jongno-gu · 2 h",time:"09:30",c:[126.977,37.5796]},{t:"activite",l:"Village hanok de Bukchon",s:"1 h 30",time:"12:30",c:[126.9849,37.5826]},{t:"restaurant",l:"Tosokchon Samgyetang",s:"Sejong-daero",time:"14:00",c:[126.9718,37.5759]}]},
    {n:4,date:"2025-10-04",wd:"Sam",region:"Séoul",city:"Séoul",title:"Marchés & panorama",tag:"N SEOUL TOWER",note:"Coucher de soleil depuis la tour.",c:[126.9883,37.5512],z:14,
      steps:[{t:"restaurant",l:"Marché de Gwangjang",s:"Jongno-gu",time:"11:00",c:[126.9999,37.5701]},{t:"activite",l:"Ruelles d'Insadong",s:"2 h",time:"14:00",c:[126.985,37.574]},{t:"activite",l:"N Seoul Tower",s:"Mont Namsan · 2 h",time:"17:30",c:[126.9883,37.5512]}]},
    {n:5,date:"2025-10-05",wd:"Dim",region:"Séoul",city:"Séoul",title:"Jeunesse & rivière Han",tag:"RIVIÈRE HAN",note:"Pique-nique à Yeouido.",c:[126.93,37.54],z:13.6,
      steps:[{t:"activite",l:"Quartier de Hongdae",s:"Mapo-gu · 3 h",time:"11:00",c:[126.9237,37.5563]},{t:"activite",l:"Parc de la rivière Han",s:"Yeouido · 2 h",time:"17:00",c:[126.9343,37.5283]}]},
    {n:6,date:"2025-10-06",wd:"Lun",region:"Séoul",city:"Excursion DMZ",title:"Frontière du Nord",tag:"DMZ",note:"Passeport indispensable.",c:[126.677,37.8997],z:12,
      steps:[{t:"transport",mode:"bus",l:"Navette excursion",s:"Séoul → DMZ · 1 h 10",time:"07:30",c:[126.7794,37.7]},{t:"activite",l:"Tunnel n°3 & observatoire",s:"Paju · 4 h",time:"09:30",c:[126.677,37.8997]}]},
    {n:7,date:"2025-10-07",wd:"Mar",region:"Busan",city:"Séoul → Busan",title:"Cap au sud, en KTX",tag:"KTX · GARE DE BUSAN",note:"Train à grande vitesse.",c:[129.11,35.155],z:13.4,
      steps:[{t:"transport",mode:"train",l:"KTX 045",s:"Séoul → Busan · 2 h 40",time:"09:00",c:[129.0414,35.1151]},{t:"logement",l:"Haeundae Sea Hotel",s:"Haeundae · 2 nuits",time:"14:00",c:[129.1603,35.1631]},{t:"restaurant",l:"Dîner à Gwangalli",s:"Plage de Gwangalli",time:"19:30",c:[129.1186,35.1532]}]},
    {n:8,date:"2025-10-08",wd:"Mer",region:"Busan",city:"Busan",title:"Couleurs de Gamcheon",tag:"GAMCHEON",note:"Bonnes chaussures, ça grimpe.",c:[129.02,35.097],z:14.2,
      steps:[{t:"activite",l:"Village de Gamcheon",s:"Saha-gu · 3 h",time:"10:00",c:[129.0107,35.0975]},{t:"restaurant",l:"Marché Jagalchi",s:"Jung-gu",time:"13:30",c:[129.0306,35.0967]}]},
    {n:9,date:"2025-10-09",wd:"Jeu",region:"Busan",city:"Busan",title:"Plage & temple sur la mer",tag:"HAEDONG YONGGUNGSA",note:"Temple au bord de l'océan.",c:[129.19,35.173],z:13.4,
      steps:[{t:"activite",l:"Plage de Haeundae",s:"2 h",time:"09:00",c:[129.1603,35.1587]},{t:"activite",l:"Temple Haedong Yonggungsa",s:"Gijang-gun · 2 h",time:"12:00",c:[129.2233,35.1885]}]},
    {n:10,date:"2025-10-10",wd:"Ven",region:"Séoul",city:"Busan → Séoul",title:"Retour vers la capitale",tag:"RETOUR KTX",note:"Nouveau quartier : Hongdae.",c:[126.9237,37.5563],z:14,
      steps:[{t:"transport",mode:"train",l:"KTX 112",s:"Busan → Séoul · 2 h 40",time:"11:20",c:[129.0414,35.1151]},{t:"logement",l:"Hongdae Loft",s:"Mapo-gu · 5 nuits",time:"15:30",c:[126.9237,37.5563]}]},
    {n:11,date:"2025-10-11",wd:"Sam",region:"Séoul",city:"Séoul",title:"Design & ruisseau",tag:"DONGDAEMUN · DDP",note:"Cheonggyecheon le soir.",c:[127.005,37.568],z:14.2,
      steps:[{t:"activite",l:"Dongdaemun Design Plaza",s:"2 h",time:"11:00",c:[127.0094,37.567]},{t:"activite",l:"Ruisseau Cheonggyecheon",s:"1 h 30",time:"16:00",c:[126.9784,37.5696]}]},
    {n:12,date:"2025-10-12",wd:"Dim",region:"Séoul",city:"Séoul",title:"Jardin secret",tag:"CHANGDEOKGUNG",note:"Réserver la veille.",c:[126.991,37.579],z:14.4,
      steps:[{t:"activite",l:"Palais Changdeokgung",s:"1 h 30",time:"10:00",c:[126.992,37.5794]},{t:"activite",l:"Jardin secret (Huwon)",s:"Visite guidée · 1 h",time:"11:30",c:[126.9945,37.582]},{t:"restaurant",l:"Café à Ikseon-dong",s:"Ikseon-dong",time:"15:00",c:[126.9905,37.5742]}]},
    {n:13,date:"2025-10-13",wd:"Lun",region:"Séoul",city:"Excursion Nami",title:"Île de Nami",tag:"ÎLE DE NAMI",note:"Allée de metasequoias.",c:[127.5256,37.7902],z:13.4,
      steps:[{t:"transport",mode:"train",l:"ITX-Cheongchun",s:"Séoul → Gapyeong · 1 h 10",time:"08:40",c:[127.5106,37.8128]},{t:"activite",l:"Île de Nami",s:"4 h",time:"10:30",c:[127.5256,37.7902]}]},
    {n:14,date:"2025-10-14",wd:"Mar",region:"Séoul",city:"Séoul",title:"Derniers instants",tag:"SEONGSU",note:"Place pour les souvenirs.",c:[127.05,37.546],z:14,
      steps:[{t:"activite",l:"Quartier de Seongsu",s:"3 h",time:"11:00",c:[127.0557,37.5445]},{t:"autre",l:"Achats souvenirs",s:"Myeongdong",time:"16:00",c:[126.985,37.561]}]},
    {n:15,date:"2025-10-15",wd:"Mer",region:"Vol",city:"Séoul → Paris",title:"Le vol retour",tag:"ICN · EMBARQUEMENT",note:"Navette AREX à 06:30.",c:[126.4407,37.4602],z:11,
      steps:[{t:"transport",mode:"train",l:"AREX express",s:"Séoul → ICN · 43 min",time:"06:30",c:[126.9707,37.5547]},{t:"transport",mode:"avion",l:"Séoul ICN → Paris CDG",s:"AF 265 · 12 h 15",time:"10:35",c:[126.4407,37.4602]}]}
  ]
};
const MAP_LEGS=[{a:[2.5479,49.0097],b:[126.4407,37.4602],mode:"avion"},{a:[126.9707,37.5547],b:[129.0414,35.1151],mode:"train"},{a:[129.0414,35.1151],b:[126.9707,37.5547],mode:"train"}];

/* ═══ HELPERS ═══ */
const MAP_IC={avion:'<path d="M21 16v-2l-8-5V3.6a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.4V19l-2 1.4V22l3.5-1 3.5 1v-1.6L13 19v-5.4z"/>',train:'<rect x="5" y="3.5" width="14" height="13" rx="3.5"/><path d="M5 11h14"/><circle cx="9" cy="13.8" r="1"/><circle cx="15" cy="13.8" r="1"/><path d="M8 16.5 6 20M16 16.5 18 20"/>',bus:'<rect x="4" y="4" width="16" height="12" rx="2.5"/><path d="M4 11h16"/><circle cx="8" cy="13.4" r="1"/><circle cx="16" cy="13.4" r="1"/><path d="M7 16.5V19M17 16.5V19"/>',bed:'<path d="M3 19v-8a2 2 0 0 1 2-2h8.5a4.5 4.5 0 0 1 4.5 4.5V19M3 14.5h18M3 19v1.5M21 16.5V20.5"/><circle cx="7.6" cy="12" r="1.4"/>',fork:'<path d="M6.5 3v6.5a2 2 0 0 0 4 0V3M8.5 3v18M16.5 3c-1.6 0-2.6 2.1-2.6 5.2s1 4.3 2.6 4.3M16.5 3v18"/>',camera:'<rect x="3" y="7" width="18" height="12.5" rx="2.5"/><path d="M8.6 7 10 4.5h4L15.4 7"/><circle cx="12" cy="13.2" r="3.2"/>',pin:'<path d="M12 21.5s6.5-5.8 6.5-11A6.5 6.5 0 0 0 5.5 10.5c0 5.2 6.5 11 6.5 11z"/><circle cx="12" cy="10.2" r="2.4"/>',route:'<circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8 6h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5"/>'};
function mvSvg(name,sz,col){return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="'+(col||'currentColor')+'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(MAP_IC[name]||MAP_IC.pin)+'</svg>';}
function mvStepIcon(s){if(s.t==='transport')return s.mode||'route';return({logement:'bed',restaurant:'fork',activite:'camera',autre:'pin'})[s.t]||'pin';}
function mvRegClass(r){return r==='Busan'?'mv-r-busan':r==='Vol'?'mv-r-vol':'mv-r-seoul';}
function gcPoints(a,b,n){n=n||80;const R=d=>d*Math.PI/180,D=r=>r*180/Math.PI;const la1=R(a[1]),lo1=R(a[0]),la2=R(b[1]),lo2=R(b[0]);const d=2*Math.asin(Math.sqrt(Math.sin((la2-la1)/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin((lo2-lo1)/2)**2));if(d===0)return[a,b];const pts=[];for(let i=0;i<=n;i++){const f=i/n;const A=Math.sin((1-f)*d)/Math.sin(d),B=Math.sin(f*d)/Math.sin(d);const x=A*Math.cos(la1)*Math.cos(lo1)+B*Math.cos(la2)*Math.cos(lo2);const y=A*Math.cos(la1)*Math.sin(lo1)+B*Math.cos(la2)*Math.sin(lo2);const z=A*Math.sin(la1)+B*Math.sin(la2);pts.push([D(Math.atan2(y,x)),D(Math.atan2(z,Math.sqrt(x*x+y*y)))]);}return pts;}
function gcDist(a,b){const R=6371,r=d=>d*Math.PI/180;const dLa=r(b[1]-a[1]),dLo=r(b[0]-a[0]);const s=Math.sin(dLa/2)**2+Math.cos(r(a[1]))*Math.cos(r(b[1]))*Math.sin(dLo/2)**2;return 2*R*Math.asin(Math.sqrt(s));}
const MONTHS_MAP=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
function mvFmtDate(iso){const d=new Date(iso);return d.getDate()+' '+MONTHS_MAP[d.getMonth()];}

/* ═══ STYLES (préfixés mv- pour éviter les conflits) ═══ */
const MV_CSS = `
.mv-frame{flex:1;display:flex;min-height:0;overflow:hidden}
.mv-spine{width:288px;flex-shrink:0;border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:0;background:var(--card);z-index:10}
.mv-spine-head{padding:18px 22px 14px;border-bottom:1px solid var(--line2)}
.mv-kicker{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
.mv-spine-title{font-family:var(--font-serif);font-style:italic;font-size:23px;margin-top:4px;line-height:1.05;color:var(--text)}
.mv-spine-dates{font-size:12px;color:var(--muted);margin-top:4px}
.mv-stats{display:flex;gap:8px;margin-top:14px}
.mv-stat{flex:1;background:var(--inset);border:1px solid var(--line2);border-radius:11px;padding:9px 11px}
.mv-stat .v{font-family:var(--font-serif);font-size:19px;line-height:1;color:var(--text)}
.mv-stat .l{font-size:9.5px;letter-spacing:.04em;color:var(--muted);margin-top:3px;text-transform:uppercase}
.mv-all-btn{margin:12px 18px 0;display:flex;align-items:center;justify-content:center;gap:8px;width:calc(100% - 36px);border:1px solid var(--line);background:var(--card);color:var(--text);border-radius:11px;padding:9px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:var(--shadow);transition:all .15s}
.mv-all-btn:hover{border-color:var(--accent);color:var(--accent)}
.mv-spine-list{flex:1;overflow-y:auto;padding:12px 14px 16px;position:relative}
.mv-spine-line{position:absolute;left:30px;top:18px;bottom:18px;width:2px;background:var(--line2)}
.mv-day{width:100%;display:flex;align-items:center;gap:13px;padding:6px 12px 6px 8px;border:none;cursor:pointer;border-radius:11px;text-align:left;position:relative;background:transparent;transition:all .16s;margin-bottom:2px;font-family:inherit;color:var(--text)}
.mv-day:hover{background:var(--inset)}
.mv-day.active{background:var(--card);box-shadow:var(--shadow)}
.mv-dotw{width:22px;display:flex;justify-content:center;flex-shrink:0;z-index:1}
.mv-dot{width:11px;height:11px;border-radius:50%;background:var(--accent);border:2px solid var(--accent);transition:all .16s}
.mv-day.active .mv-dot{width:14px;height:14px;box-shadow:0 0 0 4px var(--accent-soft)}
.mv-r-busan .mv-dot{background:#c98a3c;border-color:#c98a3c}
.mv-r-busan.active .mv-dot{box-shadow:0 0 0 4px rgba(201,138,60,.18)}
.mv-r-vol .mv-dot{background:var(--card);border-color:var(--faint)}
.mv-dn{font-family:var(--font-serif);font-size:15px}
.mv-day.active .mv-dn{color:var(--accent)}
.mv-dc{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mv-dd{font-size:10px;color:var(--muted);margin-top:1px}
.mv-map-wrap{flex:1;position:relative;min-width:0;background:var(--inset)}
#mv-map{position:absolute;inset:0}
#mv-map .maplibregl-ctrl-attrib{font-size:9px;background:rgba(255,255,255,.7);border-radius:8px 0 0 0}
.mv-ov{position:absolute;z-index:5}
.mv-ov-tl{top:16px;left:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.mv-ov-tr{top:16px;right:16px;display:flex;flex-direction:column;gap:10px;align-items:flex-end}
.mv-ov-bl{bottom:16px;left:16px}
.mv-seg{display:flex;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:3px;gap:2px;box-shadow:var(--shadow);backdrop-filter:blur(8px)}
.mv-seg button{border:none;cursor:pointer;padding:7px 14px;border-radius:9px;font-size:12.5px;font-weight:700;background:transparent;color:var(--muted);font-family:inherit;display:flex;align-items:center;gap:6px;transition:all .15s}
.mv-seg button.active{background:var(--accent);color:var(--accent-ink)}
.mv-tour{display:inline-flex;align-items:center;gap:8px;border:none;background:var(--text);color:var(--card);border-radius:12px;padding:9px 15px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:var(--shadow);transition:all .15s}
.mv-tour:hover{transform:translateY(-1px)}
.mv-tour.on{background:var(--accent);color:var(--accent-ink)}
.mv-ctrl{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:13px;box-shadow:var(--shadow);overflow:hidden;backdrop-filter:blur(8px)}
.mv-ctrl button{width:42px;height:42px;border:none;background:transparent;color:var(--text);cursor:pointer;display:grid;place-items:center;transition:background .15s}
.mv-ctrl button:hover{background:var(--accent-soft);color:var(--accent)}
.mv-ctrl button+button{border-top:1px solid var(--line2)}
.mv-readout{font-family:var(--font-mono,ui-monospace);font-size:10.5px;letter-spacing:.04em;color:var(--muted);background:var(--card);border:1px solid var(--line);border-radius:10px;padding:7px 11px;box-shadow:var(--shadow);white-space:nowrap}
.mv-readout b{color:var(--accent);font-weight:700}
.mv-card{width:320px;background:var(--card);border:1px solid var(--line);border-radius:18px;box-shadow:0 18px 50px rgba(31,46,40,.22);overflow:hidden;transition:transform .35s cubic-bezier(.65,0,.18,1),opacity .35s}
.mv-card .mv-hero{position:relative;height:120px;background:linear-gradient(150deg,hsl(152,36%,64%),hsl(152,40%,50%))}
.mv-card.mv-r-busan .mv-hero{background:linear-gradient(150deg,hsl(30,42%,62%),hsl(30,46%,48%))}
.mv-card.mv-r-vol .mv-hero{background:linear-gradient(150deg,hsl(212,28%,60%),hsl(212,32%,46%))}
.mv-card .mv-hero-ov{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(18,30,24,0) 36%,rgba(13,26,20,.72))}
.mv-card .mv-hero-tag{position:absolute;right:12px;top:11px;font-size:9px;letter-spacing:.12em;color:rgba(255,255,255,.85);text-shadow:0 1px 5px rgba(0,0,0,.5);text-transform:uppercase;pointer-events:none;font-family:var(--font-mono,ui-monospace)}
.mv-card .mv-hero-cap{position:absolute;left:16px;right:16px;bottom:12px;color:#fff;pointer-events:none}
.mv-card .mv-hero-pill{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;margin-bottom:5px;text-shadow:0 1px 6px rgba(0,0,0,.5)}
.mv-card .mv-hero-pill .pdot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.mv-card .mv-hj{font-family:var(--font-serif);font-style:italic;font-size:28px;line-height:.82;text-shadow:0 2px 12px rgba(0,0,0,.5)}
.mv-card .mv-hn{font-family:var(--font-serif);font-style:italic;font-size:17.5px;line-height:1.05;text-shadow:0 2px 10px rgba(0,0,0,.55)}
.mv-card-body{padding:13px 15px 15px}
.mv-card-note{font-size:12px;color:var(--muted);font-style:italic;line-height:1.5;margin-bottom:11px}
.mv-step-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--line2);cursor:pointer}
.mv-step-row:last-child{border-bottom:none}
.mv-step-row:hover .mv-step-name{color:var(--accent)}
.mv-step-ic{width:30px;height:30px;border-radius:9px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;flex-shrink:0}
.mv-step-name{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .15s;color:var(--text)}
.mv-step-sub{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mv-step-time{font-family:var(--font-mono,ui-monospace);font-size:11px;color:var(--muted);flex-shrink:0}
.mv-card-foot{display:flex;gap:8px;margin-top:12px;padding-top:11px;border-top:1px solid var(--line)}
.mv-card-foot button{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:7px;border:none;border-radius:10px;padding:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;background:var(--accent-soft);color:var(--accent);transition:all .15s}
.mv-card-foot button:hover{background:var(--accent);color:var(--accent-ink)}
.mv-welcome-pad{padding:18px 18px 16px}
.mv-welcome-line{font-size:12.5px;color:var(--muted);line-height:1.55;margin-top:8px}
.mv-legend{display:flex;flex-direction:column;gap:8px;margin-top:14px;padding-top:13px;border-top:1px solid var(--line2)}
.mv-lg-row{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--text)}
.mv-lg-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;border:2px solid var(--card);box-shadow:0 1px 3px rgba(0,0,0,.2)}
.mv-pin{cursor:pointer;width:30px;height:30px}
.mv-pin .badge{width:30px;height:30px;border-radius:50%;background:var(--accent);color:#fff;display:grid;place-items:center;font-family:var(--font-mono,ui-monospace);font-weight:700;font-size:12.5px;border:2.5px solid var(--card);box-shadow:0 3px 9px rgba(31,46,40,.4);transition:transform .2s,box-shadow .2s}
.mv-r-busan .badge{background:#c98a3c}
.mv-r-vol .badge{background:var(--faint)}
.mv-pin:hover .badge{transform:scale(1.14)}
.mv-pin.active .badge{transform:scale(1.22);box-shadow:0 0 0 5px var(--accent-soft),0 6px 16px rgba(0,0,0,.32)}
.mv-sp{display:flex;align-items:center;gap:7px;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:4px 11px 4px 4px;box-shadow:0 4px 12px rgba(31,46,40,.18);cursor:pointer;transition:transform .15s;white-space:nowrap;animation:mvpop .3s cubic-bezier(.34,1.56,.64,1) both}
.mv-sp:hover{transform:translateY(-2px)}
.mv-sp .sp-ic{width:26px;height:26px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;flex-shrink:0}
.mv-sp .sp-name{font-size:11.5px;font-weight:700;color:var(--text)}
.mv-sp .sp-time{font-family:var(--font-mono,ui-monospace);font-size:9.5px;color:var(--muted)}
@keyframes mvpop{from{opacity:0;transform:translateY(6px) scale(.9)}to{opacity:1;transform:none}}
`;

/* ═══ TILE SOURCES (gratuit, sans token) ═══ */
const MV_POS='https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const MV_DARK='https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const MV_VOY='https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const MV_ESRI='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

function MapView() {
  const { trip, theme = localStorage.getItem('it_theme') || 'light' } = Store.useStore();
  const mapEl = React.useRef(null);
  const mapRef = React.useRef(null);
  const cardRef = React.useRef(null);
  const readoutRef = React.useRef(null);
  const needleRef = React.useRef(null);
  const tourBtnRef = React.useRef(null);
  const [sel, setSel] = React.useState(null);
  
  // --- ÉTAPE 1 : ÉTATS DE RECHERCHE ---
  const [searchQuery, setSearchQuery] = React.useState('');
  // ------------------------------------
  const [curStyle, setCurStyle] = React.useState('minimal');
  const spinRef = React.useRef(true);
  const markersRef = React.useRef({ day: [], step: [] });
  const tourRef = React.useRef({ on: false, timer: null });
  const styleCache = React.useRef({});
  const T = MAP_TRIP;

  // Total km
  const totalKm = React.useMemo(() => {
    let km = 0; MAP_LEGS.forEach(l => km += gcDist(l.a, l.b)); km += gcDist(MAP_LEGS[0].a, MAP_LEGS[0].b);
    return (Math.round(km / 100) * 100).toLocaleString('fr-FR');
  }, []);

  // ── Style builders ──
  async function fetchS(u) { if (styleCache.current[u]) return styleCache.current[u]; const j = await (await fetch(u)).json(); styleCache.current[u] = j; return j; }
  const clone = o => JSON.parse(JSON.stringify(o));
  async function buildBase() {
    const isDark = theme === 'dark';
    const style = clone(await fetchS(isDark ? MV_DARK : MV_POS));

    // Couleurs signature "L'Atelier" pour redonner vie à la carte
    const colWater = isDark ? '#112923' : '#d9e3e0'; // Bleu/vert pétrole très doux
    const colPark = isDark ? '#1c3d31' : '#e2eadc'; // Vert doux / sauge
    const colBld = isDark ? '#2a5046' : '#f0ece1'; // Couleur des bâtiments 3D
    const colText = isDark ? '#9db5ab' : '#5e7068'; // Texte des POI

    // On parcourt TOUTES les couches de la carte pour les modifier
    style.layers.forEach(l => {
      // 1. Coloriser l'Eau & les Parcs
      if (l.type === 'fill') {
        if (l.id.includes('water')) l.paint['fill-color'] = colWater;
        if (l.id.includes('park') || l.id.includes('wood') || l.id.includes('landcover')) {
          l.paint['fill-color'] = colPark;
          l.paint['fill-opacity'] = 0.8;
        }
      }

      // 2. Gérer la langue et réveiller les Points d'Intérêts (POI)
      if (l.type === 'symbol') {
        // Tenter d'afficher le nom international (anglais/latin) en priorité sur le coréen
        if (l.layout && l.layout['text-field']) {
           l.layout['text-field'] = ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']];
        }
        
        // Rendre les monuments/métros bien visibles
        if (l.id.includes('poi')) {
           l.layout['visibility'] = 'visible';
           if (l.paint) {
             l.paint['text-color'] = colText;
             l.paint['text-halo-color'] = isDark ? '#15302a' : '#ffffff';
             l.paint['text-halo-width'] = 1.5;
           }
        }
      }
    });

    // 3. Le cheat code absolu : Ajouter les Bâtiments en 3D !
    const sourceName = Object.keys(style.sources)[0]; 
    style.layers.push({
      'id': '3d-buildings',
      'source': sourceName,
      'source-layer': 'building',
      'type': 'fill-extrusion',
      'minzoom': 14.5, // Ne s'affiche que quand on zoome près (comme un drone)
      'paint': {
        'fill-extrusion-color': colBld,
        // Utilise la vraie hauteur du bâtiment, ou 10m par défaut si inconnu
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 10],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
        'fill-extrusion-opacity': 0.8
      }
    });

    return style;
  }
  async function buildSat() {
    const s = clone(await fetchS(MV_VOY));
    s.sources.satimg = { type: 'raster', tiles: [MV_ESRI], tileSize: 256 };
    const labels = s.layers.filter(l => l.type === 'symbol').map(l => { l.paint = l.paint || {}; l.paint['text-color'] = '#f7f2e8'; l.paint['text-halo-color'] = 'rgba(8,16,12,.8)'; l.paint['text-halo-width'] = 1.4; return l; });
    s.layers = [{ id: 'bg', type: 'background', paint: { 'background-color': '#0d1a14' } }, { id: 'satimg', type: 'raster', source: 'satimg' }, ...labels];
    return s;
  }

  function applyGlobe(map) {
    try { map.setProjection({ type: 'globe' }); } catch (e) {}
    const isDark = theme === 'dark';
    const sky = isDark
      ? { 'sky-color': '#0d251f', 'horizon-color': '#1b4b3f', 'fog-color': '#143a31', 'sky-horizon-blend': .6, 'horizon-fog-blend': .6, 'fog-ground-blend': .5, 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, .8, 5, .4, 9, 0] }
      : { 'sky-color': '#a8c9e6', 'horizon-color': '#f4efe5', 'fog-color': '#f7f2e8', 'sky-horizon-blend': .6, 'horizon-fog-blend': .6, 'fog-ground-blend': .55, 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, .85, 5, .45, 9, 0] };
    try { map.setSky(sky); } catch (e) {}
  }

  function addRoutes(map) {
    if (map.getSource('legs')) return;
    const feats = MAP_LEGS.map(l => ({ type: 'Feature', properties: { mode: l.mode }, geometry: { type: 'LineString', coordinates: gcPoints(l.a, l.b, 96) } }));
    map.addSource('legs', { type: 'geojson', data: { type: 'FeatureCollection', features: feats } });
    map.addLayer({ id: 'legs-glow', type: 'line', source: 'legs', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#b4843e', 'line-width': 6, 'line-opacity': .18, 'line-blur': 4 } });
    map.addLayer({ id: 'legs-line', type: 'line', source: 'legs', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#b4843e', 'line-width': 2, 'line-dasharray': [1.5, 2.5] } });
  }

  // ── Markers ──
  function buildDayMarkers(map) {
    T.days.forEach((d, i) => {
      const el = document.createElement('div');
      el.className = 'mv-pin ' + mvRegClass(d.region);
      el.innerHTML = '<div class="badge">' + d.n + '</div>';
      el.addEventListener('click', e => { e.stopPropagation(); doSelect(i, true); });
      const m = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(d.c).addTo(map);
      markersRef.current.day.push({ m, el });
    });
  }
  function clearStepMarkers() { markersRef.current.step.forEach(m => m.remove()); markersRef.current.step = []; }
  function showStepMarkers(map, day) {
    clearStepMarkers();
    day.steps.forEach((s, k) => {
      if (!s.c) return;
      const el = document.createElement('div');
      el.className = 'mv-sp';
      el.style.animationDelay = (k * 60) + 'ms';
      el.innerHTML = '<div class="sp-ic">' + mvSvg(mvStepIcon(s), 15) + '</div><div style="display:flex;flex-direction:column;line-height:1.1"><span class="sp-name">' + s.l + '</span><span class="sp-time">' + (s.time || '') + '</span></div>';
      el.addEventListener('click', () => { if (s.c) map.flyTo({ center: s.c, zoom: Math.max(map.getZoom(), 15.5), duration: 1400 }); });
      const m = new maplibregl.Marker({ element: el, anchor: 'left' }).setLngLat(s.c).addTo(map);
      markersRef.current.step.push(m);
    });
  }

  // ── Card rendering ──
  function renderWelcome() {
    if (!cardRef.current) return;
    cardRef.current.innerHTML =
      '<div class="mv-card"><div class="mv-welcome-pad">' +
      '<div class="mv-kicker">Le voyage</div>' +
      '<div class="mv-spine-title" style="font-size:24px;margin-top:3px">' + T.name + '</div>' +
      '<div class="mv-welcome-line">Un fil d\'or relie chaque étape. Cliquez un jour pour plonger du globe jusqu\'au niveau des rues.</div>' +
      '<div class="mv-legend">' +
      '<div class="mv-lg-row"><span class="mv-lg-dot" style="background:var(--accent)"></span>Séoul & environs</div>' +
      '<div class="mv-lg-row"><span class="mv-lg-dot" style="background:#c98a3c"></span>Busan, l\'échappée du Sud</div>' +
      '<div class="mv-lg-row"><span class="mv-lg-dot" style="background:var(--card);border-color:var(--faint)"></span>Vols Paris ⇄ Séoul</div>' +
      '</div></div></div>';
  }
  function renderDayCard(i) {
    if (!cardRef.current) return;
    const d = T.days[i]; const rc = mvRegClass(d.region);
    const pillCol = d.region === 'Busan' ? '#c98a3c' : d.region === 'Vol' ? 'var(--faint)' : 'var(--accent)';
    let rows = '';
    d.steps.forEach((s, k) => {
      rows += '<div class="mv-step-row" data-si="' + k + '"><div class="mv-step-ic">' + mvSvg(mvStepIcon(s), 16) + '</div><div style="flex:1;min-width:0"><div class="mv-step-name">' + s.l + '</div><div class="mv-step-sub">' + (s.s || '') + '</div></div><div class="mv-step-time">' + (s.time || '') + '</div></div>';
    });
    cardRef.current.innerHTML =
      '<div class="mv-card ' + rc + '"><div class="mv-hero"><div class="mv-hero-ov"></div><div class="mv-hero-tag">' + d.tag + '</div><div class="mv-hero-cap"><div class="mv-hero-pill"><span class="pdot" style="background:' + pillCol + '"></span>' + d.wd + ' ' + mvFmtDate(d.date) + ' · ' + d.region + '</div><div style="display:flex;align-items:flex-end;gap:9px"><span class="mv-hj">J' + d.n + '</span><span class="mv-hn">' + d.title + '</span></div></div></div><div class="mv-card-body">' + (d.note ? '<div class="mv-card-note">' + d.note + '</div>' : '') + rows + '<div class="mv-card-foot"><button id="mv-fly-btn">' + mvSvg('route', 14) + 'Recadrer ce jour</button></div></div></div>';
    const map = mapRef.current;
    cardRef.current.querySelectorAll('.mv-step-row').forEach(r => {
      r.addEventListener('click', () => { const s = d.steps[+r.dataset.si]; if (s.c && map) map.flyTo({ center: s.c, zoom: Math.max(map.getZoom(), 15.5), duration: 1400 }); });
    });
    const fb = document.getElementById('mv-fly-btn');
    if (fb) fb.addEventListener('click', () => flyDay(i));
  }

  // ── Navigation ──
  function flyDay(i) {
    const map = mapRef.current; if (!map) return;
    const d = T.days[i];
    map.flyTo({ center: d.c, zoom: d.z, pitch: d.region === 'Vol' ? 0 : 42, bearing: 0, duration: 2200, curve: 1.5, essential: true });
  }
  function doSelect(i, fly) {
    spinRef.current = false;
    setSel(i);
    const map = mapRef.current; if (!map) return;
    markersRef.current.day.forEach((dm, k) => dm.el.classList.toggle('active', k === i));
    showStepMarkers(map, T.days[i]);
    renderDayCard(i);
    if (fly) flyDay(i);
  }
  function showGlobe() {
    spinRef.current = true; setSel(null); clearStepMarkers();
    markersRef.current.day.forEach(dm => dm.el.classList.remove('active'));
    renderWelcome();
    const map = mapRef.current; if (!map) return;
    map.flyTo({ center: [64, 44], zoom: 1.6, pitch: 0, bearing: 0, duration: 2400, curve: 1.4 });
    setTimeout(() => { if (spinRef.current) spinGlobe(); }, 2500);
  }
  function fitAll() {
    spinRef.current = false; setSel(null); clearStepMarkers();
    markersRef.current.day.forEach(dm => dm.el.classList.remove('active'));
    renderWelcome();
    const map = mapRef.current; if (!map) return;
    const b = new maplibregl.LngLatBounds(); T.days.forEach(d => b.extend(d.c));
    map.fitBounds(b, { padding: 90, duration: 2000, pitch: 0, bearing: 0 });
  }
  function spinGlobe() {
    const map = mapRef.current; if (!map || !spinRef.current || map.getZoom() > 3.2) return;
    const c = map.getCenter(); c.lng -= .55; map.easeTo({ center: c, duration: 1300, easing: t => t });
  }

  // ── Tour ──
  function stopTour() { tourRef.current.on = false; clearTimeout(tourRef.current.timer); if (tourBtnRef.current) { tourBtnRef.current.classList.remove('on'); tourBtnRef.current.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>Survoler'; } }
  function startTour() {
    tourRef.current.on = true; spinRef.current = false;
    if (tourBtnRef.current) { tourBtnRef.current.classList.add('on'); tourBtnRef.current.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>Stop'; }
    let i = 0;
    const step = () => { if (!tourRef.current.on) return; doSelect(i, true); i++; if (i >= T.days.length) { tourRef.current.timer = setTimeout(() => { if (tourRef.current.on) stopTour(); }, 2600); return; } tourRef.current.timer = setTimeout(step, 2700); };
    step();
  }

  // ── Init map ──
  React.useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapEl.current,
      style: theme === 'dark' ? MV_DARK : MV_POS,
      center: [64, 44], zoom: 1.6,
      attributionControl: { compact: true },
      dragRotate: true, maxPitch: 70
    });
    mapRef.current = map;
    map.on('style.load', () => { applyGlobe(map); addRoutes(map); });
    let inited = false;
    function initContent() { if (inited) return; inited = true; buildDayMarkers(map); setTimeout(spinGlobe, 400); }
    map.on('load', initContent);
    setTimeout(initContent, 3000);
    map.on('moveend', () => { if (spinRef.current && map.getZoom() <= 3.2) setTimeout(spinGlobe, 0); });
    ['dragstart', 'mousedown', 'touchstart', 'wheel'].forEach(ev => map.on(ev, () => { spinRef.current = false; }));
    map.on('move', () => {
      const c = map.getCenter(), z = map.getZoom();
      if (readoutRef.current) {
        if (z < 3.4) readoutRef.current.innerHTML = '<b>GLOBE</b> · z' + z.toFixed(1);
        else { const ns = c.lat >= 0 ? 'N' : 'S', ew = c.lng >= 0 ? 'E' : 'O'; readoutRef.current.innerHTML = '<b>' + Math.abs(c.lat).toFixed(3) + '°' + ns + '</b> · ' + Math.abs(c.lng).toFixed(3) + '°' + ew + ' · z' + z.toFixed(1); }
      }
      if (needleRef.current) needleRef.current.style.transform = 'rotate(' + (-map.getBearing()) + 'deg)';
    });
    renderWelcome();
    return () => { stopTour(); map.remove(); mapRef.current = null; markersRef.current = { day: [], step: [] }; };
  }, []);

  // ── Theme change → restyle map ──
  React.useEffect(() => {
    const map = mapRef.current; if (!map) return;
    (async () => { map.setStyle(curStyle === 'sat' ? await buildSat() : await buildBase()); })();
  }, [theme]);

  // ── Style switch ──
  async function switchStyle(st) {
    const map = mapRef.current; if (!map || st === curStyle) return;
    setCurStyle(st);
    map.setStyle(st === 'sat' ? await buildSat() : await buildBase());
  }

  if (!trip) return null;

  return (
    <>
      <style>{MV_CSS}</style>
      <div className="mv-frame">
        {/* ── SPINE ── */}
        <aside className="mv-spine">
          <div className="mv-spine-head">
            <div className="mv-kicker">Carte du voyage</div>
            <div className="mv-spine-title">{T.name}</div>
            <div className="mv-spine-dates">{T.dates}</div>
            <div className="mv-stats">
              <div className="mv-stat"><div className="v">{totalKm}</div><div className="l">kilomètres</div></div>
              <div className="mv-stat"><div className="v">2</div><div className="l">villes</div></div>
              <div className="mv-stat"><div className="v">15</div><div className="l">jours</div></div>
            </div>
          </div>
          <button className="mv-all-btn" onClick={fitAll}>
            <Icon name="expand" size={14} />Survol du voyage entier
          </button>
          <div className="mv-spine-list">
            <div className="mv-spine-line" />
            {T.days.map((d, i) => (
              <button key={i} className={'mv-day ' + mvRegClass(d.region) + (sel === i ? ' active' : '')} onClick={() => doSelect(i, true)}>
                <div className="mv-dotw"><div className="mv-dot" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                    <span className="mv-dn">J{d.n}</span>
                    <span className="mv-dc">{d.city}</span>
                  </div>
                  <div className="mv-dd">{d.wd} {mvFmtDate(d.date)}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* ── MAP ── */}
        <div className="mv-map-wrap">
          <div id="mv-map" ref={mapEl} />
          {/* --- ÉTAPE 1 : BARRE DE RECHERCHE VISUELLE --- */}
          <div className="mv-ov" style={{ top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: '100%', maxWidth: 360, padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 999, padding: '8px 18px', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
              <Icon name="pin" size={16} style={{ color: 'var(--muted)', marginRight: 10 }} />
              <LocationInput
                value={searchQuery}
                onChange={v => setSearchQuery(v)}
                onSelect={(loc) => {
                  spinRef.current = false;
                  // On vole directement vers les coordonnées exactes !
                  mapRef.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 12, pitch: 50, duration: 3000, curve: 1.4 });
                  Store.showToast(`Vol vers ${loc.label.split(',')[0]} ✈️`);
                }}
                placeholder="Rechercher un lieu dans le monde..."
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', minWidth: 220 }}
              />
            </div>
          </div>
          {/* --------------------------------------------- */}

          <div className="mv-ov mv-ov-tl" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="mv-seg">
                <button className={curStyle === 'minimal' ? 'active' : ''} onClick={() => switchStyle('minimal')}>Épuré</button>
                <button className={curStyle === 'sat' ? 'active' : ''} onClick={() => switchStyle('sat')}>Satellite</button>
              </div>
              <button className="mv-tour" ref={tourBtnRef} onClick={() => { if (tourRef.current.on) stopTour(); else startTour(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                Survoler
              </button>
            </div>
            {sel !== null && T.days[sel] && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {T.days[sel].steps.map((s, k) => (
                  <button key={k} onClick={() => { if (s.c && mapRef.current) mapRef.current.flyTo({ center: s.c, zoom: Math.max(mapRef.current.getZoom(), 15.5), duration: 1200 }); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '6px 12px 6px 8px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'var(--shadow)', transition: 'all .15s' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0 }}
                      dangerouslySetInnerHTML={{ __html: mvSvg(mvStepIcon(s), 14) }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.l}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{s.time || ''}{s.s ? ' · ' + s.s : ''}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mv-ov mv-ov-tr">
            <div className="mv-ctrl">
              <button onClick={() => { spinRef.current = false; mapRef.current?.zoomIn({ duration: 400 }); }} title="Zoomer"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></button>
              <button onClick={() => { spinRef.current = false; mapRef.current?.zoomOut({ duration: 400 }); }} title="Dézoomer"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M5 12h14" /></svg></button>
              <button onClick={() => mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 600 })} title="Nord">
                <svg ref={needleRef} width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l3.2 8L12 9.4 8.8 11z" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1.5" />
                  <path d="M12 9.4 8.8 13 12 21l3.2-8z" fill="var(--muted)" stroke="var(--muted)" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
            <div className="mv-ctrl">
              <button onClick={() => { const p = mapRef.current?.getPitch() > 10 ? 0 : 55; mapRef.current?.easeTo({ pitch: p, duration: 700 }); }} title="Vue 3D"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-5 9 5-9 5z" /><path d="M3 9v6l9 5 9-5V9" /></svg></button>
            </div>
            <div className="mv-readout" ref={readoutRef}><b>GLOBE</b> · z1.6</div>
          </div>

          <div className="mv-ov mv-ov-bl" ref={cardRef} />
        </div>
      </div>
    </>
  );
}

window.MapView = MapView;