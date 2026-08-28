# Proofline Backend

## Production architecture and implementation blueprint

This document defines the recommended production backend for Proofline, the
Responsible AI operations platform represented by the current frontend
prototype.

The prototype keeps state in the browser. The production platform described
here persists governed configuration, AI Registry records, reviews, evidence,
findings, decisions, content, identity mappings, notifications, and immutable
audit history behind authenticated APIs.

The design targets Microsoft Azure and includes:

- Microsoft Entra ID authentication and directory-backed authorization
- Docker workloads hosted on Azure Container Apps
- Azure Container Registry
- Azure Front Door Premium, Web Application Firewall, and API Management
- Azure Database for PostgreSQL Flexible Server as the recommended OLTP store
- Azure SQL Database as an alternative relational implementation
- Azure Blob Storage / ADLS Gen2 for workbooks and evidence
- Azure Service Bus and Event Grid for asynchronous processing
- Azure Databricks and Unity Catalog for governed analytics
- GitHub Actions or Azure DevOps YAML pipelines
- Private networking, managed identities, Key Vault, monitoring, HA, and DR

---

## 1. Architecture decisions

### 1.1 Recommended application shape

Start with a **modular monolith plus asynchronous workers**, deployed as
separate containers:

1. **Web/BFF** — serves the web application and its user-focused API surface.
2. **Core API** — contains Registry, Review, Evidence, Governance, Content, and
   Audit modules with explicit internal boundaries.
3. **Worker** — consumes messages, validates files, runs timers, sends
   notifications, synchronizes directories, and exports analytical data.

This shape gives Proofline transactional consistency and manageable operations
without creating a distributed system prematurely. Each module owns its schema
and public contract, so a module can be extracted into a microservice when
independent scaling, release cadence, or team ownership justifies it.

### 1.2 Relational database decision

Use **Azure Database for PostgreSQL Flexible Server** as the default operational
database.

Use **Azure SQL Database** instead only when an organizational standard,
existing DBA capability, or SQL Server-specific integration makes it the
preferred choice.

Do not dual-write PostgreSQL and Azure SQL. Select one as the sole transactional
source of truth. The logical data model in this document works with either.

### 1.3 Databricks decision

Databricks is not the transactional backend. It receives incremental copies of
operational events and conformed data for:

- review portfolio reporting;
- SLA and throughput analysis;
- risk and control-gap trends;
- audit evidence exports;
- data quality checks;
- governed access and lineage through Unity Catalog.

### 1.4 Artifact decision

Workbook and evidence binaries never live in relational columns. Azure Blob
Storage holds the bytes. The database holds metadata, checksums, Blob version
IDs, classifications, scan status, retention rules, and links to domain
records.

---

## 2. System context

~~~mermaid
flowchart LR
    Submitter[Submitter]
    Auditor[Auditor]
    Admin[Platform admin]
    Entra[Microsoft Entra ID]
    Source[Enterprise systems / AI inventory]
    Notify[Email / Teams]
    BI[Power BI and approved analysts]

    subgraph Proofline[Proofline platform]
        Edge[Azure Front Door + WAF]
        App[Proofline application]
        Data[(Operational data and evidence)]
        Lake[Governed lakehouse]
    end

    Submitter -->|Register systems, submit reviews, provide evidence| Edge
    Auditor -->|Assess, request evidence, decide| Edge
    Admin -->|Configure process, content, and access| Edge
    Edge --> App
    Entra -->|OIDC authentication and group sync| App
    Source -->|API or controlled batch import| App
    App -->|Notifications| Notify
    App --> Data
    Data -->|Incremental analytical export| Lake
    Lake --> BI
~~~

---

## 3. Azure production topology

~~~mermaid
flowchart TB
    Users[Browser users]
    Entra[Microsoft Entra ID]

    subgraph Edge[Global edge]
        FD[Azure Front Door Premium]
        WAF[Web Application Firewall]
        APIM[Azure API Management]
        FD --> WAF --> APIM
    end

    subgraph Primary[Primary Azure region]
        subgraph VNet[Application virtual network]
            subgraph ACA[Zone-redundant Azure Container Apps environment]
                Web[Web / BFF container]
                API[Core API container]
                Worker[Worker container]
            end
            SB[Azure Service Bus Premium]
            EG[Azure Event Grid]
            KV[Azure Key Vault]
            AppConfig[Azure App Configuration]
            Monitor[Application Insights / Azure Monitor]
        end

        PG[(PostgreSQL Flexible Server HA)]
        Blob[(Blob Storage / ADLS Gen2)]
        Search[Azure AI Search - optional]
        ACR[Azure Container Registry Premium]
    end

    subgraph Analytics[Analytics and governance]
        Bronze[ADLS Bronze]
        Silver[Delta Silver]
        Gold[Delta Gold]
        DBX[Azure Databricks]
        UC[Unity Catalog]
        PBI[Power BI]
    end

    Users -->|HTTPS| FD
    Entra -->|OIDC / OAuth 2.0| Web
    APIM -->|Private Link| Web
    Web --> API
    API --> PG
    API --> Blob
    API --> SB
    API --> EG
    API --> Search
    Worker --> SB
    Worker --> PG
    Worker --> Blob
    Web --> KV
    API --> KV
    Worker --> KV
    Web --> AppConfig
    API --> AppConfig
    Worker --> AppConfig
    ACR -. Managed identity image pull .-> ACA
    ACA --> Monitor
    PG -->|Incremental export / CDC| Bronze
    Blob -->|Governed analytical files| Bronze
    Bronze --> DBX --> Silver --> Gold
    UC --- Bronze
    UC --- Silver
    UC --- Gold
    Gold --> PBI
