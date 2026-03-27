from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from supabase import create_client, Client
import os
import json
import uuid
from datetime import datetime, UTC
import resend
import urllib.parse
import httpx

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

@app.post("/api/signals")
def create_signal(body: SignalCreate):
    res = supabase.table("signals").insert({
        "account_id": body.accountId,
        "signal_type": body.signalType,
        "signal_summary": body.signalSummary,
        "pain_point": body.painPoint,
        "product_insight": body.productInsight,
        "opportunity": body.opportunity,
        "relevance_score": body.relevanceScore,
        "outreach_angle": body.outreachAngle,
        "email_subject": body.emailSubject,
        "email_body": body.emailBody,
        "source_url": body.sourceUrl,
        "should_contact": body.shouldContact,
        "priority": body.priority,
        "target_persona": body.targetPersona,
        "prospect_name": body.prospectName,
        "prospect_email": body.prospectEmail,
        "prospect_title": body.prospectTitle,
        "prospect_linkedin": body.prospectLinkedin,
        "action": body.action,
        "reason": body.reason,
        "tech_stack": body.techStack,
        "is_new": True,
    }).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create signal")
    return {"signal": res.data[0]}

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
async def send_outreach(body: OutreachSend):
    # Get fresh Gmail access token
    persona = supabase.table("personas").select("gmail_access_token,gmail_refresh_token").eq("user_id", DEMO_USER_ID).limit(1).execute()
    if not persona.data or not persona.data[0].get("gmail_refresh_token"):
        raise HTTPException(status_code=400, detail="Gmail not connected. Go to /settings to connect.")

    # Refresh token
    client_id = os.getenv("GMAIL_CLIENT_ID", "")
    client_secret = os.getenv("GMAIL_CLIENT_SECRET", "")
    async with httpx.AsyncClient() as client:
        r = await client.post("https://oauth2.googleapis.com/token", data={
            "refresh_token": persona.data[0]["gmail_refresh_token"],
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token",
        })
    tokens = r.json()
    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Gmail token refresh failed.")

    # Build RFC 2822 email and base64 encode it
    import base64
    from email.mime.text import MIMEText
    msg = MIMEText(body.body)
    msg["To"] = body.to
    msg["Subject"] = body.subject
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

    # Send via Gmail API
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"raw": raw},
        )
    if res.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail=f"Gmail send failed: {res.text}")

    supabase.table("signals").update({"is_new": False}).eq("id", body.signalId).execute()
    supabase.table("outreach").insert({"signal_id": body.signalId, "to_email": body.to, "subject": body.subject, "body": body.body}).execute()
    return {"success": True}


GMAIL_SCOPES = "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly"

@app.get("/api/gmail/connect")
def gmail_connect():
    client_id = os.getenv("GMAIL_CLIENT_ID", "")
    redirect_uri = os.getenv("GMAIL_REDIRECT_URI", "https://backend-production-d5926.up.railway.app/api/gmail/callback")
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": GMAIL_SCOPES,
        "access_type": "offline",
        "prompt": "consent",
    }
    url = "https://accounts.google.com/o/oauth2/auth?" + urllib.parse.urlencode(params)
    return RedirectResponse(url)

@app.get("/api/gmail/callback")
async def gmail_callback(code: str = None, error: str = None):
    if error or not code:
        return RedirectResponse("https://frontend-delta-murex-26.vercel.app/settings?gmail_error=true")
    client_id = os.getenv("GMAIL_CLIENT_ID", "")
    client_secret = os.getenv("GMAIL_CLIENT_SECRET", "")
    redirect_uri = os.getenv("GMAIL_REDIRECT_URI", "https://backend-production-d5926.up.railway.app/api/gmail/callback")
    async with httpx.AsyncClient() as client:
        res = await client.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        })
    tokens = res.json()
    access_token = tokens.get("access_token", "")
    refresh_token = tokens.get("refresh_token", "")
    # Store tokens in DB for the demo user (upsert in case no persona row exists yet)
    existing = supabase.table("personas").select("id").eq("user_id", DEMO_USER_ID).limit(1).execute()
    if existing.data:
        supabase.table("personas").update({
            "gmail_access_token": access_token,
            "gmail_refresh_token": refresh_token,
            "updated_at": datetime.now(UTC).isoformat(),
        }).eq("user_id", DEMO_USER_ID).execute()
    else:
        supabase.table("personas").insert({
            "user_id": DEMO_USER_ID,
            "gmail_access_token": access_token,
            "gmail_refresh_token": refresh_token,
        }).execute()
    return RedirectResponse("https://frontend-delta-murex-26.vercel.app/settings?gmail_connected=true")

@app.get("/api/gmail/tokens")
def get_gmail_tokens():
    res = supabase.table("personas").select("gmail_access_token,gmail_refresh_token").eq("user_id", DEMO_USER_ID).limit(1).execute()
    if not res.data:
        return {"gmail_access_token": None, "gmail_refresh_token": None}
    return res.data[0]

@app.post("/api/gmail/refresh")
async def gmail_refresh():
    res = supabase.table("personas").select("gmail_refresh_token").eq("user_id", DEMO_USER_ID).limit(1).execute()
    if not res.data or not res.data[0].get("gmail_refresh_token"):
        raise HTTPException(status_code=400, detail="No refresh token stored. Reconnect Gmail.")
    refresh_token = res.data[0]["gmail_refresh_token"]
    client_id = os.getenv("GMAIL_CLIENT_ID", "")
    client_secret = os.getenv("GMAIL_CLIENT_SECRET", "")
    async with httpx.AsyncClient() as client:
        r = await client.post("https://oauth2.googleapis.com/token", data={
            "refresh_token": refresh_token,
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token",
        })
    tokens = r.json()
    if "access_token" not in tokens:
        raise HTTPException(status_code=400, detail=f"Token refresh failed: {tokens}")
    new_token = tokens["access_token"]
    supabase.table("personas").update({
        "gmail_access_token": new_token,
        "updated_at": datetime.now(UTC).isoformat(),
    }).eq("user_id", DEMO_USER_ID).execute()
    return {"access_token": new_token}

# ── Email Intelligence Endpoints ──────────────────────────────────────────

