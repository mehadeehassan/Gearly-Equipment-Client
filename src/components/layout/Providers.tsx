'use client';
import { Toaster } from 'sonner';
export function Providers() {
  return <Toaster position="top-right" richColors closeButton duration={3500} style={{ zIndex: 10000 }} />;
}
