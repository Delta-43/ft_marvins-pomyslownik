-- B9: an Idempotency-Key must always come with the same request body. Store a hash of it.
ALTER TABLE collect_runs ADD COLUMN request_hash text;
