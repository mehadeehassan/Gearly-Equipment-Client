'use client';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { notify as toast } from '@/lib/toast';
import type { Analytics, Booking, Equipment, User } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardNavigation, getDashboardLinks } from './DashboardNavigation';
import {
  BookingTable,
  EquipmentName,
  EquipmentTable,
  FavoritesPanel,
  UsersTable,
} from './DashboardTables';
import { ImageUpload } from '../shared/ImageUpload';
import { TableSkeleton } from '../shared/Skeletons';
import { StatusBadge } from '../shared/StatusBadge';
type DashboardData = Analytics & {
  bookings?: Booking[];
  favorites?: { _id: string; equipment?: Equipment }[];
  users?: User[];
  equipment?: Equipment[];
  user?: User;
};
export function DashboardClient({ user }: { user: User }) {
  const role = (user.role || 'customer').toLowerCase();
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const links = getDashboardLinks(role);
  const pathname = usePathname();
  const router = useRouter();
  const section = pathname.split('/')[2] || 'overview';
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [payingId, setPayingId] = useState('');
  const paymentLock = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    const paths: Record<string, string> = {
      'my-rentals': '/bookings/my',
      favorites: '/favorites',
      profile: '/profile',
      'my-equipment': '/owner/equipment',
      rentals: isOwner ? '/owner/bookings' : '/admin/bookings',
      users: '/admin/users',
      equipment: isAdmin ? '/admin/equipment' : '/owner/equipment',
      analytics: isAdmin ? '/admin/analytics' : '/owner/analytics',
      overview: isAdmin ? '/admin/analytics' : isOwner ? '/owner/analytics' : '/customer/analytics',
      'add-equipment': '/owner/equipment',
    };

    apiFetch<DashboardData>(paths[section] || paths.overview, {}, user.id)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (!active) return;
        setData(null);
        const message = err instanceof Error ? err.message : 'Unable to load dashboard';
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [section, refresh, isOwner, isAdmin, user.id]);

  async function action(path: string, method = 'PATCH', body?: unknown): Promise<boolean> {
    if (busyAction) return false;
    setBusyAction(path);
    try {
      await apiFetch(
        path,
        { method, body: body === undefined ? undefined : JSON.stringify(body) },
        user.id,
      );
      toast.success('Changes saved');
      setRefresh((value) => value + 1);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
      return false;
    } finally {
      setBusyAction('');
    }
  }

  async function payForBooking(bookingId: string) {
    if (paymentLock.current || payingId) return;
    paymentLock.current = true;
    setPayingId(bookingId);
    try {
      const checkout = await apiFetch<{ url: string }>(
        `/payments/checkout/${bookingId}`,
        { method: 'POST' },
        user.id,
      );
      window.location.assign(checkout.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start secure checkout', {
        id: `checkout-${bookingId}`,
      });
      setPayingId('');
    } finally {
      paymentLock.current = false;
    }
  }

  const title = links.find(([key]) => key === section)?.[1] || 'Overview';
  const content = loading ? (
    <TableSkeleton />
  ) : section === 'profile' && loadError ? (
    <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center">
      <h2 className="text-lg font-bold">Unable to load your profile</h2>
      <p className="mt-2 text-sm text-slate-500">{loadError}</p>
      <button
        type="button"
        onClick={() => setRefresh((value) => value + 1)}
        className="mt-5 rounded-xl bg-[#263b49] px-5 py-3 text-sm font-bold text-white"
      >
        Try again
      </button>
    </div>
  ) : section === 'profile' ? (
    <ProfilePanel
      user={data?.user || user}
      userId={user.id}
      onSave={() => setRefresh((value) => value + 1)}
    />
  ) : section === 'add-equipment' ? (
    <EquipmentForm
      userId={user.id}
      onDone={() => {
        toast.success('Equipment submitted for approval');
        router.push('/dashboard/my-equipment');
      }}
    />
  ) : section === 'analytics' || section === 'overview' ? (
    <AnalyticsPanel data={data || {}} role={role} />
  ) : section === 'favorites' ? (
    <FavoritesPanel
      data={data?.favorites || []}
      busy={Boolean(busyAction)}
      onRemove={(id) => action(`/favorites/${id}`, 'DELETE')}
    />
  ) : section === 'my-rentals' || section === 'rentals' ? (
    <BookingTable
      rows={data?.bookings || []}
      admin={isAdmin}
      owner={isOwner}
      userId={user.id}
      canReview={role === 'customer'}
      onPay={!isAdmin && !isOwner ? payForBooking : undefined}
      payingId={payingId}
    />
  ) : section === 'my-equipment' || section === 'equipment' ? (
    <EquipmentTable
      rows={data?.equipment || []}
      admin={isAdmin}
      busy={Boolean(busyAction)}
      onAction={action}
    />
  ) : section === 'users' ? (
    <UsersTable
      rows={data?.users || []}
      currentUserId={user.id}
      busy={Boolean(busyAction)}
      onAction={action}
    />
  ) : (
    <div className="rounded-3xl bg-white p-8">Nothing to show yet.</div>
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-bold tracking-[.18em] text-[#6c91a7]">YOUR GEARLY SPACE</p>
        <h1 className="mt-2 text-4xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Welcome back, {user.name || 'there'}.</p>
      </div>
      <div className="grid gap-7 lg:grid-cols-[230px_1fr]">
        <DashboardNavigation user={user} role={role} section={section} />
        <section className="min-w-0">{content}</section>
      </div>
    </div>
  );
}
function AnalyticsPanel({ data, role }: { data: Analytics; role: string }) {
  const admin = role === 'admin';
  const owner = role === 'owner';
  const entries: [string, number | string | undefined][] = admin
    ? [
        ['Total users', data.totalUsers],
        ['Total equipment', data.totalEquipment],
        ['Total bookings', data.totalBookings],
        ['Pending approvals', data.pendingApprovals],
        ['Completed rentals', data.completedRentals],
        ['Total revenue', `৳${Number(data.totalRevenue || 0).toLocaleString()}`],
        ['Total reviews', data.totalReviews],
        ['Homepage reviews', data.homepageReviews],
      ]
    : owner
      ? [
          ['Total equipment', data.totalEquipment],
          ['Approved equipment', data.approvedEquipment],
          ['Pending approval', data.pendingEquipment],
          ['Bookings received', data.totalBookings],
          ['Active rentals', data.activeRentals],
          ['Completed rentals', data.completedRentals],
          ['Total earnings', `৳${Number(data.totalEarnings || 0).toLocaleString()}`],
          ['My equipment reviews', data.myEquipmentReviews],
        ]
      : [
          ['Total bookings', data.totalBookings],
          ['Active rentals', data.activeRentals],
          ['Completed rentals', data.completedRentals],
          ['Pending bookings', data.pendingBookings],
          ['Total spending', `৳${Number(data.totalSpending || 0).toLocaleString()}`],
        ];
  const primaryChart = admin
    ? data.monthlyBookings
    : owner
      ? data.monthlyEarnings
      : data.monthlyRentals;
  const primaryTitle = admin ? 'Monthly bookings' : owner ? 'Monthly earnings' : 'Monthly rentals';
  const secondaryChart = admin ? data.monthlyRevenue : undefined;
  const Chart = ({
    title,
    rows,
    color,
    currency = false,
  }: {
    title: string;
    rows?: { _id: string; total: number }[];
    color: string;
    currency?: boolean;
  }) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="font-bold">{title}</h2>
      {rows?.length ? (
        <div className="mt-5 h-70 min-w-0 w-full sm:h-85">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient
                  id={`fill-${title.replaceAll(' ', '-')}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf0" />
              <XAxis
                dataKey="_id"
                tickFormatter={(value: string) => value.slice(5)}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value: number) =>
                  currency ? `৳${Number(value).toLocaleString()}` : value.toLocaleString()
                }
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip
                formatter={(value) => [
                  currency ? `৳${Number(value).toLocaleString()}` : value,
                  title,
                ]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Area
                name={currency ? 'Amount' : 'Bookings'}
                type="monotone"
                dataKey="total"
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#fill-${title.replaceAll(' ', '-')})`}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-slate-400">No monthly activity yet.</p>
      )}
    </div>
  );
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-black">{value ?? 0}</p>
          </div>
        ))}
      </div>
      <div
        className={`mt-5 grid min-w-0 gap-5 ${secondaryChart ? 'xl:grid-cols-2' : 'grid-cols-1'}`}
      >
        <Chart title={primaryTitle} rows={primaryChart} color="#5f8ba3" currency={owner} />
        {secondaryChart && (
          <Chart title="Monthly revenue" rows={secondaryChart} color="#4d9b7a" currency />
        )}
      </div>
      {!owner && !admin && (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-bold">Recent bookings</h2>
          {data.recentBookings?.length ? (
            <div className="mt-4 divide-y divide-slate-100">
              {data.recentBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="flex min-w-0 items-center justify-between gap-4 py-3"
                >
                  <EquipmentName
                    title={booking.equipmentTitle}
                    image={booking.equipmentImage}
                    href={`/equipment/${booking.equipmentId}`}
                  />
                  <StatusBadge status={booking.bookingStatus} />
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">
              Your recent bookings will appear here.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
function EquipmentForm({ onDone, userId }: { onDone: () => void; userId: string }) {
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const submitLock = useRef(false);
  const errorId = (name: string) => `add-equipment-${name}-error`;
  const inputClass = (name: string) => `mt-2 h-11 w-full rounded-xl border px-3 font-normal ${fieldErrors[name] ? 'border-red-500' : 'border-slate-200'}`;
  const showError = (name: string) => <span id={errorId(name)} className="block min-h-4 text-xs font-normal text-red-600" role="alert">{fieldErrors[name] || ''}</span>;
  const fieldProps = (name: string) => ({
    'aria-invalid': Boolean(fieldErrors[name]),
    'aria-describedby': errorId(name),
    onChange: () => setFieldErrors((errors) => ({ ...errors, [name]: '' })),
  });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLock.current || busy) return;
    const f = new FormData(e.currentTarget);
    const errors: Record<string, string> = {};
    for (const name of ['title', 'location', 'price', 'availableQuantity', 'category', 'description']) {
      if (!String(f.get(name) || '').trim()) errors[name] = 'This field is required.';
    }
    if (f.get('price') && Number(f.get('price')) <= 0) errors.price = 'Enter a price greater than zero.';
    if (f.get('availableQuantity') && Number(f.get('availableQuantity')) < 0) errors.availableQuantity = 'Quantity cannot be negative.';
    if (!image) errors.image = 'Add an equipment image before submitting.';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }
    setFieldErrors({});
    submitLock.current = true;
    setBusy(true);
    const payload: Record<string, string | number> = {
      ...(Object.fromEntries(f.entries()) as Record<string, string>),
      image,
    };
    payload.price = Number(payload.price);
    payload.availableQuantity = Number(payload.availableQuantity);
    try {
      await apiFetch('/owner/equipment', { method: 'POST', body: JSON.stringify(payload) }, userId);
      toast.success('Equipment submitted for approval');
      onDone();
    } catch (err) {
      if (err instanceof ApiRequestError && Object.keys(err.fieldErrors).length) {
        const mapped = Object.fromEntries(Object.entries(err.fieldErrors).map(([key, value]) => [key.split('.').pop()!.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), Array.isArray(value) ? value.join(', ') : value]));
        const known = Object.fromEntries(Object.entries(mapped).filter(([key]) => ['title', 'location', 'price', 'availableQuantity', 'brand', 'model', 'category', 'rentalType', 'condition', 'description', 'terms', 'image'].includes(key)));
        if (Object.keys(known).length) {
          setFieldErrors(known);
          toast.error(Object.values(known)[0]);
        } else toast.error(err.message || 'Unable to add equipment. Please try again.');
      } else {
        toast.error(err instanceof TypeError ? 'Network error. Check your connection and try again.' : err instanceof Error ? err.message : 'Unable to add equipment');
      }
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
    >
      <h2 className="text-xl font-black sm:col-span-2">Add equipment listing</h2>
      {[
        ['title', 'Equipment name', 'text'],
        ['location', 'Location', 'text'],
        ['price', 'Rental price', 'number'],
        ['availableQuantity', 'Available quantity', 'number'],
        ['brand', 'Brand', 'text'],
        ['model', 'Model', 'text'],
      ].map(([name, label, type]) => (
        <label key={name} className="text-sm font-semibold">
          {label}
          <input
            required
            name={name}
            type={type}
            min={name === 'price' ? '0.01' : type === 'number' ? '0' : undefined}
            {...fieldProps(name)}
            className={inputClass(name)}
          />
          {showError(name)}
        </label>
      ))}
      <label className="text-sm font-semibold">
        Category
        <select
          name="category"
          required
          {...fieldProps('category')}
          className={inputClass('category')}
        >
          {[
            'Construction Equipment',
            'Photography Equipment',
            'Vehicles & Transportation',
            'Agriculture Equipment',
            'Electronics',
            'Event Equipment',
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        {showError('category')}
      </label>
      <label className="text-sm font-semibold">
        Rental type
        <select
          name="rentalType"
          {...fieldProps('rentalType')}
          className={inputClass('rentalType')}
        >
          <option>Daily</option>
          <option>Weekly</option>
          <option>Monthly</option>
        </select>
        {showError('rentalType')}
      </label>
      <label className="text-sm font-semibold">
        Condition
        <input
          name="condition"
          {...fieldProps('condition')}
          className={inputClass('condition')}
        />
        {showError('condition')}
      </label>
      <label className="text-sm font-semibold sm:col-span-2">
        Description
        <textarea
          required
          {...fieldProps('description')}
          name="description"
          rows={3}
          className={`mt-2 w-full rounded-xl border p-3 font-normal ${fieldErrors.description ? 'border-red-500' : 'border-slate-200'}`}
        />
        {showError('description')}
      </label>
      <label className="text-sm font-semibold sm:col-span-2">
        Rental terms
        <textarea
          name="terms"
          rows={3}
          {...fieldProps('terms')}
          className={`mt-2 w-full rounded-xl border p-3 font-normal ${fieldErrors.terms ? 'border-red-500' : 'border-slate-200'}`}
        />
        {showError('terms')}
      </label>
      <div className="sm:col-span-2">
        <ImageUpload value={image} onChange={(value) => { setImage(value); setFieldErrors((errors) => ({ ...errors, image: '' })); }} invalid={Boolean(fieldErrors.image)} errorId={errorId('image')} />
        {showError('image')}
      </div>
      <button
        disabled={busy}
        className="rounded-xl bg-[#263b49] px-5 py-3 font-bold text-white disabled:opacity-50 sm:col-span-2"
      >
        {busy ? 'Submitting…' : 'Submit for approval'}
      </button>
    </form>
  );
}
function ProfilePanel({
  user,
  userId,
  onSave,
}: {
  user: User;
  userId: string;
  onSave: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState(user.image || '');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const payload = Object.fromEntries(f.entries());
    try {
      await apiFetch(
        '/profile',
        { method: 'PATCH', body: JSON.stringify({ ...payload, image }) },
        userId,
      );
      toast.success('Profile updated');
      onSave();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to update profile');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-black">Your profile</h2>
      <label className="text-sm font-semibold">
        Name
        <input
          name="name"
          defaultValue={user.name}
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal"
        />
      </label>
      <ImageUpload value={image} onChange={setImage} label="Profile photo" />
      <label className="text-sm font-semibold">
        Phone number
        <input
          name="phone"
          defaultValue={user.phone}
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal"
        />
      </label>
      <label className="text-sm font-semibold">
        Address
        <textarea
          name="address"
          defaultValue={user.address}
          rows={3}
          className="mt-2 w-full rounded-xl border border-slate-200 p-4 font-normal"
        />
      </label>
      <button
        disabled={busy}
        className="w-fit rounded-xl bg-[#263b49] px-6 py-3 font-bold text-white"
      >
        {busy ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
