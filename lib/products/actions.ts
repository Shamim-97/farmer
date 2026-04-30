'use server';

import { createServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/actions';
import { isPlaceholderEnv } from '@/lib/env';
import { ok, err, okPaginated, type Result, type PaginatedResult } from '@/lib/types/result';
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
export async function createProduct(
  input: CreateProductInput
): Promise<Result<Product>> {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) return err('Not authenticated');

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role, nid_status')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) return err('Profile not found');
  if (profile.role !== 'SELLER') return err('Only sellers can create products');
  if (profile.nid_status !== 'APPROVED') {
    return err('NID verification required. Please upload your NID first.');
  }

  if (!input.name_en || !input.name_bn) {
    return err('Both English and Bangla names are required');
  }
  if (input.price_per_kg <= 0) return err('Price must be greater than 0');
  if (input.min_order_kg <= 0) return err('Minimum order must be greater than 0');
  if (input.stock_kg < 0) return err('Stock cannot be negative');

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
    return err('Failed to create product');
  }

  return ok(product as Product);
}

/**
 * Update a product
 */
export async function updateProduct(
  productId: string,
  input: UpdateProductInput
): Promise<Result<Product>> {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) return err('Not authenticated');

  const { data: product, error: productError } = await client
    .from('products')
    .select('seller_id')
    .eq('id', productId)
    .single();

  if (productError || !product) return err('Product not found');
  if (product.seller_id !== user.id) return err('Unauthorized');

  if (input.price_per_kg !== undefined && input.price_per_kg <= 0) {
    return err('Price must be greater than 0');
  }
  if (input.min_order_kg !== undefined && input.min_order_kg <= 0) {
    return err('Minimum order must be greater than 0');
  }
  if (input.stock_kg !== undefined && input.stock_kg < 0) {
    return err('Stock cannot be negative');
  }

  const { data: updated, error: updateError } = await client
    .from('products')
    .update(input)
    .eq('id', productId)
    .select()
    .single();

  if (updateError) {
    console.error('Product update error:', updateError);
    return err('Failed to update product');
  }

  return ok(updated as Product);
}

/**
 * Toggle product active status
 */
export async function toggleProductStatus(
  productId: string,
  isActive: boolean
): Promise<Result<Product>> {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) return err('Not authenticated');

  const { data: product, error: productError } = await client
    .from('products')
    .select('seller_id')
    .eq('id', productId)
    .single();

  if (productError || !product) return err('Product not found');
  if (product.seller_id !== user.id) return err('Unauthorized');

  const { data: updated, error: updateError } = await client
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)
    .select()
    .single();

  if (updateError) {
    console.error('Status update error:', updateError);
    return err('Failed to update status');
  }

  return ok(updated as Product);
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string): Promise<Result<void>> {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) return err('Not authenticated');

  const { data: product, error: productError } = await client
    .from('products')
    .select('seller_id')
    .eq('id', productId)
    .single();

  if (productError || !product) return err('Product not found');
  if (product.seller_id !== user.id) return err('Unauthorized');

  const { error: deleteError } = await client
    .from('products')
    .delete()
    .eq('id', productId);

  if (deleteError) {
    console.error('Product deletion error:', deleteError);
    return err('Failed to delete product');
  }

  return ok(undefined);
}

/**
 * Get seller's products
 */
export async function getSellerProducts(): Promise<Result<Product[]>> {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) return err('Not authenticated');

  const { data: products, error } = await client
    .from('products')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return err('Failed to fetch products');
  }

  return ok((products ?? []) as Product[]);
}

/**
 * Get product by ID with seller info
 */
export async function getProductDetail(productId: string): Promise<Result<Product>> {
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
    return err('Product not found');
  }

  return ok(product as unknown as Product);
}

/**
 * Search products with filters
 */
export async function searchProducts(
  query?: string,
  category?: ProductCategory,
  _villageId?: string,
  limit = 20,
  offset = 0
): Promise<PaginatedResult<Product[]>> {
  if (isPlaceholderEnv()) return okPaginated([] as Product[], 0);

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

  if (category) queryBuilder = queryBuilder.eq('category', category);

  if (query && query.trim().length > 0) {
    queryBuilder = queryBuilder.or(
      `name_en.ilike.%${query}%,name_bn.ilike.%${query}%`
    );
  }

  const { data: products, error, count } = await queryBuilder;

  if (error) {
    console.error('Search error:', error);
    return err('Search failed');
  }

  return okPaginated((products ?? []) as unknown as Product[], count ?? 0);
}

/**
 * ADMIN: Get all products
 */
export async function getAllProducts(
  limit = 50,
  offset = 0
): Promise<PaginatedResult<Product[]>> {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) return err('Not authenticated');

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'ADMIN') {
    return err('Admin access required');
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
    return err('Failed to fetch products');
  }

  return okPaginated((products ?? []) as unknown as Product[], count ?? 0);
}
