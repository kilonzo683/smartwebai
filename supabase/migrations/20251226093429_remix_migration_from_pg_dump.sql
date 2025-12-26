CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'org_admin',
    'staff',
    'lecturer',
    'support_agent',
    'end_user'
);


--
-- Name: ticket_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


--
-- Name: ticket_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_status AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);


--
-- Name: get_org_role(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_org_role(_user_id uuid, _org_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role FROM public.organization_members
  WHERE user_id = _user_id AND organization_id = _org_id
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;


--
-- Name: handle_new_user_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'end_user');
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: is_org_member(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: agent_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_access (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    agent_type text NOT NULL,
    allowed_roles public.app_role[] DEFAULT ARRAY['org_admin'::public.app_role] NOT NULL,
    is_enabled boolean DEFAULT true,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agent_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_performance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    agent_type text NOT NULL,
    date date NOT NULL,
    total_conversations integer DEFAULT 0,
    resolved_conversations integer DEFAULT 0,
    escalated_conversations integer DEFAULT 0,
    avg_response_time_seconds integer DEFAULT 0,
    avg_confidence_score numeric DEFAULT 0,
    avg_satisfaction_score numeric DEFAULT 0,
    total_messages integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    user_id uuid,
    event_type text NOT NULL,
    agent_type text,
    channel text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    user_id uuid NOT NULL,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    entity_name text,
    old_values jsonb,
    new_values jsonb
);


--
-- Name: backup_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    is_enabled boolean DEFAULT false,
    frequency text DEFAULT 'daily'::text,
    retention_days integer DEFAULT 30,
    tables_to_backup text[] DEFAULT '{}'::text[],
    last_backup_at timestamp with time zone,
    next_backup_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: channel_routing_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.channel_routing_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    channel_id uuid NOT NULL,
    agent_type text NOT NULL,
    priority integer DEFAULT 0,
    conditions jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: communication_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.communication_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    channel_type text NOT NULL,
    name text NOT NULL,
    is_enabled boolean DEFAULT true,
    config jsonb DEFAULT '{}'::jsonb,
    credentials jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT communication_channels_channel_type_check CHECK ((channel_type = ANY (ARRAY['whatsapp'::text, 'email'::text, 'webchat'::text, 'sms'::text])))
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    agent_type text NOT NULL,
    title text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sentiment text,
    confidence_score numeric,
    tags text[] DEFAULT '{}'::text[],
    is_escalated boolean DEFAULT false,
    escalation_reason text,
    resolution_notes text,
    resolved_at timestamp with time zone,
    customer_satisfaction integer,
    CONSTRAINT conversations_agent_type_check CHECK ((agent_type = ANY (ARRAY['secretary'::text, 'support'::text, 'social'::text, 'lecturer'::text])))
);


--
-- Name: database_backups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.database_backups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    backup_name text NOT NULL,
    backup_type text DEFAULT 'manual'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    file_path text,
    file_size bigint,
    tables_included text[] DEFAULT '{}'::text[],
    records_count integer DEFAULT 0,
    created_by uuid,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: escalation_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.escalation_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    conversation_id uuid,
    title text NOT NULL,
    description text,
    status public.ticket_status DEFAULT 'open'::public.ticket_status NOT NULL,
    priority public.ticket_priority DEFAULT 'medium'::public.ticket_priority NOT NULL,
    assigned_to uuid,
    escalated_by uuid NOT NULL,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    tags text[] DEFAULT '{}'::text[],
    notes jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: knowledge_base; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_base (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    title text NOT NULL,
    content text,
    file_path text,
    file_type text,
    tags text[] DEFAULT '{}'::text[],
    uploaded_by uuid NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lecture_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lecture_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    content_type text,
    extracted_text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lecturer_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lecturer_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    report_type text NOT NULL,
    content jsonb NOT NULL,
    quiz_id uuid,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_exported boolean DEFAULT false,
    export_format text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    organization_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    message text,
    data jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: organization_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    email text NOT NULL,
    role public.app_role DEFAULT 'end_user'::public.app_role NOT NULL,
    invited_by uuid NOT NULL,
    token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT organization_invitations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text, 'cancelled'::text])))
);


