<div align="center">

<h1>Dive</h1>

<p><strong>Project management for small teams: boards, chat and notes in one workspace.</strong></p>

<p><a href="https://www.projectdive.app">projectdive.app</a></p>

</div>

## What it does

Dive gives an organisation one place to plan projects, talk about them and write things down.

- **Workspaces and invites.** Sign up, name your organisation in onboarding, and invite teammates with a link. Admins can see and revoke pending invites.
- **Clusters.** Group projects by client or area, for example one cluster per client.
- **Project board.** A drag-and-drop board across Backlog, To do, Doing and Done. Cards keep their order through fractional positions, so a move updates one row.
- **Tasks.** Every project has its own task board, with owners, codes and status flags (on track, approaching, overdue, complete).
- **Project settings.** Planned start and end dates, sprint cadence (weekly, bi-weekly, monthly), time zone, cost centre code, public or private, archive, and switches for pages, tickets and time tracking.
- **Project chat.** A live chat for each project on Supabase Realtime, with file attachments.
- **Notes.** A rich text editor (TipTap) stored as Markdown, with version history you can restore from. Any note can be viewed as a mind map (Markmap).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, server actions), React 19, TypeScript |
| Data and auth | Supabase: Postgres with row-level security, Auth, Realtime, Storage |
| Editor | TipTap, with Turndown and Marked to convert between HTML and Markdown |
| Mind maps | Markmap |
| UI | Tailwind CSS 4, Base UI, Lucide icons, Motion, Lenis |
| Analytics | Google Analytics (optional) |

## How it fits together

```
Browser ──► Next.js server actions ──► Supabase Postgres (RLS on every table)
   │                                         │
   └──── Supabase Realtime ◄─────────────────┘  messages table
   └──── Supabase Storage  (dive bucket, chat-attachments/ folder)
```

- All of Dive's tables and functions live in a `dive` Postgres schema, so the Supabase project can be shared with other apps.
- Every table is scoped to an organisation. A `dive.get_auth_org_id()` helper lets row-level security policies check the signed-in user's organisation, so members only see their own team's data.
- Roles live on `profiles`. Admins manage invites, delete projects and clusters, and edit the organisation. Members create and edit.
- A trigger creates a profile for each new auth user that signed up through Dive (user metadata `app: 'dive'`). Users of other apps in the same project don't get one.
- Invites are rows in `org_invites` with a one-time token. `/api/accept-invite` checks the token and adds the user to the organisation.

### Data model

| Table | Holds |
|---|---|
| `organizations` | A team workspace |
| `profiles` | One row per user, with their organisation and role |
| `org_invites` | Pending invites and their tokens |
| `clusters` | Groups of projects |
| `projects` | Board cards, dates, cadence, settings |
| `project_members` | Who works on which project |
| `tasks` | Tasks within a project, ordered by `position` |
| `messages` | Project chat, including attachment metadata |
| `notes`, `note_versions` | Notes and their saved versions |

## Run it locally

You need Node.js 20 or later and a Supabase project.

```bash
git clone https://github.com/sometimesdante/dive.ai.git && cd dive.ai
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project settings → API keys (publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project settings → API keys (secret key). Server only, never expose it. |
| `NEXT_PUBLIC_SITE_URL` | Dive's own URL, with no trailing slash (`http://localhost:3000` locally). Sign-up confirmation emails link back here. |
| `GA_MEASUREMENT_ID` | Optional. Google Analytics 4 measurement ID. |

Set up the database by running `supabase/migrations/001_schema.sql` in the Supabase SQL editor. It creates the `dive` schema, tables, row-level security, grants, the auth trigger, Realtime and the `dive` storage bucket. It only creates what's missing and recreates triggers and policies, so it's safe to run again on a database with data.

Then, in the Supabase dashboard:

- **Project settings → Data API → Exposed schemas:** add `dive`. Without it every query fails.
- **Authentication → URL Configuration → Redirect URLs:** add Dive's URL with a wildcard, for example `http://localhost:3000/**` and your production URL. Dive sends its own `emailRedirectTo`, so it doesn't rely on the Site URL, which can belong to another app sharing the project. If the URL isn't allowed, Supabase falls back to the Site URL.
- **Email templates:** the default `{{ .ConfirmationURL }}` template works. A custom template should link to `{{ .RedirectTo }}`, not `{{ .SiteURL }}`.

## Project structure

```
src/
  app/
    (frontend)/        marketing pages, login, signup, onboarding, accept invite
    (dive)/            the app: projects, chat, notes, settings, profile
    api/accept-invite  invite token handler
  ui/
    base/              inputs, toggles, slide panel, cards
    dive/              boards, chat, notes editor, mind map, settings
    frontend/          marketing header and footer
  utils/supabase/      browser, server and service-role clients
supabase/migrations/   001_schema.sql, the full database setup
```

## Roadmap

Dive is being prepared for production. What's in progress or not built yet:

- **Tickets, timesheet and dashboard** pages exist as placeholders. The project switches for tickets and time tracking are stored but don't change anything yet.
- **Integrations** (GitHub, Stripe, Zapier) are shown in settings but not connected.
- **Invite emails** aren't sent. Admins copy the invite link and share it themselves.
- Usability improvements across the boards and notes.
