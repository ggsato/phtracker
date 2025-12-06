## 1. Frontend: “Grandma-first” UX, same backend

Your Lambda + API Gateway + DynamoDB design still works perfectly.

What changes is **how the UI is delivered and structured**:

### 1.1. Keep it a SPA, but add PWA

* Keep **React + Vite** (or similar) and host on **S3 + CloudFront**.
* Add **PWA** features:

  * “Add to Home Screen” → it feels like a native app.
  * Basic offline caching of:

    * Latest pH log
    * PRAL search last results
* This makes it easier for your grandma:

  * Big icon on home screen
  * No visible browser controls needed
  * Faster startup after first use

**Architecture change:**
Add a **service worker** + `manifest.json`, but **no backend change**.

---

## 2. Auth: Separate “account owner” from “app user”

Biggest friction for older users: **accounts & passwords**.

### 2.1. Recommended pattern

* **One Cognito user = one “account owner” (you, or family)**
* That account can manage **multiple profiles**:

  * `me`
  * `grandma`
  * `grandpa`
  * etc.

Your grandma never needs to:

* Create an account
* Remember a password
* Deal with email verification

She just uses a screen you’re already logged into.

### 2.2. Architecture changes

**Data model addition:**

* Table `profiles` (or extend `users` conceptually):

  * `profile_id` (PK)
  * `owner_user_id` (Cognito user)
  * `display_name` (`"Me"`, `"Grandma"`, etc.)
  * `birth_year` (optional, for modeling)
  * `is_default`

**pH logs**:

* Add `profile_id` alongside `user_id` so data is separated per profile.

```text
PK: USER#<owner_user_id>
SK: PROFILE#<profile_id>   # profile info
SK: PHLOG#<profile_id>#<date>   # pH data
```

**Frontend:**

* A simple **profile switcher** at the top:

  * Usually invisible (you always stay on “Me”)
  * But when you’re with grandma, you choose “Grandma”.

Later, the same concept supports “household” usage.

---

## 3. UI Modes: “Simple Mode” vs “Expert Mode”

You’ll eventually want power-user features for yourself (plots, ATS, MRI, NAC, MM curves…) and **ultra-simple** for grandma.

### 3.1. UX idea

* **Simple mode**:

  * Full screen:

    * “Today’s pH”
    * 1–2 large buttons (“Same as usual”, “Not feeling well”)
  * One big **slider or dial** for pH (e.g. 4.5–8.5).
  * Save button is large and obvious.
  * No menu. No analytics. Just: “Open → enter value → done”.

* **Expert mode**:

  * You see full dashboards, charts, filters, PRAL graphs.

### 3.2. Architecture implication

Small addition:

* For each `profile`, store a `mode` ( `"simple"` | `"advanced"` ).
* Or per `profile`, store UI preferences in a JSON field:

  * `ui_prefs = { "mode": "simple", "font_size": "large" }`

Backend impact: **tiny** (just store/read these prefs).
Frontend uses them to toggle which components to show.

---

## 4. Mobile-first Design and Performance

No major architectural change, but some **clear guidelines**:

* **Design for smartphone first**:

  * Use a design system optimized for thumbs:

    * e.g. Material UI / Chakra UI with large tap targets.
  * Avoid tiny tables, dense charts on the default screen.
* **Font & layout**:

  * Base font size: **16–18px**
  * High color contrast (no light gray text).
* **Performance**:

  * Code-splitting:

    * Simple mode (daily input) is tiny bundle.
    * Heavy analytics screens (charts) are lazy-loaded.
  * This helps older devices and slow connections.

Technically:

* Same S3 + CloudFront hosting.
* Same API architecture.
* Just careful frontend bundling & component splitting.

---

## 5. Voice / Assistive Support (optional, but future-proof)

If you want to go further:

* Add a “🎙 voice input” button in simple mode:

  * Grandma taps and says:
    “Today my pH is six point eight.”
* Use browser speech recognition (where available) or keep it as a future enhancement.
* Make sure UI is **screen-reader friendly** (ARIA labels, proper HTML structure).

Again, mostly **frontend concerns**, no deep backend changes.

---

## 6. Summary of Architecture Changes

**What stays the same:**

* AWS Lambda + API Gateway (HTTP API)
* DynamoDB (single-table or multi-table)
* S3 + CloudFront frontend hosting
* Cognito for authentication

**What we add/extend:**

1. **Profiles layer** in the data model

   * One Cognito user → many profiles (grandma, etc.).
   * `ph_logs` keyed by `profile_id`.
2. **UI modes & prefs**

   * Stored per profile (simple vs advanced).
3. **PWA frontend**

   * App icon, offline caching, better mobile UX.
4. **Mobile-first, accessibility-first design**

   * Larger fonts/buttons, simplified “grandma mode” screen.

Backend impact: **small but important** (mainly `profiles` + `profile_id` in logs).
Frontend impact: **where most of the grandma-friendly work happens**.

