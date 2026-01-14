import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  bypassMode: boolean;
  workingDir: string | null;
  onSessionCreated: (sessionId: string) => void;
  shouldReset: boolean;
}

const THEME = {
  background: '#0a0d14',
  foreground: '#e8eaf0',
  cursor: '#60a5fa',
  cursorAccent: '#0a0d14',
  selectionBackground: 'rgba(96, 165, 250, 0.3)',
  black: '#0a0d14',
  red: '#ff5555',
  green: '#50fa7b',
  yellow: '#f1fa8c',
  blue: '#60a5fa',
  magenta: '#ff79c6',
  cyan: '#8be9fd',
  white: '#f8f8f2',
  brightBlack: '#4a5568',
  brightRed: '#ff6e6e',
  brightGreen: '#69ff94',
  brightYellow: '#ffffa5',
  brightBlue: '#93c5fd',
  brightMagenta: '#ff92df',
  brightCyan: '#a4ffff',
  brightWhite: '#ffffff',
};

function Terminal({ bypassMode, workingDir, onSessionCreated, shouldReset }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Copy selected text
  const handleCopy = () => {
    const selection = xtermRef.current?.getSelection();
    if (selection) {
      navigator.clipboard.writeText(selection);
    }
    setContextMenu(null);
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && sessionIdRef.current) {
        window.shell.write(sessionIdRef.current, text);
      }
    } catch (err) {
      console.error('Failed to paste:', err);
    }
    setContextMenu(null);
  };

  // Create terminal instance once
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const terminal = new XTerm({
      theme: THEME,
      fontFamily: '"Cascadia Mono", "Cascadia Code", Consolas, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Fit and mark ready
    requestAnimationFrame(() => {
      fitAddon.fit();
      setIsReady(true);
    });

    // Handle input
    terminal.onData((data) => {
      if (sessionIdRef.current) {
        window.shell.write(sessionIdRef.current, data);
      }
    });

    // Handle resize
    terminal.onResize(({ cols, rows }) => {
      if (sessionIdRef.current) {
        window.shell.resize(sessionIdRef.current, cols, rows);
      }
    });

    // Handle Ctrl+Shift+V for paste
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        navigator.clipboard.readText().then((text) => {
          if (text && sessionIdRef.current) {
            window.shell.write(sessionIdRef.current, text);
          }
        });
      }
      // Also handle Ctrl+V
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'v') {
        e.preventDefault();
        navigator.clipboard.readText().then((text) => {
          if (text && sessionIdRef.current) {
            window.shell.write(sessionIdRef.current, text);
          }
        });
      }
    };

    terminalRef.current?.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      terminalRef.current?.removeEventListener('keydown', handleKeyDown);
      terminal.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      fitAddonRef.current?.fit();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize session
  useEffect(() => {
    if (!isReady || !xtermRef.current) return;
    if (sessionIdRef.current && !shouldReset) return; // Already have session

    const initSession = async () => {
      try {
        const terminal = xtermRef.current!;

        // Create shell session
        const sessionId = await window.shell.create(bypassMode, workingDir || undefined);
        sessionIdRef.current = sessionId;
        onSessionCreated(sessionId);

        // Fit terminal
        fitAddonRef.current?.fit();
        const { cols, rows } = terminal;
        await window.shell.resize(sessionId, cols, rows);

        terminal.focus();
      } catch (err) {
        console.error('Failed to create session:', err);
        xtermRef.current?.writeln(`\x1b[31mFailed to start Claude: ${err}\x1b[0m`);
      }
    };

    initSession();
  }, [isReady, bypassMode, shouldReset, onSessionCreated]);

  // Listen for shell data
  useEffect(() => {
    const cleanup = window.shell.onData((sessionId, data) => {
      if (sessionId === sessionIdRef.current) {
        xtermRef.current?.write(data);
      }
    });

    return cleanup;
  }, []);

  // Listen for shell exit
  useEffect(() => {
    const cleanup = window.shell.onExit((sessionId, exitCode) => {
      if (sessionId === sessionIdRef.current) {
        xtermRef.current?.writeln(`\x1b[33m\nSession exited with code ${exitCode}\x1b[0m`);
        sessionIdRef.current = null;
        onSessionCreated(null as any);
      }
    });

    return cleanup;
  }, [onSessionCreated]);

  // Handle right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={terminalRef}
        className="w-full h-full"
        onContextMenu={handleContextMenu}
      />
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleCopy}
            className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700"
          >
            Copy
          </button>
          <button
            onClick={handlePaste}
            className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700"
          >
            Paste
          </button>
        </div>
      )}
    </div>
  );
}

export default Terminal;
