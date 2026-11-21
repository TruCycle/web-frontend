# TruCycle redesign: style guide (charcoal and mint)

Approved 21 Nov 2026. This is the reference for restyling any screen. The
design boards are the source of truth for a screen; this page is the shared
vocabulary so that every screen comes out the same.

## 1. Rules

A restyle changes how a screen looks and nothing else.

- Change `className` strings (and the `variant` of a shared part) only.
- Do not add, remove, reorder or rename elements, props, handlers, hooks,
  state, form field names, text, `aria-*`, `role`, `id`, or `data-*`.
- Do not touch `src/features/*/api|hooks|lib`, `src/shared/lib`,
  `src/shared/context`, `src/app/routes/AppRoutes.tsx`, `backend`, `workers`,
  `scripts`, `.github`.
- Keep every animation class name (`tc-shimmer-block`, `tc-landing-fade-up`,
  `animate-float`, `animate-pulse-soft`, `animate-impact-glow`, `tc-fab-bob`,
  `animate-ping`, `animate-spin`, `hover:-translate-y-0.5` ...).
- Keep responsive behaviour: every `sm:` / `md:` / `lg:` layout class that
  exists today must still have an equivalent. Phone width (390 px) must not
  scroll sideways.
- Text copy on a board may differ from the code. The code's text wins.
- Touch targets stay at least 44 px high. Text contrast at least 4.5:1.

Checks, run from the repo root:

```bash
node tools/restyle-guard.mjs --only src/features/<folder>
```

```bash
node tools/palette-check.mjs src/features/<folder>
```

```bash
npx tsc --noEmit -p tsconfig.app.json
```

```bash
npx eslint src/features/<folder>
```

## 2. Colour tokens

Use these classes. Never write a hex value in a class name.

| Use | Class stem | Value |
|---|---|---|
| Charcoal: side menu, primary button, strong chip | `tc-brand-deep` | `#232323` |
| Charcoal, hover and raised on charcoal | `tc-brand-hover` | `#333333` |
| Mint: the single accent | `tc-brand-mint` | `#8EE3A8` |
| Mint, hover | `tc-brand-mintHover` | `#7AD897` |
| Text on mint | `tc-brand-onMint` | `#0B1F16` |
| Pale mint: tinted card, selected row, icon disc, soft badge | `tc-brand-mintSoft` | `#DDF4E3` |
| Border on pale mint | `tc-brand-mintLine` | `#A9D9B9` |
| Page background | `tc-brand-haze` | `#F7FBF4` |
| Card and panel | `tc-brand-surface` (or `white`) | `#FFFFFF` |
| Quiet fill: inset panel, disabled, table head | `tc-brand-soft` | `#F0F3ED` |
| Progress track | `tc-brand-track` | `#B4BFB8` |
| Headings and main text | `tc-brand-ink` | `#0F1510` |
| Body text, descriptions | `tc-brand-body` | `#4A554C` |
| Captions, meta, placeholders | `tc-brand-muted` | `#5C6B63` |
| Hairline: card border, divider | `tc-brand-line` | `#E6EAE4` |
| Control border: input, outline button | `tc-brand-control` | `#87928A` |
| Text on charcoal (not active) | `tc-brand-onDeep` | `#C9CEC9` |
| Divider on charcoal | `tc-brand-deepLine` | `#3D3D3D` |
| Error text, destructive | `tc-brand-danger` | `#B3261E` |
| Error background / border | `tc-brand-dangerSoft` / `tc-brand-dangerLine` | `#FBEDEC` / `#E5B4B0` |

Prefix as usual: `bg-tc-brand-deep`, `text-tc-brand-body`,
`border-tc-brand-line`, `ring-tc-brand-mint`, with opacity where needed
(`bg-tc-brand-mint/20`).

Status colours: live = `bg-emerald-600` dot or mint chip; claimed =
`amber-*` (kept); rescued / closed = `tc-brand-muted` on `tc-brand-soft`;
fly-tipped and errors = `tc-brand-danger`.

