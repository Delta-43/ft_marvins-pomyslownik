-- Language rule: every text a person sees exists in Polish and English.
-- Tags must carry both labels. (Source passages are quotes in the source's own language.)
ALTER TABLE tags ADD CONSTRAINT tags_both_languages
  CHECK (btrim(label_pl) <> '' AND btrim(label_en) <> '') NOT VALID;
ALTER TABLE evidence ADD COLUMN label jsonb;
ALTER TABLE card_sources ADD COLUMN passage_lang text CHECK (passage_lang IN ('pl','en'));
