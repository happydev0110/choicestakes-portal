"use client";

import { useLocale } from "next-intl";
import { useId, useImperativeHandle, useLayoutEffect, useRef, useState, useTransition, type KeyboardEvent, type Ref } from "react";
import { ChevronRight, LoaderCircle } from "lucide-react";
import { languages, type Locale } from "../../i18n/locales";
import { setLanguage } from "../../i18n/actions";
import { useText } from "../../i18n/use-text";
import { asset } from "../data";
import styles from "./language-menu.module.css";

export type LanguageMenuHandle = { open: () => void };

export function LanguageMenu({ available, menuRef }: {
  available: boolean;
  menuRef?: Ref<LanguageMenuHandle>;
}) {
  const locale = useLocale();
  const t = useText();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const saving = useRef(false);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selection, setSelection] = useState<Locale | null>(null);
  const [error, setError] = useState(false);
  const name = languages.find((language) => language.code === locale)?.name ?? "English";

  useImperativeHandle(menuRef, () => ({ open: () => setOpen(true) }), []);

  useLayoutEffect(() => {
    const button = trigger.current;
    const menu = popup.current;
    if (!button || !menu || !open || !available) {
      menu?.hidePopover();
      if (!available) setOpen(false);
      return;
    }
    button.scrollIntoView({ block: "nearest", inline: "nearest" });
    // A native popover escapes the scrollable sidebar and also works inside the
    // mobile menu's modal dialog, without placing another overlay over the page.
    menu.showPopover();
    function position() {
      const rect = button!.getBoundingClientRect();
      const width = menu!.offsetWidth;
      const height = menu!.offsetHeight;
      const gutter = 8;
      const beside = rect.right + gutter + width <= window.innerWidth - gutter;
      const left = beside ? rect.right + gutter : Math.max(gutter, Math.min(rect.left, window.innerWidth - width - gutter));
      const top = Math.max(gutter, Math.min(beside ? rect.top - 36 : rect.bottom + 6, window.innerHeight - height - gutter));
      menu!.style.left = `${left}px`;
      menu!.style.top = `${top}px`;
    }
    position();
    menu.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus({ preventScroll: true });
    const sidebar = button.closest(".navigation-flyout");
    const sizeObserver = new ResizeObserver(position);
    sizeObserver.observe(menu);
    sidebar?.addEventListener("transitionend", position);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      sidebar?.removeEventListener("transitionend", position);
      sizeObserver.disconnect();
      menu.hidePopover();
    };
  }, [open, available]);

  function close() {
    if (popup.current?.matches(":popover-open")) trigger.current?.focus({ preventScroll: true });
    setOpen(false);
  }

  function menuKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" || event.key === "ArrowLeft") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === "Tab") { setOpen(false); return; }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="menuitemradio"]:not(:disabled)'));
    if (!options.length) return;
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
      : (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    options[next]?.focus();
  }

  function choose(next: Locale) {
    if (saving.current) return;
    if (next === locale) { close(); return; }
    saving.current = true;
    setSelection(next);
    setError(false);
    startTransition(async () => {
      try {
        await setLanguage(next);
        close();
      } catch {
        setError(true);
      } finally {
        saving.current = false;
        setSelection(null);
      }
    });
  }

  return <>
    <button ref={trigger} type="button" className={`drawer-item language-item ${styles.trigger}`}
      aria-haspopup="menu" aria-expanded={open && available} aria-controls={id}
      onClick={() => { setError(false); setOpen((value) => !value); }}
      onKeyDown={(event) => {
        if (["ArrowRight", "ArrowDown", "ArrowUp"].includes(event.key)) {
          event.preventDefault(); setError(false); setOpen(true);
        }
      }}>
      <img src={asset("language.58fb5410.png")} alt="" />
      <span lang={locale === "zh" ? "zh-Hans" : locale}>{name}</span>
      <ChevronRight size={20} className={styles.chevron} aria-hidden="true" />
    </button>
    <div ref={popup} id={id} popover="auto" role="menu" aria-label={t("Language")}
      className={styles.popup} aria-busy={pending} onKeyDown={menuKeys}
      onToggle={(event) => { if (event.newState === "closed") setOpen(false); }}>
      <div className={styles.options}>
        {languages.map((language) => <button key={language.code} type="button" role="menuitemradio"
          aria-checked={locale === language.code} tabIndex={-1} aria-disabled={pending}
          lang={language.code === "zh" ? "zh-Hans" : language.code}
          className={styles.option} onClick={() => choose(language.code)}>
          <span>{language.name}</span>
          {pending && selection === language.code && <LoaderCircle size={14} className={styles.spinner} aria-hidden="true" />}
        </button>)}
      </div>
      <span className="sr-only" role="status">{pending ? t("Saving…") : ""}</span>
      {error && <p className={styles.error} role="alert">{t("Unable to save your language. Please try again.")}</p>}
    </div>
  </>;
}