Tailwind's `slate`, `gray`, `zinc`, `neutral`, `lime`, `emerald`, `green`,
`rose` and `red` scales are re-pointed at this palette in
`tailwind.config.js`, so old classes already look close. When you edit a
line, prefer the `tc-brand-*` name.

### Replacing old hard-coded colours

| Old | As background | As text | As border |
|---|---|---|---|
| `#0B3322`, `#0D3B24`, `#111611`, `#1B231B`, `#121212`, `#222222`, `#172033` | `tc-brand-deep` | `tc-brand-ink` | `tc-brand-deep` |
| `#222222BF`, `#121212B3`, `#121212BF` | n/a | `tc-brand-body` | `tc-brand-control` |
| `#12121299`, `#22222299`, `#64748B` | n/a | `tc-brand-muted` | `tc-brand-control` |
| `#E2E8F0`, `#CBD5E1` | `tc-brand-line` | n/a | `tc-brand-line` |
| `#F8FAFC`, `#F7FBF4`, `#F8FCF7`, `#F3F8F4`, `#F7FAF1` | `tc-brand-haze` | n/a | n/a |
| `#F3F5EE`, `#F2F4EC` | `tc-brand-soft` | n/a | n/a |
| `#EAF6DA`, `#E8F6EE`, `#F4FAEA`, `#EEF5E3`, `#E9FCE8`, `#D7E8C2`, any mint or green at 5 to 25 % alpha | `tc-brand-mintSoft` | n/a | `tc-brand-mintLine` |
| `#A4F5A6`, `#8EEA93`, `#9EDB7D`, `#87C15F`, `#34DA45`, `#2FC749`, `#15A119`, `#2F9D7E` | `tc-brand-mint` with `text-tc-brand-onMint` | on dark: `tc-brand-mint`; on light: `tc-brand-ink` | `tc-brand-mintLine` |
| `#1A7F37`, `#166534`, `#3A7618`, `#55741D`, `#446B16`, `#3A5C12`, `#29470C` | `tc-brand-deep` | `tc-brand-ink` (or `emerald-700` for a success message) | `tc-brand-mintLine` |

Green text on a light background is not part of the new look: use ink.
White text on mint is not allowed (contrast): use `text-tc-brand-onMint`.
Gradients go, except where a board shows one: use a flat token colour.

## 3. Shape, type, shadow

| Thing | Class |
|---|---|
| Chip, small control, role switch segment | `rounded-tc-sm` (8 px) |
| Button, input, select, menu row, nav row | `rounded-tc-md` (12 px) |
| Card | `rounded-tc-lg` (18 px) |
| Side menu, dialog, large panel | `rounded-tc-xl` (24 px) |
| Badge, avatar, icon disc, floating button | `rounded-full` |
| Card at rest | border only, no shadow |
| Raised control / menu / toast | `shadow-tc-card` or `shadow-tc-raised` |
| Dialog | `shadow-tc-dialog` |
| Avatar halo | `shadow-tc-halo` |

Type: Inter. Weights 500 and 600 only for emphasis (replace `font-bold`,
`font-extrabold`, `font-black` with `font-semibold`; keep `font-medium`).

| Role | Classes |
|---|---|
| Page title | `text-[30px] leading-9 font-semibold tracking-[-0.02em] text-tc-brand-ink` |
| Page subtitle | `text-base leading-6 text-tc-brand-body` |
| Card title | `text-xl leading-7 font-semibold tracking-[-0.015em] text-tc-brand-ink` |
| Card subtitle, caption | `text-[13px] leading-5 text-tc-brand-muted` |
| Body | `text-sm leading-5 text-tc-brand-ink` |
| Big number | `text-[30px] leading-9 font-semibold tracking-[-0.02em] tabular-nums` |
| Hero number | `text-5xl leading-none font-semibold tracking-[-0.03em] tabular-nums` |
| Small label / badge | `text-xs leading-4 font-semibold` |
| Public page display heading | `font-semibold tracking-[-0.03em] text-tc-brand-ink` |

## 4. Recipes

Take the look from these. Keep the element's existing layout classes
(flex, grid, gap, width, responsive prefixes) unless the board differs.

