# Vyapaar Mitra: Frontend

**The AI Business Copilot for Every Paytm Merchant.** This is a Paytm × AI Hackathon prototype for the Merchant Growth AI track, built by Team Kohinoorr.

It's a concept prototype and not an official Paytm product. All merchant data shown is mock data.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · Lucide React · Poppins (self-hosted via `@fontsource/poppins`)

## Scripts

```bash
npm install
npm run dev        # local dev server
npm run typecheck  # tsc
npm run lint       # oxlint
npm run build      # typecheck + production build
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

The primitives live in `src/components/ui/`: `ClayButton`, `ClayCard`, `ClaySwitch`, `FloatingOrb`, `IconBubble`, `Badge`, `RiskBadge`, `MetricCard`, `InsightCard`, `SectionHeading`, `Container` and `Logo`.

## Build phases

1. ✅ Design system: tokens, type, clay system, buttons/cards, navigation
2. Landing page
3. Application shell + dashboard
4. Agent experience
5. POS + Soundbox
6. Insights, campaigns, customers, sales
7. Responsive/mobile pass
8. Animation and micro-interactions
9. Full QA

## Backend API

The backend is separate. The documented endpoints are `POST /agent/query`, `GET /agent/insights` and `POST /agent/action/approve`. Until the request/response shapes are wired in, the UI runs on mock data.
