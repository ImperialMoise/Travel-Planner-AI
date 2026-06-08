const app = document.getElementById('app');

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
      { name: 'location', icon: 'location_on', placeholder: 'Adresse / Lieu', type: 'text' },
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
      { name: 'location', icon: 'location_on', placeholder: 'Lieu', type: 'text' },
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
      { name: 'location', icon: 'location_on', placeholder: 'Adresse / Lieu', type: 'text' },
      { name: 'time', icon: 'schedule', type: 'time', value: '20:00', aria: 'Heure de réservation' },
      { name: 'notes', icon: 'notes', placeholder: 'Numéro de réservation, notes ou détails importants...', textarea: true }
    ]
  }
};

let selectedStepCategory = 'transport';

function icon(symbol, className = '') {
  return `<span class="${className}" aria-hidden="true">${symbol}</span>`;
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
  const common = `name="${field.name}" ${field.aria ? `aria-label="${field.aria}"` : ''}`;
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
          <input name="departure" type="text" placeholder="Gare de départ...">
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
          <input name="arrival" type="text" placeholder="Gare d'arrivée...">
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
  app.innerHTML = `
    <div class="mobile-shell">
      <header class="topbar">
        <button class="icon-button secondary" aria-label="Ouvrir le menu">☰</button>
        <h1 class="topbar-title">L'Atelier</h1>
        <button class="icon-button secondary" aria-label="Ouvrir le profil">●</button>
      </header>

      <main class="home-main">
        <section class="home-hero">
          <p class="kicker">Votre Carnet</p>
          <h2 class="hero-title">Où commence votre prochaine escale ?</h2>
        </section>

        <section class="next-trip-card" aria-label="Prochain départ">
          <div class="next-trip-content">
            <span class="badge">Prochain départ</span>
            <h3 class="next-trip-title">Kyoto, Japon</h3>
            <div>
              <div class="next-trip-row">
                <div class="date-row">
                  <span class="countdown">J-12</span>
                  <span class="mono">14 – 28 Nov.</span>
                </div>
                <span class="mono percent">80%</span>
              </div>
              <div class="progress-track"><div class="progress-fill"></div></div>
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
            <a href="#" aria-label="Voir tous les voyages">Tout voir</a>
          </div>
          <div class="trip-strip">
            ${trips.map(trip => `
              <article class="trip-card ${trip.past ? 'past' : ''}">
                <div class="trip-image" style="background-image: url('${trip.image}')">
                  <span class="trip-status">${trip.status}</span>
                </div>
                <div class="trip-body">
                  <h4>${trip.title}</h4>
                  <div class="trip-date mono">▣ ${trip.date}</div>
                </div>
              </article>
            `).join('')}
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

        <form class="create-form">
          <div class="field-group">
            <label class="kicker" for="destination">Destination</label>
            <div class="input-shell">
              <span class="material-symbols-outlined form-icon" aria-hidden="true">location_on</span>
              <input id="destination" type="text" placeholder="Ex: Kyoto, Japon" autocomplete="off" value="${escapeHtml(draft.destination || '')}">
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
}

function renderItinerary() {
  const draft = getTripDraft();
  const title = draft.destination || 'Frontière du Nord';
  const period = draft.startDate
    ? `${formatDateLabel(draft.startDate, '')}${draft.endDate ? ` – ${formatDateLabel(draft.endDate, '')}` : ''}`
    : 'Jour 6 • 14 Octobre';

  app.innerHTML = `
    <div class="mobile-shell itinerary-shell">
      <header class="topbar itinerary-topbar">
        <button class="icon-button" type="button" data-action="home" aria-label="Retour à l'accueil">
          <span class="material-symbols-outlined" aria-hidden="true">travel_explore</span>
        </button>
        <h1 class="topbar-title">L'Atelier</h1>
        <button class="icon-button" type="button" aria-label="Options itinéraire">
          <span class="material-symbols-outlined" aria-hidden="true">expand_more</span>
        </button>
      </header>

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
          ${itinerarySteps.map(step => `
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
                </div>
              </div>
            </article>
          `).join('')}

          <div class="timeline-add">
            <span class="timeline-dot" aria-hidden="true"></span>
            <button type="button" data-action="new-step">
              <span class="material-symbols-outlined" aria-hidden="true">add</span>
              <span>Ajouter une étape</span>
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
}


