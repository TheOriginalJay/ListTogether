-- ============================================================
-- SUPABASE SCHEMA TEMPLATE
-- Reusable starting point for every cinematic website client project
-- Version 1.0
-- ============================================================
-- Usage: Paste into Supabase SQL Editor and run.
-- Replace [CLIENT_SLUG] with the client's project identifier (e.g. "japan_tours")
-- ============================================================

-- ============================================================
-- USERS & PROFILES
-- ============================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text,
  role          text NOT NULL DEFAULT 'client'   -- 'admin' | 'client'
                CHECK (role IN ('admin', 'client')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (new.id, new.email, 'client');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================
-- SITE CONTENT (JSONB — flexible per project)
-- ============================================================

CREATE TABLE site_content (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       text NOT NULL,          -- client slug, e.g. 'japan-tours'
  section       text NOT NULL,          -- 'hero' | 'about' | 'features' | 'contact' | etc.
  content       jsonb NOT NULL,         -- arbitrary section data
  version       integer NOT NULL DEFAULT 1,
  is_published  boolean NOT NULL DEFAULT false,
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid REFERENCES auth.users(id)
);

-- Index for fast lookups by site and section
CREATE INDEX idx_site_content_site_section ON site_content(site_id, section);
CREATE INDEX idx_site_content_published ON site_content(site_id, is_published);

-- ============================================================
-- CONTENT SNAPSHOTS (version history)
-- ============================================================

CREATE TABLE content_snapshots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       text NOT NULL,
  section       text NOT NULL,
  content       jsonb NOT NULL,
  version       integer NOT NULL,
  snapshot_type text NOT NULL DEFAULT 'publish'   -- 'publish' | 'autosave'
                CHECK (snapshot_type IN ('publish', 'autosave')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_snapshots_site ON content_snapshots(site_id, section, version DESC);

-- ============================================================
-- MEDIA STORAGE REFERENCES
-- ============================================================
-- Actual files live in Supabase Storage buckets.
-- This table tracks references, metadata, and which site/section uses each file.

CREATE TABLE media (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       text NOT NULL,
  bucket        text NOT NULL,           -- Supabase storage bucket name
  path          text NOT NULL,           -- path within bucket
  filename      text NOT NULL,
  mime_type     text NOT NULL,
  size_bytes    integer,
  alt_text      text,
  uploaded_by   uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_site ON media(site_id);

-- ============================================================
-- SITE CONFIGURATION (per-client settings)
-- ============================================================

CREATE TABLE site_config (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       text UNIQUE NOT NULL,
  owner_id      uuid NOT NULL REFERENCES auth.users(id),
  domain        text,                    -- custom domain if connected
  vercel_url    text,                    -- .vercel.app URL
  config        jsonb NOT NULL DEFAULT '{}',  -- fonts, colors, SEO defaults, analytics
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content     ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE media            ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config      ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Users can update their own profile (not role)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---- SITE CONTENT ----

-- Clients can read/write content for their own site
CREATE POLICY "site_content_client_select"
  ON site_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM site_config sc
      WHERE sc.site_id = site_content.site_id
        AND sc.owner_id = auth.uid()
    )
  );

CREATE POLICY "site_content_client_insert"
  ON site_content FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM site_config sc
      WHERE sc.site_id = site_content.site_id
        AND sc.owner_id = auth.uid()
    )
  );

CREATE POLICY "site_content_client_update"
  ON site_content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM site_config sc
      WHERE sc.site_id = site_content.site_id
        AND sc.owner_id = auth.uid()
    )
  );

-- Admins can read/write all site content
CREATE POLICY "site_content_admin_all"
  ON site_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ---- MEDIA ----

-- Clients can manage their own site's media
CREATE POLICY "media_client_own_site"
  ON media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM site_config sc
      WHERE sc.site_id = media.site_id
        AND sc.owner_id = auth.uid()
    )
  );

-- Admins can manage all media
CREATE POLICY "media_admin_all"
  ON media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ---- SITE CONFIG ----

-- Clients can read their own site config
CREATE POLICY "site_config_client_select"
  ON site_config FOR SELECT
  USING (owner_id = auth.uid());

-- Admins can read and write all site configs
CREATE POLICY "site_config_admin_all"
  ON site_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ---- CONTENT SNAPSHOTS ----

-- Clients can read snapshots for their site
CREATE POLICY "snapshots_client_select"
  ON content_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM site_config sc
      WHERE sc.site_id = content_snapshots.site_id
        AND sc.owner_id = auth.uid()
    )
  );

-- Admins can read/write all snapshots
CREATE POLICY "snapshots_admin_all"
  ON content_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Run these in the Supabase Storage dashboard or via CLI.
-- Bucket names follow the pattern: {site_id}-media

-- Example for a client with site_id = 'japan-tours':
-- supabase storage create japan-tours-media --public=false

-- Generic setup (run per client):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('{site_id}-media', '{site_id}-media', false);

-- ============================================================
-- HELPFUL VIEWS
-- ============================================================

-- Admin view: all sites with owner info
CREATE OR REPLACE VIEW admin_sites AS
  SELECT
    sc.site_id,
    sc.domain,
    sc.vercel_url,
    sc.is_active,
    sc.created_at,
    p.email AS owner_email,
    p.full_name AS owner_name
  FROM site_config sc
  JOIN profiles p ON p.id = sc.owner_id;

-- Published content by site
CREATE OR REPLACE VIEW published_content AS
  SELECT *
  FROM site_content
  WHERE is_published = true
  ORDER BY site_id, section;

-- ============================================================
-- NOTES
-- ============================================================
-- 1. The `content` JSONB column in site_content is flexible by design.
--    Each section (hero, about, features, etc.) has its own schema
--    defined by the Next.js component that reads it.
--
-- 2. To add a new client:
--    a. INSERT into site_config with their site_id and owner_id
--    b. Create their storage bucket: {site_id}-media
--    c. INSERT initial site_content rows for each section (is_published = false)
--    d. Send them the client portal URL + their login credentials
--
-- 3. The Publish button workflow:
--    a. Client edits content in portal → UPDATE site_content (is_published = false)
--    b. Client clicks Publish → 
--       INSERT into content_snapshots (version history)
--       UPDATE site_content SET is_published = true, published_at = now()
--       Vercel webhook fires → site rebuilds from new content
--
-- 4. To add more tables (e.g. bookings, contacts, form submissions),
--    follow the same RLS pattern: client reads/writes own site, admin reads all.
