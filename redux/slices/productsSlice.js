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
  reducers: {},
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

export default productsSlice.reducer;
