"use client";
// pages/admin/index.js
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import AdminOrdersPanel from '@/components/OrdersPanel/AdminOrdersPanel';

export async function getServerSideProps(context) {
    const session = await getServerSession(context.req, context.res, authOptions);

    // 🔐 Protect admin-only route
    if (!session || session.user?.role !== "admin") {
        console.warn("⛔ Unauthorized access attempt to /admin/admin_inventory");
        return {
            redirect: {
                destination: "/admin/login",
                permanent: false,
            },
        };
    }

    // ✅ Clean session object for safety (e.g., nullify undefined fields)
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




export default function AdminPage({ session }) {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-3xl font-bold mb-8">Welcome, Admin</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Link href="/admin/orders" className="block p-6 bg-white border rounded-lg shadow hover:shadow-md transition cursor-pointer">
                    <h2 className="text-xl font-semibold mb-1">📋 View Orders</h2>
                    <p className="text-sm text-gray-600">Manage customer orders</p>
                </Link>

                <Link href="/admin/admin_inventory" className="block p-6 bg-white border rounded-lg shadow hover:shadow-md transition cursor-pointer">
                    <h2 className="text-xl font-semibold mb-1">📦 Manage Products</h2>
                    <p className="text-sm text-gray-600">Add, edit, or delete products</p>
                </Link>
            </div>

        </div>
    );
}