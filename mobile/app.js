const app = document.getElementById('app');

let mobileSB = null;
let mobileUser = null;
let mobileTrips = [];
let activeTrip = null;
let mobileReady = false;
let pendingMobileInvite = null;
let pendingMobileInviteInfo = null;
let showAllTrips = false;
let mobileSupabaseReady = false;
let mobileSupabaseError = '';

function getMobileTheme() {
  return localStorage.getItem('mobileTheme') || 'light';
}

function applyMobileTheme(theme = getMobileTheme()) {
  document.documentElement.classList.toggle('theme-dark', theme === 'dark');
  localStorage.setItem('mobileTheme', theme);
}

function toggleMobileTheme() {
  const nextTheme = getMobileTheme() === 'dark' ? 'light' : 'dark';
  applyMobileTheme(nextTheme);
  renderAccount();
}

async function handleUpdateMobileProfile() {
  const input = document.querySelector('#account-display-name');
  const displayName = input?.value.trim();

  if (!displayName) {
    alert('Le pseudo ne peut pas être vide.');
    return;
  }

  try {
    await window.SB.sb.auth.updateUser({
      data: { display_name: displayName }
    });

    if (mobileUser?.id) {
      await window.SB.sb
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', mobileUser.id);
    }

    mobileUser = {
      ...mobileUser,
      user_metadata: {
        ...(mobileUser?.user_metadata || {}),
        display_name: displayName
      }
    };

    renderAccount();
  } catch (error) {
    alert('Erreur mise à jour profil : ' + (error.message || error));
  }
}

applyMobileTheme();

async function bootMobileSupabase() {
  if (window.SB) {
    mobileSB = window.SB;
    mobileSupabaseReady = true;
    return window.SB;
  }

  try {
    mobileSB = await import('./lib/supabase.js');
    window.SB = mobileSB;

    mobileSupabaseReady = true;
    mobileSupabaseError = '';

    window.dispatchEvent(new Event('sb-ready'));

    return mobileSB;
  } catch (error) {
    console.error('Supabase mobile import failed:', error);

    mobileSupabaseReady = false;
    mobileSupabaseError = error.message || String(error);
    mobileReady = true;

    window.dispatchEvent(new Event('sb-ready'));

    return null;
  }
}

async function waitForSupabase() {
  if (window.SB) return window.SB;

  const SB = await bootMobileSupabase();

  if (SB) return SB;

  return null;
}

function getTripDurationDays(startDate, endDate) {
  if (!startDate) return 1;
  if (!endDate) return 1;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = Math.round((end - start) / 86400000) + 1;

  return Math.max(1, diff || 1);
}

function getInviteTokenFromUrl() {
  return new URLSearchParams(window.location.search).get('invite')
    || localStorage.getItem('pendingTripInvite');
}

function clearInviteTokenFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('invite');
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}

async function loadPendingMobileInvite() {
  pendingMobileInvite = getInviteTokenFromUrl();

  if (!pendingMobileInvite || !window.SB?.getInvite) {
    pendingMobileInviteInfo = null;
    return;
  }

  try {
    pendingMobileInviteInfo = await window.SB.getInvite(pendingMobileInvite);
    localStorage.setItem('pendingTripInvite', pendingMobileInvite);
    clearInviteTokenFromUrl();
  } catch (error) {
    console.warn('Mobile invite load error:', error);
    pendingMobileInvite = null;
    pendingMobileInviteInfo = null;
    localStorage.removeItem('pendingTripInvite');
  }
}

async function acceptPendingMobileInvite() {
  const token = pendingMobileInvite || localStorage.getItem('pendingTripInvite');
  if (!token) return false;

  if (!mobileUser) {
    navigate('auth');
    return false;
  }

  try {
    const tripId = await window.SB.acceptInvite(token);
    localStorage.removeItem('pendingTripInvite');
    pendingMobileInvite = null;
    pendingMobileInviteInfo = null;

    await refreshMobileTrips(tripId);
    navigate('itinerary');
    alert('Invitation acceptée. Bienvenue dans le voyage.');
    return true;
  } catch (error) {
    localStorage.removeItem('pendingTripInvite');
    pendingMobileInvite = null;
    pendingMobileInviteInfo = null;
    alert('Invitation invalide : ' + (error.message || error));
    navigate('home');
    return false;
  }
}

async function initMobileData() {
  const SB = await waitForSupabase();
  
    if (SB) {
    await loadPendingMobileInvite();
  }

  try {
    if (!SB) {
      mobileUser = null;
      mobileTrips = [];
      activeTrip = null;
      return;
    }

    mobileUser = await SB.getUser();

    if (!mobileUser) {
      mobileTrips = [];
      activeTrip = null;
      return;
    }

    await refreshMobileTrips();
  } catch (error) {
    console.warn('Mobile Supabase init error:', error);

    mobileUser = null;
    mobileTrips = [];
    activeTrip = null;
  } finally {
    mobileReady = true;
  }
}

async function refreshMobileTrips(activeTripId = null) {
  if (!window.SB || !mobileUser) return;

  mobileTrips = await window.SB.listMyTrips();

  const selectedId = activeTripId || activeTrip?.id || mobileTrips[0]?.id;
  activeTrip = selectedId ? await window.SB.loadTrip(selectedId) : null;
}

const trips = [
  {
    title: 'Paris Printemps',
    date: 'Mai 2024',
    status: 'En préparation',
    image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?q=80&w=900&auto=format&fit=crop'
  },
  {
    title: 'Retraite Marocaine',
    date: 'Oct 2023',
    status: 'Passé',
    past: true,
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=900&auto=format&fit=crop'
  }
];

const expenses = [
  {
    group: "Aujourd'hui",
    items: [
      { title: 'Dîner Izakaya', payer: 'Mathis', amount: '- 85,00 €', icon: '🍴', tone: 'secondary' },
      { title: 'Shinkansen Kyoto', payer: 'Margot', amount: '- 120,00 €', icon: '▣', tone: 'primary' }
    ]
  },
  {
    group: 'Hier',
    items: [
      { title: 'Café & Matcha', payer: 'Mathis', amount: '- 15,50 €', icon: '☕', tone: 'tertiary' },
      { title: 'Musée National', payer: 'Margot', amount: '- 30,00 €', icon: '▰', tone: 'neutral' }
    ]
  }
];

const expenseCategories = [
  { id: 'meal', label: 'Repas', icon: 'restaurant', tone: 'tertiary', emoji: '🍴' },
  { id: 'transport', label: 'Transport', icon: 'directions_car', tone: 'primary', emoji: '▣' },
  { id: 'hotel', label: 'Hôtel', icon: 'local_hotel', tone: 'neutral', emoji: '▤' },
  { id: 'activity', label: 'Activités', icon: 'local_activity', tone: 'tertiary', emoji: '◉' },
  { id: 'shopping', label: 'Achats', icon: 'shopping_bag', tone: 'secondary', emoji: '◒' },
  { id: 'coffee', label: 'Café', icon: 'local_cafe', tone: 'tertiary', emoji: '☕' },
  { id: 'flight', label: 'Vols', icon: 'flight', tone: 'primary', emoji: '✈' },
  { id: 'other', label: 'Autre', icon: 'more_horiz', tone: 'neutral', emoji: '...' }
];

let selectedExpenseCategory = 'meal';
let selectedExpensePayer = 'me';
let selectedExpenseSplit = 'equal';
let isEditingExpenseCategories = false;
let expenseModal = null;
let isEditingBudgetPeople = false;
let editingExpenseDraft = null;
let editingExpenseGroupIndex = null;
let editingExpenseItemIndex = null;
let showAllExpensePayers = false;
let showAllExpenseSplits = false;

const budgetCategories = [
  { label: 'Transport', percent: '45% du budget', amount: '256,50 €', icon: 'flight', tone: 'primary' },
  { label: 'Logement', percent: '30% du budget', amount: '171,00 €', icon: 'hotel', tone: 'tertiary' },
  { label: 'Repas', percent: '15% du budget', amount: '85,50 €', icon: 'restaurant', tone: 'accent' },
  { label: 'Autres', percent: '10% du budget', amount: '57,00 €', icon: 'more_horiz', tone: 'neutral' }
];

const budgetBalances = [
  { name: 'Mathis', paid: '1 250,00 €', balance: '+ 226,00 €', tone: 'positive', initials: 'M' },
  { name: 'Margot', paid: '798,00 €', balance: '- 226,00 €', tone: 'negative', initials: 'Ma' }
];

const budgetSettlement = {
  from: 'Margot',
  fromInitials: 'Ma',
  to: 'Mathis',
  toInitials: 'M',
  amount: '226,00 €'
};

const docCategoryMeta = [
  { id: 'flights', label: "Billets d'avion", icon: 'flight', tone: 'primary' },
  { id: 'hotels', label: 'Hébergements', icon: 'hotel', tone: 'accent' },
  { id: 'identity', label: 'Identité', icon: 'badge', tone: 'secondary' },
  { id: 'insurance', label: 'Assurances', icon: 'health_and_safety', tone: 'tertiary' },
  { id: 'other', label: 'Autres documents', icon: 'folder', tone: 'secondary' }
];

let activeDocId = null;
let mobileDocuments = [];

function getTripDocuments() {
  return mobileDocuments;
}

async function refreshMobileDocuments() {
  if (!activeTrip?.id || !window.SB?.listDocuments) {
    mobileDocuments = [];
    return;
  }

  try {
    mobileDocuments = await window.SB.listDocuments(activeTrip.id);
  } catch (error) {
    console.error('Mobile documents refresh error:', error);
    mobileDocuments = [];
  }
}

function getDocCategories() {
  const documents = getTripDocuments();

  return docCategoryMeta.map(category => ({
    ...category,
    files: documents.filter(document => document.category === category.id)
  }));
}

function formatDocSize(bytes) {
  if (!bytes) return 'Taille inconnue';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getDocFileType(file) {
  if (file.type?.includes('pdf')) return 'pdf';
  if (file.type?.includes('image')) return 'image';
  return 'file';
}

function readFileAsDataUrl(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

async function handleAddDocuments(files) {
  const selectedFiles = [...files || []];
  if (!selectedFiles.length) return;

  if (!activeTrip?.id) {
    alert('Sélectionne un voyage avant d’ajouter un document.');
    return;
  }

  if (!window.SB?.uploadDocument) {
    alert('Supabase documents indisponible.');
    return;
  }

  const category = prompt(
    "Catégorie ? flights, hotels, identity, insurance ou other",
    'other'
  ) || 'other';

  const safeCategory = docCategoryMeta.some(item => item.id === category) ? category : 'other';

  try {
    for (const file of selectedFiles) {
      await window.SB.uploadDocument(activeTrip.id, file, safeCategory);
    }

    await refreshMobileDocuments();
    renderDocs();
  } catch (error) {
    alert('Erreur upload document : ' + (error.message || error));
  }
}

async function handleDeleteDocument(docId) {
  if (!confirm('Supprimer ce document ?')) return;

  try {
    await window.SB.deleteDocument(docId);
    await refreshMobileDocuments();
    activeDocId = null;
    renderDocs();
  } catch (error) {
    alert('Erreur suppression document : ' + (error.message || error));
  }
}

function getDocumentById(docId) {
  return getTripDocuments().find(document => document.id === docId) || null;
}

const mapMarkers = [
  { icon: 'hotel', label: 'Hôtel', top: '32%', left: '24%', active: false },
  { icon: 'tour', label: 'DMZ Tour', top: '50%', left: '66%', active: true },
  { icon: 'restaurant', label: 'Restaurant', top: '67%', left: '50%', active: false }
];

const itinerarySteps = [
  {
    time: '08:00',
    type: 'Transport',
    title: 'Bus vers la DMZ',
    description: 'Départ depuis la station de Séoul. Préparez vos passeports pour les contrôles.',
    icon: 'directions_bus',
    tone: 'accent'
  },
  {
    time: '10:30',
    type: 'Activité',
    title: 'Exploration du Tunnel n°3',
    description: "Descente dans le tunnel d'infiltration. Casque obligatoire fourni sur place.",
    icon: 'explore',
    tone: 'petrol'
  }
];

const stepCategories = [
  { id: 'transport', label: 'Transport', icon: 'directions_car' },
  { id: 'lodging', label: 'Logement', icon: 'bed' },
  { id: 'activity', label: 'Activité', icon: 'attractions' },
  { id: 'restaurant', label: 'Restaurant', icon: 'restaurant' }
];

const transportModeLabels = {
  train: 'Train',
  avion: 'Avion',
  bus: 'Bus',
  voiture: 'Voiture'
};

const stepFieldSets = {
  transport: {
    type: 'Transport',
    timelineIcon: 'directions_car',
    sectionTitle: 'Détails du transport',
    defaultTime: '08:00',
    fallbackTitle: 'Nouveau transport',
    fallbackDescription: 'Trajet ajouté au programme.'
  },
  lodging: {
    type: 'Logement',
    timelineIcon: 'bed',
    sectionTitle: 'Détails du logement',
    defaultTime: '15:00',
    fallbackTitle: 'Nouveau logement',
    fallbackDescription: 'Logement ajouté au programme.',
    fields: [
      { name: 'title', icon: 'bed', placeholder: "Nom de l'hôtel / logement", type: 'text' },
      { name: 'location', icon: 'location_on', placeholder: 'Adresse / Lieu', type: 'text', autocomplete: true },
      { name: 'timeCheckIn', icon: 'login', type: 'time', value: '15:00', aria: 'Heure de check-in', compact: true },
      { name: 'timeCheckOut', icon: 'logout', type: 'time', value: '11:00', aria: 'Heure de check-out', compact: true },
      { name: 'reference', icon: 'confirmation_number', placeholder: 'Référence / réservation', type: 'text', compact: true },
      { name: 'duration', icon: 'bedtime', placeholder: 'Nombre de nuits', type: 'number', compact: true },
      { name: 'notes', icon: 'notes', placeholder: 'Code, réservation, contact...', textarea: true }
    ]
  },
  activity: {
    type: 'Activité',
    timelineIcon: 'attractions',
    sectionTitle: "Détails de l'étape",
    defaultTime: '09:00',
    fallbackTitle: 'Nouvelle activité',
    fallbackDescription: 'Activité ajoutée au programme.',
    fields: [
      { name: 'title', icon: 'local_activity', placeholder: "Nom de l'activité (ex: Musée, Randonnée)", type: 'text' },
      { name: 'location', icon: 'location_on', placeholder: 'Adresse / Lieu', type: 'text', autocomplete: true },
      { name: 'time', icon: 'schedule', type: 'time', value: '09:00', aria: 'Heure de début', compact: true },
      { name: 'duration', icon: 'timer', placeholder: 'Durée (ex: 2h)', type: 'text', compact: true },
      { name: 'notes', icon: 'notes', placeholder: 'Numéro de réservation, notes ou détails importants...', textarea: true }
    ]
  },
  restaurant: {
    type: 'Restaurant',
    timelineIcon: 'restaurant',
    sectionTitle: "Détails de l'étape",
    defaultTime: '20:00',
    fallbackTitle: 'Nouveau restaurant',
    fallbackDescription: 'Restaurant ajouté au programme.',
    fields: [
      { name: 'title', icon: 'restaurant', placeholder: 'Nom du restaurant', type: 'text' },
      { name: 'location', icon: 'location_on', placeholder: 'Adresse / Lieu', type: 'text', autocomplete: true },
      { name: 'time', icon: 'schedule', type: 'time', value: '20:00', aria: 'Heure de réservation' },
      { name: 'notes', icon: 'notes', placeholder: 'Numéro de réservation, notes ou détails importants...', textarea: true }
    ]
  }
};

let selectedStepCategory = 'transport';
let editingStepDraft = null;
let mapStepDraft = null;
let transportStopoverUid = 0;

function icon(symbol, className = '') {
  return `<span class="${className}" aria-hidden="true">${symbol}</span>`;
}

const MAPTILER_KEY = '08IwMKKAkP3BQJss5poF';

let mobileMapInstance = null;
let mobileMapMarkers = [];
let mobileMapSearchTimer = null;
let mobileMapStyle = 'plan';
let mobileMapSelectedPlace = null;
let mobileMapSelectedPlaceType = 'activity';
let mobileMapSelectedDayIndex = 0;
let mobileMapFocusedStepIndex = null;
let mobileMapLocatingStep = null;
let mobileMapPanelDayIndex = null;
let mobileMapTourTimer = null;
let mobileMapTouring = false;
let showAllMobileMapSteps = false;
let mobileMapDestinationMarker = null;
let mobileMapSearchMarker = null;
let mobileMapToolsOpen = false;
let mobileMapActionsOpen = false;
let mobileRouteCalculatorOpen = false;
let mobileRouteCalculatorResult = null;
let mobileRouteCalculatorCompact = false;
let mobileRouteCalculatorBusy = false;
let mobileRouteCalculatorDraft = {
  from: '',
  fromLat: null,
  fromLng: null,
  to: '',
  toLat: null,
  toLng: null,
  waypoints: [],
  mode: 'driving'
};
let mobileMapSheetOpen = false;
let mobileMapDaysOpen = false;
let mobileMapRestoreCamera = null;

function attachAutocomplete(input) {
  if (!input || input.dataset.acReady) return;
  input.dataset.acReady = 'true';

  const wrapper = input.closest('.input-shell') || input.closest('.step-input') || input.parentElement;
  wrapper.style.position = 'relative';

  const dropdown = document.createElement('div');
  dropdown.className = 'ac-dropdown';
  wrapper.appendChild(dropdown);

  let timer = null;

  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) { dropdown.innerHTML = ''; dropdown.style.display = 'none'; return; }

    timer = setTimeout(async () => {
      try {
        const url = 'https://api.maptiler.com/geocoding/' + encodeURIComponent(q) + '.json?key=' + MAPTILER_KEY + '&language=fr&limit=5';
        const res = await fetch(url);
        const data = await res.json();
        if (!data.features || !data.features.length) { dropdown.style.display = 'none'; return; }

        dropdown.style.display = 'block';
        dropdown.innerHTML = data.features.map((f, i) => 
          '<button class="ac-item" type="button" data-idx="' + i + '">' +
          '<span class="material-symbols-outlined">location_on</span>' +
          '<span>' + escapeHtml(f.place_name) + '</span>' +
          '</button>'
        ).join('');

        dropdown.querySelectorAll('.ac-item').forEach((btn, i) => {
          btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const feat = data.features[i];
            input.value = feat.place_name;
            input.dataset.lat = feat.center[1];
            input.dataset.lng = feat.center[0];
            dropdown.style.display = 'none';
          });
        });
      } catch (err) {
        console.warn('Geocoding error:', err);
      }
    }, 350);
  });

  input.addEventListener('blur', () => {
    setTimeout(() => { dropdown.style.display = 'none'; }, 200);
  });
}

function initAutocompleteOnPage() {
  setTimeout(() => {
    document.querySelectorAll('[data-autocomplete]').forEach(input => attachAutocomplete(input));
  }, 150);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[character]));
}

function getTripDraft() {
  try {
    return JSON.parse(localStorage.getItem('atelierTripDraft')) || {};
  } catch {
    return {};
  }
}

function saveTripDraft(draft) {
  localStorage.setItem('atelierTripDraft', JSON.stringify(draft));
}

function formatDateLabel(value, fallback) {
  if (!value) return fallback;
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date);
}

function getCreateTripFormData() {
  const companions = [...document.querySelectorAll('[data-companion-chip]')]
    .map(chip => chip.dataset.companionName)
    .filter(Boolean);

  return {
    destination: document.querySelector('#destination')?.value.trim() || '',
    startDate: document.querySelector('#start-date')?.value || '',
    endDate: document.querySelector('#end-date')?.value || '',
    companions
  };
}

function renderStepField(field) {
    const draft = editingStepDraft || mapStepDraft || {};
  const draftValue =
    draft[field.name] ||
    (field.name === 'title' ? draft.label || draft.title || '' : '') ||
    (field.name === 'location' ? draft.lieu || draft.location || draft.place || '' : '') ||
    (field.name === 'notes' ? draft.note || draft.notes || draft.description || '' : '') ||
    (field.name === 'timeCheckIn' ? draft.timeCheckIn || draft.time || '' : '') ||
    (field.name === 'timeCheckOut' ? draft.timeCheckOut || draft.timeEnd || '' : '') ||
    (field.name === 'reference' ? draft.ref || draft.reference || '' : '') ||
    (field.name === 'duration' ? draft.duree || draft.duration || '' : '');
  const draftLat = field.name === 'location' ? draft.lat || '' : '';
  const draftLng = field.name === 'location' ? draft.lng || '' : '';

  const common = `name="${field.name}" ${field.aria ? `aria-label="${field.aria}"` : ''} ${field.autocomplete ? 'data-autocomplete' : ''} ${draftLat ? `data-lat="${escapeHtml(draftLat)}"` : ''} ${draftLng ? `data-lng="${escapeHtml(draftLng)}"` : ''}`;
  const control = field.textarea
        ? `<textarea ${common} rows="3" placeholder="${field.placeholder}">${escapeHtml(draftValue)}</textarea>`
    : `<input ${common} type="${field.type || 'text'}" value="${escapeHtml(draftValue || field.value || '')}" ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}>`;

  return `
    <label class="step-input ${field.compact ? 'compact' : 'full'} ${field.textarea ? 'textarea' : ''}">
      <span class="material-symbols-outlined" aria-hidden="true">${field.icon}</span>
      ${control}
    </label>
  `;
}

function createTransportStopoverHtml(index) {
  return `
    <div class="transport-stopover" data-stopover-row>
      <div class="transport-stopover-head">
        <span class="transport-subtitle">Escale ${index + 1}</span>
        <button type="button" data-action="remove-transport-stopover" aria-label="Supprimer l'escale">
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </div>

      <label class="step-input full">
        <span class="material-symbols-outlined" aria-hidden="true">connecting_airports</span>
        <input name="stopoverPlace[]" type="text" placeholder="Ville / aéroport / gare d'escale..." data-autocomplete>
      </label>

      <div class="step-form-grid">
        <label class="step-input compact time-only">
          <input name="stopoverArrivalTime[]" type="time" aria-label="Heure d'arrivée à l'escale">
        </label>

        <label class="step-input compact time-only">
          <input name="stopoverDepartureTime[]" type="time" aria-label="Heure de départ de l'escale">
        </label>
      </div>
    </div>
  `;
}

function addTransportStopoverField() {
  const list = document.querySelector('[data-stopover-list]');
  if (!list) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = createTransportStopoverHtml(transportStopoverUid++);
  list.appendChild(wrapper.firstElementChild);

  initAutocompleteOnPage();
}

