export type ProductCategory = 'FISH' | 'VEGETABLE' | 'MEAT' | 'DAIRY' | 'OTHER';

export interface Product {
  id: string;
  seller_id: string;
  name_en: string;
  name_bn: string;
  category: ProductCategory;
  description_en?: string;
  description_bn?: string;
  price_per_kg: number;
  min_order_kg: number;
  min_size_cm?: number;
  stock_kg: number;
  unit: string; // e.g., 'kg', 'piece'
  thumbnail_url?: string;
  is_active: boolean;
  is_refundable: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithSeller extends Product {
  seller: {
    id: string;
    full_name: string;
    nid_status: string;
  };
}

export const PRODUCT_CATEGORIES: Record<ProductCategory, { label_en: string; label_bn: string }> = {
  FISH: { label_en: 'Fish', label_bn: 'মাছ' },
  VEGETABLE: { label_en: 'Vegetables', label_bn: 'সবজি' },
  MEAT: { label_en: 'Meat', label_bn: 'মাংস' },
  DAIRY: { label_en: 'Dairy', label_bn: 'দুধ ও দুগ্ধজাত' },
  OTHER: { label_en: 'Other', label_bn: 'অন্যান্য' },
};

export const PRODUCT_UNITS = [
  { value: 'kg', label: 'Kilogram' },
  { value: 'piece', label: 'Piece' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'liter', label: 'Liter' },
];
