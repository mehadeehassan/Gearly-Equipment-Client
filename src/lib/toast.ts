import { toast } from 'sonner';

type ToastOptions = Parameters<typeof toast.success>[1];
const stableId = (kind: string, message: string) =>
  `gearly:${kind}:${message
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 70)}`;

export const notify = {
  success(message: string, options?: ToastOptions) {
    toast.success(message, { ...options, id: options?.id || stableId('success', message) });
  },
  error(message: string, options?: ToastOptions) {
    toast.error(message, { ...options, id: options?.id || stableId('error', message) });
  },
  warning(message: string, options?: ToastOptions) {
    toast.warning(message, { ...options, id: options?.id || stableId('warning', message) });
  },
  info(message: string, options?: ToastOptions) {
    toast.info(message, { ...options, id: options?.id || stableId('info', message) });
  },
};
