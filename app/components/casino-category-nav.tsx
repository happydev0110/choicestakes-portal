"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useText } from "../../i18n/use-text";
import { casinoCategories } from "../lib/casino-categories";

export function CasinoCategoryNav({ active = "" }: { active?: string }) {
  const t = useText();
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const container = nav.current;
    const selected = container?.querySelector<HTMLElement>('[aria-current="page"]');
    if (container && selected && container.scrollWidth > container.clientWidth) {
      // Scroll only the category strip, preserving the page's vertical position.
      container.scrollLeft = selected.offsetLeft - container.offsetLeft - (container.clientWidth - selected.offsetWidth) / 2;
    }
  }, [active]);
  return (
    <nav ref={nav} className="casino-category-nav" aria-label={t("Game categories")}>
      {casinoCategories.map(({ category, title, icon }) => (
        <Link key={category} href={`/${category}`} aria-current={active === category ? "page" : undefined}>
          <img src={`/assets/${icon}`} alt="" />
          {t(title)}
        </Link>
      ))}
    </nav>
  );
}
