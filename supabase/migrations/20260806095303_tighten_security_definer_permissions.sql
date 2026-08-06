-- Retirer les accès publics inutiles aux fonctions privilégiées existantes.

revoke execute
on function public.is_trip_owner(uuid)
from public, anon;

revoke execute
on function public.log_trip_activity()
from public, anon, authenticated;

revoke execute
on function public.remove_trip_member(uuid, uuid)
from public, anon;

-- Les futures fonctions ne seront plus exposées automatiquement.
-- Chaque fonction destinée à l’application devra recevoir un GRANT explicite.

alter default privileges for role postgres in schema public
revoke execute on functions from public, anon, authenticated;