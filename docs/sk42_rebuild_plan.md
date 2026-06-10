# Savage Kings / SK42 Intelligence Agency Rebuild Plan

## Goal

Build a production-grade replacement for the current Savage Kings clan intelligence site that preserves the strongest parts of the existing experience while improving reliability, security, data ownership, and usability.

The rebuilt system should:

- provide a **dashboard-first home experience**
- support **Discord OAuth login and Google Oauth login at minimum** instead of custom password handling
- ingest Warpath ranking and player detail data from the external endpoints already identified in the current site architecture
- let admins and leaders **pin tracked players**, group them into alliances/rosters, assign titles/roles, and organize intelligence workflows
- preserve historical snapshots locally so the site remains useful even if external sources change or disappear
- re-create and improve the current core tabs:
  - Server Movement
  - Conquest Tracker
  - Player Tracker
  - Overall Alliances
  - Compare Alliances
  - Title Management
  - Leadership Roster

---

## Verified current-state findings that shape this rebuild

The current site publicly presents itself as **“SK42 Intelligence Agency”** / **“Server Management”** behind a login. citeturn3search39

The current site also depends on an external cross-site endpoint at `yx.dmzgame.com/intl_warpath/rank_pid`, and the browser request/response headers show that the request is made from `https://savagekings.net` to `https://yx.dmzgame.com`, with CORS enabled via `access-control-allow-origin: *`. This means the current site is using an external Warpath-related data source from the browser for ranking/report data. 

Sidecar, the design inspiration you chose, presents a homepage built around a strong hero section and a workflow-oriented product story. Its homepage headline is **“You might never open your editor again”**, and it frames the product around a single environment that can **plan tasks, chat with AI agents, review diffs, stage commits, switch between projects instantly, and manage git workspaces**. citeturn18search86

Sidecar’s homepage and docs also emphasize: 
- a **dashboard-like split-pane / terminal-inspired interface**, 
- clear feature sections,
- visible task/activity panels,
- a workflow narrative of **Plan → Act → Monitor → Review**, and
- modular plugins or sections for different jobs. citeturn18search85turn18search86

These verified patterns make Sidecar a strong inspiration for a Warpath intelligence portal: it is structured, operational, modular, and dashboard-forward. 

---

## Product Vision

**Working title:** SK42 Command Center

**Positioning:**
A modern Warpath intelligence and alliance operations hub built for leaders, officers, and analysts.

**Primary outcomes:**
- faster decision-making
- cleaner reporting
- tracked player intelligence over time
- less dependence on one person’s private setup
- easier onboarding for alliance leadership

---

## Design Direction / Look & Feel

> The recommendations below are **design direction**, inspired by Sidecar’s verified structure and presentation style, but adapted for a Warpath alliance tool.

### Design principles

1. **Dashboard-first**
   - Home tab should immediately answer: _What changed? What needs attention? Who is moving?_ 
   - The user should not land on a blank page or a generic marketing hero after login.

2. **Operational clarity**
   - Prioritize information density, but keep hierarchy extremely clear.
   - Use “command center” framing rather than “consumer app” framing.

3. **Modular sections**
   - Borrow Sidecar’s modular storytelling approach: each major function should feel like a plugin/module with one clear responsibility. citeturn18search85turn18search86

4. **Dark, tactical, terminal-adjacent visual language**
   - Inspired by Sidecar’s dashboard and terminal-monitoring feel. citeturn18search85turn18search86
   - Use a refined military-intelligence aesthetic, not “grungy gamer UI”.

5. **Fast scanning over decoration**
   - Cards, status chips, trends, and deltas should be readable in seconds.

### Visual style recommendations

#### Color palette
- **Base background:** near-black / graphite
- **Surface panels:** charcoal / slate
- **Primary accent:** electric blue or cool cyan
- **Secondary accent:** muted purple / magenta for emphasis
- **Success:** green
- **Warning:** amber
- **Danger:** red
- **Neutral text:** warm gray / off-white

#### Typography
- **Primary UI font:** modern sans (Inter, Geist, or Söhne-like feel)
- **Optional data font:** mono for IDs, PIDs, deltas, and timestamp-heavy rows
- Strong typographic hierarchy:
  - large, assertive page headings
  - compact section labels
  - readable table text

