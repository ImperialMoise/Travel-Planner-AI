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
    .select('id, name, start_date, owner_id, updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTrip({ name, startDate, days }) {
  const user = await getUser();
  if (!user) throw new Error('Connexion requise');

  // 1. Créer le voyage
  const { data: trip, error } = await sb.from('trips').insert({
    name,
    start_date: startDate || null,
    owner_id: user.id
  }).select().single();
  if (error) throw error;

  // 2. Créer les jours
  const dayRows = Array.from({ length: days }, (_, i) => {
    let dateISO = null, dateLabel = '';
    if (startDate) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dateISO = d.toISOString().slice(0, 10);
      dateLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
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
    { data: trip,  error: e1 },
    { data: days,  error: e2 },
    { data: steps, error: e3 }
  ] = await Promise.all([
    sb.from('trips').select('*').eq('id', tripId).single(),
    sb.from('trip_days').select('*').eq('trip_id', tripId).order('day_index'),
    sb.from('trip_steps').select('*').eq('trip_id', tripId).order('day_id, step_index')
  ]);
  if (e1) throw e1;

  return {
    id: trip.id,
    name: trip.name,
    startDate: trip.start_date,
    ownerId: trip.owner_id,
    days: (days ?? []).map(d => ({
      id: d.id,
      index: d.day_index,
      title: d.title || '',
      note: d.note || '',
      dateLabel: d.date_label || '',
      dateISO: d.date_iso,
      steps: (steps ?? []).filter(s => s.day_id === d.id).map(dbStepToLocal)
    }))
  };
}

export async function deleteTrip(tripId) {
  const { error } = await sb.from('trips').delete().eq('id', tripId);
  if (error) throw error;
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
    amount: step.amount || 0,
    paid_by: step.paidBy || ''
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

// ─── Realtime ──────────────────────────────────────────────
let _channel = null;
export function subscribeTrip(tripId, onChange) {
  if (_channel) sb.removeChannel(_channel);
  _channel = sb.channel(`trip:${tripId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_steps', filter: `trip_id=eq.${tripId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_days',  filter: `trip_id=eq.${tripId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trips',      filter: `id=eq.${tripId}` },      onChange)
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
    paidBy: s.paid_by
  };
}
