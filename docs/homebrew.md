# Homebrew Installation Guide

You can install and manage **Antigravity Superpowers** via [Homebrew](https://brew.sh) on macOS and Linux.

---

## 🍺 Quick Install via Homebrew Tap

```bash
# 1. Tap the repository
brew tap imMamdouhaboammar/antigravity-superpowers https://github.com/imMamdouhaboammar/antigravity-superpowers.git

# 2. Install the formula
brew install antigravity-superpowers

# 3. Activate skills across your AI agent environments
antigravity-superpowers install --all-agents
```

---

## 🚀 Direct Formula URL Installation

Alternatively, you can install directly without tapping:

```bash
brew install https://raw.githubusercontent.com/imMamdouhaboammar/antigravity-superpowers/master/Formula/antigravity-superpowers.rb
```

---

## ⚡ Post-Installation Commands

Once installed via Homebrew, both `antigravity-superpowers` and `agy-superpowers` CLI commands are available system-wide:

```bash
# Verify installation health
antigravity-superpowers verify

# List all 88+ skills across divisions
antigravity-superpowers list

# Route a task to the right specialized division
antigravity-superpowers route "Implement secure OAuth 2.1 authentication"

# Install to a specific agent (e.g. Cursor, Claude Code, OpenCode)
antigravity-superpowers install --agent claude
antigravity-superpowers install --agent cursor
```

---

## 🔄 Updating via Homebrew

```bash
brew update
brew upgrade antigravity-superpowers
antigravity-superpowers install
```
