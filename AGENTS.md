# AGENTS.md — Radio Rugido Player

## Commands

```sh
npm install          # install dependencies
npm run dev          # dev server at http://localhost:3000
npm run build        # production build to dist/
npm run preview      # preview production build
npm run lint         # tsc --noEmit (only typecheck — no ESLint/Prettier)
```

## Architecture

- **Two views**: `CabinView` (DJ cabina — playlist, transport, FX) and `BroadcastView` (OBS overlay — now-playing, vinyl animation, ticker).
- **State**: React hooks in `App.tsx`, no external state lib.
- **Audio playback**: raw `HTMLAudioElement` via refs + `File` → `URL.createObjectURL()`.
- **Visualizer**: canvas-based, **procedural/synthetic** levels — not real-time audio analysis.
- **Sound effects** (`utils/audioEffects.ts`): Web Audio API oscillators (dub siren, laser, airhorn, rewind).
- **All UI text in Spanish** — keep it that way.

## Framework quirks

- **Tailwind v4**: no `tailwind.config.js` — use `@import "tailwindcss"` in CSS, `@theme` for design tokens, `@apply` for component classes.
- **Path alias**: `@/*` maps to repo root (e.g. `@/src/components/CabinView`).
- **HMR**: set `DISABLE_HMR=true` to disable file watching (AI Studio agent editing mode).
- **`@google/genai` SDK** available; `GEMINI_API_KEY` required in `.env.local`.
- **No test framework** configured.
- **OpenCode skills** at `.agents/skills/` (locked in `skills-lock.json`).
