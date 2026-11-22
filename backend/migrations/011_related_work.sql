-- Task B17: similarity and research hits kept on the card ("who else works on this"). Rebuilt after every scoring.
CREATE TABLE IF NOT EXISTS related_work (
  id           bigserial PRIMARY KEY,
  card_id      uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  kind         text NOT NULL CHECK (kind IN ('card','publication','patent','research_project','transfer_listing','web_page')),
  card_ref     uuid REFERENCES cards(id) ON DELETE CASCADE,
  title        text NOT NULL,
  title_lang   text,
  url          text NOT NULL CHECK (url ~ '^https?://'),
  org_name     text,
  org_region   text,
  contact_url  text CHECK (contact_url IS NULL OR contact_url ~ '^https?://'),
  year         integer,
  similarity   real NOT NULL CHECK (similarity BETWEEN 0 AND 1),
  shared_tags  text[] NOT NULL DEFAULT '{}',
  source       text NOT NULL,
  found_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS related_work_card_idx ON related_work (card_id, similarity DESC);
