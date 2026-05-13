const fs = require('fs');
const path = require('path');

const leadsPath = path.join(__dirname, '..', 'data', 'leads.json');
const leads = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));

const names = ["Jackson Ford", "Amelia Vance", "Lucas Thorne", "Grace Holloway", "Ethan Blackwood", "Zoe Montgomery", "Ryan Sterling", "Mia Sutherland", "Noah Vane", "Lily Whitaker"];
const projects = ["Parramatta Central", "Southbank Residences", "Auckland Harbour"];
const interests = ["3-Bed Penthouse", "2-Bed Apartment", "1-Bed Investment", "Townhouse"];

for (let i = 0; i < 60; i++) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 30));
  
  const turns = Math.floor(Math.random() * 20);
  const minutesSaved = Math.max(2, turns * 0.8 + Math.random() * 5);
  const score = 40 + Math.floor(Math.random() * 60);
  const status = score > 80 ? "Hot" : (score > 60 ? "Warm" : "Cold");

  leads.push({
    id: `demo-${i}`,
    createdAt: date.toISOString(),
    name: names[Math.floor(Math.random() * names.length)],
    phone: "+61 4" + Math.floor(10000000 + Math.random() * 90000000),
    email: "demo@example.com",
    channel: Math.random() > 0.5 ? "Vapi Voice Call" : "Meta Ads",
    project: projects[Math.floor(Math.random() * projects.length)],
    interest: interests[Math.floor(Math.random() * interests.length)],
    budget: `$${Math.floor(500 + Math.random() * 1500)}k`,
    timeline: "1-3 months",
    finance: "Pre-approved",
    enquiryType: "call",
    callOutcome: "answered",
    consent: true,
    turns: turns,
    score: score,
    minutesSaved: parseFloat(minutesSaved.toFixed(1)),
    status: status,
    ownerNextStep: "Follow up via CRM",
    summary: "### Demo Lead Summary\n* High intent detected via AI.",
    actions: []
  });
}

fs.writeFileSync(leadsPath, JSON.stringify(leads, null, 2));
console.log(`Hiked up to ${leads.length} leads.`);