function renderTransportStepFields() {
    const draft = editingStepDraft || mapStepDraft || {};
      const draftMode = draft.transportType || draft.mode || 'train';
  const draftDeparture = draft.depart || draft.departure || '';
  const draftArrival = draft.arrivee || draft.arrival || draft.location || '';
  const draftReference = draft.ref || draft.reference || '';
  const draftNotes = draft.note || draft.notes || draft.description || '';
  return `
    <label class="step-input select full">
      <span class="material-symbols-outlined" aria-hidden="true">directions_transit</span>
      <select name="mode" aria-label="Mode de transport">
        <option value="train" ${draftMode === 'train' ? 'selected' : ''}>Train</option>
<option value="avion" ${draftMode === 'avion' ? 'selected' : ''}>Avion</option>
<option value="bus" ${draftMode === 'bus' ? 'selected' : ''}>Bus</option>
<option value="voiture" ${draftMode === 'voiture' ? 'selected' : ''}>Voiture</option>
        <option value="avion">Avion</option>
        <option value="bus">Bus</option>
        <option value="voiture">Voiture</option>
      </select>
      <span class="material-symbols-outlined select-arrow" aria-hidden="true">expand_more</span>
    </label>

    <div class="transport-subgroup">
      <span class="transport-subtitle">Départ</span>
      <div class="transport-grid">
        <label class="step-input compact place">
          <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
          <input name="departure" type="text" placeholder="Gare de départ..." data-autocomplete value="${escapeHtml(draftDeparture)}">
        </label>
        <label class="step-input compact time-only">
          <input name="time" type="time" value="${escapeHtml(draft.time || '08:00')}" aria-label="Heure de départ">
        </label>
      </div>
    </div>

    <div class="transport-subgroup">
      <span class="transport-subtitle">Arrivée</span>
      <div class="transport-grid">
        <label class="step-input compact place">
          <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
          <input name="arrival" type="text" placeholder="Gare d'arrivée..." data-autocomplete value="${escapeHtml(draft.location || draft.arrivee || '')}" ${draft.lat ? `data-lat="${escapeHtml(draft.lat)}"` : ''} ${draft.lng ? `data-lng="${escapeHtml(draft.lng)}"` : ''}>
        </label>
        <label class="step-input compact time-only">
          <input name="arrivalTime" type="time" value="${escapeHtml(draft.timeEnd || draft.arrivalTime || '10:30')}" aria-label="Heure d'arrivée">
        </label>
      </div>
      <label class="step-checkbox">
        <input name="nextDay" type="checkbox" value="yes">
        <span>Arrivée le lendemain</span>
      </label>
    </div>

    <div class="step-form-grid">
      <label class="step-input compact">
        <span class="material-symbols-outlined" aria-hidden="true">confirmation_number</span>
        <input name="reference" type="text" placeholder="Référence (ex: AF267)" value="${escapeHtml(draftReference)}">
      </label>
            <button class="step-input compact transport-add-stopover" type="button" data-action="add-transport-stopover">
        <span class="material-symbols-outlined" aria-hidden="true">alt_route</span>
        <span>Ajouter une escale</span>
      </button>
    </div>

    <div class="transport-stopover-list" data-stopover-list></div>
    <label class="step-input textarea full">
      <span class="material-symbols-outlined" aria-hidden="true">notes</span>
      <textarea name="notes" rows="3" placeholder="Notes ou détails importants...">${escapeHtml(draftNotes)}</textarea>
    </label>
  `;
}

function renderStepFields(categoryId = selectedStepCategory) {
  if (categoryId === 'transport') return renderTransportStepFields();

  const fields = stepFieldSets[categoryId]?.fields || stepFieldSets.restaurant.fields;
  const output = [];

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const nextField = fields[index + 1];

    if (field.compact && nextField?.compact) {
      output.push(`
        <div class="step-form-grid">
          ${renderStepField(field)}
          ${renderStepField(nextField)}
        </div>
      `);
      index += 1;
      continue;
    }

    output.push(renderStepField(field));
  }

  return output.join('');
}

function getNewStepFormData() {
  const form = document.querySelector('[data-step-form]');
  if (!form) return {};

  const data = Object.fromEntries(new FormData(form).entries());

  ['location', 'departure', 'arrival'].forEach(name => {
    const input = form.querySelector(`[name="${name}"]`);
    if (!input) return;

    data[`${name}Lat`] = input.dataset.lat || '';
    data[`${name}Lng`] = input.dataset.lng || '';
  });

  data.stopovers = [...form.querySelectorAll('[data-stopover-row]')].map(row => {
    const place = row.querySelector('[name="stopoverPlace[]"]');
    const arrivalTime = row.querySelector('[name="stopoverArrivalTime[]"]');
    const departureTime = row.querySelector('[name="stopoverDepartureTime[]"]');

    return {
      place: place?.value.trim() || '',
      arrivalTime: arrivalTime?.value || '',
      departureTime: departureTime?.value || '',
      lat: place?.dataset.lat || '',
      lng: place?.dataset.lng || ''
    };
  }).filter(stopover => stopover.place);

  return data;
}

function getStepCategoryConfig(type = '') {
  return stepFieldSets[type] || stepFieldSets.restaurant;
}

function getStepTypeLabel(type = '') {
  const category = stepCategories.find(item => item.id === type);
  return category?.label || 'Étape';
}

function getStepTimelineIcon(type = '') {
  const config = getStepCategoryConfig(type);
  return config.timelineIcon || 'place';
}

function getStepTimelineTone(type = '') {
  return type === 'restaurant' ? 'accent' : 'petrol';
}

function getStepDisplayTitle(step) {
  if (!step) return 'Étape';

  if (step.label) return step.label;

  if (step.type === 'transport') {
    const mode = transportModeLabels[step.transportType] || 'Transport';
    const departure = step.depart || 'Départ';
    const arrival = step.arrivee || 'Arrivée';

    return `${mode} ${departure} → ${arrival}`;
  }

  return getStepTypeLabel(step.type);
}

function getStepDisplayDescription(step) {
  if (!step) return '';

  const parts = [];

  if (step.lieu) parts.push(step.lieu);
  if (step.duree) parts.push(step.duree);
  if (step.timeEnd) parts.push(`Fin ${step.timeEnd}`);
  if (step.nextDay) parts.push('Arrivée le lendemain');
  if (step.ref) parts.push(`Réf. ${step.ref}`);
  if (step.note) parts.push(step.note);

  return parts.filter(Boolean).join(' • ');
}

function getCurrentTimelineSteps() {
  const firstDay = activeTrip?.days?.[0];

  if (firstDay?.steps?.length) {
    return firstDay.steps.map(step => ({
      id: step.id,
      time: step.time || '09:00',
      type: getStepTypeLabel(step.type),
      title: getStepDisplayTitle(step),
      description: getStepDisplayDescription(step) || 'Détail à compléter',
      icon: getStepTimelineIcon(step.type),
      tone: getStepTimelineTone(step.type),
      synced: true
    }));
  }

  return itinerarySteps.map(step => ({
    ...step,
    synced: false
  }));
}

function getActiveTripDayForNewStep() {
  return activeTrip?.days?.[0] || null;
}

function topbar() {
  return `
    <header class="topbar">
      <button class="icon-button" type="button" aria-label="Ouvrir le menu">
        <span class="material-symbols-outlined" aria-hidden="true">menu</span>
      </button>
      <h1 class="topbar-title" data-action="home" style="cursor:pointer">L'Atelier</h1>
      <button class="icon-button" type="button" data-action="account" aria-label="Ouvrir le profil">
        <span class="material-symbols-outlined" aria-hidden="true">account_circle</span>
      </button>
    </header>
  `;
}

function bottomNav(active = 'plan') {
  const items = [
    { route: 'itinerary', id: 'plan', icon: 'event_note', label: 'Plan' },
    { route: 'map', id: 'map', icon: 'map', label: 'Carte' },
    { route: 'budget', id: 'budget', icon: 'payments', label: 'Budget' },
    { route: 'docs', id: 'docs', icon: 'description', label: 'Documents' }
  ];

  return `
    <nav class="bottom-nav" aria-label="Navigation mobile">
      ${items.map(item => `
        <button class="nav-item ${active === item.id ? 'active' : ''}" type="button" data-action="${item.route}">
          <span class="material-symbols-outlined" aria-hidden="true">${item.icon}</span>
          <span>${item.label}</span>
        </button>
      `).join('')}
    </nav>
  `;
}

function renderHome() {
  const realTrips = mobileTrips || [];
  const visibleTrips = showAllTrips ? realTrips : realTrips.slice(0, 2);
  const nextTrip = activeTrip || realTrips[0] || null;

  const nextTripName = nextTrip?.name || 'Aucun voyage';
  const nextTripDate = nextTrip?.startDate || nextTrip?.start_date || '';

  const syncStatus = mobileSupabaseError
    ? 'Mode local · Supabase indisponible'
    : !mobileReady
      ? 'Chargement des données...'
      : mobileUser
        ? 'Connecté à vos voyages Supabase'
        : 'Mode local · connectez-vous';

  app.innerHTML = `
    <div class="mobile-shell">
      ${topbar()}

      <main class="home-main">
        <section class="home-hero">
          <p class="kicker">Votre Carnet</p>
          <h2 class="hero-title">Où commence votre prochaine escale ?</h2>
          <p class="mobile-sync-status">${syncStatus}</p>
        </section>

        <section class="next-trip-card" aria-label="Prochain départ" data-action="itinerary" style="cursor:pointer">
          <div class="next-trip-content">
            <span class="badge">Prochain départ</span>
            <h3 class="next-trip-title">${escapeHtml(nextTripName)}</h3>
            <div>
              <div class="next-trip-row">
                <div class="date-row">
                  <span class="countdown">${nextTrip ? 'Prêt' : '—'}</span>
                  <span class="mono">${nextTripDate ? formatDateLabel(nextTripDate, '') : 'Créez votre premier voyage'}</span>
                </div>
                <span class="mono percent">${nextTrip ? '80%' : '0%'}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width:${nextTrip ? '80%' : '0%'}"></div>
              </div>
            </div>
          </div>
        </section>

        <button class="create-adventure" type="button" data-action="create-trip">
          <span class="plus">+</span>
          <span>Créer une nouvelle aventure</span>
        </button>

        <section>
          <div class="section-heading">
            <h3>Mes Voyages</h3>
            <button class="section-link" type="button" data-action="toggle-all-trips">
              ${showAllTrips ? 'Réduire' : 'Tout voir'}
            </button>
          </div>

          <div class="trip-strip ${showAllTrips ? 'expanded' : ''}">
            ${visibleTrips.length ? visibleTrips.map(trip => `
              <article class="trip-card" data-action="open-trip" data-trip-id="${trip.id}" style="cursor:pointer">
                <div class="trip-image" style="background-image: url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900&auto=format&fit=crop')">
                  <span class="trip-status">Synchronisé</span>
                </div>

                <div class="trip-body">
                  <h4>${escapeHtml(trip.name || 'Voyage sans titre')}</h4>
                  <div class="trip-date mono">
                    ${trip.start_date ? formatDateLabel(trip.start_date, '') : 'Sans date'}
                  </div>

                  <div class="item-actions">
                    <button class="icon-mini" type="button" data-action="rename-trip" data-trip-id="${trip.id}" aria-label="Renommer le voyage">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="icon-mini danger" type="button" data-action="delete-trip" data-trip-id="${trip.id}" aria-label="Supprimer le voyage">
                      <span class="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>
              </article>
            `).join('') : `
              <p class="companion-empty">
                ${mobileReady ? 'Aucun voyage pour le moment.' : 'Chargement de vos voyages...'}
              </p>
            `}
          </div>
        </section>
      </main>

      ${bottomNav('plan')}
    </div>
  `;
}


function getMobileMapSteps() {
  const days = activeTrip?.days || [];

  return days.flatMap((day, dayIndex) =>
    (day.steps || []).flatMap((step, stepIndex) => {
      const points = [];
      const stepLat = Number(step.lat);
      const stepLng = Number(step.lng);

      if (Number.isFinite(stepLat) && Number.isFinite(stepLng)) {
        points.push({
          ...step,
          dayIndex,
          stepIndex,
          pointKind: 'step',
          parentStepIndex: stepIndex,
          dayTitle: day.title || `Jour ${dayIndex + 1}`,
          lat: stepLat,
          lng: stepLng
        });
      }

      if (Array.isArray(step.escales)) {
        step.escales.forEach((stopover, stopoverIndex) => {
          const lat = Number(stopover.lat);
          const lng = Number(stopover.lng);

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

          points.push({
            ...step,
            id: `${step.id || stepIndex}-stopover-${stopoverIndex}`,
            label: stopover.place || stopover.name || `Escale ${stopoverIndex + 1}`,
            lieu: stopover.place || '',
            time: stopover.arrivalTime || stopover.departureTime || '',
            dayIndex,
            stepIndex: `${stepIndex}.${stopoverIndex}`,
            pointKind: 'stopover',
            parentStepIndex: stepIndex,
            stopoverIndex,
            dayTitle: day.title || `Jour ${dayIndex + 1}`,
            lat,
            lng
          });
        });
      }

      return points;
    })
  );
}

function getMobileMapUnlocatedSteps() {
  const days = activeTrip?.days || [];

  return days.flatMap((day, dayIndex) =>
    (day.steps || []).map((step, stepIndex) => ({
      ...step,
      dayIndex,
      stepIndex,
      dayTitle: day.title || `Jour ${dayIndex + 1}`,
      lat: Number(step.lat),
      lng: Number(step.lng)
    }))
  ).filter(step => !Number.isFinite(step.lat) || !Number.isFinite(step.lng));
}

function getMobileMapDestinationLabel() {
  const draft = getTripDraft();

  return (
    activeTrip?.name ||
    draft.destination ||
    ''
  ).trim();
}

async function geocodeMobileMapDestination() {
  const label = getMobileMapDestinationLabel();
  if (!label) return null;

  const cacheKey = `atelierMapDestination:${label.toLowerCase()}`;

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached?.center?.length === 2) return cached;
  } catch {}

  try {
    const response = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(label)}.json?key=${MAPTILER_KEY}&language=fr&limit=1`
    );

    const data = await response.json();
    const feature = data.features?.[0];

    if (!feature?.center) return null;

    const destination = {
      label,
      name: feature.text || label,
      address: feature.place_name || label,
      center: feature.center
    };

    localStorage.setItem(cacheKey, JSON.stringify(destination));

    return destination;
  } catch (error) {
    console.warn('Destination geocoding error:', error);
    return null;
  }
}

function getMobileMapStepIcon(step) {
    if (step.pointKind === 'stopover') return 'connecting_airports';
  const type = String(step.type || '').toLowerCase();

  if (type.includes('transport')) return 'directions_transit';
  if (type.includes('lodging') || type.includes('logement')) return 'hotel';
  if (type.includes('restaurant')) return 'restaurant';
  if (type.includes('activity') || type.includes('activit')) return 'local_activity';

  return step.icon || 'location_on';
}

function getMobileMapStyleUrl() {
  const style = mobileMapStyle === 'satellite'
    ? 'hybrid'
    : 'streets-v2';

  return `https://api.maptiler.com/maps/${style}/style.json?key=${MAPTILER_KEY}&language=fr`;
}

function clearMobileMapMarkers() {
  clearMobileMapRoute();
  mobileMapMarkers.forEach(marker => marker.remove());
  mobileMapMarkers = [];

  if (mobileMapDestinationMarker) {
    mobileMapDestinationMarker.remove();
    mobileMapDestinationMarker = null;
  }
  if (mobileMapSearchMarker) {
    mobileMapSearchMarker.remove();
    mobileMapSearchMarker = null;
  }
}

function destroyMobileMap() {
  stopMobileMapTour();

  document.querySelector('#mobile-map-focused-step-card')?.remove();

  const placeCard = document.querySelector('#mobile-map-place-card');
  if (placeCard) placeCard.hidden = true;

  if (mobileMapSearchMarker) {
    mobileMapSearchMarker.remove();
    mobileMapSearchMarker = null;
  }

  if (mobileMapInstance) {
    mobileMapInstance.remove();
    mobileMapInstance = null;
  }

  mobileMapMarkers = [];
  mobileMapDestinationMarker = null;
}

function rememberMobileMapCamera() {
  if (!mobileMapInstance) return;

  const center = mobileMapInstance.getCenter();

  mobileMapRestoreCamera = {
    center: [center.lng, center.lat],
    zoom: mobileMapInstance.getZoom(),
    bearing: mobileMapInstance.getBearing(),
    pitch: mobileMapInstance.getPitch()
  };
}

function refreshMobileMapSheet() {
  const card = document.querySelector('.mobile-map-card');
  if (!card) return;

  card.classList.toggle('is-open', mobileMapSheetOpen);
  card.classList.toggle('is-compact', !mobileMapSheetOpen);

  const icon = card.querySelector('[data-action="toggle-map-sheet"] .material-symbols-outlined');
  if (icon) icon.textContent = mobileMapSheetOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_up';
}

function refreshMobileMapDaysMenu() {
  const days = document.querySelector('.mobile-map-days-tool');
  if (!days) return;

  const fabIcon = days.querySelector('.mobile-map-days-fab .material-symbols-outlined');
  const menu = days.querySelector('.mobile-map-days-menu');

  if (fabIcon) fabIcon.textContent = mobileMapDaysOpen ? 'close' : 'calendar_month';
  if (menu) menu.classList.toggle('open', mobileMapDaysOpen);
}

function refreshMobileMapActionsMenu() {
  const actions = document.querySelector('.mobile-map-actions-tool');
  if (!actions) return;

  const buttonIcon = actions.querySelector('.mobile-map-actions-fab .material-symbols-outlined');
  const menu = actions.querySelector('.mobile-map-actions-menu');

  if (buttonIcon) buttonIcon.textContent = mobileMapActionsOpen ? 'close' : 'construction';
  if (menu) menu.classList.toggle('open', mobileMapActionsOpen);
}

function refreshMobileMapToolsMenu() {
  const tools = document.querySelector('.mobile-map-tools');
  if (!tools) return;

  const fabIcon = tools.querySelector('.mobile-map-tools-fab .material-symbols-outlined');
  const menu = tools.querySelector('.mobile-map-tools-menu');

  if (fabIcon) fabIcon.textContent = mobileMapToolsOpen ? 'close' : 'tune';
  if (menu) menu.classList.toggle('open', mobileMapToolsOpen);
}

