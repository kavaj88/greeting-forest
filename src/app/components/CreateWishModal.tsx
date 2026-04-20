import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Feather, Sparkles, MessageCircleWarning, User } from 'lucide-react';
import { Wish, WishCategory } from '../types';
import { twMerge } from 'tailwind-merge';

interface UserSession {
  email: string;
  loggedAt: string;
  expiresAt: string;
}

interface CreateWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (wish: Omit<Wish, 'id' | 'createdAt' | 'likes' | 'bgVariant'>) => Promise<boolean>;
  user: UserSession | null;
}

export function CreateWishModal({ isOpen, onClose, onSubmit, user }: CreateWishModalProps) {
  const [category, setCategory] = useState<Exclude<WishCategory, 'all'>>('blessing');
  const [content, setContent] = useState('');
  const [reason, setReason] = useState('');
  const [author, setAuthor] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 初始化署名为用户邮箱
  useMemo(() => {
    if (user && !author) {
      const emailPrefix = user.email.split('@')[0] || '';
      if (emailPrefix) {
        setAuthor(emailPrefix);
      }
    }
  }, [user]);

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
    { id: 'blessing', label: '祈福', labelEn: 'Blessings', icon: <Sparkles size={18} />, color: 'bg-red-50 text-red-600 border-red-200 hover:border-red-400', placeholder: '向神、佛、祖先、上天等超自然力量祷告祈求，希望赐福、消灾、护佑 · Pray to deities, Buddha, ancestors, or higher powers for blessings, protection, and deliverance' },
    { id: 'wish', label: '祝愿', labelEn: 'Wishes', icon: <Feather size={18} />, color: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400', placeholder: '对他人或事物表达良好的愿望与期盼 · Express good wishes and hopes for others or for things' },
    { id: 'vent', label: '吐槽', labelEn: 'Vent', icon: <MessageCircleWarning size={18} />, color: 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400', placeholder: '把不满、好笑、无语的地方说出来 · Share your frustrations, funny moments, or speechless experiences' },
  ] as const, []);

  const getPlaceholder = useMemo(() => {
    const cat = categories.find(c => c.id === category);
    return cat?.placeholder ?? '';
  }, [categories, category]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-2xl my-8 overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-100 p-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold text-stone-800 font-serif">如是愿，如是成</h2>
                  <span className="text-[9px] text-stone-400 leading-none">As you wish, so it becomes</span>
                </div>
                {user && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100">
                    <User size={12} className="text-stone-500" />
                    <span className="text-xs text-stone-600">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
              <div className="mb-4 sm:mb-6 space-y-3">
                <div className="flex flex-col gap-0.5">
                  <label className="text-sm font-medium text-stone-600">选择类型</label>
                  <span className="text-[8px] text-stone-400 leading-none">Select Category</span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={twMerge(
                        'flex flex-col items-center justify-center gap-2 rounded-xl border p-2 sm:p-4 transition-all duration-200',
                        c.color,
                        category === c.id ? 'ring-2 ring-current ring-offset-2' : 'border-dashed border-stone-300 bg-transparent text-stone-500 hover:bg-stone-50'
                      )}
                    >
                      {c.icon}
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-medium text-xs sm:text-sm">{c.label}</span>
                        <span className="text-[8px] text-stone-400 leading-none">{c.labelEn}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4 sm:mb-6 space-y-3">
                <div className="flex flex-col gap-0.5">
                  <label className="text-sm font-medium text-stone-600">
                    心声内容 <span className="text-stone-400 font-normal">(最多 50 字)</span>
                  </label>
                  <span className="text-[8px] text-stone-400 leading-none">Your Message · Max 50 characters</span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 50))}
                  placeholder={getPlaceholder}
                  rows={3}
                  maxLength={50}
                  className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-3 sm:p-4 text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-400/10 font-serif text-sm sm:text-base"
                  required
                />
                <div className="text-right text-xs text-stone-400">{content.length}/50</div>
              </div>

              <div className="mb-4 sm:mb-6 space-y-3">
                <div className="flex flex-col gap-0.5">
                  <label className="text-sm font-medium text-stone-600">
                    发念缘由 <span className="text-stone-400 font-normal">(选填，最多 800 字)</span>
                  </label>
                  <span className="text-[8px] text-stone-400 leading-none">Reason · Optional · Max 800 characters</span>
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 800))}
                  placeholder="分享你写下这个心愿的故事或原因... · Share the story or reason behind this wish..."
                  rows={5}
                  maxLength={800}
                  className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-3 sm:p-4 text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-400/10 font-serif text-sm sm:text-base"
                />
                <div className="text-right text-xs text-stone-400">{reason.length}/800</div>
              </div>

              <div className="mb-4 sm:mb-8 space-y-3">
                <div className="flex flex-col gap-0.5">
                  <label className="text-sm font-medium text-stone-600">署名（选填）</label>
                  <span className="text-[8px] text-stone-400 leading-none">Author · Optional</span>
                </div>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="匿名 · Anonymous"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 sm:px-4 py-2.5 sm:py-3 text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-400/10 font-serif text-sm sm:text-base"
                />
              </div>

              <div className="mb-4 sm:mb-8 flex items-center justify-between">
                <div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-sm font-medium text-stone-600">是否公开</label>
                    <span className="text-[8px] text-stone-400 leading-none">Public Visibility</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">不公开将显示"保密" · Private shows "Private"</p>
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

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto rounded-xl px-5 py-2.5 font-medium text-stone-500 hover:bg-stone-100"
                >
                  取消 · Cancel
                </button>
                <button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className="w-full sm:w-auto rounded-xl bg-amber-500 px-6 py-2.5 font-medium text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 disabled:opacity-50 disabled:shadow-none"
                >
                  {isSubmitting ? '提交中... · Submitting' : '去祈愿 · Make a Wish'}
                </button>
              </div>

              {submitError && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
                  {submitError} · {submitError === '提交失败，请重试' ? 'Failed to submit, please try again' : submitError}
                </div>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
