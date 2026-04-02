'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { getNotificationHistory } from '@/lib/notifications/actions';
import { Notification } from '@/lib/types/notification';
import { NotificationType } from '@/lib/types/notification';

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchNotifications() {
      const result = await getNotificationHistory(user.id, 100);
      if (result.success) {
        setNotifications(result.data || []);
        setError(null);
      } else {
        setError(result.error || 'Failed to load notifications');
      }
      setLoading(false);
    }

    fetchNotifications();
  }, [user]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case NotificationType.ORDER_CONFIRMED:
      case NotificationType.ORDER_READY:
      case NotificationType.ORDER_COLLECTED:
      case NotificationType.REFUND_APPROVED:
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case NotificationType.ORDER_ABANDONED:
      case NotificationType.ORDER_CANCELLED:
      case NotificationType.REFUND_REJECTED:
      case NotificationType.NID_REJECTED:
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case NotificationType.NID_APPROVED:
      case NotificationType.AGENT_EARNINGS:
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      default:
        return <MessageSquare className="h-5 w-5 text-slate-600" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">Sent</span>;
      case 'DELIVERED':
        return <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">Delivered</span>;
      case 'PENDING':
        return <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">Pending</span>;
      case 'FAILED':
        return <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">Failed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">Notifications</h1>
          <div className="w-6" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            <p className="text-sm text-slate-600">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <MessageSquare className="h-12 w-12 text-slate-300" />
            <p className="text-sm text-slate-600">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-slate-100 transition-colors">
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-slate-600">
                        {formatDate(notification.created_at)}
                      </p>
                      {getStatusBadge(notification.status)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
