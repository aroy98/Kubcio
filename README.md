# ClinicalFlow — AI-Assisted EMR Visit Note (Prototype)

An 8-hour technical assignment prototype for generating, reviewing, and saving SOAP visit notes from consultation transcripts using Anthropic Claude.

## Running Locally

1. Clone the repo.
2. Backend setup:
   ```bash
   cd backend
   cp ../.env.example .env
   # Edit .env and set AI_PROVIDER_API_KEY to your Anthropic API key
   npm install
   npm run dev
   ```
3. Frontend setup (new terminal):
   ```bash
   cd frontend
   echo VITE_API_BASE_URL=http://localhost:3001 > .env
   npm install
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173).
5. Default role is **Doctor**. Use the sidebar role switcher to test access control.

## Features Completed

- Synthetic patient display (Margaret Chen) with allergy and diagnosis badges
- Role switcher (Doctor / Nurse) with `x-user-role` header on all API calls
- Consultation transcript input with live character counter (red at 4800+)
- AI SOAP note generation via Anthropic Claude (doctor-only)
- Editable SOAP editor with AI review warning banner
- Save visit note to in-memory store (doctor-only, upsert by visit ID)
- Visit history with expandable full notes and visit type badges
- Collapsible audit log (NOTE_GENERATED, NOTE_SAVED events)
- react-hot-toast notifications for success, 403, 502, and network errors
- Backend role middleware, validation, CORS, and global error handler

## Features Intentionally Skipped

- No JWT authentication (replaced by `x-user-role` header for demo)
- No real database (in-memory store, resets on restart)
- No test suite
- No patient search/list
- No appointment, billing, lab, or medication features
- No Docker or deployment config
- No mobile optimization

**Reason:** 8-hour scope constraint.

## Role Demo

- Set role to **Doctor** → Generate and Save work normally.
- Set role to **Nurse** → Generate and Save return **403** from the backend (not just hidden in the frontend).

## Production Readiness Notes

### Authentication

Replace the `x-user-role` demo header with industry-standard authentication: OAuth2/OIDC for staff identity, short-lived JWT access tokens, refresh token rotation, and server-side session invalidation on logout. Every API request must be tied to a verified user identity, not a client-supplied role string.

### RBAC (Role-Based Access Control)

Enforce permissions on the server from claims embedded in signed tokens (e.g. `doctor`, `nurse`, `admin`). Map roles to fine-grained actions (`notes:generate`, `notes:write`, `audit:read`). Nurses may read notes but not generate or finalize; admins may access audit exports. Never trust role values from request headers without cryptographic verification.

### Audit Logging

Persist audit events in an append-only store (immutable log table or WORM storage). Include actor ID, IP, resource IDs, before/after hashes for note saves, and correlation IDs. Retain logs per HIPAA and organizational policy (typically 6+ years). The in-memory demo array is not durable or tamper-evident.

### Patient Data Privacy

Store PHI only in HIPAA-eligible infrastructure with encryption at rest (AES-256) and in transit (TLS 1.2+). Apply minimum-necessary access, break-glass procedures, and BAAs with all subprocessors. Synthetic demo data must never be mixed with real patient records in shared environments.

### AI Data Protection

Send only the minimum transcript text required for documentation. Use BAAs with the AI vendor where PHI is involved, disable model training on customer data, log prompts/responses with redaction, and route requests through a backend proxy so API keys never reach the browser. Consider on-prem or VPC-hosted models for stricter tenants.

### Hallucination Handling

Treat all AI output as draft until a licensed clinician signs. Surface confidence cues, require explicit attestation before save, version AI vs. human-edited fields, and support rollback. Implement human-in-the-loop review queues and periodic chart audits for unsafe or invented clinical content.