~~~

### 3.1 Edge and ingress

- Front Door Premium is the only public application origin.
- WAF applies managed rules, bot protection, request-size limits, rate limits,
  and custom blocking rules.
- Front Door connects to the Container Apps environment through Private Link.
- API Management validates tokens, enforces API versions and quotas, injects a
  correlation ID, and publishes only approved APIs.
- Direct public access to Container Apps, PostgreSQL/Azure SQL, Storage, Key
  Vault, ACR, Service Bus, and Databricks workspace storage is disabled.

### 3.2 Compute

- Use Azure Container Apps workload profiles for predictable production
  capacity and private networking.
- Deploy at least two replicas for interactive services in production.
- Use revision traffic splitting for canary deployment and rapid rollback.
- Scale Web/API on HTTP concurrency and Worker on Service Bus queue depth.
- Use managed identities for ACR pull and all service-to-service access.
- Run containers as non-root with read-only root filesystems where supported.
- Expose health endpoints separately:
  - `/health/live` — process is alive;
  - `/health/ready` — required dependencies are reachable;
  - `/health/startup` — initialization and migrations are complete.

### 3.3 Messaging

Use Service Bus Premium for durable workflow work:

- `review-commands`;
- `artifact-processing`;
- `notification-dispatch`;
- `directory-sync`;
- `analytics-export`.

Use topics for domain events consumed by multiple handlers:

- `proofline-domain-events`;
- subscriptions per bounded context;
- dead-letter queues with alerting and replay tooling;
- duplicate detection for send retries;
- idempotent consumers keyed by `message_id`;
- sessions keyed by `review_id` when ordering matters.

Event Grid is appropriate for Blob-created events and external event routing.
Service Bus remains the durable business-workflow transport.

### 3.4 Configuration and secrets

- Non-secret dynamic settings: Azure App Configuration.
- Secrets, certificates, and encryption keys: Azure Key Vault.
- Runtime access: managed identity, never stored client secrets.
- Feature flags: App Configuration with environment-specific labels.
- Schema migrations: versioned migration package run once per release.

---

## 4. Backend modules

| Module | Responsibilities | Owns |
|---|---|---|
| Identity & Access | Token validation, tenant context, principals, directory groups, scoped role assignments | `principal`, `directory_group`, `role_assignment` |
| AI Registry | AI system identity, ownership, lifecycle, configurable fields, readiness rules | `ai_system`, registry field definitions and values |
| Review | Review creation, lifecycle snapshot, assignments, stage state machine, SLA | `review`, `stage_run`, `assignment` |
| Assessment | Template/question versions and structured responses | `assessment_template`, `question_version`, `assessment_response` |
| Evidence | Requests, submissions, artifact metadata, scan results, controlled download | evidence and artifact tables |
| Findings & Decisions | Findings, remediation, decision conditions, sign-offs | `finding`, `decision`, `signoff` |
| Governance Configuration | Versioned lifecycles, stages, routing, timelines, Registry schema | configuration version tables |
| Content | News, Library resources, attachments, audience rules, publication | `content_item`, `audience_rule` |
| Notification | In-app notifications, email/Teams dispatch, preferences, delivery attempts | notification tables |
| Audit | Append-only audit event and transactional outbox | `audit_event`, `outbox_event` |

### Module boundary rule

A module may read another module through an explicit query contract. It must not
write another module's tables directly. Cross-module side effects use an
application command in the same process or a domain event through the
transactional outbox.

---

