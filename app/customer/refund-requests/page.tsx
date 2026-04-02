import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, History } from 'lucide-react';
import RefundHistory from '@/components/refund/history';

export const metadata = {
  title: 'Refund Requests - FreshMarket BD',
  description: 'Manage your refund requests and view refund history',
};

async function getCustomerRole() {
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

export default async function RefundRequestsPage() {
  const role = await getCustomerRole();

  if (!role || role !== 'CUSTOMER') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            Refund Requests
          </h1>
          <p className="text-slate-600 mt-1">
            Open a refund request for collected orders within 7 days
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6 mb-8">
          <div className="flex gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">How Refunds Work</h3>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>✓ Request a refund within 7 days of delivery</li>
                <li>✓ Submit proof of issue (photos/documents)</li>
                <li>✓ Admin reviews your request (1-2 business days)</li>
                <li>✓ Refund is processed to your original payment method</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-8">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Refund History</span>
            </TabsTrigger>
          </TabsList>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <RefundHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
