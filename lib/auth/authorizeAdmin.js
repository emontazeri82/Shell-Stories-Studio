// lib/auth/authorizeAdmin.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function authorizeAdmin(req, res, next) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== "admin") {
      console.warn("❌ Unauthorized access attempt");
      return res.status(403).json({ error: "Access denied" });
    }

    req.session = session; // Optional: attach session to req
    next(); // ✅ Proceed to next middleware or handler
  } catch (err) {
    console.error("❌ Error in authorizeAdmin:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}


