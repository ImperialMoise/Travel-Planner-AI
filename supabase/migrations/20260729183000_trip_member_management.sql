CREATE OR REPLACE FUNCTION public.is_trip_owner(check_trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trip_members
    WHERE trip_id = check_trip_id
      AND user_id = auth.uid()
      AND role = 'owner'
  );
$$;

REVOKE ALL ON FUNCTION public.is_trip_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_trip_owner(uuid) TO authenticated;

DROP POLICY IF EXISTS "insert_invite" ON public.trip_invites;
CREATE POLICY "insert_invite"
ON public.trip_invites
FOR INSERT
TO authenticated
WITH CHECK (public.is_trip_owner(trip_id));

DROP POLICY IF EXISTS "select_invite" ON public.trip_invites;
CREATE POLICY "select_invite"
ON public.trip_invites
FOR SELECT
TO authenticated
USING (public.is_trip_owner(trip_id));

CREATE OR REPLACE FUNCTION public.remove_trip_member(
  p_trip_id uuid,
  p_member_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_member public.trip_members%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise';
  END IF;

  IF NOT public.is_trip_owner(p_trip_id) THEN
    RAISE EXCEPTION 'Seul le propriétaire peut retirer un membre';
  END IF;

  SELECT *
  INTO selected_member
  FROM public.trip_members
  WHERE id = p_member_id
    AND trip_id = p_trip_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membre introuvable';
  END IF;

  IF selected_member.role = 'owner' THEN
    RAISE EXCEPTION 'Le propriétaire ne peut pas être retiré';
  END IF;

  DELETE FROM public.trip_members
  WHERE id = selected_member.id;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_trip_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_trip_member(uuid, uuid) TO authenticated;