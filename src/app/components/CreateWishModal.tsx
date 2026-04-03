import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Feather, Sparkles, MessageCircleWarning } from 'lucide-react';
import { Wish, WishCategory } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CreateWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (wish: Omit<Wish, 'id' | 'createdAt' | 'likes' | 'bgVariant'>) => void;
}

export function CreateWishModal({ isOpen, onClose, onSubmit }: CreateWishModalProps) {
  const [category, setCategory] = useState<Exclude<WishCategory, 'all'>>('blessing');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSubmit({
      category,
      content: content.trim(),
      author: author.trim() || '无名氏',
    });

    setContent('');
    setAuthor('');
    onClose();
  };

  const categories: { id: Exclude<WishCategory, 'all'>; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'blessing', label: '祈福', icon: <Sparkles size={18} />, color: 'bg-red-50 text-red-600 border-red-200 hover:border-red-400' },
    { id: 'wish', label: '祝愿', icon: <Feather size={18} />, color: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400' },
    { id: 'vent', label: '吐槽', icon: <MessageCircleWarning size={18} />, color: 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-100 p-5 pb-4">
              <h2 className="text-xl font-semibold text-stone-800 font-serif">写下你的心声</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6 space-y-3">
                <label className="text-sm font-medium text-stone-600">选择类型</label>
                <div className="grid grid-cols-3 gap-3">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={twMerge(
                        'flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all duration-200',
                        c.color,
                        category === c.id ? 'ring-2 ring-current ring-offset-2' : 'border-dashed border-stone-300 bg-transparent text-stone-500 hover:bg-stone-50'
                      )}
                    >
                      {c.icon}
                      <span className="font-medium">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 space-y-3">
                <label className="text-sm font-medium text-stone-600">内容</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="写下你此刻的想法..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-4 text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-400/10 font-serif"
                  required
                />
              </div>

              <div className="mb-8 space-y-3">
                <label className="text-sm font-medium text-stone-600">署名（选填）</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="无名氏"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-400/10 font-serif"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-5 py-2.5 font-medium text-stone-500 hover:bg-stone-100"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="rounded-xl bg-amber-500 px-6 py-2.5 font-medium text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 disabled:opacity-50 disabled:shadow-none"
                >
                  挂上心愿牌
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
