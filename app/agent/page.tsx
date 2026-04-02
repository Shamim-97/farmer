'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function PickupAgentPage() {
  const [isDutyOn, setIsDutyOn] = useState(false);
  
  const [orders] = useState([
    { id: 1, location: 'Kuratoli, Dhaka', items: 3, total: '৳500', status: 'Ready to Pickup' },
    { id: 2, location: 'Motijheel, Dhaka', items: 2, total: '৳300', status: 'Ready to Pickup' },
  ]);

  const [earnings] = useState({
    today: '৳1200',
    week: '৳8400',
    month: '৳35000',
    collections: 12,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-green-600">
              🌱 FreshMarket BD
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-slate-600">🚚 Pickup Agent</span>
              <button className="text-slate-600 hover:text-slate-900">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <aside className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-bold mb-4">Menu</h3>
              <nav className="space-y-2">
                <Link href="/agent" className="block px-4 py-2 bg-green-50 text-green-600 rounded-lg font-semibold">
                  📊 Dashboard
                </Link>
                <Link href="#" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  📍 Today's Orders
                </Link>
                <Link href="#" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  📺 Collections
                </Link>
                <Link href="#" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  💰 Earnings
                </Link>
                <Link href="#" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  📍 GPS Map
                </Link>
                <Link href="#" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  ⚙️ Settings
                </Link>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-2 space-y-8">
            {/* Welcome Card & Duty Toggle */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-md p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Welcome, Agent! 👋</h1>
                  <p>Start your duty to collect orders from sellers</p>
                </div>
                <button
                  onClick={() => setIsDutyOn(!isDutyOn)}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    isDutyOn
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isDutyOn ? '🛑 End Duty' : '▶️ Start Duty'}
                </button>
              </div>
              <div className="text-sm">
                Status: <span className={isDutyOn ? 'text-green-200' : 'text-red-200'}>{isDutyOn ? '✓ On Duty' : '✗ Off Duty'}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-2xl font-bold text-orange-600 mb-2">{earnings.today}</div>
                <p className="text-slate-600">Today's Earnings</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-2xl font-bold text-purple-600 mb-2">{earnings.collections}</div>
                <p className="text-slate-600">Collections Today</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-2xl font-bold text-blue-600 mb-2">{earnings.week}</div>
                <p className="text-slate-600">This Week</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-2xl font-bold text-green-600 mb-2">{earnings.month}</div>
                <p className="text-slate-600">This Month</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
              <button className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all text-center">
                <div className="text-4xl mb-2">📍</div>
                <h3 className="font-semibold text-sm">GPS Location</h3>
              </button>
              <button className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all text-center">
                <div className="text-4xl mb-2">📸</div>
                <h3 className="font-semibold text-sm">Capture Proof</h3>
              </button>
              <button className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all text-center">
                <div className="text-4xl mb-2">💰</div>
                <h3 className="font-semibold text-sm">View Summary</h3>
              </button>
            </div>

            {/* Today's Orders */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">📦 Ready to Collect</h2>
              <div className="space-y-3">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <div key={order.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">Order #{order.id}</p>
                          <p className="text-sm text-slate-600">📍 {order.location}</p>
                        </div>
                        <span className="bg-yellow-100 text-yellow-700 text-sm px-2 py-1 rounded">
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm">{order.items} items</p>
                        <p className="font-bold">{order.total}</p>
                      </div>
                      <button className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                        Collect Order
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-600 text-center py-8">No orders ready for pickup.</p>
                )}
              </div>
            </div>

            {/* How to Use */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">📖 How to Use</h2>
              <ol className="space-y-3 list-decimal list-inside text-slate-700">
                <li>Click "Start Duty" to begin your shift</li>
                <li>View today's pending orders</li>
                <li>Navigate to seller location using GPS</li>
                <li>Collect products and capture proof photos</li>
                <li>Mark as collected when done</li>
                <li>Attend to next order</li>
                <li>End duty when finished (earnings tracked)</li>
              </ol>
            </div>
          </main>
        </div>
      </div>

      {/* Top Bar */}
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-md px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-600">Agent</p>
              <p className="font-bold text-slate-900">{agentData.name}</p>
            </div>
            <Link
              href="/api/auth/logout"
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <LogOut className="h-5 w-5 text-slate-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-14 z-40">
        <div className="mx-auto max-w-md px-4">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 border-b-2 py-3 text-center text-sm font-medium transition-all ${
                activeTab === 'orders'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="mx-auto mb-1 h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`flex-1 border-b-2 py-3 text-center text-sm font-medium transition-all ${
                activeTab === 'earnings'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="mx-auto mb-1 h-4 w-4" />
              <span className="hidden sm:inline">Earnings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-md">
        {activeTab === 'orders' && (
          <AgentDashboard
            pickupPointId={agentData.pickup_point?.id}
            agentId={agentData.agent_id}
          />
        )}

        {activeTab === 'earnings' && (
          <div className="py-4 px-4">
            <AgentEarningsPanel />
          </div>
        )}
      </div>

      {/* Install PWA Prompt */}
      <div className="fixed bottom-4 right-4 rounded-lg border border-slate-200 bg-white p-4 shadow-lg max-w-xs">
        <p className="text-sm font-semibold text-slate-900 mb-2">
          📲 Install App
        </p>
        <p className="text-xs text-slate-600 mb-3">
          Install FreshMarket on your home screen for offline access
        </p>
        <button className="w-full rounded-lg bg-green-600 py-2 text-xs font-semibold text-white hover:bg-green-700">
          + Install
        </button>
      </div>
    </div>
  );
}
