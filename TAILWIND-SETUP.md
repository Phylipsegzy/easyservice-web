# Adding Tailwind CSS

Since your project was originally scaffolded without Tailwind, install it now:

```
npm install -D tailwindcss postcss autoprefixer
```

Then copy these three files from this package into your project root / app folder,
overwriting what's there:

- `tailwind.config.js` (project root)
- `postcss.config.js` (project root)
- `app/globals.css` (replaces the existing one)

Also replace every page file with the versions in this package — they've all been
rewritten to use Tailwind utility classes instead of inline `style={{}}` objects:

- `app/layout.tsx`
- `app/login/page.tsx`
- `app/dashboard/page.tsx`
- `app/currencies/page.tsx`
- `app/customers/page.tsx`
- `app/customers/[id]/page.tsx`
- `app/transactions/page.tsx`
- `app/transactions/new/page.tsx`
- `app/transactions/[id]/page.tsx`
- `app/staff-transfers/page.tsx`
- `app/expenses/page.tsx`
- `app/reports/page.tsx`

Restart `npm run dev` after copying everything over.

## Design system

Reusable classes are defined once in `app/globals.css` under `@layer components`,
so pages stay simple (`className="btn"` instead of a long utility string repeated
everywhere):

- `.btn`, `.btn-outline`, `.btn-danger`, `.btn-ghost` — buttons
- `.input`, `.label` — form fields
- `.card` — white rounded panel
- `.stat-card`, `.stat-label`, `.stat-value` — dashboard number tiles
- `.table-wrap` — wraps `<table>` with the card styling
- `.badge`, `.badge-pending`, `.badge-completed`, `.badge-active`, `.badge-inactive` — status pills
- `.nav-bar`, `.nav-link` — top navigation on the dashboard
- `.page` — standard page padding/max-width wrapper

If you want to adjust the look later (colors, spacing, etc.), it's all in one place:
`app/globals.css`.
