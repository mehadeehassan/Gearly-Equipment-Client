'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, CreditCard, Eye, Image as ImageIcon, Pencil, Trash2, X, type LucideIcon } from 'lucide-react';
import type { Booking, Equipment, User } from '@/types';

type BookingRow = Booking & { equipmentImage?: string };
type FavoriteRow = { _id: string; equipment?: Equipment };
type Action = (path: string, method?: string, body?: unknown) => Promise<void>;

function EquipmentName({ title, image, href }: { title?: string; image?: string; href?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const content = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
        {image && !imageFailed ? (
          <img src={image} alt="" loading="lazy" onError={() => setImageFailed(true)} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon size={18} aria-hidden="true" />
        )}
      </span>
      <span className="max-w-[220px] truncate font-semibold" title={title || 'Equipment'}>{title || 'Equipment'}</span>
    </>
  );

  return href ? (
    <Link href={href} className="flex min-w-0 items-center gap-3 text-slate-800 hover:text-[#31566b]">
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
  const color = tone === 'positive'
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
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-[#f4f6f5] text-xs uppercase tracking-wider text-slate-500">
          <tr>{headers.map((header) => <th key={header} className="px-5 py-4">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function BookingTable({ rows, admin, owner, onPay, payingId }: { rows: BookingRow[]; admin: boolean; owner: boolean; onPay?: (bookingId: string) => void; payingId?: string }) {
  const headers = admin
    ? ['Customer', 'Owner', 'Equipment', 'Duration', 'Amount', 'Payment', 'Booking']
    : owner
      ? ['Customer', 'Equipment', 'Duration', 'Quantity', 'Amount', 'Payment', 'Booking']
    : ['Equipment', 'Start date', 'End date', 'Booked on', 'Amount', 'Payment', 'Booking', 'Actions'];

  return (
    <DataTable headers={headers}>
      {rows.map((booking) => (
        <tr key={booking._id}>
          {(admin || owner) && (
            <td className="px-5 py-4">
              <span className="block font-semibold">{booking.customerName || 'Customer'}</span>
              {admin && <span className="text-xs text-slate-400">{booking.customerEmail || ''}</span>}
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
              <td className="px-5 py-4">{new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}</td>
              <td className="px-5 py-4">{booking.quantity}</td>
            </>
          ) : admin ? (
            <td className="px-5 py-4">{new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}</td>
          ) : (
            <>
              <td className="px-5 py-4">{new Date(booking.startDate).toLocaleDateString()}</td>
              <td className="px-5 py-4">{new Date(booking.endDate).toLocaleDateString()}</td>
              <td className="px-5 py-4">{new Date(booking.bookingDate).toLocaleDateString()}</td>
            </>
          )}
          <td className="px-5 py-4">৳{Number(booking.totalAmount).toLocaleString()}</td>
          <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${booking.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentStatus === 'failed' ? 'Failed' : booking.paymentStatus === 'cancelled' ? 'Cancelled' : 'Unpaid'}</span>{booking.transactionId && <span className="mt-1 block max-w-40 truncate font-mono text-[10px] text-slate-400" title={booking.transactionId}>TX: {booking.transactionId}</span>}</td>
          <td className="px-5 py-4">{booking.bookingStatus}</td>
          {!admin && !owner && <td className="px-5 py-4">{booking.paymentStatus !== 'paid' && onPay ? <IconButton icon={CreditCard} label={`Pay for booking ${booking._id}`} tone="positive" disabled={payingId === booking._id} onClick={() => onPay(booking._id)} /> : booking.transactionId ? <span title="Verified Stripe transaction" className="text-xs text-emerald-700">Verified</span> : '—'}</td>}
        </tr>
      ))}
    </DataTable>
  );
}

export function FavoritesPanel({ data, onRemove, busy }: { data: FavoriteRow[]; onRemove: (id: string) => void; busy: boolean }) {
  if (!data.length) return <p className="rounded-2xl bg-white p-8 text-center text-slate-500">No favorites saved yet. Save equipment you would like to rent.</p>;

  return (
    <DataTable headers={['Equipment', 'Category', 'Rental price', 'Actions']}>
      {data.map((row) => {
        const equipment = row.equipment;
        return (
          <tr key={row._id}>
            <td className="px-5 py-4"><EquipmentName title={equipment?.title} image={equipment?.image} /></td>
            <td className="px-5 py-4">{equipment?.category || '—'}</td>
            <td className="px-5 py-4">৳{Number(equipment?.price || 0).toLocaleString()} / {equipment?.rentalType || '—'}</td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-1">
                {equipment?._id && (
                  <Link href={`/equipment/${equipment._id}`} title={`View ${equipment.title}`} aria-label={`View ${equipment.title}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100">
                    <Eye size={17} aria-hidden="true" />
                  </Link>
                )}
                {equipment?._id && <IconButton icon={Trash2} label={`Remove ${equipment.title} from favorites`} tone="danger" disabled={busy} onClick={() => onRemove(equipment._id)} />}
              </div>
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}

export function EquipmentTable({ rows, admin, onAction, busy }: { rows: Equipment[]; admin: boolean; onAction: Action; busy: boolean }) {
  function edit(item: Equipment) {
    const title = window.prompt('Equipment title', item.title);
    if (title === null) return;
    const price = window.prompt('Rental price', String(item.price));
    if (price === null) return;
    void onAction(`${admin ? '/admin' : '/owner'}/equipment/${item._id}`, 'PATCH', { title, price: Number(price) });
  }

  return (
    <DataTable headers={['Equipment', 'Category', 'Price', 'Quantity', 'Status', 'Actions']}>
      {rows.map((item) => (
        <tr key={item._id}>
          <td className="px-5 py-4"><EquipmentName title={item.title} image={item.image} /></td>
          <td className="px-5 py-4">{item.category}</td>
          <td className="px-5 py-4">৳{item.price}/{item.rentalType}</td>
          <td className="px-5 py-4">{item.availableQuantity}</td>
          <td className="px-5 py-4">{item.status || '—'}</td>
          <td className="px-5 py-4">
            <div className="flex items-center gap-1">
              {admin && item.status !== 'approved' && (
                <IconButton icon={Check} label={`Approve ${item.title}`} tone="positive" disabled={busy} onClick={() => void onAction(`/admin/equipment/${item._id}/status`, 'PATCH', { status: 'approved' })} />
              )}
              {admin && item.status === 'pending' && (
                <IconButton icon={X} label={`Reject ${item.title}`} tone="danger" disabled={busy} onClick={() => {
                  if (window.confirm(`Reject “${item.title}”?`)) void onAction(`/admin/equipment/${item._id}/status`, 'PATCH', { status: 'rejected' });
                }} />
              )}
              {!admin && item.status === 'approved' && (
                <Link href={`/equipment/${item._id}`} title={`View ${item.title}`} aria-label={`View ${item.title}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100">
                  <Eye size={17} aria-hidden="true" />
                </Link>
              )}
              <IconButton icon={Pencil} label={`Edit ${item.title}`} disabled={busy} onClick={() => edit(item)} />
              <IconButton icon={Trash2} label={`Delete ${item.title}`} tone="danger" disabled={busy} onClick={() => {
                if (window.confirm(`Delete “${item.title}”? This action cannot be undone.`)) {
                  void onAction(`${admin ? '/admin' : '/owner'}/equipment/${item._id}`, 'DELETE');
                }
              }} />
            </div>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}

export function UsersTable({ rows, currentUserId, onAction, busy }: { rows: User[]; currentUserId: string; onAction: Action; busy: boolean }) {
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
              <select aria-label={`Change role for ${user.name}`} title={`Change role for ${user.name}`} value={role} onChange={(event) => setRoles((current) => ({ ...current, [id]: event.target.value }))} className="rounded-lg border border-slate-200 p-2" disabled={busy}>
                <option value="customer" disabled={isCurrentUser}>Customer</option>
                <option value="owner" disabled={isCurrentUser}>Owner</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td className="px-5 py-4">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
            <td className="px-5 py-4">
              <IconButton icon={Check} label={`Save role for ${user.name}`} tone="positive" disabled={busy || role === (user.role || 'customer') || (isCurrentUser && role !== 'admin')} onClick={() => void onAction(`/admin/users/${id}/role`, 'PATCH', { role })} />
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}
