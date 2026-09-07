# 🚀 UNNATI — Verified Home Services, On Demand

> **Smart India Hackathon 2026 · Connecting every home with verified, skilled professionals.**

**UNNATI** (meaning *progress / upliftment*) is a full-stack home-service platform that connects
households with **verified service captains** — electricians, plumbers, carpenters, AC technicians,
mechanics and home-cleaning experts — through a real-time booking engine.

From a broken switch to a full home deep-clean, UNNATI makes finding a *trustworthy* professional
as easy as ordering food online: KYC-verified captains, transparent itemised bills, live booking
tracking and secure payment — online or cash.

---

## ✨ Problem Statement (SIH 2026 Angle)

Households cannot verify the background or skill of local service professionals, pricing is opaque,
and skilled workers have no reliable channel to grow their business. UNNATI solves both sides of the
market with **verification (KYC + document OCR)**, **real-time operations** and **transparent billing**.

---

## ✨ Features

### 👤 Customer
- Secure registration & login (JWT) · Google login option
- Browse live service categories & prices
- Book a service in seconds with auto-detected location
- Live booking status: `Accepted → On the Way → Arrived → Work Started → Bill → Payment → Completed`
- Real-time captain tracking & chat
- Itemised invoice review (labour + spare parts)
- Online payment (Razorpay test mode) or cash; receipt + email copy
- Booking history, profile management, ratings

### 👷 Captain
- Register & complete KYC onboarding (Aadhaar / PAN photo upload)
- Document verification support via OCR + admin review
- Go Online / Offline to receive live booking requests over WebSockets
- Accept / reject jobs, manage the full job lifecycle
- Generate transparent bills with spare-part lines
- Confirm cash payment / verify online payment
- Wallet with earnings, transaction history & settlement requests

### 🛠 Admin
- Dashboard analytics (revenue, bookings, users)
- Approve / reject captain KYC
- Manage customers, captains, bookings, payments, bills, ratings
- Brand settings (company name, support email, GST %)
- Export reports (CSV)

---

## ⚡ Real-Time
WebSocket (Django Channels) live booking requests, live status updates, captain dashboards and chat.

## 💳 Payments
Razorpay test mode (online) + cash, backend-verified, receipts generated & emailed.

## 📧 Email
SMTP (Gmail app-password). If no SMTP is configured, emails print to the server console — handy for demos.

## 🤖 OCR
Aadhaar / PAN extraction via OpenCV + EasyOCR (lazy-loaded) + regex validation.

---

## 📊 Tech Stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 19, React Router, MUI, Framer Motion, Axios, Recharts |
| Backend   | Django 5, Django REST Framework, Django Channels, JWT |
| Database  | SQLite (default, zero-config) **or** MySQL (set `USE_MYSQL=True`) |
| Real-time | WebSockets (Daphne / Channels) |
| Payments  | Razorpay (test mode) |
| OCR       | OpenCV, EasyOCR, Regex |
| Email     | Gmail SMTP (or console) |

---

## 🚀 Quick Start (this repository)

### Prerequisites
- Python 3.11+
- Node.js 20+
- npm

### 1 · Backend

```bash
cd backend

# virtual env + dependencies
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# environment
cp .env.example .env              # defaults are demo-ready (SQLite + console email)

# database
python manage.py migrate
python manage.py seed_demo        # categories, brand settings + demo accounts

# run API server (also serves WebSockets & admin)
python manage.py runserver 0.0.0.0:8000
```

