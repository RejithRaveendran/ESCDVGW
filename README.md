# ESC Certification & German Market Access

Website and client portal for the **DVGW Certification & German Market Access** division of ESC Utility Services Pvt. Ltd.

It uses the design system of the ESC corporate website (same navy and red, Manrope and Inter type, cards, buttons, header and footer), so it reads as another ESC division rather than a separate company.

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Tailwind CSS 4, Vite |
| Backend | Node.js, Express 5, Zod validation |
| Database | PostgreSQL (`pg`). Local development falls back to embedded PGlite (Postgres in WASM, same SQL) when `DATABASE_URL` is empty |
| Auth | JWT in an httpOnly, SameSite=strict cookie; bcrypt password hashes; role-based access |

## Quick start (development)

```bash
npm install
npm run dev:api     # API on http://localhost:4000 (creates the DB and demo data on first run)
npm run dev:web     # Website on http://localhost:5173 (proxies /api to the API)
```

You don't need a Postgres server for local work. Data is stored in `backend/.data/`; delete that folder to reset.

### Demo portal accounts (development only)

All demo accounts use the password `EscDemo#2026`:

| Role | E-mail |
|---|---|
| Manufacturer (valves project) | `client@demo.esc` |
| Manufacturer (pipes project) | `client2@demo.esc` |
| Consultant | `consultant@demo.esc` |
| Certification Manager | `manager@demo.esc` |
| Administrator | `admin@demo.esc` |

Demo data is **not** created in production unless `SEED_DEMO=true`.

## Production

```bash
cp .env.example .env          # set POSTGRES_PASSWORD, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d --build  # Postgres 16 + app on port 4000
```

The Express server serves the built React app and the API from one origin. Put it behind HTTPS (for example nginx or a load balancer) and set `TRUST_PROXY=true`. The schema is applied automatically on start (it is idempotent). The first administrator is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, and that admin then creates the other users in the portal.

Without Docker: `npm run build` → set `DATABASE_URL` and `JWT_SECRET` → `NODE_ENV=production npm start`.

## Tests

```bash
npm test -w backend
```

Integration tests run against a throwaway database. They cover role scoping (manufacturers only see their own organisation), staff-only actions, the CSRF header, the upload allow-list and scoped downloads, inquiry validation, user and project creation rights, knowledge-base search and PDF checklists.

## What's included

**Public website:** Home, About (with timeline), DVGW Certification (process diagrams, timeline chart, lifecycle diagram), Product Certification Requirements (searchable knowledge center plus one page per category with an interactive checklist, standards, preparation guide, common mistakes and a PDF checklist download), Services, Certification Process (10-stage timeline), Resources Center (full-text search with type filters), FAQ, Contact (all requested fields, with consultation or assessment mode), Image credits.

**Client portal (`/portal`):** dashboard with pending actions, audit schedule and recent messages; projects with milestone tracking; document upload and review; pending actions; consultant messaging; audit scheduling; reports for download. Certification Managers and Admins also get inquiry management, analytics and user and organisation management.

| Role | Can do |
|---|---|
| Manufacturer | See own organisation's projects, upload documents, complete own actions, message, download reports |
| Consultant | Everything on assigned projects: stages, milestones, actions, document review, audits, reports |
| Certification Manager | All projects, create projects, assign consultants, inquiries, analytics, create organisations |
| Administrator | Everything, plus user management (create, roles, deactivate) |

**SEO:** per-page titles, descriptions and canonical URLs, Open Graph tags, schema.org `ProfessionalService`, `FAQPage` and `Article` markup, `robots.txt` (portal disallowed), and `sitemap.xml`. In `frontend/public/sitemap.xml`, replace `https://YOUR-DOMAIN` with the real domain. For best indexing, pre-render the public routes at build time (for example with `vite-plugin-ssg` or a static pre-render step), because the site is a client-rendered SPA.

## Content

All copy lives in `shared/*.json` (`categories.json`, `site.json`, `resources.json`), the single source for both the React pages and the API (search index, PDF checklists).

**Review before launch:**

- **Standards references** are indicative. Have ESC's certification experts confirm the DVGW worksheets and EN standards listed for each category in `shared/categories.json`.
- **Case studies** in `resources.json` are labelled *illustrative*. Replace them with approved client stories.
- **About → timeline:** add founding and milestone years in `shared/site.json` → `timeline`.
- **Photography:** the industrial photos come from Wikimedia Commons under CC licences, with attribution at `/image-credits` and in `docs/IMAGE_CREDITS.md`. Replace them with ESC's own photography when available. The Technopark, office and water-aerial images come from the ESC corporate website.
- **Imprint and privacy links** point to the corporate site (`/imprint`, `/privacy-policy`).

## Project layout

```
shared/            Content JSON shared by frontend and backend
frontend/          React app (pages/, components/, portal/)
backend/src/       Express app, routes/, db/ (schema.sql, seed.js), lib/checklistPdf.js
backend/test/      Integration tests
docs/              Image credits
```
