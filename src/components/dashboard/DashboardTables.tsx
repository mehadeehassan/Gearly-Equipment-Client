'use client';

import type { Booking, Equipment, User } from '@/types';
import {
  Check,
  CreditCard,
  Eye,
  Image as ImageIcon,
  Pencil,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { StatusBadge } from '../shared/StatusBadge';
import { ImageUpload } from '../shared/ImageUpload';

type BookingRow = Booking & { equipmentImage?: string };
type FavoriteRow = { _id: string; equipment?: Equipment };
type Action = (path: string, method?: string, body?: unknown) => Promise<boolean>;

export function EquipmentName({
  title,
  image,
  href,
}: {
  title?: string;
  image?: string;
  href?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const content = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
        {image && !imageFailed ? (
          <Image
            src={image}
            alt=""
            width={40}
            height={40}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon size={18} aria-hidden="true" />
        )}
      </span>
      <span className="max-w-55 truncate font-semibold" title={title || 'Equipment'}>
        {title || 'Equipment'}
      </span>
    </>
  );

  return href ? (
    <Link
      href={href}
      className="flex min-w-0 items-center gap-3 text-slate-800 hover:text-blue-deep"
    >
      {content}
    </Link>
  ) : (
    <div className="flex min-w-0 items-center gap-3">{content}</div>
  );
}

function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  tone = 'neutral',
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'neutral' | 'positive' | 'danger';
}) {
  const color =
    tone === 'positive'
      ? 'text-emerald-700 hover:bg-emerald-50'
      : tone === 'danger'
        ? 'text-rose-600 hover:bg-rose-50'
        : 'text-slate-600 hover:bg-slate-100';

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${color}`}
    >
      <Icon size={17} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
      <table className="w-full min-w-175 text-left text-sm">
        <thead className="bg-[#f4f6f5] text-xs uppercase tracking-wider text-slate-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-5 py-4">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function BookingTable({
  rows,
  admin,
  owner,
  onPay,
  payingId,
}: {
  rows: BookingRow[];
  admin: boolean;
  owner: boolean;
  onPay?: (bookingId: string) => void;
  payingId?: string;
}) {
  const headers = admin
    ? ['Customer', 'Owner', 'Equipment', 'Duration', 'Amount', 'Payment', 'Booking']
    : owner
      ? ['Customer', 'Equipment', 'Duration', 'Quantity', 'Amount', 'Payment', 'Booking']
      : [
          'Equipment',
          'Start date',
          'End date',
          'Booked on',
          'Amount',
          'Payment',
          'Booking',
          'Actions',
        ];

  return (
    <DataTable headers={headers}>
      {rows.map((booking) => (
        <tr key={booking._id}>
          {(admin || owner) && (
            <td className="px-5 py-4">
              <span className="block font-semibold">{booking.customerName || 'Customer'}</span>
              {admin && (
                <span className="text-xs text-slate-400">{booking.customerEmail || ''}</span>
              )}
            </td>
          )}
          {admin && (
            <td className="px-5 py-4">
              <span className="block font-semibold">{booking.ownerName || 'Owner'}</span>
              <span className="text-xs text-slate-400">{booking.ownerEmail || ''}</span>
            </td>
          )}
          <td className="px-5 py-4">
            <EquipmentName title={booking.equipmentTitle} image={booking.equipmentImage} />
          </td>
          {owner ? (
            <>
              <td className="px-5 py-4">
                {new Date(booking.startDate).toLocaleDateString()} –{' '}
                {new Date(booking.endDate).toLocaleDateString()}
              </td>
              <td className="px-5 py-4">{booking.quantity}</td>
            </>
          ) : admin ? (
            <td className="px-5 py-4">
              {new Date(booking.startDate).toLocaleDateString()} –{' '}
              {new Date(booking.endDate).toLocaleDateString()}
            </td>
          ) : (
            <>
              <td className="px-5 py-4">{new Date(booking.startDate).toLocaleDateString()}</td>
              <td className="px-5 py-4">{new Date(booking.endDate).toLocaleDateString()}</td>
              <td className="px-5 py-4">{new Date(booking.bookingDate).toLocaleDateString()}</td>
            </>
          )}
          <td className="px-5 py-4">৳{Number(booking.totalAmount).toLocaleString()}</td>
          <td className="px-5 py-4">
            <StatusBadge status={booking.paymentStatus} />
            {booking.transactionId && (
              <span
                className="mt-1 block max-w-40 truncate font-mono text-[10px] text-slate-400"
                title={booking.transactionId}
              >
                TX: {booking.transactionId}
              </span>
            )}
          </td>
          <td className="px-5 py-4">
            <StatusBadge status={booking.bookingStatus} />
          </td>
          {!admin && !owner && (
            <td className="px-5 py-4">
              {onPay &&
              ['pending', 'failed', 'cancelled'].includes(booking.paymentStatus) &&
              ['pending', 'pending_payment', 'payment_failed'].includes(booking.bookingStatus) ? (
                <button
                  type="button"
                  disabled={payingId === booking._id}
                  onClick={() => onPay(booking._id)}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#e8f3ee] px-3 py-2 text-xs font-bold text-emerald-800 disabled:opacity-50"
                >
                  <CreditCard size={15} />
                  {payingId === booking._id
                    ? 'Opening checkout…'
                    : booking.paymentStatus === 'pending'
                      ? 'Continue payment'
                      : 'Retry payment'}
                </button>
              ) : booking.transactionId ? (
                <span title="Verified Stripe transaction" className="text-xs text-emerald-700">
                  Verified
                </span>
              ) : (
                '—'
              )}
            </td>
          )}
        </tr>
      ))}
    </DataTable>
  );
}

export function FavoritesPanel({
  data,
  onRemove,
  busy,
}: {
  data: FavoriteRow[];
  onRemove: (id: string) => Promise<boolean>;
  busy: boolean;
}) {
  const [removeTarget, setRemoveTarget] = useState<Equipment | null>(null);
  if (!data.length)
    return (
      <p className="rounded-2xl bg-white p-8 text-center text-slate-500">
        No favorites saved yet. Save equipment you would like to rent.
      </p>
    );

  return (
    <>
      <DataTable headers={['Equipment', 'Category', 'Rental price', 'Actions']}>
        {data.map((row) => {
          const equipment = row.equipment;
          return (
            <tr key={row._id}>
              <td className="px-5 py-4">
                <EquipmentName title={equipment?.title} image={equipment?.image} />
              </td>
              <td className="px-5 py-4">{equipment?.category || '—'}</td>
              <td className="px-5 py-4">
                ৳{Number(equipment?.price || 0).toLocaleString()} / {equipment?.rentalType || '—'}
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-1">
                  {equipment?._id && (
                    <Link
                      href={`/equipment/${equipment._id}`}
                      title={`View ${equipment.title}`}
                      aria-label={`View ${equipment.title}`}
                      className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                    >
                      <Eye size={17} aria-hidden="true" />
                    </Link>
                  )}
                  {equipment?._id && (
                    <IconButton
                      icon={Trash2}
                      label={`Remove ${equipment.title} from favorites`}
                      tone="danger"
                      disabled={busy}
                      onClick={() => setRemoveTarget(equipment)}
                    />
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove saved equipment?"
        description={`Remove “${removeTarget?.title || 'this item'}” from your favorites?`}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={async () => {
          if (!removeTarget) return false;
          return onRemove(removeTarget._id);
        }}
      />
    </>
  );
}

export function EquipmentTable({
  rows,
  admin,
  onAction,
  busy,
}: {
  rows: Equipment[];
  admin: boolean;
  onAction: Action;
  busy: boolean;
}) {
  const [confirmTarget, setConfirmTarget] = useState<{
    item: Equipment;
    kind: 'delete' | 'reject';
  } | null>(null);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingItem) return;
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    const saved = await onAction(`/admin/equipment/${editingItem._id}`, 'PATCH', {
      ...values,
      price: Number(values.price),
      availableQuantity: Number(values.availableQuantity),
      image: editingItem.image,
    });
    if (saved) setEditingItem(null);
  }

  return (
    <>
      <DataTable
        headers={
          admin
            ? ['Equipment', 'Owner', 'Category', 'Price', 'Quantity', 'Status', 'Actions']
            : ['Equipment', 'Category', 'Price', 'Quantity', 'Status', 'Actions']
        }
      >
        {rows.map((item) => (
          <tr key={item._id}>
            <td className="px-5 py-4">
              <EquipmentName title={item.title} image={item.image} />
            </td>
            {admin && <td className="px-5 py-4">{item.ownerName || 'Unknown Owner'}</td>}
            <td className="px-5 py-4">{item.category}</td>
            <td className="px-5 py-4">
              ৳{item.price}/{item.rentalType}
            </td>
            <td className="px-5 py-4">{item.availableQuantity}</td>
            <td className="px-5 py-4">
              <StatusBadge status={item.status} />
            </td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-1">
                {admin && item.status !== 'approved' && (
                  <IconButton
                    icon={Check}
                    label={`Approve ${item.title}`}
                    tone="positive"
                    disabled={busy}
                    onClick={() =>
                      void onAction(`/admin/equipment/${item._id}/status`, 'PATCH', {
                        status: 'approved',
                      })
                    }
                  />
                )}
                {admin && item.status === 'pending' && (
                  <IconButton
                    icon={X}
                    label={`Reject ${item.title}`}
                    tone="danger"
                    disabled={busy}
                    onClick={() => setConfirmTarget({ item, kind: 'reject' })}
                  />
                )}
                {!admin && item.status === 'approved' && (
                  <Link
                    href={`/equipment/${item._id}`}
                    title={`View ${item.title}`}
                    aria-label={`View ${item.title}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                  >
                    <Eye size={17} aria-hidden="true" />
                  </Link>
                )}
                {!admin ? (
                  <Link
                    href={`/dashboard/my-equipment/${item._id}/edit`}
                    title={`Edit ${item.title}`}
                    aria-label={`Edit ${item.title}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                  >
                    <Pencil size={17} />
                  </Link>
                ) : (
                  <IconButton
                    icon={Pencil}
                    label={`Edit ${item.title}`}
                    disabled={busy}
                    onClick={() => setEditingItem(item)}
                  />
                )}
                <IconButton
                  icon={Trash2}
                  label={`Delete ${item.title}`}
                  tone="danger"
                  disabled={busy}
                  onClick={() => setConfirmTarget({ item, kind: 'delete' })}
                />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={confirmTarget?.kind === 'reject' ? 'Reject equipment listing?' : 'Delete equipment?'}
        description={
          confirmTarget?.kind === 'reject'
            ? `Reject “${confirmTarget?.item.title}”? It will no longer be available for booking.`
            : `Delete “${confirmTarget?.item.title}”? This action cannot be undone.`
        }
        confirmLabel={confirmTarget?.kind === 'reject' ? 'Reject listing' : 'Confirm Delete'}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={async () => {
          if (!confirmTarget) return false;
          const { item, kind } = confirmTarget;
          return onAction(
            kind === 'reject'
              ? `/admin/equipment/${item._id}/status`
              : `${admin ? '/admin' : '/owner'}/equipment/${item._id}`,
            kind === 'reject' ? 'PATCH' : 'DELETE',
            kind === 'reject' ? { status: 'rejected' } : undefined,
          );
        }}
      />
      {admin && editingItem && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/55 p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setEditingItem(null);
          }}
        >
          <form
            onSubmit={saveEdit}
            className="my-auto grid w-full max-w-3xl gap-4 rounded-3xl bg-white p-5 shadow-xl sm:grid-cols-2 sm:p-7"
            aria-label="Update equipment"
          >
            <div className="flex items-start justify-between sm:col-span-2">
              <div>
                <p className="text-xs font-bold tracking-[.16em] text-[#6c91a7]">ADMIN</p>
                <h2 className="mt-1 text-2xl font-black">Update equipment</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setEditingItem(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <label className="text-sm font-semibold">
              Equipment title
              <input required name="title" defaultValue={editingItem.title} maxLength={120} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal" />
            </label>
            <label className="text-sm font-semibold">
              Category
              <select required name="category" defaultValue={editingItem.category} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal">
                {['Construction Equipment', 'Photography Equipment', 'Vehicles & Transportation', 'Agriculture Equipment', 'Electronics', 'Event Equipment'].map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Price
              <input required name="price" type="number" min="0.01" step="0.01" defaultValue={editingItem.price} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal" />
            </label>
            <label className="text-sm font-semibold">
              Rental type
              <select required name="rentalType" defaultValue={editingItem.rentalType} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal">
                {['Daily', 'Weekly', 'Monthly'].map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Location
              <input required name="location" defaultValue={editingItem.location} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal" />
            </label>
            <label className="text-sm font-semibold">
              Available quantity
              <input required name="availableQuantity" type="number" min="0" step="1" defaultValue={editingItem.availableQuantity} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal" />
            </label>
            <label className="text-sm font-semibold">
              Brand
              <input name="brand" defaultValue={editingItem.brand || ''} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal" />
            </label>
            <label className="text-sm font-semibold">
              Model
              <input name="model" defaultValue={editingItem.model || ''} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal" />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Condition
              <input name="condition" defaultValue={editingItem.condition || ''} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal" />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Description
              <textarea required name="description" defaultValue={editingItem.description} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Rental terms
              <textarea name="terms" defaultValue={editingItem.terms || ''} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" />
            </label>
            <div className="sm:col-span-2">
              <ImageUpload value={editingItem.image || ''} onChange={(image) => setEditingItem({ ...editingItem, image })} />
            </div>
            <div className="flex justify-end gap-3 sm:col-span-2">
              <button type="button" onClick={() => setEditingItem(null)} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700">Cancel</button>
              <button disabled={busy} className="rounded-xl bg-[#263b49] px-6 py-3 font-bold text-white disabled:opacity-50">Save changes</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export function UsersTable({
  rows,
  currentUserId,
  onAction,
  busy,
}: {
  rows: User[];
  currentUserId: string;
  onAction: Action;
  busy: boolean;
}) {
  const [roles, setRoles] = useState<Record<string, string>>({});

  return (
    <DataTable headers={['User', 'Email', 'Role', 'Registration date', 'Actions']}>
      {rows.map((user) => {
        const id = user.id || user._id || '';
        const role = roles[id] ?? user.role ?? 'customer';
        const isCurrentUser = id === currentUserId;
        return (
          <tr key={id}>
            <td className="px-5 py-4 font-semibold">{user.name}</td>
            <td className="px-5 py-4">{user.email}</td>
            <td className="px-5 py-4">
              <select
                aria-label={`Change role for ${user.name}`}
                title={`Change role for ${user.name}`}
                value={role}
                onChange={(event) =>
                  setRoles((current) => ({ ...current, [id]: event.target.value }))
                }
                className="rounded-lg border border-slate-200 p-2"
                disabled={busy}
              >
                <option value="customer" disabled={isCurrentUser}>
                  Customer
                </option>
                <option value="owner" disabled={isCurrentUser}>
                  Owner
                </option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td className="px-5 py-4">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
            </td>
            <td className="px-5 py-4">
              <IconButton
                icon={Check}
                label={`Save role for ${user.name}`}
                tone="positive"
                disabled={
                  busy || role === (user.role || 'customer') || (isCurrentUser && role !== 'admin')
                }
                onClick={() => void onAction(`/admin/users/${id}/role`, 'PATCH', { role })}
              />
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}
