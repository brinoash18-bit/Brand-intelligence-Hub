import { useState, useRef } from "react";

const TABS = [
  { id: "sentiment",  label: "Brand Sentiment",    icon: "📊" },
  { id: "competitor", label: "Competitor Research", icon: "🔍" },
  { id: "problem",    label: "Problem Solver",      icon: "⚡" },
  { id: "insights",   label: "Data Insights",       icon: "💡" },
];

const TAB_COLORS = {
  sentiment:  { accent: "#00e5b4", bg: "rgba(0,229,180,0.08)",   glow: "0 0 30px rgba(0,229,180,0.15)" },
  competitor: { accent: "#ff6b35", bg: "rgba(255,107,53,0.08)",  glow: "0 0 30px rgba(255,107,53,0.15)" },
  problem:    { accent: "#a78bfa", bg: "rgba(167,139,250,0.08)", glow: "0 0 30px rgba(167,139,250,0.15)" },
  insights:   { accent: "#fbbf24", bg: "rgba(251,191,36,0.08)",  glow: "0 0 30px rgba(251,191,36,0.15)" },
};

const AGENT_PROMPTS = {
  sentiment:  (q, f) => `You are a Brand Sentiment Analysis agent for retail, wholesale, and marketing brands. Analyze the following and provide: 1) Overall sentiment score (0-100), 2) Key sentiment drivers (positive & negative), 3) Brand health assessment, 4) Actionable recommendations. Use clear section headings and bullet points.${f ? `\n\nUploaded data:\n${f}` : ""}\n\nQuery: ${q}`,
  competitor: (q, f) => `You are a Competitor Research agent specializing in retail, wholesale, and marketing. Provide: 1) Competitive landscape overview, 2) Key competitor strengths & weaknesses, 3) Market positioning gaps, 4) Strategic opportunities. Use clear section headings and bullet points.${f ? `\n\nUploaded data:\n${f}` : ""}\n\nQuery: ${q}`,
  problem:    (q, f) => `You are a Brand Problem Diagnosis & Solutions agent for retail, wholesale, and marketing. Provide: 1) Root cause analysis, 2) Impact assessment, 3) Short-term fixes (0-30 days), 4) Long-term strategic solutions. Use clear section headings and bullet points.${f ? `\n\nUploaded data:\n${f}` : ""}\n\nQuery: ${q}`,
  insights:   (q, f) => `You are a Data Insights & Trends agent for retail, wholesale, and brand management. Provide: 1) Key data trends, 2) Market signals, 3) Performance metrics interpretation, 4) Forward-looking predictions & recommendations. Use clear section headings and bullet points.${f ? `\n\nUploaded data:\n${f}` : ""}\n\nQuery: ${q}`,
};

const PLACEHOLDERS = {
  sentiment:  "e.g. Analyze customer sentiment for our new product launch…",
  competitor: "e.g. Compare our brand positioning vs. key competitors in premium retail…",
  problem:    "e.g. Our wholesale margins dropped 12% this quarter. Diagnose the issue…",
  insights:   "e.g. Identify growth trends in our Q3 sales data…",
};

const EXAMPLES = {
  sentiment:  ["Analyze brand perception after our rebranding", "How is customer sentiment trending?", "Evaluate NPS score implications"],
  competitor: ["Top 3 competitors in premium wholesale?", "Compare our pricing to market leaders", "Identify white space vs competitors"],
  problem:    ["Sales dropped 15% in urban markets", "Customer churn rising despite good reviews", "Wholesale partner complaints increasing"],
  insights:   ["Trends to drive our Q4 strategy", "Seasonal patterns in revenue data", "Which categories show strongest growth?"],
};

