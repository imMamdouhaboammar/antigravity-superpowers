#!/usr/bin/env bash
set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "⚡ Antigravity Superpowers & Multi-Agent Specialized Division Skills Installer"
echo -e "${NC}"

HOME_DIR="$HOME"
GLOBAL_GEMINI_PLUGINS="$HOME_DIR/.gemini/config/plugins"
GLOBAL_GEMINI_SKILLS="$HOME_DIR/.gemini/config/skills"
GLOBAL_CLAUDE_SKILLS="$HOME_DIR/.claude/skills"
GLOBAL_OPENCODE_SKILLS="$HOME_DIR/.config/opencode/skills"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Check if Bun is installed
if command -v bun &> /dev/null; then
    echo -e "${GREEN}✓ Bun runtime detected. Running installer via Bun...${NC}"
    if [ -f "$SCRIPT_DIR/install.ts" ]; then
        bun run "$SCRIPT_DIR/install.ts" "$@"
    else
        # When piped from curl without local files
        TEMP_DIR="$(mktemp -d -t antigravity-install-XXXXXX)"
        trap 'rm -rf "$TEMP_DIR"' EXIT
        git clone --depth 1 https://github.com/imMamdouhaboammar/antigravity-superpowers.git "$TEMP_DIR" >/dev/null 2>&1
        bun run "$TEMP_DIR/install.ts" "$@"
    fi
else
    echo -e "${YELLOW}! Bun not found. Performing direct multi-agent installation...${NC}"
    
    # If running from cloned directory
    SRC_DIR="$SCRIPT_DIR"
    if [ ! -d "$SRC_DIR/skills" ]; then
        TEMP_DIR="$(mktemp -d -t antigravity-install-XXXXXX)"
        trap 'rm -rf "$TEMP_DIR"' EXIT
        git clone --depth 1 https://github.com/imMamdouhaboammar/antigravity-superpowers.git "$TEMP_DIR" >/dev/null 2>&1
        SRC_DIR="$TEMP_DIR"
    fi

    # 1. Antigravity & Gemini CLI (Global)
    mkdir -p "$GLOBAL_GEMINI_PLUGINS"
    mkdir -p "$GLOBAL_GEMINI_SKILLS"
    if [ -d "$SRC_DIR/plugins" ]; then
        echo -e "${YELLOW}📦 Copying plugins to $GLOBAL_GEMINI_PLUGINS...${NC}"
        cp -R "$SRC_DIR/plugins/"* "$GLOBAL_GEMINI_PLUGINS/" 2>/dev/null || true
    fi
    if [ -d "$SRC_DIR/skills" ]; then
        echo -e "${YELLOW}🧠 Copying skills to $GLOBAL_GEMINI_SKILLS...${NC}"
        cp -R "$SRC_DIR/skills/"* "$GLOBAL_GEMINI_SKILLS/" 2>/dev/null || true
    fi

    # 2. Local Workspace (.agents/skills)
    mkdir -p ".agents/skills"
    if [ -d "$SRC_DIR/skills" ]; then
        echo -e "${YELLOW}🎯 Copying skills to workspace .agents/skills/...${NC}"
        cp -R "$SRC_DIR/skills/"* ".agents/skills/" 2>/dev/null || true
    fi

    # 3. Claude Code integration
    if [ -d "$HOME_DIR/.claude" ] || [ -f "CLAUDE.md" ]; then
        echo -e "${YELLOW}⚡ Configuring Claude Code...${NC}"
        mkdir -p "$GLOBAL_CLAUDE_SKILLS"
        cp -R "$SRC_DIR/skills/"* "$GLOBAL_CLAUDE_SKILLS/" 2>/dev/null || true
        mkdir -p ".claude/skills"
        cp -R "$SRC_DIR/skills/"* ".claude/skills/" 2>/dev/null || true
    fi

    # 4. Cursor IDE integration
    if [ -d ".cursor" ] || [ -f ".cursorrules" ]; then
        echo -e "${YELLOW}🎯 Configuring Cursor IDE...${NC}"
        mkdir -p ".cursor/skills"
        cp -R "$SRC_DIR/skills/"* ".cursor/skills/" 2>/dev/null || true
    fi

    echo -e "${GREEN}✅ Direct multi-agent installation complete!${NC}"
fi

echo -e "${GREEN}🎉 Antigravity Superpowers and Division Skills installed successfully!${NC}"
