# Vyapaar Mitra: Frontend

**The AI Business Copilot for Every Paytm Merchant.** This is a Paytm × AI Hackathon prototype for the Merchant Growth AI track, built by Team Kohinoorr.

It's a concept prototype and not an official Paytm product. All merchant data shown is mock data.

The app is the merchant's own copilot. Ramesh signs in and uses it on his phone or the shop-counter laptop.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router · Zustand · TanStack Query · Recharts · Framer Motion · Lucide React · react-i18next · Poppins (self-hosted via `@fontsource/poppins`, includes Devanagari)

## Scripts

```bash
npm install
npm run dev        # local dev server
npm run typecheck  # tsc
npm run lint       # oxlint
npm run build      # typecheck + production build
npm run build:static  # build that opens from any static host or folder (hash URLs, relative paths) → dist-static/
```

## Design system

The tokens live in `src/index.css`, inside the `@theme` block.

| Token | Value | Use |
|---|---|---|
| `paytm-blue` | `#002E6E` | Headings, navigation, primary CTA, trust |
| `paytm-cyan` | `#00B9F1` | AI accents, active states, data viz |
| `cloud` | `#F4FAFF` | Page background |
| `slate` | `#425466` | Secondary text |

- **Type scale utilities:** `text-hero`, `text-section`, `text-card`, `text-body-lg`, `text-body`, `text-eyebrow`
- **Clay utilities:** `clay-card` (raised), `clay-soft`, `clay-inset`, `clay-blue`, `clay-button` (hover lift / press squash) and `clay-lift` (hover lift for cards). The shadow recipes are defined once as `--clay-shadow-*` variables.

The primitives live in `src/components/ui/`: `ClayButton`, `ClayCard`, `ClaySwitch`, `FloatingOrb`, `IconBubble`, `Badge`, `RiskBadge`, `MetricCard`, `InsightCard`, `SectionHeading`, `Container`, `Logo`, `OtpInput` and `SegmentedChoice`.

An internal reference page for the design system lives at `/design-system`.

## Illustrations

One clay mascot, **Mitra**, appears across the app, with a supporting merchant character on onboarding. Every picture is a transparent WebP under 60 KB in `public/illustrations/`, drawn through one component:

```tsx
<Illustration name="mitra-empty" alt="" />      // lazy-loaded
<Illustration name="mitra-celebrate" hero />    // hero: loads eagerly and floats gently
```

The full list, with sizes and where each one is used, is in `src/components/illustrations/manifest.ts`. Entries marked `placeholder: true` are stand-ins. **To swap in final art, drop a WebP with the same file name into `public/illustrations/`** (keep a similar aspect ratio, or update the size in the manifest). No code change is needed.

- Mitra's hero wave is two layers (`mitra-wave-body` + `mitra-wave-hand`, same canvas) so the arm can rotate about the elbow. If only `mitra-wave` is replaced, delete the two layer files and the hero falls back to the single image.
- Blinks are drawn over the art in code (`Eyelids.tsx`), aligned to the current eye positions. New art needs new eye coordinates in `MitraHero.tsx` / `MerchantPayment.tsx`.
- Only hero illustrations float. Everything animated respects `prefers-reduced-motion`.
- No clay imagery on loan terms, data tables or charts.
- Source art and the scripts that made the cut-outs and placeholders are in `design/characters/` and `design/illustrations/`.

## Languages

Hinglish is the default, with English, Hindi and Marathi. Strings live in `src/i18n/locales/`; `en.ts` is the source and the other three must have exactly the same keys (TypeScript enforces this). The language picker changes the whole UI, `<html lang>`, and the read-aloud voice.

## App structure

```
src/
  pages/            Login, Onboarding, Home, Actions, Campaigns, Regulars, Credit, Impact, AskMitra, Settings
  components/
    ui/             clay primitives
    layout/         AppShell, Sidebar (≥768px), BottomTabs + MoreSheet (<768px), route guards
    auth/           sign-in frame with Mitra
    trust/          Trust Settings panels (onboarding and Settings share them)
    language/       language picker and header language switch
    illustrations/  <Illustration>, the animated Mitra hero, manifest of every picture
  i18n/             i18next setup, language list, locales (en, hinglish, hi, mr)
  mocks/            types.ts (API contract), seed.ts (Ramesh story), server.ts (mock routes)
  lib/api.ts        typed API client (mock or real backend)
  lib/trust.ts      trust defaults and limits shared by the UI and the mock
  lib/speech.ts     read-aloud (Web Speech API) in the chosen language
  hooks/queries.ts  TanStack Query hooks and mutations
  store/            Zustand: session + preferences (persisted), onboarding draft, shell UI state
```

## API

With no `VITE_API_BASE_URL` set, every request is served in the browser by `src/mocks/server.ts`, with 300–900 ms of simulated latency. Mock state is saved to `localStorage`, so approvals and undos survive a refresh. To point at the real backend, set `VITE_API_BASE_URL=https://…` in `.env.local`.

| Method | Path | Used for |
|---|---|---|
| POST | `/agent/query` | Ask Mitra answers (text + small card) |
| GET | `/agent/insights` | Morning briefing and ranked insights |
| GET | `/agent/actions` | Action Center |
| POST | `/agent/action/approve` | Approve / reject / pause / resume / undo (`{ actionId, decision, edits? }`) |
| PUT | `/agent/settings/trust` | Save trust settings (loans are always forced to `recommend_only`) |
| GET | `/agent/outcomes` | Impact and learning |
| GET | `/agent/cashflow` | 14-day cashflow forecast |

The mock also serves these helpers, which are **not** in the documented backend API: `GET /agent/settings/trust`, `GET /agent/campaigns`, `GET /agent/regulars` and `GET /merchant/profile`.

Sign-in is mocked too: `POST /auth/otp` (`{ phone }`) and `POST /auth/verify` (`{ phone, otp }`). Any 10-digit mobile number starting with 6–9 works, and any 6-digit OTP except `000000` (which returns a wrong-OTP error, to show that state).

## Build phases

1. ✅ Setup, design tokens, responsive shell, routing, store, mock API + seed data
2. ✅ Login, onboarding, Trust Settings, i18n
3. Home briefing, insight cards, read-aloud
4. Action Center, Why panel, approve/undo
5. Campaigns + Regulars
6. Credit & Cashflow
7. Impact / Learning
8. Ask Mitra (chat + voice)
9. Settings, polish, loading/empty/error states, accessibility
