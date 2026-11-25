-- ESC Certification Services – PostgreSQL schema
-- Idempotent: safe to run on every start.

CREATE TABLE IF NOT EXISTS organizations (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  sector        TEXT,
  city          TEXT,
  country       TEXT NOT NULL DEFAULT 'India',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('manufacturer', 'consultant', 'certification_manager', 'admin')),
  designation     TEXT,
  active          BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id               SERIAL PRIMARY KEY,
  organization_id  INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  product_category TEXT NOT NULL,
  scope            TEXT,
  standards        TEXT,
  current_stage    INTEGER NOT NULL DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 10),
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'certified', 'closed')),
  consultant_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  manager_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  target_date      DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milestones (
  id            SERIAL PRIMARY KEY,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage         INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 10),
  title         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date      DATE,
  completed_at  TIMESTAMPTZ,
  UNIQUE (project_id, stage)
);

CREATE TABLE IF NOT EXISTS actions (
  id            SERIAL PRIMARY KEY,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  owner         TEXT NOT NULL DEFAULT 'manufacturer' CHECK (owner IN ('manufacturer', 'esc')),
  due_date      DATE,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS documents (
  id            SERIAL PRIMARY KEY,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  category      TEXT NOT NULL DEFAULT 'other',
  original_name TEXT NOT NULL,
  stored_name   TEXT NOT NULL UNIQUE,
  mime_type     TEXT NOT NULL,
  size_bytes    INTEGER NOT NULL,
  is_report     BOOLEAN NOT NULL DEFAULT false,
  status        TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'needs_revision', 'final')),
  review_note   TEXT,
  reviewed_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audits (
  id            SERIAL PRIMARY KEY,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('mock_audit', 'factory_audit', 'lab_test', 'surveillance', 'meeting')),
  title         TEXT NOT NULL,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  location      TEXT,
  status        TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'postponed', 'cancelled')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inquiries (
  id                    SERIAL PRIMARY KEY,
  kind                  TEXT NOT NULL DEFAULT 'consultation' CHECK (kind IN ('consultation', 'assessment')),
  company_name          TEXT NOT NULL,
  contact_person        TEXT NOT NULL,
  designation           TEXT,
  email                 TEXT NOT NULL,
  mobile                TEXT,
  product_category      TEXT,
  sector                TEXT,
  certification_status  TEXT,
  target_market         TEXT,
  message               TEXT,
  status                TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'won', 'closed')),
  assigned_to           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resources (
  id            SERIAL PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  summary       TEXT NOT NULL,
  body          JSONB NOT NULL DEFAULT '[]'::jsonb,
  body_text     TEXT NOT NULL DEFAULT '',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  read_minutes  INTEGER,
  published_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  search        tsvector GENERATED ALWAYS AS (
                  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
                  setweight(to_tsvector('english', coalesce(body_text, '')), 'C')
                ) STORED
);

CREATE TABLE IF NOT EXISTS activity_log (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  detail      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_org        ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_consultant ON projects(consultant_id);
CREATE INDEX IF NOT EXISTS idx_actions_project     ON actions(project_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_project   ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_project    ON messages(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audits_project      ON audits(project_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_status    ON inquiries(status, created_at);
CREATE INDEX IF NOT EXISTS idx_resources_search    ON resources USING GIN (search);
CREATE INDEX IF NOT EXISTS idx_activity_project    ON activity_log(project_id, created_at);
