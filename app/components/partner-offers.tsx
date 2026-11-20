"use client";

import { useEffect, useState } from "react";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import styles from "./partner-offers.module.css";

type Offer = {
  id: string;
  merchant: string;
  title: string;
  description: string;
  imageUrl: string | null;
  affiliateUrl: string;
};
type OfferPage = {
  items: Offer[];
  total: number;
  page: number;
  perPage: number;
};

function Artwork({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false);
  return url && !failed ? (
    <img
      className={styles.artwork}
      src={url}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className={styles.icon} aria-hidden="true">
      <ShoppingBag size={26} />
    </div>
  );
}

export function PartnerOffers() {
  const t = useTranslations("ui");
  const [items, setItems] = useState<Offer[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let active = true;
    setLoading(true);
    setError(false);
    void fetch(`/api/partner-offers?page=${page}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json();
        if (
          !response.ok ||
          !result.success ||
          !Array.isArray(result.data?.items)
        )
          throw new Error("Unavailable");
        const data: OfferPage = result.data;
        if (!active) return;
        setItems((previous) =>
          page === 1
            ? data.items
            : [
                ...new Map(
                  [...previous, ...data.items].map((item) => [item.id, item]),
                ).values(),
              ],
        );
        setHasMore(data.page * data.perPage < data.total);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        clearTimeout(timer);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [page, retry]);

  if (!loading && !error && items.length === 0) return null;
  return (
    <section
      className={styles.section}
      aria-labelledby="partner-offers-heading"
      aria-busy={loading}
    >
      <h2 id="partner-offers-heading">{t("partnerOffers")}</h2>
      <div className={styles.list}>
        {items.map((offer) => (
          <article className={styles.card} key={offer.id}>
            <Artwork key={offer.imageUrl} url={offer.imageUrl} />
            <div className={styles.copy}>
              <span className={styles.badge}>
                {t("partnerAffiliateLink")} · {offer.merchant}
              </span>
              <h3>{offer.title}</h3>
              {offer.description ? <p>{offer.description}</p> : null}
            </div>
            <div className={styles.actions}>
              <a
                href={offer.affiliateUrl}
                target="_blank"
                rel="sponsored noopener"
                className={`primary ${styles.link}`}
                aria-describedby={`partner-new-tab-${offer.id} partner-disclosure-${offer.id}`}
              >
                {t("partnerViewOffer")}{" "}
                <ExternalLink size={17} aria-hidden="true" />
              </a>
              <span
                id={`partner-new-tab-${offer.id}`}
                className={styles.newTab}
              >
                {t("partnerOpensNewTab")}
              </span>
            </div>
            <p
              id={`partner-disclosure-${offer.id}`}
              className={styles.disclosure}
            >
              {t("partnerDisclosure")}
            </p>
          </article>
        ))}
      </div>
      {loading && (
        <p className={styles.feedback} role="status">
          {t("partnerLoading")}
        </p>
      )}
      {error && (
        <div className={styles.feedback} role="alert">
          <p>{t("partnerUnavailable")}</p>
          <button
            className="secondary"
            onClick={() => setRetry((value) => value + 1)}
          >
            {t("tryAgain")}
          </button>
        </div>
      )}
      {!loading && !error && hasMore && (
        <button
          className={`secondary ${styles.feedback}`}
          onClick={() => setPage((value) => value + 1)}
        >
          {t("partnerLoadMore")}
        </button>
      )}
    </section>
  );
}
