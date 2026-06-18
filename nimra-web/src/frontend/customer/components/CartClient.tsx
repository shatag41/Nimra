'use client';

import Link from 'next/link';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { CartItemsList, CartSummary } from './portal/Cart';

export default function CartClient() {
  const { items } = useCart();

  if (items.length === 0) {
    return (
      <section className="cart-page">
        <div className="container">
          <div className="page-header animate-slide-up">
            <span className="badge badge-primary">Cart</span>
            <h1>Your Cart is Empty</h1>
            <p>Add NIMRA bottles or bulk jars and checkout for home or office delivery.</p>
          </div>
          <div className="empty-cart-action">
             <Link href="/products" className="btn btn-primary">Continue Shopping</Link>
          </div>
        </div>
        <style jsx global>{styles}</style>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="container">
        <div className="page-header animate-slide-up">
          <span className="badge badge-primary">Cart</span>
          <h1>Your Order Cart</h1>
          <p>Review your selected products and proceed to checkout.</p>
        </div>

        <div className="cart-actions-top">
           <Link href="/products" className="btn btn-secondary btn-sm">← Continue Shopping</Link>
        </div>

        <div className="cart-layout animate-fade-in">
          <CartItemsList />
          <CartSummary />
        </div>
      </div>
      <style jsx global>{styles}</style>
    </section>
  );
}

const styles = `
  .cart-page { padding-top: 0.5rem; padding-bottom: 4rem; min-height: 90vh; font-family: var(--font-body); }
  
  /* ── Page Header ── */
  .page-header {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .page-header h1 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.15rem;
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }
  .page-header p {
    color: var(--text-muted);
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.4;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0.3rem 0.85rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
  }
  .badge-primary {
    background: rgba(37, 99, 235, 0.1);
    color: var(--primary-color);
    border: 1px solid rgba(37, 99, 235, 0.2);
  }

  .empty-cart-action { text-align: center; margin-top: 2rem; }
  .cart-actions-top { margin-bottom: 1rem; display: flex; justify-content: flex-start; }

  /* ── Cart Layout ── */
  .cart-layout { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start; }
  
  .cart-list { display: flex; flex-direction: column; gap: 1rem; }
  
  .cart-row { 
    display: grid; 
    grid-template-columns: 80px 1fr auto auto; 
    gap: 1.25rem; 
    align-items: center; 
    padding: 1rem; 
    border-radius: var(--radius-md); 
    background: var(--bg-primary); 
    border: 1px solid var(--border-color); 
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-fast); 
  }
  .cart-row:hover { 
    border-color: var(--primary-color); 
    box-shadow: var(--shadow-md); 
  }
  .cart-row img { 
    width: 80px; 
    height: 80px; 
    object-fit: contain; 
    background: var(--bg-secondary); 
    border-radius: var(--radius-sm); 
    border: 1px solid var(--border-light); 
  }
  
  .row-main { display: flex; flex-direction: column; justify-content: center; }
  .row-main span { color: var(--primary-color); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
  .row-main h3 { margin: 0.25rem 0; font-size: 1.1rem; font-weight: 600; color: var(--text-primary); }
  .row-main strong { font-size: 1.05rem; color: var(--text-primary); }
  
  /* ── Quantity Controls ── */
  .qty { 
    display: grid; 
    grid-template-columns: 32px 36px 32px; 
    align-items: center; 
    border: 1.5px solid var(--border-color); 
    border-radius: var(--radius-md); 
    overflow: hidden; 
    background: var(--bg-secondary); 
  }
  .qty button, .remove { 
    border: none; 
    cursor: pointer; 
    background: transparent; 
    transition: all var(--transition-fast); 
  }
  .qty button { 
    color: var(--text-primary); 
    font-weight: 600; 
    height: 32px; 
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .qty button:hover { 
    background: rgba(var(--primary-rgb), 0.1); 
    color: var(--primary-color); 
  }
  .qty span { 
    text-align: center; 
    font-weight: 600; 
    font-size: 0.9rem;
  }
  
  .remove { 
    color: var(--text-muted); 
    font-size: 0.85rem;
    font-weight: 500;
    padding: 0.5rem 0.75rem; 
    border-radius: var(--radius-sm); 
  }
  .remove:hover { 
    color: #dc2626; 
    background: rgba(220, 38, 38, 0.05); 
  }
  
  /* ── Summary ── */
  .summary { 
    border-radius: var(--radius-lg); 
    padding: 1.5rem; 
    position: sticky; 
    top: 90px; 
    background: var(--bg-primary); 
    border: 1px solid var(--border-color); 
    box-shadow: var(--shadow-sm); 
  }
  .summary h2 { 
    margin-bottom: 1.25rem; 
    font-size: 1.15rem; 
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.75rem;
  }
  .summary div { 
    display: flex; 
    justify-content: space-between; 
    padding: 0.6rem 0; 
    font-size: 0.95rem;
  }
  .summary div span { color: var(--text-secondary); }
  .summary div strong { color: var(--text-primary); font-weight: 600; }
  .summary p { 
    color: var(--primary-color); 
    font-size: 0.85rem; 
    margin: 0.5rem 0 1rem; 
    background: rgba(var(--primary-rgb), 0.05);
    padding: 0.5rem;
    border-radius: var(--radius-sm);
    text-align: center;
  }
  .summary .total { 
    font-size: 1.15rem; 
    border-top: 1px solid var(--border-color); 
    margin-top: 0.5rem; 
    padding-top: 1rem;
    margin-bottom: 1.5rem; 
  }
  .summary .total span { font-weight: 600; color: var(--text-primary); }
  .summary .total strong { color: var(--primary-color); font-size: 1.25rem; }
  .summary .btn { 
    width: 100%; 
    justify-content: center; 
    font-weight: 600;
    padding: 0.75rem;
  }
  
  /* ── Responsive ── */
  @media (max-width: 900px) { 
    .cart-layout { grid-template-columns: 1fr; } 
    .summary { position: static; } 
  }
  @media (max-width: 640px) { 
    .cart-row { 
      grid-template-columns: 60px 1fr; 
      gap: 1rem;
      align-items: start;
    } 
    .cart-row img { 
      width: 60px; 
      height: 60px; 
    } 
    .qty, .remove { 
      grid-column: 2; 
      justify-self: start; 
      margin-top: -0.5rem;
    } 
    .remove {
      justify-self: end;
      grid-column: 2;
      grid-row: 2;
      margin-top: -0.5rem;
    }
    .qty {
      grid-column: 2;
      grid-row: 2;
    }
  }
`;