function budgetTabs(active = 'overview') {
  const tabs = [
    { id: 'overview', label: 'Aperçu', action: 'budget-overview' },
    { id: 'expenses', label: 'Dépenses', action: 'budget' },
    { id: 'balance', label: 'Équilibre', action: 'budget-balance' }
  ];

  return `
    <div class="budget-tabs ${active === 'overview' ? 'overview-tabs' : ''}" role="tablist" aria-label="Vue budget">
      ${tabs.map(tab => `
        <button
          class="${active === tab.id ? 'active' : ''}"
          type="button"
          role="tab"
          aria-selected="${active === tab.id ? 'true' : 'false'}"
          ${tab.action ? `data-action="${tab.action}"` : ''}
        >${tab.label}</button>
      `).join('')}
    </div>
  `;
}

function renderBudget() {
  app.innerHTML = `
    <div class="mobile-shell">
      <section class="budget-sticky">
        <header class="topbar budget-topbar">
          <button class="icon-button" type="button" data-action="home" aria-label="Retour au plan">⌘</button>
          <h1 class="topbar-title">L'Atelier</h1>
          <button class="icon-button" type="button" aria-label="Options budget">⌄</button>
        </header>

        <div class="budget-summary">
          <span class="kicker">Budget total</span>
          <strong>570,00 €</strong>
          <div class="budget-per-person">
            <span>285,00 € / pers.</span>
            <div class="avatar-stack" aria-label="Participants">
              <span>M</span>
              <span>Ma</span>
            </div>
          </div>
        </div>

        ${budgetTabs('expenses')}
      </section>

      <main class="budget-main">
        ${expenses.map(group => `
          <section class="expense-group">
            <h2 class="kicker">${group.group}</h2>
            <div class="expense-list">
              ${group.items.map(item => `
                <article class="expense-card">
                  <div class="expense-left">
                    <span class="expense-icon ${item.tone}">${item.icon}</span>
                    <div>
                      <h3>${item.title}</h3>
                      <p>Payé par ${item.payer}</p>
                    </div>
                  </div>
                  <strong>${item.amount}</strong>
                </article>
              `).join('')}
            </div>
          </section>
        `).join('')}

        <div class="budget-empty">
          <span aria-hidden="true">▤</span>
          <p>Aucune autre dépense ce mois-ci.</p>
        </div>
      </main>

      <button class="budget-fab" type="button" data-action="new-expense" aria-label="Ajouter une dépense">+</button>
      ${bottomNav('budget')}
    </div>
  `;
}


