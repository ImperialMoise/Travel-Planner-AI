import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SearchBody = {
  action?: "search" | "usage";
  provider?: "basic" | "google";
  query?: string;
  language?: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  limit?: number;
};

const GOOGLE_PROVIDER = "google_places";
const BASIC_PROVIDER = "geoapify";
const GOOGLE_GLOBAL_MONTHLY_LIMIT = 9000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function normalizeQuery(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  ).split(",")[0].trim();
}

async function getUserFromRequest(
  req: Request,
  supabaseUrl: string,
  anonKey: string,
) {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return null;

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data } = await client.auth.getUser();
  return data.user || null;
}

function firstRow<T>(value: T[] | T | null) {
  return Array.isArray(value) ? value[0] || null : value;
}

function formatUsage(row: any, warnRatio: number) {
  const count = Number(row?.user_count || 0);
  const limit = Number(row?.user_limit || 100);
  const globalCount = Number(row?.global_count || 0);
  const globalLimit = Number(row?.global_limit || GOOGLE_GLOBAL_MONTHLY_LIMIT);

  return {
    count,
    limit,
    warn: count >= Math.floor(limit * warnRatio) && count < limit,
    reached: count >= limit,
    globalCount,
    globalLimit,
    globalReached: globalCount >= globalLimit,
  };
}

async function getGoogleUsage(admin: any, actorKey: string, userLimit: number) {
  const { data, error } = await admin.rpc("get_places_search_usage", {
    p_actor_key: actorKey,
    p_provider: GOOGLE_PROVIDER,
    p_monthly_limit: userLimit,
  });

  if (error) throw error;
  return firstRow(data);
}

async function reserveGoogleQuota(
  admin: any,
  actorKey: string,
  userId: string | null,
  ipHash: string | null,
  userLimit: number,
) {
  const { data, error } = await admin.rpc("consume_places_search_quota", {
    p_actor_key: actorKey,
    p_user_id: userId,
    p_ip_hash: ipHash,
    p_provider: GOOGLE_PROVIDER,
    p_endpoint: "text_search",
    p_monthly_limit: userLimit,
  });

  if (error) throw error;
  return firstRow(data);
}

async function callGooglePlacesTextSearch(params: {
  query: string;
  language: string;
  lat: number | null;
  lng: number | null;
  limit: number;
}) {
  const key = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY manquante");

  const body: Record<string, unknown> = {
    textQuery: params.query,
    languageCode: params.language || "fr",
    maxResultCount: Math.max(1, Math.min(params.limit, 5)),
  };

  if (
    typeof params.lat === "number" &&
    Number.isFinite(params.lat) &&
    typeof params.lng === "number" &&
    Number.isFinite(params.lng)
  ) {
    body.locationBias = {
      circle: {
        center: { latitude: params.lat, longitude: params.lng },
        radius: 50000,
      },
    };
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw new Error("Google Places error: " + await response.text());
  }

  const data = await response.json();

  return (data.places || []).map((place: any) => ({
    provider: GOOGLE_PROVIDER,
    placeId: place.id || "",
    label: place.displayName?.text || place.formattedAddress || "Lieu",
    address: place.formattedAddress || "",
    city: "",
    country: "",
    postcode: "",
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    categories: place.primaryType ? [place.primaryType] : [],
  }));
}

