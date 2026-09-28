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
  - **NEVER** execute VPS build, deployment commands, service restarts, or push to production without explicit user instruction ("ami na bolle deploy dibana").
  - Only when the user explicitly commands *"ডিপ্লয় দাও"* (or equivalent direct deployment command), proceed with deployment from the `Live` branch.

---

## 7. Infrastructure, VPS Servers & Deployment Inventory (From Inventory Sheet)
*Reference: `J:\My Drive\assets.docs.plexivia\Plexivia_VPS_Containers_and_Domains_Inventory.xlsx`*

### Server 1: Plexivia Self-Owned Dedicated VPS Node 1
- **IP Address**: `14.128.14.223` | **Hostname**: `s.plexihub.space` | **OS**: Ubuntu 24.04 LTS
- **SSH Command**: `ssh -i ~/.ssh/id_ed25519_plexivia root@14.128.14.223`
- **SSH Key**: `C:\Users\mdikr\.ssh\id_ed25519_plexivia`
- **Hosted Platforms & Clients**:
  1. **PlexiHub Platform**:
     - Core API: `plexivia-backend.service` (Port 5095) $\rightarrow$ `api.plexivia.com`
     - Auth: `plexivia-auth.service` (Port 5001), Hub: `plexivia-hub.service` (Port 5002), Agency: `plexivia-agency.service` (Port 5003), Finance: `plexivia-finance.service` (Port 5004)
     - Websites: `plexivia.com`, `admin.plexivia.com`, `portal.plexihub.space`
     - Database: `plexivia-mongodb-live` (Port 27017)
  2. **Surokkha White-Label E-Commerce**:
     - **Storefront Website**: `/opt/clients/surokkha/dist` $\rightarrow$ `surokkha.store`, `www.surokkha.store`
     - **Admin Dashboard**: `/var/www/admin.surokkha.store/dist` $\rightarrow$ `admin.surokkha.store`
     - **Storefront API Instance**: systemd `surokkha-storefront.service` (Port 5094, `src/server.storefront.js`) $\rightarrow$ `api.surokkha.store`, `server.surokkha.store`
     - **Dashboard API Instance**: systemd `surokkha-dashboard.service` (Port 5096, `src/server.dashboard.js`) $\rightarrow$ `service.surokkha.store`
     - **Database**: Docker `surokkha-mongodb-live` (127.0.0.1:27019 $\rightarrow$ container 27017, DB: `surokkha-db`)
     - **Backend Working Dir**: `/opt/clients/surokkha/backend`
  3. **Southern Hermain Overseas (MAT ERP)**:
     - API: Docker `southernhermain-backend-live` (Port 5093) $\rightarrow$ `api.southernhermainoverseas.site`
     - Dashboards: `southernhermain-dashboard-admin-live` (Port 8017), `southernhermain-dashboard-live` (Port 8015)
     - Database: Docker `southernhermain-mongodb-live` (Port 27018 $\rightarrow$ container 27017)

### Server 2: CaresBD Production VPS
- **IP Address**: `144.79.218.122` | **Hostname**: `server.caresbd.com` | **OS**: Ubuntu 24.04 LTS
- **SSH Command**: `ssh -i ~/.ssh/id_ed25519_plexivia root@144.79.218.122`
- **SSH Key**: `C:\Users\mdikr\.ssh\id_ed25519_plexivia`
- **Hosted Clients**:
  - **Cares Bangladesh** (26FS04): `cares-web` (3000), `cares-server` (5092), `cares-admin` (8005), `cares-mongodb` (27017)
  - **Toyoland** (WL03): `toyoland-frontend` (8007), `toyoland-backend-live` (5093), `toyoland-dashboard-live` (8006), `toyoland-mongodb-live` (27018)
  - **System Services**: `cares-cpanel` (8090) $\rightarrow$ `cpanel.caresbangladesh.com`, `gitea.service` (3002) $\rightarrow$ `git.plexivia.online`

### Server 3: Engulfic Production VPS
- **IP Address**: `144.79.218.112` | **Hostname**: `plexivia.server.com` | **OS**: Ubuntu 22.04 LTS
- **SSH Command**: `ssh -i ~/.ssh/engulfic root@144.79.218.112`
- **SSH Key**: `C:\Users\mdikr\.ssh\engulfic`
- **Hosted Clients**:
  - **Engulfic** (WL02): `engulfic-backend-live` (5094), `engulfic-dashboard-live` (8015), `engulfic-mongodb-live` (27017), Storefront Nginx Static (/dist)
  - **TestEnv ERP**: `testenv-erp-backend-live` (5092), `testenv-erp-dashboard-admin-live` (8007), `testenv-erp-dashboard-live` (8005), `testenv-erp-mongodb-live` (27018)
  - **Plexivia Demo**: API (Port 5095), DB (Port 27019) $\rightarrow$ `api.plexivia.online`, `dashboard.plexivia.online`

