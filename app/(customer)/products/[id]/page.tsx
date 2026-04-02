'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ShoppingCart, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getProductDetail } from '@/lib/products/actions';
import { Product } from '@/lib/types/product';

/**
 * /products/[id]
 * Product detail page
 */
export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState('1');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  useEffect(() => {
    const fetchProduct = async () => {
      const result = await getProductDetail(productId);
      if (result.success) {
        setProduct(result.data);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <div className="h-8 w-8 border-4 border-gray-300 border-t-green-600 rounded-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900">Product not found</p>
          <Link href="/products" className="mt-4 inline-block text-green-600 hover:text-green-700">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const name = language === 'en' ? product.name_en : product.name_bn;
  const description = language === 'en' ? product.description_en : product.description_bn;
  const isSellerApproved = product.seller?.nid_status === 'APPROVED';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/products" className="flex items-center gap-2 text-green-600 hover:text-green-700">
            <ChevronLeft className="h-5 w-5" />
            {language === 'en' ? 'Back' : 'ফিরে যান'}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            <div className="rounded-lg bg-gray-100 overflow-hidden aspect-square flex items-center justify-center">
              {product.thumbnail_url ? (
                <Image
                  src={product.thumbnail_url}
                  alt={name}
                  width={500}
                  height={500}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-gray-400">No image</span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Language Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  language === 'en'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('bn')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  language === 'bn'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                বাংলা
              </button>
            </div>

            {/* Product Name */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
              <p className="text-gray-600 mt-2">by {product.seller?.full_name || 'Unknown'}</p>
            </div>

            {/* Seller Badge */}
            {isSellerApproved && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">
                  {language === 'en' ? 'Verified Seller' : 'যাচাইকৃত বিক্রেতা'}
                </span>
              </div>
            )}

            {/* Price */}
            <div className="border-t border-b border-gray-200 py-6">
              <p className="text-gray-600 text-sm">
                {language === 'en' ? 'Price' : 'মূল্য'}
              </p>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-4xl font-bold text-green-600">
                  ৳{product.price_per_kg.toFixed(0)}
                </span>
                <span className="text-gray-600">
                  {language === 'en' ? 'per' : 'প্রতি'} {product.unit}
                </span>
              </div>
            </div>

            {/* Description */}
            {description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {language === 'en' ? 'Description' : 'বিবরণ'}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  {language === 'en' ? 'Min Order' : 'সর্বনিম্ন অর্ডার'}
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {product.min_order_kg} {product.unit}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  {language === 'en' ? 'Available Stock' : 'উপলব্ধ স্টক'}
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {product.stock_kg} {product.unit}
                </p>
              </div>
            </div>

            {/* Refund Info */}
            <div>
              {product.is_refundable ? (
                <div className="flex items-start gap-3 rounded-lg bg-blue-50 px-4 py-3 border border-blue-200">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">
                      {language === 'en' ? 'Refundable' : 'রিফান্ডযোগ্য'}
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                      {language === 'en'
                        ? 'Request refunds within 2 hours of pickup'
                        : 'পিকআপের ২ ঘণ্টার মধ্যে রিফান্ড চাইতে পারবেন'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-lg bg-gray-50 px-4 py-3 border border-gray-200">
                  <AlertCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {language === 'en' ? 'No Refunds' : 'রিফান্ড নেই'}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {language === 'en'
                        ? 'This product cannot be refunded'
                        : 'এই পণ্যের জন্য রিফান্ড পাওয়া যাবে না'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Add to Cart Form */}
            {product.stock_kg > 0 ? (
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Quantity' : 'পরিমাণ'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min={product.min_order_kg}
                      step={0.1}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-gray-600">{product.unit}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {language === 'en'
                      ? `Minimum: ${product.min_order_kg} ${product.unit}`
                      : `সর্বনিম্ন: ${product.min_order_kg} ${product.unit}`}
                  </p>
                </div>

                <button
                  onClick={() => {
                    // Store order info in sessionStorage for checkout page
                    sessionStorage.setItem(
                      'cart-item',
                      JSON.stringify({
                        product_id: productId,
                        seller_id: product.seller_id,
                        village_id: product.village_id,
                        productName: product.name_en,
                        quantity: parseFloat(quantity) || product.min_order_kg,
                        unitPrice: product.price_per_kg,
                      })
                    );
                    // Navigate to checkout
                    window.location.href = '/checkout';
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 py-3 px-4 font-semibold text-white hover:bg-green-700 transition"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {language === 'en' ? 'Proceed to Checkout' : 'চেকআউটে যান'}
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <p className="font-semibold text-red-900">
                  {language === 'en' ? 'Out of Stock' : 'স্টক শেষ'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
