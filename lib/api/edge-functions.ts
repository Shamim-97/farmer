/**
 * Client-side API utilities for calling Supabase Edge Functions
 */

export interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  data?: T;
  [key: string]: any;
}

const EDGE_FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;

/**
 * Call an Edge Function via HTTP
 */
async function callEdgeFunction<T>(
  functionName: string,
  method: string = 'GET',
  body?: Record<string, any>
): Promise<ApiResponse<T>> {
  try {
    const url = new URL(`${EDGE_FUNCTION_URL}/${functionName}`, window.location.origin);

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    } else if (body && method === 'GET') {
      Object.entries(body).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || response.statusText,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
      ...data,
    };
  } catch (error) {
    console.error(`Edge function ${functionName} error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch village progress data
 */
export async function getVillageProgress(villageId: string) {
  return callEdgeFunction('village-progress', 'GET', { village_id: villageId });
}

/**
 * Place an order (server-side validation + threshold engine)
 */
export async function placeOrder(orderData: {
  customer_id: string;
  product_id: string;
  seller_id: string;
  pickup_point_id: string;
  village_id: string;
  quantity_kg: number;
  unit_price: number;
  pickup_date: string;
  order_source: string;
  payment_method?: string;
  transaction_id?: string;
}) {
  return callEdgeFunction('place-order', 'POST', orderData);
}

export default {
  getVillageProgress,
  placeOrder,
};
