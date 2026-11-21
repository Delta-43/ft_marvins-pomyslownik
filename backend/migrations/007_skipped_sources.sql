-- Sources a collect run looked at and decided not to turn into a card (wrong owner type, no TRL, not an
-- innovation). Remembered so later runs move on to new sources instead of paying to read the same ones again.
CREATE TABLE skipped_sources (
  url        text PRIMARY KEY,
  reason     text NOT NULL,
  skipped_at timestamptz NOT NULL DEFAULT now()
);
