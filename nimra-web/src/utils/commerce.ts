import { CartItem, Product } from '../types/cms';

export const DELIVERY_CHARGE = 30;
export const FREE_DELIVERY_MINIMUM = 500;

export const productId = (product: Product) => String(product.ID || product.Name);

export const priceOf = (value: number | string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeCategory = (category: string) => {
  const value = category.trim();
  if (/bulk|20l|jar/i.test(value)) return 'Bulk Water';
  if (/mineral/i.test(value)) return 'Mineral Water';
  if (/soda|rush/i.test(value)) return 'Upcoming RUSH Soda';
  return 'Packaged Drinking Water';
};

export const isOrderable = (product: Product) => {
  const stock = String(product.StockStatus || '').toLowerCase();
  return !/coming|soon|unavailable|out/.test(stock) && !/soda|rush/i.test(product.Category);
};

export const productToCartItem = (product: Product, quantity = 1): CartItem => ({
  productId: productId(product),
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

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
