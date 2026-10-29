BEGIN;

-- Leads from the contact form (/halftone/contact/).
CREATE TABLE IF NOT EXISTS app_halftone_inquiries (
  id         BIGSERIAL PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(200) NOT NULL,
  company    VARCHAR(160) NOT NULL DEFAULT '',
  budget     VARCHAR(60)  NOT NULL DEFAULT '',
  services   JSONB        NOT NULL DEFAULT '[]',
  message    TEXT         NOT NULL,
  estimate   JSONB,
  status     VARCHAR(16)  NOT NULL DEFAULT 'new',
  notes      TEXT         NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_halftone_inquiries_created ON app_halftone_inquiries (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS app_halftone_inquiries_status ON app_halftone_inquiries (status, created_at DESC, id DESC);

-- Intro calls booked from the booking modal. date/time are in the studio's timezone.
CREATE TABLE IF NOT EXISTS app_halftone_bookings (
  id            BIGSERIAL PRIMARY KEY,
  date          CHAR(10)     NOT NULL,
  time          CHAR(5)      NOT NULL,
  duration      INTEGER      NOT NULL DEFAULT 30,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(200) NOT NULL,
  phone         VARCHAR(40)  NOT NULL DEFAULT '',
  company       VARCHAR(160) NOT NULL DEFAULT '',
  note          TEXT         NOT NULL DEFAULT '',
  status        VARCHAR(16)  NOT NULL DEFAULT 'confirmed',
  location_type VARCHAR(16)  NOT NULL DEFAULT 'later',
  meeting_url   VARCHAR(500) NOT NULL DEFAULT '',
  address       VARCHAR(300) NOT NULL DEFAULT '',
  guest_tz      VARCHAR(64)  NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
-- One live booking per slot; a cancelled one frees the slot again.
CREATE UNIQUE INDEX IF NOT EXISTS app_halftone_bookings_slot ON app_halftone_bookings (date, time) WHERE status <> 'cancelled';
CREATE INDEX IF NOT EXISTS app_halftone_bookings_date ON app_halftone_bookings (date, time);

-- Journal posts. body is sanitised TipTap / ProseMirror JSON.
CREATE TABLE IF NOT EXISTS app_halftone_posts (
  id           BIGSERIAL PRIMARY KEY,
  slug         VARCHAR(80)  NOT NULL UNIQUE,
  title        VARCHAR(200) NOT NULL,
  excerpt      VARCHAR(400) NOT NULL DEFAULT '',
  category     VARCHAR(16)  NOT NULL,
  author       VARCHAR(120) NOT NULL,
  reading_time VARCHAR(20)  NOT NULL,
  palette      JSONB        NOT NULL,
  cover        VARCHAR(500) NOT NULL DEFAULT '',
  body         JSONB        NOT NULL,
  published    BOOLEAN      NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_halftone_posts_published ON app_halftone_posts (published, published_at DESC);

-- Key/value settings: the availability banner, the booking rules, the journal seed marker.
CREATE TABLE IF NOT EXISTS app_halftone_settings (
  key   VARCHAR(40) PRIMARY KEY,
  value JSONB NOT NULL
);

-- Images uploaded in the admin (post covers, images in posts), stored by the platform's file
-- storage as PUBLIC files. Only the file id lives here, never the bytes.
CREATE TABLE IF NOT EXISTS app_halftone_uploads (
  id           BIGSERIAL PRIMARY KEY,
  file_id      VARCHAR(32)  NOT NULL UNIQUE,
  name         VARCHAR(200) NOT NULL,
  content_type VARCHAR(127) NOT NULL,
  size         INTEGER      NOT NULL,
  ready        BOOLEAN      NOT NULL DEFAULT false,
  uploaded_by  INTEGER,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Rate limits for the public forms: one row per attempt, keyed by a hash (never a raw IP).
CREATE TABLE IF NOT EXISTS app_halftone_attempts (
  id         BIGSERIAL PRIMARY KEY,
  key        CHAR(64)    NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_halftone_attempts_key ON app_halftone_attempts (key, created_at);
CREATE INDEX IF NOT EXISTS app_halftone_attempts_created ON app_halftone_attempts (created_at);

COMMIT;
