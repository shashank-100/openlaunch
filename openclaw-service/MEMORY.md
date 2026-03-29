# MEMORY.md - INTAKE Agent Learnings

*Curated intelligence about what works and what doesn't. Not project documentation.*

---

## What Works - Email Quality

### Signal-to-Email Patterns That Get Replies

**Best performing hooks:**
- "Saw you raised Series A" → Funding signals
- "Noticed you're hiring 5 data engineers" → Hiring signals
- "Congrats on the VP Sales hire" → Leadership changes

**Email structure that works:**
1. Specific recent signal (what happened, when)
2. One-sentence pain point
3. One-sentence solution
4. Low-friction CTA

**Length:** 4-5 lines MAX. Shorter outperforms longer.

**What to strip from GPT output:**
- "(inferred)" after email addresses
- "(guessed)" after names
- Any placeholder text like "[Company Name]"
- Generic phrases: "Just checking in", "Circle back", "Hope this finds you well"

---

## What Doesn't Work

**Avoid these patterns:**
- Generic templates without personalization
- Leading with product pitch before signal
- Follow-ups that just say "following up"
- Emails longer than 6 lines
- Multiple asks in one email

**Red flags that predict low reply rates:**
- No specific recent signal mentioned
- Company/contact research is thin
- Email could apply to any company
- Relevance score below 6/10

---

## Cron Configuration Learnings

### Absolute Paths Required

**Problem encountered:** Crons failed with "file not found" errors
**Root cause:** Used relative paths like "Run the signal-scanner skill"
**Solution:** Always use absolute paths to SKILL.md files

**Example:**
```
❌ Bad:  "Run the signal-scanner skill"
✅ Good: "Read /full/path/to/skills/signal-scanner/SKILL.md and execute it"
```

**Why:** OpenClaw doesn't auto-discover skills from workspace context in isolated cron sessions.

---

## Email Verification Patterns

**Current limitation:** Only format validation, no deliverability checks

**What to add:**
- MX record verification before queuing
- Track bounce rates per domain
- Skip role-based emails (info@, support@)
- Blacklist catch-all domains after first bounce

**Impact:** Sending to invalid emails hurts sender reputation → emails go to spam

---

## Follow-Up Timing That Works

**Current schedule:** Day 3, 7, 14
- Day 3: Different angle, new value prop
- Day 7: Social proof or case study
- Day 14: Last touch, breakup email

**What to improve:**
- Cancel follow-ups if original bounced
- Cancel follow-ups if prospect replied (already handled)
- Adjust timing based on signal type (funding = faster, hiring = slower)

---

## Signal Discovery Patterns

**High-quality signals:**
- Recent (last 30 days)
- Specific (named person, exact role)
- Verifiable (source URL provided)
- Relevant (matches ICP criteria)

**Low-quality signals to skip:**
- Generic industry news
- No specific company action
- Can't find decision-maker contact
- Relevance score < 6/10

**Research depth matters:**
- 2 Tavily queries per company minimum
- Cross-reference hiring page + news
- Find actual decision-maker name (not "VP Sales at Company")

---

## Reply Classification Accuracy

**Intent categories that work well:**
- `interested` → Auto-respond with calendar link
- `meeting_request` → Auto-respond immediately
- `question` → Draft answer, queue for review
- `objection` → Draft thoughtful response
- `not_interested` → Mark as lost, don't follow up
- `out_of_office` → Reschedule follow-up

**Auto-send vs. review decision:**
- Auto-send: interested, meeting_request (time-sensitive)
- Review first: question, objection (requires nuance)

---

## API Cost Optimization

**Current costs per signal:**
- Tavily searches: ~$0.02 per company
- GPT-5-mini drafting: ~$0.01 per email
- Total: ~$0.03 per signal

**Optimization opportunities:**
- Batch Tavily queries (reduce API calls)
- Cache company research (don't re-research same company)
- Use GPT-5-mini not GPT-4 (10x cheaper, 95% quality)

---

## Error Patterns to Watch

**Silent failures encountered:**
1. Gmail OAuth token expires → sending stops silently
2. Tavily rate limit hit → scan returns no results
3. Backend down → crons fail with no alert

**Solution:** Add Telegram alerts for:
- Authentication failures
- API rate limits
- Zero results from scan (unusual)
- Cron consecutive errors (> 3)

---

## Deployment Lessons

**Path updates required:**
- Dev: `/Users/shashank/openlaunch/geodo/openclaw-service/`
- Prod: Update to VM paths (e.g., `/opt/intake/openclaw-service/`)

**Cron message format:**
```
Read /deployment/path/skills/{skill-name}/SKILL.md and execute it
```

**Pre-deployment checklist:**
1. Update all cron message paths
2. Test each skill manually
3. Verify backend health endpoint responds
4. Monitor logs for 24h post-deployment

---

## Memory Maintenance

**What to log daily:** (`memory/YYYY-MM-DD.md`)
- Bugs found and fixed
- Configuration changes
- New patterns discovered
- Things that didn't work

**What to curate here:** (`MEMORY.md`)
- Email patterns that get replies
- Signal discovery insights
- Cost optimization learnings
- Deployment gotchas

**Review cadence:** Weekly (via heartbeat or manual)
- Promote important daily learnings to this file
- Remove outdated patterns
- Keep this file under 200 lines

---

*This file should answer: "What has INTAKE learned about what works?" Not "How is INTAKE configured?"*
