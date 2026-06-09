const app = document.getElementById('app');

let mobileSB = null;
let mobileUser = null;
let mobileTrips = [];
let activeTrip = null;
let mobileReady = false;
let showAllTrips = false;
let mobileSupabaseReady = false;
let mobileSupabaseError = '';

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

async function initMobileData() {
  const SB = await waitForSupabase();

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
  { id: 'other', label: 'Autre', icon: 'add', tone: 'neutral', emoji: '＋' }
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

const docCategories = [
  {
    id: 'flights',
    label: 'Billets d\'avion',
    icon: 'flight',
    tone: 'primary',
    files: [
      { name: 'E-Ticket_AirFrance_AF123.pdf', type: 'pdf', date: '12 Oct', size: '1.2 MB' },
      { name: 'Carte_Embarquement_Retour.png', type: 'image', date: '14 Oct', size: '850 KB' }
    ]
  },
  {
    id: 'hotels',
    label: 'Hébergements',
    icon: 'hotel',
    tone: 'accent',
    files: [
      { name: 'Booking_Riad_Marrakech.pdf', type: 'pdf', date: '10 Oct', size: '2.1 MB' }
    ]
  },
  {
    id: 'identity',
    label: 'Identité',
    icon: 'badge',
    tone: 'secondary',
    files: [
      { name: 'Passeport_Marie.jpg', type: 'image', date: '05 Sep', size: '1.5 MB' },
      { name: 'Passeport_Jean.jpg', type: 'image', date: '05 Sep', size: '1.4 MB' }
    ]
  },
  {
    id: 'insurance',
    label: 'Assurances',
    icon: 'health_and_safety',
    tone: 'tertiary',
    files: [
      { name: 'Attestation_Rapatriement.pdf', type: 'pdf', date: '15 Sep', size: '500 KB' }
    ]
  }
];

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
      { name: 'time', icon: 'schedule', type: 'time', value: '15:00', aria: 'Heure de check-in' },
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

function icon(symbol, className = '') {
  return `<span class="${className}" aria-hidden="true">${symbol}</span>`;
}

const MAPTILER_KEY = '08IwMKKAkP3BQJss5poF';

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
  const common = `name="${field.name}" ${field.aria ? `aria-label="${field.aria}"` : ''} ${field.autocomplete ? 'data-autocomplete' : ''}`;
  const control = field.textarea
    ? `<textarea ${common} rows="3" placeholder="${field.placeholder}"></textarea>`
    : `<input ${common} type="${field.type || 'text'}" ${field.value ? `value="${field.value}"` : ''} ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}>`;

  return `
    <label class="step-input ${field.compact ? 'compact' : 'full'} ${field.textarea ? 'textarea' : ''}">
      <span class="material-symbols-outlined" aria-hidden="true">${field.icon}</span>
      ${control}
    </label>
  `;
}

