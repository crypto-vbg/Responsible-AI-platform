# Proofline backend implementation plan

Prepared 2026-09-19. Deliverable: this plan only. No backend implementation or infrastructure provisioning is included in this task.

## 1. Repository assessment and scope

Paths are relative to the repository root. **Observed** identifies repository evidence; **Decision** is the proposed implementation baseline; **Assumption** is a business rule requiring confirmation. All future files/tasks below are proposed, not already implemented.

### 1.1 Existing application

| Area | Observed evidence | Reuse / implementation needed |
\|---\|---\|---\|
| Runtime | `README.md` documents `py -m http.server 4173`. Root `index.html`, `styles.css`, `app.js` are vanilla HTML/CSS/JS; no package manifest or build step. | Preserve frontend layout, selectors, typography, responsive breakpoints, reduced-motion and themed dropdown behavior. Add backend and small JS integration modules, not a framework rewrite. |
| Backend | `Backend/README.md` is a 1,343-line architecture proposal; no executable backend exists. Its proposed .NET-style project names do not establish a runtime; section 20 leaves that open. | Reuse modular monolith, PostgreSQL, versioned configuration, team lead, outbox, private files and operations guidance. Reconcile its Azure-only and narrower Auditor-read assumptions. |
| Data | `app.js` starts with arrays `reviews`, `queue`, `approvedPocs`, `registryEntries`, `processStages`, `registryFieldDefinitions`, `adminNews`, `libraryResources`, `directoryGroups`, `notifications`. No SQL, ORM, migrations, browser persistence or actual tables. | Every table in section 4 is NEW. No existing database table is being altered. Production must not import mock historical decisions/users. |
| Auth/API | No fetch/XHR, MSAL/OAuth, tokens or sessions in app files. `switchRole`, `roleProfiles`, `?role=` and CSS choose a persona. | Real session, trusted identity, server policies, capabilities and API client. URL/DOM state cannot grant permissions. |
| Registry | `registryFieldDefinitions`, `visibleRegistryEntries`, `registryEntryReady`, `openRegistryModal`, `syncReviewRegistryOptions`. Core name, brief, technical owner, business owner, lifecycle; extensible text/textarea/person/select/date fields. | Stable user IDs, server readiness, versioned fields/options, persistence and explicit sharing. Replace R&D/display-name filtering. |
| Submission | `openUpload`, `setSubmissionLifecycle`, `setDeploymentPath`, `selectedApprovedPoc`, submit handler. POC/deployment; fresh workbook or approved POC continuation; ready Registry gate. | Persist original and baseline; enforce baseline belongs to selected Registry. One transaction creates authoritative review state. |
| Files | `validateFile` checks extension then simulates validation for 1.8 seconds; `acceptAuditorWorkbook` checks only extension. `downloadWorkbook` and `downloadPocWorkbook` generate TSV strings called .xls. | Real uploaded bytes, quarantine, malware/structure validation, checksums, versions, downloads and asynchronous status. No fabricated control counts. |
| Auditor | `renderQueue`, `openReview`, `requestEvidence`, `signOffReview`; risk/SLA filters, reviewed workbook, evidence and approval. Sign-off mutates one array and removes another queue row. | Unified database projection; assignments, immutable history, decisions, conflict checks. Preserve the drawer. |
| Evidence response | `app.js` click handler for Provide evidence opens the new-review modal. | Replace with request-specific response; must not create another review. |
| Admin | `renderAdminControlPlane`, `openAdminModal`, stage reorder, `markAdminChanged`, publish handler. Edits immediately change arrays; publication is a toast. | Isolated drafts, atomic publish, pinned in-flight versions; add team membership/senior designation UI. |
| Directory mismatch | `directoryGroups` contains four mappings; modal offers Viewer and arbitrary groups. Auditor profile always says Senior auditor. | Exactly three configured AD mappings; Viewer only a record grant. Senior derives from application team leadership. |
| News/Library | `renderWorkspaceNews`, `renderWorkspaceLibrary`, `audienceMatches`, `openContentPreview`. News headline/summary/attachments; Library file/URL, collection, owner/review date. | Persist audience and publication; safe real file/link access. Current R&D/Commercial/Model owners audiences are not extra permitted AD roles. |
| Notifications/metrics | `roleNotifications`, `renderNotifications` and overview/drawer contain sample counts, risk, relative dates, progress and timeline. | Recipient-specific rows and authorized aggregates. Empty or unavailable is preferable to fake analytics. |
| Tests/deployment | No tracked tests, manifests, CI, containers, IaC or deployment config. `docs/assets/` contains screenshots/GIF. Ignored `.edge-qa/` placeholders and `.codex_workbook_build/` workbook tooling are not an application test suite. | Establish executable verification and cloud deployment paths. Screenshots are visual references only. |

No applicable AGENTS.md was found in the repository/checked parents. Git status was clean before creating this file. No app tests were run for this documentation-only task; no existing test suite is present.

### 1.2 Workbook source evidence

`sample-reviewed-workbook.csv` has four synthetic rows and columns `Control,Auditor assessment,Evidence reference,Finding`. It is not a complete production template.

Read-only ZIP/XML inspection of ignored `template/GF_Accountability_Report_Recreated.xlsx` found six visible sheets: Accountability Report, Summary Sheet, Datasheet, Model Card, AI Approval Application, Guidelines. There are merged presentation cells, four formulas, no named tables/defined names/macros/external workbook links, and Yes/No/N/A dropdowns. Datasheet!B3 and Model Card!B3 explicitly make those documents optional for procured AI. Do not universally require populated Datasheet/Model Card. The prototype's “4 sheets / 86 controls” is not this workbook's verified schema.

P00/P06 must produce a business-approved, versioned manifest of stable questions, sheet/header anchors, cell mappings, allowed values and procurement/POC/deployment requiredness. Treat merged top-left cells as authoritative; never execute formulas/macros or trust cached formula results for decisions. Define CSV and legacy XLS manifests separately; neither automatically satisfies the six-sheet XLSX structure. Keep ignored reference material uncommitted unless its owner explicitly approves redistribution; production must not depend on an untracked local file.

### 1.3 Architectural decisions and scope boundaries

1. **Runtime:** TypeScript, active Node.js LTS, Fastify, PostgreSQL, `pg` + Kysely, SQL migrations, OpenAPI 3.1/JSON Schema. Pin supported versions/lockfile in P01. This matches the existing JS team's likely skillset; no pre-existing .NET code is displaced.
2. **Shape:** one Web/API/BFF modular monolith and a worker process from the same image. Keep BFF/core boundaries in code; do not introduce a separate API network hop initially.
3. **Database:** PostgreSQL on Azure or AWS; one source of truth. No Azure SQL alternative implementation or dual-write layer in this release.
4. **Isolation (D02):** one enterprise organization per deployment, dedicated database/object namespace, one allowed identity issuer/tenant. No tenant field scattered inconsistently across tables. If shared tenancy is required, settle it before P02 and revise every PK/FK, query, cache and test to tenant-qualified isolation.
5. **Exactly three groups:** Admin, Submitter, Auditor. Team membership, senior designation, ownership and view/edit grants are application data. Remove the old blueprint's optional fourth lead group and frontend arbitrary-role mapping.
6. **Auditor access:** every active Auditor reads all Registry records and submitted reviews/evidence organization-wide. Assignment restricts mutations. Private review drafts remain with owners/editors and Admin. This expressly supersedes `Backend/README.md`'s narrower read scope.
7. **Required services:** relational DB, private object storage, queue, worker/scanner, directory, secrets, telemetry and in-app notifications. Databricks/Unity Catalog, BI, search service, email/Teams and external inventory ingestion are deferred extension points; no mandatory infrastructure or speculative tables for them.
8. **Workbook-first assessment:** preserve offline workbook review. Implement findings, evidence and decisions; defer online question-bank/response editor and signed-PDF generation. Application sign-off is an authenticated decision record, not a qualified electronic signature.
9. **Admin default:** full read/oversight and configuration/content/team administration; no Registry editing or review sign-off solely through Admin. This tightens the prototype's Admin edit controls and is an explicit proposed default (D04).

## 2. Architecture, directory structure and dependencies

~~~mermaid
flowchart LR
  Browser[Existing HTML CSS JS] -->|same-origin session| Web[Web API and BFF]
  Web --> App[Application use cases]
  App --> Domain[Domain policies]
  App --> Ports[Persistence and integration ports]
  Ports --> DB[(PostgreSQL)]
  Ports --> Objects[Blob or S3]
  Ports --> Bus[Service Bus or SQS]
  Web --> IdP[Entra or federated OIDC issuer]
  Bus --> Worker[Worker]
  Worker --> App
  Worker --> Scan[Isolated file validation]
~~~

### 2.1 Target tree (new paths except existing frontend/READMEs)

