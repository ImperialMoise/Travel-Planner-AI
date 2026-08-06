import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Configuration Supabase manquante." }, 500);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "");

  if (!accessToken) {
    return json({ error: "Connexion requise." }, 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const confirmation = String(body.confirmation || "").trim();
    const password = String(body.password || "");

    if (confirmation !== "SUPPRIMER") {
      return json({
        error: "Écris exactement SUPPRIMER pour confirmer.",
      }, 400);
    }

    if (!password) {
      return json({
        error: "Indique ton mot de passe actuel.",
      }, 400);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(accessToken);

    if (userError || !user || !user.email) {
      return json({
        error: "Session invalide ou expirée.",
      }, 401);
    }

    const passwordClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const {
      data: passwordData,
      error: passwordError,
    } = await passwordClient.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (
      passwordError ||
      !passwordData.user ||
      passwordData.user.id !== user.id
    ) {
      return json({
        error: "Le mot de passe actuel est incorrect.",
      }, 403);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const {
      data: ownedTrips,
      error: ownedTripsError,
    } = await admin
      .from("trips")
      .select("id")
      .eq("owner_id", user.id);

    if (ownedTripsError) throw ownedTripsError;

    const ownedTripIds = (ownedTrips || []).map((trip) => trip.id);

    if (ownedTripIds.length > 0) {
      const {
        data: documents,
        error: documentsError,
      } = await admin
        .from("trip_documents")
        .select("file_path")
        .in("trip_id", ownedTripIds);

      if (documentsError) throw documentsError;

      const documentPaths = (documents || [])
        .map((document) => document.file_path)
        .filter(Boolean);

      for (
        let index = 0;
        index < documentPaths.length;
        index += 100
      ) {
        const paths = documentPaths.slice(index, index + 100);

        const { error: storageError } = await admin.storage
          .from("trip-documents")
          .remove(paths);

        if (storageError) throw storageError;
      }
    }

    const cleanupResults = await Promise.all([
      admin
        .from("trip_steps")
        .update({ created_by: null })
        .eq("created_by", user.id),

      admin
        .from("budget_items")
        .update({ created_by: null })
        .eq("created_by", user.id),

      admin
        .from("trip_documents")
        .update({ created_by: null })
        .eq("created_by", user.id),

      admin
        .from("trip_invites")
        .update({ created_by: null })
        .eq("created_by", user.id),

      admin
        .from("trip_invites")
        .update({ used_by: null })
        .eq("used_by", user.id),
    ]);

    for (const result of cleanupResults) {
      if (result.error) throw result.error;
    }

    const { error: deleteError } =
      await admin.auth.admin.deleteUser(user.id);

    if (deleteError) throw deleteError;

    return json({
      success: true,
      message: "Compte supprimé définitivement.",
    });
  } catch (error) {
    console.error("delete-account:", error);

    return json({
      error:
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le compte.",
    }, 500);
  }
});