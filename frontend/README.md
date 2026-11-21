# Frontend

Next.js, TypeScript, Tailwind. Start with `../docs/FRONTEND-START.md`.

```bash
cp .env.local.example .env.local
npm install
npm run api:types      # generate src/api/schema.d.ts from the contract
npm run dev            # http://localhost:3000, with the mock API on :4010
npm run typecheck
```

Layout: `src/app` (routes), `src/lib` (API client), `src/api` (generated types, not committed by hand), `messages` (Polish and English text).
