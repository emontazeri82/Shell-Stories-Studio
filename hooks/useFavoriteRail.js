"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/redux/slices/cartSlice";

const DEBUG = true; // ⬅️ ENABLE SUPER LOGGING
const DEFAULT_WINDOW = 6;
const DEFAULT_FETCH_LIMIT = 24;
const TOAST_MS = 1400;

const clampInt = (n, min, max) => Math.max(min, Math.min(max, n));
const score = (p, cartCatsSet) =>
  (cartCatsSet.has(p.category) ? 2 : 0) + 1;

function log(...args) {
  if (DEBUG) console.log("[FavoritesRail]", ...args);
}

export function useFavoritesRail(
  { windowSize = DEFAULT_WINDOW, fetchLimit = DEFAULT_FETCH_LIMIT } = {}
) {
  const dispatch = useDispatch();

  // ──────────────────────────────────────────────
  // Cart snapshot
  // ──────────────────────────────────────────────
  const cartItems = useSelector((s) => s.cart.items);

  const cartIds = useMemo(() => {
    return new Set(cartItems.map((i) => i.id));
  }, [cartItems.length]);  


  const cartCats = useMemo(
    () => new Set(
      cartItems
        .map((i) => (i.category ?? "").trim())
        .filter(Boolean)
    ),
    [cartItems.length]
  );
  if (!(cartCats instanceof Set)) {
    console.error("cartCats is not a Set!", cartCats);
  }


  // ──────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState([]);
  const [pool, setPool] = useState([]);
  const [toast, setToast] = useState(null);

  // ──────────────────────────────────────────────
  // Refs
  // ──────────────────────────────────────────────
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

  // ──────────────────────────────────────────────
  // Fetch favorites (Axios)
  // ──────────────────────────────────────────────
  const fetchFavorites = useCallback(
    async (opts = {}) => {
      const {
        limit = fetchLimit,
        random = false,
        minStock = 1,
      } = opts;

      const params = new URLSearchParams();
      params.set("limit", String(clampInt(limit, 1, 50)));
      params.set("minStock", String(Math.max(0, minStock)));
      if (random) params.set("random", "1");

      // Exclusion list
      const exclude = new Set([
        ...visibleRef.current.map((v) => v.id),
        ...Array.from(cartIds),
      ]);
      if (exclude.size) {
        params.set("exclude", Array.from(exclude).join(","));
      }

      const url = `/api/products/favorites?${params.toString()}`;

      log("➡️ fetchFavorites()", { url, opts, exclude });

      try {
        const { data } = await axios.get(url, { timeout: 10000 });

        const items = Array.isArray(data?.items) ? data.items : [];
        log("⬅️ fetchFavorites success — count:", items.length);
        return items;
      } catch (err) {
        console.error("[Axios] Error at:", url, err);
        throw err;
      }
    },
    [cartIds, fetchLimit]
  );

  // ──────────────────────────────────────────────
  // INITIAL LOAD
  // ──────────────────────────────────────────────
  useEffect(() => {
    let alive = true;

    (async () => {
      log("🚀 Initial load start");
      setLoading(true);
      setError(null);

      try {
        const items = await fetchFavorites({ random: false });
        if (!alive) return;

        log("Received initial items:", items.length);

        const candidates = items
          .map((p) => ({
            ...p,
            __score: score(p, cartCats),
          }))
          .sort((a, b) => b.__score - a.__score);

        const initial = candidates.slice(0, windowSize);
        const rest = candidates.slice(windowSize);

        log("Initial visible:", initial.map((x) => x.id));
        log("Initial pool:", rest.map((x) => x.id));

        setVisible(initial);
        visibleRef.current = initial;

        setPool(rest);
        poolRef.current = rest;

        // Fill if not enough
        if (initial.length < windowSize) {
          log("⚠️ Initial < windowSize — fetching more…");

          const more = await fetchFavorites({ random: true });
          if (!alive) return;

          const seen = new Set(initial.map((x) => x.id));
          const deduped = more.filter((p) => !seen.has(p.id));

          const need = windowSize - initial.length;
          const fill = deduped.slice(0, need);

          const nextVisible = [...initial, ...fill];
          const nextPool = deduped.slice(need);

          log("Filled visible:", nextVisible.map((x) => x.id));
          log("Updated pool:", nextPool.map((x) => x.id));

          setVisible(nextVisible);
          visibleRef.current = nextVisible;

          setPool(nextPool);
          poolRef.current = nextPool;
        }
      } catch (e) {
        if (alive) setError(e);
        log("❌ Init error:", e);

        setVisible([]);
        visibleRef.current = [];
        setPool([]);
        poolRef.current = [];
      } finally {
        if (alive) setLoading(false);
        log("🏁 Initial load finished");
      }
    })();

    return () => {
      alive = false;
    };
  }, [fetchFavorites, cartCats, windowSize, fetchLimit]);

  // ──────────────────────────────────────────────
  // ensureFill()
  // ──────────────────────────────────────────────
  const ensureFill = useCallback(async () => {
    if (visibleRef.current.length < windowSize && poolRef.current.length === 0) {
      log("⚠️ Warning: Cannot fill rail — server returned no additional favorites.");
    }

    log("🔍 ensureFill()", {
      vis: visibleRef.current.map((x) => x.id),
      pool: poolRef.current.map((x) => x.id),
    });

    let changed = false;
    let vis = [...visibleRef.current];
    let poolArr = [...poolRef.current];

    const used = new Set([
      ...vis.map((v) => v.id),
      ...Array.from(cartIds),
    ]);

    // Try to fill from pool
    while (vis.length < windowSize && poolArr.length) {
      const idx = poolArr.findIndex((p) => !used.has(p.id));
      if (idx === -1) break;
      const [pick] = poolArr.splice(idx, 1);
      vis.push(pick);
      used.add(pick.id);
      changed = true;

      log("➕ Added from pool:", pick.id);
    }

    if (changed) {
      setVisible(vis);
      visibleRef.current = vis;

      setPool(poolArr);
      poolRef.current = poolArr;
    }

    // If still short, fetch more
    if (vis.length < windowSize && !replenishingRef.current) {
      replenishingRef.current = true;

      try {
        log("⚠️ Short of items — fetching more randomly…");
        const more = await fetchFavorites({ random: true, limit: fetchLimit });

        if (!more.length) {
          log("❗ No more favorites available from server — stopping replenish");
          replenishingRef.current = false;
          return; // ⬅️ STOP the loop here
        }

        let poolNew = [...poolRef.current, ...more];

        const usedIds = new Set([
          ...visibleRef.current.map((v) => v.id),
          ...Array.from(cartIds),
        ]);

        poolNew = poolNew.filter((p) => !usedIds.has(p.id));
        poolNew.sort(() => Math.random() - 0.5);

        setPool(poolNew);
        poolRef.current = poolNew;

        // Try again
        vis = [...visibleRef.current];
        let changed2 = false;

        while (vis.length < windowSize && poolNew.length) {
          const p = poolNew.shift();
          vis.push(p);
          changed2 = true;
          log("➕ Added from replenished pool:", p.id);
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
  }, [cartIds, fetchFavorites, windowSize]);

  // ──────────────────────────────────────────────
  // Prune when cart changes
  // ──────────────────────────────────────────────
  useEffect(() => {
    log("🧹 Cart changed — pruning", Array.from(cartIds));

    setVisible((curr) => {
      const next = curr.filter((p) => !cartIds.has(p.id));
      log("Visible after prune:", next.map((x) => x.id));
      visibleRef.current = next;
      return next;
    });

    setPool((curr) => {
      const next = curr.filter((p) => !cartIds.has(p.id));
      log("Pool after prune:", next.map((x) => x.id));
      poolRef.current = next;
      return next;
    });

    void ensureFill();
  }, [cartItems.length]);

  // ──────────────────────────────────────────────
  // Add and Replace
  // ──────────────────────────────────────────────
  const addAndReplace = useCallback(
    (product, requestedIndex) => {
      log("🛒 addAndReplace()", { productId: product.id });

      dispatch(
        addToCart({
          ...product,
          quantity: 1,
        })
      );

      // toast
      setToast({ name: product.name });
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToast(null), TOAST_MS);

      // replace logic
      setVisible((curr) => {
        let list = [...curr];

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
          const pick =
            available[Math.floor(Math.random() * available.length)];

          log(`🔄 Replacing ${product.id} with ${pick.id} at index ${idx}`);

          list.splice(idx, 1, pick);

          const nextPool = poolRef.current.filter((x) => x.id !== pick.id);

          poolRef.current = nextPool;
          setPool(nextPool);
        } else {
          log(
            `❗ No available replacement for ${product.id} — removing temporarily`
          );
          list.splice(idx, 1);
        }

        visibleRef.current = list;
        void ensureFill();
        return list;
      });
    },
    [dispatch, ensureFill]
  );

  // ──────────────────────────────────────────────
  // Auto fill when pool updates
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (
      !loading &&
      visibleRef.current.length < windowSize &&
      poolRef.current.length > 0
    ) {
      log("⚡ Auto ensureFill because visible < windowSize");
      void ensureFill();
    }
  }, [pool, loading, windowSize, ensureFill]);

  return {
    loading,
    error,
    visible,
    toast,
    setToast,
    addAndReplace,
  };
}
