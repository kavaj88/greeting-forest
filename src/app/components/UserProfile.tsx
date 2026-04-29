import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, FileText, Trash2, XCircle, CheckCircle, AlertCircle, Leaf, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../../lib/supabase';
import { WishCategory } from './types';
import { WishDetailPanel } from './wish-detail-panel';

interface UserSession {
  email: string;
  loggedAt: string;
  expiresAt: string;
}

interface WishItem {
  id: string;
  short_id: string;
  category: WishCategory;
  content: string;
  reason?: string;
  author: string;
  is_public: boolean;
  likes: number;
  created_at: number;
  reason_review_status?: 'pending' | 'approved' | 'rejected';
  thanked_content?: string;
  thanked_at?: string;
}

interface UserProfileProps {
  user: UserSession | null;
  onBack: () => void;
}

const categoryLabels: Record<WishCategory, string> = {
  all: '全部',
  blessing: '祈福',
  wish: '祝愿',
  vent: '吐槽',
};

const categoryLabelsEn: Record<WishCategory, string> = {
  all: 'All',
  blessing: 'Blessings',
  wish: 'Wishes',
  vent: 'Vent',
};

const categoryColors: Record<WishCategory, string> = {
  all: '',
  blessing: 'bg-red-50 text-red-700 border-red-200',
  wish: 'bg-amber-50 text-amber-700 border-amber-200',
  vent: 'bg-slate-50 text-slate-700 border-slate-200',
};

// 用于 WishDetailPanel 的数据类型（兼容 Wish 接口 + 谢愿字段）
interface DetailWish {
  id: string;
  category: string;
  content: string;
  author: string;
  createdAt: number;
  likes: number;
  bgVariant: number;
  isPublic: boolean;
  reason?: string;
  thankedContent?: string | null;
  thankedAt?: number | null;
}