function renderNewExpense() {
  const activeCategory = expenseCategories.find(category => category.id === selectedExpenseCategory) || expenseCategories[0];
  const payerLabel = selectedExpensePayer === 'partner' ? 'Partenaire' : selectedExpensePayer === 'common' ? 'Fonds Commun' : 'Moi';

  app.innerHTML = `
    <div class="mobile-shell new-expense-shell">
      <header class="new-expense-header">
        <button type="button" data-action="budget" aria-label="Fermer">
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
        <span class="kicker">Nouvelle dépense</span>
        <button type="button" data-action="save-expense">Enregistrer</button>
      </header>

      <main class="new-expense-main">
        <section class="expense-amount-section" aria-labelledby="expense-amount-title">
          <h1 class="kicker" id="expense-amount-title">Montant</h1>
          <label class="expense-amount-input">
            <span>€</span>
            <input id="expense-amount" type="text" inputmode="decimal" value="142.50" placeholder="0.00" aria-label="Montant de la dépense">
          </label>
        </section>

        <section class="new-expense-section" aria-labelledby="expense-category-title">
          <h2 class="kicker" id="expense-category-title">Catégorie</h2>
          <div class="expense-category-grid">
            ${expenseCategories.map(category => `
              <button class="expense-category-button ${activeCategory.id === category.id ? 'active' : ''} ${category.id === 'other' ? 'other' : ''}" type="button" data-expense-category="${category.id}">
                <span class="material-symbols-outlined ${activeCategory.id === category.id ? 'filled' : ''}" aria-hidden="true">${category.icon}</span>
                <span>${category.label}</span>
              </button>
            `).join('')}
          </div>
        </section>

        <section class="new-expense-section" aria-labelledby="expense-payer-title">
          <h2 class="kicker" id="expense-payer-title">Qui a payé ?</h2>
          <div class="expense-segmented" role="group" aria-label="Payeur sélectionné : ${payerLabel}">
            <button class="${selectedExpensePayer === 'me' ? 'active' : ''}" type="button" data-expense-payer="me"><span>S</span>Moi</button>
            <button class="${selectedExpensePayer === 'partner' ? 'active' : ''}" type="button" data-expense-payer="partner"><span>C</span>Partenaire</button>
            <button class="${selectedExpensePayer === 'common' ? 'active' : ''}" type="button" data-expense-payer="common">Fonds Commun</button>
          </div>
        </section>

        <section class="new-expense-section" aria-labelledby="expense-split-title">
          <h2 class="kicker" id="expense-split-title">Pour qui ?</h2>
          <div class="expense-split-list">
            <button class="expense-split-card ${selectedExpenseSplit === 'equal' ? 'active' : ''}" type="button" data-expense-split="equal">
              <span class="split-avatars"><span>S</span><span>C</span></span>
              <strong>Partagé équitablement</strong>
              <span class="material-symbols-outlined" aria-hidden="true">${selectedExpenseSplit === 'equal' ? 'check_circle' : 'radio_button_unchecked'}</span>
            </button>
            <button class="expense-split-card ${selectedExpenseSplit === 'me' ? 'active' : ''}" type="button" data-expense-split="me">
              <span class="split-avatars solo"><span>S</span></span>
              <strong>Seulement moi</strong>
              <span class="material-symbols-outlined" aria-hidden="true">${selectedExpenseSplit === 'me' ? 'check_circle' : 'radio_button_unchecked'}</span>
            </button>
          </div>
        </section>

        <section class="new-expense-section expense-fields" aria-label="Date et note">
          <label>
            <span class="material-symbols-outlined" aria-hidden="true">calendar_today</span>
            <input id="expense-date" type="text" value="Aujourd'hui, 14 oct." placeholder="Date">
          </label>
          <label>
            <span class="material-symbols-outlined" aria-hidden="true">notes</span>
            <textarea id="expense-note" rows="2" placeholder="Ajouter une note... (ex: Dîner au Chateaubriand)"></textarea>
          </label>
        </section>
      </main>

      <div class="new-expense-bottom">
        <button class="primary-action" type="button" data-action="save-expense">
          <span class="material-symbols-outlined" aria-hidden="true">add_circle</span>
          <span>Ajouter la dépense</span>
        </button>
      </div>
    </div>
  `;
}

