"use client";
import { useText } from "../../i18n/use-text";
import { CasinoCategoryNav } from "../components/casino-category-nav";
import { casinoCategories as categories } from "../lib/casino-categories";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import {
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Search,
  X,
} from "lucide-react";
import {
  gamingRequest,
  type ProviderCatalogData,
  type ProviderGame,
  type ProviderLobbyData,
} from "../lib/gaming";
import { ProviderGameCard, ProviderGameGrid } from "./provider-cards";
import {
  CatalogAvailability,
  collectionIsEmpty,
  usePendingCatalogRefresh,
} from "./catalog-availability";
import "swiper/css";
import "swiper/css/a11y";
import "./provider-games.css";
import "./casino.css";

const rows = [
  { category: "featured", title: "Featured Games", icon: "" },
  ...categories,
  { category: "new-games", title: "New Games", icon: "" },
  { category: "roulette", title: "Roulette", icon: "" },
  { category: "poker", title: "Poker", icon: "" },
];

function CasinoRow({
  title,
  category,
  icon,
  total,
  games,
  pending = false,
  unavailable = false,
}: {
  title: string;
  category: string;
  icon?: string;
  total: number;
  games: ProviderGame[];
  pending?: boolean;
  unavailable?: boolean;
}) {
  const t = useText();
  const slider = useRef<SwiperInstance | null>(null);
  const [canSlide, setCanSlide] = useState({ left: false, right: false });
  function updateNavigation(instance: SwiperInstance) {
    setCanSlide({
      left: !instance.isLocked && !instance.isBeginning,
      right: !instance.isLocked && !instance.isEnd,
    });
  }
  function slide(direction: "previous" | "next") {
    const instance = slider.current;
    if (!instance || instance.destroyed) return;
    const speed = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 350;
    if (direction === "previous") instance.slidePrev(speed);
    else instance.slideNext(speed);
  }
  return (
    <section
      className="casino-game-section"
      aria-labelledby={`casino-${category}-heading`}
    >
      <div className="casino-row-heading">
        <h2 id={`casino-${category}-heading`}>
          {icon ? (
            <img src={`/assets/${icon}`} alt="" />
          ) : (
            <Gamepad2 size={23} />
          )}
          {t(title)}
        </h2>
        <div className="casino-row-actions">
          {total > 0 && (
            <Link href={`/${category}`} aria-label={t("View all {category}", {category: t(title)})}>{t("View all")} <span className="casino-row-count">({total})</span>
            </Link>
          )}
          <button
            aria-label={t("Previous {category}", {category: t(title)})}
            aria-controls={pending || games.length ? `casino-${category}-slider` : undefined}
            disabled={!canSlide.left || pending || !games.length}
            onClick={() => slide("previous")}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label={t("Next {category}", {category: t(title)})}
            aria-controls={pending || games.length ? `casino-${category}-slider` : undefined}
            disabled={!canSlide.right || pending || !games.length}
            onClick={() => slide("next")}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      {pending ? (
        <div
          id={`casino-${category}-slider`}
          className="casino-row-skeletons"
          role="status"
          aria-label={t("Loading games…")}
        >
          {Array.from({ length: 12 }, (_, index) => (
            <div className="casino-card-skeleton" key={index} aria-hidden="true" />
          ))}
        </div>
      ) : games.length ? (
        <Swiper
          id={`casino-${category}-slider`}
          className="casino-game-swiper casino-provider-track"
          modules={[A11y]}
          slidesPerView="auto"
          slidesPerGroupAuto
          spaceBetween={11}
          breakpoints={{ 1024: { spaceBetween: 22 } }}
          speed={350}
          grabCursor
          watchOverflow
          watchSlidesProgress
          a11y={{
            containerMessage: t(title),
            containerRoleDescriptionMessage: "carousel",
            itemRoleDescriptionMessage: "slide",
          }}
          onSwiper={(instance) => {
            slider.current = instance;
            updateNavigation(instance);
          }}
          onSlideChange={updateNavigation}
          onSlidesUpdated={updateNavigation}
          onResize={updateNavigation}
          onLock={updateNavigation}
          onUnlock={updateNavigation}
          onBeforeDestroy={() => { slider.current = null; }}
        >
          {games.map((game) => (
            <SwiperSlide key={game.uuid}>
              <ProviderGameCard game={game} />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <p className="casino-category-empty">
          {t(unavailable ? "This collection is temporarily unavailable." : "No games available in this category yet.")}{" "}
          <Link href="/all-games">{t("Browse all games")}</Link>
        </p>
      )}
    </section>
  );
}

export function CasinoLobby({
  initialData = null,
  initialError = "",
  pending = false,
}: {
  initialData?: ProviderLobbyData | null;
  initialError?: string;
  pending?: boolean;
}) {
  const t = useText();
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(!initialData && !initialError);
  const [retry, setRetry] = useState(0);
  const [filters, setFilters] = useState({ search: "", provider: "", page: 1 });
  const [results, setResults] = useState<ProviderCatalogData | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchRetry, setSearchRetry] = useState(0);
  const searching = !!(filters.search.trim() || filters.provider);
  usePendingCatalogRefresh(data, error, setRetry);
  useEffect(() => {
    if (pending || (!retry && (initialData || initialError))) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    gamingRequest<ProviderLobbyData>("lobby", undefined, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "The game collection is temporarily unavailable. Please try again.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [initialData, initialError, pending, retry]);
  useEffect(() => {
    if (!searching) {
      setSearchLoading(false);
      setSearchError("");
      return;
    }
    const controller = new AbortController();
    setSearchLoading(true);
    setSearchError("");
    const timer = setTimeout(() => {
      const query = new URLSearchParams({
        search: filters.search.trim(),
        provider: filters.provider,
        page: String(filters.page),
      });
      gamingRequest<ProviderCatalogData>(
        `games?${query}`,
        undefined,
        controller.signal,
      )
        .then((value) => {
          if (!controller.signal.aborted) setResults(value);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setSearchError(
              "Unable to search games right now. Please try again.",
            );
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searching, filters, searchRetry]);
  const busy = pending || (loading && !data);
  return (
    <div className="casino-lobby">
      <h1 className="sr-only">{t("Online Casino")}</h1>
      <div className="casino-banner">
        <img
          src="/assets/casino-banner.a71990e3.webp"
          alt=""
          fetchPriority="high"
        />
      </div>
      <div className="casino-filter-bar">
        <label className="casino-search">
          <Search size={18} />
          <input
            aria-label={t("Search games")}
            placeholder={t("Search games")}
            maxLength={100}
            value={filters.search}
            disabled={pending}
            onChange={(event) =>
              setFilters({ ...filters, search: event.target.value, page: 1 })
            }
          />
          {filters.search && (
            <button
              aria-label={t("Clear search")}
              onClick={() => setFilters({ ...filters, search: "", page: 1 })}
            >
              <X size={18} />
            </button>
          )}
        </label>
        <select
          className="casino-provider-filter"
          aria-label={t("Filter game provider")}
          value={filters.provider}
          disabled={pending}
          onChange={(event) =>
            setFilters({ ...filters, provider: event.target.value, page: 1 })
          }
        >
          <option value="">{t("All providers")}</option>
          {data?.providers.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
      </div>
      <CasinoCategoryNav />
      <div className="casino-collection-info">
        <span>
          {data ? t("{count, plural, one {# game} other {# games}}", {count: data.total}) : t("Game collection")}
        </span>
        <Link href="/all-games">{t("All Games")}</Link>
        <Link href="/providers">{t("Providers")}</Link>
      </div>
      {searching ? (
        <section
          className="casino-search-results"
          aria-label="Casino search results"
          aria-busy={searchLoading}
        >
          <div className="casino-row-heading">
            <h2>{t("Search results")}</h2>
            <button
              className="secondary"
              onClick={() => setFilters({ search: "", provider: "", page: 1 })}
            >{t("Clear filters")}</button>
          </div>
          {searchError ? (
            <div className="casino-category-empty" role="alert">
              <p>{t(searchError)}</p>
              <button
                className="secondary"
                onClick={() => setSearchRetry((value) => value + 1)}
              >{t("Try again")}</button>
            </div>
          ) : searchLoading || !results ? (
            <div className="casino-results-skeleton" role="status">
              <span className="sr-only">{t("Searching games")}</span>
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  className="casino-card-skeleton"
                  key={index}
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : !results.games.length ? (
            <p className="casino-category-empty" role="status">
              {t("No matching games")}. {t("Try another search or provider.")}
            </p>
          ) : (
            <>
              <p className="result-summary" role="status">
                {t("{count, plural, one {# game} other {# games}}", {count: results.total})}
              </p>
              <ProviderGameGrid games={results.games} />
              <nav
                className="provider-pagination"
                aria-label="Search result pages"
              >
                <button
                  className="secondary"
                  disabled={results.page === 1}
                  onClick={() =>
                    setFilters({ ...filters, page: results.page - 1 })
                  }
                >{t("Previous")}</button>
                <span>
                  {t("Page {page} of {pages}", {page: results.page, pages: Math.ceil(results.total / results.perPage)})}
                </span>
                <button
                  className="secondary"
                  disabled={results.page * results.perPage >= results.total}
                  onClick={() =>
                    setFilters({ ...filters, page: results.page + 1 })
                  }
                >{t("Next")}</button>
              </nav>
            </>
          )}
        </section>
      ) : (
        <>
          {error && (
            <div className="casino-category-empty" role="alert">
              <p>{t(error)}</p>
              <button
                className="secondary"
                onClick={() => setRetry((value) => value + 1)}
              >{t("Refresh collection")}</button>
            </div>
          )}
          {!busy && !error && data && collectionIsEmpty(data) && (
            <CatalogAvailability
              data={data}
              onRetry={() => setRetry((value) => value + 1)}
            />
          )}
          {data?.catalog?.status === "stale" && (
            <p className="provider-availability">{t("Showing the last available collection while updates are temporarily unavailable.")}</p>
          )}
          <CasinoRow
            title={t("All Games")}
            category="all-games"
            total={data?.total ?? 0}
            games={data?.games ?? []}
            pending={busy}
            unavailable={!!error && !data}
          />
          {rows.map((row) => {
            const section = data?.sections.find(
              (item) => item.category === row.category,
            );
            if (
              ["featured", "new-games"].includes(row.category) &&
              !section?.total
            )
              return null;
            return (
              <CasinoRow
                key={row.category}
                {...row}
                total={section?.total ?? 0}
                games={section?.games ?? []}
                pending={busy}
                unavailable={!!error && !data}
              />
            );
          })}
        </>
      )}
    </div>
  );
}
