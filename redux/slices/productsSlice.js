// redux/slices/productsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Thunk to fetch products from API
export const fetchProducts = createAsyncThunk("products/fetch", async () => {
  const res = await fetch("/api/products");
  const data = await res.json();
  return data;
});

const productsSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    // ✅ NEW: update a single product in the local store
    updateProductInStore(state, action) {
      const patch = action.payload; // { id, ...fields changed }
      const idx = state.items.findIndex(p => p.id === patch.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...patch };
      }
    },
    // (optional) bulk-upsert helper (useful for bulk actions)
    upsertProductsInStore(state, action) {
      const updates = action.payload; // array of {id,...}
      const map = new Map(state.items.map(p => [p.id, p]));
      updates.forEach(u => {
        const existing = map.get(u.id);
        map.set(u.id, existing ? { ...existing, ...u } : u);
      });
      state.items = Array.from(map.values());
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = "Failed to fetch products";
      });
  },
});

export const { updateProductInStore, upsertProductsInStore } = productsSlice.actions;
export default productsSlice.reducer;