@app.get("/api/email-threads")
def get_email_threads(limit: int = 50, min_score: int = 0):
    """Get all email threads with optional filtering"""
    query = supabase.table("email_threads").select("*").order("last_message_date", desc=True).limit(limit)
    if min_score > 0:
        query = query.gte("lead_score", min_score)
    res = query.execute()
    return {"threads": res.data}

@app.get("/api/email-threads/{thread_id}")
def get_email_thread(thread_id: str):
    """Get detailed email thread with messages and follow-ups"""
    # Get thread
    thread_res = supabase.table("email_threads").select("*").eq("id", thread_id).single().execute()
    if not thread_res.data:
        raise HTTPException(status_code=404, detail="Thread not found")

    # Get messages
    messages_res = supabase.table("email_messages").select("*").eq("thread_id", thread_id).order("sent_at").execute()

    # Get follow-ups
    followups_res = supabase.table("email_followups").select("*").eq("thread_id", thread_id).execute()

    return {
        "thread": thread_res.data,
        "messages": messages_res.data,
        "followups": followups_res.data
    }

@app.get("/api/email-leads")
def get_email_leads():
    """Get high-quality email leads (score >= 7)"""
    res = supabase.table("email_threads").select("*").gte("lead_score", 7).eq("is_lead", True).order("lead_score", desc=True).execute()
    return {"leads": res.data}

@app.post("/api/email-followups/{followup_id}/send")
async def send_email_followup(followup_id: str):
    """Send an AI-generated follow-up email"""
    # Get follow-up
    followup_res = supabase.table("email_followups").select("*, email_threads(*)").eq("id", followup_id).single().execute()
    if not followup_res.data:
        raise HTTPException(status_code=404, detail="Follow-up not found")

    followup = followup_res.data
    thread = followup["email_threads"]

    # Get Gmail access token
    persona = supabase.table("personas").select("gmail_access_token,gmail_refresh_token").eq("user_id", DEMO_USER_ID).limit(1).execute()
    if not persona.data or not persona.data[0].get("gmail_refresh_token"):
        raise HTTPException(status_code=400, detail="Gmail not connected")

    # Refresh token
    client_id = os.getenv("GMAIL_CLIENT_ID", "")
    client_secret = os.getenv("GMAIL_CLIENT_SECRET", "")
    async with httpx.AsyncClient() as client:
        r = await client.post("https://oauth2.googleapis.com/token", data={
            "refresh_token": persona.data[0]["gmail_refresh_token"],
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token",
        })
    tokens = r.json()
    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Token refresh failed")

    # Get recipient from thread participants
    if not thread.get("participants"):
        raise HTTPException(status_code=400, detail="No recipients found")

    recipient = thread["participants"][0]["email"]

    # Build email
    import base64
    from email.mime.text import MIMEText
    msg = MIMEText(followup["body"])
    msg["To"] = recipient
    msg["Subject"] = followup["subject"]
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

    # Send via Gmail API
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"raw": raw},
        )

    if res.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail=f"Gmail send failed: {res.text}")

    # Update follow-up status
    supabase.table("email_followups").update({
        "status": "sent",
        "sent_at": datetime.now(UTC).isoformat()
    }).eq("id", followup_id).execute()

    # Update thread status
    supabase.table("email_threads").update({
        "qualification_status": "contacted",
        "updated_at": datetime.now(UTC).isoformat()
    }).eq("id", thread["id"]).execute()

    return {"success": True, "message": "Follow-up sent"}

@app.get("/api/email-stats")
def get_email_stats():
    """Get email intelligence statistics"""
    # Total threads
    total_threads = supabase.table("email_threads").select("id", count="exact").execute()

    # Qualified leads
    qualified_leads = supabase.table("email_threads").select("id", count="exact").gte("lead_score", 7).execute()

    # High priority leads
    high_priority = supabase.table("email_threads").select("id", count="exact").eq("urgency", "high").execute()

    # Meeting requests
    meeting_requests = supabase.table("email_threads").select("id", count="exact").eq("meeting_requested", True).execute()

    # Follow-ups generated
    followups = supabase.table("email_followups").select("id", count="exact").execute()

    # Recent monitoring jobs
    recent_jobs = supabase.table("email_monitor_jobs").select("*").order("created_at", desc=True).limit(10).execute()

    return {
        "total_threads": total_threads.count or 0,
        "qualified_leads": qualified_leads.count or 0,
        "high_priority": high_priority.count or 0,
        "meeting_requests": meeting_requests.count or 0,
        "followups_generated": followups.count or 0,
        "recent_jobs": recent_jobs.data
    }


# ── ANALYTICS ─────────────────────────────────────────────────────────────────

