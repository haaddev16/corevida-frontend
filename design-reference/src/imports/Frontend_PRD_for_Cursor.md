# Frontend PRD — Corevida (for Cursor, to be used alongside Figma design export)

**Purpose:** This document maps every screen to the exact backend API calls and data shapes it needs, so Cursor can wire the Figma design to the real FastAPI backend without guessing field names. Backend is already built and tested. Reference: `AI_Wellness_Coach_PRD_v2.md` for full architecture context.

**Backend base URL (local dev):** `http://127.0.0.1:8000`
**Tech stack:** Next.js (App Router), Tailwind CSS, TypeScript preferred if not too costly in time — otherwise plain JS is acceptable given the deadline.

---

## Screen 1: Landing Page

- No API calls. Static content + CTA button ("Get Started") that navigates to the Intake Form.

---

## Screen 2: Sign Up / Login

**⚠️ Backend addition required — this doesn't exist yet and needs to be built alongside the frontend:**

1. Add a `password` column to the `User` model (`app/models.py`):
   ```python
   password = Column(String, nullable=False)
   ```
   (Run a migration / recreate the table, since `users` may already have rows without this column.)

2. Add two new endpoints to `app/routes.py`:
   - **`POST /api/signup`** — body: `{ "name": "...", "email": "...", "password": "..." }`. Hash the password (use `passlib` with bcrypt) before storing. Return the same shape as the existing `/api/users` response (`id`, `email`, `name`, `created_at`).
   - **`POST /api/login`** — body: `{ "email": "...", "password": "..." }`. Look up the user by email, verify the password hash, return `{ "id": "...", "email": "...", "name": "..." }` on success or a 401 with `{"detail": "Invalid credentials"}` on failure.
   - This is intentionally minimal — no JWT/session tokens, no password reset flow. Store the returned `id` as `user_id` in localStorage on the frontend and treat that as "logged in" for the rest of the app. This matches the capstone's scope (the graded focus is the multi-agent AI system, not a production auth system).

**Frontend:**
- On successful sign up or login, store `user_id` (and optionally `name`) in localStorage, then navigate to the Intake Form.
- If `user_id` already exists in localStorage on app load, skip Sign Up/Login entirely and go straight to the Intake Form (or a returning-user landing state).
- The existing `POST /api/users` endpoint becomes redundant once `/api/signup` exists — either remove it or leave it unused; `/api/signup` is now the way users get created.

---

## Screen 3: Intake Form (multi-step)

Collects data matching the `IntakeInput` schema exactly. Field names must match exactly since they're sent directly to the backend:

```typescript
{
  goals: string[],                      // e.g. ["lose weight", "build strength"]
  age: number,
  weight_kg: number,
  height_cm: number,
  sex: string,                          // "male" | "female" | "other"
  activity_level: string,               // "sedentary" | "lightly active" | "active" | "very active"
  dietary_restrictions: string[],       // e.g. ["vegetarian"], can be empty []
  equipment_available: string[],        // e.g. ["dumbbells"], can be empty []
  time_availability_minutes: number
}
```

**On final step submit, `user_id` should already exist (from Sign Up/Login) — call in this order:**

1. **`POST /api/profile`** — Body:
   ```json
   {
     "user_id": "<from Sign Up/Login>",
     "intake": { ...all IntakeInput fields above... }
   }
   ```
   Response:
   ```json
   {
     "profile_id": "...",
     "user_id": "...",
     "profile": { ...IntakeOutput fields, including a "summary" string... }
   }
   ```
   Store `profile_id` — needed for the next call.

