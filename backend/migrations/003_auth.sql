-- B12: sign-in. Personal data lives only in users. Deleting a user removes it and the sessions (ON DELETE CASCADE).
-- Usage events keep no user id, so aggregated counts survive deletion.
CREATE TABLE users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider           text NOT NULL CHECK (provider IN ('sandbox_id','login_gov_pl')),
  provider_subject   text NOT NULL,
  email              text NOT NULL,
  display_name       text,
  role               text NOT NULL CHECK (role IN ('investors_business','public_bodies','universities','schools','startups_enterprises','inventors')),
  affiliation_name   text NOT NULL,
  affiliation_type   text NOT NULL,
  interests          text[] NOT NULL DEFAULT '{}',
  consent_to_contact boolean NOT NULL DEFAULT false,
  terms_accepted_at  timestamptz NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject)
);

-- Only a hash of the session token is stored.
CREATE TABLE sessions (
  token_hash  text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expiry_idx ON sessions (expires_at);
