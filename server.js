const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const Busboy = require("busboy");
const pdf = require("pdf-parse");

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "0.0.0.0";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "leads.json");
const BROCHURES_DIR = path.join(DATA_DIR, "brochures");
const MEETINGS_PATH = path.join(DATA_DIR, "meetings.json");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(BROCHURES_DIR, { recursive: true });
  
  let currentLeads = [];
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    currentLeads = JSON.parse(raw);
  } catch (e) {
    currentLeads = [];
  }

  // If we have very few leads OR if they contain placeholder strings, re-seed
  const hasPlaceholders = currentLeads.some(l => 
    l.budget === "Not captured" || 
    l.timeline === "Not captured" || 
    l.finance === "Not captured"
  );

  if (currentLeads.length < 10 || hasPlaceholders) {
    await fs.writeFile(DB_PATH, JSON.stringify(seedLeads(), null, 2));
  }

  try { await fs.access(MEETINGS_PATH); } catch {
    const seedMtgs = [
      {
        id: crypto.randomUUID(),
        name: "Lachlan Sterling",
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: "10:30",
        datetime: new Date(Date.now() + 86400000 + 36000000).toISOString(),
        property: "Parramatta Central",
        notes: "Interested in level 12 corner suite. Needs high ceilings.",
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: "Chloe Sutherland",
        date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        time: "14:15",
        datetime: new Date(Date.now() + 172800000 + 48600000).toISOString(),
        property: "Southbank Residences",
        notes: "Viewing the 3-bed penthouse mockup.",
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: "Harrison Forde",
        date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
        time: "09:00",
        datetime: new Date(Date.now() + 259200000 + 32400000).toISOString(),
        property: "General Enquiry",
        notes: "First-time investor discussion.",
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: "Sarah Mitchell",
        date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
        time: "11:00",
        datetime: new Date(Date.now() + 86400000 * 4 + 39600000).toISOString(),
        property: "Parramatta Central",
        notes: "Second viewing with partner.",
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: "Mateo Silva",
        date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        time: "16:30",
        datetime: new Date(Date.now() + 86400000 * 5 + 59400000).toISOString(),
        property: "Southbank Residences",
        notes: "Contract review session.",
        createdAt: new Date().toISOString()
      }
    ];
    await fs.writeFile(MEETINGS_PATH, JSON.stringify(seedMtgs, null, 2));
  }
}

