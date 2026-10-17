# AI Assistant Instructions & Project Guidelines

## 1. Documentation Location & Naming Policy (STRICT — NO EXCEPTIONS)
- **Central Documentation Root**:
  Tenant credentials, VPS access, and environment specs must strictly reside in external secure storage, never inside the template repository.
- **Zero Local Documentation of Client Credentials**:
  Never create, edit, or commit client credentials, tokens, or private customer data inside this template repository.
- **Date-Prefixed Documentation Naming (STRICT)**:
  All new architectural documents should follow `DDMMYY_<Title>.md` format.

---

## 2. Commit Message & Changelog Format
Every git commit must strictly adhere to the format:
`<LogID>(<type>): <description>`

- **LogID Examples**: `AA01`, `AB02`, `AD01`, `DEP01`, `WB01`, etc.
- **Allowed Types (4 letters max)**:
  - `feat` (New feature / capability)
  - `fix`  (Bug fix)
  - `refc` (Refactoring / code cleanup)
  - `docs` (Documentation updates)
  - `perf` (Performance improvements)
  - `chor` (Chores / dependency updates)
  - `styl` (Styling / CSS / theme UI changes)
  - `test` (Testing / test scripts)
- **No Lazy Commits**: Never use generic messages like `wip`, `update`, `fix`, `changes`.

---

## 3. Centralized Activity Logging
- Activity audits and deployment logs should follow standard structured logging:
  ```bash
  node client-kit/log.js "<ID>(<type>): <Summary>" \
    --reqs "- Business requirement and problem context" \
    --changes "- File and logic changes breakdown" \
    --notes "Verification and test notes"
  ```

---

## 4. Code Style & Architecture Guardrails
- **Dual-Backend Instance Standard**:
  - `api.yourbrand.com` / `server.yourbrand.com` $\rightarrow$ Storefront Public API (Port 4001, lean, cached, public routes only).
  - `admin-api.yourbrand.com` / `service.yourbrand.com` $\rightarrow$ Dashboard Business API (Port 4002, admin routes, WebSockets, background schedulers).
  - Both backends share a single database and JWT secret layer.
- **Zero Local Deploy Scripts**:
  - Never place `.sh` deployment scripts with hardcoded credentials inside client project directories. All deployments are orchestrated via containerization and environment variables.
- **Arrow Functions Only**: Use `const myFunc = () => {}` for functional components and custom functions. Do not use standard `function` keyword declarations.
- **No Inline Comments**: Do not place inline comments inside function bodies, conditionals, or JSX.
- **Single-Line Preceding Function Comment**: Put exactly one clean single-line comment on the line immediately preceding the function.
- **Multi-Tenant Safety**: Never hardcode tenant-specific keys or settings in the core codebase.

---

## 5. Git Branching, Push & Merge Policy (STRICT)
- **Always Push to `dev` Branch**:
  - All feature work, bug fixes, refactoring, and daily changes must **ALWAYS** be committed and pushed strictly to the **`dev`** branch.
- **NEVER Push to `Live` or `master` Directly**:
  - Direct pushing to `Live` or `master` is strictly prohibited.
- **Manual Code Merge by User**:
  - Code merging from `dev` into `Live` or `master` will strictly be performed manually by the repository owner. AI must never automatically merge branches into `Live` or `master`.

---

## 6. Deployment Guardrails (STRICT)
- **Deploy Source is `Live` Branch ONLY**:
  - Production deployments must strictly pull and build from the **`Live`** branch (never from `dev` or feature branches).
- **Zero Deployment Without Explicit Command**:
  - **NEVER** execute VPS build, deployment commands, service restarts, or push to production without explicit user instruction.

---

## 7. Infrastructure & Deployment Reference (Your Brand Template Model)

### Standard White-Label Deployment Template
- **Template Brand**: `Your Brand` (`example.com`)
- **Storefront Website**: `https://example.com` (Port 8001 / Static Dist)
- **Admin Dashboard**: `https://dashboard.example.com` (Port 8005)
- **Storefront API Instance**: `https://api.example.com` (Port 4001, `src/server.storefront.js`)
- **Dashboard API Instance**: `https://service.example.com` (Port 4002, `src/server.dashboard.js`)
- **Database**: MongoDB 7.0 (Port 27017)

