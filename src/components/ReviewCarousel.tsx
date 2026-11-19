'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Review } from '@/types';

export function ReviewCarousel({ reviews }: { reviews: Review[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reviews.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % reviews.length), 5000);
    return () => window.clearInterval(timer);
  }, [reviews.length]);

  if (!reviews.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Customer reviews will appear here after renters share their experience.
      </div>
    );
  }

  const review = reviews[active];
  const move = (direction: number) => setActive((current) => (current + direction + reviews.length) % reviews.length);

  return (
    <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
      <div className="relative min-h-[280px] p-8 sm:p-12">
        <AnimatePresence mode="wait">
          <motion.article
            key={review._id}
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -36 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="text-xl tracking-[.2em] text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
              {'★'.repeat(Math.max(1, Math.min(5, review.rating || 5)))}
            </p>
            <p className="my-6 text-xl leading-9 text-slate-600 sm:text-2xl">“{review.comment}”</p>
            <p className="font-bold text-slate-900">{review.customerName || 'Gearly customer'}</p>
            <p className="mt-1 text-xs text-slate-400">{review.demoOnly ? 'Demo review' : 'Verified rental review'}</p>
          </motion.article>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-center gap-5 border-t border-slate-100 px-6 py-5">
        <button type="button" onClick={() => move(-1)} aria-label="Previous review" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-lg transition hover:bg-slate-50">‹</button>
        <div className="flex gap-2" aria-label={`Review ${active + 1} of ${reviews.length}`}>
          {reviews.map((item, index) => (
            <button key={item._id} type="button" onClick={() => setActive(index)} aria-label={`Show review ${index + 1}`} aria-current={index === active} className={`h-2 rounded-full transition-all ${index === active ? 'w-6 bg-[#6c91a7]' : 'w-2 bg-slate-300'}`} />
          ))}
        </div>
        <button type="button" onClick={() => move(1)} aria-label="Next review" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-lg transition hover:bg-slate-50">›</button>
      </div>
    </div>
  );
}
