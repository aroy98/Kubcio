# Kubcio — SaaS Architecture & Compliance

## Overview

Kubcio is designed to scale from a single-clinic prototype to a multi-tenant SaaS platform serving healthcare organisations of any size. This document covers the target production architecture, AWS infrastructure, multi-tenancy model, and HIPAA compliance posture.

---

## Multi-Tenant Architecture

### Tenancy Model: Tenant-per-Schema (Recommended)

Each healthcare organisation (tenant) gets an isolated schema within a shared RDS cluster. This balances cost efficiency with strong data isolation — a misconfigured query in Tenant A cannot read Tenant B's PHI.

```
┌─────────────────────────────────────────────┐
│              Shared Infrastructure          │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Tenant A │  │ Tenant B │  │ Tenant C │   │
│  │ (schema) │  │ (schema) │  │ (schema) │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│              RDS PostgreSQL                 │
└─────────────────────────────────────────────┘
```

| Model | Isolation | Cost | Complexity |
|---|---|---|---|
| Shared schema | Low | Lowest | Low |
| **Tenant-per-schema** | **Medium-High** | **Medium** | **Medium** |
| Tenant-per-database | High | High | High |

### Tenant Identification

Every API request carries a `X-Tenant-ID` header (resolved from JWT claims). Middleware resolves the tenant before any DB query and sets the Postgres `search_path` to the tenant's schema.

```
Request → API Gateway → JWT validation → Tenant resolution → ECS service → RDS (tenant schema)
```

### Tenant Onboarding

1. Admin creates tenant record (org name, plan, region)
2. Migration runner creates isolated schema + seeds roles
3. Admin user invited via email (SES)
4. Tenant gets a subdomain: `{org}.kubcio.app`

---

## AWS Infrastructure

### Core Services

| Service | Role |
|---|---|
| **ECS Fargate** | Runs containerised backend API (no server management) |
| **ECR** | Private Docker image registry |
| **RDS PostgreSQL (Multi-AZ)** | Persistent patient + audit data |
| **ElastiCache (Redis)** | Session store, rate limiting, short-lived caches |
| **S3** | Frontend static assets, document storage, audit exports |
| **CloudFront** | CDN in front of S3 (HTTPS, edge caching) |
| **ALB** | Load balancer routing to ECS tasks |
| **API Gateway** | Optional edge layer for rate limiting + auth |
| **Secrets Manager** | API keys, DB credentials (never in env files) |
| **KMS** | Encryption key management for RDS, S3, CloudWatch |
| **WAF** | Web application firewall in front of ALB/CloudFront |
| **CloudWatch** | Logs, metrics, alarms |
| **CloudTrail** | AWS API audit trail |
| **SES** | Transactional email (invites, alerts) |
| **Cognito** | User identity, MFA, OAuth2/OIDC |

### Architecture Diagram

```
                         ┌──────────────┐
  User Browser ───────── │  CloudFront  │──────▶ S3 (React SPA)
                         └──────┬───────┘
                                │ API calls
                         ┌──────▼───────┐
                         │     WAF      │
                         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │     ALB      │
                         └──────┬───────┘
                                │
                    ┌───────────▼────────────┐
                    │     ECS Fargate        │
                    │  ┌─────┐  ┌─────┐      │
                    │  │Task │  │Task │ ...  │
                    │  └──┬──┘  └──┬──┘      │
                    └─────┼────────┼─────────┘
                          │        │
             ┌────────────▼──┐  ┌──▼────────────────┐
             │ RDS PostgreSQL│  │ ElastiCache Redis │
             │   (Multi-AZ)  │  └───────────────────┘
             └───────────────┘
                    │
             ┌──────▼──────┐
             │     KMS     │ (encryption at rest)
             └─────────────┘
```

### ECS Fargate Setup

- **Cluster**: One ECS cluster per environment (`kubcio-prod`, `kubcio-staging`)
- **Service**: Auto-scaling based on ALB request count and CPU
- **Task Definition**: Node.js container, secrets injected from Secrets Manager at runtime (never baked into image)
- **Networking**: Tasks run in private subnets; ALB in public subnets
- **Health checks**: ALB checks `/health` endpoint every 30s

