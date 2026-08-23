CREATE TABLE user_preferences (
  user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language     TEXT NOT NULL DEFAULT 'en',
  voice_uri    TEXT,
  rate         REAL NOT NULL DEFAULT 1.0,
  auto_advance BOOLEAN NOT NULL DEFAULT true,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
