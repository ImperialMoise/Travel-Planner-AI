import {
  sb, getUser, signIn, signUp, signOut,
  loadTrip, upsertTrip, upsertDay, upsertStep,
  upsertBudgetItem,
  createInviteLink, acceptInvite,
  subscribeToTrip, unsubscribeFromTrip
} from './supabase.js';

const LS_KEY='voyage-planner-v6';
let _currentUser = null; // utilisateur connecté
const DEFAULT_PARTICIPANTS=['Mathis','Margot'];

let state={trip:null,docs:[],budget:[],participants:[...DEFAULT_PARTICIPANTS]};
let tripsStore={activeTripId:null,trips:[]};

let readMode=false,timerInd=null,timerToast=null;
const _photoCache={};
const _photoOpen={};
const _geocodeCache={};
let _map=null,_mapInited=false,_mapMarkers=[],_mapRoutes=[];
let _mapSteps=[],_activeMapStep=-1,_mapDayFilter=null;
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
function _startRealtime(tripId) {
  subscribeToTrip(tripId, {
    onStepUpserted: (step, dayId) => {
      // Trouver le jour concerné et merger l'étape
      const day = state.trip?.days.find(d => d.supabaseId === dayId);
      if (!day) return;
      const idx = day.steps.findIndex(s => s.supabaseId === step.supabaseId);
      if (idx >= 0) day.steps[idx] = step;
      else day.steps.push(step);
      day.steps.sort((a,b) => (a.time||'').localeCompare(b.time||''));
      saveToLocalStorage();
      renderItinerary();
    },
    onStepDeleted: (supabaseId) => {
      state.trip?.days.forEach(day => {
        day.steps = day.steps.filter(s => s.supabaseId !== supabaseId);
      });
      saveToLocalStorage();
      renderItinerary();
    },
    onDayUpdated: (row) => {
      const day = state.trip?.days[row.day_index];
      if (day) { day.title = row.title; day.note = row.note; renderItinerary(); }
    },
    onBudgetChanged: async () => {
      const fresh = await loadTrip(tripId);
      state.budget = fresh.budget;
      saveToLocalStorage();
      renderBudget();
    },
  });
}

/* ══ Auth UI ══ */
let _authTab = 'login';

function openAuthModal(){
  const btn = document.getElementById('auth-submit-btn');
  const signout = document.getElementById('auth-signout-btn');
  const err = document.getElementById('auth-error');
  const ok = document.getElementById('auth-success');
  if(err) err.style.display='none';
  if(ok) ok.style.display='none';
  if(_currentUser){
    // Déjà connecté → montrer le bouton déconnexion
    if(btn) btn.style.display='none';
    if(signout) signout.style.display='block';
    document.getElementById('auth-modal-title').textContent = 'Mon compte';
    document.getElementById('auth-email').value = _currentUser.email;
    document.getElementById('auth-email').disabled = true;
    document.getElementById('auth-password').style.display = 'none';
    document.querySelector('.auth-tabs').style.display = 'none';
  } else {
    if(btn) btn.style.display='block';
    if(signout) signout.style.display='none';
    document.getElementById('auth-modal-title').textContent = 'Connexion';
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-email').disabled = false;
    document.getElementById('auth-password').style.display = '';
    document.querySelector('.auth-tabs').style.display = '';
    switchAuthTab('login');
  }
  openModal('modal-auth');
}

function switchAuthTab(tab){
  _authTab = tab;
  document.getElementById('auth-tab-login').classList.toggle('is-active', tab==='login');
  document.getElementById('auth-tab-signup').classList.toggle('is-active', tab==='signup');
  document.getElementById('auth-modal-title').textContent = tab==='login'?'Connexion':'Créer un compte';
  document.getElementById('auth-submit-btn').textContent = tab==='login'?'Se connecter':'Créer mon compte';
}

async function submitAuth(){
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errEl = document.getElementById('auth-error');
  const okEl = document.getElementById('auth-success');
  const btn = document.getElementById('auth-submit-btn');
  errEl.style.display='none'; okEl.style.display='none';
  if(!email||!password){errEl.textContent='Email et mot de passe requis';errEl.style.display='block';return}
  btn.textContent='...'; btn.disabled=true;
  try {
    if(_authTab==='login'){
      _currentUser = await signIn(email, password);
    } else {
      _currentUser = await signUp(email, password);
      okEl.textContent='Compte créé ! Vérifiez votre email si nécessaire.';
      okEl.style.display='block';
    }
    _updateAuthBtn();
    showToast(_authTab==='login'?`Connecté : ${_currentUser.email}`:'Compte créé ✓');
    closeModal('modal-auth');
    // Si voyage actif → syncer avec Supabase
    if(state.trip?.supabaseId) _startRealtime(state.trip.supabaseId);
  } catch(e){
    errEl.textContent = e.message||'Erreur de connexion';
    errEl.style.display='block';
  } finally {
    btn.disabled=false;
    btn.textContent=_authTab==='login'?'Se connecter':'Créer mon compte';
  }
}

async function doSignOut(){
  await signOut();
  _currentUser = null;
  _updateAuthBtn();
  closeModal('modal-auth');
  showToast('Déconnecté');
}

function _updateAuthBtn(){
  const btn = document.getElementById('btn-auth');
  const label = document.getElementById('btn-auth-label');
  if(!btn||!label) return;
  if(_currentUser){
    const name = _currentUser.user_metadata?.display_name || _currentUser.email.split('@')[0];
    label.textContent = name;
    btn.classList.add('is-connected');
  } else {
    label.textContent = 'Connexion';
    btn.classList.remove('is-connected');
  }
}