~~~text
/
  plan.md                              # Main agent owns architecture and execution status
  README.md                            # Update run instructions after implementation
  index.html                           # Preserve shell; module entry and missing controls
  app.js                               # Retain renderers; delegate network/workflow orchestration
  styles.css                           # Preserve design; add loading/error/form states only
  frontend/
    api/client.js                      # CSRF, credentials, problems, paging, abort/retry
    api/generated.d.ts                 # Generated OpenAPI types
    auth/session.js                    # /me, expiry and allowed persona selection
    state/store.js                     # Server-backed normalized state, no authority decisions
    workflows/{registry,reviews,auditor,admin,content,notifications}.js
  Backend/
    README.md                          # Reconcile old blueprint with approved decisions
    package.json
    tsconfig.json
    src/
      entrypoints/{http,worker,migrate}.ts
      bootstrap/container.ts           # Sole concrete-adapter composition root
      config/{schema,load,redact}.ts    # Discriminated config and secret resolution
      api/
        plugins/{session,csrf,auth,errors,request-id}.ts
        routes/{auth,me,directory,registry,reviews,artifacts,evidence,findings}.ts
        routes/{decisions,governance,teams,content,notifications,dashboard,health}.ts
        serializers/                   # Explicit DTOs; no raw DB/SDK responses
      domain/
        {identity,registry,reviews,evidence,decisions,governance,content,artifacts}/
                                       # Framework/cloud-independent rules and transitions
      application/
        ports/                         # Repositories, UoW, directory, storage, queue, scan, clock
        policies/authorize.ts          # Common role + record + state policy entry
        services/{identity,registry,reviews,evidence,decisions,governance,content,artifacts}/
        events/                        # Versioned events/handlers
      infrastructure/
        persistence/postgres/{repositories,unit-of-work.ts,db-types.ts}
        identity/{entra-directory,federated-oidc,oidc-session}.ts
        cloud/azure/{credentials,blob,service-bus,key-vault}.ts
        cloud/aws/{credentials,s3,sqs,secrets-manager}.ts
        local/{filesystem-storage,in-process-queue,fake-directory,fake-scanner}.ts
        scanning/{clamav,workbook-parser}.ts
        observability/{logger,tracing,metrics}.ts
      workers/{outbox,artifact-processing,directory-refresh,sla,notification,cleanup}.ts
    database/
      migrations/0001_identity.sql ... 0007_constraints.sql  # One migration owner
      seeds/{configuration,development}.ts
    tests/{unit,architecture,integration,contract,adapters}/
    tests/fixtures/                    # Synthetic valid/invalid/malicious workbook samples
    deploy/{Dockerfile,compose.yaml,otel-collector.yaml}
  contracts/
    openapi.yaml                       # One owner; HTTP source of truth
    events/*.schema.json
    schemas/{configuration,workbook}.schema.json
    generated/
  tests/e2e/{submitter,auditor,admin,authorization,visual}.spec.ts
  infrastructure/
    terraform/modules/{azure,aws}/
    terraform/environments/{azure,aws}/{dev,test,prod}/
    policies/
  docs/{adr,api,runbooks,testing}/
  .github/workflows/{verify,deploy-azure,deploy-aws}.yml
  package.json                         # npm workspaces, contract and browser tooling
  package-lock.json
  .env.example                         # Placeholders only
  .gitignore                           # Ignore secrets/builds/reports, retain .env.example
~~~

### 2.2 Allowed dependencies

- Domain uses language primitives/value objects only; no environment reads, HTTP, SQL, SDKs or global clocks. Application imports domain and its own ports, never infrastructure/Fastify.
- HTTP validates contracts, obtains trusted actor context, calls a use case and serializes DTOs. Workers invoke the same use cases with narrow service capabilities, never a fabricated Admin identity.
- Infrastructure implements ports and depends inward. Only composition selects Azure/AWS/local adapters. Ports expose IDs/streams/metadata/errors, never provider SDK classes.
- Suggested ports: ObjectStore `putQuarantined/open/promote/delete`; MessageBus `publish/receive/ack/retry`; Directory `resolvePrincipal/checkRoles/listEligibleUsers`; SecretResolver `resolve`; MalwareScanner `scan`; WorkbookValidator `validate`; repositories and UnitOfWork `run`.
- Module writes go through its application service. A business transaction shares one UoW across modules and atomically commits data, audit, outbox and idempotency response. Object operations are recoverable state transitions outside SQL transactions.
- Enforce visibility in SQL before pagination/counting; never fetch all rows then filter in JS. All detail, nested resource, download, search and aggregate routes use the same policy.
- Lock aggregates/version predicates for edits; lock team/lead/member/local eligibility rows for assignment. Directory refresh occurs before sensitive commands; external propagation is not made transactional by a DB lock.
- Consumers deduplicate by consumer+event ID and commit receipt with side effects. Delivery is at least once. Import-boundary tests protect architecture.
- Contracts contain schema/types, not domain/SDK code. Frontend imports only frontend/generated types. No backend secrets or modules may enter browser assets.

## 3. Authentication and authorization

### 3.1 Resolve what AD means

**Observed:** Entra and IAM Identity Center are UI/document labels only; no configured issuer or tenant exists. **Baseline:** Entra workforce tenant, potentially synchronized/federated from on-premises AD. If Entra issues tokens, keep Entra authentication even on AWS.

P00 must record issuer/discovery URL, tenant, registration, stable group IDs, direct/nested membership policy, guest policy and Graph permissions. Direct AD FS/other federation requires its own confirmed OIDC discovery, claim mapping, PKCE support and authoritative directory adapter; Graph is not an AD FS resolver. A SAML-only setup needs an approved broker before P03. Do not guess the actual topology.

| Role | Config key | Placeholder |
\|---\|---\|---\|
| Admin | IDENTITY_GROUP_ADMIN_ID | `<admin-group-object-id>` |
| Submitter | IDENTITY_GROUP_SUBMITTER_ID | `<submitter-group-object-id>` |
| Auditor | IDENTITY_GROUP_AUDITOR_ID | `<auditor-group-object-id>` |

Require three nonempty distinct stable IDs (UUIDs for Entra). Names are display only. Groups screen shows these three mappings/status and Sync now; mapping changes are reviewed deployment configuration, invalidate caches/sessions and cannot add a fourth role. Directory membership remains external.

### 3.2 Login, session and backend token validation

Same-origin BFF: authorization code + PKCE S256, random one-use state/nonce/verifier, five-minute login transaction bound to a random Secure/HttpOnly/SameSite=Lax pre-auth cookie (store its hash, compare at callback, then clear it). `GET /auth/login` redirects; `GET /auth/callback` validates state, exchanges code and validates ID token through a maintained OIDC library: trusted discovery/JWKS, signature, algorithm allowlist, exact issuer/audience/tenant, lifetime, nonce and authorized-party rules. Bind Entra identities using stable tenant/object ID and issuer; never email. Guests denied pending D01.

Rotate session ID after login. Use `__Host-proofline` Secure/HttpOnly/SameSite=Lax/Path=/ cookie without Domain. Persist only session hash; encrypt token cache with injected key and key ID. Browser holds no IdP tokens. Require session-bound CSRF token and exact Origin on mutations; callback uses state. `/me` returns CSRF token, minimal profile, roles and capabilities. Default expiry: 30-minute idle, eight-hour absolute. Refresh tokens server-side with per-session locking/atomic replacement. Failed refresh -> 401 and reauthentication; preserve only allowlisted relative return paths. Logout removes local session immediately, optionally performs issuer logout. Explicit localhost-only test cookie mode; production requires HTTPS.

Browser routes authenticate the BFF session and initially reject arbitrary bearer tokens. This is not omission of token validation: ID tokens are validated at callback, and Graph access tokens are used only for Graph. If a future bearer integration boundary is enabled, require a separately registered API audience/scopes and validate signature/JWKS, issuer, tenant, audience, exp/nbf, approved algorithms, scope/client and token type on every request. Reject ID tokens, Graph-audience tokens and app-only tokens on human routes. Service permissions do not become human roles. Never fetch discovery/claim-source URLs from untrusted request values.

### 3.3 Membership and revocation

- At login, resolve a complete snapshot of the three groups through an authoritative adapter. For Entra, `/me/checkMemberGroups` supports checking the three IDs with delegated permissions; background/candidate checks use the approved users endpoint/application permissions. Confirm current least privileges in P03 (sources in section 10).
- Missing `groups`, `hasgroups` or `_claim_names.groups` overage indicators trigger membership resolution, not a grant. JWT group overage can occur above 200 groups. Do not follow arbitrary `_claim_sources` URLs; call a configured Graph origin. A successful empty snapshot is 403 no_application_access. Unavailable authority with expired freshness is 503 identity_authority_unavailable.
- Default nested/transitive membership, subject to D01. Group-assigned app-role claims have different nesting behavior and are not an unnoticed substitute. Token role names alone are not authoritative in this group-ID design.
- Role union for multiple memberships; explicit ownership/conflict/state denials prevail. Persona selection changes presentation only. A user with no recognized group can only see minimal access-denied identity status/logout; a share cannot bypass AD eligibility.
- Snapshot TTL <= five minutes for ordinary calls. Force refresh for lead/assignment changes, publication, decisions, shares and download authorization. Every request checks local enablement/session generation. Negative snapshots are cached too.
- Local disable/share revoke/team removal/lead replacement takes effect on next request/transaction. Directory removal takes upstream propagation plus configured freshness; do not promise instant revocation. Monitor/test that bound. On stale authority failure, fail closed, flag orphaned assignments and require explicit reassignment; historical records remain.
- Senior requires current Auditor membership AND active team membership AND current lead row. Old cache/designation never independently restores privilege.

### 3.4 Permission matrix and record rules

Owner = immutable creator or current technical/business owner, currently a Submitter. Editor/Viewer = active explicit share to a current Submitter. Assigned = current eligible auditor of active stage. Senior = current team lead within Auditor. No extra role.

| API operation / frontend action | Admin alone | Submitter | Auditor | Record restriction |
\|---\|---\|---\|---\|---\|
| /me, own notifications, published content | Yes | Yes | Yes | Recipient only; matching content audience |
| Registry list/detail/readiness/search/counts | All | Owner/Editor/Viewer | All | SQL scope before paging/aggregates |
| Create Registry | No | Yes | No | Creator server-set; selected owners eligible Submitters |
| Edit normal Registry fields | No | Owner/Editor | No | Schema and optimistic version |
| Change technical/business owner | No | Owner | No | Access-changing operation, current target eligibility |
| Grant/revoke view/edit share | No | Owner | No | Same-directory Submitter; no reshare authority |
| Create/edit draft, upload original, submit review | No | Owner/Editor | No | Writable Registry, ready + validated workbook |
| Read private review draft | All | Owner/Editor | No | Role union may independently allow access |
| Read submitted review/files/evidence/timeline | All | Owner/Editor/Viewer | All | Inherited Registry access; all nested IDs checked |
| Respond to evidence | No | Owner/Editor | No | Open request on writable review |
| Review workbook, request evidence, findings | No | No | Assigned | Allowed stage, clean workbook where required, no self-review |
| Propose remediation / verify remediation | No | Owner/Editor proposes | Assigned verifies | Submitter cannot waive/verify own finding |
| Approve/reject/conditional sign-off | No | No | Assigned + stage DECIDE right | Rationale, clean workbook, no blocking findings/unhandled requests |
| Assign/reassign ticket | No | No | Senior of accountable team | Eligible target; ordinary Auditor cannot self-assign |
| Business accountability approve/return | No | Current submitted business owner | No | Distinct stage approval; does not authorize independent audit sign-off |
| Team membership / senior designation | Yes | No | No | Current Auditor member; at most one lead per team |
| Workflow/schema/routing drafts and publish | Yes | No | No | Cannot override hard security invariants |
| Create/publish News, upload Library files | Yes | No | No | Clean attachments, publication/audience validation |
| Three mapping statuses / directory sync | Yes | No | No | Never modify AD membership |
| Audit history / operational summaries | All | Accessible records | All submitted records | Redacted, scoped projections; no performance leaderboard |
| Hard-delete reviewed data / edit decision | No | No | No | Approved retention maintenance only; append corrections |

Assumed sharing (D03): grant applies to Registry and submitted reviews/evidence; view grants exclude drafts, edit grants permit draft collaboration. Revocation removes this entitlement unless another role/ownership grants access. Creator is immutable, no anonymous links/invites, no grant propagation, no share to unrecognized users. Return 409 recipient_not_eligible for an ineligible colleague. Owner changes require Owner permission and audit.

Seed one application audit team; Admin manages its eligible Auditor members and zero/one lead, and can create more teams. Senior can assign that team's work; designation does not confer decision authority. Ordinary Auditor retains organization-wide read. No absent-lead automatic promotion. Multi-role users cannot audit/decide their own submissions or records they own; apply that conflict again at assignment and decision time. Admin sees oversight data but needs independent Auditor/assignment rights for auditing.

Application Admin is unrelated to Azure RBAC/AWS IAM. No app user receives storage, secret-manager, deploy or cloud-control-plane credentials through their application role.


## 4. Complete relational model

**All 38 tables below are proposed new tables**, including the migration ledger. Existing tables: none. Changes to existing database tables: none. The old blueprint's entity names are design ideas, not an existing migration baseline. No generic role_assignment/polymorphic artifact_link or duplicate signoff table is introduced.

### 4.1 Conventions that apply to every dictionary and diagram

- PostgreSQL types are literal. Nullable=No is NOT NULL; “—” means no default (caller must supply). All nullable fields default NULL. UUID identifiers use gen_random_uuid(); BIGINT human numbers use independent sequences, displayed AIR-/RAI- with at least four digits. Gaps are allowed; never MAX()+1.
- All FK targets below are explicit. **Every FK uses ON UPDATE RESTRICT, ON DELETE RESTRICT**, including nullable FKs. There are no cascading business deletes or implicit SET NULL. Cleanup deletes dependent ephemeral rows explicitly before parents; published/history rows are retained. UUID/identity keys are immutable.
- A nonnull FK means exactly one parent; a nullable FK means zero or one. Parent ordinarily has zero/many children. Unique/composite/partial constraints below further restrict cardinality (notably one lead/team, one current assignment/stage, one current published version/profile). PK(part) means one component of the listed composite primary key.
- Every FK gets a B-tree index unless already a leading prefix of a declared PK/UQ/index. Add explicitly listed query/partial indexes; verify EXPLAIN on authorized list queries. JSON fields have strict versioned application schemas; no arbitrary JSON substitutes for relationships.
- All mutable aggregate fields include the explicit version/created/updated fields shown. UPDATE must set updated_at/by and increment version; DB does not do this merely because DEFAULT now() exists. Child edits bump the parent aggregate. Workers record service actors in audit; worker-owned operational tables use their explicit timestamps rather than inventing human IDs.
- Dictionaries are authoritative for checks, limits and defaults. ERDs enumerate every field and mark every FK; external entities are repeated as **key-only anchors** to connect diagrams, not extra tables. Common creator/updater references appear as labeled relationships. Column FK targets and composite constraints must be tested, not left as ORM comments.
- Cross-row invariants are implemented with deferrable constraint triggers or transactionally locked application checks where directory state is involved. Never pretend a PostgreSQL CHECK can query other tables. Published-version and append-only protection must also exist in DB permissions/triggers.
- Use stable field/option keys across version clones. Old Registry records pin old schema/value rows until explicitly upgraded. Readiness checks the active schema by stable keys, returns migration/required-field errors, and blocks new submission until corrected. Published review_submission snapshots never change when Registry/schema changes.
- App-level soft archive is available only where specified. No runtime hard-delete endpoints. Retention defaults to retain until policy approval, not an invented statutory period. Session/login/idempotency/cache housekeeping is operational, separate from evidence retention.


### 4.2. Identity and sessions

~~~mermaid
erDiagram
    principal {
        uuid id PK
        text issuer
        text subject
        text directory_object_id
        varchar(200) display_name
        varchar(320) email
        boolean enabled
        integer session_generation
        timestamptz authorization_checked_at
        timestamptz authorization_expires_at
        timestamptz created_at
        timestamptz updated_at
    }
    principal_membership {
        uuid principal_id PK, FK
        text role PK
        text source_group_id
        timestamptz observed_at
        timestamptz expires_at
    }
    login_transaction {
        char(64) state_hash PK
        char(64) nonce_hash
        char(64) browser_binding_hash
        bytea verifier_ciphertext
        text encryption_key_id
        varchar(2048) return_path
        timestamptz created_at
        timestamptz expires_at
        timestamptz consumed_at
    }
    web_session {
        char(64) session_hash PK
        uuid principal_id FK
        integer generation
        char(64) csrf_hash
        bytea csrf_ciphertext
        bytea token_ciphertext
        text encryption_key_id
        timestamptz created_at
        timestamptz last_seen_at
        timestamptz idle_expires_at
        timestamptz absolute_expires_at
        timestamptz revoked_at
        integer version
    }
    principal ||--o{ principal_membership : principal_id
    principal ||..o{ web_session : principal_id
~~~

#### Table: principal (NEW)

Stable enterprise identity; never identified by display name.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| issuer | text | No | — | Configured OIDC issuer |
| subject | text | Yes | NULL | Stable OIDC subject; nullable for directory-provisioned users who have not signed in |
| directory_object_id | text | Yes | NULL | Entra oid; stable federated directory key otherwise |
| display_name | varchar(200) | No | — | Display only |
| email | varchar(320) | Yes | NULL | Display/contact only; not unique authorization key |
| enabled | boolean | No | true | Local suspension; authoritative directory disable also enforced |
| session_generation | integer | No | 1 | Increment to revoke all existing sessions |
| authorization_checked_at | timestamptz | Yes | NULL | Complete snapshot time, including empty result |
| authorization_expires_at | timestamptz | Yes | NULL | Must not exceed configured freshness |
| created_at | timestamptz | No | now() | UTC |
| updated_at | timestamptz | No | now() | UTC |

**Constraints, indexes and lifecycle:** Partial UQ(issuer,subject) where nonnull; partial UQ(issuer,directory_object_id) where nonnull; CHECK at least one of subject/directory_object_id is present. Directory lookup provisions by stable object ID without inventing an OIDC subject; first validated login binds subject atomically and rejects mismatches. Index enabled. Never physically delete principals referenced by history; redact contact metadata under approved policy. Login must reject mismatched issuer/object binding. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: principal_membership (NEW)

Replaceable authoritative cache of exactly three AD memberships, not user-editable role grants.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| principal_id | uuid | No | — | PK(part); FK:principal.id |
| role | text | No | — | PK(part); CHECK Admin/Submitter/Auditor only |
| source_group_id | text | No | — | Must equal configured stable ID for role |
| observed_at | timestamptz | No | now() | Snapshot time |
| expires_at | timestamptz | No | — | Greater than observed_at; bounded TTL |

**Constraints, indexes and lifecycle:** PK(principal_id,role); index(role,principal_id). Replace complete snapshot in one transaction with principal freshness; all rows absent means no roles. Delete cache rows on revoke; historical role evidence lives in audit_event. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: login_transaction (NEW)

One-use OIDC state, nonce and PKCE correlation.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| state_hash | char(64) | No | — | PK; SHA256 of random state |
| nonce_hash | char(64) | No | — | SHA256 nonce |
| browser_binding_hash | char(64) | No | — | Hash of random initiating-browser pre-auth cookie; callback must match |
| verifier_ciphertext | bytea | No | — | Encrypted PKCE verifier |
| encryption_key_id | text | No | — | Rotatable key identifier, not secret |
| return_path | varchar(2048) | No | '/' | Allowlisted relative path only |
| created_at | timestamptz | No | now() | UTC |
| expires_at | timestamptz | No | — | Five minutes after creation |
| consumed_at | timestamptz | Yes | NULL | Atomically set once |

**Constraints, indexes and lifecycle:** Index expires_at. CAS consumption prevents callback replay. Expired/consumed rows purged by worker. No FK because identity is not established yet. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: web_session (NEW)

Server-side BFF session and encrypted provider token cache.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| session_hash | char(64) | No | — | PK; only hash of browser cookie |
| principal_id | uuid | No | — | FK:principal.id |
| generation | integer | No | — | Must match principal.session_generation |
| csrf_hash | char(64) | No | — | Session-bound CSRF token hash |
| csrf_ciphertext | bytea | No | — | Encrypted recoverable CSRF token; /me returns same token until intentional rotation |
| token_ciphertext | bytea | Yes | NULL | Encrypted OIDC/Graph refresh/access cache |
| encryption_key_id | text | No | — | Key version protecting CSRF token and optional provider token cache |
| created_at | timestamptz | No | now() | UTC |
| last_seen_at | timestamptz | No | now() | Idle expiry reference |
| idle_expires_at | timestamptz | No | — | 30-minute sliding bound |
| absolute_expires_at | timestamptz | No | — | Eight-hour bound |
| revoked_at | timestamptz | Yes | NULL | Immediate local revocation |
| version | integer | No | 1 | Refresh/CSRF rotation concurrency |

**Constraints, indexes and lifecycle:** Index(principal_id), index absolute_expires_at; idle <= absolute. Token cache and CSRF token rotation atomic. /me decrypts the existing session CSRF token; rotate on login/session-security events, atomically storing ciphertext and hash. Do not rotate on every GET and invalidate other tabs. Purge expired sessions; never expose ciphertext. All FK update/delete actions and implicit FK indexes follow section 4.1.


### 4.3. Auditor teams and senior designation

~~~mermaid
erDiagram
    audit_team {
        uuid id PK
        varchar(120) name
        boolean enabled
        integer version
        timestamptz created_at
        uuid created_by FK
        timestamptz updated_at
        uuid updated_by FK
    }
    audit_team_member {
        uuid team_id PK, FK
        uuid principal_id PK, FK
        boolean active
        uuid added_by FK
        timestamptz added_at
        uuid removed_by FK
        timestamptz removed_at
        integer version
    }
    audit_team_lead {
        uuid team_id PK, FK
        uuid principal_id FK
        uuid designated_by FK
        timestamptz designated_at
        varchar(2000) reason
        integer version
    }
    principal {
        uuid id PK
    }
    audit_team_member ||--o| audit_team_lead : eligible_membership
    principal ||..o{ audit_team : created_by
    principal |o..o{ audit_team : updated_by
    audit_team ||--o{ audit_team_member : team_id
    principal ||--o{ audit_team_member : principal_id
    principal ||..o{ audit_team_member : added_by
    principal |o..o{ audit_team_member : removed_by
    audit_team ||--o| audit_team_lead : team_id
    principal ||..o{ audit_team_lead : principal_id
    principal ||..o{ audit_team_lead : designated_by
~~~

#### Table: audit_team (NEW)

Application work allocation scope; not another AD group.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| name | varchar(120) | No | — | Unique active team label |
| enabled | boolean | No | true | Disabled teams cannot accept new work |
| version | integer | No | 1 | Optimistic concurrency; >0 |
| created_at | timestamptz | No | now() | UTC |
| created_by | uuid | No | — | FK:principal.id; immutable creator |
| updated_at | timestamptz | No | now() | Set on every mutation; service actor identified in audit_event |
| updated_by | uuid | Yes | NULL | FK:principal.id; human actor, NULL only for audited service mutation |

**Constraints, indexes and lifecycle:** UQ(name); use soft disable. Seed one default team. Referenced teams cannot be deleted. Mutable audit columns below are explicit fields. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: audit_team_member (NEW)

Application team membership within current AD Auditor population.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| team_id | uuid | No | — | PK(part); FK:audit_team.id |
| principal_id | uuid | No | — | PK(part); FK:principal.id |
| active | boolean | No | true | Does not itself grant Auditor role |
| added_by | uuid | No | — | FK:principal.id |
| added_at | timestamptz | No | now() | UTC |
| removed_by | uuid | Yes | NULL | FK:principal.id |
| removed_at | timestamptz | Yes | NULL | Required with removed_by when inactive |
| version | integer | No | 1 | Concurrency |

**Constraints, indexes and lifecycle:** PK(team_id,principal_id); index(principal_id,active). CHECK inactive iff removed_at and removed_by are nonnull. Removal clears lead atomically and marks assignments for reassignment, without deleting them. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: audit_team_lead (NEW)

Current senior designation; replacement history is append-only audit.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| team_id | uuid | No | — | PK; FK:audit_team.id |
| principal_id | uuid | No | — | FK:principal.id |
| designated_by | uuid | No | — | FK:principal.id |
| designated_at | timestamptz | No | now() | UTC |
| reason | varchar(2000) | No | — | Nonblank |
| version | integer | No | 1 | Concurrency |

**Constraints, indexes and lifecycle:** Additional composite FK(team_id,principal_id) -> audit_team_member(team_id,principal_id). One lead per team via PK; a principal may lead multiple teams. Enforce active membership and current AD Auditor eligibility in locked application transaction. Delete current designation on removal; preserve audit. All FK update/delete actions and implicit FK indexes follow section 4.1.


### 4.4. Versioned governance

~~~mermaid
erDiagram
    governance_version {
        uuid id PK
        text kind
        text profile
        integer revision
        text status
        jsonb settings
        timestamptz published_at
        uuid published_by FK
        uuid supersedes_id FK
        integer version
        timestamptz created_at
        uuid created_by FK
        timestamptz updated_at
        uuid updated_by FK
    }
    registry_field {
        uuid id PK
        uuid schema_version_id FK
        varchar(80) field_key
        varchar(150) label
        text input_type
        boolean required
        boolean is_core
        varchar(1000) help_text
        integer position
    }
    registry_option {
        uuid id PK
        uuid field_id FK
        varchar(80) option_key
        varchar(150) label
        integer position
    }
    workflow_stage {
        uuid id PK
        uuid workflow_version_id FK
        varchar(80) stage_key
        text kind
        varchar(150) label
        varchar(2000) description
        text owner_role
        text action
        integer position
        integer sla_days
        boolean conditional
    }
    principal {
        uuid id PK
    }
    principal |o..o{ governance_version : published_by
    governance_version |o..o{ governance_version : supersedes_id
    principal ||..o{ governance_version : created_by
    principal |o..o{ governance_version : updated_by
    governance_version ||..o{ registry_field : schema_version_id
    registry_field ||..o{ registry_option : field_id
    governance_version ||..o{ workflow_stage : workflow_version_id
~~~

#### Table: governance_version (NEW)

Registry schema or workflow configuration draft/published version.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| kind | text | No | — | CHECK registry/workflow |
| profile | text | No | — | registry or standard/expedited/high_risk, consistent with kind |
| revision | integer | No | — | Positive version within profile |
| status | text | No | 'draft' | CHECK draft/published/superseded |
| settings | jsonb | No | '{}'::jsonb | Versioned strict config schema: routing, alerts, calendar; no scripts |
| published_at | timestamptz | Yes | NULL | Required after publication |
| published_by | uuid | Yes | NULL | FK:principal.id |
| supersedes_id | uuid | Yes | NULL | FK:governance_version.id; same kind/profile |
| version | integer | No | 1 | Optimistic concurrency; >0 |
| created_at | timestamptz | No | now() | UTC |
| created_by | uuid | No | — | FK:principal.id; immutable creator |
| updated_at | timestamptz | No | now() | Set on every mutation; service actor identified in audit_event |
| updated_by | uuid | Yes | NULL | FK:principal.id; human actor, NULL only for audited service mutation |

**Constraints, indexes and lifecycle:** UQ(kind,profile,revision); partial UQ(kind,profile) where status=published and separately where status=draft. Index status. Published/superseded content immutable except publication status transition; new version for edits. Publishing atomically retires previous active version. Immutable children protected by trigger. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: registry_field (NEW)

A field definition belonging to one registry schema version.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| schema_version_id | uuid | No | — | FK:governance_version.id; kind=registry |
| field_key | varchar(80) | No | — | Stable camelCase key |
| label | varchar(150) | No | — | Nonblank |
| input_type | text | No | — | CHECK text/textarea/person/select/date |
| required | boolean | No | false | Readiness, not draft-save requiredness |
| is_core | boolean | No | false | Reserved keys cannot be removed or change type |
| help_text | varchar(1000) | No | '' | Plain text |
| position | integer | No | — | Positive display order |

**Constraints, indexes and lifecycle:** UQ(schema_version_id,field_key), UQ(schema_version_id,position); all five existing keys name,brief,techOwner,businessOwner,lifecycle become reserved core fields (explicit tightening of prototype). Core values live on ai_system, not duplicated in registry_value. Children editable only in draft parent; select >=2 options at publication. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: registry_option (NEW)

Stable option key within versioned select-field definition.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| field_id | uuid | No | — | FK:registry_field.id |
| option_key | varchar(80) | No | — | Stable across cloned schema versions |
| label | varchar(150) | No | — | Nonblank |
| position | integer | No | — | Positive |

**Constraints, indexes and lifecycle:** UQ(field_id,option_key), UQ(field_id,position); field must be select. Retire through new schema, never delete referenced published options. Existing lifecycle labels mapped to stable keys ideation,poc,pilot,pre_production,production,retired. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: workflow_stage (NEW)

Ordered stage specification pinned by workflow version.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| workflow_version_id | uuid | No | — | FK:governance_version.id; kind=workflow |
| stage_key | varchar(80) | No | — | Stable key within profile |
| kind | text | No | — | CHECK intake/business/assessment/evidence/decision |
| label | varchar(150) | No | — | Editable display name |
| description | varchar(2000) | No | '' | Plain text |
| owner_role | text | No | — | CHECK Submitter/Auditor |
| action | text | No | — | CHECK TRIAGE/APPROVE/ASSESS/RESPOND/DECIDE |
| position | integer | No | — | Positive |
| sla_days | integer | No | — | CHECK 1..30 |
| conditional | boolean | No | false | Evidence branch only |

**Constraints, indexes and lifecycle:** UQ(workflow_version_id,stage_key), UQ(workflow_version_id,position). Enforce kind/action/role mapping, one intake/business/assessment/decision, evidence branch, and safe ordering on publish. Admin labels do not grant role authority. Repeated arbitrary stage graphs are out of first-release scope. All FK update/delete actions and implicit FK indexes follow section 4.1.


### 4.5. Registry and sharing

~~~mermaid
erDiagram
    ai_system {
        uuid id PK
        bigint registry_number
        uuid schema_version_id FK
        varchar(200) name
        varchar(4000) brief
        uuid technical_owner_id FK
        uuid business_owner_id FK
        uuid lifecycle_option_id FK
        varchar(150) organization_unit
        text acquisition_mode
        varchar(80) data_region
        timestamptz archived_at
        integer version
        timestamptz created_at
        uuid created_by FK
        timestamptz updated_at
        uuid updated_by FK
    }
    registry_value {
        uuid system_id PK, FK
        uuid field_id PK, FK
        jsonb scalar_value
        uuid person_id FK
        uuid option_id FK
        timestamptz updated_at
        uuid updated_by FK
    }
    registry_share {
        uuid system_id PK, FK
        uuid recipient_id PK, FK
        text permission
        uuid granted_by FK
        timestamptz granted_at
        uuid revoked_by FK
        timestamptz revoked_at
        integer version
    }
    governance_version {
        uuid id PK
    }
    principal {
        uuid id PK
    }
    registry_option {
        uuid id PK
    }
    registry_field {
        uuid id PK
    }
    governance_version ||..o{ ai_system : schema_version_id
    principal |o..o{ ai_system : technical_owner_id
    principal |o..o{ ai_system : business_owner_id
    registry_option |o..o{ ai_system : lifecycle_option_id
    principal ||..o{ ai_system : created_by
    principal |o..o{ ai_system : updated_by
    ai_system ||--o{ registry_value : system_id
    registry_field ||--o{ registry_value : field_id
    principal |o..o{ registry_value : person_id
    registry_option |o..o{ registry_value : option_id
    principal |o..o{ registry_value : updated_by
    ai_system ||--o{ registry_share : system_id
    principal ||--o{ registry_share : recipient_id
    principal ||..o{ registry_share : granted_by
    principal |o..o{ registry_share : revoked_by
~~~

#### Table: ai_system (NEW)

AI Registry aggregate; core workflow ownership and readiness fields.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| registry_number | bigint | No | nextval('registry_number_seq') | Unique positive; display AIR- zero-padded minimum 4 digits |
| schema_version_id | uuid | No | — | FK:governance_version.id; registry version |
| name | varchar(200) | No | — | Nonblank even in draft |
| brief | varchar(4000) | Yes | NULL | Required at readiness by initial schema |
| technical_owner_id | uuid | Yes | NULL | FK:principal.id; current Submitter at assignment |
| business_owner_id | uuid | Yes | NULL | FK:principal.id; current Submitter at assignment |
| lifecycle_option_id | uuid | Yes | NULL | FK:registry_option.id; lifecycle field in pinned schema |
| organization_unit | varchar(150) | Yes | NULL | Display metadata, never authorization |
| acquisition_mode | text | No | 'unknown' | CHECK build/procure/unknown; known before submit |
| data_region | varchar(80) | Yes | NULL | Approved metadata, never default fabricated EU |
| archived_at | timestamptz | Yes | NULL | Archive only if no active review |
| version | integer | No | 1 | Optimistic concurrency; >0 |
| created_at | timestamptz | No | now() | UTC |
| created_by | uuid | No | — | FK:principal.id; immutable creator |
| updated_at | timestamptz | No | now() | Set on every mutation; service actor identified in audit_event |
| updated_by | uuid | Yes | NULL | FK:principal.id; human actor, NULL only for audited service mutation |

**Constraints, indexes and lifecycle:** UQ(registry_number); indexes(created_by,updated_at,id), technical_owner_id, business_owner_id; lower(name) expression index for prefix search. At save validate nonnull owner eligibility and core FKs belong to selected schema. Draft can be incomplete; readiness computed against active schema, never stored boolean. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: registry_value (NEW)

Typed custom values; core values are not duplicated here.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| system_id | uuid | No | — | PK(part); FK:ai_system.id |
| field_id | uuid | No | — | PK(part); FK:registry_field.id |
| scalar_value | jsonb | Yes | NULL | Only JSON string for text/textarea/date; no arbitrary objects |
| person_id | uuid | Yes | NULL | FK:principal.id; person type |
| option_id | uuid | Yes | NULL | FK:registry_option.id; select type |
| updated_at | timestamptz | No | now() | UTC |
| updated_by | uuid | Yes | NULL | FK:principal.id |

**Constraints, indexes and lifecycle:** PK(system_id,field_id); indexes field_id,person_id,option_id. CHECK num_nonnulls(scalar_value,person_id,option_id)=1; absence is no row. Deferred constraint trigger validates field's pinned schema, noncore/type, option membership and ISO date. Mutable child changes bump ai_system version in same UoW. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: registry_share (NEW)

One current direct user grant per Registry item; revocations retained.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| system_id | uuid | No | — | PK(part); FK:ai_system.id |
| recipient_id | uuid | No | — | PK(part); FK:principal.id |
| permission | text | No | — | CHECK view/edit |
| granted_by | uuid | No | — | FK:principal.id |
| granted_at | timestamptz | No | now() | UTC |
| revoked_by | uuid | Yes | NULL | FK:principal.id |
| revoked_at | timestamptz | Yes | NULL | Paired with revoked_by |
| version | integer | No | 1 | Concurrency |

**Constraints, indexes and lifecycle:** PK(system_id,recipient_id); index(recipient_id,system_id) where revoked_at is null. Paired revoke fields; regrant updates current row with audit preserving history. Recipient cannot equal creator; owner grants redundant and rejected. Current recognized Submitter membership always required. All FK update/delete actions and implicit FK indexes follow section 4.1.


#### Table: registry_revision (NEW)

Immutable snapshot at each successful Registry save/schema upgrade. This preserves retired custom values and previous ownership without keeping incompatible old rows in the current registry_value set. Access inherits current Registry read policy.

~~~mermaid
erDiagram
    registry_revision {
        uuid id PK
        uuid system_id FK
        uuid schema_version_id FK
        integer revision
        jsonb snapshot
        uuid created_by FK
        timestamptz created_at
    }
    ai_system {
        uuid id PK
    }
    governance_version {
        uuid id PK
    }
    principal {
        uuid id PK
    }
    ai_system ||..o{ registry_revision : system_id
    governance_version ||..o{ registry_revision : schema_version_id
    principal |o..o{ registry_revision : created_by
~~~

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | PK |
| system_id | uuid | No | — | FK:ai_system.id |
| schema_version_id | uuid | No | — | FK:governance_version.id; kind=registry |
| revision | integer | No | — | Equals committed ai_system.version; positive |
| snapshot | jsonb | No | — | Canonical core/custom values with stable field/option/owner IDs and labels; strict schema, bounded 1 MiB |
| created_by | uuid | Yes | NULL | FK:principal.id; human actor, NULL only audited service migration |
| created_at | timestamptz | No | now() | UTC |

**Constraints, indexes and lifecycle:** UQ(system_id,revision); index schema_version_id and created_by. Same FK RESTRICT rules as section 4.1. Runtime INSERT/SELECT only. Save snapshot in the same UoW as initial creation/every mutation, storing that committed revision. Before schema upgrade, the preceding revision must already be snapshotted; then replace current registry_value rows to match the new schema and append the new snapshot. Old snapshots and field definitions remain. Sparse audit metadata is not the recovery source.

### 4.6. Review submission and stage execution

~~~mermaid
erDiagram
    workbook_template {
        uuid id PK
        varchar(100) template_key
        integer revision
        text format
        jsonb manifest
        char(64) manifest_sha256
        boolean active
        uuid approved_by FK
        timestamptz approved_at
        timestamptz created_at
        uuid created_by FK
    }
    review {
        uuid id PK
        bigint review_number
        uuid system_id FK
        text review_type
        text state
        text risk
        uuid audit_team_id FK
        uuid workflow_version_id FK
        uuid current_submission_id FK
        uuid baseline_review_id FK
        uuid baseline_workbook_version_id FK
        uuid submitted_by FK
        timestamptz submitted_at
        timestamptz due_at
        timestamptz closed_at
        integer version
        timestamptz created_at
        uuid created_by FK
        timestamptz updated_at
        uuid updated_by FK
    }
    stage_run {
        uuid id PK
        uuid review_id FK
        uuid stage_definition_id FK
        integer attempt
        text state
        timestamptz started_at
        timestamptz due_at
        timestamptz completed_at
        uuid completed_by FK
        uuid reviewed_workbook_version_id FK
        integer version
    }
    review_assignment {
        uuid id PK
        uuid stage_run_id FK
        uuid assignee_id FK
        uuid assigned_by FK
        text assignment_source
        varchar(2000) reason
        timestamptz assigned_at
        timestamptz ended_at
        uuid ended_by FK
        varchar(2000) end_reason
    }
    review_submission {
        uuid id PK
        uuid review_id FK
        integer attempt
        uuid registry_schema_version_id FK
        jsonb registry_snapshot
        uuid workbook_version_id FK
        uuid submitted_by FK
        timestamptz submitted_at
    }
    principal {
        uuid id PK
    }
    ai_system {
        uuid id PK
    }
    audit_team {
        uuid id PK
    }
    governance_version {
        uuid id PK
    }
    artifact_version {
        uuid id PK
    }
    workflow_stage {
        uuid id PK
    }
    principal |o..o{ workbook_template : approved_by
    principal ||..o{ workbook_template : created_by
    ai_system ||..o{ review : system_id
    audit_team ||..o{ review : audit_team_id
    governance_version |o..o{ review : workflow_version_id
    review_submission |o..o| review : current_submission_id
    review |o..o{ review : baseline_review_id
    artifact_version |o..o{ review : baseline_workbook_version_id
    principal |o..o{ review : submitted_by
    principal ||..o{ review : created_by
    principal |o..o{ review : updated_by
    review ||..o{ stage_run : review_id
    workflow_stage ||..o{ stage_run : stage_definition_id
    principal |o..o{ stage_run : completed_by
    artifact_version |o..o{ stage_run : reviewed_workbook_version_id
    stage_run ||..o{ review_assignment : stage_run_id
    principal ||..o{ review_assignment : assignee_id
    principal |o..o{ review_assignment : assigned_by
    principal |o..o{ review_assignment : ended_by
    review ||..o{ review_submission : review_id
    governance_version ||..o{ review_submission : registry_schema_version_id
    artifact_version ||..o{ review_submission : workbook_version_id
    principal ||..o{ review_submission : submitted_by
~~~

#### Table: workbook_template (NEW)

Approved versioned machine-readable workbook validation manifest.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| template_key | varchar(100) | No | — | Stable workbook family |
| revision | integer | No | — | Positive |
| format | text | No | — | CHECK xlsx/xls/csv |
| manifest | jsonb | No | — | Strict manifest schema; anchors/conditional requiredness and parser limits |
| manifest_sha256 | char(64) | No | — | Hash canonical manifest |
| active | boolean | No | false | Only approved manifests selectable for new uploads |
| approved_by | uuid | Yes | NULL | FK:principal.id |
| approved_at | timestamptz | Yes | NULL | Paired; required for active |
| created_at | timestamptz | No | now() | UTC |
| created_by | uuid | No | — | FK:principal.id |

**Constraints, indexes and lifecycle:** UQ(template_key,revision,format); partial UQ(template_key,format) where active. Manifest immutable after approval; replace with new revision. Existing accepted versions retain old manifest FK. No API to upload executable parser code. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: review (NEW)

Review transaction and immutable submission/baseline context.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| review_number | bigint | No | nextval('review_number_seq') | Positive; RAI- display |
| system_id | uuid | No | — | FK:ai_system.id |
| review_type | text | No | — | CHECK poc/deployment |
| state | text | No | 'draft' | CHECK draft/submitted/in_review/evidence_requested/returned/approved/approved_with_conditions/rejected/closed |
| risk | text | No | 'pending' | CHECK pending/low/medium/high |
| audit_team_id | uuid | No | — | FK:audit_team.id |
| workflow_version_id | uuid | Yes | NULL | FK:governance_version.id; workflow; required after submission |
| current_submission_id | uuid | Yes | NULL | FK:review_submission.id; required after first submission |
| baseline_review_id | uuid | Yes | NULL | FK:review.id; approved POC same system |
| baseline_workbook_version_id | uuid | Yes | NULL | FK:artifact_version.id; exact approved POC reviewed file |
| submitted_by | uuid | Yes | NULL | FK:principal.id |
| submitted_at | timestamptz | Yes | NULL | Paired; first submission time |
| due_at | timestamptz | Yes | NULL | Computed persisted due date, not UI string |
| closed_at | timestamptz | Yes | NULL | Terminal completion time |
| version | integer | No | 1 | Optimistic concurrency; >0 |
| created_at | timestamptz | No | now() | UTC |
| created_by | uuid | No | — | FK:principal.id; immutable creator |
| updated_at | timestamptz | No | now() | Set on every mutation; service actor identified in audit_event |
| updated_by | uuid | Yes | NULL | FK:principal.id; human actor, NULL only for audited service mutation |

**Constraints, indexes and lifecycle:** UQ(review_number); partial UQ(current_submission_id) where nonnull; indexes(system_id,created_at,id), (state,due_at,id), (audit_team_id,state), baseline_review_id. Partial UQ(system_id,review_type) for draft/submitted/in_review/evidence_requested/returned/approved_with_conditions by default D06. Baseline fields paired, deployment-only, same system and approved POC; prohibit self-reference/cycles. workflow_version_id, first submitted_by/at and baseline immutable after first submit. current_submission_id must reference this review; return/resubmit inserts a new immutable review_submission and stage attempt. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: stage_run (NEW)

One execution/attempt of a configured review stage.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| review_id | uuid | No | — | FK:review.id |
| stage_definition_id | uuid | No | — | FK:workflow_stage.id |
| attempt | integer | No | 1 | Positive; increments on returned/re-entered stage |
| state | text | No | 'pending' | CHECK pending/active/waiting/completed/skipped/cancelled |
| started_at | timestamptz | Yes | NULL | Required active/waiting/completed |
| due_at | timestamptz | Yes | NULL | SLA snapshot |
| completed_at | timestamptz | Yes | NULL | Terminal stage timestamp |
| completed_by | uuid | Yes | NULL | FK:principal.id; nullable for automatic stages |
| reviewed_workbook_version_id | uuid | Yes | NULL | FK:artifact_version.id; accepted reviewed file |
| version | integer | No | 1 | Concurrency |

**Constraints, indexes and lifecycle:** UQ(review_id,stage_definition_id,attempt); partial UQ(review_id) where state in(active,waiting). Index(state,due_at); FK domain validation stage version equals review.workflow_version_id. During evidence collection, keep the assessment run waiting and create no active evidence run; evidence_request holds the response deadline. No two active/waiting runs. Stage changes increment review.version. Completed run immutable. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: review_assignment (NEW)

Assignment history; at most one current auditor per stage run.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| stage_run_id | uuid | No | — | FK:stage_run.id |
| assignee_id | uuid | No | — | FK:principal.id |
| assigned_by | uuid | Yes | NULL | FK:principal.id; NULL for routing worker |
| assignment_source | text | No | 'manual' | CHECK manual/routing |
| reason | varchar(2000) | No | — | Nonblank |
| assigned_at | timestamptz | No | now() | UTC |
| ended_at | timestamptz | Yes | NULL | Superseded/completed |
| ended_by | uuid | Yes | NULL | FK:principal.id; NULL for worker |
| end_reason | varchar(2000) | Yes | NULL | Required when ended |

**Constraints, indexes and lifecycle:** Partial UQ(stage_run_id) where ended_at null; index(assignee_id,ended_at), stage_run_id. Manual assigned_by required; routing identity separately audited. Active target must belong to review team and current Auditor population, with no ownership conflict. Only ended fields can change on historical row. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: review_submission (NEW)

Immutable per-attempt readiness snapshot and submitted original workbook.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| review_id | uuid | No | — | FK:review.id |
| attempt | integer | No | — | Positive |
| registry_schema_version_id | uuid | No | — | FK:governance_version.id; kind=registry |
| registry_snapshot | jsonb | No | — | Canonical core/custom values, stable user/option IDs and labels |
| workbook_version_id | uuid | No | — | FK:artifact_version.id; accepted original for same review |
| submitted_by | uuid | No | — | FK:principal.id |
| submitted_at | timestamptz | No | now() | UTC |

**Constraints, indexes and lifecycle:** UQ(review_id,attempt); index workbook_version_id. Insert-only, no update/delete by app. Review points to current attempt, old snapshots remain independently queryable. Resubmission after return inserts a new attempt; workflow version remains pinned to first submit. All FK update/delete actions and implicit FK indexes follow section 4.1.


### 4.7. Evidence, findings and decisions

~~~mermaid
erDiagram
    evidence_request {
        uuid id PK
        uuid review_id FK
        uuid stage_run_id FK
        varchar(4000) question
        uuid reviewed_workbook_version_id FK
        text state
        uuid accepted_submission_id FK
        timestamptz due_at
        timestamptz accepted_at
        uuid accepted_by FK
        integer version
        timestamptz created_at
        uuid created_by FK
    }
    evidence_submission {
        uuid id PK
        uuid request_id FK
        varchar(8000) response_text
        timestamptz submitted_at
        uuid submitted_by FK
    }
    finding {
        uuid id PK
        uuid review_id FK
        varchar(150) control_key
        text severity
        varchar(4000) statement
        text status
        varchar(8000) remediation
        varchar(4000) resolution_reason
        uuid resolved_by FK
        timestamptz resolved_at
        integer version
        timestamptz created_at
        uuid created_by FK
        timestamptz updated_at
        uuid updated_by FK
    }
    decision {
        uuid id PK
        uuid review_id FK
        uuid stage_run_id FK
        text outcome
        varchar(8000) rationale
        uuid reviewed_workbook_version_id FK
        uuid signed_by FK
        timestamptz signed_at
        jsonb authority_snapshot
        uuid supersedes_id FK
    }
    decision_condition {
        uuid id PK
        uuid decision_id FK
        uuid finding_id FK
        varchar(4000) requirement
        timestamptz due_at
        timestamptz resolved_at
        uuid resolved_by FK
    }
    review {
        uuid id PK
    }
    stage_run {
        uuid id PK
    }
    artifact_version {
        uuid id PK
    }
    principal {
        uuid id PK
    }
    review ||..o{ evidence_request : review_id
    evidence_submission |o..o| evidence_request : accepted_submission_id
    stage_run ||..o{ evidence_request : stage_run_id
    artifact_version ||..o{ evidence_request : reviewed_workbook_version_id
    principal |o..o{ evidence_request : accepted_by
    principal ||..o{ evidence_request : created_by
    evidence_request ||..o{ evidence_submission : request_id
    principal ||..o{ evidence_submission : submitted_by
    review ||..o{ finding : review_id
    principal |o..o{ finding : resolved_by
    principal ||..o{ finding : created_by
    principal |o..o{ finding : updated_by
    review ||..o{ decision : review_id
    stage_run ||..o| decision : stage_run_id
    artifact_version ||..o{ decision : reviewed_workbook_version_id
    principal ||..o{ decision : signed_by
    decision |o..o{ decision : supersedes_id
    decision ||..o{ decision_condition : decision_id
    finding ||..o{ decision_condition : finding_id
    principal |o..o{ decision_condition : resolved_by
~~~

#### Table: evidence_request (NEW)

Auditor question and response state tied to a review/stage.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| review_id | uuid | No | — | FK:review.id |
| stage_run_id | uuid | No | — | FK:stage_run.id |
| question | varchar(4000) | No | — | Nonblank |
| reviewed_workbook_version_id | uuid | No | — | FK:artifact_version.id; clean current reviewed file |
| state | text | No | 'open' | CHECK open/responded/accepted/cancelled |
| accepted_submission_id | uuid | Yes | NULL | FK:evidence_submission.id; exact accepted response of this request |
| due_at | timestamptz | No | — | Calculated from evidence stage policy |
| accepted_at | timestamptz | Yes | NULL | Required if accepted |
| accepted_by | uuid | Yes | NULL | FK:principal.id |
| version | integer | No | 1 | Concurrency |
| created_at | timestamptz | No | now() | UTC |
| created_by | uuid | No | — | FK:principal.id; assigned auditor |

**Constraints, indexes and lifecycle:** Index(review_id,state,due_at), stage_run_id; partial UQ(accepted_submission_id) where nonnull. Accepted response must belong to this request; accepted_submission_id/accepted_at/accepted_by are all present iff state=accepted. Stage belongs to same review; request and accepted fields obey state machine. Rejected response reopens same request with event and original due-date policy. Questions/history are not overwritten. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: evidence_submission (NEW)

Immutable submitter response to an evidence request.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| request_id | uuid | No | — | FK:evidence_request.id |
| response_text | varchar(8000) | No | — | Nonblank; attachments optional |
| submitted_at | timestamptz | No | now() | UTC |
| submitted_by | uuid | No | — | FK:principal.id |

**Constraints, indexes and lifecycle:** Index(request_id,submitted_at,id). Multiple responses allowed when reopened; one submission request is idempotent. State change and attachment links commit atomically. Content never edited after submit. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: finding (NEW)

Review finding/remediation lifecycle; control references remain workbook-based.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| review_id | uuid | No | — | FK:review.id |
| control_key | varchar(150) | Yes | NULL | Stable key if manifest defines one |
| severity | text | No | — | CHECK low/medium/high/critical |
| statement | varchar(4000) | No | — | Nonblank |
| status | text | No | 'open' | CHECK open/remediation_submitted/resolved/waived |
| remediation | varchar(8000) | Yes | NULL | Submitter proposal |
| resolution_reason | varchar(4000) | Yes | NULL | Required resolved/waived |
| resolved_by | uuid | Yes | NULL | FK:principal.id; authorized auditor |
| resolved_at | timestamptz | Yes | NULL | Paired |
| version | integer | No | 1 | Optimistic concurrency; >0 |
| created_at | timestamptz | No | now() | UTC |
| created_by | uuid | No | — | FK:principal.id; immutable creator |
| updated_at | timestamptz | No | now() | Set on every mutation; service actor identified in audit_event |
| updated_by | uuid | Yes | NULL | FK:principal.id; human actor, NULL only for audited service mutation |

**Constraints, indexes and lifecycle:** Index(review_id,status,severity). Block final approval for open high/critical findings unless explicitly covered by approved conditions; waiver only assigned decision-authorized Auditor, reason mandatory. All status/statement changes audited; no destructive delete. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: decision (NEW)

Immutable authenticated sign-off and outcome; combines decision and signer because UI has one sign-off.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| review_id | uuid | No | — | FK:review.id |
| stage_run_id | uuid | No | — | FK:stage_run.id |
| outcome | text | No | — | CHECK approved/approved_with_conditions/rejected |
| rationale | varchar(8000) | No | — | Nonblank |
| reviewed_workbook_version_id | uuid | No | — | FK:artifact_version.id |
| signed_by | uuid | No | — | FK:principal.id |
| signed_at | timestamptz | No | now() | UTC |
| authority_snapshot | jsonb | No | — | Role, assignment, stage right and identity freshness; not a grant |
| supersedes_id | uuid | Yes | NULL | FK:decision.id; only explicit future correction process |

**Constraints, indexes and lifecycle:** UQ(stage_run_id); index(review_id,signed_at). No UPDATE/DELETE grant to app role. Initial API rejects supersedes_id; future corrections require new stage attempt and dedicated ADR. No second signoff table or silent multi-signer requirement. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: decision_condition (NEW)

Relational links between conditional approval and remediable findings.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| decision_id | uuid | No | — | FK:decision.id |
| finding_id | uuid | No | — | FK:finding.id |
| requirement | varchar(4000) | No | — | Nonblank immutable condition text |
| due_at | timestamptz | No | — | Future at creation |
| resolved_at | timestamptz | Yes | NULL | Only after finding verification |
| resolved_by | uuid | Yes | NULL | FK:principal.id |

**Constraints, indexes and lifecycle:** UQ(decision_id,finding_id); index(due_at) where resolved_at null. Decision/finding must belong to same review and outcome conditional. Pair resolved fields; only resolution fields mutable. All conditions resolved -> closed; original decision remains unchanged. All FK update/delete actions and implicit FK indexes follow section 4.1.


### 4.8. Private artifact storage

~~~mermaid
erDiagram
    artifact {
        uuid id PK
        uuid review_id FK
        uuid content_id FK
        text purpose
        text classification
        timestamptz retention_until
        boolean legal_hold
        timestamptz created_at
        uuid created_by FK
    }
    artifact_version {
        uuid id PK
        uuid artifact_id FK
        integer revision
        varchar(255) file_name
        varchar(150) declared_media_type
        varchar(150) detected_media_type
        bigint expected_bytes
        bigint actual_bytes
        char(64) sha256
        varchar(100) storage_profile
        text object_key
        text provider_version_id
        text state
        timestamptz upload_expires_at
        uuid template_id FK
        varchar(100) validator_version
        jsonb validation_result
        timestamptz scan_completed_at
        timestamptz created_at
        uuid created_by FK
    }
    evidence_attachment {
        uuid submission_id PK, FK
        uuid artifact_version_id PK, FK
    }
    review {
        uuid id PK
    }
    content_item {
        uuid id PK
    }
    principal {
        uuid id PK
    }
    workbook_template {
        uuid id PK
    }
    evidence_submission {
        uuid id PK
    }
    review |o..o{ artifact : review_id
    content_item |o..o{ artifact : content_id
    principal ||..o{ artifact : created_by
    artifact ||..o{ artifact_version : artifact_id
    workbook_template |o..o{ artifact_version : template_id
    principal ||..o{ artifact_version : created_by
    evidence_submission ||--o{ evidence_attachment : submission_id
    artifact_version ||--o{ evidence_attachment : artifact_version_id
~~~

#### Table: artifact (NEW)

Logical file with one enforced parent context, including pending uploads.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| review_id | uuid | Yes | NULL | FK:review.id |
| content_id | uuid | Yes | NULL | FK:content_item.id |
| purpose | text | No | — | CHECK original/reviewed/evidence/news/library |
| classification | text | No | 'internal' | CHECK internal/confidential/restricted |
| retention_until | timestamptz | Yes | NULL | NULL means no automatic deletion before policy approved |
| legal_hold | boolean | No | false | Retention maintenance cannot override hold |
| created_at | timestamptz | No | now() | UTC |
| created_by | uuid | No | — | FK:principal.id |

**Constraints, indexes and lifecycle:** CHECK exactly one of review_id/content_id; original/reviewed/evidence require review, news/library require matching content kind. Index review_id,content_id. Parent cannot be reparented; artifact permission always inherited, including upload/finalize/download. No global hash dedup leakage. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: artifact_version (NEW)

Immutable stored bytes and asynchronous validation state for a logical file.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| artifact_id | uuid | No | — | FK:artifact.id |
| revision | integer | No | — | Positive |
| file_name | varchar(255) | No | — | Sanitized original label; never used as object key |
| declared_media_type | varchar(150) | No | — | Client claim, not trusted |
| detected_media_type | varchar(150) | Yes | NULL | Server sniffed type |
| expected_bytes | bigint | No | — | Positive and <= purpose maximum |
| actual_bytes | bigint | Yes | NULL | Server counted |
| sha256 | char(64) | Yes | NULL | Server computed |
| storage_profile | varchar(100) | No | — | Stable named configured connection, retained for old versions |
| object_key | text | No | — | Random immutable server key; private namespace |
| provider_version_id | text | Yes | NULL | Blob/S3 version identity when enabled |
| state | text | No | 'pending' | CHECK pending/uploaded/scanning/accepted/rejected/expired |
| upload_expires_at | timestamptz | No | — | Ten-minute upload session default |
| template_id | uuid | Yes | NULL | FK:workbook_template.id; required for original/reviewed |
| validator_version | varchar(100) | Yes | NULL | Parser/scanner implementation version |
| validation_result | jsonb | Yes | NULL | Strict summary/errors with sheet/cell, no executable content |
| scan_completed_at | timestamptz | Yes | NULL | Required accepted/rejected |
| created_at | timestamptz | No | now() | UTC |
| created_by | uuid | No | — | FK:principal.id |

**Constraints, indexes and lifecycle:** UQ(artifact_id,revision), UQ(storage_profile,object_key); indexes(state,created_at),template_id. Accepted requires expected=actual bytes, hash, detected type, successful malware result and manifest validation if workbook. Bytes/location/hash immutable once uploaded; only scanning state/result can finish. No replacement at same key; rejected bytes remain private until policy cleanup. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: evidence_attachment (NEW)

Accepted version attached to an immutable evidence response.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| submission_id | uuid | No | — | PK(part); FK:evidence_submission.id |
| artifact_version_id | uuid | No | — | PK(part); FK:artifact_version.id |

**Constraints, indexes and lifecycle:** PK(submission_id,artifact_version_id); index artifact_version_id. Deferred trigger validates accepted evidence-purpose version and identical review context. Links immutable after submit. All FK update/delete actions and implicit FK indexes follow section 4.1.


### 4.9. News and Library publication

~~~mermaid
erDiagram
    content_item {
        uuid id PK
        text kind
        timestamptz archived_at
        integer version
        timestamptz created_at
        uuid created_by FK
        timestamptz updated_at
        uuid updated_by FK
    }
    content_revision {
        uuid id PK
        uuid content_id FK
        integer revision
        text status
        varchar(200) title
        varchar(10000) summary
        text collection
        varchar(150) owner_label
        date review_date
        varchar(2048) external_url
        timestamptz published_at
        uuid published_by FK
        integer version
        timestamptz created_at
        uuid created_by FK
        timestamptz updated_at
        uuid updated_by FK
    }
    content_audience {
        uuid content_revision_id PK, FK
        text role PK
    }
    content_attachment {
        uuid content_revision_id PK, FK
        uuid artifact_version_id PK, FK
        integer position
    }
    principal {
        uuid id PK
    }
    artifact_version {
        uuid id PK
    }
    principal ||..o{ content_item : created_by
    principal |o..o{ content_item : updated_by
    content_item ||..o{ content_revision : content_id
    principal |o..o{ content_revision : published_by
    principal ||..o{ content_revision : created_by
    principal |o..o{ content_revision : updated_by
    content_revision ||--o{ content_audience : content_revision_id
    content_revision ||--o{ content_attachment : content_revision_id
    artifact_version ||--o{ content_attachment : artifact_version_id
~~~

#### Table: content_item (NEW)

Stable News/Library identity across draft and publication revisions.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| kind | text | No | — | CHECK news/library |
| archived_at | timestamptz | Yes | NULL | Hidden from readers, retained history |
| version | integer | No | 1 | Optimistic concurrency; >0 |
| created_at | timestamptz | No | now() | UTC |
| created_by | uuid | No | — | FK:principal.id; immutable creator |
| updated_at | timestamptz | No | now() | Set on every mutation; service actor identified in audit_event |
| updated_by | uuid | Yes | NULL | FK:principal.id; human actor, NULL only for audited service mutation |

**Constraints, indexes and lifecycle:** Index(kind,archived_at). Latest published content_revision drives readers; Admin can inspect all revisions. Archive mutation audited. Parent kind immutable after first revision. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: content_revision (NEW)

Draft or immutable published content fields; prevents draft edits leaking to readers.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| content_id | uuid | No | — | FK:content_item.id |
| revision | integer | No | — | Positive |
| status | text | No | 'draft' | CHECK draft/published/superseded |
| title | varchar(200) | No | — | Nonblank |
| summary | varchar(10000) | No | '' | News statement/plain text; optional Library description |
| collection | text | Yes | NULL | CHECK Policy/Template/Guidance; required Library, null News |
| owner_label | varchar(150) | Yes | NULL | Required Library; descriptive department, not ACL |
| review_date | date | Yes | NULL | Required Library; full date, not formatted month/day |
| external_url | varchar(2048) | Yes | NULL | HTTPS; optional Library; null News |
| published_at | timestamptz | Yes | NULL | Required published/superseded |
| published_by | uuid | Yes | NULL | FK:principal.id |
| version | integer | No | 1 | Optimistic concurrency; >0 |
| created_at | timestamptz | No | now() | UTC |
| created_by | uuid | No | — | FK:principal.id; immutable creator |
| updated_at | timestamptz | No | now() | Set on every mutation; service actor identified in audit_event |
| updated_by | uuid | Yes | NULL | FK:principal.id; human actor, NULL only for audited service mutation |

**Constraints, indexes and lifecycle:** UQ(content_id,revision); partial UQ(content_id) per draft and published status; indexes(status,published_at,id), collection. Publish validates >=1 role audience; News summary nonblank, Library file or URL and max one attached file. News <=10 files default. Published fields/audiences/links immutable except status; clone to edit. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: content_audience (NEW)

Role targeting on a specific content revision, not directory role administration.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| content_revision_id | uuid | No | — | PK(part); FK:content_revision.id |
| role | text | No | — | PK(part); CHECK Admin/Submitter/Auditor |

**Constraints, indexes and lifecycle:** PK(content_revision_id,role); index(role,content_revision_id). All means three rows. Existing R&D/Commercial audiences require explicit migration to Submitter; never silently derive record access. No unauthenticated audience. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: content_attachment (NEW)

Pins exact accepted versions in a content revision.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| content_revision_id | uuid | No | — | PK(part); FK:content_revision.id |
| artifact_version_id | uuid | No | — | PK(part); FK:artifact_version.id |
| position | integer | No | — | Positive |

**Constraints, indexes and lifecycle:** PK(content_revision_id,artifact_version_id); UQ(content_revision_id,position); index artifact_version_id. Version must be accepted, artifact.content_id must match revision.content_id; purpose matches kind. Draft-only mutation; published attachment pins cannot drift. All FK update/delete actions and implicit FK indexes follow section 4.1.


### 4.10. Notifications and operational integrity

~~~mermaid
erDiagram
    notification {
        uuid id PK
        uuid recipient_id FK
        uuid review_id FK
        text kind
        varchar(200) title
        varchar(2000) message
        uuid source_event_id FK
        timestamptz created_at
        timestamptz read_at
    }
    audit_event {
        uuid id PK
        uuid actor_id FK
        text actor_kind
        varchar(100) service_name
        varchar(150) action
        varchar(100) aggregate_type
        uuid aggregate_id
        text outcome
        jsonb details
        uuid correlation_id
        timestamptz occurred_at
    }
    outbox_event {
        uuid id PK
        varchar(150) event_type
        varchar(100) aggregate_type
        uuid aggregate_id
        integer aggregate_version
        jsonb payload
        uuid correlation_id
        timestamptz occurred_at
        timestamptz available_at
        timestamptz published_at
        integer attempts
        timestamptz locked_until
        varchar(100) last_error_code
        text dedupe_key
        text job_state
        timestamptz job_started_at
        timestamptz job_completed_at
        timestamptz job_lease_until
        varchar(100) job_error_code
    }
    consumer_receipt {
        varchar(100) consumer_name PK
        uuid event_id PK, FK
        timestamptz processed_at
    }
    idempotency_record {
        uuid principal_id PK, FK
        varchar(150) operation PK
        varchar(128) idempotency_key PK
        char(64) request_sha256
        integer response_status
        jsonb response_body
        timestamptz created_at
        timestamptz expires_at
    }
    principal {
        uuid id PK
    }
    review {
        uuid id PK
    }
    principal ||..o{ notification : recipient_id
    review |o..o{ notification : review_id
    outbox_event ||..o{ notification : source_event_id
    principal |o..o{ audit_event : actor_id
    outbox_event ||--o{ consumer_receipt : event_id
    principal ||--o{ idempotency_record : principal_id
~~~

#### Table: notification (NEW)

Persisted in-app recipient notification; external channels deferred.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| recipient_id | uuid | No | — | FK:principal.id |
| review_id | uuid | Yes | NULL | FK:review.id; optional deep link |
| kind | text | No | — | CHECK assignment/evidence/deadline/decision/configuration/content |
| title | varchar(200) | No | — | Sanitized summary |
| message | varchar(2000) | No | — | Minimized, no confidential evidence text |
| source_event_id | uuid | No | — | FK:outbox_event.id |
| created_at | timestamptz | No | now() | UTC |
| read_at | timestamptz | Yes | NULL | Recipient only |

**Constraints, indexes and lifecycle:** UQ(recipient_id,source_event_id,kind); index(recipient_id,read_at,created_at,id). Recheck current record visibility before serializing deep link or protected text; hide/redact on access loss. Mark-all-read bounded by supplied server cutoff. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: audit_event (NEW)

Append-only security and business history; not a substitute for relational state.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| actor_id | uuid | Yes | NULL | FK:principal.id; NULL for service/pre-auth denial |
| actor_kind | text | No | — | CHECK human/service/anonymous |
| service_name | varchar(100) | Yes | NULL | Required actor_kind service |
| action | varchar(150) | No | — | Versioned action name |
| aggregate_type | varchar(100) | No | — | Allowlisted domain type |
| aggregate_id | uuid | Yes | NULL | Historical reference, intentionally not polymorphic FK |
| outcome | text | No | — | CHECK success/denied/failure |
| details | jsonb | No | '{}'::jsonb | Allowlisted before/after metadata, never tokens/raw documents |
| correlation_id | uuid | No | — | Trusted request/job ID |
| occurred_at | timestamptz | No | now() | UTC |

**Constraints, indexes and lifecycle:** Indexes(aggregate_type,aggregate_id,occurred_at,id), (actor_id,occurred_at), correlation_id. App DB role INSERT/SELECT only; triggers reject UPDATE/DELETE. Dedicated restricted retention role only. Export signed/checksummed batches to immutable storage if compliance requires; do not claim database append-only survives privileged DBA tampering. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: outbox_event (NEW)

Durable transactionally recorded event and publication/retry state.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| id | uuid | No | gen_random_uuid() | PK |
| event_type | varchar(150) | No | — | Versioned allowlisted name |
| aggregate_type | varchar(100) | No | — | Domain type |
| aggregate_id | uuid | No | — | Historical routing key; intentionally no polymorphic FK |
| aggregate_version | integer | No | — | Positive |
| payload | jsonb | No | — | Contract-validated minimized event |
| correlation_id | uuid | No | — | Request/job correlation |
| occurred_at | timestamptz | No | now() | UTC |
| available_at | timestamptz | No | now() | Backoff scheduling |
| published_at | timestamptz | Yes | NULL | Set only after acknowledged send |
| attempts | integer | No | 0 | Nonnegative |
| locked_until | timestamptz | Yes | NULL | Lease for dispatcher |
| last_error_code | varchar(100) | Yes | NULL | Redacted dispatcher category only |
| dedupe_key | text | Yes | NULL | Producer semantic deduplication key, e.g. stage/SLA/time window |
| job_state | text | Yes | NULL | CHECK queued/running/succeeded/failed; single-consumer command events only |
| job_started_at | timestamptz | Yes | NULL | First processing start |
| job_completed_at | timestamptz | Yes | NULL | Required for succeeded/failed jobs |
| job_lease_until | timestamptz | Yes | NULL | Processing lease, distinct from dispatch locked_until |
| job_error_code | varchar(100) | Yes | NULL | Sanitized processing failure category |

**Constraints, indexes and lifecycle:** Index(available_at,occurred_at) where published_at null; partial UQ(dedupe_key) where nonnull; index(job_state,job_lease_until) for command recovery. CHECK terminal job state iff job_completed_at is nonnull; job fields all null for fan-out events. SKIP LOCKED lease, bounded retries, alert/replay. Payload immutable. Retain rows while referenced by notifications/receipts, then prune in dependency order under retention policy. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: consumer_receipt (NEW)

Deduplication record for each event consumer.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| consumer_name | varchar(100) | No | — | PK(part) |
| event_id | uuid | No | — | PK(part); FK:outbox_event.id |
| processed_at | timestamptz | No | now() | UTC |

**Constraints, indexes and lifecycle:** PK(consumer_name,event_id); index processed_at. Receipt plus side effects in one DB transaction. Retain >= queue redrive/replay horizon; never prune early enough to duplicate side effects. All FK update/delete actions and implicit FK indexes follow section 4.1.

#### Table: idempotency_record (NEW)

Request replay protection for authenticated writes.

| Field | PostgreSQL type | Nullable | Default | Keys / validation / meaning |
\|---\|---\|---\|---\|---\|
| principal_id | uuid | No | — | PK(part); FK:principal.id |
| operation | varchar(150) | No | — | PK(part); method + route + resource scope |
| idempotency_key | varchar(128) | No | — | PK(part); client random UUID |
| request_sha256 | char(64) | No | — | Canonical method/path/body hash |
| response_status | integer | No | — | Successful committed response HTTP status |
| response_body | jsonb | No | — | Minimized public DTO, no tokens/URLs/secrets |
| created_at | timestamptz | No | now() | UTC |
| expires_at | timestamptz | No | — | 24-hour default |

**Constraints, indexes and lifecycle:** PK(principal_id,operation,idempotency_key); index expires_at. Serialize contenders using transaction advisory lock derived from full key then check/insert; never commit an incomplete response row. Recheck current auth on replay, mismatch hash ->409. Expiration is advertised; unique domain constraints still prevent duplicate submissions/decisions afterward. All FK update/delete actions and implicit FK indexes follow section 4.1.


### 4.11. Migration ledger (NEW, operational metadata)

`schema_migration` is the 38th table, maintained only by the migration entrypoint.

~~~mermaid
erDiagram
    schema_migration {
        varchar(100) migration_id PK
        char(64) checksum
        timestamptz applied_at
        varchar(100) release_id
    }
~~~

| Field | PostgreSQL type | Nullable | Default | Keys / meaning |
\|---\|---\|---\|---\|---\|
| migration_id | varchar(100) | No | — | PK; ordered migration filename |
| checksum | char(64) | No | — | SHA256 of immutable migration contents |
| applied_at | timestamptz | No | now() | Successful migration transaction timestamp |
| release_id | varchar(100) | No | — | Commit/image release identifier |

No FKs; PK is the only index. No ordinary UPDATE/DELETE. Runner holds a PostgreSQL advisory lock, validates applied checksums, runs each transactional migration, and records success in the same transaction. Nontransactional index migrations need explicit resume checks.

### 4.12. Migration order and compatibility

| File (P02 sole owner) | Tables / work | Completion check |
\|---\|---\|---\|
| 0001_identity.sql | Ledger bootstrap; principal, principal_membership, login_transaction, web_session, audit_team, audit_team_member, audit_team_lead | Three-role CHECK, composite member FK, one lead/team |
| 0002_governance.sql | governance_version, registry_field, registry_option, workflow_stage, workbook_template | Version/profile uniques; publication immutability |
| 0003_registry.sql | ai_system, registry_value, registry_share, registry_revision; registry_number_seq | Core field/type/option and share constraints |
| 0004_reviews.sql | review, review_submission, stage_run, review_assignment, evidence_request, evidence_submission, finding, decision, decision_condition; review_number_seq | State and active-row uniqueness; snapshot/decision immutability; leave forward-reference FK installation to 0007 |
| 0005_artifacts_content.sql | content_item, content_revision, content_audience, artifact, artifact_version, evidence_attachment, content_attachment | Exclusive artifact parent, bytes/publication immutability, attachment context |
| 0006_delivery.sql | outbox_event, notification, consumer_receipt, audit_event, idempotency_record | Audit privileges, deduplication and outbox indexes |
| 0007_constraints.sql | Late cyclic FKs review.current_submission_id, evidence_request.accepted_submission_id, artifact-version references in review/submission/stage/request/decision; deferred context triggers and grants | Every FK validated; dictionary/schema-dump parity; negative constraint tests |

Do not serve an intermediate schema without the late constraints. Production bootstrap is an idempotent command **after first authorized Admin login**, creating a default team and configuration drafts with that real actor. Publish only business-approved configuration and manifests. No synthetic principal is a production seed. Automated review updates set updated_by=NULL only for service actions with an identified service audit event; human updates always set their actor.

Initial Registry core keys: name/brief/techOwner/businessOwner/lifecycle. All five become reserved, unlike the prototype which only marks name core. Stable lifecycle keys: ideation/poc/pilot/pre_production/production/retired. Standard SLA days retain 1/2/5/5/2 pending D05. Development fixtures are explicitly synthetic and absent from production.

No live data was found to backfill. If undisclosed data exists, stop migration execution long enough to inventory it; create approved source-ID -> UUID/AIR/RAI mappings, stable directory owner IDs, UTC dates, status mapping and file hashes. Dry-run counts/unresolved identities; never infer owners from names or manufacture approval/scan records.

After launch use expand/backfill/validate/contract. Registry version upgrades map stable field/option keys, retain retired values in old schema history and preserve submitted snapshots. Type changes use a new key or approved conversion. Batch backfills with resumable cursors and optimistic versions. Large indexes use explicit nontransactional concurrent-index migrations.

Rollback the app to a schema-compatible image; do not auto-run destructive down migrations. Failed transactional migrations roll back completely. Incompatible recovery uses tested PITR into a new DB, matching object versions, verification and controlled traffic switch. Never overwrite the only production copy. Restore needed encryption-key versions and invalidate restored sessions before traffic.

### 4.13. Cross-table invariants requiring explicit enforcement

Implement deferrable constraint triggers for these relational checks (plus the individual dictionary rules); application directory eligibility checks remain outside SQL:

- review.current_submission_id references a submission of the same review; stage_run definition belongs to the review's pinned workflow; decision/evidence_request stage belongs to the same review.
- All original/reviewed/evidence references point to **accepted** versions with the correct artifact purpose and same parent review. Content links point to that content item's accepted versions. Verify again on mutation; accepted is a controlled irreversible success state, not client-set data.
- Baseline is same-Registry POC and references the exact reviewed workbook of its approved decision. Eligibility uses the immutable decision outcome and all conditions resolved, so later closure does not hide a valid baseline. Reject arbitrary accepted files from another review.
- Conditional outcome requires at least one decision_condition; nonconditional outcomes have none. Every condition's finding belongs to that decision's review. Its due date and resolution pair are valid.
- Evidence acceptance pins a submission belonging to that request; acceptance fields are all present together.
- Lead references active application membership and current AD Auditor eligibility; only the membership relation can be enforced relationally. Directory checks are refreshed and audited as in section 3.
- Full conflict set includes Registry creator/current owners, every review submission author, review creator and owners in all submission snapshots. Changing ownership or resubmitting cannot erase a historical self-review conflict.

## 5. Azure/AWS deployment and independent configuration

### 5.1 Provider adapters and actual service needs

Business/domain/application modules stay identical. Choose deployment, user identity, storage, queue and secret source independently. Explicit supported baselines are Azure+Entra+Blob/Service Bus and AWS+Entra+S3/SQS. Mixed service connections need explicit credentials/network access.

| Need / interface | Azure | AWS | Local/mock |
\|---\|---\|---\|---\|
| Web/API and worker | Container Apps; separate services | ECS Fargate services, HTTPS ALB | Same image, separate entrypoints |
| PostgreSQL | Flexible Server | RDS PostgreSQL | Pinned PostgreSQL container |
| Private ObjectStore | Blob, versioning, private container | S3, versioning, Block Public Access | Filesystem fake; Azurite/S3 emulator adapter tests |
| MessageBus | Service Bus + DLQ | SQS + DLQ | In-process fake for units; isolated adapter integration |
| SecretResolver | Key Vault | Secrets Manager/KMS | Runtime-injected local test values |
| User identity/directory | Entra OIDC/Graph or approved federation | Same identity choices | Test issuer/fake directory, never production |
| Malware/WorkbookValidator | Isolated portable ClamAV/parser worker | Same worker | Synthetic scanner + real parser fixtures |
| Telemetry | OTEL collector -> Azure Monitor | OTEL collector -> CloudWatch-compatible exporter | Local collector |
| Images/network | ACR, controlled ingress and private endpoints | ECR, VPC/private endpoints/ALB | Local Docker |

Initially stream upload/download bytes through authorized API endpoints with 25/50 MiB limits, avoiding cloud credentials and persistent object URLs in browsers. This increases API bandwidth; test ingress/body timeouts and concurrency. A later signed-URL adapter needs separate acceptance of its expiry/revocation window. No user-delegation SAS is required for streamed upload.

APIM, Front Door, Event Grid, Databricks, BI and email/Teams are not mandatory to deliver current workflows. WAF/TLS/private connectivity remain provider-specific infrastructure controls.

### 5.2 Strict configuration schema

Implement discriminated validation in Backend/src/config/schema.ts. Fail startup on missing/unknown fields, inconsistent modes, invalid endpoints/IDs, placeholders or unresolved secrets. Log key names and safe provider labels only.

| Keys/object | Type and validation |
\|---\|---\|
| APP_ENV | local/test/dev/prod; fake identity/adapters allowed local/test only |
| DEPLOYMENT_PROVIDER | local/azure/aws; prod excludes local |
| PUBLIC_ORIGIN, PORT | Exact HTTPS origin outside localhost tests; positive port |
| DATABASE_URL | Secret PostgreSQL URI; TLS hostname verification for cloud; bounded pool |
| IDENTITY_PROVIDER | entra/federated_oidc/test, independent of hosting |
| IDENTITY_ISSUER, IDENTITY_CLIENT_ID, IDENTITY_CLIENT_SECRET | Trusted discovery issuer, confidential app client and runtime secret; no browser exposure |
| IDENTITY_TENANT_ID | Required Entra; not a credential synonym for AWS/direct AD FS |
| IDENTITY_GROUP_ADMIN_ID, IDENTITY_GROUP_SUBMITTER_ID, IDENTITY_GROUP_AUDITOR_ID | Three distinct immutable IDs; UUIDs for Entra |
| IDENTITY_SCOPES | Server allowlist: openid/profile/offline_access plus approved Graph scope |
| DIRECTORY_PROVIDER | entra_graph/federated_directory/test; topology-compatible |
| DIRECTORY_AUTH_MODE | client_secret/workload_identity/managed_identity for application Graph checks; delegated self checks may use BFF cache |
| DIRECTORY_TENANT_ID, DIRECTORY_CLIENT_ID, DIRECTORY_CLIENT_SECRET | Required for directory client_secret; separate from interactive/storage credentials |
| DIRECTORY_FEDERATED_TOKEN_FILE | Projected trusted OIDC assertion for directory workload identity; not AWS access keys |
| DIRECTORY_MEMBERSHIP_TTL_SECONDS | 1..300; sensitive commands force refresh |
| SESSION_ENCRYPTION_KEY, SESSION_ENCRYPTION_KEY_ID | Injected 256-bit AEAD key and version label; retain prior decrypt keys during rotation |
| SESSION_IDLE_SECONDS, SESSION_ABSOLUTE_SECONDS | Defaults 1800/28800; positive idle <= absolute |
| STORAGE_ACTIVE_PROFILE | Stable connection name for new files |
| STORAGE_PROFILES_JSON | Map name -> provider, endpoint, namespace/container/bucket, region, credentialProfile; no embedded secrets; retain historical profiles |
| MESSAGE_PROVIDER, MESSAGE_QUEUE | azure_service_bus/aws_sqs/local; matching namespace/URL/account |
| SECRET_PROVIDER | injected/azure_key_vault/aws_secrets_manager |
| SECRET_REFERENCES_JSON | Allowlisted secret key -> explicit manager resource/version, not values |
| OTEL_EXPORTER_OTLP_ENDPOINT, LOG_LEVEL | Trusted collector; redact payloads; prod debug disabled by default |
| MAX_WORKBOOK_BYTES, MAX_NEWS_FILE_BYTES, MAX_LIBRARY_FILE_BYTES | Defaults 26214400/26214400/52428800; <= tested ingress limits |
| UPLOAD_TTL_SECONDS, SCAN_TIMEOUT_SECONDS | Defaults 600/300; bounded positive |
| WORKBOOK_TEMPLATE_FAMILY | Approved manifest family; each accepted format needs a manifest |
| NOTIFICATION_CHANNELS | in_app initially; fail config if unsupported channels advertised |

A versioned nonsecret config file may map to these same objects; validate both sources identically. Governance.settings is business-policy versioning in SQL, not a container for runtime credentials.

### 5.3 Azure authentication support

| AZURE_AUTH_MODE | Required | Behavior |
\|---\|---\|---\|
| service_principal | AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET | ClientSecretCredential; invalid secret fails, no fallback |
| managed_identity | Available MI endpoint; optional AZURE_CLIENT_ID for user-assigned identity | ManagedIdentityCredential; reject client secret |
| workload_identity | AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_FEDERATED_TOKEN_FILE; configured issuer/subject/audience trust | WorkloadIdentityCredential and rotating projected token; reject client secret |
| default | Explicit local/dev allowance | DefaultAzureCredential; production rejects broad developer fallback |

Provider endpoints: Blob account URL/container, Service Bus namespace/queue, Key Vault URL if used; HTTPS and approved cloud suffixes. IDENTITY_* and DIRECTORY_* never silently alias AZURE_*.

SDKs cache/refresh acquired tokens. Client secrets need operational rotation: inject new version, recreate credential instance/redeploy, verify overlap and revoke old secret. Managed/workload identities require IaC trust and scoped resource roles.

### 5.4 AWS authentication support

| AWS_AUTH_MODE | Required | Behavior |
\|---\|---\|---\|
| chain | AWS_REGION; runtime IAM role preferred | Leave SDK credentials unspecified; use Node SDK chain (task role, workload identity, instance profile, approved local profile). No developer files in production images. |
| temporary_env | AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN | Complete temporary triple; never partial values |
| assume_role | AWS_REGION, AWS_ROLE_ARN, AWS_ROLE_SESSION_NAME; source SDK chain | Refreshing STS provider; optional AWS_EXTERNAL_ID/AWS_ROLE_DURATION_SECONDS; trust and source sts:AssumeRole both required |
| web_identity | AWS_REGION, AWS_ROLE_ARN, AWS_WEB_IDENTITY_TOKEN_FILE; optional session name | Refreshing SDK provider and projected token; issuer/audience/subject-bound trust |

Set the resolved region explicitly on clients. Require AWS_REGION in production; reject contradictory AWS_DEFAULT_REGION/profile settings. Validate resource account/region/partition against queue URL/ARN/bucket configuration. AssumeRole default 3600 seconds, validate 900..43200 and actual role limit; role chaining is limited to its supported one-hour maximum.

Reject partial access-key triples in every mode and reject env static credentials in role-only deployments. Explicit temporary_env credentials do not auto-renew; refresh injection/rolling restart before expiry, with alarms. Role/STS/web-identity credentials must remain refreshing provider functions, not a one-time object.

There is **no AWS credential equivalent to Azure tenant/client ID**. AWS uses access key/secret/session token, role ARN, STS and workload federation. Entra's IDENTITY_TENANT_ID can still authenticate users on AWS, but never authenticates S3.

### 5.5 Precedence, secrets and examples

Precedence: safe defaults < environment-specific nonsecret file < explicit environment overrides. A secret is either directly injected OR manager-resolved; both supplied is an error. Explicit mode chooses the credential provider, no cross-mode fallback. AWS chain follows documented SDK precedence internally. Load .env only in local/test.

Placeholder-only examples; fragments become fully validated examples in P04:

~~~dotenv
# AWS hosting with Entra identity and native IAM task role
APP_ENV=prod
DEPLOYMENT_PROVIDER=aws
PUBLIC_ORIGIN=https://<approved-application-host>
IDENTITY_PROVIDER=entra
IDENTITY_ISSUER=https://login.microsoftonline.com/<identity-tenant-id>/v2.0
IDENTITY_TENANT_ID=<identity-tenant-id>
IDENTITY_CLIENT_ID=<interactive-registration-id>
IDENTITY_CLIENT_SECRET=<runtime-injected-secret>
IDENTITY_GROUP_ADMIN_ID=<admin-group-object-id>
IDENTITY_GROUP_SUBMITTER_ID=<submitter-group-object-id>
IDENTITY_GROUP_AUDITOR_ID=<auditor-group-object-id>
DIRECTORY_PROVIDER=entra_graph
DIRECTORY_AUTH_MODE=client_secret
DIRECTORY_TENANT_ID=<directory-tenant-id>
DIRECTORY_CLIENT_ID=<directory-registration-id>
DIRECTORY_CLIENT_SECRET=<runtime-injected-secret>
AWS_AUTH_MODE=chain
AWS_REGION=<aws-region>
STORAGE_ACTIVE_PROFILE=primary
STORAGE_PROFILES_JSON={"primary":{"provider":"s3","bucket":"<private-bucket>","region":"<aws-region>","credentialProfile":"aws-default"}}
MESSAGE_PROVIDER=aws_sqs
MESSAGE_QUEUE=https://sqs.<aws-region>.amazonaws.com/<account-id>/<queue>
SECRET_PROVIDER=aws_secrets_manager
DATABASE_URL=<runtime-injected-postgresql-uri>
SESSION_ENCRYPTION_KEY=<runtime-injected-256-bit-key>
SESSION_ENCRYPTION_KEY_ID=<key-version>
~~~

~~~dotenv
# Azure service principal, independently configured from IDENTITY_*
DEPLOYMENT_PROVIDER=azure
AZURE_AUTH_MODE=service_principal
AZURE_CLIENT_ID=<workload-client-id>
AZURE_TENANT_ID=<workload-tenant-id>
AZURE_CLIENT_SECRET=<runtime-injected-secret>
STORAGE_ACTIVE_PROFILE=primary
STORAGE_PROFILES_JSON={"primary":{"provider":"azure_blob","accountUrl":"https://<account>.blob.core.windows.net","container":"<private-container>","credentialProfile":"azure-default"}}
MESSAGE_PROVIDER=azure_service_bus
MESSAGE_QUEUE=<namespace>.servicebus.windows.net/<queue>
SECRET_PROVIDER=azure_key_vault
AZURE_KEY_VAULT_URL=https://<vault>.vault.azure.net
~~~

~~~dotenv
# Azure workload identity alternative: omit AZURE_CLIENT_SECRET
AZURE_AUTH_MODE=workload_identity
AZURE_CLIENT_ID=<workload-client-id>
AZURE_TENANT_ID=<workload-tenant-id>
AZURE_FEDERATED_TOKEN_FILE=<mounted-rotating-token-file>
# Managed identity: AZURE_AUTH_MODE=managed_identity with optional client ID
# AWS explicitly supplied temporary credential alternative:
AWS_AUTH_MODE=temporary_env
AWS_REGION=<aws-region>
AWS_ACCESS_KEY_ID=<temporary-access-key-id>
AWS_SECRET_ACCESS_KEY=<temporary-secret-access-key>
AWS_SESSION_TOKEN=<temporary-session-token>
# AWS role alternative (omit triple if source is task role):
# AWS_AUTH_MODE=assume_role
# AWS_ROLE_ARN=arn:aws:iam::<target-account-id>:role/<role-name>
# AWS_ROLE_SESSION_NAME=<service-environment-name>
# AWS_EXTERNAL_ID=<external-id-if-required>
~~~

Runtime rejects unresolved angle-bracket placeholders. Production uses secret bindings or bootstrap workload identity to resolve references; the credential needed to open the secret manager cannot exist only inside that manager. Keep secrets out of git, frontend assets, logs, API responses and IaC outputs. Protect remote Terraform state and avoid passing secret values through Terraform; mark sensitive metadata and restrict state access.

Separate cloud accounts/subscriptions, environments, DBs, namespaces, queues, app registrations and encryption keys. Runtime API, worker and migrator get separate resource/DB permissions. No app-user role implies infrastructure IAM access.

### 5.6 IaC and portability limits

Terraform modules under infrastructure/terraform/modules/azure and /aws export a shared runtime **configuration shape**, not fictional interchangeable resources. Azure: Container Apps, ACR, PostgreSQL, private DNS/endpoints, Blob, Service Bus, Key Vault, identity bindings and monitoring. AWS: VPC/private subnets/endpoints, ALB/Fargate, ECR, RDS, S3, SQS/DLQ, Secrets Manager/KMS, task/execution roles and monitoring.

Default CI: GitHub Actions; confirm D10 before any alternative. Provider deploy workflows use federation, a shared verified image digest and one-off migration job. Do not build duplicate full GitHub/Azure DevOps pipelines.

Queue size/order/visibility, object retention/version IDs, private networking, KMS, PITR and exporters differ. Cap portable event payloads at 128 KiB, use IDs for documents, tolerate duplicate/unordered delivery and compare aggregate versions. Correctness must not depend on Service Bus sessions or SQS FIFO. Changing deployment provider does not migrate data: verified DB/object transfer, historical storage profiles, trust/network changes and tested cutover are separate work.


## 6. Frontend/API integration contracts

### 6.1 Common protocol and DTO rules

Base path `/api/v1`; same-origin browser session. JSON request/response, UTF-8, camelCase public properties and UUID resource IDs. AIR/RAI numbers are display identifiers only. Reject unknown request properties; derive creator, roles, tenant/issuer, timestamps, statuses and storage keys server-side. UUID strings, ISO-8601 UTC datetimes, YYYY-MM-DD dates, integer bytes, role/state enums and maximum lengths mirror section 4.

Success: `{data: T}`; list: `{data: T[], page: {nextCursor: string|null, limit: number}}`. GET detail includes strong ETag `"v<version>"`; resource DTOs include version. POST create 201 + Location, commands 200 with updated DTO, asynchronous upload completion 202 with status URI, successful revoke/archive/read marker 204. Errors always use application/problem+json:

~~~json
{
  "type": "https://<application-host>/problems/registry-not-ready",
  "title": "Registry record is incomplete",
  "status": 422,
  "code": "registry_not_ready",
  "detail": "Complete the listed fields before submitting.",
  "instance": "/api/v1/reviews/<review-id>/submit",
  "correlationId": "<request-uuid>",
  "errors": [
    {"path": "/businessOwnerId", "code": "required", "message": "Choose a business owner."}
  ]
}
~~~

401 missing/expired session; 403 recognized identity denied an operation or no application role; 404 absent or outside record visibility; 409 incompatible state/eligibility/idempotency-body mismatch; 412 stale If-Match; 413 oversized; 415 unsupported media; 422 schema/domain validation; 428 missing precondition; 429 with Retry-After; 503 dependency/identity authority unavailable. No SQL, stack, SDK object, credential, raw object URI or claim payload in errors.

List defaults: limit=25, max=100; directory max=20. Opaque signed cursor contains ordering tuple, expiry and normalized filter hash, bound to actor identity and authorization generation. Reauthorize every page, reject altered/expired cursor with 400 invalid_cursor. Stable ordering createdAt DESC,id DESC, or explicit allowlisted name/dueAt/updatedAt + id tiebreaker. No arbitrary SQL sort/filter. Include unread/count aggregates only after identical visibility predicates. q max 200, trim; substring search for name/display-number/organization and owner names where screen uses them; implement parameterized ILIKE, optional pg_trgm indexes after measured need. Never use client-supplied group or owner name as access filter.

Require Idempotency-Key (UUID) on JSON state-changing POST/PUT/PATCH/DELETE, except logout/CSRF rotation and naturally idempotent notification read markers. Reuse on network retries; 24-hour response retention; current authorization still required for replay. Require If-Match for existing aggregate mutations/commands; creation uses no ETag. Artifact upload/complete commands are exempt because their single-use CAS state machine and immutable object key provide concurrency control; completion still requires Idempotency-Key. Binary upload uses single-use artifact version upload state and stream checksum, not an idempotency JSON response. Concurrent attempts yield one winner, retry-safe status lookup and no duplicate bytes/events. GET health/auth redirect routes are outside this JSON pattern as specified below.

Public DTO definitions (all fields explicit; optional marked ?; nullable fields use null, not ambiguous empty strings):

| DTO | Fields |
\|---\|---\|
| PrincipalSummary | id, displayName, email? (directory picker policy only); never token/secret |
| Me | principal:{id,displayName}, roles:Role[], capabilities:string[], teamScopes:[{teamId,isSenior,capabilities}], csrfToken, sessionExpiresAt, accessStatus:allowed/denied |
| Registry | id, registryNumber:string, schemaVersionId, createdBy:PrincipalSummary, name, brief:null\|string, technicalOwner:null\|PrincipalSummary, businessOwner:null\|PrincipalSummary, lifecycle:null\|{optionId,key,label}, organizationUnit:null\|string, acquisitionMode, dataRegion:null\|string, values:{fieldKey:scalar\|{principalId}\|{optionId}}, createdAt, updatedAt, version, readiness, allowedActions:string[] |
| Readiness | ready:boolean, evaluatedSchemaVersionId, upgradeRequired:boolean, errors:[{fieldKey,code,message}], checkedAt |
| Review | id, reviewNumber, registryId, registryNumber, registryName, owners:{technical:null\|PrincipalSummary,business:null\|PrincipalSummary}, organizationUnit:null\|string, updatedAt, reviewType, state, risk, teamId, workflowVersionId:null\|uuid, currentSubmissionId:null\|uuid, baselineReviewId:null\|uuid, submittedAt:null\|datetime, dueAt:null\|datetime, closedAt:null\|datetime, currentStage:null\|Stage, progress:{completed,total,percent}, version, allowedActions |
| Stage | id, definitionId, label, kind, action, state, dueAt:null\|datetime, assignee:null\|PrincipalSummary, reviewedWorkbookVersionId:null\|uuid, version |
| ReviewDetail | all Review fields plus registrySnapshot:null\|object, submissions:SubmissionSummary[], stages:Stage[], evidenceRequests:EvidenceRequest[], findings:Finding[], decision:null\|Decision, artifactVersions:ArtifactVersion[]; long histories use paged endpoints |
| ArtifactVersion | id, artifactId, revision, purpose, fileName, expectedBytes, actualBytes:null\|integer, mediaType:null\|string, sha256:null\|string, state, templateId:null\|uuid, createdAt, validation:null\|{valid,errors:[{sheet?,cell?,code,message}],sheetCount?,controlCount?}; no storage_profile/key |
| EvidenceRequest | id, reviewId, stageRunId, question, reviewedWorkbookVersionId, state, dueAt, acceptedSubmissionId:null\|uuid, createdBy:PrincipalSummary, createdAt, version |
| EvidenceSubmission | id, requestId, responseText, artifactVersionIds:uuid[], submittedBy:PrincipalSummary, submittedAt |
| Finding | id, reviewId, controlKey:null\|string, severity, statement, status, remediation:null\|string, resolutionReason:null\|string, resolvedAt:null\|datetime, version |
| Decision | id, reviewId, stageRunId, outcome, rationale, reviewedWorkbookVersionId, signedBy:PrincipalSummary, signedAt, conditions:[{id,findingId,requirement,dueAt,resolvedAt:null\|datetime}]; authority snapshot only redacted audit projection |
| ApprovedPoc | id, reviewNumber, registryId, registryNumber, registryName, approvedAt, approvedWorkbookVersionId, validatedControlCount:null\|integer |
| SubmissionSummary | id, attempt, registrySchemaVersionId, workbookVersionId, submittedBy:PrincipalSummary, submittedAt |
| TimelineEvent | id, action, actor:null\|PrincipalSummary, serviceLabel?:string, occurredAt, summary, relatedResourceIds:object (authorized only) |
| Team | id,name,enabled,members:[{principal:PrincipalSummary,active}], lead:null\|PrincipalSummary, version |
| Content | id, revisionId, kind, title, summary, collection:null\|string, ownerLabel:null\|string, reviewDate:null\|date, externalUrl:null\|string, audiences:Role[], attachments:ArtifactVersion[], publishedAt:null\|datetime, status, version (content item), revisionVersion (content revision) |
| Notification | id,kind,title,message,reviewId:null\|uuid,createdAt,readAt:null\|datetime,allowedActions |
| Governance | id,kind,profile,revision,status,version,settings,fields:FieldDefinition[],stages:StageDefinition[],publishedAt:null\|datetime |
| FieldDefinition | id,key,label,type,required,core,help,position,options:[{id,key,label,position}] |
| StageDefinition | id,key,kind,label,description,ownerRole,action,position,slaDays,conditional |

Generate OpenAPI types into frontend/api/generated.d.ts and Backend validation types from contracts/openapi.yaml; do not maintain a third manual interface file. Use JSON Schema-compatible validators and ajv/Fastify integration chosen in P01. Runtime serializers must be tested against the same schemas.

### 6.2 Session, directory, overview and notifications

| Endpoint | Request / query | Response / permission |
\|---\|---\|---\|
| GET /auth/login (outside /api/v1) | Optional safe relative returnTo | 302 to configured issuer; creates browser-bound login transaction |
| GET /auth/callback | code,state or provider error | Validates callback then 303 safe relative page; no tokens in URL |
| POST /auth/logout | CSRF + Origin, empty body | 204 local revocation; optional configured provider logout URL flow |
| GET /me; GET /me/capabilities | None | Me or its capability subset; minimal denied profile allowed with 403 access status |
| GET /directory/users | q (min 2), eligibleRole, context=new_registry? or registryId? or teamId?, cursor, limit | PrincipalSummary[]; Submitter for new-Registry owner/person pickers when context=new_registry, or authorized existing-record pickers; Admin team picker, senior eligible assignment context; match IDs, no bulk directory export |
| GET /dashboard | scope=submitter/auditor/admin (must have role) | {registryCount,openReviewCount,actionRequiredCount,overdueCount,nextActions:[{kind,reviewId,requestId:null\|uuid,title,dueAt:null\|datetime}],byState:[{state,count}],workload?:[{teamId,assigneeId,count}],generatedAt}; workload limited to team senior/Admin; no fabricated health percentages |
| GET /notifications | unreadOnly?, cursor,limit | Recipient list; inaccessible parent notifications redacted/hidden |
| PATCH /notifications/{id}/read | {read:true} | 204; recipient only |
| POST /notifications/read-all | {through:datetime} | {data:{updatedCount}}; recipient only, server validates cutoff <= now |
| GET /notifications/unread-count | None | {data:{count}}; recipient and visibility scoped |

### 6.3 Registry, sharing and review creation

`RegistryWrite` = {schemaVersionId, name, brief?, technicalOwnerId?, businessOwnerId?, lifecycleOptionId?, organizationUnit?, acquisitionMode?, dataRegion?, values?}. Max lengths and option/user validation follow dictionary. name required even draft; remaining fields may be incomplete until readiness. PATCH omitted fields unchanged; null clears nullable value. Values keys must exist in selected schema; type-specific representations above. An explicit schema upgrade maps stable keys and preserves old values through reviewed migration/history.

| Endpoint | Request / filters | Result and permission |
\|---\|---\|---\|
| GET /registry/schema | versionId?; default active published | Governance registry schema; recognized role |
| GET /ai-systems | q, lifecycleKey?, readiness=ready/incomplete?, cursor,limit,sort | Registry summaries; role+record scope |
| POST /ai-systems | RegistryWrite | 201 Registry; Submitter |
| GET /ai-systems/{id} | None | Registry+ETag; visible role/grant |
| PATCH /ai-systems/{id} | Partial RegistryWrite + If-Match | Registry; Owner/Editor; owner-ID changes Owner only |
| GET /ai-systems/{id}/history | cursor,limit | [{id,revision,schemaVersionId,snapshot,createdBy:null,createdAt}]; createdBy is nullable PrincipalSummary; current Registry read scope |
| GET /ai-systems/{id}/readiness | None | Readiness; visible |
| GET /ai-systems/{id}/shares | None | [{recipient,permission,version,revokedAt}]; Owner only (Admin audit route for oversight) |
| PUT /ai-systems/{id}/shares/{principalId} | {permission:view/edit}; Registry If-Match | Grant DTO + new Registry ETag; Owner; target active Submitter; reason captured via operation audit |
| DELETE /ai-systems/{id}/shares/{principalId} | Registry If-Match | 204 + new ETag; Owner; revoke, never remove history |
| GET /reviews | registryId?, reviewType?, state?, risk?, assignedTo=me?, teamId?, urgent?, q, cursor,limit,sort | Review[]; submitted/global Auditor read, private draft restrictions |
| POST /reviews | {registryId,reviewType:poc/deployment,baselineReviewId?:uuid} | 201 draft Review; Owner/Editor; server chooses default team from active routing config |
| PATCH /reviews/{id} | {baselineReviewId?:uuid\|null}; If-Match | Draft only, same Registry; changing review type/system requires new draft |
| GET /reviews/{id} | None | ReviewDetail+ETag; visible |
| GET /reviews/{id}/timeline | cursor,limit | TimelineEvent[]; current visible scope |
| GET /reviews/{id}/submissions | cursor,limit | SubmissionSummary[]; same visibility |
| GET /reviews/approved-pocs | registryId required, cursor,limit | ApprovedPoc[]; Owner/Editor; same record only |
| POST /reviews/{id}/submit | {workbookVersionId,expectedRegistryVersion}; review If-Match | Updated Review; readiness/version, approved manifest, clean same-review original, baseline, conflict context checked in one transaction |

Do not create duplicate backend review records to preserve separate prototype reviews/queue arrays; those become filtered views of the same aggregate. No public generic PATCH state or arbitrary transitions endpoint. The state machine owns state changes.

### 6.4 Upload, evidence, findings, assignment and decisions

| Endpoint | Request | Result / policy |
\|---\|---\|---\|
| GET /workbook-templates | format,reviewType,acquisitionMode | {id,templateKey,revision,format,displayName}[] derived from approved manifests; active recognized user; no executable parser/internal mappings |
| POST /artifacts/upload-sessions | {artifactId?:uuid,reviewId?:uuid,contentId?:uuid,purpose,fileName,expectedBytes,mediaType,templateId?:uuid}; exactly one context | 201 {artifactId,artifactVersionId,uploadUrl,expiresAt,maxBytes}; uploadUrl is relative API byte route, never cloud credential; authorized purpose |
| PUT /artifact-versions/{id}/bytes | Binary stream, CSRF, expected Content-Length when available | 204 after counted immutable write; cap streamed bytes even absent length; creator and current parent permission |
| POST /artifact-versions/{id}/complete | Empty JSON | 202 {artifactVersionId,state,statusUrl}; server verifies stored bytes and queues scan; never accept client scan/checksum assertions |
| GET /artifact-versions/{id} | None | ArtifactVersion with real status; parent visibility |
| GET /artifacts/{id}/versions | cursor,limit | ArtifactVersion[]; parent visibility |
| GET /artifact-versions/{id}/download | None | Accepted authorized bytes, correct MIME, sanitized attachment filename, no-store/nosniff; recheck current scope |
| POST /reviews/{id}/assignments | {stageRunId,assigneeId,reason}; review If-Match | Review+assignment ID; current Senior only; target eligibility/conflict/active state |
| GET /audit-teams/{id}/eligible-assignees | reviewId,stageRunId,q?,cursor | Current eligible Auditor members; Senior/Admin picker only; no target permission from list alone |
| GET /audit-teams/{id}/assignment-queue; GET /audit-teams/{id}/workload | cursor/filter on queue | Unassigned/reassignable reviews or assignee counts; Senior/Admin read |
| PUT /reviews/{id}/stages/{stageRunId}/reviewed-workbook | {artifactVersionId}; review If-Match | Review; Assigned, clean same-review reviewed-purpose version |
| POST /reviews/{id}/business-approval | {stageRunId,outcome:approved/returned,rationale}; review If-Match | Review; current active Submitter business owner named in submitted snapshot, no Auditor assignment required; distinct from final sign-off |
| POST /reviews/{id}/classification | {risk:low/medium/high,rationale}; review If-Match | Review; assigned intake Auditor or deterministic approved routing rule worker, not Submitter-selected risk |
| POST /reviews/{id}/evidence-requests | {stageRunId,question,reviewedWorkbookVersionId}; review If-Match | 201 EvidenceRequest + new Review ETag; Assigned; creates waiting assessment |
| GET /evidence-requests/{id}/submissions | cursor,limit | EvidenceSubmission[]; parent visibility |
| POST /evidence-requests/{id}/submissions | {responseText,artifactVersionIds:uuid[]}; request If-Match | 201 EvidenceSubmission + request ETag; Owner/Editor; max 10 files, all accepted same-review evidence |
| POST /evidence-requests/{id}/accept | {submissionId}; request If-Match | EvidenceRequest; assigned assessment Auditor; exact matching response |
| POST /evidence-requests/{id}/reopen | {submissionId,reason}; request If-Match | EvidenceRequest; assigned Auditor; clear current acceptance, audit old response/acceptance |
| POST /reviews/{id}/findings | {controlKey?,severity,statement}; review If-Match | 201 Finding; Assigned |
| PATCH /findings/{id} | {remediation} OR {status:resolved/waived,resolutionReason}; finding If-Match | Finding; Owner/Editor proposes, Assigned authorized Auditor verifies/waives; never arbitrary status |
| POST /reviews/{id}/decisions | {stageRunId,outcome,rationale,reviewedWorkbookVersionId,conditions?:[{findingId,requirement,dueAt}]}; review If-Match | 201 Decision + Review ETag; Assigned DECIDE-authorized Auditor, required rules in section 7 |
| POST /decision-conditions/{id}/resolve | {resolutionReason}; review If-Match | Decision condition and Review; still assigned monitoring Auditor; verifies linked finding, may close review |

Original/reviewed upload requires templateId or server-selects the single active applicable family/format manifest; ambiguous/no match returns 422 template_selection_required/no_approved_template. The server validates provided template against review type/acquisition mode. GET /workbook-templates provides selection metadata; displayName derives from manifest's validated label.

Workbook purposes allow .xlsx/.xls/.csv <=25 MiB with format-specific manifests. News allows PNG/JPEG/WEBP/PDF/DOC/DOCX/PPT/PPTX/XLS/XLSX <=25 MiB each, <=10 default. Library allows PDF/Office/CSV/TXT/MD/ZIP <=50 MiB, one file; external HTTPS link may accompany it. Evidence default same document allowlist as Library except ZIP, <=25 MiB; confirm D07. Validate extension, signature, MIME, size, archive entry count/uncompressed ratio/path traversal, parser resource/time limits and malware. Reject encrypted/uninspectable workbooks, executable/macro-bearing packages and unsupported formats with actionable errors; no automatic XLS->XLSX conversion. Isolate parsers with CPU/memory/time caps, no network, no formula execution. Accepted objects remain immutable; cleanup abandoned/failed uploads only after upload TTL and safe retries.

### 6.5 Admin governance, teams, content and audit

`WorkflowSettings` strict schema: {routing:{mode:manual/balanced/round_robin,defaultTeamId,fallback:unassigned}, timeline:{calendar:elapsed_days,timeZone:<IANA>,atRiskPercent:80,overdueReminderHours:24}, notifications:{inApp:true,digestEnabled:false}}. Initial implementation uses elapsed days; business-day calendar/digest schedule is D05, not an unimplemented working toggle. Balanced mode chooses eligible member with fewest active assignments, stable principal-ID tiebreak; round-robin selects next after last routing assignment under team row lock. Both honor conflict rules and do not confer human assignment permissions. If no eligible member, leave unassigned and notify Senior/Admin.

`FieldInput` = {key,label,type,required,core,help,position,options:[{key,label,position}]}. Stable keys immutable; IDs allocated on new version. `StageInput` = {key,kind,label,description,ownerRole,action,position,slaDays,conditional}. Labels may change, hard security/state invariants may not. UI modal's REVIEW action is reconciled to typed kinds (not a hidden extra permission).

| Endpoint | Request | Result / permission |
\|---\|---\|---\|
| POST /admin/bootstrap | {defaultTeamName}; only uninitialized installation | 201 {teamId,registryDraftId,workflowDraftId}; authorized Admin, advisory lock; replay safe; no fake data |
| GET /admin/governance/versions | kind,profile,status?,cursor | Governance[]; Admin |
| POST /admin/governance/versions | {kind,profile,baseVersionId?} | 201 draft Governance; Admin; one draft/profile |
| PUT /admin/governance/versions/{id} | {fields,settings} for registry OR {stages,settings} for workflow; If-Match | Draft Governance; Admin; validate core fields/types/options/order/rights |
| POST /admin/governance/versions/{id}/publish | {reason}; If-Match | Published Governance; Admin; validate complete graph; atomic supersession |
| POST /admin/governance/versions/{id}/clone | {reason} | New draft of old immutable version; rollback via new publish, never mutate historical version |
| GET /admin/directory-groups | None | Exactly [{role,groupId,displayName?,lastCheckedAt,status,memberCount?:number}]; Admin; no fabricated counts |
| POST /admin/directory-groups/sync | Empty body, rate-limited | 202 {operationId}; Admin; outbox event/job, status through GET /admin/operations/{id} |
| GET /admin/operations/{id} | None | {id,state:queued/running/succeeded/failed,lastErrorCode?}; projection from outbox/receipt + live worker status; Admin; no claim that publishedAt means completed |
| POST /admin/audit-teams | {name} | 201 Team; Admin |
| GET /admin/audit-teams | cursor,limit | Team[]; Admin |
| PUT /admin/audit-teams/{teamId}/members/{principalId} | {active:true}; team If-Match | Team; Admin; current Auditor |
| DELETE /admin/audit-teams/{teamId}/members/{principalId} | {reason}; team If-Match | Team; Admin; remove lead if affected, flag orphaned work |
| PUT /admin/audit-teams/{teamId}/lead | {principalId,reason}; team If-Match | Team; Admin; eligible active member, atomic replacement |
| DELETE /admin/audit-teams/{teamId}/lead | {reason}; team If-Match | Team; Admin; clear designation and derived authority |
| GET /content | kind,collection?,q,cursor,limit | Published Content[] matching role audience; server sort latest publish |
| GET /content/{id} | None | Current published Content; authorized audience (Admin can use revision route) |
| GET /admin/content | kind,status?,q,cursor | Content[] including drafts; Admin |
| GET /admin/content/{id}/revisions | cursor,limit | Content[] for all revisions; Admin |
| GET /admin/content/{id}/revisions/{revisionId} | None | Content + ETag based on revisionVersion; Admin; verifies parent/child match |
| POST /admin/content | {kind,title,summary?,collection?,ownerLabel?,reviewDate?,externalUrl?,audiences:Role[]} | 201 draft Content; Admin |
| POST /admin/content/{id}/revisions | {baseRevisionId} | 201 cloned draft Content; Admin |
| PATCH /admin/content/{id}/revisions/{revisionId} | Partial editable fields above + attachmentVersionIds; revision If-Match | Draft Content; Admin; validate IDs/context |
| POST /admin/content/{id}/revisions/{revisionId}/publish | {reason}; revision If-Match | Published Content; Admin; clean files/URL/audience, atomic previous supersession |
| POST /admin/content/{id}/archive | {reason}; content-item If-Match | 204; Admin |
| GET /reviews/{id}/audit | cursor,limit | Redacted TimelineEvent[]; visible review scope |
| GET /admin/audit-events | action?,actorId?,from?,to?,cursor | Redacted audit DTO {id,action,actor,occurredAt,aggregateType,aggregateId,outcome,correlationId}; Admin |

Content GET/list uses content-item version for current-item operations; Admin revision GET returns revision ETag for draft edits/publish. Publication increments both revision and content-item versions in the same transaction. Admin archive uses content-item ETag.

For admin operation status, use explicit durable processing state on outbox_event (defined in sections 4.10 and 7.4) so status survives process restart; do not infer running/succeeded from queue publication alone. No directory membership mutation endpoint. No scheduled News publication is promised until a scheduling field/worker is explicitly designed.

External content links allow HTTPS only, reject embedded credentials/control characters and javascript/data/file schemes; backend never fetches arbitrary URLs. Open a normal external link with noopener/noreferrer after permission check. News image previews must use authenticated clean-file streaming with safe MIME; HTML/SVG/script content is never rendered inline. User strings use textContent/escaped templates; audit innerHTML interpolation paths in app.js before loading untrusted API data.

**Exact content-version authorization:** for non-Admin users, artifact detail/version-list/download access requires the exact version to be linked by content_attachment to the current published, unarchived, audience-authorized content revision. Content-parent visibility alone is insufficient. Filter version lists and return 404 for draft/superseded/unlinked versions even when the content item is visible. Admin may inspect authorized drafts/history. Review artifact access follows its own review visibility/purpose rules. Regression tests must guess draft/replaced version IDs directly.

### 6.6 Exact frontend integration work and acceptance

| Existing path / workflow | Required change | Acceptance |
\|---\|---\|---\|
| index.html role menu; app.js switchRole/initialParams | Bootstrap /me before workspace; allow actual role subset, keep safe page/adminTab deep links; map frontend user label to Submitter | Changing query/CSS cannot grant Admin/Auditor; no-role/expired session shows correct screen |
| app.js visibleRegistryEntries/renderRegistry/form generation | Replace arrays/people names with paged API/schema/UUID pickers; preserve dropdowns; add share view/edit and acquisition mode; capability-gate Admin edit away | Owner creates incomplete draft, readiness explains missing values; Editor edits but cannot share/transfer owner; Viewer reads only |
| app.js submission modal and approvedPoc flows | Create draft, upload bytes, poll status with abort/backoff, select same-system baseline, submit using versions; reuse server artifact on reopen | Submission blocked until accepted; refresh preserves draft; no fake timer/control count |
| app.js review drawer/evidence button | Fetch details/timeline; evidence response keeps request ID; persistent returned-workbook state | Response appears on same review; reopening does not erase server upload/decision gate |
| app.js auditor queue/signOffReview | Server filters/risk/SLA, assignment controls only for Senior, real outcome/rationale/conditions form, immutable decisions | All Auditors read all Registry/submitted reviews; only assigned eligible Auditor mutates; completed reviews remain searchable |
| index.html business-owner stage controls | Add compact approve/return action for submitted business owner under same drawer styling | Business approval advances/returns; cannot perform final independent sign-off |
| app.js admin publish/routing/forms | Draft APIs; dirty/saved/publishing/error states; published read state distinct; remove unsupported calendar/digest controls or label as unavailable pending decision | New publication affects new reviews only; draft does not leak; bad reorder/right rejected with field errors |
| app.js directoryGroups/openAdminModal | Three status rows, remove arbitrary role/Viewer map; team member/senior editor | Exactly three role maps; lead replacement revokes previous assign control immediately |
| app.js News/Library preview and edits | Draft revision APIs, real file upload/download, full dates, role audiences; clickable safe external URLs/deep links | Published readers never see draft changes; attachment permissions match content; no simulated download/copy actions |
| app.js dashboards/notifications/register | Replace fake values with scoped queries; mark-read API; show unavailable metrics honestly | Persistence across reload; counts/list scope agree; no cross-user notifications |
| styles.css and all renderers | Reuse design; add skeleton/loading, empty/filter-empty, retry, 403/404, session expiry, upload pending/rejected and 412 conflict states | Keyboard/focus restoration maintained; layouts checked at 1440/820/390px against existing screenshots |

Use AbortController for stale search/navigation requests; debounce search; do not render old request results over a newer screen. Disable duplicate submission while in flight but rely on server idempotency. Do not automatically retry non-idempotent commands with a new key. For 412 preserve entered values and offer reload/compare; for 401 reauthenticate, for 403 explain access, for 404 avoid leaking existence, for 503 show retryable dependency state. A frontend action may be hidden/disabled by capabilities, but server still authorizes every call.


### 6.7 Manifest administration and concrete validation format

P00 supplies business-approved cell/column mappings; P06 implements the following fixed manifest envelope. Do not infer requiredness from Excel formatting or execute spreadsheet expressions.

`WorkbookManifest` = {schemaVersion:1, label:string, applicability:{reviewTypes:(poc|deployment)[], acquisitionModes:(build|procure)[]}, signature:{requiredSheets:string[], anchors:[{sheet,cell,expectedText}]}, fields:[{key,source:{sheet?:string,cell?:string,column?:string},dataType:text|date|yes_no_na|number,allowedValues?:string[],requiredWhen:{reviewTypes:(poc|deployment)[],acquisitionModes:(build|procure)[]}}], limits:{maxRows:integer,maxColumns:integer,maxArchiveEntries:integer,maxUncompressedBytes:integer,maxCompressionRatio:number}}. Use strict JSON Schema with additionalProperties=false. XLSX/XLS use sheet/cell; CSV uses named column and no sheet requirement. Empty requiredWhen sets mean never required; matching both nonempty sets makes the field required. Limits are bounded by stricter global security limits, not allowed to raise them.

Stable field keys and manifest SHA256 are retained with each accepted upload. Use explicit version/signature selection; an unknown template cannot fall through to an “any spreadsheet” parser. Label and validation errors are plain text. P00 must approve concrete source anchors/required fields for each accepted format; the reconstructed workbook is evidence for the candidate, not an automatically approved manifest.

| Endpoint | Request | Result / authorization |
|---|---|---|
| GET /admin/workbook-templates | templateKey?,format?,cursor,limit | [{id,templateKey,revision,format,manifestSha256,active,approvedAt:null,manifest}]; Admin; approvedAt is nullable datetime |
| POST /admin/workbook-templates | {templateKey,format,manifest:WorkbookManifest} | 201 template DTO; Admin; server allocates revision under lock; immutable manifest body |
| POST /admin/workbook-templates/{id}/approve | {manifestSha256,reason} + Idempotency-Key | Updated template DTO; Admin; locked compare-and-set from unapproved, validates approved business evidence recorded by P00 and supersedes prior active family/format |
| GET /admin/workbook-templates/{id} | None | Template DTO with exact manifest/hash; Admin |

Manifest approval is an explicit If-Match exception: immutable manifestSha256 plus locked unapproved-state compare-and-set is the precondition. It cannot approve a changed body. Existing manifests are not patched; create a new revision. Production bootstrap can install **draft** manifest definitions, but only this authorized command activates an approved manifest. Add these handlers under governance routes/services, with P09 owning administration and P06 owning validation; contract/schema changes still go through main/P02.

## 7. Domain workflows and transactional behavior

### 7.1 Review transition contract

~~~mermaid
stateDiagram-v2
    [*] --> draft
    draft --> submitted: ready Registry and accepted original
    returned --> submitted: new immutable submission attempt
    submitted --> in_review: intake assignment
    in_review --> returned: business owner returns with rationale
    in_review --> evidence_requested: assigned auditor asks
    evidence_requested --> in_review: all responses accepted
    in_review --> approved: independent decision
    in_review --> approved_with_conditions: decision and linked conditions
    in_review --> rejected: independent decision
    approved_with_conditions --> closed: every condition verified
~~~

Approved/rejected are terminal with closed_at set; they remain searchable. Closed is the completed conditional case with its original decision retained. Baseline eligibility uses immutable outcome plus resolved conditions, not status text alone. No generic client status mutation.

| Trigger | Required checks | Atomic effects |
\|---\|---\|---\|
| Submit/resubmit | Owner/Editor, expected Registry version, active schema readiness, known build/procure mode, accepted original and supported manifest, baseline same Registry and eligible, no conflicting active review | Insert review_submission snapshot/attempt, pin workflow on first submit, update current pointer, create intake stage attempt, audit/outbox/idempotency. First submit actor/time and workflow/baseline remain immutable. |
| Intake classification | Assigned eligible Auditor, TRIAGE action, risk/rationale valid | Persist risk, complete intake, enter business stage. Initial profile Standard unless approved manifest/routing rules at D05 select another before first submit; never silently switch an in-flight workflow on later risk changes. |
| Business approval/return | Actor currently Submitter and is business owner in current immutable submission snapshot; ownership mismatch requires return/resubmit or audited approved correction | Approve completes business stage and enters assessment; return records rationale and returns to submitter. This is business accountability approval, intentionally not independent final audit sign-off. |
| Assessment assignment | Senior of team, target eligible/no conflict; or configured routing worker using same target checks | Close old assignment, insert new, bump review, audit, notify; prior assignee loses mutation authority. |
| Reviewed workbook | Assigned assessment/decision Auditor, same-review reviewed-purpose accepted artifact | Pin exact version to stage; reopening drawer reloads it. Do not use latest file name or local upload state as authority. |
| Evidence request | Assigned assessment Auditor, clean reviewed version and question | Insert request; assessment becomes waiting and review evidence_requested; notify Owner/Editors. **Do not create a second active evidence stage.** |
| Evidence response | Owner/Editor, request open, text and accepted same-review files | Insert immutable submission+links; request responded, review still waits for auditor acceptance. Notification alone does not advance stage. |
| Accept/reopen response | Assigned assessment Auditor; submission belongs to request | Pin accepted response or reopen with reason; if all requests accepted/cancelled resume assessment/in_review. Keep response history. |
| Complete assessment | Assigned ASSESS Auditor; accepted reviewed file, no open/responded requests; high/critical findings must be resolved/waived or explicitly proposed for conditional decision | Complete assessment; create completed/skipped evidence-summary run for display if applicable (never active/waiting simultaneously), enter decision and route/assign independently. |
| Final decision | Assigned DECIDE Auditor, fresh eligibility, no current/historical conflict, rationale, accepted reviewed file, all evidence accepted/cancelled | Insert immutable decision (+condition rows when conditional), audit/outbox/idempotency. Approved/rejected completes stage/assignment and sets closed_at. Conditional leaves decision stage waiting with active assignment for monitoring. |
| Verify condition | Current assigned decision-stage Auditor, no conflict; linked finding verified resolved/waived under policy | Record condition resolution and audit; when all resolved, complete stage/assignment and close review. Senior may reassign monitoring stage using normal checks. |

Additional route completing the endpoint catalogue: `POST /api/v1/reviews/{id}/stages/{stageRunId}/complete`, body `{rationale:string}`, review If-Match and Idempotency-Key; only active assessment/ASSESS stage is accepted, returns Review. It cannot bypass intake, business approval, evidence acceptance or final decision. The business-approval route in section 6 is the sole exception to “auditor-only approval” because it does not confer independent audit sign-off.

SLA defaults: elapsed UTC days, no weekend/holiday exclusion, no automatic clock pause during evidence wait. Evidence has its own due_at from conditional stage SLA; review.due_at is the earliest actionable active-stage/open-request deadline. At-risk at 80% elapsed; one initial overdue event then at most one reminder per 24 hours. Use deterministic event deduplication keys in producer transactions (see 7.4). Progress = completed required stages / required stage count; conditional evidence stage included only when used. Return/resubmit can reduce progress; explain this rather than artificially preserving a percentage. Business-day calendar, digest timezone and expedited/high-risk selection require D05; inactive options must not pretend to be enabled.

Publish-time stage mapping: intake/Auditor/TRIAGE; business/Submitter/APPROVE; assessment/Auditor/ASSESS; evidence/Submitter/RESPOND conditional; decision/Auditor/DECIDE. Fixed permitted partial order in first release: intake -> business -> assessment -> decision, evidence branches within assessment. Drag/reorder is retained but invalid order gets validation feedback; arbitrary workflow scripting is outside scope. Existing Owner group labels become these role/record-resolver descriptions, not additional AD groups.

### 7.2 File lifecycle and security boundary

1. Authorize parent and purpose before creating artifact/version. Pending rows expire; caller cannot supply object key or approved state.
2. Byte endpoint atomically claims pending upload; stream to unique private key with byte counter/hash. If interrupted, leave retryable failed/expired state or a fresh version; never treat partial bytes as uploaded. A safe implementation uses a per-version DB advisory lock across stream plus storage conditional create and reconciler, with transaction duration bounded; do not hold an unbounded row transaction across network I/O.
3. Complete verifies object metadata/server count and emits artifact.scan_requested in a SQL transaction; duplicate completion returns same status.
4. Worker receives ID, obtains isolated file, sniffs MIME, scans malware, validates package limits then parses approved manifest. It records actual metadata, scanner/parser versions and errors; no network/formula execution.
5. Accepted requires every check. Unavailable scanner/unknown manifest remains unavailable/rejected with retryable reason, never “clean by timeout.” Consumers cannot download pending/rejected versions; public bucket access is disabled independently.
6. Finalization/link/decision rechecks accepted version and exact parent context. File bytes and checksum are immutable. Scan retry races cannot demote an already referenced accepted object; threat recall requires a separate blocked-download incident procedure and audited access block, not silent byte mutation.
7. Streaming download authorizes at request start, uses no-store and audits sensitive access. Revocation stops subsequent requests; an already streaming response cannot be magically recalled. Range downloads, if enabled, repeat authorization and correct content-length/range validation.

### 7.3 Configuration/content publication

Versioned configuration, content revisions and workbook manifests have separate publication transactions. Save draft never changes reader views. Publish obtains parent/profile lock, validates children and permissions, supersedes old published version, activates new version and records event/audit. Retries are idempotent. Existing review workflow/submission/workbook references stay pinned. Rollback means clone previous content/configuration into a new draft and publish a new revision with reason, not rewriting history.

News draft and Library draft are not affected by the global workflow Publish button. UI must label these independent actions clearly using existing components. Preview is visibly a draft for Admin; ordinary viewers read published only. Audience “All” stores all three role rows. R&D/Commercial are display metadata until a separately approved business-audience design exists; do not equate them with permissions.

### 7.4 Outbox, job state, timers and notifications

The outbox dictionary/diagram includes these explicit operational fields: `dedupe_key text nullable unique when nonnull`, `job_state text nullable` (queued/running/succeeded/failed), `job_started_at timestamptz nullable`, `job_completed_at timestamptz nullable`, `job_lease_until timestamptz nullable`, `job_error_code varchar(100) nullable`. All default NULL. Job fields are set only for single-consumer command events such as directory.sync_requested; ordinary fan-out events leave them NULL. Dispatch lease locked_until and processing lease job_lease_until are different.

Admin operationId is the command event UUID. Directory worker updates job state under lease; completion/failure persists independently of queue publication. A restarted worker can resume expired processing lease; a failed job requires explicit admin retry using a new deduplicated command and audit. Never report publishedAt as completed.

Event envelope: `{eventId,eventType,occurredAt,aggregateType,aggregateId,aggregateVersion,actorId?:uuid,serviceName?:string,correlationId,payload}`; event type includes .v1 suffix. Payload contains necessary IDs/minimized metadata, not document text, credentials or full Registry snapshot. Initial types: registry.changed, review.submitted, review.assigned, review.stage_changed, evidence.requested, evidence.submitted, decision.recorded, artifact.scan_requested, artifact.accepted, content.published, governance.published, directory.sync_requested, review.sla_at_risk, review.overdue (all versioned).

Timer dedupe keys such as stage:{id}:attempt:{n}:risk80 and stage:{id}:overdue:{utc-date} use partial UNIQUE(dedupe_key). Lock stage/review, check current state, insert outbox key and update due projection in one transaction. Two worker replicas must not double-notify. Recipient notification uniqueness and consumer receipt add separate downstream protection.

Dispatcher leases with SKIP LOCKED, sends, then marks published; crash after send may duplicate. Consumers commit receipt+effects together, acknowledge only after commit. Poison message retries have bounded attempts/backoff and DLQ; stale aggregate events cannot roll state backward. In-app notification recipient selection resolves current eligibility/access, not prototype role-wide broadcast. External notifications remain disabled until implemented.

## 8. Ordered implementation and sub-agent execution plan

### 8.1 Ownership and parallelism rules

The **main agent owns plan.md, contracts/** (including OpenAPI/event/config schemas), root package.json/lockfile, composition/entrypoints, API error conventions and all integration merges. The **schema agent alone owns Backend/database/** and generated DB types; no other agent creates/renumbers/edits migrations. Agents needing schema/contract changes submit a proposed delta to the owner and wait for its approved version before dependent edits.

Freeze contract version 0.1, table names/keys, DTOs, state transitions, three-group policy and port signatures at P01. Do not spawn implementation workers before this barrier. Spawn only bounded work with inputs/files/tests below, at most three child workers alongside main; one writer per file. Main integrates small reviewed changes, regenerates shared outputs, resolves conflicts, updates this plan and runs cross-cutting checks.

Parallel windows:
- After P01: P02 schema, P03 identity/authorization, P04A Azure adapters can run independently using repository interfaces/fakes. Main implements foundation/contract harness. Wait for P02 before repository-backed integration.
- Next: P04B AWS adapters and P04C common workers may run in separate owned directories; P05 Registry begins after P02/P03/P04 port acceptance.
- P06 files, P09 content and provider IaC can proceed alongside independent UI modules once their contracts are frozen. P07 lifecycle depends on files/Registry; P08 auditing depends on P07, so execute that chain sequentially.
- UI workflow modules may be delegated, but only main changes app.js/index.html/styles.css. Agents return integration hooks and patch proposals for those shared files.
- Independent reviewers are read-only. They may identify missing contract/schema work but do not edit another owner's files.

If sub-agents are unavailable, main follows the same dependency graph sequentially, retaining ownership boundaries and verification gates. Do not create separate user tasks for these implementation subtasks.

### 8.2 Task index and dependencies

| Task | Main/delegate | Depends on | Deliverable and completion gate |
\|---\|---\|---\|---\|
| P00 Decision register and approved workbook contract | Main | None | Resolve production blockers D01/D02/D05/D07; proposed defaults explicitly accepted or recorded as nonproduction-only |
| P01 Contracts, ports and foundation | Main | P00 | Pinned workspace, OpenAPI/JSON/event/config schemas, skeleton, fixture/validation harness; shared contract freeze |
| P02 Schema, migrations and repositories | Delegate schema owner | P01 | All 38 tables/constraints, seeds/bootstrap transaction and migration tests pass |
| P03 Identity and authorization | Delegate identity owner | P01; integrate after P02 | Login/session/directory/policy tests pass, exact three groups enforced |
| P04A Azure adapters | Delegate Azure owner | P01 | Azure mode/config/storage/queue/secret adapter contract suite |
| P04B AWS adapters | Delegate AWS owner | P01 | AWS role/temp/federation/region and adapter suite |
| P04C Workers and transactional delivery | Main | P02,P04A/P04B interfaces | Outbox/idempotency/receipt/job-state/SLA infrastructure reliable under retry |
| P05 Registry/readiness/sharing | Delegate Registry owner | P02,P03 | CRUD/schemas/record grants/ready state with negative cross-user tests |
| P06 Artifact validation and round trip | Delegate file owner | P02,P03,P04A/P04B; P00 manifest | Real byte upload/scan/parse/download and immutable version tests |
| P07 Submission and core lifecycle | Main | P05,P06,P04C | POC/deployment/baseline/snapshot/business approval/return stages pass |
| P08 Auditor assignments/evidence/decisions | Delegate review owner | P07,P03 | Senior-only assignment and complete review/conditional monitoring flows pass |
| P09 Governance/teams/content APIs | Delegate Admin owner | P02,P03,P06 | Draft isolation, publish, lead management, News/Library protections |
| P10A Frontend API/session adapter | Main | P03,P01 | Authenticated shell, client errors/loading/capability contract |
| P10B Registry/submission UI modules | Delegate Submitter UI owner | P05,P06,P07,P10A | Existing forms using APIs plus share/evidence-response flows |
| P10C Auditor/Admin UI modules | Delegate operations UI owner | P08,P09,P10A | Assigned actions, senior designation, real publish/content/notifications |
| P11 Shared frontend integration | Main | P10B,P10C,P04C | app.js/index.html/styles.css integrated; mock authority removed; visual/E2E pass |
| P12 Provider IaC and CI | Delegate infra owner; main owns shared CI hooks | P01,P04A,P04B | Azure/AWS validated plans, image build, deploy/migrate/rollback workflows |
| P13 Independent review and system verification | Delegate read-only reviewer; main fixes | P08,P09,P11,P12 | Traceable findings resolved; local/credentialed verification distinguished |
| P14 Live staging, recovery and release readiness | Main | P13, approved credentials/infra | Both provider smoke evidence, restore/rotation checks, business UAT and remaining limitations documented |

### 8.3 Executable work packages / delegation briefs

Each brief defines objective, inputs, ownership, constraints, output and verification. “Depends” references the index; agents must not silently bypass it. In these briefs, domain/, application/, api/, workers/ and infrastructure/{cloud,identity,persistence,scanning}/ are relative to Backend/src/; unit/integration/adapter tests are under Backend/tests/. P12 infrastructure/** means the root Terraform directory. Root/frontend/E2E/contracts/docs paths otherwise match the annotated tree.

**P00 — Main, requirement/decision closure.** Inputs: section 1 evidence, user requirements, prior blueprint, local reference workbook. Owned: docs/adr/0001-runtime.md, 0002-identity.md, 0003-workflow.md, docs/testing/template-approval.md and plan.md. Confirm issuer/group IDs/consents, single-organization assumption, self-review/sharing/Admin defaults, template licensing and conditional requiredness, SLA/retention/scanning/residency. Produce a versioned synthetic validation manifest and decision log with accountable business owner/date. Validate every workflow row against the existing UI. Done when P01 can freeze implementable defaults; unresolved live credentials do not block mocked development but must remain explicit P14 gates.

**P01 — Main, shared contracts and foundation.** Inputs: approved P00 defaults and sections 2–7. Owned: contracts/**, root tooling/lockfile, Backend/package.json/tsconfig, bootstrap/entrypoints, API plugin interfaces, docs/api/**. Create npm workspace scripts (dev/build/lint/typecheck/test:unit/test:integration/test:contract/test:e2e/db:migrate/contracts:generate), strict schema validation, Fastify route registration skeleton, UoW/repository/cloud/auth port interfaces, standard problem serializer and example fixtures. Pin actual supported runtime/library versions. Add import-boundary check and contract generation diff check. Done when example requests/responses validate and parallel workers consume identical interfaces.

**P02 — Delegate schema owner.** Objective: executable relational model and persistence ports. Inputs: frozen contracts, full section 4, transaction invariants, synthetic fixtures. Own Backend/database/** and Backend/src/infrastructure/persistence/postgres/**, tests/integration/database/**. Dependencies: P01; no live credentials. Constraints: only writer of migrations/DB types; no new tables or renamed fields without main approval; no production mock users; enforce late FK/cross-parent/immutability constraints in SQL, not just app tests. Output seven migrations+ledger, repository implementations, bootstrap/default drafts and deterministic local seeds. Verify empty install, migration checksum/lock failure, prior-version upgrade, constraint violations, two-writer races, rollback of failed transaction, authorized query plans. Done when schema dump matches every dictionary field/index and no unvalidated FK remains.

**P03 — Delegate identity owner.** Objective: trustworthy session and uniform authorization. Inputs: three IDs/issuer contract, directory fixtures (including empty/overage/disabled/nested), section 3 matrix, principal model. Own domain/identity/**, application/policies/**, application/services/identity/**, infrastructure/identity/**, api/routes/{auth,me,directory}.ts, matching focused tests. Main owns shared plugin integration and config schema. Build browser-bound state/nonce/PKCE, encrypted sessions/CSRF, directory-only principal binding, current-role/senior/grant policies, freshness/revocation and directory outage responses. No display-name grants, no dev impersonation in prod, no generic Admin bypass. Verify wrong issuer/audience/nonce/browser binding/replay, no-role, mixed-role self-review, changed ID attacks, revocation, disabled account and stale authority. Deliver adapter permission/consent checklist; live checks separately pending P14.

**P04A — Delegate Azure owner.** Objective: implement Azure ports without domain changes. Inputs: P01 interfaces/config schema, service-principal/MI/federation fixtures. Own infrastructure/cloud/azure/** and tests/adapters/azure/** only. Build explicit credential factories, streaming immutable Blob operations, Service Bus ack/retry/DLQ mapping, Key Vault references and sanitized errors. Constraints: no SDK types crossing ports; no changes to contracts/migrations; no actual provisioning. Verify credential mode validation, refresh provider use, aborted streams, conditional object writes, retry/duplicate delivery and redaction with fakes/Azurite; label untested live MI/federation cases.

**P04B — Delegate AWS owner.** Objective: AWS implementation of same ports. Inputs: frozen interfaces/config, Azure contract suite expectations (not its SDK internals). Own infrastructure/cloud/aws/** and tests/adapters/aws/**. Implement SDK chain, temporary triple, STS AssumeRole/web identity and region validation; private S3 streaming/version metadata, SQS delete/visibility/DLQ behavior and Secrets Manager resolution. Same boundary constraints as P04A. Verify mocked STS refresh/expiry, incomplete triples, external ID/session settings, endpoint/region mismatch, stream/retry/dedup semantics and redaction; enumerate live role-trust checks. Done when identical provider-neutral adapter tests pass.

**P04C — Main, worker reliability.** Inputs P02 repositories, P04 ports, event contracts. Own workers/** (except artifact-processing code coordinated with P06), application/events/**, idempotency orchestration and focused delivery tests. Implement outbox leases, durable command job status, receipts, SLA dedupe, in-app recipient selection, cleanup and graceful shutdown. No business state updates through direct worker SQL shortcuts. Verify crash before/after queue send, duplicate/reordered messages, worker restart, poison/DLQ/replay, timer replicas, clock boundaries and notification access removal. Done when committed operations cannot lose events and retries cannot repeat side effects.

**P05 — Delegate Registry owner.** Objective: real Registry and secure colleague collaboration. Inputs P02 repositories, P03 policy, approved field manifest, Registry contracts. Own domain/registry/**, application/services/registry/**, api/routes/registry.ts, tests/unit/registry/** and integration/registry/**. Implement server numbers, typed values, active-schema readiness/upgrade, owner edits, view/edit shares and authorized query predicates. No person names as keys, no share escalation, no silent old-value deletion. Verify Owner/Editor/Viewer/unrelated/Auditor/Admin matrix, field type and missing required values, retired options, concurrency, changed-owner access and revoked share downloads. Done when cross-user list/count/detail results agree.

**P06 — Delegate file owner.** Objective: trustworthy workbook/content/evidence bytes. Inputs approved P00 manifest, object-store port, artifact contracts/model. Own domain/artifacts/**, application/services/artifacts/**, infrastructure/scanning/**, api/routes/artifacts.ts, workers/artifact-processing.ts and tests/fixtures/file + artifact tests. Coordinate worker hook only with P04C; schema changes go to P02. Implement upload state/limits/hash/scan/parser/download and clean-file linking. Keep ignored source workbook uncommitted; construct approved synthetic fixtures. Verify all formats separately, optional procured sheets, shifted headers, malformed archives, malware, size/timeout, cross-parent attach/download, interrupted upload and exact-byte round trip. Done when decisions cannot consume anything except accepted correct-context immutable versions.

**P07 — Main, submission/state integration.** Inputs P05/P06/P04C and stage rules. Own domain/reviews/** core transitions, application/services/reviews/** submission/business/classification modules, api/routes/reviews.ts until handoff to P08 with explicit function boundaries. Implement immutable submission history, profile snapshot, approved POC baseline binding, return/resubmit, stage attempts and state-derived progress/deadlines. Verify same-record baseline, concurrent submit unique constraint, registry-change race, conditional readiness, owner approval and in-flight config stability. Done when full Submitter -> intake -> business -> assessment vertical slice persists across restart.

**P08 — Delegate review owner after sequential P07 handoff.** Objective: assignments, evidence, findings and independent decisions. Inputs stable core transitions, policy, repositories and contracts. Own domain/evidence/**, domain/decisions/**, application/services/{evidence,decisions}/**, review assignment/assessment files explicitly handed off by main, api/routes/{evidence,findings,decisions}.ts and focused tests. Do not concurrently edit P07 shared files; request reviewed patches. Implement Senior-only reassignment, eligibility/COI recheck, response acceptance, assessment completion and conditional monitoring. Verify ordinary-auditor self-assignment denial, old lead/assignee revocation, historical-owner conflicts, duplicate decisions, evidence wrong-ID injection, one active stage and condition closure. Done when approval/rejection/conditional flow has complete immutable history and retry safety.

**P09 — Delegate Admin owner.** Objective: governed publication, team leadership and content. Inputs P02/P03/P06, fixed role/kind schemas. Own domain/governance/**, domain/content/**, application/services/{governance,content}/**, team-admin use-case files, api/routes/{governance,teams,content}.ts and focused tests. Main owns contract/bootstrap integration. Implement drafts/clone/publish, core-field protection, stage reorder validation, exactly-three mapping view/sync request, team member/lead commands, content audiences/revision links. No additional role groups or unapproved audience taxonomy. Verify two-admin publish/lead races, draft invisibility, obsolete config references, clean attachment gate, external URL safety and team removal. Done when old reviews and published reader content stay stable during edits.

**P10A — Main, frontend transport/session.** Inputs OpenAPI/Me/client conventions. Own frontend/api/**, frontend/auth/**, frontend/state/** and auth shell hooks. Generate types, implement credentials+CSRF, error/ETag/idempotency handling, cancellation, protected navigation and allowed persona mapping. Verify 401/403/404/412/503 and query-role spoofing with API mocks. Done when existing shell can display authenticated empty states without fixtures.

**P10B — Delegate Submitter UI owner.** Objective: Registry/create-review/evidence-response modules. Inputs P10A client, API examples, existing modals/renderers/screenshots. Own frontend/workflows/{registry,reviews}.js and tests/e2e/submitter.spec.ts; submit integration-hook instructions rather than edit app.js/index.html/styles.css. Build directory picker/share dialog, schema form, readiness, real upload progress/polling, baseline selection and response to current evidence request. Preserve design/accessibility. Verify Owner/Editor/Viewer, optional procured fields, refresh/retry, revoked access, stale save and no duplicate review on evidence response. Deliver module exports/events and exact shared-file patch proposal.

**P10C — Delegate operations UI owner.** Objective: Auditor/Admin/content/notification workflow modules. Inputs P10A, P08/P09 responses, original views. Own frontend/workflows/{auditor,admin,content,notifications}.js and tests/e2e/{auditor,admin}.spec.ts. Same shared-file constraints as P10B. Build assignment/lead editor, business/assessment/decision commands, publication status, safe preview/download and notifications. Verify capability visibility, ordinary vs Senior differences, role unions/COI, draft isolation and real error states. Deliver hooks/patch proposal and screenshots at agreed widths.

**P11 — Main, shared frontend integration.** Inputs P10B/C outputs. Own app.js/index.html/styles.css and tests/e2e/{authorization,visual}.spec.ts. Replace global mock arrays and fake timers/downloads/publish/sync; register module hooks once, preserve selectors and focus behavior, escape API text everywhere. Scope optional demo mode to local test entrypoint with no production bundle inclusion. Integrate all error/loading/empty states and honest metrics. Verify critical role journeys against real local DB/API and screenshot baselines at 1440/820/390. Done when every existing action either works against backend or is explicitly disabled with reason; no success toast for an unexecuted operation.

**P12 — Delegate infrastructure owner; main integrates shared CI files.** Objective: reproducible Azure and AWS deployments of same app. Inputs config schema, image/start commands, resource permissions, residency/SLO decisions. Own infrastructure/**, Backend/deploy/**, docs/runbooks/deploy-{azure,aws}.md and provider workflow draft files; main owns final .github/workflows and lockfile. No cloud mutation before environment authorization/credentials. Implement least privilege/private data, TLS/WAF as selected, secret bindings, probes, replicas, worker scaling, backups, telemetry and one-off migrations. Verify Terraform fmt/validate, policy scans, config-output contract, container nonroot startup, readiness/drain; generate plan outputs for review. Done locally without claiming live resources; P14 verifies each actual provider.

**P13 — Delegate independent read-only reviewer.** Objective: detect scope/security/data/contract gaps independently. Inputs final diff, plan, generated schema/OpenAPI and test evidence. Own no production files; output docs/testing/review-findings.md via main or a dedicated report file agreed before spawn. Check exactly-three groups, all nested/file/count authorization, COI, migrations/ER parity, state transitions, secret leakage, live-vs-mock claims, frontend parity and cloud refresh. Reproduce high-priority issues with commands/requests. Main fixes in owning workstreams and reviewer rechecks. Done when no unresolved critical/high issue, remaining risks have explicit owner and release decision.

**P14 — Main, live readiness and handover.** Inputs reviewed code/IaC, approved staging credentials/groups, test identities, business owners. Own live execution, docs/testing/provider-evidence/**, docs/runbooks/** and plan checklist. Provision/deploy only authorized environment, run each provider with Entra, test three roles and membership changes, verify real scans/uploads/download hashes, queue/secret refresh, restore and rollback. Record timestamps, commit/image/schema versions, commands and sanitized evidence. Production readiness requires both provider paths tested or explicitly documented unverified path; do not mark unrun checks passed. End with operational handover and outstanding business approvals, not automatic production deployment.


## 9. Verification, observability and completion

All checks here are implementation acceptance criteria. This planning task has not run application tests, created infrastructure or used live identity/cloud credentials.

### 9.1 Verification matrix

| Area | Local/mock or container checks (required CI) | Live credentials/infrastructure checks (required before claiming that path verified) |
\|---\|---\|---\|
| Authentication | Test OIDC signatures/key rotation, wrong issuer/audience/tenant/nonce, state replay, different browser binding, code reuse, session fixation, CSRF/Origin, token-cache encryption/expiry | Actual Entra/federated redirect/logout, Conditional Access, client-secret/federation validity, consent and refresh |
| Exactly three roles | Duplicate/missing group IDs rejected; overage/missing/empty claims; union roles; no-group denied; tampered persona URL | Three supplied groups, nested membership as approved, actual overage user if available, rename without ID change, removal/disable propagation time |
| Principal lifecycle | Directory-only user with no OIDC sub can be owner/member; first-login binding matches object ID; email/name change does not affect access | Real directory users who have never logged in; account enablement and guest policy; agreed minimum Graph read permissions |
| Record authorization | Owner, Editor, Viewer, unrelated Submitter, ordinary Auditor, Senior, Admin and all mixed-role cases; list/count/detail/search/timeline/attachment consistency | Separate real identities exercise direct API access across records and after share/team/role revoke |
| Assignment/COI | Concurrent lead replacement/reassignment; zero/one lead; ordinary Auditor cannot self-assign; former assignee denied; current/historical owner/submitter cannot audit own case | Admin chooses Senior, Senior assigns another Auditor; removal while session remains active; no extra AD lead group |
| Database | Empty install and upgrade; ledger checksums/locks, all constraints/FKs/indexes, two writers, immutable snapshots/audit/decisions, authorized EXPLAIN plans | Managed DB TLS/roles, migration job identity, backup/PITR and connection-pool behavior |
| API contracts | OpenAPI examples/schema validation, generated-client diff, every route permission/error mapping, unknown fields, cursor tampering/filter mismatch, ETag/idempotency races | Edge/proxy body/time limits, CSRF origin/domain behavior and no caching of private API responses |
| Workbook/artifacts | Size/type/signature/archive bounds, parser resource caps, malicious/encrypted files, conditional procured sheets, CSV/XLS manifests, incomplete upload, unavailable scanner, exact SHA256 round trip | Real private storage access, scanner availability/update, workload permissions, object version recovery, unauthorized network/bucket access denied |
| Baseline/reviews | Same-Registry approved POC only; exact decision workbook; conditional unresolved baseline denied; return/resubmit history; config/schema changes preserve prior snapshots | Business UAT on approved templates and stage ordering/SLA/risk policy |
| Evidence/decision | Provide evidence never creates review; exact accepted response; open questions block decisions; reviewed file required; approve/reject/conditional monitoring and immutable signer | Two-person independent audit sequence and incident/reassignment behavior |
| Content | Draft revisions isolated; role audiences; direct-ID unpublished/replaced attachment denied; no HTML/script injection; link scheme checks | Authorized real uploads and role reader previews/downloads; external links approved by organization |
| Events/jobs | Crash before/after send, duplicate/out-of-order events, receipt atomicity, command job status survives restart, SLA dedupe, DLQ/replay, visibility-based notifications | Service Bus and SQS delivery/visibility/credential-refresh semantics, alerts and controlled replay |
| Cloud configuration | All Azure auth modes; all AWS modes incl complete temporary triple/region/role trust inputs; mixed AWS-hosted+Entra config; reject placeholders/partial/ambiguous secrets | Azure service-principal/MI/workload modes where environment supports them; AWS task-role/STS/web identity/temp rotation; permissions outside intended namespace denied |
| Frontend | Real local stack E2E; all three personas; share view/edit; pending/error/empty/401/403/404/412/503 states; safe rendering; 1440/820/390 layout and keyboard/focus | Staging browser sign-in + real data round trip; approved business UAT |
| Deployment/recovery | Container nonroot, clean startup/shutdown, missing secret/config fails, health contracts, previous image compatibility, IaC validate/policy | Both provider deploy smoke, rolling rollout/drain, restore, secret rotation, one worker failure, rollback and approved RTO/RPO exercise |

Security fixtures must test a direct guessed UUID even if UI hides the action. Include an unauthorized artifact version attached to an otherwise visible review/content item, a cursor from another identity, stale membership cache and a user with all three roles trying self-approval. Passing component tests does not replace these system tests.

### 9.2 CI and local development commands

P01 establishes scripts so another engineer can run:

~~~text
npm ci
npm run contracts:generate
npm run lint
npm run typecheck
npm run test:unit
docker compose -f Backend/deploy/compose.yaml up -d
npm run db:migrate --workspace Backend
npm run test:integration
npm run test:contract
npm run test:e2e
npm run build
~~~

These are target commands, not currently available scripts. Local stack includes PostgreSQL, API, worker, fake issuer/directory, private local storage, scanner and collector. Use real PostgreSQL rather than SQLite to verify partial indexes, deferred constraints, transaction isolation and SQL syntax. Adapter tests can use emulators but must label emulator-only coverage. Reject production startup with fake providers or demo identity controls.

Required CI jobs: lint/types, meaningful unit/policy/state tests, migration/integration tests, OpenAPI/event compatibility, generated-file drift, browser critical paths, import boundaries, dependency/secret/container/IaC scans and image SBOM. Do not add tests merely to mirror getters; focus on authorization/races/round trips. Performance baseline: load realistic approved data scale (provisional 10,000 Registry records/50,000 reviews), measure p95 list latency, scan duration and memory; finalize targets in D09 instead of claiming an untested SLA.

### 9.3 Health, telemetry and deployment smoke

- `GET /health/live`: 200 if process/event loop alive; no external dependency checks. `GET /health/startup`: 200 only after config/key resolution and compatible schema confirmed, otherwise 503. `GET /health/ready`: DB connectivity/schema plus required initialized adapters; transient queue/scan/directory problems reported as internal degraded dependency metrics while durable reads can remain ready. Document threshold for withdrawing readiness if safe authenticated service cannot operate. Responses are minimal {status}, no connection strings/versions beyond approved release identifier.
- Worker exposes equivalent internal health/last-success metrics. Neither API nor worker runs migrations concurrently on startup; migration job is separate. SIGTERM stops accepting work, drains bounded requests, releases/lets leases expire and closes clients/pool.
- OpenTelemetry trace/request IDs across HTTP/UoW/outbox/worker/SDK; JSON logs with action/result/aggregate IDs and redacted actor ID. Never log Authorization/cookies/CSRF/tokens/secrets/object access URLs/raw workbook/evidence/entire request bodies.
- Metrics/alerts: HTTP error/latency, denied actions, session/directory freshness, group refresh failures, pending scan age, validation failure, queue oldest age/DLQ, outbox lag, job retries, DB pool/saturation, storage errors, backup age, conditional finding deadlines. Do not use principal IDs as high-cardinality metric labels.
- Audit successful security-sensitive reads/downloads and mutations; denied actions emit append-only security records without revealing target data. A successful business transaction cannot commit without its required audit/outbox entry; operational pre-auth denials may fall back to redacted security log if DB is unavailable, with alerting.
- Staging smoke per provider: verify image/schema IDs; login each role; Admin bootstrap/designate Senior; Submitter creates Registry and share; view-only peer denied edit; upload and validate actual bytes; submit; Senior assigns; independent Auditor returns reviewed file and requests evidence; Submitter responds; Auditor accepts/signs; reader sees approved record; News/Library publish/download; notification read survives reload.
- Capture file hashes before upload/after download, private-origin denial, effective role matrix, queue delivery and real provider credential refresh. Use synthetic staging data only. A second smoke confirms AWS deployment still authenticates with the same selected AD design.

### 9.4 Recovery runbooks

| Incident | Required procedure / evidence |
\|---\|---\|
| Bad application release | Stop rollout, route to prior compatible digest, leave additive schema; verify health and one role smoke, preserve incident trace |
| Failed migration | Halt release; check ledger and advisory lock; rollback failed transaction or repair an explicit resumable nontransactional step; never blindly rerun altered applied SQL |
| DB corruption / destructive data mistake | PITR into new isolated DB; restore consistent object versions/keys; verify counts, FKs, decision/audit history and file hashes; invalidate sessions; controlled switch after approval |
| Scanner outage or malicious file | Stop acceptance, leave private pending/rejected bytes, alert; resume validated retry after recovery. No manual clean-state bypass; use incident access block for recalled already-accepted files |
| Queue/DLQ backlog | Inspect sanitized error, fix consumer, redrive bounded batch preserving event IDs, monitor receipt/idempotency and no repeated notifications |
| Directory outage/revocation incident | Expire cached authority per policy, deny stale sensitive access, revoke local sessions if required, restore approved adapter; verify real memberships before reopening privileged actions |
| Credential/key rotation | Stage new secret/trust/key, reload/redeploy, verify operation and refresh, revoke old credential after overlap; retain required old decrypt keys for approved retention |
| Storage/provider cutover | Copy immutable bytes, verify every hash/version mapping, retain old profile read path until audit complete, switch writes, test reads/rollback; do not just flip provider flag |
| Restore/region failover | Exercise DB, objects, secrets, queue replay, identity DNS/redirects, image registry and telemetry together; record measured RPO/RTO, not DB-only recovery time |

Backups and recovery deletion/retention are governed by D08/D09. App Admin cannot invoke destructive maintenance APIs. Production deployment remains a separate execution authorization; this deliverable neither deploys nor requests credentials.

## 10. Technical source references and reconciliation

Primary documentation checked during planning; recheck exact library versions, permissions and available regional services in P01/P03/P12.

- Entra can remain the application issuer while upstream sign-in is federated; direct AD FS is a different integration contract. [Microsoft hybrid sign-in](https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/plan-connect-user-signin), [AD FS OIDC/OAuth scenarios](https://learn.microsoft.com/en-us/windows-server/identity/ad-fs/overview/ad-fs-openid-connect-oauth-flows-scenarios).
- Use authorization-code/PKCE and distinguish ID tokens from API access tokens and their audiences. [Microsoft authorization-code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow), [Access tokens](https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens), [Claims validation](https://learn.microsoft.com/en-us/entra/identity-platform/claims-validation).
- Detect group overage and perform configured membership checks rather than trusting absence of group claims. [Access-token claim reference](https://learn.microsoft.com/en-us/entra/identity-platform/access-token-claims-reference), [Graph checkMemberGroups](https://learn.microsoft.com/en-us/graph/api/directoryobject-checkmembergroups?view=graph-rest-1.0).
- CheckMemberGroups checks transitive membership and accepts up to 20 IDs; delegated self checks can use User.Read. Candidate/background endpoints require approved application permissions (documented user checks include User.ReadBasic.All with GroupMember.Read.All; hidden membership needs special permission). Directory account enablement is an additional check, not implied by group membership. P03 must validate the chosen read-property permissions for accountEnabled/user metadata without requesting unnecessary write scopes. [Graph membership permissions](https://learn.microsoft.com/en-us/graph/api/directoryobject-checkmembergroups?view=graph-rest-1.0), [Get user/property permissions](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0).
- Revocation is affected by application sessions and token/directory propagation; this plan's five-minute cache is an application policy, not an Entra instantaneous guarantee. [Microsoft revoke access guidance](https://learn.microsoft.com/en-us/entra/identity/users/users-revoke-access).
- Azure supports client-secret, managed-identity and workload-identity credentials; explicit mode selection here is an application choice. [Azure Identity for JavaScript](https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme?view=azure-node-latest), [WorkloadIdentityCredential](https://learn.microsoft.com/en-us/javascript/api/@azure/identity/workloadidentitycredential?view=azure-node-latest).
- AWS SDK credential providers and region configuration use AWS-native concepts; role providers can refresh acquired credentials. [Node credential chain](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html), [Credential providers](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/migrate-credential-providers.html), [Assume-role settings](https://docs.aws.amazon.com/sdkref/latest/guide/feature-assume-role-credentials.html), [Region configuration](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-region.html).
- ER diagram keys/cardinality syntax follows [Mermaid ER documentation](https://mermaid.js.org/syntax/entityRelationshipDiagram.html). Dictionary constraints supply SQL details beyond the diagrams.

During implementation update Backend/README.md to reference approved ADRs/this plan, remove optional fourth role group, replace narrower Auditor read claims and Azure-only mandatory services, and replace aspirational .NET folder examples with the implemented TypeScript tree. Preserve useful operational requirements. Root README should state prototype versus implemented/live capability honestly and include only verified run/deploy instructions.

## 11. Material risks, assumptions and unresolved decisions

Defaults below are actionable for development. Items marked production gate need an accountable human/organization decision before production; they do not justify inventing a business rule or marking a live check passed.

| ID | Decision / risk | Proposed default / mitigation | Owner and gate |
\|---\|---\|---\|---\|
| D01 | Actual AD topology, group IDs, nesting, guests, account disable read permission, Graph consent | Entra issuer; three security-group object IDs; transitive membership; deny guests; explicit authoritative enablement+membership checks | Identity administrator; before P03 live integration and production |
| D02 | Single vs shared tenancy | Dedicated organization deployment/DB; shared tenancy requires full schema/query/contract redesign before P02 | Solution owner; P00/P02 gate |
| D03 | Who may receive shares; inheritance/draft visibility and ownership | Active same-directory Submitters; view/edit grant inherits submitted reviews, editors see drafts; only owners grant/change owner; immutable creator | Product/data owner; freeze before P05 |
| D04 | Admin read/edit boundaries and independence | Admin read all, configuration/content/team control; no implicit Registry edit or independent audit. Business-owner approval is distinct from audit sign-off | Governance owner; freeze before P03/P07 |
| D05 | Business stage, stage order, risk routing, expedited/high-risk, SLA calendar/pause, escalation/digest | Fixed safe kinds/order, Standard default, elapsed UTC days, no pause, 80%/24h in-app warnings; unapproved alternate profiles/digest not active | Process owner; P00/P07 gate; original UI controls must reflect supported policy |
| D06 | Parallel reviews, baseline expiry, conditional POC reuse | At most one active review per Registry/type including conditional monitoring; no automatic expiry until defined; baseline only approved same-record exact decision workbook, all conditions resolved | Process owner; before P07 |
| D07 | Production template, CSV/XLS rules, procurement optionality, evidence allowlist/scanner policy | Versioned approved manifests; optional procured Datasheet/Model Card preserved; fail closed on unsupported/unscannable; proposed limits in section 6 | Assessment/security owner; P06 production gate |
| D08 | Retention, legal hold, classification, residency and audience taxonomy | Retain business history/files until schedule approved; legal hold prevents cleanup; one organization; role audiences only | Legal/data owner; production gate; no statutory compliance claim |
| D09 | SLO, load scale, RPO/RTO, regional recovery, backup retention | Measure local/staging baseline; no availability/recovery guarantee until end-to-end exercise | Operations/business owner; P14 production gate |
| D10 | Runtime, CI and IaC organization standard | TypeScript/Fastify/PostgreSQL, npm, GitHub Actions and Terraform; alternatives require ADR before scaffold | Engineering owner; P01/P12 |
| D11 | App-level recorded sign-off vs digital signature/multiple signers | One immutable authenticated signer; separate signature/multisigner model only if mandated | Governance/legal owner; before P08 approval |
| D12 | Cloud adapter parity and live credentials availability | Same contracts, separate native implementations/tests; explicitly report any provider/auth mode only mocked | Cloud platform owner; P14 completion gate |
| D13 | Inherited prototype XSS/access assumptions | Safe DOM output, server filters, exact-version content authorization, no URL persona privilege | Main/security reviewer; P11/P13 |
| D14 | Graph outage and external propagation | Fail closed once freshness expires; retries/alerts; measure revocation delay, do not promise instantaneous removal | Identity/operations owner; P03/P14 |
| D15 | Artifact throughput and port differences | Stream capped files initially, immutable objects, queue-independent ordering, realistic throughput test | Backend/cloud owner; P06/P12/P14 |

## 12. Actionable implementation checklist

The deliverable of the present task is this plan; the boxes below intentionally represent future implementation.

- [ ] P00 record/approve directory topology, organization isolation, workflow and workbook decisions with owners; keep production gates explicit.
- [ ] P01 freeze OpenAPI, event/config schemas, ports, DTOs, role matrix and state rules; establish pinned workspace/tooling.
- [ ] P02 implement all 38 tables, field/ER consistency, constraints, ledger, safe bootstrap and tested migrations.
- [ ] P03 implement browser-bound OIDC session, CSRF, directory-only user binding, three-role policy and revocation.
- [ ] P04A/P04B pass identical adapter contracts with Azure service-principal/MI/federation and AWS native credential modes.
- [ ] P04C verify transactional audit/outbox/idempotency, durable operation status, timer dedupe, receipts and notifications.
- [ ] P05 deliver Registry readiness, versioned values, owner changes and view/edit sharing with negative cross-user tests.
- [ ] P06 deliver real file round trip, clean-only authorization, format-specific approved parsing and immutable version history.
- [ ] P07 deliver immutable submission attempts, same-Registry POC continuation, business approval and pinned stage transitions.
- [ ] P08 deliver Senior-only assignment, evidence acceptance, findings, independent sign-off and conditional monitoring.
- [ ] P09 deliver Admin configuration/content drafts and publish, exactly-three group status, teams and senior designation.
- [ ] P10A/B/C and P11 integrate existing frontend; preserve design, replace simulations, add missing actions and all permission/error states.
- [ ] P12 validate both native IaC/config paths, least privilege, image/CI, migrations, probes, telemetry and backup wiring.
- [ ] P13 close independent review findings and pass migration/API/authorization/frontend/security verification.
- [ ] P14 record live Azure and AWS + selected AD smoke, credential rotation, restore/rollback and business UAT evidence; clearly identify untested modes.
- [ ] Main reconcile plan/ADRs/READMEs, hand over runbooks and report remaining material risks without claiming unperformed verification.


