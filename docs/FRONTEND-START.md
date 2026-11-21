# Frontend start guide

You can build the whole frontend before the backend exists. The contract is `docs/api/openapi.yaml`.

## 1. Run the mock API

You need Docker.

```bash
docker compose --profile mock up
```

The mock API listens on `http://localhost:4010`. It answers every endpoint in the contract with example data.
All example text starts with `[MOCK]`. Stop it with `Ctrl+C`.

Try it:

```bash
curl "http://localhost:4010/api/v1/cards?limit=2"
curl "http://localhost:4010/api/v1/cards/7b1d5a52-3d0e-4c52-9a43-0a8e5f1c2d01"
curl "http://localhost:4010/api/v1/stats/overview"
```

The mock returns the same few examples whatever the query is. It does not filter or sort.
For states the examples do not cover (empty list, "not enough data", errors), see section 4.

## 2. Point your app at it

Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:4010` in `frontend/.env.local`.
Later, the real backend replaces the mock. You change only this value.

## 3. Generate types from the contract

Do not write API types by hand. Generate them, so a contract change shows up as a compile error.

```bash
npx openapi-typescript docs/api/openapi.yaml -o frontend/src/api/schema.d.ts
```

Re-run it whenever `openapi.yaml` changes.

## 4. States you must design for

| State | When | What the screen shows |
|---|---|---|
| Loading | Request in flight | A skeleton and a live-region message ("Loading results") |
| Empty | `meta.total` is 0 | A plain message and a way to clear filters |
| Not enough data | A score has `insufficientData: true` | The words "Not enough data" and the `sampleSize`. Never a number |
| Estimate | `basis: "estimate"` | A visible "Estimate" label and the `method` text |
| Confirmed | `basis: "confirmed"` | A "Confirmed" label and links to `sourceIds` |
| Stale | `stale: true` | A "Not checked recently" label with `lastCheckedAt` |
| Error | Any error body | The `message`, and the `requestId` in small text |
| Rate limited | HTTP 429 | Wait for `Retry-After`, then retry once |

To see these with the mock, send the header `Prefer: code=404` (or `422`, `429`, `500`) on a request.

## 5. Rules that come from the task

- **There is no form to submit an idea.** Do not build one.
- Show the source and the date next to every number. Link each `sourceId` to its `sources[]` entry.
- Show **Confirmed** and **Estimate** in a way that does not rely on colour alone.
- Text for people is `LocalizedText`. Show Polish first. Fall back to the other language if one is missing.
- Send usage events (`POST /api/v1/events`) in the background. Never block the screen on them. Never send free text.
- The admin endpoints need a token. Do not put the token in public frontend code. Only the demo admin page may use it, and only from an input field.

## 6. Accessibility checklist (WCAG 2.2 AA)

- Every control works with the keyboard. Focus is always visible.
- Text and controls meet the contrast ratio. Do not use colour as the only signal.
- Every form field has a visible label. Errors are written in text.
- Score bars and charts have a text or table version.
- Set `lang` on the page, and on any text in the other language.
- Respect `prefers-reduced-motion`.
- Run the automated checker (axe) before you open a pull request.

## 7. Asking for a contract change

1. Open a pull request that changes `docs/api/openapi.yaml`.
2. Run `docker run --rm -v "$PWD/docs/api":/spec -w /spec redocly/cli lint openapi.yaml`.
3. Tell the backend owner. Both sides agree before it is merged.
