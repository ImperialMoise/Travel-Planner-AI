// ════════════════════════════════════════════════════════════
// supabase.js — couche d'accès aux données + auth
// ════════════════════════════════════════════════════════════

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL  = 'https://kxxxwijywumqehjchjae.supabase.co'; 
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4eHh3aWp5d3VtcWVoamNoamFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjA3NjQsImV4cCI6MjA5NTk5Njc2NH0.Jwqjq3BMSoGD77QsnPLELFuRXScGHBaQI7-KhprPzYw';                   

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── Auth ───────────────────────────────────────────────────
export async function getUser() {
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

export async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session ?? null;
}

export function onAuthChange(callback) {
  return sb.auth.onAuthStateChange((event, session) => callback(session?.user ?? null, event));
}

export async function signUp(email, password, pseudo) {
  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { display_name: pseudo || email.split('@')[0] } }
  });
  if (error) throw error;
  if (data.user) {
    await sb.from('profiles').upsert({
      id: data.user.id,
      email,
      display_name: pseudo || email.split('@')[0]
    }, { onConflict: 'id' });
  }
  return data.user;
}

export async function confirmSignUp(email, token) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanToken = String(token || '').replace(/\s/g, '');

  if (!cleanEmail) {
    throw new Error("L'adresse e-mail est manquante.");
  }

  if (!/^\d{8}$/.test(cleanToken)) {
    throw new Error('Le code doit contenir exactement 8 chiffres.');
  }

  const { data, error } = await sb.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: 'email'
  });

  if (error) throw error;

  return data.user;
}

export async function requestPasswordReset(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error("Indique ton adresse e-mail.");
  }

  const { error } = await sb.auth.resetPasswordForEmail(cleanEmail);

  if (error) throw error;
}

export async function completePasswordReset({
  email,
  token,
  password
}) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanToken = String(token || '').replace(/\s/g, '');
  const cleanPassword = String(password || '');

  if (!cleanEmail) {
    throw new Error("L'adresse e-mail est manquante.");
  }

  if (!/^\d{8}$/.test(cleanToken)) {
    throw new Error('Le code doit contenir exactement 8 chiffres.');
  }

  if (cleanPassword.length < 8) {
    throw new Error(
      'Le nouveau mot de passe doit contenir au moins 8 caractères.'
    );
  }

  const { error: verificationError } = await sb.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: 'recovery'
  });

  if (verificationError) throw verificationError;

  const { data, error: passwordError } = await sb.auth.updateUser({
    password: cleanPassword
  });

  if (passwordError) throw passwordError;

  return data.user;
}

export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export function isGuestUser(user) {
  return user?.is_anonymous === true;
}

export async function startGuestSession() {
  const currentUser = await getUser();

  if (currentUser) {
    return currentUser;
  }

  const { data, error } = await sb.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  if (!data?.user) {
    throw new Error(
      "Impossible de démarrer le voyage sans inscription."
    );
  }

  return data.user;
}

const GUEST_UPGRADE_STORAGE_KEY = 'pending_guest_account_upgrade';

export function getPendingGuestAccountUpgrade() {
  try {
    return JSON.parse(
      localStorage.getItem(GUEST_UPGRADE_STORAGE_KEY) || 'null'
    );
  } catch {
    return null;
  }
}

export function clearPendingGuestAccountUpgrade() {
  localStorage.removeItem(GUEST_UPGRADE_STORAGE_KEY);
}

export async function beginGuestAccountUpgrade(email, pseudo) {
  const currentUser = await getUser();

  if (!currentUser) {
    throw new Error("Aucune session temporaire n'est ouverte.");
  }

  if (!currentUser.is_anonymous) {
    throw new Error('Ce compte est déjà enregistré.');
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPseudo = String(pseudo || '').trim();

  if (!cleanEmail) {
    throw new Error('Indique ton adresse e-mail.');
  }

  const pendingUpgrade = {
    email: cleanEmail,
    pseudo: cleanPseudo,
    userId: currentUser.id,
    requestedAt: Date.now()
  };

  const { error } = await sb.auth.updateUser({
    email: cleanEmail,
    data: {
      display_name: cleanPseudo || 'Voyageur'
    }
  });

  if (error) throw error;

  localStorage.setItem(
    GUEST_UPGRADE_STORAGE_KEY,
    JSON.stringify(pendingUpgrade)
  );

  return pendingUpgrade;
}

export async function completeGuestAccountUpgrade({
  email,
  token,
  password,
  pseudo
}) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanToken = String(token || '').replace(/\s/g, '');
  const cleanPassword = String(password || '');
  const cleanPseudo = String(pseudo || '').trim();

  if (!cleanEmail) {
    throw new Error("L'adresse e-mail est manquante.");
  }

if (!/^\d{8}$/.test(cleanToken)) {
  throw new Error('Le code doit contenir exactement 8 chiffres.');
}

  if (cleanPassword.length < 8) {
    throw new Error('Le mot de passe doit contenir au moins 8 caractères.');
  }

  const { data: verification, error: verificationError } =
    await sb.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'email_change'
    });

  if (verificationError) throw verificationError;

  const displayName =
    cleanPseudo || cleanEmail.split('@')[0] || 'Voyageur';

  const { data: updatedAccount, error: passwordError } =
    await sb.auth.updateUser({
      password: cleanPassword,
      data: {
        display_name: displayName
      }
    });

  if (passwordError) throw passwordError;

  const user = updatedAccount?.user || verification?.user;

  if (!user) {
    throw new Error("Le compte n'a pas pu être finalisé.");
  }

  const { error: profileError } = await sb
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: cleanEmail,
        display_name: displayName
      },
      {
        onConflict: 'id'
      }
    );

  if (profileError) {
    console.warn('Profil non actualisé :', profileError);
  }

  clearPendingGuestAccountUpgrade();

  return user;
}

export async function resendGuestAccountUpgradeCode(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error("L'adresse e-mail est manquante.");
  }

  const { error } = await sb.auth.resend({
    type: 'email_change',
    email: cleanEmail
  });

  if (error) throw error;
}

export async function signOut() {
  await sb.auth.signOut();
}

