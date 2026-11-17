import { dashboard } from '@wix/dashboard';

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) return String((error as any).message);
  return String(error);
}

export const toastSuccess = (message: string) => dashboard.showToast({ message, type: 'success' });
export const toastError = (message: string) => dashboard.showToast({ message, type: 'error' });
