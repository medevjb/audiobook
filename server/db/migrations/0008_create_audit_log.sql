CREATE TABLE audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action         TEXT NOT NULL,
  target_type    TEXT,
  target_id      TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_created_at_idx ON audit_log(created_at DESC);
