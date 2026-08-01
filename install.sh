#!/usr/bin/env bash
set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "⚡ Installing Antigravity Superpowers & Specialized Division Skills..."
echo -e "${NC}"

HOME_DIR="$HOME"
GLOBAL_PLUGINS_DIR="$HOME_DIR/.gemini/config/plugins"
GLOBAL_SKILLS_DIR="$HOME_DIR/.gemini/config/skills"

mkdir -p "$GLOBAL_PLUGINS_DIR"
mkdir -p "$GLOBAL_SKILLS_DIR"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Check if Bun is installed
if command -v bun &> /dev/null; then
    echo -e "${GREEN}✓ Bun detected. Running installer via Bun...${NC}"
    cd "$SCRIPT_DIR"
    bun run install.ts
else
    echo -e "${YELLOW}! Bun not found. Performing direct file-system installation...${NC}"
    
    if [ -d "$SCRIPT_DIR/plugins" ]; then
        echo -e "${YELLOW}📦 Copying plugins to $GLOBAL_PLUGINS_DIR...${NC}"
        cp -R "$SCRIPT_DIR/plugins/"* "$GLOBAL_PLUGINS_DIR/"
    fi

    if [ -d "$SCRIPT_DIR/skills" ]; then
        echo -e "${YELLOW}🧠 Copying skills to $GLOBAL_SKILLS_DIR...${NC}"
        cp -R "$SCRIPT_DIR/skills/"* "$GLOBAL_SKILLS_DIR/"
    fi

    if [ -d ".agents/skills" ]; then
        echo -e "${YELLOW}🎯 Copying skills to local workspace .agents/skills/...${NC}"
        cp -R "$SCRIPT_DIR/skills/"* ".agents/skills/" 2>/dev/null || true
    fi

    echo -e "${GREEN}✅ Direct installation complete!${NC}"
fi

echo -e "${GREEN}🎉 Antigravity Superpowers and Division Skills installed successfully!${NC}"
