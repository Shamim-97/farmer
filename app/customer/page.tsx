'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function CustomerDashboard() {
  const [orders] = useState([
    { id: 1, status: 'Completed', total: '৳500', date: '2 Apr 2026' },
    { id: 2, status: 'Ready for Pickup', total: '৳300', date: '1 Apr 2026' },
  ]);

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
              <span className="text-slate-600">👥 Customer</span>
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
                <Link href="/customer" className="block px-4 py-2 bg-green-50 text-green-600 rounded-lg font-semibold">
                  📊 Dashboard
                </Link>
                <Link href="/" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  🛒 Browse Products
                </Link>
                <Link href="/customer/orders" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  📦 My Orders
                </Link>
                <Link href="/customer/refund-requests" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  💰 Refund Requests
                </Link>
                <Link href="#" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  🔔 Notifications
                </Link>
                <Link href="#" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  ⚙️ Settings
                </Link>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-2 space-y-8">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-md p-8">
              <h1 className="text-3xl font-bold mb-2">Welcome, Customer! 👋</h1>
              <p>Browse fresh products and place your orders. Delivery agents will bring them to your door.</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Link href="/" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
                <div className="text-4xl mb-2">🛒</div>
                <h3 className="font-semibold">Browse Products</h3>
                <p className="text-sm text-slate-600">Search fresh items</p>
              </Link>
              <Link href="/customer/orders" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
                <div className="text-4xl mb-2">📦</div>
                <h3 className="font-semibold">My Orders</h3>
                <p className="text-sm text-slate-600">Track orders</p>
              </Link>
              <Link href="/customer/refund-requests" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
                <div className="text-4xl mb-2">💰</div>
                <h3 className="font-semibold">Request Refund</h3>
                <p className="text-sm text-slate-600">7 day window</p>
              </Link>
              <Link href="#" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
                <div className="text-4xl mb-2">🎁</div>
                <h3 className="font-semibold">Special Offers</h3>
                <p className="text-sm text-slate-600">Discounts & deals</p>
              </Link>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">📋 Recent Orders</h2>
              <div className="space-y-3">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <div key={order.id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <p className="font-semibold">Order #{order.id}</p>
                        <p className="text-sm text-slate-600">{order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{order.total}</p>
                        <span className={`text-sm px-2 py-1 rounded ${
                          order.status === 'Completed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-600 text-center py-8">No orders yet. Browse products to get started!</p>
                )}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">🎯 How to Order</h2>
              <ol className="space-y-3 list-decimal list-inside text-slate-700">
                <li>Browse fresh products from nearby sellers</li>
                <li>Add items to your cart</li>
                <li>Place your order (6 AM - 10 PM)</li>
                <li>Wait for seller confirmation</li>
                <li>Pickup agent collects and delivers</li>
                <li>Receive your fresh products at home</li>
              </ol>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
