// ════════════════════════════════════════════════════════════
// state.js — Store global minimaliste pour Voyage Planner
// ════════════════════════════════════════════════════════════
//
// Objectif :
// - Centraliser l'état partagé entre les vues.
// - Garder une API simple : Store.get(), Store.set(), Store.useStore().
// - Éviter les dépendances externes.
// - Prévoir les interactions entre Itinéraire, Toolbox et Carte.
//
// Usage :
//   const { trip, view } = Store.useStore();
//   Store.set({ view: 'map' });
//   Store.showToast('Voyage sauvegardé');
//
// ════════════════════════════════════════════════════════════

(function initStore() {
  const listeners = new Set();

  const initialState = {
    // Auth / session
    user: null,
    authReady: false,

    // Voyages
    trips: [],
    activeTripId: null,
    trip: null,

    // Navigation principale
    view: 'itinerary', // 'itinerary' | 'map' | 'budget' | 'docs'
    settingsOpen: false,

    // Notifications
    toast: null,

    // Itinéraire
    selectedDayIndex: 0,
    selectedStepId: null,
    pendingEditStepId: null,
    todayIndex: 0,

    // Carte
    mapFocusStepId: null,
    mapPickMode: null,
    mapPickResult: null,
    mapLocateStep: null,
    mapPreviewPlace: null
  };

  let state = initialState;

  function get() {
    return state;
  }

  function shallowEqual(a, b) {
    if (Object.is(a, b)) return true;

    if (
      !a ||
      !b ||
      typeof a !== 'object' ||
      typeof b !== 'object'
    ) {
      return false;
    }

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) return false;

    for (let i = 0; i < aKeys.length; i += 1) {
      const key = aKeys[i];

      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!Object.is(a[key], b[key])) return false;
    }

    return true;
  }

  function set(patch) {
    const nextPatch = typeof patch === 'function'
      ? patch(state)
      : patch;

    if (!nextPatch || typeof nextPatch !== 'object') return state;

    const nextState = {
      ...state,
      ...nextPatch
    };

    if (shallowEqual(state, nextState)) return state;

    state = nextState;

    listeners.forEach(function notify(listener) {
      listener(state);
    });

    return state;
  }

  function reset(patch) {
    state = {
      ...initialState,
      ...(patch || {})
    };

    listeners.forEach(function notify(listener) {
      listener(state);
    });

    return state;
  }

  function subscribe(listener) {
    listeners.add(listener);

    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  function useStore(selector) {
    const select = selector || function identity(s) {
      return s;
    };

    const [, forceRender] = React.useReducer(function increment(x) {
      return x + 1;
    }, 0);

    const selectedRef = React.useRef(select(state));

    React.useEffect(function subscribeToStore() {
      return subscribe(function handleChange(nextState) {
        const nextSelected = select(nextState);

        if (!shallowEqual(selectedRef.current, nextSelected)) {
          selectedRef.current = nextSelected;
          forceRender();
        }
      });
    }, [select]);

    return select(state);
  }

  function showToast(message, options) {
    const duration = options && Number(options.duration)
      ? Number(options.duration)
      : 2200;

    const toast = {
      msg: String(message || ''),
      ts: Date.now()
    };

    set({ toast });

    window.setTimeout(function clearToast() {
      const currentToast = get().toast;

      if (!currentToast) return;

      if (currentToast.ts === toast.ts) {
        set({ toast: null });
      }
    }, duration);

    return toast;
  }

  function clearToast() {
    set({ toast: null });
  }

  function selectDay(index) {
    const safeIndex = Math.max(0, Number(index) || 0);

    set({
      selectedDayIndex: safeIndex,
      selectedStepId: null
    });
  }

  function selectStep(stepId) {
    set({
      selectedStepId: stepId || null
    });
  }

  function openMapForStep(stepId) {
    set({
      view: 'map',
      mapFocusStepId: stepId || null
    });
  }

  function openMapPreview(place) {
    if (!place) return;

    set({
      view: 'map',
      mapPreviewPlace: place
    });
  }

  function startLocateStep(payload) {
    set({
      view: 'map',
      mapPickMode: 'locate-step',
      mapLocateStep: payload || null,
      mapPickResult: null
    });
  }

  function clearMapIntent() {
    set({
      mapFocusStepId: null,
      mapPickMode: null,
      mapPickResult: null,
      mapLocateStep: null,
      mapPreviewPlace: null
    });
  }

  window.Store = {
    get,
    set,
    reset,
    subscribe,
    useStore,

    showToast,
    clearToast,

    selectDay,
    selectStep,

    openMapForStep,
    openMapPreview,
    startLocateStep,
    clearMapIntent
  };
})();