const LS_KEY='voyage-planner-v6';
const DEFAULT_PARTICIPANTS=['Mathis','Margot'];

let state={trip:null,docs:[],budget:[],participants:[...DEFAULT_PARTICIPANTS]};
let tripsStore={activeTripId:null,trips:[]};

let readMode=false,timerInd=null,timerToast=null;
const _photoCache={};
const _photoOpen={};
const _geocodeCache={};
let _map=null,_mapInited=false,_mapMarkers=[],_mapRoutes=[];
let _budgetPayer=null;
let _budgetFor=new Set();
const BUDGET_COLORS=['#448aff','#ff7043','#66bb6a','#ab47bc','#ffa726','#26c6da'];
const CAT_COLORS={Transport:'#448aff',Logement:'#ab47bc',Activité:'#ff7043',Repas:'#66bb6a',Divers:'#ffa726'};
const CAT_EMOJI={Transport:'🚗',Logement:'🏠',Activité:'🎯',Repas:'🍽️',Divers:'📦'};

function esc(s){
  return String(s ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function flashSave(){
  const el=document.getElementById('save-indicator');
  if(!el)return;
  el.style.opacity='1';
  clearTimeout(timerInd);
  timerInd=setTimeout(()=>el.style.opacity='0',1800);
}

function showToast(msg){
  const t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;
  t.classList.add('show');
  clearTimeout(timerToast);
  timerToast=setTimeout(()=>t.classList.remove('show'),2200);
}

function makeTripId(){
  return 'trip_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
}

function normalizeTripRecord(record){
  return {
    id:record.id||makeTripId(),
    name:record.name||record.trip?.name||'Voyage',
    updatedAt:record.updatedAt||Date.now(),
    data:{
      trip:record.data?.trip??record.trip??null,
      docs:Array.isArray(record.data?.docs)?record.data.docs:(Array.isArray(record.docs)?record.docs:[]),
      budget:Array.isArray(record.data?.budget)?record.data.budget:(Array.isArray(record.budget)?record.budget:[]),
      participants:Array.isArray(record.data?.participants)&&record.data.participants.length
        ?record.data.participants
        :(Array.isArray(record.participants)&&record.participants.length?record.participants:[...DEFAULT_PARTICIPANTS])
    }
  };
}

function getCurrentTripRecord(){
  if(!state.trip)return null;
  return {
    id:tripsStore.activeTripId||makeTripId(),
    name:state.trip?.name||'Voyage',
    updatedAt:Date.now(),
    data:{
      trip:state.trip,
      docs:Array.isArray(state.docs)?state.docs:[],
      budget:Array.isArray(state.budget)?state.budget:[],
      participants:Array.isArray(state.participants)&&state.participants.length?state.participants:[...DEFAULT_PARTICIPANTS]
    }
  };
}

function applyTripData(payload){
  state.trip=payload?.trip||null;
  state.docs=Array.isArray(payload?.docs)?payload.docs:[];
  state.budget=Array.isArray(payload?.budget)?payload.budget:[];
  state.participants=Array.isArray(payload?.participants)&&payload.participants.length?payload.participants:[...DEFAULT_PARTICIPANTS];
  _budgetPayer=state.participants[0]||null;
  _budgetFor=new Set(state.participants);
}

function renderTripSwitcher(){
  const sel=document.getElementById('trip-switcher');
  const del=document.getElementById('trip-delete-btn');
  if(!sel)return;

  const items=[...tripsStore.trips].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));

  sel.innerHTML=[
    `<option value="" disabled ${!tripsStore.activeTripId?'selected':''}>Changer de voyage</option>`,
    ...items.map(t=>`<option value="${esc(t.id)}"${t.id===tripsStore.activeTripId?' selected':''}>${esc(t.name||'Voyage')}</option>`)
  ].join('');

  sel.value=tripsStore.activeTripId || '';
  sel.disabled=false;

  if(del)del.style.display=tripsStore.activeTripId?'inline-flex':'none';
}

function persistStore(){
  try{
    const current=getCurrentTripRecord();
    if(current){
      const idx=tripsStore.trips.findIndex(t=>t.id===current.id);
      if(idx>=0)tripsStore.trips[idx]=current;
      else tripsStore.trips.unshift(current);
      tripsStore.activeTripId=current.id;
    }
    localStorage.setItem(LS_KEY,JSON.stringify(tripsStore));
    flashSave();
    renderTripSwitcher();
  }catch(e){console.warn(e)}
}

function saveToLocalStorage(){persistStore()}

function loadFromLocalStorage(){
  try{
    const raw=localStorage.getItem(LS_KEY);
    if(!raw)return null;
    const parsed=JSON.parse(raw);

    if(Array.isArray(parsed?.trips)){
      return {
        activeTripId:parsed.activeTripId||parsed.trips[0]?.id||null,
        trips:parsed.trips.map(normalizeTripRecord)
      };
    }

    if(parsed && (parsed.trip||parsed.docs||parsed.budget)){
      const migrated=normalizeTripRecord({
        id:makeTripId(),
        name:parsed.trip?.name||'Voyage',
        trip:parsed.trip||null,
        docs:Array.isArray(parsed.docs)?parsed.docs:[],
        budget:Array.isArray(parsed.budget)?parsed.budget:[],
        participants:Array.isArray(parsed.participants)&&parsed.participants.length?parsed.participants:[...DEFAULT_PARTICIPANTS]
      });
      return {activeTripId:migrated.id,trips:[migrated]};
    }

    return null;
  }catch(e){return null}
}

function clearLocalStorage(){
  try{localStorage.removeItem(LS_KEY)}catch(e){}
}

function selectTrip(id){
  if(!id){
    goHome();
    return;
  }

  const trip=tripsStore.trips.find(t=>t.id===id);
  if(!trip)return;

  tripsStore.activeTripId=trip.id;
  applyTripData(trip.data);
  persistStore();
  switchView('itinerary');
  renderItinerary();
  renderDocs();
  renderBudget();

  const bb=document.getElementById('btn-back');
  if(bb)bb.classList.add('visible');

  showToast(`Voyage ${trip.name} chargé`);
}

function deleteCurrentTrip(){
  if(!tripsStore.activeTripId)return;
  const currentId=tripsStore.activeTripId;
  const current=tripsStore.trips.find(t=>t.id===currentId);
  if(!confirm(`Supprimer "${current?.name||'ce voyage'}" ?`))return;

  tripsStore.trips=tripsStore.trips.filter(t=>t.id!==currentId);

  if(tripsStore.trips.length){
    tripsStore.activeTripId=tripsStore.trips[0].id;
    applyTripData(tripsStore.trips[0].data);
  }else{
    tripsStore.activeTripId=null;
    applyTripData({trip:null,docs:[],budget:[],participants:[...DEFAULT_PARTICIPANTS]});
  }

  try{localStorage.setItem(LS_KEY,JSON.stringify(tripsStore))}catch(e){}
  renderTripSwitcher();
  renderItinerary();
  renderDocs();
  renderBudget();
  showToast('Voyage supprimé');
}

/* ══ Thème ══ */
(function initTheme(){
  const dark=window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(dark?'dark':'light');
})();
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme',theme);
  const btn=document.getElementById('theme-toggle');
  if(!btn)return;
  btn.innerHTML=theme==='dark'
    ?`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
    :`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}
function toggleTheme(){applyTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark')}
function toggleReadMode(){readMode=!readMode;document.body.classList.toggle('read-mode',readMode);document.getElementById('read-mode-toggle').classList.toggle('active',readMode);showToast(readMode?'👁 Mode lecture':'✏️ Mode édition')}

/* ══ Navigation ══ */
function switchView(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  document.getElementById('nav-'+view).classList.add('active');
  if(view==='budget')renderBudget();
  if(view==='docs')renderDocs();
  if(view==='map')setTimeout(()=>{initMap();if(_map)_map.invalidateSize();renderMap();},120);
}

function openModal(id){
  const o=document.getElementById(id);
  if(!o)return;
  o.classList.add('open');
  document.body.style.overflow='hidden';
}

function closeModal(id){
  const o=document.getElementById(id);
  if(!o)return;
  o.classList.remove('open');
  if(!document.querySelector('.modal-overlay.open')){
    document.body.style.overflow='';
  }
}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
    document.getElementById('lightbox').classList.remove('open');
  }
});

