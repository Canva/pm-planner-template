# Setup Guide — Planner Template

This is a template copy of a team-planning tool originally built for one marketing/creative
team. It's meant to be **cloned per team** — each program manager runs their own independent
copy on their own devbox, with their own database, their own branding, and their own team roster.
Nothing here talks to the original team's instance or data.

Rough shape of the tool: an intake queue, a capacity/calendar view, per-brief phase tracking, and
weekly Slack summaries, backed by monday.com for intake and Slack for notifications (both optional).

## Before you start — what you're taking on

This app has **no real login system**. There's no password-protected session/JWT layer — the
server trusts a client-sent user ID for role checks, and defaults to full admin access if that ID
is missing or unrecognized. That's an intentional, minimal trade-off in the original build, not
something this template adds. It's fine for a small team on a private tunnel URL that isn't
indexed or shared widely; it is **not** something to expose broadly or rely on for anything
sensitive. If that's a blocker for your team, this needs a real auth layer before you roll it out —
that's a bigger change than anything else in this guide.

## 1. Get your own devbox

Set this up the same way you got the devbox you're reading this on — request/spin up a new one,
don't reuse an existing team's box. Each team's instance needs to be a fully separate machine (or
at least a separate process + database) so that one team's data, restarts, and outages never touch
another's.

## 2. Get the template repo onto it

If this template has been pushed to an internal git remote, clone it:

```bash
git clone <your-internal-remote-url> lifecycle-planner
cd lifecycle-planner
```

Otherwise, copy this directory over (excluding `node_modules`, `.next`, and any `.env`/`*.db` files
— `scripts/setup.sh` recreates all of those for you) and `git init` it yourself so you have a
history to track your own team's customizations against.

**Prerequisite:** Node.js 18+.

## 3. Run the setup script

```bash
bash scripts/setup.sh
```

This does the whole first-time setup in one go:

1. Creates `.env` from `.env.example` (skipped if `.env` already exists) and generates a unique
   `NEXTAUTH_SECRET` for this instance — **never reuse a secret across teams' instances.**
2. Installs dependencies.
3. Runs the database migrations (SQLite file at `prisma/dev.db` by default — no separate DB server
   to stand up).
4. Asks for your name and email and creates that as the first **ADMIN** account. There's no
   sign-up flow in the app itself, so this step is the only way in — the login screen will show
   "No accounts found" until it's done.
5. Builds the app.

Re-running it later is safe — it won't overwrite your `.env` or create a second admin account.

## 4. Start it

For a quick local check:

```bash
npm run start
```

For something that survives you closing the terminal, use pm2 (adjust to however your devbox
normally runs long-lived processes):

```bash
pm2 start pm2.config.js
```

`pm2.config.js` runs two processes: the app itself, and a tunnel (`infra highway`, if you're on a
Canva devbox) so you get a shareable URL. If you're not on that infra, swap the `tunnel` app for
whatever gives you a public URL and update `NEXT_PUBLIC_APP_URL` in `.env` to match.

Set your team's timezone before going to production — it defaults to UTC, and all server-side date
logic (weekly summaries, capacity, leave, calendar "today") runs in whatever `TZ` the process
starts with, not the devbox's local time:

```bash
TEAM_TZ="Asia/Manila" pm2 start pm2.config.js   # example — use your team's zone
```

(If you edit `pm2.config.js` env vars later, restart with `pm2 delete && pm2 start pm2.config.js`
— `pm2 restart --update-env` reads your shell's env, not the config file, and won't pick up the
change.)

## 5. Log in and set your branding

Open the app, pick the account you created in step 3, then go to **Admin → Settings → Branding**
and set your **Tool / Team Name**. That name is what shows in the browser tab, the sidebar logo,
the login screen, and any Slack messages this instance sends — everything else in the UI is
generic and doesn't need renaming.

## 6. Add your team

**Admin → Team**: add each person, their role, weekly capacity, and working days.

Role names in the dropdown are currently a fixed list: Creative, Content Admin, Copywriter,
Manager, Program Manager. If your team uses different role names — including anything that should
behave like "covers every phase automatically" (see below) — add it to `PRESET_ROLES` in
`src/app/admin/team/page.tsx` (one array, one line each) before this step. It's a code edit, not
something togglable from the UI.

