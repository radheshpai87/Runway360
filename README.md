<p align="center">
  <img src="public/readme_header.jpg" alt="Runway360 Header" width="100%" />
</p>

# Runway360

A math-backed planning workspace and interactive coach designed for managing career transitions with financial modeling and adaptive AI query mapping.

---

## Core Capabilities

### Intake & Coaching
* **Conversational Intake**: A structured 10-question interview analyzing current role, savings, expenses, timeframe, and goals.
* **Adaptive Prompts**: Generates custom follow-up questions via Gemini AI to address specific skills gaps and transition risks.

### Runway Simulation
* **Savings Runway**: Computes cost-survival runway months dynamically as financial parameters are adjusted.
* **Emergency Buffer**: Tracks saving shortfalls against standard 6-month buffer guidelines.
* **Transition Target**: Evaluates pivot timelines and logs status classifications (safe, moderate, underfunded).

### Checklists & Planning
* **Task Blueprints**: Generates phase-based actionable checklists (Days 1-30, 31-60, 61-90) saved persistently.
* **Journey Mapping**: Maps potential psychological transition phases alongside concrete guidelines and tips.

---

## Project Structure

| Location | Description |
| :--- | :--- |
| `src/app/` | API endpoints and Next.js App Router layout handlers |
| `src/components/` | Modular client components (LandingHero, InteractiveSandbox) |
| `src/lib/` | Core formulas, Supabase configuration, and failover LLM router |
| `src/__tests__/` | Unit and component test suites (calculations, UI rendering) |
| `public/` | Base assets (og_image, robots.txt, sitemaps, and llms.txt) |
| `.github/workflows/` | GitHub Actions configuration for automated testing and CI validation |

---

## Tech Stack

* **Core Framework**: Next.js (App Router), React, TypeScript
* **Database & Client**: Supabase (PostgreSQL client)
* **Authentication**: NextAuth.js (Google OAuth Provider)
* **Animation & Scroll**: HTML5 Canvas particle grid, Lenis Smooth Scroll
* **Testing & Tools**: Vitest, React Testing Library, ESLint, GitHub Actions

---

## Getting Started

### Environment Variables
Configure these variables in a `.env.local` file in the root folder:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

GEMINI_API_KEY=your-gemini-api-key
```

### Installation & Run

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Compile production build
npm run build
```

---

## Quality Control & Testing

```bash
# Run Vitest watcher locally
npm run test

# Run single-run tests for CI
npm run test:ci

# Run ESLint checks
npm run lint
```
