# GigShield - Rule-Based Parametric Insurance for Gig Workers

![GigShield](https://img.shields.io/badge/GigShield-Parametric_Insurance-FF6B35?style=for-the-badge)

**Weather the storm. Protect your earning score.**

GigShield is a comprehensive rule-based parametric insurance platform designed specifically for India's gig economy workers (delivery partners, ride-share drivers). Unlike traditional insurance with lengthy claim processes, GigShield uses real-time data triggers and automated detection systems to provide instant protection payouts when workers are most vulnerable.

---

## Key Features

### 1. Automated Zero-Touch Claims
- **24/7 API Monitoring**: We monitor weather APIs continuously for parametric triggers
- **Instant Payouts**: When triggers fire, payouts are processed automatically to UPI within minutes
- **No Manual Filing**: Rule-based engine ensures fair, consistent decisions without paperwork

### 2. Advanced Fraud Detection System
Multi-signal automated fraud detection protecting the platform from abuse:

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

### 4. Dynamic Pricing Engine
- **Actuarial Risk Assessment**: Premiums adjust based on automated risk rules
- **Experience Discounts**: Loyalty bonuses for experienced workers
- **Safe-Zone Discounts**: Lower premiums for low-risk zones
- **Weekly Policy Renewals**: Flexible coverage periods

### 5. Worker Dashboard
High-density interface showing:
- **Earnings Protected**: Total payout received this month
- **Active Coverage**: Current policy status and covered events
- **Trust Score**: Gamified score (0-100) based on honest claims and consistent check-ins
- **Weather Alerts**: Proactive banners for expected disruptions
- **Claim History**: Last 5 claims with status and payout amounts

### 6. Admin/Insurer Analytics Dashboard
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

### 8. Multi-Language Support (Inclusive Design)
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
| **External APIs** | OpenWeatherMap, Open-Meteo Historical API |
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

## Fraud Detection Scoring

The fraud engine uses a weighted scoring model:

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

**Worker Login:**
- Phone: `9876543210`
- PIN: `1234`

**Admin Dashboard:**
- URL: `/admin` (no auth required for demo)

---

## Key Innovations

1. **Parametric Triggers**: No claims adjuster needed - payouts fire automatically when data thresholds are met
2. **Rule-Based Transparency**: Every decision is explainable via deterministic rules (no black-box AI)
3. **UPI Integration**: Direct-to-wallet payouts eliminate payment friction
4. **Fraud Prevention**: Multi-layer detection without ML complexity
5. **Hyper-Local Precision**: Pincode-level triggers, not city-wide averages

---

## License

MIT License - Built for the gig economy, by the gig economy.

---

**GigShield** - Protecting those who deliver.