#### Layout language
- Left rail navigation
- Main content area with:
  - top page header / context bar
  - KPI row
  - primary panel(s)
  - secondary activity / alerts / trend sections
- Rounded corners kept subtle
- Borders and panel separation should be visible but not loud
- Heavy use of spacing rhythm and card stacking

#### Component feel
- Metric cards with deltas
- Dense data tables with sticky headers
- Search-first interaction patterns
- Status chips for tracked / pinned / alliance / title / active / risk state
- Trend spark lines and mini charts where helpful

---

## Home Tab / Dashboard Definition

The site should have a true **dashboard on the home tab**.

### Dashboard purpose
The dashboard becomes the command overview for alliance leadership.

### Dashboard sections

#### 1. Top Command Summary
Show high-level operational metrics:
- tracked players count
- tracked alliances count
- server currently selected
- last successful data sync
- number of players with significant change since last snapshot
- number of flagged players / watchlist items

#### 2. Activity Feed
Recent intelligence events such as:
- newly pinned players
- notable score changes
- alliance movement
- title changes
- tracked player added/removed from roster

#### 3. Watchlist Movers
A ranked list of pinned players with the largest recent movement:
- score delta
- kills delta
- deaths delta
- rank movement
- alliance change indicator

#### 4. Conquest Snapshot Preview
A compact block showing the latest conquest report summary:
- top alliance(s)
- tracked alliance deltas
- strongest movers
- quick link to full Conquest Tracker

#### 5. Leadership Focus Panels
Compact widgets for:
- leadership roster quick access
- players missing titles
- officers needing review
- alliances requiring comparison

#### 6. Search / Jump Bar
Global instant search:
- player by PID / name
- alliance by name
- jump to server
- quick actions: pin player, create roster, compare alliances

---

## Core Information Architecture

### Primary navigation
- Home / Dashboard
- Server Movement
- Conquest Tracker
- Player Tracker
- Overall Alliances
- Compare Alliances
- Title Management
- Leadership Roster
- Admin
- Settings

### Secondary utility navigation
- Search
- Recent activity
- Sync status
- User menu

---

## Product Scope

## 1. Authentication & Access

### Goal
Secure the site and modernize access.

### Features
- Discord OAuth login
- Optional Google login for admins if desired
- Role-based access control
  - Admin
  - Leader
  - Officer
  - Viewer
- Protected routes
- Audit log for critical admin actions

---

## 2. Data Ingestion Layer

### Goal
Pull external data, store it locally, and detach UI reliability from live third-party availability.

### Features
- Scheduled ingestion for ranking data
- Scheduled ingestion for tracked player detail data
- Manual refresh tools for admins
- Snapshot persistence in local database
- Sync logs + failure alerts

### Design rule
The frontend should read from **your database first**, not directly from third-party APIs in the live UI.

---

## 3. Player Tracker

### Goal
Search, inspect, pin, and manage player intelligence.

### Features
- Search by player name / PID
- Player detail page
- Historical stat display
- Pin player to tracking list
- Assign pinned player to alliance / roster
- Add notes / tags / threat labels
- View score / kills / deaths / delta trends
- Optional chart views

### Recommended page structure
- Player header
- Key metrics row
- Trend graph
- Snapshot history table
- Notes / tags panel
- Assignment panel
- Related alliance panel

---

## 4. Conquest Tracker

### Goal
Rebuild and improve the most important reporting workflow.

### Features
- Select server
- Select start/end dates
- Pull rank snapshots for comparison windows
- Calculate deltas for tracked players and/or tracked alliances
- Sort by score gain, kills gain, deaths, rank movement
- Exportable report view
- Save report presets

### Power features
- Compare tracked alliances only
- Exclude non-pinned players
- Flag suspicious spikes or major movement

---

## 5. Server Movement

### Goal
Provide context switching between Warpath server scopes.

### Features
- Server selector (example: 1–200 or broader if needed)
- Persist selected server per user/session
- Use selected server as default filter for ranking and player workflows
- Quick links to recent tracked activity for the active server

---

## 6. Overall Alliances

### Goal
Give leadership a consolidated alliance-level intelligence view.