@app.get("/api/analytics")
async def get_analytics():
    from datetime import timedelta
    now = datetime.now(UTC)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    seven_days_ago  = (now - timedelta(days=7)).isoformat()

    # Signals found
    signals_total = supabase.table("signal_outreach").select("id", count="exact").eq("user_id", DEMO_USER_ID).execute()
    signals_week  = supabase.table("signal_outreach").select("id", count="exact").eq("user_id", DEMO_USER_ID).gte("created_at", seven_days_ago).execute()

    # Emails sent
    sent_total = supabase.table("signal_outreach").select("id", count="exact").eq("user_id", DEMO_USER_ID).eq("approval_status", "approved").execute()
    sent_week  = supabase.table("signal_outreach").select("id", count="exact").eq("user_id", DEMO_USER_ID).eq("approval_status", "approved").gte("sent_at", seven_days_ago).execute()

    # Replies
    replies_total = supabase.table("signal_replies").select("id", count="exact").execute()
    interested    = supabase.table("signal_replies").select("id", count="exact").in_("reply_intent", ["interested","meeting_request"]).execute()
    meetings      = supabase.table("meeting_bookings").select("id", count="exact").eq("user_id", DEMO_USER_ID).execute()

    # Follow-ups
    followups_sent = supabase.table("follow_up_queue").select("id", count="exact").eq("user_id", DEMO_USER_ID).eq("status", "sent").execute()

    # Reply rate
    emails_sent_n = sent_total.count or 0
    replies_n     = replies_total.count or 0
    reply_rate    = round((replies_n / emails_sent_n * 100), 1) if emails_sent_n > 0 else 0

    # Meeting rate
    meeting_rate = round(((meetings.count or 0) / emails_sent_n * 100), 1) if emails_sent_n > 0 else 0

    # Top signals by type
    all_signals = supabase.table("signal_outreach").select("signal_type").eq("user_id", DEMO_USER_ID).execute()
    signal_types: dict = {}
    for s in (all_signals.data or []):
        t = s.get("signal_type", "general")
        signal_types[t] = signal_types.get(t, 0) + 1

    # Recent activity (last 7 days per day)
    daily = supabase.table("signal_outreach").select("created_at,approval_status,sent_at").eq("user_id", DEMO_USER_ID).gte("created_at", seven_days_ago).execute()
    daily_map: dict = {}
    for row in (daily.data or []):
        day = row["created_at"][:10]
        if day not in daily_map:
            daily_map[day] = {"date": day, "signals": 0, "sent": 0}
        daily_map[day]["signals"] += 1
        if row.get("approval_status") == "approved":
            daily_map[day]["sent"] += 1
    activity = sorted(daily_map.values(), key=lambda x: x["date"])

    # Best performing signals
    best = supabase.table("signal_outreach").select("company_name,signal_type,relevance_score,sent_at").eq("user_id", DEMO_USER_ID).eq("approval_status","approved").order("relevance_score", desc=True).limit(5).execute()

    return {
        "overview": {
            "signals_total":    signals_total.count or 0,
            "signals_this_week": signals_week.count or 0,
            "emails_sent_total": emails_sent_n,
            "emails_sent_week":  sent_week.count or 0,
            "replies_total":     replies_n,
            "interested_replies": interested.count or 0,
            "meetings_booked":   meetings.count or 0,
            "follow_ups_sent":   followups_sent.count or 0,
            "reply_rate":        reply_rate,
            "meeting_rate":      meeting_rate,
        },
        "signal_types": signal_types,
        "activity":     activity,
        "best_signals": best.data or [],
    }

# ── AUTO-SEND TOGGLE ──────────────────────────────────────────────────────────

@app.post("/api/settings/auto-send")
async def toggle_auto_send(body: dict):
    enabled = body.get("enabled", False)
    supabase.table("personas").update({
        "auto_send": enabled,
        "updated_at": datetime.now(UTC).isoformat(),
    }).eq("user_id", DEMO_USER_ID).execute()
    return {"success": True, "auto_send": enabled}

@app.get("/api/settings")
async def get_settings():
    res = supabase.table("personas").select("auto_send,auto_send_limit,calendly_link,calendar_meeting_duration").eq("user_id", DEMO_USER_ID).limit(1).execute()
    if not res.data:
        return {"auto_send": False, "auto_send_limit": 10, "calendly_link": None, "calendar_meeting_duration": 30}
    return res.data[0]

@app.patch("/api/settings")
async def update_settings(body: dict):
    allowed = {"auto_send","auto_send_limit","calendly_link","calendar_meeting_duration"}
    update = {k: v for k, v in body.items() if k in allowed}
    if update:
        supabase.table("personas").update(update).eq("user_id", DEMO_USER_ID).execute()
    return {"success": True}

# ── SIGNAL-OUTREACH ENDPOINTS ─────────────────────────────────────────────────

@app.get("/api/signal-outreach")
async def list_signal_outreach(status: str = "pending", limit: int = 50):
    query = supabase.table("signal_outreach").select("*").eq("user_id", DEMO_USER_ID).order("created_at", desc=True).limit(limit)
    if status == "pending":
        query = query.in_("approval_status", ["pending", "edited"])
    elif status == "approved":
        query = query.eq("approval_status", "approved")
    elif status == "rejected":
        query = query.eq("approval_status", "rejected")
    res = query.execute()
    return {"signals": res.data or []}

@app.get("/api/signal-outreach/{signal_id}")
async def get_signal(signal_id: str):
    res = supabase.table("signal_outreach").select("*").eq("id", signal_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Signal not found")
    return res.data

@app.patch("/api/signal-outreach/{signal_id}")
async def edit_signal(signal_id: str, body: dict):
    allowed = {"email_subject","email_body","recipient_email","recipient_name"}
    update = {k: v for k, v in body.items() if k in allowed}
    update["approval_status"] = "edited"
    supabase.table("signal_outreach").update(update).eq("id", signal_id).execute()
    return {"success": True}

@app.post("/api/signal-outreach/{signal_id}/approve")
async def approve_signal(signal_id: str):
    res = supabase.table("signal_outreach").select("*").eq("id", signal_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Signal not found")
    signal = res.data
    if not signal.get("recipient_email"):
        raise HTTPException(status_code=400, detail="No recipient email set")

    # Refresh Gmail token
    persona = supabase.table("personas").select("gmail_refresh_token").eq("user_id", DEMO_USER_ID).limit(1).execute()
    if not persona.data or not persona.data[0].get("gmail_refresh_token"):
        raise HTTPException(status_code=400, detail="Gmail not connected")

    async with httpx.AsyncClient() as client:
        r = await client.post("https://oauth2.googleapis.com/token", data={
            "refresh_token": persona.data[0]["gmail_refresh_token"],
            "client_id": os.getenv("GMAIL_CLIENT_ID"),
            "client_secret": os.getenv("GMAIL_CLIENT_SECRET"),
            "grant_type": "refresh_token",
        })
    tokens = r.json()
    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Gmail token refresh failed")

    import base64
    from email.mime.text import MIMEText
    msg = MIMEText(signal["email_body"])
    msg["To"] = signal["recipient_email"]
    msg["Subject"] = signal["email_subject"]
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

    async with httpx.AsyncClient() as client:
        gmail_res = await client.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"raw": raw},
        )
    if gmail_res.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail=f"Gmail send failed: {gmail_res.text}")

    gmail_data = gmail_res.json()
    supabase.table("signal_outreach").update({
        "approval_status": "approved",
        "sent_at": datetime.now(UTC).isoformat(),
        "gmail_message_id": gmail_data.get("id"),
        "gmail_thread_id": gmail_data.get("threadId"),
    }).eq("id", signal_id).execute()

    # Schedule follow-ups now that email is sent
    if signal.get("recipient_email"):
        _schedule_follow_ups(signal_id, signal["recipient_email"], signal.get("email_subject", ""))

    return {"success": True, "gmail_message_id": gmail_data.get("id")}

