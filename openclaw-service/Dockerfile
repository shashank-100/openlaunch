FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache git && npm install -g openclaw@latest

# Skills go into the openclaw skills directory
COPY skills/ /data/.openclaw/skills/

ENV NODE_ENV=production
ENV PORT=8080
ENV NODE_OPTIONS="--max-old-space-size=400"
ENV OPENCLAW_STATE_DIR=/data/.openclaw
ENV OPENCLAW_WORKSPACE_DIR=/data/workspace
ENV SETUP_PASSWORD=""
ENV OPENCLAW_GATEWAY_TOKEN=""
ENV OPENAI_API_KEY=""

EXPOSE 8080

CMD ["openclaw", "gateway", "--port", "8080", "--bind", "lan", "--allow-unconfigured"]
