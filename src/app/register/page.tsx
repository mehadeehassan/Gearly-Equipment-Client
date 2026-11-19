import { AuthForm } from '@/components/auth/AuthForm';
import { Suspense } from 'react';
export default function RegisterPage() {
  return (
    <Suspense>
      <AuthForm mode="register" />
    </Suspense>
  );
}