| Part | Classes |
|---|---|
| Page canvas | `bg-tc-brand-haze` |
| Page content | `mx-auto max-w-[1120px]`, vertical gap `gap-6`, page padding `p-4 sm:p-8` |
| Card | `rounded-tc-lg border border-tc-brand-line bg-white p-6` |
| Tinted card (hero stat, streak banner) | `rounded-tc-lg border border-tc-brand-mintLine bg-tc-brand-mintSoft p-6` |
| Inset panel inside a card | `rounded-tc-md bg-tc-brand-soft p-4` |
| Empty state box | `rounded-tc-lg border border-dashed border-tc-brand-control bg-white p-8 text-center text-tc-brand-body` |
| Row in a list | `flex items-center justify-between gap-4 border-t border-tc-brand-line py-3.5` |
| Primary button | `inline-flex min-h-11 items-center justify-center gap-2 rounded-tc-md bg-tc-brand-deep px-4 py-3 text-sm font-semibold text-white transition hover:bg-tc-brand-hover` |
| Accent button (one per view at most) | same, with `bg-tc-brand-mint text-tc-brand-onMint hover:bg-tc-brand-mintHover` |
| Outline button | same, with `border border-tc-brand-control bg-white text-tc-brand-deep hover:bg-tc-brand-soft` |
| Quiet / text button | `rounded-tc-md px-3 py-2 text-sm font-semibold text-tc-brand-deep hover:bg-tc-brand-soft` |
| Destructive button | outline button with `border-tc-brand-dangerLine text-tc-brand-danger hover:bg-tc-brand-dangerSoft` |
| Disabled | `disabled:cursor-not-allowed disabled:opacity-50` |
| Input, select, textarea | `min-h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:outline-none focus:ring-2 focus:ring-tc-brand-mint` |
| Field label | `text-sm font-semibold text-tc-brand-ink` |
| Help text / error text | `text-[13px] leading-5 text-tc-brand-muted` / `text-tc-brand-danger` |
| Error banner | `rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger` |
| Soft badge | `inline-flex items-center rounded-full bg-tc-brand-mintSoft px-2.5 py-1 text-xs font-semibold text-tc-brand-deep` |
| Strong badge | `inline-flex items-center gap-1.5 rounded-full bg-tc-brand-deep px-2.5 py-1 text-xs font-semibold text-white` (mint 8 px dot allowed) |
| Neutral badge | `rounded-full bg-tc-brand-soft px-2.5 py-1 text-xs font-semibold text-tc-brand-body` |
| Icon disc | `flex h-10 w-10 items-center justify-center rounded-full bg-tc-brand-mintSoft text-tc-brand-deep` |
| Segmented tabs (track) | `inline-flex gap-1 rounded-tc-md bg-tc-brand-soft p-1` |
| Segmented tab | `min-h-9 rounded-tc-sm px-3 text-sm font-medium text-tc-brand-body`; active: `bg-white font-semibold text-tc-brand-ink shadow-tc-card` |
| Filter chip | `rounded-full border border-tc-brand-control bg-white px-3.5 py-2 text-sm font-medium text-tc-brand-deep`; active: `border-tc-brand-deep bg-tc-brand-deep text-white` |
| Progress bar | track `h-2 rounded-full bg-tc-brand-track`, fill `rounded-full bg-tc-brand-deep` |
| Avatar (initials) | `rounded-full bg-tc-brand-deep text-white font-semibold` (current user: add `shadow-tc-halo`) |
| Link in text | `font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black` |
| Dialog panel | `rounded-tc-xl bg-white shadow-tc-dialog`; overlay `bg-tc-brand-ink/55` |
| Dialog header / footer | title as card title; footer `border-t border-tc-brand-line`, buttons right-aligned |
| Table head | `bg-tc-brand-soft text-xs font-semibold uppercase tracking-wide text-tc-brand-muted` |
| Map / photo placeholder | `bg-tc-brand-soft` |

On charcoal (side menu, dark hero panels): background `bg-tc-brand-deep`,
text `text-tc-brand-onDeep`, active row `bg-tc-brand-hover text-white`,
dividers `border-tc-brand-deepLine`, accent `tc-brand-mint`.
