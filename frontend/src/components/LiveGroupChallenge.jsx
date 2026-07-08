import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LiveGroupChallenge() {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [roomLogs, setRoomLogs] = useState([]);
  const [groupAnswers, setGroupAnswers] = useState({});
  const socketRef = useRef(null);

  // Hardcoded mock question representing a synchronized active challenge question node
  const activeQuestion = {
    id: 99,
    text: "Which layer of the standard OSI model handles network packet routing, framing, and logical mapping protocols?",
    options: ["Transport Layer", "Data Link Layer", "Network Layer", "Physical Layer"]
  };

  useEffect(() => {
    // 1. Establish a real-time persistent connection to the FastAPI WebSocket server
    // We pass our validation token (from local storage or default mock) as a query parameter string
    const token = localStorage.getItem("authToken") || "MOCK_SECURE_JWT_TOKEN_STRING";
    const wsUrl = `ws://localhost:8000/api/v1/ws/live-updates?token=${token}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      setIsConnected(true);
      appendLog("Connection Established", "You are now synchronized with the MockVerse challenge matrix loop.");
    };

    // 2. Intercept incoming text frames from the real_time.py broadcast manager
    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.event === "USER_CONNECTED" || data.event === "USER_DISCONNECTED") {
        appendLog(data.event, data.message);
      } else if (data.event === "LIVE_ACTIVITY_BROADCAST") {
        // Log choice updates dynamically when peers pick an answer option string
        const sender = data.sender;
        const selectedOption = data.payload.selected_option;
        
        setGroupAnswers(prev => ({
          ...prev,
          [sender]: selectedOption
        }));
        
        appendLog("ACTIVITY", `${sender} committed answer option: "${selectedOption}"`);
      }
    };

    socketRef.current.onclose = () => {
      setIsConnected(false);
      appendLog("DISCONNECTED", "The socket connection pool was closed down cleanly.");
    };

    return () => {
      socketRef.current?.close();
    };
  }, []);

  const appendLog = (type, text) => {
    setRoomLogs(prev => [...prev, { id: Date.now() + Math.random(), type, text }]);
  };

  // 3. Fire outgoing client choice selections across the open TCP channel socket frame
  const handleSelectOption = (optionText) => {
    if (!isConnected) return;
    
    // Staging payload object context parameters matching your JSON rules
    const payload = {
      action: "SUBMIT_SELECTION",
      question_id: activeQuestion.id,
      selected_option: optionText
    };

    socketRef.current.send(JSON.stringify(payload));
    
    // Save your choice into your local data state structure also
    setGroupAnswers(prev => ({
      ...prev,
      "You": optionText
    }));
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none animate-fadeIn pt-2 text-left">
      
      {/* LEFT COLUMN MAIN WORKSPACE: CHALLENGE QUESTION AREA */}
      <div className="lg:col-span-8 bg-brand-midnight border border-brand-slate rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col justify-between min-h-[68vh]">
        <div>
          {/* Top Row Indicators Status Meta */}
          <div className="flex items-center justify-between border-b border-brand-slate/40 pb-4 mb-6">
            <div className="space-y-0.5">
              <h2 className="text-sm font-black text-brand-ash tracking-tight">LIVE COMP_SCI BLITZ</h2>
              <span className="text-[10px] text-brand-amber font-mono font-bold tracking-wider block">
                SYNCHRONIZED SPEED MULTIPLAYER MODE
              </span>
            </div>
            <span className={`text-[10px] font-mono font-black tracking-wide px-2.5 py-1 rounded border transition-colors
              ${isConnected 
                ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-950/20 text-rose-400 border-rose-500/20 animate-pulse'
              }`}
            >
              {isConnected ? "● SERVER LINK ONLINE" : "○ DISCONNECTED"}
            </span>
          </div>

          {/* Active Question Title Header */}
          <div className="my-6">
            <h3 className="text-base font-extrabold text-brand-ash leading-relaxed">
              {activeQuestion.text}
            </h3>
          </div>

          {/* Interactive Response Button Mapping Stack */}
          <div className="space-y-3.5 my-8">
            {activeQuestion.options.map((option, idx) => {
              const alphabet = String.fromCharCode(65 + idx);
              const isChosenByMe = groupAnswers["You"] === option;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(option)}
                  disabled={!isConnected}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border font-semibold transition-all group disabled:opacity-40 disabled:cursor-not-allowed
                    ${isChosenByMe
                      ? 'border-brand-amber bg-brand-space text-brand-amber shadow-md shadow-brand-amber/5'
                      : 'border-brand-slate/60 hover:border-brand-ash/30 bg-brand-space/30 text-brand-ash/70'
                    }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-black font-sans
                    ${isChosenByMe ? 'border-brand-amber bg-brand-amber text-brand-space' : 'border-brand-slate text-brand-ash/40'}`}
                  >
                    {alphabet}
                  </div>
                  <span className="text-xs">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-brand-slate/40 flex justify-between items-center">
          <p className="text-[10px] font-bold text-brand-ash/40">Selecting an option sends your selection context immediately across peer paths.</p>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-brand-space border border-brand-slate rounded-xl text-xs font-bold text-brand-ash/60 hover:text-brand-ash">
            Exit Arena
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN SIDEBAR: PEER RADAR AND HANDSHAKE PACKET LOGS */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Dynamic Activity Distribution Dashboard Panel */}
        <div className="bg-brand-midnight border border-brand-slate rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-brand-ash border-b border-brand-slate/40 pb-2">Active Room Submissions</h3>
          <div className="space-y-3 max-h-[22vh] overflow-y-auto">
            {Object.keys(groupAnswers).length === 0 ? (
              <p className="text-xs font-semibold text-brand-ash/30 italic">Awaiting response metrics from peers...</p>
            ) : (
              Object.entries(groupAnswers).map(([user, selection]) => (
                <div key={user} className="flex items-center justify-between p-2.5 bg-brand-space/40 border border-brand-slate rounded-xl text-xs font-semibold">
                  <span className={user === "You" ? "text-brand-amber font-black" : "text-brand-ash"}>{user}</span>
                  <span className="text-brand-ash/40 font-mono text-[10px] truncate max-w-[150px]">{selection}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Diagnostic Connection Matrix Log Console */}
        <div className="bg-brand-midnight border border-brand-slate rounded-3xl p-6 shadow-2xl space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-brand-ash border-b border-brand-slate/40 pb-2">Live Node Cluster Logs</h3>
          <div className="h-44 bg-brand-space/20 rounded-xl p-3 font-mono text-[10px] space-y-2 overflow-y-auto border border-brand-slate flex flex-col scrollbar-none">
            {roomLogs.map((log) => (
              <div key={log.id} className="text-left leading-normal">
                <span className={`font-black uppercase [font-size:9px] mr-1.5
                  ${log.type.includes("USER") ? "text-purple-400" : log.type === "ACTIVITY" ? "text-brand-amber" : "text-emerald-400"}`}>
                  [{log.type}]
                </span>
                <span className="text-brand-ash/60">{log.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}