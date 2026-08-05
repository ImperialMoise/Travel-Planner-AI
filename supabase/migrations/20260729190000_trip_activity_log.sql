CREATE TABLE IF NOT EXISTS public.trip_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trip_activity_trip_created_at_idx
ON public.trip_activity (trip_id, created_at DESC);

ALTER TABLE public.trip_activity ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.trip_activity TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.trip_activity FROM authenticated, anon;

DROP POLICY IF EXISTS "select_trip_activity" ON public.trip_activity;
CREATE POLICY "select_trip_activity"
ON public.trip_activity
FOR SELECT
TO authenticated
USING ((SELECT public.is_trip_member(trip_id)));

CREATE OR REPLACE FUNCTION public.log_trip_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_data jsonb;
  current_trip_id uuid;
  current_entity_id uuid;
  current_action text;
  current_details jsonb := '{}'::jsonb;
  member_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    row_data := to_jsonb(NEW);
  ELSE
    row_data := to_jsonb(OLD);
  END IF;

  IF TG_TABLE_NAME = 'trips' THEN
    current_trip_id := (row_data ->> 'id')::uuid;
  ELSE
    current_trip_id := (row_data ->> 'trip_id')::uuid;
  END IF;

  current_entity_id := (row_data ->> 'id')::uuid;

  IF TG_OP = 'DELETE' AND NOT EXISTS (
    SELECT 1 FROM public.trips WHERE id = current_trip_id
  ) THEN
    RETURN OLD;
  END IF;

  IF TG_TABLE_NAME = 'trip_members'
    AND TG_OP = 'INSERT'
    AND row_data ->> 'role' = 'owner' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
    AND TG_TABLE_NAME IN ('trips', 'trip_days', 'trip_steps')
    AND (to_jsonb(NEW) - 'updated_at') = (to_jsonb(OLD) - 'updated_at') THEN
    RETURN NEW;
  END IF;

  current_action := CASE TG_OP
    WHEN 'INSERT' THEN 'created'
    WHEN 'UPDATE' THEN 'updated'
    WHEN 'DELETE' THEN 'deleted'
  END;

  CASE TG_TABLE_NAME
    WHEN 'trips' THEN
      current_details := jsonb_build_object(
        'name', COALESCE(row_data ->> 'name', 'Voyage')
      );

    WHEN 'trip_days' THEN
      current_details := jsonb_build_object(
        'title', COALESCE(NULLIF(row_data ->> 'title', ''), row_data ->> 'date_label', 'Une journée')
      );

    WHEN 'trip_steps' THEN
      current_details := jsonb_build_object(
        'label', COALESCE(
          NULLIF(row_data ->> 'label', ''),
          NULLIF(row_data ->> 'lieu', ''),
          NULLIF(row_data ->> 'depart', ''),
          'Une étape'
        )
      );

    WHEN 'budget_items' THEN
      current_details := jsonb_build_object(
        'label', COALESCE(NULLIF(row_data ->> 'description', ''), row_data ->> 'cat', 'Une dépense'),
        'amount', COALESCE(row_data ->> 'amount', '0')
      );

    WHEN 'trip_documents' THEN
      current_details := jsonb_build_object(
        'label', COALESCE(row_data ->> 'name', 'Un document')
      );

    WHEN 'trip_participants' THEN
      current_details := jsonb_build_object(
        'label', COALESCE(row_data ->> 'name', 'Un participant')
      );

    WHEN 'trip_members' THEN
      SELECT COALESCE(display_name, email, 'Un membre')
      INTO member_name
      FROM public.profiles
      WHERE id = (row_data ->> 'user_id')::uuid;

      current_action := CASE TG_OP
        WHEN 'INSERT' THEN 'joined'
        ELSE 'left'
      END;

      current_details := jsonb_build_object(
        'member_name', COALESCE(member_name, 'Un membre'),
        'role', COALESCE(row_data ->> 'role', 'editor')
      );

    WHEN 'trip_invites' THEN
      current_details := jsonb_build_object(
        'role', COALESCE(row_data ->> 'role', 'editor')
      );
  END CASE;

  INSERT INTO public.trip_activity (
    trip_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    details
  )
  VALUES (
    current_trip_id,
    auth.uid(),
    current_action,
    TG_TABLE_NAME,
    current_entity_id,
    current_details
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.log_trip_activity() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.get_trip_activity(
  p_trip_id uuid,
  p_limit integer DEFAULT 40
)
RETURNS TABLE (
  id uuid,
  trip_id uuid,
  actor_id uuid,
  action text,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    activity.id,
    activity.trip_id,
    activity.actor_id,
    activity.action,
    activity.entity_type,
    activity.entity_id,
    activity.details,
    activity.created_at
  FROM public.trip_activity AS activity
  WHERE activity.trip_id = p_trip_id
    AND (SELECT public.is_trip_member(p_trip_id))
  ORDER BY activity.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 40), 1), 100);
$$;

REVOKE ALL ON FUNCTION public.get_trip_activity(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_trip_activity(uuid, integer) TO authenticated;

DROP TRIGGER IF EXISTS trip_activity_trips ON public.trips;
CREATE TRIGGER trip_activity_trips
AFTER INSERT OR UPDATE OR DELETE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.log_trip_activity();

DROP TRIGGER IF EXISTS trip_activity_days ON public.trip_days;
CREATE TRIGGER trip_activity_days
AFTER INSERT OR UPDATE OR DELETE ON public.trip_days
FOR EACH ROW EXECUTE FUNCTION public.log_trip_activity();

DROP TRIGGER IF EXISTS trip_activity_steps ON public.trip_steps;
CREATE TRIGGER trip_activity_steps
AFTER INSERT OR UPDATE OR DELETE ON public.trip_steps
FOR EACH ROW EXECUTE FUNCTION public.log_trip_activity();

DROP TRIGGER IF EXISTS trip_activity_budget ON public.budget_items;
CREATE TRIGGER trip_activity_budget
AFTER INSERT OR UPDATE OR DELETE ON public.budget_items
FOR EACH ROW EXECUTE FUNCTION public.log_trip_activity();

DROP TRIGGER IF EXISTS trip_activity_documents ON public.trip_documents;
CREATE TRIGGER trip_activity_documents
AFTER INSERT OR DELETE ON public.trip_documents
FOR EACH ROW EXECUTE FUNCTION public.log_trip_activity();

DROP TRIGGER IF EXISTS trip_activity_members ON public.trip_members;
CREATE TRIGGER trip_activity_members
AFTER INSERT OR DELETE ON public.trip_members
FOR EACH ROW EXECUTE FUNCTION public.log_trip_activity();

DROP TRIGGER IF EXISTS trip_activity_participants ON public.trip_participants;
CREATE TRIGGER trip_activity_participants
AFTER INSERT OR UPDATE OR DELETE ON public.trip_participants
FOR EACH ROW EXECUTE FUNCTION public.log_trip_activity();

DROP TRIGGER IF EXISTS trip_activity_invites ON public.trip_invites;
CREATE TRIGGER trip_activity_invites
AFTER INSERT ON public.trip_invites
FOR EACH ROW EXECUTE FUNCTION public.log_trip_activity();
