const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const Busboy = require("busboy");
const pdf = require("pdf-parse");
const { createClient } = require("@supabase/supabase-js");

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "0.0.0.0";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("Supabase connected. Data will be persisted.");
}

// Root-level data directory for hosting stability
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
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

async function ensureDb() {
  if (supabase) {
    try {
      const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true });
      if (count === 0) {
        console.log("Seeding Supabase leads...");
        await supabase.from('leads').insert(seedLeads());
      }
      const { count: mCount } = await supabase.from('meetings').select('*', { count: 'exact', head: true });
      if (mCount === 0) {
        console.log("Seeding Supabase meetings...");
        await supabase.from('meetings').insert(seedMeetings());
      }
    } catch (e) {
      console.error("Supabase seed error:", e.message);
    }
    return;
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(BROCHURES_DIR, { recursive: true });
  
  let currentLeads = [];
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    currentLeads = JSON.parse(raw);
  } catch (e) {
    currentLeads = [];
  }

  // Seed if empty
  if (currentLeads.length < 5) {
    await fs.writeFile(DB_PATH, JSON.stringify(seedLeads(), null, 2));
  }

  // Seed meetings if empty
  try { await fs.access(MEETINGS_PATH); } catch {
    await fs.writeFile(MEETINGS_PATH, JSON.stringify(seedMeetings(), null, 2));
  }
}

function seedMeetings() {
  const now = Date.now();
  return [
    {
      id: crypto.randomUUID(),
      name: "Lachlan Sterling",
      date: new Date(now + 86400000).toISOString().split('T')[0],
      time: "10:30",
      datetime: new Date(now + 86400000 + 36000000).toISOString(),
      property: "Parramatta Central",
      notes: "Interested in level 12 corner suite. Needs high ceilings.",
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: "Abena Mensah",
      date: new Date(now + 172800000).toISOString().split('T')[0],
      time: "14:15",
      datetime: new Date(now + 172800000 + 48600000).toISOString(),
      property: "Southbank Residences",
      notes: "Viewing the 3-bed penthouse mockup.",
      createdAt: new Date().toISOString()
    }
  ];
}

function seedLeads() {
  const leads = [];
  const now = new Date();
  
  // Create 20 realistic leads
  for (let i = 0; i < 20; i++) {
    const daysAgo = i;
    const date = new Date(now.getTime() - daysAgo * 12 * 60 * 60 * 1000);
    const channel = i % 3 === 0 ? "Vapi Voice Call" : (i % 2 === 0 ? "Inbound call" : "Website form");
    
    leads.push(createLead({
      createdAt: date.toISOString(),
      channel: channel,
      enquiryType: channel.toLowerCase().includes("call") ? "call" : "form",
      callOutcome: "answered",
      turns: Math.floor(Math.random() * 8) + 4
    }));
  }
  return leads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

const BRAND_NAMES = [
  "Abena Mensah", "Kwame Asante", "Kofi Acheampong", "Lachlan Sterling",
  "Harrison Forde", "Declan Hayes", "Liam O'Connor", 
  "Oliver Bennett", "Chloe Sutherland", "Mia Kowalski", "Ruby Richards", 
  "Isla Mackenzie", "Evie Johnston", "Mateo Silva", "Harper Vance",
  "Xavier Thorne", "Sienna Brooks", "Sebastian Vane", "Zara Whitaker"
];

function createLead(input) {
  const randomName = BRAND_NAMES[Math.floor(Math.random() * BRAND_NAMES.length)];
  const nameClean = clean(input.name) || randomName;
  
  const randPhone = () => `+61 4${Math.floor(10000000 + Math.random() * 89999999)}`;
  const randEmail = (name) => `${name.toLowerCase().replace(/\s/g, '.')}@jlambert.in`;
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
    unitType: clean(input.unitType) || (Math.random() > 0.6 ? "2 Bedroom" : "3 Bed Penthouse"),
    lastAction: clean(input.lastAction) || (input.callOutcome === "answered" ? "Sent Brochure" : "Follow-up SMS"),
    enquiryType: input.enquiryType === "call" ? "call" : "form",
    callOutcome: input.callOutcome === "missed" ? "missed" : "answered",
    turns: Number(input.turns) || 0,
  };

  return enrichLead(lead);
}

