// All backend calls in one place.
// Vite exposes env vars prefixed with VITE_ at build time.

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

// ── Types ──────────────────────────────────────────────────

export interface ReasoningTrace {
  detected_keywords: string[]
  historical_count: number
  public_health_risk: boolean
  safety_risk: boolean
  priority_elevated: boolean
  original_priority: string
  elevation_reason: string
  recommendation: string
}

export interface FiledComplaint {
  ticket_id: string
  complaint_id: string
  category: string
  department: string
  priority: string
  sla_days: number
  sla_deadline: string
  address: string
  ward: string
  first_message: string
  reasoning_trace: ReasoningTrace
}

export interface WardIntelligence {
  ward: string
  total: number
  resolved: number
  avg_days: number
  civic_score: number
  category_counts: Record<string, number>
  complaint_summary: { category: string; count: number; locations: string[] }[]
  intelligence: {
    root_cause: string
    recommendation: string
    confidence: number
    priority: string
    pattern_tags: string[]
    preventive_actions: string[]
    affected_infrastructure: string
  } | null
  heatmap_cells: number[][]
  raw_complaints: { lat: number; lng: number; category: string; priority: string }[]
}

export interface Message {
  id: string
  complaint_id: string
  sender_type: "citizen" | "agent" | "officer"
  content: string
  created_at: string
}

// ── API calls ──────────────────────────────────────────────

export async function fileComplaint(payload: {
  raw_input: string
  citizen_id: string
  language: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  ward?: string
}): Promise<FiledComplaint> {
  const res = await fetch(`${BASE}/complaints/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? "Failed to file complaint")
  }
  return res.json()
}

export async function getComplaints(params: {
  citizen_id?: string
  department?: string
  ward?: string
  status?: string
}): Promise<any[]> {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v && q.set(k, v))
  const res = await fetch(`${BASE}/complaints/?${q}`)
  return res.json()
}

export async function getComplaint(id: string): Promise<any> {
  const res = await fetch(`${BASE}/complaints/${id}`)
  if (!res.ok) throw new Error("Complaint not found")
  return res.json()
}

export async function updateComplaint(
  complaintId: string,
  update: { status: string; officer_id: string; note?: string }
): Promise<{ success: boolean; status: string }> {
  const res = await fetch(`${BASE}/complaints/${complaintId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  })
  return res.json()
}

export async function getMessages(complaintId: string): Promise<Message[]> {
  const res = await fetch(`${BASE}/messages/${complaintId}`)
  return res.json()
}

export async function sendMessage(
  complaintId: string,
  content: string,
  citizenId: string
): Promise<{ reply: string }> {
  const res = await fetch(`${BASE}/messages/${complaintId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, citizen_id: citizenId }),
  })
  return res.json()
}

export async function getWardIntelligence(ward: string): Promise<WardIntelligence> {
  const res = await fetch(`${BASE}/intelligence/ward/${encodeURIComponent(ward)}`)
  if (!res.ok) throw new Error("Intelligence fetch failed")
  return res.json()
}
