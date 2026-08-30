-- Explore restaurants imported from a Zomato export. Lives in Cloudflare D1
-- (the /explore feature stores its data in Cloudflare only, not Convex).
CREATE TABLE IF NOT EXISTS explore_restaurants (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  phone        TEXT    NOT NULL DEFAULT '',
  zomato_link  TEXT    NOT NULL DEFAULT '',
  new_contact  TEXT,
  remark       TEXT,
  next_call_at INTEGER,          -- unix ms
  created_at   INTEGER NOT NULL  -- unix ms; newest-first ordering
);

-- Dedupe key on re-import: skip rows whose Zomato link already exists.
CREATE INDEX IF NOT EXISTS idx_explore_zomato_link
  ON explore_restaurants (zomato_link);
