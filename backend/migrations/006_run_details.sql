-- B7: runs report how many cards were re-checked and keep a short log for the admin.
ALTER TABLE collect_runs ADD COLUMN cards_checked integer NOT NULL DEFAULT 0;
ALTER TABLE collect_runs ADD COLUMN log text[] NOT NULL DEFAULT '{}';
-- A source can be marked unreachable or changed by a refresh. NULL means not checked yet.
ALTER TABLE card_sources ADD COLUMN state text CHECK (state IN ('source_ok','source_changed','source_unavailable'));
ALTER TABLE card_sources ADD COLUMN checked_at timestamptz;
-- The admin can limit a run to some sources (POST /admin/collect-runs { sourceIds }).
ALTER TABLE collect_runs ADD COLUMN source_ids uuid[];