function renderTransportStepFields() {
  return `
    <label class="step-input select full">
      <span class="material-symbols-outlined" aria-hidden="true">directions_transit</span>
      <select name="mode" aria-label="Mode de transport">
        <option value="train">Train</option>
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
          <input name="departure" type="text" placeholder="Gare de départ..." data-autocomplete>
        </label>
        <label class="step-input compact time-only">
          <input name="time" type="time" value="08:00" aria-label="Heure de départ">
        </label>
      </div>
    </div>

    <div class="transport-subgroup">
      <span class="transport-subtitle">Arrivée</span>
      <div class="transport-grid">
        <label class="step-input compact place">
          <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
          <input name="arrival" type="text" placeholder="Gare d'arrivée..." data-autocomplete>
        </label>
        <label class="step-input compact time-only">
          <input name="arrivalTime" type="time" value="10:30" aria-label="Heure d'arrivée">
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
        <input name="reference" type="text" placeholder="Référence (ex: AF267)">
      </label>
      <label class="step-input compact">
        <span class="material-symbols-outlined" aria-hidden="true">alt_route</span>
        <input name="stopover" type="text" placeholder="Escale (optionnel)">
      </label>
    </div>

    <label class="step-input textarea full">
      <span class="material-symbols-outlined" aria-hidden="true">notes</span>
      <textarea name="notes" rows="3" placeholder="Notes ou détails importants..."></textarea>
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

  return Object.fromEntries(new FormData(form).entries());
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
    { route: 'budget-overview', id: 'budget', icon: 'payments', label: 'Budget' },
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


function renderMap() {
  app.innerHTML = `
    <div class="mobile-shell map-shell">
      ${topbar()}
      <main class="map-screen" aria-label="Carte du voyage à Séoul">
        <div class="map-background" data-location="Seoul, South Korea">
          <div class="map-overlay" aria-hidden="true"></div>

          ${mapMarkers.map(marker => `
            <button
              class="map-marker ${marker.active ? 'active' : ''}"
              type="button"
              aria-label="${marker.label}"
              style="--marker-top: ${marker.top}; --marker-left: ${marker.left};"
            >
              <span class="material-symbols-outlined" aria-hidden="true">${marker.icon}</span>
            </button>
          `).join('')}
        </div>

        <div class="map-search-panel glass-panel">
          <span class="material-symbols-outlined" aria-hidden="true">search</span>
          <input type="search" placeholder="Rechercher un lieu, une étape..." aria-label="Rechercher sur la carte">
          <button type="button" aria-label="Filtrer la carte">
            <span class="material-symbols-outlined" aria-hidden="true">filter_list</span>
          </button>
        </div>

        <div class="map-controls" aria-label="Contrôles de la carte">
          <div class="glass-panel map-zoom-controls">
            <button type="button" aria-label="Zoomer">
              <span class="material-symbols-outlined" aria-hidden="true">add</span>
            </button>
            <button type="button" aria-label="Dézoomer">
              <span class="material-symbols-outlined" aria-hidden="true">remove</span>
            </button>
          </div>
          <button class="glass-panel" type="button" aria-label="Me localiser">
            <span class="material-symbols-outlined filled" aria-hidden="true">my_location</span>
          </button>
          <button class="glass-panel" type="button" aria-label="Calques">
            <span class="material-symbols-outlined" aria-hidden="true">layers</span>
          </button>
        </div>

        <article class="map-summary-card glass-panel" id="summary-card">
          <div class="map-summary-accent" aria-hidden="true"></div>
          <div class="map-summary-header">
            <div>
              <span class="kicker">Jour 6 • Aujourd'hui</span>
              <h1>Exploration de la DMZ</h1>
            </div>
            <button type="button" data-action="toggle-map-summary" aria-label="Réduire le résumé de la journée">
              <span class="material-symbols-outlined" aria-hidden="true">keyboard_arrow_down</span>
            </button>
          </div>
          <div class="map-summary-body">
            <div class="map-summary-image" aria-hidden="true"></div>
            <div>
              <p>
                <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
                <span>08:00 - Départ en bus</span>
              </p>
              <p>
                <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
                <span>Imjingak Park</span>
              </p>
            </div>
          </div>
        </article>
      </main>

      ${bottomNav('map')}
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

  app.innerHTML = `
    <div class="mobile-shell">
      ${topbar()}

      <main class="home-main">
        <section class="home-hero">
          <p class="kicker">Mon compte</p>
          <h2 class="hero-title">${escapeHtml(name)}</h2>
          <p class="docs-subtitle">${escapeHtml(mobileUser?.email || '')}</p>
        </section>

        <section>
          <div class="section-heading">
            <h3>Mes Voyages</h3>
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

        <button class="create-adventure" type="button" data-action="logout">
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
        <h1>Nouvelle étape</h1>
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
          <span>Ajouter au programme</span>
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
        group: 'Dépenses synchronisées',
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

function getExpenseCategories() {
  const customCategories = getCustomExpenseCategories();
  const baseWithoutOther = expenseCategories.filter(function(category) {
    return category.id !== 'other';
  });
  const otherCategory = expenseCategories.find(function(category) {
    return category.id === 'other';
  });

  return [
    ...baseWithoutOther,
    ...customCategories,
    otherCategory
  ].filter(Boolean);
}

function openExpenseModal(type, payload = {}) {
  expenseModal = {
    type,
    value: payload.value || '',
    id: payload.id || null
  };

  renderNewExpense();
}

function closeExpenseModal() {
  expenseModal = null;
  renderNewExpense();
}

function getExpenseModalCopy() {
  if (!expenseModal) return null;

  if (expenseModal.type === 'person-edit') {
    return {
      title: 'Modifier une personne',
      label: 'Nom de la personne',
      placeholder: 'Ex : Sarah',
      actionLabel: 'Enregistrer'
    };
  }

  if (expenseModal.type === 'person') {
    return {
      title: 'Ajouter une personne',
      label: 'Nom de la personne',
      placeholder: 'Ex : Sarah',
      actionLabel: 'Ajouter'
    };
  }

  return {
    title: 'Nouvelle catégorie',
    label: 'Nom de la catégorie',
    placeholder: 'Ex : Visites',
    actionLabel: 'Ajouter'
  };
}

function renderExpenseModal() {
  if (!expenseModal) return '';

  const copy = getExpenseModalCopy();

  return `
    <div class="expense-v2-modal-backdrop" role="presentation">
      <section class="expense-v2-modal" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
        <button
          class="expense-v2-modal-close"
          type="button"
          data-action="close-expense-modal"
          aria-label="Fermer"
        >
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>

        <span class="expense-v2-kicker">${copy.title}</span>
        <h3 id="expense-modal-title">${copy.label}</h3>

        <label class="expense-v2-modal-field">
          <span class="material-symbols-outlined" aria-hidden="true">
            ${expenseModal.type.includes('person') ? 'person_add' : 'category'}
          </span>
          <input
            id="expense-modal-input"
            type="text"
            value="${escapeHtml(expenseModal.value || '')}"
            placeholder="${copy.placeholder}"
            autocomplete="off"
          >
        </label>

        <div class="expense-v2-modal-actions">
          <button type="button" class="secondary" data-action="close-expense-modal">
            Annuler
          </button>

          <button type="button" class="primary" data-action="confirm-expense-modal">
            ${copy.actionLabel}
          </button>
        </div>
      </section>
    </div>
  `;
}

async function confirmExpenseModal() {
  const value = document.querySelector('#expense-modal-input')?.value.trim();

  if (!expenseModal || !value) return;

  if (expenseModal.type === 'person') {
    await addBudgetPersonByName(value);
  }

  if (expenseModal.type === 'person-edit') {
    await updateBudgetPersonByName(expenseModal.id, value);
  }

  if (expenseModal.type === 'category') {
    addExpenseCategoryByName(value);
  }

  expenseModal = null;
  renderNewExpense();
}

function addExpenseCategoryByName(label) {
  const cleanLabel = label.trim();
  if (!cleanLabel) return;

  const id = `custom-${Date.now()}`;
  const customCategories = getCustomExpenseCategories();

  customCategories.push({
    id,
    label: cleanLabel,
    icon: 'category',
    tone: 'neutral',
    emoji: '▧',
    custom: true
  });

  saveCustomExpenseCategories(customCategories);

  selectedExpenseCategory = id;
  isEditingExpenseCategories = false;
}

function handleAddExpenseCategory() {
  openExpenseModal('category');
}

function handleDeleteExpenseCategory(categoryId) {
  const customCategories = getCustomExpenseCategories();
  const category = customCategories.find(function(item) {
    return item.id === categoryId;
  });

  if (!category) return;

  const confirmed = confirm(`Supprimer la catégorie "${category.label}" ?`);
  if (!confirmed) return;

  const nextCategories = customCategories.filter(function(item) {
    return item.id !== categoryId;
  });

  saveCustomExpenseCategories(nextCategories);

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
  const person = people.find(function(item) {
    return item.id === personId;
  });

  if (!person) return;

  const confirmed = confirm(`Supprimer "${person.name}" ?`);
  if (!confirmed) return;

  if (activeTrip?.id && window.SB?.removeParticipant && !String(personId).startsWith('local-person-')) {
    await window.SB.removeParticipant(personId);
    await refreshMobileTrips(activeTrip.id);
    renderNewExpense();
    return;
  }

  const nextPeople = getLocalBudgetPeople().filter(function(item) {
    return item.id !== personId;
  });

  saveLocalBudgetPeople(nextPeople);

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

function handleAddBudgetPerson() {
  openExpenseModal('person');
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

  return [
    { id: 'me', name: 'Moi' },
    { id: 'partner', name: 'Partenaire' },
    ...localPeople
  ];
}

function getInitial(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

async function handleAddBudgetPerson() {
  const name = prompt('Nom de la personne :');
  if (!name || !name.trim()) return;

  if (activeTrip?.id && window.SB?.addParticipant) {
    await window.SB.addParticipant(activeTrip.id, name.trim(), activeTrip.participants?.length || 0);
    await refreshMobileTrips(activeTrip.id);
  }

  renderNewExpense();
}

function renderNewExpense() {
  const people = getBudgetPeople();
  const categories = getExpenseCategories();

  const activeCategory = categories.find(function(category) {
    return category.id === selectedExpenseCategory;
  }) || categories[0];

  const editingItem = editingExpenseDraft || (
  editingExpenseGroupIndex !== null && editingExpenseItemIndex !== null
    ? expenses[editingExpenseGroupIndex]?.items[editingExpenseItemIndex]
    : null
);

const editingAmount = editingItem
  ? String(editingItem.amount || '').replace(/[^0-9,.]/g, '').replace(',', '.')
  : '';

const editingTitle = editingItem?.title || '';
const editingNote = editingItem?.note || '';

  const categoryButtonsHtml = categories.map(function(category) {
  const isActive = activeCategory.id === category.id;
  const isCustom = category.custom === true;

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
        isEditingExpenseCategories && isCustom
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

  const payerButtonsHtml = people.map(function(person) {
  const isActive = selectedExpensePayer === person.id;
  const canEdit = person.id !== 'me' && person.id !== 'partner';

  return `
    <div class="expense-v2-person-card-wrap">
      <button
        class="expense-v2-person-card ${isActive ? 'active' : ''}"
        type="button"
        data-expense-payer="${person.id}"
      >
        <span class="expense-v2-person-avatar">${getInitial(person.name)}</span>
        <span>${escapeHtml(person.name)}</span>
      </button>

      ${
        canEdit
          ? `
            <div class="expense-v2-card-actions">
              <button
                type="button"
                data-action="edit-budget-person"
                data-person-id="${person.id}"
                aria-label="Modifier ${escapeHtml(person.name)}"
              >
                <span class="material-symbols-outlined" aria-hidden="true">edit</span>
              </button>

              <button
                type="button"
                class="danger"
                data-action="delete-budget-person"
                data-person-id="${person.id}"
                aria-label="Supprimer ${escapeHtml(person.name)}"
              >
                <span class="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
          `
          : ''
      }
    </div>
  `;
}).join('');

  const splitAvatarsHtml = people.slice(0, 4).map(function(person) {
    return `<span>${getInitial(person.name)}</span>`;
  }).join('');

 const splitPeopleHtml = people.map(function(person) {
  const isActive = selectedExpenseSplit === person.id;
  const canEdit = person.id !== 'me' && person.id !== 'partner';

  return `
    <div class="expense-v2-person-card-wrap">
      <button
        class="expense-v2-person-card ${isActive ? 'active' : ''}"
        type="button"
        data-expense-split="${person.id}"
      >
        <span class="expense-v2-person-avatar">${getInitial(person.name)}</span>
        <span>${escapeHtml(person.name)}</span>
      </button>

      ${
        canEdit
          ? `
            <div class="expense-v2-card-actions">
              <button
                type="button"
                data-action="edit-budget-person"
                data-person-id="${person.id}"
                aria-label="Modifier ${escapeHtml(person.name)}"
              >
                <span class="material-symbols-outlined" aria-hidden="true">edit</span>
              </button>

              <button
                type="button"
                class="danger"
                data-action="delete-budget-person"
                data-person-id="${person.id}"
                aria-label="Supprimer ${escapeHtml(person.name)}"
              >
                <span class="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
          `
          : ''
      }
    </div>
  `;
}).join('');

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
              <span>Ajouter</span>
            </button>
          </div>
        </section>

        <section class="expense-v2-section">
          <div class="expense-v2-section-heading">
            <span class="expense-v2-kicker">Qui a payé ?</span>
            <button
              class="expense-v2-mini-action"
              type="button"
              data-action="add-budget-person"
              aria-label="Ajouter une personne"
            >
              <span class="material-symbols-outlined" aria-hidden="true">person_add</span>
            </button>
          </div>
          <div class="expense-v2-person-grid">
            ${payerButtonsHtml}
            <button
              class="expense-v2-person-card ${selectedExpensePayer === 'common' ? 'active' : ''}"
              type="button"
              data-expense-payer="common"
            >
              <span class="expense-v2-person-avatar">€</span>
              <span>Fonds Commun</span>
            </button>
          </div>
        </section>

        <section class="expense-v2-section">
          <div class="expense-v2-section-heading">
            <span class="expense-v2-kicker">Pour qui ?</span>
            <button
              class="expense-v2-mini-action"
              type="button"
              data-action="add-budget-person"
              aria-label="Ajouter une personne"
            >
              <span class="material-symbols-outlined" aria-hidden="true">person_add</span>
            </button>
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

      ${renderExpenseModal()}
    </div>
  `;
}

