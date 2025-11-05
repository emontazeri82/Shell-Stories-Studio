// /pages/admin/index.js
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { signOut } from "next-auth/react";

/* ──────────────────────────────
 * Server-Side Auth Protection
 * ──────────────────────────────*/
export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  const role = String(session?.user?.role || "").toUpperCase();
  if (!session || role !== "ADMIN") {
    console.warn("⛔ Unauthorized access attempt to /admin");
    return {
      redirect: {
        destination: `/admin/login?callbackUrl=${encodeURIComponent(
          context.resolvedUrl || "/admin"
        )}`,
        permanent: false,
      },
    };
  }

  context.res.setHeader("Cache-Control", "no-store");

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
    },
  };
}

/* ──────────────────────────────
 * Admin Dashboard Page
 * ──────────────────────────────*/
export default function AdminPage({ session }) {
  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/admin/login" });
    } catch (err) {
      console.error("❌ Logout failed:", err);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome,{" "}
            <span className="text-blue-600">
              {session?.user?.name || "Admin"}
            </span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Role: {session?.user?.role || "Unknown"}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
        >
          🚪 Logout
        </button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Orders */}
        <Link
          href="/admin/orders"
          className="block p-6 bg-white border rounded-lg shadow hover:shadow-md transition cursor-pointer"
        >
          <h2 className="text-xl font-semibold mb-1">📋 View Orders</h2>
          <p className="text-sm text-gray-600">
            Manage customer orders and delivery status
          </p>
        </Link>

        {/* Inventory */}
        <Link
          href="/admin/admin_inventory"
          className="block p-6 bg-white border rounded-lg shadow hover:shadow-md transition cursor-pointer"
        >
          <h2 className="text-xl font-semibold mb-1">📦 Manage Products</h2>
          <p className="text-sm text-gray-600">
            Add, edit, or delete products, media, and categories
          </p>
        </Link>

        {/* Media Library (Future-ready) */}
        <Link
          href="/admin/media"
          className="block p-6 bg-white border rounded-lg shadow hover:shadow-md transition cursor-pointer"
        >
          <h2 className="text-xl font-semibold mb-1">🎞️ Media Library</h2>
          <p className="text-sm text-gray-600">
            Upload, organize, or remove product images & videos
          </p>
        </Link>
      </div>
    </div>
  );
}