```yaml
# Task definition excerpt
containerDefinitions:
  - name: kubcio-api
    image: <ecr-uri>/kubcio-api:latest
    portMappings:
      - containerPort: 4000
    secrets:
      - name: AI_PROVIDER_API_KEY
        valueFrom: arn:aws:secretsmanager:...:kubcio/ai-api-key
      - name: DATABASE_URL
        valueFrom: arn:aws:secretsmanager:...:kubcio/db-url
    logConfiguration:
      logDriver: awslogs
      options:
        awslogs-group: /ecs/kubcio-api
        awslogs-region: us-east-1
```

### CI/CD Pipeline

```
GitHub push (master)
        │
        ▼
GitHub Actions
  ├── Build Docker image
  ├── Push to ECR
  ├── Update ECS task definition
  └── ECS rolling deployment (zero downtime)
```

---

## HIPAA Compliance

### What HIPAA Requires

HIPAA's Security Rule mandates administrative, physical, and technical safeguards for Protected Health Information (PHI). As a SaaS platform processing clinical notes and patient records, Kubcio is a **Business Associate** and must sign a **BAA** with every covered entity customer.

### Technical Safeguards

#### Encryption

| Data State | Method |
|---|---|
| In transit | TLS 1.2+ enforced at ALB and CloudFront; HTTP rejected |
| At rest (RDS) | AES-256 via AWS KMS customer-managed keys (CMK) |
| At rest (S3) | SSE-KMS on all buckets; public access blocked |
| At rest (Redis) | ElastiCache encryption at rest enabled |
| Backups | RDS automated backups encrypted with same CMK |

#### Access Control

- **Cognito** issues short-lived JWT access tokens (15-min expiry) + refresh tokens with rotation
- Role claims embedded in JWT — never trust client-supplied role headers in production
- RBAC enforced server-side: `notes:generate`, `notes:write`, `audit:read`, `admin:*`
- Break-glass access procedure documented for emergency PHI access
- MFA required for all clinical staff roles

#### Audit Logging

- All PHI access (read, write, generate, export) written to an **append-only audit table**
- Audit records include: actor ID, tenant ID, patient ID, resource type, action, timestamp, IP, user agent
- CloudTrail captures all AWS API calls
- CloudWatch Logs retained for **6 years** (HIPAA minimum) with log integrity validation
- Audit exports available to tenant admins (encrypted S3 presigned URLs, 1-hour expiry)

#### Minimum Necessary Access

- API endpoints return only fields required for the operation (no over-fetching)
- Nurses: read-only access to notes; cannot generate or save
- AI service receives transcript text only — no patient demographics unless clinically necessary
- DB IAM roles scoped per service (read-only replica for audit queries)

#### Incident Response

- GuardDuty enabled for threat detection
- CloudWatch alarms on: unusual query volumes, failed auth spikes, cross-tenant query attempts
- SNS alerts → PagerDuty → on-call engineer
- Breach notification procedure: 60-day notification window per HIPAA

### AI & PHI

- Anthropic BAA signed before any PHI sent to Claude API
- Model training on customer data: **disabled** (Anthropic zero-retention agreement)
- All Claude prompts/responses logged with automatic PII/PHI redaction in logs
- Transcripts routed through backend proxy only — API key never in browser

### Business Associate Agreements

Kubcio must maintain BAAs with:

| Vendor | Role |
|---|---|
| AWS | Infrastructure (S3, RDS, ECS, CloudWatch, etc.) |
| Anthropic | AI inference on clinical transcripts |
| Any email provider | Patient communication |

Customers (covered entities) sign a BAA with Kubcio before accessing the platform.

### Shared Responsibility

| Responsibility | AWS | Kubcio | Customer |
|---|---|---|---|
| Physical data centre security | ✅ | | |
| Network infrastructure | ✅ | | |
| Encryption key management | ✅ (KMS) | ✅ (CMKs) | |
| Application security | | ✅ | |
| Access control configuration | | ✅ | |
| Staff training | | ✅ | ✅ |
| Breach notification to patients | | ✅ | ✅ |

---

## Scaling Considerations

| Concern | Solution |
|---|---|
| API throughput | ECS auto-scaling; ALB distributes across tasks |
| DB read load | RDS read replicas for audit/history queries |
| AI rate limits | Request queue (SQS) with exponential backoff |
| Large transcripts | Async generation: SQS → ECS worker → WebSocket notify |
| Tenant isolation | Row-level security (Postgres RLS) as secondary enforcement layer |
| Disaster recovery | RDS Multi-AZ; cross-region S3 replication; RTO < 1hr, RPO < 15min |