/* ══ Accueil ══ */
function goHome(){
  Object.keys(_photoCache).forEach(k=>delete _photoCache[k]);
  Object.keys(_photoOpen).forEach(k=>delete _photoOpen[k]);
  Object.keys(_geocodeCache).forEach(k=>delete _geocodeCache[k]);

  _mapInited=false;
  if(_map){
    _mapMarkers.forEach(m=>_map.removeLayer(m));
    _mapRoutes.forEach(r=>_map.removeLayer(r));
  }
  _mapMarkers=[];
  _mapRoutes=[];

  state.trip=null;
  state.docs=[];
  state.budget=[];
  state.participants=[...DEFAULT_PARTICIPANTS];
  tripsStore.activeTripId=null;

  _budgetPayer=state.participants[0]||null;
  _budgetFor=new Set(state.participants);

  switchView('itinerary');
  renderItinerary();
  renderDocs();
  renderBudget();
  renderTripSwitcher();

  const sel=document.getElementById('trip-switcher');
  if(sel)sel.value='';

  const bb=document.getElementById('btn-back');
  if(bb)bb.classList.remove('visible');
}

/* ══ Dates intelligentes ══ */
function onTripStartChange(){syncDates('start')}
function onTripDaysChange(){syncDates('days')}
function onTripEndChange(){syncDates('end')}

function openEditDates(){
  document.getElementById('edit-start').value=state.trip.startDate||'';
  document.getElementById('edit-days').value=state.trip.days.length;
  const n=state.trip.days.length;
  const s=state.trip.startDate;
  if(s&&n){const d=new Date(s);d.setDate(d.getDate()+n-1);document.getElementById('edit-end').value=d.toISOString().split('T')[0];}
  else document.getElementById('edit-end').value='';
  openModal('modal-edit-dates');
}

function syncEditDates(trigger){
  const s=document.getElementById('edit-start').value;
  const e=document.getElementById('edit-end').value;
  const nEl=document.getElementById('edit-days');
  const n=Math.max(1,parseInt(nEl.value)||1);
  if(trigger==='start'||trigger==='days'){
    if(s){const d=new Date(s);d.setDate(d.getDate()+n-1);document.getElementById('edit-end').value=d.toISOString().split('T')[0];}
  } else if(trigger==='end'){
    if(s&&e){const diff=Math.round((new Date(e)-new Date(s))/86400000)+1;if(diff<1){document.getElementById('edit-end').value=s;nEl.value=1;}else nEl.value=diff;}
  }
}

function saveEditDates(){
  const newStart=document.getElementById('edit-start').value||null;
  const newDays=Math.max(1,parseInt(document.getElementById('edit-days').value)||1);
  const oldDays=state.trip.days.length;
  // Ajouter des jours si on en met plus
  while(state.trip.days.length<newDays){
    state.trip.days.push({title:'',note:'',dateLabel:'',steps:[],transport:null,hebergement:null});
  }
  // Supprimer des jours si on en met moins (garder les données existantes)
  if(state.trip.days.length>newDays) state.trip.days.length=newDays;
  // Recalculer les dateLabel de chaque jour
  state.trip.startDate=newStart;
  state.trip.days.forEach((day,i)=>{
    if(newStart){
      const d=new Date(newStart);d.setDate(d.getDate()+i);
      day.dateLabel=d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'});
    } else {
      day.dateLabel='';
    }
  });
  saveToLocalStorage();
  closeModal('modal-edit-dates');
  renderItinerary();
  showToast('Dates mises à jour ✓');
}

function syncDates(trigger){  const startEl=document.getElementById('trip-start');
  const daysEl=document.getElementById('trip-days');
  const endEl=document.getElementById('trip-end');
  if(!startEl||!daysEl||!endEl)return;
  const start=startEl.value;
  const end=endEl.value;
  const days=Math.max(1,parseInt(daysEl.value)||1);
  if(trigger==='start'||trigger==='days'){
    if(start){
      const d=new Date(start);
      d.setDate(d.getDate()+days-1);
      endEl.value=d.toISOString().split('T')[0];
    }
  }else if(trigger==='end'){
    if(start&&end){
      const diff=Math.round((new Date(end)-new Date(start))/86400000)+1;
      if(diff<1){endEl.value=start;daysEl.value=1;}
      else daysEl.value=diff;
    }
  }
}

/* ══ Autocomplétion Nominatim ══ */
const _acTimers={};
const _acCoords={};

function _getTripCity(){
  if(!state.trip||!state.trip.name)return'';
  return state.trip.name.split(/[\s\-,]+/).find(p=>p.length>3&&!/^\d+$/.test(p))||'';
}

function _getTripCenter(){
  const coords=Object.values(_geocodeCache);
  if(!coords.length)return null;
  const lat=coords.reduce((s,c)=>s+c.lat,0)/coords.length;
  const lng=coords.reduce((s,c)=>s+c.lng,0)/coords.length;
  return{lat,lng};
}

async function _nominatimFetch(q,lat,lng){
  let url=`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=fr`;
  if(lat&&lng)url+=`&lat=${lat}&lon=${lng}`;
  const r=await fetch(url);
  const d=await r.json();
  return(d.features||[]).map(f=>({
    name:[f.properties.name,f.properties.housenumber,f.properties.street].filter(Boolean).join(' ')||f.properties.city||'Lieu',
    display_name:[f.properties.name,f.properties.street,f.properties.city,f.properties.country].filter(Boolean).join(', '),
    lat:f.geometry.coordinates[1],
    lon:f.geometry.coordinates[0]
  }));
}

function acInput(input,listId){
  const list=document.getElementById(listId);
  const raw=input.value.trim();
  clearTimeout(_acTimers[listId]);
  if(raw.length<2){list.innerHTML='';list.classList.remove('open');return}
  const looksLikeAddress=/\d/.test(raw)&&(raw.includes(',')|| /\d{5}/.test(raw));
  list.innerHTML='<div class="autocomplete-loading">Recherche…</div>';
  list.classList.add('open');
  _acTimers[listId]=setTimeout(async()=>{
    try{
      const center=_getTripCenter();
      let data=await _nominatimFetch(raw, looksLikeAddress?null:center?.lat, looksLikeAddress?null:center?.lng);
      if(!data.length){
        const city=_getTripCity();
        if(city&&!raw.toLowerCase().includes(city.toLowerCase())){
          data=await _nominatimFetch(`${raw} ${city}`,center?.lat,center?.lng);
        }
      }
      if(!data.length){list.innerHTML='<div class="autocomplete-loading">Aucun résultat</div>';return}
      list.innerHTML=data.map((item,i)=>{
        const main=item.name||item.display_name.split(',')[0]||'Lieu';
        const sub=(item.display_name||'').replace(main+', ','').slice(0,70);
        const lat=parseFloat(item.lat),lng=parseFloat(item.lon);
        return`<div class="autocomplete-item" data-idx="${i}" data-lat="${lat}" data-lng="${lng}" data-main="${encodeURIComponent(main)}" onmousedown="acSelect(event,'${input.id}','${listId}')"><strong>${esc(main)}</strong><br/><span style="font-size:.72rem;color:var(--faint)">${esc(sub)}</span></div>`;
      }).join('');
    }catch(e){list.innerHTML='<div class="autocomplete-loading">Erreur réseau</div>'}
  }, looksLikeAddress?150:420);
}

function acSelect(e,inputId,listId){
  e.preventDefault();
  const item=e.currentTarget;
  const main=decodeURIComponent(item.dataset.main);
  const lat=parseFloat(item.dataset.lat);
  const lng=parseFloat(item.dataset.lng);
  const input=document.getElementById(inputId);
  input.value=main;
  _acCoords[inputId]={lat,lng};
  _geocodeCache[main.trim().toLowerCase()]={lat,lng};
  const list=document.getElementById(listId);
  list.innerHTML='';list.classList.remove('open');
}

function acKeydown(e,listId){
  const list=document.getElementById(listId);
  const items=[...list.querySelectorAll('.autocomplete-item')];
  if(!items.length)return;
  const focused=list.querySelector('.focused');
  let idx=items.indexOf(focused);
  if(e.key==='ArrowDown'){e.preventDefault();if(focused)focused.classList.remove('focused');idx=Math.min(idx+1,items.length-1);items[idx].classList.add('focused');items[idx].scrollIntoView({block:'nearest'})}
  else if(e.key==='ArrowUp'){e.preventDefault();if(focused)focused.classList.remove('focused');idx=Math.max(idx-1,0);items[idx].classList.add('focused');items[idx].scrollIntoView({block:'nearest'})}
  else if(e.key==='Enter'&&focused){focused.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))}
  else if(e.key==='Escape'){list.innerHTML='';list.classList.remove('open')}
}

