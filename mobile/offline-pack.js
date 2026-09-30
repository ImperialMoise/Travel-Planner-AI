const DB = 'fabrique-offline-v1', OWNER = 'fabrique-offline-owner-v1';
const MAX_FILE = 30 * 1024 * 1024, MAX_PACK = 150 * 1024 * 1024;
let generation = 0, preparing = false, pdfLibrary;
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const size = bytes => bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + ' Ko' : (bytes / 1024 / 1024).toFixed(1) + ' Mo';
const label = type => ({activity:'Activité',activite:'Activité',transport:'Transport',lodging:'Hébergement',logement:'Hébergement',hotel:'Hébergement',restaurant:'Repas',meal:'Repas',repas:'Repas',other:'Autres',flight:'Billets d’avion',identity:'Identité',insurance:'Assurance'})[type] || type || 'Étape';
const check = signal => { if (signal?.aborted) throw new Error('Préparation interrompue.'); };
async function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('packs');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Ferme les autres fenêtres de l’app puis réessaie.'));
  });
}
async function transaction(mode, action) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('packs', mode), store = tx.objectStore('packs');
    let request;
    try { request = action(store); } catch (error) { db.close(); reject(error); return; }
    tx.oncomplete = () => { db.close(); resolve(request?.result); };
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error || new Error('Stockage indisponible.')); };
  });
}
export async function readPack() {
  const pack = await transaction('readonly', store => store.get('active'));
  return pack?.owner === localStorage.getItem(OWNER) && pack?.version === 1 ? pack : null;
}
export async function forgetPack() {
  generation++;
  localStorage.removeItem(OWNER);
  await transaction('readwrite', store => store.clear());
}
export async function setOwner(owner) {
  const previous = localStorage.getItem(OWNER);
  if (previous && previous !== owner) await forgetPack();
  if (owner) localStorage.setItem(OWNER, owner);
}
async function bounded(promise, signal, milliseconds = 45000) {
  check(signal);
  let timer, onAbort;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Le réseau ne répond pas. Réessaie avec une connexion stable.')), milliseconds);
      onAbort = () => reject(new Error('Préparation interrompue.'));
      signal?.addEventListener('abort', onAbort, { once: true });
    })]);
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); }
}
async function allRows(SB, table, tripId, signal) {
  const rows = [];
  for (let offset = 0; offset < 10000; offset += 500) {
    check(signal);
    const { data, error } = await bounded(SB.sb.from(table).select('*').eq('trip_id', tripId)
      .order('id').range(offset, offset + 499).abortSignal(signal), signal);
    if (error) throw new Error(table + ' : ' + error.message);
    if (!Array.isArray(data)) throw new Error('Réponse incomplète : ' + table);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
  throw new Error('Voyage trop volumineux pour ce pack.');
}
async function pdfDocument(blob) {
  pdfLibrary ||= import('./offline-vendor/build/pdf.mjs').then(pdf => {
    pdf.GlobalWorkerOptions.workerSrc = new URL('./offline-vendor/build/pdf.worker.mjs', location.href).href;
    return pdf;
  }).catch(error => { pdfLibrary = null; throw error; });
  const pdf = await pdfLibrary;
  return pdf.getDocument({
    data: new Uint8Array(await blob.arrayBuffer()),
    isEvalSupported: false,
    cMapUrl: new URL('./offline-vendor/cmaps/', location.href).href, cMapPacked: true,
    standardFontDataUrl: new URL('./offline-vendor/standard_fonts/', location.href).href,
    wasmUrl: new URL('./offline-vendor/wasm/', location.href).href
  }).promise;
}
async function validateFile(blob, mime, signal) {
  if (mime === 'application/pdf') {
    const pdf = await pdfDocument(blob);
    try {
      if (!pdf.numPages || pdf.numPages > 300) throw new Error('PDF vide ou trop long (maximum 300 pages).');
      for (let i = 1; i <= pdf.numPages; i++) {
        check(signal);
        const page = await pdf.getPage(i), canvas = document.createElement('canvas');
        const viewport = page.getViewport({ scale: 0.25 });
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        canvas.width = canvas.height = 0;
        page.cleanup();
      }
    } finally { await pdf.destroy(); }
  } else if (mime.startsWith('image/')) {
    const bitmap = await createImageBitmap(blob);
    bitmap.close();
  }
}
async function downloadFile(SB, row, signal) {
  if (!row.file_path || row.size_bytes > MAX_FILE) throw new Error('Fichier manquant ou supérieur à 30 Mo.');
  const url = await bounded(SB.getDocumentUrl(row.file_path), signal);
  if (new URL(url).origin !== 'https://kxxxwijywumqehjchjae.supabase.co') throw new Error('Adresse de document inattendue.');
  const transferSignal = AbortSignal.any([signal, AbortSignal.timeout(120000)]);
  const response = await bounded(fetch(url, { signal: transferSignal, cache: 'no-store', credentials: 'omit' }), transferSignal);
  if (!response.ok) throw new Error('Téléchargement refusé (' + response.status + ').');
  if (Number(response.headers.get('content-length')) > MAX_FILE) throw new Error('Fichier supérieur à 30 Mo.');
  const reader = response.body.getReader(), parts = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await bounded(reader.read(), transferSignal);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_FILE) throw new Error('Fichier supérieur à 30 Mo.');
      parts.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  if (!bytes || (row.size_bytes > 0 && bytes !== row.size_bytes)) throw new Error('Taille téléchargée incohérente.');
  const mime = String(row.mime_type || response.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'text/plain'].includes(mime))
    throw new Error('Format non pris en charge hors ligne : ' + (mime || 'inconnu'));
  const blob = new Blob(parts, { type: mime });
  await bounded(validateFile(blob, mime, signal), signal, 120000);
  return { id: row.id, name: row.name || 'Document', category: row.category || 'other', mime, blob };
}
export async function preparePack(SB, tripId, owner, report = () => {}, signal = new AbortController().signal) {
  if (preparing) throw new Error('Une préparation est déjà en cours.');
  preparing = true;
  try {
    if (!navigator.onLine) throw new Error('Connecte-toi à Internet pour préparer le voyage.');
    if (!owner || (await bounded(SB.getUser(), signal))?.id !== owner) throw new Error('Reconnecte-toi avant de télécharger.');
    await setOwner(owner);
    const version = generation;
    const assertCurrent = () => {
      check(signal);
      if (generation !== version || localStorage.getItem(OWNER) !== owner) throw new Error('Compte changé : téléchargement annulé.');
    };
    const persistent = await navigator.storage?.persist?.().catch(() => false) || false;
    report('Chargement du programme, des notes et du budget…', 0, 0);
    const { data: trip, error } = await bounded(SB.sb.from('trips').select('*').eq('id', tripId).single().abortSignal(signal), signal);
    if (error || !trip) throw new Error(error?.message || 'Voyage inaccessible.');
    const names = ['trip_days', 'trip_steps', 'budget_items', 'trip_participants', 'trip_documents'];
    const values = await Promise.all(names.map(name => allRows(SB, name, tripId, signal)));
    assertCurrent();
    const tables = Object.fromEntries(names.map((name, i) => [name, values[i]]));
    if (tables.trip_steps.some(step => !tables.trip_days.some(day => day.id === step.day_id)))
      throw new Error('Une journée est inaccessible. Le pack ne serait pas complet.');
    const documents = tables.trip_documents;
    if (documents.length > 300) throw new Error('Maximum 300 documents par pack.');
    const estimated = documents.reduce((sum, doc) => sum + Math.max(0, Number(doc.size_bytes) || 0), 0);
    const quota = await navigator.storage?.estimate?.().catch(() => null);
    if (estimated > MAX_PACK || (quota?.quota && quota.quota - quota.usage < estimated * 1.2))
      throw new Error('Espace insuffisant ou documents supérieurs à 150 Mo.');
    const files = [];
    let bytes = 0;
    for (const [i, doc] of documents.entries()) {
      assertCurrent();
      report('Téléchargement et vérification : ' + (doc.name || 'Document'), i, documents.length);
      try {
        const file = await downloadFile(SB, doc, signal);
        bytes += file.blob.size;
        if (bytes > MAX_PACK) throw new Error('Le pack dépasse 150 Mo.');
        files.push(file);
      } catch (error) { throw new Error((doc.name || 'Document') + ' : ' + error.message); }
      report('Document vérifié : ' + (doc.name || 'Document'), i + 1, documents.length);
    }
    assertCurrent();
    if ((await bounded(SB.getUser(), signal))?.id !== owner) throw new Error('La session a changé.');
    const pack = { version: 1, owner, trip, tables, files, bytes, persistent, savedAt: new Date().toISOString() };
    report('Enregistrement sur cet appareil…', documents.length, documents.length);
    await transaction('readwrite', store => { assertCurrent(); return store.put(pack, 'active'); });
    assertCurrent();
    const saved = await readPack();
    if (saved?.savedAt !== pack.savedAt || saved.files.length !== files.length) throw new Error('Vérification locale impossible.');
    return saved;
  } finally { preparing = false; }
}
export async function showPreparation(SB, tripId, owner) {
  const previous = await readPack();
  if (previous && previous.trip.id !== tripId && !confirm('Remplacer la copie hors ligne de « ' + previous.trip.name + ' » par ce voyage ? L’ancienne restera disponible si le téléchargement échoue.')) return;
  const modal = document.createElement('dialog'), controller = new AbortController();
  modal.style.cssText = 'max-width:440px;width:calc(100% - 32px);max-height:85dvh;overflow:auto;border:1px solid #dbe2de;border-radius:16px;padding:24px;color:#17362b;background:#fff;font:16px/1.5 system-ui';
  modal.innerHTML = '<h2 style="margin-top:0">Préparer hors ligne</h2><p>Programme, notes des journées, hébergements, repas, dépenses et documents PDF/images/texte. Une copie du voyage sur ce téléphone, sans modification des originaux.</p><p>Cartes, météo, liens externes, photos de couverture et outils collaboratifs restent en ligne.</p><p>Les fichiers restent accessibles sur cet appareil déverrouillé. La déconnexion ou la désinstallation les retire.</p><progress style="width:100%" hidden></progress><p role="status" aria-live="polite"></p><button type="button" style="min-height:44px" data-start>Télécharger le voyage</button> <button type="button" style="min-height:44px" data-close>Fermer</button><p><a href="./offline.html">Consulter la copie disponible</a></p>';
  document.body.append(modal); modal.showModal();
  const start = modal.querySelector('[data-start]'), close = modal.querySelector('[data-close]'), status = modal.querySelector('[role=status]'), progress = modal.querySelector('progress');
  let running = false;
  const finish = () => { controller.abort(); modal.close(); modal.remove(); };
  close.onclick = finish;
  modal.addEventListener('cancel', event => { event.preventDefault(); finish(); });
  start.onclick = async () => {
    if (running) return;
    running = true; start.disabled = true; close.textContent = 'Annuler'; progress.hidden = false;
    try {
      const pack = await preparePack(SB, tripId, owner, (message, value, max) => {
        status.textContent = message;
        if (max) { progress.max = max; progress.value = value; } else progress.removeAttribute('value');
      }, controller.signal);
      status.textContent = 'Copie disponible : ' + pack.files.length + ' documents · ' + size(pack.bytes) + '. Teste maintenant en mode avion après avoir fermé puis rouvert l’app.' +
        (pack.persistent ? '' : ' Le stockage protégé contre l’éviction n’a pas été accordé : garde aussi tes billets essentiels ailleurs.');
      start.textContent = 'Actualiser'; start.disabled = false;
    } catch (error) {
      status.textContent = 'Préparation non terminée. ' + error.message + ' La copie précédente, si présente, n’a pas été remplacée.';
      start.textContent = 'Réessayer'; start.disabled = false;
    } finally { running = false; progress.hidden = true; close.textContent = 'Fermer'; }
  };
}
const textLine = (label, value) => value == null || value === '' ? '' : '<p><small>' + esc(label) + '</small><br>' + esc(value) + '</p>';
export async function mountReader(root) {
  let pack = await readPack(), dayIndex = 0, view = 'days', docIndex = -1, pageIndex = 1, zoom = 1, pdf = null, pdfJob = 0, objectUrl = null;
  const dropDocument = () => { pdfJob++; if (pdf) { pdf.destroy(); pdf = null; } if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; } };
  const stepCard = step => '<article class="of-card"><small>' + esc(label(step.type)) + '</small><h3>' +
    esc(step.label || [step.depart, step.arrivee].filter(Boolean).join(' → ') || step.lieu || 'Étape') + '</h3>' +
    textLine('Horaire', [step.time || step.time_check_in, step.time_end || step.time_check_out].filter(Boolean).join(' → ') + (step.next_day ? ' · lendemain' : '')) +
    textLine('Durée', step.duree || step.duree_estimee) + textLine('Lieu', step.lieu) +
    textLine('Trajet', [step.depart, step.arrivee].filter(Boolean).join(' → ')) +
    textLine('Séjour', [step.date_start, step.date_end].filter(Boolean).join(' → ')) +
    textLine('Référence', step.ref) + textLine('Notes', step.note) +
    (step.link ? textLine('Lien (Internet nécessaire)', step.link) : '') + '</article>';
  function render() {
    if (!pack) {
      root.innerHTML = '<h1>Voyage hors ligne</h1><p>Aucune copie disponible. Ouvre un voyage avec Internet puis choisis « Préparer hors ligne ».</p><a class="of-button" href="./index.html?online=1#travel">Revenir à l’app</a>';
      return;
    }
    const days = [...pack.tables.trip_days].sort((a,b) => a.day_index - b.day_index), day = days[dayIndex];
    const steps = pack.tables.trip_steps.filter(step => step.day_id === day?.id).sort((a,b) => a.step_index - b.step_index);
    const hotels = pack.tables.trip_steps.filter(step => {
      if (!['lodging','logement','hotel','hébergement'].includes(String(step.type).toLowerCase())) return false;
      const sourceDay = days.find(d => d.id === step.day_id);
      const start = step.date_start || sourceDay?.date_iso;
      const timestamp = Date.parse(start + 'T12:00:00Z');
      const nights = Number(step.nuits);
      const end = step.date_end || (Number.isFinite(timestamp) && nights > 0 && nights < 3660 ? new Date(timestamp + nights*86400000).toISOString().slice(0,10) : '');
      return start && end && day?.date_iso ? start <= day.date_iso && day.date_iso < end : step.day_id === day?.id;
    });
    const isHotel = step => ['lodging','logement','hotel','hébergement'].includes(String(step.type).toLowerCase());
    const isMeal = step => ['restaurant','repas','meal'].includes(String(step.type).toLowerCase());
    root.innerHTML = '<header><a class="of-button" href="./index.html?online=1#travel">← App</a><span>Copie hors ligne</span><button data-remove aria-label="Supprimer la copie locale">Retirer la copie</button></header><h1>' + esc(pack.trip.name) +
      '</h1><p class="of-muted">Téléchargé le ' + esc(new Date(pack.savedAt).toLocaleString('fr-FR')) + ' · ' + size(pack.bytes) +
      '</p><nav aria-label="Contenu hors ligne">' + [['days','Programme'],['docs','Documents'],['budget','Dépenses']].map(([id,label]) =>
        '<button data-view="' + id + '" aria-pressed="' + (view === id) + '">' + label + '</button>').join('') + '</nav><section id="of-content"></section>';
    const content = root.querySelector('#of-content');
    if (view === 'days') {
      content.innerHTML = (days.length ? '<div class="of-days"><button data-day="-1" aria-label="Jour précédent" ' + (dayIndex === 0 ? 'disabled' : '') + '>‹</button><label>Jour ' + (dayIndex+1) + ' sur ' + days.length +
        '<select aria-label="Choisir une journée">' + days.map((d,i)=>'<option value="'+i+'" '+(i===dayIndex?'selected':'')+'>'+esc(d.title||d.date_iso||'Jour '+(i+1))+'</option>').join('') +
        '</select></label><button data-day="1" aria-label="Jour suivant" '+(dayIndex===days.length-1?'disabled':'')+'>›</button></div><div data-swipe tabindex="0"><small>'+esc(day.date_iso||day.date_label)+'</small><h2>'+esc(day.title||'Ma journée')+'</h2>'+textLine('Note du jour', day.note)+'</div>'+
        '<div class="of-carousel" tabindex="0" role="region" aria-label="Activités à faire défiler">'+steps.filter(s=>!isHotel(s)&&!isMeal(s)).map(stepCard).join('')+'</div>'+
        (steps.filter(s=>!isHotel(s)&&!isMeal(s)).length ? '' : '<p>Aucune activité enregistrée.</p>')+
        '<h2>Cette nuit</h2>'+ (hotels.map(stepCard).join('')||'<p>Aucun hébergement enregistré pour cette nuit.</p>')+
        '<h2>À table</h2>'+(steps.filter(isMeal).map(stepCard).join('')||'<p>Aucun repas enregistré.</p>')+
        textLine('Checklist', Array.isArray(day.todo) ? day.todo.map(item=>typeof item==='string'?item:(item.label||item.text||item.title||'')).filter(Boolean).join('\n') : '')
        : '<p>Aucune journée enregistrée.</p>') + textLine('Notes du voyage', pack.trip.global_note);
      const changeDay = value => { dayIndex = Math.min(days.length-1, Math.max(0,value)); render(); };
      content.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>changeDay(dayIndex+Number(b.dataset.day)));
      const select = content.querySelector('select'); if(select) select.onchange=()=>changeDay(Number(select.value));
      let point;
      const swipe = content.querySelector('[data-swipe]');
      if(swipe) {
        swipe.onpointerdown=e=>{point={x:e.clientX,y:e.clientY};};
        swipe.onpointerup=e=>{if(point && Math.abs(e.clientX-point.x)>60 && Math.abs(e.clientX-point.x)>Math.abs(e.clientY-point.y)*1.5)changeDay(dayIndex+(e.clientX<point.x?1:-1));point=null;};
        swipe.onpointercancel=()=>{point=null;};
        swipe.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();changeDay(dayIndex+(e.key==='ArrowRight'?1:-1));}};
      }
    } else if(view==='docs') {
      content.innerHTML = '<h2>Documents · '+pack.files.length+'</h2><div class="of-list">'+pack.files.map((file,i)=>'<button data-doc="'+i+'"><span>'+esc(file.name)+'</span><small>'+esc(label(file.category))+' · '+size(file.blob.size)+'</small></button>').join('')+'</div>'+(pack.files.length?'':'<p>Aucun document joint à ce voyage.</p>')+'<div id="of-document"></div>';
      content.querySelectorAll('[data-doc]').forEach(button=>button.onclick=()=>openDocument(Number(button.dataset.doc)));
    } else {
      const people = Object.fromEntries(pack.tables.trip_participants.map(p=>[p.id,p.name]));
      content.innerHTML='<h2>Dépenses enregistrées</h2><p class="of-muted">Instantané à la date du téléchargement, sans saisie ni recalcul des remboursements.</p>'+
        pack.tables.budget_items.map(item=>'<article class="of-card"><h3>'+esc(item.description||item.cat||'Dépense')+'</h3>'+textLine('Montant',item.amount)+textLine('Payé par',people[item.paid_by]||item.paid_by)+'</article>').join('')+
        (pack.tables.budget_items.length?'':'<p>Aucune dépense.</p>');
    }
    root.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{dropDocument();view=b.dataset.view;render();});
    root.querySelector('[data-remove]').onclick=async()=>{
      if(!confirm('Supprimer uniquement la copie hors ligne de cet appareil ? Le voyage original reste intact.'))return;
      await forgetPack();dropDocument();pack=null;render();
    };
  }
  async function openDocument(index) {
    dropDocument();docIndex=index;pageIndex=1;zoom=1;
    const file=pack.files[index], target=root.querySelector('#of-document'), job=pdfJob;
    target.innerHTML='<h2>'+esc(file.name)+'</h2><p role="status">Ouverture…</p>';
    target.scrollIntoView({block:'start',behavior:'auto'});
    try {
      if(file.mime==='application/pdf'){
        const loaded=await pdfDocument(file.blob);
        if(job!==pdfJob){await loaded.destroy();return;}
        pdf=loaded; await renderPdf().catch(showPdfError);
      }else if(file.mime.startsWith('image/')){
        objectUrl=URL.createObjectURL(file.blob);
        target.innerHTML='<h2>'+esc(file.name)+'</h2><img class="of-image" alt="'+esc(file.name)+'" src="'+objectUrl+'">';
      }else{
        const text=await file.blob.text();
        if(job!==pdfJob)return;
        target.innerHTML='<h2>'+esc(file.name)+'</h2><pre>'+esc(text)+'</pre>';
      }
    }catch(error){if(job===pdfJob)target.innerHTML='<p role="alert">Impossible d’ouvrir ce document : '+esc(error.message)+'</p>';}
  }
  async function renderPdf() {
    const target=root.querySelector('#of-document'), current=pdf, job=++pdfJob;
    target.innerHTML='<h2>'+esc(pack.files[docIndex].name)+'</h2><div class="of-pdf-controls"><button data-page="-1" aria-label="Page précédente">‹</button><span>Page '+pageIndex+' / '+pdf.numPages+'</span><button data-page="1" aria-label="Page suivante">›</button><button data-zoom="-0.5" aria-label="Réduire">−</button><button data-zoom="0.5" aria-label="Agrandir">+</button></div><div class="of-pdf-scroll"><canvas aria-label="Page du document"></canvas></div><details><summary>Texte du document</summary><p data-pdf-text></p></details>';
    const controls=target.querySelectorAll('button');controls.forEach(b=>b.disabled=true);
    const page=await current.getPage(pageIndex);
    if(job!==pdfJob)return;
    const natural=page.getViewport({scale:1}), width=Math.min(1400,Math.max(280,target.clientWidth)*zoom);
    const viewport=page.getViewport({scale:width/natural.width}), canvas=target.querySelector('canvas');
    const ratio=Math.min(2,devicePixelRatio||1);
    canvas.width=Math.ceil(viewport.width*ratio);canvas.height=Math.ceil(viewport.height*ratio);
    canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
    await page.render({canvasContext:canvas.getContext('2d'),viewport,transform:[ratio,0,0,ratio,0,0]}).promise;
    if(job!==pdfJob)return;
    const text=await page.getTextContent();
    if(job!==pdfJob)return;
    target.querySelector('[data-pdf-text]').textContent=text.items.map(item=>item.str||'').join(' ');
    controls.forEach(b=>b.disabled=false);
    target.querySelector('[data-page="-1"]').disabled=pageIndex<=1;
    target.querySelector('[data-page="1"]').disabled=pageIndex>=pdf.numPages;
    target.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{pageIndex+=Number(b.dataset.page);renderPdf().catch(showPdfError);});
    target.querySelectorAll('[data-zoom]').forEach(b=>b.onclick=()=>{zoom=Math.max(0.5,Math.min(3,zoom+Number(b.dataset.zoom)));renderPdf().catch(showPdfError);});
  }
  function showPdfError(error){const target=root.querySelector('#of-document');if(target)target.innerHTML='<p role="alert">'+esc(error.message)+'</p>';}
  window.addEventListener('storage',event=>{if(event.key===OWNER){dropDocument();pack=null;render();}});
  const today=new Date().toLocaleDateString('en-CA');
  if(pack)dayIndex=Math.max(0,[...pack.tables.trip_days].sort((a,b)=>a.day_index-b.day_index).findIndex(d=>d.date_iso===today));
  render();
}

const offlineRoot = document.getElementById('offline-root');
if (offlineRoot) mountReader(offlineRoot).catch(error => { offlineRoot.textContent = 'Copie indisponible : ' + error.message; });

