-- Tag labels start with a capital letter in both languages (design review). New tags are written that way by the
-- loader; this fixes the ones already stored.
UPDATE tags SET label_pl = upper(left(label_pl, 1)) || substr(label_pl, 2),
                label_en = upper(left(label_en, 1)) || substr(label_en, 2);
