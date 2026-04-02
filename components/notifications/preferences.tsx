'use client';

import { useState, useEffect } from 'react';
import { Bell, Smartphone, Mail, MessageCircle } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';

interface NotificationPreference {
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
}

export function NotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreference>({
    sms_enabled: true,
    whatsapp_enabled: true,
    email_enabled: true,
    in_app_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function loadPreferences() {
      try {
        const client = createBrowserClient();
        const { data, error: fetchError } = await client
          .from('profiles')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();

        if (!fetchError && data?.notification_preferences) {
          setPreferences(data.notification_preferences);
        }
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [user]);

  const handleToggle = (key: keyof NotificationPreference) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const client = createBrowserClient();
      const { error: updateError } = await client
        .from('profiles')
        .update({
          notification_preferences: preferences,
        })
        .eq('id', user.id);

      if (updateError) {
        setError('Failed to save preferences');
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-slate-600">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-slate-700" />
        <div>
          <h2 className="font-semibold text-slate-900">Notification Preferences</h2>
          <p className="text-sm text-slate-600">Choose how you want to receive updates</p>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-4">
        {/* SMS */}
        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-slate-900">SMS Messages</p>
              <p className="text-xs text-slate-600">Order & refund updates via SMS</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('sms_enabled')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.sms_enabled ? 'bg-green-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.sms_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* WhatsApp */}
        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-slate-900">WhatsApp Messages</p>
              <p className="text-xs text-slate-600">Faster notifications via WhatsApp</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('whatsapp_enabled')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.whatsapp_enabled ? 'bg-green-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.whatsapp_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Email */}
        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-medium text-slate-900">Email Notifications</p>
              <p className="text-xs text-slate-600">Detailed info sent to your email</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('email_enabled')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.email_enabled ? 'bg-green-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.email_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* In-App */}
        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium text-slate-900">In-App Notifications</p>
              <p className="text-xs text-slate-600">Real-time alerts within the app</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('in_app_enabled')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.in_app_enabled ? 'bg-green-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.in_app_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          Preferences saved successfully
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-slate-900 text-white font-medium py-3 rounded-lg hover:bg-slate-800 disabled:bg-slate-400 transition-colors"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
}
