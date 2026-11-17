type Source = Pick<EventSource, "addEventListener" | "close">;
type Options = {
  refresh: () => void;
  expired: () => void;
  connected: (value: boolean) => void;
  createSource?: (url: string) => Source;
  page?: Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;
  network?: Pick<Window, "addEventListener" | "removeEventListener">;
};

export function connectWalletEvents({ refresh, expired, connected,
  createSource = (url) => new EventSource(url), page = document, network = window,
}: Options) {
  let source: Source | null = null;
  let stopped = false;
  let sessionExpired = false;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let attempts = 0;
  let checkedAuth = false;
  const disconnect = () => {
    clearTimeout(retry);
    const previous = source;
    source = null;
    previous?.close();
    connected(false);
  };
  const connect = () => {
    if (source || stopped || sessionExpired || page.visibilityState !== "visible") return;
    let current: Source;
    try { current = createSource("/api/gaming/wallet/events"); }
    catch { connected(false); return; }
    source = current;
    const isCurrent = () => !stopped && source === current;
    current.addEventListener("wallet.ready", () => {
      if (!isCurrent()) return;
      connected(true);
      attempts = 0;
      checkedAuth = false;
      // Runs after subscription, on every reconnect, to cover missed events.
      refresh();
    });
    current.addEventListener("wallet.updated", () => { if (isCurrent()) refresh(); });
    current.addEventListener("session.expired", () => {
      if (!isCurrent()) return;
      sessionExpired = true;
      disconnect();
      expired();
    });
    current.addEventListener("error", () => {
      if (!isCurrent()) return;
      disconnect();
      // HTTP failures can leave native EventSource permanently closed. Retry
      // the connection with backoff, without polling balances during an outage.
      if (!checkedAuth) { checkedAuth = true; expired(); }
      const delay = Math.min(1000 * 2 ** Math.min(attempts++, 5), 30000) + Math.random() * 500;
      retry = setTimeout(connect, delay);
    });
  };
  const visible = () => {
    if (page.visibilityState === "visible") { refresh(); connect(); }
    else disconnect();
  };
  const online = () => { disconnect(); attempts = 0; connect(); };
  page.addEventListener("visibilitychange", visible);
  network.addEventListener("online", online);
  connect();
  return () => {
    stopped = true;
    page.removeEventListener("visibilitychange", visible);
    network.removeEventListener("online", online);
    disconnect();
  };
}