### 2 · Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5174
```

Open **http://localhost:5174** — the Vite dev server proxies `/api`, `/media` and `/ws` to Django on :8000,
so no CORS or port juggling is needed.

---

## 🔑 Demo Accounts (created by `seed_demo`)

| Portal   | URL (after login)   | Email               | Password     |
|----------|---------------------|---------------------|--------------|
| Admin    | `/admin/dashboard`  | `admin@unnati.in`   | `Unnati@2026`|
| Customer | `/customer/dashboard`| `customer@unnati.in`| `Unnati@2026`|
| Captain  | `/captain/dashboard`| `captain@unnati.in` | `Unnati@2026`|

> Captain demo account is **KYC-approved** so the full job flow works instantly.
> You can also click **Sign up** on the Customer / Captain login screens to create new accounts —
> with console email enabled, verification links appear in the Django server log.

### App routes
- Landing/hero: `/`
- Customer: signup `/customer/register`, login `/customer/login`, dashboard `/customer/dashboard`, book `/customer/book`
- Captain: signup `/captain/register`, login `/captain/login`, onboarding/waiting, dashboard `/captain/dashboard`
- Admin: login `/admin/login`, dashboard `/admin/dashboard`
- LandingPage (alt): `/home`

---

## 🗄 Database

- **Default: SQLite** — one file (`backend/db.sqlite3`), perfect for SIH demos & offline judging.
- **MySQL (production-ready)** — in `backend/.env` set `USE_MYSQL=True` and fill `DB_NAME/DB_USER/DB_PASSWORD/DB_HOST/DB_PORT`.

```env
USE_MYSQL=True
DB_NAME=unnati_db
DB_USER=root
DB_PASSWORD=yourpassword
DB_HOST=127.0.0.1
DB_PORT=3306
```

---

## 📧 Email & Payments Setup

Emails: set `EMAIL_HOST_USER` + `EMAIL_HOST_PASSWORD` (Gmail app password) in `backend/.env`.
Payments: replace the Razorpay test keys in `backend/.env` with your own `RAZORPAY_KEY_ID/SECRET`.

---

## 🎯 Demo Flow (for judges)

1. **Admin** → approve a captain's KYC → see revenue analytics.
2. **Captain** → go **Online** → wait for live booking request.
3. **Customer** (2nd browser) → book an Electrician → captain accepts → statuses stream live.
4. **Captain** → starts work → adds spare parts → generates itemised bill.
5. **Customer** → approves invoice → pays online (Razorpay test) or cash.
6. Receipt generated → captain wallet credited → job completed → rating.

---

## 🧑‍💻 Make It Yours (before presenting)

- Update **demo account passwords** & your own team/institute details in
  `backend/services/management/commands/seed_demo.py` and re-run it.
- Add your **team & college name** on the landing hero / mission section
  (`frontend/src/SplineLanding.jsx`) and in this README.
- Rename this GitHub repository from `Workizo-A_service_company` to something like `Unnati-SIH2026`.
- Replace the placeholder **team email / support email** (`support@unnati.in`) in
  `backend/services/models.py` + admin Settings screen with your own.

---

## 📁 Project Structure

```
backend/            Django REST + Channels API
  accounts/         auth, JWT, admin APIs, email-verify pages
  customers/        customer profiles
  workers/          captain profiles, wallets, OCR service
  services/         categories, ratings, SystemSetting, seed_demo command
  bookings/         booking engine, live consumers (WebSockets), chat
  billing/          itemised invoices (PDF), payments (Razorpay verify)
  notifications/    email templates & service
frontend/           React SPA (Vite)
  src/SplineLanding.jsx    hero landing page
  src/customer/  src/captain/  src/admin/   portals
  src/layouts/  src/components/ src/context/  src/services/api.js
```

---

## 🗺 Roadmap / Next Ideas

- Google-Maps-style live captain tracking
- Push notifications & AI service recommendations
- Coupons, subscriptions, wallet top-ups
- Multi-language (Hindi + regional) support — fits the "Unnati" vision

---

## ⚖️ Acknowledgement

Built for **Smart India Hackathon 2026** on an open educational base project (formerly *Workizo*),
re-branded and re-engineered here as **UNNATI** with an independent database, demo data and
same-origin real-time setup. All product branding shown in this repository belongs to the
UNNATI team presenting this project.
