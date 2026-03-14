#!/bin/bash

# Geodo Setup Script
# This script helps you set up Geodo for the first time

set -e

echo "🚀 Welcome to Geodo Setup!"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${BLUE}Checking Node.js version...${NC}"
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 20 ]; then
  echo -e "${YELLOW}⚠️  Node.js 20+ required. Please upgrade.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
echo ""

# Check Redis
echo -e "${BLUE}Checking Redis...${NC}"
if ! command -v redis-cli &> /dev/null; then
  echo -e "${YELLOW}⚠️  Redis not found. Installing via Homebrew...${NC}"
  if command -v brew &> /dev/null; then
    brew install redis
    brew services start redis
  else
    echo -e "${YELLOW}Please install Redis manually: https://redis.io/download${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ Redis installed${NC}"
  # Check if Redis is running
  if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✓ Redis is running${NC}"
  else
    echo -e "${YELLOW}⚠️  Starting Redis...${NC}"
    brew services start redis || systemctl start redis || redis-server --daemonize yes
  fi
fi
echo ""

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Root dependencies installed${NC}"
echo ""

echo -e "${BLUE}Installing workspace dependencies...${NC}"
npm install --workspaces
echo -e "${GREEN}✓ All workspace dependencies installed${NC}"
echo ""

# Install Playwright browsers
echo -e "${BLUE}Installing Playwright browsers...${NC}"
cd openclaw-daemon
npx playwright install chromium
cd ..
echo -e "${GREEN}✓ Playwright browsers installed${NC}"
echo ""

# Setup environment variables
echo -e "${BLUE}Setting up environment variables...${NC}"
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${GREEN}✓ Created .env file${NC}"
  echo -e "${YELLOW}⚠️  Please edit .env with your credentials:${NC}"
  echo "   - SUPABASE_URL"
  echo "   - SUPABASE_SERVICE_KEY"
  echo "   - ANTHROPIC_API_KEY"
  echo "   - GOOGLE_CLIENT_ID (for calendar)"
  echo "   - GOOGLE_CLIENT_SECRET"
  echo ""
  echo -e "${YELLOW}Press Enter after updating .env...${NC}"
  read
else
  echo -e "${GREEN}✓ .env file already exists${NC}"
fi
echo ""

# Verify .env has required variables
echo -e "${BLUE}Verifying environment variables...${NC}"
source .env

required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_KEY" "ANTHROPIC_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Missing required variables:${NC}"
  for var in "${missing_vars[@]}"; do
    echo "   - $var"
  done
  echo ""
  echo -e "${YELLOW}Please update .env and run this script again.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ All required environment variables set${NC}"
echo ""

# Database setup
echo -e "${BLUE}Database Setup${NC}"
echo "Have you run the database schema in Supabase? (y/n)"
read -r db_setup

if [ "$db_setup" != "y" ]; then
  echo ""
  echo -e "${YELLOW}⚠️  Please set up your database:${NC}"
  echo "1. Go to your Supabase project"
  echo "2. Open SQL Editor"
  echo "3. Copy contents from: database/schema.sql"
  echo "4. Run the SQL"
  echo ""
  echo "Press Enter when done..."
  read
fi
echo -e "${GREEN}✓ Database ready${NC}"
echo ""

# Build TypeScript
echo -e "${BLUE}Building TypeScript...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Success!
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Geodo Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Start all services:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "2. Access:"
echo "   - Frontend: ${GREEN}http://localhost:3000${NC}"
echo "   - Backend API: ${GREEN}http://localhost:4000${NC}"
echo ""
echo "3. Test with a research job:"
echo "   ${GREEN}curl -X POST http://localhost:4000/api/webhook/research \\${NC}"
echo "   ${GREEN}  -H 'Content-Type: application/json' \\${NC}"
echo "   ${GREEN}  -d '{${NC}"
echo "   ${GREEN}    \"companyName\": \"Anthropic\",${NC}"
echo "   ${GREEN}    \"contactName\": \"Claude\",${NC}"
echo "   ${GREEN}    \"userId\": \"test-user\",${NC}"
echo "   ${GREEN}    \"organizationId\": \"test-org\"${NC}"
echo "   ${GREEN}  }'${NC}"
echo ""
echo "4. View logs:"
echo "   - Agent activity in Supabase: ${GREEN}agent_logs${NC} table"
echo "   - Briefs in: ${GREEN}briefs${NC} table"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   - README.md - Full documentation"
echo "   - DEPLOYMENT.md - Production deployment guide"
echo ""
echo -e "${BLUE}Need help? Check the README or visit: https://github.com/yourusername/geodo${NC}"
echo ""
