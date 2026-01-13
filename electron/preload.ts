import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('shell', {
  create: (bypassMode: boolean, workingDir?: string) =>
    ipcRenderer.invoke('shell:create', bypassMode, workingDir),
  write: (sessionId: string, data: string) =>
    ipcRenderer.invoke('shell:write', sessionId, data),
  resize: (sessionId: string, cols: number, rows: number) =>
    ipcRenderer.invoke('shell:resize', sessionId, cols, rows),
  kill: (sessionId: string) =>
    ipcRenderer.invoke('shell:kill', sessionId),
  onData: (callback: (sessionId: string, data: string) => void) => {
    const listener = (_: any, sessionId: string, data: string) => callback(sessionId, data);
    ipcRenderer.on('shell:data', listener);
    return () => ipcRenderer.removeListener('shell:data', listener);
  },
  onExit: (callback: (sessionId: string, exitCode: number) => void) => {
    const listener = (_: any, sessionId: string, exitCode: number) => callback(sessionId, exitCode);
    ipcRenderer.on('shell:exit', listener);
    return () => ipcRenderer.removeListener('shell:exit', listener);
  },
});

contextBridge.exposeInMainWorld('store', {
  getBypass: () => ipcRenderer.invoke('store:get-bypass'),
  setBypass: (value: boolean) => ipcRenderer.invoke('store:set-bypass', value),
  getWorkingDir: () => ipcRenderer.invoke('store:get-working-dir'),
  setWorkingDir: (value: string | null) => ipcRenderer.invoke('store:set-working-dir', value),
});
