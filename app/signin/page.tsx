'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO: Integrate with Supabase Auth
      console.log('Sign in with:', { email, password });
      // For now, just redirect to customer dashboard for demo
      router.push('/customer');
    } catch (err) {
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2">🌱 FreshMarket BD</h1>
          <p className="text-slate-600">Fresh Vegetables Marketplace</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6">Sign In</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-slate-600">
              Don't have an account?{' '}
              <Link href="/signup" className="text-green-600 hover:text-green-700 font-semibold">
                Sign Up
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-slate-700">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <ul className="space-y-1">
              <li>📧 customer@example.com / password123</li>
              <li>🌾 seller@example.com / password123</li>
              <li>🚚 agent@example.com / password123</li>
            </ul>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-4">
          <Link href="/" className="text-slate-600 hover:text-slate-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
