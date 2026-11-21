-- Polish IP has three states. polish_ip (boolean) stays "confirmed in a register"; this column says more.
-- confirmed: verified (for example in the UPRP register). stated: a source names a Polish patent, application,
-- invention, utility model or a Polish-built core technology, not yet verified. unknown: nothing found.
ALTER TABLE cards ADD COLUMN polish_ip_status text NOT NULL DEFAULT 'unknown'
  CHECK (polish_ip_status IN ('confirmed', 'stated', 'unknown'));
UPDATE cards SET polish_ip_status = 'confirmed' WHERE polish_ip;
