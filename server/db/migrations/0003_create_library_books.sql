CREATE TABLE library_books (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id       TEXT NOT NULL,
  filename      TEXT NOT NULL,
  size          BIGINT NOT NULL,
  last_modified BIGINT NOT NULL,
  total_pages   INTEGER NOT NULL,
  added_at      TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);

CREATE INDEX library_books_user_id_idx ON library_books(user_id);
