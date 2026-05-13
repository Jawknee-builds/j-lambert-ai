# LeadPilot AI MVP

AI lead concierge MVP for AU/NZ real estate teams.

## What It Does

- Answers inbound call scenarios.
- Calls new form enquiries within 60 seconds.
- Sends email/WhatsApp fallback when the lead misses the call.
- Scores Hot/Warm/Cold intent.
- Creates an agent-ready summary with budget, timeline, finance, interest, and next step.

## Run Locally

```bash
npm start
```

Then open:

```text
http://127.0.0.1:4173/app.html
```

## 🚀 Deployment (Railway)

1. **Install CLI:** `npm i -g @railway/cli`
2. **Login:** `railway login`
3. **Up:** `railway up`
4. **Environment Variables:** Set `GEMINI_API_KEY` in the Railway dashboard.
5. **Persistence:** Add a **Volume** mounted at `/app/data` (if deploying from root) or `/voice_agent_files/data` to persist your leads.

## Free AI Brain Mode

The voice UI can use Gemini's free-tier API for the conversation brain.

```bash
GEMINI_API_KEY=your_google_ai_studio_key npm start
```

By default it uses:

```text
gemini-2.5-flash-lite
```

You can change it:

```bash
GEMINI_MODEL=gemini-2.5-flash-lite GEMINI_API_KEY=your_key npm start
```

Without `GEMINI_API_KEY`, the app falls back to the local rule-based voice brain.

## Key Files

- `index.html` - sales/demo landing page.
- `app.html` - working MVP dashboard.
- `server.js` - no-dependency Node API and static server.
- `app.js` - dashboard behavior and API calls.
- `data/leads.json` - local lead storage.
- `outreach.md` - WhatsApp/email outreach scripts.

## API Routes

- `GET /api/leads`
- `GET /api/metrics`
- `POST /api/leads`
- `POST /api/inbound-call`

## Next Integrations

- Fastest production voice: Retell or Vapi with a real phone number, webhooks, and transcripts.
- Most custom production voice: OpenAI Realtime with SIP/WebRTC plus your own call controls.
- Voice plumbing: Twilio or Telnyx for phone numbers if the voice platform does not handle the number directly.
- Email: SendGrid, Resend, Postmark, or Gmail API.
- WhatsApp: Meta WhatsApp Cloud API or Twilio WhatsApp.
- CRM: HubSpot, Airtable, Google Sheets, Agentbox/Rex/VaultRE via Zapier/Make where direct APIs are not practical.