Two pieces of role *behavior*, not just labels, live in `src/types/index.ts` and are meant to be
edited per team rather than exposed as UI settings (they change how assignment/capacity logic
works, not just how things look):

- **`ALL_PHASE_ROLES`** — roles that automatically cover every phase of a brief they're assigned
  to (the original team used this for their PM/ACD roles). Add or rename entries to match your
  team's "owns the whole brief" role(s).
- **`ROLE_LOCKED_PHASE`** — roles permanently tied to one specific phase (e.g. a localization
  specialist auto-covers the Localization phase). Empty by default in this template since it's
  specific to how the original team split work; add entries if your team has similar always-on
  roles.

**Admin → Settings → Access & Permissions**: add a login account for anyone who needs to use the
tool, and set their role (Admin / User / Viewer).

## 7. Configure your phase pipeline

**Admin → Phases** is a full UI — add, rename, recolor, reorder, or delete phases, and set how many
hours of capacity each phase consumes per day. This template seeds a generic 11-phase creative
pipeline (Intake → Brief Review → ... → Build → Localization) as a starting point; rename or
prune it to match how your team actually works. No code edits needed for this part.

## 8. Configure your brief types

**Admin → Brief Types** lets you rename, recolor, reorder, add, or remove the categories used to
tag briefs (defaults: Strategic, Task, BAU, Micro). Changes apply immediately, no code edits
needed — with one exception:

**BAU is protected** and can't be renamed, recolored, or deleted from this page. Unlike the other
types, BAU isn't just a label — it skips the phase pipeline entirely and changes several field
labels elsewhere in the app (e.g. "Project name" instead of "Brief name"). If your team doesn't
use that no-pipeline workflow at all, just don't use the BAU type when creating briefs; if you want
a *different* no-pipeline type, that's a code change (search `=== "BAU"` in `src/app/intake/`,
`src/components/tasks/kanban-board.tsx`, and `src/app/tasks/[id]/page.tsx`), not something to force
through this page.

## 9. Connect monday.com and Slack (optional, both independent)

Both live under **Admin → Settings** and are stored per-instance in the database — nothing to put
in `.env` for these.

**monday.com** — paste your Board ID and API token (from your monday.com profile → Developers →
My Access Tokens), then in monday.com go to your board → Integrate → Webhooks and point a webhook
at `https://<your-app-url>/api/monday/webhook`, subscribed to `create_pulse`,
`move_pulse_to_group`, and `change_column_value`. Click "Sync monday" in the app to pull existing
items.

**Slack** — create a Slack app (api.slack.com/apps) with `chat:write` and `chat:write.public`
scopes, install it to your workspace, copy the bot token (`xoxb-...`), invite the bot to your
target channel, and paste the token + channel ID into Admin → Settings. Use the "Send test
message" button there to confirm it's wired up before relying on it.

## 10. Back up your data

`scripts/backup-db.sh` dumps the SQLite database to `prisma/backup.sql` and commits+pushes it to
this repo's git remote. It expects this repo to actually have a remote with push access — point it
at your own team's repo, then wire it up on a schedule (the original team used a system crontab
entry, not pm2's `cron_restart`, since it's more reliable):

```
0 */3 * * * cd <this-repo> && bash scripts/backup-db.sh >> logs/backup.log 2>&1
```

If you'd rather not auto-push backups to git, this script is a fine reference to swap for
whatever your team's normal backup destination is.

## What's genuinely per-team vs. shared code

If you're wondering what you can safely change without it being "hacking on a copy of someone
else's tool":

| Change it via | Examples |
|---|---|
| Admin UI (no code) | team name/branding, team roster, capacity, phases, brief types (except BAU), monday/Slack config, user accounts |
| One-line code edit | adding a new role name (`PRESET_ROLES`), all-phase / locked-phase role behavior (`ALL_PHASE_ROLES`, `ROLE_LOCKED_PHASE` in `src/types/index.ts`) |
| Not supported via UI | changing BAU's no-pipeline behavior, or giving another brief type the same treatment (`PROTECTED_WORK_TYPES` in `src/types/index.ts`, plus the `=== "BAU"` checks it protects) |
| Bigger change | adding real authentication, moving off SQLite to a shared Postgres, multi-team support in one deployment |

Everything under "Admin UI" is exactly what it sounds like — safe to click around and change
without touching a file. The one-line edits are still just config, but they live in source so
they're versioned; commit them like any other change once your team's setup is finalized.