function renderMap() {
  destroyMobileMap();

  const steps = getMobileMapSteps();
  const unlocatedSteps = getMobileMapUnlocatedSteps();
  const panelSteps = getMobileMapPanelSteps();
  const visibleMapSteps = showAllMobileMapSteps ? panelSteps : panelSteps.slice(0, 6);
  const hiddenMapStepsCount = Math.max(0, panelSteps.length - visibleMapSteps.length);
  const tripName = activeTrip?.name || getTripDraft().destination || 'Votre voyage';

  app.innerHTML = `
    <div class="mobile-shell map-shell">
      ${topbar()}

      <main class="mobile-real-map-screen">
        <div id="mobile-map" class="mobile-real-map"></div>

        <div class="mobile-map-search glass-panel">
          <span class="material-symbols-outlined" aria-hidden="true">search</span>
          <input id="mobile-map-search" type="search" placeholder="Rechercher un lieu..." autocomplete="off">
          <div id="mobile-map-results" class="mobile-map-results"></div>
        </div>

                <div class="mobile-map-days-tool">
          <button class="mobile-map-days-fab glass-panel" type="button" data-action="map-days-toggle" aria-label="Choisir un jour">
            <span class="material-symbols-outlined" aria-hidden="true">${mobileMapDaysOpen ? 'close' : 'calendar_month'}</span>
          </button>

          <div class="mobile-map-days-menu glass-panel ${mobileMapDaysOpen ? 'open' : ''}">
            <button
              type="button"
              class="${mobileMapPanelDayIndex === null ? 'active' : ''}"
              data-action="map-panel-day"
              data-panel-day="all"
            >
              <span>Tout le voyage</span>
              <small>${steps.length} point${steps.length > 1 ? 's' : ''}</small>
            </button>

            ${(activeTrip?.days || []).map((day, index) => {
              const daySteps = steps.filter(step => step.dayIndex === index);

              return `
                <button
                  type="button"
                  class="${mobileMapPanelDayIndex === index ? 'active' : ''}"
                  data-action="map-panel-day"
                  data-panel-day="${index}"
                >
                  <span>Jour ${index + 1}</span>
                  <small>${daySteps.length} point${daySteps.length > 1 ? 's' : ''}</small>
                </button>
              `;
            }).join('')}
          </div>
        </div>

                <div class="mobile-map-actions-tool">
          <button class="mobile-map-actions-fab glass-panel" type="button" data-action="map-actions-toggle" aria-label="Ouvrir les outils">
            <span class="material-symbols-outlined" aria-hidden="true">${mobileMapActionsOpen ? 'close' : 'construction'}</span>
          </button>

          <div class="mobile-map-actions-menu glass-panel ${mobileMapActionsOpen ? 'open' : ''}">
            <button type="button" data-action="map-route-calculator-toggle">
              <span class="material-symbols-outlined" aria-hidden="true">route</span>
              <span>Calculateur d’itinéraire</span>
            </button>

            <button type="button" data-action="map-route-current-day">
              <span class="material-symbols-outlined" aria-hidden="true">today</span>
              <span>Trajet du jour</span>
            </button>

            <button type="button" data-action="map-clear-route">
              <span class="material-symbols-outlined" aria-hidden="true">ink_eraser</span>
              <span>Effacer le trajet</span>
            </button>
          </div>
        </div>
        <div class="mobile-map-tools">
          <button class="mobile-map-tools-fab glass-panel" type="button" data-action="map-tools-toggle" aria-label="Ouvrir les outils de carte">
            <span class="material-symbols-outlined" aria-hidden="true">${mobileMapToolsOpen ? 'close' : 'tune'}</span>
          </button>

          <div class="mobile-map-tools-menu glass-panel ${mobileMapToolsOpen ? 'open' : ''}">
            <button type="button" data-action="map-fit">
              <span class="material-symbols-outlined" aria-hidden="true">travel_explore</span>
              <span>Vue globale</span>
            </button>

            <button type="button" data-action="map-geolocate">
              <span class="material-symbols-outlined filled" aria-hidden="true">my_location</span>
              <span>Ma position</span>
            </button>

            <button type="button" data-action="map-style">
              <span class="material-symbols-outlined" aria-hidden="true">layers</span>
              <span>${mobileMapStyle === 'plan' ? 'Satellite' : 'Plan'}</span>
            </button>

            <button type="button" data-action="map-tour">
              <span class="material-symbols-outlined" aria-hidden="true">route</span>
              <span>${mobileMapTouring ? 'Stop visite' : 'Mode visite'}</span>
            </button>

            <div class="mobile-map-tools-zoom">
              <button type="button" data-action="map-zoom-out" aria-label="Dézoomer">
                <span class="material-symbols-outlined" aria-hidden="true">remove</span>
              </button>
              <button type="button" data-action="map-zoom-in" aria-label="Zoomer">
                <span class="material-symbols-outlined" aria-hidden="true">add</span>
              </button>
            </div>
          </div>
        </div>

                <article class="mobile-route-calculator glass-panel ${mobileRouteCalculatorOpen ? 'open' : ''} ${mobileRouteCalculatorCompact ? 'is-compact' : ''}">
          <div class="mobile-route-header">
            <div>
              <span class="kicker">Outils</span>
              <h2>Calculateur d’itinéraire</h2>
            </div>
            <button type="button" data-action="map-route-calculator-close" aria-label="Fermer">
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>

          <div class="mobile-route-fields">
            <label>
              <span>Départ</span>
              <input id="mobile-route-from" type="search" value="${escapeHtml(mobileRouteCalculatorDraft.from)}" placeholder="Ville, adresse, gare...">
            </label>

            <button class="mobile-route-current" type="button" data-action="map-route-current-position">
              <span class="material-symbols-outlined" aria-hidden="true">my_location</span>
              <span>Ma position en départ</span>
            </button>

            <button class="mobile-route-swap" type="button" data-action="map-route-swap" aria-label="Inverser">
              <span class="material-symbols-outlined" aria-hidden="true">swap_vert</span>
            </button>

            <label>
              <span>Arrivée</span>
              <input id="mobile-route-to" type="search" value="${escapeHtml(mobileRouteCalculatorDraft.to)}" placeholder="Ville, adresse, hôtel...">
            </label>

            <div class="mobile-route-modes">
              <button type="button" class="${mobileRouteCalculatorDraft.mode === 'driving' ? 'active' : ''}" data-action="map-route-mode" data-route-mode="driving">
                <span class="material-symbols-outlined" aria-hidden="true">directions_car</span>
                Voiture
              </button>
              <button type="button" class="${mobileRouteCalculatorDraft.mode === 'walking' ? 'active' : ''}" data-action="map-route-mode" data-route-mode="walking">
                <span class="material-symbols-outlined" aria-hidden="true">directions_walk</span>
                Marche
              </button>
              <button type="button" class="${mobileRouteCalculatorDraft.mode === 'cycling' ? 'active' : ''}" data-action="map-route-mode" data-route-mode="cycling">
                <span class="material-symbols-outlined" aria-hidden="true">directions_bike</span>
                Vélo
              </button>
            </div>

            <button class="mobile-route-reset" type="button" data-action="map-route-reset">
              <span class="material-symbols-outlined" aria-hidden="true">restart_alt</span>
              <span>Réinitialiser</span>
            </button>

            <button class="mobile-route-submit" type="button" data-action="map-route-calculate">
              <span class="material-symbols-outlined" aria-hidden="true">route</span>
              <span>${mobileRouteCalculatorBusy ? 'Calcul...' : 'Calculer le trajet'}</span>
            </button>

                        ${mobileRouteCalculatorResult ? `
              <div class="mobile-route-result">
                <div class="mobile-route-result-copy">
                  <span class="kicker">Calcul d'itinéraire</span>
                  <h1>
                    <span class="material-symbols-outlined" aria-hidden="true">
                      ${mobileRouteCalculatorDraft.mode === 'walking' ? 'directions_walk' : mobileRouteCalculatorDraft.mode === 'cycling' ? 'directions_bike' : 'directions_car'}
                    </span>
                    ${escapeHtml(mobileRouteCalculatorDraft.from || 'Départ')} → ${escapeHtml(mobileRouteCalculatorDraft.to || 'Arrivée')}
                  </h1>
                  <p>${escapeHtml(mobileRouteCalculatorResult.durationLabel)} · ${escapeHtml(mobileRouteCalculatorResult.distanceLabel)}</p>
                </div>

                <div class="mobile-route-result-actions">
                  <button type="button" data-action="map-route-dismiss" aria-label="Supprimer le trajet">
                    <span class="material-symbols-outlined" aria-hidden="true">close</span>
                  </button>

                  <button type="button" data-action="map-route-expand" aria-label="Afficher le calculateur">
                    <span class="material-symbols-outlined" aria-hidden="true">keyboard_arrow_up</span>
                  </button>

                  <a href="${getMobileRouteGoogleMapsUrl()}" target="_blank" rel="noopener">
                    <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
                    Maps
                  </a>
                </div>
              </div>
            ` : ''}
          </div>
        </article>

        <article id="mobile-map-place-card" class="mobile-map-place-card glass-panel" hidden></article>
        <article class="mobile-map-card glass-panel ${mobileMapSheetOpen ? 'is-open' : 'is-compact'}">
          <div class="map-summary-header">
            <div>
              <span class="kicker">${escapeHtml(tripName)}</span>
              <h1>${escapeHtml(getMobileMapPanelDayLabel())}</h1>
              <p class="mobile-map-card-subtitle">
                ${panelSteps.length ? `${panelSteps.length} point${panelSteps.length > 1 ? 's' : ''}` : 'Aucun point sur ce jour'}
              </p>
            </div>

            <button type="button" data-action="toggle-map-sheet" aria-label="${mobileMapSheetOpen ? 'Réduire le panneau' : 'Ouvrir le panneau'}">
              <span class="material-symbols-outlined" aria-hidden="true">${mobileMapSheetOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}</span>
            </button>
          </div>

                    ${activeTrip?.days?.length ? `
            <div class="mobile-map-day-nav">
              <button type="button" data-action="map-prev-day" ${mobileMapPanelDayIndex === null || mobileMapPanelDayIndex <= 0 ? 'disabled' : ''}>
                <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
                <span>Précédent</span>
              </button>

              <button type="button" data-action="map-next-day" ${mobileMapPanelDayIndex === null || mobileMapPanelDayIndex >= activeTrip.days.length - 1 ? 'disabled' : ''}>
                <span>Suivant</span>
                <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
              </button>
            </div>
          ` : ''}

                    ${activeTrip?.days?.length ? `
            <div class="mobile-map-day-tabs">
              <button
                type="button"
                class="${mobileMapPanelDayIndex === null ? 'active' : ''}"
                data-action="map-panel-day"
                data-panel-day="all"
              >
                Tout
              </button>

              ${activeTrip.days.map((day, index) => `
                <button
                  type="button"
                  class="${mobileMapPanelDayIndex === index ? 'active' : ''}"
                  data-action="map-panel-day"
                  data-panel-day="${index}"
                >
                  J${index + 1}
                </button>
              `).join('')}
            </div>
          ` : ''}

          <div class="mobile-map-card-actions">
            <button type="button" data-action="map-fit-panel">
              <span class="material-symbols-outlined" aria-hidden="true">center_focus_strong</span>
              <span>Recadrer</span>
            </button>
          </div>

          <div class="mobile-map-step-list">
            ${
              panelSteps.length
                ? `
                  ${visibleMapSteps.map((step) => {
                    const realIndex = steps.indexOf(step);

                    return `
                      <div class="mobile-map-step" data-step-index="${realIndex}">
                        <button class="mobile-map-step-main" type="button" data-action="map-focus-step" data-step-index="${realIndex}">
                          <span class="material-symbols-outlined" aria-hidden="true">${getMobileMapStepIcon(step)}</span>

                          <div>
                            <strong>${escapeHtml(step.label || step.title || 'Étape')}</strong>
                            <small>${escapeHtml(step.lieu || step.place || step.dayTitle || '')}</small>
                          </div>
                        </button>

                        <div class="mobile-map-step-actions">
                          <em>${escapeHtml(step.time || '')}</em>
                          ${step.pointKind === 'stopover' ? '' : `
                            <button type="button" data-action="map-edit-step" data-step-index="${realIndex}" aria-label="Modifier l'étape">
                              <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                            </button>
                          `}
                        </div>
                      </div>
                    `;
                  }).join('')}

                  ${panelSteps.length > 6 ? `
                    <button class="mobile-map-more" type="button" data-action="toggle-map-steps">
                      ${showAllMobileMapSteps ? 'Réduire' : `Voir ${hiddenMapStepsCount} autre${hiddenMapStepsCount > 1 ? 's' : ''} point${hiddenMapStepsCount > 1 ? 's' : ''}`}
                    </button>
                  ` : ''}
                `
                : `
                  <p class="companion-empty">
                    La carte affiche d’abord la destination. Les étapes apparaîtront ici dès qu’elles auront une adresse sélectionnée dans les suggestions.
                  </p>
                `
            }
          </div>

          ${unlocatedSteps.length ? `
            <div class="mobile-map-unlocated">
              <span class="kicker">À localiser</span>

              ${unlocatedSteps.slice(0, 4).map((step, index) => `
                <button type="button" data-action="map-locate-step" data-unlocated-index="${index}">
                  <span class="material-symbols-outlined" aria-hidden="true">${getMobileMapStepIcon(step)}</span>

                  <div>
                    <strong>${escapeHtml(step.label || step.title || 'Étape')}</strong>
                    <small>${escapeHtml(step.lieu || step.place || step.dayTitle || '')}</small>
                  </div>

                  <em>Localiser</em>
                </button>
              `).join('')}

              ${unlocatedSteps.length > 4 ? `
                <p>+ ${unlocatedSteps.length - 4} autre${unlocatedSteps.length - 4 > 1 ? 's' : ''} à localiser</p>
              ` : ''}
            </div>
          ` : ''}
        </article>
      </main>


      ${bottomNav('map')}
    </div>
  `;

  setTimeout(() => {
    initMobileRealMap();
    initMobileRouteAutocomplete();
  }, 0);
}

function renderMobileMapError(message = 'Impossible de charger la carte.') {
  const screen = document.querySelector('.mobile-real-map-screen');
  if (!screen) return;

  const existing = document.querySelector('.mobile-map-error');
  if (existing) existing.remove();

  const error = document.createElement('div');
  error.className = 'mobile-map-error glass-panel';
  error.innerHTML = `
    <span class="material-symbols-outlined" aria-hidden="true">map_off</span>
    <h2>Carte indisponible</h2>
    <p>${escapeHtml(message)}</p>
    <button type="button" data-action="map-retry">
      <span class="material-symbols-outlined" aria-hidden="true">refresh</span>
      <span>Réessayer</span>
    </button>
  `;

  screen.appendChild(error);
}

function initMobileRealMap() {
  const container = document.querySelector('#mobile-map');
  if (!container) return;

  if (!window.maplibregl) {
    renderMobileMapError('Le module de carte n’a pas été chargé. Vérifiez la connexion puis réessayez.');
    return;
  }

  const steps = getMobileMapSteps();
  const savedCamera = mobileMapRestoreCamera;
  mobileMapRestoreCamera = null;

  const center = savedCamera?.center || (steps[0] ? [steps[0].lng, steps[0].lat] : [2.3522, 48.8566]);

  mobileMapInstance = new maplibregl.Map({
    container,
    style: getMobileMapStyleUrl(),
    center,
    zoom: savedCamera?.zoom ?? (steps.length ? 12 : 3),
    bearing: savedCamera?.bearing || 0,
    pitch: savedCamera?.pitch || 0,
    attributionControl: { compact: true }
  });

  mobileMapInstance.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');
  mobileMapInstance.doubleClickZoom.disable();

  mobileMapInstance.on('error', event => {
    console.warn('Mobile map tile/style warning:', event?.error || event);
  });

mobileMapInstance.on('load', async () => {
  document.querySelector('.mobile-map-error')?.remove();

  renderMobileMapRoute();
  renderMobileMapMarkers();

    if (steps.length) {
      fitMobileMapToSteps({ duration: 0, maxZoom: 8 });
    } else {
      await renderMobileMapDestination();
    }
  });

  initMobileMapSearch();
}

async function renderMobileMapDestination() {
  if (!mobileMapInstance) return;

  const destination = await geocodeMobileMapDestination();

  if (!destination?.center) {
    mobileMapInstance.flyTo({
      center: [2.3522, 48.8566],
      zoom: 4,
      duration: 900
    });
    return;
  }

  const el = document.createElement('button');
  el.className = 'mobile-map-marker destination';
  el.type = 'button';
  el.setAttribute('aria-label', destination.address);
  el.innerHTML = `
    <span class="material-symbols-outlined">flag</span>
  `;

  mobileMapDestinationMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat(destination.center)
    .addTo(mobileMapInstance);

  mobileMapInstance.flyTo({
    center: destination.center,
    zoom: 10,
    duration: 1000
  });
}

function clearMobileMapRoute() {
  if (!mobileMapInstance) return;
    clearMobileCalculatedRoute();

  ['mobile-step-route-glow', 'mobile-step-route-line'].forEach(layerId => {
    if (mobileMapInstance.getLayer(layerId)) {
      mobileMapInstance.removeLayer(layerId);
    }
  });

  if (mobileMapInstance.getSource('mobile-step-route')) {
    mobileMapInstance.removeSource('mobile-step-route');
  }
}

function renderMobileMapRoute() {
  if (!mobileMapInstance) return;

  const steps = getMobileMapSteps();
  clearMobileMapRoute();

  if (steps.length < 2) return;

  const coordinates = steps.map(step => [step.lng, step.lat]);

  mobileMapInstance.addSource('mobile-step-route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates
      }
    }
  });

  mobileMapInstance.addLayer({
    id: 'mobile-step-route-glow',
    type: 'line',
    source: 'mobile-step-route',
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#7c5410',
      'line-width': 10,
      'line-opacity': 0.18,
      'line-blur': 4
    }
  });

  mobileMapInstance.addLayer({
    id: 'mobile-step-route-line',
    type: 'line',
    source: 'mobile-step-route',
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#7c5410',
      'line-width': 3,
      'line-opacity': 0.9,
      'line-dasharray': [1.5, 2.2]
    }
  });
}

function clearMobileCalculatedRoute() {
  if (!mobileMapInstance) return;

  ['mobile-calc-route-glow', 'mobile-calc-route-line'].forEach(layerId => {
    if (mobileMapInstance.getLayer(layerId)) {
      mobileMapInstance.removeLayer(layerId);
    }
  });

  if (mobileMapInstance.getSource('mobile-calc-route')) {
    mobileMapInstance.removeSource('mobile-calc-route');
  }
}

async function renderMobileCalculatedRouteToStep(index) {
  if (!mobileMapInstance) return;

  const steps = getMobileMapSteps();
  const to = steps[index];
  const from = steps[index - 1];

  if (!from || !to) {
    alert('Il faut une étape précédente pour calculer un trajet.');
    return;
  }

  clearMobileCalculatedRoute();

  try {
    const profile = String(to.type || '').toLowerCase().includes('transport')
      ? 'driving'
      : 'walking';

    const url = `https://router.project-osrm.org/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    const route = data.routes?.[0];

    if (!route?.geometry) {
      alert('Impossible de calculer ce trajet.');
      return;
    }

    mobileMapInstance.addSource('mobile-calc-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: route.geometry
      }
    });

    mobileMapInstance.addLayer({
      id: 'mobile-calc-route-glow',
      type: 'line',
      source: 'mobile-calc-route',
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#3a7d6e',
        'line-width': 12,
        'line-opacity': 0.2,
        'line-blur': 5
      }
    });

    mobileMapInstance.addLayer({
      id: 'mobile-calc-route-line',
      type: 'line',
      source: 'mobile-calc-route',
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#3a7d6e',
        'line-width': 4,
        'line-opacity': 0.95
      }
    });

    const bounds = new maplibregl.LngLatBounds();
    route.geometry.coordinates.forEach(point => bounds.extend(point));

    mobileMapInstance.fitBounds(bounds, {
      padding: { top: 120, right: 60, bottom: 260, left: 60 },
      duration: 900,
      maxZoom: 16
    });
  } catch (error) {
    alert('Erreur calcul trajet : ' + (error.message || error));
  }
}

function renderMobileMapMarkers() {
  if (!mobileMapInstance) return;

  clearMobileMapMarkers();

  getMobileMapSteps().forEach((step, index) => {
    const el = document.createElement('button');
    el.className = `mobile-map-marker ${step.type || 'other'} ${step.pointKind === 'stopover' ? 'stopover' : ''}`;
    el.type = 'button';
    el.innerHTML = `
      <span class="material-symbols-outlined">${getMobileMapStepIcon(step)}</span>
    `;

    el.addEventListener('click', () => {
      focusMobileMapStep(index);
    });

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([step.lng, step.lat])
      .addTo(mobileMapInstance);

    mobileMapMarkers.push(marker);
  });
}

function getMobileMapPanelDayLabel() {
  if (mobileMapPanelDayIndex === null) return 'Tout le voyage';

  const day = activeTrip?.days?.[mobileMapPanelDayIndex];

  return day?.title || day?.dateLabel || `Jour ${mobileMapPanelDayIndex + 1}`;
}

function getMobileMapPanelSteps() {
  const steps = getMobileMapSteps();

  if (mobileMapPanelDayIndex === null) {
    return steps;
  }

  return steps.filter(step => step.dayIndex === mobileMapPanelDayIndex);
}

function fitMobileMapToDay(dayIndex, options = {}) {
  if (!mobileMapInstance) return;

  if (dayIndex === null) {
    fitMobileMapToSteps({ duration: options.duration ?? 520, maxZoom: options.maxZoom ?? 8 });
    return;
  }

  const steps = getMobileMapSteps().filter(step => Number(step.dayIndex) === Number(dayIndex));

  if (!steps.length) {
    return;
  }

  const duration = options.duration ?? 520;
  const maxZoom = options.maxZoom ?? 13;

  if (steps.length === 1) {
    mobileMapInstance.easeTo({
      center: [steps[0].lng, steps[0].lat],
      zoom: Math.min(maxZoom, 13),
      duration,
      essential: true
    });
    return;
  }

  const bounds = new maplibregl.LngLatBounds();

  steps.forEach(step => {
    bounds.extend([step.lng, step.lat]);
  });

  mobileMapInstance.fitBounds(bounds, {
    padding: { top: 120, right: 72, bottom: 280, left: 72 },
    duration,
    maxZoom,
    essential: true
  });
}

function fitMobileMapToPanelDay(options = {}) {
  if (!mobileMapInstance) return;

  const steps = getMobileMapPanelSteps();

  if (!steps.length) {
    fitMobileMapToSteps({ duration: options.duration ?? 450, maxZoom: 8 });
    return;
  }

  const duration = options.duration ?? 520;
  const maxZoom = options.maxZoom ?? 13;

  if (steps.length === 1) {
    mobileMapInstance.easeTo({
      center: [steps[0].lng, steps[0].lat],
      zoom: Math.min(maxZoom, 13),
      duration,
      essential: true
    });
    return;
  }

  const bounds = new maplibregl.LngLatBounds();

  steps.forEach(step => {
    bounds.extend([step.lng, step.lat]);
  });

  mobileMapInstance.fitBounds(bounds, {
    padding: { top: 120, right: 72, bottom: 280, left: 72 },
    duration,
    maxZoom,
    essential: true
  });
}

function fitMobileMapToSteps(options = {}) {
  if (!mobileMapInstance) return;

  const steps = getMobileMapSteps();

  if (!steps.length) return;

  const duration = options.duration ?? 900;
  const maxZoom = options.maxZoom ?? 14;

  if (steps.length === 1) {
    mobileMapInstance.flyTo({
      center: [steps[0].lng, steps[0].lat],
      zoom: Math.min(maxZoom, 14),
      duration
    });
    return;
  }

  const bounds = new maplibregl.LngLatBounds();

  steps.forEach(step => {
    bounds.extend([step.lng, step.lat]);
  });

  mobileMapInstance.fitBounds(bounds, {
    padding: { top: 120, right: 70, bottom: 270, left: 70 },
    duration,
    maxZoom
  });
}

function focusMobileMapStep(index) {
  if (!mobileMapInstance) return;

  const step = getMobileMapSteps()[index];
  if (!step) return;
    mobileMapFocusedStepIndex = index;
  mobileMapToolsOpen = false;
  mobileMapDaysOpen = false;
  mobileMapActionsOpen = false;
  mobileRouteCalculatorOpen = false;
  renderMobileMapFocusedStepCard(step, index);
  refreshMobileMapToolsMenu();
  refreshMobileMapDaysMenu();
  refreshMobileMapActionsMenu();
  refreshMobileRouteCalculatorPanel();

    document.querySelectorAll('.mobile-map-marker').forEach((marker, markerIndex) => {
    marker.classList.toggle('active', markerIndex === index);
  });

  document.querySelectorAll('.mobile-map-step').forEach((button, buttonIndex) => {
    button.classList.toggle('active', buttonIndex === index);
  });

}

function renderMobileMapSelectedPlace() {
  const card = document.querySelector('#mobile-map-place-card');
  if (!card || !mobileMapSelectedPlace) return;

  const days = activeTrip?.days || [];
  const placeTypes = [
    { id: 'activity', label: 'Activité', icon: 'local_activity' },
    { id: 'restaurant', label: 'Restaurant', icon: 'restaurant' },
    { id: 'lodging', label: 'Logement', icon: 'hotel' },
    { id: 'transport', label: 'Transport', icon: 'directions_transit' }
  ];

  card.hidden = false;

  card.innerHTML = `
    <div class="mobile-map-place-head">
      <div>
        <span class="kicker">Lieu trouvé</span>
        <h2>${escapeHtml(mobileMapSelectedPlace.text || 'Lieu sélectionné')}</h2>
        <p>${escapeHtml(mobileMapSelectedPlace.place_name || '')}</p>
      </div>

      <button class="mobile-map-place-close" type="button" data-action="map-clear-place" aria-label="Fermer">
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </div>

    <div class="mobile-map-place-types" role="group" aria-label="Type d'étape">
      ${placeTypes.map(type => `
        <button
          type="button"
          class="${mobileMapSelectedPlaceType === type.id ? 'active' : ''}"
          data-action="map-place-type"
          data-place-type="${type.id}"
        >
          <span class="material-symbols-outlined" aria-hidden="true">${type.icon}</span>
          <span>${type.label}</span>
        </button>
      `).join('')}
    </div>

        ${days.length ? `
      <div class="mobile-map-day-picker">
        <span class="kicker">Ajouter à</span>
        <div>
          ${days.map((day, index) => `
            <button
              type="button"
              class="${mobileMapSelectedDayIndex === index ? 'active' : ''}"
              data-action="map-place-day"
              data-day-index="${index}"
            >
              J${index + 1}
            </button>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div class="mobile-map-place-actions">
      <button type="button" data-action="map-show-place">
        <span class="material-symbols-outlined" aria-hidden="true">my_location</span>
        <span>Voir</span>
      </button>

            <button type="button" data-action="map-set-route-from-place">
        <span class="material-symbols-outlined" aria-hidden="true">trip_origin</span>
        <span>Départ</span>
      </button>

      <button type="button" data-action="map-set-route-to-place">
        <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
        <span>Arrivée</span>
      </button>

      <button type="button" data-action="map-add-place">
        <span class="material-symbols-outlined" aria-hidden="true">add_location_alt</span>
        <span>Ajouter</span>
      </button>
    </div>
  `;
}

async function handleAttachPlaceToExistingStep() {
  if (!mobileMapLocatingStep || !mobileMapSelectedPlace) return;

  const step = mobileMapLocatingStep;
  const center = mobileMapSelectedPlace.center || [];

  try {
    if (activeTrip?.id && step.id && window.SB?.saveStep) {
      await window.SB.saveStep(activeTrip.id, step.dayId, {
        ...step,
        id: step.id,
        stepIndex: step.stepIndex || 0,
        type: step.type || mobileMapSelectedPlaceType,
        label: step.label || step.title || mobileMapSelectedPlace.text || 'Étape',
        lieu: mobileMapSelectedPlace.place_name || step.lieu || '',
        lat: center[1] || null,
        lng: center[0] || null
      });

      await refreshMobileTrips(activeTrip.id);
    } else {
      const localStep = itinerarySteps[step.stepIndex];

      if (localStep) {
        localStep.lat = center[1] || null;
        localStep.lng = center[0] || null;
        localStep.description = mobileMapSelectedPlace.place_name || localStep.description;
      }
    }

    mobileMapSelectedPlace = null;
    mobileMapLocatingStep = null;
    renderMap();
  } catch (error) {
    alert('Erreur localisation étape : ' + (error.message || error));
  }
}

function openNewStepFromMapPlace() {
  if (!mobileMapSelectedPlace) return;

  const center = mobileMapSelectedPlace.center || [];
  const type = mobileMapSelectedPlaceType || 'activity';

  mapStepDraft = {
    source: 'map',
    dayIndex: mobileMapSelectedDayIndex || 0,
    type,
    title: mobileMapSelectedPlace.text || '',
    location: mobileMapSelectedPlace.place_name || '',
    lat: center[1] || '',
    lng: center[0] || ''
  };

  selectedStepCategory = type;
  mobileMapSelectedPlace = null;
  mobileMapLocatingStep = null;

  navigate('new-step');
}

async function handleAddMapPlaceToTrip() {
  if (!mobileMapSelectedPlace) return;

  if (mobileMapLocatingStep) {
    await handleAttachPlaceToExistingStep();
    return;
  }

  openNewStepFromMapPlace();
  return;

  if (!activeTrip?.id) {
    alert('Créez ou ouvrez un voyage avant d’ajouter un lieu.');
    return;
  }

  const days = activeTrip.days || [];
  const day = days[mobileMapSelectedDayIndex] || days[0];

  if (!day?.id) {
    alert('Aucun jour trouvé pour ce voyage.');
    return;
  }

  const step = {
    stepIndex: day.steps?.length || 0,
    type: mobileMapSelectedPlaceType,
    label: mobileMapSelectedPlace.text || 'Lieu ajouté',
    lieu: mobileMapSelectedPlace.place_name || '',
    time: '09:00',
    timeEnd: '',
    transportType: '',
    depart: '',
    arrivee: '',
    ref: '',
    duration: '',
    note: '',
    link: '',
    amount: 0,
    paidBy: '',
    lat: mobileMapSelectedPlace.center?.[1] || null,
    lng: mobileMapSelectedPlace.center?.[0] || null
  };

  try {
    if (window.SB?.saveStep) {
      await window.SB.saveStep(activeTrip.id, day.id, step);
      await refreshMobileTrips(activeTrip.id);
    } else {
      itinerarySteps.push({
        time: step.time,
        type: getStepCategoryConfig(mobileMapSelectedPlaceType).type,
        title: step.label,
        description: step.lieu,
        icon: 'location_on',
        tone: 'petrol',
        lat: step.lat,
        lng: step.lng
      });
    }

    mobileMapSelectedPlace = null;
    renderMap();
  } catch (error) {
    alert('Erreur ajout du lieu : ' + (error.message || error));
  }
}

async function locateMobileMapStep(index) {
  const step = getMobileMapUnlocatedSteps()[index];
  if (!step) return;

  const query = [
    step.lieu,
    step.place,
    step.label,
    step.title,
    activeTrip?.name
  ].filter(Boolean).join(' ');

  if (!query) return;

  const input = document.querySelector('#mobile-map-search');
  if (input) input.value = query;

  try {
    const response = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&language=fr&limit=1`
    );

    const data = await response.json();
    const feature = data.features?.[0];

    if (!feature?.center || !mobileMapInstance) {
      alert('Lieu introuvable.');
      return;
    }

    mobileMapSelectedPlace = feature;
    mobileMapSelectedPlaceType = step.type || 'activity';
    mobileMapSelectedDayIndex = step.dayIndex || 0;
    mobileMapLocatingStep = step;

    mobileMapInstance.flyTo({
      center: feature.center,
      zoom: 15,
      duration: 900
    });

    setMobileMapSearchMarker(feature.center);

    renderMobileMapSelectedPlace();
  } catch (error) {
    alert('Erreur localisation : ' + (error.message || error));
  }
}

