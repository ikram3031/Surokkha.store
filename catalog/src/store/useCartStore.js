import { create } from 'zustand';

const CART_STORAGE_KEY = 'surokkha_catalog_cart_v1';

const getInitialItems = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse cart storage:', e);
    return [];
  }
};

const saveItems = (items) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save cart storage:', e);
  }
};

export const useCartStore = create((set, get) => ({
  items: getInitialItems(),
  isCartOpen: false,

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

  addToCart: (product, quantity = 1) => {
    const qty = Math.max(1, Number(quantity) || 1);
    const current = get().items;
    const existingIndex = current.findIndex((item) => item.id === product.id || item.slug === product.slug);

    let nextItems;
    if (existingIndex > -1) {
      nextItems = current.map((item, idx) => {
        if (idx === existingIndex) {
          return { ...item, quantity: item.quantity + qty };
        }
        return item;
      });
    } else {
      nextItems = [
        ...current,
        {
          id: product.id || product.slug,
          slug: product.slug,
          name: product.name,
          name_bn: product.name_bn || product.name,
          packSize: product.packSize || '',
          price: product.price || 0,
          regularPrice: product.regularPrice || product.price || 0,
          offerPrice: product.offerPrice || product.price || 0,
          imageUrl: product.imageUrl || (Array.isArray(product.images) ? product.images[0] : ''),
          quantity: qty,
        }
      ];
    }

    saveItems(nextItems);
    set({ items: nextItems });
  },

  removeFromCart: (productId) => {
    const current = get().items;
    const nextItems = current.filter((item) => item.id !== productId && item.slug !== productId);
    saveItems(nextItems);
    set({ items: nextItems });
  },

  updateQuantity: (productId, quantity) => {
    const newQty = Number(quantity);
    if (newQty <= 0) {
      get().removeFromCart(productId);
      return;
    }

    const current = get().items;
    const nextItems = current.map((item) => {
      if (item.id === productId || item.slug === productId) {
        return { ...item, quantity: newQty };
      }
      return item;
    });

    saveItems(nextItems);
    set({ items: nextItems });
  },

  clearCart: () => {
    saveItems([]);
    set({ items: [] });
  },

  getTotalItems: () => {
    return get().items.reduce((acc, item) => acc + (item.quantity || 1), 0);
  },

  getTotalPrice: () => {
    return get().items.reduce((acc, item) => {
      const price = item.offerPrice ?? item.price ?? 0;
      return acc + (price * (item.quantity || 1));
    }, 0);
  }
}));
