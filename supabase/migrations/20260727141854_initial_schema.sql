


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."accept_trip_invite"("invite_token" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  selected_invite public.trip_invites%rowtype;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Connexion requise';
  end if;

  select *
  into selected_invite
  from public.trip_invites
  where token = invite_token
    and used_at is null
    and (expires_at is null or expires_at > now())
  for update;

  if not found then
    raise exception 'Invitation invalide, expirée ou déjà utilisée';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (
    selected_invite.trip_id,
    current_user_id,
    selected_invite.role
  )
  on conflict (trip_id, user_id) do nothing;

  update public.trip_invites
  set used_by = current_user_id,
      used_at = now()
  where id = selected_invite.id;

  return selected_invite.trip_id;
end;
$$;


ALTER FUNCTION "public"."accept_trip_invite"("invite_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_owner_as_member"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into trip_members(trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."add_owner_as_member"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_edit_trip"("check_trip_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = check_trip_id AND user_id = auth.uid() AND role IN ('owner','editor')
  );
$$;


ALTER FUNCTION "public"."can_edit_trip"("check_trip_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into profiles(id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_trip_editor"("check_trip_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from trip_members
    where trip_id = check_trip_id
      and user_id = auth.uid()
      and role in ('owner', 'editor')
  );
$$;


ALTER FUNCTION "public"."is_trip_editor"("check_trip_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_trip_member"("check_trip_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members WHERE trip_id = check_trip_id AND user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_trip_member"("check_trip_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."api_settings" (
    "id" "text" DEFAULT 'global'::"text" NOT NULL,
    "google_places_enabled" boolean DEFAULT true NOT NULL,
    "google_places_free_user_daily_limit" integer DEFAULT 200 NOT NULL,
    "google_places_global_daily_limit" integer DEFAULT 5000 NOT NULL,
    "google_places_warn_ratio" numeric DEFAULT 0.8 NOT NULL,
    "google_places_fallback_provider" "text" DEFAULT 'maptiler'::"text" NOT NULL,
    "google_places_allow_anonymous" boolean DEFAULT false NOT NULL,
    "google_places_allow_viewers" boolean DEFAULT true NOT NULL,
    "google_places_cache_days" integer DEFAULT 30 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "places_provider" "text" DEFAULT 'geoapify'::"text" NOT NULL,
    "places_enriched_enabled" boolean DEFAULT true NOT NULL,
    "places_free_user_monthly_limit" integer DEFAULT 100 NOT NULL,
    "places_global_daily_limit" integer DEFAULT 2500 NOT NULL,
    "places_warn_ratio" numeric DEFAULT 0.8 NOT NULL,
    "places_allow_anonymous" boolean DEFAULT false NOT NULL,
    "places_allow_viewers" boolean DEFAULT true NOT NULL,
    "places_cache_days" integer DEFAULT 30 NOT NULL
);


ALTER TABLE "public"."api_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "usage_day" "date" DEFAULT CURRENT_DATE NOT NULL,
    "user_id" "uuid",
    "ip_hash" "text",
    "provider" "text" NOT NULL,
    "endpoint" "text" NOT NULL,
    "count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."api_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "step_id" "uuid",
    "cat" "text" DEFAULT 'Divers'::"text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "paid_by" "text" DEFAULT ''::"text",
    "for_participants" "jsonb" DEFAULT '["__all__"]'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."budget_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."place_details_cache" (
    "provider" "text" NOT NULL,
    "place_id" "text" NOT NULL,
    "result" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."place_details_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."places_cache" (
    "cache_key" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "endpoint" "text" NOT NULL,
    "query" "text" NOT NULL,
    "params" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "results" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."places_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_days" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "day_index" integer NOT NULL,
    "title" "text" DEFAULT ''::"text",
    "note" "text" DEFAULT ''::"text",
    "date_label" "text" DEFAULT ''::"text",
    "date_iso" "date",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "todo" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."trip_days" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "category" "text" DEFAULT 'other'::"text" NOT NULL,
    "name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "mime_type" "text" DEFAULT ''::"text",
    "size_bytes" bigint DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trip_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(24), 'hex'::"text") NOT NULL,
    "role" "text" DEFAULT 'editor'::"text" NOT NULL,
    "created_by" "uuid",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval),
    "used_by" "uuid",
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "trip_invites_role_check" CHECK (("role" = ANY (ARRAY['editor'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."trip_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'editor'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "trip_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'editor'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."trip_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "sort_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trip_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day_id" "uuid" NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "step_index" integer DEFAULT 0 NOT NULL,
    "type" "text" DEFAULT 'autre'::"text" NOT NULL,
    "label" "text" DEFAULT ''::"text",
    "lieu" "text" DEFAULT ''::"text",
    "time" "text" DEFAULT ''::"text",
    "time_end" "text" DEFAULT ''::"text",
    "transport_type" "text" DEFAULT ''::"text",
    "depart" "text" DEFAULT ''::"text",
    "arrivee" "text" DEFAULT ''::"text",
    "duree" "text" DEFAULT ''::"text",
    "next_day" boolean DEFAULT false,
    "escales" "jsonb" DEFAULT '[]'::"jsonb",
    "ref" "text" DEFAULT ''::"text",
    "date_start" "date",
    "date_end" "date",
    "nuits" integer DEFAULT 0,
    "time_check_in" "text" DEFAULT '15:00'::"text",
    "time_check_out" "text" DEFAULT '11:00'::"text",
    "duree_estimee" "text" DEFAULT ''::"text",
    "link" "text" DEFAULT ''::"text",
    "note" "text" DEFAULT ''::"text",
    "amount" numeric(10,2) DEFAULT 0,
    "paid_by" "text" DEFAULT ''::"text",
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "lat" double precision,
    "lng" double precision,
    "important" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."trip_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "start_date" "date",
    "owner_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "global_note" "text" DEFAULT ''::"text",
    "end_date" "date"
);


ALTER TABLE "public"."trips" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_settings"
    ADD CONSTRAINT "api_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_usage"
    ADD CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_usage"
    ADD CONSTRAINT "api_usage_usage_day_user_id_ip_hash_provider_endpoint_key" UNIQUE ("usage_day", "user_id", "ip_hash", "provider", "endpoint");



ALTER TABLE ONLY "public"."budget_items"
    ADD CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."place_details_cache"
    ADD CONSTRAINT "place_details_cache_pkey" PRIMARY KEY ("provider", "place_id");



ALTER TABLE ONLY "public"."places_cache"
    ADD CONSTRAINT "places_cache_pkey" PRIMARY KEY ("cache_key");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_days"
    ADD CONSTRAINT "trip_days_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_days"
    ADD CONSTRAINT "trip_days_trip_id_day_index_key" UNIQUE ("trip_id", "day_index");



ALTER TABLE ONLY "public"."trip_documents"
    ADD CONSTRAINT "trip_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_invites"
    ADD CONSTRAINT "trip_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_invites"
    ADD CONSTRAINT "trip_invites_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_trip_id_user_id_key" UNIQUE ("trip_id", "user_id");



ALTER TABLE ONLY "public"."trip_participants"
    ADD CONSTRAINT "trip_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_steps"
    ADD CONSTRAINT "trip_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "trip_after_insert" AFTER INSERT ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."add_owner_as_member"();



CREATE OR REPLACE TRIGGER "trip_days_updated_at" BEFORE UPDATE ON "public"."trip_days" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trip_steps_updated_at" BEFORE UPDATE ON "public"."trip_steps" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trips_updated_at" BEFORE UPDATE ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."api_usage"
    ADD CONSTRAINT "api_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_items"
    ADD CONSTRAINT "budget_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."budget_items"
    ADD CONSTRAINT "budget_items_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."trip_steps"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."budget_items"
    ADD CONSTRAINT "budget_items_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_days"
    ADD CONSTRAINT "trip_days_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_documents"
    ADD CONSTRAINT "trip_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."trip_documents"
    ADD CONSTRAINT "trip_documents_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_invites"
    ADD CONSTRAINT "trip_invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."trip_invites"
    ADD CONSTRAINT "trip_invites_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_invites"
    ADD CONSTRAINT "trip_invites_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_participants"
    ADD CONSTRAINT "trip_participants_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_steps"
    ADD CONSTRAINT "trip_steps_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."trip_steps"
    ADD CONSTRAINT "trip_steps_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "public"."trip_days"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_steps"
    ADD CONSTRAINT "trip_steps_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "public"."api_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "api_settings_read_authenticated" ON "public"."api_settings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."api_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_documents" ON "public"."trip_documents" FOR DELETE USING ("public"."can_edit_trip"("trip_id"));



CREATE POLICY "delete_member" ON "public"."trip_members" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "delete_trip" ON "public"."trips" FOR DELETE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "insert_documents" ON "public"."trip_documents" FOR INSERT WITH CHECK ("public"."can_edit_trip"("trip_id"));



CREATE POLICY "insert_invite" ON "public"."trip_invites" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "public"."can_edit_trip"("trip_invites"."trip_id") AS "can_edit_trip"));



CREATE POLICY "insert_trip" ON "public"."trips" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "modify_budget" ON "public"."budget_items" USING ("public"."can_edit_trip"("trip_id")) WITH CHECK ("public"."can_edit_trip"("trip_id"));



CREATE POLICY "modify_days" ON "public"."trip_days" USING ("public"."can_edit_trip"("trip_id")) WITH CHECK ("public"."can_edit_trip"("trip_id"));



CREATE POLICY "modify_participants" ON "public"."trip_participants" USING ("public"."can_edit_trip"("trip_id")) WITH CHECK ("public"."can_edit_trip"("trip_id"));



CREATE POLICY "modify_steps" ON "public"."trip_steps" USING ("public"."can_edit_trip"("trip_id")) WITH CHECK ("public"."can_edit_trip"("trip_id"));



ALTER TABLE "public"."place_details_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."places_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_budget" ON "public"."budget_items" FOR SELECT USING ("public"."is_trip_member"("trip_id"));



CREATE POLICY "select_days" ON "public"."trip_days" FOR SELECT USING ("public"."is_trip_member"("trip_id"));



CREATE POLICY "select_documents" ON "public"."trip_documents" FOR SELECT USING ("public"."is_trip_member"("trip_id"));



CREATE POLICY "select_invite" ON "public"."trip_invites" FOR SELECT TO "authenticated" USING (( SELECT "public"."can_edit_trip"("trip_invites"."trip_id") AS "can_edit_trip"));



CREATE POLICY "select_members" ON "public"."trip_members" FOR SELECT TO "authenticated" USING (( SELECT "public"."is_trip_member"("trip_members"."trip_id") AS "is_trip_member"));



CREATE POLICY "select_participants" ON "public"."trip_participants" FOR SELECT USING ("public"."is_trip_member"("trip_id"));



CREATE POLICY "select_steps" ON "public"."trip_steps" FOR SELECT USING ("public"."is_trip_member"("trip_id"));



CREATE POLICY "select_trip" ON "public"."trips" FOR SELECT USING ((("owner_id" = "auth"."uid"()) OR "public"."is_trip_member"("id")));



CREATE POLICY "self_or_co_member" ON "public"."profiles" FOR SELECT USING ((("id" = "auth"."uid"()) OR ("id" IN ( SELECT "tm"."user_id"
   FROM "public"."trip_members" "tm"
  WHERE ("tm"."trip_id" IN ( SELECT "trips"."id"
           FROM "public"."trips"
          WHERE ("trips"."owner_id" = "auth"."uid"())))))));



CREATE POLICY "self_update" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."trip_days" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trip_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trip_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trip_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trip_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trip_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trips" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_trip" ON "public"."trips" FOR UPDATE USING (("owner_id" = "auth"."uid"()));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."accept_trip_invite"("invite_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_trip_invite"("invite_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_trip_invite"("invite_token" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."add_owner_as_member"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_owner_as_member"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_edit_trip"("check_trip_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_edit_trip"("check_trip_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_edit_trip"("check_trip_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_trip_editor"("check_trip_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_trip_editor"("check_trip_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_trip_editor"("check_trip_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_trip_member"("check_trip_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_trip_member"("check_trip_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_trip_member"("check_trip_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."api_settings" TO "anon";
GRANT ALL ON TABLE "public"."api_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."api_settings" TO "service_role";



GRANT ALL ON TABLE "public"."api_usage" TO "anon";
GRANT ALL ON TABLE "public"."api_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."api_usage" TO "service_role";



GRANT ALL ON TABLE "public"."budget_items" TO "anon";
GRANT ALL ON TABLE "public"."budget_items" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_items" TO "service_role";



GRANT ALL ON TABLE "public"."place_details_cache" TO "anon";
GRANT ALL ON TABLE "public"."place_details_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."place_details_cache" TO "service_role";



GRANT ALL ON TABLE "public"."places_cache" TO "anon";
GRANT ALL ON TABLE "public"."places_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."places_cache" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."trip_days" TO "anon";
GRANT ALL ON TABLE "public"."trip_days" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_days" TO "service_role";



GRANT ALL ON TABLE "public"."trip_documents" TO "anon";
GRANT ALL ON TABLE "public"."trip_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_documents" TO "service_role";



GRANT ALL ON TABLE "public"."trip_invites" TO "anon";
GRANT ALL ON TABLE "public"."trip_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_invites" TO "service_role";



GRANT ALL ON TABLE "public"."trip_members" TO "anon";
GRANT ALL ON TABLE "public"."trip_members" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_members" TO "service_role";



GRANT ALL ON TABLE "public"."trip_participants" TO "anon";
GRANT ALL ON TABLE "public"."trip_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_participants" TO "service_role";



GRANT ALL ON TABLE "public"."trip_steps" TO "anon";
GRANT ALL ON TABLE "public"."trip_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_steps" TO "service_role";



GRANT ALL ON TABLE "public"."trips" TO "anon";
GRANT ALL ON TABLE "public"."trips" TO "authenticated";
GRANT ALL ON TABLE "public"."trips" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







