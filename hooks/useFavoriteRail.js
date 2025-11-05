"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/redux/slices/cartSlice";

const DEFAULT_WINDOW = 6;
const DEFAULT_FETCH_LIMIT = 24;
const TOAST_MS = 1400;
const clampInt = (n, min, max) => Math.max(min, Math.min(max, n));
const score = (p, cartCats) => (cartCats.has(p.category) ? 2 : 0) + 1;

export function useFavoritesRail(
  { windowSize = DEFAULT_WINDOW, fetchLimit = DEFAULT_FETCH_LIMIT } = {}
) {
  const dispatch = useDispatch();

  // --- Cart snapshot
  const cartItems = useSelector((s) => s.cart.items);
  const cartIds = useMemo(() => new Set(cartItems.map((i) => i.id)), [cartItems]);
  const cartCats = useMemo(
    () => new Set(cartItems.map((i) => (i.category ?? "").trim()).filter(Boolean)),
    [cartItems]
  );

  // --- State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState([]); // rendered window
  const [pool, setPool] = useState([]); // off-screen candidates
  const [toast, setToast] = useState(null);

  // --- Refs
  const visibleRef = useRef([]);
  const poolRef = useRef([]);
  const toastTimerRef = useRef(null);
  const replenishingRef = useRef(false);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // ────────────────────────────────
  // Fetch favorites (Axios version)
  // ────────────────────────────────
  const fetchFavorites = useCallback(
    async (opts = {}) => {
      const { limit = fetchLimit, random = false, minStock = 1 } = opts;

      const params = new URLSearchParams();
      params.set("limit", String(clampInt(limit, 1, 50)));
      params.set("minStock", String(Math.max(0, minStock)));
      if (random) params.set("random", "1");

      // exclude current visible + cart items
      const exclude = new Set([
        ...visibleRef.current.map((v) => v.id),
        ...Array.from(cartIds),
      ]);
      if (exclude.size) params.set("exclude", Array.from(exclude).join(","));

      const url = `/api/products/favorites?${params.toString()}`;
      console.log("[Axios] Calling:", url);

      try {
        const { data } = await axios.get(url, { timeout: 10000 });
        return Array.isArray(data?.items) ? data.items : [];
      } catch (err) {
        console.error("[Axios] Error at:", url, err);
        throw err;
      }
    },
    [cartIds, fetchLimit]
  );

  // ────────────────────────────────
  // Initial load
  // ────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // First pass: ordered fetch
        const items = await fetchFavorites({ random: false });
        if (!alive) return;

        const candidates = items
          .map((p) => ({ ...p, __score: score(p, cartCats) }))
          .sort((a, b) => b.__score - a.__score);

        const initial = candidates.slice(0, windowSize);
        const rest = candidates.slice(windowSize);

        setVisible(initial);
        visibleRef.current = initial;
        setPool(rest);
        poolRef.current = rest;

        // Top up if fewer than windowSize
        if (initial.length < windowSize) {
          const more = await fetchFavorites({ random: true, limit: fetchLimit });
          if (!alive) return;
          const seen = new Set(initial.map((i) => i.id));
          const deduped = more.filter((p) => !seen.has(p.id));
          const need = windowSize - initial.length;
          const fill = deduped.slice(0, need);
          const nextVisible = [...initial, ...fill];
          const nextPool = deduped.slice(need);

          setVisible(nextVisible);
          visibleRef.current = nextVisible;
          setPool(nextPool);
          poolRef.current = nextPool;
        }
      } catch (e) {
        if (alive) setError(e);
        console.error("[FavoritesRail] ❌ Init error:", e);
        setVisible([]); visibleRef.current = [];
        setPool([]); poolRef.current = [];
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchFavorites, cartCats, windowSize, fetchLimit]);

  // ────────────────────────────────
  // Ensure we have windowSize visible
  // ────────────────────────────────
  const ensureFill = useCallback(async () => {
    let changed = false;
    let vis = [...visibleRef.current];
    let poolArr = [...poolRef.current];

    // 1️⃣ Fill from pool
    const used = new Set([...vis.map((v) => v.id), ...Array.from(cartIds)]);
    while (vis.length < windowSize && poolArr.length) {
      const idx = poolArr.findIndex((p) => !used.has(p.id));
      if (idx === -1) break;
      const [pick] = poolArr.splice(idx, 1);
      vis.push(pick);
      used.add(pick.id);
      changed = true;
    }

    if (changed) {
      setVisible(vis);
      visibleRef.current = vis;
      setPool(poolArr);
      poolRef.current = poolArr;
    }

    // 2️⃣ Replenish if still short
    if (vis.length < windowSize && !replenishingRef.current) {
      replenishingRef.current = true;
      try {
        const more = await fetchFavorites({ random: true, limit: fetchLimit });
        let poolNew = [...poolRef.current, ...more];

        const used2 = new Set([
          ...visibleRef.current.map((v) => v.id),
          ...Array.from(cartIds),
        ]);
        poolNew = poolNew.filter((p) => !used2.has(p.id));

        poolNew.sort(() => Math.random() - 0.5);

        setPool(poolNew);
        poolRef.current = poolNew;

        // Try to fill again
        vis = [...visibleRef.current];
        let changed2 = false;
        while (vis.length < windowSize && poolNew.length) {
          vis.push(poolNew.shift());
          changed2 = true;
        }

        if (changed2) {
          setVisible(vis);
          visibleRef.current = vis;
          setPool(poolNew);
          poolRef.current = poolNew;
        }
      } finally {
        replenishingRef.current = false;
      }
    }
  }, [cartIds, fetchFavorites, fetchLimit, windowSize]);

  // ────────────────────────────────
  // Handle cart changes (prune + refill)
  // ────────────────────────────────
  useEffect(() => {
    setVisible((curr) => {
      const next = curr.filter((p) => !cartIds.has(p.id));
      visibleRef.current = next;
      return next;
    });
    setPool((prev) => {
      const next = prev.filter((p) => !cartIds.has(p.id));
      poolRef.current = next;
      return next;
    });
    void ensureFill();
  }, [cartIds, ensureFill]);

  // ────────────────────────────────
  // Add to cart + replace
  // ────────────────────────────────
  const addAndReplace = useCallback(
    (product, requestedIndex) => {
      dispatch(
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          quantity: 1,
          stock: product.stock,
          description: product.description,
          category: product.category,
        })
      );

      // toast
      setToast({ name: product.name });
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToast(null), TOAST_MS);

      // replace in visible
      setVisible((curr) => {
        const list = [...curr];
        let idx = list.findIndex((x) => x.id === product.id);
        if (idx === -1) {
          idx = Math.min(
            Math.max(0, requestedIndex ?? list.length - 1),
            list.length - 1
          );
          if (list.length === 0) {
            void ensureFill();
            return list;
          }
        }

        const usedIds = new Set(list.map((x) => x.id));
        usedIds.add(product.id);

        const available = poolRef.current.filter((x) => !usedIds.has(x.id));
        if (available.length) {
          const pick = available[Math.floor(Math.random() * available.length)];
          list.splice(idx, 1, pick);
          const nextPool = poolRef.current.filter((x) => x.id !== pick.id);
          poolRef.current = nextPool;
          setPool(nextPool);
        } else {
          // temporarily shrink, ensureFill will top up
          list.splice(idx, 1);
        }

        visibleRef.current = list;
        void ensureFill();
        return list;
      });
    },
    [dispatch, ensureFill]
  );

  // ────────────────────────────────
  // Auto-fill if pool changes
  // ────────────────────────────────
  useEffect(() => {
    if (!loading && visibleRef.current.length < windowSize) {
      void ensureFill();
    }
  }, [pool, loading, windowSize, ensureFill]);

  return { loading, error, visible, toast, setToast, addAndReplace };
}
