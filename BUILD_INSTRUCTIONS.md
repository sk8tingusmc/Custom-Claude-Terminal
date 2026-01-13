# Build Instructions for Custom Claude Terminal

## Project Overview

This is a simplified, Claude-only version of the AI CLI Switcher. It's designed to run on Linux (Ubuntu) as a portable AppImage.

## Prerequisites

### System Requirements (Linux/Ubuntu)

```bash
# Install Node.js 18+ (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install electron dependencies
sudo apt-get install -y \
  libgtk-3-0 \
  libnotify4 \
  libnss3 \
  libxss1 \
  libxtst6 \
  xdg-utils \
  libatspi2.0-0 \
  libdrm2 \
  libgbm1 \
  libxcb-dri3-0

# Install build tools for native modules
sudo apt-get install -y build-essential python3
```

### Required Tools

- Node.js >= 18.x
- npm >= 9.x
- Claude CLI installed and accessible in PATH (`claude` command must work)

## Installation & Setup

```bash
cd /mnt/c/Users/Blake/dev/typescript/Custom_claude

# Install dependencies
npm install

# This will install all required packages including:
# - electron and electron-builder
# - React and React DOM
# - xterm.js for terminal emulation
# - node-pty for PTY integration
# - electron-store for settings persistence
```

## Development Mode

```bash
# Run in development mode (hot reload enabled)
npm run dev

# Or use the start script (same as dev)
npm start
```

This will:
1. Start Vite dev server on http://localhost:5173
2. Wait for Vite to be ready
3. Launch Electron with hot reload

Dev tools will be open by default for debugging.

## Building for Production

### Option 1: Using npm build script

```bash
npm run build
```

This runs:
1. `npm run build:electron` - Compiles TypeScript in electron/ to dist-electron/
2. `npm run build:vite` - Builds React app to dist/
3. `electron-builder` - Packages everything into AppImage

### Option 2: Using the build.sh script

```bash
chmod +x build.sh
./build.sh
```

### Build Output

The build creates a portable AppImage in the `release/` directory:

```
release/
  └── Custom Claude-1.0.0.AppImage
```

The AppImage is a self-contained executable that includes:
- Electron runtime
- Node.js runtime
- All dependencies
- Compiled application code

## Running the Built AppImage

```bash
# Make it executable (if not already)
chmod +x release/Custom\ Claude-1.0.0.AppImage

# Run it
./release/Custom\ Claude-1.0.0.AppImage
```

Or double-click it in your file manager.

## Project Structure

```
Custom_claude/
├── electron/                    # Electron main process
│   ├── main.ts                 # Main electron process (PTY, IPC, window management)
│   ├── preload.ts              # Preload script (IPC bridge)
│   └── tsconfig.json           # TypeScript config for electron
├── src/                        # React frontend
│   ├── components/
│   │   └── Terminal.tsx       # Terminal component (xterm.js wrapper)
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # React entry point
│   ├── index.css              # Tailwind CSS imports
│   └── global.d.ts            # TypeScript declarations for window APIs
├── dist/                       # Vite build output (created during build)
├── dist-electron/              # Compiled electron code (created during build)
├── release/                    # electron-builder output (created during build)
├── package.json               # Dependencies and build config
├── tsconfig.json              # TypeScript config for React
├── vite.config.ts             # Vite bundler config
├── tailwind.config.js         # Tailwind CSS config
├── index.html                 # HTML entry point
└── README.md                  # Project overview
```

## Features Implemented

### Retained from Original:
- ✅ Claude Code terminal integration
- ✅ xterm.js for terminal rendering
- ✅ PTY (pseudo-terminal) integration via node-pty
- ✅ Bypass approvals toggle (`--dangerously-skip-permissions` flag)
- ✅ Session reset functionality
- ✅ Settings persistence (electron-store)
- ✅ Window state persistence (size, position)

### Simplified/Removed:
- ❌ Multi-CLI support (Gemini, Codex, Copilot, LLM)
- ❌ Team Mode functionality
- ❌ Model switcher/dropdown
- ❌ Command palette
- ❌ Theme customization UI
- ❌ Multiple tabs/sessions
- ❌ Local LLM integration
- ❌ IDE panel (file tree, code viewer)
- ❌ Conversation logging/export
- ❌ System tray integration
- ❌ Update checker
- ❌ Working directory picker (uses home by default)

## Troubleshooting

### Build Fails - Native Module Errors

```bash
# Rebuild native modules for electron
npm run rebuild
# Or manually:
npx electron-rebuild
```

### Claude Command Not Found

Ensure Claude CLI is installed and in your PATH:

```bash
which claude
# Should output: /usr/local/bin/claude or similar

# If not found, install Claude CLI first
```

### AppImage Won't Run

```bash
# Make sure it's executable
chmod +x release/Custom\ Claude-1.0.0.AppImage

# Check FUSE is installed (required for AppImage)
sudo apt-get install -y fuse libfuse2

# Try running from terminal to see errors
./release/Custom\ Claude-1.0.0.AppImage
```

### Terminal Not Showing Output

Check that:
1. Claude CLI is installed (`claude --version`)
2. You have proper terminal permissions
3. Check electron console for errors (Ctrl+Shift+I in dev mode)

## Configuration

Settings are stored in:
```
~/.config/custom-claude-terminal/config.json
```

Contains:
- `bypassMode`: boolean - Whether bypass approvals is enabled
- `workingDir`: string | null - Custom working directory (not implemented in UI yet)
- `windowBounds`: object - Window size and position

## Next Steps / Future Enhancements

Optional features you could add:
- Working directory picker UI
- Custom themes
- Keyboard shortcut customization
- Session export/import
- Font size controls
- Search in terminal (Ctrl+F)

## License

MIT
