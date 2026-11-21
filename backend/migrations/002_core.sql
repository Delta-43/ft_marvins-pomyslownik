-- B2: core schema. Names map to the contract in docs/api/openapi.yaml.
-- Rule: a stored fact is either "confirmed" (has source ids) or "estimate" (has a method). See provenance jsonb.

-- Lower-case, accent-free text for Polish search. unaccent() is STABLE, so wrap it to use it in indexes.
CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent', $1) $$;

CREATE TABLE organisations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('university','research_institute','school','local_government',
                'public_institution','company','startup','incubator','investor','individual','other')),
  url         text,
  region      text,                       -- region code, for example PK
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, type)
);

CREATE TABLE tags (
  slug      text PRIMARY KEY,
  label_pl  text,
  label_en  text,
  CHECK (label_pl IS NOT NULL OR label_en IS NOT NULL)
);

CREATE TABLE sources (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type             text NOT NULL CHECK (type IN ('api','crawl','document')),
  name             text NOT NULL,
  url              text NOT NULL UNIQUE,
  license          text,
  last_collected_at timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cards (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_pl              text,
  title_en              text,
  summary_short_pl      text,
  summary_short_en      text,
  summary_pl            text,
  summary_en            text,
  area                  text NOT NULL CHECK (area IN ('technological','educational','administrative')),
  organisation_id       uuid NOT NULL REFERENCES organisations(id),
  owner_name            text NOT NULL,
  owner_url             text NOT NULL,
  region                text,
  -- Provenance objects: { basis, sourceIds, evidenceIds, method } as in the contract
  implementation_level  text NOT NULL CHECK (implementation_level IN ('concept','prototype','testing','pilot','in_practice')),
  implementation_prov   jsonb NOT NULL,
  trl_applicable        boolean NOT NULL DEFAULT true,
  trl                   smallint CHECK (trl BETWEEN 1 AND 9),
  trl_prov              jsonb NOT NULL,
  assessment            jsonb NOT NULL DEFAULT '{}'::jsonb,   -- Scores with provenance, confidence, explanation
  score_innovativeness  smallint CHECK (score_innovativeness BETWEEN 0 AND 100),   -- copies for sort and filter
  score_application     smallint CHECK (score_application BETWEEN 0 AND 100),
  score_credibility     smallint CHECK (score_credibility BETWEEN 0 AND 100),
  oslo                  jsonb NOT NULL,
  could_also_be_used_in jsonb NOT NULL DEFAULT '[]'::jsonb,
  polish_ip             boolean NOT NULL DEFAULT false,
  first_seen_at         timestamptz NOT NULL DEFAULT now(),
  last_checked_at       timestamptz NOT NULL DEFAULT now(),
  status_changed_at     timestamptz,
  embedding             vector(384),      -- optional (B10). Null until computed
  search_text           text NOT NULL DEFAULT '',   -- title + summary + tags, accent-free, lower case
  search_tsv            tsvector GENERATED ALWAYS AS (to_tsvector('simple', search_text)) STORED,
  CHECK (title_pl IS NOT NULL OR title_en IS NOT NULL),
  CHECK (trl_applicable OR trl IS NULL)
);

CREATE INDEX cards_area_idx        ON cards (area);
CREATE INDEX cards_level_idx       ON cards (implementation_level);
CREATE INDEX cards_org_idx         ON cards (organisation_id);
CREATE INDEX cards_region_idx      ON cards (region);
CREATE INDEX cards_checked_idx     ON cards (last_checked_at DESC);
CREATE INDEX cards_search_tsv_idx  ON cards USING gin (search_tsv);
CREATE INDEX cards_search_trgm_idx ON cards USING gin (search_text gin_trgm_ops);

CREATE TABLE card_tags (
  card_id  uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  tag_slug text NOT NULL REFERENCES tags(slug),
  PRIMARY KEY (card_id, tag_slug)
);
CREATE INDEX card_tags_tag_idx ON card_tags (tag_slug);

-- A source row can serve many cards. The passage is per card, because it is the quote that card relies on.
CREATE TABLE card_sources (
  card_id   uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES sources(id),
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  passage   text,               -- null for pure API numbers
  PRIMARY KEY (card_id, source_id)
);

CREATE TABLE evidence (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id      uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  metric       text NOT NULL,
  value        jsonb NOT NULL,                      -- number, string or boolean
  unit         text,
  source_id    uuid NOT NULL REFERENCES sources(id),
  query        text NOT NULL,
  retrieved_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX evidence_card_idx ON evidence (card_id);

CREATE TABLE status_history (
  id        bigserial PRIMARY KEY,
  card_id   uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  at        timestamptz NOT NULL DEFAULT now(),
  field     text NOT NULL CHECK (field IN ('implementationLevel','trl','organisation','other')),
  from_value text,
  to_value   text,
  source_id uuid REFERENCES sources(id)
);
CREATE INDEX status_history_card_idx ON status_history (card_id, at DESC);

-- Usage events. No free text, no user id, no IP. Role only.
CREATE TABLE events (
  event_id    uuid PRIMARY KEY,                    -- client generated: duplicates are ignored
  type        text NOT NULL CHECK (type IN ('search_performed','card_viewed','compare_opened','filter_used')),
  occurred_at timestamptz NOT NULL,
  role        text,
  audience    text,
  area        text,
  tags        text[] NOT NULL DEFAULT '{}',
  card_id     uuid REFERENCES cards(id) ON DELETE SET NULL,
  result_count integer CHECK (result_count >= 0),
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_type_time_idx ON events (type, occurred_at);

CREATE TABLE collect_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode            text NOT NULL CHECK (mode IN ('collect','refresh')),
  status          text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed')),
  idempotency_key text UNIQUE,
  requested_at    timestamptz NOT NULL DEFAULT now(),
  started_at      timestamptz,
  finished_at     timestamptz,
  cards_added     integer NOT NULL DEFAULT 0,
  cards_updated   integer NOT NULL DEFAULT 0,
  status_changes  integer NOT NULL DEFAULT 0,
  errors          integer NOT NULL DEFAULT 0,
  changed_card_ids uuid[] NOT NULL DEFAULT '{}'
);
-- Single flight: at most one run queued or running at a time.
CREATE UNIQUE INDEX collect_runs_single_flight ON collect_runs ((true)) WHERE status IN ('queued','running');
