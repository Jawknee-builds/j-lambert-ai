(function() {
  window.initJLambertAI = function(config = {}) {
    const accent = config.accentColor || '#00a884';
    const position = config.position || 'bottom-right';
    const showPromo = config.showPromo !== false;
    const promoText = config.promoText || 'Check our new AI Receptionist + WhatsApp Operator';
    const mvpLink = config.mvpLink || 'https://j-lambert-ai.onrender.com';

    // Inject Styles
    const style = document.createElement('style');
    style.textContent = `
      #jl-ai-widget {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 16px;
        font-family: 'Inter', sans-serif;
      }
      
      /* Promo Card */
      .jl-promo-card {
        background: rgba(26, 26, 26, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        padding: 20px;
        border-radius: 20px;
        width: 280px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        transform: translateX(400px);
        transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
        display: ${showPromo ? 'block' : 'none'};
      }
      .jl-promo-card.visible {
        transform: translateX(0);
      }
      .jl-promo-badge {
        background: ${accent};
        color: #000;
        font-size: 0.6rem;
        font-weight: 900;
        padding: 4px 8px;
        border-radius: 6px;
        text-transform: uppercase;
        margin-bottom: 12px;
        display: inline-block;
      }
      .jl-promo-card h3 {
        color: white;
        font-size: 0.9rem;
        font-weight: 700;
        margin-bottom: 8px;
        line-height: 1.4;
      }
      .jl-promo-card p {
        color: rgba(255,255,255,0.5);
        font-size: 0.75rem;
        margin-bottom: 16px;
      }
      .jl-promo-btn {
        background: transparent;
        border: 1px solid ${accent};
        color: ${accent};
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s;
        text-decoration: none;
        display: inline-block;
      }
      .jl-promo-btn:hover {
        background: ${accent};
        color: #000;
      }

      /* Floating Button */
      .jl-button {
        width: 60px;
        height: 60px;
        background: ${accent};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 10px 30px rgba(0, 168, 132, 0.4);
        transition: all 0.3s;
        border: none;
        position: relative;
      }
      .jl-button:hover { transform: scale(1.1); }
      .jl-button svg { width: 24px; height: 24px; color: #000; }
      
      .jl-pulse {
        position: absolute;
        width: 100%; height: 100%;
        background: ${accent};
        border-radius: 50%;
        opacity: 0.6;
        animation: jl-pulse 2s infinite;
      }
      @keyframes jl-pulse { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.8); opacity: 0; } }

      /* Call Modal */
      #jl-modal {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9);
        backdrop-filter: blur(15px);
        z-index: 1000000;
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        text-align: center;
      }
    `;
    document.head.appendChild(style);

    // Create Elements
    const container = document.createElement('div');
    container.id = 'jl-ai-widget';
    container.innerHTML = `
      <div class="jl-promo-card" id="jl-promo">
        <div class="jl-promo-badge">New Launch</div>
        <h3>${promoText}</h3>
        <p>Handle 100% of leads with 60-second automated response times.</p>
        <a href="${mvpLink}" class="jl-promo-btn" target="_blank">Try Live Demo →</a>
        <button id="jl-close-promo" style="position:absolute; top:12px; right:12px; background:none; border:none; color:rgba(255,255,255,0.3); cursor:pointer; font-size:1rem;">&times;</button>
      </div>
      <button class="jl-button" id="jl-call-btn">
        <div class="jl-pulse"></div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.11-1.29a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
      </button>
    `;
    document.body.appendChild(container);

    // Show Promo with Delay
    setTimeout(() => {
      document.getElementById('jl-promo').classList.add('visible');
    }, 2000);

    document.getElementById('jl-close-promo').onclick = () => {
      document.getElementById('jl-promo').style.display = 'none';
    };

    // Modal Handling
    const modal = document.createElement('div');
    modal.id = 'jl-modal';
    modal.innerHTML = `
      <div style="margin-bottom: 24px;">
        <div style="width: 70px; height: 70px; background: ${accent}; border-radius: 18px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
        </div>
        <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 4px;">J. Lambert AI Concierge</h2>
        <p id="jl-modal-status" style="color: ${accent}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.75rem;">Connecting...</p>
      </div>
      <div id="jl-transcript" style="max-width: 320px; height: 180px; overflow-y: auto; font-size: 0.85rem; color: rgba(255,255,255,0.6); margin-bottom: 30px;"></div>
      <button id="jl-end-call" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; padding: 12px 28px; border-radius: 30px; font-weight: 700; cursor: pointer;">End Call</button>
    `;
    document.body.appendChild(modal);

    let vapi = null;
    let voiceConversation = [];

    document.getElementById('jl-call-btn').onclick = async () => {
      modal.style.display = 'flex';
      const statusEl = document.getElementById('jl-modal-status');
      const transcriptEl = document.getElementById('jl-transcript');
      transcriptEl.innerHTML = '';
      voiceConversation = [];

      try {
        if (!vapi) {
          const module = await import("https://esm.sh/@vapi-ai/web");
          const Vapi = module.default || module.Vapi;
          vapi = new Vapi("b89e5cb6-4c46-4349-9b67-f832ddb04230");
          
          vapi.on('speech-start', () => { statusEl.textContent = '🤖 Agent Speaking...'; });
          vapi.on('speech-end', () => { statusEl.textContent = '🎙️ Listening...'; });
          
          vapi.on('message', (msg) => {
            if (msg.type === 'transcript' && msg.transcriptType === 'final') {
              transcriptEl.innerHTML += `<div style="margin-bottom:8px;"><strong>${msg.role === 'user' ? 'You' : 'AI'}:</strong> ${msg.transcript}</div>`;
              transcriptEl.scrollTop = transcriptEl.scrollHeight;
              voiceConversation.push({ role: msg.role, text: msg.transcript });
            }
          });

          vapi.on('call-end', async () => {
            if (voiceConversation.length > 0) {
              fetch('https://j-lambert-ai.onrender.com/api/extract-lead', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ conversation: voiceConversation })
              }).catch(err => console.error("Extract lead error:", err));
            }
            modal.style.display = 'none';
          });
        }

        const configRes = await fetch('https://j-lambert-ai.onrender.com/api/vapi-config');
        const assistantConfig = await configRes.json();
        await vapi.start(assistantConfig);
        
      } catch (err) {
        statusEl.textContent = 'Error connecting.';
        console.error(err);
      }
    };

    document.getElementById('jl-end-call').onclick = () => {
      if (vapi) vapi.stop();
      modal.style.display = 'none';
    };
  };
})();
