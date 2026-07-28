ALTER TABLE public.api_usage
ADD COLUMN IF NOT EXISTS actor_key text;

UPDATE public.api_usage
SET actor_key = CASE
  WHEN user_id IS NOT NULL THEN 'user:' || user_id::text
  ELSE 'ip:' || COALESCE(ip_hash, 'unknown')
END
WHERE actor_key IS NULL;

ALTER TABLE public.api_usage
ALTER COLUMN actor_key SET NOT NULL;

DROP INDEX IF EXISTS public.api_usage_usage_day_user_id_ip_hash_provider_endpoint_key;

CREATE UNIQUE INDEX IF NOT EXISTS api_usage_daily_actor_provider_endpoint_key
ON public.api_usage (usage_day, actor_key, provider, endpoint);

CREATE INDEX IF NOT EXISTS api_usage_monthly_actor_provider_endpoint_key
ON public.api_usage (actor_key, provider, endpoint, usage_day);

CREATE INDEX IF NOT EXISTS api_usage_user_id_key
ON public.api_usage (user_id)
WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.consume_places_search_quota(
  p_actor_key text,
  p_user_id uuid,
  p_ip_hash text,
  p_provider text,
  p_endpoint text,
  p_monthly_limit integer,
  p_global_daily_limit integer
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
  v_user_count integer := 0;
  v_global_count integer := 0;
BEGIN
  IF p_actor_key IS NULL OR btrim(p_actor_key) = '' THEN
    RAISE EXCEPTION 'actor_key requis';
  END IF;

  IF p_user_id IS NULL AND (p_ip_hash IS NULL OR btrim(p_ip_hash) = '') THEN
    RAISE EXCEPTION 'user_id ou ip_hash requis';
  END IF;

  IF p_monthly_limit < 1 OR p_global_daily_limit < 1 THEN
    RAISE EXCEPTION 'limites invalides';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext(p_provider || ':' || p_endpoint || ':' || v_usage_day::text)
  );

  SELECT COALESCE(SUM(count), 0)::integer
  INTO v_user_count
  FROM public.api_usage
  WHERE usage_day >= v_month_start
    AND actor_key = p_actor_key
    AND provider = p_provider
    AND endpoint = p_endpoint;

  SELECT COALESCE(SUM(count), 0)::integer
  INTO v_global_count
  FROM public.api_usage
  WHERE usage_day = v_usage_day
    AND provider = p_provider
    AND endpoint = p_endpoint;

  IF v_user_count >= p_monthly_limit THEN
    RETURN QUERY
    SELECT false, 'monthly_limit_reached', v_user_count, v_global_count;
    RETURN;
  END IF;

  IF v_global_count >= p_global_daily_limit THEN
    RETURN QUERY
    SELECT false, 'global_limit_reached', v_user_count, v_global_count;
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

REVOKE ALL ON FUNCTION public.consume_places_search_quota(
  text, uuid, text, text, text, integer, integer
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.consume_places_search_quota(
  text, uuid, text, text, text, integer, integer
) FROM anon;

REVOKE ALL ON FUNCTION public.consume_places_search_quota(
  text, uuid, text, text, text, integer, integer
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.consume_places_search_quota(
  text, uuid, text, text, text, integer, integer
) TO service_role;