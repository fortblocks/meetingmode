# Meeting Mode — handover (paste this into a new chat)

You are continuing work on **Meeting Mode**. The previous chat broke mid-deploy. Goal: get the app live at **https://meetingmode.xyz** so the owner can test it in the wild.

Do **not** rebuild the app unless asked. Deploy and domain are the job.

---

## Product (already built)

In-browser macOS desktop of a menu-bar meeting ritual (not a native Swift app — this sandbox can only ship a web preview).

- Focus mode, dated notes, calendar Join, optional Grok listening / wrap-up / live cues
- TanStack Start + React + Tailwind + Zustand (`localStorage`)
- **Auth OFF, database OFF**
- Hotkey: Control-Option-M (Ctrl+Alt+M in the browser)
- AI: xAI `grok-4.5` chat + REST STT `POST https://api.x.ai/v1/stt`
- Code lives in `/workspace` and is already on GitHub

App entry: `src/routes/index.tsx` (`ssr: false`) → `MacDesktop`. Grok server fns: `src/lib/meeting/grok.ts`. Store: `src/lib/meeting/store.ts`.

---

## Done

- App built, typechecked, production-built, QA’d in the Grok preview
- GitHub repo created and pushed:
  - **https://github.com/fortblocks/meetingmode**
  - Owner: `fortblocks` (public)
  - Branch: `main`
  - HEAD: `664a59e` — “Add Vercel build settings for production deploys”
  - Remote: `https://github.com/fortblocks/meetingmode.git`
- `vercel.json` in repo:
  ```json
  {
    "installCommand": "npm install",
    "buildCommand": "node scripts/with-app-env.mjs vite build && node scripts/migrate.mjs"
  }
  ```
- `.grok/app-env.json` in repo: `{ "VITE_AUTH_ENABLED": "false", "deploy": { "database": false } }`
- Domain **meetingmode.xyz** is already purchased by the owner (Namecheap). It is **not** on Vercel yet and **DNS is not live** (NXDOMAIN). RDAP nameservers: `dns1.registrar-servers.com`, `dns2.registrar-servers.com`

---

## Not done (this is the work)

1. One clean Vercel project, git-linked to `fortblocks/meetingmode`
2. Deployment Protection (Vercel Authentication / SSO) **off** so testers are not behind a login wall
3. Env vars on the project
4. Attach `meetingmode.xyz` + `www.meetingmode.xyz`
5. Point Namecheap DNS at Vercel
6. Smoke-test the live URL (desktop loads, menu bar works). Wrap-up/cues need `XAI_API_KEY`

---

## Vercel

- Team: **Christopher Mair's projects** (Pro)
- Team ID: `team_0seXaE5dYlqYgfcav1ug4zHl`
- Slug: `christopher-mairs-projects-3b5c1820`
- GitHub + Vercel connectors are connected on this Grok account
- Existing healthy project on the team (leave it alone): `returntosauce` (`fortblocks/returntosauce`, domains returntosauce.com)

### Duplicate projects (from a failed MCP git-link)

The owner’s dashboard showed **five** Meeting Mode projects. They were told:

**Keep:** `meetingmode` (`meetingmode.vercel.app`) — already git-linked to `fortblocks/meetingmode`

**Delete:**

- `meetingmodexyz`
- `meeting-mode` (`meeting-mode-eight.vercel.app`)
- `meetingmode-app` (no git repo)
- `meetingmode-xyz` (no git repo, 404)

They may already have deleted these, or they may be importing a **new** project because `meetingmode` was taken. If they import:

- Team: Christopher Mair's projects
- Name: `meetingmode` if free, otherwise a clean name is fine (custom domain does not depend on the slug)
- **Application preset: TanStack Start** (yes — last question in the broken chat)
- Root: `./`
- Build settings: leave default; repo `vercel.json` pins install/build
- Env vars **before** first deploy if possible (see below)

Do **not** create more duplicate projects. Prefer the existing `meetingmode` project if it still exists.

### Env vars (Production + Preview)

| Name | Value |
|---|---|
| `VITE_AUTH_ENABLED` | `false` |
| `XAI_API_KEY` | owner’s xAI key (do **not** copy the sandbox platform key) |

If `VITE_AUTH_ENABLED` is not `"false"`, the deployed app treats auth as ON and will break (no DB / no real sign-in).

### Deployment protection

New team projects default to Vercel Authentication. **Turn it off** or the public site 302s to `vercel.com/login`. MCP tool: `vercel___update_project_deployment_protection` with `ssoProtection: { enabled: false }`.

---

## Domain

Registrar: **Namecheap**. Domain exists but has no public DNS yet.

After the Vercel project exists:

1. Add domains `meetingmode.xyz` and `www.meetingmode.xyz` on the project
2. Either:
   - Switch Namecheap nameservers to Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`), or
   - Keep Namecheap DNS and add the A / CNAME records Vercel shows

There is **no** Vercel MCP tool to attach an already-purchased domain. Use Vercel dashboard, or CLI if a token exists. Do **not** buy the domain again (`buy_domain` / quotes).

---

## Known MCP / connector pitfalls (do not repeat)

- `vercel___create_git_project` reported success then **404 Project not found** on verify. It still created real projects in the owner’s dashboard (MCP `list_projects` only returned `returntosauce`). That is why five duplicates exist.
- Follow-up `get_project` / `list_deployments` / `update_project_deployment_protection` on those new IDs also 404/403 via MCP even when the dashboard showed them.
- `deploy_to_vercel` can create a production deployment URL, but those were SSO-walled; a second production deploy to the same project returned 403.
- Vercel GitHub App originally could not see the new repo (selected-repos). The owner has since imported `fortblocks/meetingmode` from the Vercel UI, so Git access is OK now.
- Do **not** put the sandbox `XAI_API_KEY` on the owner’s Vercel project.
- Do **not** push sandbox files: `AGENTS.md`, `startup.sh`, `.grok/` except `app-env.json`, `screenshots/`, `artifacts/`, `node_modules/`, `.vercel/output`.
- Repo was made **public** so Vercel could import it. Owner can private it later if they want.

Useful MCP once the real project is visible:

- `vercel___list_projects` / `vercel___get_project`
- `vercel___list_deployments` / `vercel___get_deployment` / `vercel___get_deployment_build_logs`
- `vercel___update_project_deployment_protection`
- `vercel___web_fetch_vercel_url` (for SSO-protected URLs)

GitHub: `fortblocks/meetingmode`, credential helper works for `git push`.

---

## What to tell the owner (if they are mid-import)

1. Preset **TanStack Start**, root `./`, deploy
2. Delete leftover MM projects; keep one
3. Protection off
4. Env vars
5. Add `meetingmode.xyz` + `www`, then Namecheap DNS
6. Test: https://meetingmode.xyz (or `*.vercel.app` until DNS propagates)

Success looks like: public URL, no Vercel login, macOS desktop UI, menu bar **Meeting Mode**, Focus on/off. AI features work only after `XAI_API_KEY` is set.

---

## Suggested first message to the new agent

> Continue the Meeting Mode deploy from HANDOVER.md. Do not rebuild the app. Get one Vercel project git-linked to fortblocks/meetingmode, protection off, env VITE_AUTH_ENABLED=false + XAI_API_KEY if the owner provides it, domain meetingmode.xyz attached, and confirm a public URL works. Ask me only if you need me to click something in Vercel or Namecheap.
