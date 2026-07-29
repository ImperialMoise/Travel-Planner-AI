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

export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  await sb.auth.signOut();
}

// ─── Voyages ────────────────────────────────────────────────
export async function listMyTrips() {
  const { data, error } = await sb
    .from('trips')
    .select('id, name, start_date, end_date, owner_id, updated_at, accent_theme')
    .order('updated_at', { ascending: false });
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

export async function moveTripDayInsideFixedRange(tripId, fromIndex, toIndex) {
  if (!tripId) throw new Error('Voyage introuvable');

  fromIndex = Number(fromIndex);
  toIndex = Number(toIndex);

  if (!Number.isFinite(fromIndex) || !Number.isFinite(toIndex)) {
    throw new Error('Déplacement invalide');
  }

  if (fromIndex === toIndex) return true;

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

  if (!currentDays.length) return true;
  if (fromIndex < 0 || fromIndex >= currentDays.length) throw new Error('Jour source introuvable');
  if (toIndex < 0 || toIndex >= currentDays.length) throw new Error('Date hors voyage');

  const baseISO = trip.start_date || currentDays[0].date_iso;

  if (!baseISO) {
    throw new Error('Date de départ du voyage manquante');
  }

  const nextDays = currentDays.slice();
  const moved = nextDays.splice(fromIndex, 1)[0];
  nextDays.splice(toIndex, 0, moved);

  // Phase 1 : index temporaires pour éviter les collisions éventuelles
  await Promise.all(nextDays.map(function(day, index) {
    return sb
      .from('trip_days')
      .update({
        day_index: 10000 + index
      })
      .eq('id', day.id);
  }));

  // Phase 2 : index définitifs + dates recalculées dans le cadre fixe
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

export async function deleteTrip(tripId) {
  const { error } = await sb.from('trips').delete().eq('id', tripId);
  if (error) throw error;
}

// ─── Réordonnement des étapes (drag & drop / tri horaire) ──
export async function reorderSteps(steps) {
  const promises = steps.map(s =>
    sb.from('trip_steps').update({ step_index: s.stepIndex }).eq('id', s.id)
  );
  const results = await Promise.all(promises);
  const err = results.find(r => r.error);
  if (err && err.error) throw err.error;
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
    .select('token, role, expires_at')
    .single();

  if (error) throw error;

  return {
    token: data.token,
    role: data.role,
    expiresAt: data.expires_at,
    url: `${window.location.origin}${window.location.pathname}?invite=${data.token}`
  };
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
  signIn,
  signOut,

  listMyTrips,
  createTrip,
  loadTrip,
  updateTrip,
  searchTripCoverPhotos,
  saveDayCover,
  updateDayCoverCrop,
  updateDay,
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
  getInvite,
  acceptInvite,
  removeTripMember,
  listTripActivity,

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
