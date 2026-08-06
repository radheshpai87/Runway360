# Runway360

Runway360 is an interactive, highly personalized career transition coach and financial planning chatbot application designed specifically for young professionals looking to make bold, risk-managed career pivots.

It guides users through a structured intake process, calculates financial runways, assesses career transition feasibility, and generates structured transition path roadmaps and journey maps.

---

## Features

- **Conversational Intake Interview:** A friendly, low-friction, 10-question structured conversational questionnaire.
- **Interactive Widgets:** Built-in sliders, range pickers, and click-to-select pills to avoid tedious typing and reduce completion friction.
- **Live Runway and Risk Sandbox:** A real-time updating dashboard that visualizes your safety net runway, risk level, and emergency buffer as you answer financial questions.
- **Phased Transition Roadmap:** Generates action items for the immediate term (30 days), short term (1-3 months), and mid-term.
- **Realistic Journey Map:** Outlines potential obstacles, mental/emotional phases, and provides an objective reality check on your timeline.
- **Google OAuth Authentication:** Secure sign-in to personalize the experience, skip basic question intake, and retrieve past transition calculations and histories.
- **Interactive Background Grid:** Viewport-fixed canvas-based particle grid that swells and responds smoothly to mouse movements.
- **Smooth Inertia Scrolling:** Full application scrolling integrated with Lenis smooth scroll engine for fluid viewport navigation.

---

## Tech Stack

- **Framework:** Next.js
- **Database:** Supabase (PostgreSQL)
- **Auth:** Auth.js (NextAuth.js) with Google OAuth Provider
- **Styling:** CSS and Tailwind CSS (Neobrutalist color palette using Dutch White and Charcoal Black)
- **AI Integrations:** Google Gemini Pro API for adaptive custom questioning and roadmap blueprint generation

---

## Repository Structure

- `LLM_Logs.MD` - History of conversation prompts and AI responses for accountability.
- `Project_Description.md` - Formal project scope, edge case analysis, and chatbot resolution rules.
- `README.md` - This file.