@app.post("/api/signal-outreach/{signal_id}/reject")
async def reject_signal(signal_id: str):
    supabase.table("signal_outreach").update({"approval_status": "rejected"}).eq("id", signal_id).execute()
    return {"success": True}

@app.get("/api/signal-replies")
async def list_signal_replies(limit: int = 50):
    res = supabase.table("signal_replies").select("*, signal_outreach(company_name,email_subject)").order("received_at", desc=True).limit(limit).execute()
    return {"replies": res.data or []}

@app.get("/api/pipeline")
async def get_pipeline():
    pending  = supabase.table("signal_outreach").select("*").eq("user_id", DEMO_USER_ID).in_("approval_status",["pending","edited"]).order("created_at",desc=True).limit(50).execute()
    sent     = supabase.table("signal_outreach").select("*").eq("user_id", DEMO_USER_ID).eq("approval_status","approved").not_.is_("gmail_thread_id","null").order("sent_at",desc=True).limit(50).execute()
    replied  = supabase.table("signal_replies").select("*, signal_outreach(company_name)").in_("reply_intent",["interested","meeting_request","question"]).order("received_at",desc=True).limit(50).execute()
    meetings = supabase.table("meeting_bookings").select("*").eq("user_id", DEMO_USER_ID).order("created_at",desc=True).limit(20).execute()
    return {"pipeline": {"pending": pending.data or [], "sent": sent.data or [], "replied": replied.data or [], "closed": meetings.data or []}}

# ── ENGINE ENDPOINTS — called by OpenClaw skills via cron ─────────────────────

async def _gmail_token() -> str | None:
    """Get fresh Gmail token, returns None if not connected (no exception)."""
    try:
        p = supabase.table("personas").select("gmail_refresh_token").eq("user_id", DEMO_USER_ID).limit(1).execute()
        if not p.data or not p.data[0].get("gmail_refresh_token"):
            return None
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.post("https://oauth2.googleapis.com/token", data={
                "refresh_token": p.data[0]["gmail_refresh_token"],
                "client_id": os.getenv("GMAIL_CLIENT_ID", ""),
                "client_secret": os.getenv("GMAIL_CLIENT_SECRET", ""),
                "grant_type": "refresh_token",
            })
        return r.json().get("access_token")
    except:
        return None

async def _gmail_send(token: str, to: str, subject: str, body: str, thread_id: str | None = None) -> dict:
    import base64
    from email.mime.text import MIMEText
    msg = MIMEText(body)
    msg["To"] = to
    msg["Subject"] = subject
    payload: dict = {"raw": base64.urlsafe_b64encode(msg.as_bytes()).decode()}
    if thread_id:
        payload["threadId"] = thread_id
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post("https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers={"Authorization": f"Bearer {token}"}, json=payload)
    return r.json() if r.status_code in (200, 201) else {}

async def _discover_companies(pitch: str, tavily_key: str | None, openai_key: str) -> list:
    import re
    search_ctx = ""
    if tavily_key:
        try:
            async with httpx.AsyncClient(timeout=30) as c:
                qr = await c.post("https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_key}"},
                    json={"model": "gpt-5-mini", "messages": [{"role": "user", "content":
                        f"Generate 3 Tavily search queries to find B2B companies that need: \"{pitch}\". Return ONLY a comma-separated list."}]})
                queries = [q.strip() for q in qr.json()["choices"][0]["message"]["content"].split(",")][:3]
            results = []
            for q in queries:
                async with httpx.AsyncClient(timeout=30) as c:
                    r = await c.post("https://api.tavily.com/search",
                        json={"api_key": tavily_key, "query": q, "search_depth": "basic", "max_results": 5})
                    results.extend(r.json().get("results", []))
            search_ctx = "\n\n".join(f"Source: {r['url']}\n{r['content']}" for r in results)[:12000]
        except Exception as e:
            print(f"Discovery search error: {e}")

    prompt = f"""B2B growth expert. User sells: "{pitch}".
Find up to 10 real companies likely to need this. Focus on companies with recent hiring, funding, or launches.
{f"Search results:{chr(10)}{search_ctx}" if search_ctx else "Use your market knowledge."}
Return ONLY JSON: {{"companies": [{{"company_name": "...", "domain": "...", "description": "..."}}]}}"""

    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post("https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {openai_key}"},
            json={"model": "gpt-5-mini", "messages": [{"role": "user", "content": prompt}]})
    output = r.json()["choices"][0]["message"]["content"]
    m = re.search(r'\{[\s\S]*\}', output)
    if not m:
        return []
    return json.loads(m.group()).get("companies", [])

async def _research_company(name: str, domain: str, pitch: str, tavily_key: str | None, openai_key: str) -> dict:
    import re
    search_ctx = ""
    if tavily_key:
        try:
            async with httpx.AsyncClient(timeout=30) as c:
                r = await c.post("https://api.tavily.com/search",
                    json={"api_key": tavily_key, "query": f"{name} {domain} hiring funding news 2025 2026 decision maker",
                          "search_depth": "advanced", "max_results": 10})
                results = r.json().get("results", [])
                search_ctx = "\n\n".join(f"Source: {r['url']}\n{r['content']}" for r in results)[:12000]
        except Exception as e:
            print(f"Research search error for {name}: {e}")

    prompt = f"""B2B sales intelligence agent. You represent a company that sells: "{pitch}".
Research {name} ({domain}) for buying signals in the last 90 days (funding, hiring, leadership, product, competitive).
Find a specific prospect and draft a 4-line email pitching your product as the solution.
{f"Web results:{chr(10)}{search_ctx}" if search_ctx else ""}
Return ONLY JSON:
{{"signal_type":"hiring|funding|leadership|product|competitive|general","signal_summary":"...","relevance_score":7,
"prospect_name":"...","prospect_title":"...","prospect_email":"...","email_subject":"...","email_body":"Line1.\\n\\nLine2.\\n\\nLine3.\\n\\nLine4.",
"source_url":"...","should_contact":true,"priority":"high|medium|low"}}"""

    async with httpx.AsyncClient(timeout=45) as c:
        r = await c.post("https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {openai_key}"},
            json={"model": "gpt-5-mini", "messages": [{"role": "user", "content": prompt}]})
    output = r.json()["choices"][0]["message"]["content"]
    m = re.search(r'\{[\s\S]*\}', output)
    if not m:
        raise ValueError("No JSON from GPT")
    return json.loads(m.group())

