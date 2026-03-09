# Mass Impact Web

Next.js frontend for the shared household workout PWA defined in `../plan.md` and `../frontend-design.md`.

## Getting Started

Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Set a shared household code (optional, defaults to `massimpact`):

```bash
# .env.local
NEXT_PUBLIC_HOUSEHOLD_CODE=your-shared-code
# Optional: locks template publish/edit controls until entered
NEXT_PUBLIC_OWNER_PIN=1234
```

Primary routes:

- `/` (`Today` runtime with live set console and auto rest timer)
- `/planner`
- `/progress`
- `/templates`
- `/settings`

## Tooling

```bash
npm run lint
npm run build
```

## Current Scope

- Iron Ledger visual system (colors, typography, motion, responsive shell)
- Core screen architecture and component primitives
- PWA manifest baseline (`src/app/manifest.ts`)
- Shared household code gate with cookie unlock persistence
- Optional owner PIN gate for template edit/publish actions
- Mocked runtime data and sync states for UI behavior validation

## Next Build Steps

1. Add per-track owner/partner role toggles in Templates and Settings.
2. Replace mock workout/template/planner data with API-backed state.
3. Add offline write queue and ordered replay for set logs.
