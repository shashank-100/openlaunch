from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import os
import json
import uuid
from datetime import datetime, UTC
import resend

app = FastAPI()

resend.api_key = os.getenv("RESEND_API_KEY", "")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_KEY", "")
)

DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"

class AccountCreate(BaseModel):
    companyName: str
    domain: str | None = None

class PitchCreate(BaseModel):
    pitch: str

class AccountUpdate(BaseModel):
    auto_outreach_enabled: bool | None = None
    monitoring_enabled: bool | None = None

class SignalCreate(BaseModel):
    accountId: str
    signalType: str = 'general'
    signalSummary: str
    painPoint: str | None = None
    productInsight: str | None = None
    opportunity: str | None = None
    relevanceScore: int | None = None
    outreachAngle: str | None = None
    emailSubject: str | None = None
    emailBody: str | None = None
    sourceUrl: str | None = None
    shouldContact: bool = False
    priority: str = 'medium'
    targetPersona: str | None = None
    prospectName: str | None = None
    prospectEmail: str | None = None
    prospectTitle: str | None = None
    prospectLinkedin: str | None = None
    action: str | None = None
    reason: str | None = None
    techStack: list | None = None

class OutreachSend(BaseModel):
    signalId: str
    to: str
    subject: str
    body: str

@app.get("/api/persona")
def get_persona():
    res = supabase.table("personas").select("*").eq("user_id", DEMO_USER_ID).limit(1).execute()
    return {"persona": res.data[0] if res.data else None}

@app.post("/api/persona")
def save_persona(body: dict):
    existing = supabase.table("personas").select("id").eq("user_id", DEMO_USER_ID).limit(1).execute()
    if existing.data:
        supabase.table("personas").update({**body, "updated_at": datetime.now(UTC).isoformat()}).eq("user_id", DEMO_USER_ID).execute()
    else:
        supabase.table("personas").insert({**body, "user_id": DEMO_USER_ID}).execute()
    return {"success": True}

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.now(UTC).isoformat()}

@app.post("/api/pitch")
def create_pitch(body: PitchCreate):
    import redis as redislib
    r = redislib.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
    job_id = str(uuid.uuid4())
    job = {
        "name": "discovery",
        "id": job_id,
        "data": {
            "pitch": body.pitch,
            "userId": DEMO_USER_ID
        },
        "opts": {
            "attempts": 2,
            "removeOnComplete": True
        }
    }
    r.lpush("bull:research-jobs:wait", json.dumps(job))
    return {"success": True, "jobId": job_id}

@app.get("/api/accounts")
def get_accounts():
    res = supabase.table("accounts").select("*").eq("user_id", DEMO_USER_ID).order("created_at", desc=True).execute()
    return {"accounts": res.data}

@app.post("/api/accounts")
def create_account(body: AccountCreate):
    res = supabase.table("accounts").insert({
        "user_id": DEMO_USER_ID,
        "company_name": body.companyName,
        "domain": body.domain
    }).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create account")
    return {"account": res.data[0]}

@app.patch("/api/accounts/{account_id}")
def update_account(account_id: str, body: AccountUpdate):
    update_data = {}
    if body.auto_outreach_enabled is not None:
        update_data["auto_outreach_enabled"] = body.auto_outreach_enabled
    if body.monitoring_enabled is not None:
        update_data["monitoring_enabled"] = body.monitoring_enabled
    
    if not update_data:
        return {"success": True}

    res = supabase.table("accounts").update(update_data).eq("id", account_id).eq("user_id", DEMO_USER_ID).execute()
    return {"account": res.data[0] if res.data else None}

@app.delete("/api/accounts/{account_id}")
def delete_account(account_id: str):
    supabase.table("accounts").delete().eq("id", account_id).eq("user_id", DEMO_USER_ID).execute()
    return {"success": True}

@app.post("/api/accounts/{account_id}/scan")
def scan_account(account_id: str):
    res = supabase.table("accounts").select("*").eq("id", account_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Account not found")
    account = res.data
    import redis as redislib
    r = redislib.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
    job_id = str(uuid.uuid4())
    job = {
        "name": "monitor",
        "id": job_id,
        "data": {
            "companyName": account["company_name"],
            "domain": account.get("domain") or "",
            "accountId": account["id"],
            "userPitch": account.get("user_pitch")
        },
        "opts": {
            "attempts": 2,
            "removeOnComplete": True
        }
    }
    r.lpush("bull:research-jobs:wait", json.dumps(job))
    return {"success": True, "queued": True, "jobId": job_id}

@app.get("/api/signals")
def get_signals(limit: int = 50):
    res = supabase.table("signals").select("*, accounts(*)").order("detected_at", desc=True).limit(limit).execute()
    return {"signals": res.data}

@app.get("/api/actions")
def get_actions():
    res = supabase.table("signals").select("*, accounts(*)").eq("should_contact", True).order("detected_at", desc=True).execute()
    data = res.data or []
    priority_order = {"high": 0, "medium": 1, "low": 2}
    data.sort(key=lambda x: priority_order.get(x.get("priority", "medium"), 1))
    return {"actions": data}

@app.get("/api/signals/unread-count")
def unread_count():
    res = supabase.table("signals").select("id", count="exact").eq("is_new", True).execute()
    return {"count": res.count or 0}

@app.get("/api/signals/{signal_id}")
def get_signal(signal_id: str):
    res = supabase.table("signals").select("*, accounts(*)").eq("id", signal_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Signal not found")
    return {"signal": res.data}

@app.get("/api/briefs/{brief_id}")
def get_brief(brief_id: str):
    res = supabase.table("briefs").select("*").eq("id", brief_id).single().execute()
    if res.data:
        return {"brief": res.data}
    sig = supabase.table("signals").select("*, accounts(*)").eq("id", brief_id).single().execute()
    if not sig.data:
        raise HTTPException(status_code=404, detail="Not found")
    return {"signal": sig.data}

@app.post("/api/briefs/{brief_id}/rate")
def rate_brief(brief_id: str, body: dict):
    supabase.table("brief_ratings").insert({"brief_id": brief_id, "rating": body.get("rating"), "user_id": DEMO_USER_ID}).execute()
    return {"success": True}

@app.post("/api/outreach/send")
def send_outreach(body: OutreachSend):
    # Send via Resend
    try:
        resend.Emails.send({
            "from": os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev"),
            "to": body.to,
            "subject": body.subject,
            "text": body.body
        })
    except Exception as e:
        print(f"Resend error: {e}")

    supabase.table("signals").update({"is_new": False}).eq("id", body.signalId).execute()
    supabase.table("outreach").insert({"signal_id": body.signalId, "user_id": DEMO_USER_ID, "to_email": body.to, "subject": body.subject, "body": body.body}).execute()
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
