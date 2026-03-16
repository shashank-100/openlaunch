FROM node:24-alpine

WORKDIR /app

RUN npm install -g openclaw@latest

# Skills go into the openclaw home directory
COPY skills/ /root/.openclaw/skills/

ENV NODE_ENV=production
# OpenClaw only needs an AI provider key and gateway token
ENV OPENAI_API_KEY=""
ENV OPENCLAW_GATEWAY_TOKEN=""

EXPOSE 18789

CMD ["openclaw", "gateway", "--port", "18789", "--bind", "lan", "--allow-unconfigured"]