def _schedule_follow_ups(signal_id: str, recipient_email: str, subject: str):
    from datetime import timedelta
    now = datetime.now(UTC)
    for i, day in enumerate([3, 7, 14], start=1):
        try:
            supabase.table("follow_up_queue").insert({
                "outreach_id": signal_id, "user_id": DEMO_USER_ID,
                "follow_up_number": i,
                "scheduled_at": (now + timedelta(days=day)).isoformat(),
                "status": "pending",
            }).execute()
        except:
            pass

@app.post("/api/run/scan")
async def run_scan():
    """Signal discovery + research cycle. OpenClaw calls this every 2h."""
    openai_key = os.getenv("OPENAI_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")
    if not openai_key:
        return {"error": "OPENAI_API_KEY not set", "scanned": 0}

    p_res = supabase.table("personas").select("*").eq("user_id", DEMO_USER_ID).limit(1).execute()
    persona = p_res.data[0] if p_res.data else {}
    pitch = persona.get("pitch") or ""
    sender_name = persona.get("name") or ""
    auto_send = persona.get("auto_send", False)
    if not pitch:
        return {"error": "No pitch set — go to Settings", "scanned": 0}

    companies = await _discover_companies(pitch, tavily_key, openai_key)
    if not companies:
        return {"scanned": 0, "signals_found": 0, "note": "Discovery found no companies"}

    token = await _gmail_token() if auto_send else None
    signals_saved = 0
    emails_sent = 0

    for company in companies[:10]:
        try:
            result = await _research_company(company["company_name"], company.get("domain", ""), pitch, tavily_key, openai_key)
            if not result.get("should_contact"):
                continue

            # Validate GPT-generated email before using it
            prospect_email = result.get("prospect_email", "").strip()
            if not prospect_email or prospect_email.count("@") != 1 or "." not in prospect_email.split("@")[-1]:
                prospect_email = ""

            # Replace GPT placeholder with real sender name
            email_body = result.get("email_body", "")
            if sender_name:
                email_body = email_body.replace("[Your Name]", sender_name).replace("[your name]", sender_name)

            signal_id = str(uuid.uuid4())
            supabase.table("signal_outreach").insert({
                "id": signal_id, "user_id": DEMO_USER_ID,
                "company_name": company["company_name"], "company_domain": company.get("domain"),
                "signal_type": result.get("signal_type", "general"),
                "signal_summary": result.get("signal_summary", ""),
                "relevance_score": result.get("relevance_score", 5),
                "recipient_name": result.get("prospect_name", ""),
                "recipient_email": prospect_email or None,
                "recipient_title": result.get("prospect_title", ""),
                "email_subject": result.get("email_subject", ""),
                "email_body": email_body,
                "source_url": result.get("source_url", ""),
                "approval_status": "sent" if auto_send else "pending",
                "created_at": datetime.now(UTC).isoformat(),
            }).execute()
            signals_saved += 1

            if auto_send and token and prospect_email:
                msg = await _gmail_send(token, prospect_email,
                    result.get("email_subject", "Quick question"), result.get("email_body", ""))
                if msg.get("id"):
                    supabase.table("signal_outreach").update({
                        "sent_at": datetime.now(UTC).isoformat(),
                        "gmail_message_id": msg.get("id"),
                        "gmail_thread_id": msg.get("threadId"), "auto_sent": True,
                    }).eq("id", signal_id).execute()
                    _schedule_follow_ups(signal_id, prospect_email, result.get("email_subject", ""))
                    emails_sent += 1
        except Exception as e:
            print(f"Scan error for {company.get('company_name')}: {e}")

    return {"scanned": len(companies), "signals_found": signals_saved, "emails_sent": emails_sent,
            "mode": "auto" if auto_send else "pending_approval"}

@app.post("/api/run/follow-ups")
async def run_follow_ups():
    """Process due follow-ups. OpenClaw calls this every 30m."""
    openai_key = os.getenv("OPENAI_API_KEY")
    now = datetime.now(UTC)
    try:
        res = supabase.table("follow_up_queue").select("*, signal_outreach(*)").eq("status", "pending").lte("scheduled_at", now.isoformat()).eq("user_id", DEMO_USER_ID).limit(20).execute()
        due = res.data or []
    except:
        return {"sent": 0, "note": "follow_up_queue table not found — run migration v3"}

    if not due:
        return {"sent": 0, "note": "No follow-ups due"}

    token = await _gmail_token()
    if not token:
        return {"sent": 0, "error": "Gmail not connected"}

    p_res = supabase.table("personas").select("pitch,tone,never_say").eq("user_id", DEMO_USER_ID).limit(1).execute()
    persona = p_res.data[0] if p_res.data else {}
    sent = 0
    failed = 0

    for fu in due:
        try:
            signal = fu.get("signal_outreach") or {}
            recipient = fu.get("recipient_email") or signal.get("recipient_email")
            if not recipient:
                continue

            body = ""
            if openai_key:
                async with httpx.AsyncClient(timeout=20) as c:
                    r = await c.post("https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {openai_key}"},
                        json={"model": "gpt-5-mini", "messages": [{"role": "user", "content":
                            f"Write a short follow-up #{fu.get('follow_up_number',1)} email (3 lines max).\n"
                            f"Original topic: {signal.get('signal_summary','')}\n"
                            f"Recipient: {signal.get('recipient_name','there')} at {signal.get('company_name','')}\n"
                            f"Your pitch: {persona.get('pitch','')}\n"
                            f"Tone: {persona.get('tone','direct and casual')}\n"
                            f"Never say: {persona.get('never_say','just checking in')}\n"
                            f"New angle, not a repeat. Body only, no subject."}]})
                    body = r.json()["choices"][0]["message"]["content"]
            else:
                body = f"Wanted to follow up on my note about {signal.get('signal_summary','')}. Worth a quick chat this week?"

            msg = await _gmail_send(token, recipient,
                f"Re: {signal.get('email_subject','Quick question')}",
                body, signal.get("gmail_thread_id"))
            if msg.get("id"):
                supabase.table("follow_up_queue").update({
                    "status": "sent", "sent_at": now.isoformat(), "gmail_message_id": msg.get("id"),
                }).eq("id", fu["id"]).execute()
                sent += 1
            else:
                failed += 1
        except Exception as e:
            print(f"Follow-up error: {e}")
            failed += 1

    return {"sent": sent, "failed": failed, "total_due": len(due)}

