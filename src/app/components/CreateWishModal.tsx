import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Feather, Sparkles, MessageCircleWarning } from 'lucide-react';
import { Wish, WishCategory } from '../types';
import { twMerge } from 'tailwind-merge';

interface CreateWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (wish: Omit<Wish, 'id' | 'createdAt' | 'likes' | 'bgVariant'>) => Promise<boolean>;
}

export function CreateWishModal({ isOpen, onClose, onSubmit }: CreateWishModalProps) {
  const [category, setCategory] = useState<Exclude<WishCategory, 'all'>>('blessing');
  const [content, setContent] = useState('');
  const [reason, setReason] = useState('');
  const [author, setAuthor] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (isSubmitting) return;

    setSubmitError(null);
    const finalContent = reason.trim() ? `${content.trim()}\n\n【发念缘由】${reason.trim()}` : content.trim();

    setIsSubmitting(true);
    const success = await onSubmit({
      category,
      content: finalContent,
      author: author.trim() || '匿名',
      isPublic,
    });
    setIsSubmitting(false);

    if (success) {
      setContent('');
      setReason('');
      setAuthor('');
      setIsPublic(true);
      onClose();
    } else {
      setSubmitError('提交失败，请重试');
    }
  };

  const categories = useMemo(() => [
    { id: 'blessing', label: '祈福', icon: <Sparkles size={18} />, color: 'bg-red-50 text-red-600 border-red-200 hover:border-red-400', placeholder: '向神、佛、祖先、上天等超自然力量祷告祈求，希望赐福、消灾、护佑' },
    { id: 'wish', label: '祝愿', icon: <Feather size={18} />, color: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400', placeholder: '对他人或事物表达良好的愿望与期盼' },
    { id: 'vent', label: '吐槽', icon: <MessageCircleWarning size={18} />, color: 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400', placeholder: '把不满、好笑、无语的地方说出来' },
  ] as const, []);

  const getPlaceholder = useMemo(() => {
    const cat = categories.find(c => c.id === category);
    return cat?.placeholder ?? '';
  }, [categories, category]);

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
                <label className="text-sm font-medium text-stone-600">
                  心声内容 <span className="text-stone-400 font-normal">(最多 50 字)</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 50))}
                  placeholder={getPlaceholder}
                  rows={3}
                  maxLength={50}
                  className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-4 text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-400/10 font-serif"
                  required
                />
                <div className="text-right text-xs text-stone-400">{content.length}/50</div>
              </div>

              <div className="mb-6 space-y-3">
                <label className="text-sm font-medium text-stone-600">
                  发念缘由 <span className="text-stone-400 font-normal">(选填，最多 800 字)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 800))}
                  placeholder="分享你写下这个心愿的故事或原因..."
                  rows={5}
                  maxLength={800}
                  className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-4 text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-400/10 font-serif"
                />
                <div className="text-right text-xs text-stone-400">{reason.length}/800</div>
              </div>

              <div className="mb-8 space-y-3">
                <label className="text-sm font-medium text-stone-600">署名（选填）</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="匿名"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-400/10 font-serif"
                />
              </div>

              <div className="mb-8 flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-stone-600">是否公开</label>
                  <p className="text-xs text-stone-400 mt-0.5">不公开将在牌子上显示"保密"</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={twMerge(
                    'relative h-6 w-11 rounded-full transition-colors duration-200',
                    isPublic ? 'bg-amber-500' : 'bg-stone-300'
                  )}
                >
                  <span
                    className={twMerge(
                      'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                      isPublic ? 'left-6' : 'left-1'
                    )}
                  />
                </button>
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
                  disabled={!content.trim() || isSubmitting}
                  className="rounded-xl bg-amber-500 px-6 py-2.5 font-medium text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 disabled:opacity-50 disabled:shadow-none"
                >
                  {isSubmitting ? '提交中...' : '去祈愿'}
                </button>
              </div>

              {submitError && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
                  {submitError}
                </div>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
