export type UserRole = 'CUSTOMER' | 'SELLER' | 'PICKUP_AGENT' | 'ADMIN';
export type NIDStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string;
  role: UserRole;
  village_id: string | null;
  nid_status: NIDStatus;
  nid_front_url: string | null;
  nid_back_url: string | null;
  nid_rejection_reason: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

export const ROLE_PERMISSIONS = {
  CUSTOMER: {
    canBrowseProducts: true,
    canPlaceOrder: true,
    canRequestRefund: true,
    canCreateListing: false,
    canViewOrders: true,
    canAccessAdminPanel: false,
    canMarkCollected: false,
  },
  SELLER: {
    canBrowseProducts: false,
    canPlaceOrder: false,
    canRequestRefund: false,
    canCreateListing: true, // Only if NID approved
    canViewOrders: true, // Only their own orders
    canAccessAdminPanel: false,
    canMarkCollected: false,
  },
  PICKUP_AGENT: {
    canBrowseProducts: false,
    canPlaceOrder: false,
    canRequestRefund: false,
    canCreateListing: false,
    canViewOrders: true, // Only assigned pickup points
    canAccessAdminPanel: false,
    canMarkCollected: true,
  },
  ADMIN: {
    canBrowseProducts: true,
    canPlaceOrder: true,
    canRequestRefund: false,
    canCreateListing: false,
    canViewOrders: true,
    canAccessAdminPanel: true,
    canMarkCollected: false,
  },
} as const;

// Route constants moved to @/lib/constants/routes.
// Re-exported here for back-compat. Prefer importing from constants/routes.
export {
  PUBLIC_ROUTES,
  SELLER_ONLY_ROUTES,
  ADMIN_ONLY_ROUTES,
  AGENT_ONLY_ROUTES,
} from '@/lib/constants/routes';