function parseResponse(text) {
  const sections = [];
  let current = null;
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    if (/^#+\s/.test(t) || /^\d+[.)]\s/.test(t) || /^\*\*[^*]+\*\*$/.test(t)) {
      if (current) sections.push(current);
      current = { title: t.replace(/^#+\s|^\d+[.)]\s?|\*\*/g, ""), points: [] };
    } else if (current && (t.startsWith("- ") || t.startsWith("• "))) {
      current.points.push(t.replace(/^[-•]\s/, ""));
    } else if (current) {
      current.points.push(t);
    } else {
      sections.push({ title: "", points: [t] });
    }
  }
  if (current) sections.push(current);
  return sections.length ? sections : [{ title: "Analysis", points: [text] }];
}

function ApiKeyGate({ onUnlock }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!key.trim().startsWith("sk-")) { setError("Key must start with sk-"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 10, messages: [{ role: "user", content: "hi" }] }),
      });
      if (res.ok) { onUnlock(key); }
      else { setError("Invalid API key. Please check and try again."); }
    } catch { setError("Connection failed. Check your internet and try again."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"440px", background:"#0d1220", border:"1px solid #1e2a3a", borderRadius:"20px", padding:"40px", textAlign:"center" }}>
        <div style={{ fontSize:"40px", marginBottom:"16px" }}>🧠</div>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"24px", fontWeight:800, color:"#fff", marginBottom:"8px" }}>Brand Intelligence Hub</h1>
        <p style={{ color:"#475569", fontSize:"14px", marginBottom:"32px", lineHeight:1.6 }}>Enter your Anthropic API key to unlock all four AI agents. Your key is never stored — it lives only in your browser session.</p>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleUnlock()}
          placeholder="sk-ant-..."
          style={{ width:"100%", background:"#070a12", border:"1px solid #1e2a3a", borderRadius:"10px", padding:"13px 16px", color:"#e2e8f0", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", marginBottom:"12px", outline:"none", boxSizing:"border-box" }}
        />
        {error && <p style={{ color:"#f87171", fontSize:"13px", marginBottom:"12px" }}>{error}</p>}
        <button onClick={handleUnlock} disabled={loading || !key.trim()}
          style={{ width:"100%", padding:"13px", borderRadius:"10px", background:loading?"#1e2a3a":"linear-gradient(135deg,#00e5b4,#3b82f6)", color:loading?"#64748b":"#080c14", fontWeight:700, fontSize:"14px", fontFamily:"'DM Sans',sans-serif", border:"none", cursor:loading?"not-allowed":"pointer" }}>
          {loading ? "Verifying…" : "Unlock Dashboard →"}
        </button>
        <p style={{ color:"#334155", fontSize:"12px", marginTop:"20px" }}>
          Get your key at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color:"#00e5b4" }}>console.anthropic.com</a>
        </p>
      </div>
    </div>
  );
}

