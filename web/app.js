// ════════════════════════════════════════════════════════════
// app.js — point d'entrée
// Attend que Supabase soit prêt, monte AppShell dans #root.
// ════════════════════════════════════════════════════════════

(async function main() {
  // Attendre que window.SB soit dispo (chargé en module ES dans index.html)
  if (!window.SB) {
    await new Promise(resolve => {
      const check = () => window.SB ? resolve() : setTimeout(check, 30);
      window.addEventListener('sb-ready', resolve, { once: true });
      check();
    });
  }

  // Vérifier que tous les composants sont prêts (les scripts type=text/babel se chargent dans l'ordre)
  function ready() {
    return window.Store && window.AppShell && window.ItineraryView
        && window.MapView && window.BudgetView && window.DocsView
        && window.SettingsModal && window.TravelModeView && window.Icon;
  }
  while (!ready()) await new Promise(r => setTimeout(r, 40));

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
    } catch (e) {
      console.error('Chargement voyages échoué :', e);
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
  const root = document.getElementById('root');
  root.innerHTML = '';
  const reactRoot = ReactDOM.createRoot(root);
  reactRoot.render(React.createElement(window.ErrorBoundary, null, React.createElement(window.AppShell)));
})();
