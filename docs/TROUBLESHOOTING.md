# FlowCanvas — Troubleshooting

Quick reference for production and preview debugging. Console diagnostics use consistent prefixes: `[FlowCanvas]`, `[OrgGraph]`, `[ViewportPersistence]`, `[CanvasEvents]`, `[Presence]`, `[AuthClient]`, `[Firebase]`.

## Required environment variables

| Variable | Where | Must match |
|----------|-------|------------|
| `NEXT_PUBLIC_API_URL` | Vercel | Railway/Render API public URL |
| `NEXT_PUBLIC_APP_URL` | Vercel | Exact browser origin (no trailing slash) |
| `NEXT_PUBLIC_ORG_ID` | Vercel | Org UUID from `pnpm db:seed` |
| `DATABASE_URL` | Vercel + Railway | Same Neon database |
| `BETTER_AUTH_SECRET` | Vercel + Railway | **Identical** on both |
| `BETTER_AUTH_URL` | Vercel + Railway | Production: `https://your-app.vercel.app` |
| `APP_URL` / `CORS_ORIGIN` | Railway | Same as `NEXT_PUBLIC_APP_URL` |
| `NEXT_PUBLIC_FIREBASE_*` | Vercel | Firebase web app for your project |

**Preview deployments:** Each Vercel preview has its own URL. Set `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` to that preview URL for that environment, or auth cookies and CORS will not align with the API.

See `.env.local.example` for local development.

---

## Known failure modes

### React error #185 — maximum update depth exceeded

**Symptom:** Blank canvas, React minified error #185 in console.

**Cause:** A `useEffect` repeatedly calls `setNodes` / `setEdges` without a transition guard (often on mount when cascade or project wiring runs with null → null transitions).

**Check:**

1. Filter console for `[FlowCanvas]` — look for cascade/project wiring firing repeatedly.
2. Confirm guards: `cascade clear skipped: initial mount`, `edge restore skipped: initial mount`.
3. Ensure project wiring effect does **not** list `nodes` in its dependency array.

**Not the same as:** a full-page reload loop (see below).

### Full-page reload every few seconds

**Symptom:** Entire app reloads, URL bar flashes.

**Cause:** Usually **not** React #185. Inspect client fetch helpers for `window.location.href` redirects on 401. FlowCanvas API client throws `UNAUTHORIZED` instead; middleware handles `/login`.

**Check:** Network tab — repeated document navigations vs XHR 401s only.

### Firestore "Database not found" / unavailable

**Symptom:** `[CanvasEvents] Firestore unavailable` or `[Presence] Firestore unavailable, presence disabled`.

**Cause:** Firestore not created, wrong `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, or rules not deployed.

**Fix:** Create Firestore in Firebase console, deploy rules (`firebase deploy --only firestore:rules`), verify all `NEXT_PUBLIC_FIREBASE_*` in Vercel.

**Expected:** App keeps working; realtime events and presence are disabled silently.

### Railway 401 on viewport or graph APIs

**Symptom:** `[ViewportPersistence] 401 on saveViewport` or graph shows "Session expired".

**Cause:** Session cookie missing or `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` mismatch with the tab origin.

**Fix:** Sign in again; align auth URLs with the exact deployment URL; ensure `credentials: 'include'` on API calls (default in `apiClient`).

### Preview URL vs production URL auth mismatch

**Symptom:** Works on production domain, 401 on `*.vercel.app` preview.

**Cause:** Better Auth and CORS are bound to `APP_URL` / `BETTER_AUTH_URL` for one origin.

**Fix:** Configure Vercel preview env vars for that preview’s URL, or test on production only.

### Task drag snaps back after drop

**Symptom:** Node jumps back until refresh.

**Cause:** Server PATCH lagging without optimistic cache update.

**Check:** `[OrgGraph] optimistic drag position applied` on drop; `[OrgGraph] drag position saved` on success; rollback message on failure.

---

## Debugging checklist

1. **Render loop vs reload loop** — #185 in console without full document reload = effect/store loop. Full reload = redirect or hard navigation.
2. **Auth origin** — `[AuthClient] baseURL resolved to ...` must match the browser address bar.
3. **Firestore** — `[Firebase] env vars missing` = not configured; `permission-denied` = rules; `not-found` = database not created.
4. **Optimistic drag** — Drop task → immediate `[OrgGraph] optimistic drag position applied` → after debounce, success or rollback log.
5. **Mount guards** — On idle load, expect `[FlowCanvas] cascade clear skipped: initial mount` once, not repeated `setNodes` churn.
6. **Production API** — `PROD_API_URL=... NEXT_PUBLIC_ORG_ID=... pnpm diagnose:prod`

---

## Deployment verification

After deploy:

1. Sign in at `/login` — no redirect loop between `/` and `/login`.
2. Canvas idle 2+ minutes — no flicker, no reload loop.
3. Drag task — position holds; refresh shows same coordinates.
4. Expand/collapse project — phases appear.
5. Semantic zoom — project/task visibility at different zoom levels.
6. Optional: second browser — presence chips (if Firebase configured).

**If the site reloads every few seconds:** inspect client fetch redirects first, then middleware redirect rules.