export function UserProfile({ user, onBack }: UserProfileProps) {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [selectedWish, setSelectedWish] = useState<WishItem | null>(null);
  const [detailWish, setDetailWish] = useState<DetailWish | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastId, setLastId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [tempReason, setTempReason] = useState('');
  const [showThankModal, setShowThankModal] = useState(false);
  const [tempThank, setTempThank] = useState('');

  const PAGE_SIZE = 10;

  // 加载用户的心愿列表
  const loadWishes = useCallback(async (isRefresh = false) => {
    if (!user || !hasMore && !isRefresh) return;

    setIsLoading(true);

    try {
      let query = supabase
        .from('wishes')
        .select('*')
        .eq('owner_email', user.email.toLowerCase())
        .eq('is_deleted', false) // 过滤已删除的数据
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (!isRefresh && lastId) {
        query = query.lt('created_at', lastId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // 保存原始 created_at 字符串（ISO格式），用于 Supabase 分页查询
        const rawLastCreatedAt = data.length > 0 ? data[data.length - 1].created_at : null;

        const transformedData = data.map((item) => ({
          ...item,
          created_at: new Date(item.created_at).getTime(),
        }));

        if (isRefresh) {
          setWishes(transformedData);
        } else {
          setWishes((prev) => [...prev, ...transformedData]);
        }

        setHasMore(data.length === PAGE_SIZE);
        if (rawLastCreatedAt) {
          setLastId(rawLastCreatedAt);
        }
      }
    } catch (e: any) {
      console.error('加载心愿失败:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user, lastId, hasMore]);

  useEffect(() => {
    if (user) {
      loadWishes(true);
    }
  }, [user, loadWishes]);

  // 无限滚动
  useEffect(() => {
    const handleScroll = () => {
      if (isLoading || !hasMore) return;

      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollHeight - scrollTop - clientHeight < 100) {
        loadWishes();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore, loadWishes]);

  // 删除心愿（逻辑删除）
  const handleDelete = async () => {
    if (!selectedWish) return;

    setIsSubmitting(true);
    try {
      // 记录删除日志
      await supabase.from('edit_logs').insert({
        wish_id: selectedWish.id,
        user_email: user?.email || '',
        action: 'delete',
        old_content: JSON.stringify({
          content: selectedWish.content,
          reason: selectedWish.reason,
        }),
        review_status: 'approved',
      });

      // 逻辑删除：更新 is_deleted = true
      const { error } = await supabase
        .from('wishes')
        .update({ is_deleted: true })
        .eq('id', selectedWish.id);

      if (error) throw error;

      // 从列表中移除（前端隐藏）
      setWishes((prev) => prev.filter((w) => w.id !== selectedWish.id));
      setSelectedWish(null);
      setShowDeleteConfirm(false);
    } catch (e: any) {
      alert('删除失败：' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 直接保存发念缘由（不走审核）
  const handleSaveReasonDirect = async (reason: string) => {
    if (!selectedWish) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('wishes')
        .update({ reason: reason.trim() || null })
        .eq('id', selectedWish.id);

      if (error) throw error;

      const trimmed = reason.trim() || undefined;
      // 更新本地状态
      setWishes((prev) =>
        prev.map((w) =>
          w.id === selectedWish.id ? { ...w, reason: trimmed } : w
        )
      );
      setSelectedWish((prev) =>
        prev ? { ...prev, reason: trimmed } : null
      );
      // 同步更新 detailWish
      setDetailWish((prev) =>
        prev ? { ...prev, reason: trimmed } : null
      );

      alert('保存成功');
    } catch (e: any) {
      alert('保存失败：' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 保存谢愿词
  const handleSaveThank = async (content: string) => {
    if (!selectedWish) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('wishes')
        .update({
          thanked_content: content,
          thanked_at: new Date().toISOString(),
        })
        .eq('id', selectedWish.id);

      if (error) throw error;

      const now = new Date().toISOString();
      // 更新本地状态
      setWishes((prev) =>
        prev.map((w) =>
          w.id === selectedWish.id ? { ...w, thanked_content: content, thanked_at: now } : w
        )
      );
      setSelectedWish((prev) =>
        prev ? { ...prev, thanked_content: content, thanked_at: now } : null
      );
      // 同步更新 detailWish
      setDetailWish((prev) =>
        prev ? { ...prev, thankedContent: content, thankedAt: Date.now() } : null
      );

      alert('保存成功');
    } catch (e: any) {
      alert('保存失败：' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 将 WishItem 转换为 DetailWish（消除 renderWishItem/renderWishItemMobile 重复代码）
  const toDetailWish = (wish: WishItem): DetailWish => ({
    id: wish.id,
    category: wish.category,
    content: wish.content,
    author: wish.author,
    createdAt: wish.created_at,
    likes: wish.likes,
    bgVariant: 0,
    isPublic: wish.is_public,
    reason: wish.reason,
    thankedContent: wish.thanked_content,
    thankedAt: wish.thanked_at ? new Date(wish.thanked_at).getTime() : null,
  });

  // 渲染心愿列表项（桌面端表格）
  const renderWishItem = (wish: WishItem) => (
    <motion.tr
      key={wish.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="cursor-pointer hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0"
      onClick={() => {
        setDetailWish(toDetailWish(wish));
        setSelectedWish(wish);
      }}
    >
      <td className="py-3 px-4 text-center">
        <span className={twMerge('px-2 py-1 rounded-full text-xs font-medium border', categoryColors[wish.category])}>
          {categoryLabels[wish.category]}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm font-mono text-stone-600">{wish.short_id || '暂无'}</span>
      </td>
      <td className="py-3 px-4 text-left">
        <p className="text-sm text-stone-700 line-clamp-3">{wish.content}</p>
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex flex-col items-center gap-0.5">
          <span className={twMerge('text-sm', wish.reason ? 'text-amber-600 font-medium' : 'text-stone-400')}>
            {wish.reason ? '有' : '无'}
          </span>
          <span className="text-[8px] text-stone-400 leading-none">
            {wish.reason ? 'Yes' : 'No'}
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm text-stone-600">{wish.author}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm text-stone-500">{formatDate(wish.created_at)}</span>
      </td>
      <td className="py-3 px-4 text-center">
        {wish.is_public ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-green-600 flex items-center justify-center gap-1">
              <CheckCircle size={12} /> 公开
            </span>
            <span className="text-[8px] text-stone-400 leading-none">Public</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-stone-500 flex items-center justify-center gap-1">
              <XCircle size={12} /> 保密
            </span>
            <span className="text-[8px] text-stone-400 leading-none">Private</span>
          </div>
        )}
      </td>
    </motion.tr>
  );

  // 渲染心愿列表项（移动端卡片）
  const renderWishItemMobile = (wish: WishItem) => (
    <motion.div
      key={wish.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 cursor-pointer hover:bg-stone-50 transition-colors"
      onClick={() => {
        setDetailWish(toDetailWish(wish));
        setSelectedWish(wish);
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={twMerge('px-2 py-1 rounded-full text-xs font-medium border', categoryColors[wish.category])}>
            {categoryLabels[wish.category]}
          </span>
          <span className="text-sm font-mono text-stone-600">{wish.short_id || '暂无'}</span>
          {wish.is_public ? (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle size={10} /> 公开
            </span>
          ) : (
            <span className="text-xs text-stone-500 flex items-center gap-1">
              <XCircle size={10} /> 保密
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-stone-700 line-clamp-2 mb-2">{wish.content}</p>
      <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
        <div className="flex flex-col">
          <span>署名 · Author</span>
          <span className="text-stone-700">{wish.author}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className={twMerge('font-medium', wish.reason ? 'text-amber-600' : 'text-stone-400')}>
            故事 · Story
          </span>
          <span className={twMerge('text-xs', wish.reason ? 'text-amber-600' : 'text-stone-400')}>
            {wish.reason ? '有 · Yes' : '无 · No'}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-stone-500">
        <div className="flex flex-col">
          <span>日期 · Date</span>
          <span>{formatDate(wish.created_at)}</span>
        </div>
      </div>
    </motion.div>
  );

  // 渲染心愿详情（使用 WishDetailPanel + 管理弹窗）
  const renderDetail = () => {
    if (!detailWish) return null;

    return (
      <>
        <WishDetailPanel
          wish={detailWish}
          onClose={() => {
            setDetailWish(null);
            setSelectedWish(null);
            setShowDeleteConfirm(false);
          }}
          user={user}
          isAdmin={true}
          onDelete={() => setShowDeleteConfirm(true)}
          onReasonEdit={() => {
            if (selectedWish?.thanked_content) return;
            setTempReason(selectedWish?.reason || '');
            setShowReasonModal(true);
          }}
          reasonEditable={!detailWish?.thankedContent}
          thankedContent={detailWish.thankedContent}
          thankedAt={detailWish.thankedAt}
          onThankOpen={() => {
            setTempThank('');
            setShowThankModal(true);
          }}
        />

        {/* 删除确认弹窗 */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl p-6 w-80 shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle size={18} className="text-red-500" />
                  <p className="text-sm font-medium text-stone-700">确定删除此心愿？此操作无法撤销。</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? '删除中...' : '确认删除'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 发愿缘由编辑弹窗 */}
        <AnimatePresence>
          {showReasonModal && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl p-6 w-[90%] max-w-lg shadow-2xl"
                style={{ resize: 'both', overflow: 'auto', minWidth: 320, minHeight: 200 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-stone-700">编辑发念缘由</h3>
                  <button
                    onClick={() => setShowReasonModal(false)}
                    className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <textarea
                  value={tempReason}
                  onChange={(e) => setTempReason(e.target.value.slice(0, 800))}
                  placeholder="分享你写下这个心愿的故事或原因..."
                  rows={8}
                  maxLength={800}
                  className="w-full resize-none rounded-lg border border-stone-200 bg-stone-50 p-2 text-sm text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none font-serif"
                />
                <div className="text-right text-xs text-stone-400 mt-1">{tempReason.length}/800</div>
                <button
                  onClick={() => {
                    handleSaveReasonDirect(tempReason);
                    setShowReasonModal(false);
                  }}
                  disabled={isSubmitting || !tempReason.trim()}
                  className="w-full mt-3 px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  保存
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 谢愿词编辑弹窗 */}
        <AnimatePresence>
          {showThankModal && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl p-6 w-[90%] max-w-lg shadow-2xl"
                style={{ resize: 'both', overflow: 'auto', minWidth: 320, minHeight: 200 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-stone-700">还愿谢语</h3>
                  <button
                    onClick={() => setShowThankModal(false)}
                    className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <textarea
                  value={tempThank}
                  onChange={(e) => setTempThank(e.target.value.slice(0, 1000))}
                  placeholder="请输入还愿谢语"
                  rows={8}
                  maxLength={1000}
                  className="w-full resize-none rounded-lg border border-stone-200 bg-stone-50 p-2 text-sm text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none font-serif"
                />
                <div className="text-right text-xs text-stone-400 mt-1">{tempThank.length}/1000</div>
                <p className="text-[10px] text-amber-600 mt-1">保存后本愿不可再次编辑</p>
                <button
                  onClick={() => {
                    handleSaveThank(tempThank);
                    setShowThankModal(false);
                  }}
                  disabled={isSubmitting || !tempThank.trim()}
                  className="w-full mt-3 px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  保存
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-500">请先登录</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image - 与首页保持一致 */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      ></div>
      <div className="fixed inset-0 z-0 bg-[#faf9f6]/80"></div>

      {/* 内容区域 */}
      <div className="relative z-10 min-h-screen bg-stone-50/50 backdrop-blur-sm">
        {/* 心愿列表 */}
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {/* 返回和标题栏 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex flex-col items-center gap-0 text-stone-600 hover:text-stone-900 transition-colors"
            >
              <div className="flex items-center gap-1">
                <ChevronLeft size={20} />
                <span className="font-medium">返回</span>
              </div>
              <span className="text-[8px] text-stone-400 leading-none">Back</span>
            </button>
            <div className="flex flex-col items-center">
              <h1 className="text-lg font-semibold text-stone-800 font-serif">我的</h1>
              <span className="text-[9px] text-stone-400 leading-none">My Wishes</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            {/* 桌面端表格 */}
            <div className="hidden md:block overflow-y-auto max-h-[calc(100vh-300px)]">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-20" />
                  <col className="w-20" />
                  <col />
                  <col className="w-16" />
                  <col className="w-20" />
                  <col className="w-24" />
                  <col className="w-20" />
                </colgroup>
                <thead className="bg-stone-50 border-b border-stone-200 sticky top-0">
                  <tr className="text-center text-sm font-medium text-stone-600">
                    <th className="py-3 px-4">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>类型</span>
                        <span className="text-[8px] text-stone-400 leading-none">Category</span>
                      </div>
                    </th>
                    <th className="py-3 px-4">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>编号</span>
                        <span className="text-[8px] text-stone-400 leading-none">ID</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 text-left">
                      <div className="flex flex-col gap-0.5">
                        <span>心声内容</span>
                        <span className="text-[8px] text-stone-400 leading-none">Heart Message</span>
                      </div>
                    </th>
                    <th className="py-3 px-4">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>故事</span>
                        <span className="text-[8px] text-stone-400 leading-none">Story</span>
                      </div>
                    </th>
                    <th className="py-3 px-4">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>署名</span>
                        <span className="text-[8px] text-stone-400 leading-none">Author</span>
                      </div>
                    </th>
                    <th className="py-3 px-4">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>日期</span>
                        <span className="text-[8px] text-stone-400 leading-none">Date</span>
                      </div>
                    </th>
                    <th className="py-3 px-4">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>状态</span>
                        <span className="text-[8px] text-stone-400 leading-none">Status</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {wishes.map((wish) => renderWishItem(wish))}
                </tbody>
              </table>
            </div>

            {/* 移动端列表 - 卡片形式 */}
            <div className="md:hidden divide-y divide-stone-100">
              {wishes.map((wish) => renderWishItemMobile(wish))}
            </div>
          </div>

          {isLoading && wishes.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
              <p className="mt-4 text-stone-500">正在加载...</p>
              <p className="text-xs text-stone-400 uppercase tracking-wider mt-1">Loading...</p>
            </div>
          )}

          {!isLoading && wishes.length === 0 && (
            <div className="text-center py-20">
              <FileText className="mx-auto h-12 w-12 text-stone-300" />
              <p className="mt-4 text-stone-500">暂无心愿记录</p>
              <p className="text-xs text-stone-400 uppercase tracking-wider mt-1">No wishes yet</p>
            </div>
          )}

          {isLoading && wishes.length > 0 && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-amber-500 border-t-transparent"></div>
              <p className="mt-2 text-xs text-stone-500">加载中...</p>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mt-0.5">Loading...</p>
            </div>
          )}

          {!hasMore && wishes.length > 0 && (
            <div className="text-center py-4">
              <p className="text-xs text-stone-500">已经到底了</p>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mt-0.5">No more items</p>
            </div>
          )}
        </main>
      </div>

      {/* 详情页弹窗 */}
      {selectedWish && renderDetail()}

      {/* 背景装饰 - 与首页一致 */}
      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-amber-200/20 blur-[100px]" />
        <div className="absolute -right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-red-200/20 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[30%] w-[30%] rounded-full bg-blue-200/20 blur-[100px]" />
      </div>
    </div>
  );
}