@app.post("/api/run/inbox")
async def run_inbox():
    """Check Gmail for replies, classify intent, update scores. OpenClaw calls this every 30m."""
    import re, base64
    openai_key = os.getenv("OPENAI_API_KEY")
    token = await _gmail_token()
    if not token:
        return {"error": "Gmail not connected — go to /settings"}

    # Load sent signals with thread IDs — only check replies in OUR threads
    sent_res = supabase.table("signal_outreach").select("id,gmail_thread_id,company_name,recipient_name,email_subject,recipient_email").eq("user_id", DEMO_USER_ID).not_.is_("gmail_thread_id", "null").execute()
    thread_map = {s["gmail_thread_id"]: s for s in (sent_res.data or [])}

    if not thread_map:
        return {"checked": 0, "replies": 0, "hot": 0, "note": "No sent emails with thread IDs yet"}

    # Load persona once for auto-response drafting
    p_res = supabase.table("personas").select("*").eq("user_id", DEMO_USER_ID).limit(1).execute()
    persona = p_res.data[0] if p_res.data else {}
    auto_send = persona.get("auto_send", False)
    calendly = persona.get("calendly_link", "")

    # Build Gmail query scoped only to our outreach threads — no newsletters ever match
    thread_query = " OR ".join(f"thread:{tid}" for tid in list(thread_map.keys())[:20])
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get("https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers={"Authorization": f"Bearer {token}"},
            params={"q": f"in:inbox newer_than:7d ({thread_query})", "maxResults": 20})
    messages = r.json().get("messages", [])
    if not messages:
        return {"checked": 0, "replies": 0, "hot": 0}

    replies_found = 0
    hot = 0

    for msg in messages:
        try:
            # Use threadId directly from message list — no extra API call needed
            thread_id = msg.get("threadId")
            if not thread_id or thread_id not in thread_map:
                continue

            signal = thread_map[thread_id]
            existing = supabase.table("signal_replies").select("id").eq("gmail_thread_id", thread_id).limit(1).execute()
            if existing.data:
                continue

            async with httpx.AsyncClient(timeout=15) as c:
                mr = await c.get(f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg['id']}",
                    headers={"Authorization": f"Bearer {token}"}, params={"format": "full"})
            payload = mr.json().get("payload", {})
            body_text = ""
            if payload.get("body", {}).get("data"):
                body_text = base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="ignore")
            elif payload.get("parts"):
                for part in payload["parts"]:
                    if part.get("mimeType") == "text/plain" and part.get("body", {}).get("data"):
                        body_text = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="ignore")
                        break
            if not body_text.strip():
                continue

            intent = "general"
            if openai_key:
                async with httpx.AsyncClient(timeout=15) as c:
                    cr = await c.post("https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {openai_key}"},
                        json={"model": "gpt-5-mini", "messages": [{"role": "user", "content":
                            f"Classify this email reply intent. Reply ONE word only:\n"
                            f"meeting_request | interested | question | objection | not_interested | out_of_office\n\n{body_text[:800]}"}]})
                intent = cr.json()["choices"][0]["message"]["content"].strip().lower()
                if intent not in ["meeting_request","interested","question","objection","not_interested","out_of_office"]:
                    intent = "general"

            supabase.table("signal_replies").insert({
                "outreach_id": signal["id"],
                "gmail_message_id": msg["id"],
                "from_email": signal.get("recipient_email", ""),
                "reply_body": body_text[:2000], "reply_intent": intent,
                "received_at": datetime.now(UTC).isoformat(),
            }).execute()
            replies_found += 1

            if intent in ["interested", "meeting_request", "question"]:
                hot += 1

            # Cancel pending follow-ups — they replied
            try:
                supabase.table("follow_up_queue").update({"status": "cancelled"}).eq("outreach_id", signal["id"]).eq("status", "pending").execute()
            except:
                pass

            # Draft auto-response for actionable intents
            reply_id_res = supabase.table("signal_replies").select("id").eq("outreach_id", signal["id"]).eq("gmail_message_id", msg["id"]).limit(1).execute()
            reply_db_id = reply_id_res.data[0]["id"] if reply_id_res.data else None

            if intent in ["interested", "meeting_request", "question", "objection"] and openai_key and reply_db_id:
                try:
                    cal_line = f"\nHere's my calendar to book a time: {calendly}" if calendly and intent in ["interested", "meeting_request"] else ""
                    draft_prompt = (
                        f"Reply to this prospect email on behalf of {persona.get('name', 'me')}.\n"
                        f"Original outreach: {signal.get('signal_summary', '')}\n"
                        f"Company: {signal.get('company_name', '')}\n"
                        f"Their reply: {body_text[:500]}\n"
                        f"Intent: {intent}\n"
                        f"Your pitch: {persona.get('pitch', '')}\n"
                        f"Tone: {persona.get('tone', 'direct and casual')}\n"
                        f"Never say: {persona.get('never_say', 'just checking in')}\n"
                        f"CTA style: {persona.get('cta_style', 'open to a quick call?')}\n"
                        f"{cal_line}\n"
                        f"Write 3–4 lines. Acknowledge their message specifically. "
                        f"{'Offer a meeting time or share Calendly link.' if intent in ['meeting_request','interested'] else ''}"
                        f"{'Answer their question using the pitch context.' if intent == 'question' else ''}"
                        f"{'Address the objection calmly.' if intent == 'objection' else ''}"
                        f" Return ONLY the email body, no subject line."
                    )
                    async with httpx.AsyncClient(timeout=20) as c:
                        dr = await c.post("https://api.openai.com/v1/chat/completions",
                            headers={"Authorization": f"Bearer {openai_key}"},
                            json={"model": "gpt-5-mini", "messages": [{"role": "user", "content": draft_prompt}]})
                    response_body = dr.json()["choices"][0]["message"]["content"]

                    # Replace [Your Name] placeholder
                    if persona.get("name"):
                        response_body = response_body.replace("[Your Name]", persona["name"]).replace("[your name]", persona["name"])

                    supabase.table("signal_replies").update({
                        "response_drafted": True,
                        "response_body": response_body,
                        "response_subject": f"Re: {signal.get('email_subject', '')}",
                    }).eq("id", reply_db_id).execute()

                    # Auto-send if enabled
                    if auto_send:
                        sent_msg = await _gmail_send(token, signal.get("recipient_email", ""),
                            f"Re: {signal.get('email_subject', '')}",
                            response_body, thread_id)
                        if sent_msg.get("id"):
                            supabase.table("signal_replies").update({
                                "response_approved": True,
                                "response_sent_at": datetime.now(UTC).isoformat(),
                            }).eq("id", reply_db_id).execute()
                except Exception as e:
                    print(f"Auto-response draft error: {e}")

            # Telegram alert for hot replies
            bot = os.getenv("TELEGRAM_BOT_TOKEN")
            cid = os.getenv("TELEGRAM_CHAT_ID")
            if bot and cid and intent in ["interested", "meeting_request"]:
                emoji = "🔥" if intent == "meeting_request" else "✅"
                async with httpx.AsyncClient(timeout=10) as c:
                    await c.post(f"https://api.telegram.org/bot{bot}/sendMessage",
                        json={"chat_id": cid, "text": f"{emoji} {signal['company_name']} replied\nIntent: {intent.replace('_',' ')}\n\n\"{body_text[:200]}\""})

        except Exception as e:
            print(f"Inbox error: {e}")

    return {"checked": len(messages), "replies": replies_found, "hot": hot}


