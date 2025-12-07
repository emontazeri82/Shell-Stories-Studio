// /pages/admin/orders.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import AdminOrdersPanel from "@/components/OrdersPanel/AdminOrdersPanel";
import axios from "axios";

/* ──────────────────────────────
 * Server-Side Protection (ADMIN-only)
 * + Server-side Orders Fetch (Axios!)
 * ──────────────────────────────*/
export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // 🚫 Block unauthenticated users or non-admins
  const role = String(session?.user?.role || "").toUpperCase();
  if (!session || role !== "ADMIN") {
    console.warn("⛔ Unauthorized access attempt to /admin/orders");

    return {
      redirect: {
        destination: `/admin/login?callbackUrl=${encodeURIComponent(
          context.resolvedUrl || "/admin/orders"
        )}`,
        permanent: false,
      },
    };
  }

  // 🔒 Disable caching for admin data
  context.res.setHeader("Cache-Control", "no-store");

  // 🌍 Build absolute URL for Axios SSR
  const host = context.req.headers.host;
  const baseUrl = `http://${host}`;

  let initialOrders = [];

  try {
    // ⭐ Axios SSR request
    console.log("[SSR] Fetching orders via Axios:", `${baseUrl}/api/admin/orders`);

    const res = await axios.get(`${baseUrl}/api/admin/orders`, {
      headers: {
        Cookie: context.req.headers.cookie || "",
      },
    });

    initialOrders = Array.isArray(res.data?.orders) ? res.data.orders : [];
  } catch (err) {
    console.error("❌ SSR Axios fetch failed:", err?.response?.data || err);
    initialOrders = [];
  }

  // Clean session object
  const safeSession = {
    ...session,
    user: {
      id: session.user.id || null,
      email: session.user.email || null,
      name: session.user.name || null,
      role: session.user.role || "user",
      image: session.user.image ?? null,
    },
  };

  return {
    props: {
      session: safeSession,
      initialOrders: initialOrders, // ← PASS SSR ORDERS TO COMPONENT
    },
  };
}

/* ──────────────────────────────
 * Admin Orders Page
 * ──────────────────────────────*/
export default function AdminOrdersPage({ session, initialOrders }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6">
        🧾 Admin Orders Dashboard
      </h1>

      <AdminOrdersPanel session={session} initialOrders={initialOrders} />
    </div>
  );
}
