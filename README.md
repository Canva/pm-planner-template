# Planner Template

A team work-planning tool — intake queue, capacity/calendar view, per-brief phase tracking, and
weekly Slack summaries. This is a template: clone it once per team, each running its own
independent instance.

**Setting this up for your team? Start with [SETUP_GUIDE.md](./SETUP_GUIDE.md).**

## Local development

```bash
npm install
npx prisma generate
npx prisma migrate deploy
node prisma/seed.mjs   # set ADMIN_NAME / ADMIN_EMAIL env vars first
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`scripts/setup.sh` wraps all of the above (plus secret generation and a production build) into one
command — see the setup guide for the full walkthrough, including branding, team roster,
monday.com/Slack, and deployment.
