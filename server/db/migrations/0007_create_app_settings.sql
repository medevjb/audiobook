-- Singleton row (id fixed to 1) so a GET never needs upsert-on-read logic.
CREATE TABLE app_settings (
  id                   SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name            TEXT NOT NULL DEFAULT 'Aloud',
  tagline              TEXT NOT NULL DEFAULT 'Turn any PDF into a natural, immersive reading and listening experience.',
  logo_url             TEXT,
  session_ttl_hours    INTEGER NOT NULL DEFAULT 720,
  min_password_length  INTEGER NOT NULL DEFAULT 8,
  signups_enabled      BOOLEAN NOT NULL DEFAULT true,
  maintenance_mode     BOOLEAN NOT NULL DEFAULT false,
  maintenance_message  TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by           UUID REFERENCES users(id)
);

INSERT INTO app_settings (id) VALUES (1);
