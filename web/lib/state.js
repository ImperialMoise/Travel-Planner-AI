// ════════════════════════════════════════════════════════════
// state.js — store global minimaliste
// Usage : Store.get() pour lire, Store.set({...}) pour modifier,
//         useStore() comme hook React.
// ════════════════════════════════════════════════════════════

(function() {
  const listeners = new Set();

  let state = {
    user: null,             // utilisateur Supabase connecté
    authReady: false,       // session restaurée ?
    trips: [],              // liste de mes voyages [{id, name, ...}]
    activeTripId: null,     // id du voyage actif
    trip: null,             // voyage actif complet {id, name, days:[...]}
    view: 'itinerary',      // 'itinerary' | 'map' | 'budget' | 'docs'
    settingsOpen: false,
    toast: null,            // {msg, ts} ou null
    selectedDayIndex: 0,    // jour sélectionné dans l'itinéraire
    selectedStepId: null,
    todayIndex: 0,          // index du jour "aujourd'hui" calculé
  };

  function get() { return state; }

  function set(patch) {
    const next = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    if (next === state) return;
    state = next;
    listeners.forEach(l => l(state));
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  // Hook React (rafraîchit le composant quand le state change)
  function useStore(selector = s => s) {
    const [, force] = React.useReducer(x => x + 1, 0);
    const ref = React.useRef(selector(state));
    React.useEffect(() => subscribe(s => {
      const next = selector(s);
      // Comparaison shallow simple
      if (next !== ref.current) {
        ref.current = next;
        force();
      }
    }), [selector]);
    return selector(state);
  }

  // Helpers globaux
  function showToast(msg) {
    set({ toast: { msg, ts: Date.now() } });
    setTimeout(() => {
      const cur = get().toast;
      if (cur && Date.now() - cur.ts >= 2000) set({ toast: null });
    }, 2200);
  }

  window.Store = { get, set, subscribe, useStore, showToast };
})();
