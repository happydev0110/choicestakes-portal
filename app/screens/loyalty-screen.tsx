"use client";

import Link from "next/link";
import { useEffect, useId, useState, type CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  Gift,
  LockKeyhole,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { usePlayer } from "../components/player-auth";
import type { LoyaltyData, TierCode } from "../lib/loyalty";
import styles from "./loyalty.module.css";

const palette: Record<TierCode, string> = {
  basic: "#a7c8f1",
  bronze: "#dc9b66",
  silver: "#dbe6f4",
  gold: "#f4d15f",
  platinum: "#7ad8cb",
  diamond: "#78caff",
};
const tierOrder: TierCode[] = [
  "basic",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
];

// Original vector badges stay crisp at every breakpoint and need no remote assets.
function RankBadge({ tier }: { tier: TierCode }) {
  const id = useId().replaceAll(":", "");
  const rank = tierOrder.indexOf(tier);
  return (
    <svg viewBox="0 0 160 170" className={styles.badge} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".3" stopColor={palette[tier]} />
          <stop offset=".5" stopColor="#fff" />
          <stop offset=".56" stopColor={palette[tier]} />
          <stop offset="1" stopColor="#263e5d" />
        </linearGradient>
        <radialGradient id={`${id}-core`}>
          <stop stopColor="#29496a" />
          <stop offset="1" stopColor="#081627" />
        </radialGradient>
      </defs>
      <path
        d="M44 113 29 158 59 148 75 165 83 118M116 113 131 158 101 148 85 165 77 118"
        fill={palette[tier]}
        opacity=".55"
      />
      <path
        d="m80 6 18 25 30 1 2 30 24 19-18 24-3 30-31 3-22 24-22-24-31-3-3-30L6 81l24-19 2-30 30-1Z"
        fill={`url(#${id}-metal)`}
        stroke="#081629"
        strokeWidth="3"
      />
      <path
        d="m80 22 16 20 24 2 3 25 16 13-13 21-3 22-25 4-18 18-18-18-25-4-3-22-13-21 16-13 3-25 24-2Z"
        fill="#102239"
        stroke={palette[tier]}
        strokeWidth="2"
      />
      <circle
        cx="80"
        cy="83"
        r="43"
        fill={`url(#${id}-core)`}
        stroke={`url(#${id}-metal)`}
        strokeWidth="5"
      />
      <path d="m60 67 4 12h32l4-12-12 7-8-15-8 15Z" fill={palette[tier]} />
      <text
        x="80"
        y="107"
        textAnchor="middle"
        fill="#edf7ff"
        fontSize="30"
        fontWeight="800"
        fontFamily="Arial, sans-serif"
        letterSpacing="-2"
      >
        CS
      </text>
      {Array.from({ length: rank + 1 }, (_, i) => (
        <circle
          key={i}
          cx={80 + (i - rank / 2) * 9}
          cy="132"
          r="2.3"
          fill={palette[tier]}
        />
      ))}
    </svg>
  );
}

export function LoyaltyScreen() {
  const t = useTranslations("loyalty");
  const locale = useLocale();
  const { player, loading: authLoading, refresh: refreshAuth } = usePlayer();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    owner: string;
    data?: LoyaltyData;
    error?: "unavailable" | "expired";
  } | null>(null);
  const [pending, setPending] = useState(true);
  const owner = player?.id ?? "guest";
  const data = result?.owner === owner ? result.data : undefined;
  const error = result?.owner === owner ? result.error : undefined;
  const progress = data?.player;
  const number = (value: string | number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
      Number(value),
    );
  const name = (code: TierCode) => t(`tiers.${code}`);

  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    setPending(true);
    void (async () => {
      try {
        const response = await fetch(
          `/api/loyalty/${owner === "guest" ? "tiers" : "me"}`,
          {
            cache: "no-store",
            credentials: "same-origin",
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
          },
        );
        if (response.status === 401) {
          if (!controller.signal.aborted) {
            setResult({ owner, error: "expired" });
            void refreshAuth();
          }
          return;
        }
        const payload = await response.json();
        if (!response.ok || !payload.success)
          throw new Error("Loyalty unavailable");
        if (!controller.signal.aborted)
          setResult({ owner, data: payload.data });
      } catch {
        if (!controller.signal.aborted)
          setResult({ owner, error: "unavailable" });
      } finally {
        if (!controller.signal.aborted) setPending(false);
      }
    })();
    return () => controller.abort();
  }, [owner, authLoading, revision, refreshAuth]);
  useEffect(() => {
    const visible = () => {
      if (document.visibilityState === "visible")
        setRevision((value) => value + 1);
    };
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, []);

  const range = (tier: LoyaltyData["tiers"][number]) =>
    tier.maxXp === null
      ? t("rangePlus", { from: number(tier.minXp) })
      : t("range", { from: number(tier.minXp), to: number(tier.maxXp) });
  const currentIndex = progress ? tierOrder.indexOf(progress.tier) : -1;
  const accent = (code: TierCode) =>
    ({ "--rank-color": palette[code] }) as CSSProperties;

  return (
    <div className={`page-wrap ${styles.page}`}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>
            <Sparkles size={13} />
            {t("eyebrow")}
          </span>
          <h1>{t("title")}</h1>
          <p>{t("intro")}</p>
        </div>
        <a className={styles.howLink} href="#loyalty-how">
          {t("how")}
          <ArrowRight size={15} />
        </a>
      </header>

      <section
        className={styles.hero}
        aria-label={t("yourProgress")}
        aria-busy={authLoading || pending}
        style={accent(progress?.tier ?? "gold")}
      >
        {authLoading || (!data && !error) ? (
          <div className={styles.loading} role="status">
            <span className={styles.spinner} />
            {t("loading")}
          </div>
        ) : error ? (
          <div className={styles.error} role="alert">
            <h2>{t(error)}</h2>
            <p>{t("errorHint")}</p>
            <button
              className="secondary"
              onClick={() => setRevision((value) => value + 1)}
              disabled={pending}
            >
              <RefreshCw size={16} />
              {t("retry")}
            </button>
          </div>
        ) : progress ? (
          <>
            <div className={styles.heroBadge}>
              <RankBadge tier={progress.tier} />
            </div>
            <div className={styles.heroBody}>
              <div className={styles.identity}>
                <span className={styles.currentPill}>
                  {name(progress.tier)}
                </span>
                <span>{player?.displayName}</span>
              </div>
              <h2>
                {progress.nextTier
                  ? t("nextTarget", {
                      xp: number(progress.xpToNext),
                      tier: name(progress.nextTier),
                    })
                  : t("highest")}
              </h2>
              <div className={styles.progressLabels}>
                <span>{t("earned", { xp: number(progress.xp) })}</span>
                <span>{number(progress.progressPercent)}%</span>
              </div>
              <div
                className={styles.track}
                role="progressbar"
                aria-label={t("yourProgress")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress.progressPercent}
              >
                <span style={{ width: `${progress.progressPercent}%` }} />
              </div>
              <div className={styles.progressLabels}>
                <span>{name(progress.tier)}</span>
                <span>
                  {progress.nextTier ? name(progress.nextTier) : t("highest")}
                </span>
              </div>
            </div>
            <div className={styles.memberCard}>
              <span>CHOICESTAKES</span>
              <strong>{name(progress.tier)}</strong>
              <small>{t("member")}</small>
            </div>
          </>
        ) : (
          <>
            <div className={styles.heroBadge}>
              <RankBadge tier="gold" />
            </div>
            <div className={styles.heroBody}>
              <span className={styles.eyebrow}>{t("guestEyebrow")}</span>
              <h2>{t("guestTitle")}</h2>
              <p>{t("guestIntro")}</p>
              <Link href="/login?next=%2Floyalty-tiers" className="primary">
                {t("login")}
                <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}
      </section>

      {data && (
        <>
          <div className={styles.climbHeading}>
            <h2>{t("climb")}</h2>
            <button
              onClick={() => setRevision((value) => value + 1)}
              disabled={pending}
              className={styles.refresh}
            >
              <RefreshCw
                size={14}
                className={pending ? styles.spinning : undefined}
              />
              {t("refresh")}
            </button>
          </div>
          <nav className={styles.timeline} aria-label={t("tierNavigation")}>
            {data.tiers.map((tier, index) => (
              <a
                key={tier.code}
                href={`#loyalty-${tier.code}`}
                style={accent(tier.code)}
                aria-current={progress?.tier === tier.code ? "step" : undefined}
                className={index <= currentIndex ? styles.reached : ""}
              >
                <span className={styles.node}>
                  {index < currentIndex && <Check size={13} />}
                </span>
                <strong>{name(tier.code)}</strong>
                <small>{t("from", { xp: number(tier.minXp) })}</small>
              </a>
            ))}
          </nav>
          <div className={styles.grid}>
            {data.tiers.map((tier, index) => {
              const current = progress?.tier === tier.code;
              const reached = currentIndex > index;
              const status = current
                ? "current"
                : reached
                  ? "unlocked"
                  : "locked";
              return (
                <article
                  key={tier.code}
                  id={`loyalty-${tier.code}`}
                  className={`${styles.card} ${current ? styles.active : ""}`}
                  style={accent(tier.code)}
                >
                  <div className={styles.cardBanner}>
                    <div>
                      <span className={styles.cardLabel}>
                        {progress ? (
                          <>
                            {status === "locked" && <LockKeyhole size={10} />}
                            {t(status)}
                          </>
                        ) : (
                          t("tier")
                        )}
                      </span>
                      <h2>{name(tier.code)}</h2>
                    </div>
                    <RankBadge tier={tier.code} />
                  </div>
                  <div className={styles.range}>{range(tier)}</div>
                  <div className={styles.benefit}>
                    <Gift size={17} />
                    <div>
                      <h3>{t("rewards")}</h3>
                      <p>{t("comingSoon")}</p>
                    </div>
                  </div>
                  <p className={styles.benefitNote}>{t("benefitNote")}</p>
                  <div className={styles.cardFooter}>
                    <span>{t("from", { xp: number(tier.minXp) })}</span>
                    <span>
                      {progress
                        ? current
                          ? `${number(progress.progressPercent)}%`
                          : t(reached ? "achieved" : "notStarted")
                        : "—"}
                    </span>
                  </div>
                  <div className={styles.miniTrack} aria-hidden="true">
                    <span
                      style={{
                        width: `${reached ? 100 : current ? progress!.progressPercent : 0}%`,
                      }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <section id="loyalty-how" className={styles.howSection}>
        <span className={styles.eyebrow}>{t("how")}</span>
        <h2>{t("howTitle")}</h2>
        <div className={styles.explainer}>
          <div>
            <span>01</span>
            <h3>{t("howXpTitle")}</h3>
            <p>{t("howXp")}</p>
          </div>
          <div>
            <span>02</span>
            <h3>{t("howTierTitle")}</h3>
            <p>{t("howTier")}</p>
          </div>
          <div>
            <span>03</span>
            <h3>{t("howRewardsTitle")}</h3>
            <p>{t("howRewards")}</p>
          </div>
        </div>
        <p className={styles.sandboxNote}>{t("sandboxNote")}</p>
      </section>
    </div>
  );
}
