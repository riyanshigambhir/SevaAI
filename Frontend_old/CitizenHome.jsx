// src/pages/CitizenHome.jsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../lib/AuthContext"
import { getCitizenComplaints } from "../lib/api"
import BottomNav from "../components/BottomNav"

const STATUS_COLORS = {
  filed:       "text-primary border-primary/40",
  assigned:    "text-primary border-primary/40",
  in_progress: "text-yellow-400 border-yellow-400/40",
  resolved:    "text-success border-success/40",
  escalated:   "text-danger border-danger/40",
  closed:      "text-gray-500 border-gray-500/40",
}

export default function CitizenHome() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!user) { navigate("/"); return }
    getCitizenComplaints(user.id)
      .then(setComplaints)
      .finally(() => setLoading(false))
  }, [user])

  const active   = complaints.filter(c => !["resolved","closed"].includes(c.status))
  const resolved = complaints.filter(c =>  ["resolved","closed"].includes(c.status))

  return (
    <div className="min-h-screen bg-navy text-white pb-24"
      style={{ backgroundImage: "linear-gradient(rgba(81,162,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(81,162,212,0.03) 1px, transparent 1px)", backgroundSize: "52px 52px" }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">Seva<span className="text-primary">AI</span></h1>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-lg border border-primary/30 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#51A2D4" strokeWidth="1.5"/><path d="M12 6v6l4 2" stroke="#51A2D4" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <button className="relative w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#9CA3AF" strokeWidth="1.5"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#9CA3AF" strokeWidth="1.5"/></svg>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-danger rounded-full"/>
          </button>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-5 mb-5">
        <p className="text-xl font-bold">Namaste, {user?.name?.split(" ")[0]}</p>
        <p className="text-gray-500 text-sm">{user?.ward} — {user?.city}, Rajasthan</p>
      </div>

      {/* Stats pills */}
      <div className="flex gap-3 px-5 mb-6">
        {[
          { label: "Active",   value: active.length   || 2  },
          { label: "Resolved", value: resolved.length || 6  },
          { label: "Score",    value: `${user?.seva_score || 74}` },
        ].map(s => (
          <div key={s.label} className="flex-1 bg-elevated rounded-xl px-3 py-2.5 border-l-2 border-primary">
            <p className="text-white font-bold text-lg leading-none">{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Complaints */}
      <div className="px-5 mb-2">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Recent Complaints</p>
      </div>

      {loading ? (
        <div className="px-5 text-gray-600 text-sm">Loading...</div>
      ) : (
        <div className="px-5 space-y-3 mb-5">
          {/* Show real data or demo cards */}
          {(complaints.length > 0 ? complaints.slice(0,2) : DEMO_COMPLAINTS).map(c => (
            <button
              key={c.id || c.ticket_id}
              onClick={() => navigate(`/thread/${c.id || c.ticket_id}`)}
              className="w-full bg-surface rounded-xl p-4 border border-white/5 flex items-start justify-between text-left hover:border-primary/30 transition-colors"
              style={{ boxShadow: "0 0 12px rgba(81,162,212,0.05)" }}
            >
              <div>
                <p className="text-gray-500 text-xs font-mono mb-1">{c.ticket_id}</p>
                <p className="text-white font-semibold text-sm">{c.category}</p>
                <p className="text-gray-500 text-xs mt-0.5">{c.address || c.location}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${STATUS_COLORS[c.status] || STATUS_COLORS.filed}`}>
                  {c.status?.replace("_"," ").toUpperCase() || "FILED"}
                </span>
                {c.sla_days && (
                  <p className="text-gray-600 text-xs mt-1">{c.sla_days}d SLA</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Community card */}
      <div className="px-5">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Community Near You</p>
        <div className="bg-surface rounded-xl p-4 border-l-2 border-violet flex items-center justify-between"
          style={{ boxShadow: "0 0 12px rgba(126,63,255,0.08)" }}>
          <p className="text-white text-sm">3 complaints in your ward need validation</p>
          <button onClick={() => navigate("/community")} className="text-primary text-xs font-bold ml-4 flex-shrink-0">
            Validate
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

// Shown if no real data is loaded yet
const DEMO_COMPLAINTS = [
  { ticket_id: "SEVA-2024-08421", category: "Street Lighting", address: "BITS Pilani Main Gate", status: "assigned",  sla_days: 2 },
  { ticket_id: "SEVA-2024-08390", category: "Road - Pothole",  address: "Delhi Gate, Pilani",   status: "resolved",  sla_days: 5 },
]
