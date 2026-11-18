"use client";
import { useText } from "../../i18n/use-text";

import Link from "next/link";
import { Coins, Plus } from "lucide-react";
import { usePlayer } from "./player-auth";
import { useGameWallet } from "./game-wallet";
import { useWalletModal } from "./wallet-modal";
import styles from "./balance-control.module.css";

export function BalanceControl({
  walletLink = true,
  onDeposit,
}: {
  walletLink?: boolean;
  onDeposit?: () => void;
}) {
  const t = useText();
  const { player, loading } = usePlayer();
  const { wallet, error, liveUpdates } = useGameWallet();
  const { openWallet, request } = useWalletModal();
  if (loading || !player) return null;

  const currencySymbol = wallet
    ? ({ USD: "$", EUR: "€", GBP: "£" } as Record<string, string>)[wallet.currency]
    : null;
  const label = wallet ? `Game balance: ${wallet.balance} ${wallet.currency}${liveUpdates ? "" : " (live updates reconnecting)"}`
    : error ? "Game balance unavailable" : "Loading game balance";
  const value = <>
    <span className={styles.currency} aria-hidden="true">{currencySymbol ?? <Coins size={14} />}</span>
    <span className={styles.amount}>{wallet?.balance ?? (error ? "—" : "…")}</span>
  </>;

  return <div className={styles.balance}>
    {walletLink ? (
      <Link href="/account/wallet" className={styles.value} aria-label={label} title={label}>
        {value}
      </Link>
    ) : (
      <span className={styles.value} role="group" aria-label={label} title={label}>
        {value}
      </span>
    )}
    <button type="button" className={styles.addFunds} aria-label="Open deposit wallet" title={t("Deposit")}
      aria-haspopup="dialog" aria-expanded={Boolean(request)}
      onClick={(event) => { onDeposit?.(); openWallet(event.currentTarget); }}>
      <Plus size={23} strokeWidth={3} aria-hidden="true" />
    </button>
  </div>;
}
