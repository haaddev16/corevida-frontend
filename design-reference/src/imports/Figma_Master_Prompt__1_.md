# Figma Master Prompt — Corevida (AI Wellness Coach)

> Paste this directly into Figma's AI design generation tool.

---

Design a complete, premium, mobile-first web app called **Corevida** — an AI-powered wellness coach that generates personalized nutrition, fitness, and habit plans through a multi-agent AI system. This should feel like a polished, funded startup product — not a generic template. Think: the calm confidence of Headspace, the sporty premium data-presentation of Whoop, and the clean motion-rich minimalism of Linear.app, blended into one cohesive identity.

## Responsiveness Requirement (critical)

This app must work flawlessly on every device size — phones (iPhone, Samsung, any Android device), tablets, and laptops/desktops of any screen width. This is not just about things "fitting" — the visual quality, polish, and premium feel must be **identical** across every breakpoint. No layout should ever look broken, cramped, stretched, or like an afterthought compared to the others.

- Design with a mobile-first approach, but every screen must have a deliberate responsive strategy: elements reflow, resize, and reposition gracefully, never just shrinking or overflowing.
- Show at least three frames per screen — mobile (~375px), tablet (~768px), and desktop (~1440px) — so the responsive behavior is unambiguous at every size, not just the two extremes.
- All the animation and motion design described below must also carry through consistently at every breakpoint — a card's fade-in, a button's hover glow, a checkbox's tick animation should feel and look the same whether on a phone or a laptop, not simplified or dropped on smaller screens.
- Explicitly note where the layout structure changes between breakpoints (e.g. a multi-column desktop layout collapsing to a single column on mobile, or a horizontal-scroll fitness schedule on mobile becoming a full 7-column grid on desktop) — but the spacing, typography scale, color usage, and overall "premium" feel must remain visually consistent and intentional at every size, never a degraded version of the desktop design.

## Overall Theme & Visual Direction

- **Style name:** "Calm Premium Wellness" — a holistic health-coach feel that balances calm/mindful (nutrition, habits) with energetic/sporty (fitness), never leaning too hard into either.
- **Color palette:**
  - Base: soft sage green and warm cream/off-white
  - Accent: deep teal or soft coral for primary CTAs and highlights
  - Fitness-energy accent: an electric green or vibrant orange, used sparingly for stats, progress rings, and achievement moments
  - Include a dark mode variant: deep charcoal background with sage green and teal accents
- **Background treatment:** Never flat/plain. Use a soft gradient mesh (sage green blending into cream/peach) with 2-3 large, softly blurred, low-opacity colored blobs floating in the background. Add a very subtle grain/noise texture over the gradient for a tactile, non-flat premium feel.
- **Typography:** Clean modern sans-serif (Inter or Satoshi style) — large confident headings, generous line-height, generous white space throughout. Numbers/stats (calories, workout counts, progress percentages) should use a slightly bolder, tabular-figure style to feel data-forward.
- **Cards & surfaces:** Glassmorphism style — soft blur, subtle transparency, soft drop shadows, generously rounded corners (16-24px radius). Not flat, not harsh.
- **Iconography:** Rounded, soft-line icons (not sharp/aggressive gym-style icons). Consistent stroke weight.

## Motion & Animation Direction (critical — every screen needs this)

This is a motion-first design, not a static one. For every screen, explicitly design and annotate:
- **Buttons:** hover glow/scale-up effect, subtle press/ripple feedback on click
- **Cards:** staggered fade-and-slide-in when a screen loads (each card appears slightly after the previous)
- **Background blobs:** slow, continuous floating/drifting animation (very subtle, ambient)
- **Form inputs:** soft glow on focus, smooth transition between multi-step form sections (fade + slight horizontal slide)
- **Loading states:** an animated, pulsing/breathing indicator, with small animated icons per AI agent that visually activate one at a time as they "complete their work"
- **Numbers/stats reveal:** count-up animation (e.g. a calorie target animating from 0 to its final value), and circular progress rings that animate filling up
- **Checklist/habit items:** a satisfying checkbox-tick animation (checkmark draws in, subtle bounce, item briefly highlights) when marked complete
- **Page transitions:** smooth fade/slide between pages, never an abrupt cut