// ─── Voyages ────────────────────────────────────────────────
export async function listMyTrips(
  {
    includeArchived = false
  } = {}
) {
  let query = sb
    .from('trips')
    .select(
      [
        'id',
        'name',
        'start_date',
        'end_date',
        'owner_id',
        'updated_at',
        'archived_at',
        'accent_theme',
        'cover_image_url',
        'cover_image_alt',
        'cover_photographer_name',
        'cover_photographer_url',
        'cover_source_url'
      ].join(', ')
    )
    .order(
      'updated_at',
      {
        ascending: false
      }
    );

  if (!includeArchived) {
    query = query.is(
      'archived_at',
      null
    );
  }

  const {
    data,
    error
  } = await query;

  if (error) throw error;

  return data ?? [];
}

export async function createTrip({ name, startDate, endDate, days }) {
  const user = await getUser();
  if (!user) throw new Error('Connexion requise');

  function parseLocalDate(iso) {
    if (!iso) return null;
    return new Date(String(iso) + 'T12:00:00');
  }

  function toISO(date) {
    if (!date) return null;
    return date.toISOString().slice(0, 10);
  }

  function diffDaysInclusive(startISO, endISO) {
    const start = parseLocalDate(startISO);
    const end = parseLocalDate(endISO);

    if (!start || !end) return 0;

    const diff = Math.round((end - start) / 86400000);
    return diff + 1;
  }

  let totalDays = Math.max(1, Number(days) || 1);
  let finalEndDate = endDate || null;

  if (startDate && endDate) {
    totalDays = Math.max(1, diffDaysInclusive(startDate, endDate));
  } else if (startDate && totalDays) {
    const end = parseLocalDate(startDate);
    end.setDate(end.getDate() + totalDays - 1);
    finalEndDate = toISO(end);
  }

  const { data: trip, error } = await sb.from('trips').insert({
    name,
    start_date: startDate || null,
    end_date: finalEndDate || null,
    owner_id: user.id
  }).select().single();

  if (error) throw error;

  const dayRows = Array.from({ length: totalDays }, (_, i) => {
    let dateISO = null;
    let dateLabel = '';

    if (startDate) {
      const d = parseLocalDate(startDate);
      d.setDate(d.getDate() + i);
      dateISO = toISO(d);
      dateLabel = d.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    }

    return {
      trip_id: trip.id,
      day_index: i,
      date_iso: dateISO,
      date_label: dateLabel
    };
  });

  await sb.from('trip_days').insert(dayRows);

  return trip;
}

export async function duplicateTrip(
  sourceTripId,
  requestedName
) {
  if (!sourceTripId) {
    throw new Error(
      'Voyage source introuvable.'
    );
  }

  const sourceTrip =
    await loadTrip(sourceTripId);

  if (!sourceTrip) {
    throw new Error(
      'Voyage source introuvable.'
    );
  }

  const cleanName =
    String(requestedName || '')
      .trim();

  if (!cleanName) {
    throw new Error(
      'Donne un nom à la copie.'
    );
  }

  const sourceDays =
    Array.isArray(sourceTrip.days)
      ? sourceTrip.days
      : [];

  let createdTrip = null;

  try {
    createdTrip =
      await createTrip({
        name: cleanName,
        startDate:
          sourceTrip.startDate ||
          null,
        endDate:
          sourceTrip.endDate ||
          null,
        days: Math.max(
          1,
          sourceDays.length
        )
      });

    await updateTrip(
      createdTrip.id,
      {
        globalNote:
          sourceTrip.globalNote ||
          '',
        accentTheme:
          sourceTrip.accentTheme ||
          'ochre'
      }
    );

    if (
      sourceTrip.coverImageUrl
    ) {
      await saveTripCover(
        createdTrip.id,
        {
          imageUrl:
            sourceTrip.coverImageUrl,
          alt:
            sourceTrip.coverImageAlt,
          photographer:
            sourceTrip
              .coverPhotographerName,
          photographerUrl:
            sourceTrip
              .coverPhotographerUrl,
          sourceUrl:
            sourceTrip.coverSourceUrl
        }
      );
    }

    const targetTrip =
      await loadTrip(
        createdTrip.id
      );

    const targetDays =
      Array.isArray(targetTrip.days)
        ? targetTrip.days
        : [];

    for (
      let dayIndex = 0;
      dayIndex < sourceDays.length;
      dayIndex += 1
    ) {
      const sourceDay =
        sourceDays[dayIndex];

      const targetDay =
        targetDays[dayIndex];

      if (!targetDay) {
        throw new Error(
          'Une journée de la copie est introuvable.'
        );
      }

      await updateDay(
        targetDay.id,
        {
          title:
            sourceDay.title || '',
          note:
            sourceDay.note || '',
          todo:
            Array.isArray(
              sourceDay.todo
            )
              ? sourceDay.todo
              : []
        }
      );

      if (
        sourceDay.coverImageUrl
      ) {
        await saveDayCover(
          targetDay.id,
          {
            imageUrl:
              sourceDay.coverImageUrl,
            alt:
              sourceDay.coverImageAlt,
            photographer:
              sourceDay
                .coverPhotographerName,
            photographerUrl:
              sourceDay
                .coverPhotographerUrl,
            sourceUrl:
              sourceDay.coverSourceUrl
          }
        );

        await updateDayCoverCrop(
          targetDay.id,
          {
            positionY:
              sourceDay
                .coverPositionY,
            locked:
              sourceDay
                .coverCropLocked
          }
        );
      }

      const orderedSteps = (
        Array.isArray(
          sourceDay.steps
        )
          ? sourceDay.steps
          : []
      )
        .slice()
        .sort(
          (first, second) =>
            Number(
              first.stepIndex || 0
            ) -
            Number(
              second.stepIndex || 0
            )
        );

      for (
        let stepIndex = 0;
        stepIndex <
          orderedSteps.length;
        stepIndex += 1
      ) {
        const sourceStep =
          orderedSteps[stepIndex];

        await saveStep(
          createdTrip.id,
          targetDay.id,
          {
            ...sourceStep,
            id: null,
            dayId:
              targetDay.id,
            stepIndex
          }
        );
      }
    }

    return await loadTrip(
      createdTrip.id
    );
  } catch (error) {
    if (createdTrip?.id) {
      try {
        await deleteTrip(
          createdTrip.id
        );
      } catch (
        cleanupError
      ) {
        console.warn(
          'Duplicate cleanup failed:',
          cleanupError
        );
      }
    }

    throw error;
  }
}

