import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SearchBody = {
  query?: string;
  language?: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  type?: string;
  limit?: number;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizeQuery(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function gridCoord(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  ).split(",")[0].trim();
}

async function getUserFromRequest(req: Request, supabaseUrl: string, anonKey: string) {
  const authHeader = req.headers.get("Authorization") || "";

  if (!authHeader) return null;

  const client = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const { data } = await client.auth.getUser();
  return data.user || null;
}

function mapTypeToGeoapify(type: string) {
  const t = String(type || "").toLowerCase();

  if (t === "restaurant" || t === "table") return "catering.restaurant";
  if (t === "cafe") return "catering.cafe";
  if (t === "hotel" || t === "logement") return "accommodation.hotel";
  if (t === "museum" || t === "musee") return "entertainment.museum";
  if (t === "activity" || t === "activite") return "tourism,entertainment";
  if (t === "transport") return "public_transport";
  if (t === "shop" || t === "shopping") return "commercial";

  return "";
}

async function callGeoapifyAutocomplete(params: {
  query: string;
  language: string;
  country: string;
  lat: number | null;
  lng: number | null;
  type: string;
  limit: number;
}) {
  const key = Deno.env.get("GEOAPIFY_API_KEY");
  if (!key) throw new Error("GEOAPIFY_API_KEY manquante");

  const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");

  url.searchParams.set("text", params.query);
  url.searchParams.set("apiKey", key);
  url.searchParams.set("lang", params.language || "fr");
  url.searchParams.set("limit", String(params.limit || 5));

  if (params.country) {
    url.searchParams.set("filter", "countrycode:" + params.country.toLowerCase());
  }

  if (typeof params.lat === "number" && typeof params.lng === "number") {
    url.searchParams.set("bias", "proximity:" + params.lng + "," + params.lat);
  }

  const category = mapTypeToGeoapify(params.type);
  if (category) {
    url.searchParams.set("type", "amenity");
  }

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Geoapify autocomplete error: " + text);
  }

  const data = await res.json();

  return ((data && data.features) || []).map((feature: any) => {
    const p = feature.properties || {};
    const coords = feature.geometry && feature.geometry.coordinates || [];

    return {
      provider: "geoapify",
      placeId: p.place_id || p.datasource?.raw?.osm_id || p.formatted,
      label: p.name || p.address_line1 || p.formatted || "Lieu",
      address: p.formatted || p.address_line2 || "",
      city: p.city || p.town || p.village || "",
      country: p.country || "",
      postcode: p.postcode || "",
      lat: coords[1] ?? p.lat ?? null,
      lng: coords[0] ?? p.lon ?? null,
      categories: p.categories || [],
      raw: {
        place_id: p.place_id || null,
        datasource: p.datasource || null,
      },
    };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders
    });
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

  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = (await req.json()) as SearchBody;

    const query = normalizeQuery(body.query || "");
    const language = body.language || "fr";
    const country = body.country || "";
    const lat = typeof body.lat === "number" ? body.lat : null;
    const lng = typeof body.lng === "number" ? body.lng : null;
    const type = body.type || "place";
    const limit = Math.max(1, Math.min(Number(body.limit || 5), 10));

    if (query.length < 3) {
      return json({
        provider: "geoapify",
        mode: "too_short",
        results: [],
        usage: null,
      });
    }

    const user = await getUserFromRequest(req, supabaseUrl, anonKey);
    const ip = getClientIp(req);
    const ipHash = await sha256(ip);

    const now = new Date();
    const usageDay = now.toISOString().slice(0, 10);
    const usageMonth = now.toISOString().slice(0, 7);

    const { data: settingsRow } = await admin
      .from("api_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle();

    const settings = settingsRow || {
      places_provider: "geoapify",
      places_enriched_enabled: true,
      places_free_user_monthly_limit: 100,
      places_global_daily_limit: 2500,
      places_warn_ratio: 0.8,
      places_allow_anonymous: false,
      places_cache_days: 30,
    };

    if (!settings.places_enriched_enabled) {
      return json({
        provider: "none",
        mode: "disabled",
        results: [],
        usage: null,
        message: "Recherche enrichie désactivée.",
      });
    }

    if (!user && !settings.places_allow_anonymous) {
      return json({
        provider: "none",
        mode: "login_required",
        results: [],
        usage: null,
        message: "Connecte-toi pour utiliser la recherche enrichie.",
      });
    }

    const cacheKey = await sha256(
      JSON.stringify({
        provider: "geoapify",
        endpoint: "autocomplete",
        query,
        language,
        country,
        lat: gridCoord(lat),
        lng: gridCoord(lng),
        type,
        limit,
      }),
    );

    const { data: cached } = await admin
      .from("places_cache")
      .select("results, expires_at, provider")
      .eq("cache_key", cacheKey)
      .gt("expires_at", now.toISOString())
      .maybeSingle();

    if (cached) {
      return json({
        provider: cached.provider,
        mode: "cache",
        results: cached.results,
        usage: null,
      });
    }

    const userLimit = Number(settings.places_free_user_monthly_limit || 100);

    const { data: currentUsage } = await admin
      .from("api_usage")
      .select("count")
      .eq("usage_month", usageMonth)
      .eq("provider", "geoapify")
      .eq("endpoint", "places-search")
      .eq(user ? "user_id" : "ip_hash", user ? user.id : ipHash)
      .maybeSingle();

    const userCount = currentUsage?.count || 0;

    if (userCount >= userLimit) {
      return json({
        provider: "geoapify",
        mode: "monthly_limit_reached",
        results: [],
        usage: {
          count: userCount,
          limit: userLimit,
          warn: false,
          reached: true,
        },
        message: "Limite mensuelle de recherche enrichie atteinte.",
      });
    }

    const { data: globalRows } = await admin
      .from("api_usage")
      .select("count")
      .eq("usage_day", usageDay)
      .eq("provider", "geoapify")
      .eq("endpoint", "places-search");

    const globalCount = (globalRows || []).reduce(
      (sum: number, row: any) => sum + (row.count || 0),
      0,
    );

    if (globalCount >= Number(settings.places_global_daily_limit || 2500)) {
      return json({
        provider: "geoapify",
        mode: "global_limit_reached",
        results: [],
        usage: {
          count: userCount,
          limit: userLimit,
          warn: false,
          reached: false,
        },
        message: "Limite globale quotidienne atteinte.",
      });
    }

    const results = await callGeoapifyAutocomplete({
      query,
      language,
      country,
      lat,
      lng,
      type,
      limit,
    });

    await admin
      .from("api_usage")
      .upsert({
        usage_day: usageDay,
        usage_month: usageMonth,
        user_id: user ? user.id : null,
        ip_hash: user ? null : ipHash,
        provider: "geoapify",
        endpoint: "places-search",
        count: userCount + 1,
        updated_at: now.toISOString(),
      }, {
        onConflict: "usage_month,user_id,ip_hash,provider,endpoint",
      });

    const cacheDays = Number(settings.places_cache_days || 30);
    const expiresAt = new Date(Date.now() + cacheDays * 24 * 60 * 60 * 1000).toISOString();

    await admin
      .from("places_cache")
      .upsert({
        cache_key: cacheKey,
        provider: "geoapify",
        endpoint: "autocomplete",
        query,
        params: {
          language,
          country,
          lat: gridCoord(lat),
          lng: gridCoord(lng),
          type,
          limit,
        },
        results,
        expires_at: expiresAt,
      });

    const nextCount = userCount + 1;
    const warnAt = Math.floor(userLimit * Number(settings.places_warn_ratio || 0.8));

    return json({
      provider: "geoapify",
      mode: "enriched",
      results,
      usage: {
        count: nextCount,
        limit: userLimit,
        warn: nextCount >= warnAt && nextCount < userLimit,
        reached: nextCount >= userLimit,
      },
    });
  } catch (error) {
    return json({
      provider: "geoapify",
      mode: "error",
      results: [],
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});