import React, { useState, useRef, useEffect } from 'react';

export default function AiChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey Sriraj! I'm your CS Engineering AI assistant. Ask me anything about Data Structures, OS kernels, networks, or specific exam problems!", isBot: true }
  ]);
  const messagesEndRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll layout to the latest message token
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const rawMessage = inputMessage;
    const userMessage = { id: Date.now(), text: rawMessage, isBot: false };
    
    // Map previous turns to role/text object nodes to enable conversation context memory
    const historyPayload = messages.map(msg => ({
      role: msg.isBot ? "model" : "user",
      text: msg.text
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/v1/chat/stream-converse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken") || (import.meta.env.PROD ? "" : "MOCK_SECURE_JWT_TOKEN_STRING")}`
        },
        body: JSON.stringify({
          user_message: rawMessage,
          history: historyPayload
        })
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI chat engine.");
      }

      const data = await response.json();
      const botResponseText = data.bot_response || "I could not generate a response. Please try again.";
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: botResponseText, isBot: true }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: `Error connecting to server: ${err.message}`, isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none">
      
      {/* 1. FLOATING ACTION TRIGGER TOGGLE BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-brand-amber text-brand-space rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all cursor-pointer ring-4 ring-brand-amber/10 relative group"
        >
          <span className="absolute -top-10 right-0 bg-brand-midnight border border-brand-slate text-[10px] text-brand-amber font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-wider">
            Ask AI Assistant
          </span>
          <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* =========================================================================
          2. CHAT WINDOW PANEL CONSOLE CONTAINER (Summoned Toggle)
          ========================================================================= */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[450px] bg-brand-midnight border border-brand-slate rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-fadeIn">
          
          {/* Header Action Banner */}
          <div className="bg-brand-space/80 border-b border-brand-slate/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
              <div>
                <h3 className="text-xs font-black text-brand-ash uppercase tracking-wider">AI Live Companion</h3>
                <span className="text-[9px] font-mono text-brand-amber font-bold block -mt-0.5">UNLIMITED ASSISTANCE</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-brand-ash/40 hover:text-brand-ash transition-colors text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Messages Logs Display Viewport */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3.5 bg-brand-space/10 scrollbar-none">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex w-full ${msg.isBot ? 'justify-start' : 'justify-end'} animate-fadeIn`}
              >
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs font-semibold leading-relaxed shadow-sm text-left
                  ${msg.isBot 
                    ? 'bg-brand-space border border-brand-slate/60 text-brand-ash/80 rounded-tl-none' 
                    : 'bg-brand-amber text-brand-space font-bold rounded-tr-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex w-full justify-start animate-fadeIn">
                <div className="max-w-[85%] rounded-xl px-3 py-2 text-xs font-semibold leading-relaxed shadow-sm text-left bg-brand-space border border-brand-slate/60 text-brand-ash/40 rounded-tl-none animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Submission Form Console */}
          <form onSubmit={handleSendMessage} className="p-3 bg-brand-space/80 border-t border-brand-slate/50 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a technical question..."
              className="flex-grow bg-brand-midnight border border-brand-slate rounded-xl px-3.5 py-2 text-xs font-semibold text-brand-ash placeholder-brand-ash/30 outline-none focus:border-brand-amber/40 transition-colors"
            />
            <button 
              type="submit"
              className="px-3.5 py-2 bg-brand-amber text-brand-space rounded-xl font-black text-xs transition-all hover:bg-[#e0951b] cursor-pointer shadow-md"
            >
              Send
            </button>
          </form>

        </div>
      )}

    </div>
  );
}