--
-- Name: organization_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'end_user'::public.app_role NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb,
    invited_by uuid,
    joined_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo_url text,
    primary_color text DEFAULT '#8b5cf6'::text,
    subscription_plan text DEFAULT 'free'::text,
    max_users integer DEFAULT 10,
    max_agents integer DEFAULT 4,
    max_messages_per_month integer DEFAULT 1000,
    messages_used integer DEFAULT 0,
    owner_id uuid NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quiz_id uuid NOT NULL,
    user_id uuid NOT NULL,
    answers jsonb DEFAULT '[]'::jsonb NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    total_questions integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quizzes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    document_id uuid,
    title text NOT NULL,
    questions jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    topics text[] DEFAULT '{}'::text[],
    difficulty text DEFAULT 'medium'::text
);


--
-- Name: secretary_calendar_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.secretary_calendar_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    location text,
    attendees text[] DEFAULT '{}'::text[],
    is_all_day boolean DEFAULT false,
    reminder_minutes integer DEFAULT 15,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: secretary_email_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.secretary_email_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    tone text DEFAULT 'professional'::text,
    recipient_email text,
    status text DEFAULT 'draft'::text NOT NULL,
    priority text DEFAULT 'normal'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT secretary_email_drafts_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT secretary_email_drafts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'archived'::text]))),
    CONSTRAINT secretary_email_drafts_tone_check CHECK ((tone = ANY (ARRAY['professional'::text, 'friendly'::text, 'formal'::text, 'casual'::text])))
);


--
-- Name: secretary_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.secretary_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    remind_at timestamp with time zone NOT NULL,
    is_recurring boolean DEFAULT false,
    recurrence_pattern text,
    is_completed boolean DEFAULT false,
    task_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: secretary_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.secretary_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    due_date timestamp with time zone,
    source text DEFAULT 'manual'::text,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT secretary_tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT secretary_tasks_source_check CHECK ((source = ANY (ARRAY['manual'::text, 'voice'::text, 'email'::text, 'chat'::text]))),
    CONSTRAINT secretary_tasks_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: social_brand_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_brand_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_name text NOT NULL,
    brand_voice text,
    tone_examples jsonb DEFAULT '[]'::jsonb,
    target_audience text,
    key_topics text[] DEFAULT '{}'::text[],
    hashtag_groups jsonb DEFAULT '{}'::jsonb,
    color_palette text[] DEFAULT '{}'::text[],
    do_not_use text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: social_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    start_date date,
    end_date date,
    goals jsonb DEFAULT '{}'::jsonb,
    platforms text[] DEFAULT '{}'::text[],
    status text DEFAULT 'draft'::text,
    performance_summary jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: social_content_calendar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_content_calendar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text,
    platform text NOT NULL,
    post_type text DEFAULT 'post'::text,
    hashtags text[] DEFAULT '{}'::text[],
    scheduled_at timestamp with time zone,
    status text DEFAULT 'draft'::text,
    media_urls text[] DEFAULT '{}'::text[],
    engagement_metrics jsonb DEFAULT '{}'::jsonb,
    approved_by uuid,
    approved_at timestamp with time zone,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    campaign_id uuid
);


--
-- Name: student_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_performance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    student_identifier text NOT NULL,
    quiz_id uuid,
    topic_scores jsonb DEFAULT '{}'::jsonb,
    weak_topics text[] DEFAULT '{}'::text[],
    strong_topics text[] DEFAULT '{}'::text[],
    total_attempts integer DEFAULT 0,
    average_score numeric DEFAULT 0,
    last_attempt_at timestamp with time zone,
    feedback_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    price_monthly numeric(10,2) NOT NULL,
    price_yearly numeric(10,2),
    max_users integer NOT NULL,
    max_agents integer NOT NULL,
    max_messages integer NOT NULL,
    features jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    content_type text,
    extracted_text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_resolutions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_resolutions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    conversation_id uuid,
    ticket_id uuid,
    issue_summary text NOT NULL,
    resolution_summary text NOT NULL,
    resolution_steps jsonb DEFAULT '[]'::jsonb,
    was_escalated boolean DEFAULT false,
    resolution_time_minutes integer,
    customer_satisfaction integer,
    tags text[] DEFAULT '{}'::text[],
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ticket_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    is_internal boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'end_user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agent_access agent_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_access
    ADD CONSTRAINT agent_access_pkey PRIMARY KEY (id);