function Dashboard({ apiKey, onLogout }) {
  const [activeTab, setActiveTab] = useState("sentiment");
  const [query, setQuery] = useState("");
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const fileRef = useRef();
  const colors = TAB_COLORS[activeTab];

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => setFileText(ev.target.result);
    reader.readAsText(file);
  };

  const handleRun = async () => {
    if (!query.trim() && !fileText) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: AGENT_PROMPTS[activeTab](query, fileText) }] }),
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("\n") || "No response.";
      const parsed = parseResponse(text);
      setResult(parsed);
      setHistory(h => [{ tab: activeTab, query: query || "File upload", result: parsed, time: new Date().toLocaleTimeString() }, ...h.slice(0, 4)]);
    } catch { setError("Agent encountered an error. Please try again."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#080c14", fontFamily:"'DM Sans',sans-serif", color:"#e2e8f0" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2d3748; border-radius: 2px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse-ring { 0%{transform:scale(.95);opacity:.7}70%{transform:scale(1.05);opacity:0}100%{transform:scale(.95);opacity:0} }
        .r-card{animation:fadeUp .35s ease forwards;opacity:0}
        .r-card:nth-child(2){animation-delay:.07s}
        .r-card:nth-child(3){animation-delay:.14s}
        .r-card:nth-child(4){animation-delay:.21s}
        textarea:focus{outline:none}
      `}</style>

      <div style={{ position:"fixed", inset:0, pointerEvents:"none", backgroundImage:"linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)", backgroundSize:"40px 40px" }} />
      <div style={{ position:"fixed", top:"-200px", right:"-100px", width:"600px", height:"600px", borderRadius:"50%", background:`radial-gradient(circle,${colors.accent}18 0%,transparent 70%)`, pointerEvents:"none", transition:"background .5s", zIndex:0 }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:"1100px", margin:"0 auto", padding:"32px 24px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"40px" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"6px" }}>
              <div style={{ width:"42px", height:"42px", borderRadius:"12px", background:`linear-gradient(135deg,${colors.accent},#3b82f6)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px" }}>🧠</div>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"26px", fontWeight:800, margin:0, background:`linear-gradient(90deg,#fff 40%,${colors.accent})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Brand Intelligence Hub</h1>
            </div>
            <p style={{ margin:0, color:"#64748b", fontSize:"13px", paddingLeft:"56px" }}>AI-powered agents for retail, wholesale & brand management</p>
          </div>
          <button onClick={onLogout} style={{ background:"#13192b", border:"1px solid #1e2a3a", borderRadius:"8px", padding:"8px 14px", color:"#475569", fontSize:"12px", fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>🔒 Logout</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:"24px" }}>
          <div>
            {/* Tabs */}
            <div style={{ display:"flex", gap:"8px", marginBottom:"24px", background:"#0d1220", borderRadius:"14px", padding:"6px", border:"1px solid #1e2a3a" }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                const tc = TAB_COLORS[tab.id];
                return (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setResult(null); setQuery(""); }}
                    style={{ flex:1, padding:"10px 8px", borderRadius:"10px", fontSize:"12px", fontWeight:600, fontFamily:"'DM Sans',sans-serif", color:isActive?tc.accent:"#475569", background:isActive?tc.bg:"transparent", border:isActive?`1px solid ${tc.accent}40`:"1px solid transparent", cursor:"pointer", transition:"all .2s" }}>
                    <div style={{ fontSize:"18px", marginBottom:"3px" }}>{tab.icon}</div>
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Input */}
            <div style={{ background:"#0d1220", border:`1px solid ${colors.accent}30`, borderRadius:"16px", padding:"20px", marginBottom:"20px", transition:"all .4s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
                <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:colors.accent }} />
                <span style={{ fontSize:"12px", fontWeight:600, color:colors.accent, textTransform:"uppercase", letterSpacing:"1px" }}>
                  {TABS.find(t=>t.id===activeTab)?.label} Agent
                </span>
              </div>

              <textarea value={query} onChange={e=>setQuery(e.target.value)} placeholder={PLACEHOLDERS[activeTab]} rows={4}
                style={{ width:"100%", background:"#070a12", border:"1px solid #1e2a3a", borderRadius:"10px", padding:"14px", color:"#e2e8f0", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6, marginBottom:"14px", resize:"vertical" }} />

              <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
                <button onClick={()=>fileRef.current.click()}
                  style={{ background:"#13192b", border:"1px dashed #2d3748", borderRadius:"8px", padding:"8px 14px", color:"#94a3b8", fontSize:"12px", fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
                  📎 Upload File
                </button>
                {fileName && (
                  <div style={{ display:"flex", alignItems:"center", gap:"6px", background:`${colors.accent}15`, border:`1px solid ${colors.accent}30`, borderRadius:"6px", padding:"5px 10px" }}>
                    <span style={{ fontSize:"11px", color:colors.accent }}>{fileName}</span>
                    <span onClick={()=>{setFileName("");setFileText("");fileRef.current.value="";}} style={{ cursor:"pointer", color:"#64748b", fontSize:"14px" }}>×</span>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".txt,.csv,.json,.md" onChange={handleFile} style={{ display:"none" }} />
              </div>

              <button onClick={handleRun} disabled={loading||(!query.trim()&&!fileText)}
                style={{ width:"100%", padding:"13px", borderRadius:"10px", background:loading?"#1e2a3a":`linear-gradient(135deg,${colors.accent},#3b82f6)`, color:loading?"#64748b":"#080c14", fontWeight:700, fontSize:"14px", fontFamily:"'DM Sans',sans-serif", border:"none", cursor:loading?"not-allowed":"pointer", transition:"all .4s" }}>
                {loading
                  ? <span style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:"8px" }}><span style={{ width:"14px",height:"14px",border:"2px solid #475569",borderTopColor:colors.accent,borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite" }} /> Analyzing…</span>
                  : `Run ${TABS.find(t=>t.id===activeTab)?.label} Agent →`
                }
              </button>
            </div>

            {/* Examples */}
            <div style={{ marginBottom:"24px" }}>
              <p style={{ fontSize:"11px", color:"#475569", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px", fontWeight:600 }}>Quick Examples</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                {EXAMPLES[activeTab].map((ex,i) => (
                  <button key={i} onClick={()=>setQuery(ex)}
                    style={{ background:"#0d1220", border:"1px solid #1e2a3a", borderRadius:"20px", padding:"6px 12px", fontSize:"12px", color:"#94a3b8", fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={{ background:"#2d0a0a", border:"1px solid #7f1d1d", borderRadius:"10px", padding:"14px", marginBottom:"20px", color:"#fca5a5", fontSize:"13px" }}>⚠️ {error}</div>}

            {/* Results */}
            {result && (
              <div>
                <p style={{ fontSize:"11px", color:"#475569", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"16px", fontWeight:600 }}>Agent Results</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                  {result.map((section, i) => (
                    <div key={i} className="r-card" style={{ background:"#0d1220", border:`1px solid ${colors.accent}20`, borderRadius:"12px", padding:"16px", borderLeft:`3px solid ${colors.accent}` }}>
                      {section.title && <h3 style={{ margin:"0 0 10px 0", fontSize:"13px", fontWeight:700, color:colors.accent, textTransform:"uppercase", letterSpacing:"0.5px" }}>{section.title}</h3>}
                      <ul style={{ margin:0, padding:0, listStyle:"none" }}>
                        {section.points.map((pt,j) => (
                          <li key={j} style={{ fontSize:"13px", color:"#cbd5e1", lineHeight:1.7, paddingLeft:"14px", position:"relative", marginBottom:"4px" }}>
                            <span style={{ position:"absolute", left:0, color:colors.accent, opacity:.6 }}>›</span>{pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
            <div style={{ background:"#0d1220", border:"1px solid #1e2a3a", borderRadius:"14px", padding:"18px" }}>
              <p style={{ fontSize:"11px", color:"#475569", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 14px 0", fontWeight:600 }}>Agent Status</p>
              {TABS.map(tab => {
                const tc = TAB_COLORS[tab.id];
                const isActive = activeTab === tab.id;
                return (
                  <div key={tab.id} style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
                    <div style={{ position:"relative", width:"8px", height:"8px", flexShrink:0 }}>
                      <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:isActive?tc.accent:"#1e2a3a" }} />
                      {isActive && <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`1px solid ${tc.accent}`, animation:"pulse-ring 1.5s ease infinite" }} />}
                    </div>
                    <span style={{ fontSize:"12px", color:isActive?tc.accent:"#475569", fontWeight:isActive?600:400 }}>{tab.label}</span>
                    <span style={{ marginLeft:"auto", fontSize:"10px", background:isActive?`${tc.accent}20`:"#13192b", color:isActive?tc.accent:"#334155", padding:"2px 7px", borderRadius:"10px", fontWeight:600 }}>{isActive?"ACTIVE":"READY"}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ background:"#0d1220", border:"1px solid #1e2a3a", borderRadius:"14px", padding:"18px" }}>
              <p style={{ fontSize:"11px", color:"#475569", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 14px 0", fontWeight:600 }}>Capabilities</p>
              {[["✍️","Text Query"],["📁","File Upload (.txt,.csv,.json)"],["📋","Structured Output"],["🤖","4 Specialized Agents"],["🔒","Key Never Stored"]].map(([icon,label],i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px" }}>
                  <span style={{ fontSize:"14px" }}>{icon}</span>
                  <span style={{ fontSize:"12px", color:"#64748b" }}>{label}</span>
                </div>
              ))}
            </div>

            {history.length > 0 && (
              <div style={{ background:"#0d1220", border:"1px solid #1e2a3a", borderRadius:"14px", padding:"18px" }}>
                <p style={{ fontSize:"11px", color:"#475569", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 14px 0", fontWeight:600 }}>Recent Queries</p>
                {history.map((h,i) => {
                  const tc = TAB_COLORS[h.tab];
                  return (
                    <div key={i} onClick={()=>{setActiveTab(h.tab);setQuery(h.query);setResult(h.result);}}
                      style={{ marginBottom:"10px", padding:"10px", background:"#070a12", borderRadius:"8px", border:"1px solid #1e2a3a", borderLeft:`2px solid ${tc.accent}`, cursor:"pointer" }}>
                      <div style={{ fontSize:"10px", color:tc.accent, fontWeight:600, textTransform:"uppercase", marginBottom:"3px" }}>{TABS.find(t=>t.id===h.tab)?.label}</div>
                      <div style={{ fontSize:"11px", color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.query}</div>
                      <div style={{ fontSize:"10px", color:"#334155", marginTop:"2px" }}>{h.time}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => {
    try { return sessionStorage.getItem("bih_key") || ""; } catch { return ""; }
  });
  const handleUnlock = key => { try { sessionStorage.setItem("bih_key", key); } catch {} setApiKey(key); };
  const handleLogout = () => { try { sessionStorage.removeItem("bih_key"); } catch {} setApiKey(""); };
  return apiKey ? <Dashboard apiKey={apiKey} onLogout={handleLogout} /> : <ApiKeyGate onUnlock={handleUnlock} />;
}