@app.post("/api/signal-outreach/ingest")
async def ingest_signal(body: dict):
    """OpenClaw researched a signal natively — save it to DB and schedule follow-ups."""
    persona_res = supabase.table("personas").select("name").eq("user_id", DEMO_USER_ID).limit(1).execute()
    persona = persona_res.data[0] if persona_res.data else {}
    sender_name = persona.get("name") or "there"

    email_body = body.get("email_body", "")
    if sender_name:
        email_body = email_body.replace("[Your Name]", sender_name).replace("[your name]", sender_name)

    row = {
        "user_id": DEMO_USER_ID,
        "company_name":    body.get("company_name", "Unknown"),
        "signal_type":     body.get("signal_type", "general"),
        "signal_summary":  body.get("signal_summary", ""),
        "relevance_score": body.get("relevance_score", 7),
        "email_subject":   body.get("email_subject", ""),
        "email_body":      email_body,
        "recipient_email": body.get("recipient_email"),
        "recipient_name":  body.get("recipient_name"),
        "source_url":      body.get("source_url"),
        "approval_status": "pending",
    }
    res = supabase.table("signal_outreach").insert(row).execute()
    signal_id = res.data[0]["id"] if res.data else None
    if signal_id and body.get("recipient_email"):
        _schedule_follow_ups(signal_id, body["recipient_email"], body.get("email_subject", ""))
    return {"success": True, "id": signal_id}


@app.get("/api/follow-ups/due")
async def get_due_follow_ups():
    """Return due follow-ups with full context so OpenClaw can personalize them."""
    now = datetime.now(UTC)
    try:
        res = supabase.table("follow_up_queue").select("*, signal_outreach(*)").eq("status", "pending").lte("scheduled_at", now.isoformat()).eq("user_id", DEMO_USER_ID).limit(20).execute()
        due = res.data or []
    except:
        return {"follow_ups": [], "note": "follow_up_queue table not found — run migration v3"}

    p_res = supabase.table("personas").select("name,pitch,tone,never_say,example_email").eq("user_id", DEMO_USER_ID).limit(1).execute()
    persona = p_res.data[0] if p_res.data else {}

    result = []
    for fu in due:
        signal = fu.get("signal_outreach") or {}
        result.append({
            "id":               fu["id"],
            "follow_up_number": fu.get("follow_up_number", 1),
            "recipient_email":  fu.get("recipient_email") or signal.get("recipient_email"),
            "signal": {
                "company_name":   signal.get("company_name", ""),
                "signal_summary": signal.get("signal_summary", ""),
                "email_subject":  signal.get("email_subject", ""),
                "gmail_thread_id": signal.get("gmail_thread_id"),
                "recipient_name": signal.get("recipient_name", "there"),
            },
            "persona": {
                "name":          persona.get("name", ""),
                "pitch":         persona.get("pitch", ""),
                "tone":          persona.get("tone", "direct and casual"),
                "never_say":     persona.get("never_say", ""),
                "example_email": persona.get("example_email", ""),
            },
        })
    return {"follow_ups": result}


@app.post("/api/follow-ups/{followup_id}/send")
async def send_follow_up(followup_id: str, body: dict):
    """OpenClaw drafted a follow-up — send it via Gmail."""
    now = datetime.now(UTC)
    try:
        res = supabase.table("follow_up_queue").select("*, signal_outreach(*)").eq("id", followup_id).limit(1).execute()
        fu = res.data[0] if res.data else None
    except:
        return {"success": False, "error": "DB error"}

    if not fu:
        return {"success": False, "error": "Follow-up not found"}

    token = await _gmail_token()
    if not token:
        return {"success": False, "error": "Gmail not connected"}

    signal = fu.get("signal_outreach") or {}
    recipient = fu.get("recipient_email") or signal.get("recipient_email")
    if not recipient:
        return {"success": False, "error": "No recipient email"}

    email_body = body.get("body", "")
    msg = await _gmail_send(token, recipient,
        f"Re: {signal.get('email_subject', 'Quick question')}",
        email_body, signal.get("gmail_thread_id"))

    if msg.get("id"):
        supabase.table("follow_up_queue").update({
            "status": "sent", "sent_at": now.isoformat(), "gmail_message_id": msg.get("id"),
        }).eq("id", followup_id).execute()
        return {"success": True}
    return {"success": False, "error": "Gmail send failed"}


