import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import * as pty from '@lydell/node-pty';
import Store from 'electron-store';
import * as os from 'os';

interface StoreSchema {
  bypassMode: boolean;
  workingDir: string | null;
  windowBounds: {
    width: number;
    height: number;
    x?: number;
    y?: number;
  };
}

const store: any = new Store({
  defaults: {
    bypassMode: false,
    workingDir: null,
    windowBounds: { width: 1200, height: 800 },
  },
});

// Store active PTY sessions
const sessions = new Map<string, pty.IPty>();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const bounds = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    title: 'Custom Claude Terminal',
    backgroundColor: '#0a0d14',
  });

  // Load the app
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  // Save window bounds on close
  mainWindow.on('close', () => {
    if (mainWindow) {
      store.set('windowBounds', mainWindow.getBounds());
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Kill all PTY sessions
  for (const [id, pty] of sessions) {
    try {
      pty.kill();
    } catch {}
  }
  sessions.clear();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers

// Create shell session
ipcMain.handle('shell:create', async (_, bypassMode: boolean, workingDir?: string) => {
  const sessionId = `session-${Date.now()}`;

  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  const cwd = workingDir || os.homedir();

  const args: string[] = [];

  // Add claude command with bypass flag if needed
  const claudeCmd = bypassMode ? 'claude --dangerously-skip-permissions' : 'claude';

  if (os.platform() === 'win32') {
    args.push('-Command', claudeCmd);
  } else {
    // Use login shell (-l) to load user's profile (nvm, etc.)
    args.push('-l', '-c', claudeCmd);
  }

  const ptyProcess = pty.spawn(shell, args, {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd,
    env: process.env as any,
  });

  sessions.set(sessionId, ptyProcess);

  // Forward PTY output to renderer
  ptyProcess.onData((data) => {
    mainWindow?.webContents.send('shell:data', sessionId, data);
  });

  ptyProcess.onExit(({ exitCode }) => {
    mainWindow?.webContents.send('shell:exit', sessionId, exitCode);
    sessions.delete(sessionId);
  });

  return sessionId;
});

// Write to shell
ipcMain.handle('shell:write', async (_, sessionId: string, data: string) => {
  const session = sessions.get(sessionId);
  if (session) {
    session.write(data);
  }
});

// Resize PTY
ipcMain.handle('shell:resize', async (_, sessionId: string, cols: number, rows: number) => {
  const session = sessions.get(sessionId);
  if (session) {
    session.resize(cols, rows);
  }
});

// Kill session
ipcMain.handle('shell:kill', async (_, sessionId: string) => {
  const session = sessions.get(sessionId);
  if (session) {
    session.kill();
    sessions.delete(sessionId);
  }
});

// Store handlers
ipcMain.handle('store:get-bypass', async () => {
  return store.get('bypassMode');
});

ipcMain.handle('store:set-bypass', async (_, value: boolean) => {
  store.set('bypassMode', value);
});

ipcMain.handle('store:get-working-dir', async () => {
  return store.get('workingDir');
});

ipcMain.handle('store:set-working-dir', async (_, value: string | null) => {
  store.set('workingDir', value);
});

ipcMain.handle('shell:selectDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: 'Select Project Directory',
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});
