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

  // ─── MÉTHODES SUPABASE ──────────────────────────────────────

  // 1. Sauvegarder le voyage actuel en base
  async function saveCurrentTrip() {
    const { trip } = get();
    // Assure-toi que ton client supabase est accessible ici (ex: window.supabase)
    const supabase = window.supabase; 
    
    if (!trip || !supabase) {
        showToast("Erreur: Voyage ou Supabase introuvable.");
        return;
    }

    try {
      showToast("Sauvegarde en cours... ⏳");

      // A: Mettre à jour le Voyage (Table 'trips')
      const { data: tripData, error: tripErr } = await supabase
        .from('trips')
        .upsert({ 
          id: trip.id, 
          title: trip.name || "Nouveau Voyage"
        })
        .select()
        .single();

      if (tripErr) throw tripErr;
      const tripId = tripData.id;

      // B: Nettoyage (on efface les anciennes étapes pour éviter les doublons)
      if (trip.id) {
        await supabase.from('trip_steps').delete().eq('trip_id', tripId);
        await supabase.from('trip_days').delete().eq('trip_id', tripId);
      }

      // C: Insertion des Jours
      const daysToInsert = trip.days.map((d, index) => ({
        id: crypto.randomUUID(), 
        trip_id: tripId,
        day_index: index,
        title: d.title || null,
        note: d.note || null,
        date_label: `${d.wd || ''} ${d.date ? new Date(d.date).toLocaleDateString('fr-FR', {day:'numeric', month:'short'}) : ''}`.trim(),
        date_iso: d.date || null
      }));

      if (daysToInsert.length > 0) {
        const { error: daysErr } = await supabase.from('trip_days').insert(daysToInsert);
        if (daysErr) throw daysErr;
      }

      // D: Insertion des Étapes
      const stepsToInsert = [];
      trip.days.forEach((d, dayIndex) => {
        const dayId = daysToInsert[dayIndex].id;
        
        if (d.steps && d.steps.length > 0) {
          d.steps.forEach((s, stepIndex) => {
            stepsToInsert.push({
              id: crypto.randomUUID(),
              trip_id: tripId,
              day_id: dayId,
              step_index: stepIndex,
              type: s.t || 'autre',
              label: s.l || null,
              lieu: s.s || null,
              time: s.time || null,
              time_end: s.time_end || null,
              transport_type: s.mode || null,
              depart: s.depart || null,
              arrivee: s.arrivee || null,
              duree: s.duree || null,
              lat: s.c ? s.c[1] : null,
              lng: s.c ? s.c[0] : null
            });
          });
        }
      });

      if (stepsToInsert.length > 0) {
        const { error: stepsErr } = await supabase.from('trip_steps').insert(stepsToInsert);
        if (stepsErr) throw stepsErr;
      }

      // E: Succès
      set({ trip: { ...trip, id: tripId } });
      showToast("Voyage sauvegardé avec succès ! 💾");

    } catch (err) {
      console.error("Erreur de sauvegarde :", err);
      showToast("Erreur lors de la sauvegarde.");
    }
  }

  // 2. Charger un voyage depuis Supabase
  async function loadTrip(tripId) {
    const supabase = window.supabase;
    if (!supabase) return;

    try {
      showToast("Chargement du voyage... 🌍");

      const [tripRes, daysRes, stepsRes] = await Promise.all([
        supabase.from('trips').select('*').eq('id', tripId).single(),
        supabase.from('trip_days').select('*').eq('trip_id', tripId).order('day_index', { ascending: true }),
        supabase.from('trip_steps').select('*').eq('trip_id', tripId).order('step_index', { ascending: true })
      ]);

      if (tripRes.error) throw tripRes.error;

      const reconstructedDays = daysRes.data.map(day => {
        const daySteps = stepsRes.data
          .filter(s => s.day_id === day.id)
          .map(s => ({
            t: s.type,
            l: s.label,
            s: s.lieu,
            time: s.time,
            time_end: s.time_end,
            mode: s.transport_type,
            depart: s.depart,
            arrivee: s.arrivee,
            duree: s.duree,
            c: (s.lng && s.lat) ? [s.lng, s.lat] : null
          }));

        return {
          n: day.day_index + 1,
          date: day.date_iso,
          wd: day.date_label ? day.date_label.split(' ')[0] : '',
          title: day.title || '',
          steps: daySteps
        };
      });

      set({ 
        activeTripId: tripRes.data.id,
        trip: { 
          id: tripRes.data.id, 
          name: tripRes.data.title, 
          dates: "Dates à calculer", 
          days: reconstructedDays 
        } 
      });
      showToast("Voyage chargé !");

    } catch (err) {
      console.error("Erreur de chargement :", err);
      showToast("Impossible de charger le voyage.");
    }
  }

  // 3. Créer un nouveau voyage vide
  function createNewTrip() {
    set({ 
      activeTripId: null,
      trip: {
        name: "Nouveau Voyage",
        dates: "",
        days: [{ n: 1, date: new Date().toISOString().split('T')[0], wd: "Lun", city: "Nouvelle étape", title: "Jour 1", steps: [] }]
      } 
    });
    showToast("Nouveau voyage créé ! N'oublie pas de sauvegarder.");
  }

  // ─── EXPOSITION GLOBALE ─────────────────────────────────────
  window.Store = { 
    get, 
    set, 
    subscribe, 
    useStore, 
    showToast,
    saveCurrentTrip,
    loadTrip,
    createNewTrip
  };
})();