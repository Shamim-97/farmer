'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { searchProducts } from '@/lib/products/actions';
import { ProductGrid } from '@/components/products/product-card';
import { Product, ProductCategory, PRODUCT_CATEGORIES } from '@/lib/types/product';

/**
 * /products
 * Product browsing page with search and filter
 */
export default function ProductBrowsePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  const pageSize = 12;

  // Fetch products on mount and when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const result = await searchProducts(
        query,
        category as ProductCategory | undefined,
        undefined,
        pageSize,
        page * pageSize
      );

      if (result.success) {
        setProducts(result.data ?? []);
        setTotal(result.total || 0);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, category, page]);

  const hasMore = (page + 1) * pageSize < total;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {language === 'en' ? 'Fresh Products' : 'তাজা পণ্য'}
            </h1>
            <button
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="px-3 py-1 rounded-full text-sm font-medium border border-gray-300 hover:border-green-600 hover:text-green-600 transition"
            >
              {language === 'en' ? 'বাংলা' : 'English'}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder={language === 'en' ? 'Search products...' : 'পণ্য খুঁজুন...'}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="h-5 w-5 text-gray-600 flex-shrink-0" />
            <button
              onClick={() => {
                setCategory('');
                setPage(0);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                category === ''
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {language === 'en' ? 'All' : 'সব'}
            </button>
            {Object.entries(PRODUCT_CATEGORIES).map(([key, { label_en, label_bn }]) => (
              <button
                key={key}
                onClick={() => {
                  setCategory(key as ProductCategory);
                  setPage(0);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  category === key
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {language === 'en' ? label_en : label_bn}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p className="text-sm text-gray-600 mt-4">
            {loading ? '...' : `${total} results`}
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ProductGrid
          products={products}
          isLoading={loading}
          language={language}
          onAddToCart={(productId) => {
            console.log('Add to cart:', productId);
            // TODO: Implement add to cart logic
          }}
        />

        {/* Pagination */}
        {!loading && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {language === 'en' ? 'Previous' : 'পূর্ববর্তী'}
            </button>
            <span className="text-sm text-gray-600">
              {language === 'en' ? `Page ${page + 1}` : `পৃষ্ঠা ${page + 1}`}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasMore}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {language === 'en' ? 'Next' : 'পরবর্তী'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
