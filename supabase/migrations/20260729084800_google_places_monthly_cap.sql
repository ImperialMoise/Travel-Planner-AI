-- Les appels Google Places sont bloqués à 9 000 par mois
-- pour l'ensemble de l'application, avant tout appel à Google.

DROP FUNCTION IF EXISTS public.consume_places_search_quota(
  text, uuid, text, text, text, integer, integer
);

CREATE OR REPLACE FUNCTION public.consume_places_search_quota(
  p_actor_key text,
  p_user_id uuid,
  p_ip_hash text,
  p_provider text,
  p_endpoint text,
  p_monthly_limit integer
)
RETURNS TABLE (
  allowed boolean,
  reason text,
  user_count integer,
  global_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage_day date := CURRENT_DATE;
  v_month_start date := date_trunc('month', CURRENT_DATE)::date;
  v_global_monthly_limit constant integer := 9000;
  v_user_count integer := 0;
  v_global_count integer := 0;
BEGIN
  IF p_actor_key IS NULL OR btrim(p_actor_key) = '' THEN
    RAISE EXCEPTION 'actor_key requis';
  END IF;

  IF p_user_id IS NULL AND (p_ip_hash IS NULL OR btrim(p_ip_hash) = '') THEN
    RAISE EXCEPTION 'user_id ou ip_hash requis';
  END IF;

  IF p_monthly_limit < 1 THEN
    RAISE EXCEPTION 'limite utilisateur invalide';
  END IF;

  -- Une seule réservation de quota à la fois pour Google Places.
  PERFORM pg_advisory_xact_lock(
    hashtext(p_provider || ':' || v_month_start::text)
  );

  SELECT COALESCE(SUM(count), 0)::integer
  INTO v_user_count
  FROM public.api_usage
  WHERE usage_day >= v_month_start
    AND actor_key = p_actor_key
    AND provider = p_provider;

  SELECT COALESCE(SUM(count), 0)::integer
  INTO v_global_count
  FROM public.api_usage
  WHERE usage_day >= v_month_start
    AND provider = p_provider;

  IF v_user_count >= p_monthly_limit THEN
    RETURN QUERY
    SELECT false, 'monthly_limit_reached', v_user_count, v_global_count;
    RETURN;
  END IF;

  IF v_global_count >= v_global_monthly_limit THEN
    RETURN QUERY
    SELECT false, 'global_monthly_limit_reached', v_user_count, v_global_count;
    RETURN;
  END IF;

  INSERT INTO public.api_usage (
    usage_day,
    actor_key,
    user_id,
    ip_hash,
    provider,
    endpoint,
    count,
    updated_at
  )
  VALUES (
    v_usage_day,
    p_actor_key,
    p_user_id,
    p_ip_hash,
    p_provider,
    p_endpoint,
    1,
    now()
  )
  ON CONFLICT (usage_day, actor_key, provider, endpoint)
  DO UPDATE SET
    count = public.api_usage.count + 1,
    updated_at = now();

  RETURN QUERY
  SELECT true, 'ok', v_user_count + 1, v_global_count + 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_places_search_usage(
  p_actor_key text,
  p_provider text,
  p_monthly_limit integer
)
RETURNS TABLE (
  user_count integer,
  user_limit integer,
  global_count integer,
  global_limit integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start date := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  IF p_actor_key IS NULL OR btrim(p_actor_key) = '' THEN
    RAISE EXCEPTION 'actor_key requis';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE((
      SELECT SUM(count)::integer
      FROM public.api_usage
      WHERE usage_day >= v_month_start
        AND actor_key = p_actor_key
        AND provider = p_provider
    ), 0),
    p_monthly_limit,
    COALESCE((
      SELECT SUM(count)::integer
      FROM public.api_usage
      WHERE usage_day >= v_month_start
        AND provider = p_provider
    ), 0),
    9000;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_places_search_quota(
  text, uuid, text, text, text, integer
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.consume_places_search_quota(
  text, uuid, text, text, text, integer
) TO service_role;

REVOKE ALL ON FUNCTION public.get_places_search_usage(
  text, text, integer
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_places_search_usage(
  text, text, integer
) TO service_role;