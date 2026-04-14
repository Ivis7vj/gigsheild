# GigShield - Phase 3 ML-Enhanced Parametric Insurance Platform

![GigShield](https://img.shields.io/badge/GigShield-Parametric_Insurance-FF6B35?style=for-the-badge)

**Weather the storm. Protect your earning score.**

GigShield is a parametric insurance platform for India's gig economy workers (delivery and e-commerce partners). Phase 3 adds ML-driven risk/fraud/approval scoring, an AI claim assistant, warm-light accessibility-first dashboards, and payout orchestration for faster claim resolution.

---

## Key Features

### 1. Automated Zero-Touch Claims
- **24/7 API Monitoring**: We monitor weather APIs continuously for parametric triggers
- **Instant Payouts**: When triggers fire, payouts are processed automatically to UPI within minutes
- **No Manual Filing**: Rule-based engine ensures fair, consistent decisions without paperwork

### 2. ML-Enhanced Fraud Detection System
Multi-signal fraud scoring with model-backed risk confidence:

- **GPS Spoofing Detection**
  - Impossible travel speed detection (e.g., 50km in 2 minutes)
  - Coordinate clustering analysis (multiple claims from exact same location)
  - Location validation against water bodies and highways
  - GPS_FRAUD_SCORE (0-100) per claim

- **Weather Verification**
  - Cross-references claimed disruptions with Open-Meteo historical API data
  - Verifies weather conditions for exact pincode and timestamp
  - Returns VERIFIED / MISMATCH / UNVERIFIABLE status
  - Prevents false weather claims

- **Behavioral Anomaly Detection**
  - Same day-of-week pattern detection (too regular = suspicious)
  - Maximum amount claim patterns
  - Claim burst detection (>3 claims in 7 days)
  - Weighted FRAUD_RISK_SCORE combining all signals

### 3. Instant Payout System
Complete claim-to-payout flow with simulated payment disbursement:

- **Razorpay Test Mode Integration**: Primary payout gateway
- **UPI Simulator Fallback**: Local mock endpoint with realistic UPI responses
- **Payout Timeline**: Visual step-by-step tracking:
  - Claim Submitted → Parametric Trigger Verified → Claim Approved → Payout Initiated → Payout Completed
- **Worker Notifications**: WhatsApp-style payout confirmation with UTR number

### 4. Dynamic Pricing Engine (ML-Enhanced)
- **Risk Scoring Model**: Premiums now include ML risk score (0-100) from worker + zone + claims signals
- **Experience Discounts**: Loyalty bonuses for experienced workers
- **Safe-Zone Discounts**: Lower premiums for low-risk zones
- **Weekly Policy Renewals**: Flexible coverage periods

### 5. Worker Dashboard (Warm Light UI)
Accessibility-first interface showing:
- **Earnings Protected**: Total payout received this month
- **Active Coverage**: Current policy status and covered events
- **Trust Score**: Gamified score (0-100) based on honest claims and consistent check-ins
- **Weather Alerts**: Proactive banners for expected disruptions
- **Claim History**: Last 5 claims with status and payout amounts

### 6. Admin/Insurer Analytics Dashboard (Professional Light UI)
Comprehensive portfolio analytics:
- **Loss Ratio Widget**: (Total Payouts / Total Premiums) × 100
- **Predictive Analytics**: Next week's likely claims based on historical patterns + weather forecast
- **Claims Heatmap**: Geographic distribution by pincode
- **Fraud Risk Summary**: Flagged claims, under review, escalated
- **Portfolio Health Score**: Composite metric (0-100)

### 7. Hyper-Local Granularity
- **Pincode-Level Precision**: Location tracking at 6-digit postal code level
- **Zone-Specific Triggers**: Weather triggers based on worker's specific delivery zone
- **Neighborhood Mapping**: Fine-grained geographic risk assessment

### 8. GigShield Assistant (AI Agent)
- **Claim Advisor**: Guides workers on eligibility and next claim steps
- **Fraud Explainer**: Converts fraud signals to plain language for admins
- **Premium Analyzer**: Explains premium breakdown and savings tips
- **Weather Verifier**: Contextual weather-based verification messaging

### 9. Multi-Language Support (Inclusive Design)
- **Tamil (தமிழ்)**: Full UI translation for Tamil-speaking workers
- **Hindi (हिंदी)**: Full UI translation for Hindi-speaking workers
- **Accessibility**: ARIA labels, color contrast compliance, low-end device optimization

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 + Vite, Recharts, Lucide Icons |
| **Backend** | FastAPI (Python), APScheduler |
| **Database** | MongoDB (Async) |
| **Authentication** | JWT + PIN-based auth, bcrypt |
| **ML/AI** | scikit-learn models (risk/fraud/approval), Groq-backed assistant (with fallback) |
| **External APIs** | OpenWeatherMap, Open-Meteo Historical API, Groq API |
| **Payment Gateway** | Razorpay (Test Mode) + UPI Simulator |
| **Styling** | Vanilla CSS (Glassmorphism 2.0, Iridescent UI) |

---

## Project Structure

```
GigShield/
├── backend/
│   ├── main.py              # FastAPI application entry
│   ├── database.py          # MongoDB connection
│   ├── models.py            # Pydantic models
│   ├── deps.py              # Dependencies (auth, etc.)
│   ├── auth_utils.py        # JWT utilities
│   ├── routes/
│   │   ├── auth.py          # Login/register routes
│   │   ├── workers.py       # Worker profile routes
│   │   ├── claims.py        # Claim submission & payout
│   │   ├── policy.py        # Policy management
│   │   ├── triggers.py      # Parametric trigger engine
│   │   ├── admin.py         # Admin dashboard & fraud
│   │   ├── analytics.py     # Worker analytics
│   │   └── mock.py          # Mock data endpoints
│   └── services/
│       ├── fraud_engine.py  # Multi-signal fraud detection
│       ├── payment_service.py # Razorpay + UPI payouts
│       ├── trigger_engine.py # Parametric trigger logic
│       ├── pricing_engine.py # Actuarial premium calculation
│       └── scheduler.py     # Background job scheduler
├── frontend/
│   └── src/
│       ├── App.jsx          # Main app component
│       ├── main.jsx         # React entry point
│       ├── api/             # API client
│       ├── pages/
│       │   ├── Home.jsx     # Landing page
│       │   ├── Login.jsx    # Worker login
│       │   ├── Register.jsx # Worker registration
│       │   ├── WorkerDashboard.jsx # Worker home
│       │   ├── Analytics.jsx # Worker analytics
│       │   └── AdminDashboard.jsx # Admin panel
│       └── i18n/
│           ├── LanguageContext.jsx # i18n context
│           └── translations.js # en/ta/hi translations
└── tests/
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new worker |
| POST | `/api/auth/login` | Login with phone + PIN |

### Worker
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workers/profile` | Get worker profile |
| GET | `/api/claims/my-claims` | Get user's claims |
| POST | `/api/claims/submit-with-fraud-check` | Submit claim with fraud scoring |
| POST | `/api/claims/{claim_id}/process-payout` | Trigger instant payout |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/workers` | List all workers |
| GET | `/api/admin/claims` | List all claims |
| GET | `/api/admin/fraud-dashboard` | Fraud analytics dashboard |
| POST | `/api/admin/claims/{id}/review` | Review/escalate/approve/reject |
| GET | `/api/admin/analytics/deep` | Portfolio analytics |

### Triggers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/triggers/run-all` | Manually run all triggers |
| GET | `/api/triggers/forecast` | Weather forecast for zone |

---

## ML Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ml/calculate-risk-score` | Predict worker risk score + top 3 factors |
| POST | `/api/ml/fraud-detection` | Predict fraud risk score + confidence |
| POST | `/api/ml/predict-approval` | Predict claim approval probability |

## AI Agent Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai-agent/chat` | Worker/admin conversational assistant |
| POST | `/api/ai-agent/explain-fraud` | Plain-language fraud explanation by claim |
| POST | `/api/ai-agent/explain-premium` | Premium reasoning and savings tips |

## Fraud Scoring

Fraud results combine deterministic signals and ML probability confidence:

```
Final Score = (GPS Score × 0.35) + (Weather Score × 0.30) + 
              (Behavioral Score × 0.20) + (Original Signals × 0.15)
```

| Score Range | Status | Action |
|-------------|--------|--------|
| 0-30 | Low Risk | Auto-approved |
| 31-60 | Medium Risk | Manual review |
| 61-100 | High Risk | Flagged/Escalated |

---

## Installation & Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# Set environment variables
export MONGODB_URI="mongodb://localhost:27017"
export JWT_SECRET="your-secret-key"
export RAZORPAY_KEY_ID="rzp_test_xxxxx"
export RAZORPAY_KEY_SECRET="xxxxx"

# Run server
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Accessibility & Inclusive Design

- **Multi-language**: Tamil and Hindi translations for semi-literate workers
- **Icon + Text Labels**: Never text alone for critical actions
- **Color Contrast**: WCAG AA compliant
- **Low-End Device Support**: Lightweight bundle, no heavy animations
- **ARIA Labels**: Full screen reader support
- **Keyboard Navigation**: All interactive elements accessible via keyboard

---

## Coverage Exclusions

Standard parametric policy exclusions:
- War and Civil Unrest
- Pandemic Outbreaks
- Acts of Terrorism
- Nuclear Hazards
- Intentional self-inflicted damage

---

## Demo Credentials

**Worker Login (demo seed):**
- Phone: `9876543210`
- PIN: `5678`

**Admin Dashboard:**
- URL: `/admin` (no auth required for demo)

---

## Key Innovations

1. **ML in Production Path**: Risk pricing, fraud scoring, and claim approval probability are model-backed.
2. **Hyper-Local Precision**: Pincode-level trigger/risk handling, not city-wide averages.
3. **AI Assistant Layer**: Worker/admin explainability and guidance with fallback-safe responses.
4. **Zero-Touch Claim Flow**: Trigger verification + fraud checks + payout orchestration.
5. **Inclusive Warm-Light UX**: Mobile-first, high readability for semi-literate worker audiences.

---

## License

MIT License - Built for the gig economy, by the gig economy.

---

**GigShield** - Protecting those who deliver.
