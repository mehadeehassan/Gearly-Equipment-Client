'use client';

import { motion } from 'framer-motion';

export function EquipmentImageReveal({ image, title }: { image?: string; title: string }) {
  return (
    <motion.div
      className="overflow-hidden rounded-4xl bg-[#e8eff1] shadow-sm"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden sm:aspect-5/4 lg:aspect-4/5">
        {image ? (
          <motion.img
            src={image}
            alt={title}
            initial={{ scale: 1.035 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div
            className="grid h-full place-items-center text-5xl text-[#6c91a7]"
            aria-label="No equipment image"
          >
            ✳
          </div>
        )}
      </div>
    </motion.div>
  );
}
