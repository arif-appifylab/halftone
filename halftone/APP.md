# Halftone

A dark, cinematic studio website (brand, product & web studio) that becomes the WHOLE site,
with its own backend and its own admin: case studies, studio, pricing with a live estimate
calculator, a journal, a contact form that stores leads, intro-call bookings with real
availability, and a Halftone-styled admin at **/admin/** for leads, bookings, booking rules,
journal posts (rich text editor, image uploads) and settings.

## Install: make Halftone the home page (do this once)
An app can't replace the site's own files, so after install:
1. Replace `src/pages/index.astro` with:
   ```astro
   ---
   // The home page is Halftone's (the Halftone app, src/apps/halftone/). Static: built once.
   import HalftoneShell from '../apps/halftone/HalftoneShell.astro';
   import {halftonePage} from '../apps/halftone/page';

   export const prerender = true;
   ---

   <HalftoneShell page={halftonePage('')} />
   ```
2. Add the permission to `CATALOGUE` in `src/server/permissions.ts` (after the last entry), so
   owners can give the admin to other roles (owners can use it without this):
   ```ts
   /** Leads, bookings, journal and settings of the Halftone app (`/admin`). */
   HALFTONE_MANAGE: {
     codename: 'site:halftone:manage',
     title: 'Manage Halftone',
     description: 'Leads, bookings, journal and settings of the Halftone studio site.',
     group: 'Halftone',
     ability: 'manageHalftone',
     roles: ['admin'],
   },
   ```
   Then in `tests/permissions.test.ts` add `'manageHalftone'` to the sorted ability keys and
   `manageHalftone: false,` to the admin's expected abilities.
3. Install the dependencies below.
4. Send the studio to Halftone's admin, not the starter dashboard:
   - `src/server/auth-settings.ts`: `afterSignInPath: '/admin/'`, and `registration: 'closed'`
     (Halftone has no visitor accounts).
   - `src/lib/account.ts`: `nextPath(fallback = '/admin/')`.
   - `src/portal/routes.tsx`: on `overviewRoute` add
     `beforeLoad: ({preload}) => { if (!preload) window.location.replace('/admin/'); }` (the
     EzyStudio "Open admin" button opens `/dashboard`; this forwards it after sign-in), drop the
     Overview and Jobs nav items, and add an `<a href="/admin/">Halftone admin</a>` link in the
     sidebar foot. `/dashboard` stays for Users, Roles and Activity.
5. Halftone's look on the site's own pages (password-reset links, `/dashboard`): in
   `src/layouts/Base.astro` and `src/layouts/App.astro`, import `../apps/halftone/site-theme.css`
   right AFTER the site's own CSS imports. In `src/components/BrandMark.astro` and the portal
   sidebar, show the Halftone dot mark (3×3 circles, `class="brand-dots"`) when the site has no logo.
6. Optional, if the owner wants only Halftone: remove the starter's own public pages
   (`/about/`, `/blog/`, `/jobs/`) and their entries in `src/pages/sitemap.xml.ts`, `rss.xml.ts`
   and `NAV` in `src/content/site.ts` (set `NAV` to Work, Studio, Pricing, Journal, Contact).

## Pages
| URL | What |
| --- | --- |
| `/` | hero, client marquee, selected work, capabilities, process, stats, pricing calculator, testimonials, FAQ |
| `/work/`, `/work/<slug>/` | case studies (static data in `src/apps/halftone/site/data/projects.ts`) |
| `/studio/`, `/pricing/` | studio, plans + calculator ("Send this estimate" pre-fills the contact form) |
| `/journal/`, `/journal/<slug>/` | posts from the database, written in the admin |
| `/contact/` | brief form → saved as an inquiry |
| `/?book=1` | opens the booking modal directly (a shareable booking link) |
| `/admin/…` | the studio admin (signed in, `noindex`) |

Every page file (`src/pages/{work,journal,admin}/[...path].astro`, `studio.astro`,
`pricing.astro`, `contact.astro`, and the home page above) renders `HalftoneShell.astro` with
`halftonePage(path)` from `src/apps/halftone/page.ts` (title, description, canonical, 404 status).
The shell mounts the React app `src/apps/halftone/site/HalftoneApp.tsx` in the browser
(`client:only`), which routes with react-router; the admin is a separate lazy chunk.

## Admin (/admin/)
Halftone's own admin look (`src/apps/halftone/site/admin/`): Overview (new leads, upcoming
calls, open pipeline, journal, 14-day chart), Inquiries (filter, search, detail drawer, status
pipeline, private notes), Bookings (upcoming / past / cancelled, complete, cancel, restore, set
a link or address), Booking settings, Journal (TipTap editor) and Settings (availability banner,
password).
- Sign-in: Halftone's own sign-in screen at `/admin/login` (`site/admin/pages/Login.tsx`), on
  the SITE'S accounts. It only calls the site's built-in sign-in (`/site-api/auth/login`,
  `/code`, `/code/verify`, `/login/two-factor`): sessions, cookies, rate limits and emails stay
  the platform's, and there is no Halftone user table or password code. Password, or a 6-digit
  code by email (the owner's account starts without a password), then two-step when it is on.
  Settings → Password uses the site's `/site-api/auth/change-password`.
- Access: holders of `site:halftone:manage` (owners always). Others see a "no access" note.
  Every admin route checks it on the server.

## Customizing
- **Words, links, colours**: `src/apps/halftone/settings.json` (name, tagline, description,
  email, locations, availability fallback, timezone, socials, client names, typed words,
  colours, applied as CSS variables at load). Change this file, not the components.
- **Content**: `src/apps/halftone/site/data/*.ts` (projects, services, pricing, team,
  testimonials, FAQ). Journal posts and the availability banner are edited in the admin.
- **Styles**: Tailwind classes compiled ONCE into `src/apps/halftone/halftone.css` (the site
  has no Tailwind build step and must not get one). Source: `src/apps/halftone/tailwind.input.css`
  (tokens in `@theme`). After adding classes not in `halftone.css` yet, rebuild from the site root:
  `npm i --no-save tailwindcss@4.3.3 @tailwindcss/cli@4.3.3 && npx tailwindcss -i src/apps/halftone/tailwind.input.css -o src/apps/halftone/halftone.css --minify`.
- **Fonts**: Geist, Geist Mono, Instrument Serif (OFL), self-hosted in `public/apps/halftone/fonts/`.
- **Images**: Unsplash ids (`photo-…`), any `https://` image, or images uploaded in the admin.

## Image uploads
Post covers and images in posts can be uploaded (PNG, JPEG, WebP, GIF, AVIF, up to 8 MB) through
the platform's file storage as PUBLIC files (`docs/agent/files.md`): `POST /admin/uploads`
→ the browser PUTs the bytes (`putFile`) → `POST /admin/uploads/:fileId/complete`, which answers
the link `/__platform/files/<id>/<name>`. Only the file id is kept (`app_halftone_uploads`).
The owner must turn on Storage for the site (a storage pack); until then the admin says so and
pasting an image link still works.

## Data
Migration `prisma/migrations/20261029000000_app_halftone_init/`, in the site's Postgres:
- `app_halftone_inquiries`: contact-form leads (name, email, company, budget, services,
  message, optional calculator estimate, status, private notes).
- `app_halftone_bookings`: intro calls (date and time in the studio's timezone, guest name,
  email, optional phone / company / note, guest timezone, location, status). A
  partial unique index allows one live booking per slot.
- `app_halftone_posts`: journal posts (sanitised rich-text JSON). Starter posts are written once.
- `app_halftone_settings`: availability banner, booking rules, first-run markers.
- `app_halftone_uploads`: ids of uploaded images (never the bytes).
- `app_halftone_attempts`: rate-limit counters for the public forms, keyed by a one-way hash
  of the visitor's IP (never the raw IP), forgotten after a day.

The site's Prisma schema does not model these tables; the app uses tagged `$queryRaw` /
`$executeRaw` (parameters escaped). Never rename the tables.

## Site API: /site-api/apps/halftone/*
Mounted by `src/pages/site-api/apps/halftone/[...path].ts` (keeps `sameOrigin`, `csrf`, a 64 KB
body limit); routes in `src/server/apps/halftone/routes.ts`, zod schemas in `validate.ts`, data
access and seeds in `store.ts`.
- Public: `GET settings`, `GET posts`, `GET posts/:slug`, `POST inquiries` (8 per hour per
  visitor, honeypot `website`), `GET bookings/availability?duration=`, `POST bookings` (6 per
  hour; every slot re-checked against the rules and existing bookings).
- Admin (`withViewer → requireAuth → requirePermission('site:halftone:manage')`): `stats`,
  `inquiries`, `bookings`, `posts`, `settings`, `booking-settings`, `uploads`.
Browser code calls it only through `siteFetch` (it carries the CSRF token).

## Meeting links (no Google API)
A deployed site's server can only reach the EzyStudio platform, and apps hold no secrets, so
there is no Google Calendar / Meet integration and no email. Booking settings → Location:
**We send the link** (add it per call in Admin → Bookings), **In person** (address + map link),
or **Custom link**: one https URL for every call, e.g. the studio's Google Meet room
`https://meet.google.com/abc-defg-hij`. Guests get an "Add to Google Calendar" link (only a link).

## Dependencies
Install these exact versions in the site (`npm install --save-exact …`); they are not added for
you: `framer-motion@14.5.0`, `lucide-react@1.61.0`, `clsx@2.1.1`, `zod@4.6.7`,
`react-router-dom@7.18.4`, `@tiptap/react@3.32.0`, `@tiptap/starter-kit@3.32.0`,
`@tiptap/extension-image@3.32.0`, `@tiptap/extensions@3.32.0`, `@tiptap/pm@3.32.0`.
