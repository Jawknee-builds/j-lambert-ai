# 📞 LeadPilot AI MVP — Luxury Real Estate Voice Concierge

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![NodeJS](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)](#)
[![Gemini](https://img.shields.io/badge/Model-Gemini%202.5%20Flash-blue.svg)](#)
[![Voice SDK](https://img.shields.io/badge/Voice%20SDK-Vapi%20AI-00A884.svg)](#)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E.svg)](#)
[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?repository=github.com/Jawknee-builds/j-lambert-ai&branch=main&name=j-lambert-ai)
[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/Jawknee-builds/j-lambert-ai)

LeadPilot AI is an enterprise-grade autonomous voice concierge designed specifically for AU/NZ luxury real estate teams. Powered by **Vapi AI WebRTC audio channels** and **Gemini 2.5 Flash reasoning engines**, it acts as a digital front-desk, dynamically parsing and answering complex real estate brochure contexts, answering inbound buyer enquiries, scoring intent (Hot/Warm/Cold), and extracting client budgets, timelines, and finance approvals in under 60 seconds.

👉 **[Live Demo Deployment URL](https://jlambert-production.up.railway.app/app.html)**


---

## 🏗️ Voice Conversational & Intent Extraction Pipeline

LeadPilot operates by dynamically loading unstructured markdown and PDF property brochures into the AI assistant's context. During a WebRTC call, the voice engine conducts real-time speech matching. On hang-up, the complete conversation is analyzed by the **Gemini API** using structured JSON schemas to classify lead intent.

### Telemetry Conversational Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Home Buyer (Browser Voice)
    participant Vapi as Vapi WebRTC Gateway
    participant Server as Node.js API Server
    participant Gemini as Gemini 2.5 Flash
    database DB as Supabase / JSON DB
    
    Buyer->>Vapi: Start Live Session (Speak via Mic)
    Vapi->>Server: Request Catalog Data (/api/vapi-config)
    Server-->>Vapi: catalog markdown/PDF content
    Vapi-->>Buyer: Voice conversation (Property context matched)
    Buyer->>Vapi: Hang up / End Session
    Vapi->>Server: dispatch conversation transcript
    Server->>Gemini: POST /api/extract-lead (Analyze transcript)
    Gemini-->>Server: Inferred lead parameters (budget, timeline, finance)
    Server->>Server: Score lead (Hot/Warm/Cold) & Next steps
    Server->>DB: Insert enriched lead record
    Server-->>Buyer: Update glassmorphic dashboard in real-time
```

---

## ✨ Features Breakdown

- [x] **WebRTC Audio Concierge**: Instant in-browser microphone connection using Vapi SDK to converse with a real-time, low-latency luxury real estate agent.
- [x] **Dynamic Context Synchronization**: Sync brand catalogs, description FAQs, or PDF property listings into the AI agent's brain dynamically.
- [x] **Automatic Data Extraction & Scoring**: Harnesses **Gemini 2.5 Flash** to extract user budget, timelines, and finance approvals. Evaluates and scores lead temperature in real-time.
- [x] **Scheduled Viewing Management**: Fully operational scheduler allowing real-time inspection booking.
- [x] **Production Grade Analytics**: Visualizes cumulative efficiency minutes saved using Chart.js line charts.

---

## 🚀 Running Locally & Environment Setup

### 1. Prerequisites
- **Node.js** (v18.x or later)
- **Google Gemini API Key** (from Google AI Studio)

### 2. Quick Start
1. Clone the repository:
   ```bash
   git clone https://github.com/Jawknee-builds/j-lambert-ai.git
   cd j-lambert-ai
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Configure environment keys:
   Rename `.env.example` to `.env` and configure your API credentials:
   ```env
   GEMINI_API_KEY=AIzaSy... (Your Google AI Studio Key)
   PORT=4173
   # Optional: Add Supabase URL and Key to persist data in PostgreSQL
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=eyJhbGc...
   ```
4. Fire up the server:
   ```bash
   npm start
   ```
   Open `http://localhost:4173/app.html` in your browser.

---

## 🌩️ Production Deployment (Koyeb & Railway)

The codebase is fully optimized for continuous serverless delivery:

### 1. Koyeb Deployment (Recommended - Free Forever with 0 sleep time)
1. Click the **Deploy to Koyeb** button above or log into the [Koyeb Dashboard](https://app.koyeb.com).
2. Create a new Service and choose **GitHub** as the deployment method.
3. Select the `j-lambert-ai` repository.
4. Set the following environment variables in the variables manager:
   - `GEMINI_API_KEY` = (Your AI Studio Key)
   - `PORT` = `8000` (or leave default)
5. Click **Deploy**. Koyeb will compile and serve the Node server permanently online with zero sleep limits.

### 2. Railway Deployment
1. Create a new project on **Railway** and link your `j-lambert-ai` repository.
2. In the Railway dashboard, navigate to **Settings** -> **Variables**, and configure:
   - `GEMINI_API_KEY` = (Your AI Studio Key)
3. Deploy! Railway will automatically pull the branch, compile packages, and start serving on a secure HTTPS domain.

---
*Developed with 💜 by [Jawknee-builds](https://github.com/Jawknee-builds)*
