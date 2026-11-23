"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useText } from "../../i18n/use-text";
import { casinoCategories } from "../lib/casino-categories";

export function CasinoCategoryNav({ active = "", counts }: {
  active?: string;
  counts?: { category: string; total: number }[];
}) {
  const t = useText();
  const id = useId();
  const nav = useRef<HTMLElement>(null);
  const [scroll, setScroll] = useState({ previous: false, next: false });
  // Keep direct category URLs usable, even if their last game was removed.
  // Older backends omit counts; retain navigation during a rolling deployment.
  const categories = counts === undefined ? casinoCategories : casinoCategories.filter(
    ({ category }) => category === active || counts.some((item) => item.category === category && item.total > 0),
  );
  const categoryKeys = categories.map(({ category }) => category).join(",");
  useEffect(() => {
    const container = nav.current;
    if (!container) return;
    const update = () => setScroll({
      previous: container.scrollLeft > 2,
      next: container.scrollLeft + container.clientWidth < container.scrollWidth - 2,
    });
    const centerSelected = () => {
      const selected = container.querySelector<HTMLElement>('[aria-current="page"]');
      if (selected && container.scrollWidth > container.clientWidth) {
        const item = selected.getBoundingClientRect();
        const strip = container.getBoundingClientRect();
        // Scroll only the strip, preserving the page's vertical position.
        container.scrollLeft += item.left - strip.left - (container.clientWidth - item.width) / 2;
      }
      update();
    };
    centerSelected();
    const observer = new ResizeObserver(centerSelected);
    observer.observe(container);
    container.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", update);
    };
  }, [active, categoryKeys, t]);
  function move(direction: number) {
    const container = nav.current;
    if (!container) return;
    container.scrollBy({
      left: direction * container.clientWidth * 0.75,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }
  if (!categories.length) return null;
  const overflow = scroll.previous || scroll.next;
  return (
    <div className="casino-category-bar">
      {overflow && <button type="button" className="casino-category-arrow" aria-label={t("Previous categories")} aria-controls={id} disabled={!scroll.previous} onClick={() => move(-1)}><ChevronLeft size={20} aria-hidden="true" /></button>}
      <nav id={id} ref={nav} className="casino-category-nav" aria-label={t("Game categories")}>
      {categories.map(({ category, title, icon }) => (
        <Link key={category} href={`/${category}`} aria-current={active === category ? "page" : undefined}>
          <img src={`/assets/${icon}`} alt="" />
          {t(title)}
        </Link>
      ))}
      </nav>
      {overflow && <button type="button" className="casino-category-arrow" aria-label={t("More categories")} aria-controls={id} disabled={!scroll.next} onClick={() => move(1)}><ChevronRight size={20} aria-hidden="true" /></button>}
    </div>
  );
}