--
-- Name: agent_performance agent_performance_organization_id_agent_type_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_performance
    ADD CONSTRAINT agent_performance_organization_id_agent_type_date_key UNIQUE (organization_id, agent_type, date);


--
-- Name: agent_performance agent_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_performance
    ADD CONSTRAINT agent_performance_pkey PRIMARY KEY (id);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: backup_settings backup_settings_organization_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_settings
    ADD CONSTRAINT backup_settings_organization_id_key UNIQUE (organization_id);


--
-- Name: backup_settings backup_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_settings
    ADD CONSTRAINT backup_settings_pkey PRIMARY KEY (id);


--
-- Name: channel_routing_rules channel_routing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channel_routing_rules
    ADD CONSTRAINT channel_routing_rules_pkey PRIMARY KEY (id);


--
-- Name: communication_channels communication_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communication_channels
    ADD CONSTRAINT communication_channels_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: database_backups database_backups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_backups
    ADD CONSTRAINT database_backups_pkey PRIMARY KEY (id);


--
-- Name: escalation_tickets escalation_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escalation_tickets
    ADD CONSTRAINT escalation_tickets_pkey PRIMARY KEY (id);


--
-- Name: knowledge_base knowledge_base_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_pkey PRIMARY KEY (id);


--
-- Name: lecture_documents lecture_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecture_documents
    ADD CONSTRAINT lecture_documents_pkey PRIMARY KEY (id);


--
-- Name: lecturer_reports lecturer_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecturer_reports
    ADD CONSTRAINT lecturer_reports_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organization_invitations organization_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT organization_invitations_pkey PRIMARY KEY (id);


--
-- Name: organization_invitations organization_invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT organization_invitations_token_key UNIQUE (token);


--
-- Name: organization_members organization_members_organization_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_organization_id_user_id_key UNIQUE (organization_id, user_id);


--
-- Name: organization_members organization_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: platform_settings platform_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_key_key UNIQUE (key);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: secretary_calendar_events secretary_calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secretary_calendar_events
    ADD CONSTRAINT secretary_calendar_events_pkey PRIMARY KEY (id);


--
-- Name: secretary_email_drafts secretary_email_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secretary_email_drafts
    ADD CONSTRAINT secretary_email_drafts_pkey PRIMARY KEY (id);


--
-- Name: secretary_reminders secretary_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secretary_reminders
    ADD CONSTRAINT secretary_reminders_pkey PRIMARY KEY (id);


--
-- Name: secretary_tasks secretary_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secretary_tasks
    ADD CONSTRAINT secretary_tasks_pkey PRIMARY KEY (id);


--
-- Name: social_brand_profiles social_brand_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_brand_profiles
    ADD CONSTRAINT social_brand_profiles_pkey PRIMARY KEY (id);


--
-- Name: social_brand_profiles social_brand_profiles_user_id_brand_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_brand_profiles
    ADD CONSTRAINT social_brand_profiles_user_id_brand_name_key UNIQUE (user_id, brand_name);


--
-- Name: social_campaigns social_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_campaigns
    ADD CONSTRAINT social_campaigns_pkey PRIMARY KEY (id);


--
-- Name: social_content_calendar social_content_calendar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_content_calendar
    ADD CONSTRAINT social_content_calendar_pkey PRIMARY KEY (id);


--
-- Name: student_performance student_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_performance
    ADD CONSTRAINT student_performance_pkey PRIMARY KEY (id);