## 5. Review lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Submitted: Registry ready + workbook valid
    Submitted --> BusinessOwnerReview
    BusinessOwnerReview --> Assessment: approved
    BusinessOwnerReview --> Returned: changes required
    Assessment --> EvidenceRequested: more evidence needed
    EvidenceRequested --> Assessment: response submitted
    Assessment --> Decision: assessment complete
    Decision --> Approved
    Decision --> ApprovedWithConditions
    Decision --> Rejected
    ApprovedWithConditions --> ConditionMonitoring
    ConditionMonitoring --> Closed: conditions satisfied
    Approved --> Closed
    Rejected --> Closed
    Returned --> Draft: submitter revises
    Closed --> [*]
~~~

The lifecycle configuration is versioned. A review stores the
`lifecycle_version_id` selected when it is submitted. Publishing a new
configuration never changes the process already assigned to an in-flight
review.

---

## 6. Primary request flows

### 6.1 Register an AI system

~~~mermaid
sequenceDiagram
    autonumber
    actor User as Submitter
    participant Web as Web / BFF
    participant API as Registry module
    participant DB as Operational DB
    participant Outbox as Transactional outbox
    participant Bus as Service Bus
    participant Audit as Audit consumer

    User->>Web: Submit AI Registry form
    Web->>API: POST /api/v1/ai-systems
    API->>API: Validate token, tenant, schema, and ownership
    API->>DB: Insert AI system + field values
    API->>Outbox: Insert ai-system.registered event in same transaction
    DB-->>API: Commit
    API-->>Web: 201 Created + AIR number
    Outbox->>Bus: Publish event
    Bus->>Audit: Persist immutable audit projection
~~~

### 6.2 Create and submit a review

~~~mermaid
sequenceDiagram
    autonumber
    actor User as Submitter
    participant Web as Web / BFF
    participant Review as Review module
    participant Evidence as Evidence module
    participant Blob as Azure Blob Storage
    participant Scan as File validation worker
    participant DB as Operational DB
    participant Bus as Service Bus

    User->>Web: Select Registry record and review type
    Web->>Review: POST /api/v1/reviews
    Review->>DB: Create draft review
    Review-->>Web: Review ID + upload session
    Web->>Evidence: Request upload URL
    Evidence->>DB: Create pending artifact version
    Evidence-->>Web: Short-lived user-delegation upload URL
    Web->>Blob: Upload workbook directly
    Blob-->>Bus: Blob-created event
    Bus->>Scan: Validate extension, signature, malware, size, checksum
    Scan->>DB: Mark artifact accepted or quarantined
    User->>Web: Submit review
    Web->>Review: POST /api/v1/reviews/{id}/submit
    Review->>DB: Verify Registry readiness and accepted workbook
    Review->>DB: Snapshot lifecycle version and create first stage run
    Review->>Bus: review.submitted via transactional outbox
    Review-->>Web: 202 Accepted
~~~

### 6.3 Evidence request and response

~~~mermaid
sequenceDiagram
    autonumber
    actor Auditor
    actor Submitter
    participant API as Proofline API
    participant DB as Operational DB
    participant Bus as Service Bus
    participant Notify as Notification worker
    participant Blob as Blob Storage

    Auditor->>API: Create evidence request
    API->>DB: Insert request and update stage state
    API->>Bus: evidence.requested
    Bus->>Notify: Dispatch in-app + email/Teams
    Notify-->>Submitter: Request and due date
    Submitter->>Blob: Upload supporting artifact
    Submitter->>API: Submit response + artifact version IDs
    API->>DB: Insert evidence submission
    API->>Bus: evidence.submitted
    Bus->>Notify: Notify assigned auditor
    API-->>Auditor: Updated evidence timeline
~~~

### 6.4 Sign-off

1. The API checks that the caller has decision rights for the active stage.
2. Required findings must be resolved, waived by an authorized role, or
   represented as explicit approval conditions.
3. The client submits a decision request with an idempotency key.
4. The service records the immutable decision, sign-off, stage transition,
   audit event, and outbox event in one transaction.
5. A signed decision artifact may be generated and stored with a checksum.
6. Notifications and analytics projections are asynchronous.

---

## 7. Operational data model

### 7.1 Core ER model

