'use client';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { notify as toast } from '@/lib/toast';
import type { Analytics, Booking, Equipment, PaginationInfo, User } from '@/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getDashboardLinks } from './DashboardNavigation';
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
import { Pagination } from './Pagination';
type DashboardData = Analytics & {
  bookings?: Booking[];
  favorites?: { _id: string; equipment?: Equipment }[];
  users?: User[];
  equipment?: Equipment[];
  user?: User;
  pagination?: PaginationInfo;
};
export function DashboardClient({ user }: { user: User }) {
  const role = (user.role || 'customer').toLowerCase();
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const links = getDashboardLinks(role);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
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
    const paginatedSections = ['my-rentals', 'favorites', 'my-equipment', 'rentals', 'users', 'equipment'];
    const endpoint = paths[section] || paths.overview;
    const shouldPaginate = paginatedSections.includes(section) || (section === 'overview' && !isOwner && !isAdmin);
    const requestPath = shouldPaginate ? `${endpoint}?page=${page}&limit=10` : endpoint;

    apiFetch<DashboardData>(requestPath, {}, user.id)
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
  }, [section, refresh, isOwner, isAdmin, user.id, page]);

  function changePage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete('page');
    else params.set('page', String(nextPage));
    router.push(`${pathname}${params.size ? `?${params.toString()}` : ''}`, { scroll: false });
  }

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
  ) : loadError && ['overview', 'analytics'].includes(section) ? (
    <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center" role="alert">
      <h2 className="text-lg font-bold">Unable to load dashboard analytics</h2>
      <p className="mt-2 text-sm text-slate-500">{loadError}</p>
      <button type="button" onClick={() => setRefresh((value) => value + 1)} className="mt-5 rounded-xl bg-[#263b49] px-5 py-3 text-sm font-bold text-white">Try again</button>
    </div>
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
  ) : section === 'analytics' ? (
    <AnalyticsPanel data={data || {}} role={role} />
  ) : section === 'overview' ? (
    <OverviewPanel data={data || {}} role={role} onRecentPageChange={changePage} />
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
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold tracking-[.18em] text-[#6c91a7]">YOUR GEARLY SPACE</p>
        <h1 className="mt-2 text-4xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Welcome back, {user.name || 'there'}.</p>
      </div>
      <section className="min-w-0">
        {content}
        {!loading && section !== 'overview' && data?.pagination && (
          <Pagination pagination={data.pagination} onPageChange={changePage} />
        )}
      </section>
    </div>
  );
}
function OverviewPanel({ data, role, onRecentPageChange }: { data: DashboardData; role: string; onRecentPageChange: (page: number) => void }) {
  const admin = role === 'admin';
  const owner = role === 'owner';
  const metrics = admin
    ? [
        ['Total users', data.totalUsers], ['Customers', data.totalCustomers], ['Owners', data.totalOwners],
        ['Equipment listings', data.totalEquipment], ['Pending approvals', data.pendingApprovals], ['Total bookings', data.totalBookings],
        ['Successful payments', data.totalPayments], ['Paid booking revenue', `৳${Number(data.totalRevenue || 0).toLocaleString()}`],
      ] as [string, number | string | undefined][]
    : owner
      ? [
          ['My equipment', data.totalEquipment], ['Available units', data.availableUnits], ['Total bookings', data.totalBookings],
          ['Pending bookings', data.pendingBookings], ['Active bookings', data.activeRentals], ['Completed bookings', data.completedRentals],
          ['Approved listings', data.approvedEquipment], ['Pending listings', data.pendingEquipment],
          ['Rejected listings', data.rejectedEquipment], ['My paid earnings', `৳${Number(data.totalEarnings || 0).toLocaleString()}`],
        ] as [string, number | string | undefined][]
      : [
          ['Total bookings', data.totalBookings], ['Active rentals', data.activeRentals],
          ['Completed rentals', data.completedRentals], ['Pending bookings', data.pendingBookings],
          ['Total spending', `৳${Number(data.totalSpending || 0).toLocaleString()}`],
        ] as [string, number | string | undefined][];
  const accent = admin ? 'border-t-[#5f8ba3]' : owner ? 'border-t-[#4d9b7a]' : 'border-t-slate-300';

  return (
    <div className="space-y-5">
      {(admin || owner) && (
        <div className={`rounded-3xl border border-slate-200 border-t-4 ${accent} bg-white p-5 sm:p-6`}>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">{admin ? 'Platform overview' : 'Business overview'}</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">{admin ? 'Marketplace at a glance' : 'Your rental business at a glance'}</h2>
          <p className="mt-1 text-sm text-slate-500">{admin ? 'Platform-wide activity and paid transaction totals.' : 'Only activity and earnings linked to your equipment and account.'}</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([label, value], index) => (
          <div key={label} className={`rounded-3xl border border-slate-200 border-t-4 ${accent} bg-white p-5`}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-3 text-3xl font-black ${index === metrics.length - 1 && (admin || owner) ? 'text-[#263b49]' : 'text-slate-900'}`}>{value ?? 0}</p>
          </div>
        ))}
      </div>
      {admin && <div className="grid gap-5 xl:grid-cols-2"><DistributionSummary title="Booking status" rows={data.bookingStatusDistribution} /><DistributionSummary title="Equipment approval status" rows={data.equipmentStatusDistribution} /></div>}
      {owner && <div className="grid gap-5 xl:grid-cols-2"><DistributionSummary title="My equipment status" rows={data.equipmentStatusDistribution} /><DistributionSummary title="My booking pipeline" rows={data.bookingStatusDistribution} /></div>}
      {!owner && !admin && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-bold">Recent bookings</h2>
          {data.recentBookings?.length ? (
            <div className="mt-4 divide-y divide-slate-100">
              {data.recentBookings.map((booking) => (
                <div key={booking._id} className="flex min-w-0 items-center justify-between gap-4 py-3">
                  <EquipmentName title={booking.equipmentTitle} image={booking.equipmentImage} href={`/equipment/${booking.equipmentId}`} />
                  <StatusBadge status={booking.bookingStatus} />
                </div>
              ))}
            </div>
          ) : <p className="py-8 text-center text-sm text-slate-400">Your recent bookings will appear here.</p>}
          {data.recentBookingsPagination && <Pagination pagination={data.recentBookingsPagination} onPageChange={onRecentPageChange} />}
        </div>
      )}
    </div>
  );
}

const CHART_COLORS = ['#5f8ba3', '#4d9b7a', '#d49b45', '#c66d68', '#7d75a8', '#6e9b9a'];

function AnalyticsPanel({ data, role }: { data: DashboardData; role: string }) {
  return role === 'owner' ? <OwnerAnalytics data={data} /> : <AdminAnalytics data={data} />;
}

function AdminAnalytics({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 border-t-4 border-t-[#5f8ba3] bg-white p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">Admin analytics</p>
        <h2 className="mt-2 text-xl font-bold">Platform trends and distribution</h2>
        <p className="mt-1 text-sm text-slate-500">Marketplace-wide bookings, users, revenue, and equipment mix.</p>
      </div>
      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <MonthlyTrendCard title="Booking trend" description="Bookings created per month across the platform." rows={data.monthlyBookings} color="#5f8ba3" />
        <MonthlyTrendCard title="User registrations" description="New customer and owner accounts by registration month." rows={data.userRegistrationTrend} color="#4d9b7a" />
        <MonthlyTrendCard title="Paid booking revenue" description="Booking amounts from successfully paid transactions." rows={data.monthlyRevenue} color="#d49b45" currency />
        <DonutCard title="Equipment category mix" description="Current listings grouped by equipment category." rows={data.categoryDistribution} />
        <DonutCard title="Booking status" description="All bookings grouped by their current status." rows={data.bookingStatusDistribution} />
      </div>
    </div>
  );
}

function OwnerAnalytics({ data }: { data: DashboardData }) {
  const equipmentRows = (data.mostBookedEquipment || []).map((item) => ({ _id: item.title, total: item.totalBookings }));
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 border-t-4 border-t-[#4d9b7a] bg-white p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">Owner analytics</p>
        <h2 className="mt-2 text-xl font-bold">Your equipment performance</h2>
        <p className="mt-1 text-sm text-slate-500">Charts include only your equipment, its bookings, and your paid earnings.</p>
      </div>
      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <MonthlyTrendCard title="My paid earnings" description="Monthly paid amounts associated with your owner account." rows={data.monthlyEarnings} color="#4d9b7a" currency />
        <MonthlyTrendCard title="Bookings for my equipment" description="Booking requests created for your listings each month." rows={data.monthlyOwnerBookings} color="#5f8ba3" />
        <BarBreakdownCard title="Most booked equipment" description="Your five most booked listings, ranked by booking count." rows={equipmentRows} color="#4d9b7a" />
        <DonutCard title="My equipment status" description="Your listings grouped by approval status." rows={data.equipmentStatusDistribution} />
        <DonutCard title="My booking status" description="Bookings scoped to your equipment and owner account." rows={data.bookingStatusDistribution} />
      </div>
    </div>
  );
}

function MonthlyTrendCard({ title, description, rows, color, currency = false }: { title: string; description: string; rows?: { _id: string; total: number }[]; color: string; currency?: boolean }) {
  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
      {rows?.length ? <div className="mt-4 h-72 min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf0" />
            <XAxis dataKey="_id" tickFormatter={(value: string) => value.slice(5)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(value: number) => currency ? `৳${Number(value).toLocaleString()}` : value.toLocaleString()} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
            <Tooltip formatter={(value) => [currency ? `৳${Number(value).toLocaleString()}` : Number(value).toLocaleString(), title]} labelFormatter={(label) => `Month: ${label}`} />
            <Area name={title} type="monotone" dataKey="total" stroke={color} strokeWidth={2.5} fill={color} fillOpacity={0.12} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div> : <ChartEmptyState />}
    </div>
  );
}

function DonutCard({ title, description, rows }: { title: string; description: string; rows?: { _id: string; total: number }[] }) {
  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
      {rows?.length ? <div className="mt-4 h-72 min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="total" nameKey="_id" innerRadius={58} outerRadius={92} paddingAngle={2}>
              {rows.map((row, index) => <Cell key={`${row._id}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Records']} />
            <Legend formatter={(value) => String(value).replaceAll('_', ' ')} />
          </PieChart>
        </ResponsiveContainer>
      </div> : <ChartEmptyState />}
    </div>
  );
}

function BarBreakdownCard({ title, description, rows, color }: { title: string; description: string; rows?: { _id: string; total: number }[]; color: string }) {
  const height = Math.max(220, Math.min(360, (rows?.length || 0) * 42));
  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
      {rows?.length ? <div className="mt-4 min-w-0 w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8edf0" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="_id" width={125} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Bookings']} />
            <Bar dataKey="total" fill={color} radius={[0, 6, 6, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div> : <ChartEmptyState />}
    </div>
  );
}

function DistributionSummary({ title, rows }: { title: string; rows?: { _id: string; total: number }[] }) {
  const total = rows?.reduce((sum, row) => sum + row.total, 0) || 0;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <h3 className="font-bold">{title}</h3>
      {rows?.length ? <ul className="mt-4 space-y-4">
        {rows.map((row, index) => (
          <li key={row._id}>
            <div className="mb-1 flex justify-between gap-3 text-sm"><span className="capitalize text-slate-600">{row._id.replaceAll('_', ' ')}</span><span className="font-bold text-slate-900">{row.total.toLocaleString()}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${total ? (row.total / total) * 100 : 0}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} /></div>
          </li>
        ))}
      </ul> : <ChartEmptyState />}
    </div>
  );
}

function ChartEmptyState() {
  return <p className="grid h-56 place-items-center text-center text-sm text-slate-400">No records available for this chart yet.</p>;
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