document.addEventListener('click',e=>{
  document.querySelectorAll('.autocomplete-list').forEach(list=>{
    const wrap=list.closest('.autocomplete-wrap');
    if(wrap&&!wrap.contains(e.target)){list.innerHTML='';list.classList.remove('open')}
  });
});

/* ══ Lightbox ══ */
function openLightbox(src){document.getElementById('lightbox-img').src=src;document.getElementById('lightbox').classList.add('open')}
function closeLightbox(e){if(!e||e.target!==document.getElementById('lightbox-img'))document.getElementById('lightbox').classList.remove('open')}
document.addEventListener('DOMContentLoaded',()=>{
  const c=document.querySelector('.lightbox-close');
  if(c)c.addEventListener('click',()=>document.getElementById('lightbox').classList.remove('open'));
});

/* ══ Photos (Wikipedia) ══ */
async function _fetchWikiPhoto(lieu){
  try{
    const r=await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(lieu)}&prop=pageimages&format=json&pithumbsize=600&origin=*`);
    const d=await r.json();
    const pages=d.query?.pages;
    if(!pages)return null;
    const page=Object.values(pages)[0];
    return page?.thumbnail?.source||null;
  }catch(e){return null}
}

async function _fetchFlickrPhoto(lieu){
  try{
    const r=await fetch(`https://api.flickr.com/services/feeds/photos_public.gne?tags=${encodeURIComponent(lieu)}&format=json&nojsoncallback=1`);
    const d=await r.json();
    const items=d.items||[];
    if(!items.length)return null;
    return items[0].media?.m?.replace('_m.jpg','_b.jpg')||items[0].media?.m||null;
  }catch(e){return null}
}

async function loadStepPhoto(di,si){
  const key=`${di}-${si}`;
  if(_photoCache[key])return _photoCache[key];
  const step=state.trip?.days[di]?.steps[si];
  if(!step||!step.lieu)return null;
  let url=await _fetchWikiPhoto(step.lieu);
  if(!url)url=await _fetchFlickrPhoto(step.lieu);
  if(url)_photoCache[key]=url;
  return url||null;
}

async function toggleStepPhoto(di,si){
  const key=`${di}-${si}`;
  const wrap=document.getElementById(`photos-wrap-${key}`);
  const btn=document.getElementById(`photo-btn-${key}`);
  if(!wrap||!btn)return;
  if(_photoOpen[key]){
    _photoOpen[key]=false;
    wrap.classList.remove('visible');
    btn.classList.remove('active');
    return;
  }
  btn.classList.add('active');
  wrap.classList.add('visible');
  wrap.innerHTML='<div class="photo-loading">Chargement…</div>';
  _photoOpen[key]=true;
  const url=await loadStepPhoto(di,si);
  if(!_photoOpen[key])return;
  if(url){
    wrap.innerHTML=`<img src="${url}" class="step-photo-img" loading="lazy" onclick="openLightbox('${url}')" alt="Photo ${esc(state.trip.days[di].steps[si].lieu)}"/>`;
  }else{
    wrap.innerHTML='<div class="photo-loading">Aucune photo trouvée</div>';
  }
}

/* ══ Sync champs ══ */
function syncTripName(v){if(state.trip){state.trip.name=v;saveToLocalStorage()}}
function syncDayName(di,v){state.trip.days[di].title=v;saveToLocalStorage()}
function syncDayNote(di,v){state.trip.days[di].note=v;saveToLocalStorage()}
function syncStepLabel(di,si,v){state.trip.days[di].steps[si].label=v;saveToLocalStorage()}
function syncStepNote(di,si,v){state.trip.days[di].steps[si].note=v;saveToLocalStorage()}

function syncStepLieu(di,si,v){
  state.trip.days[di].steps[si].lieu=v;
  saveToLocalStorage();
const key=`${di}-${si}`;
  const hasLieu=!!(v&&v.trim());
  if(!hasLieu){
    delete _photoCache[key];_photoOpen[key]=false;
    const wrap=document.getElementById(`photos-wrap-${key}`);
    const btn=document.getElementById(`photo-btn-${key}`);
    if(wrap)wrap.classList.remove('visible');
    if(btn){btn.classList.remove('active');btn.style.display='none'}
    ['map-btn','search-btn'].forEach(id=>{const el=document.getElementById(`${id}-${key}`);if(el)el.style.display='none'});
  }else{
    delete _photoCache[key];
    ['photo-btn','map-btn','search-btn'].forEach(id=>{const el=document.getElementById(`${id}-${key}`);if(el)el.style.display=''});
  }
}
/* ══ Suppression voyage ══ */
function resetTrip(){
  deleteCurrentTrip();
  closeModal('modal-reset');
}
/* ══ Création voyage ══ */
function createTrip(){
  const name=document.getElementById('trip-name-input').value.trim();
  const days=Math.max(1,parseInt(document.getElementById('trip-days').value)||1);
  const startDate=document.getElementById('trip-start').value||null;
  if(!name){
    document.getElementById('trip-name-input').focus();
    return;
  }

  const startRef=startDate?new Date(startDate):null;
  state.trip={
    name,
    days:Array.from({length:days},(_,i)=>{
      let dateLabel='';
      if(startRef){
        const d=new Date(startRef);
        d.setDate(d.getDate()+i);
        dateLabel=d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'});
      }
      return {title:'',note:'',dateLabel,steps:[],transport:null,hebergement:null};
    }),
    startDate
  };

  state.docs=[];
  state.budget=[];
  state.participants=[...DEFAULT_PARTICIPANTS];
  tripsStore.activeTripId=makeTripId();
  _budgetPayer=state.participants[0]||null;
  _budgetFor=new Set(state.participants);

  saveToLocalStorage();
  closeModal('modal-new-trip');
  renderTripSwitcher();
  renderItinerary();
  renderDocs();
  renderBudget();

  setTimeout(()=>{
    const c=document.querySelector('[data-day="0"]');
    if(c)c.classList.add('expanded');
  },80);

  const bb=document.getElementById('btn-back');
  if(bb)bb.classList.add('visible');
  showToast(`Voyage "${name}" créé ✓`);
}

/* ══ Étapes ══ */
function openAddStepModal(di){
  document.getElementById('step-day-index').value=di;
  document.getElementById('step-time').value='09:00';
  document.getElementById('step-label-input').value='';
  document.getElementById('step-lieu-input').value='';
  document.getElementById('step-transport-input').value='';
  document.getElementById('step-link-input').value='';
  document.getElementById('step-note-input').value='';
  const list=document.getElementById('step-lieu-list');
  if(list){list.innerHTML='';list.classList.remove('open')}
  delete _acCoords['step-lieu-input'];
  openModal('modal-add-step');
}

function addStep(){
  const di=parseInt(document.getElementById('step-day-index').value);
  const time=document.getElementById('step-time').value;
  const label=document.getElementById('step-label-input').value.trim();
  const lieu=document.getElementById('step-lieu-input').value.trim();
  const transport=document.getElementById('step-transport-input').value;
  const note=document.getElementById('step-note-input').value.trim();
  const link=document.getElementById('step-link-input').value.trim();
  const prix=parseFloat(document.getElementById('step-prix-input').value)||0;
  const paidBy=document.getElementById('step-paidby-input').value||state.participants[0];
  const ajouterBudget=document.getElementById('step-add-budget').checked;
  if(!label){document.getElementById('step-label-input').focus();return}
  if(_acCoords['step-lieu-input']&&lieu){_geocodeCache[lieu.trim().toLowerCase()]=_acCoords['step-lieu-input']}
  state.trip.days[di].steps.push({time,label,lieu,transport,note,link,subpoints:[]});
  state.trip.days[di].steps.sort((a,b)=>a.time.localeCompare(b.time));
  if(prix>0&&ajouterBudget){
  state.budget.push({
    cat:'Activité',
    desc:label,
    amount:prix,
    paidBy,
    forParticipants:['__all__'],
    _stepRef:`${di}-${state.trip.days[di].steps.length-1}`
  });
}
  saveToLocalStorage();
  closeModal('modal-add-step');
  renderItinerary();
  setTimeout(()=>{const c=document.querySelector(`[data-day="${di}"]`);if(c)c.classList.add('expanded')},50);
  showToast(prix>0&&ajouterBudget?'Étape ajoutée + dépense au budget ✓':'Étape ajoutée');
}

