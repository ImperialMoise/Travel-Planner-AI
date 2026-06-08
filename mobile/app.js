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
  { id: 'activity', label: 'Activité', icon: 'attractions', active: true },
  { id: 'restaurant', label: 'Restaurant', icon: 'restaurant' }
];

function icon(symbol, className = '') {
  return `<span class="${className}" aria-hidden="true">${symbol}</span>`;
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
              <input id="destination" type="text" placeholder="Ex: Kyoto, Japon" autocomplete="off">
            </div>
          </div>

          <div class="field-group">
            <span class="kicker">Période du voyage</span>
            <div class="date-grid">
              <button class="date-card" type="button">
                <span class="date-label">Début</span>
                <span class="date-value">Sélectionner</span>
                <span class="material-symbols-outlined date-icon" aria-hidden="true">calendar_today</span>
              </button>
              <button class="date-card" type="button">
                <span class="date-label">Fin</span>
                <span class="date-value muted">Optionnel</span>
                <span class="material-symbols-outlined date-icon" aria-hidden="true">calendar_month</span>
              </button>
            </div>
          </div>

          <div class="field-group">
            <span class="kicker">Compagnons de route</span>
            <button class="companions" type="button">
              <span class="material-symbols-outlined" aria-hidden="true">person_add</span>
              <span>Ajouter des amis (optionnel)</span>
            </button>
          </div>
        </form>
      </main>

      <div class="create-bottom">
        <button class="primary-action" type="button">
          Créer le carnet de bord
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  `;
}


function renderItinerary() {
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
            <span class="kicker">Jour 6 • 14 Octobre</span>
            <h2>Frontière du Nord</h2>
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
              <button class="category-card ${category.active ? 'active' : ''}" type="button" data-category="${category.id}" aria-pressed="${category.active ? 'true' : 'false'}">
                <span class="material-symbols-outlined" aria-hidden="true">${category.icon}</span>
                <span>${category.label}</span>
              </button>
            `).join('')}
          </div>
        </section>

        <section class="new-step-section">
          <h2 class="kicker">Détails de l'étape</h2>
          <form class="step-form">
            <label class="step-input full">
              <span class="material-symbols-outlined" aria-hidden="true">local_activity</span>
              <input type="text" placeholder="Nom de l'activité (ex: Musée, Randonnée)">
            </label>

            <label class="step-input full">
              <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
              <input type="text" placeholder="Lieu">
            </label>

            <div class="step-form-grid">
              <label class="step-input compact">
                <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
                <input type="time" value="09:00" aria-label="Heure de début">
              </label>

              <label class="step-input compact">
                <span class="material-symbols-outlined" aria-hidden="true">timer</span>
                <input type="text" placeholder="Durée (ex: 2h)" aria-label="Durée estimée">
              </label>
            </div>

            <label class="step-input textarea full">
              <span class="material-symbols-outlined" aria-hidden="true">notes</span>
              <textarea rows="3" placeholder="Numéro de réservation, notes ou détails importants..."></textarea>
            </label>
          </form>
        </section>
      </main>

      <div class="new-step-bottom">
        <button class="primary-action" type="button">
          <span class="material-symbols-outlined" aria-hidden="true">add</span>
          <span>Ajouter au programme</span>
        </button>
      </div>
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

        <div class="budget-tabs" role="tablist" aria-label="Vue budget">
          <button type="button">Aperçu</button>
          <button class="active" type="button">Dépenses</button>
          <button type="button">Équilibre</button>
        </div>
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

function navigate(route) {
  if (route === 'create-trip') {
    window.location.hash = 'create-trip';
    renderCreateTrip();
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
  navigate(action);
});

window.addEventListener('hashchange', () => {
  if (window.location.hash === '#create-trip') renderCreateTrip();
  else if (window.location.hash === '#budget') renderBudget();
  else if (window.location.hash === '#itinerary') renderItinerary();
  else if (window.location.hash === '#new-step') renderNewStep();
  else renderHome();
});

window.addEventListener('click', event => {
  const categoryButton = event.target.closest('[data-category]');
  if (!categoryButton) return;

  document.querySelectorAll('[data-category]').forEach(button => {
    button.classList.toggle('active', button === categoryButton);
    button.setAttribute('aria-pressed', button === categoryButton ? 'true' : 'false');
  });
});

if (window.location.hash === '#create-trip') renderCreateTrip();
else if (window.location.hash === '#budget') renderBudget();
else if (window.location.hash === '#itinerary') renderItinerary();
else if (window.location.hash === '#new-step') renderNewStep();
else renderHome();
