'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SellerDashboard() {
  const [products] = useState([
    { id: 1, name: 'Tomato', stock: 50, price: '৳60/kg', status: 'Active' },
    { id: 2, name: 'Onion', stock: 30, price: '৳50/kg', status: 'Active' },
  ]);

  const [orders] = useState([
    { id: 1, status: 'Ready for Pickup', total: '৳500', date: '2 Apr 2026' },
    { id: 2, status: 'Pending Confirmation', total: '৳300', date: '1 Apr 2026' },
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
              <span className="text-slate-600">🌾 Seller</span>
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
                <Link href="/seller" className="block px-4 py-2 bg-green-50 text-green-600 rounded-lg font-semibold">
                  📊 Dashboard
                </Link>
                <Link href="/seller/nid-verification" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  🆔 NID Verification
                </Link>
                <Link href="/seller/create-listing" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  ➕ Add Product
                </Link>
                <Link href="/seller/dashboard" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  📦 My Products
                </Link>
                <Link href="/seller/orders" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  📋 Orders
                </Link>
                <Link href="#" className="block px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                  📊 Analytics
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
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-8">
              <h1 className="text-3xl font-bold mb-2">Welcome, Seller! 👋</h1>
              <p>Manage your products and fulfill customer orders.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">2</div>
                <p className="text-slate-600">Active Products</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
                <p className="text-slate-600">Pending Orders</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">৳800</div>
                <p className="text-slate-600">Today's Revenue</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Link href="/seller/create-listing" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
                <div className="text-4xl mb-2">➕</div>
                <h3 className="font-semibold">Add Product</h3>
                <p className="text-sm text-slate-600">Create new listing</p>
              </Link>
              <Link href="/seller/orders" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
                <div className="text-4xl mb-2">📋</div>
                <h3 className="font-semibold">New Orders</h3>
                <p className="text-sm text-slate-600">Pending orders</p>
              </Link>
              <Link href="/seller/nid-verification" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
                <div className="text-4xl mb-2">🆔</div>
                <h3 className="font-semibold">NID Status</h3>
                <p className="text-sm text-slate-600">Verify identity</p>
              </Link>
              <Link href="#" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
                <div className="text-4xl mb-2">📊</div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-slate-600">Sales reports</p>
              </Link>
            </div>

            {/* Active Products */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">📦 Active Products</h2>
              <div className="space-y-3">
                {products.length > 0 ? (
                  products.map((product) => (
                    <div key={product.id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-slate-600">{product.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{product.stock} kg</p>
                        <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded">
                          {product.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-600 text-center py-8">No products yet.</p>
                )}
              </div>
            </div>

            {/* Pending Orders */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">📋 Pending Orders</h2>
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
                        <span className="text-sm px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-600 text-center py-8">No pending orders.</p>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