export async function loadTrip(tripId) {
  const [
    { data: trip, error: e1 },
    { data: days },
    { data: steps },
    { data: budget },
    { data: participants }
  ] = await Promise.all([
    sb.from('trips').select('*').eq('id', tripId).single(),
    sb.from('trip_days').select('*').eq('trip_id', tripId).order('day_index'),
    sb.from('trip_steps').select('*').eq('trip_id', tripId).order('day_id, step_index'),
    sb.from('budget_items').select('*').eq('trip_id', tripId),
    sb.from('trip_participants').select('*').eq('trip_id', tripId).order('sort_index')
  ]);
  if (e1) throw e1;

  return {
    id: trip.id,
    name: trip.name,
    startDate: trip.start_date,
    endDate: trip.end_date,
    accentTheme: trip.accent_theme || 'ochre',
    coverImageUrl: trip.cover_image_url || '',
    coverImageAlt: trip.cover_image_alt || '',
    coverPhotographerName: trip.cover_photographer_name || '',
    coverPhotographerUrl: trip.cover_photographer_url || '',
    coverSourceUrl: trip.cover_source_url || '',
    globalNote: trip.global_note || '',
    days: (days ?? []).map(d => ({
      id: d.id,
      index: d.day_index,
      title: d.title || '',
      note: d.note || '',
      dateLabel: d.date_label || '',
      dateISO: d.date_iso,
      todo: Array.isArray(d.todo) ? d.todo : [],
      coverImageUrl: d.cover_image_url || '',
      coverImageAlt: d.cover_image_alt || '',
      coverPhotographerName: d.cover_photographer_name || '',
      coverPhotographerUrl: d.cover_photographer_url || '',
      coverSourceUrl: d.cover_source_url || '',
            coverPositionY: Number.isFinite(Number(d.cover_position_y))
        ? Number(d.cover_position_y)
        : 50,
      coverCropLocked: d.cover_crop_locked !== false,
      steps: (steps ?? []).filter(s => s.day_id === d.id).map(dbStepToLocal)
    })),
    budget: (budget ?? []).map(dbBudgetToLocal),
    participants: (participants ?? []).map(p => ({ id: p.id, name: p.name }))
  };
}

export async function updateTrip(tripId, patch) {
  const row = {};

  if (patch.name !== undefined) row.name = patch.name;
  if (patch.startDate !== undefined) row.start_date = patch.startDate || null;
  if (patch.endDate !== undefined) row.end_date = patch.endDate || null;
  if (patch.globalNote !== undefined) row.global_note = patch.globalNote || '';
  if (patch.accentTheme !== undefined) row.accent_theme = patch.accentTheme || 'ochre';

  const { error } = await sb
    .from('trips')
    .update(row)
    .eq('id', tripId);

  if (error) throw error;

  const { data, error: readError } = await sb
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .maybeSingle();

  if (readError) throw readError;
  return data;
}