--
-- Name: student_performance student_performance_user_id_student_identifier_quiz_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_performance
    ADD CONSTRAINT student_performance_user_id_student_identifier_quiz_id_key UNIQUE (user_id, student_identifier, quiz_id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_slug_key UNIQUE (slug);


--
-- Name: support_documents support_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_documents
    ADD CONSTRAINT support_documents_pkey PRIMARY KEY (id);


--
-- Name: support_resolutions support_resolutions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_resolutions
    ADD CONSTRAINT support_resolutions_pkey PRIMARY KEY (id);


--
-- Name: ticket_notes ticket_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_notes
    ADD CONSTRAINT ticket_notes_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_agent_performance_org_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_performance_org_date ON public.agent_performance USING btree (organization_id, date);


--
-- Name: idx_analytics_events_org_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_org_date ON public.analytics_events USING btree (organization_id, created_at);


--
-- Name: idx_channels_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_channels_org ON public.communication_channels USING btree (organization_id);


--
-- Name: idx_invitations_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_email ON public.organization_invitations USING btree (email);


--
-- Name: idx_invitations_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_org ON public.organization_invitations USING btree (organization_id);


--
-- Name: idx_invitations_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_token ON public.organization_invitations USING btree (token);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, is_read);


--
-- Name: backup_settings update_backup_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_backup_settings_updated_at BEFORE UPDATE ON public.backup_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: communication_channels update_communication_channels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_communication_channels_updated_at BEFORE UPDATE ON public.communication_channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: knowledge_base update_knowledge_base_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON public.knowledge_base FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organizations update_organizations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: secretary_calendar_events update_secretary_calendar_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_secretary_calendar_events_updated_at BEFORE UPDATE ON public.secretary_calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: secretary_email_drafts update_secretary_email_drafts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_secretary_email_drafts_updated_at BEFORE UPDATE ON public.secretary_email_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: secretary_reminders update_secretary_reminders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_secretary_reminders_updated_at BEFORE UPDATE ON public.secretary_reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: secretary_tasks update_secretary_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_secretary_tasks_updated_at BEFORE UPDATE ON public.secretary_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: social_brand_profiles update_social_brand_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_social_brand_profiles_updated_at BEFORE UPDATE ON public.social_brand_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: social_campaigns update_social_campaigns_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_social_campaigns_updated_at BEFORE UPDATE ON public.social_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: social_content_calendar update_social_content_calendar_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_social_content_calendar_updated_at BEFORE UPDATE ON public.social_content_calendar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: student_performance update_student_performance_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_student_performance_updated_at BEFORE UPDATE ON public.student_performance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: support_resolutions update_support_resolutions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_support_resolutions_updated_at BEFORE UPDATE ON public.support_resolutions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: escalation_tickets update_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.escalation_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: agent_access agent_access_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_access
    ADD CONSTRAINT agent_access_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: agent_performance agent_performance_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_performance
    ADD CONSTRAINT agent_performance_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: analytics_events analytics_events_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: audit_log audit_log_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: backup_settings backup_settings_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_settings
    ADD CONSTRAINT backup_settings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: channel_routing_rules channel_routing_rules_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channel_routing_rules
    ADD CONSTRAINT channel_routing_rules_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.communication_channels(id) ON DELETE CASCADE;


--
-- Name: channel_routing_rules channel_routing_rules_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channel_routing_rules
    ADD CONSTRAINT channel_routing_rules_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: communication_channels communication_channels_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communication_channels
    ADD CONSTRAINT communication_channels_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: database_backups database_backups_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_backups
    ADD CONSTRAINT database_backups_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: escalation_tickets escalation_tickets_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escalation_tickets
    ADD CONSTRAINT escalation_tickets_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE SET NULL;


--
-- Name: escalation_tickets escalation_tickets_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escalation_tickets
    ADD CONSTRAINT escalation_tickets_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: knowledge_base knowledge_base_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: lecture_documents lecture_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecture_documents
    ADD CONSTRAINT lecture_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: lecturer_reports lecturer_reports_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecturer_reports
    ADD CONSTRAINT lecturer_reports_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE SET NULL;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_invitations organization_invitations_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT organization_invitations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_members organization_members_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts quiz_attempts_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quizzes quizzes_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.lecture_documents(id) ON DELETE SET NULL;


