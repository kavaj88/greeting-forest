import React, { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Wish, WishCategory } from '../types';

interface WishCardProps {
  wish: Wish;
  onLike: (id: string) => void;
}

const categoryConfig: Record<Exclude<WishCategory, 'all'>, { label: string; badgeClasses: string }> = {
  blessing: { label: '祈福', badgeClasses: 'bg-red-100 text-red-700' },
  wish: { label: '祝愿', badgeClasses: 'bg-amber-100 text-amber-700' },
  vent: { label: '吐槽', badgeClasses: 'bg-slate-100 text-slate-700' },
};

const bgVariants = [
  'bg-white', // 0
  'bg-[#fffaf0]', // 1 - light amber
  'bg-[#fff5f5]', // 2 - light red
  'bg-[#f8fafc]', // 3 - light slate
];

export function WishCard({ wish, onLike }: WishCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    if (!isLiked) {
      setIsLiked(true);
      onLike(wish.id);
    }
  };

  const config = categoryConfig[wish.category];
  const bgClass = bgVariants[wish.bgVariant % bgVariants.length];
  const dateStr = new Date(wish.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={twMerge(
        'relative flex flex-col overflow-hidden rounded-xl border border-stone-200/60 p-2 pl-[15px] shadow-sm transition-shadow hover:shadow-md aspect-[4/3] sm:aspect-[5/4]',
        bgClass
      )}
    >
      <div className="absolute top-0 right-0 h-24 w-24 -translate-y-12 translate-x-12 rounded-full bg-black/5 opacity-50 mix-blend-multiply blur-2xl"></div>

      <div className="mb-2.5 flex items-center justify-between z-10">
        <span className={twMerge('rounded-full px-2 py-0.5 text-xs font-medium', config.badgeClasses)}>
          {config.label}
        </span>
        <button
          onClick={handleLike}
          className={twMerge(
            'flex items-center gap-1.5 rounded-full px-2 py-1 text-sm transition-colors',
            isLiked ? 'text-rose-500' : 'text-stone-400 hover:bg-stone-100 hover:text-rose-400'
          )}
        >
          <motion.div whileTap={{ scale: 0.8 }} animate={isLiked ? { scale: [1, 1.2, 1] } : {}}>
            <Heart size={14} className={clsx(isLiked && 'fill-current')} />
          </motion.div>
          <span>{wish.likes}</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center overflow-hidden z-10 py-1.5">
        <p className="w-full text-left whitespace-pre-wrap text-[14px] leading-relaxed text-stone-700 font-serif"
           style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
          {wish.content}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-stone-200/50 pt-2.5 z-10">
        <span className="text-sm font-medium text-stone-600 truncate max-w-[60%]">— {wish.author}</span>
        <span className="text-xs text-stone-400 shrink-0">{dateStr}</span>
      </div>
    </motion.div>
  );
}