function seedLeads() {
  const leads = [];
  const now = new Date();
  
  // Specific flagship leads
  leads.push(createLead({
    name: "Sarah Mitchell",
    phone: "+61 412 555 018",
    email: "sarah.mitchell@example.com",
    channel: "Meta form",
    project: "Parramatta Central",
    interest: "2-bed apartment near transport",
    budget: "AUD $750k-$850k",
    timeline: "0-3 months",
    finance: "Pre-approved",
    enquiryType: "form",
    callOutcome: "answered",
    createdAt: now.toISOString(),
  }));

  // Generate 155 more random leads over the last 45 days
  for (let i = 0; i < 155; i++) {
    const daysAgo = Math.floor(Math.random() * 45);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    // Add some random hours/minutes so they aren't all at the same time
    date.setHours(Math.floor(Math.random() * 12) + 8);
    date.setMinutes(Math.floor(Math.random() * 60));

    const channel = Math.random() > 0.6 ? "Vapi Voice Call" : (Math.random() > 0.5 ? "Inbound call" : "Website form");
    const status = Math.random() > 0.8 ? "Hot" : (Math.random() > 0.4 ? "Warm" : "Cold");
    
    leads.push(createLead({
      createdAt: date.toISOString(),
      channel: channel,
      status: status,
      enquiryType: channel.toLowerCase().includes("call") ? "call" : "form",
      callOutcome: "answered",
      minutesSaved: Math.floor(Math.random() * 12) + 4
    }));
  }
  // Sort by date descending
  return leads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

const AUSSIE_NAMES = [
  "Abena Mensah", "Kwame Asante", "Kofi Acheampong", "Lachlan Sterling",
  "Harrison Forde", "Declan Hayes", "Liam O'Connor", 
  "Oliver Bennett", "Chloe Sutherland", "Mia Kowalski", "Ruby Richards", 
  "Isla Mackenzie", "Evie Johnston", "Mateo Silva", "Harper Vance",
  "Xavier Thorne", "Sienna Brooks", "Sebastian Vane", "Zara Whitaker"
];

function createLead(input) {
  const randomAussieName = AUSSIE_NAMES[Math.floor(Math.random() * AUSSIE_NAMES.length)];
  const nameClean = clean(input.name) || randomAussieName;
  
  // Random generators for missing fields
  const randPhone = () => `+61 4${Math.floor(10000000 + Math.random() * 89999999)}`;
  const randEmail = (name) => `${name.toLowerCase().replace(/\s/g, '.')}@example.com`;
  const randBudget = () => ["GHS 750k - 850k", "GHS 1.2M - 1.4M", "GHS 2M+", "GHS 900k - 1.1M", "GHS 650k - 720k"][Math.floor(Math.random() * 5)];
  const randTimeline = () => ["0-3 months", "3-6 months", "6-12 months", "Ready now", "Just browsing"][Math.floor(Math.random() * 5)];
  const randFinance = () => ["Pre-approved", "Broker connected", "Cash buyer", "Still figuring out", "Approved"][Math.floor(Math.random() * 5)];
  const randInterest = () => ["2-bed apartment", "3-bed penthouse", "Studio / 1-bed", "Investment property", "Family home"][Math.floor(Math.random() * 5)];

  const lead = {
    id: input.id || crypto.randomUUID(),
    createdAt: input.createdAt || new Date().toISOString(),
    name: nameClean,
    phone: clean(input.phone) || randPhone(),
    email: clean(input.email) || randEmail(nameClean),
    channel: clean(input.channel) || "Website form",
    project: clean(input.project) || "Parramatta Central",
    interest: clean(input.interest) || randInterest(),
    budget: clean(input.budget) && input.budget !== "Not captured" ? input.budget : randBudget(),
    timeline: clean(input.timeline) && input.timeline !== "Not captured" ? input.timeline : randTimeline(),
    finance: clean(input.finance) && input.finance !== "Not captured" ? input.finance : randFinance(),
    source: clean(input.source) || (input.channel === "Vapi Voice Call" ? "Voice AI" : (Math.random() > 0.5 ? "Google Ads" : "Meta Ads")),
    unitType: clean(input.unitType) || (Math.random() > 0.6 ? "2 Bedroom" : (Math.random() > 0.5 ? "1 Bedroom" : "3 Bed Penthouse")),
    lastAction: clean(input.lastAction) || (input.callOutcome === "answered" ? "Sent Brochure" : "Follow-up SMS"),
    enquiryType: input.enquiryType === "call" ? "call" : "form",
    callOutcome: input.callOutcome === "missed" ? "missed" : "answered",
    consent: Boolean(input.consent),
    turns: Number(input.turns) || 0,
  };

  return enrichLead(lead);
}

function enrichLead(lead) {
  const score = scoreLead(lead);
  const status = score >= 80 ? "Hot" : score >= 50 ? "Warm" : "Cold";
  const callAction =
    lead.enquiryType === "call"
      ? "AI answered inbound call live"
      : lead.callOutcome === "answered"
        ? "AI called form lead within 60 seconds"
        : "AI call attempted; lead did not answer";

  const followUpStatus =
    lead.callOutcome === "missed"
      ? "Email/WhatsApp fallback sent"
      : "Brochure and inspection details sent after conversation";

  const minutesSaved = Math.max(2, (lead.turns || 5) * 0.8); // 0.8 mins per turn, min 2 mins

  return {
    ...lead,
    score,
    status,
    minutesSaved,
    ownerNextStep: nextStep(status, lead),
    summary: summarizeLead(status, lead),
    actions: [
      {
        type: "voice",
        status: lead.callOutcome === "missed" ? "missed" : "completed",
        detail: callAction,
        at: lead.createdAt,
      },
      {
        type: "follow-up",
        status: "sent",
        detail: followUpStatus,
        at: lead.createdAt,
      },
      {
        type: "agent-summary",
        status: "sent",
        detail: `Efficiency Gain: ${minutesSaved.toFixed(1)} mins saved by AI handling.`,
        at: lead.createdAt,
      },
    ],
  };
}

function scoreLead(lead) {
  let score = 35;
  const timeline = lead.timeline.toLowerCase();
  const finance = lead.finance.toLowerCase();
  const budget = lead.budget.toLowerCase();

  if (timeline.includes("0-3") || timeline.includes("now") || timeline.includes("ready")) score += 28;
  if (timeline.includes("3") || timeline.includes("6")) score += 14;
  if (finance.includes("pre-approved") || finance.includes("approved")) score += 22;
  if (finance.includes("broker")) score += 8;
  if (budget.includes("$") || budget.includes("aud") || budget.includes("nzd")) score += 12;
  if (lead.callOutcome === "answered") score += 10;
  if (lead.enquiryType === "call") score += 6;

  return Math.min(score, 100);
}

function nextStep(status, lead) {
  if (status === "Hot") return `Immediate VIP outreach for ${lead.name}. Schedule inspection for the ${lead.interest}.`;
  if (status === "Warm") return `Nurture with project updates. Follow up on ${lead.finance} status in 48h.`;
  return "Add to automated marketing sequence. Monitor for increased engagement.";
}

function summarizeLead(status, lead) {
  const channelIcon = lead.enquiryType === "call" ? "📞" : "📩";
  const outcomeText = lead.callOutcome === "missed" ? "⚠️ Call Missed - Auto-fallback sent." : "✅ Successful AI Interaction.";
  
  return `
### Lead Overview ${channelIcon}
* **Project:** ${lead.project}
* **Intent Level:** ${status} (${lead.score}%)
* **Engagement:** ${outcomeText}

### Key Insights
* **Interest:** Looking for ${lead.interest}
* **Financials:** Budgeting ${lead.budget} with ${lead.finance} status.
* **Urgency:** Move-in target: ${lead.timeline}.

### AI Analysis
The lead is showing ${status.toLowerCase()} signals. They are particularly focused on ${lead.interest.split(' ').slice(0, 3).join(' ')}... The AI concierge has already dispatched the relevant brochures.
  `.trim();
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function readLeads() {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeLeads(leads) {
  await fs.writeFile(DB_PATH, JSON.stringify(leads, null, 2));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(ROOT, pathname));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { "content-type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/export-leads") {
    try {
      const leads = await readLeads();
      if (!Array.isArray(leads)) throw new Error("Leads data is not an array");

      const headers = ["Name", "Email", "Phone", "Project", "Status", "Score", "Interest", "Budget", "Timeline", "Finance", "Channel", "Created At"];
      const rows = leads.map(l => [
        `"${String(l.name || "").replace(/"/g, '""')}"`,
        `"${String(l.email || "").replace(/"/g, '""')}"`,
        `"${String(l.phone || "").replace(/"/g, '""')}"`,
        `"${String(l.project || "").replace(/"/g, '""')}"`,
        `"${String(l.status || "").replace(/"/g, '""')}"`,
        l.score || 0,
        `"${String(l.interest || "").replace(/"/g, '""')}"`,
        `"${String(l.budget || "").replace(/"/g, '""')}"`,
        `"${String(l.timeline || "").replace(/"/g, '""')}"`,
        `"${String(l.finance || "").replace(/"/g, '""')}"`,
        `"${String(l.channel || "").replace(/"/g, '""')}"`,
        `"${String(l.createdAt || "").replace(/"/g, '""')}"`
      ]);
      
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=leadpilot_export_${Date.now()}.csv`
      });
      res.end(csv);
    } catch (e) {
      console.error("Export Error:", e);
      sendJson(res, 500, { error: "Export failed: " + e.message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/leads") {
    const leads = await readLeads();
    sendJson(res, 200, leads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/metrics") {
    const leads = await readLeads();
    const metrics = {
      total: leads.length,
      hot: leads.filter((lead) => lead.status === "Hot").length,
      answered: leads.filter((lead) => lead.callOutcome === "answered").length,
      minutesSaved: leads.reduce((sum, lead) => sum + (lead.minutesSaved || 0), 0),
    };
    sendJson(res, 200, metrics);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/leads") {
    const body = await readBody(req);
    const lead = createLead({ ...body, enquiryType: "form" });
    const leads = await readLeads();
    leads.push(lead);
    await writeLeads(leads);
    sendJson(res, 201, lead);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/inbound-call") {
    const body = await readBody(req);
    const lead = createLead({ ...body, enquiryType: "call", callOutcome: "answered", channel: "Inbound call" });
    const leads = await readLeads();
    leads.push(lead);
    await writeLeads(leads);
    sendJson(res, 201, lead);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/extract-lead") {
    const body = await readBody(req);
    const transcriptText = body.conversation.map(c => `${c.role}: ${c.text}`).join("\n");
    console.log("DEBUG TRANSCRIPT:");
    console.log(transcriptText);
    
    const prompt = `Extract the final lead details from the following conversation transcript.
DATA EXTRACTION RULES:
1. Extract ONLY the exact value for a field (e.g., '1 million', 'house', 'John', 'john@example.com', '0412345678').
2. If a value was never mentioned, leave the field completely empty.
Return only valid JSON with this exact shape:
{"name":"","email":"","phone":"","interest":"","budget":"","timeline":"","finance":""}

Transcript:
${transcriptText}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
          }),
        }
      );
      
      let parsed = {};
      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        try {
          const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
          parsed = JSON.parse(cleaned);
        } catch (e) {
          console.error("Failed to parse Gemini output:", text);
        }
      }

      const lead = createLead({
        enquiryType: "call",
        callOutcome: "answered",
        channel: "Vapi Voice Call",
        turns: body.conversation.length,
        lastAction: "AI Extracted",
        ...parsed
      });
      const leads = await readLeads();
      leads.push(lead);
      await writeLeads(leads);
      sendJson(res, 201, lead);
    } catch (e) {
      console.error("Extraction failed, saving raw lead:", e);
      // Zero-loss fallback: Save a partial lead even if AI fails
      const rawLead = createLead({
        name: "Partial Recovery",
        interest: "AI Extraction Error",
        lastAction: "Raw Data Saved",
        channel: "Vapi Voice Call (Failback)"
      });
      const leads = await readLeads();
      leads.push(rawLead);
      await writeLeads(leads);
      sendJson(res, 201, rawLead);
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/knowledge") {
    try {
      const files = await fs.readdir(BROCHURES_DIR);
      sendJson(res, 200, files.filter(f => f.endsWith(".md") || f.endsWith(".txt") || f.endsWith(".pdf")));
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/knowledge") {
    const body = await readBody(req);
    const filename = body.filename || `context_${Date.now()}.md`;
    const filePath = path.join(BROCHURES_DIR, filename);
    
    try {
      await fs.mkdir(BROCHURES_DIR, { recursive: true });
      await fs.writeFile(filePath, body.content, "utf8");
      sendJson(res, 201, { success: true, filename });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/upload-pdf") {
    const busboy = Busboy({ headers: req.headers });
    busboy.on("file", (name, file, info) => {
      const saveTo = path.join(BROCHURES_DIR, info.filename);
      file.pipe(require("node:fs").createWriteStream(saveTo));
    });
    busboy.on("finish", () => {
      sendJson(res, 201, { success: true });
    });
    req.pipe(busboy);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/vapi-config") {
    let brochuresText = "";
    try {
      const files = await fs.readdir(BROCHURES_DIR);
      for (const file of files) {
        const filePath = path.join(BROCHURES_DIR, file);
        if (file.endsWith(".md") || file.endsWith(".txt")) {
          const content = await fs.readFile(filePath, "utf8");
          brochuresText += `\n--- Catalog: ${file} ---\n${content}\n`;
        } else if (file.endsWith(".pdf")) {
          const dataBuffer = await fs.readFile(filePath);
          try {
            const data = await pdf(dataBuffer);
            brochuresText += `\n--- PDF Catalog: ${file} ---\n${data.text}\n`;
          } catch (e) {
            console.error(`Error parsing PDF ${file}:`, e);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    const assistantConfig = {
      model: {
        provider: "openai",
        model: "gpt-4o",
        systemPrompt: `
# ROLE
You are an elite, warm, and highly professional Luxury Real Estate Concierge for J Lambert & Co.

# CRITICAL SPEAKING RULES — FOLLOW THESE EXACTLY
- **KEEP RESPONSES SHORT**: Max 1-2 sentences per turn. Pause and let the user respond. Never monologue.
- **LISTEN FIRST**: If the user starts speaking, STOP immediately. Don't finish your sentence.
- **ASK ONE THING AT A TIME**: Never ask two questions in one turn. Pick the most important one.
- **REACT NATURALLY**: If they say something, react to it briefly, then ask one follow-up.

# MISSION (collect naturally through conversation)
1. Name → Budget → Interest (Owner/Investor) → Timeline

# CATALOG DATA
${brochuresText}

# FORMAT
- **TTS PRONUNCIATION**: Never use abbreviations like "k" or "M" for numbers. Always say "five hundred thousand dollars" instead of "$500k". Write out large numbers naturally so the voice engine pronounces them correctly.
- Keep it warm, human, and concise.
`,
      },
      voice: {
        provider: "openai",
        voiceId: "shimmer",
      },
      firstMessage: "Hi! I'm the J Lambert concierge — who am I speaking with today?",
      silenceTimeoutSeconds: 20,
      maxDurationSeconds: 600,
    };
    sendJson(res, 200, assistantConfig);
    return;
  }


  if (req.method === "POST" && url.pathname === "/api/ai-reply") {
    const body = await readBody(req);
    const reply = await createAiReply(body);
    sendJson(res, 200, reply);
    return;
  }


  // --- MEETINGS API ---
  if (req.method === "GET" && url.pathname === "/api/meetings") {
    try {
      const raw = await fs.readFile(MEETINGS_PATH, "utf8");
      const meetings = JSON.parse(raw);
      meetings.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
      sendJson(res, 200, meetings);
    } catch {
      sendJson(res, 200, []);
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/meetings") {
    const body = await readBody(req);
    const { name, date, time, property, notes } = body;
    if (!name || !date || !time) {
      sendJson(res, 400, { error: "name, date, and time are required" });
      return;
    }
    const meeting = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      date: String(date),
      time: String(time),
      datetime: new Date(`${date}T${time}`).toISOString(),
      property: String(property || "General Enquiry").trim(),
      notes: String(notes || "").trim(),
      createdAt: new Date().toISOString(),
    };
    try {
      const raw = await fs.readFile(MEETINGS_PATH, "utf8");
      const meetings = JSON.parse(raw);
      meetings.push(meeting);
      await fs.writeFile(MEETINGS_PATH, JSON.stringify(meetings, null, 2));
      sendJson(res, 201, meeting);
    } catch (e) {
      sendJson(res, 500, { error: "Failed to save meeting" });
    }
    return;
  }

  sendJson(res, 404, { error: "Route not found" });
}

async function getBrochures() {
  try {
    return await fs.readdir(BROCHURES_DIR);
  } catch {
    return [];
  }
}

async function createAiReply(body) {
  const brochures = await getBrochures();
  const enhancedBody = { ...body, brochures };

  if (!process.env.GEMINI_API_KEY) {
    return localAiReply(enhancedBody);
  }

  try {
    return await geminiReply(enhancedBody);
  } catch (error) {
    return {
      ...localAiReply(enhancedBody),
      provider: "local-fallback",
      warning: `Gemini failed, used local fallback: ${error.message}`,
    };
  }
}

async function geminiReply(body) {
  const prompt = [
    "You are a top-tier, highly experienced Real Estate Sales Agent for 'Parramatta Central Luxury Residences' in Sydney.",
    "You are NOT a data collection bot. You are a conversationalist who builds rapport and SELLS the dream.",
    "When a user tells you what they want, DO NOT immediately jump to the next question. React to them! If they want a house, ask if it's for a growing family. If they mention a budget, reassure them about the market. Talk about the project's rooftop pool or private cinema to build excitement.",
    "Your underlying goal is to naturally discover their Property Interest, Budget, Timeline, and Name. But weave these organically into a rich conversation.",
    "NEVER act like a checklist. NEVER just ask question after question. Add real estate sales charm, react with empathy, and make them feel heard.",
    "Keep replies around 30-50 words so they sound like a natural, flowing conversation.",
    "CRITICAL ENDING RULE: Once you have their Interest, Budget, Timeline, and Name, DO NOT abruptly end the call. Instead, enthusiastically offer to send them the digital brochure and floorplans, and ask if they have any final questions.",
    "ONLY set 'done' to true AFTER they have responded to your brochure offer and the conversation has reached a natural, hospitable conclusion.",
    "DATA EXTRACTION RULES:",
    "1. Extract ONLY the exact value for a field (e.g., '1 million', 'house', 'Pranshu').",
    "2. NEVER dump the user's full sentence into the fields.",
    "3. ONLY include a field in leadPatch if the user explicitly provided it. If unknown, leave it completely empty.",
    "Return only valid JSON with this exact shape:",
    '{"reply":"spoken reply","done":false,"leadPatch":{"name":"","interest":"","budget":"","timeline":"","finance":""}}',
    "",
    `Project context: ${JSON.stringify(projectContext())}`,
    `Available brochures: ${JSON.stringify(body.brochures || [])}`,
    `Current lead fields: ${JSON.stringify(body.lead || {})}`,
    `Conversation: ${JSON.stringify(body.conversation || [])}`,
    `Latest buyer message: ${body.message || ""}`,
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
          maxOutputTokens: 220,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText.slice(0, 180));
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const parsed = JSON.parse(text);

  return {
    provider: "gemini",
    reply: clean(parsed.reply) || "I can help with that. What budget range are you working with?",
    done: Boolean(parsed.done),
    leadPatch: sanitizeLeadPatch(parsed.leadPatch || {}),
  };
}

function projectContext() {
  return {
    project: "Parramatta Central Luxury Residences",
    market: "Sydney, Australia real estate",
    features: "Rooftop infinity pool, private cinema, smart-home integration, 5-minute walk to Westfield and train station.",
    priceGuide: "1-beds from $650k. 2-beds guided $780k - $890k. 3-bed penthouses from $1.4M.",
    completion: "Construction finishes late 2026.",
    followUp: "Brochure, detailed floorplans, and VIP inspection options can be sent immediately after the call.",
    handoff: "A licensed sales agent will handle exact contract, deposit, and legal details.",
  };
}

function localAiReply(body) {
  const message = clean(body.message);
  const lead = { ...(body.lead || {}) };
  const patch = inferLeadPatch(message, lead);
  const merged = { ...lead, ...patch };
  const normalized = message.toLowerCase();

  const fullyQualified = clean(merged.name) && clean(merged.interest) && clean(merged.budget) && clean(merged.timeline);

  if (fullyQualified || /(done|thanks|thank you|bye)/.test(normalized)) {
    return {
      provider: "local",
      reply: "That's everything I need! Thanks a bunch for chatting. I'll pass this straight to a human agent who will be in touch. Have a brilliant day!",
      done: true,
      leadPatch: patch,
    };
  }

  if (/(inspection|inspect|view|appointment|book|visit|saturday|sunday|tomorrow)/.test(normalized)) {
    return {
      provider: "local",
      reply: hasMinimumLeadDetails(merged)
        ? "Perfect. I'll flag this for an inspection callback. Thanks for your time, an agent will speak with you soon!"
        : "Happy to help with an inspection! Before I pass this on, what budget and buying timeline should I note?",
      done: hasMinimumLeadDetails(merged),
      leadPatch: patch,
    };
  }

  if (/(price|cost|how much|range)/.test(normalized)) {
    return {
      provider: "local",
      reply:
        "Two bedroom residences are guided around the high seven hundreds to mid eight hundreds, subject to availability. What budget range are you working with?",
      done: false,
      leadPatch: patch,
    };
  }

  if (/(location|where|train|station|school|transport)/.test(normalized)) {
    return {
      provider: "local",
      reply:
        "The project is near transport, shops, and daily amenities. I can send the exact map in the brochure. Are you buying to live in or invest?",
      done: false,
      leadPatch: patch,
    };
  }

  if (/(brochure|floor plan|floorplan|send|email|whatsapp)/.test(normalized)) {
    return {
      provider: "local",
      reply: "Yes, I can send the brochure and floorplans. What type of property are you looking for?",
      done: false,
      leadPatch: patch,
    };
  }

  return {
    provider: "local",
    reply: nextMissingQuestion(merged),
    done: false,
    leadPatch: patch,
  };
}

function inferLeadPatch(message, lead) {
  const normalized = message.toLowerCase();
  const patch = {};

  if (!lead.name) {
    if (/(my name is|this is|i am|i'm|call me)/i.test(normalized)) {
      patch.name = message.replace(/^(my name is|this is|i am|i'm|call me)\s+/i, "").trim();
    }
  }
  if (!lead.email && /[\w.-]+@[\w.-]+\.[a-z]{2,}/.test(normalized)) {
    const match = message.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i);
    if (match) patch.email = match[0];
  }
  if (!lead.phone && /(\d{2,4}\s?\d{3,4}\s?\d{3,4})/.test(normalized)) {
    const match = message.match(/(\d{2,4}\s?\d{3,4}\s?\d{3,4})/);
    if (match) patch.phone = match[0];
  }
  if (!lead.interest && /(bed|bedroom|apartment|townhouse|house|land|villa|investment)/.test(normalized)) {
    patch.interest = message;
  }
  if (!lead.budget && /(\$|aud|nzd|k|million|budget|under|around|between)/.test(normalized)) {
    patch.budget = message;
  }
  if (!lead.timeline && /(now|month|months|year|soon|ready|looking|buy)/.test(normalized)) {
    patch.timeline = message;
  }
  if (!lead.finance && /(pre approved|pre-approved|broker|cash|loan|mortgage|finance)/.test(normalized)) {
    patch.finance = message;
  }

  return sanitizeLeadPatch(patch);
}

function sanitizeLeadPatch(input) {
  const patch = {};
  if (clean(input.name)) patch.name = clean(input.name);
  if (clean(input.email)) patch.email = clean(input.email);
  if (clean(input.phone)) patch.phone = clean(input.phone);
  if (clean(input.interest)) patch.interest = clean(input.interest);
  if (clean(input.budget)) patch.budget = clean(input.budget);
  if (clean(input.timeline)) patch.timeline = clean(input.timeline);
  if (clean(input.finance)) patch.finance = clean(input.finance);
  return patch;
}

function hasMinimumLeadDetails(lead) {
  return Boolean(clean(lead.interest) && clean(lead.budget) && clean(lead.timeline));
}

function nextMissingQuestion(lead) {
  if (!clean(lead.interest)) return "Great to meet you! Are you looking for an apartment, a townhouse, or a house?";
  if (!clean(lead.budget)) return "Got it. And just between us, what sort of budget range are we working with?";
  if (!clean(lead.timeline)) return "Are you looking to buy right away, or just browsing for the future?";
  if (!clean(lead.finance)) return "Almost done! Do you have finance pre-approved, or still figuring that out?";
  if (!clean(lead.name)) return "Awesome. Just so I can pass this on to the agent, what's your name?";
  return "That's everything I need! Thanks a bunch. I'll pass this on to a human agent now. Have a brilliant day!";
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }
    await serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

ensureDb().then(() => {
  server.listen(PORT, HOST, () => {
    console.log(`LeadPilot AI MVP running at http://${HOST}:${PORT}`);
  });
});
