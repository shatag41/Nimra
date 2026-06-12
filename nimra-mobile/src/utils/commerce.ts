import { CartItem, Product } from '../types/cms';

export const DELIVERY_CHARGE = 30;
export const FREE_DELIVERY_MINIMUM = 500;

export const priceOf = (value: number | string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeCategory = (category: string) => {
  if (/bulk|20l|jar/i.test(category)) return 'Bulk Water';
  if (/mineral/i.test(category)) return 'Mineral Water';
  if (/soda|rush/i.test(category)) return 'Upcoming RUSH Soda';
  return 'Packaged Drinking Water';
};

export const isOrderable = (product: Product) => {
  const stock = String(product.StockStatus || '').toLowerCase();
  return !/coming|soon|unavailable|out/.test(stock) && !/soda|rush/i.test(product.Category);
};

export const productToCartItem = (product: Product, quantity = 1): CartItem => ({
  productId: String(product.ID || product.Name),
  name: product.Name,
  category: normalizeCategory(product.Category),
  volume: product.Volume,
  price: priceOf(product.Price),
  imageUrl: product.ImageUrl,
  quantity,
});

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.price * item.quantity, 0);

export const deliveryChargeFor = (subtotal: number) =>
  subtotal > 0 && subtotal < FREE_DELIVERY_MINIMUM ? DELIVERY_CHARGE : 0;

export const formatCurrency = (value: number) => `Rs ${Math.round(value)}`;
