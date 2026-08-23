-- Intentionally not FK'd to library_books: mirrors the client's own design
-- (IndexedDB `books` and `progress` are independent stores; deletion is
-- coordinated in application code, not via DB cascade), and avoids forcing a
-- strict write-order between the two sync calls the client makes
-- independently (book save vs. progress save).
CREATE TABLE reading_progress (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id       TEXT NOT NULL,
  filename      TEXT NOT NULL,
  current_page  INTEGER NOT NULL,
  total_pages   INTEGER NOT NULL,
  language      TEXT,
  voice_uri     TEXT,
  rate          REAL,
  auto_advance  BOOLEAN,
  updated_at    TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, book_id)
);

CREATE INDEX reading_progress_user_updated_idx ON reading_progress(user_id, updated_at DESC);
