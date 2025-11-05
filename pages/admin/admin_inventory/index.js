// /pages/admin/admin_inventory/index.js
import { useState, useEffect } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { useRouter } from "next/router";
import axios from "axios";

import ProductList from "@/components/admin_dashboard/ProductList";
import ProductSearch from "@/components/admin_dashboard/ProductSearch";

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const role = String(session?.user?.role || "").toUpperCase();

  if (!session || role !== "ADMIN") {
    return {
      redirect: {
        destination: `/admin/login?callbackUrl=${encodeURIComponent(
          context.resolvedUrl || "/admin/admin_inventory"
        )}`,
        permanent: false,
      },
    };
  }

  context.res.setHeader("Cache-Control", "no-store");
  return { props: {} };
}

export default function AdminInventoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("created_at_desc");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🧠 Fetch all products (with primary media fallback)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const url = `/api/admin/manage_products?sort=${sortOrder}&q=${encodeURIComponent(searchQuery)}`;
        console.log("[Axios] Calling:", url);
        const { data } = await axios.get(url, { withCredentials: true });

        if (!data?.products) throw new Error("Invalid products response");
        console.log(`[AdminInventory] ✅ Loaded ${data.products.length} products`);

        // Ensure each product has image fallback from media
        const enriched = data.products.map((p) => ({
          ...p,
          thumbnail:
            p.primary_media_url ||
            p.image_url ||
            (p.media?.[0]?.secure_url ?? null) ||
            "/placeholder.png",
        }));

        setProducts(enriched);
      } catch (err) {
        console.error("[Axios] ❌ Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [sortOrder, searchQuery]);

  // ────────────────────────────────
  // Render
  // ────────────────────────────────
  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-4">📦 Product Dashboard</h1>

      <div className="mb-4 flex flex-wrap gap-3 justify-end">
        <button
          onClick={() => router.push("/admin/admin_inventory/new")}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          ➕ Create New Product
        </button>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="created_at_desc">Newest</option>
          <option value="created_at_asc">Oldest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A–Z</option>
          <option value="name_desc">Name: Z–A</option>
          <option value="stock_desc">Stock: High to Low</option>
        </select>
      </div>

      <ProductSearch value={searchQuery} onChange={setSearchQuery} />

      {loading ? (
        <div className="mt-8 text-gray-600">Loading products...</div>
      ) : (
        <div className="mt-6">
          <ProductList products={products} searchQuery={searchQuery} sortOrder={sortOrder} />
        </div>
      )}
    </div>
  );
}



