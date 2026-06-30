// src/components/BottomNav.jsx
import { useNavigate, useLocation } from "react-router-dom"

export default function BottomNav({ onPlusClick }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const path      = location.pathname

  const active = (p) => path === p ? "text-primary" : "text-gray-600"

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-white/5 flex items-end justify-around px-4 pt-2 pb-4 z-50"
      style={{ maxWidth: "430px", margin: "0 auto" }}>

      {/* Home */}
      <button onClick={() => navigate("/home")} className={`flex flex-col items-center gap-0.5 ${active("/home")}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        <span className="text-xs font-medium">Home</span>
      </button>

      {/* Track */}
      <button onClick={() => navigate("/track")} className={`flex flex-col items-center gap-0.5 ${active("/track")}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>
        <span className="text-xs font-medium">Track</span>
      </button>

      {/* Center Plus — file new complaint */}
      <button
        onClick={onPlusClick || (() => navigate("/file"))}
        className="relative -top-4 w-14 h-14 rounded-full flex items-center justify-center shadow-glow-v"
        style={{ background: "linear-gradient(135deg, #51A2D4, #7E3FFF)", boxShadow: "0 4px 20px rgba(126,63,255,0.45)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
      </button>

      {/* Community */}
      <button onClick={() => navigate("/community")} className={`flex flex-col items-center gap-0.5 ${active("/community")}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="16" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 19c0-3 3-5 7-5s7 2 7 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 13c2.5.5 4 2 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <span className="text-xs font-medium">Community</span>
      </button>

      {/* Profile */}
      <button onClick={() => navigate("/profile")} className={`flex flex-col items-center gap-0.5 ${active("/profile")}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        <span className="text-xs font-medium">Profile</span>
      </button>

    </div>
  )
}
