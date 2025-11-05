import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";

/* ──────────────────────────────
 * Admin Login Page
 * ──────────────────────────────*/
export default function AdminLogin() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = router.query.callbackUrl || "/admin";

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.replace(callbackUrl);
    }
  }, [status, session, router, callbackUrl]);

  // ────────────────────────────────
  // Login Handler
  // ────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (!res) {
        setError("Unexpected response from server.");
        return;
      }

      if (res.ok) {
        console.log("✅ Login successful. Redirecting...");
        router.push(callbackUrl);
      } else {
        setError("❌ Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error("💥 Login failed:", err);
      setError("Network or server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────
  // UI Rendering
  // ────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-poppins">
      <div className="max-w-sm w-full bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          🔐 Admin Login
        </h1>

        <input
          type="email"
          className="border p-2 w-full rounded mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <input
          type="password"
          className="border p-2 w-full rounded mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        {error && (
          <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className={`mt-4 w-full bg-indigo-600 text-white py-2 rounded-md transition 
            ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-700"}`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          Only authorized admins can access this area.
        </p>
      </div>
    </div>
  );
}



