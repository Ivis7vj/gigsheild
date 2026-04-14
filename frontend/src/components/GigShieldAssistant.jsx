import React, { useState } from 'react';
import api from '../api/client';

export default function GigShieldAssistant({ userType = 'worker', contextClaimId = null, contextWorkerId = null }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am GigShield Assistant. Ask me about claims, fraud, premium, or weather verification.' },
  ]);

  const send = async (preset = null) => {
    const text = (preset || message).trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setMessage('');
    setLoading(true);
    try {
      const { data } = await api.post('/ai-agent/chat', {
        user_message: text,
        user_type: userType,
        context_claim_id: contextClaimId,
        context_worker_id: contextWorkerId,
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: data.agent_response, actions: data.suggested_actions || [] }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Assistant is unavailable right now. Please try again.' }]);
      console.log('AI assistant error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[200]">
      {open && (
        <div className="w-80 h-[440px] bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col overflow-hidden mb-3">
          <div className="px-4 py-3 bg-[#F97316] text-white font-semibold">Ask GigShield</div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#FFF8F0]">
            {messages.map((m, idx) => (
              <div key={idx} className={`max-w-[85%] text-sm px-3 py-2 rounded-xl ${m.role === 'user' ? 'ml-auto bg-[#F97316] text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                <p>{m.text}</p>
                {m.actions?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.actions.map((a) => (
                      <button
                        key={a}
                        onClick={() => send(a)}
                        className="text-xs px-2 py-1 bg-[#FFEDD5] text-[#C2410C] rounded-lg border border-[#FDBA74]"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 flex items-center gap-2">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question..."
              aria-label="Ask GigShield assistant"
            />
            <button
              onClick={() => send()}
              disabled={loading}
              className="px-3 py-2 rounded-lg bg-[#F97316] text-white text-sm disabled:opacity-60"
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="bg-[#F97316] text-white rounded-full px-4 py-3 shadow-lg"
        aria-label="Toggle GigShield assistant"
      >
        Ask GigShield
      </button>
    </div>
  );
}