/* ══ Modal édition étape ══ */
function openEditStepModal(di,si){
  const step=state.trip.days[di].steps[si];
  document.getElementById('edit-step-di').value=di;
  document.getElementById('edit-step-si').value=si;
  document.getElementById('edit-step-time').value=step.time||'09:00';
  document.getElementById('edit-step-label').value=step.label||'';
  document.getElementById('edit-step-lieu').value=step.lieu||'';
  document.getElementById('edit-step-transport').value=step.transport||'';
  document.getElementById('edit-step-link').value=step.link||'';
  document.getElementById('edit-step-note').value=step.note||'';
  document.getElementById('edit-step-amount').value=step.amount||'';
  const pbSel=document.getElementById('edit-step-paidby');
  refreshPaidBySelect(pbSel);
  pbSel.value=step.paidBy||state.participants[0]||'';
  const list=document.getElementById('edit-step-lieu-list');
  if(list){list.innerHTML='';list.classList.remove('open')}
  delete _acCoords['edit-step-lieu'];
  openModal('modal-edit-step');
}

function saveEditStep(){
  const di=parseInt(document.getElementById('edit-step-di').value);
  const si=parseInt(document.getElementById('edit-step-si').value);
  const newTime=document.getElementById('edit-step-time').value;
  const newLabel=document.getElementById('edit-step-label').value.trim();
  const newLieu=document.getElementById('edit-step-lieu').value.trim();
  const newTransport=document.getElementById('edit-step-transport').value;
  const newLink=document.getElementById('edit-step-link').value.trim();
  const newNote=document.getElementById('edit-step-note').value.trim();
  const newAmount=parseFloat(document.getElementById('edit-step-amount').value)||0;
  const newPaidBy=document.getElementById('edit-step-paidby').value||state.participants[0]||'';
  if(!newLabel){document.getElementById('edit-step-label').focus();return}
  const step=state.trip.days[di].steps[si];
  const oldLieu=step.lieu||'';
  step.time=newTime;step.label=newLabel;step.lieu=newLieu;step.transport=newTransport;
  step.link=newLink;step.note=newNote;step.amount=newAmount;step.paidBy=newPaidBy;
  if(_acCoords['edit-step-lieu']&&newLieu){_geocodeCache[newLieu.trim().toLowerCase()]=_acCoords['edit-step-lieu']}
  if(oldLieu!==newLieu){const key=`${di}-${si}`;delete _photoCache[key];_photoOpen[key]=false}
  // Mise à jour ou création dans le budget si un prix est défini
  if(newAmount>0){
  const existing=state.budget.findIndex(b=>b._stepRef===`${di}-${si}`);
  if(existing>=0){
    state.budget[existing].amount=newAmount;
    state.budget[existing].paidBy=newPaidBy;
    state.budget[existing].desc=newLabel;
    if(!state.budget[existing].forParticipants)state.budget[existing].forParticipants=['__all__'];
  }else{
    state.budget.push({
      cat:'Activité',
      desc:newLabel,
      amount:newAmount,
      paidBy:newPaidBy,
      forParticipants:['__all__'],
      _stepRef:`${di}-${si}`
    });
  }
}
  state.trip.days[di].steps.sort((a,b)=>a.time.localeCompare(b.time));
  saveToLocalStorage();
  closeModal('modal-edit-step');
  renderItinerary();
  setTimeout(()=>{const c=document.querySelector(`[data-day="${di}"]`);if(c)c.classList.add('expanded')},50);
  showToast('Étape modifiée ✓');
}

function deleteStep(di,si){
  const key=`${di}-${si}`;delete _photoCache[key];delete _photoOpen[key];
  state.trip.days[di].steps.splice(si,1);
  saveToLocalStorage();renderItinerary();
}

const TRANSPORT_EMOJI={pied:'🚶',voiture:'🚗',train:'🚆',avion:'✈️',bus:'🚌',bateau:'⛴️'};

function enableTransport(di){state.trip.days[di].transport={type:'train',duree:'',lien:''};saveToLocalStorage();renderItinerary();setTimeout(()=>{const c=document.querySelector(`[data-day="${di}"]`);if(c)c.classList.add('expanded')},50)}
function removeTransport(di){state.trip.days[di].transport=null;saveToLocalStorage();renderItinerary()}
function syncTransport(di,f,v){if(!state.trip.days[di].transport)state.trip.days[di].transport={type:'train',duree:'',lien:''};state.trip.days[di].transport[f]=v;saveToLocalStorage()}
function enableHebergement(di){state.trip.days[di].hebergement={nom:'',lien:''};saveToLocalStorage();renderItinerary();setTimeout(()=>{const c=document.querySelector(`[data-day="${di}"]`);if(c)c.classList.add('expanded')},50)}
function removeHebergement(di){state.trip.days[di].hebergement=null;saveToLocalStorage();renderItinerary()}
function syncHebergement(di,f,v){if(!state.trip.days[di].hebergement)state.trip.days[di].hebergement={nom:'',lien:''};state.trip.days[di].hebergement[f]=v;saveToLocalStorage()}

/* ══ Docs ══ */
function addDoc(){
  const cat=document.getElementById('doc-cat-input').value;
  const label=document.getElementById('doc-label-input').value.trim();
  const value=document.getElementById('doc-value-input').value.trim();
  if(!label){document.getElementById('doc-label-input').focus();return}
  state.docs.push({cat,label,value});saveToLocalStorage();
  document.getElementById('doc-label-input').value='';
  document.getElementById('doc-value-input').value='';
  renderDocs();
}
function deleteDoc(i){state.docs.splice(i,1);saveToLocalStorage();renderDocs()}
function syncDocLabel(i,v){state.docs[i].label=v;saveToLocalStorage()}
function syncDocValue(i,v){state.docs[i].value=v;saveToLocalStorage()}
function renderDocs(){
  const list=document.getElementById('doc-list');if(!list)return;
  list.innerHTML=state.docs.length
    ?state.docs.map((d,i)=>`<div class="doc-item"><div class="doc-category">${esc(d.cat)}</div><input class="doc-label" type="text" value="${esc(d.label)}" oninput="syncDocLabel(${i},this.value)" placeholder="Description"/><input class="doc-value" type="text" value="${esc(d.value)}" oninput="syncDocValue(${i},this.value)" placeholder="N° / lien"/><button class="doc-del" onclick="deleteDoc(${i})"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`).join('')
    :`<div style="color:var(--faint);font-size:.92rem;padding:1rem 0">Aucun document.</div>`;
}

/* ══ Budget ══ */
function _refreshBudgetDaySelect(){
  const sel=document.getElementById('budget-day-input');
  if(!sel)return;
  sel.innerHTML='<option value="">— Jour (optionnel)</option>';
  if(state.trip&&state.trip.days){
    state.trip.days.forEach((d,i)=>{
      const label=d.title||d.dateLabel||`Jour ${i+1}`;
      sel.innerHTML+=`<option value="${i}">Jour ${i+1} – ${label}</option>`;
    });
  }
}

function addBudgetItem(){
  const cat=document.getElementById('budget-cat-input').value;
  const desc=document.getElementById('budget-desc-input').value.trim();
  const amount=parseFloat(document.getElementById('budget-amount-input').value)||0;
  const paidBy=_budgetPayer||state.participants[0]||'';
  if(!desc){
    document.getElementById('budget-desc-input').focus();
    return;
  }

  const everyoneSelected=_budgetFor.size===state.participants.length && state.participants.every(p=>_budgetFor.has(p));
  const forParticipants=everyoneSelected?['__all__']:[..._budgetFor];
  if(!forParticipants.length){
    showToast('Sélectionne au moins un destinataire');
    return;
  }

  state.budget.push({cat,desc,amount,paidBy,forParticipants});
  saveToLocalStorage();
  document.getElementById('budget-desc-input').value='';
  document.getElementById('budget-amount-input').value='';
  _budgetFor=new Set(state.participants);
  renderBudget();
}

