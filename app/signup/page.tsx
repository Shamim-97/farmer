'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signUp } from '@/lib/auth/actions';

const ROLES = [
  {
    id: 'customer',
    name: 'Customer',
    icon: '👥',
    description: 'Order fresh vegetables',
  },
  {
    id: 'seller',
    name: 'Seller',
    icon: '🌾',
    description: 'Sell your products',
  },
  {
    id: 'agent',
    name: 'Pickup Agent',
    icon: '🚚',
    description: 'Deliver orders & earn',
  },
];

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-600">Loading…</div>}>
      <SignUp />
    </Suspense>
  );
}

function SignUp() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const role = searchParams.get('role');
    if (role && ROLES.find(r => r.id === role)) {
      setSelectedRole(role);
      setStep(2);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password, phone);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push('/signin?signup=ok');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2">🌱 FreshMarket BD</h1>
          <p className="text-slate-600">Fresh Vegetables Marketplace</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {step === 1 ? (
            <>
              <h2 className="text-2xl font-bold mb-6">Choose Your Role</h2>

              <div className="space-y-4 mb-6">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      setSelectedRole(role.id);
                      setStep(2);
                    }}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      selectedRole === role.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{role.icon}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{role.name}</h3>
                        <p className="text-sm text-slate-600">{role.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Sign Up as {ROLES.find(r => r.id === selectedRole)?.name}</h2>
              <p className="text-slate-600 mb-6">Create your account</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

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
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
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

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-slate-600">
                  Already have an account?{' '}
                  <Link href="/signin" className="text-green-600 hover:text-green-700 font-semibold">
                    Sign In
                  </Link>
                </p>
              </div>

              <button
                onClick={() => {
                  setStep(1);
                  setSelectedRole('');
                }}
                className="w-full mt-4 text-slate-600 hover:text-slate-900 text-sm"
              >
                ← Change role
              </button>
            </>
          )}
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
