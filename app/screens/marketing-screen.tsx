"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { asset } from "../data";

import { Notice, PageHeading } from "./shared";
export function AffiliateScreen() {
  const [sent, setSent] = useState(false);
  return (
    <div className="page-wrap">
      <div className="marketing-hero affiliate-hero">
        <div>
          <span className="eyebrow">CHOICESTAKES PARTNERS</span>
          <h1>
            Build your audience.
            <br />
            Grow together.
          </h1>
          <p>
            A dedicated home for creators, publishers, and affiliate partners.
          </p>
          <a className="primary" href="#partner-form">
            Become a partner <ArrowRight size={18} />
          </a>
        </div>
        <img src={asset("sports-trophy.429af003.webp")} alt="Golden trophy" />
      </div>
      <div className="benefit-grid">
        {[
          [
            Users,
            "A partnership that fits",
            "Connect your community with a tailored campaign concept.",
          ],
          [
            Wallet,
            "Transparent reporting",
            "Preview a clear view of traffic, referrals, and earnings.",
          ],
          [
            ShieldCheck,
            "Dedicated support",
            "A direct place to request help with your partnership.",
          ],
        ].map(([Icon, title, text]) => {
          const I = Icon as typeof Users;
          return (
            <article className="panel" key={String(title)}>
              <I size={30} />
              <h3>{String(title)}</h3>
              <p>{String(text)}</p>
            </article>
          );
        })}
      </div>
      <section className="panel">
        <h2>Three simple steps</h2>
        <div className="steps-grid">
          {[
            ["Apply", "Tell us about your audience."],
            ["Connect", "Prepare your content and campaign."],
            ["Grow", "Review referrals in your dashboard."],
          ].map(([title, text], i) => (
            <div key={title}>
              <span>0{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="panel form-panel" id="partner-form">
        <PageHeading
          title="Let’s work together"
          description="Preview an affiliate enquiry. Nothing is submitted to a partner service."
        />
        {sent ? (
          <Notice success>
            Your enquiry passed local validation. It has not been sent.{" "}
            <button className="text-link" onClick={() => setSent(false)}>
              Edit enquiry
            </button>
          </Notice>
        ) : null}
        <form
          hidden={sent}
          className="page-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <div className="form-grid">
            <label>
              Full name
              <input name="name" required placeholder="Your name" />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </label>
          </div>
          <label>
            Website or social profile
            <input
              name="website"
              type="url"
              required
              placeholder="https://example.com"
            />
          </label>
          <label>
            Tell us about your audience
            <textarea
              name="audience"
              required
              minLength={10}
              maxLength={2000}
              rows={4}
            />
          </label>
          <button className="primary" type="submit">
            Preview enquiry
          </button>
        </form>
      </section>
    </div>
  );
}
export function ReferralScreen() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const link = "https://example.com/register?ref=CHOICESTAKES-DEMO";
  return (
    <div className="page-wrap">
      <div className="marketing-hero">
        <div>
          <span className="eyebrow">BETTER TOGETHER</span>
          <h1>Refer a friend</h1>
          <p>
            Explore the referral experience with your own sample invitation
            link.
          </p>
        </div>
        <img src={asset("promotions.2684d026.png")} alt="Gift" />
      </div>
      <section className="panel form-panel">
        <h2>Your demo invitation</h2>
        <p>This sample link is not connected to a referral program.</p>
        <div className="copy-field">
          <input aria-label="Demo referral link" readOnly value={link} />
          <button
            className="primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setCopied(true);
                setError(false);
              } catch {
                setError(true);
              }
            }}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}{" "}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        {error && (
          <p role="status">
            Clipboard is unavailable on this connection. Select and copy the
            link above.
          </p>
        )}
        <div className="stat-grid">
          <div>
            <small>Invited friends</small>
            <strong>0</strong>
          </div>
          <div>
            <small>Qualified referrals</small>
            <strong>0</strong>
          </div>
          <div>
            <small>Demo rewards</small>
            <strong>$0.00</strong>
          </div>
        </div>
        <Link href="/account" className="secondary">
          Open demo account
        </Link>
      </section>
      <Notice>No invitations are sent and no rewards are credited.</Notice>
    </div>
  );
}
const coins = [
  { symbol: "BTC", name: "Bitcoin", rate: 60000, network: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum", rate: 3000, network: "Ethereum (ERC20)" },
  { symbol: "USDT", name: "Tether", rate: 1, network: "Tron (TRC20)" },
  { symbol: "USDC", name: "USD Coin", rate: 1, network: "Ethereum (ERC20)" },
  { symbol: "SOL", name: "Solana", rate: 150, network: "Solana" },
];
export function CryptoScreen() {
  const [amount, setAmount] = useState("100");
  const [symbol, setSymbol] = useState("BTC");
  const [preview, setPreview] = useState(false);
  const coin = coins.find((c) => c.symbol === symbol)!;
  return (
    <div className="page-wrap">
      <PageHeading
        title="Buy Crypto"
        description="A simple preview of a crypto purchase flow."
      />
      <div className="crypto-layout">
        <section className="panel">
          <span className="eyebrow">CRYPTO MADE SIMPLE</span>
          <h2>Your next step into crypto</h2>
          <img
            className="crypto-illustration"
            src={asset("hero-banner-wallet.306b8026.jpg")}
            alt="Digital wallet illustration"
          />
          <div className="steps-grid">
            {["Choose a coin", "Enter an amount", "Review your quote"].map(
              (step, i) => (
                <div key={step}>
                  <span>0{i + 1}</span>
                  <h3>{step}</h3>
                </div>
              ),
            )}
          </div>
          <Notice>
            Fixed illustrative rates only. Prices are not live, and no purchase
            or wallet connection is available.
          </Notice>
        </section>
        <section className="panel">
          <h2>Purchase preview</h2>
          <form
            className="page-form"
            onSubmit={(e) => {
              e.preventDefault();
              setPreview(true);
            }}
          >
            <label>
              You pay (USD)
              <input
                required
                type="number"
                min="20"
                max="10000"
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setPreview(false);
                }}
              />
            </label>
            <label>
              You receive
              <select
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value);
                  setPreview(false);
                }}
              >
                {coins.map((c) => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </label>
            <div className="quote-output">
              <small>Illustrative amount</small>
              <strong>
                {(Math.max(0, Number(amount) || 0) / coin.rate).toFixed(6)}{" "}
                <span>{coin.symbol}</span>
              </strong>
            </div>
            <div className="summary-line">
              <span>Network</span>
              <b>{coin.network}</b>
            </div>
            <div className="summary-line">
              <span>Sample rate</span>
              <b>
                1 {coin.symbol} = ${coin.rate.toLocaleString()}
              </b>
            </div>
            <p className="fine-print">
              Amounts exclude any provider fees. Preview range: $20–$10,000.
            </p>
            <button className="primary" type="submit">
              Review sample quote
            </button>
          </form>
          {preview && (
            <Notice success>
              Quote preview ready. A payment provider must be connected to
              continue. No purchase has been made.
            </Notice>
          )}
          <Link className="text-link" href="/account/deposit">
            Looking for the deposit preview? →
          </Link>
        </section>
      </div>
    </div>
  );
}
