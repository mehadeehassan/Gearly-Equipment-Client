import Link from 'next/link';
export default function PaymentCancel() {
  return (
    <div className="grid min-h-[65vh] place-items-center px-5 py-16">
      <div className="max-w-lg rounded-4xl border border-slate-200 bg-white p-10 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-50 text-3xl">
          ↩
        </span>
        <h1 className="mt-6 text-3xl font-black">Checkout was cancelled.</h1>
        <p className="mt-3 leading-7 text-slate-500">
          No payment was completed. You can return to your rentals and try checkout again.
        </p>
        <Link
          href="/dashboard/my-rentals"
          className="mt-7 inline-block rounded-xl bg-[#263b49] px-6 py-3 font-bold text-white"
        >
          Back to my rentals
        </Link>
      </div>
    </div>
  );
}