--
-- Name: secretary_reminders secretary_reminders_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secretary_reminders
    ADD CONSTRAINT secretary_reminders_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.secretary_tasks(id) ON DELETE SET NULL;


--
-- Name: social_content_calendar social_content_calendar_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_content_calendar
    ADD CONSTRAINT social_content_calendar_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.social_campaigns(id) ON DELETE SET NULL;


--
-- Name: student_performance student_performance_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_performance
    ADD CONSTRAINT student_performance_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: support_resolutions support_resolutions_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_resolutions
    ADD CONSTRAINT support_resolutions_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: support_resolutions support_resolutions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_resolutions
    ADD CONSTRAINT support_resolutions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: support_resolutions support_resolutions_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_resolutions
    ADD CONSTRAINT support_resolutions_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.escalation_tickets(id) ON DELETE SET NULL;


--
-- Name: ticket_notes ticket_notes_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_notes
    ADD CONSTRAINT ticket_notes_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.escalation_tickets(id) ON DELETE CASCADE;


--
-- Name: subscription_plans Anyone can view plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view plans" ON public.subscription_plans FOR SELECT USING (true);


--
-- Name: platform_settings Anyone can view platform settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view platform settings" ON public.platform_settings FOR SELECT USING (true);


--
-- Name: organizations Authenticated users can create organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create organizations" ON public.organizations FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: organization_invitations Invited user can view their invitation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Invited user can view their invitation" ON public.organization_invitations FOR SELECT USING ((email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text));


--
-- Name: student_performance Lecturers can manage student performance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecturers can manage student performance" ON public.student_performance USING ((auth.uid() = user_id));


--
-- Name: lecturer_reports Lecturers can manage their reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecturers can manage their reports" ON public.lecturer_reports USING ((auth.uid() = user_id));


--
-- Name: agent_access Members can view agent access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can view agent access" ON public.agent_access FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = agent_access.organization_id) AND (organization_members.user_id = auth.uid())))));


--
-- Name: knowledge_base Members can view knowledge base; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can view knowledge base" ON public.knowledge_base FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = knowledge_base.organization_id) AND (organization_members.user_id = auth.uid())))));


--
-- Name: organization_members Members can view org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can view org members" ON public.organization_members FOR SELECT USING ((public.is_org_member(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: organizations Members can view their organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can view their organizations" ON public.organizations FOR SELECT USING (((owner_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = organizations.id) AND (organization_members.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: knowledge_base Org admin and lecturer can manage knowledge base; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admin and lecturer can manage knowledge base" ON public.knowledge_base USING (((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = knowledge_base.organization_id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = ANY (ARRAY['org_admin'::public.app_role, 'lecturer'::public.app_role]))))) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: agent_access Org admin can manage agent access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admin can manage agent access" ON public.agent_access USING (((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = agent_access.organization_id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = 'org_admin'::public.app_role)))) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: communication_channels Org admin can manage channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admin can manage channels" ON public.communication_channels USING (((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = communication_channels.organization_id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = ANY (ARRAY['org_admin'::public.app_role, 'super_admin'::public.app_role]))))) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: organization_members Org admin can manage members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admin can manage members" ON public.organization_members USING (((public.get_org_role(auth.uid(), organization_id) = ANY (ARRAY['org_admin'::public.app_role, 'super_admin'::public.app_role])) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: channel_routing_rules Org admin can manage routing rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admin can manage routing rules" ON public.channel_routing_rules USING (((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = channel_routing_rules.organization_id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = ANY (ARRAY['org_admin'::public.app_role, 'super_admin'::public.app_role]))))) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: audit_log Org admin can view audit log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admin can view audit log" ON public.audit_log FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = audit_log.organization_id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = 'org_admin'::public.app_role)))) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: backup_settings Org admins can manage backup settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can manage backup settings" ON public.backup_settings USING (((EXISTS ( SELECT 1
   FROM public.organization_members om
  WHERE ((om.organization_id = backup_settings.organization_id) AND (om.user_id = auth.uid()) AND (om.role = ANY (ARRAY['org_admin'::public.app_role, 'super_admin'::public.app_role]))))) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: database_backups Org admins can manage backups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can manage backups" ON public.database_backups USING (((EXISTS ( SELECT 1
   FROM public.organization_members om
  WHERE ((om.organization_id = database_backups.organization_id) AND (om.user_id = auth.uid()) AND (om.role = ANY (ARRAY['org_admin'::public.app_role, 'super_admin'::public.app_role]))))) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: organization_invitations Org admins can manage invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can manage invitations" ON public.organization_invitations USING (((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = organization_invitations.organization_id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = ANY (ARRAY['org_admin'::public.app_role, 'super_admin'::public.app_role]))))) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: analytics_events Org members can view analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view analytics" ON public.analytics_events FOR SELECT USING (((organization_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = analytics_events.organization_id) AND (organization_members.user_id = auth.uid()))))));