function setBudgetPayer(p){
  _budgetPayer=p;
  renderBudget();
}

function setBudgetFor(person){
  if(person==='__all__'){
    _budgetFor=new Set(state.participants);
    renderBudget();
    return;
  }
  if(_budgetFor.has(person))_budgetFor.delete(person);
  else _budgetFor.add(person);
  renderBudget();
}

function getExpenseTargets(b){
  if(!b?.forParticipants || !Array.isArray(b.forParticipants) || !b.forParticipants.length){
    return [...state.participants];
  }
  if(b.forParticipants.includes('__all__')){
    return [...state.participants];
  }
  return b.forParticipants.filter(p=>state.participants.includes(p));
}

function getContrastText(hex){
  const clean=(hex||'').replace('#','');
  if(clean.length!==6)return '#0f172a';
  const r=parseInt(clean.slice(0,2),16);
  const g=parseInt(clean.slice(2,4),16);
  const b=parseInt(clean.slice(4,6),16);
  const yiq=((r*299)+(g*587)+(b*114))/1000;
  return yiq>=150?'#0f172a':'#ffffff';
}

function deleteBudgetItem(i){
  state.budget.splice(i,1);
  saveToLocalStorage();
  renderBudget();
}

function syncBudgetDesc(i,v){
  state.budget[i].desc=v;
  saveToLocalStorage();
}

function syncBudgetAmount(i,v){
  state.budget[i].amount=parseFloat(v)||0;
  saveToLocalStorage();
  renderBudget();
}

function supprimerParticipant(i){
  const nom=state.participants[i];
  if(nom===undefined)return;
  if(state.participants.length<=1){showToast('Au moins une personne requise');return}
  state.participants.splice(i,1);
  _budgetFor.delete(nom);
  if(_budgetPayer===nom)_budgetPayer=state.participants[0]||null;
  saveToLocalStorage();
  renderBudget();
}

function ajouterParticipant(){
  const input=document.getElementById('new-participant-input');
  const nom=input?input.value.trim():'';
  if(!nom||state.participants.includes(nom))return;
  state.participants.push(nom);
  _budgetFor.add(nom);
  if(input)input.value='';
  saveToLocalStorage();
  renderBudget();
}

let _budgetTab='overview';
function setBudgetTab(t){_budgetTab=t;renderBudget()}

function renderBudget(){
  const fmt=n=>(parseFloat(n)||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';

  const total=state.budget.reduce((s,b)=>s+(parseFloat(b.amount)||0),0);
  const n=state.participants.length||1;
  const perHead=total/n;
  const soldes={}; state.participants.forEach(p=>soldes[p]=0);
  const paidByP={}; state.participants.forEach(p=>paidByP[p]=0);
  const catTotals={};
  state.budget.forEach(b=>{
    const amount=parseFloat(b.amount)||0;
    catTotals[b.cat]=(catTotals[b.cat]||0)+amount;
    const targets=getExpenseTargets(b);
    if(b.paidBy&&soldes[b.paidBy]!==undefined){soldes[b.paidBy]+=amount;paidByP[b.paidBy]+=amount}
    if(targets.length){const share=amount/targets.length;targets.forEach(p=>{if(soldes[p]!==undefined)soldes[p]-=share})}
  });

  const hero=document.getElementById('budget-hero');
  if(hero){
    hero.innerHTML=`
      <div class="bdg-hero-main">
        <div class="bdg-hero-label">Total du voyage</div>
        <div class="bdg-hero-total">${(parseFloat(total)||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})}<span class="bdg-hero-cur">€</span></div>
        <div class="bdg-hero-sub">${state.budget.length} dépense${state.budget.length>1?'s':''} · ${fmt(perHead)} / personne</div>
      </div>
      <div class="bdg-hero-people">
        ${state.participants.map((p,i)=>{
          const c=BUDGET_COLORS[i%BUDGET_COLORS.length];
          return `<div class="bdg-hero-chip"><span class="bdg-dot" style="background:${c}"></span><span class="bdg-hero-name">${esc(p)}</span><button class="bdg-hero-x" title="Retirer" onclick="supprimerParticipant(${i})">×</button></div>`;
        }).join('')}
        <input id="new-participant-input" class="bdg-hero-add" type="text" placeholder="+ personne" onkeydown="if(event.key==='Enter')ajouterParticipant()"/>
      </div>`;
  }

  const tabs=document.getElementById('budget-tabs');
  if(tabs){
    const T=[['overview','Aperçu'],['expenses','Dépenses'],['balance','Équilibre']];
    tabs.innerHTML=T.map(([k,l])=>`<button class="bdg-tab ${_budgetTab===k?'is-active':''}" onclick="setBudgetTab('${k}')">${l}${k==='expenses'?` <span class="bdg-tab-count">${state.budget.length}</span>`:''}</button>`).join('');
  }

  const body=document.getElementById('budget-tab-body');
  if(!body)return;

  if(_budgetTab==='overview'){
    const cats=Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
    body.innerHTML=`
      <div class="bdg-kpis">
        ${state.participants.map((p,i)=>{
          const c=BUDGET_COLORS[i%BUDGET_COLORS.length];
          const diff=soldes[p]||0;
          return `<div class="bdg-kpi" style="--c:${c}">
            <div class="bdg-kpi-top"><span class="bdg-dot" style="background:${c}"></span>${esc(p)}</div>
            <div class="bdg-kpi-val">${fmt(paidByP[p])}</div>
            <div class="bdg-kpi-sub">${diff>=0.005?'récupère '+fmt(Math.abs(diff)):diff<=-0.005?'doit '+fmt(Math.abs(diff)):'à jour'}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="bdg-section-h">Répartition par catégorie</div>
      ${cats.length?`<div class="bdg-cat-list">
        ${cats.map(([cat,amt])=>{
          const c=CAT_COLORS[cat]||'#ffa726';
          const pct=total>0?Math.round(amt/total*100):0;
          return `<div class="bdg-cat-row">
            <div class="bdg-cat-head"><span>${CAT_EMOJI[cat]||'📦'} ${esc(cat)}</span><span class="bdg-cat-amt">${fmt(amt)} · ${pct}%</span></div>
            <div class="bdg-cat-track"><div class="bdg-cat-fill" style="width:${pct}%;background:${c}"></div></div>
          </div>`;
        }).join('')}
      </div>`:`<div class="bdg-empty">Aucune dépense à analyser.</div>`}`;
  }
  else if(_budgetTab==='expenses'){
    if(!_budgetPayer)_budgetPayer=state.participants[0]||null;
    const everyone=state.participants.length>0&&state.participants.every(p=>_budgetFor.has(p));
    body.innerHTML=`
      <details class="bdg-add">
        <summary class="bdg-add-summary">＋ Ajouter une dépense</summary>
        <div class="bdg-add-body">
          <div class="bdg-add-row">
            <select id="budget-cat-input" class="budget-field">
              <option value="Transport">🚗 Transport</option><option value="Logement">🏠 Logement</option>
              <option value="Activité">🎯 Activité</option><option value="Repas">🍽️ Repas</option><option value="Divers">📦 Divers</option>
            </select>
            <input id="budget-desc-input" class="budget-field budget-field-grow" type="text" placeholder="Description..."/>
            <input id="budget-amount-input" class="budget-field budget-field-amount" type="number" placeholder="0.00" step="0.01" min="0"/>
          </div>
          <div class="bdg-add-label">Qui a payé ?</div>
          <div id="budget-payer-btns" class="budget-chip-row">${state.participants.map((p,i)=>{const c=BUDGET_COLORS[i%BUDGET_COLORS.length];const a=_budgetPayer===p;return `<button class="budget-chip ${a?'is-active':'is-inactive'}" onclick="setBudgetPayer('${esc(p)}')" style="${a?`background:${c};border-color:${c};color:${getContrastText(c)}`:''}">${esc(p)}</button>`}).join('')}</div>
          <div class="bdg-add-label">Pour qui ?</div>
          <div id="budget-for-btns" class="budget-chip-row">
            <button class="budget-chip ${everyone?'is-active':'is-inactive'}" onclick="setBudgetFor('__all__')" style="${everyone?'background:#cbd5e1;border-color:#cbd5e1;color:#0f172a':''}">Tout le monde</button>
            ${state.participants.map((p,i)=>{const c=BUDGET_COLORS[i%BUDGET_COLORS.length];const a=_budgetFor.has(p);return `<button class="budget-chip ${a?'is-active':'is-inactive'}" onclick="setBudgetFor('${esc(p)}')" style="${a?`background:${c};border-color:${c};color:${getContrastText(c)}`:''}">${esc(p)}</button>`}).join('')}
          </div>
          <button class="btn-primary bdg-add-btn" onclick="addBudgetItem()">Ajouter la dépense</button>
        </div>
      </details>
      ${state.budget.length?`<div class="budget-list">${state.budget.map((b,i)=>{
        const pi=state.participants.indexOf(b.paidBy);
        const c=pi>=0?BUDGET_COLORS[pi%BUDGET_COLORS.length]:'#888';
        const targets=getExpenseTargets(b);
        const tl=(b.forParticipants||[]).includes('__all__')?'Tout le monde':targets.join(', ');
        return `<div class="bdg-exp">
          <span class="bdg-exp-emoji" style="background:${(CAT_COLORS[b.cat]||'#ffa726')}22">${CAT_EMOJI[b.cat]||'📦'}</span>
          <div class="bdg-exp-mid">
            <div class="bdg-exp-desc">${esc(b.desc)}</div>
            <div class="bdg-exp-meta"><span class="bdg-exp-payer" style="color:${c};background:${c}18">${esc(b.paidBy||'?')}</span><span class="bdg-exp-for">→ ${esc(tl||'—')}</span></div>
          </div>
          <span class="bdg-exp-amt">${fmt(b.amount)}</span>
          <button class="bdg-exp-del" onclick="deleteBudgetItem(${i})" title="Supprimer">×</button>
        </div>`;
      }).join('')}</div>`:`<div class="bdg-empty"><div class="bdg-empty-emoji">🧾</div>Aucune dépense pour l'instant.<br><span>Ajoute-en une avec le panneau ci-dessus.</span></div>`}`;
  }
  else {
    const doit=Object.entries(soldes).filter(([,v])=>v<-0.005).map(([p,v])=>({p,v})).sort((a,b)=>a.v-b.v);
    const recoit=Object.entries(soldes).filter(([,v])=>v>0.005).map(([p,v])=>({p,v})).sort((a,b)=>b.v-a.v);
    let h=`<div class="bdg-bal-cards">${state.participants.map((p,i)=>{
      const c=BUDGET_COLORS[i%BUDGET_COLORS.length];const diff=soldes[p]||0;const pos=diff>=0;
      return `<div class="bdg-bal-card" style="--c:${c}">
        <div class="bdg-bal-name">${esc(p)}</div>
        <div class="bdg-bal-paid">${fmt(paidByP[p])} payés</div>
        <div class="bdg-bal-diff ${pos?'is-pos':'is-neg'}">${Math.abs(diff)<0.005?'équilibré':(pos?'↗ récupère ':'↘ doit ')+fmt(Math.abs(diff))}</div>
      </div>`;
    }).join('')}</div>`;
    if(!doit.length){
      h+=`<div class="bdg-settled">✅ Tout est équilibré !</div>`;
    }else{
      h+=`<div class="bdg-section-h">Remboursements à faire</div><div class="bdg-transfers">`;
      const d=doit.map(x=>({...x})),r=recoit.map(x=>({...x}));
      while(d.length&&r.length){
        const m=Math.min(-d[0].v,r[0].v);
        if(m>0.005){
          const ci=state.participants.indexOf(d[0].p),cj=state.participants.indexOf(r[0].p);
          const cd=BUDGET_COLORS[ci>=0?ci%BUDGET_COLORS.length:1],cr=BUDGET_COLORS[cj>=0?cj%BUDGET_COLORS.length:0];
          h+=`<div class="bdg-transfer"><span class="bdg-tr-from" style="color:${cd}">${esc(d[0].p)}</span><span class="bdg-tr-arrow">→</span><span class="bdg-tr-amt">${fmt(m)}</span><span class="bdg-tr-to" style="color:${cr}">${esc(r[0].p)}</span></div>`;
        }
        d[0].v+=m;r[0].v-=m;
        if(Math.abs(d[0].v)<0.005)d.shift();
        if(Math.abs(r[0].v)<0.005)r.shift();
      }
      h+=`</div>`;
    }
    body.innerHTML=h;
  }
}


function refreshPaidBySelect(sel){
  if(!sel)return;
  const cur=sel.value;
  sel.innerHTML=state.participants.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
  if(state.participants.includes(cur))sel.value=cur;
  else sel.value=state.participants[0]||'';
}

/* ══ Carte Leaflet + OSRM ══ */
const ROUTE_COLORS={pied:'#00e5ff',voiture:'#00e676',train:'#448aff',avion:'#ff6d00',bus:'#ffea00',bateau:'#e040fb',default:'#00e676'};

function initMap(){
  if(_mapInited&&_map)return;
  const container=document.getElementById('map');if(!container)return;
  _map=L.map('map',{zoomControl:true,attributionControl:false});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:''}).addTo(_map);
  _mapInited=true;
}

async function geocode(lieu){
  if(!lieu||!lieu.trim())return null;
  const key=lieu.trim().toLowerCase();
  if(_geocodeCache[key])return _geocodeCache[key];
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(lieu)}&format=json&limit=1`,{headers:{'Accept-Language':'fr'}});
    const data=await r.json();
    if(data&&data.length>0){const res={lat:parseFloat(data[0].lat),lng:parseFloat(data[0].lon)};_geocodeCache[key]=res;return res}
  }catch(e){}
  return null;
}

