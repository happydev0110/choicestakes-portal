"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { useText } from "../../i18n/use-text";
import { HeroCarousel } from "../components/hero-carousel";
import { CasinoCategoryNav } from "../components/casino-category-nav";
import { useSite } from "../components/site-shell";
import { gamingRequest, type ProviderCatalogData } from "../lib/gaming";
import { ProviderGameGrid } from "./provider-cards";
import { CatalogAvailability, collectionIsEmpty, usePendingCatalogRefresh } from "./catalog-availability";
import "./provider-games.css";
import "./casino.css";
import "./casino-category.css";

export function CasinoCategory({ title, category }: { title: string; category: string }) {
  const t = useText();
  const { navigate } = useSite();
  const [search, setSearch] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [data, setData] = useState<ProviderCatalogData | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<ProviderCatalogData["categoryCounts"]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const moreRequest = useRef<AbortController | null>(null);
  usePendingCatalogRefresh(data, error, setRetry);

  useEffect(() => {
    const restore = () => {
      setSearch((new URLSearchParams(window.location.search).get("search") ?? "").slice(0, 100));
      setInitialized(true);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  function updateSearch(value: string) {
    setSearch(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("search", value);
    else url.searchParams.delete("search");
    for (const key of ["page", "provider", "sort"]) url.searchParams.delete(key);
    window.history.replaceState(null, "", url);
  }

  useEffect(() => {
    if (!initialized) return;
    const controller = new AbortController();
    moreRequest.current?.abort();
    moreRequest.current = null;
    setLoadingMore(false);
    setMoreError(false);
    setLoading(true);
    setData(null);
    setError("");
    const timer = setTimeout(() => {
      const query = new URLSearchParams({ category, search: search.trim(), page: "1" });
      gamingRequest<ProviderCatalogData>(`games?${query}`, undefined, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) {
            setData(result);
            setCategoryCounts(result.categoryCounts);
          }
        })
        .catch(() => { if (!controller.signal.aborted) setError("Unable to load games."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, search ? 250 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
      moreRequest.current?.abort();
      moreRequest.current = null;
    };
  }, [initialized, category, search, retry]);

  async function loadMore() {
    if (!data || loading || moreRequest.current || data.page * data.perPage >= data.total) return;
    const controller = new AbortController();
    moreRequest.current = controller;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const query = new URLSearchParams({ category, search: search.trim(), page: String(data.page + 1) });
      const next = await gamingRequest<ProviderCatalogData>(`games?${query}`, undefined, controller.signal);
      if (controller.signal.aborted) return;
      // Updates can shift catalog page boundaries: show each game once. If the
      // server clamps the page after removals, use its refreshed page instead.
      const games = next.page <= data.page ? next.games : [...new Map([...data.games, ...next.games].map((game) => [game.uuid, game])).values()];
      setData({ ...next, games });
    } catch {
      if (!controller.signal.aborted) setMoreError(true);
    } finally {
      if (!controller.signal.aborted) {
        moreRequest.current = null;
        setLoadingMore(false);
      }
    }
  }

  return (
    <section className="casino-category-page" aria-label={t(title)}>
      <h1 className="sr-only">{t(title)}</h1>
      <HeroCarousel onChoose={navigate} />
      <label className="casino-search">
        <Search size={18} aria-hidden="true" />
        <input type="search" aria-label={t("Search games")} placeholder={t("Search games")} value={search} maxLength={100} onChange={(event) => updateSearch(event.target.value)} />
        {search && <button type="button" aria-label={t("Clear search")} onClick={() => updateSearch("")}><X size={18} /></button>}
      </label>
      <CasinoCategoryNav active={category} counts={categoryCounts} />
      <div className="casino-category-results" aria-busy={loading}>
        {error ? (
          <div className="panel provider-empty" role="alert">
            <h2>{t("Games temporarily unavailable")}</h2>
            <p>{t(error)}</p>
            <button className="secondary" onClick={() => setRetry((value) => value + 1)}>{t("Try again")}</button>
          </div>
        ) : loading ? (
          <div className="catalog-grid category-skeletons" role="status">
            <span className="sr-only">{t("Loading games…")}</span>
            {Array.from({ length: 14 }, (_, index) => <div className="category-skeleton" key={index} aria-hidden="true" />)}
          </div>
        ) : !data?.configured || collectionIsEmpty(data) ? (
          data ? <CatalogAvailability data={data} onRetry={() => setRetry((value) => value + 1)} /> : null
        ) : !data.games.length ? (
          <div className="panel provider-empty" role="status">
            <Search size={38} aria-hidden="true" />
            <h2>{t(search ? "No matching games" : "No games in this category yet")}</h2>
            <p>{t(search ? "Try another search or provider." : "Explore All Games while this collection is being organized.")}</p>
            {search && <button className="secondary" onClick={() => updateSearch("")}>{t("Clear search")}</button>}
            <Link className="secondary" href="/all-games">{t("All Games")}</Link>
          </div>
        ) : (
          <>
            {data.catalog?.status === "stale" && <p className="provider-availability">{t("Showing the last available collection while updates are temporarily unavailable.")}</p>}
            <p className="sr-only" role="status">{t("{count, plural, one {# game} other {# games}}", { count: data.total })}</p>
            <ProviderGameGrid games={data.games} />
            {data.page * data.perPage < data.total && (
              <div className="category-load-more">
                {moreError && <p role="alert">{t("Unable to load games.")}</p>}
                <button className="secondary" disabled={loadingMore} onClick={loadMore}>
                  {loadingMore && <LoaderCircle size={16} className="category-loading-icon" aria-hidden="true" />}
                  {t(loadingMore ? "Loading games…" : moreError ? "Try again" : "Load more games")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
