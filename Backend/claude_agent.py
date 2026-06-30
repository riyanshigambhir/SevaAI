"""
SevaAI — AI Agent (OpenAI)
Switched from Claude and Gemini to OpenAI due to persistent free-tier quota=0
issues.

  1. classify_complaint()    — classify + generate reasoning trace
  2. chat_reply()             — answer follow-up questions in thread
  3. generate_intelligence()  — root cause inference for govt dashboard
"""

import json, os, re
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

OPENAI_MODEL_NAME = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")
print(f"[claude_agent] Using OpenAI model: {OPENAI_MODEL_NAME}")

SLA_MAP  = { "low": 10, "medium": 5, "high": 2, "critical": 1 }
DEPT_MAP = {
    "Street Lighting":  "Municipal Electrical Dept",
    "Road - Pothole":   "Public Works Dept",
    "Road - Damage":    "Public Works Dept",
    "Water Supply":     "Jal Board",
    "Water Leak":       "Jal Board",
    "Drainage":         "Municipal Drainage Dept",
    "Sewage":           "Municipal Drainage Dept",
    "Garbage":          "Sanitation Dept",
    "Park":             "Parks & Recreation Dept",
    "Electricity":      "Municipal Electrical Dept",
    "Other":            "Municipal Corporation",
}


