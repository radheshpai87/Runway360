# Runway360

Runway360 is an interactive, math-backed planning workspace and transition coach designed for young professionals managing career pivots. The application guides users through a conversational intake process, calculates financial runways, assesses pivot viability, and generates customized step-by-step transition roadmaps.

---

## Core Capabilities

* **Conversational Intake Coach**: A structured 10-question intake interview that collects baseline career goals and parameters.
* **Adaptive AI Querying**: Generates dynamic custom follow-up queries powered by Gemini AI to address specific skills gaps, transition risks, and personal commitments.
* **Live Runway Sandbox**: An interactive spreadsheet simulation that calculates Cost Survival Budgets, recommended emergency reserves, and timeline viability in real-time.
* **Phased Transition Roadmaps**: Compiles actionable checklist items organized by timeline phases (Immediate 30 Days, Short-Term 90 Days, and Mid-Term).
* **Objective Reality Checks**: Assesses target timelines against financial resources to evaluate if your pivot is realistic, optimistic, or underfunded.
* **Authentication Lock**: Google OAuth integration ensures user profiles, custom calculations, and session histories are saved securely.
* **Neobrutalist User Interface**: Stark borders, high-contrast palette states, cursor-responsive canvas dot grids, and smooth inertia scrolling driven by Lenis.

---

## Directory Structure

| Path | Description |
| :--- | :--- |
| `src/app/` | Next.js App Router routes, page layouts, and API endpoints |
| `src/components/` | Modular UI components (LandingHero, InteractiveSandbox) |
| `src/lib/` | Core business logic, mathematical formulas, and LLM execution helpers |
| `src/__tests__/` | Unit and component test suites (calculations, UI rendering) |
| `public/` | Static visual assets (open-graph preview cards, robots, sitemaps, and llms.txt) |
| `.github/workflows/` | GitHub Actions configuration for automated testing and CI validations |

---

## Tech Stack

* **Core Framework**: Next.js (App Router), React, TypeScript
* **Database & Storage**: Supabase (PostgreSQL client)
* **Authentication**: NextAuth.js (Google OAuth configuration)
* **Styling**: Tailwind CSS (Neobrutalist theme)
* **Animation & Scroll**: HTML5 Canvas particle renderer, Lenis Smooth Scroll
* **Testing & Tools**: Vitest, React Testing Library, ESLint, GitHub Actions

---

## Environment Variables

To run the application locally, create a `.env.local` file in the root directory and configure the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase Configurations (Optional fallback to mock mode if left blank)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Gemini AI API Key
GEMINI_API_KEY=your-gemini-api-key
```

---

## Getting Started

### 1. Installation
Install the project dependencies using npm:
```bash
npm install
```

### 2. Run the Development Server
Launch the local development environment:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser to view the application.

### 3. Build for Production
Verify that the project compiles cleanly for deployment:
```bash
npm run build
```

---

## Testing & Quality Control

The project utilizes Vitest and React Testing Library for automated quality assurance.

### Run Tests Locally
To run all tests in watch mode:
```bash
npm run test
```

To run a single-run test execution:
```bash
npm run test:ci
```

### Run Linter
To verify that all code matches stylistic rules:
```bash
npm run lint
```

### Continuous Integration
A GitHub Actions workflow is configured in `.github/workflows/ci.yml`. On every push or pull request to the main branch, it automatically runs dependency installation, lint checks, type checks, build compilation, and the Vitest test suite.
