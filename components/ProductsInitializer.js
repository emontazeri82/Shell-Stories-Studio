"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchProducts } from "@/redux/slices/productsSlice";

export default function ProductsInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  return null;
}
