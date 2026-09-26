# AI Assistant Instructions & Project Guidelines

## 1. Documentation Location & Naming Policy (STRICT — NO EXCEPTIONS)
- **Central Documentation Root**:
  `J:\My Drive\A.EcomWhiteLabel\`
- **Zero Local Documentation in Codebase**:
  Never create, edit, or maintain documentation, markdown notes, credentials, or guides inside the local codebase repository (`d:\mtEcomWhite` or any subfolder).
- **Date-Prefixed Documentation Naming (STRICT)**:
  All new documentation files inside `J:\My Drive\A.EcomWhiteLabel\Docs\` must strictly start with `DDMMYY_` format (e.g., `250926_Dual_Backend_and_PPanel_Onboarding_Architecture.md`).
- All architectural guides, tenant credentials, setup instructions, and operational manuals must strictly be stored in:
  `J:\My Drive\A.EcomWhiteLabel\`
- **Tenant-Specific Folders**:
  Each tenant has their own dedicated folder for credentials, VPS access, and environment specs:
  - `J:\My Drive\A.EcomWhiteLabel\Toyoland\`
  - `J:\My Drive\A.EcomWhiteLabel\Decantre\`
  - `J:\My Drive\A.EcomWhiteLabel\Engulfic\`
  - `J:\My Drive\A.EcomWhiteLabel\KawaiiKutir\`
  - `J:\My Drive\A.EcomWhiteLabel\Surokkha\`
  - `J:\My Drive\A.EcomWhiteLabel\Dev\`

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

## 3. Centralized Activity Logging (Cloudflare D1 Hub)
- Activity audits and deployment logs must be pushed via:
  ```bash
  node client-kit/log.js "<ID>(<type>): <Summary>" \
    --reqs "- Business requirement and problem context" \
    --changes "- File and logic changes breakdown" \
    --notes "Verification and test notes"
  ```

---

## 4. Code Style & Architecture Guardrails
- **Dual-Backend Instance Standard**:
  - `server.clientname.com` $\rightarrow$ Storefront Public API (Port 4001, lean, cached, public routes only).
  - `service.clientname.com` $\rightarrow$ Dashboard Business API (Port 4002, admin routes, WebSockets, background schedulers).
  - Both backends share a single database and JWT secret layer.
- **Zero Local Deploy Scripts**:
  - Never place `.sh` deployment scripts or `make deploy` inside client project directories. All deployments and lifecycle management are orchestrated via PPanel / Node Agent and Master Hub.
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
  - Code merging from `dev` into `Live` or `master` will strictly be performed manually by the user. AI must never automatically merge branches into `Live` or `master`.

---

## 6. Deployment Guardrails (STRICT)
- **Deploy Source is `Live` Branch ONLY**:
  - Production deployments must strictly pull and build from the **`Live`** branch (never from `dev` or feature branches).
- **Zero Deployment Without Explicit Command**:
  - **NEVER** execute VPS build, deployment commands, service restarts, or push to production without explicit user instruction.
  - Only when the user explicitly commands *"ডিপ্লয় দাও"* (or equivalent direct deployment command), proceed with deployment from the `Live` branch.
