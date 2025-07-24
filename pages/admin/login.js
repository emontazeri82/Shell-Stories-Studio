import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const res = await signIn('credentials', {
      redirect: false,
      email,     // ✅ now using state
      password,  // ✅ now using state
    });

    if (res.ok) {
      router.push('/admin');
    } else {
      setError('❌ Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 border rounded shadow font-poppins">
      <h1 className="text-xl font-bold mb-4 text-center">🔐 Admin Login</h1>

      <input
        type="email"
        className="border p-2 w-full rounded mb-3"
        placeholder="Enter admin email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
      />

      <input
        type="password"
        className="border p-2 w-full rounded"
        placeholder="Enter admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
      />

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <button
        onClick={handleLogin}
        disabled={loading}
        className="mt-4 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  );
}




