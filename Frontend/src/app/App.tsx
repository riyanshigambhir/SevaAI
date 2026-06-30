type GoFn = (screen: string, data?: any) => void;
import { fileComplaint } from "../api";
import { useState, useRef } from "react";

import {
  Bell, Plus, Home, MapPin, Users, User, ArrowLeft,
  Mic, Send, CheckCircle, Clock, ChevronRight, Zap,
  Star, AlertTriangle, BarChart2, Edit2, Globe,
  Map, Upload, List,
} from "lucide-react";

/* ─── tokens ──────────────────────────────────────── */
const C = {
  bg: "#0A0F1E", s1: "#111827", s2: "#1C2333",
  p: "#51A2D4", v: "#7E3FFF", g: "#10B981", r: "#EF4444",
  t: "#F9FAFB", m: "#9CA3AF", amber: "#F59E0B",
};

const GRID: React.CSSProperties = {
  backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)`,
  backgroundSize: "60px 60px",
};

/* stronger glow card styles */
const gc: React.CSSProperties = {
  background: C.s1,
  border: `1px solid rgba(81,162,212,0.4)`,
  boxShadow: `0 0 28px rgba(81,162,212,0.13), inset 0 1px 0 rgba(81,162,212,0.14), inset 0 0 14px rgba(81,162,212,0.04)`,
  borderRadius: "12px",
};
const gcv: React.CSSProperties = {
  background: C.s1,
  border: `1px solid rgba(126,63,255,0.4)`,
  borderLeft: `2px solid ${C.v}`,
  boxShadow: `0 0 28px rgba(126,63,255,0.13), inset 0 1px 0 rgba(126,63,255,0.1), inset 0 0 14px rgba(126,63,255,0.05)`,
  borderRadius: "12px",
};
const gcr: React.CSSProperties = {
  background: C.s1,
  border: `1px solid rgba(239,68,68,0.4)`,
  borderLeft: `2px solid ${C.r}`,
  boxShadow: `0 0 28px rgba(239,68,68,0.12), inset 0 1px 0 rgba(239,68,68,0.1)`,
  borderRadius: "12px",
};
const gradBtn: React.CSSProperties = {
  background: `linear-gradient(135deg,${C.p},${C.v})`,
  boxShadow: `0 6px 28px rgba(81,162,212,0.38), 0 0 0 1px rgba(81,162,212,0.2), 0 0 40px rgba(126,63,255,0.18)`,
  borderRadius: "12px",
};

/* scrollable content wrapper — bottom nav always fixed */
function Screen({ children, nav }: { children: React.ReactNode; nav: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ height: "100%", background: C.bg, ...GRID }}>
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        {children}
      </div>
      <div className="flex-shrink-0">{nav}</div>
    </div>
  );
}

/* ─── micro components ────────────────────────────── */
function StatusChip({ status }: { status: "IN PROGRESS" | "RESOLVED" | "PENDING" | "BREACH" | "DUE SOON" }) {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    "IN PROGRESS": { color: C.p, icon: <Clock size={8} /> },
    RESOLVED: { color: C.g, icon: <CheckCircle size={8} /> },
    PENDING: { color: C.m, icon: <Clock size={8} /> },
    BREACH: { color: C.r, icon: <AlertTriangle size={8} /> },
    "DUE SOON": { color: C.p, icon: <Clock size={8} /> },
  };
  const c = map[status];
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-semibold" style={{ color: c.color, background: `${c.color}1a`, border: `1px solid ${c.color}50`, fontSize: "8px", boxShadow: `0 0 6px ${c.color}25` }}>
      {c.icon} {status}
    </span>
  );
}

function SegBar({ filled, total = 4 }: { filled: number; total?: number }) {
  return (
    <div className="flex gap-0.5 flex-1">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex-1 rounded-sm" style={{ height: "4px", background: i < filled ? C.p : C.s2, boxShadow: i < filled ? `0 0 8px rgba(81,162,212,0.7)` : "none" }} />
      ))}
    </div>
  );
}

/* bottom nav with radial glow behind center plus */
function BottomNav({ active = "home", onFile }: { active?: string; onFile?: () => void }) {
  const items = [
    { id: "home", icon: <Home size={16} />, en: "Home" },
    { id: "track", icon: <MapPin size={16} />, en: "Track" },
    { id: "center", icon: null, en: "" },
    { id: "community", icon: <Users size={16} />, en: "Community" },
    { id: "profile", icon: <User size={16} />, en: "Profile" },
  ];
  return (
    <div className="flex items-center justify-around px-2 pb-2 pt-2 relative" style={{ background: `${C.s1}F2`, borderTop: `1px solid rgba(81,162,212,0.18)`, backdropFilter: "blur(8px)" }}>
      {items.map((item) =>
        item.id === "center" ? (
          <div key="center" className="relative flex items-center justify-center" style={{ width: 52, height: 52, marginTop: -20 }}>
            {/* radial glow halo */}
            <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, rgba(126,63,255,0.35) 0%, rgba(81,162,212,0.15) 50%, transparent 75%)`, transform: "scale(1.8)" }} />
            <button onClick={onFile} className="relative w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95" style={{ background: `linear-gradient(135deg,${C.p},${C.v})`, boxShadow: `0 0 24px rgba(126,63,255,0.6), 0 0 40px rgba(81,162,212,0.3), 0 4px 12px rgba(0,0,0,0.5)` }}>
              <Plus size={20} color="white" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <button key={item.id} className="flex flex-col items-center gap-0.5">
            <span style={{ color: active === item.id ? C.p : C.m, filter: active === item.id ? `drop-shadow(0 0 4px ${C.p})` : "none" }}>{item.icon}</span>
            <span style={{ fontSize: "8.5px", color: active === item.id ? C.p : C.m }}>{item.en}</span>
          </button>
        )
      )}
    </div>
  );
}

function GovBottomNav({ active = "home", go }: { active?: string; go: (s: string) => void }) {
  const items = [
    { id: "officer-dashboard", icon: <Home size={15} />, en: "Home", k: "home" },
    { id: "officer-queue", icon: <List size={15} />, en: "Complaints", k: "complaints" },
    { id: "civic", icon: <BarChart2 size={15} />, en: "Intelligence", k: "intelligence" },
    { id: "gov-profile", icon: <User size={15} />, en: "Profile", k: "profile" },
  ];
  return (
    <div className="flex items-center justify-around px-4 pb-2 pt-2" style={{ background: `${C.s1}F2`, borderTop: `1px solid rgba(81,162,212,0.18)` }}>
      {items.map(item => (
        <button key={item.id} onClick={() => go(item.id)} className="flex flex-col items-center gap-0.5">
          <span style={{ color: active === item.k ? C.p : C.m, filter: active === item.k ? `drop-shadow(0 0 4px ${C.p})` : "none" }}>{item.icon}</span>
          <span style={{ fontSize: "8px", color: active === item.k ? C.p : C.m }}>{item.en}</span>
        </button>
      ))}
    </div>
  );
}

function AshokaChakra() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden>
      <circle cx="100" cy="100" r="92" stroke={C.p} strokeWidth="3" fill="none" />
      <circle cx="100" cy="100" r="68" stroke={C.p} strokeWidth="1.5" fill="none" />
      <circle cx="100" cy="100" r="9" fill={C.p} />
      {Array.from({ length: 24 }, (_, i) => (
        <line key={i} x1="100" y1="9" x2="100" y2="191" stroke={C.p} strokeWidth="1.8" transform={`rotate(${i * 15} 100 100)`} />
      ))}
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i * 15 * Math.PI) / 180;
        return <circle key={`d${i}`} cx={100 + 78 * Math.sin(a)} cy={100 - 78 * Math.cos(a)} r="2.5" fill={C.p} />;
      })}
    </svg>
  );
}

