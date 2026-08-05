# Mobile App Redesign — Setup

## 1. Install the icon library

```
npm install lucide-react
```

## 2. Copy these new/changed files into your project

**New files:**
- `components/AppShell.tsx` — the shared shell (desktop sidebar / mobile bottom nav + top bar)
- `app/more/page.tsx` — mobile "More" tab (Currencies, Staff Transfers, Expenses)
- `app/manifest.ts` — makes the app installable ("Add to Home Screen") on phones
- `public/icon-192.png`, `public/icon-512.png` — placeholder app icons (swap these for
  your real logo whenever you have one — same filenames, same sizes)

**Replaced files (all rewritten to use AppShell):**
- `app/layout.tsx` — adds PWA meta tags (theme color, apple-mobile-web-app)
- `app/globals.css` — refined design tokens (indigo palette, rounder corners, softer shadows)
- `app/login/page.tsx`
- `app/dashboard/page.tsx` — now a "home screen" with a shortcut grid instead of a plain list
- `app/currencies/page.tsx`
- `app/customers/page.tsx`
- `app/customers/[id]/page.tsx`
- `app/transactions/page.tsx`
- `app/transactions/new/page.tsx`
- `app/transactions/[id]/page.tsx`
- `app/staff-transfers/page.tsx`
- `app/expenses/page.tsx`
- `app/reports/page.tsx`

## 3. What changed, structurally

- **Navigation is now real app navigation**, not repeated `<a>` tags per page:
  - On phones: fixed bottom tab bar (Home, Transact, Customers, Reports, More) + a
    slim top bar with just the logo and logout.
  - On desktop/tablet: a proper left sidebar with all sections.
  - Currencies, Staff Transfers, and Expenses live under the "More" tab on mobile
    (5 items is the practical limit for a bottom nav) but are all directly visible
    in the desktop sidebar.
- **Every page is wrapped in `<AppShell title="..." subtitle="..." actions={...}>`**,
  which handles the header, spacing, and safe-area padding consistently — no more
  copy-pasted `<div className="page">` + manual back-links on every page.
- **Tables scroll horizontally on narrow phone screens** instead of squashing/breaking.
- **Installable**: on Android Chrome, visiting the site will offer "Add to Home Screen"
  automatically (uses `app/manifest.ts`); on iOS Safari, use Share → "Add to Home Screen"
  — the `apple-mobile-web-app` meta tags in `layout.tsx` make it open full-screen without
  Safari's address bar, like a real app.

## 4. Test

```
npm run dev
```

Open it on an actual phone on the same network (or Chrome DevTools device toolbar) to see
the bottom nav and shortcut grid — the desktop sidebar view only shows above the `md`
breakpoint (768px), so resize your browser window to compare both.

To test installability on Android: open the site in Chrome on your phone → menu (⋮) →
"Add to Home screen" → it should launch full-screen with the indigo "ES" icon.
