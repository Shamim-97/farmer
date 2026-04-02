import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import AdminRefundManager from '@/components/admin/refund-manager';
import { ReceiptText } from 'lucide-react';

export const metadata = {
  title: 'Refund Management - Admin - FreshMarket BD',
  description: 'Manage customer refund requests and approvals',
};

async function getAdminRole() {
  const client = await createServerClient();

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role;
}

export default async function AdminRefundPage() {
  const role = await getAdminRole();

  if (!role || role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <ReceiptText className="w-8 h-8 text-slate-700" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Refund Management</h1>
            <p className="text-slate-600 mt-1">Review and process customer refund requests</p>
          </div>
        </div>

        {/* Main Content */}
        <AdminRefundManager />
      </div>
    </div>
  );
}
