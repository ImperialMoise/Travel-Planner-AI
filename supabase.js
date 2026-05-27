// ═══════════════════════════════════════════
// supabase.js — module de synchronisation
// ═══════════════════════════════════════════

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://mzohsmpqhsibzqjupoos.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16b2hzbXBxaHNpYnpxanVwb29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDE1MDAsImV4cCI6MjA5NTQ3NzUwMH0.ioBfWZh6JY-zNdyS5okIk8KXIHoyg6C45icyxYtsNM4';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Auth ────────────────────────────────────
export async function signUp(email, password) {
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
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

export async function getUser() {
  const { data } = await sb.auth.getUser();
  return data.user;
}

// ─── Charger un voyage complet ───────────────
export async function loadTrip(tripId) {
  const [
    { data: trip },
    { data: days },
    { data: steps },
    { data: budget },
    { data: docs },
    { data: participants },
    { data: members }
  ] = await Promise.all([
    sb.from('trips').select('*').eq('id', tripId).single(),
    sb.from('trip_days').select('*').eq('trip_id', tripId).order('day_index'),
    sb.from('trip_steps').select('*').eq('trip_id', tripId).order('step_index'),
    sb.from('budget_items').select('*').eq('trip_id', tripId),
    sb.from('documents').select('*').eq('trip_id', tripId),
    sb.from('trip_participants').select('*').eq('trip_id', tripId).order('sort_index'),
    sb.from('trip_members').select('*, profiles(display_name, email)').eq('trip_id', tripId)
  ]);

  // Reconstituer la structure de state attendue par app.js
  const daysWithSteps = (days || []).map(day => ({
    ...day,
    steps: (steps || [])
      .filter(s => s.day_id === day.id)
      .sort((a, b) => a.step_index - b.step_index)
      .map(dbStepToLocal)
  }));

  return {
    trip: { ...trip, days: daysWithSteps },
    budget: (budget || []).map(dbBudgetToLocal),
    docs: docs || [],
    participants: (participants || []).map(p => p.name),
    members: members || []
  };
}

// ─── Upsert un voyage (nom, dates) ──────────
export async function upsertTrip(trip) {
  const { data, error } = await sb.from('trips').upsert({
    id: trip.supabaseId || undefined,
    name: trip.name,
    start_date: trip.startDate || null,
    owner_id: (await getUser()).id
  }, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return data;
}

// ─── Upsert un jour ─────────────────────────
export async function upsertDay(tripId, day, dayIndex) {
  const { data, error } = await sb.from('trip_days').upsert({
    id: day.supabaseId || undefined,
    trip_id: tripId,
    day_index: dayIndex,
    title: day.title || '',
    note: day.note || '',
    date_label: day.dateLabel || '',
    date_iso: day.dateISO || null
  }, { onConflict: 'trip_id,day_index' }).select().single();
  if (error) throw error;
  return data;
}

// ─── Upsert une étape ────────────────────────
export async function upsertStep(tripId, dayId, step, stepIndex) {
  const user = await getUser();
  const { data, error } = await sb.from('trip_steps').upsert({
    id: step.supabaseId || undefined,
    trip_id: tripId,
    day_id: dayId,
    step_index: stepIndex,
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
    amount: step.amount || 0,
    paid_by: step.paidBy || '',
    created_by: user?.id
  }, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return data;
}

// ─── Supprimer une étape ─────────────────────
export async function deleteStep(stepSupabaseId) {
  const { error } = await sb.from('trip_steps').delete().eq('id', stepSupabaseId);
  if (error) throw error;
}

// ─── Upsert budget item ──────────────────────
export async function upsertBudgetItem(tripId, item) {
  const user = await getUser();
  const { data, error } = await sb.from('budget_items').upsert({
    id: item.supabaseId || undefined,
    trip_id: tripId,
    step_id: item.stepSupabaseId || null,
    cat: item.cat || 'Divers',
    description: item.desc || '',
    amount: item.amount || 0,
    paid_by: item.paidBy || '',
    for_participants: item.forParticipants || ['__all__'],
    created_by: user?.id
  }, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return data;
}

// ─── Invitation par lien token ────────────────
export async function createInviteLink(tripId, role = 'editor') {
  const user = await getUser();
  const { data, error } = await sb.from('trip_invites').insert({
    trip_id: tripId,
    role,
    created_by: user.id
  }).select().single();
  if (error) throw error;
  const url = `${location.origin}${location.pathname}?invite=${data.token}`;
  return url;
}

export async function acceptInvite(token) {
  const user = await getUser();
  if (!user) throw new Error('Connexion requise');

  // Récupérer l'invitation
  const { data: invite, error } = await sb.from('trip_invites')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();
  if (error || !invite) throw new Error('Invitation invalide ou expirée');

  // Ajouter le membre
  await sb.from('trip_members').upsert({
    trip_id: invite.trip_id,
    user_id: user.id,
    role: invite.role
  }, { onConflict: 'trip_id,user_id' });

  // Marquer l'invitation comme utilisée
  await sb.from('trip_invites').update({
    used_by: user.id,
    used_at: new Date().toISOString()
  }).eq('id', invite.id);

  return invite.trip_id;
}

// ─── Temps réel ──────────────────────────────
let _realtimeChannel = null;

export function subscribeToTrip(tripId, callbacks) {
  if (_realtimeChannel) {
    sb.removeChannel(_realtimeChannel);
  }

  _realtimeChannel = sb.channel(`trip:${tripId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'trip_steps',
      filter: `trip_id=eq.${tripId}`
    }, payload => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        callbacks.onStepUpserted?.(dbStepToLocal(payload.new));
      } else if (payload.eventType === 'DELETE') {
        callbacks.onStepDeleted?.(payload.old.id);
      }
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'budget_items',
      filter: `trip_id=eq.${tripId}`
    }, payload => {
      callbacks.onBudgetChanged?.();
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'trip_days',
      filter: `trip_id=eq.${tripId}`
    }, payload => {
      callbacks.onDayUpdated?.(payload.new);
    })
    .subscribe();

  return _realtimeChannel;
}

export function unsubscribeFromTrip() {
  if (_realtimeChannel) {
    sb.removeChannel(_realtimeChannel);
    _realtimeChannel = null;
  }
}

// ─── Conversions DB → local ──────────────────
function dbStepToLocal(s) {
  return {
    supabaseId: s.id,
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
    escales: s.escales || [],
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
    paidBy: s.paid_by
  };
}

function dbBudgetToLocal(b) {
  return {
    supabaseId: b.id,
    stepSupabaseId: b.step_id,
    cat: b.cat,
    desc: b.description,
    amount: b.amount,
    paidBy: b.paid_by,
    forParticipants: b.for_participants || ['__all__']
  };
}
