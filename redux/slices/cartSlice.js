// redux/slices/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],        // [{ id, name, price, image_url, quantity, stock }]
  total: 0,
  sessionId: null,
  isCartOpen: false,
};

// Helper: always keep total correct in one place
const recalcTotal = (state) => {
  state.total = state.items.reduce((sum, item) => {
    const basePrice = Number(item.price || 0);
    const hasDiscount =
      Number(item.discount_active) === 1 &&
      Number(item.discount_percent) > 0;

    const unitPrice = hasDiscount
      ? basePrice - (basePrice * item.discount_percent) / 100
      : basePrice;

    return sum + unitPrice * Number(item.quantity || 0);
  }, 0);
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action) {
      const payload = action.payload || {};
      const id = payload.id;
      if (id == null) return; // ignore bad payload

      const existing = state.items.find(i => i.id === id);
      const incomingQty = Number(payload.quantity || 0);
      const incomingStock = payload.stock; // may be undefined

      if (existing) {
        const max = existing.stock ?? Infinity;
        existing.quantity = Math.min(existing.quantity + incomingQty, max);
      } else {
        // Ensure at least 1 and clamp to stock if provided
        const qty = Math.max(1, incomingQty || 1);
        const max = incomingStock ?? Infinity;
        state.items.push({
          id: payload.id,
          name: payload.name,
          price: Number(payload.price || 0),
          discount_active: payload.discount_active,
          discount_percent: payload.discount_percent,
          image_url: payload.image_url,
          quantity: Math.min(qty, max),
          stock: incomingStock, // persist stock on the line
          description: payload.description,
        });
      }
      recalcTotal(state);
    },

    removeFromCart(state, action) {
      const id = action.payload;
      state.items = state.items.filter(i => i.id !== id);
      recalcTotal(state);
    },

    clearCart(state) {
      state.items = [];
      state.total = 0;
    },

    incrementQuantity(state, action) {
      const id = action.payload;
      const item = state.items.find(i => i.id === id);
      if (!item) return;

      const max = item.stock ?? Infinity;
      if (item.quantity < max) {
        item.quantity += 1;
        recalcTotal(state);
      }
      // else: already at max; no change
    },

    decrementQuantity(state, action) {
      const id = action.payload;
      const item = state.items.find(i => i.id === id);
      if (!item) return;

      if (item.quantity > 1) {
        item.quantity -= 1;
        recalcTotal(state);
      }
      // else: keep at 1; if you prefer removing at 0, adjust here
    },

    setSessionId(state, action) {
      state.sessionId = action.payload;
    },

    openCart(state) { state.isCartOpen = true; },
    closeCart(state) { state.isCartOpen = false; },
    toggleCart(state) { state.isCartOpen = !state.isCartOpen; },

    setCartItems(state, action) {
      const next = Array.isArray(action.payload) ? action.payload : [];
      // normalize incoming items a bit
      state.items = next.map(i => ({
        ...i,
        price: Number(i.price || 0),
        discount_active: Number(i.discount_active || 0),
        discount_percent: Number(i.discount_percent || 0),
        quantity: Math.max(1, Number(i.quantity || 1)),
      }));      
      recalcTotal(state);
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  clearCart,
  incrementQuantity,
  decrementQuantity,
  setSessionId,
  openCart,
  closeCart,
  toggleCart,
  setCartItems,
} = cartSlice.actions;

export default cartSlice.reducer;