~~~mermaid
erDiagram
    TENANT ||--o{ PRINCIPAL : contains
    TENANT ||--o{ DIRECTORY_GROUP : contains
    PRINCIPAL ||--o{ ROLE_ASSIGNMENT : receives
    DIRECTORY_GROUP ||--o{ ROLE_ASSIGNMENT : receives

    TENANT ||--o{ AI_SYSTEM : owns
    AI_SYSTEM ||--o{ REGISTRY_FIELD_VALUE : has
    REGISTRY_FIELD_DEFINITION ||--o{ REGISTRY_FIELD_VALUE : defines

    LIFECYCLE_DEFINITION ||--o{ LIFECYCLE_VERSION : versions
    LIFECYCLE_VERSION ||--o{ STAGE_DEFINITION : contains
    AI_SYSTEM ||--o{ REVIEW : undergoes
    LIFECYCLE_VERSION ||--o{ REVIEW : governs
    REVIEW ||--o{ STAGE_RUN : executes
    STAGE_DEFINITION ||--o{ STAGE_RUN : instantiates

    ASSESSMENT_TEMPLATE ||--o{ QUESTION_VERSION : contains
    REVIEW ||--o{ ASSESSMENT_RESPONSE : records
    QUESTION_VERSION ||--o{ ASSESSMENT_RESPONSE : answers

    REVIEW ||--o{ EVIDENCE_REQUEST : raises
    EVIDENCE_REQUEST ||--o{ EVIDENCE_SUBMISSION : receives
    REVIEW ||--o{ FINDING : identifies
    REVIEW ||--o{ DECISION : concludes
    DECISION ||--o{ SIGNOFF : authorizes

    ARTIFACT ||--o{ ARTIFACT_VERSION : versions
    ARTIFACT_VERSION ||--o{ ARTIFACT_LINK : links
    REVIEW ||--o{ ARTIFACT_LINK : references
    EVIDENCE_SUBMISSION ||--o{ ARTIFACT_LINK : includes

    TENANT ||--o{ CONTENT_ITEM : publishes
    CONTENT_ITEM ||--o{ AUDIENCE_RULE : targets
    DIRECTORY_GROUP ||--o{ AUDIENCE_RULE : matches

    TENANT ||--o{ AUDIT_EVENT : records
    TENANT ||--o{ OUTBOX_EVENT : emits
~~~

### 7.2 Entity summary

| Entity | Key fields and notes |
|---|---|
| `tenant` | `tenant_id`, slug, name, data region, status |
| `principal` | User/service identity; Entra object ID is an alternate key |
| `directory_group` | External group ID, display name, last sync, enabled |
| `role_assignment` | Principal or group, role, scope type, scope ID |
| `ai_system` | UUID PK, tenant-scoped AIR business number, owners, lifecycle, risk tier |
| `registry_field_definition` | Versioned key, type, required rule, options, display ordinal |
| `registry_field_value` | AI system, field definition, typed JSON value |
| `lifecycle_definition` | Stable lifecycle identity such as Standard or Expedited |
| `lifecycle_version` | Immutable published version and effective dates |
| `stage_definition` | Ordered stage, owner role/group, SLA, decision rights |
| `review` | UUID PK, RAI business number, AI system, type, state, risk, due date |
| `stage_run` | Runtime instance, assignment, state, start/due/completion timestamps |
| `assessment_response` | Versioned question answer, status, actor, timestamps |
| `evidence_request` | Prompt, requester, state, due date, stage |
| `evidence_submission` | Response, submitter, submitted time, request |
| `finding` | Control, severity, statement, remediation, status |
| `decision` | Outcome, conditions, rationale, immutable decision version |
| `signoff` | Decision, signer, authority/role, signature time |
| `artifact` | Logical file, kind, classification, owner, retention policy |
| `artifact_version` | Blob URI/version ID, SHA-256, media type, size, scan state |
| `artifact_link` | Artifact version linked to review/evidence/content/decision |
| `content_item` | News or Library item, status, owner, publication/review dates |
| `audience_rule` | Content item to directory group or governed audience expression |
| `notification` | Recipient, channel, template, state, read/delivery timestamps |
| `audit_event` | Append-only actor, action, aggregate, hashes, correlation ID, time |
| `outbox_event` | Transactionally committed event awaiting publication |

### 7.3 Relational conventions

- UUID/ULID primary keys are internal identifiers.
- AIR and RAI numbers are tenant-scoped human-readable alternate keys.
- Every tenant-owned row includes `tenant_id`.
- Every mutable aggregate includes:
  - `version` for optimistic concurrency;
  - `created_at`, `created_by`;
  - `updated_at`, `updated_by`.
- Store timestamps as UTC; render in the user's configured time zone.
- Use check constraints or lookup tables for stable state values.
- Use soft deletion only where restoration is a real product requirement.
  Audit/decision records are never soft-deleted or overwritten.
- Use JSON only for configurable Registry values, policy snapshots, and event
  payloads. Core relationships remain normalized.

### 7.4 Required indexes

- unique `(tenant_id, registry_number)`;
- unique `(tenant_id, review_number)`;
- `review(tenant_id, state, due_at)`;
- `stage_run(tenant_id, assigned_group_id, state, due_at)`;
- `evidence_request(review_id, state, due_at)`;
- `finding(review_id, status, severity)`;
- `notification(recipient_principal_id, read_at, created_at desc)`;
- `audit_event(tenant_id, aggregate_type, aggregate_id, occurred_at)`;
- partial index on unpublished `outbox_event` rows;
- unique artifact hash where tenant deduplication policy allows it.

### 7.5 Blob organization

Recommended logical path:

~~~text
/{tenant-id}/
  reviews/{review-id}/workbooks/{artifact-id}/{version-id}
  reviews/{review-id}/evidence/{artifact-id}/{version-id}
  reviews/{review-id}/decisions/{artifact-id}/{version-id}
  content/news/{content-id}/{artifact-id}/{version-id}
  content/library/{content-id}/{artifact-id}/{version-id}
  quarantine/{upload-session-id}
~~~

Controls:

- private containers only;
- direct upload through short-lived, least-privilege delegation;
- file extension and binary signature validation;
- malware scanning before promotion from quarantine;
- SHA-256 checksum persisted in `artifact_version`;
- Blob versioning, soft delete, and lifecycle tiers;
- WORM/time-based retention for final decision and audit evidence when required;
- legal hold support;
- separate storage accounts when retention or data-classification boundaries
  differ materially.

---

## 8. API surface

All routes are versioned under `/api/v1`. The BFF may expose a user-oriented
composition layer, while core domain endpoints remain stable.

### AI Registry

~~~text
GET    /ai-systems
POST   /ai-systems
GET    /ai-systems/{aiSystemId}
PATCH  /ai-systems/{aiSystemId}
GET    /ai-systems/{aiSystemId}/readiness
GET    /registry/schema
~~~

### Reviews

~~~text
GET    /reviews
POST   /reviews
GET    /reviews/{reviewId}
POST   /reviews/{reviewId}/submit
POST   /reviews/{reviewId}/assignments
POST   /reviews/{reviewId}/transitions
GET    /reviews/{reviewId}/timeline
~~~

### Assessment, evidence, findings, and decisions

~~~text
GET    /reviews/{reviewId}/assessment
PUT    /reviews/{reviewId}/assessment/responses/{questionId}
POST   /reviews/{reviewId}/evidence-requests
POST   /evidence-requests/{requestId}/submissions
POST   /reviews/{reviewId}/findings
PATCH  /findings/{findingId}
POST   /reviews/{reviewId}/decisions
POST   /decisions/{decisionId}/signoffs
~~~

### Artifacts

~~~text
POST   /artifacts/upload-sessions
POST   /artifacts/{artifactId}/complete
GET    /artifacts/{artifactId}/versions
POST   /artifact-versions/{versionId}/download-session
~~~

### Administration

~~~text
GET    /admin/lifecycles
POST   /admin/lifecycles/{id}/versions
POST   /admin/lifecycle-versions/{id}/publish
GET    /admin/registry-schema/versions
POST   /admin/registry-schema/versions
POST   /admin/registry-schema/versions/{id}/publish
GET    /admin/directory-groups
POST   /admin/directory-groups/sync
POST   /admin/content
PATCH  /admin/content/{contentId}
POST   /admin/content/{contentId}/publish
~~~

### API rules

- Validate access tokens and authorization at every request.
- Derive tenant and actor context from trusted token claims/mappings, never
  from a client-supplied tenant ID alone.
- Require an `Idempotency-Key` for state-changing operations that may be
  retried.
- Require `If-Match`/ETag or an expected version for concurrent edits.
- Return RFC 9457 problem details for errors.
- Never return raw Blob URLs; issue short-lived authorized download sessions.
- Apply pagination and server-side filtering to all collection endpoints.
- Record correlation ID, causation ID, actor, and client application.

---

## 9. Domain events

Initial event catalog:

~~~text
ai-system.registered.v1
ai-system.updated.v1
registry-schema.published.v1
review.created.v1
review.submitted.v1
review.assigned.v1
review.stage-entered.v1
review.sla-at-risk.v1
review.overdue.v1
artifact.uploaded.v1
artifact.accepted.v1
artifact.quarantined.v1
evidence.requested.v1
evidence.submitted.v1
finding.created.v1
finding.resolved.v1
decision.recorded.v1
review.closed.v1
content.published.v1
directory-group.synced.v1
~~~

Every event envelope includes:

~~~json
{
  "eventId": "uuid",
  "eventType": "review.submitted.v1",
  "occurredAt": "UTC timestamp",
  "tenantId": "uuid",
  "aggregateType": "review",
  "aggregateId": "uuid",
  "aggregateVersion": 7,
  "actorId": "uuid",
  "correlationId": "uuid",
  "causationId": "uuid",
  "payload": {}
}
~~~

Consumers must tolerate duplicate delivery and ignore already processed
`eventId` values.

---

## 10. Identity and authorization

### 10.1 Authentication

- Microsoft Entra ID OIDC for interactive users.
- OAuth 2.0 client credentials or workload identity federation for approved
  integrations.
- Managed identity for Azure service access.
- No local production passwords.

### 10.2 Application roles

| Role | Typical capabilities |
|---|---|
| Submitter | Create/update permitted Registry records, create reviews, upload artifacts, answer assigned evidence requests |
| Auditor | View assigned/scoped records, assess, request evidence, create findings |
| Senior auditor / decision owner | Auditor permissions plus decisions, waivers, and sign-off |
| Platform admin | Version and publish workflow/schema configuration, manage content and group mappings |
| Audit reader | Read-only access to authorized reviews and audit exports |
| Service principal | Narrow integration-specific operations only |

Authorization is both role- and scope-based. A role assignment includes a scope
such as tenant, business unit, directory group, queue, AI system, or review.

### 10.3 Directory synchronization

- Store external Entra object IDs and display metadata.
- Treat group membership as read-only in Proofline.
- Use Microsoft Graph delta queries or an approved identity provisioning flow.
- Record sync watermark, last success, failure, and membership version.
- Disable access conservatively when an authoritative group is deleted or
  disabled.

---

## 11. Security controls

### Network

- Private endpoints for all data-plane services.
- Private DNS zones linked to the application VNet.
- Deny public network access after deployment validation.
- Route controlled egress through Azure Firewall or an approved network
  appliance where policy requires it.
- Restrict Front Door origins and validate the Front Door instance.

### Data protection

- TLS 1.2+ in transit.
- Platform-managed encryption by default; customer-managed keys where policy
  requires separation of duties.
- Separate encryption and access boundaries by environment.
- Classify artifacts and propagate classification to Blob index tags and
  Unity Catalog tags.
- Apply retention policies by artifact kind and decision state.

### Application

- Server-side authorization for every resource.
- Strict upload allowlist, size limits, signature inspection, archive limits,
  and malware scanning.
- Output encoding and content security policy.
- Parameterized SQL/ORM protections.
- Request-body limits and rate limiting.
- Secret scanning, SAST, dependency scanning, container scanning, and SBOM.
- Signed images and immutable deployment references by digest.

### Audit

Audit events must capture:

- successful and denied access to sensitive records;
- configuration create/edit/publish operations;
- assignment and decision-right changes;
- artifact upload, scan, download, deletion request, retention, and legal hold;
- review transitions, findings, evidence, decisions, and sign-offs;
- directory sync and role mapping changes;
- administrative exports.

Audit rows are append-only. Corrections are represented as new events, not
updates to historical rows.

---

## 12. CI/CD

GitHub Actions and Azure DevOps are both supported. Pick the system aligned to
the source repository and enterprise control plane; do not maintain two
different release implementations.

~~~mermaid
flowchart LR
    PR[Pull request] --> Verify[Lint + unit + contract tests]
    Verify --> Security[SAST + secrets + dependencies]
    Security --> Build[Reproducible Docker build]
    Build --> Test[Integration tests with ephemeral dependencies]
    Test --> Scan[Container scan + SBOM + policy]
    Scan --> Sign[Sign image]
    Sign --> ACR[Push immutable image to ACR]
    ACR --> Dev[Deploy Dev]
    Dev --> E2E[API + UI smoke tests]
    E2E --> TestEnv[Promote same digest to Test]
    TestEnv --> Approval[Production approval]
    Approval --> Prod[Canary Container Apps revision]
    Prod --> Observe[Health/SLO verification]
    Observe -->|Pass| Complete[Complete traffic shift]
    Observe -->|Fail| Rollback[Route traffic to previous revision]
~~~

### 12.1 Pipeline stages

1. **Validate**
   - formatting and lint;
   - unit tests;
   - architecture-boundary tests;
   - OpenAPI and event-schema compatibility;
   - database migration validation.
2. **Secure**
   - secret scan;
   - SAST;
   - dependency/license policy;
   - infrastructure policy;
   - container vulnerability scan.
3. **Build**
   - multi-stage Docker build;
   - non-root runtime;
   - commit SHA and semantic release metadata;
   - SBOM and provenance.
4. **Publish**
   - push once to ACR;
   - sign and address by digest;
   - promote the exact digest between environments.
5. **Deploy**
   - deploy infrastructure with Bicep or Terraform;
   - execute backward-compatible migrations;
   - deploy zero-traffic/canary revision;
   - run smoke tests;
   - shift traffic and observe.

### 12.2 Branch and environment controls

- Protected `main` branch.
- Required pull-request review and passing checks.
- Workload identity federation from GitHub/Azure DevOps to Azure; avoid
  long-lived client secrets.
- Separate Azure subscriptions or strongly isolated resource groups for
  development, test, and production.
- Production environment approval and restricted deploy identity.
- Deployment evidence retained with commit, image digest, scan results,
  approver, migration version, and timestamps.

---

## 13. Availability and disaster recovery

~~~mermaid
flowchart LR
    Client[Users] --> FD[Azure Front Door]
    FD -->|Healthy| PApp[Primary Container Apps]
    FD -. Failover .-> RApp[Recovery Container Apps]

    PApp --> PDB[(Primary PostgreSQL/Azure SQL)]
    PApp --> PBlob[(Primary Blob)]
    PDB -. Replica or geo backup .-> RDB[(Recovery database)]
    PBlob -. GZRS/object replication .-> RBlob[(Recovery Blob)]
    RApp --> RDB
    RApp --> RBlob
~~~

### Primary region

- Zone-redundant Container Apps environment.
- PostgreSQL zone-redundant HA or Azure SQL zone redundancy.
- Service Bus Premium with monitored dead-letter queues.
- Blob ZRS/GZRS based on residency and recovery requirements.
- Automated backups and point-in-time restore.

### Recovery region

- Warm Container Apps environment created from the same infrastructure code.
- Replicated image availability in ACR or geo-replicated ACR Premium.
- PostgreSQL cross-region replica/geo-restore strategy, or Azure SQL failover
  group.
- Blob GZRS/RA-GZRS or object replication, subject to data-residency policy.
- Pre-created private DNS, certificates, Key Vault strategy, monitoring, and
  Front Door origin.

### Recovery requirements

RPO and RTO must be approved through a business impact analysis. Do not claim a
target until the complete application, database, artifacts, identity,
messaging, DNS, and secrets recovery path has been exercised.

Required tests:

- quarterly database point-in-time restore;
- scheduled regional failover exercise;
- Blob version recovery and legal-hold verification;
- Service Bus dead-letter replay;
- lost-secret/key rotation;
- rollback after a failed schema/application deployment;
- evidence that recovered audit chains and artifact hashes remain valid.

---

## 14. Observability and operations

### Telemetry

- OpenTelemetry traces across APIM, Web/BFF, API, Worker, database, and queues.
- Structured logs with tenant-safe metadata.
- Application Insights for application telemetry.
- Log Analytics for centralized queries and retention.
- Azure Monitor metrics and alerts.
- Defender for Cloud and Storage security signals.

Never log:

- access tokens or authorization headers;
- SAS tokens;
- evidence or workbook content;
- secrets;
- complete personal data records;
- unredacted request bodies by default.

### Service indicators

Track at minimum:

- request success, latency, and saturation;
- authentication/authorization failures;
- review submission success;
- stage transition failure;
- upload validation and quarantine rate;
- Service Bus queue age, depth, retries, and dead letters;
- notification delivery success;
- database connection saturation, storage, replication, and backup health;
- Blob errors and malware-scan latency;
- outbox publication lag;
- directory sync age and failures;
- analytical export freshness.

### High-priority alerts

- public network exposure detected;
- sustained API error rate or latency breach;
- database failover/replication degradation;
- backup or restore validation failure;
- oldest queue message above threshold;
- any dead-letter accumulation;
- outbox backlog;
- artifact scan unavailable or quarantine bypass attempt;
- directory synchronization stale;
- unauthorized administrative operation;
- WAF anomaly or significant access-denied spike.

---

## 15. Databricks and Unity Catalog model

### Data flow

~~~mermaid
flowchart LR
    OLTP[(Operational DB)] -->|Incremental extract / CDC| Bronze
    Events[Domain event archive] --> Bronze
    Blob[Artifact metadata and approved extracted fields] --> Bronze

    subgraph Lakehouse[ADLS-backed Delta Lake]
        Bronze[Bronze: immutable raw]
        Silver[Silver: conformed]
        Gold[Gold: reporting products]
        Bronze --> Silver --> Gold
    end

    DBX[Databricks Workflows] --> Bronze
    DBX --> Silver
    DBX --> Gold
    UC[Unity Catalog] --- Bronze
    UC --- Silver
    UC --- Gold
    Gold --> BI[Power BI / approved consumers]
~~~

### Suggested catalogs

~~~text
proofline_dev
proofline_test
proofline_prod
~~~

Suggested schemas:

- `bronze_operational`;
- `bronze_events`;
- `silver_registry`;
- `silver_reviews`;
- `silver_audit`;
- `gold_portfolio`;
- `gold_sla`;
- `gold_control_insights`.

### Suggested analytical model

Facts:

- `fact_review`;
- `fact_stage_run`;
- `fact_evidence_cycle`;
- `fact_finding`;
- `fact_audit_event`.

Dimensions:

- `dim_ai_system`;
- `dim_lifecycle`;
- `dim_stage`;
- `dim_risk`;
- `dim_organization`;
- `dim_principal` with privacy controls;
- `dim_date`.

Unity Catalog manages grants, lineage, tags, row/column controls, and governed
sharing. Raw artifact binaries are not automatically copied into analytical
tables. Only approved, minimized fields are extracted.

---

## 16. Proposed backend repository structure

The first implementation can evolve toward this layout:

~~~text
Backend/
  README.md
  src/
    Proofline.Web/
    Proofline.Api/
    Proofline.Worker/
    Modules/
      Identity/
      Registry/
      Reviews/
      Assessments/
      Evidence/
      Decisions/
      Governance/
      Content/
      Notifications/
      Audit/
    BuildingBlocks/
      Application/
      Domain/
      Infrastructure/
      Observability/
  tests/
    Unit/
    Architecture/
    Integration/
    Contract/
    EndToEnd/
  database/
    migrations/
    seeds/
  contracts/
    openapi/
    events/
  deploy/
    bicep-or-terraform/
    container-apps/
    monitoring/
  pipelines/
    github/
    azure-devops/
~~~

---

## 17. Local development target

A future local stack should provide:

- Core API and Worker containers;
- PostgreSQL;
- Azurite for Blob-compatible local storage;
- a Service Bus emulator where supported, or a clearly isolated development
  namespace;
- OpenTelemetry collector;
- deterministic seed data;
- Entra authentication with a documented local developer registration or a
  development-only test identity provider.

No production secret or production data should be required for local
development.

---

## 18. Implementation sequence

### Phase 1 — Foundation

- solution/module skeleton;
- Entra authentication and tenant context;
- PostgreSQL/Azure SQL migration framework;
- Blob abstraction;
- transactional outbox;
- structured logging, tracing, health checks;
- IaC, ACR, Container Apps, Key Vault, App Configuration;
- CI pipeline and development deployment.

### Phase 2 — Registry and review submission

- Registry schema/version APIs;
- AI system CRUD and readiness evaluation;
- review draft/submission;
- workbook upload, scan, checksum, and quarantine;
- lifecycle snapshot and first-stage assignment;
- audit and notification baseline.

### Phase 3 — Auditor workflow

- queue and assignment;
- assessment responses;
- evidence requests/submissions;
- findings;
- decisions and sign-off;
- SLA timers and escalations.

### Phase 4 — Admin and governed content

- lifecycle and routing configuration versions;
- News and Library;
- audience rules;
- directory group synchronization;
- publish/rollback controls.

### Phase 5 — Analytics and hardening

- analytical export;
- Databricks Bronze/Silver/Gold pipelines;
- Unity Catalog grants and lineage;
- load, penetration, restore, and regional recovery tests;
- operational runbooks and production readiness review.

---

## 19. Production readiness checklist

### Architecture

- [ ] One operational relational source of truth selected.
- [ ] All public/private boundaries documented and tested.
- [ ] Transactional outbox and idempotent consumer behavior verified.
- [ ] Configuration and lifecycle versioning verified with in-flight reviews.

### Security

- [ ] Threat model reviewed.
- [ ] Private endpoints and public-access deny policies enforced.
- [ ] Managed identities replace stored Azure credentials.
- [ ] Upload quarantine and malware scanning cannot be bypassed.
- [ ] Access reviews and least-privilege roles completed.
- [ ] Image, dependency, IaC, and secret scans pass.

### Data governance

- [ ] Data classification and retention schedule approved.
- [ ] WORM/legal hold applied where required.
- [ ] Tenant-isolation tests pass.
- [ ] Audit events and artifact hashes are immutable and exportable.
- [ ] Unity Catalog permissions and lineage validated.

### Reliability

- [ ] SLOs and alert thresholds approved.
- [ ] Capacity and load tests pass.
- [ ] Database backup and restore demonstrated.
- [ ] Queue replay and outbox recovery demonstrated.
- [ ] Regional recovery exercise meets approved RPO/RTO.

### Delivery

- [ ] Protected branch and required checks enabled.
- [ ] Workload identity federation configured.
- [ ] Same signed image digest promoted between environments.
- [ ] Migration and rollback runbooks tested.
- [ ] Production deployment evidence retained.

---

## 20. Open decisions to record as ADRs

1. PostgreSQL Flexible Server versus Azure SQL Database.
2. ASP.NET Core LTS, Java LTS, or another approved backend runtime.
3. Single-tenant deployment versus shared multi-tenant service.
4. Required data regions and cross-region replication constraints.
5. Approved notification channels and Microsoft Graph permissions.
6. Malware scanning implementation and quarantine-release authority.
7. Artifact retention, legal hold, and deletion schedules.
8. Business-approved RPO, RTO, SLO, and support model.
9. GitHub Actions versus Azure DevOps as the authoritative pipeline.
10. Bicep versus Terraform as the infrastructure standard.

These decisions should be finalized before production sizing and detailed
infrastructure implementation.
