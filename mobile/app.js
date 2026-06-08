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

const budgetCategories = [
  { label: 'Transport', percent: '45% du budget', amount: '256,50 €', icon: 'flight', tone: 'primary' },
  { label: 'Logement', percent: '30% du budget', amount: '171,00 €', icon: 'hotel', tone: 'tertiary' },
  { label: 'Repas', percent: '15% du budget', amount: '85,50 €', icon: 'restaurant', tone: 'accent' },
  { label: 'Autres', percent: '10% du budget', amount: '57,00 €', icon: 'more_horiz', tone: 'neutral' }
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
            <article class="timeline-item">
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
    { id: 'balance', label: 'Équilibre' }
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

      <button class="budget-fab" type="button" aria-label="Ajouter une dépense">+</button>
      ${bottomNav('budget')}
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
  } else if (route === 'itinerary') {
    window.location.hash = 'itinerary';
    renderItinerary();
  } else if (route === 'new-step') {
    window.location.hash = 'new-step';
    renderNewStep();
  } else if (route === 'map' || route === 'docs') {
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

  navigate(action);
});

window.addEventListener('hashchange', () => {
  if (window.location.hash === '#create-trip') renderCreateTrip();
  else if (window.location.hash === '#budget-overview') renderBudgetOverview();
  else if (window.location.hash === '#budget') renderBudget();
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
else if (window.location.hash === '#itinerary') renderItinerary();
else if (window.location.hash === '#new-step') renderNewStep();
else renderHome();
