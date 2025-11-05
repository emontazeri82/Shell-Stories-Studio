// /pages/admin/orders.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import AdminOrdersPanel from "@/components/OrdersPanel/AdminOrdersPanel";

/* ──────────────────────────────
 * Server-Side Protection (ADMIN-only)
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

  // ✅ Disable caching for sensitive data
  context.res.setHeader("Cache-Control", "no-store");

  // ✅ Clean session to avoid undefined/null leaks
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
    props: { session: safeSession },
  };
}

/* ──────────────────────────────
 * Admin Orders Page
 * ──────────────────────────────*/
export default function AdminOrdersPage({ session }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6">
        🧾 Admin Orders Dashboard
      </h1>
      <AdminOrdersPanel session={session} />
    </div>
  );
}
