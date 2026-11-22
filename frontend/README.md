# Frontend

Next.js, TypeScript, Tailwind. Every API call runs on the Next.js server; the session token stays in an httpOnly cookie.
The plan and decisions for the current version are in `../docs/FRONTEND-PLAN.md`; the design system is `../DESIGN.md`.

```bash
cp .env.local.example .env.local
npm install
npm run api:types      # generate src/api/schema.d.ts from ../docs/api/openapi.yaml
npm run dev            # http://localhost:3000 (API from NEXT_PUBLIC_API_BASE_URL, or the mock on :4010)
npm run typecheck
```

Layout: `src/app` (routes), `src/components`, `src/lib` (API client, settings), `src/api` (generated types, not edited by hand),
`messages` (interface text in Polish, English and Ukrainian). The API answers in the language the site sends in `Accept-Language`.
