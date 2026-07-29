import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SearchBody = {
  tripId?: string;
  query?: string;
};

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

function normalizeQuery(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const pexelsKey = Deno.env.get("PEXELS_API_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !pexelsKey) {
      return json({ error: "Configuration photo manquante." }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData } = await userClient.auth.getUser();
    const user = userData.user;

    if (!user) {
      return json({ error: "Connexion requise." }, 401);
    }

    const body = (await req.json()) as SearchBody;
    const tripId = String(body.tripId || "").trim();
    const query = normalizeQuery(String(body.query || ""));

    if (!tripId || query.length < 2) {
      return json({ error: "Recherche photo invalide." }, 400);
    }

    const { data: trip, error: tripError } = await userClient
      .from("trips")
      .select("id")
      .eq("id", tripId)
      .maybeSingle();

    if (tripError || !trip) {
      return json({ error: "Voyage introuvable ou non autorisé." }, 403);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const cacheKey = await sha256("pexels:v1:" + query.toLowerCase());

    const { data: cached } = await admin
      .from("trip_cover_search_cache")
      .select("results")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached && Array.isArray(cached.results)) {
      return json({ results: cached.results, cached: true });
    }

    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "4");
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("locale", "fr-FR");

    const response = await fetch(url, {
      headers: { Authorization: pexelsKey },
    });

    if (!response.ok) {
      console.error("Pexels error", response.status);
      return json({ error: "Pexels ne répond pas pour le moment." }, 502);
    }

    const payload = await response.json();

    const results = (payload.photos || [])
      .map((photo: any) => ({
        id: String(photo.id || ""),
        imageUrl:
          photo.src?.large2x ||
          photo.src?.large ||
          photo.src?.landscape ||
          photo.src?.original ||
          "",
        alt: String(photo.alt || query),
        photographer: String(photo.photographer || "Pexels"),
        photographerUrl: String(photo.photographer_url || ""),
        sourceUrl: String(photo.url || ""),
      }))
      .filter((photo: any) => photo.id && photo.imageUrl && photo.sourceUrl);

    await admin.from("trip_cover_search_cache").upsert(
      {
        cache_key: cacheKey,
        query,
        results,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "cache_key" },
    );

    return json({ results, cached: false });
  } catch (error) {
    console.error("trip-cover-search error", error);
    return json({ error: "Recherche photo impossible." }, 500);
  }
});