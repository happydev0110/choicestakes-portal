'use client';
import { useText } from "../../i18n/use-text";

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { asset } from '../data';
import { BrandLogo } from './brand-logo';
import './sidebar.css';
import { useLocale } from 'next-intl';
import { languages } from '../../i18n/locales';
import { LanguageMenu, type LanguageMenuHandle } from './language-menu';

const railItems = [
  ['Casino', 'casino.dea5f87e.png'], ['Sports', 'football.2efdf0b1.png'],
  ['Promotions', 'promotions.2684d026.png'], ['Slots', 'slots.b6762e18.png'],
  ['Live Casino', 'live-casino.b9d52e4b.png'], ['Crash & Instant', 'dice.bdc6efaf.png'],
  ['Table & Cards', 'blackjack.5ed1c9b4.png'], ['Lotto & Scratch', 'scratch-cards.d8bb04ad.png'],
  ['English', 'language.58fb5410.png'],
];
const drawerItems = [
  ['Crash & Instant', 'dice.bdc6efaf.png'], ['Table & Cards', 'blackjack.5ed1c9b4.png'],
  ['Lotto & Scratch', 'scratch-cards.d8bb04ad.png'], ['Promotions', 'promotions.2684d026.png'],
  ['Loyalty Tiers', 'vip.cee8642b.png'],
];

type Props = { active: string; mobileOpen: boolean; onClose: () => void; onChoose: (target: string) => void };

function MenuContents({ active, onChoose, mobile = false, available, languageMenuRef }: Pick<Props, 'active' | 'onChoose'> & {
  mobile?: boolean;
  available: boolean;
  languageMenuRef?: React.Ref<LanguageMenuHandle>;
}) {
  const t = useText();
  const language = <LanguageMenu available={available} menuRef={languageMenuRef} />;
  return <div className="navigation-content">
    <div className="navigation-tabs">{railItems.slice(0, 2).map(([name, image]) => <button key={name} className={active === name || (active === 'Home' && name === 'Casino') ? 'selected' : ''} onClick={() => onChoose(name)}><img src={asset(image)} alt=""/>{t(name)}</button>)}</div>
    {mobile && language}
    <div className="cashback-card"><strong>{t('DAILY CASHBACK')}</strong><span>{t("Coming soon")}</span><button className="primary" onClick={() => onChoose('Promotions')}>{t('See Details')} →</button></div>
    <div className="navigation-featured">{[['Live Casino', 'live-casino-element.d7c46a6f.webp'], ['Slots', 'slots-machine.d48b1a72.webp']].map(([name, image]) => <button className="drawer-feature" key={name} onClick={() => onChoose(name)}><span>{t(name)}</span><img src={asset(image)} alt=""/></button>)}</div>
    <div className="navigation-links">{drawerItems.map(([name, image]) => <button className={`drawer-item ${active === name ? 'current' : ''}`} key={name} onClick={() => onChoose(name)}><img src={asset(image)} alt=""/><span>{t(name)}</span></button>)}</div>
    {!mobile && language}
  </div>;
}

export function Sidebar({ active, mobileOpen, onClose, onChoose }: Props) {
  const t = useText();
  const locale = useLocale();
  const languageName = languages.find(item => item.code === locale)?.name ?? 'English';
  const [expanded, setExpanded] = useState(false);
  const languageMenu = useRef<LanguageMenuHandle>(null);
  const host = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;
  const open = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setExpanded(true);
  };
  const close = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      if (!host.current?.contains(document.activeElement)) setExpanded(false);
    }, 150);
  };

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  useEffect(() => {
    if (!mobileOpen) { drawer.current?.close(); return; }
    drawer.current?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onResize = () => { if (desktop.matches) closeCallback.current(); };
    desktop.addEventListener('change', onResize);
    onResize();
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener('change', onResize);
      drawer.current?.close();
    };
  }, [mobileOpen]);

  return <>
    <aside ref={host} className="navigation-rail" aria-label={t("Main navigation")} onPointerEnter={open} onPointerLeave={close}
      onFocusCapture={open} onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          if (closeTimer.current) clearTimeout(closeTimer.current);
          setExpanded(false);
        }
      }} onKeyDown={(event) => {
        if (event.key === 'Escape') { setExpanded(false); (document.activeElement as HTMLElement)?.blur(); }
      }}>
      <div className="rail-icons">
        {railItems.map(([name, image]) => <button tabIndex={expanded ? -1 : 0} key={name} title={name === 'English' ? languageName : t(name)} aria-label={name === 'English' ? t('Language') : t(name)} aria-current={active === name ? 'page' : undefined} className={active === name ? 'active' : ''} onClick={() => {
          if (name === 'English') { open(); languageMenu.current?.open(); }
          else onChoose(name);
        }}><img src={asset(image)} alt=""/></button>)}
      </div>
      <div className={`navigation-flyout ${expanded ? 'is-open' : ''}`} inert={!expanded}>
        <MenuContents active={active} onChoose={onChoose} available={expanded} languageMenuRef={languageMenu}/>
      </div>
    </aside>
    <dialog ref={drawer} id="mobile-menu" className="mobile-menu-dialog" aria-label="Choicestakes Menu" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="mobile-menu-surface">
        <div className="mobile-menu-heading"><BrandLogo variant="drawer"/><button aria-label={t("Close menu")} onClick={onClose}><X/></button></div>
        <MenuContents active={active} onChoose={onChoose} mobile available={mobileOpen}/>
      </div>
    </dialog>
  </>;
}
