"""
POST /complaints       — file complaint, return classification + reasoning trace
GET  /complaints       — list by citizen_id / department / status
GET  /complaints/{id}  — single complaint
PUT  /complaints/{id}  — officer status update → writes to messages
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import random, string

from claude_agent import classify_complaint
import db 

router = APIRouter(prefix="/complaints", tags=["complaints"])


class ComplaintCreate(BaseModel):
    raw_input: str
    citizen_id: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    language: str = "en"
    ward: Optional[str] = "Ward 7"


class StatusUpdate(BaseModel):
    status: str
    officer_id: str
    note: Optional[str] = None


def gen_ticket() -> str:
    year = datetime.now().year
    num  = random.randint(10000, 99999)
    return f"SEVA-{year}-{num:05d}"


# POST /complaints

@router.post("/")
async def file_complaint(data: ComplaintCreate):
    """
    1. Count historical similar complaints in ward (for reasoning)
    2. Call Claude classify_complaint() → get fields + reasoning trace
    3. Save complaint to Supabase
    4. Create first chat message with full details
    5. Return everything including reasoning trace for frontend
    """

    # Step 1: historical count for this ward
    try:
        hist = db.supabase.table("complaints") \
            .select("id", count="exact") \
            .eq("ward", data.ward or "Ward 7") \
            .execute()
        historical_count = hist.count or 0
    except Exception:
        historical_count = 0

    # Step 2: Claude classification + reasoning
    try:
        classified = classify_complaint(
            data.raw_input,
            data.language,
            historical_count
        )
    except Exception as e:
        raise HTTPException(status_code=500,
                            detail=f"AI classification failed: {str(e)}")

    # Step 3: build and save complaint
    sla_days     = classified.get("sla_days", 5)
    sla_deadline = (datetime.utcnow() + timedelta(days=sla_days)).isoformat()
    ticket_id    = gen_ticket()

    record = {
        "ticket_id":   ticket_id,
        "citizen_id":  data.citizen_id,
        "raw_input":   data.raw_input,
        "language":    data.language,
        "category":    classified["category"],
        "department":  classified["department"],
        "priority":    classified["priority"],
        "sla_days":    sla_days,
        "sla_deadline": sla_deadline,
        "latitude":    data.latitude,
        "longitude":   data.longitude,
        "address":     data.address or classified.get("location_text", "Location not specified"),
        "ward":        data.ward or "Ward 7",
        "status":      "filed",
    }

    result = db.supabase.table("complaints").insert(record).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save complaint")

    complaint_id = result.data[0]["id"]

    # Step 4: first message in thread
    first_msg = (
        f"Your complaint has been filed.\n"
        f"Ticket: {ticket_id}\n"
        f"Category: {classified['category']}\n"
        f"Location: {record['address']}\n"
        f"Department: {classified['department']}\n"
        f"Priority: {classified['priority'].upper()} | SLA: {sla_days} days\n\n"
        f"You can ask me anything about this complaint."
    )
    db.supabase.table("messages").insert({
        "complaint_id": complaint_id,
        "sender_type":  "agent",
        "content":      first_msg
    }).execute()

    # Build reasoning trace for frontend display
    reasoning_trace = {
        "detected_keywords":    classified.get("detected_keywords", []),
        "historical_count":     historical_count,
        "public_health_risk":   classified.get("public_health_risk", False),
        "safety_risk":          classified.get("safety_risk", False),
        "priority_elevated":    classified.get("priority_elevated", False),
        "original_priority":    classified.get("original_priority", classified["priority"]),
        "elevation_reason":     classified.get("elevation_reason", ""),
        "recommendation":       classified.get("recommendation", ""),
    }

    return {
        "ticket_id":      ticket_id,
        "complaint_id":   complaint_id,
        "category":       classified["category"],
        "department":     classified["department"],
        "priority":       classified["priority"],
        "sla_days":       sla_days,
        "sla_deadline":   sla_deadline,
        "address":        record["address"],
        "ward":           record["ward"],
        "first_message":  first_msg,
        "reasoning_trace": reasoning_trace,
    }



# GET /complaints

@router.get("/")
async def list_complaints(
    citizen_id:  Optional[str] = None,
    department:  Optional[str] = None,
    status:      Optional[str] = None,
    ward:        Optional[str] = None,
    limit: int = 50
):
    q = db.supabase.table("complaints").select("*") \
        .order("created_at", desc=True).limit(limit)
    if citizen_id: q = q.eq("citizen_id", citizen_id)
    if department: q = q.eq("department", department)
    if status:     q = q.eq("status", status)
    if ward:       q = q.eq("ward", ward)
    return q.execute().data



# GET /complaints/{id}

@router.get("/{complaint_id}")
async def get_complaint(complaint_id: str):
    if complaint_id.startswith("SEVA-"):
        r = db.supabase.table("complaints").select("*") \
            .eq("ticket_id", complaint_id).execute()
    else:
        r = db.supabase.table("complaints").select("*") \
            .eq("id", complaint_id).execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return r.data[0]



# PUT /complaints/{id}  — officer updates status

@router.put("/{complaint_id}")
async def update_complaint(complaint_id: str, update: StatusUpdate):
    upd = {"status": update.status, "officer_id": update.officer_id}
    if update.status == "resolved":
        upd["resolved_at"] = datetime.utcnow().isoformat()

    r = db.supabase.table("complaints").update(upd).eq("id", complaint_id).execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Write officer message into citizen's thread (Realtime picks it up)
    defaults = {
        "assigned":    "Your complaint has been assigned to an officer and will be attended to.",
        "in_progress": "Work has started on your complaint. Our team is on site.",
        "resolved":    "Your complaint has been marked resolved. Was the issue fixed? Please confirm.",
        "escalated":   "Your complaint has been escalated to the Department Head for urgent attention.",
    }
    note = update.note or defaults.get(update.status, f"Status updated to {update.status}.")

    db.supabase.table("messages").insert({
        "complaint_id": complaint_id,
        "sender_type":  "officer",
        "content":      note
    }).execute()

    return {"success": True, "status": update.status}