async function getOsrmRoute(from,to,profile){
  try{
    const url=`https://router.project-osrm.org/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const r=await fetch(url);
    const data=await r.json();
    if(data.code==='Ok'&&data.routes&&data.routes.length>0)
      return data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);
  }catch(e){}
  return[[from.lat,from.lng],[to.lat,to.lng]];
}

function _osrmProfile(transport){
  if(transport==='pied')return'foot';
  if(transport==='voiture')return'driving';
  if(transport==='vélo')return'cycling';
  return'driving';
}

async function renderMap(){
  if(!_map||!state.trip)return;
  _mapMarkers.forEach(m=>_map.removeLayer(m));
  _mapRoutes.forEach(r=>_map.removeLayer(r));
  _mapMarkers=[];_mapRoutes=[];
  const allCoords=[];
  for(const[di,day]of state.trip.days.entries()){
    const stepCoords=[];
    for(const[si,step]of day.steps.entries()){
      if(!step.lieu)continue;
      const coord=await geocode(step.lieu);
      if(!coord)continue;
      allCoords.push([coord.lat,coord.lng]);
      stepCoords.push({coord,step,di,si});
      const color=ROUTE_COLORS[step.transport]||ROUTE_COLORS.default;
      const icon=L.divIcon({className:'',html:`<div style="background:${color};width:26px;height:26px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#111;box-shadow:0 2px 6px rgba(0,0,0,.4)">${di+1}</div>`,iconSize:[26,26],iconAnchor:[13,13]});
      const marker=L.marker([coord.lat,coord.lng],{icon}).addTo(_map);
      marker.bindPopup(`<strong>${esc(step.label)}</strong><br/><span style="font-size:.82rem">${esc(step.lieu)}</span>${step.time?`<br/><span style="font-size:.78rem;color:#888">${esc(step.time)}</span>`:''}`);
      _mapMarkers.push(marker);
    }
    if(stepCoords.length>1){
      for(let i=0;i<stepCoords.length-1;i++){
        const from=stepCoords[i].coord;
        const to=stepCoords[i+1].coord;
        const transport=stepCoords[i+1].step.transport||'';
        const color=ROUTE_COLORS[transport]||ROUTE_COLORS.default;
        let latlngs;
        if(['pied','voiture'].includes(transport)){
          latlngs=await getOsrmRoute(from,to,_osrmProfile(transport));
        }else if(transport==='avion'||transport==='bateau'){
          latlngs=[[from.lat,from.lng],[to.lat,to.lng]];
        }else{
          latlngs=await getOsrmRoute(from,to,'driving');
        }
        const line=L.polyline(latlngs,{color,weight:3,opacity:.8,dashArray:transport==='avion'?'6,6':null}).addTo(_map);
        _mapRoutes.push(line);
      }
    }
  }
  if(allCoords.length>0){
    if(allCoords.length===1)_map.setView(allCoords[0],13);
    else _map.fitBounds(allCoords,{padding:[40,40]});
  }
}

function focusOnMap(di,si){
  const step=state.trip&&state.trip.days[di]&&state.trip.days[di].steps[si];
  if(!step||!step.lieu){showToast('Aucun lieu pour cette étape');return}
  switchView('map');
  setTimeout(async()=>{
    initMap();
    await renderMap();
    const coord=await geocode(step.lieu);
    if(!coord){showToast('Lieu introuvable');return}
    _map.flyTo([coord.lat,coord.lng],15,{animate:true,duration:1.2});
    _mapMarkers.forEach(m=>{
      const p=m.getLatLng();
      if(Math.abs(p.lat-coord.lat)<0.001&&Math.abs(p.lng-coord.lng)<0.001)m.openPopup();
    });
  },350);
}

/* ══ Statut du jour ══ */
function getTripDayStatus(di){
  if(!state.trip||!state.trip.startDate)return'future';
  const today=new Date();today.setHours(0,0,0,0);
  const start=new Date(state.trip.startDate);start.setHours(0,0,0,0);
  const dayDate=new Date(start);dayDate.setDate(dayDate.getDate()+di);
  if(dayDate<today)return'past';
  if(dayDate.getTime()===today.getTime())return'today';
  return'future';
}

function getDaysUntil(di){
  if(!state.trip||!state.trip.startDate)return null;
  const today=new Date();today.setHours(0,0,0,0);
  const start=new Date(state.trip.startDate);start.setHours(0,0,0,0);
  const dayDate=new Date(start);dayDate.setDate(dayDate.getDate()+di);
  return Math.round((dayDate-today)/86400000);
}

/* ══ État vue itinéraire ══ */
let _activeDay=0;
let _itinExpanded=false;
function setActiveDay(di){_activeDay=di;renderItinerary();if(!_itinExpanded){const g=document.getElementById('days-grid');if(g)g.scrollIntoView({behavior:'smooth',block:'nearest'})}}
function toggleItinExpand(){_itinExpanded=!_itinExpanded;renderItinerary()}

/* ══ Rendu carte de jour ══ */
function toggleDay(di){const c=document.querySelector(`[data-day="${di}"]`);if(c)c.classList.toggle('expanded')}

function renderDayCard(day,di){
const stepsHtml=day.steps.map((step,si)=>{
  const key=`${di}-${si}`;
  const transportLabel=step.transport?step.transport.charAt(0).toUpperCase()+step.transport.slice(1):'';
  return `<div class="tl-step">
    <div class="tl-marker"><div class="tl-dot"></div></div>
    <div class="tl-card">
      <div class="tl-card-head">
        <span class="tl-time">${esc(step.time)}</span>
        <div class="tl-step-actions">
          <button class="tl-act" onclick="openEditStepModal(${di},${si})" title="Modifier"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="tl-act tl-act-del" onclick="deleteStep(${di},${si})" title="Supprimer"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <input class="step-label tl-label" type="text" value="${esc(step.label)}" oninput="syncStepLabel(${di},${si},this.value)" placeholder="Titre de l'étape"/>
      <div class="step-lieu-row tl-lieu-row">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--faint);flex-shrink:0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
        <input class="step-lieu" type="text" value="${esc(step.lieu||'')}" oninput="syncStepLieu(${di},${si},this.value)" placeholder="Lieu…"/>
        <button class="step-map-btn" id="map-btn-${key}" onclick="focusOnMap(${di},${si})" title="Voir sur la carte" style="${step.lieu&&step.lieu.trim()?'':'display:none'}">📍</button>
      </div>
      <div class="tl-tags">
        ${transportLabel?`<span class="tl-tag tl-tag-transport">🚗 ${esc(transportLabel)}</span>`:''}
        ${step.link?`<a href="${esc(step.link)}" target="_blank" rel="noopener noreferrer" class="tl-tag tl-tag-link"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Lien</a>`:''}
      </div>
      <textarea class="step-note tl-note" placeholder="Note…" rows="1" oninput="syncStepNote(${di},${si},this.value)">${esc(step.note||'')}</textarea>
    </div>
  </div>`;
}).join('');

const subtitle=`${day.steps.length} étape${day.steps.length!==1?'s':''}`;
const status=getTripDayStatus(di);
const statusLabel=status==='today'?'Aujourd\u2019hui':status==='past'?'Passé':'À venir';
const pastClass=status==='past'?' day-past':status==='today'?' day-today':'';
const hasNote=!!(day.note&&day.note.trim());
return `<div class="day-card itin-daycard${pastClass} expanded" data-day="${di}">
  <div class="itin-day-head">
    <div class="itin-day-badge itin-day-badge-${status}">
      <span class="itin-day-badge-num">${di+1}</span>
      <span class="itin-day-badge-jour">Jour</span>
    </div>
    <div class="itin-day-headinfo">
      <input class="day-name-input itin-day-name" type="text" value="${esc(day.title)}" placeholder="Nommer la journée…" oninput="syncDayName(${di},this.value)"/>
      <div class="itin-day-meta">
        <span class="itin-day-status itin-day-status-${status}">${statusLabel}</span>
        ${day.dateLabel?`<span class="itin-day-date">${esc(day.dateLabel)}</span>`:''}
        <span class="itin-day-dot">·</span><span>${subtitle}</span>
      </div>
    </div>
  </div>

  <div class="itin-day-body">
    ${day.steps.length
      ?`<div class="tl-list">${stepsHtml}</div>`
      :`<div class="itin-day-empty"><div class="itin-day-empty-emoji">🗺️</div><div class="itin-day-empty-t">Journée libre</div><div class="itin-day-empty-s">Ajoute une première étape pour planifier ce jour.</div></div>`}

    <button class="add-step-btn itin-add-step" onclick="openAddStepModal(${di})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Ajouter une étape</button>

    <details class="itin-day-note" ${hasNote?'open':''}>
      <summary class="itin-day-note-sum">📝 Note du jour${hasNote?'':' <span class="itin-day-note-hint">(optionnel)</span>'}</summary>
      <textarea class="day-note-textarea itin-day-note-ta" placeholder="Informations générales…" rows="2" oninput="syncDayNote(${di},this.value)">${esc(day.note||'')}</textarea>
    </details>
  </div>
</div>`;
}

/* ══ Rendu itinéraire ══ */
function renderItinerary(){
  const c=document.getElementById('view-itinerary');if(!c)return;
  const bb=document.getElementById('btn-back');
  if(bb)bb.classList.toggle('visible',!!state.trip);
  if(!state.trip){
  c.innerHTML=`
    <div style="padding:1.6rem .25rem 0">
      <div style="position:relative;overflow:hidden;border-radius:26px;padding:2.4rem 1.8rem;
                  background:linear-gradient(180deg,var(--surface),var(--surface2));
                  box-shadow:var(--shadow3)">
        <div style="position:absolute;inset:0;pointer-events:none;border-radius:26px;box-shadow:inset 0 0 0 1px var(--border)"></div>
        <div style="position:absolute;right:-60px;bottom:-80px;width:280px;height:280px;border-radius:50%;
                    background:radial-gradient(circle,var(--accent-soft),transparent 70%);pointer-events:none"></div>
        <div style="position:relative;max-width:640px">
          <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);margin-bottom:1rem">
            Voyage Planner
          </div>
          <h1 style="font-family:var(--display);font-style:italic;font-size:clamp(2.2rem,5vw,3.6rem);line-height:1.04;font-weight:400;letter-spacing:-.01em;color:var(--text);margin:0 0 .9rem">
            Crée ton prochain itinéraire en quelques secondes
          </h1>
          <p style="font-size:1.02rem;color:var(--muted);max-width:46ch;line-height:1.6;margin:0 0 1.6rem">
            Prépare un road trip, une escapade ou des vacances complètes avec un plan clair, un budget partagé et tous tes documents au même endroit.
          </p>
          <div style="display:flex;gap:.7rem;flex-wrap:wrap;align-items:center;margin:0 0 1.4rem">
            <button type="button" id="welcome-new-trip-btn" style="border:none;background:linear-gradient(180deg,var(--accent-hover),var(--accent));color:var(--accent-contrast);padding:.95rem 1.4rem;border-radius:999px;font-weight:700;font-size:.95rem;cursor:pointer;box-shadow:0 12px 26px rgba(180,132,62,.28);display:inline-flex;align-items:center;gap:.5rem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nouveau voyage
            </button>
            <button type="button" id="welcome-import-btn" style="border:1px solid var(--border);background:transparent;color:var(--text);padding:.95rem 1.2rem;border-radius:999px;font-weight:600;font-size:.95rem;cursor:pointer">
              Importer un fichier JSON
            </button>
          </div>

        </div>
      </div>
    </div>
  `;

  attachWelcomeActions();
  return;
}
  const t=state.trip;
  const total=t.days.reduce((a,d)=>a+d.steps.length,0);
  const filledDays=t.days.filter(d=>d.steps.length>0).length;
  const pct=t.days.length?Math.round(filledDays/t.days.length*100):0;
  if(typeof _activeDay!=='number'||_activeDay<0||_activeDay>=t.days.length){
    const todayIdx=t.days.findIndex((d,i)=>getTripDayStatus(i)==='today');
    _activeDay=todayIdx>=0?todayIdx:0;
  }
  const datesLabel=t.startDate?(()=>{
    const s=new Date(t.startDate);const e=new Date(s);e.setDate(e.getDate()+t.days.length-1);
    const f=d=>d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    return `${f(s)} – ${f(e)}`;
  })():`${t.days.length} jours`;

  c.innerHTML=`
  <div class="itin-cockpit">
    <div class="itin-cockpit-top">
      <div class="itin-cockpit-id">
        <div class="itin-kicker">Itinéraire</div>
        <div class="trip-name" contenteditable="true" spellcheck="false" onblur="syncTripName(this.textContent.trim())" onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}">${esc(t.name)}</div>
        <div class="itin-cockpit-sub">${esc(datesLabel)} · ${t.days.length} jours · ${total} étape${total!==1?'s':''}${t.startDate?` · <button class="itin-edit-dates" onclick="openEditDates()">✏️ Modifier les dates</button>`:''}</div>
      </div>
      <div class="itin-cockpit-actions">
        <button class="itin-act" onclick="exportJSON()" title="Export JSON"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
        <button class="itin-act" onclick="generateShareLink()" title="Partager"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
        <button class="itin-act itin-act-danger" onclick="openModal('modal-reset')" title="Supprimer le voyage"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg></button>
        <button class="itin-act itin-act-primary" onclick="openNewTripModal()" title="Nouveau voyage"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
      </div>
    </div>
    <div class="itin-progress">
      <div class="itin-progress-bar"><div class="itin-progress-fill" style="width:${pct}%"></div></div>
      <div class="itin-progress-label">${filledDays}/${t.days.length} jours planifiés · ${pct}%</div>
    </div>
  </div>

  <div class="itin-rail">
    ${t.days.map((day,di)=>{
      const status=getTripDayStatus(di);
      const active=di===_activeDay;
      const cnt=day.steps.length;
      const icon=status==='today'?'🔥':status==='past'?'✓':'';
      return `<button class="itin-pill itin-pill-${status}${active?' is-active':''}${cnt===0?' is-empty':''}" onclick="setActiveDay(${di})">
        <span class="itin-pill-num">J${di+1}${icon?` <span class="itin-pill-icon">${icon}</span>`:''}</span>
        <span class="itin-pill-date">${day.dateLabel?esc(day.dateLabel):''}</span>
        <span class="itin-pill-count">${cnt?`${cnt} étape${cnt>1?'s':''}`:'vide'}</span>
      </button>`;
    }).join('')}
  </div>

  <div class="itin-toolbar">
    <button class="itin-toggle ${_itinExpanded?'is-on':''}" onclick="toggleItinExpand()">${_itinExpanded?'▾ Vue jour par jour':'▸ Tout afficher'}</button>
  </div>

  <div id="days-grid" class="${_itinExpanded?'itin-all':'itin-single'}">
    ${_itinExpanded
      ? t.days.map((d,i)=>renderDayCard(d,i)).join('')
      : renderDayCard(t.days[_activeDay],_activeDay)}
  </div>`;
}


/* ══ Modales ══ */
function openNewTripModal(){
  const modal=document.getElementById('modal-new-trip');
  const name=document.getElementById('trip-name-input');
  const start=document.getElementById('trip-start');
  const days=document.getElementById('trip-days');
  const end=document.getElementById('trip-end');

  if(!modal || !name || !start || !days || !end){
    console.error('Modal nouveau voyage introuvable');
    return;
  }

  name.value='';
  start.value='';
  days.value='7';
  end.value='';

  modal.classList.add('open');
  document.body.style.overflow='hidden';
}

function openImportModal(){openModal('modal-import')}

function attachWelcomeActions(){
  const newTripBtn=document.getElementById('welcome-new-trip-btn');
  const importBtn=document.getElementById('welcome-import-btn');
  const importFile=document.getElementById('import-file');

  if(newTripBtn){
    newTripBtn.addEventListener('click',()=>{
      const modal=document.getElementById('modal-new-trip');
      if(modal){
        document.getElementById('trip-name-input').value='';
        document.getElementById('trip-start').value='';
        document.getElementById('trip-days').value='7';
        document.getElementById('trip-end').value='';
        modal.classList.add('open');
        document.body.style.overflow='hidden';
      }
    });
  }

  if(importBtn){
    importBtn.addEventListener('click',()=>{
      if(importFile){
        importFile.click();
      }else{
        openImportModal();
      }
    });
  }
}
/* ══ Export / Import ══ */
function exportJSON(){
  if(!state.trip)return;
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=(state.trip.name||'voyage').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')+'.json';
  a.click();URL.revokeObjectURL(url);
  showToast('JSON exporté');
}
/* ══ Partage par URL ══ */
function generateShareLink(){
  if(!state.trip){showToast('Aucun voyage à partager');return}
  try{
    const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(state.trip))));
    const url=location.origin+location.pathname+'?trip='+encoded;
    navigator.clipboard.writeText(url).then(()=>{
      showToast('🔗 Lien de sauvegarde copié !');
    }).catch(()=>{
      prompt('Copie ce lien :',url);
    });
  }catch(e){showToast('Erreur lors de la génération du lien')}
}

function loadFromURL(){
  try{
    const params=new URLSearchParams(location.search);
    const raw=params.get('trip');
    if(!raw)return false;
    const trip=JSON.parse(decodeURIComponent(escape(atob(raw))));
    if(!trip||!Array.isArray(trip.days))return false;
    state.trip=trip;
    history.replaceState(null,'',location.pathname);
    saveToLocalStorage();
    showToast('✈️ Voyage chargé depuis le lien !');
    return true;
  }catch(e){return false}
}

function handleImport(event){
  const file=event.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(data.trip&&Array.isArray(data.trip.days))state=data;
      else if(data.name&&Array.isArray(data.days))state.trip=data;
      else throw new Error();
      Object.keys(_photoCache).forEach(k=>delete _photoCache[k]);
      Object.keys(_photoOpen).forEach(k=>delete _photoOpen[k]);
      Object.keys(_geocodeCache).forEach(k=>delete _geocodeCache[k]);
      _mapInited=false;
      saveToLocalStorage();
      closeModal('modal-import');
      renderItinerary();renderDocs();renderBudget();
      showToast('Importé ✓');
    }catch(err){showToast('JSON invalide')}
  };
  reader.readAsText(file);
  event.target.value='';
}

/* ══ Init ══ */
(function init(){
  const fromURL=loadFromURL();

  if(fromURL){
    tripsStore={activeTripId:makeTripId(),trips:[]};
    applyTripData({
      trip:state.trip,
      docs:state.docs,
      budget:state.budget,
      participants:Array.isArray(state.participants)&&state.participants.length?state.participants:[...DEFAULT_PARTICIPANTS]
    });
    saveToLocalStorage();
  }else{
    const saved=loadFromLocalStorage();
    if(saved){
      tripsStore=saved;
      const active=saved.trips.find(t=>t.id===saved.activeTripId)||saved.trips[0];
      if(active)applyTripData(active.data);
    }else{
      applyTripData({trip:null,docs:[],budget:[],participants:[...DEFAULT_PARTICIPANTS]});
    }
  }

  renderTripSwitcher();
  renderItinerary();
  renderDocs();
  renderBudget();
})();
