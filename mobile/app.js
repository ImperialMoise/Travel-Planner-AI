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

function icon(symbol, className = '') {
  return `<span class="${className}" aria-hidden="true">${symbol}</span>`;
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

      <nav class="bottom-nav" aria-label="Navigation mobile">
        <button class="nav-item active" type="button">⌂<span>Plan</span></button>
        <button class="nav-item" type="button">⌖<span>Carte</span></button>
        <button class="nav-item" type="button">◫<span>Budget</span></button>
        <button class="nav-item" type="button">☷<span>Docs</span></button>
      </nav>
    </div>
  `;
}

function renderCreateTrip() {
  app.innerHTML = `
    <div class="mobile-shell">
      <header class="topbar bordered">
        <button class="icon-button" type="button" data-action="home" aria-label="Fermer">×</button>
        <h1 class="topbar-title">Nouvelle Aventure</h1>
        <span></span>
      </header>

      <main class="create-main">
        <section class="create-hero">
          <h2>Quelle sera votre<br>prochaine aventure ?</h2>
          <p>Laissez-vous guider par l'inspiration.</p>
        </section>

        <form class="create-form">
          <div class="field-group">
            <label class="kicker" for="destination">Destination</label>
            <div class="input-shell">
              ${icon('⌖', 'form-icon')}
              <input id="destination" type="text" placeholder="Ex: Kyoto, Japon" autocomplete="off">
            </div>
          </div>

          <div class="field-group">
            <span class="kicker">Période du voyage</span>
            <div class="date-grid">
              <button class="date-card" type="button">
                <span class="date-label">Début</span>
                <span class="date-value">Sélectionner</span>
                <span class="date-icon">▣</span>
              </button>
              <button class="date-card" type="button">
                <span class="date-label">Fin</span>
                <span class="date-value muted">Optionnel</span>
                <span class="date-icon">▦</span>
              </button>
            </div>
          </div>

          <div class="field-group">
            <span class="kicker">Compagnons de route</span>
            <button class="companions" type="button">
              <span aria-hidden="true">♁</span>
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

function navigate(route) {
  if (route === 'create-trip') {
    window.location.hash = 'create-trip';
    renderCreateTrip();
  } else {
    window.location.hash = '';
    renderHome();
  }
}

window.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  navigate(action === 'create-trip' ? 'create-trip' : 'home');
});

window.addEventListener('hashchange', () => {
  if (window.location.hash === '#create-trip') renderCreateTrip();
  else renderHome();
});

if (window.location.hash === '#create-trip') renderCreateTrip();
else renderHome();