function renderBudgetOverview() {
  const total = getCurrentBudgetTotal();
  const formattedTotal = formatEuroAmount(total);

  app.innerHTML = `
    <div class="mobile-shell">
      ${topbar()}

      <main class="budget-overview-main">
        ${budgetTabs('overview')}

        <section class="budget-overview-card" aria-label="Résumé du budget">
          <div class="budget-pattern" aria-hidden="true"></div>

          <div class="budget-overview-content">
            <span class="kicker">Budget Total</span>
            <h2>${formattedTotal}</h2>

            <div class="donut-wrap" aria-label="Graphique du budget">
              <svg class="donut" viewBox="0 0 36 36" role="img" aria-labelledby="budget-donut-title">
                <title id="budget-donut-title">Répartition du budget</title>
                <path class="donut-ring" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="donut-segment primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="donut-segment tertiary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="donut-segment accent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>

              <div class="donut-center">
                <span>Total</span>
                <strong>${formattedTotal}</strong>
              </div>
            </div>
          </div>
        </section>

        <section class="budget-repartition" aria-labelledby="budget-repartition-title">
          <h3 id="budget-repartition-title">Répartition</h3>

          <div class="budget-category-list">
            ${budgetCategories.map(category => `
              <article class="budget-category-card">
                <span class="budget-category-icon ${category.tone}" aria-hidden="true">
                  <span class="material-symbols-outlined">${category.icon}</span>
                </span>

                <div>
                  <h4>${category.label}</h4>
                  <p>${category.percent}</p>
                </div>

                <strong>${category.amount}</strong>
              </article>
            `).join('')}
          </div>
        </section>
      </main>

      ${bottomNav('budget')}
    </div>
  `;
}


