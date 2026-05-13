const steps = [
  {
    label: "00:00",
    text: "New enquiry received: Sarah Mitchell wants pricing for a 2-bed apartment in Parramatta.",
  },
  {
    label: "00:08",
    text: "AI concierge answers live if Sarah calls, or places an instant call if she submitted a form.",
  },
  {
    label: "00:42",
    text: "AI answers approved FAQs: price guide, completion timing, transport access, and inspection availability.",
  },
  {
    label: "01:15",
    text: "Qualification captured: AUD $750k-$850k budget, 0-3 month timeline, finance pre-approved.",
  },
  {
    label: "01:30",
    text: "If Sarah misses the call, brochure and inspection options are sent by email/WhatsApp with clear opt-out language.",
  },
  {
    label: "01:35",
    text: "Agent receives hot-lead summary with call status, email/message status, notes, and recommended follow-up.",
  },
];

const runButton = document.querySelector("#runDemo");
const timeline = document.querySelector("#timeline");

function makeStep(step) {
  const item = document.createElement("div");
  item.className = "timeline-item";

  const label = document.createElement("span");
  label.textContent = step.label;

  const text = document.createElement("p");
  text.textContent = step.text;

  item.append(label, text);
  return item;
}

runButton.addEventListener("click", () => {
  runButton.disabled = true;
  runButton.textContent = "Running...";
  timeline.textContent = "";

  steps.forEach((step, index) => {
    window.setTimeout(() => {
      const item = makeStep(step);
      timeline.appendChild(item);
      window.requestAnimationFrame(() => item.classList.add("is-visible"));

      if (index === steps.length - 1) {
        runButton.disabled = false;
        runButton.textContent = "Run again";
      }
    }, index * 620);
  });
});
