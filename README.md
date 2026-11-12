# Sri Lanka Tours Driver – Frontend

Multi-language tourism and booking website built with Next.js 16 App Router, React 19 and TypeScript.

## Technology

Next.js, `next-intl`, React Query, React Hook Form, Zod, Tailwind CSS, and Poppins / Playfair Display fonts.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Update the environment variables for the backend, application origin and integrations before running locally. Do **not** commit real credentials.

## Available commands

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint

## Application structure

- `src/app/[locale]/` — translated public pages
- `src/app/admin/` — administration interface
- `src/app/manager/` — manager views
- `src/app/staff/` — staff views
- `src/app/api/` — Next.js API integration layer
- `messages/` — translation data
- `src/app/robots.ts` and `sitemap.ts` — SEO endpoints

## Backend

See [Sri Lanka Tours Driver Backend](https://github.com/Kelumsameera/srilankatoursdriver_backend). The frontend depends on a configured API service; verify authentication, cookies, cross-origin settings and server URLs in each environment.

## Quality checks

Before production deployment, run build/typecheck/lint and test public booking, translation switching, login, admin permissions, mobile navigation, and SEO routes.

This README documents the current repository layout; it does not certify deployment or testing results.