--
-- Name: communication_channels Org members can view channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view channels" ON public.communication_channels FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = communication_channels.organization_id) AND (organization_members.user_id = auth.uid())))));


--
-- Name: agent_performance Org members can view performance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view performance" ON public.agent_performance FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = agent_performance.organization_id) AND (organization_members.user_id = auth.uid())))));


--
-- Name: channel_routing_rules Org members can view routing rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view routing rules" ON public.channel_routing_rules FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = channel_routing_rules.organization_id) AND (organization_members.user_id = auth.uid())))));


--
-- Name: organizations Owner and super admin can delete organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner and super admin can delete organizations" ON public.organizations FOR DELETE USING (((owner_id = auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: organizations Owner and super admin can update organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner and super admin can update organizations" ON public.organizations FOR UPDATE USING (((owner_id = auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: user_roles Super admin can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: subscription_plans Super admin can manage plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can manage plans" ON public.subscription_plans USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: platform_settings Super admin can manage platform settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can manage platform settings" ON public.platform_settings USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: ticket_notes Support can add notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Support can add notes" ON public.ticket_notes FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: support_resolutions Support can manage resolutions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Support can manage resolutions" ON public.support_resolutions USING (((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = support_resolutions.organization_id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = ANY (ARRAY['org_admin'::public.app_role, 'support_agent'::public.app_role]))))) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: escalation_tickets Support can manage tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Support can manage tickets" ON public.escalation_tickets USING (((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = escalation_tickets.organization_id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = ANY (ARRAY['org_admin'::public.app_role, 'support_agent'::public.app_role]))))) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: support_resolutions Support can view resolutions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Support can view resolutions" ON public.support_resolutions FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = support_resolutions.organization_id) AND (organization_members.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: escalation_tickets Support can view tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Support can view tickets" ON public.escalation_tickets FOR SELECT USING (((escalated_by = auth.uid()) OR (assigned_to = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = escalation_tickets.organization_id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = ANY (ARRAY['org_admin'::public.app_role, 'support_agent'::public.app_role]))))) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: analytics_events System can insert analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert analytics" ON public.analytics_events FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: audit_log System can insert audit log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit log" ON public.audit_log FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: notifications System can insert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: agent_performance System can manage performance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can manage performance" ON public.agent_performance USING ((auth.uid() IS NOT NULL));


--
-- Name: ticket_notes Ticket participants can view notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ticket participants can view notes" ON public.ticket_notes FOR SELECT USING (((EXISTS ( SELECT 1
   FROM (public.escalation_tickets t
     JOIN public.organization_members om ON ((om.organization_id = t.organization_id)))
  WHERE ((t.id = ticket_notes.ticket_id) AND (om.user_id = auth.uid()) AND (om.role = ANY (ARRAY['org_admin'::public.app_role, 'support_agent'::public.app_role]))))) OR (user_id = auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: quiz_attempts Users can create their own attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own attempts" ON public.quiz_attempts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: secretary_calendar_events Users can create their own calendar events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own calendar events" ON public.secretary_calendar_events FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: secretary_email_drafts Users can create their own email drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own email drafts" ON public.secretary_email_drafts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: quizzes Users can create their own quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own quizzes" ON public.quizzes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: secretary_reminders Users can create their own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own reminders" ON public.secretary_reminders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: secretary_tasks Users can create their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own tasks" ON public.secretary_tasks FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: secretary_calendar_events Users can delete their own calendar events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own calendar events" ON public.secretary_calendar_events FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: conversations Users can delete their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own conversations" ON public.conversations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: lecture_documents Users can delete their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own documents" ON public.lecture_documents FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: secretary_email_drafts Users can delete their own email drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own email drafts" ON public.secretary_email_drafts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: quizzes Users can delete their own quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own quizzes" ON public.quizzes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: secretary_reminders Users can delete their own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reminders" ON public.secretary_reminders FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: support_documents Users can delete their own support documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own support documents" ON public.support_documents FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: secretary_tasks Users can delete their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tasks" ON public.secretary_tasks FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: messages Users can insert messages to their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert messages to their conversations" ON public.messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND (conversations.user_id = auth.uid())))));


--
-- Name: conversations Users can insert their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own conversations" ON public.conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: lecture_documents Users can insert their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own documents" ON public.lecture_documents FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: support_documents Users can insert their own support documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own support documents" ON public.support_documents FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: social_brand_profiles Users can manage their brand profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their brand profiles" ON public.social_brand_profiles USING ((auth.uid() = user_id));


--
-- Name: social_campaigns Users can manage their campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their campaigns" ON public.social_campaigns USING ((auth.uid() = user_id));


--
-- Name: social_content_calendar Users can manage their own content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own content" ON public.social_content_calendar USING ((auth.uid() = user_id));


--
-- Name: secretary_calendar_events Users can update their own calendar events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own calendar events" ON public.secretary_calendar_events FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: conversations Users can update their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own conversations" ON public.conversations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: secretary_email_drafts Users can update their own email drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own email drafts" ON public.secretary_email_drafts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: quizzes Users can update their own quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own quizzes" ON public.quizzes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: secretary_reminders Users can update their own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reminders" ON public.secretary_reminders FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: secretary_tasks Users can update their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own tasks" ON public.secretary_tasks FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: quizzes Users can view all quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all quizzes" ON public.quizzes FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: messages Users can view messages from their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages from their conversations" ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND (conversations.user_id = auth.uid())))));


