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
  - `J:\My Drive\A.EcomWhiteLabel\Surokkha\`
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
  - `api/server.clientname.com` $\rightarrow$ Storefront Public API (Port 4001, lean, cached, public routes only).
  - `service.clientname.com` $\rightarrow$ Dashboard Business API (Port 4002, admin routes, WebSockets, background schedulers).
  - Both backends share a single database and JWT secret layer.
- **Zero Local Deploy Scripts**:
  - Never place `.sh` deployment scripts or `make deploy` inside client project directories. All deployments and lifecycle management are orchestrated via PPanel / Node Agent and Master Hub.
- **Arrow Functions Only**: Use `const myFunc = () => {}` for functional components and custom functions. Do not use standard `function` keyword declarations.
- **No Inline Comments**: Do not place inline comments inside function bodies, conditionals, or JSX.
- **Single-Line Preceding Function Comment**: Put exactly one clean single-line comment on the line immediately preceding the function.
- **Multi-Tenant Safety**: Never hardcode tenant-specific keys or settings in the core codebase.

---

## 5. Git Branching & Push Policy (STRICT)
- **Commit and Push Directly to `Live`**:
  - All work (features, fixes, refactoring, docs) is committed on and pushed straight to the **`Live`** branch. No `dev` step, no merge step.
- **Never Push to `master`** and never force-push `Live`.
- Commit and push only when the user asks (see section 6).

---

## 6. Deployment & Code Modification Guardrails (STRICT)
- **Deploy Source is `Live` Branch ONLY**:
  - Production deployments must strictly pull and build from the **`Live`** branch (never from `dev` or feature branches).
- **Zero Deployment Without Explicit Command**:
  - **NEVER** execute VPS build, deployment commands, service restarts, or push to production without explicit user instruction ("ami na bolle deploy dibana").
  - Only when the user explicitly commands *"ডিপ্লয় দাও"* (or equivalent direct deployment command), proceed with deployment from the `Live` branch.
- **Zero Unauthorized Code Changes & Git Actions (STRICT - USER RULE)**:
  - **NEVER** commit, push, or modify arbitrary files/logic without explicit user permission or direct request.
  - Do not make unsolicited codebase changes or unsolicited branch pushes.
  - All changes must strictly follow user instructions, staying local until explicitly asked to commit, push, or deploy.

---

## 7. Infrastructure, VPS Servers & Deployment Inventory (From Inventory Sheet)
*Reference: `J:\My Drive\assets.docs.plexivia\Plexivia_VPS_Containers_and_Domains_Inventory.xlsx`*

---

## 8. Storefront UI Design System (Surokkha Crimson)
- **Source of truth**: `docs/18_Storefront_Design_System_Surokkha_Crimson.md`. Read it before any storefront UI, CSS or theme change.
- **Tokens only**: Use the CSS variables from that doc (`--page`, `--primary`, `--gold`, `--price`, ...). Never hardcode hex values in components.
- **Fonts**: `Marcellus` for headings, `Manrope` for body and buttons, `Jost` for product names and prices. Keep `Hind Siliguri` in the stack for the ৳ sign.
- **Prices**: Always `font-variant-numeric: lining-nums tabular-nums` in `--price` color.
- **Buttons**: One crimson primary per group; secondary actions use the gold outline. Add to cart is green by default and turns rose with a check icon once added.
- **Status colors**: success / error / warning / info tokens only, always with an icon. Error is orange-red, never crimson; gold is never used in alerts.
- **Theme**: Dark only. All storefront copy is English, sentence case.

---

## 9. Marketing Assets Location (STRICT)
- **Marketing root**: `G:\My Drive\Surokkha\marketing\`
- All marketing work (ad banners, product photos, thumbnails, ad videos, social posts, ad copy files and the scripts/HTML that generate them) must be created and edited **only** in that Drive folder.
- **Never** create or keep marketing files inside the codebase repository (`D:\Surokkha.store`). `/marketing` is git-ignored and must never be committed.
- One subfolder per campaign or product (e.g. `trial-pack-2\`, `smart-pack\`, `website-video\`). Shared brand logos live in `G:\My Drive\Surokkha\marketing\logos\`.
- Meta ad copy rule: no explicit product-type words (condom, lubricant, gel, ...) in ad copy and banner text.
