import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/helpers';
import { getSellerProducts } from '@/lib/products/actions';
import { NIDStatusBanner } from '@/components/nid/nid-verification';

/**
 * /seller/dashboard
 * Seller dashboard showing their products and links to create new ones
 */
export default async function SellerDashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/auth/signin');
  }

  if (profile.role !== 'SELLER') {
    redirect('/dashboard');
  }

  const productsResult = await getSellerProducts();
  const products = (productsResult.success ? productsResult.data : []) ?? [];

  const activeProducts = products.filter((p) => p.is_active).length;
  const totalStock = products.reduce((sum, p) => sum + p.stock_kg, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
              <p className="mt-1 text-gray-600">Manage your products and sales</p>
            </div>
            <a
              href="/seller/create-listing"
              className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 transition"
            >
              + Create Listing
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* NID Status Banner */}
        <div className="mb-8">
          <NIDStatusBanner />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-600 uppercase">Active Products</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{activeProducts}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-600 uppercase">Total Stock</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalStock.toFixed(0)} kg</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-600 uppercase">Total Products</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{products.length}</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Products</h2>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-4">You haven't created any products yet.</p>
              <a
                href="/seller/create-listing"
                className="inline-block rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700 transition"
              >
                Create Your First Listing
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {product.name_en}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        ৳{product.price_per_kg.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.stock_kg} {product.unit}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            product.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <a
                          href={`/product/${product.id}`}
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