--
-- Name: quiz_attempts Users can view their own attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own attempts" ON public.quiz_attempts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: secretary_calendar_events Users can view their own calendar events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own calendar events" ON public.secretary_calendar_events FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: lecture_documents Users can view their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own documents" ON public.lecture_documents FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: secretary_email_drafts Users can view their own email drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own email drafts" ON public.secretary_email_drafts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: secretary_reminders Users can view their own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own reminders" ON public.secretary_reminders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: support_documents Users can view their own support documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own support documents" ON public.support_documents FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: secretary_tasks Users can view their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tasks" ON public.secretary_tasks FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: agent_access; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_access ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_performance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_performance ENABLE ROW LEVEL SECURITY;

--
-- Name: analytics_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: backup_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: channel_routing_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.channel_routing_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: communication_channels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.communication_channels ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: database_backups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.database_backups ENABLE ROW LEVEL SECURITY;

--
-- Name: escalation_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.escalation_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: knowledge_base; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

--
-- Name: lecture_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lecture_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: lecturer_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lecturer_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: platform_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: quizzes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

--
-- Name: secretary_calendar_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.secretary_calendar_events ENABLE ROW LEVEL SECURITY;

--
-- Name: secretary_email_drafts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.secretary_email_drafts ENABLE ROW LEVEL SECURITY;

--
-- Name: secretary_reminders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.secretary_reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: secretary_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.secretary_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: social_brand_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_brand_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: social_campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: social_content_calendar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_content_calendar ENABLE ROW LEVEL SECURITY;

--
-- Name: student_performance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_performance ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: support_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: support_resolutions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_resolutions ENABLE ROW LEVEL SECURITY;

--
-- Name: ticket_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ticket_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;