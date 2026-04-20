import React, { useState, memo } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Wish, WishCategory } from '../types';

interface WishCardProps {
  wish: Wish;
  onLike: (id: string) => void;
}

const categoryConfig: Record<Exclude<WishCategory, 'all'>, { label: string; badgeClasses: string; borderClass: string; glowColor: string }> = {
  blessing: { label: '祈福', badgeClasses: 'bg-red-100 text-red-700', borderClass: 'border-red-300/60', glowColor: 'rgba(248, 113, 113, 0.5)' },
  wish: { label: '祝愿', badgeClasses: 'bg-amber-100 text-amber-700', borderClass: 'border-amber-300/60', glowColor: 'rgba(251, 191, 36, 0.5)' },
  vent: { label: '吐槽', badgeClasses: 'bg-slate-100 text-slate-700', borderClass: 'border-slate-300/60', glowColor: 'rgba(148, 163, 184, 0.5)' },
};

const bgVariants = [
  'bg-white/30', // 0
  'bg-[#fffaf0]/30', // 1 - light amber
  'bg-[#fff5f5]/30', // 2 - light red
  'bg-[#f8fafc]/30', // 3 - light slate
];

export const WishCard = memo(({ wish, onLike }: WishCardProps) => {
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

  // 只显示心声内容，过滤掉发念缘由
  const displayContent = wish.isPublic ? wish.content.split('\n\n【发念缘由】')[0] : '保密 · Private';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={twMerge(
        `relative flex flex-col overflow-hidden rounded-lg border ${config.borderClass} p-1.5 pl-[12px] shadow-sm transition-shadow hover:shadow-md aspect-[2/1]`,
        bgClass
      )}
      style={{
        boxShadow: `0 0 20px -5px ${config.glowColor}, inset 0 0 20px -15px ${config.glowColor}`,
      }}
    >
      {/* Glow effect */}
      <div
        className="pointer-events-none absolute inset-0 rounded-lg opacity-60"
        style={{
          background: `radial-gradient(ellipse at top right, ${config.glowColor} 0%, transparent 70%)`,
          animation: 'glow-pulse 3s ease-in-out infinite',
        }}
      ></div>
      <style>{`
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
      <div className="mb-1.5 flex items-center justify-between z-10">
        <span className={twMerge('rounded-full px-2 py-0.5 text-[10px] font-medium', config.badgeClasses)}>
          {config.label}
        </span>
        <button
          onClick={handleLike}
          className={twMerge(
            'flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs transition-colors',
            isLiked ? 'text-rose-500' : 'text-stone-400 hover:bg-stone-100 hover:text-rose-400'
          )}
        >
          <motion.div whileTap={{ scale: 0.8 }} animate={isLiked ? { scale: [1, 1.2, 1] } : {}}>
            <Heart size={10} className={clsx(isLiked && 'fill-current')} />
          </motion.div>
          <span className="text-xs">{wish.likes}</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center overflow-hidden z-10 py-0.5">
        <p className="w-full text-left whitespace-pre-wrap text-[12px] leading-relaxed text-stone-700 font-serif"
           style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
          {displayContent}
        </p>
      </div>

      <div className="mt-1.5 flex items-center justify-between border-t border-stone-200/50 pt-1.5 z-10">
        <span className="text-xs font-medium text-stone-600 truncate max-w-[60%]">— {wish.author || '匿名'}</span>
        <span className="text-[10px] text-stone-400 shrink-0">{dateStr}</span>
      </div>
    </motion.div>
  );
});