function renderBudgetBalance() {
  const balanceCardsHtml = budgetBalances.map(function(person) {
    const isPositive = person.tone === 'positive';
    const cleanBalance = person.balance.replace('+ ', '').replace('- ', '');
    const transportWidth = isPositive ? '40%' : '0%';
    const hotelWidth = isPositive ? '35%' : '0%';
    const restaurantWidth = isPositive ? '25%' : '0%';

    return `
      <div class="balance-person-card">
        <div class="balance-person-header">
          <div class="balance-person-id">
            <span class="balance-avatar ${person.tone}">${escapeHtml(person.initials)}</span>
            <span class="balance-person-name">${escapeHtml(person.name)}</span>
          </div>

          <div class="balance-person-amounts">
            <strong class="balance-main-amount ${person.tone}">
              ${isPositive ? 'Reçoit' : 'Doit'} ${escapeHtml(cleanBalance)}
            </strong>
            <span class="balance-paid">Payé : ${escapeHtml(person.paid)}</span>
          </div>
        </div>

        <div class="balance-bars">
          <div class="balance-bar-row">
            <span class="material-symbols-outlined">directions_car</span>
            <div class="balance-bar-track">
              <div class="balance-bar-fill" style="width: ${transportWidth}"></div>
            </div>
            <span class="balance-bar-pct">${transportWidth}</span>
          </div>

          <div class="balance-bar-row">
            <span class="material-symbols-outlined">hotel</span>
            <div class="balance-bar-track">
              <div class="balance-bar-fill" style="width: ${hotelWidth}"></div>
            </div>
            <span class="balance-bar-pct">${hotelWidth}</span>
          </div>

          <div class="balance-bar-row">
            <span class="material-symbols-outlined">restaurant</span>
            <div class="balance-bar-track">
              <div class="balance-bar-fill" style="width: ${restaurantWidth}"></div>
            </div>
            <span class="balance-bar-pct">${restaurantWidth}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  app.innerHTML = `
    <div class="mobile-shell">
      ${topbar()}

      <main class="budget-v2-main">
        ${budgetTabs('balance')}

        <div class="balance-cards">
          ${balanceCardsHtml}
        </div>

        <h3 class="budget-section-title">Détails des remboursements</h3>

        <div class="settlement-detail-card">
          <div class="settlement-detail-row">
            <div class="settlement-detail-info">
              <strong>Location Voiture</strong>
              <span>Payé par ${escapeHtml(budgetSettlement.to)}</span>
            </div>
            <span class="settlement-detail-amount">+180,00 €</span>
          </div>

          <div class="settlement-detail-row">
            <div class="settlement-detail-info">
              <strong>Hôtel Paris</strong>
              <span>Payé par ${escapeHtml(budgetSettlement.to)}</span>
            </div>
            <span class="settlement-detail-amount">+270,00 €</span>
          </div>
        </div>

        <button class="settle-debt-btn" type="button" data-action="settlement-settled">
          <span class="material-symbols-outlined">payments</span>
          <span>Solder la dette</span>
        </button>
      </main>

      ${bottomNav('budget')}
    </div>
  `;
}

function renderDocs() {
  app.innerHTML = `
    <div class="mobile-shell">
      ${topbar()}

      <main class="docs-main-v2">
        <div class="docs-header">
          <span class="kicker">Coffre-fort Numérique</span>
          <h2 class="docs-title">Documents de Voyage</h2>
          <p class="docs-subtitle">Vos documents essentiels centralisés et sécurisés.</p>
        </div>

        <div class="docs-security-banner">
          <span class="material-symbols-outlined filled">verified_user</span>
          <div>
            <strong>Stockage Sécurisé</strong>
            <p>Documents chiffrés. Synchronisez avant le départ pour un accès hors ligne.</p>
          </div>
        </div>

        <div class="docs-actions">
          <button class="docs-action-primary" type="button">
            <span class="material-symbols-outlined">upload_file</span>
            <span>Ajouter</span>
          </button>
          <button class="docs-action-secondary" type="button" data-action="doc-scanner">
            <span class="material-symbols-outlined">photo_camera</span>
            <span>Scanner</span>
          </button>
        </div>

        <div class="docs-grid">
          ${docCategories.map(cat => `
            <div class="docs-category-card">
              <div class="docs-category-header">
                <div class="docs-category-icon ${cat.tone}">
                  <span class="material-symbols-outlined">${cat.icon}</span>
                </div>
                <h3>${cat.label}</h3>
                <span class="docs-file-count">${cat.files.length} fichier${cat.files.length > 1 ? 's' : ''}</span>
              </div>
              <div class="docs-file-list">
                ${cat.files.map(file => `
                  <button class="docs-file-row" type="button" data-action="doc-detail">
                    <span class="material-symbols-outlined docs-file-type-icon ${file.type === 'pdf' ? 'pdf' : 'img'}">${file.type === 'pdf' ? 'picture_as_pdf' : 'image'}</span>
                    <div class="docs-file-info">
                      <span class="docs-file-name">${file.name}</span>
                      <span class="docs-file-meta">Ajouté le ${file.date} • ${file.size}</span>
                    </div>
                    <span class="material-symbols-outlined docs-file-more">chevron_right</span>
                  </button>
                `).join('')}
              </div>
            </div>
          `).join('')}

          <button class="docs-add-folder" type="button" data-action="add-doc-folder">
            <span class="material-symbols-outlined">create_new_folder</span>
            <strong>Nouveau Dossier</strong>
            <span>Créer une catégorie</span>
          </button>
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

function renderDocDetail() {
  app.innerHTML = `
    <div class="mobile-shell doc-detail-shell">
      <header class="doc-detail-topbar">
        <button type="button" data-action="docs" aria-label="Retour">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div class="doc-detail-title">
          <strong>E-Ticket_AF_Paris_Tokyo.pdf</strong>
          <span>1.2 MB • PDF</span>
        </div>
        <button type="button" aria-label="Options">
          <span class="material-symbols-outlined">more_vert</span>
        </button>
      </header>

      <main class="doc-detail-viewer">
        <div class="ticket-card">
          <div class="ticket-header">
            <div>
              <h2>Air France</h2>
              <p>First Class E-Ticket</p>
            </div>
            <div class="ticket-icon">
              <span class="material-symbols-outlined">flight</span>
            </div>
          </div>

          <div class="ticket-body">
            <div class="ticket-route">
              <div class="ticket-airport">
                <span class="ticket-code">CDG</span>
                <span class="ticket-city">Paris</span>
              </div>
              <div class="ticket-line">
                <span class="material-symbols-outlined">flight_takeoff</span>
                <span class="ticket-duration">12H 45M</span>
              </div>
              <div class="ticket-airport right">
                <span class="ticket-code">HND</span>
                <span class="ticket-city">Tokyo</span>
              </div>
            </div>

            <div class="ticket-details">
              <div><span class="kicker">Passager</span><strong>Alexandre Dubois</strong></div>
              <div><span class="kicker">Vol</span><strong class="mono">AF 276</strong></div>
              <div><span class="kicker">Date</span><strong>14 Nov 2023</strong></div>
              <div><span class="kicker">Embarquement</span><strong class="boarding-time">22:45</strong></div>
              <div><span class="kicker">Terminal / Porte</span><strong>2E / K34</strong></div>
              <div><span class="kicker">Siège</span><strong>02A</strong></div>
            </div>

            <div class="ticket-perforation"></div>

            <div class="ticket-qr">
              <span class="kicker">Scanner à la porte</span>
              <div class="qr-placeholder">
                <span class="material-symbols-outlined">qr_code_2</span>
              </div>
              <span class="ticket-barcode">01384028394820</span>
            </div>
          </div>
        </div>

        <div class="doc-page-indicator">1 / 1</div>
      </main>

      <footer class="doc-detail-actions">
        <button type="button"><span class="material-symbols-outlined">ios_share</span><span>Partager</span></button>
        <button type="button" class="primary-doc-action"><span class="material-symbols-outlined">download</span><span>Télécharger</span></button>
        <button type="button" class="danger"><span class="material-symbols-outlined">delete</span><span>Supprimer</span></button>
      </footer>
    </div>
  `;
}

function handleEditExpense(groupIndex, itemIndex) {
  const item = expenses[groupIndex]?.items[itemIndex];
  if (!item) return;

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
    await refreshMobileTrips();
    navigate('account');
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
  const step = itinerarySteps[stepIndex];
  if (!step) return;

  const title = prompt("Nom de l'étape :", step.title);
  if (!title || !title.trim()) return;

  const time = prompt("Heure :", step.time || '');
  const description = prompt("Description :", step.description || '');

  step.title = title.trim();
  step.time = time?.trim() || step.time;
  step.description = description?.trim() || step.description;

  renderItinerary();
}

function handleDeleteStep(stepIndex) {
  const step = itinerarySteps[stepIndex];
  if (!step) return;

  const ok = confirm(`Supprimer "${step.title}" ?`);
  if (!ok) return;

  itinerarySteps.splice(stepIndex, 1);
  renderItinerary();
}

async function handleAddStepToProgram() {
  const data = getNewStepFormData();
  const config = stepFieldSets[selectedStepCategory] || stepFieldSets.transport;

  let title = data.title?.trim() || config.fallbackTitle;
  let descriptionParts = [data.location?.trim(), data.duration?.trim(), data.notes?.trim()].filter(Boolean);

  if (selectedStepCategory === 'transport') {
    const mode = transportModeLabels[data.mode] || 'Transport';
    const departure = data.departure?.trim();
    const arrival = data.arrival?.trim();

    title = departure || arrival
      ? `${mode} ${departure || 'Départ'} → ${arrival || 'Arrivée'}`
      : mode;

    descriptionParts = [
      data.arrivalTime ? `Arrivée ${data.arrivalTime}${data.nextDay ? ' +1 jour' : ''}` : '',
      data.reference?.trim() ? `Réf. ${data.reference.trim()}` : '',
      data.stopover?.trim() ? `Escale ${data.stopover.trim()}` : '',
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

  const activeDay = getActiveTripDayForNewStep();

  if (activeTrip?.id && activeDay?.id && window.SB?.saveStep) {
    try {
      const stepIndex = activeDay.steps?.length || 0;

      await window.SB.saveStep(activeTrip.id, activeDay.id, {
        stepIndex,
        type: selectedStepCategory,
        label: title,
        lieu: data.location?.trim() || '',
        time: data.time || config.defaultTime || '09:00',
        timeEnd: data.arrivalTime || '',
        transportType: data.mode || '',
        depart: data.departure?.trim() || '',
        arrivee: data.arrival?.trim() || '',
        duree: data.duration?.trim() || '',
        nextDay: data.nextDay === 'yes',
        escales: data.stopover?.trim() ? [data.stopover.trim()] : [],
        ref: data.reference?.trim() || '',
        note: data.notes?.trim() || '',
        amount: 0,
        paidBy: ''
      });

      await refreshMobileTrips(activeTrip.id);

      selectedStepCategory = 'transport';
      navigate('itinerary');
      return;
    } catch (error) {
      alert('Erreur sauvegarde étape : ' + (error.message || error));
      return;
    }
  }

  itinerarySteps.push(localStep);

  selectedStepCategory = 'transport';
  navigate('itinerary');
}

function navigate(route) {
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

    if (action === 'save-expense') {
    handleSaveExpense();
    return;
  }

  if (action === 'add-budget-person') {
  handleAddBudgetPerson();
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

  if (action === 'toggle-map-summary') {
    event.target.closest('.map-summary-card')?.classList.toggle('collapsed');
    return;
  }

  navigate(action);
});

function renderCurrentRoute() {
  if (window.location.hash === '#auth') renderAuth();
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

renderCurrentRoute();

initMobileData().then(() => {
  renderCurrentRoute();
});
