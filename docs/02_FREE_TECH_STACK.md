# Free Tech Stack

The project uses only free, local-first tooling. No paid services, no API keys, no cloud database.

## Runtime / Build
- **React 18** + **TypeScript** — UI
- **Vite** — dev server + build
- **Tailwind CSS** (+ PostCSS, Autoprefixer) — styling
- **React Router** — routing
- **lucide-react** — icons
- **date-fns** — date utilities

## Persistence
- **Browser localStorage** only (no backend). See `docs/03_ARCHITECTURE.md`.

## Phase Two Dependency Note
**No new dependencies were added in Phase Two.** All new modules (Members, Meetings, Sponsors, Budget, Approvals, Files, Reports), global search, Attention Center, and Data Tools were built with the existing stack and plain React Context for state.

If a package is ever added, justify it here and in `CHANGELOG.md` first. Avoid global state libraries (Redux/Zustand) and any paid SDKs.
