'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { useCMSData } from '@/frontend/customer/hooks/useCMSData';
import { formatCurrency, isOrderable, productId } from '../utils/commerce';
import ProductImage from './ProductImage';
import { CartItemsList, CartSummary } from './portal/Cart';

const ArrowLeft = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6 6-6-6 6-6" /></svg>;
const Trash = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></svg>;

export default function CartClient() {
  const { items, clearCart, isHydrated, addProduct } = useCart();
  const { products } = useCMSData();
  const recommendations = React.useMemo(() => {
    const cartIds = new Set(items.map((item) => String(item.productId)));
    return products.filter((product) => isOrderable(product) && !cartIds.has(productId(product))).slice(0, 4);
  }, [items, products]);

  const clearWithConfirmation = () => {
    if (window.confirm('Remove every item from your cart?')) clearCart();
  };

  if (!isHydrated) {
    return (
      <section className="cart-page cart-loading" aria-busy="true" aria-live="polite">
        <div className="cart-shell">
          <div className="cart-hero"><span className="cart-badge">Cart</span><h1>Loading your cart</h1><p>Restoring your saved NIMRA products…</p></div>
          <div className="cart-skeleton"><span /><span /><span /></div>
        </div>
        <style jsx global>{styles}</style>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="cart-page">
        <div className="cart-shell">
          <div className="cart-hero"><span className="cart-badge">Cart</span><h1>Your shopping cart</h1><p>Everything you choose, ready for one smooth checkout.</p></div>
          <div className="empty-cart-card">
            <div className="empty-cart-art" aria-hidden="true"><span className="empty-bubble bubble-one" /><span className="empty-bubble bubble-two" /><svg viewBox="0 0 64 64"><path d="M8 11h7l5 30h27l6-21H18"/><circle cx="25" cy="50" r="3"/><circle cx="45" cy="50" r="3"/><path d="M25 27h19"/></svg></div>
            <span className="cart-kicker">Your next refresh starts here</span>
            <h2>Your cart is empty</h2>
            <p>Browse our premium drinking water products and add your favourites.</p>
            <Link href="/products" className="empty-shop-button">Explore Products <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></Link>
          </div>
          <Recommendations products={recommendations} onAdd={addProduct} />
        </div>
        <style jsx global>{styles}</style>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="cart-shell">
        <div className="cart-hero">
          <div className="cart-hero-orb orb-one" aria-hidden="true" /><div className="cart-hero-orb orb-two" aria-hidden="true" />
          <span className="cart-badge">Cart</span><h1>Your Order Cart</h1><p>Review your selected products and proceed to checkout.</p>
        </div>
        <div className="cart-actions-top">
          <Link href="/products" className="continue-shopping"><ArrowLeft />Continue Shopping</Link>
          <button type="button" className="clear-cart" onClick={clearWithConfirmation}><Trash />Clear Cart</button>
        </div>
        <div className="cart-layout"><CartItemsList /><CartSummary /></div>
        <Recommendations products={recommendations} onAdd={addProduct} />
      </div>
      <style jsx global>{styles}</style>
    </section>
  );
}

function Recommendations({ products, onAdd }: { products: ReturnType<typeof useCMSData>['products']; onAdd: ReturnType<typeof useCart>['addProduct'] }) {
  if (!products.length) return null;
  return (
    <section className="cart-recommendations">
      <div className="recommendations-heading"><div><span className="cart-kicker">Customers also bought</span><h2>You May Also Like</h2></div><Link href="/products">View all <span>→</span></Link></div>
      <div className="recommendation-track">
        {products.map((product) => (
          <article className="recommendation-card" key={productId(product)}>
            <Link href="/products" className="recommendation-image"><ProductImage src={product.ImageUrl} alt={product.Name} /></Link>
            <div className="recommendation-copy"><span>{product.Volume} · {product.Category}</span><h3>{product.Name}</h3><div><strong>{formatCurrency(Number(product.Price))}</strong><button type="button" onClick={() => onAdd(product)} aria-label={`Add ${product.Name} to cart`}>+ <span>Add</span></button></div></div>
          </article>
        ))}
      </div>
    </section>
  );
}

const styles = `
  .cart-page { --cart-glass: rgba(255,255,255,.76); --cart-border: rgba(148,163,184,.24); min-height: 82vh; padding: clamp(.75rem,2vw,1.5rem) 0 clamp(2rem,5vw,4.5rem); font-family:var(--font-body); position:relative; }
  [data-theme="dark"] .cart-page { --cart-glass:rgba(15,23,42,.72); --cart-border:rgba(96,165,250,.18); }
  .cart-shell { width:min(94%, 1380px); margin:0 auto; }
  .cart-hero { position:relative; isolation:isolate; overflow:hidden; min-height:clamp(145px,16vw,190px); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:clamp(1.6rem,4vw,2.8rem) 1rem; border:1px solid var(--cart-border); border-radius:24px; background:linear-gradient(135deg,rgba(255,255,255,.8),rgba(239,246,255,.7)); box-shadow:0 18px 55px rgba(15,23,42,.07); }
  [data-theme="dark"] .cart-hero { background:linear-gradient(135deg,rgba(15,23,42,.92),rgba(17,35,66,.75)); box-shadow:0 22px 60px rgba(0,0,0,.3); }
  .cart-hero:before { content:''; position:absolute; z-index:-1; inset:0; background:radial-gradient(circle at 22% 20%,rgba(59,130,246,.18),transparent 31%),radial-gradient(circle at 82% 80%,rgba(14,165,233,.13),transparent 30%); }
  .cart-hero-orb { position:absolute; z-index:-1; border-radius:50%; border:1px solid rgba(96,165,250,.18); background:rgba(255,255,255,.12); }
  .orb-one { width:110px;height:110px;left:7%;top:-55px; } .orb-two { width:72px;height:72px;right:10%;bottom:-36px; }
  .cart-badge { display:inline-flex; padding:.34rem .85rem; margin-bottom:.5rem; border:1px solid rgba(59,130,246,.22); border-radius:999px; background:rgba(255,255,255,.55); backdrop-filter:blur(12px); color:#2563eb; font-size:.68rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; box-shadow:inset 0 1px rgba(255,255,255,.6); }
  [data-theme="dark"] .cart-badge { background:rgba(30,41,59,.55); color:#93c5fd; }
  .cart-hero h1 { margin:.32rem 0 .22rem; font-size:clamp(1.2rem,2.05vw,2.05rem); font-weight:800; letter-spacing:0; line-height:1.08; color:var(--text-primary); background:linear-gradient(135deg,var(--text-primary) 0%,#1e3a8a 52%,var(--primary-color) 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .cart-hero p { color:var(--text-muted); margin:.5rem 0 0; font-size:clamp(.84rem,1.2vw,.98rem); }
  .cart-actions-top { display:flex; align-items:center; justify-content:space-between; margin:clamp(.8rem,2vw,1.15rem) 0; }
  .continue-shopping,.clear-cart { min-height:42px; display:inline-flex; align-items:center; gap:.48rem; padding:.65rem .9rem; border-radius:13px; font-size:.79rem; font-weight:750; cursor:pointer; transition:transform 180ms ease,box-shadow 180ms ease,border-color 180ms ease; }
  .continue-shopping { border:1px solid rgba(37,99,235,.24); background:var(--cart-glass); color:var(--primary-color); box-shadow:0 6px 18px rgba(37,99,235,.07); backdrop-filter:blur(12px); }
  .continue-shopping svg,.clear-cart svg { width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round; }
  .continue-shopping:hover { transform:translateY(-2px); border-color:rgba(37,99,235,.55); box-shadow:0 10px 24px rgba(37,99,235,.12); }
  .clear-cart { border:0;background:transparent;color:#ef4444;padding-inline:.4rem; } .clear-cart:hover { text-decoration:underline;text-underline-offset:4px;transform:translateY(-1px); }
  .cart-layout { display:grid; grid-template-columns:minmax(0,7fr) minmax(300px,3fr); gap:clamp(1rem,2.2vw,1.65rem); align-items:start; }
  .cart-list { display:flex; flex-direction:column; gap:.9rem; min-width:0; }
  .cart-list-heading,.summary-heading,.recommendations-heading { display:flex;justify-content:space-between;align-items:flex-end;gap:1rem; }
  .cart-list-heading { padding:0 .2rem .1rem; } .cart-list-heading h2,.summary h2,.cart-recommendations h2 { margin:.08rem 0 0;font-size:clamp(1.15rem,2vw,1.45rem);letter-spacing:-.025em; }
  .cart-kicker { color:var(--primary-color);font-size:.64rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase; }
  .cart-item-count { color:var(--text-muted);font-size:.74rem;font-weight:650; }
  .cart-row { display:grid;grid-template-columns:minmax(118px,18%) minmax(210px,1fr) minmax(118px,15%) minmax(94px,11%) minmax(76px,10%);gap:clamp(.8rem,1.6vw,1.25rem);align-items:center;padding:clamp(.85rem,1.6vw,1.15rem);border:1px solid var(--cart-border);border-radius:20px;background:var(--cart-glass);box-shadow:0 12px 36px rgba(15,23,42,.07),inset 0 1px rgba(255,255,255,.6);backdrop-filter:blur(18px);animation:cartRowIn 420ms cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--cart-index) * 55ms);transition:transform 220ms ease,box-shadow 220ms ease,border-color 220ms ease; }
  [data-theme="dark"] .cart-row { box-shadow:0 16px 40px rgba(0,0,0,.22),inset 0 1px rgba(255,255,255,.04); }
  .cart-row:hover { transform:translateY(-3px);border-color:rgba(59,130,246,.45);box-shadow:0 20px 45px rgba(37,99,235,.13); }
  .cart-thumb { width:100%;aspect-ratio:1/1;overflow:hidden;border:1px solid var(--cart-border);border-radius:16px;background:var(--product-image-bg);box-shadow:0 9px 24px rgba(15,23,42,.08); }
  .cart-thumb .product-image-container { height:100%!important;aspect-ratio:auto!important;padding:.45rem; } .cart-row:hover .cart-thumb .product-img { transform:scale(1.055); }
  .row-main { min-width:0; } .product-category { display:block;color:var(--primary-color);font-size:.62rem;font-weight:850;text-transform:uppercase;letter-spacing:.09em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
  .row-main h3 { margin:.24rem 0;font-size:clamp(.95rem,1.45vw,1.14rem);letter-spacing:-.02em; }
  .row-main p { display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;color:var(--text-muted);font-size:.72rem;line-height:1.45;margin:0 0 .52rem; }
  .product-pills { display:flex;gap:.3rem;flex-wrap:wrap; } .product-pills span { padding:.2rem .48rem;border:1px solid var(--cart-border);border-radius:999px;background:rgba(148,163,184,.08);color:var(--text-secondary);font-size:.58rem;font-weight:750;line-height:1.3; }
  .product-pills .premium-pill { color:#2563eb;background:rgba(37,99,235,.08);border-color:rgba(37,99,235,.16); }
  .cart-column-label,.line-subtotal-label { display:block;color:var(--text-muted);font-size:.59rem;font-weight:750;text-transform:uppercase;letter-spacing:.06em; }
  .cart-quantity-block,.cart-price-block { display:flex;flex-direction:column;gap:.4rem;align-items:flex-start; }
  .qty { display:grid;grid-template-columns:32px minmax(28px,34px) 32px;align-items:center;gap:.22rem; }
  .qty button { width:32px;height:32px;display:grid;place-items:center;padding:0;border:1px solid var(--cart-border);border-radius:50%;background:rgba(255,255,255,.48);color:var(--text-primary);font-size:1rem;font-weight:650;cursor:pointer;box-shadow:0 4px 12px rgba(15,23,42,.06);transition:transform 160ms ease,background 160ms ease,color 160ms ease,box-shadow 160ms ease; }
  [data-theme="dark"] .qty button { background:rgba(30,41,59,.7); } .qty button:hover { transform:scale(1.08);background:#2563eb;color:white;box-shadow:0 5px 16px rgba(37,99,235,.3); }
  .qty-value { text-align:center;font-size:.84rem;font-weight:850;animation:qtyPop 180ms ease both; }
  .cart-price-block strong { font-size:.92rem; } .cart-price-block b { color:var(--primary-color);font-size:1rem; } .line-subtotal-label { margin-top:.18rem; }
  .cart-row-actions { display:flex;justify-content:flex-end; } .remove { min-width:84px;min-height:38px;display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.5rem .65rem;border:1px solid rgba(239,68,68,.18);border-radius:11px;background:rgba(239,68,68,.055);color:#dc2626;font-size:.68rem;font-weight:800;line-height:1;white-space:nowrap;cursor:pointer;box-shadow:inset 0 1px rgba(255,255,255,.5),0 5px 14px rgba(239,68,68,.06);transition:transform 160ms ease,background 160ms ease,color 160ms ease,border-color 160ms ease,box-shadow 160ms ease; }
  [data-theme="dark"] .remove { color:#fca5a5;background:rgba(239,68,68,.09);border-color:rgba(248,113,113,.18);box-shadow:none; } .remove svg { width:15px;height:15px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round; } .remove:hover { transform:translateY(-1px);color:white;background:#ef4444;border-color:#ef4444;box-shadow:0 8px 20px rgba(239,68,68,.24); }
  .summary { position:sticky;top:88px;padding:clamp(1.1rem,2vw,1.4rem);border:1px solid rgba(59,130,246,.22);border-radius:20px;background:var(--cart-glass);box-shadow:0 22px 55px rgba(15,23,42,.1),inset 0 1px rgba(255,255,255,.65);backdrop-filter:blur(20px); }
  [data-theme="dark"] .summary { box-shadow:0 24px 60px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.04); }
  .summary-heading { align-items:center;padding-bottom:.9rem;border-bottom:1px solid var(--cart-border); } .secure-chip { display:flex;align-items:center;gap:.25rem;color:#16a34a;font-size:.61rem;font-weight:750; } .secure-chip svg { width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2; }
  .delivery-progress { margin:1rem 0;padding:.85rem;border:1px solid rgba(59,130,246,.16);border-radius:15px;background:linear-gradient(135deg,rgba(37,99,235,.08),rgba(14,165,233,.04)); }
  .delivery-copy { display:flex;gap:.6rem;align-items:center; } .truck-icon { width:30px;height:30px;display:grid;place-items:center;flex:0 0 auto;border-radius:9px;background:#2563eb;color:white;box-shadow:0 6px 16px rgba(37,99,235,.25); }
  .truck-icon svg { width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round; } .delivery-copy div { min-width:0;display:flex;flex-direction:column; } .delivery-copy strong { font-size:.71rem;line-height:1.3; } .delivery-copy div span { color:var(--text-muted);font-size:.6rem;line-height:1.35;margin-top:.1rem; }
  .delivery-progress.unlocked .truck-icon { background:#16a34a;box-shadow:0 6px 16px rgba(22,163,74,.25); } .delivery-progress.unlocked { border-color:rgba(22,163,74,.2);background:rgba(22,163,74,.06); }
  .progress-meta { display:flex;justify-content:space-between;margin:.65rem 0 .3rem;color:var(--text-muted);font-size:.58rem; } .progress-meta strong { color:var(--primary-color); }
  .progress-track { height:6px;overflow:hidden;border-radius:99px;background:rgba(148,163,184,.18); } .progress-track span { display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#2563eb,#38bdf8);box-shadow:0 0 12px rgba(37,99,235,.4);transition:width 500ms cubic-bezier(.22,1,.36,1); }
  .summary-lines { padding:.1rem 0 .75rem; } .summary-lines>div { display:flex;justify-content:space-between;align-items:center;padding:.36rem 0;font-size:.74rem; } .summary-lines span { color:var(--text-muted); } .summary-lines strong { font-size:.75rem; } .summary-lines .free-value { color:#16a34a; }
  .summary .total { display:flex;justify-content:space-between;align-items:flex-end;margin:.95rem 0;padding-top:.85rem;border-top:1px solid var(--cart-border); } .summary .total span { font-size:.82rem;font-weight:750; } .summary .total strong { color:var(--primary-color);font-size:clamp(1.2rem,2vw,1.5rem);letter-spacing:-.03em; }
  .checkout-button,.empty-shop-button { display:flex;align-items:center;justify-content:center;gap:.55rem;width:100%;min-height:48px;padding:.75rem 1rem;border-radius:13px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white!important;font-size:.77rem;font-weight:850;box-shadow:0 12px 28px rgba(37,99,235,.3),inset 0 1px rgba(255,255,255,.25);transition:transform 180ms ease,box-shadow 180ms ease,filter 180ms ease; }
  .checkout-button svg,.empty-shop-button svg { width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;transition:transform 180ms ease; } .checkout-button:hover,.empty-shop-button:hover { transform:translateY(-2px);filter:brightness(1.06);box-shadow:0 17px 35px rgba(37,99,235,.38); } .checkout-button:hover svg,.empty-shop-button:hover svg { transform:translateX(3px); }
  .checkout-button.is-loading svg { animation:checkoutArrow 700ms ease infinite; } .summary-note { margin:.58rem 0 0!important;text-align:center;color:var(--text-muted)!important;font-size:.54rem!important; }
  .cart-recommendations { margin-top:clamp(1.15rem,2.5vw,2rem); } .recommendations-heading { margin-bottom:.75rem; } .recommendations-heading>a { color:var(--primary-color);font-size:.72rem;font-weight:800; } .recommendations-heading>a span { margin-left:.2rem; }
  .recommendation-track { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(.7rem,1.5vw,1rem); }
  .recommendation-card { min-width:0;display:grid;grid-template-columns:38% 1fr;overflow:hidden;border:1px solid var(--cart-border);border-radius:16px;background:var(--cart-glass);box-shadow:0 10px 28px rgba(15,23,42,.06);transition:transform 180ms ease,box-shadow 180ms ease; } .recommendation-card:hover { transform:translateY(-3px);box-shadow:0 16px 34px rgba(37,99,235,.12); }
  .recommendation-image { min-height:120px;background:var(--product-image-bg); } .recommendation-image .product-image-container { height:100%!important;aspect-ratio:auto!important;padding:.45rem; } .recommendation-card:hover .product-img { transform:scale(1.05); }
  .recommendation-copy { min-width:0;padding:.75rem .65rem;display:flex;flex-direction:column;justify-content:center; } .recommendation-copy>span { color:var(--primary-color);font-size:.53rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:uppercase; } .recommendation-copy h3 { display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;margin:.2rem 0 .55rem;font-size:.76rem;line-height:1.3; }
  .recommendation-copy>div { display:flex;align-items:center;justify-content:space-between;gap:.3rem; } .recommendation-copy strong { font-size:.75rem; } .recommendation-copy button { height:28px;display:flex;align-items:center;gap:.2rem;padding:0 .5rem;border:0;border-radius:8px;background:#2563eb;color:white;font-size:.62rem;font-weight:800;cursor:pointer;box-shadow:0 5px 12px rgba(37,99,235,.2); }
  .empty-cart-card { width:min(100%,680px);margin:clamp(1.2rem,3vw,2rem) auto;text-align:center;padding:clamp(2rem,5vw,3.5rem);border:1px solid var(--cart-border);border-radius:24px;background:var(--cart-glass);box-shadow:0 20px 55px rgba(15,23,42,.08);backdrop-filter:blur(18px); }
  .empty-cart-art { position:relative;width:112px;height:112px;display:grid;place-items:center;margin:0 auto 1.1rem;border:1px solid rgba(59,130,246,.18);border-radius:28px;background:linear-gradient(145deg,rgba(59,130,246,.12),rgba(255,255,255,.2));transform:rotate(-3deg); } .empty-cart-art svg { width:54px;height:54px;fill:none;stroke:#3b82f6;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transform:rotate(3deg); }
  .empty-bubble { position:absolute;border-radius:50%;background:#60a5fa;box-shadow:0 0 16px rgba(59,130,246,.4); } .bubble-one { width:9px;height:9px;right:13px;top:19px; } .bubble-two { width:6px;height:6px;left:17px;bottom:23px;opacity:.65; }
  .empty-cart-card h2 { margin:.25rem 0 .45rem;font-size:clamp(1.45rem,3vw,2rem);letter-spacing:-.03em; } .empty-cart-card>p { color:var(--text-muted);font-size:.84rem;margin:0 auto 1.2rem;max-width:420px; } .empty-shop-button { width:max-content;min-width:180px;margin:auto; }
  .cart-skeleton { display:grid;grid-template-columns:2fr 1fr;gap:1rem;margin-top:1rem; } .cart-skeleton span { min-height:180px;border-radius:20px;background:linear-gradient(100deg,rgba(148,163,184,.08) 30%,rgba(148,163,184,.18) 50%,rgba(148,163,184,.08) 70%);background-size:300% 100%;animation:skeleton 1.4s infinite; } .cart-skeleton span:nth-child(2){grid-row:span 2}.cart-skeleton span:nth-child(3){min-height:130px}
  @keyframes cartRowIn { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none} } @keyframes qtyPop { 50%{transform:scale(1.17);color:#2563eb} } @keyframes checkoutArrow { 50%{transform:translateX(4px);opacity:.65} } @keyframes skeleton { to{background-position:-150% 0} }
  @media (max-width:1050px) { .cart-layout { grid-template-columns:minmax(0,65fr) minmax(285px,35fr); } .cart-row { grid-template-columns:110px 1fr 110px; } .cart-price-block { grid-column:2;flex-direction:row;align-items:baseline;gap:.45rem; } .cart-price-block .cart-column-label,.line-subtotal-label { display:none; } .cart-row-actions { grid-column:3;grid-row:2; } .recommendation-track { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-width:820px) { .cart-layout { grid-template-columns:1fr; } .summary { position:static; } }
  @media (max-width:600px) { .cart-page { padding-top:.45rem; } .cart-shell { width:min(100% - 1rem,1380px); } .cart-hero { min-height:132px;border-radius:18px;padding:1.35rem .8rem; } .cart-hero h1 { font-size:clamp(1.2rem,7vw,1.9rem); } .cart-actions-top { margin:.7rem 0; } .continue-shopping,.clear-cart { min-height:44px;font-size:.72rem; } .cart-row { grid-template-columns:88px minmax(0,1fr);gap:.7rem;padding:.75rem;border-radius:17px;align-items:start; } .cart-thumb { grid-row:1/3; } .row-main p { display:none; } .product-pills span:nth-child(n+2) { display:none; } .cart-quantity-block { grid-column:2;flex-direction:row;align-items:center;justify-content:space-between;margin-top:.15rem; } .cart-quantity-block .cart-column-label { display:none; } .qty { grid-template-columns:38px 35px 38px; } .qty button { width:38px;height:38px; } .cart-price-block { grid-column:1;grid-row:3;flex-direction:column;gap:.05rem;align-items:flex-start; } .cart-price-block strong { display:none; } .cart-price-block .line-subtotal-label { display:block; } .cart-row-actions { grid-column:2;grid-row:3;align-self:end; } .remove { min-height:40px; } .summary { padding:1rem;border-radius:17px; } .recommendation-track { display:flex;overflow-x:auto;scroll-snap-type:x mandatory;padding:.15rem .05rem .75rem;scrollbar-width:none; } .recommendation-track::-webkit-scrollbar { display:none; } .recommendation-card { flex:0 0 min(82vw,300px);scroll-snap-align:start; } .recommendations-heading { align-items:flex-end; } .recommendation-copy button span { display:inline; } .cart-list-heading { padding-inline:.15rem; } }
  @media (prefers-reduced-motion:reduce) { .cart-page * { animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.001ms!important; } }
`;
