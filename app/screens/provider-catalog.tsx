"use client";
import { useText } from "../../i18n/use-text";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Gamepad2, Search } from "lucide-react";
import { gamingRequest, type ProviderCatalogData } from "../lib/gaming";
import { categoryLinks } from "../site-map";
import { PageHeading } from "./shared";
import { ProviderGameGrid, useProviderFavorites } from "./provider-cards";
import {
  CatalogAvailability,
  collectionIsEmpty,
  usePendingCatalogRefresh,
} from "./catalog-availability";
import "./provider-games.css";

export function ProviderCatalog({
  title = "All Games",
  category = "",
  initialProvider = "",
  favoritesOnly = false,
  embedded = false,
}: {
  title?: string;
  category?: string;
  initialProvider?: string;
  favoritesOnly?: boolean;
  embedded?: boolean;
}) {
  const t = useText();
  const [data, setData] = useState<ProviderCatalogData | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    provider: initialProvider,
    sort: "provider",
    page: 1,
  });
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const { ids } = useProviderFavorites();
  const selectedIds = favoritesOnly ? ids.join(",") : undefined;
  usePendingCatalogRefresh(data, error, setRetry);
  useEffect(() => {
    function restore() {
      const query = new URLSearchParams(window.location.search);
      const page = Number(query.get("page") ?? 1);
      const sort = query.get("sort") ?? "provider";
      setFilters({
        search: (query.get("search") ?? "").slice(0, 100),
        provider:
          initialProvider || (query.get("provider") ?? "").slice(0, 128),
        sort: ["provider", "name", "name-desc"].includes(sort)
          ? sort
          : "provider",
        page: Number.isInteger(page) && page > 0 && page <= 10000 ? page : 1,
      });
      setInitialized(true);
    }
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [initialProvider]);
  function update(values: Partial<typeof filters>) {
    const next = { ...filters, page: 1, ...values };
    setFilters(next);
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(next)) {
      if (
        !value ||
        (key === "page" && value === 1) ||
        (key === "sort" && value === "provider")
      )
        url.searchParams.delete(key);
      else url.searchParams.set(key, String(value));
    }
    window.history.replaceState(null, "", url);
  }
  useEffect(() => {
    if (!initialized) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(
      () => {
        const query = new URLSearchParams({
          ...filters,
          page: String(filters.page),
          category,
        });
        if (selectedIds !== undefined) query.set("ids", selectedIds);
        void gamingRequest<ProviderCatalogData>(
          "games?" + query,
          undefined,
          controller.signal,
        )
          .then((result) => {
            if (!controller.signal.aborted) setData(result);
          })
          .catch((reason) => {
            if (!controller.signal.aborted)
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load games.",
              );
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          });
      },
      filters.search ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [initialized, filters, category, selectedIds, retry]);
  const heading = favoritesOnly ? "Your favorites" : title;
  return (
    <section
      className={`provider-catalog ${embedded ? "provider-lobby" : "page-wrap"}`}
      aria-label={t(heading)}
    >
      {embedded ? (
        <div className="section-heading">
          <h2>
            <Gamepad2 size={22} />
            {t(heading)}
          </h2>
          <Link href="/providers">{t("Game Providers")} →</Link>
        </div>
      ) : (
        <PageHeading
          title={t(heading)}
          eyebrow="CHOICESTAKES"
          description={
            favoritesOnly
              ? "Your saved games on this device. Only currently available games are shown."
              : "Explore the collection by game or provider."
          }
        />
      )}
      <nav className="pill-nav" aria-label={t("Game categories")}>
        {categoryLinks.map(([name, path]) => (
          <Link
            key={path}
            href={path}
            className={
              !favoritesOnly &&
              !initialProvider &&
              (category ? path === `/${category}` : path === "/all-games")
                ? "active"
                : ""
            }
          >
            {t(name)}
          </Link>
        ))}
        <Link href="/providers">{t("Providers")}</Link>
        <Link href="/account/favorites">{t("Favorites")}</Link>
      </nav>
      {data?.configured && !data.launchEnabled && !collectionIsEmpty(data) && (
        <p className="provider-availability">
          Browse the collection now. Sandbox play will be available once setup
          is complete.
        </p>
      )}
      <div className="catalog-toolbar">
        <label className="field-search">
          <Search size={18} />
          <input
            aria-label={t("Search games")}
            placeholder={t("Search games or providers")}
            maxLength={100}
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
          />
        </label>
        <select
          aria-label={t("Filter game provider")}
          value={filters.provider}
          onChange={(event) => update({ provider: event.target.value })}
          disabled={!!initialProvider}
        >
          <option value="">{t("All providers")}</option>
          {[
            ...new Set([
              ...(data?.providers ?? []),
              ...(filters.provider ? [filters.provider] : []),
            ]),
          ].map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
        <select
          aria-label={t("Sort games")}
          value={filters.sort}
          onChange={(event) => update({ sort: event.target.value })}
        >
          <option value="provider">{t("Provider")}</option>
          <option value="name">{t("Name A–Z")}</option>
          <option value="name-desc">{t("Name Z–A")}</option>
        </select>
      </div>
      {error ? (
        <div className="panel provider-empty" role="alert">
          <h2>{t("Games temporarily unavailable")}</h2>
          <p>{t(error)}</p>
          <button
            className="secondary"
            onClick={() => setRetry((value) => value + 1)}
          >{t("Try again")}</button>
        </div>
      ) : loading ? (
        <div className="panel provider-empty" role="status">
          <Gamepad2 size={38} />
          <p>{t("Loading games…")}</p>
        </div>
      ) : !data?.configured ? (
        <div className="panel provider-empty">
          <Gamepad2 size={46} />
          <h2>{t("Games temporarily unavailable")}</h2>
          <p>The collection is not available yet. Please check back soon.</p>
          <button
            className="secondary"
            onClick={() => setRetry((value) => value + 1)}
          >{t("Refresh collection")}</button>
        </div>
      ) : collectionIsEmpty(data) ? (
        <CatalogAvailability
          data={data}
          onRetry={() => setRetry((value) => value + 1)}
        />
      ) : !data.games.length ? (
        <div className="panel provider-empty">
          <Search size={38} />
          <h2>
            {t(filters.search || filters.provider
              ? "No matching games"
              : favoritesOnly
                ? "Your collection starts here"
                : category
                  ? "No games in this category yet"
                  : "No matching games")}
          </h2>
          <p>
            {t(filters.search || filters.provider
              ? "Try another search or provider."
              : favoritesOnly
                ? "Choose the heart on any game to save it on this device."
                : category
                  ? "Explore All Games while this collection is being organized."
                  : "Try another search or provider.")}
          </p>
          {(filters.search || filters.provider) && !initialProvider && (
            <button
              className="secondary"
              onClick={() => update({ search: "", provider: "" })}
            >{t("Clear filters")}</button>
          )}
          <Link className="secondary" href="/casino">
            Explore all games
          </Link>
        </div>
      ) : (
        <>
          {data.catalog?.status === "stale" && (
            <p className="provider-availability">{t("Showing the last available collection while updates are temporarily unavailable.")}</p>
          )}
          <p className="result-summary" role="status">
            {t("{count, plural, one {# game} other {# games}}", {count: data.total})}
          </p>
          <ProviderGameGrid games={data.games} />
          <nav className="provider-pagination" aria-label="Game pages">
            <button
              className="secondary"
              disabled={data.page === 1}
              onClick={() => update({ page: data.page - 1 })}
            >{t("Previous")}</button>
            <span>
              {t("Page {page} of {pages}", {page: data.page, pages: Math.max(1, Math.ceil(data.total / data.perPage))})}
            </span>
            <button
              className="secondary"
              disabled={data.page * data.perPage >= data.total}
              onClick={() => update({ page: data.page + 1 })}
            >{t("Next")}</button>
          </nav>
        </>
      )}
    </section>
  );
}

export function ProviderDirectory() {
  const t = useText();
  const [data, setData] = useState<ProviderCatalogData | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  usePendingCatalogRefresh(data, error, setRetry);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    void gamingRequest<ProviderCatalogData>(
      "games",
      undefined,
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load providers.",
          );
      });
    return () => controller.abort();
  }, [retry]);
  const providers =
    data?.providerCounts?.filter((item) =>
      item.provider.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  return (
    <div className="page-wrap">
      <PageHeading
        title="Game Providers"
        eyebrow="CHOICESTAKES"
        description="Browse the studios in our current collection."
      />
      <label className="field-search">
        <Search size={18} />
        <input
          aria-label={t("Search providers")}
          placeholder={t("Search providers")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      {error ? (
        <div className="panel provider-empty" role="alert">
          <p>{t(error)}</p>
          <button
            className="secondary"
            onClick={() => setRetry((value) => value + 1)}
          >{t("Try again")}</button>
        </div>
      ) : !data ? (
        <p role="status">{t("Loading providers…")}</p>
      ) : collectionIsEmpty(data) ? (
        <CatalogAvailability
          data={data}
          onRetry={() => setRetry((value) => value + 1)}
        />
      ) : !providers.length ? (
        <div className="panel provider-empty">
          <h2>{t("No matching providers")}</h2>
          <Link href="/casino">Explore all games</Link>
        </div>
      ) : (
        <>
          <p className="result-summary">
            {t("{count, plural, one {# provider} other {# providers}}", {count: providers.length})}
          </p>
          <div className="provider-directory">
            {providers.map(({ provider, total }) => (
              <Link
                className="panel provider-directory-card"
                key={provider}
                href={`/providers/${encodeURIComponent(provider)}`}
              >
                <Gamepad2 size={30} />
                <strong>{provider}</strong>
                <span>
                  {t("{count, plural, one {# game} other {# games}}", {count: total})}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