function renderBudgetOverview() {
  app.innerHTML = `
    <div class="mobile-shell">
      <header class="topbar budget-overview-topbar">
        <button class="icon-button" type="button" data-action="home" aria-label="Ouvrir le menu">
          <span class="material-symbols-outlined" aria-hidden="true">menu</span>
        </button>
        <h1 class="topbar-title">L'Atelier</h1>
        <button class="icon-button" type="button" aria-label="Ouvrir le profil">
          <span class="material-symbols-outlined" aria-hidden="true">account_circle</span>
        </button>
      </header>

      <main class="budget-overview-main">
        ${budgetTabs('overview')}

        <section class="budget-overview-card" aria-label="Résumé du budget">
          <div class="budget-pattern" aria-hidden="true"></div>
          <div class="budget-overview-content">
            <span class="kicker">Budget Total</span>
            <h2>570,00 €</h2>

            <div class="donut-wrap" aria-label="Graphique du budget restant et dépensé">
              <svg class="donut" viewBox="0 0 36 36" role="img" aria-labelledby="budget-donut-title">
                <title id="budget-donut-title">Répartition du budget</title>
                <path class="donut-ring" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="donut-segment primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="donut-segment tertiary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="donut-segment accent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div class="donut-center">
                <span>Reste</span>
                <strong>120 €</strong>
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
  app.innerHTML = `
    <div class="mobile-shell">
      <section class="budget-sticky balance-sticky">
        <header class="topbar budget-topbar">
          <button class="icon-button" type="button" data-action="home" aria-label="Retour au plan">⌘</button>
          <h1 class="topbar-title">L'Atelier</h1>
          <button class="icon-button" type="button" aria-label="Options budget">⌄</button>
        </header>

        <div class="budget-summary balance-summary">
          <span class="kicker">Budget Total</span>
          <strong>2 048,00 €</strong>
          <div class="budget-per-person">
            <span>1 024,00 € / pers.</span>
            <div class="avatar-stack" aria-label="Participants">
              <span>M</span>
              <span>Ma</span>
            </div>
          </div>
        </div>

        ${budgetTabs('balance')}
      </section>

      <main class="budget-balance-main">
        <section class="balance-section" aria-labelledby="balances-title">
          <h2 class="kicker" id="balances-title">Bilans individuels</h2>
          <div class="balance-list">
            ${budgetBalances.map(person => `
              <article class="balance-card">
                <div class="balance-person">
                  <span class="balance-avatar">${person.initials}</span>
                  <div>
                    <h3>${person.name}</h3>
                    <p>A payé ${person.paid}</p>
                  </div>
                </div>
                <strong class="balance-amount ${person.tone}">${person.balance}</strong>
              </article>
            `).join('')}
          </div>
        </section>

        <section class="settlement-section" aria-labelledby="settlement-title">
          <h2 id="settlement-title">Remboursements à faire</h2>
          <article class="settlement-card">
            <div class="settlement-flow">
              <div class="settlement-person">
                <span class="balance-avatar">${budgetSettlement.fromInitials}</span>
                <span>${budgetSettlement.from}</span>
              </div>

              <div class="settlement-arrow" aria-label="${budgetSettlement.from} doit ${budgetSettlement.amount} à ${budgetSettlement.to}">
                <strong>${budgetSettlement.amount}</strong>
                <span aria-hidden="true"></span>
              </div>

              <div class="settlement-person">
                <span class="balance-avatar">${budgetSettlement.toInitials}</span>
                <span>${budgetSettlement.to}</span>
              </div>
            </div>

            <button class="settlement-button" type="button" data-action="settlement-settled">
              <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
              <span>Marquer comme réglé</span>
            </button>
          </article>
        </section>
      </main>

      ${bottomNav('budget')}
    </div>
  `;
}


function handleSaveExpense() {
  const amountInput = document.querySelector('#expense-amount');
  const noteInput = document.querySelector('#expense-note');
  const activeCategory = expenseCategories.find(category => category.id === selectedExpenseCategory) || expenseCategories[0];
  const amount = amountInput?.value.trim() || '0.00';
  const normalizedAmount = amount.replace('.', ',');
  const note = noteInput?.value.trim();
  const payer = selectedExpensePayer === 'partner' ? 'Partenaire' : selectedExpensePayer === 'common' ? 'Fonds commun' : 'Moi';

  expenses[0].items.unshift({
    title: note || activeCategory.label,
    payer,
    amount: `- ${normalizedAmount} €`,
    icon: activeCategory.emoji,
    tone: activeCategory.tone
  });

  navigate('budget');
}

function handleAddFriend() {
  const input = document.querySelector('#companion-name');
  const name = input?.value.trim();
  if (!name) return;

  const draft = getCreateTripFormData();
  if (!draft.companions.includes(name)) draft.companions.push(name);
  saveTripDraft(draft);
  renderCreateTrip();
}

function handleCreateBoard() {
  const draft = getCreateTripFormData();
  saveTripDraft(draft);
  navigate('itinerary');
}

function handleAddStepToProgram() {
  const data = getNewStepFormData();
  const config = stepFieldSets[selectedStepCategory] || stepFieldSets.transport;
  let title = data.title?.trim() || config.fallbackTitle;
  let descriptionParts = [data.location?.trim(), data.duration?.trim(), data.notes?.trim()].filter(Boolean);

  if (selectedStepCategory === 'transport') {
    const mode = transportModeLabels[data.mode] || 'Transport';
    const departure = data.departure?.trim();
    const arrival = data.arrival?.trim();
    title = departure || arrival ? `${mode} ${departure || 'Départ'} → ${arrival || 'Arrivée'}` : mode;
    descriptionParts = [
      data.arrivalTime ? `Arrivée ${data.arrivalTime}${data.nextDay ? ' +1 jour' : ''}` : '',
      data.reference?.trim() ? `Réf. ${data.reference.trim()}` : '',
      data.stopover?.trim() ? `Escale ${data.stopover.trim()}` : '',
      data.notes?.trim()
    ].filter(Boolean);
  }

  itinerarySteps.push({
    time: data.time || config.defaultTime || '09:00',
    type: config.type,
    title,
    description: descriptionParts.join(' • ') || config.fallbackDescription,
    icon: config.timelineIcon,
    tone: selectedStepCategory === 'restaurant' ? 'accent' : 'petrol'
  });

  navigate('itinerary');
}

function navigate(route) {
  if (route === 'create-trip') {
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
  } else if (route === 'activity-detail') {
    window.location.hash = 'activity-detail';
    renderActivityDetail();
  } else if (route === 'map') {
    window.location.hash = 'map';
    renderMap();
  } else if (route === 'docs') {
    window.location.hash = '';
    renderHome();
  } else {
    window.location.hash = '';
    renderHome();
  }
}

window.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;

  if (action === 'add-friend') {
    handleAddFriend();
    return;
  }

  if (action === 'create-board') {
    handleCreateBoard();
    return;
  }

  if (action === 'add-step-to-program') {
    handleAddStepToProgram();
    return;
  }

  if (action === 'save-expense') {
    handleSaveExpense();
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

window.addEventListener('hashchange', () => {
  if (window.location.hash === '#create-trip') renderCreateTrip();
  else if (window.location.hash === '#budget-overview') renderBudgetOverview();
  else if (window.location.hash === '#budget') renderBudget();
  else if (window.location.hash === '#budget-balance') renderBudgetBalance();
  else if (window.location.hash === '#new-expense') renderNewExpense();
  else if (window.location.hash === '#map') renderMap();
  else if (window.location.hash === '#activity-detail') renderActivityDetail();
  else if (window.location.hash === '#itinerary') renderItinerary();
  else if (window.location.hash === '#new-step') renderNewStep();
  else renderHome();
});

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

window.addEventListener('keydown', event => {
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

if (window.location.hash === '#create-trip') renderCreateTrip();
else if (window.location.hash === '#budget-overview') renderBudgetOverview();
else if (window.location.hash === '#budget') renderBudget();
else if (window.location.hash === '#budget-balance') renderBudgetBalance();
else if (window.location.hash === '#new-expense') renderNewExpense();
else if (window.location.hash === '#map') renderMap();
else if (window.location.hash === '#activity-detail') renderActivityDetail();
else if (window.location.hash === '#itinerary') renderItinerary();
else if (window.location.hash === '#new-step') renderNewStep();
else renderHome();
