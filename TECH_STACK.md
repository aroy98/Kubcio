# Technology Choices — ClinicalFlow Prototype

Practical reasoning for an 8-hour EMR visit-note assignment. Each choice optimizes for speed to a working demo, not long-term platform scale.

## 1. Frontend: React + Vite — why not Next.js

This app is a **single page** with no routing, SSR, or SEO requirements. Vite starts in milliseconds and ships a minimal React 18 SPA without the Next.js file-router and server conventions. That saves roughly an hour of framework overhead on a fixed clock. Next.js would pay off for multi-route products, auth middleware, or edge deployment — none of which are in scope here.

## 2. Backend: Express — why not NestJS for 8 hours

Express gives a flat stack: mount routers, add middleware, listen. NestJS adds modules, decorators, DI, and boilerplate that slow a solo 8-hour build. For three route groups and one AI service, Express keeps the mental model linear. NestJS is the better default when the team is large and the API will grow for years; this prototype will not.

## 3. Storage: in-memory — trade-offs vs SQLite

Arrays reset on restart and cannot survive deploys or horizontal scaling, but they need zero schema migrations, connection pooling, or ORM setup. SQLite would add file paths, locking, and seed scripts for marginal benefit when the spec requires one hardcoded patient and no persistence guarantees. Production would use PostgreSQL (or similar) with migrations and backups.

## 4. API: REST — why not GraphQL

The UI needs five straightforward operations (patient, generate, save, list notes, list audit). REST maps 1:1 to those endpoints with express-validator on POST bodies. GraphQL would require schema, resolvers, and client tooling without reducing frontend code for this surface area.

## 5. State: local `useState` — why not Zustand

All state lives in `App.tsx` and flows down as props. There is no cross-cutting global store, persistence, or middleware. Zustand would add a dependency and indirection for ~10 fields that one component already owns. If the app grew to many disconnected panels, a light store would become justified.

## 6. AI: Anthropic Claude Haiku — why not GPT-4o

The assignment specifies `@anthropic-ai/sdk` and `claude-haiku-4-5-20251001`. Haiku is fast and inexpensive for structured JSON SOAP extraction from transcripts — ideal for iterative demo clicks. GPT-4o can be stronger on nuance but adds a second vendor integration and typically higher latency/cost per generate during development.

## 7. Secrets: backend-only `.env`, never exposed to frontend

The Anthropic API key must only exist in `backend/.env`. The frontend talks to our Express proxy; Vite env vars are bundled into client JS and would leak any key prefixed with `VITE_`. This mirrors production: browsers never hold LLM provider credentials.

## 8. Role checks: header-based for demo, JWT in production

`x-user-role` lets graders toggle Doctor/Nurse without building login. It is intentionally insecure — any client can spoof the header. Production uses signed JWTs (or session cookies) where roles are claims issued by the identity provider after MFA, validated on every request.

## 9. Audit: in-memory for demo, append-only DB table in production

The demo array proves the event model (`NOTE_GENERATED`, `NOTE_SAVED`) and UI. Production needs insert-only audit rows, actor IDs from auth (not headers), timestamps from server clock, and retention policies. Tampering with in-memory arrays is trivial; regulated environments require WORM or hash-chained logs.

## 10. What changes for a production healthcare product

| Area | Prototype | Production |
|------|-----------|------------|
| Auth | `x-user-role` header | OIDC + JWT, MFA, session management |
| Data | In-memory arrays | PostgreSQL, encryption, backups, PHI isolation |
| AI | Direct Anthropic call | BAA-covered proxy, prompt logging, redaction, rate limits |
| Compliance | Synthetic patient only | HIPAA, access controls, audit retention, breach procedures |
| Frontend | Single SPA | EHR integration, SSO, accessibility, mobile workflows |
| Ops | `npm run dev` | CI/CD, staging, monitoring, on-call, DR |

The prototype validates UX and API shape; production replaces every trust boundary (identity, storage, AI, audit) with hardened equivalents.