2. Navigate to the Loading screen, then immediately call:

   **`POST /api/plan`** — Body:
   ```json
   { "profile_id": "<from step 1>" }
   ```
   This call takes longer (runs 4 agents). Response:
   ```json
   {
     "plan_id": "...",
     "nutrition_plan": { "daily_calorie_target": number, "meals": [{ "name": "...", "description": "...", "estimated_calories": number }], "notes": "..." },
     "fitness_plan": { "weekly_schedule": [{ "day": "...", "focus": "...", "exercises": [{ "name": "...", "sets": number, "reps": "..." }] }], "notes": "..." },
     "habit_checklist": { "habits": [{ "name": "...", "frequency": "...", "reminder_time": "..." }] },
     "final_plan": { "summary": "...", "nutrition_highlights": "...", "fitness_highlights": "...", "habit_highlights": "...", "key_recommendations": ["...", "..."] }
   }
   ```
   Store `plan_id` — needed for the Results page and Habit Dashboard.

---

## Screen 4: Loading / Generating Screen

- No direct API call itself — this screen is shown *while* `POST /api/plan` (above) is in flight.
- Since the backend doesn't stream progress per-agent, the 4-step animated sequence (Nutrition → Fitness → Habits → Supervisor) should be a **timed UI animation** (e.g. auto-advance every 3-4 seconds) that runs while waiting for the single `/api/plan` response, then completes/skips ahead once the real response arrives. Don't block on individual agent completion signals — there aren't any from this endpoint.

---

## Screen 5: Final Plan Results Page

- Data comes entirely from the `POST /api/plan` response above (no extra fetch needed if navigating directly after generation).
- If the user returns later (e.g. via a link with `plan_id` in the URL), fetch via:

  **`GET /api/plan/{plan_id}`** — same response shape as `/api/plan`'s POST response, plus `user_id`, `profile_id`, `created_at`.

- Map fields to the Figma design as follows:
  - Summary card → `final_plan.summary`
  - Hero stat (calorie count-up) → `nutrition_plan.daily_calorie_target`
  - Nutrition tab → `nutrition_plan.meals` (map each to a meal card: name, description, estimated_calories)
  - Fitness tab → `fitness_plan.weekly_schedule` (map each day to a day card: day, focus, exercises list)
  - Habits tab → `habit_checklist.habits` (map each to a checklist row: name, frequency)
  - "Key recommendations" (if designed as a small highlight list) → `final_plan.key_recommendations`

---

## Screen 6: Habit Tracking Dashboard

**On load:**

**`GET /api/habits/{plan_id}`** — Response:
```json
{
  "habits": { "habits": [{ "name": "...", "frequency": "...", "reminder_time": "..." }] },
  "logs": [{ "id": "...", "habit_name": "...", "log_date": "...", "completed": true/false }]
}
```
- Render today's checklist from `habits.habits`, cross-referencing `logs` for today's date to show current checked/unchecked state.
- Render a simple streak/history view from the full `logs` array (group by date).

**When user checks off a habit for today:**

**`POST /api/habits/log`** — Body:
```json
{
  "plan_id": "<plan_id>",
  "habit_name": "<the habit's name>",
  "log_date": "2026-09-12",
  "completed": true
}
```
- Trigger the checkbox-tick animation optimistically (before the API responds) for snappy UX, then confirm/rollback based on the response.

---

## Optional / Nice-to-have (only if time permits after core flow works)

**`GET /api/plan/user/{user_id}`** — list of past plans, could power a simple "Plan History" list if there's time.

**`GET /api/agent-runs/{plan_id}`** — full trace of each agent's input/output. Not user-facing, but useful for a "Debug / How it works" panel if you want to visually show the multi-agent handoffs happening (could be a nice differentiator for the demo — showing the actual agent trace builds credibility with the teacher).

---

## Error Handling Notes

- `/api/plan` can occasionally fail with a `500` if a Gemini API key hits its free-tier daily quota (20 requests/day). Handle this gracefully in the UI — show a friendly "Our AI coach is a bit busy, please try again in a moment" message rather than a raw error, since this is a known constraint of the free-tier setup during demo/testing.
- All endpoints return standard HTTP error codes (404 for not found, 422 for validation errors, 500 for server errors) with a JSON `{"detail": "..."}` body — surface `detail` in error toasts where reasonable.
