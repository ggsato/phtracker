# 📘 **pH Tracker Project — Architecture & Requirements Summary**

*Last updated: 2025-02*

---

# 1. **Project Purpose**

The **pH Tracker** is a personal & family-friendly web application that helps users:

1. **Record daily morning urine pH**
2. **Log dietary, exercise, and health notes**
3. **Search alkaline / acidic foods via PRAL values**
4. (Future) **Integrate Garmin accounts** to compute ATS/TSS
5. (Future) **Model metabolic acidity using Michaelis–Menten–based pH model**
6. Support users of **all ages**, including elderly users via a **simple UI mode**

The system is designed to operate **almost entirely within AWS Free Tier** using serverless components.

---

# 2. **High-Level System Architecture**

```
Frontend (SPA + PWA)
    |
    v
API Gateway (HTTP API, low-cost)
    |
    v
AWS Lambda (Python, FastAPI + Mangum)
    |
    v
DynamoDB (single-table design)
```

### Components

* **Frontend**: React (or Next.js/SvelteKit) + PWA support
* **Backend**: FastAPI running on **AWS Lambda** via `mangum`
* **Database**: DynamoDB (lowest cost, serverless, zero maintenance)
* **Auth**: Cognito for account-level authentication
* **Hosting**: S3 static website + CloudFront CDN

This architecture ensures:

* Extremely low cost (≈ **$0.30/month for ~300 users**)
* Scalability to thousands of users for near-zero additional cost
* Zero server maintenance
* Compatible with your existing Michaelis–Menten model

---

# 3. **Key Design Principles**

### 3.1. **Account owner vs. profile**

* Cognito user = **account owner**
* Each account can manage **multiple profiles**:

  * `Me`
  * `Grandma`
  * `Family member`
* pH logs, preferences, and model outputs are stored **per profile**.

### 3.2. **Simple Mode vs. Advanced Mode**

* **Simple Mode (Grandma Mode)**:

  * Large buttons, high contrast
  * Only shows “Record Today’s pH”
  * Optional voice input
  * Minimal navigation
* **Advanced Mode**:

  * Charts, historical data
  * PRAL table search
  * Garmin integration & ATS/TSS
  * Model fits + predictions

All mode settings stored as per-profile UI preferences.

### 3.3. **Mobile-first UX**

* Designed to work well on an 80-year-old’s smartphone
* PWA for one-tap access
* Offline caching for most recent logs

---

# 4. **Backend API Overview (Lambda + FastAPI)**

### 4.1. User / Accounts

* `GET /me` → return Cognito user metadata
* `GET /profiles` → list profiles
* `POST /profiles` → create profile
* `PATCH /profiles/{profile_id}` → update mode, preferences
* `DELETE /profiles/{profile_id}` → (rarely used)

---

### 4.2. pH Logs

* `GET /ph-logs?profile_id=&start=&end=`
* `GET /ph-logs/{date}?profile_id=`
* `POST /ph-logs` (create or update)
* `DELETE /ph-logs/{date}`

**Per-profile** constraint:
`profile_id + date` is unique.

---

### 4.3. PRAL Database

* `GET /foods?query=&category=&min_pral=&max_pral=`
* `GET /foods/{id}`

Backend simply queries a DynamoDB partition.

---

### 4.4. Garmin Integration (future)

* `POST /garmin/oauth/init`
* `POST /garmin/oauth/callback`
* Garmin Webhook Receiver (push → Lambda)
* Training sessions stored in DynamoDB:

  * date, activity type, intensity, ATS/TSS, metrics
* Will feed your MM-based pH model.

---

### 4.5. pH Modeling Service (future)

* `/model/run?profile_id=`

  * Applies Michaelis–Menten-based spring model
  * Computes lambda, delta, sigma, MRI, NAC, t-half, etc.
* `/model/projection?days_forward=7`

---

# 5. **DynamoDB Single Table Design**

**Partition Key (PK)**: `"USER#<user_id>"`
**Sort Key (SK)**: hierarchical items:

Examples:

| Item Type                | SK Format                                |
| ------------------------ | ---------------------------------------- |
| Profile                  | `PROFILE#<profile_id>`                   |
| pH Log                   | `PHLOG#<profile_id>#2025-02-09`          |
| PRAL item                | `FOOD#<food_id>`                         |
| Garmin activity (future) | `ACTIVITY#<profile_id>#<timestamp>`      |
| Model output             | `MODEL#<profile_id>#<window_start_date>` |

Advantages:

* Ultra-fast queries
* Ultra-low cost
* Easy profile isolation
* All future extensions automatically fit the hierarchy

---

# 6. **Frontend Specification**

## 6.1. PWA Features

* App icon (“pH Tracker”)
* Installable on smartphone home screen
* Offline cache for:

  * Today's input page
  * Last few days of logs
  * PRAL search last results

## 6.2. Pages

### **Simple Mode**

* `/simple` default route for elderly users
* Single page:

  * “Today’s pH”
  * Big slider or dial
  * Optional quick tags
  * Save button

### **Advanced Mode**

* `/log` – add/update today’s pH
* `/history` – table + charts
* `/foods` – PRAL search
* `/settings/garmin` – Garmin connection
* `/settings/profiles` – manage profiles
* (future) `/model` – predictions + charts

---

# 7. **Cost Summary (expected usage: 100–300 users)**

| Component              | Monthly Cost (Estimate) |
| ---------------------- | ----------------------- |
| Lambda                 | ~$0                     |
| API Gateway (HTTP API) | ~$0.06                  |
| DynamoDB               | ~$0.05                  |
| S3 Static Hosting      | ~$0.01                  |
| CloudFront             | ~$0.10–0.20             |
| **Total**              | **≈ $0.30/month**       |

The entire system stays within AWS Free Tier for a long time.

---

# 8. **Development Roadmap**

### **Phase 1: Core logging (MVP)**

* Profiles
* Simple input screen
* pH logs CRUD
* PWA shell

### **Phase 2: PRAL Search**

* Import food DB
* Dynamic search UI
* Option to add foods to daily notes

### **Phase 3: Garmin Integration**

* OAuth
* Webhook
* ATS/TSS engine
* Linking training load with pH logs

### **Phase 4: Modeling**

* Implement MM-based spring model
* Daily predictions
* Trend charts (MRI, NAC, sigma, lambda, delta, etc.)

### **Phase 5: Visualization & Education**

* Charts & health dashboards
* Possible integration with TableauVisualizer for tutorials

---

# 9. **Key Technology Choices**

| Domain     | Choice                     | Reason                                    |
| ---------- | -------------------------- | ----------------------------------------- |
| Backend    | FastAPI + Mangum on Lambda | Python-native, matches your modeling code |
| DB         | DynamoDB                   | Cheapest + zero maintenance               |
| Auth       | Cognito                    | Secure, no passwords needed for grandma   |
| Frontend   | React (PWA)                | Flexibility + component ecosystem         |
| Deployment | SAM / Serverless Framework | Simple CI/CD                              |
| Monitoring | CloudWatch                 | Built-in logs and metrics                 |

---

# 10. **Design Goals (philosophical)**

1. **Simple enough for an 80-year-old**
2. **Powerful enough for a scientist optimizing metabolic models**
3. **Scales from 1 user → 10,000 without changing architecture**
4. **Costs almost nothing**
5. **Embodies your identity as the “Optimization/Modeling Alchemist”**
6. **Extensible for future research (VT1, systemic pH, CO₂ balance)**

# 11. **UI details**


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