function renderMobileMapFocusedStepCard(step, index) {
  let card = document.querySelector('#mobile-map-focused-step-card');

  if (!card) {
    card = document.createElement('article');
    card.id = 'mobile-map-focused-step-card';
    card.className = 'mobile-map-focused-step-card glass-panel';
    document.querySelector('.mobile-real-map-screen')?.appendChild(card);
  }

  card.innerHTML = `
    <div class="mobile-map-focused-head">
      <div>
        <span class="kicker">Étape sélectionnée</span>
        <h2>${escapeHtml(step.label || step.title || 'Étape')}</h2>
        <p>${escapeHtml(step.lieu || step.place || step.dayTitle || '')}</p>
      </div>

      <button class="mobile-map-place-close" type="button" data-action="map-clear-focused-step" aria-label="Fermer">
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </div>

    <div class="mobile-map-focused-actions">
      <button type="button" data-action="map-show-focused-step">
        <span class="material-symbols-outlined" aria-hidden="true">my_location</span>
        <span>Voir</span>
      </button>

            <button type="button" data-action="map-set-route-from-focused-step">
        <span class="material-symbols-outlined" aria-hidden="true">trip_origin</span>
        <span>Départ</span>
      </button>

      <button type="button" data-action="map-set-route-to-focused-step">
        <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
        <span>Arrivée</span>
      </button>

            <button type="button" data-action="map-route-focused-step">
        <span class="material-symbols-outlined" aria-hidden="true">route</span>
        <span>Trajet</span>
      </button>

      <button type="button" data-action="map-edit-focused-step">
        <span class="material-symbols-outlined" aria-hidden="true">edit</span>
        <span>Modifier</span>
      </button>

      <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${step.lat},${step.lng}`)}" target="_blank" rel="noopener">
        <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
        <span>Maps</span>
      </a>
    </div>
  `;
}

function stopMobileMapTour() {
  mobileMapTouring = false;

  if (mobileMapTourTimer) {
    clearTimeout(mobileMapTourTimer);
    mobileMapTourTimer = null;
  }

  const button = document.querySelector('[data-action="map-tour"] span:last-child');
  if (button) button.textContent = 'Survoler';
}

function startMobileMapTour() {
  const steps = getMobileMapSteps();

  if (!steps.length) {
    alert('Aucun point à survoler pour le moment.');
    return;
  }

  stopMobileMapTour();

  mobileMapTouring = true;

  const button = document.querySelector('[data-action="map-tour"] span:last-child');
  if (button) button.textContent = 'Stop';

  let index = 0;

  const next = () => {
    if (!mobileMapTouring) return;

    focusMobileMapStep(index);

    index += 1;

    if (index >= steps.length) {
      mobileMapTourTimer = setTimeout(stopMobileMapTour, 1400);
      return;
    }

    mobileMapTourTimer = setTimeout(next, 1800);
  };

  next();
}

function toggleMobileMapTour() {
  if (mobileMapTouring) {
    stopMobileMapTour();
  } else {
    startMobileMapTour();
  }
}

function setMobileMapSearchMarker(center) {
  if (!mobileMapInstance || !center?.length) return;

  if (mobileMapSearchMarker) {
    mobileMapSearchMarker.remove();
  }

  mobileMapSearchMarker = new maplibregl.Marker({ color: '#7c5410' })
    .setLngLat(center)
    .addTo(mobileMapInstance);
}

function getMobileRouteGoogleMapsUrl() {
  const fromLat = mobileRouteCalculatorDraft.fromLat;
  const fromLng = mobileRouteCalculatorDraft.fromLng;
  const toLat = mobileRouteCalculatorDraft.toLat;
  const toLng = mobileRouteCalculatorDraft.toLng;

  if (![fromLat, fromLng, toLat, toLng].every(value => Number.isFinite(Number(value)))) {
    return '';
  }

  const travelMode = mobileRouteCalculatorDraft.mode === 'walking'
    ? 'walking'
    : mobileRouteCalculatorDraft.mode === 'cycling'
      ? 'bicycling'
      : 'driving';

  const waypoints = (mobileRouteCalculatorDraft.waypoints || [])
    .filter(point => Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng)))
    .map(point => `${point.lat},${point.lng}`)
    .join('|');

  const waypointParam = waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '';

  return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}${waypointParam}&travelmode=${travelMode}`;
}

function formatMobileRouteDistance(meters) {
  if (!Number.isFinite(meters)) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatMobileRouteDuration(seconds) {
  if (!Number.isFinite(seconds)) return '';
  if (seconds < 60) return '< 1 min';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h${String(rest).padStart(2, '0')}`;
}

function getOsrmProfile(mode) {
  if (mode === 'walking') return 'foot';
  if (mode === 'cycling') return 'bike';
  return 'driving';
}

async function geocodeMobileRoutePoint(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) throw new Error('Adresse manquante');

  const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(cleanQuery)}.json?key=${MAPTILER_KEY}&language=fr&limit=1`);
  const data = await response.json();
  const feature = data.features?.[0];

  if (!feature?.center) {
    throw new Error(`Lieu introuvable : ${cleanQuery}`);
  }

  return {
    label: feature.place_name || cleanQuery,
    lng: feature.center[0],
    lat: feature.center[1]
  };
}

function clearMobileRouteCalculatorLayer() {
  if (!mobileMapInstance) return;

  try { mobileMapInstance.removeLayer('mobile-route-calculator-glow'); } catch (error) {}
  try { mobileMapInstance.removeLayer('mobile-route-calculator-line'); } catch (error) {}
  try { mobileMapInstance.removeSource('mobile-route-calculator'); } catch (error) {}
}

function resetMobileRouteCalculator() {
  mobileRouteCalculatorDraft = {
    from: '',
    fromLat: null,
    fromLng: null,
    to: '',
    toLat: null,
    toLng: null,
    waypoints: [],
    mode: mobileRouteCalculatorDraft.mode || 'driving'
  };

  mobileRouteCalculatorResult = null;
  mobileRouteCalculatorCompact = false;
  clearMobileRouteCalculatorLayer();
  refreshMobileRouteCalculatorPanel();
}

function setMobileRouteFromCurrentDay() {
  const steps = getMobileMapPanelSteps()
    .filter(step => Number.isFinite(Number(step.lat)) && Number.isFinite(Number(step.lng)));

  if (steps.length < 2) {
    alert('Il faut au moins deux points géolocalisés sur ce jour.');
    return;
  }

  const first = steps[0];
  const last = steps[steps.length - 1];
  const middle = steps.slice(1, -1).map(step => ({
    label: step.label || step.title || step.lieu || step.place || 'Étape',
    lat: Number(step.lat),
    lng: Number(step.lng)
  }));

  mobileRouteCalculatorDraft = {
    ...mobileRouteCalculatorDraft,
    from: first.label || first.title || first.lieu || first.place || 'Premier point',
    fromLat: Number(first.lat),
    fromLng: Number(first.lng),
    to: last.label || last.title || last.lieu || last.place || 'Dernier point',
    toLat: Number(last.lat),
    toLng: Number(last.lng),
    waypoints: middle
  };

  mobileRouteCalculatorOpen = true;
  mobileMapActionsOpen = false;
  mobileMapToolsOpen = false;
  mobileMapDaysOpen = false;

  refreshMobileMapActionsMenu();
  refreshMobileMapToolsMenu();
  refreshMobileMapDaysMenu();
  refreshMobileRouteCalculatorPanel();
  maybeAutoCalculateMobileRoute();
}

function drawMobileRouteCalculator(routeGeometry) {
  if (!mobileMapInstance || !routeGeometry?.coordinates?.length) return;

  clearMobileRouteCalculatorLayer();

  mobileMapInstance.addSource('mobile-route-calculator', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: routeGeometry
    }
  });

  mobileMapInstance.addLayer({
    id: 'mobile-route-calculator-glow',
    type: 'line',
    source: 'mobile-route-calculator',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#7c5410',
      'line-width': 12,
      'line-opacity': 0.18,
      'line-blur': 6
    }
  });

  mobileMapInstance.addLayer({
    id: 'mobile-route-calculator-line',
    type: 'line',
    source: 'mobile-route-calculator',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#7c5410',
      'line-width': 4,
      'line-opacity': 0.95
    }
  });

  const bounds = routeGeometry.coordinates.reduce((box, coord) => box.extend(coord), new maplibregl.LngLatBounds(routeGeometry.coordinates[0], routeGeometry.coordinates[0]));

  mobileMapInstance.fitBounds(bounds, {
    padding: { top: 130, right: 40, bottom: 260, left: 40 },
    maxZoom: 14,
    duration: 700
  });
}

function syncMobileRouteInputs() {
  const fromInput = document.querySelector('#mobile-route-from');
  const toInput = document.querySelector('#mobile-route-to');

  if (fromInput) mobileRouteCalculatorDraft.from = fromInput.value.trim();
  if (toInput) mobileRouteCalculatorDraft.to = toInput.value.trim();
}

function maybeAutoCalculateMobileRoute() {
  const hasFrom = Number.isFinite(Number(mobileRouteCalculatorDraft.fromLat))
    && Number.isFinite(Number(mobileRouteCalculatorDraft.fromLng));
  const hasTo = Number.isFinite(Number(mobileRouteCalculatorDraft.toLat))
    && Number.isFinite(Number(mobileRouteCalculatorDraft.toLng));

  if (!hasFrom || !hasTo || mobileRouteCalculatorBusy) return;

  calculateMobileRoute();
}

function setMobileRouteEndpoint(kind, step) {
  if (!step || !Number.isFinite(Number(step.lat)) || !Number.isFinite(Number(step.lng))) {
    alert('Cette étape n’a pas encore de position GPS.');
    return;
  }

  const patch = {
    [`${kind}`]: step.label || step.title || step.lieu || step.place || 'Étape',
    [`${kind}Lat`]: Number(step.lat),
    [`${kind}Lng`]: Number(step.lng)
  };

  mobileRouteCalculatorDraft = {
    ...mobileRouteCalculatorDraft,
    ...patch
  };

  mobileRouteCalculatorOpen = true;
  mobileMapActionsOpen = false;
  mobileMapToolsOpen = false;
  mobileMapDaysOpen = false;

  refreshMobileMapActionsMenu();
  refreshMobileMapToolsMenu();
  refreshMobileMapDaysMenu();
  refreshMobileRouteCalculatorPanel();
  maybeAutoCalculateMobileRoute();

}

function setMobileRouteEndpointFromPlace(kind, place) {
  if (!place?.center?.length) {
    alert('Ce lieu n’a pas encore de position GPS.');
    return;
  }

  mobileRouteCalculatorDraft = {
    ...mobileRouteCalculatorDraft,
    [`${kind}`]: place.place_name || place.text || 'Lieu sélectionné',
    [`${kind}Lat`]: Number(place.center[1]),
    [`${kind}Lng`]: Number(place.center[0])
  };

  mobileRouteCalculatorOpen = true;
  mobileMapActionsOpen = false;
  mobileMapToolsOpen = false;
  mobileMapDaysOpen = false;

  const placeCard = document.querySelector('#mobile-map-place-card');
  if (placeCard) placeCard.hidden = true;

  refreshMobileMapActionsMenu();
  refreshMobileMapToolsMenu();
  refreshMobileMapDaysMenu();
  refreshMobileRouteCalculatorPanel();
  maybeAutoCalculateMobileRoute();
}

function setMobileRouteFromCurrentPosition() {
  if (!navigator.geolocation) {
    alert('Géolocalisation indisponible sur cet appareil.');
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {
    mobileRouteCalculatorDraft = {
      ...mobileRouteCalculatorDraft,
      from: 'Ma position',
      fromLat: position.coords.latitude,
      fromLng: position.coords.longitude
    };

    mobileRouteCalculatorOpen = true;
    refreshMobileRouteCalculatorPanel();
    maybeAutoCalculateMobileRoute();

    if (mobileMapInstance) {
      mobileMapInstance.flyTo({
        center: [position.coords.longitude, position.coords.latitude],
        zoom: Math.max(mobileMapInstance.getZoom(), 13),
        duration: 600
      });
    }
  }, () => {
    alert('Impossible de récupérer votre position.');
  }, {
    enableHighAccuracy: true,
    timeout: 8000
  });
}

async function calculateMobileRoute(options = {}) {
  if (!mobileMapInstance) return;

  syncMobileRouteInputs();

  try {
    mobileRouteCalculatorBusy = true;
    refreshMobileRouteCalculatorPanel();

    const fromHasCoords = [mobileRouteCalculatorDraft.fromLat, mobileRouteCalculatorDraft.fromLng]
      .every(value => Number.isFinite(Number(value)));

    const toHasCoords = [mobileRouteCalculatorDraft.toLat, mobileRouteCalculatorDraft.toLng]
      .every(value => Number.isFinite(Number(value)));

    const from = fromHasCoords
      ? {
          label: mobileRouteCalculatorDraft.from,
          lat: Number(mobileRouteCalculatorDraft.fromLat),
          lng: Number(mobileRouteCalculatorDraft.fromLng)
        }
      : await geocodeMobileRoutePoint(mobileRouteCalculatorDraft.from);

    const to = toHasCoords
      ? {
          label: mobileRouteCalculatorDraft.to,
          lat: Number(mobileRouteCalculatorDraft.toLat),
          lng: Number(mobileRouteCalculatorDraft.toLng)
        }
      : await geocodeMobileRoutePoint(mobileRouteCalculatorDraft.to);

    mobileRouteCalculatorDraft = {
      ...mobileRouteCalculatorDraft,
      from: from.label,
      fromLat: from.lat,
      fromLng: from.lng,
      to: to.label,
      toLat: to.lat,
      toLng: to.lng
    };

    const profile = getOsrmProfile(mobileRouteCalculatorDraft.mode);
    const waypointCoords = (mobileRouteCalculatorDraft.waypoints || [])
      .filter(point => Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng)))
      .map(point => `${point.lng},${point.lat}`);

    const coordString = [
      `${from.lng},${from.lat}`,
      ...waypointCoords,
      `${to.lng},${to.lat}`
    ].join(';');

    const url = `https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();
    const route = data.routes?.[0];

    if (!route) throw new Error('Aucun trajet trouvé');

    mobileRouteCalculatorResult = {
      distanceLabel: formatMobileRouteDistance(route.distance),
      durationLabel: formatMobileRouteDuration(route.duration)
    };

    mobileRouteCalculatorCompact = Boolean(options.compactOnSuccess);

    drawMobileRouteCalculator(route.geometry);
  } catch (error) {
    alert('Erreur calcul trajet : ' + (error.message || error));
  } finally {
    mobileRouteCalculatorBusy = false;
    refreshMobileRouteCalculatorPanel();
  }
}

function refreshMobileRouteCalculatorPanel() {
  const panel = document.querySelector('.mobile-route-calculator');
  if (!panel) return;

  if (!mobileRouteCalculatorOpen) {
    panel.classList.remove('open');
    return;
  }

  const fromValue = escapeHtml(mobileRouteCalculatorDraft.from);
  const toValue = escapeHtml(mobileRouteCalculatorDraft.to);

  panel.outerHTML = `
    <article class="mobile-route-calculator glass-panel open ${mobileRouteCalculatorCompact ? 'is-compact' : ''}">
      <div class="mobile-route-header">
        <div>
          <span class="kicker">Outils</span>
          <h2>Calculateur d’itinéraire</h2>
        </div>
        <button type="button" data-action="map-route-calculator-close" aria-label="Fermer">
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </div>

      <div class="mobile-route-fields">
        <label>
          <span>Départ</span>
          <input id="mobile-route-from" type="search" value="${fromValue}" placeholder="Ville, adresse, gare...">
        </label>

                <button class="mobile-route-current" type="button" data-action="map-route-current-position">
          <span class="material-symbols-outlined" aria-hidden="true">my_location</span>
          <span>Ma position en départ</span>
        </button>

        <button class="mobile-route-swap" type="button" data-action="map-route-swap" aria-label="Inverser">
          <span class="material-symbols-outlined" aria-hidden="true">swap_vert</span>
        </button>

        <label>
          <span>Arrivée</span>
          <input id="mobile-route-to" type="search" value="${toValue}" placeholder="Ville, adresse, hôtel...">
        </label>

        <div class="mobile-route-modes">
          <button type="button" class="${mobileRouteCalculatorDraft.mode === 'driving' ? 'active' : ''}" data-action="map-route-mode" data-route-mode="driving">
            <span class="material-symbols-outlined" aria-hidden="true">directions_car</span>
            Voiture
          </button>
          <button type="button" class="${mobileRouteCalculatorDraft.mode === 'walking' ? 'active' : ''}" data-action="map-route-mode" data-route-mode="walking">
            <span class="material-symbols-outlined" aria-hidden="true">directions_walk</span>
            Marche
          </button>
          <button type="button" class="${mobileRouteCalculatorDraft.mode === 'cycling' ? 'active' : ''}" data-action="map-route-mode" data-route-mode="cycling">
            <span class="material-symbols-outlined" aria-hidden="true">directions_bike</span>
            Vélo
          </button>
        </div>

        <button class="mobile-route-reset" type="button" data-action="map-route-reset">
          <span class="material-symbols-outlined" aria-hidden="true">restart_alt</span>
          <span>Réinitialiser</span>
        </button>

        <button class="mobile-route-submit" type="button" data-action="map-route-calculate">
          <span class="material-symbols-outlined" aria-hidden="true">route</span>
          <span>${mobileRouteCalculatorBusy ? 'Calcul...' : 'Calculer le trajet'}</span>
        </button>

        ${mobileRouteCalculatorResult ? `
          <div class="mobile-route-result">
  <div class="mobile-route-result-copy">
    <span class="kicker">Calcul d'itinéraire</span>

    <h1>
      <span class="material-symbols-outlined" aria-hidden="true">
        ${mobileRouteCalculatorDraft.mode === 'walking' ? 'directions_walk' : mobileRouteCalculatorDraft.mode === 'cycling' ? 'directions_bike' : 'directions_car'}
      </span>
      ${escapeHtml(mobileRouteCalculatorDraft.from || 'Départ')} → ${escapeHtml(mobileRouteCalculatorDraft.to || 'Arrivée')}
    </h1>

    <p>${escapeHtml(mobileRouteCalculatorResult.durationLabel)} · ${escapeHtml(mobileRouteCalculatorResult.distanceLabel)}</p>
  </div>

  <div class="mobile-route-result-actions">
    <button type="button" data-action="map-route-dismiss" aria-label="Supprimer le trajet">
      <span class="material-symbols-outlined" aria-hidden="true">close</span>
    </button>

    <button type="button" data-action="map-route-expand" aria-label="Afficher le calculateur">
      <span class="material-symbols-outlined" aria-hidden="true">keyboard_arrow_up</span>
    </button>

    <a href="${getMobileRouteGoogleMapsUrl()}" target="_blank" rel="noopener">
      <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
      Maps
    </a>
  </div>
</div>
        ` : ''}
      </div>
    </article>
  `;

  initMobileRouteAutocomplete();
}

function initMobileRouteAutocomplete() {
  document.querySelectorAll('#mobile-route-from, #mobile-route-to').forEach(input => {
    if (!input || input.dataset.routeAcReady) return;

    input.dataset.routeAcReady = 'true';

    const kind = input.id === 'mobile-route-from' ? 'from' : 'to';
    const wrapper = input.closest('label') || input.parentElement;
    if (!wrapper) return;

    wrapper.style.position = 'relative';

    const dropdown = document.createElement('div');
    dropdown.className = 'mobile-route-suggestions';
    wrapper.appendChild(dropdown);

    let timer = null;

    input.addEventListener('input', () => {
      clearTimeout(timer);

      const query = input.value.trim();

      mobileRouteCalculatorDraft = {
        ...mobileRouteCalculatorDraft,
        [kind]: input.value,
        [`${kind}Lat`]: null,
        [`${kind}Lng`]: null
      };

      mobileRouteCalculatorResult = null;
      mobileRouteCalculatorCompact = false;
      clearMobileRouteCalculatorLayer();

      if (query.length < 2) {
        dropdown.innerHTML = '';
        dropdown.style.display = 'none';
        return;
      }

      timer = setTimeout(async () => {
        try {
          const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&language=fr&limit=5`);
          const data = await response.json();
          const features = data.features || [];

          dropdown.innerHTML = features.map((feature, index) => `
            <button type="button" data-route-suggestion="${index}">
              <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
              <span>${escapeHtml(feature.place_name)}</span>
            </button>
          `).join('');

          dropdown.style.display = features.length ? 'grid' : 'none';

          dropdown.querySelectorAll('[data-route-suggestion]').forEach(button => {
            button.addEventListener('click', () => {
              const feature = features[Number(button.dataset.routeSuggestion)];
              if (!feature?.center) return;

              input.value = feature.place_name;

              mobileRouteCalculatorDraft = {
                ...mobileRouteCalculatorDraft,
                [kind]: feature.place_name,
                [`${kind}Lat`]: Number(feature.center[1]),
                [`${kind}Lng`]: Number(feature.center[0])
              };

              dropdown.innerHTML = '';
              dropdown.style.display = 'none';

              refreshMobileRouteCalculatorPanel();
              maybeAutoCalculateMobileRoute();
            });
          });
        } catch (error) {
          console.warn('Route autocomplete error:', error);
          dropdown.innerHTML = '';
          dropdown.style.display = 'none';
        }
      }, 300);
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        dropdown.style.display = 'none';
      }, 180);
    });
  });
}