### Features
- Alliance list for selected server
- Aggregate power / score / kill metrics
- Trend indicators
- Quick link into tracked members
- “Add to watchlist” / “Track alliance” action

---

## 7. Compare Alliances

### Goal
Enable side-by-side strategic comparison.

### Features
- Select two or more alliances
- Compare aggregate stats
- Compare top tracked members
- Compare trend windows
- Visual deltas and summary recommendations

---

## 8. Title Management

### Goal
Organize internal leadership structure and roster roles.

### Features
- Assign titles to tracked players
- Define rank types (Leader, R4, Officer, Diplomat, Recruiter, Strategist, etc.)
- Add notes and effective dates
- Filter by title / missing title
- View title history

---

## 9. Leadership Roster

### Goal
Expose the operational chain in one clean place.

### Features
- Leadership cards or table
- Search and filter
- Contact / Discord handle fields if desired
- Quick jump into tracked player detail
- Status tags (active, on leave, watch, etc.)

---

## 10. Admin & Ops Tooling

### Goal
Make the system maintainable by the alliance, not one owner.

### Features
- Manual data sync button
- Sync history and error dashboard
- Edit alliance/group assignments
- Manage tags, roles, titles, and labels
- User management
- Import/export tools

---

## Data Model (recommended)

### Core tables
- `users`
- `roles`
- `alliances`
- `tracked_players`
- `player_snapshots`
- `conquest_reports`
- `conquest_report_rows`
- `player_notes`
- `player_tags`
- `player_titles`
- `server_contexts`
- `sync_runs`
- `audit_log`

### Key concepts

#### `tracked_players`
Stores the local intelligence-layer identity:
- pid
- display name override
- current alliance assignment
- watchlist state
- pinned flag
- notes

#### `player_snapshots`
Stores time-series data from external sources:
- pid
- captured date
- score
- kills
- deaths
- rank
- alliance name/source value
- raw payload hash/reference

#### `alliances`
Stores normalized alliance records:
- name
- server
- tracked flag
- notes

#### `player_titles`
Stores title history:
- player
- title
- assigned by
- assigned at

---

## Suggested Tech Stack

### Frontend
- Next.js
- React
- Tailwind CSS
- shadcn/ui or similar composable component system
- Recharts or ECharts for trend charts

### Backend / Platform
- Supabase for:
  - Postgres
  - Auth (if you want to keep auth/data integrated)
  - storage
  - row-level security

### Alternative backend
- Next.js server actions / API routes
- Node worker process for scheduled sync jobs

### Auth
- Discord OAuth
- Optional Google OAuth for internal admins

### Jobs
- Scheduled ingestion worker / cron
- Snapshot processor
- report materialization job

---

## UX Strategy by Page

### Dashboard
- fast situation awareness
- zero dead space
- role-aware widgets

### Player Tracker
- search first
- compact overview + deep drill-down

### Conquest Tracker
- analysis first
- strong table tools
- export-friendly layout

### Alliance pages
- aggregation and comparison
- concise, scannable metrics

---

## Development Plan

# Phase 0 — Discovery, data salvage, and reconstruction

## Objectives
- preserve critical knowledge from the current site
- define exact external endpoints in use
- finalize schema assumptions before writing production code

## Tasks
- [ ] Document all existing tabs and workflows from current site
- [ ] Export any recoverable internal app data from the current site
- [ ] Capture representative payloads from ranking and player detail endpoints
- [ ] Define normalized field mappings for player, alliance, and snapshot data
- [ ] Identify minimum viable screens for launch
- [ ] Produce low-fidelity IA + wireframes

---

# Phase 1 — Foundation

## Objectives
- establish project structure
- implement auth and data model
- prepare dashboard shell and navigation

## Tasks
- [ ] Create Next.js app
- [ ] Set up code quality tooling
- [ ] Configure environment variables and secrets
- [ ] Create Supabase project
- [ ] Define Postgres schema
- [ ] Implement Discord OAuth
- [ ] Implement role-based route protection
- [ ] Build base layout shell
- [ ] Build left navigation and top command bar
- [ ] Implement theme and design tokens

---

# Phase 2 — Data ingestion and persistence

## Objectives
- get external data into your database reliably
- stop depending on live browser calls in the UI

