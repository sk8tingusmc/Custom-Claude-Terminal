# Custom Claude Terminal

A simplified Claude Code terminal interface for Linux.

## Features

- **Claude-only**: Stripped down to just Claude Code support
- **Bypass Approvals**: Radio button toggle for `--dangerously-skip-permissions` flag
- **Reset Session**: Quick button to restart the Claude session
- **Simple UI**: Clean terminal interface with minimal controls
- **Linux Target**: Built as portable AppImage for Ubuntu/Linux

## Building

### Prerequisites

```bash
# Install Node.js and npm (if not already installed)
# Install electron dependencies
sudo apt-get install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libdrm2 libgbm1 libxcb-dri3-0
```

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

### Build for Linux

```bash
npm run build
```

This will create a portable AppImage in the `release/` directory.

## Removed from Original

- All other CLI support (Gemini, Codex, Copilot, Local LLM)
- Team Mode functionality
- Model switcher/dropdown
- Command palette
- Theme settings
- Multiple tabs/sessions
- Local LLM settings
- IDE panel
- Complex logging system
- System tray integration

## What Remains

- Claude Code terminal with xterm.js
- Bypass approvals toggle (radio buttons)
- Session reset button
- Basic electron-store for persistence
- PTY integration for Claude CLI
- Window state persistence
