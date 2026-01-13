export {};

declare global {
  interface Window {
    shell: {
      create: (bypassMode: boolean, workingDir?: string) => Promise<string>;
      write: (sessionId: string, data: string) => Promise<void>;
      resize: (sessionId: string, cols: number, rows: number) => Promise<void>;
      kill: (sessionId: string) => Promise<void>;
      onData: (callback: (sessionId: string, data: string) => void) => () => void;
      onExit: (callback: (sessionId: string, exitCode: number) => void) => () => void;
    };
    store: {
      getBypass: () => Promise<boolean>;
      setBypass: (value: boolean) => Promise<void>;
      getWorkingDir: () => Promise<string | null>;
      setWorkingDir: (value: string | null) => Promise<void>;
    };
  }
}