## Screens to Design

### 1. Landing Page
- Hero section: bold headline ("Your AI Wellness Coach" or similar), subheading explaining the 5-agent system briefly, animated gradient background, prominent "Get Started" CTA
- A section visually explaining the flow: Intake → AI agents work in parallel (Nutrition / Fitness / Habits) → a Supervisor agent combines everything into one plan. Represent this as a simple animated diagram/flow, not plain text.
- A features/benefits section (3-4 cards): personalized nutrition, smart fitness plans, habit tracking, AI-powered synthesis
- Footer with minimal links

### 2. Sign Up / Login
- A single, elegant auth screen with a smooth toggle/tab between "Sign Up" and "Log In" (no separate page reload, just an animated switch between the two forms)
- Sign Up fields: name, email, password (with a subtle strength indicator animation), confirm password
- Log In fields: email, password
- Social-proof or motivational micro-copy beside the form (e.g. a short line about the AI coach), paired with the same soft gradient-blob background as the Landing Page, kept consistent
- Primary CTA button with the same hover glow/press animation used everywhere else
- Subtle shake animation on invalid submit, smooth success transition (fade + slide) into the app on successful auth
- A "Continue as Guest" or minimal-friction alternative is optional but appreciated if it fits the layout — this is a demo/capstone product, so friction should stay low

### 3. Intake Form (multi-step)
Design as a clean multi-step form (not one long form), with smooth transitions between steps:
- Step 1: Goals (multi-select chips: "Lose weight", "Build strength", "Improve energy", etc.)
- Step 2: Basic info (age, weight, height, sex — clean input fields with unit toggles if relevant, e.g. kg/lb)
- Step 3: Activity level (visual selector — e.g. sedentary / lightly active / active / very active, with an icon or illustration per level)
- Step 4: Dietary restrictions (multi-select chips, optional, skippable)
- Step 5: Equipment available + daily time availability (multi-select + a slider or stepper for minutes/day)
- A persistent progress indicator at the top (steps 1 of 5, animated fill)
- "Back" and "Continue" buttons, final step has a prominent "Generate My Plan" CTA

### 4. Loading / Generating Screen
- Full-screen, calming visual state while the backend AI agents run
- Show each of the 4 working agents (Nutrition, Fitness, Habits, then Supervisor synthesizing) as a small animated sequence — e.g. 4 icons/avatars that light up one at a time with a short label ("Analyzing your goals...", "Building your nutrition plan...", "Designing your workouts...", "Bringing it all together...")
- Ambient background animation (floating blobs, soft pulsing) to keep it feeling premium, not like a boring spinner

### 5. Final Plan Results Page
- Top: a summary card (glassmorphism) with the Supervisor's overview text, and a hero stat block (e.g. animated count-up for daily calorie target, a progress ring)
- Below: three expandable/tabbed sections — Nutrition Plan, Fitness Plan, Habit Checklist — each in its own styled card
  - Nutrition: meal cards (breakfast/lunch/dinner/snack) with short descriptions and calorie counts
  - Fitness: a weekly schedule view (7 day cards or a horizontal scroll), each showing focus + exercises
  - Habits: a checklist with animated checkboxes, each habit showing its frequency
- A subtle "Regenerate" or "Adjust my plan" secondary action

### 6. Habit Tracking Dashboard (returning user view)
- A simple calendar/streak view showing daily habit completion history
- Today's habit checklist prominent at the top, with the satisfying checkbox-tick animation
- A small progress/streak stat (e.g. "5-day streak 🔥") with a subtle celebratory animation on milestones

## Deliverable

Produce all 6 screens as high-fidelity, mobile-first (also show a desktop breakpoint for the Landing Page, Sign Up/Login, and Final Plan Results Page), using consistent components (buttons, cards, form inputs, progress indicators) across all screens so they clearly belong to one unified design system. Annotate animation behavior directly on the frames where it's not obvious from the static design alone.
