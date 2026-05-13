(function() {
  window.initJLambertAI = function(config = {}) {
    const accent = config.accentColor || '#00a884';
    const position = config.position || 'bottom-right';

    // Inject Styles
    const style = document.createElement('style');
    style.textContent = `
      #jl-ai-widget {
        position: fixed;
        ${position.includes('bottom') ? 'bottom: 30px;' : 'top: 30px;'}
        ${position.includes('right') ? 'right: 30px;' : 'left: 30px;'}
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .jl-button {
        width: 64px;
        height: 64px;
        background: ${accent};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 10px 30px rgba(0, 168, 132, 0.4);
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: none;
        outline: none;
      }
      .jl-button:hover {
        transform: scale(1.1) rotate(5deg);
        box-shadow: 0 15px 40px rgba(0, 168, 132, 0.6);
      }
      .jl-button svg {
        width: 28px;
        height: 28px;
        color: #000;
      }
      .jl-label {
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        pointer-events: none;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s;
      }
      #jl-ai-widget:hover .jl-label {
        opacity: 1;
        transform: translateY(0);
      }
      .jl-pulse {
        position: absolute;
        width: 100%;
        height: 100%;
        background: ${accent};
        border-radius: 50%;
        opacity: 0.6;
        z-index: -1;
        animation: jl-pulse 2s infinite;
      }
      @keyframes jl-pulse {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(1.8); opacity: 0; }
      }
      
      /* Active State UI */
      #jl-modal {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85);
        backdrop-filter: blur(15px);
        z-index: 1000000;
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        color: white;
        text-align: center;
      }
    `;
    document.head.appendChild(style);

    // Create Widget
    const container = document.createElement('div');
    container.id = 'jl-ai-widget';
    container.innerHTML = `
      <div class="jl-label">Call AI Concierge</div>
      <button class="jl-button" id="jl-call-btn">
        <div class="jl-pulse"></div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.11-1.29a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
      </button>
    `;
    document.body.appendChild(container);

    // Create Modal
    const modal = document.createElement('div');
    modal.id = 'jl-modal';
    modal.innerHTML = `
      <div style="margin-bottom: 24px;">
        <div style="width: 80px; height: 80px; background: ${accent}; border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 40px ${accent}66;">
           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
        </div>
        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.75rem; font-weight: 800; margin-bottom: 8px;">J. Lambert AI Concierge</h2>
        <p id="jl-modal-status" style="color: ${accent}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.8rem;">Connecting...</p>
      </div>
      <div id="jl-transcript" style="max-width: 400px; max-height: 200px; overflow-y: auto; font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-bottom: 40px; line-height: 1.5;"></div>
      <button id="jl-end-call" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; padding: 12px 32px; border-radius: 30px; font-weight: 700; cursor: pointer; transition: all 0.3s;">End Call</button>
    `;
    document.body.appendChild(modal);

    let vapi = null;
    let voiceConversation = [];

    const loadVapi = async () => {
      if (window.vapiInstance) return window.vapiInstance;
      const module = await import("https://esm.sh/@vapi-ai/web");
      const Vapi = module.default || module.Vapi;
      return new Vapi("b89e5cb6-4c46-4349-9b67-f832ddb04230");
    };

    document.getElementById('jl-call-btn').onclick = async () => {
      modal.style.display = 'flex';
      const statusEl = document.getElementById('jl-modal-status');
      const transcriptEl = document.getElementById('jl-transcript');
      transcriptEl.innerHTML = '';
      voiceConversation = [];

      try {
        vapi = await loadVapi();
        
        vapi.on('speech-start', () => { statusEl.textContent = '🤖 Agent Speaking...'; });
        vapi.on('speech-end', () => { statusEl.textContent = '🎙️ Listening...'; });
        
        vapi.on('message', (msg) => {
          if (msg.type === 'transcript' && msg.transcriptType === 'final') {
            const role = msg.role === 'user' ? 'You' : 'AI';
            transcriptEl.innerHTML += `<div style="margin-bottom:8px;"><strong>${role}:</strong> ${msg.transcript}</div>`;
            transcriptEl.scrollTop = transcriptEl.scrollHeight;
            voiceConversation.push({ role: msg.role, text: msg.transcript });
          }
        });

        vapi.on('call-end', async () => {
          statusEl.textContent = 'Finishing...';
          if (voiceConversation.length > 0) {
            await fetch('https://j-lambert-ai.onrender.com/api/extract-lead', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ conversation: voiceConversation })
            });
          }
          modal.style.display = 'none';
        });

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
