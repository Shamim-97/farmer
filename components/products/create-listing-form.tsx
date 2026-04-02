'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Upload, X } from 'lucide-react';
import { createProduct } from '@/lib/products/actions';
import { supabase } from '@/lib/supabase/client';
import { ProductCategory, PRODUCT_CATEGORIES, PRODUCT_UNITS } from '@/lib/types/product';

interface CreateListingFormProps {
  sellerId: string;
  onSuccess?: () => void;
}

/**
 * Create Product Listing Form
 * Mobile-first form for sellers to create and publish new products
 */
export function CreateListingForm({ sellerId, onSuccess }: CreateListingFormProps) {
  const router = useRouter();

  // Form state
  const [nameEn, setNameEn] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [category, setCategory] = useState<ProductCategory>('FISH');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionBn, setDescriptionBn] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [minOrderKg, setMinOrderKg] = useState('1');
  const [minSizeCm, setMinSizeCm] = useState('');
  const [stockKg, setStockKg] = useState('');
  const [unit, setUnit] = useState('kg');
  const [isRefundable, setIsRefundable] = useState(true);

  // Upload state
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, or WebP images allowed');
      return;
    }

    // Validate file size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Thumbnail size must be less than 5 MB');
      return;
    }

    setThumbnail(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadThumbnail = async (): Promise<string | null> => {
    if (!thumbnail) return null;

    setUploading(true);
    try {
      const filePath = `${sellerId}/${Date.now()}-${thumbnail.name}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, thumbnail);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Failed to upload thumbnail');
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return urlData?.publicUrl || null;
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload thumbnail');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!nameEn || !nameBn) {
      setError('Product name in both languages is required');
      setLoading(false);
      return;
    }

    if (!pricePerKg) {
      setError('Price is required');
      setLoading(false);
      return;
    }

    if (!stockKg) {
      setError('Stock quantity is required');
      setLoading(false);
      return;
    }

    try {
      // Upload thumbnail if provided
      let thumbnailUrl: string | undefined;
      if (thumbnail) {
        thumbnailUrl = (await uploadThumbnail()) || undefined;
      }

      // Create product
      const result = await createProduct({
        name_en: nameEn,
        name_bn: nameBn,
        category,
        description_en: descriptionEn,
        description_bn: descriptionBn,
        price_per_kg: parseFloat(pricePerKg),
        min_order_kg: parseFloat(minOrderKg),
        min_size_cm: minSizeCm ? parseFloat(minSizeCm) : undefined,
        stock_kg: parseFloat(stockKg),
        unit,
        thumbnail_url: thumbnailUrl,
        is_refundable: isRefundable,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          router.push('/seller/dashboard');
          router.refresh();
        }, 2000);
      } else {
        setError(result.error || 'Failed to create product');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('An error occurred while creating the product');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-8 text-center border border-green-200">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-green-900">Product Created!</h3>
        <p className="text-green-700 mt-2">
          আপনার পণ্য তালিকা তৈরি হয়েছে। আপনি এখন গ্রাহকদের কাছে দৃশ্যমান।
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Product Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name (English)
          </label>
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="e.g., Hilsha Fish"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            পণ্যের নাম (বাংলা)
          </label>
          <input
            type="text"
            value={nameBn}
            onChange={(e) => setNameBn(e.target.value)}
            placeholder="যেমন, ইলিশ মাছ"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
      </div>

      {/* Category & Unit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category / বিভাগ
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {Object.entries(PRODUCT_CATEGORIES).map(([key, { label_en, label_bn }]) => (
              <option key={key} value={key}>
                {label_en} / {label_bn}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unit / ইউনিট
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {PRODUCT_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (English)
          </label>
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            placeholder="Product details, quality, etc."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            বিবরণ (বাংলা)
          </label>
          <textarea
            value={descriptionBn}
            onChange={(e) => setDescriptionBn(e.target.value)}
            placeholder="পণ্যের বিবরণ, গুণমান, ইত্যাদি"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price per {unit} (৳) *
          </label>
          <input
            type="number"
            value={pricePerKg}
            onChange={(e) => setPricePerKg(e.target.value)}
            placeholder="100"
            step="0.01"
            min="0"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Order *
          </label>
          <input
            type="number"
            value={minOrderKg}
            onChange={(e) => setMinOrderKg(e.target.value)}
            placeholder="1"
            step="0.1"
            min="0.1"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock {unit} *
          </label>
          <input
            type="number"
            value={stockKg}
            onChange={(e) => setStockKg(e.target.value)}
            placeholder="50"
            step="0.1"
            min="0"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Size (cm) (optional)
          </label>
          <input
            type="number"
            value={minSizeCm}
            onChange={(e) => setMinSizeCm(e.target.value)}
            placeholder="e.g., 25"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Thumbnail Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Product Thumbnail (optional)
        </label>
        <div className="relative rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 transition">
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <div className="p-6 text-center">
            {thumbnailPreview ? (
              <div className="relative inline-block">
                <img
                  src={thumbnailPreview}
                  alt="Preview"
                  className="max-h-32 rounded"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setThumbnail(null);
                    setThumbnailPreview(null);
                  }}
                  className="absolute top-1 right-1 rounded-full bg-red-600 p-1"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-700">Click to upload</p>
                <p className="text-xs text-gray-500 mt-1">JPEG, PNG or WebP • Max 5 MB</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refundable Checkbox */}
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 bg-gray-50">
        <input
          type="checkbox"
          id="refundable"
          checked={isRefundable}
          onChange={(e) => setIsRefundable(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        <label htmlFor="refundable" className="text-sm text-gray-700">
          Allow customers to request refunds within 2 hours of pickup
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || uploading}
        className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading || uploading ? 'Creating...' : 'Create & Publish Product'}
      </button>
    </form>
  );
}
