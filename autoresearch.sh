#!/bin/bash
# Benchmark script for email reply rate optimization
# Outputs: METRIC positive_reply_rate=X.X

set -e

BACKEND="${BACKEND_URL:-https://backend-production-d5926.up.railway.app}"

echo "🔍 Fetching reply statistics..."

# Get all replies from the last 7 days
REPLIES=$(curl -s "$BACKEND/api/signal-replies?limit=100")

# Count total replies
TOTAL=$(echo "$REPLIES" | jq '.replies | length')

if [ "$TOTAL" -eq 0 ]; then
  echo "⚠️  No replies in database yet. Sending test emails first..."

  # Trigger a scan to generate signals (optional - can be manual)
  # curl -s -X POST "$BACKEND/api/run/scan" > /dev/null

  echo "METRIC positive_reply_rate=0.0"
  echo "METRIC total_replies=0"
  exit 0
fi

# Count positive replies (interested + meeting_request)
POSITIVE=$(echo "$REPLIES" | jq '[.replies[] | select(.reply_intent == "interested" or .reply_intent == "meeting_request")] | length')

# Calculate reply rate
REPLY_RATE=$(echo "scale=2; $POSITIVE * 100 / $TOTAL" | bc)

# Output metrics in format: METRIC name=value
echo "METRIC positive_reply_rate=$REPLY_RATE"
echo "METRIC total_replies=$TOTAL"
echo "METRIC positive_replies=$POSITIVE"

echo "✅ Reply Rate: $REPLY_RATE% ($POSITIVE/$TOTAL positive)"