/* heatmap color interpolation */
function lerpHex(a: string, b: string, t: number): string {
  const ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
}
function heatColor(v: number): string {
  if (v < 0.33) return lerpHex("#10B981", "#F59E0B", v / 0.33);
  if (v < 0.66) return lerpHex("#F59E0B", "#F97316", (v - 0.33) / 0.33);
  return lerpHex("#F97316", "#EF4444", (v - 0.66) / 0.34);
}

/* ─── SCREEN 1 — UNIFIED SPLASH / LOGIN ─────────── */
function S1_Login({ go }: { go: (s: string) => void }) {
  const [role, setRole] = useState("Citizen");
  const [lang, setLang] = useState(0);
  const roles = ["Citizen", "Officer", "Dept Head", "Admin"];
  const langs = [{ en: "Hindi", n: "हिंदी" }, { en: "English", n: "English" }, { en: "Bengali", n: "বাংলা" }, { en: "Telugu", n: "తెలుగు" }, { en: "Punjabi", n: "ਪੰਜਾਬੀ" }];

  function handleLogin() {
    if (role === "Citizen") go("home");
    else go("officer-dashboard");
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden" style={{ background: C.bg, ...GRID }}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.06 }}>
        <div className="w-72 h-72"><AshokaChakra /></div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-5 py-3">
        {/* Wordmark */}
        <div className="flex flex-col items-center mb-1">
          <div className="font-extrabold tracking-tight leading-none" style={{ fontSize: "38px", fontFamily: "Poppins,sans-serif" }}>
            <span className="text-white">Seva</span><span style={{ color: C.p }}>AI</span>
          </div>
          <div className="rounded-full mt-1.5" style={{ height: "2px", width: "100px", background: C.p, boxShadow: `0 0 14px ${C.p}, 0 0 28px rgba(81,162,212,0.45)` }} />
        </div>
        {/* Bilingual tagline */}
        <div className="text-center mt-4 mb-4">
          <p style={{ color: C.m, fontSize: "12px", fontWeight: 500 }}>Aapki Awaaz, Sarkar Tak</p>
          <p style={{ color: `${C.m}55`, fontSize: "9.5px", marginTop: 3 }}>Your Voice, To The Government / आपकी आवाज़, सरकार तक</p>
        </div>
        {/* Login card */}
        <div className="w-full p-3.5 rounded-xl mb-3" style={{ background: C.s1, border: `1px solid rgba(81,162,212,0.45)`, boxShadow: `0 0 32px rgba(81,162,212,0.14), 0 0 60px rgba(81,162,212,0.06), inset 0 0 20px rgba(81,162,212,0.04)` }}>
          <div className="mb-2.5">
            <div style={{ color: C.m, fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>User ID / यूज़र आईडी</div>
            <input type="text" placeholder="Enter your ID" className="w-full px-2.5 py-2 rounded-lg text-white outline-none" style={{ background: C.s2, border: `1px solid rgba(81,162,212,0.25)`, fontSize: "10px", boxShadow: `inset 0 0 8px rgba(81,162,212,0.05)` }} />
          </div>
          <div className="mb-3">
            <div style={{ color: C.m, fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Password / पासवर्ड</div>
            <input type="password" placeholder="••••••••" className="w-full px-2.5 py-2 rounded-lg text-white outline-none" style={{ background: C.s2, border: `1px solid rgba(81,162,212,0.25)`, fontSize: "10px" }} />
          </div>
          <div className="mb-3">
            <div style={{ color: C.m, fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Role / भूमिका</div>
            <div className="flex gap-1.5">
              {roles.map(r => (
                <button key={r} onClick={() => setRole(r)} className="flex-1 py-1.5 rounded-lg font-semibold transition-all" style={{ fontSize: "8.5px", background: role === r ? `rgba(81,162,212,0.18)` : C.s2, color: role === r ? C.p : C.m, border: role === r ? `1px solid rgba(81,162,212,0.6)` : `1px solid rgba(255,255,255,0.08)`, boxShadow: role === r ? `0 0 12px rgba(81,162,212,0.3), inset 0 0 8px rgba(81,162,212,0.05)` : "none" }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleLogin} className="w-full py-2.5 text-white font-bold rounded-xl" style={gradBtn}>
            <div style={{ fontSize: "11px", fontWeight: 700 }}>Login Securely / सुरक्षित लॉगिन</div>
          </button>
        </div>
        {/* Language selector */}
        <div className="w-full">
          <div style={{ color: `${C.m}50`, fontSize: "8px", textAlign: "center", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Select Language / भाषा चुनें</div>
          <div className="flex gap-1 justify-center flex-wrap">
            {langs.map((l, i) => (
              <button key={i} onClick={() => setLang(i)} className="px-2 py-1 rounded-lg transition-all" style={{ background: lang === i ? `rgba(81,162,212,0.15)` : C.s1, color: lang === i ? C.p : C.m, border: lang === i ? `1px solid rgba(81,162,212,0.55)` : `1px solid rgba(255,255,255,0.07)`, fontSize: "9px", boxShadow: lang === i ? `0 0 10px rgba(81,162,212,0.25)` : "none" }}>
                <div style={{ fontWeight: 600 }}>{l.en}</div>
                <div style={{ fontSize: "7px", opacity: 0.6 }}>{l.n}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SCREEN 2 — HOME DASHBOARD ─────────────────── */
function S2_Home({ go }: { go: (s: string) => void }) {
  return (
    <Screen nav={<BottomNav active="home" onFile={() => go("file")} />}>
      {/* Top bar with globe */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <span className="font-extrabold tracking-tight" style={{ fontSize: "18px" }}><span className="text-white">Seva</span><span style={{ color: C.p }}>AI</span></span>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.s2, border: `1px solid rgba(81,162,212,0.25)`, boxShadow: `0 0 8px rgba(81,162,212,0.1)` }}>
            <Globe size={14} color={C.m} />
          </button>
          <button className="relative w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.s2, border: `1px solid rgba(81,162,212,0.2)` }}>
            <Bell size={15} color={C.m} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: C.r, boxShadow: `0 0 5px ${C.r}` }} />
          </button>
          <button onClick={() => go("file")} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `rgba(81,162,212,0.1)`, border: `1px solid ${C.p}`, boxShadow: `0 0 10px rgba(81,162,212,0.25)` }}>
            <Plus size={15} color={C.p} />
          </button>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-4 mb-3">
        <div className="text-white font-bold" style={{ fontSize: "15px" }}>Namaste, Priya</div>
        <div className="flex items-center gap-1 mt-0.5"><MapPin size={9} color={C.m} /><span style={{ color: C.m, fontSize: "10px" }}>Ward 7 — Pilani, Rajasthan</span></div>
      </div>

      {/* Stats card — reference style */}
      <div className="px-4 mb-3">
        <div className="p-3 rounded-xl" style={gc}>
          <div className="flex items-stretch">
            {[
              { icon: <Clock size={18} color={C.amber} />, val: "2", color: C.amber, en: "Active" },
              { icon: <CheckCircle size={18} color={C.g} />, val: "1", color: C.g, en: "Resolved" },
              { icon: <Star size={18} color={C.p} />, val: "74", color: C.p, en: "Civic Score" },
            ].map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 px-2 py-1" style={{ borderRight: i < 2 ? `1px solid rgba(81,162,212,0.12)` : "none" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}38`, boxShadow: `0 0 12px ${s.color}30` }}>
                  {s.icon}
                </div>
                <div className="font-extrabold leading-none" style={{ color: s.color, fontSize: "22px", textShadow: `0 0 10px ${s.color}` }}>{s.val}</div>
                <div className="text-white font-bold" style={{ fontSize: "10px" }}>{s.en}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="px-4 mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-white font-bold" style={{ fontSize: "11px" }}>Recent Complaints</div>
          <button onClick={() => go("thread")} style={{ color: C.p, fontSize: "9px" }} className="flex items-center gap-0.5">View all <ChevronRight size={9} /></button>
        </div>
        {[
          { id: "#SEVA-2024-08421", cat: "Street Lighting", loc: "BITS Pilani Main Gate", status: "IN PROGRESS" as const, sla: "3 days left" },
          { id: "#SEVA-2024-07833", cat: "Road Pothole", loc: "Civil Lines, Pilani", status: "RESOLVED" as const, sla: "Closed 3 Jan" },
        ].map((c, i) => (
          <div key={i} className="p-2.5 mb-1.5 cursor-pointer" style={gc} onClick={() => go("thread")}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-2">
                <div style={{ color: `${C.m}70`, fontSize: "7.5px", fontFamily: "monospace", marginBottom: 2 }}>{c.id}</div>
                <div className="text-white font-bold" style={{ fontSize: "11px" }}>{c.cat}</div>
                <div className="flex items-center gap-1 mt-1"><MapPin size={8} color={C.m} /><span style={{ color: C.m, fontSize: "8.5px" }}>{c.loc}</span></div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusChip status={c.status} />
                <div style={{ color: `${C.m}60`, fontSize: "7.5px" }}>{c.sla}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Community */}
      <div className="px-4 pb-3">
        <div className="p-2.5" style={gcv}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold" style={{ fontSize: "10.5px" }}>3 complaints in your ward need validation</div>
            </div>
            <button style={{ color: C.p, fontSize: "9px", fontWeight: 600, flexShrink: 0 }}>Validate</button>
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ─── SCREEN 3 — FILE COMPLAINT (real mic + text + backend) ─────── */
function S3_File({ go }: { go: (s: string, data?: any) => void }) {
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const recognitionRef = useRef<any>(null);

  // ── Real mic input via Web Speech API ──
  const startMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("Voice not supported in this browser. Try Chrome, or use Type instead.");
      return;
    }
    const recognition = new SR();
    recognition.lang = "hi-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e: any) => {
      const text = Array.from(e.results as any[])
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(text);
      setError("");
    };
    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error);
      setListening(false);
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        setError("Mic permission denied. Check browser settings, or use Type instead.");
      }
    };
    recognition.onend = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
    setError("");
  };

  const stopMic = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // ── Submit whichever input is active (mic transcript or typed text) ──
  const submitComplaint = async () => {
    const input = mode === "voice" ? transcript : textInput;
    if (!input.trim()) {
      setError("Please speak or type your complaint first.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fileComplaint({
        raw_input: input,
        citizen_id: "550e8400-e29b-41d4-a716-446655440000",
        latitude: 28.3639,
        longitude: 75.5860,
        address: null,
        language: mode === "voice" ? "hi" : "en",
        ward: "Ward 7",
      });

      console.log("Complaint filed:", response);

      // Pass the REAL filed complaint data forward to the confirmation screen
      go("confirmed", response);

    } catch (err: any) {
      console.error("File complaint error:", err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeText = mode === "voice" ? transcript : textInput;

  return (
    <Screen nav={<BottomNav onFile={() => go("file")} />}>
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
        <button onClick={() => go("home")} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: C.s2, border: `1px solid rgba(81,162,212,0.3)` }}>
          <ArrowLeft size={13} color={C.m} />
        </button>
        <div className="text-white font-bold" style={{ fontSize: "12px" }}>शिकायत दर्ज करें</div>
      </div>

      <div className="text-center mb-2">
        <div style={{ color: C.m, fontSize: "10px" }}>बोल कर बताएं</div>
        <div style={{ color: `${C.m}50`, fontSize: "8.5px", marginTop: 2 }}>अपनी समस्या बताएं</div>
      </div>

      {/* Mic orb — voice mode only */}
      {mode === "voice" && (
        <div className="flex items-center justify-center mb-3">
          <div className="relative">
            {listening && <>
              <div className="absolute rounded-full" style={{ inset: "-14px", border: `1.5px solid rgba(81,162,212,0.38)`, animation: "ping 1.6s ease-out infinite" }} />
              <div className="absolute rounded-full" style={{ inset: "-26px", border: `1px solid rgba(81,162,212,0.18)`, animation: "ping 1.6s ease-out infinite 0.5s" }} />
            </>}
            <button
              onClick={listening ? stopMic : startMic}
              className="w-[88px] h-[88px] rounded-full flex items-center justify-center transition-transform active:scale-95 relative"
              style={{ background: listening ? `rgba(81,162,212,0.15)` : C.s2, boxShadow: listening ? `0 0 44px rgba(81,162,212,0.45), inset 0 0 20px rgba(81,162,212,0.12)` : `0 0 20px rgba(0,0,0,0.4)` }}>
              <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(135deg,${C.p},${C.v})`, padding: "2px", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
              <Mic size={30} color={listening ? C.p : "white"} />
            </button>
          </div>
        </div>
      )}

      {listening && (
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.g, boxShadow: `0 0 6px ${C.g}`, animation: "pulse 1s infinite" }} />
          <span style={{ color: C.g, fontSize: "8.5px", fontWeight: 700, letterSpacing: "0.1em" }}>RECORDING • रिकॉर्डिंग</span>
        </div>
      )}

      {/* Mode toggle — actually switches mode */}
      <div className="text-center mb-2">
        <button
          onClick={() => { setMode(mode === "voice" ? "text" : "voice"); setError(""); }}
          style={{ color: C.m, fontSize: "9.5px", textDecoration: "underline", textUnderlineOffset: "2px" }}>
          {mode === "voice" ? "टाइप करें / Type instead" : "वॉइस / Use mic"}
        </button>
      </div>

      {/* Real editable text input — text mode */}
      {mode === "text" && (
        <div className="px-4 mb-2">
          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Describe your complaint in English or Hindi..."
            rows={3}
            autoFocus
            className="w-full p-2.5 rounded-xl text-white outline-none resize-none"
            style={{ ...gc, fontSize: "10px", lineHeight: 1.5 } as React.CSSProperties}
          />
        </div>
      )}

      {/* Live transcript — voice mode only */}
      {mode === "voice" && (
        <div className="px-4 mb-2">
          <div className="p-2.5" style={gc}>
            <div style={{ color: `${C.m}70`, fontSize: "7.5px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>लाइव ट्रांसक्रिप्शन</div>
            <div className="text-white" style={{ fontSize: "10px", lineHeight: 1.5, minHeight: 20 }}>
              {transcript || <span style={{ color: C.m }}>माइक दबाएं और बोलें...</span>}
              {listening && <span className="inline-block w-px ml-0.5 animate-pulse align-middle" style={{ height: "12px", background: C.p }} />}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 mb-2">
          <p style={{ color: C.r, fontSize: "9px", textAlign: "center" }}>{error}</p>
        </div>
      )}

      <div className="px-4 pb-3">
        <button
          onClick={submitComplaint}
          disabled={submitting || !activeText.trim()}
          className="w-full py-3 text-white font-bold transition-transform active:scale-[0.97] disabled:opacity-40"
          style={gradBtn}>
          <div style={{ fontSize: "12px", fontWeight: 700 }}>
            {submitting ? "दर्ज हो रहा है... / Filing..." : "पुष्टि करें और दर्ज करें"}
          </div>
        </button>
      </div>
    </Screen>
  );
}


/* ─── SCREEN 4 — COMPLAINT CONFIRMED ─────────────── */
/* Replace the existing S4_Confirmed function in App.tsx with this.  */
/* Same name, same props — only the `details` array logic changed   */
/* from hardcoded literals to reading the real `data` prop.          */

function S4_Confirmed({ go, data, citizenId }: {
  go: (s: string, data?: any) => void;
  data?: any;
  citizenId?: string;
}) {
  const [msg, setMsg] = useState("");

  // Read from real filed-complaint data; fall back to demo values
  // ONLY if this screen is somehow reached without real data
  // (e.g. navigating here directly without filing first).
  const ticket      = data?.ticket_id   ?? "SEVA-2024-08421";
  const category    = data?.category    ?? "Street Lighting";
  const address     = data?.address     ?? "BITS Pilani Main Gate";
  const department  = data?.department  ?? "Municipal Electrical";
  const priority     = (data?.priority  ?? "medium").toUpperCase();
  const slaDays      = data?.sla_days   ?? 5;
  const slaDeadline  = data?.sla_deadline
    ? new Date(data.sla_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "20 Jan";

  const PRIORITY_COLOR: Record<string, string> = {
    LOW: C.g, MEDIUM: C.p, HIGH: "#F59E0B", CRITICAL: C.r,
  };

  const details = [
    { l: "Ticket",   v: ticket,     mono: true,  a: false },
    { l: "Category", v: category,   mono: false, a: false },
    { l: "Location", v: address,    mono: false, a: false },
    { l: "Dept",     v: department, mono: false, a: false },
    { l: "Priority", v: priority,   mono: false, a: true  },
    { l: "SLA",      v: `${slaDays} days — by ${slaDeadline}`, mono: false, a: false },
  ];

  return (
    <Screen nav={
      <div>
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: C.s1, border: `1px solid rgba(81,162,212,0.3)`, boxShadow: `0 0 10px rgba(81,162,212,0.08)` }}>
            <input type="text" placeholder="Ask a follow-up..." className="flex-1 bg-transparent outline-none text-white" style={{ fontSize: "10px" }} value={msg} onChange={e => setMsg(e.target.value)} />
            <Send size={13} color={C.p} style={{ filter: `drop-shadow(0 0 4px ${C.p})` }} />
          </div>
        </div>
        <BottomNav onFile={() => go("file")} />
      </div>
    }>
      <div className="px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <SegBar filled={1} />
          <button onClick={() => go("thread", data)} style={{ color: C.p, fontSize: "9px", whiteSpace: "nowrap" }} className="flex items-center gap-0.5">
            Track Complaint <ChevronRight size={9} />
          </button>
        </div>
      </div>
      <div className="px-4 mb-2.5">
        <div className="flex items-center gap-2">
          <CheckCircle size={17} color={C.g} style={{ filter: `drop-shadow(0 0 5px ${C.g})` }} />
          <div className="text-white font-bold" style={{ fontSize: "13px" }}>Filed Successfully</div>
        </div>
      </div>
      <div className="px-4 pb-2">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `rgba(81,162,212,0.14)`, border: `1.5px solid ${C.p}`, boxShadow: `0 0 10px rgba(81,162,212,0.35)` }}>
            <span style={{ color: C.p, fontSize: "10px", fontWeight: 800 }}>S</span>
          </div>
          <div className="flex-1 p-2.5" style={{ background: C.s1, borderLeft: `2px solid ${C.p}`, border: `1px solid rgba(81,162,212,0.3)`, borderLeftWidth: "2px", borderLeftColor: C.p, borderRadius: "0 10px 10px 10px", boxShadow: `0 0 16px rgba(81,162,212,0.09)` }}>
            <div style={{ color: C.p, fontSize: "7.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>SevaAI</div>
            <div className="text-white" style={{ fontSize: "9.5px", lineHeight: 1.5, marginBottom: 8 }}>Your complaint has been filed. Here are the details:</div>
            <div className="rounded-lg p-2 space-y-1" style={{ background: "rgba(10,15,30,0.85)", border: `1px solid rgba(81,162,212,0.15)` }}>
              {details.map((d, i) => (
                <div key={i} className="flex items-center justify-between gap-1">
                  <span style={{ color: C.m, fontSize: "8px" }}>{d.l}</span>
                  <span style={{
                    color: d.a ? (PRIORITY_COLOR[priority] ?? C.p) : C.t,
                    fontSize: "8.5px", fontWeight: 600,
                    fontFamily: d.mono ? "monospace" : "inherit"
                  }}>{d.v}</span>
                </div>
              ))}
            </div>
            <div style={{ color: C.m, fontSize: "9px", marginTop: 6 }}>Ask me anything about this complaint.</div>
          </div>
        </div>
      </div>

      {/* AI Reasoning Trace — only renders if reasoning_trace exists on data */}
      {data?.reasoning_trace && (
        <div className="px-4 pb-3">
          <div className="p-2.5 rounded-xl" style={{ background: C.s2, border: `1px solid rgba(126,63,255,0.35)`, boxShadow: `0 0 12px rgba(126,63,255,0.1)` }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={11} color={C.v} style={{ filter: `drop-shadow(0 0 4px ${C.v})` }} />
              <span style={{ color: C.v, fontSize: "9.5px", fontWeight: 700 }}>AI Reasoning Trace</span>
            </div>

            {data.reasoning_trace.detected_keywords?.length > 0 && (
              <div className="mb-2">
                <div style={{ color: C.m, fontSize: "7.5px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Detected Keywords</div>
                <div className="flex flex-wrap gap-1">
                  {data.reasoning_trace.detected_keywords.map((kw: string, i: number) => (
                    <span key={i} className="px-1.5 py-0.5 rounded" style={{ background: `rgba(81,162,212,0.12)`, border: `1px solid rgba(81,162,212,0.3)`, color: C.p, fontSize: "8px", fontWeight: 600 }}>{kw}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between py-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: C.m, fontSize: "8.5px" }}>Similar complaints in ward</span>
              <span style={{ color: C.p, fontSize: "9px", fontWeight: 700 }}>{data.reasoning_trace.historical_count}</span>
            </div>

            {data.reasoning_trace.priority_elevated && (
              <div className="py-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: "8.5px", color: C.t }}>
                  <span style={{ color: C.m }}>{data.reasoning_trace.original_priority?.toUpperCase()}</span> → <span style={{ color: PRIORITY_COLOR[priority] ?? C.r, fontWeight: 700 }}>{priority}</span>
                </div>
                {data.reasoning_trace.elevation_reason && (
                  <div style={{ color: C.m, fontSize: "8px", marginTop: 2 }}>{data.reasoning_trace.elevation_reason}</div>
                )}
              </div>
            )}

            {data.reasoning_trace.recommendation && (
              <div className="pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ color: C.g, fontSize: "8.5px", lineHeight: 1.5, marginTop: 4 }}>{data.reasoning_trace.recommendation}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </Screen>
  );
}

/* ─── SCREEN 5 — COMPLAINT THREAD ────────────────── */
function S5_Thread({ go }: { go: (s: string) => void }) {
  const [msg, setMsg] = useState("");
  const messages = [
    { who: "ai", text: "Complaint filed. Municipal Electrical Dept notified. 5 days to resolve." },
    { who: "ai", text: "Assigned to Officer Rajan Sharma. Field work scheduled for 17 Jan." },
    { who: "user", text: "Is there any update today?" },
    { who: "ai", text: "No update yet. Deadline is 20 Jan. Auto-escalates to Dept Head if unresolved by then." },
  ];
  return (
    <Screen nav={
      <div>
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: C.s1, border: `1px solid rgba(81,162,212,0.3)` }}>
            <input type="text" placeholder="Ask a follow-up..." className="flex-1 bg-transparent outline-none text-white" style={{ fontSize: "10px" }} value={msg} onChange={e => setMsg(e.target.value)} />
            <Send size={13} color={C.p} />
          </div>
        </div>
        <BottomNav active="track" onFile={() => go("file")} />
      </div>
    }>
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
        <button onClick={() => go("confirmed")} className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.s2, border: `1px solid rgba(81,162,212,0.3)` }}>
          <ArrowLeft size={13} color={C.m} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold" style={{ fontSize: "12px" }}>SEVA-2024-08421</div>
          <div style={{ color: C.m, fontSize: "8.5px" }}>Street Lighting · Municipal Electrical</div>
        </div>
      </div>
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2"><SegBar filled={2} /><span style={{ color: C.p, fontSize: "9px", whiteSpace: "nowrap" }}>Step 2/4</span></div>
      </div>
      <div className="px-4 flex flex-col gap-2">
        {messages.map((m, i) =>
          m.who === "ai" ? (
            <div key={i} className="flex items-start gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `rgba(81,162,212,0.14)`, border: `1.5px solid ${C.p}`, boxShadow: `0 0 7px rgba(81,162,212,0.35)` }}>
                <span style={{ color: C.p, fontSize: "7px", fontWeight: 800 }}>S</span>
              </div>
              <div className="flex-1 px-2.5 py-2" style={{ background: C.s1, borderLeft: `2px solid ${C.p}`, border: `1px solid rgba(81,162,212,0.3)`, borderLeftWidth: "2px", borderLeftColor: C.p, borderRadius: "0 8px 8px 8px", boxShadow: `0 0 12px rgba(81,162,212,0.08)` }}>
                <div className="text-white" style={{ fontSize: "9px", lineHeight: 1.5 }}>{m.text}</div>
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="px-2.5 py-2 max-w-[75%]" style={{ background: C.s2, borderRight: `2px solid ${C.v}`, border: `1px solid rgba(126,63,255,0.3)`, borderRightWidth: "2px", borderRightColor: C.v, borderRadius: "8px 0 8px 8px", boxShadow: `0 0 12px rgba(126,63,255,0.1)` }}>
                <div className="text-white" style={{ fontSize: "9px", lineHeight: 1.5 }}>{m.text}</div>
              </div>
            </div>
          )
        )}
      </div>
      <div className="px-4 mt-2 pb-2">
        <div className="p-2.5 rounded-xl" style={{ background: C.s1, border: `1px solid rgba(239,68,68,0.35)`, boxShadow: `0 0 14px rgba(239,68,68,0.1)` }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={11} color={C.r} style={{ filter: `drop-shadow(0 0 4px ${C.r})` }} />
              <span style={{ color: C.m, fontSize: "9px" }}>SLA: 2 days 4 hours remaining</span>
            </div>
            <button style={{ color: C.r, fontSize: "9px", fontWeight: 600 }}>Escalate Now</button>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: "3px", background: C.s2 }}>
            <div className="h-full rounded-full" style={{ width: "65%", background: C.r, boxShadow: `0 0 7px ${C.r}` }} />
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ─── SCREEN 6 — COMMUNITY MAP ───────────────────── */
function S6_Map({ go }: { go: (s: string) => void }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Critical", "Near Me", "My Ward"];
  const pins = [
    { x: "28%", y: "22%", color: C.r }, { x: "55%", y: "35%", color: C.p },
    { x: "72%", y: "55%", color: C.p }, { x: "38%", y: "60%", color: C.r },
    { x: "20%", y: "45%", color: C.p }, { x: "80%", y: "30%", color: C.r },
    { x: "62%", y: "70%", color: C.p },
  ];
  const rows = [
    { cat: "Sewage Leak", dist: "120m", sev: "CRITICAL", sevColor: C.r },
    { cat: "Broken Footpath", dist: "340m", sev: "MEDIUM", sevColor: C.p },
    { cat: "Park Light Out", dist: "500m", sev: "LOW", sevColor: C.g },
  ];
  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div className="relative" style={{ flex: 1, background: "#060C18", overflow: "hidden" }}>
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.25 }}>
          {[15, 30, 45, 60, 75].map(p => (
            <g key={p}>
              <line x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="#1E3A5F" strokeWidth="8" />
              <line x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="#1E3A5F" strokeWidth="8" />
            </g>
          ))}
        </svg>
        <div className="absolute inset-0" style={GRID} />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(81,162,212,0.05) 0%, transparent 70%)` }} />
        {pins.map((pin, i) => (
          <div key={i} className="absolute" style={{ left: pin.x, top: pin.y, transform: "translate(-50%,-50%)" }}>
            <div className="w-5 h-5 rounded-full" style={{ background: `${pin.color}28`, border: `2px solid ${pin.color}`, boxShadow: `0 0 12px ${pin.color}90` }} />
          </div>
        ))}
        <div className="absolute" style={{ left: "48%", top: "48%", transform: "translate(-50%,-50%)" }}>
          <div className="w-3 h-3 rounded-full" style={{ background: C.g, boxShadow: `0 0 0 3px rgba(16,185,129,0.3), 0 0 14px ${C.g}` }} />
        </div>
        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className="px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm" style={{ fontSize: "9px", background: filter === f ? C.p : "rgba(17,24,39,0.85)", color: filter === f ? "white" : C.m, border: filter === f ? `1px solid ${C.p}` : `1px solid rgba(255,255,255,0.1)`, boxShadow: filter === f ? `0 0 14px rgba(81,162,212,0.5)` : "none" }}>
              {f}
            </button>
          ))}
        </div>
        <div className="absolute bottom-4 right-4">
          <button onClick={() => go("file")} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg,${C.p},${C.v})`, boxShadow: `0 0 24px rgba(126,63,255,0.55)` }}>
            <Plus size={18} color="white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div className="flex-shrink-0" style={{ background: C.s1, borderTop: `1px solid rgba(81,162,212,0.3)` }}>
        <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: `1px solid rgba(81,162,212,0.1)` }}>
          <div className="text-white font-bold" style={{ fontSize: "10px" }}>Nearby Complaints</div>
          <div style={{ color: C.m, fontSize: "8.5px" }}>3 found</div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2" style={{ borderBottom: i < rows.length - 1 ? `1px solid rgba(255,255,255,0.05)` : "none" }}>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold" style={{ fontSize: "10px" }}>{r.cat}</div>
              <div style={{ color: C.m, fontSize: "7.5px" }}>{r.dist}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span style={{ color: r.sevColor, fontSize: "9px", fontWeight: 700 }}>{r.sev}</span>
              <button style={{ color: C.p, fontSize: "9px", fontWeight: 600 }}>Validate</button>
            </div>
          </div>
        ))}
      </div>
      <BottomNav active="community" onFile={() => go("file")} />
    </div>
  );
}

/* ─── SCREEN 7 — CIVIC INTELLIGENCE (G4) ────────── */
function S7_Civic({ go, ward }: {
  go: (s: string, data?: any) => void;
  ward?: string;
}) {
  const cells = [
    [0.05, 0.18, 0.42, 0.15, 0.08, 0.32],
    [0.20, 0.60, 0.88, 0.72, 0.28, 0.14],
    [0.40, 0.76, 1.00, 0.95, 0.55, 0.22],
    [0.18, 0.48, 0.72, 0.84, 0.36, 0.16],
    [0.08, 0.22, 0.44, 0.38, 0.18, 0.09],
    [0.05, 0.08, 0.14, 0.16, 0.07, 0.05],
  ];
  const blockLabels: Record<string, string> = { "1-2": "C4", "1-3": "C5", "2-2": "C6", "2-3": "C7" };
  return (
    <Screen nav={<GovBottomNav active="intelligence" go={go} />}>
      <div className="px-4 pt-3.5 pb-2">
        <div className="text-white font-bold" style={{ fontSize: "14px" }}>{ward || "Ward 4"} Dashboard</div>
        <div style={{ color: C.m, fontSize: "9px", marginTop: 2 }}>Civic Intelligence</div>
      </div>
      <div className="flex gap-1.5 px-4 mb-3">
        {[{ l: "Total", v: "156", c: C.t }, { l: "Resolved", v: "98", c: C.g }, { l: "Avg Days", v: "5.2", c: C.p }, { l: "Score", v: "68", c: C.amber }].map((k, i) => (
          <div key={i} className="flex-1 rounded-xl px-1.5 py-2 text-center" style={{ background: C.s2, border: `1px solid rgba(81,162,212,0.3)`, boxShadow: `0 0 12px rgba(81,162,212,0.07)` }}>
            <div style={{ color: k.c, fontSize: "17px", fontWeight: 800, lineHeight: 1, textShadow: k.c !== C.t ? `0 0 10px ${k.c}` : "none" }}>{k.v}</div>
            <div className="text-white font-semibold" style={{ fontSize: "8px", marginTop: 3 }}>{k.l}</div>
          </div>
        ))}
      </div>
      <div className="px-4 mb-3">
        <div className="p-2.5" style={gcv}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap size={11} color={C.v} style={{ filter: `drop-shadow(0 0 4px ${C.v})` }} />
            <div className="text-white font-bold" style={{ fontSize: "10.5px" }}>Infrastructure Risk — Ward 4</div>
          </div>
          <div style={{ color: C.m, fontSize: "9px", lineHeight: 1.5, marginBottom: 8 }}>
            45 potholes, 32 drainage, 18 water leaks in Blocks C4–C7 indicate underground pipe failure. Pre-monsoon audit recommended.
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: C.p, fontSize: "9px", fontWeight: 600 }}>Confidence: 87%</span>
            <span style={{ color: C.r, fontSize: "9px", fontWeight: 700 }}>Priority: HIGH</span>
          </div>
        </div>
      </div>
      {/* Choropleth heatmap */}
      <div className="px-4 mb-3">
        <div style={{ color: C.m, fontSize: "8.5px", marginBottom: 6 }}>Complaint Density Map</div>
        <div className="rounded-xl p-2.5" style={{ background: C.s1, border: `1px solid rgba(81,162,212,0.3)`, boxShadow: `0 0 16px rgba(81,162,212,0.07)` }}>
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
            {cells.map((row, ri) =>
              row.map((val, ci) => {
                const label = blockLabels[`${ri}-${ci}`];
                return (
                  <div key={`${ri}-${ci}`} className="rounded flex items-center justify-center" style={{ aspectRatio: "1", background: heatColor(val) }}>
                    {label && <span style={{ fontSize: "6.5px", color: "rgba(255,255,255,0.95)", fontWeight: 700 }}>{label}</span>}
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span style={{ color: C.m, fontSize: "7px" }}>Low</span>
            <div className="flex-1 rounded-full" style={{ height: "6px", background: `linear-gradient(to right, #10B981, #F59E0B, #F97316, #EF4444)`, boxShadow: "0 0 6px rgba(239,68,68,0.3)" }} />
            <span style={{ color: C.m, fontSize: "7px" }}>High</span>
          </div>
        </div>
      </div>
      <div className="px-4 pb-3">
        <button className="w-full py-3 text-white font-bold" style={gradBtn}>
          <div style={{ fontSize: "12px", fontWeight: 700 }}>Generate Report</div>
        </button>
      </div>
    </Screen>
  );
}

/* ─── SCREEN 8 — PROFILE (no Preferences) ────────── */
function S8_Profile({ go }: { go: (s: string) => void }) {
  const score = 74;
  const r = 44, cx = 56, cy = 56;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ * 0.75;
  return (
    <Screen nav={<BottomNav active="profile" onFile={() => go("file")} />}>
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg,${C.p},${C.v})`, boxShadow: `0 0 20px rgba(81,162,212,0.45)`, fontSize: "14px", fontWeight: 800, color: "white" }}>PS</div>
        <div className="flex-1">
          <div className="text-white font-bold" style={{ fontSize: "13px" }}>Priya Sharma</div>
          <div className="flex items-center gap-1"><MapPin size={9} color={C.m} /><span style={{ color: C.m, fontSize: "9px" }}>Ward 7 — Pilani, Rajasthan</span></div>
        </div>
        <button style={{ color: C.m }}><Edit2 size={14} /></button>
      </div>
      <div className="px-4 mb-3">
        <div className="rounded-xl p-3 flex items-center gap-4" style={gc}>
          <div className="relative flex-shrink-0" style={{ width: 112, height: 112 }}>
            <svg width="112" height="112" viewBox="0 0 112 112">
              <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.s2} strokeWidth="8" strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={circ * 0.625} strokeLinecap="round" />
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#sg)" strokeWidth="8" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.625} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${C.p})` }} />
              <defs>
                <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={C.p} />
                  <stop offset="100%" stopColor={C.v} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: 8 }}>
              <div style={{ fontSize: "24px", fontWeight: 900, color: C.p, lineHeight: 1, textShadow: `0 0 12px ${C.p}` }}>{score}</div>
              <div style={{ color: C.m, fontSize: "8px", marginTop: 2 }}>Seva Score</div>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {[{ l: "Filed", v: "8", c: C.p }, { l: "Resolved", v: "6", c: C.g }, { l: "Validated", v: "14", c: C.v }].map((s, i) => (
              <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ background: C.s2, border: `1px solid rgba(81,162,212,0.22)` }}>
                <div className="text-white font-semibold" style={{ fontSize: "9.5px" }}>{s.l}</div>
                <div style={{ color: s.c, fontSize: "18px", fontWeight: 800, textShadow: `0 0 8px ${s.c}` }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="text-white font-bold mb-2" style={{ fontSize: "10.5px" }}>Complaint History</div>
        <div className="rounded-xl overflow-hidden" style={gc}>
          {[
            { cat: "Street Lighting", date: "10 Jan 2024", s: "IN PROGRESS" as const },
            { cat: "Road Pothole", date: "28 Dec 2023", s: "RESOLVED" as const },
            { cat: "Water Supply", date: "15 Dec 2023", s: "RESOLVED" as const },
          ].map((h, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: i < 2 ? `1px solid rgba(255,255,255,0.05)` : "none" }}>
              <div>
                <div className="text-white font-semibold" style={{ fontSize: "10px" }}>{h.cat}</div>
                <div style={{ color: `${C.m}70`, fontSize: "7.5px" }}>{h.date}</div>
              </div>
              <StatusChip status={h.s} />
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

/* ─── SCREEN G1 — OFFICER DASHBOARD ─────────────── */
function SG1_OfficerHome({ go }: { go: (s: string) => void }) {
  return (
    <Screen nav={<GovBottomNav active="home" go={go} />}>
      <div className="px-4 pt-3.5 pb-2">
        <div className="text-white font-bold" style={{ fontSize: "15px" }}>Namaste, Officer Rajan</div>
        <div style={{ color: C.m, fontSize: "9px", marginTop: 3 }}>Municipal Electrical Dept — Ward 7</div>
      </div>
      <div className="flex gap-2 px-4 mb-3">
        {[{ l: "Pending", v: "12", c: C.amber }, { l: "Due Today", v: "3", c: C.r }, { l: "Resolved", v: "8", c: C.g }].map((k, i) => (
          <div key={i} className="flex-1 rounded-xl px-2 py-2 text-center" style={{ background: C.s2, border: `1px solid rgba(81,162,212,0.3)`, boxShadow: `0 0 12px rgba(81,162,212,0.07)` }}>
            <div style={{ color: k.c, fontSize: "20px", fontWeight: 800, lineHeight: 1, textShadow: `0 0 10px ${k.c}` }}>{k.v}</div>
            <div className="text-white font-semibold" style={{ fontSize: "8.5px", marginTop: 3 }}>{k.l}</div>
          </div>
        ))}
      </div>
      <div className="px-4 mb-1.5">
        <div className="text-white font-bold mb-1.5" style={{ fontSize: "10.5px" }}>Escalated to You</div>
        <div className="p-2.5 cursor-pointer" style={gcr} onClick={() => go("officer-detail")}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 mr-2">
              <div style={{ color: `${C.m}65`, fontSize: "7.5px", fontFamily: "monospace", marginBottom: 2 }}>SEVA-2024-07341</div>
              <div className="text-white font-bold" style={{ fontSize: "10.5px" }}>Water Supply Failure</div>
              <div style={{ color: C.m, fontSize: "8px", marginTop: 2 }}>Block C4–C7, Ward 4</div>
              <div style={{ color: C.r, fontSize: "8px", marginTop: 3, fontWeight: 600 }}>SLA Breached — 2 days overdue</div>
            </div>
            <StatusChip status="BREACH" />
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 flex justify-end">
        <button onClick={() => go("officer-queue")} style={{ color: C.p, fontSize: "9.5px", fontWeight: 600 }}>
          See All Complaints →
        </button>
      </div>
    </Screen>
  );
}

/* ─── SCREEN G2 — OFFICER COMPLAINT QUEUE ───────── */
function SG2_Queue({ go }: { go: (s: string) => void }) {
  const queue = [
    { id: "SEVA-2024-08421", cat: "Street Lighting", loc: "BITS Pilani Main Gate", sla: "DUE SOON" as const },
    { id: "SEVA-2024-08199", cat: "Sewage Overflow", loc: "Block C5, Ward 4", sla: "IN PROGRESS" as const },
    { id: "SEVA-2024-07901", cat: "Road Pothole", loc: "Near Railway Gate", sla: "BREACH" as const },
  ];
  return (
    <Screen nav={<GovBottomNav active="complaints" go={go} />}>
      <div className="px-4 pt-3.5 pb-2">
        <div className="text-white font-bold" style={{ fontSize: "14px" }}>Complaint Queue</div>
        <div style={{ color: C.m, fontSize: "9px", marginTop: 2 }}>Rajan Sharma — Municipal Electrical</div>
      </div>
      <div className="flex gap-2 px-4 mb-3">
        {[{ l: "Pending", v: "12", c: C.amber }, { l: "Due Today", v: "3", c: C.r }, { l: "Resolved", v: "8", c: C.g }].map((k, i) => (
          <div key={i} className="flex-1 rounded-xl px-2 py-2 text-center" style={{ background: C.s2, border: `1px solid rgba(81,162,212,0.28)` }}>
            <div style={{ color: k.c, fontSize: "20px", fontWeight: 800, lineHeight: 1 }}>{k.v}</div>
            <div className="text-white font-semibold" style={{ fontSize: "8.5px", marginTop: 3 }}>{k.l}</div>
          </div>
        ))}
      </div>
      <div className="px-4 mb-2">
        <div className="text-white font-bold mb-1.5" style={{ fontSize: "10.5px" }}>Active Complaints</div>
        {queue.map((c, i) => (
          <div key={i} className="p-2.5 mb-1.5 cursor-pointer" style={gc} onClick={() => go("officer-detail")}>
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0 mr-2">
                <div style={{ color: `${C.m}65`, fontSize: "7.5px", fontFamily: "monospace", marginBottom: 2 }}>{c.id}</div>
                <div className="text-white font-bold" style={{ fontSize: "10.5px" }}>{c.cat}</div>
                <div className="flex items-center gap-1 mt-1"><MapPin size={8} color={C.m} /><span style={{ color: C.m, fontSize: "8px" }}>{c.loc}</span></div>
              </div>
              <StatusChip status={c.sla} />
            </div>
            <div className="flex gap-3 mt-1">
              <button style={{ color: C.p, fontSize: "8.5px", fontWeight: 600 }}>Accept</button>
              <button style={{ color: C.p, fontSize: "8.5px", fontWeight: 600 }}>Update</button>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ─── SCREEN G3 — OFFICER COMPLAINT DETAIL ──────── */
function SG3_Detail({ go }: { go: (s: string) => void }) {
  const [actionStatus, setActionStatus] = useState("In Progress");
  const statuses = ["Assigned", "In Progress", "Resolved", "Escalate"];
  return (
    <Screen nav={<GovBottomNav active="complaints" go={go} />}>
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
        <button onClick={() => go("officer-queue")} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: C.s2, border: `1px solid rgba(81,162,212,0.3)` }}>
          <ArrowLeft size={13} color={C.m} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold" style={{ fontSize: "12px" }}>SEVA-2024-08421</div>
          <div style={{ color: C.m, fontSize: "8.5px" }}>Street Lighting · Municipal Electrical</div>
        </div>
      </div>
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2"><SegBar filled={2} /><span style={{ color: C.p, fontSize: "9px", whiteSpace: "nowrap" }}>Step 2/4</span></div>
      </div>
      <div className="px-4 mb-2.5">
        <div className="p-2.5" style={gc}>
          {[
            { l: "Category", v: "Street Lighting" },
            { l: "Location", v: "BITS Pilani Main Gate" },
            { l: "Department", v: "Municipal Electrical" },
            { l: "Priority", v: "MEDIUM", a: true },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: i < 3 ? `1px solid rgba(255,255,255,0.05)` : "none" }}>
              <span style={{ color: C.m, fontSize: "9px" }}>{r.l}</span>
              <span style={{ color: (r as any).a ? C.p : C.t, fontSize: "9.5px", fontWeight: 600 }}>{r.v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid rgba(255,255,255,0.05)` }}>
            <div className="flex items-center gap-1.5">
              <CheckCircle size={11} color={C.g} />
              <span style={{ color: C.g, fontSize: "9px", fontWeight: 600 }}>4 citizens confirmed</span>
            </div>
            <button style={{ color: C.p, fontSize: "9px", fontWeight: 600 }}>View Photo</button>
          </div>
        </div>
      </div>
      <div className="px-4 mb-2.5">
        <div className="p-2.5" style={gcv}>
          <div style={{ color: C.m, fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Update Status</div>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {statuses.map(s => (
              <button key={s} onClick={() => setActionStatus(s)} className="px-2.5 py-1 rounded-lg font-semibold transition-all" style={{ fontSize: "9px", background: actionStatus === s ? (s === "Escalate" ? `rgba(239,68,68,0.2)` : `rgba(81,162,212,0.2)`) : C.s2, color: actionStatus === s ? (s === "Escalate" ? C.r : C.p) : C.m, border: actionStatus === s ? `1px solid ${s === "Escalate" ? C.r : C.p}` : `1px solid rgba(255,255,255,0.08)`, boxShadow: actionStatus === s ? `0 0 10px ${s === "Escalate" ? "rgba(239,68,68,0.3)" : "rgba(81,162,212,0.28)"}` : "none" }}>
                {s}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Add note for citizen..." className="w-full px-3 py-2 rounded-lg text-white outline-none mb-2.5" style={{ background: C.bg, border: `1px solid rgba(81,162,212,0.28)`, fontSize: "9.5px" }} />
          {/* Photo upload — only when Resolved selected */}
          {actionStatus === "Resolved" && (
            <button className="w-full py-2 rounded-xl font-semibold mb-2.5 flex items-center justify-center gap-2 transition-all" style={{ color: C.p, background: "transparent", border: `1px solid rgba(81,162,212,0.45)`, fontSize: "10px", boxShadow: `0 0 12px rgba(81,162,212,0.15)` }}>
              <Upload size={12} color={C.p} />
              Upload Resolution Photo
            </button>
          )}
          <button className="w-full py-2.5 text-white font-bold rounded-xl" style={gradBtn}>
            <div style={{ fontSize: "11px", fontWeight: 700 }}>Send Update</div>
          </button>
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: C.s1, border: `1px solid rgba(239,68,68,0.3)`, boxShadow: `0 0 10px rgba(239,68,68,0.09)` }}>
          <div className="flex items-center gap-2">
            <Clock size={11} color={C.r} />
            <span style={{ color: C.m, fontSize: "9px" }}>SLA: 2 days 4 hours remaining</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full overflow-hidden" style={{ width: "48px", height: "3px", background: C.s2 }}>
              <div className="h-full rounded-full" style={{ width: "65%", background: C.r, boxShadow: `0 0 5px ${C.r}` }} />
            </div>
            <span style={{ color: C.r, fontSize: "8px", fontWeight: 600 }}>65%</span>
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ─── PHONE FRAME ────────────────────────────────── */
function PhoneFrame({ children, label, num, active, onClick }: {
  children: React.ReactNode; label: string; num: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <div className="flex flex-col items-center cursor-pointer select-none" onClick={onClick}>
      <div className="text-center mb-2.5">
        <div style={{ fontSize: "11px", fontWeight: 700, color: active ? C.p : "#888" }}>{num}. {label}</div>
      </div>
      <div className="rounded-[34px] p-[2.5px] transition-all duration-300" style={{
        background: active ? `linear-gradient(145deg,${C.p},${C.v})` : `linear-gradient(145deg,#c8d4e8,#9aaac4)`,
        boxShadow: active
          ? `0 0 40px rgba(81,162,212,0.32), 0 0 70px rgba(126,63,255,0.16), 0 20px 40px rgba(0,0,0,0.14)`
          : `0 10px 24px rgba(0,0,0,0.14), 0 4px 8px rgba(0,0,0,0.08)`,
      }}>
        <div className="rounded-[32px] overflow-hidden" style={{ width: 268, height: 568, background: C.bg }}>
          <div className="flex items-center justify-between px-5" style={{ height: 22, background: C.bg }}>
            <span style={{ color: C.m, fontSize: "8px", fontWeight: 600 }}>9:41</span>
            <div className="rounded-b-lg" style={{ width: 52, height: 14, background: C.s1 }} />
            <div className="flex items-center gap-1">
              <div className="flex gap-px items-end" style={{ height: 10 }}>
                {[4, 6, 8, 10].map(h => <div key={h} className="w-0.5 rounded-sm" style={{ height: h, background: C.m }} />)}
              </div>
              <div className="rounded-sm flex items-center justify-center" style={{ width: 14, height: 8, border: `1px solid ${C.m}50` }}>
                <div className="rounded-sm bg-white" style={{ width: 9, height: 5 }} />
              </div>
            </div>
          </div>
          <div style={{ height: 546 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT APP ───────────────────────────────────── */
type ScreenId = "splash" | "home" | "file" | "confirmed" | "thread" | "map" | "profile" | "civic" | "officer-dashboard" | "officer-queue" | "officer-detail" | "gov-profile";

const CITIZEN: { id: ScreenId; label: string }[] = [
  { id: "splash", label: "Login" },
  { id: "home", label: "Home" },
  { id: "file", label: "File" },
  { id: "confirmed", label: "Confirmed" },
  { id: "thread", label: "Thread" },
  { id: "map", label: "Map" },
  { id: "profile", label: "Profile" },
];
const GOV: { id: ScreenId; label: string }[] = [
  { id: "officer-dashboard", label: "Home" },
  { id: "officer-queue", label: "Complaints" },
  { id: "officer-detail", label: "Detail" },
  { id: "civic", label: "Intelligence" },
];

export default function App() {
  const [active, setActive] = useState<ScreenId>("splash");
  const [tab, setTab] = useState<"citizen" | "gov">("citizen");
  const [screenData, setScreenData] = useState<any>(null);

  const go = (s: string, data: any = null) => {
    const id = s as ScreenId;

    setActive(id);
    setScreenData(data);

    const isGov = [
      "officer-dashboard",
      "officer-queue",
      "officer-detail",
      "civic",
      "gov-profile"
    ].includes(s);

    setTab(isGov ? "gov" : "citizen");
  };

  function renderScreen(id: ScreenId) {
    switch (id) {
      case "splash": return <S1_Login go={go} />;
      case "home": return <S2_Home go={go} />;
      case "file": return <S3_File go={go} />;
      case "confirmed": return <S4_Confirmed go={go} data={screenData} citizenId="citizen-001" />;
      case "thread": return <S5_Thread go={go} />;
      case "map": return <S6_Map go={go} />;
      case "profile": return <S8_Profile go={go} />;
      case "civic": return <S7_Civic go={go} ward="Ward 4" />; 
      case "officer-dashboard": return <SG1_OfficerHome go={go} />;
      case "officer-queue": return <SG2_Queue go={go} />;
      case "officer-detail": return <SG3_Detail go={go} />;
      case "gov-profile": return <SG1_OfficerHome go={go} />;
    }
  }

  const allScreens = tab === "citizen" ? CITIZEN : GOV;

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-8 px-4" style={{ background: "#FFFFFF", fontFamily: "'Poppins','Inter',sans-serif" }}>
      <div className="text-center mb-5 flex-shrink-0">
        <div style={{ fontSize: "26px", fontWeight: 900, lineHeight: 1, color: "#111" }}>
          Seva<span style={{ color: C.p }}>AI</span>
          <span style={{ color: "#aaa", fontWeight: 400, fontSize: "13px", marginLeft: 8 }}>Prototype</span>
        </div>
        <div style={{ color: "#bbb", fontSize: "9px", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.12em" }}>
          AI-Powered Civic Complaint Platform
        </div>
      </div>

      <div className="flex gap-2 mb-3 flex-shrink-0">
        {(["citizen", "gov"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setActive(t === "citizen" ? "splash" : "officer-dashboard"); }} className="px-4 py-1.5 rounded-lg font-semibold transition-all" style={{ fontSize: "10px", background: tab === t ? C.p : "#f3f4f6", color: tab === t ? "white" : "#555", border: tab === t ? `1px solid ${C.p}` : `1px solid #e5e7eb`, boxShadow: tab === t ? `0 0 16px rgba(81,162,212,0.35)` : "none" }}>
            {t === "citizen" ? "Citizen Screens" : "Government Screens"}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 mb-7 flex-wrap justify-center max-w-2xl flex-shrink-0">
        {allScreens.map((s, i) => (
          <button key={s.id} onClick={() => setActive(s.id)} className="px-3 py-1.5 rounded-lg transition-all" style={{ fontSize: "9.5px", background: active === s.id ? C.p : "#f3f4f6", color: active === s.id ? "white" : "#555", border: active === s.id ? `1px solid ${C.p}` : `1px solid #e5e7eb`, fontWeight: 600, boxShadow: active === s.id ? `0 0 12px rgba(81,162,212,0.35)` : "none" }}>
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      {/* Desktop: all phones in a wrapping flex row */}
      <div className="hidden 2xl:flex gap-6 items-start flex-wrap justify-center max-w-[1400px] flex-shrink-0">
        {allScreens.map((s, i) => (
          <PhoneFrame key={s.id} label={s.label} num={`${i + 1}`} active={active === s.id} onClick={() => setActive(s.id)}>
            {renderScreen(s.id)}
          </PhoneFrame>
        ))}
      </div>

      {/* Single phone for smaller screens */}
      <div className="2xl:hidden flex-shrink-0">
        <PhoneFrame label={allScreens.find(s => s.id === active)?.label || ""} num={`${allScreens.findIndex(s => s.id === active) + 1}`} active>
          {renderScreen(active)}
        </PhoneFrame>
      </div>

      <div className="mt-5 flex-shrink-0" style={{ color: "#ccc", fontSize: "8.5px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Click screen tabs to navigate · Buttons navigate between screens
      </div>
    </div>
  );
}
