<div align="center">

<h1>Dive</h1>

<p><strong>Project management for small teams: boards, chat and notes in one workspace.</strong></p>

<p><a href="https://www.projectdive.app">projectdive.app</a></p>

<img src="public/illustrations/homepage.png" alt="Dive" width="720">

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

## Screenshots

| | |
|---|---|
| <img src="public/illustrations/project boards.png" alt="Project boards" width="360"> | <img src="public/illustrations/team workspace.png" alt="Team workspace" width="360"> |
| <img src="public/illustrations/notes and docs.png" alt="Notes and docs" width="360"> | <img src="public/illustrations/time tracking.png" alt="Time tracking" width="360"> |

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
   └──── Supabase Storage  (chat-attachments bucket)
```

- Every table is scoped to an organisation. A `get_auth_org_id()` helper lets row-level security policies check the signed-in user's organisation, so members only see their own team's data.
- Roles live on `profiles`. Admins manage invites, delete projects and clusters, and edit the organisation. Members create and edit.
- A trigger creates a profile for each new auth user.
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
# create .env.local with the values below
npm run dev
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase → Project settings → API keys (publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project settings → API keys (secret key). Server only, never expose it. |
| `GA_MEASUREMENT_ID` | Optional. Google Analytics 4 measurement ID. |

Set up the database by running the files in `supabase/migrations` in order in the Supabase SQL editor:

1. `001_schema.sql`: tables, row-level security, triggers, Realtime and the `chat-attachments` storage bucket
2. `002_seed.sql`: optional demo data (an organisation, three clusters, projects, tasks and teammates)
3. `003_notes.sql`: notes and note versions

In Supabase → Authentication → URL Configuration, set the Site URL to `http://localhost:3000` for local work and add your production URL to Redirect URLs.

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
supabase/migrations/   schema, seed data, notes
```

## Roadmap

Dive is being prepared for production. What's in progress or not built yet:

- **Tickets, timesheet and dashboard** pages exist as placeholders. The project switches for tickets and time tracking are stored but don't change anything yet.
- **Integrations** (GitHub, Stripe, Zapier) are shown in settings but not connected.
- **Invite emails** aren't sent. Admins copy the invite link and share it themselves.
- Usability improvements across the boards and notes.
