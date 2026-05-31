<<<<<<< HEAD
# ⚖️ NyayaGuide – AI-Powered Indian Legal Assistant

> A secure, DPDP-compliant legal information platform that empowers Indian citizens with AI-driven legal assistance, document management, and case tracking.

---

## 🎯 Project Overview

**NyayaGuide** is a full-stack web application that provides AI-powered legal information services tailored for India. It helps users understand their legal rights, draft applications, manage legal documents, and track case timelines — all while ensuring compliance with India's **Digital Personal Data Protection (DPDP) Act, 2023**.

> **Note:** NyayaGuide provides **legal information only**, not legal advice. Users are always advised to consult a licensed advocate for their specific situations.

---

## 🧩 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | Fast, modern SPA with hot reload |
| **Styling** | TailwindCSS + Custom CSS | Premium glassmorphism UI |
| **State** | Zustand | Lightweight global state management |
| **Backend** | FastAPI (Python) | Async-first REST API |
| **Database** | MongoDB + Beanie ODM | NoSQL document storage |
| **AI / LLM** | Google Gemini 2.5 Flash | Legal analysis & document drafting |
| **Auth** | Email OTP + Google OAuth + JWT | Passwordless authentication |
| **Encryption** | AES-256-GCM | Field-level data encryption |
| **Email** | Gmail SMTP (aiosmtplib) | OTP delivery |
| **File Storage** | AWS S3 / MinIO | Encrypted document storage |
| **Rate Limiting** | SlowAPI | API abuse prevention |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    🖥️  Frontend (React + Vite)                   │
│  Landing Page │ Login/Register │ Dashboard │ AI Chat │ Documents │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP / JSON
┌──────────────────────────▼───────────────────────────────────────┐
│                    ⚙️  Backend (FastAPI)                          │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐            │
│  │ Auth Service │  │ LLM Service │  │  Encryption  │            │
│  │ JWT + OTP    │  │ Gemini AI   │  │  AES-256     │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘            │
│         │                │                 │                     │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼───────┐            │
│  │ Email SMTP  │  │ Google API  │  │   MongoDB    │            │
│  │ (OTP Send)  │  │ (Gemini)    │  │  (Beanie)    │            │
│  └─────────────┘  └─────────────┘  └──────────────┘            │
└──────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                    🗄️  Data Layer                                │
│         MongoDB (Users, Chats, Docs, Logs, Consents)            │
│         S3 / MinIO (Encrypted Document Storage)                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
NyayaGuide/
│
├── 📂 frontend/                    # React + Vite SPA
│   ├── index.html                  # Entry HTML + Google GSI script
│   ├── .env                        # VITE_GOOGLE_CLIENT_ID
│   ├── src/
│   │   ├── App.jsx                 # Router & route definitions
│   │   ├── main.jsx                # React entry point
│   │   ├── index.css               # Design system & theme
│   │   ├── lib/
│   │   │   └── api.js              # Axios instance (base URL, auth headers)
│   │   ├── store/
│   │   │   └── authStore.js        # Zustand auth state (token, user)
│   │   ├── components/
│   │   │   ├── DashboardLayout.jsx # Sidebar + top nav layout
│   │   │   ├── AdminLayout.jsx     # Admin panel layout
│   │   │   └── ProtectedRoute.jsx  # Auth guard (user & admin)
│   │   └── pages/
│   │       ├── LandingPage.jsx     # Public homepage
│   │       ├── LoginPage.jsx       # Email OTP + Google Sign-In
│   │       ├── RegisterPage.jsx    # 3-step: Details → Consent → OTP
│   │       ├── dashboard/
│   │       │   ├── DashboardHome.jsx    # Overview & stats
│   │       │   ├── ChatPage.jsx         # AI Legal Chat
│   │       │   ├── ApplicationsPage.jsx # Draft legal applications
│   │       │   ├── DocumentsPage.jsx    # Upload & manage docs
│   │       │   ├── NotesPage.jsx        # Personal legal notes
│   │       │   ├── TimelinePage.jsx     # Case timeline tracker
│   │       │   ├── CalendarPage.jsx     # Legal calendar / hearings
│   │       │   ├── LegalTrendsPage.jsx  # Legal news & trends
│   │       │   └── ProfilePage.jsx      # User profile & settings
│   │       └── admin/
│   │           ├── AdminDashboard.jsx   # Admin overview
│   │           ├── AdminLogs.jsx        # Audit trail viewer
│   │           └── AdminConsents.jsx    # DPDP consent records
│
├── 📂 backend/                     # FastAPI Python API
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # All secrets & config
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS, routers
│   │   ├── config.py               # Pydantic Settings (env loader)
│   │   ├── db/
│   │   │   └── database.py         # MongoDB + Beanie init
│   │   ├── models/
│   │   │   ├── user.py             # User document model
│   │   │   ├── legal_chat.py       # Chat history model
│   │   │   ├── document.py         # Uploaded document model
│   │   │   ├── user_note.py        # Notes model
│   │   │   ├── case_timeline.py    # Timeline events model
│   │   │   ├── calendar_event.py   # Calendar events model
│   │   │   ├── consent.py          # DPDP consent records
│   │   │   └── audit_log.py        # Audit trail model
│   │   ├── services/
│   │   │   ├── auth.py             # JWT creation & validation
│   │   │   ├── email_otp.py        # OTP generation & email sending
│   │   │   ├── encryption.py       # AES-256 encrypt/decrypt
│   │   │   └── llm.py              # Gemini AI integration
│   │   └── api/
│   │       ├── auth_routes.py      # Register, login, OTP, Google Auth
│   │       ├── user_routes.py      # Profile, data export, delete
│   │       ├── chat_routes.py      # AI legal chat endpoints
│   │       └── resource_routes.py  # Docs, notes, timeline, calendar, trends, admin
│
└── start_servers.bat               # One-click start both servers
```

---

## 🔐 Authentication Flow

NyayaGuide uses **passwordless authentication** for enhanced security:

### Option 1: Email OTP Login
```
User enters email
    → Backend generates 6-digit OTP
    → OTP sent to user's email via Gmail SMTP
    → User enters OTP on the verification screen
    → Backend verifies OTP hash & issues JWT token
    → User redirected to Dashboard
