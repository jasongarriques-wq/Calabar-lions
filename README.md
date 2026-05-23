# Calabar Lions

The digital home of the Calabar Lions network &mdash; a community of
people who trace their roots, schooling, work, or heart to Calabar.

## Stack

- [Next.js 15](https://nextjs.org/) (App Router) on the [Vercel](https://vercel.com/) platform
- [React 19](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- TypeScript

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Scripts

| Command            | What it does                              |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Start the dev server                      |
| `npm run build`    | Production build                          |
| `npm run start`    | Serve the production build                |
| `npm run lint`     | ESLint (Next.js core-web-vitals)          |
| `npm run typecheck`| `tsc --noEmit`                            |

## Project layout

```
src/
  app/
    layout.tsx        # Root layout
    page.tsx          # Landing page
    globals.css       # Tailwind entrypoint
    api/join/route.ts # POST /api/join (membership form handler)
  components/
    join-form.tsx     # Client-side "join the pride" form
```

## Deployment

This repo is configured to deploy via Vercel. Pushes to `main` deploy
to production; pull requests get preview deployments automatically.

## Contributing

Branch off `main`, open a PR, and CI will lint, typecheck, and build
your changes (see `.github/workflows/ci.yml`).