## Tasks
- [ ] Build ranking fetch service
- [ ] Build player detail fetch service
- [ ] Create snapshot persistence pipeline
- [ ] Create server-scoped ingestion commands
- [ ] Add sync logging
- [ ] Add retry and failure handling
- [ ] Add admin-triggered manual sync
- [ ] Create basic data validation checks

---

# Phase 3 — Dashboard + core pages

## Objectives
- launch an immediately useful command center
- ship the most visible workflows first

## Tasks

### Dashboard
- [ ] Build dashboard route
- [ ] Build KPI strip
- [ ] Build activity feed
- [ ] Build watchlist movers panel
- [ ] Build conquest summary widget
- [ ] Build leadership quick panel
- [ ] Build global search/jump command

### Server Movement
- [ ] Build server selector flow
- [ ] Persist selected server state
- [ ] Connect downstream data filters

### Player Tracker
- [ ] Build search UI
- [ ] Build player detail route
- [ ] Build trend charts
- [ ] Build snapshot history table
- [ ] Add pin/unpin actions
- [ ] Add alliance assignment action
- [ ] Add tags + notes UI

---

# Phase 4 — Alliance intelligence workflows

## Objectives
- restore the high-value leadership tools from the legacy site

## Tasks

### Overall Alliances
- [ ] Build alliance overview page
- [ ] Build tracked alliance cards/table
- [ ] Add aggregate trend metrics
- [ ] Add watchlist / tracking actions

### Compare Alliances
- [ ] Build comparison selector
- [ ] Build side-by-side metrics view
- [ ] Add delta tables
- [ ] Add export action

### Leadership Roster
- [ ] Build roster page
- [ ] Add title/role display
- [ ] Add filters and sorting
- [ ] Add quick links to tracked player pages

### Title Management
- [ ] Build title assignment flow
- [ ] Build title history table
- [ ] Add bulk edit tools

---

# Phase 5 — Conquest analytics and reporting

## Objectives
- recreate the flagship reporting capability
- make it stronger than the legacy implementation

## Tasks
- [ ] Build conquest report generator UI
- [ ] Support date window selection
- [ ] Compute player deltas from stored snapshots
- [ ] Compute alliance deltas from stored snapshots
- [ ] Add saved report presets
- [ ] Build export to CSV/Excel flow
- [ ] Add sort/filter grouping tools
- [ ] Add “tracked only” mode
- [ ] Add anomaly highlighting

---

# Phase 6 — Operational hardening

## Objectives
- make the platform sustainable for real alliance use

## Tasks
- [ ] Add audit logging
- [ ] Add admin health dashboard
- [ ] Add sync status alerts
- [ ] Add backup/export tooling
- [ ] Add rate-limiting and abuse protection
- [ ] Add monitoring and error capture
- [ ] Add documentation for admins

---

## Recommended MVP cut (if scope needs trimming later)

If you need to reduce scope after starting, keep these as non-negotiable:
- Dashboard
- Discord login
- Server Movement
- Player Tracker
- Pinning + alliance assignment
- Conquest Tracker (basic)
- Leadership Roster

Defer if needed:
- advanced exports
- anomaly detection
- heavy admin analytics
- advanced compare visualizations

---

## Success Criteria

The rebuild is successful when:
- alliance leaders can log in securely
- the Home tab gives immediate operational awareness
- tracked players can be pinned, grouped, titled, and reviewed
- conquest reports can be generated from locally stored snapshots
- the site can still function even if the legacy site disappears
- ownership of the platform is no longer concentrated in one person

---

## Launch Sequence Recommendation

1. Foundation and auth
2. Dashboard shell
3. Data ingestion
4. Player Tracker
5. Pinning / alliance assignment
6. Leadership Roster
7. Conquest Tracker
8. Overall / Compare Alliances
9. Title Management
10. hardening and export workflows

---

## Final product statement

Build a **dashboard-first Warpath command center** with a clean, modern, operational design inspired by Sidecar’s structured, workflow-oriented product presentation and terminal-dashboard feel, while turning Savage Kings’ current intelligence functions into a durable, team-owned system with local data persistence, secure authentication, and richer intelligence workflows. 
