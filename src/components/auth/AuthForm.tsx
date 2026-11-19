'use client';
import { authClient } from '@/lib/auth-client';
import { notify as toast } from '@/lib/toast';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ImageUpload } from '@/components/shared/ImageUpload';

function FieldError({ id, message }: { id: string; message?: string }) {
  return <span id={id} className="mt-1 block min-h-4 text-xs font-normal text-red-600" role="alert">{message || ''}</span>;
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isRegister = mode === 'register';
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const name = String(data.get('name') || '');
    const email = String(data.get('email'));
    const password = String(data.get('password'));
    const errors: Record<string, string> = {};
    if (isRegister && !name.trim()) errors.name = 'Enter your name.';
    if (!email.trim()) errors.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Enter your password.';
    if (isRegister && (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || password.length < 6)) {
      errors.password = 'Use at least 6 characters, including uppercase and lowercase letters.';
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      toast.error(Object.values(errors)[0]);
      setBusy(false);
      return;
    }
    setFieldErrors({});
    try {
      const result = isRegister
        ? await authClient.signUp.email({ name, email, password, image })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        const rawMessage = result.error.message || '';
        const lowerMessage = rawMessage.toLowerCase();
        if (isRegister && /already|exist|duplicate|taken/.test(lowerMessage)) {
          setFieldErrors({ email: 'An account with this email already exists.' });
          toast.error('An account with this email already exists.');
        } else if (!isRegister && /credential|password|email|user not found|invalid/.test(lowerMessage)) {
          setFieldErrors({ email: 'Email or password is incorrect.', password: 'Email or password is incorrect.' });
          toast.error('Email or password is incorrect.');
        } else {
          toast.error('Unable to complete your request. Please try again.');
        }
        setBusy(false);
        return;
      }
      toast.success(isRegister ? 'Account created successfully' : 'Welcome back!');
      router.push(params.get('redirect') || '/dashboard');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof TypeError ? 'Network error. Check your connection and try again.' : 'Unable to complete your request. Please try again.');
      setBusy(false);
    }
  }
  async function google() {
    setBusy(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: params.get('redirect') || '/dashboard',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
      setBusy(false);
    }
  }
    const newLocal = "font-bold text-[#31566b]";
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-12 px-5 py-12 lg:grid-cols-2 lg:px-8">
      <div className="hidden rounded-4xl bg-[#e7eff2] p-10 lg:block">
        <p className="text-xs font-bold tracking-[.18em] text-[#66899c]">WELCOME TO GEARLY</p>
        <h1 className="mt-5 text-5xl font-black leading-tight">
          Your next big idea needs{' '}
          <span className="font-serif font-normal italic text-[#66899c]">the right gear.</span>
        </h1>
        <p className="mt-5 max-w-sm leading-7 text-slate-500">
          Find equipment, connect with owners and get your work moving.
        </p>
        <Image
          width={1000}
          height={640}
          className="mt-10 h-64 w-full rounded-3xl object-cover"
          src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000"
          alt="Workshop equipment"
        />
      </div>
      <div className="mx-auto w-full max-w-md">
        <p className="text-xs font-bold tracking-[.18em] text-[#6c91a7]">
          {isRegister ? 'CREATE YOUR ACCOUNT' : 'YOUR WORKSPACE AWAITS'}
        </p>
        <h2 className="mt-3 text-4xl font-black">
          {isRegister ? 'Get started.' : 'Welcome back.'}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {isRegister
            ? 'Create an account to explore and rent equipment.'
            : 'Log in to manage your equipment and rentals.'}
        </p>
        <button
          disabled={busy}
          onClick={google}
          className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white font-semibold hover:bg-slate-50"
        >
          <span className="font-black text-[#4285f4]">G</span> Continue with Google
        </button>
        <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          OR WITH EMAIL
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <form onSubmit={submit} noValidate className="space-y-4">
          {isRegister && (
            <label className="block text-sm font-semibold">
              Full name
              <input
                name="name"
                required
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                onChange={() => setFieldErrors((errors) => ({ ...errors, name: '' }))}
                className={`mt-2 h-12 w-full rounded-xl border bg-white px-4 font-normal outline-none focus:border-[#86a8b9] ${fieldErrors.name ? 'border-red-500' : 'border-slate-200'}`}
                placeholder="Your name"
              />
              <FieldError id="name-error" message={fieldErrors.name} />
            </label>
          )}
          <label className="block text-sm font-semibold">
            Email address
            <input
              name="email"
              type="email"
              required
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              onChange={() => setFieldErrors((errors) => ({ ...errors, email: '' }))}
              className={`mt-2 h-12 w-full rounded-xl border bg-white px-4 font-normal outline-none focus:border-[#86a8b9] ${fieldErrors.email ? 'border-red-500' : 'border-slate-200'}`}
              placeholder="you@example.com"
            />
            <FieldError id="email-error" message={fieldErrors.email} />
          </label>
          {isRegister && (
            <ImageUpload value={image} onChange={setImage} label="Profile photo (optional)" />
          )}
          <label className="block text-sm font-semibold">
            Password
            <span className="relative mt-2 block">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                minLength={6}
                required
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                onChange={() => setFieldErrors((errors) => ({ ...errors, password: '' }))}
                className={`h-12 w-full rounded-xl border bg-white px-4 pr-12 font-normal outline-none focus:border-[#86a8b9] ${fieldErrors.password ? 'border-red-500' : 'border-slate-200'}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 hover:text-slate-600 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#86a8b9]"
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </span>
            <FieldError id="password-error" message={fieldErrors.password} />
          </label>
          {isRegister && (
            <p className="text-xs text-slate-400">
              Use at least 6 characters, including uppercase and lowercase letters.
            </p>
          )}
          <button
            disabled={busy}
            className="h-12 w-full rounded-xl bg-[#263b49] font-bold text-white transition hover:bg-blue-deep disabled:opacity-50"
          >
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          {isRegister ? 'Already have an account?' : 'New to Gearly?'}{' '}
          <Link className={newLocal} href={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      </div>
    </div>
  );
}