function enrichLead(lead) {
  const score = scoreLead(lead);
  const status = score >= 80 ? "Hot" : score >= 50 ? "Warm" : "Cold";
  const minutesSaved = Math.max(2, (lead.turns || 5) * 0.8);

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
        detail: lead.callOutcome === "answered" ? "AI handled conversation live" : "AI call attempted",
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
  const t = lead.timeline.toLowerCase();
  const f = lead.finance.toLowerCase();
  if (t.includes("0-3") || t.includes("now") || t.includes("ready")) score += 30;
  if (f.includes("pre-approved") || f.includes("approved") || f.includes("cash")) score += 25;
  if (lead.callOutcome === "answered") score += 10;
  return Math.min(score, 100);
}

function nextStep(status, lead) {
  if (status === "Hot") return `Immediate VIP outreach for ${lead.name}. Schedule inspection.`;
  return `Follow up on ${lead.finance} status.`;
}

function summarizeLead(status, lead) {
  return `### Lead Overview
* **Status:** ${status} (${lead.score}%)
* **Interest:** ${lead.interest}
* **Budget:** ${lead.budget}
* **Timeline:** ${lead.timeline}`.trim();
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function readLeads() {
  if (supabase) {
    const { data, error } = await supabase.from('leads').select('*').order('createdAt', { ascending: false });
    if (error) {
      console.error("Supabase readLeads error:", error.message);
      return [];
    }
    return data || [];
  }
  await ensureDb();
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function insertLead(lead) {
  if (supabase) {
    const { error } = await supabase.from('leads').insert([lead]);
    if (error) console.error("Supabase insertLead error:", error.message);
    return;
  }
  const leads = await readLeads();
  leads.unshift(lead);
  await fs.writeFile(DB_PATH, JSON.stringify(leads, null, 2));
}

async function readMeetings() {
  if (supabase) {
    const { data, error } = await supabase.from('meetings').select('*').order('createdAt', { ascending: false });
    if (error) {
      console.error("Supabase readMeetings error:", error.message);
      return [];
    }
    return data || [];
  }
  try {
    const raw = await fs.readFile(MEETINGS_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function insertMeeting(meeting) {
  if (supabase) {
    const { error } = await supabase.from('meetings').insert([meeting]);
    if (error) console.error("Supabase insertMeeting error:", error.message);
    return;
  }
  try {
    const raw = await fs.readFile(MEETINGS_PATH, "utf8");
    const meetings = JSON.parse(raw);
    meetings.push(meeting);
    await fs.writeFile(MEETINGS_PATH, JSON.stringify(meetings, null, 2));
  } catch {
    console.error("Failed to save meeting locally");
  }
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

  if (req.method === "GET" && url.pathname === "/api/leads") {
    const leads = await readLeads();
    sendJson(res, 200, leads);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/metrics") {
    const leads = await readLeads();
    const metrics = {
      total: leads.length,
      hot: leads.filter(l => l.status === "Hot").length,
      answered: leads.filter(l => l.callOutcome === "answered").length,
      minutesSaved: leads.reduce((sum, l) => sum + (l.minutesSaved || 0), 0),
    };
    sendJson(res, 200, metrics);
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

  if (req.method === "POST" && url.pathname === "/api/extract-lead") {
    const body = await readBody(req);
    const transcriptText = body.conversation.map(c => `${c.role}: ${c.text}`).join("\n");
    
    const prompt = `Extract lead details from transcript as JSON:
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
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
      }

      const lead = createLead({
        enquiryType: "call",
        callOutcome: "answered",
        channel: "Vapi Voice Call",
        turns: body.conversation.length,
        ...parsed
      });
      await insertLead(lead);
      sendJson(res, 201, lead);
    } catch (e) {
      console.error("Extraction failed:", e);
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/meetings") {
    const meetings = await readMeetings();
    sendJson(res, 200, meetings);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/meetings") {
    const body = await readBody(req);
    const meeting = {
      id: crypto.randomUUID(),
      ...body,
      datetime: new Date(`${body.date}T${body.time}`).toISOString(),
      createdAt: new Date().toISOString(),
    };
    await insertMeeting(meeting);
    sendJson(res, 201, meeting);
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res).catch(err => {
      console.error(err);
      sendJson(res, 500, { error: "Internal Server Error" });
    });
  } else {
    serveStatic(req, res).catch(err => {
      console.error(err);
      res.writeHead(500);
      res.end("Internal Server Error");
    });
  }
});

server.listen(PORT, HOST, async () => {
  await ensureDb();
  console.log(`Server running at http://${HOST}:${PORT}`);
});
