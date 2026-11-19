import { ReviewCarousel } from '@/components/home/ReviewCarousel';
import { publicFetch } from '@/lib/api';
import type { Review } from '@/types';

export async function ReviewsSection() {
  let reviews: Review[] = [];
  try {
    const data = await publicFetch<{ reviews: Review[] }>('/reviews', { noStore: true });
    reviews = data.reviews || [];
  } catch {}

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-bold tracking-[.18em] text-[#6c91a7]">GOOD WORDS, GOOD WORK</p>
        <h2 className="mt-3 text-4xl font-black">
          Customer <span className="font-serif font-normal italic text-[#6c91a7]">reviews.</span>
        </h2>
      </div>
      <ReviewCarousel reviews={reviews} />
    </section>
  );
}