function toggleTheme(){
  applyTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark')}
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
async function createTrip(){
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
  // Sync Supabase
  if(_currentUser) {
    try {
      // 1. Créer le voyage dans Supabase
      const tripRow = await upsertTrip(state.trip, _currentUser.id);
      state.trip.supabaseId = tripRow.id;
      tripsStore.activeTripId = tripRow.id;
      // 2. Créer tous les jours
      for(let i=0; i<state.trip.days.length; i++){
        const dayRow = await upsertDay(tripRow.id, state.trip.days[i], i);
        state.trip.days[i].supabaseId = dayRow.id;
      }
      saveToLocalStorage();
      _startRealtime(tripRow.id);
      showToast(`Voyage "${name}" créé et synchronisé ✓`);
    } catch(e) {
      console.error('Erreur Supabase:', e);
      showToast('⚠️ Sauvegarde cloud échouée, voyage en local uniquement');
    }
  }

  setTimeout(()=>{
    const c=document.querySelector('[data-day="0"]');
    if(c)c.classList.add('expanded');
  },80);

  const bb=document.getElementById('btn-back');
  if(bb)bb.classList.add('visible');
  showToast(`Voyage "${name}" créé ✓`);
}

/* ══ Étapes ══ */
/* ══ Types d'étapes ══ */
const STEP_TYPE_LABELS={transport:'✈️ Transport',logement:'🏠 Logement',restaurant:'🍽️ Restaurant',activite:'🎯 Activité',autre:'📌 Autre'};
const TRANSPORT_TYPES=['train','avion','bus','voiture','ferry','métro','pied','vélo','taxi'];

let _stepCtx={mode:'add',di:0,si:0,type:'autre'};

function setStepType(t){
  _stepCtx.type=t;
  document.querySelectorAll('.stt').forEach(b=>b.classList.toggle('is-active',b.dataset.t===t));
  renderStepForm();
}

function _stepVal(id,fallback=''){const el=document.getElementById(id);return el?el.value:fallback}
function _stepSet(id,v){const el=document.getElementById(id);if(el)el.value=v??''}

function calcDuree(dep,arr,nextDay){
  if(!dep||!arr)return'';
  const[dh,dm]=dep.split(':').map(Number);
  const[ah,am]=arr.split(':').map(Number);
  let mins=(ah*60+am)-(dh*60+dm);
  if(nextDay||mins<0)mins+=1440;
  if(mins<=0)return'';
  return mins>=60?`${Math.floor(mins/60)}h${String(mins%60).padStart(2,'0')}`:`${mins}min`;
}

function updateDureeBadge(){
  const badge=document.getElementById('s-duree-badge');
  if(!badge)return;
  const d=calcDuree(_stepVal('s-dep-h'),_stepVal('s-arr-h'),document.getElementById('s-next-day')?.checked);
  badge.textContent=d?`⏱ ${d}`:'';
  badge.style.display=d?'inline-flex':'none';
}

let _escales=[];
function addEscale(){
  _escales.push({lieu:'',duree:''});
  renderEscales();
}
function removeEscale(i){_escales.splice(i,1);renderEscales()}
function renderEscales(){
  const c=document.getElementById('s-escales');
  if(!c)return;
  c.innerHTML=_escales.map((e,i)=>`<div class="escale-row" style="align-items:flex-start;gap:.4rem">
    <div class="autocomplete-wrap" style="flex:2">
      <input id="escale-lieu-${i}" type="text" placeholder="Lieu de l'escale" value="${esc(e.lieu)}"
        oninput="_escales[${i}].lieu=this.value;acInput(this,'escale-list-${i}')"
        onkeydown="acKeydown(event,'escale-list-${i}')"/>
      <div class="autocomplete-list" id="escale-list-${i}"></div>
    </div>
    <input type="time" value="${esc(e.arrivee||'')}" title="Heure d'arrivée à l'escale"
      oninput="_escales[${i}].arrivee=this.value;_calcEscaleDuree(${i})" style="flex:1"/>
    <input type="time" value="${esc(e.depart||'')}" title="Heure de départ de l'escale"
      oninput="_escales[${i}].depart=this.value;_calcEscaleDuree(${i})" style="flex:1"/>
    <span class="escale-dur-badge" id="escale-dur-${i}">${e.duree?esc(e.duree):''}</span>
    <button class="escale-del" onclick="removeEscale(${i})">×</button>
  </div>`).join('');
}

function _calcEscaleDuree(i){
  const e=_escales[i];
  const d=calcDuree(e.arrivee,e.depart,false);
  e.duree=d;
  const badge=document.getElementById(`escale-dur-${i}`);
  if(badge)badge.textContent=d||'';
}

function _payerRow(idPrix,idPayer,idChk){
  return `<div class="row-2">
    <div class="field"><label>Prix (€)</label><input id="${idPrix}" type="number" min="0" step="0.01" placeholder="0.00"/></div>
    <div class="field"><label>Payé par</label><select id="${idPayer}" onmousedown="refreshPaidBySelect(this)"></select></div>
  </div>
  <label class="step-budget-toggle" for="${idChk}">
    <input type="checkbox" id="${idChk}"/>
    <span>Ajouter au budget</span>
  </label>`;
}

function _lienNote(){
  return `<div class="field"><label>Lien</label><input id="s-link" type="url" placeholder="Billet, réservation…"/></div>
  <div class="field"><label>Note</label><textarea id="s-note" rows="2" placeholder="Informations…"></textarea></div>`;
}

function _acField(id,listId,ph){
  return `<div class="autocomplete-wrap"><input id="${id}" type="text" placeholder="${ph}" oninput="acInput(this,'${listId}')" onkeydown="acKeydown(event,'${listId}')"/><div class="autocomplete-list" id="${listId}"></div></div>`;
}

function renderStepForm(){
  const t=_stepCtx.type;
  const body=document.getElementById('step-modal-body');
  if(!body)return;
  let html='<input id="s-di" type="hidden"/><input id="s-si" type="hidden"/>';

  if(t==='transport'){
    html+=`<div class="field"><label>Type de transport</label><select id="s-transport-type">
      ${TRANSPORT_TYPES.map(x=>`<option value="${x}">${{train:'🚆 Train',avion:'✈️ Avion',bus:'🚌 Bus',voiture:'🚗 Voiture',ferry:'⛴️ Ferry',métro:'🚇 Métro',pied:'🚶 À pied',vélo:'🚲 Vélo',taxi:'🚕 Taxi'}[x]||x}</option>`).join('')}
    </select></div>
    <div class="row-2">
      <div class="field"><label>Départ</label>${_acField('s-dep-lieu','s-dep-list','Ville, gare…')}</div>
      <div class="field"><label>Heure départ</label><input id="s-dep-h" type="time" oninput="updateDureeBadge()"/></div>
    </div>
    <div class="row-2">
      <div class="field"><label>Arrivée</label>${_acField('s-arr-lieu','s-arr-list','Ville, aéroport…')}</div>
      <div class="field"><label>Heure arrivée</label><input id="s-arr-h" type="time" oninput="updateDureeBadge()"/></div>
    </div>
    <div style="display:flex;align-items:center;gap:.7rem;margin-bottom:.4rem">
      <div class="step-dur-badge" id="s-duree-badge" style="display:none"></div>
      <label style="display:flex;align-items:center;gap:.35rem;font-size:.8rem;color:var(--muted);cursor:pointer">
        <input type="checkbox" id="s-next-day" onchange="updateDureeBadge()" style="accent-color:var(--accent)"/> Arrivée le lendemain
      </label>
    </div>
    <div class="field"><label>Escales / correspondances</label><div id="s-escales"></div>
      <button type="button" onclick="addEscale()" style="margin-top:.4rem;font-size:.8rem;color:var(--accent);background:none;border:none;cursor:pointer;font-weight:700">+ Ajouter une escale</button>
    </div>
    <div class="row-2">
      <div class="field"><label>Transporteur / Réf.</label><input id="s-ref" type="text" placeholder="SNCF, TGV 6601…"/></div>
      <div class="field"><label>Titre (optionnel)</label><input id="s-label" type="text" placeholder="Paris → Lyon"/></div>
    </div>
    ${_payerRow('s-prix','s-payer','s-add-budget')}
    ${_lienNote()}`;
  }
  else if(t==='logement'){
    html+=`<div class="field"><label>Nom du logement</label><input id="s-label" type="text" placeholder="Hôtel Le Bristol…"/></div>
    <div class="field"><label>Adresse / Lieu</label>${_acField('s-lieu','s-lieu-list','Adresse, ville…')}</div>
    <div class="row-2">
      <div class="field"><label>Check-in (date)</label><input id="s-date-start" type="date" oninput="updateNuits()"/></div>
      <div class="field"><label>Check-out (date)</label><input id="s-date-end" type="date" oninput="updateNuits()"/></div>
    </div>
    <div class="row-2">
      <div class="field"><label>Heure check-in</label><input id="s-time-checkin" type="time" value="15:00"/></div>
      <div class="field"><label>Heure check-out</label><input id="s-time-checkout" type="time" value="11:00"/></div>
    </div>
    <div class="step-dur-badge" id="s-nuits-badge" style="display:none"></div>
    ${_payerRow('s-prix','s-payer','s-add-budget')}
    ${_lienNote()}`;
  }
  else if(t==='restaurant'){
    html+=`<div class="field"><label>Nom du restaurant</label><input id="s-label" type="text" placeholder="Le Comptoir…"/></div>
    <div class="field"><label>Adresse / Lieu</label>${_acField('s-lieu','s-lieu-list','Adresse, quartier…')}</div>
    <div class="field"><label>Heure</label><input id="s-time" type="time"/></div>
    ${_payerRow('s-prix','s-payer','s-add-budget')}
    ${_lienNote()}`;
  }
  else if(t==='activite'){
    html+=`<div class="field"><label>Nom</label><input id="s-label" type="text" placeholder="Musée d'Orsay…"/></div>
    <div class="field"><label>Lieu</label>${_acField('s-lieu','s-lieu-list','Adresse, ville…')}</div>
    <div class="row-2">
      <div class="field"><label>Heure</label><input id="s-time" type="time"/></div>
      <div class="field"><label>Durée estimée</label><input id="s-duree" type="text" placeholder="2h, 45min…"/></div>
    </div>
    ${_payerRow('s-prix','s-payer','s-add-budget')}
    ${_lienNote()}`;
  }
  else{
    html+=`<div class="field"><label>Titre</label><input id="s-label" type="text" placeholder="Titre de l'étape"/></div>
    <div class="field"><label>Lieu (optionnel)</label>${_acField('s-lieu','s-lieu-list','Lieu…')}</div>
    <div class="field"><label>Heure (optionnel)</label><input id="s-time" type="time"/></div>
    ${_payerRow('s-prix','s-payer','s-add-budget')}
    ${_lienNote()}`;
  }

  body.innerHTML=html;
  _escales=[];
  if(t==='transport')renderEscales();
  // pré-remplir payer
  const payerSel=document.getElementById('s-payer');
  if(payerSel){refreshPaidBySelect(payerSel);payerSel.value=state.participants[0]||''}
}

function openAddStepModal(di){
  _stepCtx={mode:'add',di,si:0,type:'autre'};
  document.getElementById('step-modal-title').textContent='Ajouter une étape';
  document.getElementById('step-modal-save-btn').textContent='Ajouter';
  setStepType('autre');
  openModal('modal-step');
}

function openEditStepModal(di,si){
  const step=state.trip.days[di].steps[si];
  const t=step.type||'autre';
  _stepCtx={mode:'edit',di,si,type:t};
  document.getElementById('step-modal-title').textContent='Modifier l\'étape';
  document.getElementById('step-modal-save-btn').textContent='Enregistrer';
  setStepType(t);
  // Pré-remplir selon le type
  _stepSet('s-di',di);_stepSet('s-si',si);
  if(t==='transport'){
    _stepSet('s-transport-type',step.transportType||'train');
    _stepSet('s-dep-lieu',step.depart||'');_stepSet('s-dep-h',step.time||'');
    _stepSet('s-arr-lieu',step.arrivee||'');_stepSet('s-arr-h',step.timeEnd||'');
    if(step.nextDay&&document.getElementById('s-next-day'))document.getElementById('s-next-day').checked=true;
    _stepSet('s-ref',step.ref||'');_stepSet('s-label',step.label||'');
    _escales=step.escales?JSON.parse(JSON.stringify(step.escales)):[];
    renderEscales();updateDureeBadge();
  } else if(t==='logement'){
    _stepSet('s-label',step.label||'');_stepSet('s-lieu',step.lieu||'');
    _stepSet('s-date-start',step.dateStart||'');_stepSet('s-date-end',step.dateEnd||'');
    _stepSet('s-time-checkin',step.timeCheckIn||'15:00');
    _stepSet('s-time-checkout',step.timeCheckOut||'11:00');
    updateNuits();
  } else {
    _stepSet('s-label',step.label||'');_stepSet('s-lieu',step.lieu||'');
    _stepSet('s-time',step.time||'');
    if(t==='activite')_stepSet('s-duree',step.dureeEstimee||'');
  }
  _stepSet('s-prix',step.amount||'');_stepSet('s-link',step.link||'');_stepSet('s-note',step.note||'');
  const payerSel=document.getElementById('s-payer');
  if(payerSel){refreshPaidBySelect(payerSel);payerSel.value=step.paidBy||state.participants[0]||''}
  openModal('modal-step');
}

function updateNuits(){
  const badge=document.getElementById('s-nuits-badge');if(!badge)return;
  const s=_stepVal('s-date-start'),e=_stepVal('s-date-end');
  if(!s||!e){badge.style.display='none';return}
  const n=Math.round((new Date(e)-new Date(s))/86400000);
  badge.textContent=n>0?`🌙 ${n} nuit${n>1?'s':''}`:n===0?'Check-in = Check-out':'Dates incohérentes';
  badge.style.display='inline-flex';
}

async function saveStep(){
  const t=_stepCtx.type;
  const di=_stepCtx.di;
  const label=_stepVal('s-label').trim();
  const lieu=_stepVal('s-lieu').trim();
  const link=_stepVal('s-link').trim();
  const note=_stepVal('s-note').trim();
  const amount=parseFloat(_stepVal('s-prix'))||0;
  const paidBy=_stepVal('s-payer')||state.participants[0]||'';
  const addBudget=document.getElementById('s-add-budget')?.checked;

  let step={type:t,label,lieu,link,note,amount,paidBy};

  if(t==='transport'){
    const depH=_stepVal('s-dep-h');const arrH=_stepVal('s-arr-h');
    const nextDay=document.getElementById('s-next-day')?.checked||false;
    const autoLabel=`${_stepVal('s-dep-lieu')||'?'} → ${_stepVal('s-arr-lieu')||'?'}`;
    step={...step,
      label:label||autoLabel,
      transportType:_stepVal('s-transport-type'),
      depart:_stepVal('s-dep-lieu'),arrivee:_stepVal('s-arr-lieu'),
      time:depH,timeEnd:arrH,
      duree:calcDuree(depH,arrH,nextDay),nextDay,
      escales:_escales.filter(e=>e.lieu),
      ref:_stepVal('s-ref'),
      lieu:_stepVal('s-dep-lieu')
    };
    if(!step.depart){showToast('Lieu de départ requis');return}
  } else if(t==='logement'){
    if(!label){showToast('Nom du logement requis');return}
    const ds=_stepVal('s-date-start'),de=_stepVal('s-date-end');
    const nuits=ds&&de?Math.round((new Date(de)-new Date(ds))/86400000):0;
    step={...step,dateStart:ds,dateEnd:de,nuits,
      timeCheckIn:_stepVal('s-time-checkin')||'15:00',
      timeCheckOut:_stepVal('s-time-checkout')||'11:00',
      time:_stepVal('s-time-checkin')||'15:00'};
  } else {
    if(!label){showToast('Titre requis');return}
    step.time=_stepVal('s-time')||'';
    if(t==='activite')step.dureeEstimee=_stepVal('s-duree')||'';
  }

  // Autocomplete coord cache
  if(_acCoords['s-lieu']&&lieu)_geocodeCache[lieu.toLowerCase()]=_acCoords['s-lieu'];
  if(_acCoords['s-dep-lieu']&&step.depart)_geocodeCache[step.depart.toLowerCase()]=_acCoords['s-dep-lieu'];

  if(_stepCtx.mode==='add'){
    state.trip.days[di].steps.push(step);
  } else {
    const si=_stepCtx.si;
    const old=state.trip.days[di].steps[si];
    if(old.lieu!==step.lieu){const k=`${di}-${si}`;delete _photoCache[k];_photoOpen[k]=false}
    state.trip.days[di].steps[si]=step;
  }

  // Trier (logement sans heure mis en dernier)
  state.trip.days[di].steps.sort((a,b)=>{
    const ta=a.type==='logement'?'99:99':(a.time||'99:98');
    const tb=b.type==='logement'?'99:99':(b.time||'99:98');
    return ta.localeCompare(tb);
  });

  // Budget
  const si2=_stepCtx.mode==='edit'?_stepCtx.si:state.trip.days[di].steps.length-1;
  const ref=`${di}-${si2}`;
  if(amount>0&&(addBudget||_stepCtx.mode==='edit')){
    const ex=state.budget.findIndex(b=>b._stepRef===ref);
    const catMap={transport:'Transport',logement:'Logement',restaurant:'Repas',activite:'Activité',autre:'Divers'};
    if(ex>=0){state.budget[ex].amount=amount;state.budget[ex].paidBy=paidBy;state.budget[ex].desc=step.label}
    else state.budget.push({cat:catMap[t]||'Divers',desc:step.label,amount,paidBy,forParticipants:['__all__'],_stepRef:ref});
  }

  saveToLocalStorage();
  closeModal('modal-step');
  renderItinerary();
  showToast(_stepCtx.mode==='add'?'Étape ajoutée ✓':'Étape modifiée ✓');
  // Sync Supabase en arrière-plan
  if(_currentUser && state.trip?.supabaseId) {
    const day = state.trip.days[di];
    const si2 = _stepCtx.mode==='edit' ? _stepCtx.si : state.trip.days[di].steps.length-1;
    try {
      const dayRow = await upsertDay(state.trip.supabaseId, day, di);
      day.supabaseId = dayRow.id;
      const stepRow = await upsertStep(state.trip.supabaseId, dayRow.id, state.trip.days[di].steps[si2], si2, _currentUser.id);
      state.trip.days[di].steps[si2].supabaseId = stepRow.id;
      saveToLocalStorage();
    } catch(e) { showToast('⚠️ Sauvegarde cloud échouée'); console.error(e); }
  }
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
  const b=state.budget[i];
  if(b&&b._stepRef){
    const [di,si]=b._stepRef.split('-').map(Number);
    const step=state.trip&&state.trip.days[di]&&state.trip.days[di].steps[si];
    if(step){step.amount=0;step.paidBy=''}
  }
  state.budget.splice(i,1);
  saveToLocalStorage();
  if(state.trip)renderItinerary();
  renderBudget();
}

function openEditBudgetItem(i){
  const b=state.budget[i];
  if(!b)return;
  if(b._stepRef){
    const [di,si]=b._stepRef.split('-').map(Number);
    if(state.trip&&state.trip.days[di]&&state.trip.days[di].steps[si]){
      openEditStepModal(di,si);
      return;
    }
  }
  const newDesc=prompt('Description :',b.desc);
  if(newDesc===null)return;
  const newAmount=parseFloat(prompt('Montant (€) :',b.amount))||0;
  b.desc=newDesc.trim()||b.desc;
  b.amount=newAmount;
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
        return `<div class="bdg-exp" onclick="openEditBudgetItem(${i})" style="cursor:pointer">
          <span class="bdg-exp-emoji" style="background:${(CAT_COLORS[b.cat]||'#ffa726')}22">${CAT_EMOJI[b.cat]||'📦'}</span>
          <div class="bdg-exp-mid">
            <div class="bdg-exp-desc">${esc(b.desc)}${b._stepRef?` <span class="bdg-exp-linked" title="Liée à une étape">🔗</span>`:''}</div>
            <div class="bdg-exp-meta"><span class="bdg-exp-payer" style="color:${c};background:${c}18">${esc(b.paidBy||'?')}</span><span class="bdg-exp-for">→ ${esc(tl||'—')}</span></div>
          </div>
          <span class="bdg-exp-amt">${fmt(b.amount)}</span>
          <button class="bdg-exp-del" onclick="event.stopPropagation();deleteBudgetItem(${i})" title="Supprimer">×</button>
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
  _mapSteps=[];
  const allCoords=[];

  for(const[di,day]of state.trip.days.entries()){
    if(_mapDayFilter!==null&&_mapDayFilter!==di)continue;
    const stepCoords=[];
    for(const[si,step]of day.steps.entries()){
      if(!step.lieu)continue;
      const coord=await geocode(step.lieu);
      if(!coord)continue;
      allCoords.push([coord.lat,coord.lng]);
      stepCoords.push({coord,step,di,si});
      const idx=_mapSteps.length;
      const color=ROUTE_COLORS[step.transport]||ROUTE_COLORS.default;
      const icon=L.divIcon({className:'map-pin-wrap',html:`<div class="map-pin" style="--pin:${color}"><span>${di+1}</span></div>`,iconSize:[34,42],iconAnchor:[17,40],popupAnchor:[0,-38]});
      const marker=L.marker([coord.lat,coord.lng],{icon}).addTo(_map);
      marker.bindPopup(`<div class="map-pop"><div class="map-pop-t">${esc(step.label||'Étape')}</div><div class="map-pop-l">${esc(step.lieu)}</div>${step.time?`<div class="map-pop-time">🕒 ${esc(step.time)}</div>`:''}</div>`);
      marker.on('click',()=>setActiveMapStep(idx));
      _mapMarkers.push(marker);
      _mapSteps.push({coord,step,di,si,marker,color});
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
        const halo=L.polyline(latlngs,{color:'#ffffff',weight:6,opacity:.35}).addTo(_map);
        const line=L.polyline(latlngs,{color,weight:3.5,opacity:.9,dashArray:transport==='avion'?'6,7':null}).addTo(_map);
        _mapRoutes.push(halo);_mapRoutes.push(line);
      }
    }
  }

  if(allCoords.length>0){
    if(allCoords.length===1)_map.setView(allCoords[0],13);
    else _map.fitBounds(allCoords,{padding:[60,60]});
  }
  renderMapUI();
}

function renderMapUI(){
  const titleEl=document.getElementById('map-hud-title');
  const subEl=document.getElementById('map-hud-sub');
  const emptyEl=document.getElementById('map-empty');
  const sheetEl=document.getElementById('map-sheet');
  if(titleEl&&state.trip)titleEl.textContent=state.trip.name||'Voyage';

  // Day filter chips
  const filt=document.getElementById('map-dayfilter');
  if(filt&&state.trip){
    filt.innerHTML=`<button class="map-chip ${_mapDayFilter===null?'is-active':''}" onclick="mapFilterDay(null)">Tout</button>`+
      state.trip.days.map((d,di)=>{
        const c=d.steps.filter(s=>s.lieu&&s.lieu.trim()).length;
        return `<button class="map-chip ${_mapDayFilter===di?'is-active':''}" onclick="mapFilterDay(${di})">J${di+1}${c?` <span class="map-chip-n">${c}</span>`:''}</button>`;
      }).join('');
  }

  const total=_mapSteps.length;
  if(subEl)subEl.textContent=`${total} lieu${total>1?'x':''}${_mapDayFilter!==null?` · Jour ${_mapDayFilter+1}`:` · ${state.trip?state.trip.days.length:0} jours`}`;

  // Step cards
  const stepsEl=document.getElementById('map-steps');
  const countEl=document.getElementById('map-sheet-count');
  if(countEl)countEl.textContent=total?`${total}`:'';
  if(stepsEl){
    if(total){
      stepsEl.innerHTML=_mapSteps.map((s,idx)=>{
        const active=idx===_activeMapStep;
        return `<button class="map-step-card ${active?'is-active':''}" style="--c:${s.color}" onclick="flyToStep(${idx})">
          <div class="map-step-pin">${s.di+1}</div>
          <div class="map-step-info">
            <div class="map-step-title">${esc(s.step.label||'Étape')}</div>
            <div class="map-step-sub">${s.step.time?esc(s.step.time)+' · ':''}${esc(s.step.lieu)}</div>
          </div>
        </button>`;
      }).join('');
    }else{
      stepsEl.innerHTML='';
    }
  }

  if(emptyEl)emptyEl.style.display=total?'none':'flex';
  if(sheetEl)sheetEl.style.display=total?'block':'none';
}

function setActiveMapStep(idx){
  _activeMapStep=idx;
  renderMapUI();
  const card=document.querySelector('.map-step-card.is-active');
  if(card)card.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
}

function flyToStep(idx){
  const s=_mapSteps[idx];
  if(!s||!_map)return;
  _activeMapStep=idx;
  _map.flyTo([s.coord.lat,s.coord.lng],15,{animate:true,duration:1});
  if(s.marker)setTimeout(()=>s.marker.openPopup(),650);
  renderMapUI();
}

function mapFilterDay(di){
  _mapDayFilter=di;
  _activeMapStep=-1;
  renderMap();
}

function mapFitAll(){
  if(!_map||!_mapSteps.length)return;
  _map.fitBounds(_mapSteps.map(s=>[s.coord.lat,s.coord.lng]),{padding:[60,60]});
}

function mapRecenter(){
  if(_activeMapStep>=0)flyToStep(_activeMapStep);
  else mapFitAll();
}

function focusOnMap(di,si){
  const step=state.trip&&state.trip.days[di]&&state.trip.days[di].steps[si];
  if(!step||!step.lieu){showToast('Aucun lieu pour cette étape');return}
  _mapDayFilter=null;
  switchView('map');
  setTimeout(async()=>{
    initMap();
    await renderMap();
    const idx=_mapSteps.findIndex(s=>s.di===di&&s.si===si);
    if(idx>=0)flyToStep(idx);
    else{
      const coord=await geocode(step.lieu);
      if(coord)_map.flyTo([coord.lat,coord.lng],15,{animate:true,duration:1.2});
    }
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

let _itinMiniMap=null,_itinMiniMarkers=[],_itinMiniRoute=null;
async function renderItinMiniMap(){
  if(window.innerWidth<1024)return;
  const el=document.getElementById('itin-mini-map');
  const foot=document.getElementById('itin-side-foot');
  if(!el||!state.trip)return;
  if(typeof L==='undefined')return;
  if(!_itinMiniMap){
    _itinMiniMap=L.map(el,{zoomControl:true,attributionControl:false,dragging:true,scrollWheelZoom:false});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(_itinMiniMap);
  }
  _itinMiniMap.invalidateSize();
  _itinMiniMarkers.forEach(m=>_itinMiniMap.removeLayer(m));
  if(_itinMiniRoute)_itinMiniMap.removeLayer(_itinMiniRoute);
  _itinMiniMarkers=[];_itinMiniRoute=null;

  const day=state.trip.days[_activeDay];
  if(!day){if(foot)foot.innerHTML='<div class="itin-side-empty">Aucun jour sélectionné</div>';return}
  const coords=[];
  let withLieu=0,withoutLieu=0;
  for(const[si,step]of day.steps.entries()){
    if(!step.lieu){withoutLieu++;continue}
    const c=await geocode(step.lieu);
    if(!c){withoutLieu++;continue}
    withLieu++;
    coords.push([c.lat,c.lng]);
    const icon=L.divIcon({className:'',html:`<div class="itin-mini-pin">${si+1}</div>`,iconSize:[24,24],iconAnchor:[12,12]});
    const m=L.marker([c.lat,c.lng],{icon}).addTo(_itinMiniMap);
    m.bindPopup(`<strong>${esc(step.label||'Étape')}</strong><br/><span style="font-size:.78rem">${esc(step.lieu)}</span>`);
    _itinMiniMarkers.push(m);
  }
  if(coords.length===1)_itinMiniMap.setView(coords[0],13);
  else if(coords.length>1){
    _itinMiniMap.fitBounds(coords,{padding:[20,20]});
    _itinMiniRoute=L.polyline(coords,{color:'#b4843e',weight:3,opacity:.7,dashArray:'4,6'}).addTo(_itinMiniMap);
  }
  else _itinMiniMap.setView([46.5,2.5],4);

  if(foot){
    if(!day.steps.length)foot.innerHTML='<div class="itin-side-empty">📍 Aucune étape ce jour</div>';
    else foot.innerHTML=`<div class="itin-side-stat">📍 ${withLieu} localisée${withLieu>1?'s':''}${withoutLieu?` · ${withoutLieu} sans lieu`:''}</div>`;
  }
}

const _origSetActiveDay=setActiveDay;
setActiveDay=function(di){_origSetActiveDay(di);setTimeout(renderItinMiniMap,80)};

/* ══ Rendu carte de jour ══ */
function toggleDay(di){const c=document.querySelector(`[data-day="${di}"]`);if(c)c.classList.toggle('expanded')}

function renderDayCard(day,di){
if(!day)return'';
if(!day.dateISO&&state.trip&&state.trip.startDate){
  const d=new Date(state.trip.startDate);d.setDate(d.getDate()+di);
  day.dateISO=d.toISOString().slice(0,10);
}
if(!day.steps)day.steps=[];
const STEP_ICONS={transport:'✈️',logement:'🏠',restaurant:'🍽️',activite:'🎯',autre:'📌'};
const TTYPE_ICONS={train:'🚆',avion:'✈️',bus:'🚌',voiture:'🚗',ferry:'⛴️','métro':'🚇',pied:'🚶',vélo:'🚲',taxi:'🚕'};
const stepsHtml=day.steps.map((step,si)=>{
  const key=`${di}-${si}`;
  const t=step.type||'autre';
  const icon=STEP_ICONS[t]||'📌';
  const actions=`<div class="tl-step-actions">
    <button class="tl-act" onclick="openEditStepModal(${di},${si})" title="Modifier"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
    <button class="tl-act tl-act-del" onclick="deleteStep(${di},${si})" title="Supprimer"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
  </div>`;

  if(t==='transport'){
    const ticon=TTYPE_ICONS[step.transportType]||'✈️';
    const escHtml=step.escales&&step.escales.length?`<div class="tl-escales">${step.escales.map(e=>`<span class="tl-escale">↳ ${esc(e.lieu)}${e.duree?` (${esc(e.duree)})`:''}</span>`).join('')}</div>`:'';
    return `<div class="tl-step tl-step-transport">
      <div class="tl-marker"><div class="tl-dot tl-dot-transport"></div></div>
      <div class="tl-card">
        <div class="tl-card-head"><span class="tl-type-badge">${ticon} ${(step.transportType||'').charAt(0).toUpperCase()+(step.transportType||'').slice(1)}</span>${actions}</div>
        <div class="tl-transport-route">
          <div class="tl-trp-col"><div class="tl-trp-time">${esc(step.time||'')}</div><div class="tl-trp-place">${esc(step.depart||step.label||'')}</div></div>
          <div class="tl-trp-mid"><div class="tl-trp-line"></div>${step.duree?`<div class="tl-trp-dur">${esc(step.duree)}</div>`:''}</div>
          <div class="tl-trp-col tl-trp-col-r"><div class="tl-trp-time">${esc(step.timeEnd||'')}${step.nextDay?'<span class="tl-nextday">+1j</span>':''}</div><div class="tl-trp-place">${esc(step.arrivee||'')}</div></div>
        </div>
        ${escHtml}
        ${step.ref?`<div class="tl-trp-ref">🎫 ${esc(step.ref)}</div>`:''}
        ${step.note?`<div class="tl-note-inline">${esc(step.note)}</div>`:''}
        ${step.link?`<a href="${esc(step.link)}" target="_blank" rel="noopener noreferrer" class="tl-tag tl-tag-link">🔗 Lien</a>`:''}
      </div>
    </div>`;
  }
  if(t==='logement'){
    let phase='séjour',phaseIcon='🏠',phaseTime='';
    const isCheckIn=step.dateStart&&day.dateISO===step.dateStart;
    const isCheckOut=step.dateEnd&&day.dateISO===step.dateEnd;
    if(isCheckIn){phase='Check-in';phaseIcon='🔑';phaseTime=step.timeCheckIn||'15:00'}
    else if(isCheckOut){phase='Check-out';phaseIcon='🚪';phaseTime=step.timeCheckOut||'11:00'}
    else if(step.dateStart&&day.dateISO>step.dateStart&&day.dateISO<step.dateEnd){phase='Nuit sur place';phaseIcon='🌙'}
    const isMiddle=phase==='Nuit sur place';
    const dayNum=step.dateStart?Math.round((new Date(day.dateISO)-new Date(step.dateStart))/86400000)+1:null;
    const dateRange=step.dateStart&&step.dateEnd?`${esc(step.dateStart)} → ${esc(step.dateEnd)}`:'';
    if(isMiddle){
      // version condensée pour les jours intermédiaires
      return `<div class="lgmt-mini">
        <span class="lgmt-mini-icon">🌙</span>
        <div class="lgmt-mini-body">
          <div class="lgmt-mini-name">${esc(step.label||'Logement')}</div>
          <div class="lgmt-mini-sub">Nuit ${dayNum-1}/${step.nuits||'?'} · même hébergement</div>
        </div>
        ${actions}
      </div>`;
    }
    return `<div class="lgmt-block lgmt-${isCheckIn?'in':'out'}">
      <div class="lgmt-strip"></div>
      <div class="lgmt-content">
        <div class="lgmt-top">
          <div class="lgmt-phase">${phaseIcon} ${phase}${phaseTime?` · ${phaseTime}`:''}</div>
          ${actions}
        </div>
        <div class="lgmt-name">${esc(step.label||'Logement')}</div>
        ${step.lieu?`<div class="lgmt-addr">📍 ${esc(step.lieu)}</div>`:''}
        ${step.nuits?`<div class="lgmt-stay"><span class="lgmt-nuits">${step.nuits}</span><span class="lgmt-nuits-l">nuit${step.nuits>1?'s':''}</span>${dateRange?`<span class="lgmt-range">${dateRange}</span>`:''}</div>`:''}
        ${step.note?`<div class="lgmt-note">${esc(step.note)}</div>`:''}
        ${step.link?`<a href="${esc(step.link)}" target="_blank" rel="noopener noreferrer" class="lgmt-link">🔗 Réservation</a>`:''}
      </div>
    </div>`;
  }
  // restaurant, activite, autre
  const lieu=step.lieu||'';
  return `<div class="tl-step">
    <div class="tl-marker"><div class="tl-dot"></div></div>
    <div class="tl-card">
      <div class="tl-card-head">
        <span class="tl-time">${step.time?esc(step.time):''}</span>
        ${actions}
      </div>
      <div class="tl-label-big">${icon} ${esc(step.label)}</div>
      ${lieu?`<div class="tl-lieu-small">📍 ${esc(lieu)} <button class="step-map-btn" id="map-btn-${key}" onclick="focusOnMap(${di},${si})" title="Voir sur la carte">📍</button></div>`:''}
      ${t==='activite'&&step.dureeEstimee?`<span class="tl-tag tl-tag-dur">⏱ ${esc(step.dureeEstimee)}</span>`:''}
      ${step.note?`<div class="tl-note-inline">${esc(step.note)}</div>`:''}
      ${step.link?`<a href="${esc(step.link)}" target="_blank" rel="noopener noreferrer" class="tl-tag tl-tag-link">🔗 Lien</a>`:''}
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

  <div class="itin-toolbar">
    <button class="itin-toggle ${_itinExpanded?'is-on':''}" onclick="toggleItinExpand()">${_itinExpanded?'▾ Vue jour par jour':'▸ Tout afficher'}</button>
  </div>

  <div class="itin-layout ${_itinExpanded?'is-expanded':''}">
    <aside class="itin-rail">
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
    </aside>

    <main id="days-grid" class="itin-main ${_itinExpanded?'itin-all':'itin-single'}">
      ${_itinExpanded
        ? t.days.map((d,i)=>renderDayCard(d,i)).join('')
        : renderDayCard(t.days[_activeDay],_activeDay)}
    </main>

    <aside class="itin-side" id="itin-side">
      <div class="itin-side-card">
        <div class="itin-side-kicker">Carte du jour</div>
        <div id="itin-mini-map" class="itin-mini-map"></div>
        <div class="itin-side-foot" id="itin-side-foot"></div>
      </div>
    </aside>
  </div>`;

  setTimeout(()=>renderItinMiniMap(),50);
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
async function generateShareLink(){
  if(!state.trip){showToast('Aucun voyage à partager');return}
  if(!_currentUser){showToast('Connecte-toi pour partager');openAuthModal();return}
  if(!state.trip.supabaseId){showToast('⚠️ Sauvegarde le voyage d\'abord');return}
  try {
    const url = await createInviteLink(state.trip.supabaseId, 'editor');
    // Essayer le clipboard, sinon afficher le lien
    try { await navigator.clipboard.writeText(url); } catch(e) {}
    // Afficher une modale avec le lien + options de partage
    _showShareModal(url);
  } catch(e) { showToast('Erreur : ' + e.message); }
}

function _showShareModal(url){
  // Créer une modale simple si elle n'existe pas
  let m = document.getElementById('modal-share');
  if(!m){
    m = document.createElement('div');
    m.id = 'modal-share';
    m.className = 'modal-overlay';
    m.innerHTML = `<div class="modal" style="max-width:480px">
      <div class="modal-header">
        <div class="modal-title">Partager le voyage</div>
        <button class="modal-close" onclick="closeModal('modal-share')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body" style="display:flex;flex-direction:column;gap:1rem">
        <p style="font-size:.88rem;color:var(--muted)">Ce lien permet à quelqu'un de rejoindre ton voyage et de le modifier. Il est valable <strong>7 jours</strong>.</p>
        <div style="display:flex;gap:.5rem">
          <input id="share-url-input" type="text" readonly style="flex:1;font-size:.78rem;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:.6rem .8rem;color:var(--text)"/>
          <button class="btn-primary" onclick="copyShareUrl()" style="flex-shrink:0">Copier</button>
        </div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <a id="share-whatsapp" href="" target="_blank" class="btn-ghost" style="flex:1;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:.4rem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.85L.057 23.885l6.186-1.443A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.502-5.17-1.381l-.37-.22-3.672.856.894-3.569-.242-.378A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            WhatsApp
          </a>
          <a id="share-email" href="" class="btn-ghost" style="flex:1;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:.4rem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Email
          </a>
          <a id="share-sms" href="" class="btn-ghost" style="flex:1;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:.4rem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            SMS
          </a>
        </div>
      </div>
    </div>`;
    document.body.appendChild(m);
  }
  const tripName = state.trip?.name || 'notre voyage';
  const msg = `Rejoins moi sur notre voyage "${tripName}" 🌍 : ${url}`;
  document.getElementById('share-url-input').value = url;
  document.getElementById('share-whatsapp').href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  document.getElementById('share-email').href = `mailto:?subject=${encodeURIComponent('Invitation voyage : '+tripName)}&body=${encodeURIComponent(msg)}`;
  document.getElementById('share-sms').href = `sms:?body=${encodeURIComponent(msg)}`;
  openModal('modal-share');
}

function copyShareUrl(){
  const input = document.getElementById('share-url-input');
  if(!input) return;
  navigator.clipboard.writeText(input.value)
    .then(() => showToast('🔗 Lien copié !'))
    .catch(() => { input.select(); document.execCommand('copy'); showToast('🔗 Lien copié !'); });
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
(async function init(){
  // Récupérer l'utilisateur connecté
  _currentUser = await getUser();
if(!_currentUser){
  // Attendre que Supabase restaure la session
  await new Promise(resolve => {
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if(session?.user){ _currentUser = session.user; }
      subscription.unsubscribe();
      resolve();
    });
    setTimeout(resolve, 1500);
  });
}
_updateAuthBtn();

  // Détecter une invitation par lien ?invite=TOKEN
  const params = new URLSearchParams(location.search);
  const inviteToken = params.get('invite');
  if (inviteToken && _currentUser) {
    try {
      const tripId = await acceptInvite(inviteToken);
      history.replaceState(null, '', location.pathname);
      showToast('🎉 Vous avez rejoint le voyage !');
      const data = await loadTrip(tripId);
      applyTripData(data);
      state.trip.supabaseId = tripId;
      tripsStore.activeTripId = tripId;
      saveToLocalStorage();
      renderTripSwitcher();
      renderItinerary(); renderBudget(); renderDocs();
      _startRealtime(tripId);
      return;
    } catch(e) { showToast('Invitation invalide : ' + e.message); }
  }

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
    if(active) applyTripData(active.data);
    // Si connecté et voyage Supabase → recharger depuis la vraie source
    if(_currentUser && tripsStore.activeTripId && active?.data?.trip?.supabaseId) {
      try {
        const fresh = await loadTrip(active.data.trip.supabaseId);
        applyTripData(fresh);
        _startRealtime(active.data.trip.supabaseId);
      } catch(e) { console.warn('Supabase offline, mode local', e); }
    }
  } else {
    applyTripData({trip:null,docs:[],budget:[],participants:[...DEFAULT_PARTICIPANTS]});
  }
  }

  renderTripSwitcher();
  renderItinerary();
  renderDocs();
  renderBudget();
})();

// Exposition des fonctions au scope global (HTML)
window.goHome = goHome;
window.switchView = switchView;
window.toggleTheme = toggleTheme;
window.toggleReadMode = toggleReadMode;
window.selectTrip = selectTrip;
window.deleteCurrentTrip = deleteCurrentTrip;
window.createTrip = createTrip;
window.openModal = openModal;
window.openAuthModal = openAuthModal;
window.switchAuthTab = switchAuthTab;
window.submitAuth = submitAuth;
window.doSignOut = doSignOut;
window.closeModal = closeModal;
window.openNewTripModal = openNewTripModal;
window.openImportModal = openImportModal;
window.handleImport = handleImport;
window.exportJSON = exportJSON;
window.generateShareLink = generateShareLink;
window.resetTrip = resetTrip;

// Fonctions Dates et Itinéraire
window.onTripStartChange = onTripStartChange;
window.onTripDaysChange = onTripDaysChange;
window.onTripEndChange = onTripEndChange;
window.openEditDates = openEditDates;
window.syncEditDates = syncEditDates;
window.saveEditDates = saveEditDates;
window.setActiveDay = setActiveDay;
window.toggleItinExpand = toggleItinExpand;
window.syncTripName = syncTripName;
window.syncDayName = syncDayName;
window.syncDayNote = syncDayNote;
window.openAddStepModal = openAddStepModal;
window.openEditStepModal = openEditStepModal;
window.saveStep = saveStep;
window.deleteStep = deleteStep;
window.setStepType = setStepType;
window.addEscale = addEscale;
window.removeEscale = removeEscale;
window.updateDureeBadge = updateDureeBadge;
window.updateNuits = updateNuits;
window.acInput = acInput;
window.acSelect = acSelect;
window.acKeydown = acKeydown;
window.closeLightbox = closeLightbox;
window.openLightbox = openLightbox;

// Fonctions Documents
window.addDoc = addDoc;
window.deleteDoc = deleteDoc;
window.syncDocLabel = syncDocLabel;
window.syncDocValue = syncDocValue;

// Fonctions Budget
window.setBudgetTab = setBudgetTab;
window.addBudgetItem = addBudgetItem;
window.deleteBudgetItem = deleteBudgetItem;
window.openEditBudgetItem = openEditBudgetItem;
window.setBudgetPayer = setBudgetPayer;
window.setBudgetFor = setBudgetFor;
window.refreshPaidBySelect = refreshPaidBySelect;
window.ajouterParticipant = ajouterParticipant;
window.supprimerParticipant = supprimerParticipant;

// Fonctions Map
window.mapFitAll = mapFitAll;
window.mapRecenter = mapRecenter;
window.mapFilterDay = mapFilterDay;
window.flyToStep = flyToStep;
window.focusOnMap = focusOnMap;

// Fonctions Itinéraire manquantes
window.openEditDates = openEditDates;
window.syncEditDates = syncEditDates;
window.saveEditDates = saveEditDates;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleTheme = toggleTheme;
window.toggleReadMode = toggleReadMode;
window.goHome = goHome;
window.selectTrip = selectTrip;
window.deleteCurrentTrip = deleteCurrentTrip;
window.exportJSON = exportJSON;
window.generateShareLink = generateShareLink;
window.handleImport = handleImport;
window.createTrip = createTrip;
window.resetTrip = resetTrip;
window.openNewTripModal = openNewTripModal;
window.openImportModal = openImportModal;
window.switchView = switchView;
window.syncStepLabel = syncStepLabel;
window.syncStepNote = syncStepNote;
window.syncStepLieu = syncStepLieu;
window.toggleStepPhoto = toggleStepPhoto;
window.enableTransport = enableTransport;
window.removeTransport = removeTransport;
window.syncTransport = syncTransport;
window.enableHebergement = enableHebergement;
window.removeHebergement = removeHebergement;
window.syncHebergement = syncHebergement;
window.setBudgetTab = setBudgetTab;
window.mapFitAll = mapFitAll;
window.mapRecenter = mapRecenter;
window.renderItinMiniMap = renderItinMiniMap;
window.setActiveDay = setActiveDay;
window.toggleItinExpand = toggleItinExpand;
window._calcEscaleDuree = _calcEscaleDuree;
// _escales est un tableau — on expose un proxy pour que les oninput inline puissent y écrire
Object.defineProperty(window, '_escales', {
  get: () => _escales,
  set: (v) => { _escales.length = 0; v.forEach(x => _escales.push(x)); }
});