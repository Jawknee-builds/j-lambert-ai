const els = {
  total: document.querySelector("#metricTotal"),
  hot: document.querySelector("#metricHot"),
  answered: document.querySelector("#metricAnswered"),
  brochures: document.querySelector("#metricSaved"),
  table: document.querySelector("#leadTableBody"),
  refresh: document.querySelector("#refreshLeads"),
  startVoice: document.querySelector("#startVoice"),
  stopVoice: document.querySelector("#stopVoice"),
  voiceStatus: document.querySelector("#voiceStatus"),
  transcriptBox: document.querySelector("#transcriptBox"),
  serverWarning: document.querySelector("#serverWarning"),
  callScreen: document.querySelector(".call-screen"),
  aiAnalyzing: document.querySelector("#aiAnalyzing"),
  aiAnalyzingText: document.querySelector("#aiAnalyzingText"),
  aiBrainLogs: document.querySelector("#aiBrainLogs"),
  knowledgeInput: document.querySelector("#knowledgeInput"),
  saveKnowledge: document.querySelector("#saveKnowledge"),
  pdfUpload: document.querySelector("#pdfUpload"),
  uploadStatus: document.querySelector("#uploadStatus"),
  fileList: document.querySelector("#fileList"),
};

// Sidebar Toggle Logic
document.querySelector("#sidebarToggle").addEventListener("click", () => {
  document.body.classList.toggle("sidebar-collapsed");
});

// Defensive check helper
const setSafeText = (el, text) => { if (el) el.textContent = text; };
const setSafeDisplay = (el, display) => { if (el) el.style.display = display; };

function logBrain(message, type = "info") {
  if (!els.aiBrainLogs) return;
  const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const div = document.createElement("div");
  let prefix = "[System]";
  let color = "var(--muted)";
  if (type === "intent") { prefix = "[Intent Match]"; color = "var(--teal)"; }
  if (type === "extract") { prefix = "[Extraction]"; color = "#f57f17"; }
  if (type === "speech") { prefix = "[Speech Engine]"; color = "#388e3c"; }
  
  div.style.color = color;
  div.style.wordBreak = "break-all";
  div.style.whiteSpace = "normal";
  div.innerHTML = `<span style="opacity: 0.6">[${time}]</span> <strong>${prefix}</strong> ${message}`;
  els.aiBrainLogs.appendChild(div);
  els.aiBrainLogs.scrollTop = els.aiBrainLogs.scrollHeight;
}

function setCallState(state) {
  els.callScreen.classList.remove("is-listening", "is-thinking", "is-speaking");
  if (state) {
    els.callScreen.classList.add(`is-${state}`);
  }
}

let voiceRecognition;
let voiceLead = {};
let voiceActive = false;
let voiceListening = false;
let voiceConversation = [];
let vapiInstance = null;
if (window.location.protocol === "file:") {
  if (els.serverWarning) els.serverWarning.hidden = false;
  setSafeText(els.voiceStatus, "Open the server URL above. Voice AI cannot work from file://.");
}

