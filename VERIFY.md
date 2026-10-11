# Verification map
Live URL: https://www.studymaster.live (Vercel project `studymaster`, also on its *.vercel.app URL)
Backend: https://studymaster-ai-backend.onrender.com (Render, repo `Abdullah-webd/studymaster-ai-backend`)
Deploy: push `main` to `origin` (github.com/Abdullah-webd/newstudymasterfrontend) → Vercel builds it.
Start for tests: `npm run build && npx next start -p 3100` with `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`
(the local backend must allow http://localhost:3100 in CORS_ORIGINS).

## Checks
- Public pages: `node ~/.claude/skills/ship-verify/scripts/smoke.mjs <url> --out .verify`
  (run from a folder that has Playwright and a copy of `.verifyignore`).
- Logged-in pages: authed crawl of /dashboard /notes /pastquestions /exam /roadmap /coach
  /community /gaming /settings /live-learning with the `_e2e_browser@studymaster.test` account.
- Live Learning critical flow: `tools/browser-test/live/` in the parent folder (fake-mic lesson:
  preparing screen → teaching → page turns → quiz → result saved).

## Critical flows
- Sign in (email/password, Google) → dashboard
- Live Learning: required form → notebook prepared → live lesson → quiz score saved
- Notes, past questions, exam, coach, roadmap (needs onboarding subjects)

## Known non-issues
- Google sign-in button 403 "origin is not allowed" on origins not listed in the Google OAuth
  client (localhost:3100, preview URLs). Add the origin in Google Cloud if sign-in is needed there.
- `/_vercel/insights/script.js` 404 locally (Vercel Analytics only exists on Vercel).
- `/roadmap` shows "Finish onboarding…" (400) for accounts without subjects — intended.
- `/timetable` is an unlinked legacy page whose API was retired (Roadmap replaced it).
- `GET /api/v1/questions` with NO filters fails (sorts all 23k questions in memory); the app
  always sends filters.