```

### Option 2: Google Sign-In
```
User clicks "Continue with Google"
    → Google popup for account selection
    → Google returns ID token to frontend
    → Frontend sends ID token to backend
    → Backend verifies token with Google API
    → Auto-register if new user (consent implied)
    → JWT token issued → redirect to Dashboard
```

---

## ✨ Key Features

### 🤖 AI Legal Chat
- Powered by **Google Gemini 2.5 Flash**
- Provides structured legal information with:
  - Relevant Indian Acts & Sections
  - Rights identification
  - Risk level assessment (Low / Medium / High)
  - Confidence scoring (0–100)
  - Recommended next steps
  - Legal references & citations
- Supports **English, Hindi, and Telugu**

### 📝 Application Drafting
- AI-generated legal applications (RTI, complaints, petitions, etc.)
- Structured output with subject, body, required attachments, and submission steps

### 📄 Document Management
- Upload and store legal documents securely
- Encrypted at rest via S3/MinIO

### 📅 Calendar & Timeline
- Track court hearing dates and legal deadlines
- Visual case timeline with milestones

### 📓 Legal Notes
- Personal note-taking for legal matters
- Organized and searchable

### 📊 Legal Trends
- Stay updated with legal news and developments

### 👤 User Profile
- Manage personal information
- Data export capability (DPDP compliance)
- Account deletion with complete data erasure

---

## 🛡️ Security & DPDP Compliance

| Feature | Implementation |
|---------|---------------|
| **Passwordless Auth** | Email OTP (single-use, 10-min expiry) + Google OAuth |
| **JWT Tokens** | Stateless authentication, 24-hour expiry |
| **Field Encryption** | AES-256-GCM on sensitive fields (phone, DOB, address) |
| **Consent Management** | Explicit consent collection during registration |
| **Audit Trail** | Every action logged (login, register, data access) |
| **Data Export** | Users can export all their personal data |
| **Right to Erasure** | Complete account and data deletion |
| **Rate Limiting** | API abuse prevention via SlowAPI |
| **CORS** | Configured to allow only the frontend origin |

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **MongoDB** (local or Atlas)
- **Google Gemini API key** – [Get free key](https://aistudio.google.com/app/apikey)

### Quick Start

**1. Backend Setup**
```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
pip install -r requirements.txt
# Edit .env with your credentials
uvicorn app.main:app --reload --port 8000
```

**2. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

**3. One-Click Start** (Windows)
```bash
start_servers.bat
```

Open **http://localhost:3000** to access the application.

---

### Environment Variables

#### Backend `.env`
| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `ENCRYPTION_KEY` | AES-256 encryption key (base64) |
| `SMTP_USER` | Gmail address for sending OTPs |
| `SMTP_PASS` | Gmail App Password (16 chars) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `S3_ENDPOINT` | S3/MinIO endpoint URL |

#### Frontend `.env`
| Variable | Description |
|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Same Google OAuth Client ID |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register with DPDP consent |
| `POST` | `/api/auth/send-otp` | Send login OTP to email |
| `POST` | `/api/auth/verify-otp` | Verify OTP → get JWT |
| `POST` | `/api/auth/google` | Google OAuth sign-in |
| `GET` | `/api/auth/me` | Get current user profile |
| `PUT` | `/api/users/profile` | Update user profile |
| `GET` | `/api/users/export` | Export all user data (DPDP) |
| `DELETE` | `/api/users/delete` | Delete account & all data |
| `POST` | `/api/chat/send` | Send message to AI assistant |
| `GET` | `/api/chat/history` | Get chat history |
| `POST` | `/api/documents/upload` | Upload a document |
| `GET` | `/api/documents` | List user documents |
| `POST` | `/api/notes` | Create a note |
| `GET` | `/api/notes` | List user notes |
| `GET` | `/api/health` | Health check |

> 📖 Full interactive API docs: **http://localhost:8000/api/docs** (Swagger UI)

---

## 🎨 UI / UX Design

The frontend features a **premium dark theme** with:
- 🌌 Glassmorphism card effects
- 🎨 Blue-to-purple gradient accents
- ✨ Smooth micro-animations
- 📱 Fully responsive layout
- 🔤 Modern typography (Inter + Outfit fonts)

---

## 📜 License

**Private** – All rights reserved.

---

<div align="center">

*Built with ❤️ for Indian citizens to understand their legal rights*

**⚖️ NyayaGuide — Justice Made Accessible**

</div>
=======
# nyaya-guide
>>>>>>> 872b5efb3fc76f076445c598137d09d425b01643
