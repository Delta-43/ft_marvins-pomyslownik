# Seed data

One JSON file per card in `cards/`. The format is the `Card` schema of `docs/api/openapi.yaml`.
Use `components.examples.CardDetail` as the template. Fictional examples start with `[MOCK]`. Real cards must not.

Rules:
- Every `confirmed` field lists the `sourceIds` of a source that says it, with the quoted `passage`.
- Anything inferred is an `estimate`, with a `method`.
- Check the licence before copying text from a source. Prefer short quotes and a link.
- Do not put personal data in the files. Cards describe organisations and solutions.
