import { useState, useEffect } from 'react';
import Terminal from './components/Terminal';

function App() {
  const [bypassMode, setBypassMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Load bypass mode setting on mount
  useEffect(() => {
    window.store.getBypass().then(setBypassMode).catch(console.error);
  }, []);

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
              Dangerously Bypass Approvals
            </label>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition"
        >
          Reset Session
        </button>
      </div>

      {/* Terminal */}
      <div className="flex-1 overflow-hidden">
        <Terminal
          bypassMode={bypassMode}
          onSessionCreated={setSessionId}
          shouldReset={sessionId === null}
        />
      </div>
    </div>
  );
}

export default App;
