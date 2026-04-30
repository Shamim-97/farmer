// Single result shape for server actions and API handlers.
// Use this everywhere instead of ad-hoc { success, data, error } objects.
export type Result<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type PaginatedResult<T> =
  | { success: true; data: T; total: number }
  | { success: false; error: string };

export const ok = <T>(data: T): Result<T> => ({ success: true, data });

// Error variant is structurally identical for Result<T> and PaginatedResult<T>;
// returning a literal { success: false; error } stays assignable to both.
export const err = (
  error: string
): { success: false; error: string } => ({ success: false, error });

export const okPaginated = <T>(data: T, total: number): PaginatedResult<T> => ({
  success: true,
  data,
  total,
});
