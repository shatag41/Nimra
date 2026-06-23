import { CartItem, Product } from '@/types/cms';

export const DELIVERY_CHARGE = 30;
export const FREE_DELIVERY_MINIMUM = 500;

export const productId = (product: Product) => String(product.ID || product.Name);

export const priceOf = (value: number | string) => {
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const comparableText = (value: unknown) =>
  String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');

const displayNameWithoutVolume = (value: unknown) =>
  String(value || '').replace(/\s*\([^()]*\)\s*$/, '').trim();

export const normalizeCartItem = (item: CartItem): CartItem => ({
  ...item,
  productId: String(item.productId || item.name),
  name: displayNameWithoutVolume(item.name),
  category: String(item.category || ''),
  volume: String(item.volume || ''),
  price: priceOf(item.price || 0),
  imageUrl: String(item.imageUrl || ''),
  quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
});

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

export const findMatchingProduct = (item: CartItem, products: Product[] = []) => {
  const normalized = normalizeCartItem(item);
  const itemProductId = comparableText(normalized.productId);
  const itemName = comparableText(normalized.name);
  const itemNameFromId = comparableText(displayNameWithoutVolume(normalized.productId));
  const itemVolume = comparableText(normalized.volume);

  return products.find((product) => {
    const catalogId = comparableText(product.ID);
    const catalogName = comparableText(product.Name);
    const catalogVolume = comparableText(product.Volume);

    if (catalogId && itemProductId === catalogId) return true;
    if (catalogName && (itemName === catalogName || itemNameFromId === catalogName)) return true;
    if (catalogName && itemVolume && catalogVolume && (itemName.includes(catalogName) || itemNameFromId.includes(catalogName)) && itemVolume === catalogVolume) return true;
    return false;
  });
};

export const hydrateCartItemFromCatalog = (item: CartItem, products: Product[] = []): CartItem => {
  const normalized = normalizeCartItem(item);
  const product = findMatchingProduct(normalized, products);
  if (!product) return normalized;

  return {
    ...productToCartItem(product, normalized.quantity),
    price: priceOf(product.Price) || normalized.price,
  };
};

export const mergeCartItems = (items: CartItem[]) => {
  const merged = new Map<string, CartItem>();

  items.map(normalizeCartItem).forEach((item) => {
    const existing = merged.get(item.productId);
    if (!existing) {
      merged.set(item.productId, item);
      return;
    }

    const preferredMetadata = item.price > 0 ? item : existing;
    merged.set(item.productId, {
      ...existing,
      ...preferredMetadata,
      quantity: existing.quantity + item.quantity,
      price: preferredMetadata.price || existing.price || item.price,
    });
  });

  return Array.from(merged.values());
};

export const mergeCartSnapshots = (items: CartItem[]) => {
  const merged = new Map<string, CartItem>();

  items.map(normalizeCartItem).forEach((item) => {
    const existing = merged.get(item.productId);
    if (!existing) {
      merged.set(item.productId, item);
      return;
    }

    const preferredMetadata = item.price > 0 ? item : existing;
    merged.set(item.productId, {
      ...existing,
      ...preferredMetadata,
      quantity: item.quantity || existing.quantity,
      price: preferredMetadata.price || existing.price || item.price,
    });
  });

  return Array.from(merged.values());
};

export const hydrateCartItemsFromCatalog = (items: CartItem[], products: Product[] = []) =>
  mergeCartSnapshots(items.map((item) => hydrateCartItemFromCatalog(item, products)));

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + priceOf(item.price) * item.quantity, 0);

export const deliveryChargeFor = (subtotal: number) =>
  subtotal > 0 && subtotal < FREE_DELIVERY_MINIMUM ? DELIVERY_CHARGE : 0;

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export const trackProductView = (product: Product) => {
  if (typeof window === 'undefined') return;
  try {
    const key = 'nimra-recently-viewed';
    const existingStr = localStorage.getItem(key);
    let existing: Product[] = [];
    if (existingStr) {
      existing = JSON.parse(existingStr);
    }
    // Remove if already exists to move to front
    existing = existing.filter((p) => String(p.ID || p.Name) !== String(product.ID || product.Name));
    // Add to front
    existing.unshift(product);
    // Keep last 4 products
    existing = existing.slice(0, 4);
    localStorage.setItem(key, JSON.stringify(existing));
    // Dispatch a custom event to notify listeners (e.g. the dashboard section)
    window.dispatchEvent(new Event('nimra-recently-viewed-updated'));
  } catch (e) {
    console.error('Error tracking product view:', e);
  }
};

