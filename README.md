# Gearly — Equipment Rental Platform (Client)

A Next.js App Router frontend for the Gearly equipment rental marketplace. The client reads equipment, bookings, favorites, users, reviews and analytics from the connected Express API. It does not include hard-coded records.

## Run locally

1. Use Node.js 20 or newer.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in the values.
4. Start the Express server on `http://localhost:5000`.
5. Start the client: `npm run dev`
6. Open `http://localhost:3000`.

## Environment variables

| Variable | Required value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Client URL, usually `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Express API base URL, usually `http://localhost:5000/api` |
| `NEXT_PUBLIC_IMGBB_API_KEY` | ImgBB API key from https://api.imgbb.com/; used for profile and equipment image uploads |
| `BETTER_AUTH_URL` | Same client URL |
| `BETTER_AUTH_SECRET` | A long random secret used only by Better Auth |
| `MONGODB_URI` | MongoDB connection string used by the Better Auth MongoDB adapter |
| `DB_NAME` | Database name; must match the server |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `JWT_SECRET` | Shared HS256 secret; must exactly match the Express server value |
| `JWT_ISSUER` | Must match the Express server, default `gearly-client` |
| `JWT_AUDIENCE` | Must match the Express server, default `gearly-api` |

For Google OAuth, add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI in Google Cloud Console. Keep `.env.local` out of Git. `NEXT_PUBLIC_IMGBB_API_KEY` is a browser-side API key; do not put MongoDB, Better Auth, JWT or Stripe secret keys in `NEXT_PUBLIC_` variables.

## Features

- Email/password registration and login with password validation; Google sign-in.
- Session-aware navbar, protected equipment details and role-based dashboards.
- Customer dashboard: rentals, database-backed favorites and profile.
- Owner dashboard: add equipment, manage own listings, rental requests and analytics.
- Admin dashboard: users/roles, all equipment, all rentals and platform analytics.
- Server-side equipment search, category/rental type/availability/price filters, sorting and pagination. Query parameters stay in the URL.
- Equipment details, booking form, date-overlap availability check on the API, Stripe Checkout redirect and payment result pages.
- ImgBB image upload for registration profile photo, profile updates and owner equipment listings.
- Toast feedback, route/card/table skeletons, custom error and 404 pages.
- Framer Motion section reveals and subtle hover/transition interactions.
- Reviews are read from the API/database and shown in an animated carousel. Seeded demo reviews are labeled as demos.

## API integration

The frontend uses the Express routes from the companion Gearly server. Public equipment data is fetched from `/equipment`, `/equipment/featured`, `/equipment/:id` and `/reviews`. Protected requests obtain a short-lived server-signed HS256 token from `/api/backend-token`; the signing secret, issuer and audience must match the backend configuration.

Stripe Checkout is created by the backend. The browser never receives the Stripe secret key and never calculates the authoritative booking total.

## Main folders

- `src/app` — App Router pages, layouts, loading, error and API route handlers.
- `src/components` — shared UI, forms, upload control, dashboard and skeletons.
- `src/lib` — Better Auth, MongoDB connection, API client and backend token helper.
- `src/types/index.ts` — shared TypeScript interfaces and types.

## Frontend commit plan (32 meaningful commits)

1. Initialize Next.js App Router and TypeScript.
2. Configure Tailwind CSS and global theme tokens.
3. Add shared domain types.
4. Configure Better Auth and MongoDB adapter.
5. Add email/password registration.
6. Add Google social sign-in.
7. Add password validation and auth feedback.
8. Add session-aware navbar and user menu.
9. Add shared footer and providers/toast system.
10. Build responsive home hero and visual identity.
11. Connect featured equipment to the live API.
12. Add category navigation.
13. Add platform benefits and how-it-works sections.
14. Connect customer reviews to database API without fake entries.
15. Build equipment cards and reusable reveal animation.
16. Build equipment listing page and URL-driven search.
17. Add server-side filters, sorting and pagination UI.
18. Add equipment details page and private-route protection.
19. Add favorites actions and customer favorites view.
20. Add booking form and checkout redirect.
21. Add payment success and cancel pages.
22. Build customer rentals and profile pages.
23. Add ImgBB profile photo upload.
24. Build owner equipment creation form and ImgBB upload.
25. Build owner equipment management and rental table.
26. Build owner analytics view.
27. Build admin user and role management.
28. Build admin equipment approval and management.
29. Build admin rentals and platform analytics.
30. Add page/card/table skeleton loading states.
31. Add branded error and 404 pages plus responsive polish.
32. Verify API integration, accessibility, empty states and production build.

These are planned commit topics, not commits already created in this ZIP.