function initMobileMapSearch() {
  const input = document.querySelector('#mobile-map-search');
  const results = document.querySelector('#mobile-map-results');

  if (!input || !results) return;

  input.addEventListener('input', () => {
    clearTimeout(mobileMapSearchTimer);

    const query = input.value.trim();

    if (!query) {
      results.innerHTML = '';
      results.style.display = 'none';
      return;
    }

    mobileMapSearchTimer = setTimeout(async () => {
      try {
        const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&language=fr&limit=5`);
        const data = await response.json();

        results.innerHTML = (data.features || []).map((feature, index) => `
          <button type="button" data-map-result="${index}">
            <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
            <span>${escapeHtml(feature.place_name)}</span>
          </button>
        `).join('');

        results.style.display = results.innerHTML ? 'grid' : 'none';

        results.querySelectorAll('[data-map-result]').forEach(button => {
          button.addEventListener('click', () => {
            const feature = data.features[Number(button.dataset.mapResult)];
            if (!feature || !mobileMapInstance) return;

            mobileMapSelectedPlace = feature;
            mobileMapSelectedPlaceType = 'activity';
            mobileMapLocatingStep = null;
            mobileMapSelectedDayIndex = 0;
            mobileMapSelectedDayIndex = 0;
            input.value = feature.place_name;
            results.innerHTML = '';
            results.style.display = 'none';

            mobileMapInstance.flyTo({
              center: feature.center,
              zoom: 15,
              duration: 900
            });

            setMobileMapSearchMarker(feature.center);

            renderMobileMapSelectedPlace();
          });
        });
      } catch (error) {
        console.warn('Mobile map search error:', error);
      }
    }, 350);
  });
}

function renderInvite() {
  const title = pendingMobileInviteInfo?.tripName || 'Voyage partagé';

  app.innerHTML = `
    <div class="mobile-shell create-shell">
      <header class="topbar">
        <button class="icon-button" type="button" data-action="home" aria-label="Retour">×</button>
        <h1 class="topbar-title">Invitation</h1>
        <span></span>
      </header>

      <main class="create-main">
        <section class="create-hero">
          <h2>Rejoindre<br>${escapeHtml(title)}</h2>
          <p>Connectez-vous pour rejoindre ce voyage et le retrouver dans votre compte.</p>
        </section>

        <section class="docs-security-banner">
          <span class="material-symbols-outlined filled">group_add</span>
          <div>
            <strong>Voyage partagé</strong>
            <p>Une fois acceptée, l’invitation synchronise l’itinéraire, le budget, la carte et les documents.</p>
          </div>
        </section>
      </main>

      <div class="create-bottom">
        ${mobileUser ? `
          <button class="primary-action" type="button" data-action="accept-invite">
            Rejoindre le voyage
            <span aria-hidden="true">→</span>
          </button>
        ` : `
          <button class="primary-action" type="button" data-action="auth">
            Se connecter
            <span aria-hidden="true">→</span>
          </button>
        `}
      </div>
    </div>
  `;
}

function renderAuth() {
  app.innerHTML = `
    <div class="mobile-shell create-shell">
      <header class="topbar bordered create-topbar">
        <button class="icon-button" type="button" data-action="home" aria-label="Retour">×</button>
        <h1 class="topbar-title">Connexion</h1>
        <span></span>
      </header>

      <main class="create-main">
        <section class="create-hero">
          <h2>Bienvenue dans<br>L'Atelier</h2>
          <p>Connectez-vous pour retrouver vos voyages.</p>
        </section>

        <form class="create-form" data-auth-form>
          <div class="field-group">
            <label class="kicker" for="auth-email">Email</label>
            <div class="input-shell">
              <span class="material-symbols-outlined form-icon" aria-hidden="true">mail</span>
              <input id="auth-email" type="email" placeholder="vous@email.com" autocomplete="email">
            </div>
          </div>

          <div class="field-group">
            <label class="kicker" for="auth-password">Mot de passe</label>
            <div class="input-shell">
              <span class="material-symbols-outlined form-icon" aria-hidden="true">lock</span>
              <input id="auth-password" type="password" placeholder="••••••••" autocomplete="current-password">
            </div>
          </div>
        </form>
      </main>

      <div class="create-bottom">
        <button class="primary-action" type="button" data-action="login">
          Se connecter
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  `;
}

function renderAccount() {
  const name = mobileUser?.user_metadata?.display_name || mobileUser?.email?.split('@')[0] || 'Voyageur';
  const theme = getMobileTheme();
  const tripCount = mobileTrips.length;

  app.innerHTML = `
    <div class="mobile-shell">
      ${topbar()}

      <main class="home-main account-main">
        <section class="home-hero account-hero">
          <p class="kicker">Mon compte</p>
          <h2 class="hero-title">${escapeHtml(name)}</h2>
          <p class="docs-subtitle">${escapeHtml(mobileUser?.email || '')}</p>
        </section>

        <section class="account-card">
          <div class="section-heading compact">
            <h3>Profil</h3>
          </div>

          <label class="field-group" for="account-display-name">
            <span class="kicker">Pseudo</span>
            <div class="input-shell">
              <span class="material-symbols-outlined form-icon" aria-hidden="true">person</span>
              <input id="account-display-name" type="text" value="${escapeHtml(name)}" autocomplete="nickname">
            </div>
          </label>

          <button class="docs-action-primary full-width" type="button" data-action="save-profile">
            <span class="material-symbols-outlined">check</span>
            <span>Enregistrer le profil</span>
          </button>
        </section>

        <section class="account-card">
          <div class="section-heading compact">
            <h3>Préférences</h3>
          </div>

          <button class="account-setting-row" type="button" data-action="toggle-theme">
            <span class="material-symbols-outlined">${theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
            <span>
              <strong>Thème ${theme === 'dark' ? 'sombre' : 'clair'}</strong>
              <small>Changer l’apparence de l’app mobile</small>
            </span>
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </section>

        <section>
          <div class="section-heading">
            <h3>Mes Voyages</h3>
            <span>${tripCount}</span>
          </div>

          <div class="docs-grid">
            ${mobileTrips.length ? mobileTrips.map(trip => `
              <button class="docs-file-row" type="button" data-trip-id="${trip.id}" data-action="open-trip">
                <span class="material-symbols-outlined docs-file-type-icon">flight_takeoff</span>
                <div class="docs-file-info">
                  <span class="docs-file-name">${escapeHtml(trip.name)}</span>
                  <span class="docs-file-meta">${trip.start_date ? formatDateLabel(trip.start_date, '') : 'Sans date'}</span>
                </div>
                <span class="material-symbols-outlined docs-file-more">chevron_right</span>
              </button>
            `).join('') : '<span class="companion-empty">Aucun voyage pour le moment.</span>'}
          </div>
        </section>

        <button class="create-adventure" type="button" data-action="create-trip">
          <span class="plus">+</span>
          <span>Créer une nouvelle aventure</span>
        </button>

        <button class="create-adventure danger-action" type="button" data-action="logout">
          <span class="material-symbols-outlined">logout</span>
          <span>Déconnexion</span>
        </button>
      </main>

      ${bottomNav('plan')}
    </div>
  `;
}

function renderCreateTrip() {
  const draft = getTripDraft();
  const companions = draft.companions || [];

  app.innerHTML = `
    <div class="mobile-shell create-shell">
      <header class="topbar bordered create-topbar">
        <button class="icon-button" type="button" data-action="home" aria-label="Fermer">×</button>
        <h1 class="topbar-title">Nouvelle Aventure</h1>
        <span></span>
      </header>

      <main class="create-main">
        <section class="create-hero">
          <h2>Quelle sera votre<br>prochaine escale ?</h2>
          <p>Laissez-vous guider par l'inspiration.</p>
        </section>

        <form class="create-form" data-create-form>
          <div class="field-group">
            <label class="kicker" for="destination">Destination</label>
            <div class="input-shell">
              <span class="material-symbols-outlined form-icon" aria-hidden="true">location_on</span>
              <input id="destination" type="text" placeholder="Ex: Kyoto, Japon" autocomplete="off" data-autocomplete value="${escapeHtml(draft.destination || '')}">
            </div>
          </div>

          <div class="field-group">
            <span class="kicker">Période du voyage</span>
            <div class="date-grid">
              <label class="date-card interactive-date">
                <span class="date-label">Début</span>
                <span class="date-value" data-date-label="start">${formatDateLabel(draft.startDate, 'Sélectionner')}</span>
                <span class="material-symbols-outlined date-icon" aria-hidden="true">calendar_today</span>
                <input id="start-date" type="date" value="${escapeHtml(draft.startDate || '')}" aria-label="Date de début">
              </label>
              <label class="date-card interactive-date">
                <span class="date-label">Fin</span>
                <span class="date-value ${draft.endDate ? '' : 'muted'}" data-date-label="end">${formatDateLabel(draft.endDate, 'Optionnel')}</span>
                <span class="material-symbols-outlined date-icon" aria-hidden="true">calendar_month</span>
                <input id="end-date" type="date" value="${escapeHtml(draft.endDate || '')}" aria-label="Date de fin">
              </label>
            </div>
          </div>

          <div class="field-group">
            <span class="kicker">Compagnons de route</span>
            <div class="companions-panel">
              <div class="companions-input-row">
                <span class="material-symbols-outlined" aria-hidden="true">person_add</span>
                <input id="companion-name" type="text" placeholder="Nom d'un ami" autocomplete="off">
                <button type="button" data-action="add-friend">Ajouter</button>
              </div>
              <div class="companion-list" aria-live="polite">
                ${companions.length ? companions.map(name => `
                  <span class="companion-chip" data-companion-chip data-companion-name="${escapeHtml(name)}">${escapeHtml(name)}</span>
                `).join('') : '<span class="companion-empty">Aucun ami ajouté pour le moment.</span>'}
              </div>
            </div>
          </div>
        </form>
      </main>

      <div class="create-bottom">
        <button class="primary-action" type="button" data-action="create-board">
          Créer le carnet de bord
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  `;
    initCreateTripControls();
}

function initCreateTripControls() {
  initAutocompleteOnPage();

  document.querySelectorAll('.interactive-date').forEach(card => {
    const input = card.querySelector('input[type="date"]');
    if (!input) return;

    card.addEventListener('click', event => {
      event.preventDefault();

      input.focus();

      if (typeof input.showPicker === 'function') {
        input.showPicker();
      }
    });
  });

  const addFriendButton = document.querySelector('[data-action="add-friend"]');
  if (addFriendButton) {
    addFriendButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      handleAddFriend();
    });
  }

  const companionInput = document.querySelector('#companion-name');
  if (companionInput) {
    companionInput.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      handleAddFriend();
    });
  }
}

function renderItinerary() {
  const draft = getTripDraft();
  const timelineSteps = getCurrentTimelineSteps();

  const title = activeTrip?.name || draft.destination || 'Frontière du Nord';

  const period = activeTrip?.startDate
    ? formatDateLabel(activeTrip.startDate, '')
    : draft.startDate
      ? `${formatDateLabel(draft.startDate, '')}${draft.endDate ? ` – ${formatDateLabel(draft.endDate, '')}` : ''}`
      : 'Jour 1';

  app.innerHTML = `
    <div class="mobile-shell itinerary-shell">
      ${topbar()}

      <main class="itinerary-main">
        <section class="itinerary-hero" aria-label="Itinéraire du jour 6">
          <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop" alt="Paysage de montagnes verdoyantes" loading="lazy">
          <div class="itinerary-hero-overlay"></div>
          <div class="itinerary-hero-content">
            <span class="kicker">${escapeHtml(period)}</span>
            <h2>${escapeHtml(title)}</h2>
          </div>
        </section>

        <section class="timeline" aria-label="Programme de la journée">
          ${timelineSteps.map((step, stepIndex) => `
            <article class="timeline-item ${step.type === 'Activité' ? 'clickable' : ''}" ${step.type === 'Activité' ? 'data-action="activity-detail" tabindex="0" role="button" aria-label="Ouvrir le détail de Sanctuaire Meiji"' : ''}>
              <span class="timeline-pin ${step.tone}">
                <span class="material-symbols-outlined" aria-hidden="true">${step.icon}</span>
              </span>
              <div class="timeline-card">
                <time>${step.time}</time>
                <div>
                  <span class="kicker">${step.type}</span>
                  <h3>${step.title}</h3>
                  <p>${step.description}</p>
<div class="item-actions">
  <button class="icon-mini" type="button" data-action="edit-step" data-step-index="${stepIndex}" aria-label="Modifier l'étape">
    <span class="material-symbols-outlined">edit</span>
  </button>
  <button class="icon-mini danger" type="button" data-action="delete-step" data-step-index="${stepIndex}" aria-label="Supprimer l'étape">
    <span class="material-symbols-outlined">close</span>
  </button>
</div>
                </div>
              </div>
            </article>
          `).join('')}

          <div class="timeline-add">
            <span class="timeline-dot" aria-hidden="true"></span>
            <button type="button" data-action="${activeTrip?.id ? 'new-step' : 'create-trip'}">
  <span class="material-symbols-outlined" aria-hidden="true">add</span>
  <span>${activeTrip?.id ? 'Ajouter une étape' : 'Créer un voyage d’abord'}</span>
</button>
          </div>
        </section>
      </main>

      ${bottomNav('plan')}
    </div>
  `;
}


function renderActivityDetail() {
  app.innerHTML = `
    <div class="mobile-shell activity-detail-shell">
      <header class="activity-detail-topbar glass-panel">
        <button type="button" data-action="itinerary" aria-label="Retour au programme">
          <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        </button>
        <div>
          <button type="button" aria-label="Modifier l'activité">
            <span class="material-symbols-outlined" aria-hidden="true">edit</span>
          </button>
          <button type="button" aria-label="Plus d'options">
            <span class="material-symbols-outlined" aria-hidden="true">more_vert</span>
          </button>
        </div>
      </header>

      <section class="activity-hero" aria-label="Sanctuaire Meiji">
        <div class="activity-hero-image" aria-hidden="true"></div>
        <div class="activity-hero-overlay" aria-hidden="true"></div>
        <div class="activity-hero-content">
          <span class="kicker">Activité Culturelle</span>
          <h1>Sanctuaire Meiji</h1>
        </div>
      </section>

      <main class="activity-detail-main">
        <section class="activity-info-grid" aria-label="Informations clés">
          <article class="activity-info-card">
            <span class="activity-info-icon material-symbols-outlined" aria-hidden="true">schedule</span>
            <div>
              <span class="kicker">Heure</span>
              <strong>10:00</strong>
            </div>
          </article>
          <article class="activity-info-card">
            <span class="activity-info-icon material-symbols-outlined" aria-hidden="true">hourglass_top</span>
            <div>
              <span class="kicker">Durée</span>
              <strong>2 heures</strong>
            </div>
          </article>
        </section>

        <section class="activity-section" aria-labelledby="activity-location-title">
          <h2 id="activity-location-title">
            <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
            <span>Lieu</span>
          </h2>
          <div class="activity-location-card">
            <div>
              <strong>Shibuya, Tokyo</strong>
              <p>1-1 Yoyogikamizonocho</p>
            </div>
            <button type="button" data-action="map">
              <span>Voir sur la carte</span>
              <span class="material-symbols-outlined" aria-hidden="true">map</span>
            </button>
          </div>
        </section>

        <section class="activity-section" aria-labelledby="activity-notes-title">
          <h2 id="activity-notes-title">
            <span class="material-symbols-outlined" aria-hidden="true">edit_note</span>
            <span>Notes de Voyage</span>
          </h2>
          <article class="activity-notes-card">
            <span class="quote-icon material-symbols-outlined" aria-hidden="true">format_quote</span>
            <p>Arriver tôt, de préférence juste après l'ouverture, pour éviter les foules massives et profiter du calme de la forêt qui entoure le sanctuaire. La marche depuis la gare de Harajuku à travers l'allée des cèdres est particulièrement apaisante.</p>
            <p>Ne pas oublier d'observer les barils de saké (Kazaridaru) offerts au sanctuaire, situés le long du chemin principal. C'est un excellent point photo. Prévoir des chaussures confortables car les allées de gravier peuvent être fatigantes.</p>
            <div class="activity-tags" aria-label="Tags">
              <span>#calme</span>
              <span>#photo</span>
              <span>#culture</span>
            </div>
          </article>
        </section>

        <section class="activity-gallery" aria-label="Galerie de l'activité">
          <div class="activity-gallery-item sake" aria-label="Barils de saké"></div>
          <div class="activity-gallery-item ema" aria-label="Plaques Ema"></div>
        </section>
      </main>

      ${bottomNav('plan')}
    </div>
  `;
}

function renderNewStep() {
  const activeCategory = stepFieldSets[selectedStepCategory] ? selectedStepCategory : 'transport';
  const config = stepFieldSets[activeCategory] || stepFieldSets.transport;

  app.innerHTML = `
    <div class="mobile-shell new-step-shell">
      <header class="new-step-header">
        <button class="new-step-close" type="button" data-action="itinerary" aria-label="Fermer">
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
        <h1>${editingStepDraft ? 'Modifier l’étape' : 'Nouvelle étape'}</h1>
        <span aria-hidden="true"></span>
      </header>

      <main class="new-step-main">
        <section class="new-step-section">
          <h2 class="kicker">Catégorie</h2>
          <div class="category-grid" role="list" aria-label="Catégories d'étape">
            ${stepCategories.map(category => `
              <button class="category-card ${activeCategory === category.id ? 'active' : ''}" type="button" data-category="${category.id}" aria-pressed="${activeCategory === category.id ? 'true' : 'false'}">
                <span class="material-symbols-outlined" aria-hidden="true">${category.icon}</span>
                <span>${category.label}</span>
              </button>
            `).join('')}
          </div>
        </section>

        <section class="new-step-section">
          <h2 class="kicker">${config.sectionTitle || "Détails de l'étape"}</h2>
          <form class="step-form" data-step-form>
            ${renderStepFields(activeCategory)}
          </form>
        </section>
      </main>

      <div class="new-step-bottom">
        <button class="primary-action" type="button" data-action="add-step-to-program">
          <span class="material-symbols-outlined" aria-hidden="true">add</span>
          <span>${editingStepDraft ? 'Enregistrer les modifications' : 'Ajouter au programme'}</span>
        </button>
      </div>
    </div>
  `;
  initAutocompleteOnPage();
}


function budgetTabs(active = 'overview') {
  const tabs = [
    { id: 'overview', label: 'Aperçu', action: 'budget-overview' },
    { id: 'expenses', label: 'Dépenses', action: 'budget' },
    { id: 'balance', label: 'Équilibre', action: 'budget-balance' }
  ];

  const tabsHtml = tabs.map(function(tab) {
    const isActive = active === tab.id;

    return `
      <button
        class="seg-control-btn ${isActive ? 'active' : ''}"
        type="button"
        role="tab"
        aria-selected="${isActive ? 'true' : 'false'}"
        data-action="${tab.action}"
      >${tab.label}</button>
    `;
  }).join('');

  return `
    <div class="seg-control" role="tablist" aria-label="Vue budget">
      ${tabsHtml}
    </div>
  `;
}

function renderBudget() {
  const budgetGroups = getBudgetGroupsForDisplay();

  const groupsHtml = budgetGroups.map(function(group, groupIndex) {
    const itemsHtml = group.items.map(function(item, itemIndex) {
      const iconName = item.icon && !['', '▣', '☕', '▰', '✈', '◉', '◒', '▤'].includes(item.icon)
        ? item.icon
        : getBudgetCategoryIcon(item.cat || item.title || '');

      const amountLabel = item.amountLabel || `- ${formatEuroAmount(item.amount)}`;
      const tone = item.tone || 'primary';

      return `
        <article class="expense-card">
          <div class="expense-left">
            <span class="expense-icon ${tone}" aria-hidden="true">
              <span class="material-symbols-outlined">${iconName}</span>
            </span>

            <div>
              <h3>${escapeHtml(item.title || 'Dépense')}</h3>
              <p>Payé par ${escapeHtml(item.payer || '—')}</p>
            </div>
          </div>

          <div class="expense-card-right">
            <strong>${escapeHtml(amountLabel)}</strong>

            <div class="expense-card-actions">
              <button
                class="expense-card-action"
                type="button"
                data-action="edit-budget-expense"
                data-expense-id="${item.id || ''}"
                data-group-index="${groupIndex}"
                data-item-index="${itemIndex}"
                aria-label="Modifier la dépense"
              >
                <span class="material-symbols-outlined" aria-hidden="true">edit</span>
              </button>

              <button
                class="expense-card-action danger"
                type="button"
                data-action="delete-budget-expense"
                data-expense-id="${item.id || ''}"
                data-group-index="${groupIndex}"
                data-item-index="${itemIndex}"
                aria-label="Supprimer la dépense"
              >
                <span class="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    return `
      <section class="expense-group">
        <h2 class="kicker">${escapeHtml(group.group)}</h2>
        ${itemsHtml}
      </section>
    `;
  }).join('');

  app.innerHTML = `
    <div class="mobile-shell">
      ${topbar()}

      <main class="budget-main">
        ${budgetTabs('expenses')}

        <button class="create-adventure compact" type="button" data-action="new-expense">
          <span class="material-symbols-outlined">add_circle</span>
          <span>Ajouter une dépense</span>
        </button>

        <div class="expense-list">
          ${groupsHtml || `
            <section class="budget-empty">
              <span class="material-symbols-outlined">receipt_long</span>
              <p>Aucune dépense pour le moment.</p>
            </section>
          `}
        </div>
      </main>

      ${bottomNav('budget')}
    </div>
  `;
}

function parseEuroAmount(value = '') {
  const normalized = String(value)
    .replace(/[^0-9,.-]/g, '')
    .replace(',', '.');

  const amount = Number.parseFloat(normalized);

  return Number.isFinite(amount) ? Math.abs(amount) : 0;
}

function formatEuroAmount(value = 0) {
  const amount = Number(value) || 0;

  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
}

function getBudgetCategoryIcon(category = '') {
  const normalized = category.toLowerCase();

  if (normalized.includes('repas') || normalized.includes('restaurant')) return 'restaurant';
  if (normalized.includes('transport') || normalized.includes('train') || normalized.includes('bus')) return 'directions_bus';
  if (normalized.includes('hôtel') || normalized.includes('hotel') || normalized.includes('logement')) return 'hotel';
  if (normalized.includes('activité') || normalized.includes('activite')) return 'local_activity';
  if (normalized.includes('vol')) return 'flight';
  if (normalized.includes('café') || normalized.includes('cafe')) return 'local_cafe';
  if (normalized.includes('achat')) return 'shopping_bag';

  return 'receipt';
}

function getCurrentBudgetItems() {
  if (activeTrip?.budget?.length) {
    return activeTrip.budget.map(item => ({
      id: item.id,
      cat: item.cat || 'Divers',
      title: item.desc || item.cat || 'Dépense',
      payer: item.paidBy || '—',
      amount: Number(item.amount) || 0,
      forParticipants: item.forParticipants || item.for_participants || ['__all__'],
      synced: true
    }));
  }

  return expenses.flatMap(group =>
    group.items.map(item => ({
      id: null,
      cat: item.title || 'Divers',
      title: item.title,
      payer: item.payer,
      amount: parseEuroAmount(item.amount),
      icon: item.icon,
      tone: item.tone,
      synced: false
    }))
  );
}

function getCurrentBudgetTotal() {
  return getCurrentBudgetItems().reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

function getBudgetGroupsForDisplay() {
  if (activeTrip?.budget?.length) {
    return [
      {
        group: 'Aujourd’hui',
        items: getCurrentBudgetItems().map(item => ({
          ...item,
          amountLabel: `- ${formatEuroAmount(item.amount)}`,
          icon: getBudgetCategoryIcon(item.cat),
          tone: 'primary'
        }))
      }
    ];
  }

  return expenses.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      amountLabel: item.amount,
      synced: false
    }))
  }));
}

function getCustomExpenseCategories() {
  try {
    return JSON.parse(localStorage.getItem('atelierCustomExpenseCategories')) || [];
  } catch {
    return [];
  }
}

function saveCustomExpenseCategories(categories) {
  localStorage.setItem('atelierCustomExpenseCategories', JSON.stringify(categories));
}

function getHiddenExpenseCategoryIds() {
  try {
    return JSON.parse(localStorage.getItem('atelierHiddenExpenseCategoryIds')) || [];
  } catch {
    return [];
  }
}

function saveHiddenExpenseCategoryIds(ids) {
  localStorage.setItem('atelierHiddenExpenseCategoryIds', JSON.stringify(ids));
}

function getExpenseCategories() {
  const customCategories = getCustomExpenseCategories();
  const hiddenIds = getHiddenExpenseCategoryIds();

  const baseWithoutOther = expenseCategories.filter(function(category) {
    return category.id !== 'other' && !hiddenIds.includes(category.id);
  });

  const otherCategory = expenseCategories.find(function(category) {
    return category.id === 'other';
  });

  const visibleCustomCategories = customCategories.filter(function(category) {
    return !hiddenIds.includes(category.id);
  });

  return [
    ...baseWithoutOther,
    ...visibleCustomCategories,
    otherCategory
  ].filter(Boolean);
}

function openExpenseModal(type, options = {}) {
  expenseModal = {
    type,
    id: options.id || null,
    value: options.value || ''
  };

  renderNewExpense();
}

function closeExpenseModal() {
  expenseModal = null;
  renderNewExpense();
}

async function confirmExpenseModal() {
  const input = document.querySelector('#expense-modal-input');
  const value = input?.value.trim();

  if (!expenseModal || !value) return;

  if (expenseModal.type === 'category') {
    const customCategories = getCustomExpenseCategories();

    customCategories.push({
      id: `custom-${Date.now()}`,
      label: value,
      icon: 'receipt',
      tone: 'neutral',
      emoji: '+',
      custom: true
    });

    saveCustomExpenseCategories(customCategories);
    selectedExpenseCategory = customCategories[customCategories.length - 1].id;
  }

  if (expenseModal.type === 'person') {
    await addBudgetPersonByName(value);
  }

  if (expenseModal.type === 'person-edit') {
    await updateBudgetPersonByName(expenseModal.id, value);
  }

  expenseModal = null;
  renderNewExpense();
}

function renderExpenseModal() {
  if (!expenseModal) return '';

  const title = expenseModal.type === 'category'
    ? 'Ajouter une catégorie'
    : expenseModal.type === 'person-edit'
      ? 'Modifier la personne'
      : 'Ajouter une personne';

  const placeholder = expenseModal.type === 'category'
    ? 'Ex: Visites, Santé, Souvenirs...'
    : 'Nom de la personne';

  return `
    <div class="expense-v2-modal-backdrop">
      <div class="expense-v2-modal">
        <button class="expense-v2-modal-close" type="button" data-action="close-expense-modal" aria-label="Fermer">
          <span class="material-symbols-outlined">close</span>
        </button>

        <h3>${title}</h3>

        <label class="expense-v2-modal-field">
          <span class="material-symbols-outlined">${expenseModal.type === 'category' ? 'category' : 'person'}</span>
          <input id="expense-modal-input" type="text" value="${escapeHtml(expenseModal.value || '')}" placeholder="${placeholder}">
        </label>

        <div class="expense-v2-modal-actions">
          <button class="secondary" type="button" data-action="close-expense-modal">Annuler</button>
          <button class="primary" type="button" data-action="confirm-expense-modal">Valider</button>
        </div>
      </div>
    </div>
  `;
}

function handleAddExpenseCategory() {
  openExpenseModal('category');
}

function handleDeleteExpenseCategory(categoryId) {
  if (!categoryId) return;

  const categories = getExpenseCategories();
  const category = categories.find(function(item) {
    return item.id === categoryId;
  });

  if (!category) return;

  const confirmed = confirm(`Supprimer la catégorie "${category.label}" ?`);
  if (!confirmed) return;

  if (category.custom) {
    const nextCustomCategories = getCustomExpenseCategories().filter(function(item) {
      return item.id !== categoryId;
    });

    saveCustomExpenseCategories(nextCustomCategories);
  } else {
    const hiddenIds = getHiddenExpenseCategoryIds();

    if (!hiddenIds.includes(categoryId)) {
      hiddenIds.push(categoryId);
      saveHiddenExpenseCategoryIds(hiddenIds);
    }
  }

  if (selectedExpenseCategory === categoryId) {
    selectedExpenseCategory = 'other';
  }

  renderNewExpense();
}

function toggleExpenseCategoryEdition() {
  isEditingExpenseCategories = !isEditingExpenseCategories;
  renderNewExpense();
}

function toggleBudgetPeopleEdition() {
  isEditingBudgetPeople = !isEditingBudgetPeople;
  renderNewExpense();
}

async function addBudgetPersonByName(name) {
  const cleanName = name.trim();
  if (!cleanName) return;

  if (activeTrip?.id && window.SB?.addParticipant) {
    await window.SB.addParticipant(activeTrip.id, cleanName, activeTrip.participants?.length || 0);
    await refreshMobileTrips(activeTrip.id);
    return;
  }

  const localPeople = getLocalBudgetPeople();
  localPeople.push({
    id: `local-person-${Date.now()}`,
    name: cleanName
  });
  saveLocalBudgetPeople(localPeople);
}

async function updateBudgetPersonByName(personId, name) {
  const cleanName = name.trim();
  if (!personId || !cleanName) return;

  if (activeTrip?.id && window.SB?.sb && !String(personId).startsWith('local-person-')) {
    const { error } = await window.SB.sb
      .from('trip_participants')
      .update({ name: cleanName })
      .eq('id', personId);

    if (error) {
      alert('Erreur modification personne : ' + error.message);
      return;
    }

    await refreshMobileTrips(activeTrip.id);
    return;
  }

  const localPeople = getLocalBudgetPeople().map(function(person) {
    if (person.id !== personId) return person;
    return {
      ...person,
      name: cleanName
    };
  });

  saveLocalBudgetPeople(localPeople);
}

async function handleDeleteBudgetPerson(personId) {
  if (!personId) return;

  const people = getBudgetPeople();
  const person = people.find(item => item.id === personId);
  if (!person) return;

  const confirmed = confirm(`Supprimer "${person.name}" ?`);
  if (!confirmed) return;

  if (personId === 'me' || personId === 'partner') {
    const hiddenIds = getHiddenBudgetPeopleIds();
    if (!hiddenIds.includes(personId)) hiddenIds.push(personId);
    saveHiddenBudgetPeopleIds(hiddenIds);
  } else if (activeTrip?.id && window.SB?.removeParticipant && !String(personId).startsWith('local-person-')) {
    await window.SB.removeParticipant(personId);
    await refreshMobileTrips(activeTrip.id);
  } else {
    const nextPeople = getLocalBudgetPeople().filter(item => item.id !== personId);
    saveLocalBudgetPeople(nextPeople);
  }

  if (selectedExpensePayer === personId) selectedExpensePayer = 'me';
  if (selectedExpenseSplit === personId) selectedExpenseSplit = 'equal';

  renderNewExpense();
}

function handleEditBudgetPerson(personId) {
  const person = getBudgetPeople().find(function(item) {
    return item.id === personId;
  });

  if (!person) return;

  openExpenseModal('person-edit', {
    id: person.id,
    value: person.name
  });
}

async function handleAddBudgetPerson() {
  const members = await getMobileTripMembers();
  const participants = activeTrip?.participants || [];

  const candidates = members.filter(member => (
    !window.SB?.isMemberAlreadyParticipant ||
    !window.SB.isMemberAlreadyParticipant(member, participants)
  ));

  if (candidates.length) {
    const choices = candidates
      .map((member, index) => `${index + 1}. ${member.name || member.email}`)
      .join('\n');

    const pick = prompt(
      `Ajouter un membre au budget ?\n\n${choices}\n\nTape le numéro du membre, ou écris un nouveau nom :`,
      '1'
    );

    if (!pick) return;

    const index = Number(pick) - 1;
    const selectedMember = Number.isInteger(index) ? candidates[index] : null;

    if (selectedMember && window.SB?.addMemberAsParticipant) {
      await window.SB.addMemberAsParticipant(
        activeTrip.id,
        selectedMember,
        participants.length
      );

      await refreshMobileTrips(activeTrip.id);
      renderNewExpense();
      return;
    }

    const customName = pick.trim();
    if (!customName) return;

    await addBudgetPersonByName(customName);
    return;
  }

  if (typeof openExpenseModal === 'function') {
    openExpenseModal('person');
    return;
  }

  const name = prompt('Nom de la personne :');
  if (!name || !name.trim()) return;

  saveLocalBudgetPeople([...getLocalBudgetPeople(), {
    id: `local-${Date.now()}`,
    name: name.trim()
  }]);

  renderNewExpense();
}

function getLocalBudgetPeople() {
  try {
    return JSON.parse(localStorage.getItem('atelierBudgetPeople')) || [];
  } catch {
    return [];
  }
}

function saveLocalBudgetPeople(people) {
  localStorage.setItem('atelierBudgetPeople', JSON.stringify(people));
}

function getHiddenBudgetPeopleIds() {
  try {
    return JSON.parse(localStorage.getItem('atelierHiddenBudgetPeopleIds')) || [];
  } catch {
    return [];
  }
}

function saveHiddenBudgetPeopleIds(ids) {
  localStorage.setItem('atelierHiddenBudgetPeopleIds', JSON.stringify(ids));
}

async function getMobileTripMembers() {
  if (!activeTrip?.id || !window.SB?.listTripMembers) return [];

  try {
    return await window.SB.listTripMembers(activeTrip.id);
  } catch (error) {
    console.warn('Mobile members load error:', error);
    return [];
  }
}

function getBudgetPeople() {
  const participants = activeTrip?.participants || [];

  if (participants.length) {
    return participants.map(function(person) {
      return {
        id: person.id,
        name: person.name
      };
    });
  }

  const localPeople = getLocalBudgetPeople();

  const hiddenIds = getHiddenBudgetPeopleIds();

return [
  { id: 'me', name: 'Moi' },
  { id: 'partner', name: 'Partenaire' },
  ...localPeople
].filter(person => !hiddenIds.includes(person.id));
}

function getInitial(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function renderNewExpense() {
  const categories = typeof getExpenseCategories === 'function'
    ? getExpenseCategories()
    : expenseCategories;

  const people = (typeof getBudgetPeople === 'function'
    ? getBudgetPeople()
    : [
      { id: 'me', name: 'Moi' },
      { id: 'partner', name: 'Partenaire' }
    ]).filter(function(person) {
      return person.id !== 'common';
    });

  const editingItem = editingExpenseDraft || null;

  const activeCategory = categories.find(function(category) {
    return category.id === selectedExpenseCategory;
  }) || categories[0];

  const editingAmount = editingItem?.amount
    ? String(editingItem.amount).replace('.', ',')
    : '';

  const editingTitle = editingItem?.title || '';
  const editingNote = editingItem?.note || '';

  const categoryButtonsHtml = categories.map(function(category) {
    const isActive = activeCategory.id === category.id;
    const canDelete = category.id !== 'other';

    return `
      <div class="expense-v2-category-wrap">
        <button
          class="expense-v2-category ${isActive ? 'active' : ''}"
          type="button"
          data-expense-category="${category.id}"
        >
          <span class="material-symbols-outlined ${isActive ? 'filled' : ''}" aria-hidden="true">${category.icon}</span>
          <span>${escapeHtml(category.label)}</span>
        </button>

        ${
          isEditingExpenseCategories && canDelete
            ? `
              <button
                class="expense-v2-category-delete"
                type="button"
                data-action="delete-expense-category"
                data-category-id="${category.id}"
                aria-label="Supprimer ${escapeHtml(category.label)}"
              >
                <span class="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            `
            : ''
        }
      </div>
    `;
  }).join('');

  const visiblePayers = showAllExpensePayers ? people : people.slice(0, 3);
const hiddenPayersCount = Math.max(0, people.length - visiblePayers.length);

const payerButtonsHtml = visiblePayers.map(function(person) {
  const isActive = selectedExpensePayer === person.id;
  const canEdit = person.id !== 'common';

  return `
    <div class="expense-v2-person-card-wrap">
      <button
        class="expense-v2-person-card ${isActive ? 'active' : ''}"
        type="button"
        data-expense-payer="${person.id}"
        ${isEditingBudgetPeople && canEdit ? `data-action="edit-budget-person" data-person-id="${person.id}"` : ''}
      >
        <span class="expense-v2-person-avatar">${getInitial(person.name)}</span>
        <span>${escapeHtml(person.name)}</span>
      </button>

      ${
        isEditingBudgetPeople && canEdit
          ? `
            <button
              class="expense-v2-card-delete"
              type="button"
              data-action="delete-budget-person"
              data-person-id="${person.id}"
              aria-label="Supprimer ${escapeHtml(person.name)}"
            >
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          `
          : ''
      }
    </div>
  `;
}).join('');

const payerMoreButtonHtml = hiddenPayersCount
  ? `
    <button class="expense-v2-person-card expense-v2-more-card" type="button" data-action="toggle-expense-payers">
      <span class="expense-v2-person-avatar">${showAllExpensePayers ? '−' : '+'}</span>
      <span>${showAllExpensePayers ? 'Réduire' : `+${hiddenPayersCount} autres`}</span>
    </button>
  `
  : '';

  const visibleSplits = showAllExpenseSplits ? people : people.slice(0, 2);
const hiddenSplitsCount = Math.max(0, people.length - visibleSplits.length);

const splitPeopleHtml = visibleSplits.map(function(person) {
  const isActive = selectedExpenseSplit === person.id;
  const canEdit = person.id !== 'common';

  return `
    <div class="expense-v2-person-card-wrap">
      <button
        class="expense-v2-person-card ${isActive ? 'active' : ''}"
        type="button"
        data-expense-split="${person.id}"
        ${isEditingBudgetPeople && canEdit ? `data-action="edit-budget-person" data-person-id="${person.id}"` : ''}
      >
        <span class="expense-v2-person-avatar">${getInitial(person.name)}</span>
        <span>${escapeHtml(person.name)}</span>
      </button>

      ${
        isEditingBudgetPeople && canEdit
          ? `
            <button
              class="expense-v2-card-delete"
              type="button"
              data-action="delete-budget-person"
              data-person-id="${person.id}"
              aria-label="Supprimer ${escapeHtml(person.name)}"
            >
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          `
          : ''
      }
    </div>
  `;
}).join('');

const splitMoreButtonHtml = hiddenSplitsCount
  ? `
    <button class="expense-v2-person-card expense-v2-more-card" type="button" data-action="toggle-expense-splits">
      <span class="expense-v2-person-avatar">${showAllExpenseSplits ? '−' : '+'}</span>
      <span>${showAllExpenseSplits ? 'Réduire' : `+${hiddenSplitsCount} autres`}</span>
    </button>
  `
  : '';

  app.innerHTML = `
    <div class="mobile-shell expense-v2-shell">
      <header class="expense-v2-header">
        <button class="expense-v2-close" type="button" data-action="budget" aria-label="Fermer">
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>

        <span class="expense-v2-title">
          ${editingItem ? 'Modifier la dépense' : 'Nouvelle dépense'}
        </span>

        <button class="expense-v2-save" type="button" data-action="save-expense">
          Enregistrer
        </button>
      </header>

      <main class="expense-v2-main">
        <section class="expense-v2-amount-section">
          <span class="expense-v2-kicker">Montant</span>

          <label class="expense-v2-amount-input">
            <span>€</span>
            <input
              id="expense-amount"
              type="text"
              inputmode="decimal"
              value="${escapeHtml(editingAmount)}"
              placeholder="0.00"
              aria-label="Montant de la dépense"
            >
          </label>

          <div class="expense-v2-amount-line" aria-hidden="true"></div>

          <label class="expense-v2-title-input">
            <span class="material-symbols-outlined" aria-hidden="true">edit_note</span>
            <input
              id="expense-title"
              type="text"
              value="${escapeHtml(editingTitle)}"
              placeholder="Nom de la dépense"
            >
          </label>
        </section>

        <section class="expense-v2-section">
          <div class="expense-v2-section-heading">
            <span class="expense-v2-kicker">Catégorie</span>

            <button
              class="expense-v2-mini-action ${isEditingExpenseCategories ? 'active' : ''}"
              type="button"
              data-action="toggle-expense-category-edition"
              aria-label="Modifier les catégories"
            >
              <span class="material-symbols-outlined" aria-hidden="true">edit</span>
            </button>
          </div>

          <div class="expense-v2-category-grid">
            ${categoryButtonsHtml}

            <button
              class="expense-v2-category expense-v2-add-card"
              type="button"
              data-action="add-expense-category"
              aria-label="Ajouter une catégorie"
            >
              <span class="material-symbols-outlined" aria-hidden="true">add</span>
              <span>${mobileMapLocatingStep ? 'Localiser' : 'Ajouter'}</span>
            </button>
          </div>
        </section>

        <section class="expense-v2-section">
          <div class="expense-v2-section-heading">
            <span class="expense-v2-kicker">Qui a payé ?</span>

            <div class="expense-v2-heading-actions">
              <button
                class="expense-v2-mini-action ${isEditingBudgetPeople ? 'active' : ''}"
                type="button"
                data-action="toggle-budget-people-edition"
                aria-label="Modifier les personnes"
              >
                <span class="material-symbols-outlined" aria-hidden="true">edit</span>
              </button>

              <button
                class="expense-v2-mini-action"
                type="button"
                data-action="add-budget-person"
                aria-label="Ajouter une personne"
              >
                <span class="material-symbols-outlined" aria-hidden="true">person_add</span>
              </button>
            </div>
          </div>

          <div class="expense-v2-person-grid">
            ${payerButtonsHtml}
${payerMoreButtonHtml}

<button
  class="expense-v2-person-card ${selectedExpensePayer === 'common' ? 'active' : ''}"
              type="button"
              data-expense-payer="common"
            >
              <span class="expense-v2-person-avatar">€</span>
              <span>Fonds commun</span>
            </button>
          </div>
        </section>

        <section class="expense-v2-section">
          <div class="expense-v2-section-heading">
            <span class="expense-v2-kicker">Pour qui ?</span>

            <div class="expense-v2-heading-actions">
              <button
                class="expense-v2-mini-action ${isEditingBudgetPeople ? 'active' : ''}"
                type="button"
                data-action="toggle-budget-people-edition"
                aria-label="Modifier les personnes"
              >
                <span class="material-symbols-outlined" aria-hidden="true">edit</span>
              </button>

              <button
                class="expense-v2-mini-action"
                type="button"
                data-action="add-budget-person"
                aria-label="Ajouter une personne"
              >
                <span class="material-symbols-outlined" aria-hidden="true">person_add</span>
              </button>
            </div>
          </div>

          <div class="expense-v2-person-grid">
            <button
              class="expense-v2-person-card ${selectedExpenseSplit === 'equal' ? 'active' : ''}"
              type="button"
              data-expense-split="equal"
            >
              <span class="expense-v2-person-avatar">=</span>
              <span>Équitable</span>
            </button>

            ${splitPeopleHtml}
${splitMoreButtonHtml}
          </div>
        </section>

        <section class="expense-v2-fields">
          <label>
            <span class="material-symbols-outlined" aria-hidden="true">calendar_today</span>
            <input
              id="expense-date"
              type="text"
              value="Aujourd'hui, 14 oct."
              placeholder="Date"
            >
          </label>

          <label>
            <span class="material-symbols-outlined" aria-hidden="true">notes</span>
            <textarea
              id="expense-note"
              rows="2"
              placeholder="Ajouter une note... (ex: Dîner au Chateaubriand)"
            >${escapeHtml(editingNote)}</textarea>
          </label>
        </section>
      </main>

      <div class="expense-v2-bottom">
        <button class="expense-v2-primary" type="button" data-action="save-expense">
          <span class="material-symbols-outlined" aria-hidden="true">
            ${editingItem ? 'check_circle' : 'add_circle'}
          </span>
          <span>${editingItem ? 'Enregistrer les modifications' : 'Ajouter la dépense'}</span>
        </button>
      </div>

      ${typeof renderExpenseModal === 'function' ? renderExpenseModal() : ''}
    </div>
  `;
}

function getBudgetCategoryTone(index) {
  return ['primary', 'tertiary', 'accent', 'neutral'][index % 4];
}

function getBudgetCategoryBreakdown() {
  const items = getCurrentBudgetItems();
  const categories = getExpenseCategories();
  const total = getCurrentBudgetTotal();
  const normalize = value => String(value || '').toLowerCase().trim();
  const byCategory = new Map();

  items.forEach(item => {
    const rawCategory = item.cat || item.title || 'Autres';
    const category = categories.find(cat =>
      normalize(cat.id) === normalize(rawCategory) ||
      normalize(cat.label) === normalize(rawCategory)
    );

    const key = category?.id || normalize(rawCategory) || 'other';

    if (!byCategory.has(key)) {
      byCategory.set(key, {
        label: category?.label || rawCategory,
        icon: category?.icon || getBudgetCategoryIcon(rawCategory),
        amount: 0
      });
    }

    byCategory.get(key).amount += Number(item.amount) || 0;
  });

  return Array.from(byCategory.values())
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((item, index) => ({
      ...item,
      tone: getBudgetCategoryTone(index),
      percent: total ? Math.round((item.amount / total) * 100) : 0
    }));
}

function getBudgetPeopleBalanceData() {
  const people = getBudgetPeople();
  const items = getCurrentBudgetItems();
  const balances = people.map(person => ({
    ...person,
    paid: 0,
    owed: 0,
    balance: 0
  }));

  items.forEach(item => {
    const amount = Number(item.amount) || 0;
    if (!amount) return;

    const payer = balances.find(person =>
      String(person.name || '').toLowerCase() === String(item.payer || '').toLowerCase() ||
      String(person.id || '') === String(item.payer || '')
    );

    if (payer) {
      payer.paid += amount;
    }

    const targets = Array.isArray(item.forParticipants) ? item.forParticipants : ['__all__'];
    const splitPeople = targets.includes('__all__')
      ? balances
      : balances.filter(person =>
          targets.includes(person.id) ||
          targets.includes(person.name)
        );

    const finalSplitPeople = splitPeople.length ? splitPeople : balances;
    const share = finalSplitPeople.length ? amount / finalSplitPeople.length : 0;

    finalSplitPeople.forEach(person => {
      person.owed += share;
    });
  });

  return balances.map(person => ({
    ...person,
    balance: person.paid - person.owed
  }));
}

function renderBudgetOverview() {
  const total = getCurrentBudgetTotal();
  const formattedTotal = formatEuroAmount(total);
  const breakdown = getBudgetCategoryBreakdown();
  const donutClasses = ['primary', 'tertiary', 'accent'];
  let donutOffset = 0;

  const donutSegments = breakdown.slice(0, 3).map((category, index) => {
    const dash = Math.max(0, Math.min(100, category.percent));
    const segment = `
      <circle
        class="donut-segment ${donutClasses[index] || 'primary'}"
        cx="18"
        cy="18"
        r="15.9155"
        style="stroke-dasharray:${dash} 100; stroke-dashoffset:-${donutOffset};"
      ></circle>
    `;

    donutOffset += dash;
    return segment;
  }).join('');

  const mainCategory = breakdown[0];

  app.innerHTML = `
    <div class="mobile-shell">
      ${topbar()}

      <main class="budget-overview-main">
        ${budgetTabs('overview')}

        <section class="budget-overview-card">
          <div class="budget-pattern" aria-hidden="true"></div>

          <div class="budget-overview-content">
            <span class="kicker">Budget total</span>
            <h2>${formattedTotal}</h2>

            <div class="donut-wrap">
              <svg class="donut" viewBox="0 0 36 36" aria-hidden="true">
                <circle class="donut-ring" cx="18" cy="18" r="15.9155"></circle>
                ${donutSegments}
              </svg>

              <div class="donut-center">
                <span>${mainCategory ? mainCategory.label : 'Reste'}</span>
                <strong>${mainCategory ? formatEuroAmount(mainCategory.amount) : formattedTotal}</strong>
              </div>
            </div>
          </div>
        </section>

        <section class="budget-repartition">
          <h3>Répartition</h3>

          <div class="budget-category-list">
            ${breakdown.length ? breakdown.map(category => `
              <article class="budget-category-card">
                <span class="budget-category-icon ${category.tone}">
                  <span class="material-symbols-outlined" aria-hidden="true">${category.icon}</span>
                </span>

                <div>
                  <h4>${escapeHtml(category.label)}</h4>
                  <p>${category.percent}% du budget</p>
                </div>

                <strong>${formatEuroAmount(category.amount)}</strong>
              </article>
            `).join('') : `
              <article class="budget-category-card">
                <span class="budget-category-icon neutral">
                  <span class="material-symbols-outlined" aria-hidden="true">receipt_long</span>
                </span>

                <div>
                  <h4>Aucune dépense</h4>
                  <p>Ajoutez une dépense pour commencer</p>
                </div>

                <strong>0,00 €</strong>
              </article>
            `}
          </div>
        </section>
      </main>

      ${bottomNav('budget')}
    </div>
  `;
}

function renderBudgetBalance() {
  const peopleBalances = getBudgetPeopleBalanceData();
  const breakdown = getBudgetCategoryBreakdown().slice(0, 3);
  const debtors = peopleBalances.filter(person => person.balance < -0.01).sort((a, b) => a.balance - b.balance);
  const creditors = peopleBalances.filter(person => person.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const debtor = debtors[0];
  const creditor = creditors[0];
  const settlementAmount = debtor && creditor ? Math.min(Math.abs(debtor.balance), creditor.balance) : 0;

  app.innerHTML = `
    <div class="mobile-shell">
      ${topbar()}

      <main class="budget-balance-main">
        ${budgetTabs('balance')}

        <section class="balance-section">
          <div class="balance-list">
            ${peopleBalances.map(person => {
              const isPositive = person.balance >= 0;
              const amount = Math.abs(person.balance);

              return `
                <article class="balance-card balance-card-detail">
                  <div class="balance-card-head">
                    <div class="balance-person">
                      <span class="balance-avatar">${getInitial(person.name)}</span>

                      <div>
                        <h3>${escapeHtml(person.name)}</h3>
                        <p>Payé : ${formatEuroAmount(person.paid)}</p>
                      </div>
                    </div>

                    <strong class="balance-amount ${isPositive ? 'positive' : 'negative'}">
                      ${isPositive ? 'Reçoit' : 'Doit'} ${formatEuroAmount(amount)}
                    </strong>
                  </div>

                  <div class="balance-mini-lines">
                    ${breakdown.length ? breakdown.map(category => `
                      <div class="balance-mini-line">
                        <span class="material-symbols-outlined" aria-hidden="true">${category.icon}</span>
                        <div><i style="width:${category.percent}%"></i></div>
                        <small>${category.percent}%</small>
                      </div>
                    `).join('') : `
                      <div class="balance-mini-line">
                        <span class="material-symbols-outlined" aria-hidden="true">receipt_long</span>
                        <div><i style="width:0%"></i></div>
                        <small>0%</small>
                      </div>
                    `}
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </section>

        <section class="settlement-section">
          <h2>Détails des remboursements</h2>

                    ${settlementAmount > 0 ? `
            <article class="settlement-card settlement-card-list">
              <div class="settlement-lines">
                <div class="settlement-line">
                  <div>
                    <strong>${escapeHtml(debtor.name)} rembourse ${escapeHtml(creditor.name)}</strong>
                    <span>Payé par ${escapeHtml(creditor.name)}</span>
                  </div>
                  <span>+${formatEuroAmount(settlementAmount)}</span>
                </div>
              </div>

              <button class="settlement-button" type="button" data-action="settlement-settled">
                <span class="material-symbols-outlined" aria-hidden="true">payments</span>
                <span>Solder la dette</span>
              </button>
            </article>
          ` : `
            <article class="settlement-card settlement-card-list">
              <p class="companion-empty">Tout est équilibré pour le moment.</p>
            </article>
          `}

      ${bottomNav('budget')}
    </div>
  `;
}

async function renderDocs() {
  await refreshMobileDocuments();

  const categories = getDocCategories();
  const totalFiles = categories.reduce((sum, category) => sum + category.files.length, 0);

  app.innerHTML = `
    <div class="mobile-shell">
      ${topbar()}

      <main class="docs-main-v2">
        <div class="docs-header">
          <span class="kicker">Coffre-fort numérique</span>
          <h2 class="docs-title">Documents de Voyage</h2>
          <p class="docs-subtitle">${escapeHtml(activeTrip?.name || 'Aucun voyage sélectionné')} · ${totalFiles} document${totalFiles > 1 ? 's' : ''}</p>
        </div>

        <div class="docs-security-banner">
          <span class="material-symbols-outlined filled">verified_user</span>
          <div>
            <strong>Stockage synchronisé</strong>
            <p>Documents stockés dans Supabase et accessibles avec votre compte.</p>
          </div>
        </div>

        <div class="docs-actions">
          <button class="docs-action-primary" type="button" data-action="doc-upload">
            <span class="material-symbols-outlined">upload_file</span>
            <span>Ajouter</span>
          </button>
          <button class="docs-action-secondary" type="button" data-action="doc-scanner">
            <span class="material-symbols-outlined">photo_camera</span>
            <span>Scanner</span>
          </button>
          <input id="doc-file-input" type="file" multiple accept="image/*,.pdf" hidden>
        </div>

        <div class="docs-grid">
          ${categories.map(cat => `
            <div class="docs-category-card">
              <div class="docs-category-header">
                <div class="docs-category-icon ${cat.tone}">
                  <span class="material-symbols-outlined">${cat.icon}</span>
                </div>
                <h3>${escapeHtml(cat.label)}</h3>
                <span class="docs-file-count">${cat.files.length} fichier${cat.files.length > 1 ? 's' : ''}</span>
              </div>

              <div class="docs-file-list">
                ${cat.files.length ? cat.files.map(file => `
                  <button class="docs-file-row" type="button" data-action="doc-detail" data-doc-id="${file.id}">
                    <span class="material-symbols-outlined docs-file-type-icon ${file.type === 'pdf' ? 'pdf' : 'img'}">${file.type === 'pdf' ? 'picture_as_pdf' : file.type === 'image' ? 'image' : 'description'}</span>
                    <div class="docs-file-info">
                      <span class="docs-file-name">${escapeHtml(file.name)}</span>
                      <span class="docs-file-meta">Ajouté le ${escapeHtml(file.date)} · ${formatDocSize(file.size)}</span>
                    </div>
                    <span class="material-symbols-outlined docs-file-more">chevron_right</span>
                  </button>
                `).join('') : `
                  <div class="docs-empty">
                    <p>Aucun document dans cette catégorie.</p>
                  </div>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      </main>

      ${bottomNav('docs')}
    </div>
  `;
}

function renderDocScanner() {
  app.innerHTML = `
    <div class="mobile-shell scanner-shell">
      <header class="scanner-topbar">
        <button class="scanner-btn" type="button" data-action="docs" aria-label="Annuler">
          <span class="material-symbols-outlined">close</span>
        </button>
        <h1 class="topbar-title">L'Atelier</h1>
        <button class="scanner-btn" type="button" aria-label="Aide">
          <span class="material-symbols-outlined">help_outline</span>
        </button>
      </header>

      <main class="scanner-viewport">
        <div class="scanner-bg"></div>
        <div class="scanner-mask"></div>
        <div class="scanner-frame">
          <span class="corner tl"></span>
          <span class="corner tr"></span>
          <span class="corner bl"></span>
          <span class="corner br"></span>
          <div class="scanner-detected">
            <span>DOCUMENT DÉTECTÉ</span>
          </div>
        </div>

        <div class="scanner-controls">
          <div class="scanner-options">
            <button type="button"><span class="material-symbols-outlined filled">flash_auto</span><span>Auto</span></button>
            <button type="button" class="active"><span class="material-symbols-outlined filled">auto_awesome</span><span>Auto-Bords</span></button>
            <button type="button"><span class="material-symbols-outlined">description</span><span>Type</span></button>
          </div>

          <div class="scanner-capture-row">
            <button class="scanner-gallery" type="button">
              <span class="material-symbols-outlined">photo_library</span>
            </button>
            <button class="scanner-shutter" type="button" aria-label="Capturer">
              <span class="shutter-ring"></span>
            </button>
            <button class="scanner-done" type="button" data-action="docs">
              <span class="material-symbols-outlined">check</span>
            </button>
          </div>

          <p class="scanner-hint">Maintenez l'appareil stable au-dessus du document.</p>
        </div>
      </main>
    </div>
  `;
}

async function renderDocDetail() {
  const documentItem = getDocumentById(activeDocId);

  if (!documentItem) {
    navigate('docs');
    return;
  }

  const isImage = documentItem.mime?.includes('image') || documentItem.type === 'image';
  const isPdf = documentItem.mime?.includes('pdf') || documentItem.type === 'pdf';

  let documentUrl = '';
  try {
    documentUrl = await window.SB.getDocumentUrl(documentItem.filePath);
  } catch (error) {
    alert('Impossible d’ouvrir le document : ' + (error.message || error));
    navigate('docs');
    return;
  }

  app.innerHTML = `
    <div class="mobile-shell doc-detail-shell">
      <header class="doc-detail-topbar">
        <button type="button" data-action="docs" aria-label="Retour">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>

        <div class="doc-detail-title">
          <strong>${escapeHtml(documentItem.name)}</strong>
          <span>${formatDocSize(documentItem.size)} · ${(documentItem.mime || documentItem.type || 'FICHIER').toUpperCase()}</span>
        </div>

        <button type="button" data-action="delete-doc" data-doc-id="${documentItem.id}" aria-label="Supprimer">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </header>

      <main class="doc-detail-viewer">
        ${isImage ? `
          <img class="doc-preview-image" src="${documentUrl}" alt="${escapeHtml(documentItem.name)}">
        ` : isPdf ? `
          <iframe class="doc-preview-frame" src="${documentUrl}" title="${escapeHtml(documentItem.name)}"></iframe>
        ` : `
          <div class="docs-empty">
            <div class="docs-empty-icon">
              <span class="material-symbols-outlined">description</span>
            </div>
            <h2>Aperçu indisponible</h2>
            <p>Ce type de fichier peut être téléchargé, mais pas prévisualisé ici.</p>
          </div>
        `}

        <div class="doc-page-indicator">${escapeHtml(documentItem.name)}</div>
      </main>

      <footer class="doc-detail-actions">
        <a class="primary-doc-action" href="${documentUrl}" download="${escapeHtml(documentItem.name)}">
          <span class="material-symbols-outlined">download</span>
          <span>Télécharger</span>
        </a>

        <button type="button" class="danger" data-action="delete-doc" data-doc-id="${documentItem.id}">
          <span class="material-symbols-outlined">delete</span>
          <span>Supprimer</span>
        </button>
      </footer>
    </div>
  `;
}

function handleEditExpense(groupIndex, itemIndex) {
  const item = expenses[groupIndex]?.items[itemIndex];
  if (!item) return;

  editingExpenseDraft = {
    source: 'local',
    groupIndex,
    itemIndex,
    title: item.title,
    note: item.note || '',
    amount: item.amount.replace(/[^0-9,.]/g, '').replace(',', '.'),
    payer: item.payer || 'Moi',
    cat: item.cat || selectedExpenseCategory
  };

  editingExpenseGroupIndex = groupIndex;
  editingExpenseItemIndex = itemIndex;

  navigate('new-expense');
}

function handleDeleteExpense(groupIndex, itemIndex) {
  const item = expenses[groupIndex]?.items[itemIndex];
  if (!item) return;

  const ok = confirm(`Supprimer "${item.title}" ?`);
  if (!ok) return;

  expenses[groupIndex].items.splice(itemIndex, 1);
  renderBudget();
}

function getBudgetExpenseFromButton(button) {
  const expenseId = button.dataset.expenseId || '';
  const groupIndex = Number(button.dataset.groupIndex);
  const itemIndex = Number(button.dataset.itemIndex);

  if (expenseId && activeTrip?.budget?.length) {
    const item = activeTrip.budget.find(function(expense) {
      return String(expense.id) === String(expenseId);
    });

    if (!item) return null;

    return {
      source: 'supabase',
      id: item.id,
      title: item.desc || item.cat || 'Dépense',
      note: '',
      amount: Number(item.amount) || 0,
      payer: item.paidBy || 'Moi',
      cat: item.cat || 'Divers',
      raw: item
    };
  }

  const localItem = expenses[groupIndex]?.items[itemIndex];
  if (!localItem) return null;

  return {
    source: 'local',
    groupIndex,
    itemIndex,
    id: null,
    title: localItem.title || 'Dépense',
    note: localItem.note || '',
    amount: parseEuroAmount(localItem.amount),
    payer: localItem.payer || 'Moi',
    cat: localItem.title || 'Divers',
    raw: localItem
  };
}

function handleEditBudgetExpense(button) {
  const expense = getBudgetExpenseFromButton(button);
  if (!expense) return;

  editingExpenseDraft = expense;

  editingExpenseGroupIndex = expense.source === 'local' ? expense.groupIndex : null;
  editingExpenseItemIndex = expense.source === 'local' ? expense.itemIndex : null;

  const categories = getExpenseCategories();
  const matchedCategory = categories.find(function(category) {
    return category.label === expense.cat || category.label === expense.title;
  });

  selectedExpenseCategory = matchedCategory?.id || 'other';

  const people = getBudgetPeople();
  const matchedPayer = people.find(function(person) {
    return person.name === expense.payer;
  });

  selectedExpensePayer = matchedPayer?.id || 'me';
  selectedExpenseSplit = 'equal';

  navigate('new-expense');
}

async function handleDeleteBudgetExpense(button) {
  const expense = getBudgetExpenseFromButton(button);
  if (!expense) return;

  const confirmed = confirm(`Supprimer "${expense.title}" ?`);
  if (!confirmed) return;

  if (expense.source === 'supabase' && window.SB?.deleteBudgetItem) {
    try {
      await window.SB.deleteBudgetItem(expense.id);
      await refreshMobileTrips(activeTrip.id);
      renderBudget();
      return;
    } catch (error) {
      alert('Erreur suppression dépense : ' + (error.message || error));
      return;
    }
  }

  expenses[expense.groupIndex].items.splice(expense.itemIndex, 1);
  renderBudget();
}

async function handleSaveExpense() {
  const amountInput = document.querySelector('#expense-amount');
  const titleInput = document.querySelector('#expense-title');
  const noteInput = document.querySelector('#expense-note');

  const title = titleInput?.value.trim() || '';
  const note = noteInput?.value.trim() || '';
  const amount = parseEuroAmount(amountInput?.value || '0');

  const people = typeof getBudgetPeople === 'function' ? getBudgetPeople() : [];
  const selectedPayer = people.find(person => person.id === selectedExpensePayer);

  const categories = getExpenseCategories();
const activeCategory = categories.find(function(category) {
  return category.id === selectedExpenseCategory;
}) || categories[0];

  const payer = selectedExpensePayer === 'common'
    ? 'Fonds commun'
    : selectedPayer?.name || 'Moi';

  if (!amount) {
    alert('Ajoute un montant avant d’enregistrer.');
    return;
  }

  if (activeTrip?.id && window.SB?.saveBudgetItem) {
    try {
      await window.SB.saveBudgetItem(activeTrip.id, {
  id: editingExpenseDraft?.source === 'supabase' ? editingExpenseDraft.id : null,
  cat: activeCategory.label,
  desc: title || note || activeCategory.label,
  amount,
  paidBy: payer,
  forParticipants: selectedExpenseSplit === 'equal'
    ? ['__all__']
    : [selectedExpenseSplit]
});

      await refreshMobileTrips(activeTrip.id);

      editingExpenseGroupIndex = null;
      editingExpenseItemIndex = null;

      navigate('budget');
      return;
    } catch (error) {
      alert('Erreur sauvegarde dépense : ' + (error.message || error));
      return;
    }
  }

  const expenseData = {
    title: title || note || activeCategory.label,
    note,
    payer,
    amount: `- ${formatEuroAmount(amount)}`,
    icon: activeCategory.emoji || 'receipt',
    tone: activeCategory.tone || 'primary'
  };

  if (editingExpenseDraft?.source === 'local' && editingExpenseDraft.groupIndex !== null && editingExpenseDraft.itemIndex !== null) {
  expenses[editingExpenseDraft.groupIndex].items[editingExpenseDraft.itemIndex] = expenseData;
  editingExpenseDraft = null;
  editingExpenseGroupIndex = null;
  editingExpenseItemIndex = null;
} else if (editingExpenseGroupIndex !== null && editingExpenseItemIndex !== null) {
  expenses[editingExpenseGroupIndex].items[editingExpenseItemIndex] = expenseData;
  editingExpenseDraft = null;
  editingExpenseGroupIndex = null;
  editingExpenseItemIndex = null;
} else {
  expenses[0].items.unshift(expenseData);
}

  navigate('budget');
}

async function handleLogin() {
  const email = document.querySelector('#auth-email')?.value.trim();
  const password = document.querySelector('#auth-password')?.value;

  if (!email || !password) {
    alert('Email et mot de passe requis.');
    return;
  }

  try {
    await window.SB.signIn(email, password);
    mobileUser = await window.SB.getUser();
    const acceptedInvite = await acceptPendingMobileInvite();

    if (!acceptedInvite) {
      await refreshMobileTrips();
      navigate('account');
    }
  } catch (error) {
    alert('Erreur connexion : ' + (error.message || error));
  }
}

async function handleLogout() {
  await window.SB.signOut();
  mobileUser = null;
  mobileTrips = [];
  activeTrip = null;
  navigate('home');
}

function handleAddFriend() {
  const input = document.querySelector('#companion-name');
  const name = input?.value.trim();
  if (!name) return;

  const draft = getCreateTripFormData();
  if (!draft.companions.includes(name)) draft.companions.push(name);
  saveTripDraft(draft);
    renderCreateTrip();
  initCreateTripControls();
}

async function handleCreateBoard() {
  const draft = getCreateTripFormData();
  saveTripDraft(draft);

  if (!window.SB || !mobileUser) {
    alert("Connectez-vous d'abord.");
    navigate('auth');
    return;
  }

  try {
    const trip = await window.SB.createTrip({
      name: draft.destination || 'Nouveau voyage',
      startDate: draft.startDate || null,
      days: getTripDurationDays(draft.startDate, draft.endDate)
    });

    await refreshMobileTrips(trip.id);

    navigate('itinerary');
  } catch (error) {
    alert('Erreur création voyage : ' + (error.message || error));
  }
}

async function handleOpenTrip(tripId) {
  if (!tripId || !window.SB) return;

  activeTrip = await window.SB.loadTrip(tripId);
  navigate('itinerary');
}

async function handleRenameTrip(tripId = activeTrip?.id) {
  if (!tripId) return;

  const trip = mobileTrips.find(item => item.id === tripId) || activeTrip;
  const name = prompt('Nouveau nom du voyage :', trip?.name || '');
  if (!name || !name.trim()) return;

  await window.SB.updateTrip(tripId, { name: name.trim() });
  await refreshMobileTrips(tripId);
  renderHome();
}

async function handleDeleteTrip(tripId = activeTrip?.id) {
  if (!tripId) return;

  const trip = mobileTrips.find(item => item.id === tripId) || activeTrip;
  const ok = confirm(`Supprimer "${trip?.name || 'ce voyage'}" ?`);
  if (!ok) return;

  await window.SB.deleteTrip(tripId);

  if (activeTrip?.id === tripId) activeTrip = null;

  await refreshMobileTrips();
  renderHome();
}

function handleEditStep(stepIndex) {
  const steps = getCurrentTimelineSteps();
  const step = steps[stepIndex];
  if (!step) return;

  editingStepDraft = {
    ...step,
    stepIndex: step.stepIndex ?? stepIndex,
    dayIndex: step.dayIndex ?? 0
  };

  selectedStepCategory = step.type || step.typeKey || 'transport';
  navigate('new-step');
}

function handleDeleteStep(stepIndex) {
  const step = itinerarySteps[stepIndex];
  if (!step) return;

  openStepDeleteModal(stepIndex, step);
}

function openStepDeleteModal(stepIndex, step) {
  document.querySelector('.step-delete-backdrop')?.remove();

  const modal = document.createElement('div');
  modal.className = 'step-delete-backdrop';
  modal.innerHTML = `
    <article class="step-delete-modal" role="dialog" aria-modal="true" aria-labelledby="step-delete-title">
      <button class="step-delete-close" type="button" data-action="step-delete-cancel" aria-label="Fermer">
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>

      <span class="step-delete-kicker">Suppression</span>
      <h2 id="step-delete-title">Supprimer cette étape ?</h2>
      <p>
        “${escapeHtml(step.title || 'Cette étape')}” sera retirée de votre itinéraire.
      </p>

      <div class="step-delete-actions">
        <button class="secondary" type="button" data-action="step-delete-cancel">Annuler</button>
        <button class="danger" type="button" data-action="step-delete-confirm" data-step-index="${stepIndex}">
          Supprimer
        </button>
      </div>
    </article>
  `;

  document.body.appendChild(modal);
}

async function handleAddStepToProgram() {
  const data = getNewStepFormData();
  const config = stepFieldSets[selectedStepCategory] || stepFieldSets.transport;

  let title = data.title?.trim() || config.fallbackTitle;
  let descriptionParts = [data.location?.trim(), data.duration?.trim(), data.notes?.trim()].filter(Boolean);

    if (selectedStepCategory === 'lodging') {
    title = data.title?.trim() || 'Nouveau logement';

    descriptionParts = [
      data.location?.trim(),
      data.timeCheckIn ? `Check-in ${data.timeCheckIn}` : '',
      data.timeCheckOut ? `Check-out ${data.timeCheckOut}` : '',
      data.duration ? `${data.duration} nuit${Number(data.duration) > 1 ? 's' : ''}` : '',
      data.reference?.trim() ? `Réf. ${data.reference.trim()}` : '',
      data.notes?.trim()
    ].filter(Boolean);
  }

  if (selectedStepCategory === 'transport') {
    const mode = transportModeLabels[data.mode] || 'Transport';
    const departure = data.departure?.trim();
    const arrival = data.arrival?.trim();
    const stopovers = data.stopovers || [];

    title = departure || arrival
      ? `${mode} ${departure || 'Départ'} → ${arrival || 'Arrivée'}`
      : mode;

    descriptionParts = [
      data.arrivalTime ? `Arrivée ${data.arrivalTime}${data.nextDay ? ' +1 jour' : ''}` : '',
      stopovers.length ? `Escales : ${stopovers.map(stopover => stopover.place).join(' → ')}` : '',
      data.reference?.trim() ? `Réf. ${data.reference.trim()}` : '',
      data.notes?.trim()
    ].filter(Boolean);
  }

  const localStep = {
    time: data.time || config.defaultTime || '09:00',
    type: config.type,
    title,
    description: descriptionParts.join(' • ') || config.fallbackDescription,
    icon: config.timelineIcon,
    tone: selectedStepCategory === 'restaurant' ? 'accent' : 'petrol'
  };

    const activeDay = mapStepDraft?.source === 'map'
    ? activeTrip?.days?.[mapStepDraft.dayIndex] || getActiveTripDayForNewStep()
    : getActiveTripDayForNewStep();

  if (activeTrip?.id && activeDay?.id && window.SB?.saveStep) {
    try {
            const stepIndex = editingStepDraft
        ? editingStepDraft.stepIndex || 0
        : activeDay.steps?.length || 0;

      await window.SB.saveStep(activeTrip.id, activeDay.id, {
        id: editingStepDraft?.id || null,
        stepIndex,
        type: selectedStepCategory,
        label: title,
        lieu: data.location?.trim() || '',
        time: data.time || config.defaultTime || '09:00',
                timeEnd: selectedStepCategory === 'lodging'
          ? data.timeCheckOut || ''
          : data.arrivalTime || '',
        transportType: data.mode || '',
        depart: data.departure?.trim() || '',
        arrivee: data.arrival?.trim() || '',
        duree: data.duration?.trim() || '',
        nextDay: data.nextDay === 'yes',
        escales: selectedStepCategory === 'transport' ? (data.stopovers || []) : [],
        ref: data.reference?.trim() || '',
        note: data.notes?.trim() || '',
                timeCheckIn: data.timeCheckIn || '',
        timeCheckOut: data.timeCheckOut || '',
        amount: 0,
        paidBy: '',
        lat: data.locationLat || data.arrivalLat || data.departureLat || null,
        lng: data.locationLng || data.arrivalLng || data.departureLng || null,
        lat: data.locationLat || data.arrivalLat || data.departureLat || null,
        lng: data.locationLng || data.arrivalLng || data.departureLng || null
      });

      await refreshMobileTrips(activeTrip.id);

            selectedStepCategory = 'transport';
      editingStepDraft = null;
      mapStepDraft = null;
      navigate('itinerary');
      return;
    } catch (error) {
      alert('Erreur sauvegarde étape : ' + (error.message || error));
      return;
    }
  }

    if (editingStepDraft && Number.isFinite(editingStepDraft.stepIndex)) {
    itinerarySteps[editingStepDraft.stepIndex] = localStep;
  } else {
    itinerarySteps.push(localStep);
  }

    selectedStepCategory = 'transport';
  editingStepDraft = null;
  mapStepDraft = null;
  navigate('itinerary');
}

function navigate(route) {
    if (route === 'invite') {
    window.location.hash = 'invite';
    renderInvite();
  } else
  if (route === 'auth') {
    window.location.hash = 'auth';
    renderAuth();
  } else if (route === 'account') {
    window.location.hash = 'account';
    renderAccount();
  } else if (route === 'create-trip') {
    window.location.hash = 'create-trip';
    renderCreateTrip();
  } else if (route === 'budget-overview') {
    window.location.hash = 'budget-overview';
    renderBudgetOverview();
  } else if (route === 'budget') {
    window.location.hash = 'budget';
    renderBudget();
    } else if (route === 'budget-balance') {
    window.location.hash = 'budget-balance';
    renderBudgetBalance();
  } else if (route === 'new-expense') {
    window.location.hash = 'new-expense';
    renderNewExpense();
  } else if (route === 'itinerary') {
    window.location.hash = 'itinerary';
    renderItinerary();
  } else if (route === 'new-step') {
    window.location.hash = 'new-step';
    renderNewStep();
    initAutocompleteOnPage();
  } else if (route === 'activity-detail') {
    window.location.hash = 'activity-detail';
    renderActivityDetail();
  } else if (route === 'map') {
    window.location.hash = 'map';
    renderMap();
  } else if (route === 'docs') {
    window.location.hash = 'docs';
    renderDocs();
  } else if (route === 'doc-scanner') {
    window.location.hash = 'doc-scanner';
    renderDocScanner();
  } else if (route === 'doc-detail') {
    window.location.hash = 'doc-detail';
    renderDocDetail();
  } else {
    window.location.hash = '';
    renderHome();
  }
}

window.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;

    if (action === 'doc-detail') {
    activeDocId = event.target.closest('[data-doc-id]')?.dataset.docId || null;
    navigate('doc-detail');
    return;
  }

    if (action === 'doc-upload') {
    document.querySelector('#doc-file-input')?.click();
    return;
  }

  if (action === 'delete-doc') {
    const docId = event.target.closest('[data-doc-id]')?.dataset.docId;
    if (docId) handleDeleteDocument(docId);
    return;
  }

    if (action === 'accept-invite') {
    acceptPendingMobileInvite();
    return;
  }

    if (action === 'account') {
    navigate(mobileUser ? 'account' : 'auth');
    return;
  }

  if (action === 'login') {
    handleLogin();
    return;
  }

  if (action === 'logout') {
    handleLogout();
    return;
  }

  if (action === 'save-profile') {
    handleUpdateMobileProfile();
    return;
  }

  if (action === 'toggle-theme') {
    toggleMobileTheme();
    return;
  }

  if (action === 'add-friend') {
    handleAddFriend();
    return;
  }

  if (action === 'create-board') {
    handleCreateBoard();
    return;
  }

  if (action === 'toggle-all-trips') {
  showAllTrips = !showAllTrips;
  renderHome();
  return;
}

  if (action === 'open-trip') {
  const tripId = event.target.closest('[data-trip-id]')?.dataset.tripId;
  handleOpenTrip(tripId);
  return;
}

if (action === 'rename-trip') {
  const tripId = event.target.closest('[data-trip-id]')?.dataset.tripId;
  handleRenameTrip(tripId);
  return;
}

if (action === 'delete-trip') {
  const tripId = event.target.closest('[data-trip-id]')?.dataset.tripId;
  handleDeleteTrip(tripId);
  return;
}

  if (action === 'add-transport-stopover') {
    addTransportStopoverField();
    return;
  }

  if (action === 'remove-transport-stopover') {
    event.target.closest('[data-stopover-row]')?.remove();
    return;
  }

  if (action === 'add-step-to-program') {
    handleAddStepToProgram();
    return;
  }

  if (action === 'close-expense-modal') {
  closeExpenseModal();
  return;
  }

  if (action === 'confirm-expense-modal') {
  confirmExpenseModal();
  return;
}

if (action === 'edit-budget-expense') {
  const button = event.target.closest('[data-action="edit-budget-expense"]');
  if (button) handleEditBudgetExpense(button);
  return;
}

if (action === 'delete-budget-expense') {
  const button = event.target.closest('[data-action="delete-budget-expense"]');
  if (button) handleDeleteBudgetExpense(button);
  return;
}

if (action === 'edit-budget-person') {
  const personId = event.target.closest('[data-person-id]')?.dataset.personId;
  if (personId) handleEditBudgetPerson(personId);
  return;
}

if (action === 'delete-budget-person') {
  const personId = event.target.closest('[data-person-id]')?.dataset.personId;
  if (personId) handleDeleteBudgetPerson(personId);
  return;
}

if (action === 'budget-overview') {
  window.location.hash = 'budget-overview';
  renderBudgetOverview();
  return;
}

if (action === 'budget') {
  window.location.hash = 'budget';
  renderBudget();
  return;
}

if (action === 'budget-balance') {
  window.location.hash = 'budget-balance';
  renderBudgetBalance();
  return;
}

  if (action === 'new-expense') {
  editingExpenseDraft = null;
  editingExpenseGroupIndex = null;
  editingExpenseItemIndex = null;
  selectedExpenseCategory = 'meal';
  selectedExpensePayer = 'me';
  selectedExpenseSplit = 'equal';
  window.location.hash = 'new-expense';
  renderNewExpense();
  return;
}

    if (action === 'save-expense') {
    handleSaveExpense();
    return;
  }

  if (action === 'toggle-budget-people-edition') {
  toggleBudgetPeopleEdition();
  return;
}
  if (action === 'add-budget-person') {
  handleAddBudgetPerson();
  return;
}

if (action === 'toggle-expense-payers') {
  showAllExpensePayers = !showAllExpensePayers;
  renderNewExpense();
  return;
}

if (action === 'toggle-expense-splits') {
  showAllExpenseSplits = !showAllExpenseSplits;
  renderNewExpense();
  return;
}

if (action === 'add-expense-category') {
  handleAddExpenseCategory();
  return;
}

if (action === 'toggle-expense-category-edition') {
  toggleExpenseCategoryEdition();
  return;
}

if (action === 'delete-expense-category') {
  const categoryId = event.target.closest('[data-category-id]')?.dataset.categoryId;
  if (categoryId) handleDeleteExpenseCategory(categoryId);
  return;
}

  if (action === 'edit-expense') {
  const button = event.target.closest('[data-group-index][data-item-index]');
  handleEditExpense(Number(button.dataset.groupIndex), Number(button.dataset.itemIndex));
  return;
}

if (action === 'delete-expense') {
  const button = event.target.closest('[data-group-index][data-item-index]');
  handleDeleteExpense(Number(button.dataset.groupIndex), Number(button.dataset.itemIndex));
  return;
}

if (action === 'edit-step') {
  const stepIndex = Number(event.target.closest('[data-step-index]')?.dataset.stepIndex);
  handleEditStep(stepIndex);
  return;
}

if (action === 'delete-step') {
  const stepIndex = Number(event.target.closest('[data-step-index]')?.dataset.stepIndex);
  handleDeleteStep(stepIndex);
  return;
}

if (action === 'step-delete-cancel') {
  document.querySelector('.step-delete-backdrop')?.remove();
  return;
}

if (action === 'step-delete-confirm') {
  const stepIndex = Number(event.target.closest('[data-step-index]')?.dataset.stepIndex);
  if (!Number.isNaN(stepIndex)) {
    itinerarySteps.splice(stepIndex, 1);
    document.querySelector('.step-delete-backdrop')?.remove();
    renderItinerary();
  }
  return;
}

  if (action === 'add-doc-folder') {
    const name = prompt('Nom du nouveau dossier :');
    if (name && name.trim()) {
      const icon = prompt('Icône Material (ex: directions_car, receipt, luggage) :') || 'folder';
      docCategories.push({
        id: 'custom-' + Date.now(),
        label: name.trim(),
        icon: icon.trim(),
        tone: 'secondary',
        files: []
      });
      renderDocs();
    }
    return;
  }

  if (action === 'settlement-settled') {
    event.target.closest('.settlement-card')?.classList.add('settled');
    const buttonLabel = event.target.closest('button')?.querySelector('span:last-child');
    if (buttonLabel) buttonLabel.textContent = 'Remboursement réglé';
    return;
  }

      if (action === 'toggle-map-summary' || action === 'toggle-map-sheet') {
    mobileMapSheetOpen = !mobileMapSheetOpen;
    refreshMobileMapSheet();
    return;
  }

      if (action === 'map-days-toggle') {
  mobileMapDaysOpen = !mobileMapDaysOpen;
  mobileMapToolsOpen = false;
  mobileMapActionsOpen = false;
  mobileRouteCalculatorOpen = false;

  refreshMobileMapDaysMenu();
  refreshMobileMapToolsMenu();
  refreshMobileMapActionsMenu();
  refreshMobileRouteCalculatorPanel();

  return;
}

   if (action === 'map-actions-toggle') {
    mobileMapActionsOpen = !mobileMapActionsOpen;
    mobileMapToolsOpen = false;
    mobileMapDaysOpen = false;
    mobileRouteCalculatorOpen = false;

    refreshMobileMapActionsMenu();
    refreshMobileMapToolsMenu();
    refreshMobileMapDaysMenu();
    refreshMobileRouteCalculatorPanel();

    return;
  }

    if (action === 'map-route-current-day') {
    setMobileRouteFromCurrentDay();
    return;
  }

  if (action === 'map-route-calculator-toggle') {
    syncMobileRouteInputs();
    mobileRouteCalculatorOpen = !mobileRouteCalculatorOpen;
    mobileMapActionsOpen = false;

    refreshMobileMapActionsMenu();
    refreshMobileRouteCalculatorPanel();

    return;
  }

    if (action === 'map-route-calculator-close') {
    mobileRouteCalculatorOpen = false;
    refreshMobileRouteCalculatorPanel();
    return;
  }

  if (action === 'map-route-mode') {
    const mode = event.target.closest('[data-route-mode]')?.dataset.routeMode;
    if (mode) mobileRouteCalculatorDraft.mode = mode;
    refreshMobileRouteCalculatorPanel();
    return;
  }

    if (action === 'map-route-current-position') {
    setMobileRouteFromCurrentPosition();
    return;
  }

  if (action === 'map-route-swap') {
    syncMobileRouteInputs();

    mobileRouteCalculatorDraft = {
      ...mobileRouteCalculatorDraft,
      from: mobileRouteCalculatorDraft.to,
      fromLat: mobileRouteCalculatorDraft.toLat,
      fromLng: mobileRouteCalculatorDraft.toLng,
      to: mobileRouteCalculatorDraft.from,
      toLat: mobileRouteCalculatorDraft.fromLat,
      toLng: mobileRouteCalculatorDraft.fromLng
    };

    refreshMobileRouteCalculatorPanel();
    maybeAutoCalculateMobileRoute();
    return;
  }

    if (action === 'map-route-expand') {
    mobileRouteCalculatorCompact = false;
    mobileRouteCalculatorOpen = true;
    refreshMobileRouteCalculatorPanel();
    return;
  }

  if (action === 'map-route-dismiss') {
    mobileRouteCalculatorOpen = false;
    mobileRouteCalculatorCompact = false;
    mobileRouteCalculatorResult = null;
    clearMobileRouteCalculatorLayer();
    refreshMobileRouteCalculatorPanel();
    return;
  }

    if (action === 'map-route-reset') {
    resetMobileRouteCalculator();
    return;
  }

    if (action === 'map-route-calculate') {
    calculateMobileRoute({ compactOnSuccess: true });
    return;
  }

  if (action === 'map-clear-route') {
    mobileRouteCalculatorResult = null;
    clearMobileRouteCalculatorLayer();
    refreshMobileRouteCalculatorPanel();
    return;
  }

  if (action === 'map-tools-toggle') {
  mobileMapToolsOpen = !mobileMapToolsOpen;
  mobileMapDaysOpen = false;
  mobileMapActionsOpen = false;
  mobileRouteCalculatorOpen = false;

  refreshMobileMapToolsMenu();
  refreshMobileMapDaysMenu();
  refreshMobileMapActionsMenu();
  refreshMobileRouteCalculatorPanel();

  return;
}

    if (action === 'map-fit') {
  mobileMapToolsOpen = false;
  mobileMapDaysOpen = false;
  fitMobileMapToSteps();
  return;
}

  if (action === 'map-fit-panel') {
    fitMobileMapToPanelDay();
    return;
  }

    if (action === 'map-prev-day') {
    if (mobileMapPanelDayIndex === null) return;

    rememberMobileMapCamera();
    mobileMapPanelDayIndex = Math.max(0, mobileMapPanelDayIndex - 1);
    showAllMobileMapSteps = false;
    renderMap();
    return;
  }

  if (action === 'map-next-day') {
    const maxIndex = (activeTrip?.days?.length || 1) - 1;

    if (mobileMapPanelDayIndex === null) return;

    rememberMobileMapCamera();
    mobileMapPanelDayIndex = Math.min(maxIndex, mobileMapPanelDayIndex + 1);
    showAllMobileMapSteps = false;
    renderMap();
    return;
  }

    if (action === 'map-panel-day') {
    const value = event.target.closest('[data-panel-day]')?.dataset.panelDay;
    const selectedDayIndex = value === 'all' ? null : Number(value);

    rememberMobileMapCamera();

    mobileMapPanelDayIndex = selectedDayIndex;
    mobileMapDaysOpen = false;
    mobileMapToolsOpen = false;
    mobileMapActionsOpen = false;
    mobileRouteCalculatorOpen = false;
    showAllMobileMapSteps = false;

    renderMap();
    refreshMobileMapToolsMenu();
    refreshMobileMapActionsMenu();
    refreshMobileRouteCalculatorPanel();

    setTimeout(() => {
      fitMobileMapToDay(selectedDayIndex, {
        duration: 520,
        maxZoom: selectedDayIndex === null ? 8 : 13
      });
    }, 120);

    return;
  }

  if (action === 'map-zoom-in') {
    mobileMapInstance?.zoomIn();
    return;
  }

  if (action === 'map-zoom-out') {
    mobileMapInstance?.zoomOut();
    return;
  }

    if (action === 'map-retry') {
    renderMap();
    return;
  }

    if (action === 'map-tour') {
     mobileMapToolsOpen = false;   
    toggleMobileMapTour();
    return;
  }

  if (action === 'map-style') {
      mobileMapToolsOpen = false;
    mobileMapStyle = mobileMapStyle === 'plan' ? 'satellite' : 'plan';
    if (mobileMapInstance) {
      mobileMapInstance.setStyle(getMobileMapStyleUrl());
      mobileMapInstance.once('style.load', async () => {
  document.querySelector('.mobile-map-error')?.remove();

  renderMobileMapRoute();
  renderMobileMapMarkers();

        if (getMobileMapSteps().length) {
          fitMobileMapToSteps();
        } else {
          await renderMobileMapDestination();
        }
      });
    }
    return;
  }

  if (action === 'map-geolocate') {
    mobileMapToolsOpen = false;
    if (!navigator.geolocation || !mobileMapInstance) {
      alert('Géolocalisation non disponible.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        mobileMapInstance.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 15,
          duration: 900
        });
      },
      () => alert('Impossible de vous localiser.'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
    return;
  }

    if (action === 'map-locate-step') {
    const index = Number(event.target.closest('[data-unlocated-index]')?.dataset.unlocatedIndex);
    locateMobileMapStep(index);
    return;
  }

    if (action === 'toggle-map-steps') {
    showAllMobileMapSteps = !showAllMobileMapSteps;
    renderMap();
    return;
  }

    if (action === 'map-edit-step') {
          event.preventDefault();
    event.stopPropagation();
    const index = Number(event.target.closest('[data-step-index]')?.dataset.stepIndex);
    const step = getMobileMapSteps()[index];
    if (!step) return;

        editingStepDraft = {
      ...step,
      stepIndex: step.parentStepIndex ?? step.stepIndex,
      dayIndex: step.dayIndex
    };

    selectedStepCategory = step.type || 'activity';
    navigate('new-step');
    return;
  }

  if (action === 'map-focus-step') {
    const index = Number(event.target.closest('[data-step-index]')?.dataset.stepIndex);
    focusMobileMapStep(index);
    return;
  }

    if (action === 'map-set-route-from-focused-step') {
    const step = getMobileMapSteps()[mobileMapFocusedStepIndex];
    setMobileRouteEndpoint('from', step);
    return;
  }

  if (action === 'map-set-route-to-focused-step') {
    const step = getMobileMapSteps()[mobileMapFocusedStepIndex];
    setMobileRouteEndpoint('to', step);
    return;
  }

  if (action === 'map-route-focused-step') {
    if (mobileMapFocusedStepIndex !== null) {
      renderMobileCalculatedRouteToStep(mobileMapFocusedStepIndex);
    }
    return;
  }

    if (action === 'map-show-focused-step') {
    if (mobileMapFocusedStepIndex !== null) {
      focusMobileMapStep(mobileMapFocusedStepIndex);
    }
    return;
  }

  if (action === 'map-edit-focused-step') {
    const step = getMobileMapSteps()[mobileMapFocusedStepIndex];
    if (!step) return;

    editingStepDraft = {
      ...step,
      stepIndex: step.stepIndex,
      dayIndex: step.dayIndex
    };

    selectedStepCategory = step.type || 'activity';
    navigate('new-step');
    return;
  }

  if (action === 'map-clear-focused-step') {
  mobileMapFocusedStepIndex = null;
  document.querySelector('#mobile-map-focused-step-card')?.remove();

  document.querySelectorAll('.mobile-map-marker').forEach(marker => {
    marker.classList.remove('active');
  });

  document.querySelectorAll('.mobile-map-step').forEach(button => {
    button.classList.remove('active');
  });

  return;
}

  if (action === 'map-clear-place') {
    mobileMapSelectedPlace = null;
    mobileMapSelectedPlaceType = 'activity';
    mobileMapLocatingStep = null;
    mobileMapToolsOpen = false;

    if (mobileMapSearchMarker) {
      mobileMapSearchMarker.remove();
      mobileMapSearchMarker = null;
    }

    const card = document.querySelector('#mobile-map-place-card');
    if (card) card.hidden = true;

    return;
  }

    if (action === 'map-place-day') {
    mobileMapSelectedDayIndex = Number(event.target.closest('[data-day-index]')?.dataset.dayIndex || 0);
    renderMobileMapSelectedPlace();
    return;
  }

  if (action === 'map-place-type') {
    mobileMapSelectedPlaceType = event.target.closest('[data-place-type]')?.dataset.placeType || 'activity';
    renderMobileMapSelectedPlace();
    return;
  }

  if (action === 'map-show-place') {
    if (mobileMapSelectedPlace?.center && mobileMapInstance) {
      mobileMapInstance.flyTo({
        center: mobileMapSelectedPlace.center,
        zoom: 15,
        duration: 900
      });
    }

    return;
  }

    if (action === 'map-set-route-from-place') {
    setMobileRouteEndpointFromPlace('from', mobileMapSelectedPlace);
    return;
  }

  if (action === 'map-set-route-to-place') {
    setMobileRouteEndpointFromPlace('to', mobileMapSelectedPlace);
    return;
  }

    if (action === 'map-add-place') {
    handleAddMapPlaceToTrip();
    return;
  }

  navigate(action);
});

function renderCurrentRoute() {
  if (window.location.hash === '#invite') renderInvite();
  else if (window.location.hash === '#auth') renderAuth();
  else if (window.location.hash === '#account') renderAccount();
  else if (window.location.hash === '#create-trip') renderCreateTrip();
  else if (window.location.hash === '#budget-overview') renderBudgetOverview();
  else if (window.location.hash === '#budget') renderBudget();
  else if (window.location.hash === '#budget-balance') renderBudgetBalance();
  else if (window.location.hash === '#new-expense') renderNewExpense();
  else if (window.location.hash === '#map') renderMap();
  else if (window.location.hash === '#activity-detail') renderActivityDetail();
  else if (window.location.hash === '#docs') renderDocs();
  else if (window.location.hash === '#itinerary') renderItinerary();
  else if (window.location.hash === '#new-step') renderNewStep();
  else if (window.location.hash === '#doc-scanner') renderDocScanner();
  else if (window.location.hash === '#doc-detail') renderDocDetail();
  else renderHome();
}

window.addEventListener('hashchange', renderCurrentRoute);

window.addEventListener('click', event => {
  const categoryButton = event.target.closest('[data-category]');
  if (!categoryButton) return;

  selectedStepCategory = categoryButton.dataset.category || 'transport';
  renderNewStep();
});


window.addEventListener('click', event => {
  const categoryButton = event.target.closest('[data-expense-category]');
  if (categoryButton) {
    selectedExpenseCategory = categoryButton.dataset.expenseCategory || 'meal';
    renderNewExpense();
    return;
  }

  const payerButton = event.target.closest('[data-expense-payer]');
  if (payerButton) {
    selectedExpensePayer = payerButton.dataset.expensePayer || 'me';
    renderNewExpense();
    return;
  }

  const splitButton = event.target.closest('[data-expense-split]');
  if (splitButton) {
    selectedExpenseSplit = splitButton.dataset.expenseSplit || 'equal';
    renderNewExpense();
  }
});

window.addEventListener('change', event => {
  if (event.target?.id === 'doc-file-input') {
    handleAddDocuments(event.target.files);
  }
});

window.addEventListener('submit', event => {
  const form = event.target.closest?.('[data-create-form]');
  if (!form) return;

  event.preventDefault();

  if (document.activeElement?.id === 'companion-name') {
    handleAddFriend();
  }
});

window.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target?.id === 'expense-modal-input') {
    event.preventDefault();
    confirmExpenseModal();
    return;
  }

  if (event.key !== 'Enter' && event.key !== ' ') return;

  const detailTrigger = event.target.closest('[data-action="activity-detail"]');
  if (!detailTrigger) return;

  event.preventDefault();
  navigate('activity-detail');
});

window.addEventListener('change', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  if (input.id !== 'start-date' && input.id !== 'end-date') return;

  const draft = getCreateTripFormData();
  saveTripDraft(draft);
  const label = document.querySelector(`[data-date-label="${input.id === 'start-date' ? 'start' : 'end'}"]`);
  if (!label) return;

  label.textContent = formatDateLabel(input.value, input.id === 'start-date' ? 'Sélectionner' : 'Optionnel');
  label.classList.toggle('muted', !input.value && input.id === 'end-date');
});

initMobileData().then(() => {
  if (pendingMobileInvite) {
    renderInvite();
    return;
  }

  renderCurrentRoute();
});