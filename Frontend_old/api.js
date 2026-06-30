// src/lib/api.js
// All calls to the FastAPI backend go through here.
// Think of this as a "remote control" for the backend.

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

// ── File a new complaint ──
export async function fileComplaint(data) {
  const res = await fetch(`${BASE}/complaints/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error("Failed to file complaint")
  return res.json()
}

// ── Get all complaints for a citizen ──
export async function getCitizenComplaints(citizenId) {
  const res = await fetch(`${BASE}/complaints/?citizen_id=${citizenId}`)
  return res.json()
}

// ── Get all complaints for an officer's department ──
export async function getOfficerComplaints(department) {
  const res = await fetch(`${BASE}/complaints/?department=${encodeURIComponent(department)}`)
  return res.json()
}

// ── Get one complaint by ID or ticket_id ──
export async function getComplaint(id) {
  const res = await fetch(`${BASE}/complaints/${id}`)
  if (!res.ok) throw new Error("Complaint not found")
  return res.json()
}

// ── Officer updates complaint status ──
export async function updateComplaint(complaintId, update) {
  const res = await fetch(`${BASE}/complaints/${complaintId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update)
  })
  return res.json()
}

// ── Get messages for a complaint thread ──
export async function getMessages(complaintId) {
  const res = await fetch(`${BASE}/messages/${complaintId}`)
  return res.json()
}

// ── Citizen sends a follow-up message ──
export async function sendMessage(complaintId, content, citizenId) {
  const res = await fetch(`${BASE}/messages/${complaintId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, citizen_id: citizenId })
  })
  return res.json()
}