async function callGeoapifyAutocomplete(params: {
  query: string;
  language: string;
  country: string;
  lat: number | null;
  lng: number | null;
  limit: number;
}) {
  const key = Deno.env.get("GEOAPIFY_API_KEY");
  if (!key) throw new Error("GEOAPIFY_API_KEY manquante");

  const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
  url.searchParams.set("text", params.query);
  url.searchParams.set("format", "json");
  url.searchParams.set("lang", params.language || "fr");
  url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 5))));
  url.searchParams.set("apiKey", key);

  if (params.country && /^[a-z]{2}$/i.test(params.country)) {
    url.searchParams.set("filter", "countrycode:" + params.country.toLowerCase());
  }

  if (
    typeof params.lat === "number" &&
    Number.isFinite(params.lat) &&
    typeof params.lng === "number" &&
    Number.isFinite(params.lng)
  ) {
    url.searchParams.set("bias", "proximity:" + params.lng + "," + params.lat);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Geoapify error: " + await response.text());
  }

  const data = await response.json();

  return (data.results || []).map((place: any) => ({
    provider: BASIC_PROVIDER,
    placeId: String(place.place_id || ""),
    label: place.name || place.address_line1 || place.formatted || "Lieu",
    address: place.formatted || "",
    city: place.city || place.town || place.village || "",
    country: place.country || "",
    postcode: place.postcode || "",
    lat: place.lat ?? null,
    lng: place.lon ?? null,
    categories: [],
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Configuration Supabase manquante" }, 500);
  }

  try {
    const body = (await req.json()) as SearchBody;
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const user = await getUserFromRequest(req, supabaseUrl, anonKey);

    const { data: settingsRow } = await admin
      .from("api_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle();

    const settings = settingsRow || {
      places_enriched_enabled: true,
      places_free_user_monthly_limit: 100,
      places_warn_ratio: 0.8,
      places_allow_anonymous: false,
    };

    const userLimit = Number(settings.places_free_user_monthly_limit || 100);
    const warnRatio = Number(settings.places_warn_ratio || 0.8);
    const requestedProvider = body.provider === "google"
      ? GOOGLE_PROVIDER
      : BASIC_PROVIDER;
    const useGoogle = requestedProvider === GOOGLE_PROVIDER;

    if (!user && !settings.places_allow_anonymous) {
      return json({
        provider: requestedProvider,
        mode: "login_required",
        results: [],
        usage: null,
        message: "Connecte-toi pour utiliser la recherche de lieux.",
      });
    }

    const ipHash = user ? null : await sha256(getClientIp(req));
    const actorKey = user ? "user:" + user.id : "ip:" + ipHash;

    if (body.action === "usage") {
      const usageRow = await getGoogleUsage(admin, actorKey, userLimit);

      return json({
        provider: GOOGLE_PROVIDER,
        mode: "usage",
        results: [],
        usage: formatUsage(usageRow, warnRatio),
      });
    }

    const query = normalizeQuery(body.query || "");

    if (query.length < 3) {
      return json({
        provider: requestedProvider,
        mode: "too_short",
        results: [],
        usage: null,
      });
    }

    if (!useGoogle) {
      const results = await callGeoapifyAutocomplete({
        query,
        language: body.language || "fr",
        country: body.country || "",
        lat: typeof body.lat === "number" ? body.lat : null,
        lng: typeof body.lng === "number" ? body.lng : null,
        limit: Number(body.limit || 5),
      });

      return json({
        provider: BASIC_PROVIDER,
        mode: "basic",
        results,
        usage: null,
      });
    }

    if (!settings.places_enriched_enabled) {
      return json({
        provider: GOOGLE_PROVIDER,
        mode: "disabled",
        results: [],
        usage: null,
        message: "Google Places est temporairement désactivé.",
      });
    }

    const quota = await reserveGoogleQuota(
      admin,
      actorKey,
      user?.id || null,
      ipHash,
      userLimit,
    );

    const usage = formatUsage({
      user_count: quota?.user_count,
      user_limit: userLimit,
      global_count: quota?.global_count,
      global_limit: GOOGLE_GLOBAL_MONTHLY_LIMIT,
    }, warnRatio);

    if (!quota?.allowed) {
      return json({
        provider: GOOGLE_PROVIDER,
        mode: quota?.reason || "limit_reached",
        results: [],
        usage,
        message: quota?.reason === "global_monthly_limit_reached"
          ? "Le quota global mensuel de recherche est atteint."
          : "Ta limite mensuelle Google Places est atteinte.",
      });
    }

    const results = await callGooglePlacesTextSearch({
      query,
      language: body.language || "fr",
      lat: typeof body.lat === "number" ? body.lat : null,
      lng: typeof body.lng === "number" ? body.lng : null,
      limit: Number(body.limit || 5),
    });

    return json({
      provider: GOOGLE_PROVIDER,
      mode: "enriched",
      results,
      usage,
    });
  } catch (error) {
    return json({
      provider: "error",
      mode: "error",
      results: [],
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});