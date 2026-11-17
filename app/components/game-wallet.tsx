"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gamingRequest, type SandboxWalletData } from "../lib/gaming";
import { usePlayer } from "./player-auth";
import { connectWalletEvents } from "../lib/wallet-events";
import { createWalletRefreshQueue } from "../lib/wallet-refresh";

type WalletState = {
  owner: string | null;
  wallet: SandboxWalletData | null;
  loading: boolean;
  error: string;
};
const empty: WalletState = { owner: null, wallet: null, loading: false, error: "" };
const WalletContext = createContext({ ...empty, liveUpdates: false, refresh: () => {} });
export const useGameWallet = () => useContext(WalletContext);

// One wallet request supplies the header, wallet screen, and recent game activity.
export function GameWalletProvider({ children }: { children: React.ReactNode }) {
  const { player, loading: sessionLoading, refresh: refreshPlayer } = usePlayer();
  const playerId = player?.id ?? null;
  const pathname = usePathname();
  const [state, setState] = useState<WalletState>(empty);
  const [liveUpdates, setLiveUpdates] = useState(false);
  const refreshWallet = useRef(() => {});
  const refresh = useCallback(() => refreshWallet.current(), []);

  useEffect(() => {
    if (!playerId || sessionLoading) {
      setState(empty);
      return;
    }
    let active = true;
    let controller: AbortController | null = null;
    const queue = createWalletRefreshQueue(async () => {
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 10000);
      setState((previous) => ({
        owner: playerId,
        wallet: previous.owner === playerId ? previous.wallet : null,
        loading: true,
        error: "",
      }));
      try {
        const wallet = await gamingRequest<SandboxWalletData>("wallet", undefined, controller.signal);
        if (active) setState({ owner: playerId, wallet, loading: false, error: "" });
      } catch (error) {
        if (active) setState({
          owner: playerId, wallet: null, loading: false,
          error: "Game balance is temporarily unavailable. Please try again.",
        });
        if (active && error instanceof Error && "status" in error && error.status === 401) void refreshPlayer();
      } finally { window.clearTimeout(timeout); }
    });
    refreshWallet.current = queue.refresh;
    queue.refresh();
    return () => {
      active = false;
      refreshWallet.current = () => {};
      queue.stop();
      controller?.abort();
    };
  }, [playerId, sessionLoading, refreshPlayer]);

  useEffect(() => { refresh(); }, [pathname, refresh]);

  useEffect(() => {
    if (!playerId || sessionLoading) return;
    return connectWalletEvents({ refresh, expired: () => { void refreshPlayer(); }, connected: setLiveUpdates });
  }, [playerId, sessionLoading, refresh, refreshPlayer]);

  // Never expose the preceding account's balance while an account switch settles.
  const current = state.owner === playerId && !sessionLoading
    ? state : { ...empty, loading: Boolean(playerId) || sessionLoading };
  return <WalletContext.Provider value={{ ...current, liveUpdates: Boolean(playerId) && !sessionLoading && liveUpdates, refresh }}>{children}</WalletContext.Provider>;
}
