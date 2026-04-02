'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Badge, AlertCircle, CheckCircle } from 'lucide-react';
import { Product } from '@/lib/types/product';

interface ProductCardProps {
  product: Product & {
    seller?: {
      id: string;
      full_name: string;
      nid_status: string;
    };
  };
  isCustomer?: boolean;
  language?: 'en' | 'bn';
  onAddToCart?: (productId: string) => void;
}

/**
 * Product Card Component
 * Mobile-first design, shows all product info with NID verified badge
 */
export function ProductCard({
  product,
  isCustomer = true,
  language = 'en',
  onAddToCart,
}: ProductCardProps) {
  const name = language === 'en' ? product.name_en : product.name_bn;
  const isSellerApproved = product.seller?.nid_status === 'APPROVED';

  return (
    <Link href={`/products/${product.id}`}>
      <div className="flex flex-col h-full rounded-lg border border-gray-200 bg-white hover:shadow-lg transition-shadow overflow-hidden cursor-pointer">
        {/* Image Container */}
        <div className="relative h-48 sm:h-56 bg-gray-100 flex-shrink-0 overflow-hidden">
          {product.thumbnail_url ? (
            <Image
              src={product.thumbnail_url}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}

          {/* NID Verified Badge (Top Left) */}
          {isSellerApproved && (
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
              <CheckCircle className="h-3 w-3" />
              {language === 'en' ? 'Verified' : 'যাচাইকৃত'}
            </div>
          )}

          {/* Stock Status (Top Right) */}
          {product.stock_kg <= 0 && (
            <div className="absolute top-2 right-2 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
              {language === 'en' ? 'Out of Stock' : 'স্টক শেষ'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4">
          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm sm:text-base mb-2">
            {name}
          </h3>

          {/* Seller Name */}
          <p className="text-xs text-gray-600 mb-3">
            {language === 'en' ? 'by ' : 'বিক্রেতা: '}
            {product.seller?.full_name || 'Unknown'}
          </p>

          {/* Price */}
          <div className="mb-3 pb-3 border-b border-gray-200">
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-2xl font-bold text-green-600">
                ৳{product.price_per_kg.toFixed(0)}
              </span>
              <span className="text-xs text-gray-600">
                {language === 'en' ? 'per' : 'প্রতি'} {product.unit}
              </span>
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Min Order Badge */}
            <div className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-1">
              <span className="text-xs font-medium text-amber-900">
                {language === 'en'
                  ? `Min. ${product.min_order_kg} ${product.unit}`
                  : `কমপক্ষে ${product.min_order_kg} ${product.unit}`}
              </span>
            </div>

            {/* Refundable Status */}
            {product.is_refundable ? (
              <div className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-1">
                <span className="text-xs font-medium text-blue-900">
                  {language === 'en' ? 'Refundable' : 'রিফান্ডযোগ্য'}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1">
                <AlertCircle className="h-3 w-3 text-gray-600" />
                <span className="text-xs font-medium text-gray-600">
                  {language === 'en' ? 'No Refund' : 'রিফান্ড নেই'}
                </span>
              </div>
            )}
          </div>

          {/* Add to Cart Button (Spacer for non-customers) */}
          {isCustomer && product.stock_kg > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart?.(product.id);
              }}
              className="mt-auto w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2 px-3 font-medium text-white hover:bg-green-700 transition text-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              {language === 'en' ? 'Add to Order' : 'অর্ডারে যোগ করুন'}
            </button>
          )}

          {/* Out of Stock Message */}
          {!isCustomer || product.stock_kg <= 0 ? (
            <div className="mt-auto text-xs text-gray-500 text-center italic">
              {language === 'en' ? 'Out of Stock' : 'স্টক শেষ'}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/**
 * Product Grid Component
 * Shows list of products in responsive grid
 */
interface ProductGridProps {
  products: (Product & {
    seller?: {
      id: string;
      full_name: string;
      nid_status: string;
    };
  })[];
  isLoading?: boolean;
  language?: 'en' | 'bn';
  onAddToCart?: (productId: string) => void;
}

export function ProductGrid({
  products,
  isLoading = false,
  language = 'en',
  onAddToCart,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 animate-pulse">
            <div className="aspect-video bg-gray-200 rounded mb-4" />
            <div className="h-6 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
        <p className="text-gray-600">
          {language === 'en' ? 'No products found' : 'কোনো পণ্য পাওয়া যায়নি'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isCustomer={true}
          language={language}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
