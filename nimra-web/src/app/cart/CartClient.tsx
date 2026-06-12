'use client';

import Link from 'next/link';
import { useCart } from '../../components/CartProvider';
import { FREE_DELIVERY_MINIMUM, formatCurrency } from '../../utils/commerce';

export default function CartClient() {
  const { items, subtotal, deliveryCharge, grandTotal, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <section className="cart-page">
        <div className="container empty">
          <span className="badge badge-primary">Cart</span>
          <h1>Your cart is empty</h1>
          <p>Add NIMRA bottles or bulk jars and checkout for home or office delivery.</p>
          <Link href="/products" className="btn btn-primary">Continue Shopping</Link>
        </div>
        <style jsx>{styles}</style>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="container">
        <div className="cart-head">
          <div>
            <span className="badge badge-primary">Cart</span>
            <h1>Your Order Cart</h1>
          </div>
          <Link href="/products" className="btn btn-secondary">Add More</Link>
        </div>

        <div className="cart-layout">
          <div className="cart-list">
            {items.map((item) => (
              <article key={item.productId} className="cart-row glass">
                <img src={item.imageUrl} alt={item.name} />
                <div className="row-main">
                  <span>{item.category} / {item.volume}</span>
                  <h3>{item.name}</h3>
                  <strong>{formatCurrency(item.price)}</strong>
                </div>
                <div className="qty">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                </div>
                <button className="remove" onClick={() => removeItem(item.productId)}>Remove</button>
              </article>
            ))}
          </div>

          <aside className="summary glass">
            <h2>Order Summary</h2>
            <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
            <div><span>Delivery</span><strong>{deliveryCharge ? formatCurrency(deliveryCharge) : 'Free'}</strong></div>
            {subtotal < FREE_DELIVERY_MINIMUM && (
              <p>Add {formatCurrency(FREE_DELIVERY_MINIMUM - subtotal)} more for free delivery.</p>
            )}
            <div className="total"><span>Grand Total</span><strong>{formatCurrency(grandTotal)}</strong></div>
            <Link href="/checkout" className="btn btn-primary">Checkout</Link>
          </aside>
        </div>
      </div>
      <style jsx>{styles}</style>
    </section>
  );
}

const styles = `
  .cart-page { background: var(--bg-secondary); min-height: 70vh; }
  .empty { text-align: center; max-width: 620px; }
  .empty h1, .cart-head h1 { font-size: 2.6rem; margin: 1rem 0; }
  .empty p { color: var(--text-secondary); margin-bottom: 2rem; }
  .cart-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; margin-bottom: 2rem; }
  .cart-layout { display: grid; grid-template-columns: 1fr 360px; gap: 2rem; align-items: start; }
  .cart-list { display: grid; gap: 1rem; }
  .cart-row { display: grid; grid-template-columns: 110px 1fr auto auto; gap: 1rem; align-items: center; padding: 1rem; border-radius: 8px; }
  .cart-row img { width: 110px; height: 110px; object-fit: contain; background: var(--bg-primary); border-radius: 8px; }
  .row-main span { color: var(--primary-color); font-size: 0.78rem; font-weight: 800; }
  .row-main h3 { margin: 0.3rem 0; font-size: 1.1rem; }
  .qty { display: grid; grid-template-columns: 36px 42px 36px; align-items: center; border: 1px solid var(--border-color); border-radius: 999px; overflow: hidden; }
  .qty button, .remove { border: none; cursor: pointer; background: transparent; color: var(--text-primary); font-weight: 800; height: 36px; }
  .qty span { text-align: center; font-weight: 800; }
  .remove { color: #dc2626; padding: 0 0.5rem; }
  .summary { border-radius: 8px; padding: 1.5rem; position: sticky; top: 100px; }
  .summary h2 { margin-bottom: 1rem; }
  .summary div { display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid var(--border-color); }
  .summary p { color: var(--text-secondary); font-size: 0.9rem; margin: 1rem 0; }
  .summary .total { font-size: 1.2rem; border-bottom: none; margin-bottom: 1rem; }
  .summary .btn { width: 100%; justify-content: center; }
  @media (max-width: 900px) { .cart-layout { grid-template-columns: 1fr; } .summary { position: static; } }
  @media (max-width: 640px) { .cart-head { align-items: flex-start; flex-direction: column; } .cart-row { grid-template-columns: 84px 1fr; } .cart-row img { width: 84px; height: 84px; } .qty, .remove { grid-column: 2; justify-self: start; } }
`;
