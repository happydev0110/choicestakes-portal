// Coalesce bursts while preserving one fetch after the latest notification.
// Never cancel an in-flight read just because another wallet event arrived.
export function createWalletRefreshQueue(load: () => Promise<void>) {
  let running = false;
  let pending = false;
  let stopped = false;
  const flush = async () => {
    if (running || stopped) return;
    running = true;
    try {
      while (pending && !stopped) {
        pending = false;
        try { await load(); } catch { /* The caller owns its error display. */ }
      }
    } finally { running = false; }
  };
  return {
    refresh() { if (!stopped) { pending = true; void flush(); } },
    stop() { stopped = true; pending = false; },
  };
}
