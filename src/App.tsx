import { useState, useEffect } from 'react';
import Terminal from './components/Terminal';

function App() {
  const [bypassMode, setBypassMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [workingDir, setWorkingDir] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    window.store.getBypass().then(setBypassMode).catch(console.error);
    window.store.getWorkingDir().then(setWorkingDir).catch(console.error);
  }, []);

  // Select folder
  const handleSelectFolder = async () => {
    const dir = await window.shell.selectDirectory();
    if (dir) {
      setWorkingDir(dir);
      await window.store.setWorkingDir(dir);
      // Reset session to use new directory
      if (sessionId) {
        await window.shell.kill(sessionId);
        setSessionId(null);
      }
    }
  };

  // Toggle bypass mode
  const handleToggleBypass = async () => {
    const newValue = !bypassMode;
    setBypassMode(newValue);
    await window.store.setBypass(newValue);

    // Kill existing session
    if (sessionId) {
      await window.shell.kill(sessionId);
      setSessionId(null);
    }
  };

  // Reset session
  const handleReset = async () => {
    if (sessionId) {
      await window.shell.kill(sessionId);
      setSessionId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header with controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-claude-blue">Custom Claude Terminal</h1>

          {/* Folder Picker */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectFolder}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition"
            >
              Browse
            </button>
            <span className="text-sm text-gray-400 max-w-xs truncate">
              {workingDir || '(no folder selected)'}
            </span>
          </div>

          {/* Bypass Mode Radio */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">
              <input
                type="radio"
                checked={!bypassMode}
                onChange={() => !bypassMode || handleToggleBypass()}
                className="mr-1"
              />
              Normal
            </label>
            <label className="text-sm text-gray-300">
              <input
                type="radio"
                checked={bypassMode}
                onChange={() => bypassMode || handleToggleBypass()}
                className="mr-1"
              />
              Bypass
            </label>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition"
        >
          Reset
        </button>
      </div>

      {/* Terminal */}
      <div className="flex-1 overflow-hidden">
        <Terminal
          bypassMode={bypassMode}
          workingDir={workingDir}
          onSessionCreated={setSessionId}
          shouldReset={sessionId === null}
        />
      </div>
    </div>
  );
}

export default App;
