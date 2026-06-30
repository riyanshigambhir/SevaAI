// src/pages/IntelligenceDashboard.jsx
// Government civic intelligence view.
// Shows KPIs, predictive alert, and a choropleth heatmap of Ward 4.
// Data is mocked for the demo — in production comes from the nightly agent.

//import OfficerNav from "../components/OfficerNav"

// Mock heatmap data — each cell = a block in the ward grid
// value 0–4: complaint density (0=none, 4=critical)
const HEATMAP = [
  [1,2,3,4,3,2],
  [2,3,4,4,3,2],
  [1,2,3,4,2,1],
  [0,1,2,3,2,1],
  [0,0,1,2,1,0],
  [0,0,0,1,0,0],
]

const BLOCK_LABELS = ["C1","C2","C3","C4","C5","C6"]

// Colour for each density level
const DENSITY_COLORS = [
  "rgba(16,185,129,0.15)",   // 0 — none (green tint)
  "#10B981",                  // 1 — low
  "#F59E0B",                  // 2 — medium
  "#F97316",                  // 3 — high
  "#EF4444",                  // 4 — critical
]

export default function IntelligenceDashboard() {
  return (
    <div className="min-h-screen bg-navy text-white pb-24"
      style={{ backgroundImage: "linear-gradient(rgba(81,162,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(81,162,212,0.03) 1px, transparent 1px)", backgroundSize: "52px 52px" }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h2 className="text-xl font-bold">Ward 4 Intelligence</h2>
        <p className="text-gray-500 text-xs">Civic Intelligence · Nagrik Vigyan</p>
      </div>

      <div className="px-5 space-y-4">

        {/* KPI pills */}
        <div className="flex gap-2">
          {[
            { label:"Total",    value:"156" },
            { label:"Resolved", value:"98"  },
            { label:"Avg Days", value:"5.2" },
            { label:"Score",    value:"68"  },
          ].map(k => (
            <div key={k.label} className="flex-1 bg-elevated rounded-xl px-2 py-2.5 border-l-2 border-primary text-center">
              <p className="text-white font-bold text-base leading-none">{k.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Predictive Alert card */}
        <div className="bg-surface rounded-xl p-4 border border-violet/30"
          style={{ borderLeft: "3px solid #7E3FFF", boxShadow: "0 0 16px rgba(126,63,255,0.12)" }}>
          <p className="text-white font-bold text-sm mb-1">Infrastructure Risk — Ward 4</p>
          <p className="text-gray-400 text-xs leading-relaxed mb-3">
            45 potholes, 32 drainage issues, 18 water leaks in Blocks C4–C5 indicate likely underground pipe failure. Pre-monsoon audit recommended.
          </p>
          <div className="flex gap-4">
            <span className="text-primary text-xs font-bold">Confidence: 87%</span>
            <span className="text-danger text-xs font-bold">Priority: HIGH</span>
          </div>
        </div>

        {/* Choropleth Heatmap */}
        <div className="bg-surface rounded-xl p-4 border border-white/5">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">
            Complaint Density — Ward 4
          </p>

          {/* Column labels */}
          <div className="flex gap-1 mb-1 pl-6">
            {BLOCK_LABELS.map(l => (
              <div key={l} className="flex-1 text-center text-gray-600 text-xs font-mono">{l}</div>
            ))}
          </div>

          {/* Grid rows */}
          {HEATMAP.map((row, ri) => (
            <div key={ri} className="flex gap-1 mb-1 items-center">
              {/* Row label */}
              <div className="text-gray-600 text-xs font-mono w-5 text-right flex-shrink-0">R{ri+1}</div>
              {row.map((val, ci) => (
                <div
                  key={ci}
                  className="flex-1 rounded-md flex items-center justify-center"
                  style={{
                    height: 36,
                    background: DENSITY_COLORS[val],
                    boxShadow: val >= 3 ? `0 0 8px ${DENSITY_COLORS[val]}60` : "none",
                    border: `1px solid ${val > 0 ? DENSITY_COLORS[val] + "40" : "rgba(255,255,255,0.05)"}`
                  }}
                >
                  {val > 0 && (
                    <span className="text-white text-xs font-bold opacity-80">{val * 12}</span>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-gray-600 text-xs">Low</span>
            <div className="flex-1 h-2 rounded-full" style={{
              background: "linear-gradient(90deg, #10B981, #F59E0B, #F97316, #EF4444)"
            }} />
            <span className="text-gray-600 text-xs">High</span>
          </div>
        </div>

        {/* Generate Report button */}
        <button
          className="w-full py-4 rounded-xl font-bold text-white text-sm"
          style={{ background: "linear-gradient(135deg, #51A2D4, #7E3FFF)", boxShadow: "0 4px 20px rgba(81,162,212,0.25)" }}
        >
          Generate Report
        </button>

      </div>

    </div>
  )
}
