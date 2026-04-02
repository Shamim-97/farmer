'use server';

import { createServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/actions';
import { Product, ProductCategory } from '@/lib/types/product';

interface CreateProductInput {
  name_en: string;
  name_bn: string;
  category: ProductCategory;
  description_en?: string;
  description_bn?: string;
  price_per_kg: number;
  min_order_kg: number;
  min_size_cm?: number;
  stock_kg: number;
  unit: string;
  thumbnail_url?: string;
  is_refundable: boolean;
}

interface UpdateProductInput extends Partial<CreateProductInput> {
  is_active?: boolean;
}

/**
 * Create a new product
 * RULE 2: SELLER must have nid_status = 'APPROVED'
 */
export async function createProduct(input: CreateProductInput) {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify seller and NID approved
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role, nid_status')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Profile not found' };
  }

  if (profile.role !== 'SELLER') {
    return { success: false, error: 'Only sellers can create products' };
  }

  if (profile.nid_status !== 'APPROVED') {
    return {
      success: false,
      error: 'NID verification required. Please upload your NID first.',
    };
  }

  // Validate input
  if (!input.name_en || !input.name_bn) {
    return { success: false, error: 'Both English and Bangla names are required' };
  }

  if (input.price_per_kg <= 0) {
    return { success: false, error: 'Price must be greater than 0' };
  }

  if (input.min_order_kg <= 0) {
    return { success: false, error: 'Minimum order must be greater than 0' };
  }

  if (input.stock_kg < 0) {
    return { success: false, error: 'Stock cannot be negative' };
  }

  // Create product
  const { data: product, error: createError } = await client
    .from('products')
    .insert({
      seller_id: user.id,
      name_en: input.name_en,
      name_bn: input.name_bn,
      category: input.category,
      description_en: input.description_en,
      description_bn: input.description_bn,
      price_per_kg: input.price_per_kg,
      min_order_kg: input.min_order_kg,
      min_size_cm: input.min_size_cm,
      stock_kg: input.stock_kg,
      unit: input.unit,
      thumbnail_url: input.thumbnail_url,
      is_active: true,
      is_refundable: input.is_refundable,
    })
    .select()
    .single();

  if (createError) {
    console.error('Product creation error:', createError);
    return { success: false, error: 'Failed to create product' };
  }

  return {
    success: true,
    data: product as Product,
    message: 'Product created successfully',
  };
}

/**
 * Update a product
 */
export async function updateProduct(productId: string, input: UpdateProductInput) {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify product belongs to seller
  const { data: product, error: productError } = await client
    .from('products')
    .select('seller_id')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    return { success: false, error: 'Product not found' };
  }

  if (product.seller_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Validate input
  if (input.price_per_kg !== undefined && input.price_per_kg <= 0) {
    return { success: false, error: 'Price must be greater than 0' };
  }

  if (input.min_order_kg !== undefined && input.min_order_kg <= 0) {
    return { success: false, error: 'Minimum order must be greater than 0' };
  }

  if (input.stock_kg !== undefined && input.stock_kg < 0) {
    return { success: false, error: 'Stock cannot be negative' };
  }

  // Update product
  const { data: updated, error: updateError } = await client
    .from('products')
    .update(input)
    .eq('id', productId)
    .select()
    .single();

  if (updateError) {
    console.error('Product update error:', updateError);
    return { success: false, error: 'Failed to update product' };
  }

  return {
    success: true,
    data: updated as Product,
    message: 'Product updated successfully',
  };
}

/**
 * Toggle product active status
 */
export async function toggleProductStatus(productId: string, isActive: boolean) {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify product belongs to seller
  const { data: product, error: productError } = await client
    .from('products')
    .select('seller_id')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    return { success: false, error: 'Product not found' };
  }

  if (product.seller_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Update status
  const { data: updated, error: updateError } = await client
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)
    .select()
    .single();

  if (updateError) {
    console.error('Status update error:', updateError);
    return { success: false, error: 'Failed to update status' };
  }

  return {
    success: true,
    data: updated as Product,
    message: isActive ? 'Product published' : 'Product unpublished',
  };
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string) {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify product belongs to seller
  const { data: product, error: productError } = await client
    .from('products')
    .select('seller_id')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    return { success: false, error: 'Product not found' };
  }

  if (product.seller_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Delete product
  const { error: deleteError } = await client
    .from('products')
    .delete()
    .eq('id', productId);

  if (deleteError) {
    console.error('Product deletion error:', deleteError);
    return { success: false, error: 'Failed to delete product' };
  }

  return {
    success: true,
    message: 'Product deleted successfully',
  };
}

/**
 * Get seller's products
 */
export async function getSellerProducts() {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: products, error } = await client
    .from('products')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return { success: false, error: 'Failed to fetch products' };
  }

  return {
    success: true,
    data: (products || []) as Product[],
  };
}

/**
 * Get product by ID with seller info
 */
export async function getProductDetail(productId: string) {
  const client = await createServerClient();

  const { data: product, error } = await client
    .from('products')
    .select(
      `
        *,
        seller:seller_id (id, full_name, nid_status)
      `
    )
    .eq('id', productId)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return { success: false, error: 'Product not found' };
  }

  return {
    success: true,
    data: product,
  };
}

/**
 * Search products with filters
 */
export async function searchProducts(
  query?: string,
  category?: ProductCategory,
  villageId?: string,
  limit = 20,
  offset = 0
) {
  const client = await createServerClient();

  let queryBuilder = client
    .from('products')
    .select(
      `
        *,
        seller:seller_id (id, full_name, nid_status)
      `
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    queryBuilder = queryBuilder.eq('category', category);
  }

  if (query && query.trim().length > 0) {
    queryBuilder = queryBuilder.or(
      `name_en.ilike.%${query}%,name_bn.ilike.%${query}%`
    );
  }

  const { data: products, error, count } = await queryBuilder;

  if (error) {
    console.error('Search error:', error);
    return { success: false, error: 'Search failed' };
  }

  return {
    success: true,
    data: products || [],
    total: count || 0,
  };
}

/**
 * ADMIN: Get all products
 */
export async function getAllProducts(limit = 50, offset = 0) {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify admin
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'ADMIN') {
    return { success: false, error: 'Admin access required' };
  }

  const { data: products, error, count } = await client
    .from('products')
    .select(
      `
        *,
        seller:seller_id (id, full_name, nid_status)
      `
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching products:', error);
    return { success: false, error: 'Failed to fetch products' };
  }

  return {
    success: true,
    data: products || [],
    total: count || 0,
  };
}
