# UNNATI — SIH 2026 Jury Demonstration Guide

**Operational Mode**: `DEMO MODE — LOCAL HOST + CLOUDFLARE QUICK TUNNEL`  
**Cost**: **₹0.00 / $0.00** (No cloud billing, no credit card, no domains required)

---

## 1. One-Command Startup

To start the complete UNNATI system and make it instantly reachable on the public internet, open a terminal on your Mac in the project repository and run:

```bash
./scripts/run_local_tunnel.sh
```

### What this command does automatically:
1. **Dependency Verification**: Confirms Node.js, npm, Python 3.12, and `cloudflared` are present.
2. **Database Migrations**: Applies all pending Django relational migrations automatically.
3. **Demo Persona Seeding**: Ensures demo accounts for **Customer**, **Worker**, and **Admin** are created and active.
4. **Static & Frontend Build**: Prepares Django static files and verifies the React Vite production SPA build (`dist/`).
5. **Port Sanitization**: Automatically terminates any stale processes lingering on ports `8000` or `5173`.
6. **Service Boot**: Starts the Daphne ASGI Server (port 8000) and Local Unified Gateway (port 5173).
7. **Cloudflare Quick Tunnel**: Creates an encrypted public HTTPS/WSS tunnel to Cloudflare's global edge network.
8. **End-to-End Verification**: Verifies `/healthz`, `/api/health/`, and live WebSocket connectivity before presenting the URL.

---

## 2. What URL to Open

When the launcher finishes, it will print your live session URL:
```text
🌐 PUBLIC DEMO URL : https://<session-id>.trycloudflare.com
```

* **Desktop Browser**: Open this link directly to show the jury the full desktop experience.
* **Mobile Phone / Tablet**: Open the link on any mobile phone or share the link with jury members to show real-time responsive design.

---

## 3. Recommended SIH Jury Demonstration Sequence

Walk the jury through UNNATI’s core differentiators in this structured 10-step sequence:

### Step 1: Landing Page & Problem Statement
* Open the **Public Demo URL** root (`/`).
* **Highlight**: UNNATI is India's first worker-owned digital service cooperative, solving the 25–40% extractive platform commissions of traditional aggregator apps.

### Step 2: Customer Service Discovery & Fair Pricing
* Click **"Explore Services"** or browse categories (Electrician, Plumber, Carpenter, etc.).
* **Highlight**: Open, transparent base pricing with zero algorithmic surge pricing and zero hidden customer booking fees.

### Step 3: Transparent Booking Lifecycle
* Log in as Customer (`customer@unnati.org` / `Customer@1234`).
* Book an immediate or scheduled service.
* **Highlight**: The transparent cost breakdown is visible to the customer *before* confirmation.

### Step 4: Worker Real-Time Opportunity Dispatch
* Open an incognito window or mobile phone and log in as Worker (`worker@unnati.org` / `Worker@1234`).
* Observe the incoming job alert via real-time WebSockets without refreshing the page.
* Accept the opportunity.

### Step 5: Geofenced Arrival & Direct Lifecycle Tracking
* Transition the booking through lifecycle states (En Route → Arrived → In Progress → Completed).
* **Highlight**: Server-authoritative state machine prevents fraudulent progress updates.

### Step 6: 100% Direct Worker Payment (Zero Custodial Escrow)
* View the final invoice.
* Customer pays the worker directly via mock UPI QR / Direct Bank Transfer.
* **Compliance Note**: UNNATI never holds customer funds in custodial escrow; 100% of the service fee goes directly to the service provider.

### Step 7: Cooperative Allocation & Worker Dividends
* In the Worker Dashboard, inspect the **Earnings & Cooperative Allocation** tab.
* **Highlight**: Transparent cooperative surplus allocation, social security contributions, and patron dividend accrual.

### Step 8: Mutual Two-Way Rating & Trust Verification
* Customer rates the worker; Worker rates the customer.
* **Highlight**: Decentralized peer endorsements and verifiable skill badges rather than punitive 1-star algorithmic deactivations.

### Step 9: Cooperative Operations Center & Democratic Governance
* Log in as Administrator (`admin@unnati.org` / `Admin@1234`) and navigate to `/admin/operations/`.
* **Highlight**: Cooperative economics overview, dispute resolution triage, transparent audit logs, and democratic proposal voting.

### Step 10: Multilingual / Voice Assistant
* Demonstrate the AI Voice / Regional language interaction helper.

---

## 4. Verified Demonstration Personas

| Persona | Email | Password | Role / Showcase Focus |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@unnati.org` | `Customer@1234` | Fair discovery, zero surge, direct UPI payment |
| **Worker (Captain)** | `worker@unnati.org` | `Worker@1234` | Real-time WebSocket alerts, earnings dashboard, skill badges |
| **Administrator** | `admin@unnati.org` | `Admin@1234` | Cooperative operations, triage, economic audits, governance |

---

## 5. How to Stop the Demo

To stop the demo at any time:
1. Return to the terminal where `./scripts/run_local_tunnel.sh` is running.
2. Press **`Ctrl + C`**.

The launcher's automated cleanup trap will:
* Terminate the Cloudflare Quick Tunnel immediately.
* Stop the Daphne ASGI server and Node unified gateway.
* Kill any remaining background child processes.
* Release ports `8000` and `5173`.

---

## 6. Troubleshooting

* **Port Already in Use**: The script automatically runs `lsof -ti:8000 | xargs kill -9` and `lsof -ti:5173 | xargs kill -9`. If a process refuses to terminate, run:
  ```bash
  killall node daphne cloudflared 2>/dev/null || true
  ```
* **Cloudflare Edge Delay**: When first launched, Cloudflare takes 3–5 seconds to propagate the new random subdomain across edge servers worldwide. The script automatically handles this wait.
* **Logs Inspection**: Standard output and error logs are saved cleanly to `scripts/logs/`:
  * Daphne ASGI: `scripts/logs/daphne.log`
  * Gateway Proxy: `scripts/logs/gateway.log`
  * Cloudflare Tunnel: `scripts/logs/cloudflared.log`

---

## 7. Important ₹0 / Quick Tunnel Limitations

1. **Mac Awake Requirement**: Because this ₹0 path tunnels directly from your Mac, the public URL works **only while your Mac is awake and connected to the internet**. Disable system sleep during jury presentations.
2. **Ephemeral URL**: Each time `./scripts/run_local_tunnel.sh` is started, Cloudflare assigns a new temporary subdomain (`https://<random>.trycloudflare.com`).
3. **Mock Integrations Notice**: For the SIH demonstration, third-party payment gateways (Razorpay/UPI), Aadhaar OCR, and SMS notification gateways operate in developer-sandbox/mock mode to guarantee ₹0 cost without requiring live paid API keys.
