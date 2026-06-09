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
    ownerId: trip.owner_id,
    days: (days ?? []).map(d => ({
      id: d.id,
      index: d.day_index,
      title: d.title || '',
      note: d.note || '',
      dateLabel: d.date_label || '',
      dateISO: d.date_iso,
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

  const { data, error } = await sb
    .from('trips')
    .update(row)
    .eq('id', tripId)
    .select()
    .single();

  if (error) throw error;
  return data;
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
    lat: step.lat || null,
    lng: step.lng || null,
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
  const { data, error } = await sb.from('trip_participants')
    .insert({ trip_id: tripId, name, sort_index: sortIndex })
    .select().single();
  if (error) throw error;
  return data;
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

  const invite = await getInvite(token);

  if (invite.usedAt) throw new Error('Invitation déjà utilisée');
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    throw new Error('Invitation expirée');
  }

  const { error: memberError } = await sb
    .from('trip_members')
    .upsert({
      trip_id: invite.tripId,
      user_id: user.id,
      role: invite.role || 'editor'
    }, { onConflict: 'trip_id,user_id' });

  if (memberError) throw memberError;

  await sb
    .from('trip_invites')
    .update({
      used_by: user.id,
      used_at: new Date().toISOString()
    })
    .eq('id', invite.id);

  return invite.tripId;
}

export async function removeTripMember(memberId) {
  const { error } = await sb
    .from('trip_members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
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
    lng: s.lng
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
