"""
GET  /messages/{complaint_id}  — fetch thread history
POST /messages/{complaint_id}  — citizen sends follow-up → Claude replies
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from claude_agent import chat_reply
import db 

router = APIRouter(prefix="/messages", tags=["messages"])


class MessageCreate(BaseModel):
    content: str
    citizen_id: str


@router.get("/{complaint_id}")
async def get_messages(complaint_id: str):
    r = db.supabase.table("messages") \
        .select("*") \
        .eq("complaint_id", complaint_id) \
        .order("created_at", desc=False) \
        .execute()
    return r.data


@router.post("/{complaint_id}")
async def send_message(complaint_id: str, msg: MessageCreate):
    # Get complaint for context
    cr = db.supabase.table("complaints").select("*").eq("id", complaint_id).execute()
    if not cr.data:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint = cr.data[0]

    # Save citizen message
    db.supabase.table("messages").insert({
        "complaint_id": complaint_id,
        "sender_type":  "citizen",
        "content":      msg.content
    }).execute()

    # Get history for context
    history = db.supabase.table("messages") \
        .select("*") \
        .eq("complaint_id", complaint_id) \
        .order("created_at", desc=False) \
        .limit(10) \
        .execute().data

    # Claude reply
    try:
        reply = chat_reply(complaint, history, msg.content)
    except Exception:
        reply = "I'm having trouble right now. Please try again shortly."

    # Save Claude reply
    db.supabase.table("messages").insert({
        "complaint_id": complaint_id,
        "sender_type":  "agent",
        "content":      reply
    }).execute()

    return {"reply": reply}
