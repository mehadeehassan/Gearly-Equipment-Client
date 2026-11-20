'use client';

import { apiFetch } from '@/lib/api';
import { notify as toast } from '@/lib/toast';
import type { PaginationInfo, Review, User } from '@/types';
import { Search, Star, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EquipmentName } from './DashboardTables';
import { Pagination } from './Pagination';

type ManagedReview = Review & {
  equipmentId: string;
  equipmentImage?: string;
  customerEmail?: string;
  ownerName?: string;
  ownerEmail?: string;
  status?: string;
  isFeatured?: boolean;
};

type ReviewManagementClientProps = {
  user: User;
  mode: 'admin' | 'owner';
};

export function ReviewManagementClient({ user, mode }: ReviewManagementClientProps) {
  const isAdmin = mode === 'admin';
  const title = isAdmin ? 'Customer Reviews' : 'My Equipment Reviews';
  const endpoint = isAdmin ? '/admin/reviews' : '/owner/reviews';
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const filter = (['featured', 'hidden'].includes(searchParams.get('filter') || '') ? searchParams.get('filter') : 'all') as 'all' | 'featured' | 'hidden';
  const [reviews, setReviews] = useState<ManagedReview[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [counts, setCounts] = useState({ totalReviews: 0, featuredReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState('');
  const [busyReviewId, setBusyReviewId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ManagedReview | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    const query = new URLSearchParams({ page: String(page), limit: '10' });
    if (searchParams.get('search')) query.set('search', searchParams.get('search') || '');
    if (isAdmin && filter !== 'all') query.set('filter', filter);
    apiFetch<{ reviews: ManagedReview[]; pagination: PaginationInfo; counts?: { totalReviews: number; featuredReviews: number } }>(`${endpoint}?${query}`, {}, user.id)
      .then((result) => {
        if (active) {
          setReviews(result.reviews || []);
          setPagination(result.pagination);
          if (result.counts) setCounts(result.counts);
        }
      })
      .catch((error) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unable to load reviews';
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [endpoint, user.id, reload, page, filter, searchParams, isAdmin]);

  useEffect(() => setSearch(searchParams.get('search') || ''), [searchParams]);

  function updateQuery(values: { page?: number; filter?: 'all' | 'featured' | 'hidden'; search?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextPage = values.page ?? 1;
    if (nextPage <= 1) params.delete('page');
    else params.set('page', String(nextPage));
    if (values.filter !== undefined) {
      if (values.filter === 'all') params.delete('filter');
      else params.set('filter', values.filter);
    }
    if (values.search !== undefined) {
      if (values.search.trim()) params.set('search', values.search.trim());
      else params.delete('search');
    }
    router.push(`${pathname}${params.size ? `?${params.toString()}` : ''}`, { scroll: false });
  }

  async function toggleFeatured(review: ManagedReview) {
    if (!isAdmin || busyReviewId) return;
    setBusyReviewId(review._id);
    try {
      const isFeatured = !review.isFeatured;
      await apiFetch(
        `/admin/reviews/${review._id}/featured`,
        { method: 'PATCH', body: JSON.stringify({ isFeatured }) },
        user.id,
      );
      setReviews((current) => current.map((item) => item._id === review._id ? { ...item, isFeatured } : item));
      setCounts((current) => ({ ...current, featuredReviews: current.featuredReviews + (isFeatured ? 1 : -1) }));
      setReload((value) => value + 1);
      toast.success(isFeatured ? 'Review added to Homepage' : 'Review removed from Homepage');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update Homepage selection');
    } finally {
      setBusyReviewId('');
    }
  }

  async function deleteReview() {
    if (!deleteTarget || busyReviewId) return false;
    setBusyReviewId(deleteTarget._id);
    try {
      const path = isAdmin
        ? `/admin/reviews/${deleteTarget._id}`
        : `/owner/reviews/${deleteTarget._id}`;
      await apiFetch(path, { method: 'DELETE' }, user.id);
      setReviews((current) => current.filter((review) => review._id !== deleteTarget._id));
      setCounts((current) => ({ ...current, totalReviews: Math.max(0, current.totalReviews - 1), featuredReviews: Math.max(0, current.featuredReviews - (deleteTarget.isFeatured ? 1 : 0)) }));
      if (reviews.length === 1 && page > 1) updateQuery({ page: page - 1 });
      setReload((value) => value + 1);
      toast.success('Review deleted');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete review');
      return false;
    } finally {
      setBusyReviewId('');
    }
  }

  return (
    <div>
      <div className="mb-7">
        <p className="text-xs font-bold tracking-[.18em] text-[#6c91a7]">YOUR GEARLY SPACE</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Welcome back, {user.name || 'there'}.</p>
      </div>
      <main className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isAdmin ? `${counts.totalReviews} total · ${counts.featuredReviews} shown on Homepage` : `${pagination?.totalRecords || 0} reviews on your equipment`}
              </p>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); updateQuery({ search, page: 1 }); }} className="flex w-full gap-2 sm:max-w-sm">
              <label className="relative block min-w-0 flex-1">
              <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer or equipment"
                aria-label="Search customer or equipment reviews"
                className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#86a8b9]"
              />
              </label>
              <button type="submit" className="rounded-xl bg-[#263b49] px-3 text-xs font-bold text-white">Search</button>
            </form>
          </div>

          {isAdmin && (
            <div className="mt-5 flex flex-wrap gap-2" aria-label="Review filters">
              {([
                ['all', 'All Reviews'],
                ['featured', 'Homepage Reviews'],
                ['hidden', 'Hidden Reviews'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => updateQuery({ filter: value, page: 1 })}
                  className={`rounded-full px-4 py-2 text-xs font-bold ${filter === value ? 'bg-[#263b49] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500" role="status">Loading reviews…</div>
          ) : loadError ? (
            <div className="mt-5 rounded-2xl bg-rose-50 p-6 text-center text-sm text-rose-800" role="alert">
              <p>{loadError}</p>
              <button type="button" onClick={() => setReload((value) => value + 1)} className="mt-3 font-bold underline">Try again</button>
            </div>
          ) : reviews.length ? (
            <div className="mt-5 space-y-4">
              {reviews.map((review) => (
                <article key={review._id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <CustomerAvatar name={review.customerName || 'Customer'} image={review.customerImage} />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{review.customerName || 'Gearly customer'}</p>
                        {isAdmin && review.customerEmail && <p className="truncate text-xs text-slate-500">{review.customerEmail}</p>}
                        <p className="mt-1 text-xs text-slate-400">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Date unavailable'}</p>
                      </div>
                    </div>
                    <p className="inline-flex items-center gap-1 text-sm font-bold text-amber-600" aria-label={`${review.rating} out of 5 stars`}>
                      <Star size={15} fill="currentColor" aria-hidden="true" /> {review.rating}/5
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-t border-slate-100 pt-4">
                    <div className="min-w-0 flex-1">
                      <EquipmentName title={review.equipmentTitle} image={review.equipmentImage} />
                      {isAdmin && <p className="mt-2 text-xs text-slate-500">Owner: {review.ownerName || 'Equipment owner'}{review.ownerEmail ? ` · ${review.ownerEmail}` : ''}</p>}
                      {isAdmin && <p className="mt-1 break-all font-mono text-[10px] text-slate-400">Equipment ID: {review.equipmentId}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {isAdmin && (
                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={Boolean(review.isFeatured)}
                            disabled={Boolean(busyReviewId) || review.status !== 'approved'}
                            onChange={() => void toggleFeatured(review)}
                            className="h-4 w-4 accent-[#263b49]"
                          />
                          Show on Homepage
                        </label>
                      )}
                      <button
                        type="button"
                        disabled={Boolean(busyReviewId)}
                        onClick={() => setDeleteTarget(review)}
                        aria-label={`Delete review by ${review.customerName || 'customer'}`}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  {isAdmin && review.status !== 'approved' && (
                    <p className="mt-3 text-xs font-semibold capitalize text-amber-700">{review.status || 'Unapproved'} · only approved reviews can be shown on Homepage</p>
                  )}
                  <p className="mt-4 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-700">{review.comment}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <p className="font-semibold text-slate-700">{reviews.length ? 'No reviews match these filters.' : isAdmin ? 'No customer reviews yet.' : 'No reviews for your equipment yet.'}</p>
              <p className="mt-1 text-sm text-slate-500">{isAdmin && !reviews.length ? 'Customer reviews will appear here after completed rentals.' : 'Try a different search or filter.'}</p>
            </div>
          )}
          {!loading && pagination && <Pagination pagination={pagination} onPageChange={(nextPage) => updateQuery({ page: nextPage })} />}
      </main>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this review?"
        description="Are you sure you want to delete this review? This cannot be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteReview}
      />
    </div>
  );
}

function CustomerAvatar({ name, image }: { name: string; image?: string }) {
  const [failed, setFailed] = useState(false);
  if (image && !failed) {
    return (
      <Image
        src={image}
        alt=""
        width={44}
        height={44}
        unoptimized
        onError={() => setFailed(true)}
        className="h-11 w-11 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#edf4f7] font-bold text-blue-deep" aria-hidden="true">
      {name.slice(0, 1).toUpperCase() || 'C'}
    </span>
  );
}
