"use client";
import { useText } from "../../i18n/use-text";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Info, Search } from "lucide-react";

export function PageHeading({
  title,
  description,
  eyebrow = "CHOICESTAKES",
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  const t = useText();
  return (
    <div className="page-heading">
      <Link href="/" className="back-link">
        <ArrowLeft size={14} />{t("Home")}</Link>
      <span className="eyebrow">{t(eyebrow)}</span>
      <h1>{t(title)}</h1>
      {description && <p>{t(description)}</p>}
    </div>
  );
}
export function Notice({
  children,
  success = false,
}: {
  children: React.ReactNode;
  success?: boolean;
}) {
  return (
    <div
      role={success ? "status" : undefined}
      className={`page-notice ${success ? "is-success" : ""}`}
    >
      {success ? <CheckCircle2 size={19} /> : <Info size={19} />}
      <div>{children}</div>
    </div>
  );
}
export function EmptyState({
  title = "Nothing here yet",
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  const t = useText();
  return (
    <div className="page-empty">
      <Search size={32} />
      <h3>{t(title)}</h3>
      <p>{children}</p>
      <Link href="/casino" className="secondary">{t("Explore games")}</Link>
    </div>
  );
}
