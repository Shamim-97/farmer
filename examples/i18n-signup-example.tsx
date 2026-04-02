/**
 * Example: Migrating Auth Component to Use Translations
 * This shows how to convert hardcoded English strings to bilingual support
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { signUp } from '@/lib/auth/actions';

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  village: string;
  role: 'CUSTOMER' | 'SELLER' | 'PICKUP_AGENT';
}

export default function SignUpPageExample() {
  const router = useRouter();
  const { t } = useI18n(); // Get translation function
  
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    village: '',
    role: 'CUSTOMER',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation with translations
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch')); // "Passwords do not match" or "পাসওয়ার্ড মিলছে না"
      return;
    }

    setLoading(true);
    const result = await signUp(formData);

    if (result.success) {
      // Success message with translation
      alert(t('auth.signupSuccess')); // "Successfully signed up" or "সফলভাবে সাইন আপ হয়েছেন"
      router.push('/signin');
    } else {
      setError(result.error || t('messages.error')); // Fallback to translated error
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Page Title - Translated */}
        <h1 className="text-2xl font-bold mb-2">
          {t('auth.signup')} {/* "Sign Up" or "সাইন আপ" */}
        </h1>
        <p className="text-slate-600 mb-6">
          {t('auth.dontHaveAccount')} {t('auth.signup')} {/* "Don't have an account? Sign Up" */}
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              {t('auth.email')} {/* "Email" or "ইমেইল" */}
            </label>
            <input
              type="email"
              placeholder={t('auth.email')}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Full Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              {t('auth.fullName')} {/* "Full Name" or "সম্পূর্ণ নাম" */}
            </label>
            <input
              type="text"
              placeholder={t('auth.fullName')}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              {t('auth.phone')} {/* "Phone Number" or "ফোন নম্বর" */}
            </label>
            <input
              type="tel"
              placeholder={t('auth.phone')}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              {t('auth.selectRole')} {/* "Select Your Role" or "ভূমিকা নির্বাচন করুন" */}
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="CUSTOMER">{t('auth.customer')}</option> {/* "Customer" or "ক্রেতা" */}
              <option value="SELLER">{t('auth.seller')}</option> {/* "Seller" or "বিক্রেতা" */}
              <option value="PICKUP_AGENT">{t('auth.agent')}</option> {/* "Pickup Agent" or "পিকআপ এজেন্ট" */}
            </select>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              {t('auth.password')} {/* "Password" or "পাসওয়ার্ড" */}
            </label>
            <input
              type="password"
              placeholder={t('auth.password')}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              {t('auth.confirmPassword')} {/* "Confirm Password" or "পাসওয়ার্ড নিশ্চিত করুন" */}
            </label>
            <input
              type="password"
              placeholder={t('auth.confirmPassword')}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-medium py-3 rounded-lg hover:bg-slate-800 disabled:bg-slate-400 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? t('common.loading') : t('auth.signup')} {/* "Loading..." or "সাইন আপ" */}
          </button>
        </form>

        {/* Sign In Link */}
        <p className="text-center text-sm text-slate-600 mt-4">
          {t('auth.alreadyHaveAccount')} {/* "Already have an account?" or "ইতিমধ্যে অ্যাকাউন্ট আছে?" */}
          <a href="/auth/signin" className="text-slate-900 font-medium hover:underline ml-1">
            {t('auth.signin')} {/* "Sign In" or "লগইন" */}
          </a>
        </p>
      </div>
    </div>
  );
}