def _extract_json(raw: str) -> dict:
    raw = raw.strip()
    raw = re.sub(r"^```[a-z]*\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)
    raw = raw.strip()
    start = raw.find("{")
    end   = raw.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError(f"No JSON object found in model output: {raw[:300]}")
    return json.loads(raw[start:end+1])


def _apply_hybrid_rules(data: dict, raw_text: str, historical_count: int) -> dict:
    text = raw_text.lower()

    electrical_danger_words = [
        "live wire", "electrocut", "electric shock", "fallen wire",
        "sparking wire", "exposed wire", "downed wire", "snapped wire",
        "broken wire", "loose wire", "wire fell", "wire has fallen",
        "short circuit"
    ]
    has_electrical_danger = (
        any(w in text for w in electrical_danger_words)
        or ("wire" in text and any(w in text for w in [
                "fall", "fallen", "live", "spark", "shock", "electrocut", "expose"
            ]))
    )
    if has_electrical_danger:
        data["category"] = "Electricity"
        data["priority"] = "critical"
        data["safety_risk"] = True
        data["priority_elevated"] = True
        data["elevation_reason"] = "Live/exposed electrical wire poses immediate electrocution risk."

    sensitive_words = ["school", "hospital", "children", "elderly", "anganwadi", "clinic"]
    if any(w in text for w in sensitive_words):
        order = ["low", "medium", "high", "critical"]
        current_idx = order.index(data["priority"]) if data["priority"] in order else 1
        if current_idx < len(order) - 1:
            data["priority"] = order[current_idx + 1]
        data["priority_elevated"] = True
        data["elevation_reason"] = (
            data.get("elevation_reason", "")
            or "Priority elevated because a vulnerable population / sensitive site is nearby."
        )

    if any(w in text for w in [
        "sewage", "overflow", "overflowing", "foul smell", "dirty water", "open drain"
    ]):
        data["category"] = "Sewage"
        if data["priority"] not in ("critical",):
            data["priority"] = "high"
        data["public_health_risk"] = True

    if any(w in text for w in [
        "burst pipeline", "water leak", "burst water main", "pipe burst", "pipeline burst", "leaking pipe"
    ]):
        data["category"] = "Water Leak"
        if data["priority"] not in ("critical",):
            data["priority"] = "high"

    if any(w in text for w in [
        "pothole", "road damaged", "road collapse", "road caved", "sinkhole"
    ]):
        data["category"] = "Road - Pothole"

    if any(w in text for w in [
        "drain blocked", "drainage blocked", "waterlogging", "blocked drain", "clogged drain"
    ]):
        data["category"] = "Drainage"
        if data["priority"] == "low":
            data["priority"] = "medium"

    if any(w in text for w in [
        "streetlight", "street light", "street lamp", "lamp post not working", "dark street"
    ]):
        data["category"] = "Street Lighting"

    if any(w in text for w in ["garbage", "trash", "waste pile", "rubbish", "litter"]):
        data["category"] = "Garbage"

    if historical_count > 10 and data["priority"] == "medium":
        data["priority"] = "high"
        data["priority_elevated"] = True
        data["elevation_reason"] = (
            data.get("elevation_reason", "")
            or f"Priority elevated because {historical_count} similar complaints exist in this ward."
        )

    data["department"] = DEPT_MAP.get(data["category"], "Municipal Corporation")
    data["sla_days"]   = SLA_MAP.get(data["priority"], 5)
    return data


def _find_matched_keywords(raw_text: str) -> list:
    text = raw_text.lower()
    all_keywords = [
        "live wire", "electrocut", "electric shock", "fallen wire", "exposed wire",
        "sewage", "overflow", "foul smell", "burst pipeline", "water leak",
        "pothole", "road damaged", "drain blocked", "waterlogging",
        "streetlight", "garbage", "school", "hospital", "children", "elderly",
    ]
    return [kw for kw in all_keywords if kw in text][:6]


# ─────────────────────────────────────────────────────
# 1. CLASSIFY + REASON
# ─────────────────────────────────────────────────────
def classify_complaint(raw_text: str, language: str = "en",
                       historical_count: int = 0) -> dict:
    prompt = f"""You are SevaAI, an AI civic assistant for Indian cities.

A citizen has submitted the following complaint:
"{raw_text}"

Historical context: There are {historical_count} similar complaints already recorded in this ward.

Return ONLY a valid JSON object with exactly these fields — no markdown, no explanation:
{{
  "category": one of [Street Lighting, Road - Pothole, Road - Damage, Water Supply, Water Leak, Drainage, Sewage, Garbage, Park, Electricity, Other],
  "priority": one of [low, medium, high, critical],
  "original_priority": one of [low, medium, high, critical],
  "priority_elevated": true or false,
  "location_text": "location mentioned in the complaint, or Not specified",
  "summary": "clean 1-sentence English summary",
  "detected_keywords": ["list", "of", "key", "phrases", "from", "the", "complaint"],
  "public_health_risk": true or false,
  "safety_risk": true or false,
  "elevation_reason": "why priority was elevated, or empty string if not elevated",
  "recommendation": "1-sentence recommended action for the department"
}}

Priority rules:
- critical: immediate danger (electrical hazard live wire, sewage flooding hospital/school)
- high: health/safety risk (sewage leak, burst water main, broken major road)
- medium: significant inconvenience (streetlight out, pothole, drainage blockage)
- low: minor cosmetic issue (faded paint, park bench broken)

Elevation rule: if historical_count > 10 AND priority would be medium, elevate to high.
If the complaint mentions school, hospital, children, or elderly near a hazard, elevate one level.
Set priority_elevated=true and fill elevation_reason only if you actually elevated.

Return ONLY the JSON object."""

    data = {
        "category": "Other",
        "priority": "medium",
        "original_priority": "medium",
        "priority_elevated": False,
        "location_text": "Not specified",
        "summary": raw_text,
        "detected_keywords": [],
        "public_health_risk": False,
        "safety_risk": False,
        "elevation_reason": "",
        "recommendation": "",
    }

    llm_ok = False
    try:
        resp = client.chat.completions.create(
            model=OPENAI_MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        llm_data = _extract_json(resp.choices[0].message.content)
        data.update(llm_data)
        llm_ok = True
        print("OpenAI classification succeeded:", data)
    except Exception as e:
        import traceback
        print("=" * 60)
        print("OPENAI CLASSIFY ERROR (falling back to keyword rules only):", repr(e))
        traceback.print_exc()
        print("=" * 60)
        if not data.get("recommendation"):
            data["recommendation"] = f"AI classification unavailable ({type(e).__name__}). Classified using keyword rules."

    data = _apply_hybrid_rules(data, raw_text, historical_count)

    if not llm_ok and not data.get("detected_keywords"):
        data["detected_keywords"] = _find_matched_keywords(raw_text)

    print("Final classification:", data)
    return data


# ─────────────────────────────────────────────────────
# 2. CHAT REPLY
# ─────────────────────────────────────────────────────
def chat_reply(complaint: dict, messages_history: list,
               user_message: str) -> str:
    system = f"""You are SevaAI, a helpful civic assistant managing a complaint thread.

Complaint context:
- Ticket: {complaint.get('ticket_id')}
- Category: {complaint.get('category')}
- Location: {complaint.get('address')}
- Department: {complaint.get('department')}
- Priority: {str(complaint.get('priority', '')).upper()}
- Status: {str(complaint.get('status', '')).replace('_', ' ').upper()}
- SLA Deadline: {complaint.get('sla_deadline', 'Not set')}

Rules:
- Be helpful, concise, empathetic
- Reply in the same language as the citizen (Hindi if they write Hindi)
- Never invent resolution timelines
- If status is escalated, reassure that it has reached senior authority
- Keep replies under 3 sentences unless detail is genuinely needed"""

    chat_messages = [{"role": "system", "content": system}]
    for m in messages_history[-8:]:
        role = "assistant" if m["sender_type"] in ["agent", "officer"] else "user"
        chat_messages.append({"role": role, "content": m["content"]})
    chat_messages.append({"role": "user", "content": user_message})

    try:
        resp = client.chat.completions.create(
            model=OPENAI_MODEL_NAME,
            messages=chat_messages,
            temperature=0.4,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print("OpenAI error (chat_reply):", e)
        return "I'm having trouble right now. Please try again shortly."


# ─────────────────────────────────────────────────────
# 3. GOVERNANCE INTELLIGENCE
# ─────────────────────────────────────────────────────
def generate_intelligence(ward: str, complaint_summary: list,
                           category_counts: dict) -> dict:
    summary_text = "\n".join(
        f"- {item['category']}: {item['count']} complaints"
        + (f" (locations: {', '.join(item['locations'][:3])})" if item.get('locations') else "")
        for item in complaint_summary
    )

    prompt = f"""You are a civic infrastructure intelligence system for {ward}, India.

Here is the complaint data for the past 30 days:
{summary_text}

Analyse this data and return ONLY a valid JSON object with these fields:
{{
  "root_cause": "1-2 sentence inference of the underlying cause linking these complaint patterns",
  "recommendation": "1-2 sentence concrete action recommendation for city officials",
  "confidence": a float between 0.0 and 1.0 representing your confidence,
  "priority": one of [low, medium, high, critical],
  "pattern_tags": ["list", "of", "2-4", "short", "pattern", "labels"],
  "preventive_actions": ["list of 2-3 specific preventive actions the municipal body should take"],
  "affected_infrastructure": "what infrastructure is likely failing"
}}

Use domain knowledge about Indian municipal infrastructure:
- Co-occurrence of drainage + potholes + water leaks often indicates underground pipe failure or road subbase erosion
- Multiple electrical failures in one area suggest feeder line or substation issue
- Clustering of sewage + water supply in one ward indicates old pipe network
- Seasonal context: if complaints spike, consider monsoon preparedness

Return ONLY the JSON. No markdown. No explanation."""

    try:
        resp = client.chat.completions.create(
            model=OPENAI_MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        return _extract_json(resp.choices[0].message.content)
    except Exception as e:
        import traceback
        print("OPENAI INTELLIGENCE ERROR:", repr(e))
        traceback.print_exc()
        return {
            "root_cause": "Analysis unavailable due to an AI service error.",
            "recommendation": "Please review complaints manually.",
            "confidence": 0.0,
            "priority": "medium",
            "pattern_tags": [],
            "preventive_actions": [],
            "affected_infrastructure": "Unknown"
        }