async function api(path, options = {}) {
  if (window.location.protocol === "file:") {
    throw new Error("Open http://127.0.0.1:4173/app.html. The API cannot run from file://.");
  }

  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

function formToPayload(form) {
  const data = new FormData(form);
  return Object.fromEntries(
    Array.from(data.entries()).map(([key, value]) => [key, value === "on" ? true : value]),
  );
}

function statusClass(status) {
  return status.toLowerCase();
}

function renderMetrics(metrics) {
  setSafeText(els.total, metrics.total);
  setSafeText(els.hot, metrics.hot);
  setSafeText(els.answered, metrics.answered);
  setSafeText(els.brochures, (metrics.minutesSaved / 60).toFixed(1));
}

function renderLeads(leads) {
  const tbody = document.getElementById("leadTableBody");
  if (!tbody) return;

  if (leads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--muted);">No leads captured yet.</td></tr>';
    return;
  }

  tbody.innerHTML = leads.map(lead => {
    const status = lead.status || "Warm";
    const statusClass = status.toLowerCase() === "hot" ? "status-hot" : (status.toLowerCase() === "cold" ? "status-cold" : "status-warm");
    
    return `
      <tr>
        <td>
          <div class="lead-name-cell">
            <span class="main">${escapeHtml(lead.name)}</span>
            <span class="sub">${escapeHtml(lead.source || "Organic")}</span>
          </div>
        </td>
        <td>
          <div class="lead-name-cell">
            <span class="main" style="font-size:0.8rem;">${escapeHtml(lead.email || "—")}</span>
            <span class="sub">${escapeHtml(lead.phone || "—")}</span>
          </div>
        </td>
        <td><span class="status-badge ${statusClass}">${status}</span></td>
        <td>
          <div class="lead-name-cell">
            <span class="main">${escapeHtml(lead.project || lead.interest)}</span>
            <span class="sub">${escapeHtml(lead.unitType || "General")}</span>
          </div>
        </td>
        <td>
          <div class="lead-name-cell">
            <span class="main">${escapeHtml(lead.budget)}</span>
            <span class="sub">${escapeHtml(lead.timeline)}</span>
          </div>
        </td>
        <td>
          <div class="lead-name-cell">
             <span class="main">${escapeHtml(lead.lastAction || "Pending")}</span>
             <span class="sub">${new Date(lead.createdAt).toLocaleDateString()}</span>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let chartInstance = null;
function renderAnalytics(leads) {
  const tbody = document.getElementById('analyticsTableBody');
  if (!tbody) return;

  tbody.innerHTML = leads.map(lead => `
    <tr style="border-bottom: 1px solid var(--line); transition: background 0.2s;">
      <td style="padding: 16px 8px; font-weight: 700; color: var(--muted); font-size: 0.8rem;">${new Date(lead.createdAt).toLocaleDateString()}</td>
      <td style="padding: 16px 8px; font-weight: 800; color: #fff; font-size: 0.95rem;">${escapeHtml(lead.name)}</td>
      <td style="padding: 16px 8px; text-align: right;">
        <span style="background: rgba(212, 175, 55, 0.1); color: var(--gold); padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.75rem;">
          +${(lead.minutesSaved || 5).toFixed(1)}m
        </span>
      </td>
    </tr>
  `).join('');

  const sortedLeads = [...leads].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const dataByDate = {};
  let cumulative = 0;
  
  sortedLeads.forEach(lead => {
    const d = new Date(lead.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
    cumulative += lead.minutesSaved || 5;
    dataByDate[d] = cumulative;
  });

  const ctx = document.getElementById('leadsChart');
  if (!ctx) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(dataByDate),
      datasets: [{
        label: 'Cumulative Minutes Saved',
        data: Object.values(dataByDate),
        borderColor: '#1d4ed8',
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(29, 78, 216, 0.1)');
          gradient.addColorStop(1, 'rgba(29, 78, 216, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#1d4ed8',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1a',
          padding: 12,
          titleFont: { family: 'Inter', weight: 'bold' },
          bodyFont: { family: 'Inter' },
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (context) => ` ${context.parsed.y.toFixed(0)} mins saved`
          }
        }
      },
      scales: { 
        y: { 
          beginAtZero: true, 
          grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
          ticks: { color: 'var(--muted)', font: { family: 'Inter', size: 10 }, callback: (v) => v + 'm' } 
        },
        x: {
          grid: { display: false },
          ticks: { color: 'var(--muted)', font: { family: 'Inter', size: 10 } }
        }
      }
    }
  });
}

async function refresh() {
  try {
    const [metrics, leads] = await Promise.all([api("/api/metrics"), api("/api/leads")]);
    renderMetrics(metrics);
    renderLeads(leads);
    renderAnalytics(leads);
  } catch (error) {
    els.table.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
  }
}

els.refresh.addEventListener("click", refresh);
document.querySelector("#exportLeads")?.addEventListener("click", () => {
  window.location.href = "/api/export-leads";
});
els.startVoice.addEventListener("click", startVoiceDemo);
els.stopVoice.addEventListener("click", stopVoiceDemo);

els.saveKnowledge.addEventListener("click", async () => {
  const content = els.knowledgeInput.value.trim();
  if (!content) return;
  
  els.saveKnowledge.disabled = true;
  els.saveKnowledge.textContent = "⌛ Syncing Knowledge...";
  
  try {
    await api("/api/knowledge", {
      method: "POST",
      body: JSON.stringify({ content, filename: `Custom_Context_${Date.now()}.md` })
    });
    els.knowledgeInput.value = "";
    els.saveKnowledge.textContent = "✅ Knowledge Synced!";
    setTimeout(() => {
      els.saveKnowledge.disabled = false;
      els.saveKnowledge.textContent = "💾 Update Agent Context";
      refreshKnowledgeList();
    }, 2000);
  } catch (e) {
    alert("Knowledge sync failed: " + e.message);
    els.saveKnowledge.disabled = false;
    els.saveKnowledge.textContent = "💾 Update Agent Context";
  }
});

async function refreshKnowledgeList() {
  try {
    const files = await api("/api/knowledge");
    els.fileList.innerHTML = files.map(f => {
      const isPdf = f.endsWith(".pdf");
      const icon = isPdf ? "📕" : "📄";
      return `
      <div style="background: #f1f5f9; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--line); display: flex; justify-content: space-between;">
        <span>${icon} ${escapeHtml(f)}</span>
        <span style="color: var(--green);">● Active</span>
      </div>
    `}).join("");
  } catch (e) {
    console.error("Failed to fetch knowledge list", e);
  }
}

els.pdfUpload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  els.uploadStatus.style.display = "block";
  els.uploadStatus.textContent = `Uploading ${file.name}...`;

  try {
    const response = await fetch("/api/upload-pdf", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Upload failed");
    
    els.uploadStatus.textContent = "✅ Upload complete!";
    setTimeout(() => {
      els.uploadStatus.style.display = "none";
      refreshKnowledgeList();
    }, 2000);
  } catch (err) {
    alert("Error uploading PDF: " + err.message);
    els.uploadStatus.style.display = "none";
  }
});

refresh();
refreshKnowledgeList();
async function startVoiceDemo() {
  try {
    if (!vapiInstance) {
      setSafeText(els.voiceStatus, "Loading Vapi SDK...");
      const module = await import("https://esm.sh/@vapi-ai/web");
      const Vapi = module.default || module.Vapi;
      vapiInstance = new Vapi("b89e5cb6-4c46-4349-9b67-f832ddb04230");
      
      vapiInstance.on('speech-start', () => {
        setCallState("speaking");
        setSafeText(els.voiceStatus, "🤖 Agent is speaking...");
        logBrain("Agent generating vocal response...", "speech");
      });
      
      vapiInstance.on('speech-end', () => {
        setCallState("listening");
        setSafeText(els.voiceStatus, "🎙️ Listening... Speak now!");
        logBrain("Listening to microphone input...", "info");
      });

      vapiInstance.on('message', (msg) => {
        if (msg.type === 'transcript' && msg.transcriptType === 'final') {
          const text = msg.transcript || msg.text || (msg.message && msg.message.text) || "";
          if (!text) return;
          const role = msg.role === 'user' ? 'Lead' : 'AI';
          const color = msg.role === 'user' ? '#ffffff' : 'var(--gold)';
          if (els.transcriptBox) els.transcriptBox.innerHTML += `<div style="color:${color}; margin-bottom: 8px;"><strong>${role}:</strong> ${escapeHtml(text)}</div>`;
          voiceConversation.push({ role: msg.role, text });
          
          if (msg.role === 'user') {
            logBrain("Processing user utterance...", "info");
            setTimeout(() => {
              if (/budget|million|thousand|k|dollar/i.test(text)) logBrain("Financial entity detected: updating budget constraint", "extract");
              else if (/looking|want|bed|apartment|house/i.test(text)) logBrain("Interest identified: matching to available catalogs", "intent");
              else logBrain("Analyzing conversational intent...", "intent");
            }, 600);
          }
        }
      });

      vapiInstance.on('call-end', async () => {
        await finishVapiCall();
      });
    }

    setSafeText(els.aiAnalyzingText, "AI is analyzing conversation and property catalogs...");
    setSafeText(els.voiceStatus, "Analyzing property catalogs...");
    setSafeDisplay(els.startVoice, "none");
    setSafeDisplay(els.stopVoice, "block");
    setSafeDisplay(els.aiAnalyzing, "flex");
    if (els.aiBrainLogs) {
      els.aiBrainLogs.style.display = "flex";
      els.aiBrainLogs.style.flexDirection = "column";
      els.aiBrainLogs.innerHTML = "";
    }
    logBrain("Initializing LeadPilot Vapi Agent...", "info");
    if (els.callScreen) els.callScreen.hidden = false;
    setSafeText(els.transcriptBox, "");
    voiceConversation = [];
    voiceActive = true;

    // Pre-check microphone permission
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      logBrain("Microphone access granted.", "info");
    } catch (micErr) {
      throw new Error("Microphone access denied. Please allow mic access and try again.");
    }

    const configRes = await fetch("/api/vapi-config");
    const assistantConfig = await configRes.json();
    setSafeDisplay(els.aiAnalyzing, "none");
    logBrain("Catalogs loaded. Connecting to Vapi...", "info");

    // 15-second timeout so it never hangs forever
    const startWithTimeout = Promise.race([
      vapiInstance.start(assistantConfig),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timed out. Check your Vapi key and network.")), 15000)
      )
    ]);

    await startWithTimeout;
    setCallState("listening");
    setSafeText(els.voiceStatus, "Call connected. Speak naturally!");
    logBrain("Call connected! Agent is ready.", "speech");
  } catch (error) {
    let details = error.message || String(error);
    if (error.response?.data) {
      details = JSON.stringify(error.response.data);
    }
    setSafeText(els.voiceStatus, `Error: ${details}`);
    setSafeDisplay(els.startVoice, "block");
    setSafeDisplay(els.stopVoice, "none");
    setSafeDisplay(els.aiAnalyzing, "none");
    logBrain(`FAILED: ${details}`, "info");
    console.error("Vapi Error:", error);
  }
}

let extractionInProgress = false;

function stopVoiceDemo() {
  if (vapiInstance) {
    vapiInstance.stop();
  }
  // Explicitly trigger extraction — don't rely on call-end event alone
  if (!extractionInProgress && voiceConversation.length > 0) {
    finishVapiCall();
  } else {
    voiceActive = false;
    setSafeDisplay(els.startVoice, "block");
    setSafeDisplay(els.stopVoice, "none");
    setSafeText(els.voiceStatus, "Call ended.");
  }
}

function listenForTurn() {}
async function handleTypedTurn(event) { event.preventDefault(); }
async function agentSay(text) {}
async function getAgentReply(text) {}

async function finishVapiCall() {
  if (extractionInProgress) return; // prevent double-call
  extractionInProgress = true;
  voiceActive = false;
  if (els.callScreen) els.callScreen.hidden = true;
  setSafeDisplay(els.startVoice, "block");
  setSafeDisplay(els.stopVoice, "none");

  if (!voiceConversation || voiceConversation.length === 0) {
    setSafeText(els.voiceStatus, "Call ended — no conversation to save.");
    extractionInProgress = false;
    return;
  }

  setSafeDisplay(els.aiAnalyzing, "flex");
  setSafeText(els.aiAnalyzingText, "Agent finalizing call details...");
  setSafeText(els.voiceStatus, "Extracting lead data...");
  logBrain("Call disconnected. Submitting full transcript to Gemini for extraction...", "extract");
  logBrain(`Conversation turns: ${voiceConversation.length}`, "info");

  try {
    const result = await api("/api/extract-lead", {
      method: "POST",
      body: JSON.stringify({ conversation: voiceConversation })
    });
    setSafeText(els.voiceStatus, `✅ Lead saved: ${result.name || "Unknown"}`);
    logBrain(`Lead saved: ${result.name || "Unknown"} | Budget: ${result.budget || "—"}`, "intent");
    await refresh();
  } catch (error) {
    setSafeText(els.voiceStatus, `Error extracting lead: ${error.message}`);
    logBrain(`Error during extraction: ${error.message}`, "info");
  } finally {
    setSafeDisplay(els.aiAnalyzing, "none");
    extractionInProgress = false;
    voiceConversation = [];
  }
}

// =================== MEETINGS ===================
async function refreshMeetings() {
  const list = document.getElementById("meetingList");
  if (!list) return;
  try {
    const meetings = await api("/api/meetings");
    if (!meetings.length) {
      list.innerHTML = '<p style="color:var(--muted);font-size:0.9rem;">No viewings scheduled yet.</p>';
      return;
    }
    list.innerHTML = meetings.map(m => {
      const d = new Date(m.datetime);
      const day = d.getDate();
      const mon = d.toLocaleString("default", { month: "short" }).toUpperCase();
      const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `
        <div class="meeting-card">
          <div class="meeting-date-block">
            <div class="day">${day}</div>
            <div class="mon">${mon}</div>
          </div>
          <div class="meeting-info">
            <h4>${escapeHtml(m.name)}</h4>
            <p>🏢 ${escapeHtml(m.property)} &nbsp;·&nbsp; 🕐 ${time}</p>
            ${m.notes ? `<p style="margin-top:4px;font-style:italic;">${escapeHtml(m.notes)}</p>` : ""}
          </div>
          <span class="meeting-badge">Confirmed</span>
        </div>`;
    }).join("");
  } catch (e) {
    list.innerHTML = `<p style="color:var(--red);">Failed to load meetings: ${e.message}</p>`;
  }
}

document.getElementById("bookMeeting")?.addEventListener("click", async () => {
  const name = document.getElementById("mtgName")?.value?.trim();
  const date = document.getElementById("mtgDate")?.value;
  const time = document.getElementById("mtgTime")?.value;
  const property = document.getElementById("mtgProperty")?.value;
  const notes = document.getElementById("mtgNotes")?.value?.trim();
  const statusEl = document.getElementById("mtgStatus");
  const btn = document.getElementById("bookMeeting");

  if (!name || !date || !time) {
    if (statusEl) { statusEl.style.display = "block"; statusEl.style.color = "var(--red)"; statusEl.textContent = "Please fill in Name, Date, and Time."; }
    return;
  }

  btn.disabled = true;
  btn.textContent = "⏳ Saving...";
  try {
    await api("/api/meetings", {
      method: "POST",
      body: JSON.stringify({ name, date, time, property, notes }),
    });
    if (statusEl) { statusEl.style.display = "block"; statusEl.style.color = "var(--green)"; statusEl.textContent = "✅ Viewing confirmed!"; }
    document.getElementById("mtgName").value = "";
    document.getElementById("mtgDate").value = "";
    document.getElementById("mtgTime").value = "";
    document.getElementById("mtgNotes").value = "";
    await refreshMeetings();
  } catch (e) {
    if (statusEl) { statusEl.style.display = "block"; statusEl.style.color = "var(--red)"; statusEl.textContent = `Error: ${e.message}`; }
  } finally {
    btn.disabled = false;
    btn.textContent = "📅 Confirm Booking";
    setTimeout(() => { if (statusEl) statusEl.style.display = "none"; }, 3000);
  }
});

// =================== POLLING & SYNC ===================
let syncInterval;
function startLiveSync() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => {
    if (!voiceActive) {
      refresh();
      refreshMeetings();
    }
  }, 10000); // 10s polling
}

// Initial boot
refresh();
refreshMeetings();
startLiveSync();

els.refresh.addEventListener("click", refresh);
document.querySelector("#exportLeads")?.addEventListener("click", () => {
  window.location.href = "/api/export-leads";
});
els.startVoice.addEventListener("click", startVoiceDemo);
els.stopVoice.addEventListener("click", stopVoiceDemo);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refresh();
});
