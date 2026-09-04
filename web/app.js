// ════════════════════════════════════════════════════════════
// app.js — point d'entrée
// Attend que Supabase soit prêt, monte AppShell dans #root.
// ════════════════════════════════════════════════════════════

(async function main() {
  function updateInitialLoading(
    status,
    progress,
    detail
  ) {
    const root = document.getElementById('root');

    const statusElement = root?.querySelector(
      '#initial-loading-status'
    );

    const detailElement = root?.querySelector(
      '#initial-loading-detail'
    );

    const progressElement = root?.querySelector(
      '.initial-loading-bar span'
    );

    const progressBar = root?.querySelector(
      '.initial-loading-bar'
    );

    const safeProgress = Math.max(
      0,
      Math.min(
        100,
        Number(progress) || 0
      )
    );

    if (statusElement) {
      statusElement.textContent = status;
    }

    if (detailElement && detail) {
      detailElement.textContent = detail;
    }

    if (progressElement) {
      progressElement.style.width =
        safeProgress + '%';
    }

    if (progressBar) {
      progressBar.setAttribute(
        'aria-valuenow',
        String(safeProgress)
      );
    }
  }

  updateInitialLoading(
    'Connexion sécurisée…',
    24,
    'Vérification de ta session.'
  );

  // Attendre que window.SB soit dispo (chargé en module ES dans index.html)
  if (!window.SB) {
    await new Promise(resolve => {
      const check = () => window.SB ? resolve() : setTimeout(check, 30);
      window.addEventListener('sb-ready', resolve, { once: true });
      check();
    });
  }

  updateInitialLoading(
    'Connexion établie.',
    45,
    'Préparation de l’interface.'
  );

  // Vérifier que tous les composants sont prêts (les scripts type=text/babel se chargent dans l'ordre)
  function ready() {
    return window.Store && window.AppShell && window.ItineraryView
        && window.MapView && window.BudgetView && window.DocsView
        && window.SettingsModal && window.TravelModeView && window.Icon;
  }
  while (!ready()) await new Promise(r => setTimeout(r, 40));

  updateInitialLoading(
    'Interface prête.',
    68,
    'Récupération de tes préférences.'
  );

    async function handlePendingInvite(token, currentUser) {
    if (!token) return false;

    if (!currentUser) {
      localStorage.setItem('pendingTripInvite', token);

      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);

      Store.showToast('Connecte-toi pour rejoindre le voyage.');
      return false;
    }

    try {
      const tripId = await SB.acceptInvite(token);

      localStorage.removeItem('pendingTripInvite');

      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);

      const trips = await SB.listMyTrips();
      Store.set({ trips });

      if (window.selectTrip) {
        await window.selectTrip(tripId);
      }

      Store.showToast('Invitation acceptée. Bienvenue dans le voyage.');
      return true;
    } catch (error) {
      localStorage.removeItem('pendingTripInvite');
      Store.showToast('Invitation invalide : ' + (error.message || error));
      return false;
    }
  }

  // 1. Récupérer l'utilisateur courant
  updateInitialLoading(
    'Vérification de la session…',
    78,
    'Tu peux rester sur cette page.'
  );

  let user = await SB.getUser();

  // Si pas immédiat, attendre la restauration de session
  if (!user) {
    await new Promise(resolve => {
      const t = setTimeout(resolve, 1200);
      const { data: { subscription } } = SB.sb.auth.onAuthStateChange((event, session) => {
        if (session?.user) user = session.user;
        clearTimeout(t);
        subscription.unsubscribe();
        resolve();
      });
    });
  }

  Store.set({ user, authReady: true });

  updateInitialLoading(
    user
      ? 'Chargement de tes voyages…'
      : 'Accueil prêt.',
    90,
    user
      ? 'Préparation de ton espace personnel.'
      : 'Tu peux commencer à préparer un voyage.'
  );

    const inviteToken =
    new URLSearchParams(window.location.search).get('invite') ||
    localStorage.getItem('pendingTripInvite');

  const inviteAccepted = inviteToken
    ? await handlePendingInvite(inviteToken, user)
    : false;

  // 2. Si connecté : charger ses voyages
  if (user) {
    try {
      const trips = await SB.listMyTrips();
      Store.set({ trips });
      // Auto-sélectionner le plus récent
      if (trips.length && !inviteAccepted) {
        await window.selectTrip(trips[0].id);
      }
    } catch (error) {
      console.error(
        'Chargement voyages échoué :',
        error
      );

      Store.showToast(
        'Impossible de charger tes voyages. ' +
        'Vérifie ta connexion puis recharge la page.'
      );
    }
  }

  // 3. Surveiller les changements d'auth
  SB.onAuthChange(async (newUser, event) => {
    if (event === 'SIGNED_IN' && newUser) {
      Store.set({ user: newUser });
      const trips = await SB.listMyTrips();
      Store.set({ trips });
      const pendingInvite = localStorage.getItem('pendingTripInvite');

      if (pendingInvite) {
        const accepted = await handlePendingInvite(pendingInvite, newUser);
        if (accepted) return;
      }

      if (trips.length && !Store.get().activeTripId) {
        await window.selectTrip(trips[0].id);
      }
    } else if (event === 'SIGNED_OUT') {
      Store.set({ user: null, trips: [], activeTripId: null, trip: null });
    }
  });

  // 4. Monter React
  updateInitialLoading(
    'Ouverture de l’espace…',
    100,
    'Presque terminé.'
  );

  const root = document.getElementById('root');
  root.innerHTML = '';
  const reactRoot =
    ReactDOM.createRoot(root);

  reactRoot.render(
    React.createElement(
      window.ErrorBoundary,
      null,
      React.createElement(
        window.AppShell
      )
    )
  );

  if (
    'serviceWorker' in navigator
  ) {
    function registerServiceWorker() {
      navigator.serviceWorker
        .register(
          '/service-worker.js'
        )
        .then(
          function watchServiceWorkerUpdate(
            registration
          ) {
            function notifyWhenInstalled(
              worker
            ) {
              if (!worker) return;

              worker.addEventListener(
                'statechange',
                function reportUpdateReady() {
                  if (
                    worker.state ===
                      'installed' &&
                    navigator.serviceWorker
                      .controller
                  ) {
                    Store.showToast(
                      'Une nouvelle version est disponible. Recharge la page quand tu as terminé.'
                    );
                  }
                }
              );
            }

            notifyWhenInstalled(
              registration.installing
            );

            registration.addEventListener(
              'updatefound',
              function watchInstallingWorker() {
                notifyWhenInstalled(
                  registration.installing
                );
              }
            );
          }
        )
        .catch(
          function reportWorkerError(
            error
          ) {
            console.warn(
              'Service worker non enregistré :',
              error
            );
          }
        );
    }

    if (
      document.readyState ===
      'complete'
    ) {
      registerServiceWorker();
    } else {
      window.addEventListener(
        'load',
        registerServiceWorker,
        {
          once: true
        }
      );
    }
  }
})();
