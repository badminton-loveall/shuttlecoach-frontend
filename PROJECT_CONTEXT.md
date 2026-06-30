# PROJECT_CONTEXT.md

## Stack
- Frontend: React 19 + Vite 8 + TypeScript 6
- Styling: Tailwind CSS 4 + CSS custom properties (index.css), component-level `.css` files
- Routing: react-router-dom 7 (BrowserRouter)
- State management: React Context (AuthContext)
- Testing: Vitest 4 + Testing Library + jsdom
- Linting: ESLint 10 + Prettier
- Deployment: Vercel (static SPA)
- Package manager: npm
- No backend API yet — data is served from local JSON files

## Frontend structure
- App entry: `src/App.tsx`
- Routing: `src/App.tsx` — flat route definitions with `<ProtectedRoute>` wrappers
- Pages: `src/pages/` — one file per route (LoginPage, HeadCoachDashboard, StudentsPage, FeesPage, CoachesPage, CurriculumPage, StudentDashboard, StudentProfilePage, MyProgressPage, MyFeesPage, AccessDeniedPage)
- Shared UI components: `src/components/` (DashboardLayout, TopNav, FilterBar, SearchInput, StatCard, StudentCard, StudentGrid, ProtectedRoute)
- Contexts: `src/contexts/AuthContext.tsx` — provides user, role, token, login, logout
- Types: `src/types/index.ts`
- Static data: `src/data/students.json`, `src/data/users.json`
- Hooks: `src/hooks/` (placeholder, no custom hooks yet)
- Assets: `src/assets/`

## Roles & access control
- HEAD_COACH: full access to all coach routes + `/coaches`
- ASSISTANT_COACH: access to coach routes except `/coaches`
- STUDENT: access to `/student-dashboard`, `/my-progress`, `/my-fees`
- Auth is client-side only (localStorage token, JSON credential check)

## Environment variables
- `VITE_API_URL` — API base URL (unused currently)
- `VITE_APP_NAME` — App display name
- `VITE_DEBUG` — Debug flag

## Build & run
- Dev: `npm run dev`
- Build: `npm run build` (runs tsc then vite build)
- Test: `npm run test` (vitest --run)
- Lint: `npm run lint`
- Format: `npm run format`
- Output directory: `dist/`

## Conventions
- Component naming: PascalCase, one component per file, `.tsx` extension
- CSS: component-level CSS files alongside components (e.g., `TopNav.css`)
- No barrel exports — import directly from file path
- Tests: colocated with source files (e.g., `App.test.tsx`, `LoginPage.test.tsx`)
- Light/dark mode via CSS `prefers-color-scheme` media query and CSS variables

## Guardrails
- Do not read: `node_modules/`, `dist/`, `.git/`
- Keep backward compatibility for: route paths, AuthContext interface, UserRole type
- No real API exists yet — all data is local JSON
- Do not introduce new state management libraries without explicit approval