@app.get("/api/inbox/raw")
async def inbox_raw():
    """Return raw Gmail replies from our outreach threads — no AI. OpenClaw classifies intent."""
    import base64
    token = await _gmail_token()
    if not token:
        return {"error": "Gmail not connected", "replies": []}

    sent_res = supabase.table("signal_outreach").select("id,gmail_thread_id,company_name,recipient_name,email_subject,recipient_email").eq("user_id", DEMO_USER_ID).not_.is_("gmail_thread_id", "null").execute()
    thread_map = {s["gmail_thread_id"]: s for s in (sent_res.data or [])}
    if not thread_map:
        return {"replies": [], "note": "No sent emails with thread IDs yet"}

    thread_query = " OR ".join(f"thread:{tid}" for tid in list(thread_map.keys())[:20])
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get("https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers={"Authorization": f"Bearer {token}"},
            params={"q": f"in:inbox newer_than:7d ({thread_query})", "maxResults": 20})
    messages = r.json().get("messages", [])
    if not messages:
        return {"replies": []}

    replies = []
    for msg in messages:
        try:
            thread_id = msg.get("threadId")
            if not thread_id or thread_id not in thread_map:
                continue
            signal = thread_map[thread_id]
            existing = supabase.table("signal_replies").select("id").eq("gmail_message_id", msg["id"]).limit(1).execute()
            if existing.data:
                continue
            async with httpx.AsyncClient(timeout=15) as c:
                mr = await c.get(f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg['id']}",
                    headers={"Authorization": f"Bearer {token}"}, params={"format": "full"})
            payload = mr.json().get("payload", {})
            body_text = ""
            if payload.get("body", {}).get("data"):
                body_text = base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="ignore")
            elif payload.get("parts"):
                for part in payload["parts"]:
                    if part.get("mimeType") == "text/plain" and part.get("body", {}).get("data"):
                        body_text = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="ignore")
                        break
            body_text = body_text.strip()
            if not body_text:
                continue
            # Skip automated/marketing emails: no real words, just links/footer
            import re as _re
            words = _re.findall(r'[a-zA-Z]{4,}', body_text)
            link_count = body_text.count('http')
            if len(words) < 10 or (link_count >= 3 and len(words) < 20):
                continue
            replies.append({
                "gmail_message_id": msg["id"],
                "gmail_thread_id": thread_id,
                "outreach_id": signal["id"],
                "from_name": signal.get("recipient_name", ""),
                "from_email": signal.get("recipient_email", ""),
                "company": signal.get("company_name", ""),
                "original_subject": signal.get("email_subject", ""),
                "body": body_text[:2000],
            })
        except Exception as e:
            print(f"inbox_raw error: {e}")

    return {"replies": replies, "checked": len(messages)}


@app.post("/api/inbox/classify")
async def inbox_classify(body: dict):
    """OpenClaw classified intent — save to DB, send Telegram alert, cancel follow-ups."""
    outreach_id = body.get("outreach_id")
    gmail_message_id = body.get("gmail_message_id")
    gmail_thread_id = body.get("gmail_thread_id")
    from_email = body.get("from_email", "")
    reply_body = body.get("body", "")
    VALID_INTENTS = {"meeting_request", "interested", "question", "objection", "not_interested", "out_of_office", "general"}
    intent = body.get("intent", "general")
    if intent not in VALID_INTENTS:
        intent = "general"
    response_draft = body.get("response_draft", "")
    company = body.get("company", "")

    if not outreach_id or not gmail_message_id:
        return {"success": False, "error": "outreach_id and gmail_message_id required"}

    row = {
        "outreach_id": outreach_id,
        "gmail_message_id": gmail_message_id,
        "from_email": from_email,
        "reply_body": reply_body[:2000],
        "reply_intent": intent,
        "received_at": datetime.now(UTC).isoformat(),
    }
    if response_draft:
        row["response_drafted"] = True
        row["response_body"] = response_draft

    supabase.table("signal_replies").insert(row).execute()

    # Cancel pending follow-ups — they replied
    try:
        supabase.table("follow_up_queue").update({"status": "cancelled"}).eq("outreach_id", outreach_id).eq("status", "pending").execute()
    except:
        pass

    # Auto-send response if enabled and draft provided
    p_res = supabase.table("personas").select("auto_send,name").eq("user_id", DEMO_USER_ID).limit(1).execute()
    persona = p_res.data[0] if p_res.data else {}
    if persona.get("auto_send") and response_draft and from_email:
        token = await _gmail_token()
        if token:
            sent_msg = await _gmail_send(token, from_email,
                f"Re: {body.get('original_subject', '')}",
                response_draft, gmail_thread_id)
            if sent_msg.get("id"):
                reply_res = supabase.table("signal_replies").select("id").eq("gmail_message_id", gmail_message_id).limit(1).execute()
                if reply_res.data:
                    supabase.table("signal_replies").update({
                        "response_approved": True,
                        "response_sent_at": datetime.now(UTC).isoformat(),
                    }).eq("id", reply_res.data[0]["id"]).execute()

    # Telegram alert for hot replies
    bot = os.getenv("TELEGRAM_BOT_TOKEN")
    cid = os.getenv("TELEGRAM_CHAT_ID")
    if bot and cid and intent in ["interested", "meeting_request"]:
        emoji = "🔥" if intent == "meeting_request" else "✅"
        async with httpx.AsyncClient(timeout=10) as c:
            await c.post(f"https://api.telegram.org/bot{bot}/sendMessage",
                json={"chat_id": cid, "text": f"{emoji} {company} replied\nIntent: {intent.replace('_',' ')}\n\n\"{reply_body[:200]}\""})

    return {"success": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
