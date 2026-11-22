-- Task B15: the server picks the language (pl, en, uk). Contract 1.1.0-draft.3 and later.
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language text CHECK (preferred_language IN ('pl', 'en', 'uk'));

-- Machine translations of person-facing texts, keyed by the source text. A row with text NULL is queued:
-- the worker translates it. `machine` stays true until a person reviews the translation.
CREATE TABLE IF NOT EXISTS translations (
  source_hash  text NOT NULL,
  target_lang  text NOT NULL CHECK (target_lang IN ('pl', 'en', 'uk')),
  source_lang  text NOT NULL CHECK (source_lang IN ('pl', 'en')),
  source_text  text NOT NULL,
  text         text,
  machine      boolean NOT NULL DEFAULT true,
  attempts     integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  translated_at timestamptz,
  PRIMARY KEY (source_hash, target_lang)
);
CREATE INDEX IF NOT EXISTS translations_pending_idx ON translations (created_at) WHERE text IS NULL;