export async function searchTripCoverPhotos(tripId, query) {
  const { data, error } = await sb.functions.invoke('trip-cover-search', {
    body: { tripId, query }
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data?.results || [];
}

export async function saveTripCover(tripId, photo) {
  const value = photo || {};

  const { data, error } = await sb
    .from('trips')
    .update({
      cover_image_url: value.imageUrl || null,
      cover_image_alt: value.alt || '',
      cover_photographer_name: value.photographer || '',
      cover_photographer_url: value.photographerUrl || '',
      cover_source_url: value.sourceUrl || ''
    })
    .eq('id', tripId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveDayCover(dayId, photo) {
  const value = photo || {};

  const { data, error } = await sb
    .from('trip_days')
    .update({
      cover_image_url: value.imageUrl || null,
      cover_image_alt: value.alt || '',
      cover_photographer_name: value.photographer || '',
      cover_photographer_url: value.photographerUrl || '',
      cover_source_url: value.sourceUrl || '',
      cover_position_y: 50,
      cover_crop_locked: true
    })
    .eq('id', dayId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDayCoverCrop(dayId, patch = {}) {
  const row = {};

  if (patch.positionY !== undefined) {
    row.cover_position_y = Math.max(0, Math.min(100, Math.round(Number(patch.positionY))));
  }

  if (patch.locked !== undefined) {
    row.cover_crop_locked = !!patch.locked;
  }

  const { data, error } = await sb
    .from('trip_days')
    .update(row)
    .eq('id', dayId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function moveTripDayInsideFixedRange(
  tripId,
  fromIndex,
  toIndex
) {
  if (!tripId) {
    throw new Error('Voyage introuvable');
  }

  const sourceIndex = Number(fromIndex);
  const destinationIndex = Number(toIndex);

  if (
    !Number.isInteger(sourceIndex) ||
    !Number.isInteger(destinationIndex)
  ) {
    throw new Error('Déplacement invalide');
  }

  if (sourceIndex === destinationIndex) {
    return true;
  }

  function parseLocalDate(iso) {
    if (!iso) return null;
    return new Date(String(iso) + 'T12:00:00');
  }

  function toISO(date) {
    if (!date) return null;
    return date.toISOString().slice(0, 10);
  }

  function addDaysISO(baseISO, difference) {
    const date = parseLocalDate(baseISO);

    if (!date) return null;

    date.setDate(date.getDate() + difference);
    return toISO(date);
  }

  function dateLabel(iso) {
    const date = parseLocalDate(iso);

    if (!date) return '';

    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  async function updatePosition(dayId, values) {
    const { data, error } = await sb
      .from('trip_days')
      .update(values)
      .eq('id', dayId)
      .eq('trip_id', tripId)
      .select('id')
      .single();

    if (error) throw error;

    if (!data?.id) {
      throw new Error(
        'Une journée n’a pas pu être déplacée.'
      );
    }
  }

  const { data: trip, error: tripError } = await sb
    .from('trips')
    .select('id, start_date, end_date')
    .eq('id', tripId)
    .single();

  if (tripError) throw tripError;

  const { data: days, error: daysError } = await sb
    .from('trip_days')
    .select(
      'id, day_index, date_iso, date_label'
    )
    .eq('trip_id', tripId)
    .order('day_index');

  if (daysError) throw daysError;

  const currentDays = Array.isArray(days)
    ? days
    : [];

  if (!currentDays.length) {
    return true;
  }

  if (
    sourceIndex < 0 ||
    sourceIndex >= currentDays.length
  ) {
    throw new Error('Jour source introuvable');
  }

  if (
    destinationIndex < 0 ||
    destinationIndex >= currentDays.length
  ) {
    throw new Error('Date hors voyage');
  }

  const baseISO =
    trip.start_date ||
    currentDays[0].date_iso;

  if (!baseISO) {
    throw new Error(
      'Date de départ du voyage manquante'
    );
  }

  const nextDays = currentDays.slice();
  const movedDay = nextDays.splice(
    sourceIndex,
    1
  )[0];

  nextDays.splice(
    destinationIndex,
    0,
    movedDay
  );

  try {
    await Promise.all(
      nextDays.map(function setTemporaryIndex(
        day,
        index
      ) {
        return updatePosition(day.id, {
          day_index: 10000 + index
        });
      })
    );

    await Promise.all(
      nextDays.map(function setFinalIndex(
        day,
        index
      ) {
        const iso = addDaysISO(
          baseISO,
          index
        );

        return updatePosition(day.id, {
          day_index: index,
          date_iso: iso,
          date_label: iso
            ? dateLabel(iso)
            : ''
        });
      })
    );
  } catch (error) {
    await Promise.allSettled(
      currentDays.map(function prepareRollback(
        day,
        index
      ) {
        return updatePosition(day.id, {
          day_index: 20000 + index
        });
      })
    );

    await Promise.allSettled(
      currentDays.map(function restoreDay(day) {
        return updatePosition(day.id, {
          day_index: day.day_index,
          date_iso: day.date_iso,
          date_label: day.date_label || ''
        });
      })
    );

    throw error;
  }

  return true;
}

export async function deleteTripDayInsideFixedRange(tripId, dayIndex) {
  if (!tripId) throw new Error('Voyage introuvable');

  dayIndex = Number(dayIndex);

  if (!Number.isFinite(dayIndex)) {
    throw new Error('Journée invalide');
  }

  function parseLocalDate(iso) {
    if (!iso) return null;
    return new Date(String(iso) + 'T12:00:00');
  }

  function toISO(date) {
    if (!date) return null;
    return date.toISOString().slice(0, 10);
  }

  function addDaysISO(baseISO, diff) {
    const d = parseLocalDate(baseISO);
    if (!d) return null;

    d.setDate(d.getDate() + diff);
    return toISO(d);
  }

  function dateLabel(iso) {
    const d = parseLocalDate(iso);
    if (!d) return '';

    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  const { data: trip, error: tripError } = await sb
    .from('trips')
    .select('id, start_date, end_date')
    .eq('id', tripId)
    .single();

  if (tripError) throw tripError;

  const { data: days, error: daysError } = await sb
    .from('trip_days')
    .select('id, day_index, date_iso')
    .eq('trip_id', tripId)
    .order('day_index');

  if (daysError) throw daysError;

  const currentDays = days || [];

  if (currentDays.length <= 1) {
    throw new Error('Impossible de supprimer la dernière journée du voyage');
  }

  if (dayIndex < 0 || dayIndex >= currentDays.length) {
    throw new Error('Journée introuvable');
  }

  const dayToDelete = currentDays[dayIndex];
  const baseISO = trip.start_date || currentDays[0].date_iso;

  if (!baseISO) {
    throw new Error('Date de départ du voyage manquante');
  }

  await sb
    .from('trip_steps')
    .delete()
    .eq('day_id', dayToDelete.id);

  const { error: deleteDayError } = await sb
    .from('trip_days')
    .delete()
    .eq('id', dayToDelete.id);

  if (deleteDayError) throw deleteDayError;

  const nextDays = currentDays.filter(function(day) {
    return String(day.id) !== String(dayToDelete.id);
  });

  // Phase 1 : index temporaires pour éviter les collisions
  await Promise.all(nextDays.map(function(day, index) {
    return sb
      .from('trip_days')
      .update({
        day_index: 10000 + index
      })
      .eq('id', day.id);
  }));

  // Phase 2 : index définitifs + dates recalculées
  await Promise.all(nextDays.map(function(day, index) {
    const iso = addDaysISO(baseISO, index);

    return sb
      .from('trip_days')
      .update({
        day_index: index,
        date_iso: iso,
        date_label: iso ? dateLabel(iso) : ''
      })
      .eq('id', day.id);
  }));

  const nextEndDate = addDaysISO(baseISO, nextDays.length - 1);

  const { error: tripUpdateError } = await sb
    .from('trips')
    .update({
      end_date: nextEndDate
    })
    .eq('id', tripId);

  if (tripUpdateError) throw tripUpdateError;

  return true;
}

export async function updateTripDateRange(tripId, { startDate, endDate }) {
  if (!tripId) throw new Error('Voyage introuvable');

  function parseLocalDate(iso) {
    if (!iso) return null;
    return new Date(String(iso) + 'T12:00:00');
  }

  function toISO(date) {
    if (!date) return null;
    return date.toISOString().slice(0, 10);
  }

  function addDaysISO(baseISO, diff) {
    const d = parseLocalDate(baseISO);
    if (!d) return null;

    d.setDate(d.getDate() + diff);
    return toISO(d);
  }

  function diffDaysInclusive(startISO, endISO) {
    const start = parseLocalDate(startISO);
    const end = parseLocalDate(endISO);

    if (!start || !end) return 1;

    const diff = Math.round((end - start) / 86400000);
    return Math.max(1, diff + 1);
  }

  function dateLabel(iso) {
    const d = parseLocalDate(iso);
    if (!d) return '';

    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  const totalDays = diffDaysInclusive(startDate, endDate);

  const { data: currentDays, error: daysError } = await sb
    .from('trip_days')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_index');

  if (daysError) throw daysError;

  const days = currentDays || [];

  const { error: tripError } = await sb
    .from('trips')
    .update({
      start_date: startDate || null,
      end_date: endDate || null
    })
    .eq('id', tripId);

  if (tripError) throw tripError;

  const keptDays = days.slice(0, totalDays);
  const removedDays = days.slice(totalDays);

  if (removedDays.length) {
    const removedIds = removedDays.map(d => d.id);

    await sb
      .from('trip_steps')
      .delete()
      .in('day_id', removedIds);

    const { error: deleteDaysError } = await sb
      .from('trip_days')
      .delete()
      .in('id', removedIds);

    if (deleteDaysError) throw deleteDaysError;
  }

  await Promise.all(keptDays.map(function(day, index) {
    const iso = startDate ? addDaysISO(startDate, index) : null;

    return sb
      .from('trip_days')
      .update({
        day_index: index,
        date_iso: iso,
        date_label: iso ? dateLabel(iso) : ''
      })
      .eq('id', day.id);
  }));

  if (days.length < totalDays) {
    const rows = [];

    for (let i = days.length; i < totalDays; i += 1) {
      const iso = startDate ? addDaysISO(startDate, i) : null;

      rows.push({
        trip_id: tripId,
        day_index: i,
        date_iso: iso,
        date_label: iso ? dateLabel(iso) : ''
      });
    }

    if (rows.length) {
      const { error: insertError } = await sb
        .from('trip_days')
        .insert(rows);

      if (insertError) throw insertError;
    }
  }

  return true;
}

export async function updateDay(dayId, patch) {
  if (!dayId) throw new Error('Jour introuvable');

  const row = {};

  if (patch.title !== undefined) row.title = patch.title || '';
  if (patch.note !== undefined) row.note = patch.note || '';
  if (patch.dateLabel !== undefined) row.date_label = patch.dateLabel || '';
  if (patch.dateISO !== undefined) row.date_iso = patch.dateISO || null;
  if (patch.todo !== undefined) row.todo = Array.isArray(patch.todo) ? patch.todo : [];

  const { data, error } = await sb
    .from('trip_days')
    .update(row)
    .eq('id', dayId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setTripArchived(
  tripId,
  archived
) {
  if (!tripId) {
    throw new Error(
      'Voyage introuvable.'
    );
  }

  const {
    data,
    error
  } = await sb
    .from('trips')
    .update({
      archived_at: archived
        ? new Date().toISOString()
        : null
    })
    .eq('id', tripId)
    .select(
      'id, archived_at'
    )
    .single();

  if (error) throw error;

  return data;
}


export async function deleteTrip(tripId) {
  const { error } = await sb.from('trips').delete().eq('id', tripId);
  if (error) throw error;
}

// ─── Réordonnement des étapes (drag & drop / tri horaire) ──
export async function reorderSteps(steps) {
  const orderedSteps = (
    Array.isArray(steps) ? steps : []
  ).filter(step => step && step.id);

  if (!orderedSteps.length) {
    return true;
  }

  const stepIds = orderedSteps.map(step => step.id);

  const {
    data: currentRows,
    error: readError
  } = await sb
    .from('trip_steps')
    .select('id, day_id, step_index')
    .in('id', stepIds);

  if (readError) throw readError;

  if (
    !Array.isArray(currentRows) ||
    currentRows.length !== orderedSteps.length
  ) {
    throw new Error(
      'Certaines étapes sont introuvables.'
    );
  }

  const dayIds = new Set(
    currentRows.map(row => row.day_id)
  );

  if (dayIds.size !== 1) {
    throw new Error(
      'Les étapes déplacées doivent appartenir à la même journée.'
    );
  }

  const dayId = currentRows[0].day_id;

  async function updateStepIndex(
    stepId,
    stepIndex
  ) {
    const { data, error } = await sb
      .from('trip_steps')
      .update({
        step_index: stepIndex
      })
      .eq('id', stepId)
      .eq('day_id', dayId)
      .select('id')
      .single();

    if (error) throw error;

    if (!data?.id) {
      throw new Error(
        'Une étape n’a pas pu être déplacée.'
      );
    }
  }

  try {
    await Promise.all(
      orderedSteps.map(function setTemporaryIndex(
        step,
        index
      ) {
        return updateStepIndex(
          step.id,
          10000 + index
        );
      })
    );

    await Promise.all(
      orderedSteps.map(function setFinalIndex(
        step,
        index
      ) {
        const requestedIndex =
          Number(step.stepIndex);

        return updateStepIndex(
          step.id,
          Number.isInteger(requestedIndex)
            ? requestedIndex
            : index
        );
      })
    );
  } catch (error) {
    await Promise.allSettled(
      orderedSteps.map(function prepareRollback(
        step,
        index
      ) {
        return updateStepIndex(
          step.id,
          20000 + index
        );
      })
    );

    await Promise.allSettled(
      currentRows.map(function restoreStep(row) {
        return updateStepIndex(
          row.id,
          row.step_index
        );
      })
    );

    throw error;
  }

  return true;
}

// ─── Étapes (créer / modifier / supprimer) ─────────────────

// Enregistre une étape. Si "step.id" existe → modification, sinon → création.
export async function saveStep(tripId, dayId, step) {
  const row = {
    trip_id: tripId,
    day_id: dayId,
    step_index: step.stepIndex ?? 0,
    type: step.type || 'autre',
    label: step.label || '',
    lieu: step.lieu || '',
    time: step.time || '',
    time_end: step.timeEnd || '',
    transport_type: step.transportType || '',
    depart: step.depart || '',
    arrivee: step.arrivee || '',
    duree: step.duree || '',
    next_day: step.nextDay || false,
    escales: step.escales || [],
    ref: step.ref || '',
    date_start: step.dateStart || null,
    date_end: step.dateEnd || null,
    nuits: step.nuits || 0,
    time_check_in: step.timeCheckIn || '15:00',
    time_check_out: step.timeCheckOut || '11:00',
    duree_estimee: step.dureeEstimee || '',
    link: step.link || '',
    note: step.note || '',
    lat: step.lat || null,
    lng: step.lng || null,
    amount: step.amount || 0,
    paid_by: step.paidBy || '',
    important: !!step.important
  };
  if (step.id) row.id = step.id; // édition d'une étape existante

  const { data, error } = await sb
    .from('trip_steps')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Supprime une étape par son identifiant.
export async function deleteStep(stepId) {
  const { error } = await sb.from('trip_steps').delete().eq('id', stepId);
  if (error) throw error;
}

// ─── Budget (dépenses) ─────────────────────────────────────
export async function saveBudgetItem(tripId, item) {
  const user = await getUser();
  const row = {
    trip_id: tripId,
    step_id: item.stepId || null,
    cat: item.cat || 'Divers',
    description: item.desc || '',
    amount: item.amount || 0,
    paid_by: item.paidBy || '',
    for_participants: item.forParticipants || ['__all__'],
    created_by: user ? user.id : null
  };
  if (item.id) row.id = item.id;
  const { data, error } = await sb.from('budget_items').upsert(row, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBudgetItem(id) {
  const { error } = await sb.from('budget_items').delete().eq('id', id);
  if (error) throw error;
}

// ─── Participants (pour le partage des dépenses) ───────────
export async function addParticipant(tripId, name, sortIndex = 0) {
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('Nom requis');

  const { data, error } = await sb.from('trip_participants')
    .insert({ trip_id: tripId, name: cleanName, sort_index: sortIndex })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addMemberAsParticipant(tripId, member, sortIndex = 0) {
  if (!tripId) throw new Error('Voyage introuvable');
  if (!member) throw new Error('Membre introuvable');

  const name = member.name || member.email || 'Membre';

  const { data: existing, error: readError } = await sb
    .from('trip_participants')
    .select('id, name')
    .eq('trip_id', tripId)
    .ilike('name', name)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return existing;

  return addParticipant(tripId, name, sortIndex);
}

export function isMemberAlreadyParticipant(member, participants = []) {
  const memberName = String(member?.name || member?.email || '').trim().toLowerCase();

  if (!memberName) return false;

  return participants.some(participant => (
    String(participant.name || '').trim().toLowerCase() === memberName
  ));
}

export async function removeParticipant(id) {
  const { error } = await sb.from('trip_participants').delete().eq('id', id);
  if (error) throw error;
}

// ─── Partage / membres ─────────────────────────────
export async function listTripMembers(tripId) {
  if (!tripId) return [];

  const { data, error } = await sb
    .from('trip_members')
    .select('id, trip_id, user_id, role, joined_at, profiles(email, display_name)')
    .eq('trip_id', tripId)
    .order('joined_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(member => ({
    id: member.id,
    tripId: member.trip_id,
    userId: member.user_id,
    role: member.role,
    joinedAt: member.joined_at,
    email: member.profiles?.email || '',
    name: member.profiles?.display_name || member.profiles?.email || 'Membre'
  }));
}

export async function createTripInvite(tripId, role = 'editor') {
  const user = await getUser();
  if (!user) throw new Error('Connexion requise');
  if (!tripId) throw new Error('Voyage introuvable');

  const { data, error } = await sb
    .from('trip_invites')
    .insert({
      trip_id: tripId,
      role,
      created_by: user.id
    })
    .select('id, token, role, expires_at, used_at, created_at')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    token: data.token,
    role: data.role,
    expiresAt: data.expires_at,
    usedAt: data.used_at,
    createdAt: data.created_at,
    url: `${window.location.origin}${window.location.pathname}?invite=${data.token}`
  };
}

export async function listTripInvites(tripId) {
  if (!tripId) return [];

  const { data, error } = await sb
    .from('trip_invites')
    .select('id, token, role, expires_at, used_at, created_at')
    .eq('trip_id', tripId)
    .order('created_at', {
      ascending: false
    });

  if (error) throw error;

  const now = Date.now();

  return (data || [])
    .map(invite => ({
      id: invite.id,
      token: invite.token,
      role: invite.role,
      expiresAt: invite.expires_at,
      usedAt: invite.used_at,
      createdAt: invite.created_at,
      url: `${window.location.origin}${window.location.pathname}?invite=${invite.token}`
    }))
    .filter(invite => (
      !invite.usedAt &&
      (
        !invite.expiresAt ||
        new Date(
          invite.expiresAt
        ).getTime() > now
      )
    ));
}

export async function revokeTripInvite(
  inviteId
) {
  if (!inviteId) {
    throw new Error(
      'Invitation introuvable'
    );
  }

  const { data, error } = await sb
    .from('trip_invites')
    .delete()
    .eq('id', inviteId)
    .select('id');

  if (error) throw error;

  if (!data?.length) {
    throw new Error(
      'Invitation introuvable ou non autorisée'
    );
  }
}

export async function getInvite(token) {
  if (!token) throw new Error('Invitation manquante');

  const { data, error } = await sb
    .from('trip_invites')
    .select('id, trip_id, role, expires_at, used_at, trips(name)')
    .eq('token', token)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    tripId: data.trip_id,
    role: data.role,
    expiresAt: data.expires_at,
    usedAt: data.used_at,
    tripName: data.trips?.name || 'Voyage'
  };
}

export async function acceptInvite(token) {
  const user = await getUser();
  if (!user) throw new Error('Connexion requise');

  const { data: tripId, error } = await sb.rpc('accept_trip_invite', {
    invite_token: token
  });

  if (error) throw error;
  return tripId;
}

export async function updateTripMemberRole(
  tripId,
  memberId,
  role
) {
  const { error } = await sb.rpc(
    'update_trip_member_role',
    {
      p_trip_id: tripId,
      p_member_id: memberId,
      p_role: role
    }
  );

  if (error) throw error;
}

export async function transferTripOwnership(
  tripId,
  memberId
) {
  const { error } = await sb.rpc(
    'transfer_trip_ownership',
    {
      p_trip_id: tripId,
      p_member_id: memberId
    }
  );

  if (error) throw error;
}

export async function leaveTrip(tripId) {
  const user = await getUser();

  if (!user) {
    throw new Error(
      'Connexion requise'
    );
  }

  if (!tripId) {
    throw new Error(
      'Voyage introuvable'
    );
  }

  const { data, error } = await sb
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .neq('role', 'owner')
    .select('id');

  if (error) throw error;

  if (!data?.length) {
    throw new Error(
      'Impossible de quitter ce voyage.'
    );
  }
}


export async function removeTripMember(tripId, memberId) {
  const { error } = await sb.rpc('remove_trip_member', {
    p_trip_id: tripId,
    p_member_id: memberId
  });

  if (error) throw error;
}

export async function listTripActivity(tripId, limit = 40) {
  if (!tripId) return [];

  const { data, error } = await sb.rpc('get_trip_activity', {
    p_trip_id: tripId,
    p_limit: limit
  });

  if (error) throw error;

  return data || [];
}

// ─── Documents ─────────────────────────────────────
export async function listDocuments(tripId) {
  if (!tripId) return [];

  const { data, error } = await sb
    .from('trip_documents')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(doc => ({
    id: doc.id,
    tripId: doc.trip_id,
    category: doc.category || 'other',
    name: doc.name,
    filePath: doc.file_path,
    mime: doc.mime_type || '',
    size: doc.size_bytes || 0,
    createdAt: doc.created_at
  }));
}

export async function uploadDocument(tripId, file, category = 'other') {
  const user = await getUser();
  if (!user) throw new Error('Connexion requise');
  if (!tripId) throw new Error('Voyage introuvable');
  if (!file) throw new Error('Fichier manquant');

  const safeName = file.name.replace(/[^\w.\-]+/g, '_');
  const filePath = `${tripId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await sb.storage
    .from('trip-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream'
    });

  if (uploadError) throw uploadError;

  const { data, error } = await sb
    .from('trip_documents')
    .insert({
      trip_id: tripId,
      category,
      name: file.name,
      file_path: filePath,
      mime_type: file.type || '',
      size_bytes: file.size || 0,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    tripId: data.trip_id,
    category: data.category || 'other',
    name: data.name,
    filePath: data.file_path,
    mime: data.mime_type || '',
    size: data.size_bytes || 0,
    createdAt: data.created_at
  };
}

export async function getDocumentUrl(filePath) {
  const { data, error } = await sb.storage
    .from('trip-documents')
    .createSignedUrl(filePath, 60 * 10);

  if (error) throw error;
  return data.signedUrl;
}

export async function deleteDocument(documentId) {
  const { data: doc, error: fetchError } = await sb
    .from('trip_documents')
    .select('file_path')
    .eq('id', documentId)
    .single();

  if (fetchError) throw fetchError;

  const { error: deleteRowError } = await sb
    .from('trip_documents')
    .delete()
    .eq('id', documentId);

  if (deleteRowError) throw deleteRowError;

  if (doc?.file_path) {
    await sb.storage.from('trip-documents').remove([doc.file_path]);
  }
}

// ─── Recherche de lieux sécurisée via Edge Function ─────────
export async function searchPlaces(params = {}) {
  const payload = {
    query: params.query || '',
    language: params.language || 'fr',
    country: params.country || '',
    lat: params.lat ?? null,
    lng: params.lng ?? null,
    type: params.type || 'place',
    limit: params.limit || 5,
    provider: params.provider === 'google' ? 'google' : 'basic'
  };

  const { data, error } = await sb.functions.invoke('places-search', {
    body: payload
  });

  if (error) {
    throw error;
  }

  return data || {
    provider: 'geoapify',
    mode: 'error',
    results: [],
    usage: null
  };
}

// ─── Rappels personnels ────────────────────────────────────

function normalizeReminder(reminder) {
  return {
    id: reminder.id,
    tripId: reminder.trip_id,
    tripName:
      reminder.trips?.name ||
      'Voyage',
    title: reminder.title,
    remindAt: reminder.remind_at,
    completedAt: reminder.completed_at,
    notifiedAt: reminder.notified_at,
    createdAt: reminder.created_at
  };
}

export async function listMyReminders(
  {
    pendingOnly = false
  } = {}
) {
  const user = await getUser();

  if (!user) {
    return [];
  }

  let query = sb
    .from('trip_reminders')
    .select(`
      id,
      trip_id,
      title,
      remind_at,
      completed_at,
      notified_at,
      created_at,
      trips(name)
    `)
    .eq('user_id', user.id)
    .order('remind_at', {
      ascending: true
    })
    .limit(100);

  if (pendingOnly) {
    query = query.is(
      'completed_at',
      null
    );
  }

  const {
    data,
    error
  } = await query;

  if (error) throw error;

  return (data || []).map(
    normalizeReminder
  );
}

export async function createTripReminder({
  tripId,
  title,
  remindAt
}) {
  const user = await getUser();
  const cleanTitle =
    String(title || '').trim();

  if (!user) {
    throw new Error(
      'Connexion requise.'
    );
  }

  if (!tripId) {
    throw new Error(
      'Choisis un voyage.'
    );
  }

  if (!cleanTitle) {
    throw new Error(
      'Écris le contenu du rappel.'
    );
  }

  if (!remindAt) {
    throw new Error(
      'Choisis une date et une heure.'
    );
  }

  const {
    data,
    error
  } = await sb
    .from('trip_reminders')
    .insert({
      trip_id: tripId,
      user_id: user.id,
      title: cleanTitle,
      remind_at:
        new Date(remindAt).toISOString()
    })
    .select(`
      id,
      trip_id,
      title,
      remind_at,
      completed_at,
      notified_at,
      created_at,
      trips(name)
    `)
    .single();

  if (error) throw error;

  return normalizeReminder(data);
}

export async function setReminderCompleted(
  reminderId,
  completed
) {
  const {
    data,
    error
  } = await sb
    .from('trip_reminders')
    .update({
      completed_at: completed
        ? new Date().toISOString()
        : null,
      notified_at: completed
        ? undefined
        : null
    })
    .eq('id', reminderId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteReminder(
  reminderId
) {
  const {
    error
  } = await sb
    .from('trip_reminders')
    .delete()
    .eq('id', reminderId);

  if (error) throw error;
}

export async function listDueReminders() {
  const user = await getUser();

  if (!user) {
    return [];
  }

  const {
    data,
    error
  } = await sb
    .from('trip_reminders')
    .select(`
      id,
      trip_id,
      title,
      remind_at,
      completed_at,
      notified_at,
      created_at,
      trips(name)
    `)
    .eq('user_id', user.id)
    .is('completed_at', null)
    .is('notified_at', null)
    .lte(
      'remind_at',
      new Date().toISOString()
    )
    .order('remind_at', {
      ascending: true
    })
    .limit(10);

  if (error) throw error;

  return (data || []).map(
    normalizeReminder
  );
}

export async function markReminderNotified(
  reminderId
) {
  const {
    error
  } = await sb
    .from('trip_reminders')
    .update({
      notified_at:
        new Date().toISOString()
    })
    .eq('id', reminderId);

  if (error) throw error;
}

// ─── Idées de voyage ───────────────────────────────────────
function normalizeTripIdea(
  row,
  currentUserId
) {
  const votes =
    Array.isArray(row.trip_idea_votes)
      ? row.trip_idea_votes
      : [];

  return {
    id: row.id,
    tripId: row.trip_id,
    title: row.title || '',
    note: row.note || '',
    link: row.link || '',
    status: row.status || 'idea',
    plannedDayId:
      row.planned_day_id || null,
    plannedStepId:
      row.planned_step_id || null,
    assignedTo:
      row.assigned_to || null,
    voteCount: votes.length,
    votedByMe: votes.some(
      vote =>
        vote.user_id === currentUserId
    ),
    sortIndex: Number(row.sort_index) || 0,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listTripIdeas(tripId) {
  const user = await getUser();

  const { data, error } = await sb
    .from('trip_ideas')
    .select(
      '*, trip_idea_votes(user_id)'
    )
    .eq('trip_id', tripId)
    .order('sort_index', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(
    row =>
      normalizeTripIdea(
        row,
        user?.id
      )
  );
}

export async function createTripIdea(tripId, input) {
  const user = await getUser();

  if (!user) {
    throw new Error('Tu dois être connecté pour ajouter une idée.');
  }

  const title = String(input?.title || '').trim();
  const note = String(input?.note || '').trim();
  const link = String(input?.link || '').trim();

  const status = [
    'idea',
    'planned',
    'booked',
    'done'
  ].includes(input?.status)
    ? input.status
    : 'idea';

  if (!title) {
    throw new Error('Donne un titre à cette idée.');
  }

  const { data, error } = await sb
    .from('trip_ideas')
    .insert({
      trip_id: tripId,
      title,
      note,
      link,
      status,
      sort_index: Number(input?.sortIndex) || 0,
      created_by: user.id
    })
    .select(
      '*, trip_idea_votes(user_id)'
    )
    .single();

  if (error) throw error;

  return normalizeTripIdea(
    data,
    user?.id
  );
}

export async function updateTripIdea(ideaId, input) {
  const user = await getUser();
  const row = {};

  if (input?.title !== undefined) {
    row.title = String(input.title || '').trim();
  }

  if (input?.note !== undefined) {
    row.note = String(input.note || '').trim();
  }

  if (input?.link !== undefined) {
    row.link = String(input.link || '').trim();
  }

  if (input?.status !== undefined) {
    const allowedStatuses = [
      'idea',
      'planned',
      'booked',
      'done'
    ];

    if (!allowedStatuses.includes(input.status)) {
      throw new Error(
        'Le statut de cette idée n’est pas valide.'
      );
    }

    row.status = input.status;
  }

  if (
    input?.plannedDayId !== undefined
  ) {
    row.planned_day_id =
      input.plannedDayId || null;
  }

  if (
    input?.plannedStepId !== undefined
  ) {
    row.planned_step_id =
      input.plannedStepId || null;
  }

  if (
    input?.assignedTo !== undefined
  ) {
    row.assigned_to =
      input.assignedTo || null;
  }

  if (input?.sortIndex !== undefined) {
    row.sort_index = Number(input.sortIndex) || 0;
  }

  if (
    input?.title !== undefined &&
    !row.title
  ) {
    throw new Error('Donne un titre à cette idée.');
  }

  const { data, error } = await sb
    .from('trip_ideas')
    .update(row)
    .eq('id', ideaId)
    .select(
      '*, trip_idea_votes(user_id)'
    )
    .single();

  if (error) throw error;

  return normalizeTripIdea(
    data,
    user?.id
  );
}

export async function setTripIdeaVote(
  ideaId,
  shouldVote
) {
  const user = await getUser();

  if (!user) {
    throw new Error(
      'Tu dois être connecté pour voter.'
    );
  }

  if (shouldVote) {
    const { error } = await sb
      .from('trip_idea_votes')
      .upsert(
        {
          idea_id: ideaId,
          user_id: user.id
        },
        {
          onConflict:
            'idea_id,user_id',
          ignoreDuplicates: true
        }
      );

    if (error) throw error;
    return true;
  }

  const { error } = await sb
    .from('trip_idea_votes')
    .delete()
    .eq('idea_id', ideaId)
    .eq('user_id', user.id);

  if (error) throw error;

  return false;
}

export async function deleteTripIdea(ideaId) {
  const { error } = await sb
    .from('trip_ideas')
    .delete()
    .eq('id', ideaId);

  if (error) throw error;
}

// ─── Realtime ──────────────────────────────────────────────
let _channel = null;
export function subscribeTrip(tripId, onChange) {
  if (_channel) sb.removeChannel(_channel);
  _channel = sb.channel(`trip:${tripId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_steps', filter: `trip_id=eq.${tripId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_days',  filter: `trip_id=eq.${tripId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trips',             filter: `id=eq.${tripId}` },      onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_items',      filter: `trip_id=eq.${tripId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_participants', filter: `trip_id=eq.${tripId}` }, onChange)
    .subscribe();
  return _channel;
}
export function unsubscribeTrip() {
  if (_channel) { sb.removeChannel(_channel); _channel = null; }
}

// ─── Helpers conversions ───────────────────────────────────
function dbStepToLocal(s) {
  return {
    id: s.id,
    dayId: s.day_id,
    stepIndex: s.step_index,
    type: s.type,
    label: s.label,
    lieu: s.lieu,
    time: s.time,
    timeEnd: s.time_end,
    transportType: s.transport_type,
    depart: s.depart,
    arrivee: s.arrivee,
    duree: s.duree,
    nextDay: s.next_day,
    escales: s.escales ?? [],
    ref: s.ref,
    dateStart: s.date_start,
    dateEnd: s.date_end,
    nuits: s.nuits,
    timeCheckIn: s.time_check_in,
    timeCheckOut: s.time_check_out,
    dureeEstimee: s.duree_estimee,
    link: s.link,
    note: s.note,
    amount: s.amount,
    paidBy: s.paid_by,
    lat: s.lat,
    lng: s.lng,
    important: !!s.important
  };
}

function dbBudgetToLocal(b) {
  return {
    id: b.id,
    createdAt: b.created_at || null,
    stepId: b.step_id,
    cat: b.cat,
    desc: b.description,
    amount: b.amount,
    paidBy: b.paid_by,
    forParticipants: b.for_participants ?? ['__all__']
  };
}

window.SB = {
  sb,

  getUser,
  getSession,
  onAuthChange,
  signUp,
  confirmSignUp,
  requestPasswordReset,
  completePasswordReset,
  signIn,
  signOut,

  listMyTrips,
  createTrip,
  duplicateTrip,
  loadTrip,
  updateTrip,
  searchTripCoverPhotos,
  saveTripCover,
  saveDayCover,
  updateDayCoverCrop,
  updateDay,
  moveTripDayInsideFixedRange,
  setTripArchived,
  deleteTrip,

  reorderSteps,
  saveStep,
  deleteStep,

  saveBudgetItem,
  deleteBudgetItem,

  addParticipant,
  addMemberAsParticipant,
  isMemberAlreadyParticipant,
  removeParticipant,

  listTripMembers,
  createTripInvite,
  listTripInvites,
  revokeTripInvite,
  getInvite,
  acceptInvite,
  updateTripMemberRole,
  transferTripOwnership,
  leaveTrip,
  removeTripMember,
  listTripActivity,

  listMyReminders,
  createTripReminder,
  setReminderCompleted,
  deleteReminder,
  listDueReminders,
  markReminderNotified,

  listTripIdeas,
  createTripIdea,
  updateTripIdea,
  setTripIdeaVote,
  deleteTripIdea,

  listDocuments,
  uploadDocument,
  getDocumentUrl,
  deleteDocument,

  searchPlaces,
    async getPlacesUsage() {
    const { data, error } = await sb.functions.invoke("places-search", {
      body: { action: "usage" }
    });

    if (error) throw error;
    return data?.usage || null;
  },

  subscribeTrip,
  unsubscribeTrip
};
