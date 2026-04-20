import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Clock, FileText, Trash2, Edit, XCircle, CheckCircle, AlertCircle, Leaf } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../../lib/supabase';
import { WishCategory } from './types';

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
  created_at: string;
  reason_review_status?: 'pending' | 'approved' | 'rejected';
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

const categoryColors: Record<WishCategory, string> = {
  all: '',
  blessing: 'bg-red-50 text-red-700 border-red-200',
  wish: 'bg-amber-50 text-amber-700 border-amber-200',
  vent: 'bg-slate-50 text-slate-700 border-slate-200',
};

export function UserProfile({ user, onBack }: UserProfileProps) {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [selectedWish, setSelectedWish] = useState<WishItem | null>(null);
  const [editReason, setEditReason] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastId, setLastId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        if (isRefresh) {
          setWishes(data);
        } else {
          setWishes((prev) => [...prev, ...data]);
        }

        setHasMore(data.length === PAGE_SIZE);
        if (data.length > 0) {
          setLastId(data[data.length - 1].created_at);
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

  // 保存发念缘由修改
  const handleSaveReason = async () => {
    if (!selectedWish) return;

    setIsSubmitting(true);
    try {
      // 记录修改日志
      await supabase.from('edit_logs').insert({
        wish_id: selectedWish.id,
        user_email: user?.email || '',
        action: 'update_reason',
        old_content: JSON.stringify({ reason: selectedWish.reason }),
        new_content: JSON.stringify({ reason: editReason }),
        review_status: 'pending',
      });

      // 更新心愿，将待审核的内容存入 reason_pending
      const { error } = await supabase
        .from('wishes')
        .update({
          reason_pending: editReason,
          reason_review_status: 'pending',
        })
        .eq('id', selectedWish.id);

      if (error) throw error;

      // 更新本地状态
      setWishes((prev) =>
        prev.map((w) =>
          w.id === selectedWish.id
            ? { ...w, reason_pending: editReason, reason_review_status: 'pending' as const }
            : w
        )
      );
      setSelectedWish((prev) =>
        prev
          ? { ...prev, reason_pending: editReason, reason_review_status: 'pending' as const }
          : null
      );

      alert('修改已提交，等待审核后生效');
    } catch (e: any) {
      alert('保存失败：' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 更新心愿公开状态
  const handleTogglePublic = async () => {
    if (!selectedWish) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('wishes')
        .update({ is_public: !selectedWish.is_public })
        .eq('id', selectedWish.id);

      if (error) throw error;

      // 更新本地状态
      setWishes((prev) =>
        prev.map((w) =>
          w.id === selectedWish.id
            ? { ...w, is_public: !w.is_public }
            : w
        )
      );
      setSelectedWish((prev) =>
        prev ? { ...prev, is_public: !prev.is_public } : null
      );
      setIsPublic(!isPublic);
    } catch (e: any) {
      alert('更新失败：' + e.message);
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

  // 渲染心愿列表项（桌面端表格）
  const renderWishItem = (wish: WishItem) => (
    <motion.tr
      key={wish.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="cursor-pointer hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0"
      onClick={() => {
        setSelectedWish(wish);
        setEditReason(wish.reason || '');
        setIsPublic(wish.is_public);
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
        <span className={twMerge('text-sm', wish.reason ? 'text-amber-600 font-medium' : 'text-stone-400')}>
          {wish.reason ? '有' : '无'}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm text-stone-600">{wish.author}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm text-stone-500">{formatDate(wish.created_at)}</span>
      </td>
      <td className="py-3 px-4 text-center">
        {wish.is_public ? (
          <span className="text-xs text-green-600 flex items-center justify-center gap-1">
            <CheckCircle size={12} /> 公开
          </span>
        ) : (
          <span className="text-xs text-stone-500 flex items-center justify-center gap-1">
            <XCircle size={12} /> 保密
          </span>
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
        setSelectedWish(wish);
        setEditReason(wish.reason || '');
        setIsPublic(wish.is_public);
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
        <span>署名：{wish.author}</span>
        <span className={twMerge('font-medium', wish.reason ? 'text-amber-600' : 'text-stone-400')}>
          故事：{wish.reason ? '有' : '无'}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>{formatDate(wish.created_at)}</span>
      </div>
    </motion.div>
  );

  // 渲染心愿详情
  const renderDetail = () => {
    if (!selectedWish) return null;

    // 从 content 中分离出实际的心声内容（去除发念缘由部分）
    const contentOnly = selectedWish.content.split('\n\n【发念缘由】')[0] || selectedWish.content;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => {
            setSelectedWish(null);
            setShowDeleteConfirm(false);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-stone-100 p-5 pb-4 bg-white rounded-t-2xl">
              <h2 className="text-xl font-semibold text-stone-800 font-serif">
                心愿详情 #{selectedWish.short_id}
              </h2>
              <button
                onClick={() => {
                  setSelectedWish(null);
                  setShowDeleteConfirm(false);
                }}
                className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* 基本信息 */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className={twMerge('px-2 py-0.5 rounded-full text-xs font-medium border', categoryColors[selectedWish.category])}>
                    {categoryLabels[selectedWish.category]}
                  </span>
                  <span className="text-xs text-stone-500">#{selectedWish.short_id}</span>
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-600 mb-1 block">心声内容</label>
                  <p className="text-stone-700 bg-stone-50 rounded-lg p-4 font-serif">{contentOnly}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-stone-600 mb-1 block">署名</label>
                    <p className="text-stone-700 bg-stone-50 rounded-lg p-3 font-serif">{selectedWish.author}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-600 mb-1 block">日期</label>
                    <p className="text-stone-700 bg-stone-50 rounded-lg p-3 font-serif">{formatDate(selectedWish.created_at)}</p>
                  </div>
                </div>

                {/* 公开/保密开关 */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-stone-600">是否公开</label>
                    <p className="text-xs text-stone-400 mt-0.5">不公开将在牌子上显示"保密"</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePublic}
                    disabled={isSubmitting}
                    className={twMerge(
                      'relative h-6 w-11 rounded-full transition-colors duration-200 disabled:opacity-50',
                      selectedWish.is_public ? 'bg-amber-500' : 'bg-stone-300'
                    )}
                  >
                    <span
                      className={twMerge(
                        'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                        selectedWish.is_public ? 'left-6' : 'left-1'
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* 发念缘由（可编辑） */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-stone-600">发念缘由</label>
                  {selectedWish.reason_review_status === 'pending' && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle size={12} /> 待审核
                    </span>
                  )}
                </div>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="分享你写下这个心愿的故事或原因..."
                  rows={6}
                  maxLength={800}
                  className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-4 text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-400/10 font-serif"
                />
                <div className="text-right text-xs text-stone-400 mt-1">{editReason.length}/800</div>

                {selectedWish.reason !== editReason && (
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditReason(selectedWish.reason || '')}
                      className="px-4 py-2 text-sm font-medium text-stone-500 hover:bg-stone-100 rounded-lg"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveReason}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50"
                    >
                      {isSubmitting ? '提交审核中...' : '提交修改'}
                    </button>
                  </div>
                )}
              </div>

              {/* 删除按钮 */}
              <div className="border-t border-stone-100 pt-4">
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    删除此心愿
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-2 bg-red-50 p-3 rounded-lg">
                    <span className="text-sm text-red-700">确定要删除此心愿吗？此操作不可恢复。</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {isSubmitting ? '删除中...' : '确认删除'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
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
              className="flex items-center gap-1 text-stone-600 hover:text-stone-900 transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">返回</span>
            </button>
            <h1 className="text-lg font-semibold text-stone-800 font-serif">我的</h1>
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
                    <th className="py-3 px-4">类型</th>
                    <th className="py-3 px-4">编号</th>
                    <th className="py-3 px-4 text-left">心声内容</th>
                    <th className="py-3 px-4">故事</th>
                    <th className="py-3 px-4">署名</th>
                    <th className="py-3 px-4">日期</th>
                    <th className="py-3 px-4">状态</th>
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
            </div>
          )}

          {!isLoading && wishes.length === 0 && (
            <div className="text-center py-20">
              <FileText className="mx-auto h-12 w-12 text-stone-300" />
              <p className="mt-4 text-stone-500">暂无心愿记录</p>
            </div>
          )}

          {isLoading && wishes.length > 0 && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-amber-500 border-t-transparent"></div>
              <p className="mt-2 text-xs text-stone-500">加载中...</p>
            </div>
          )}

          {!hasMore && wishes.length > 0 && (
            <div className="text-center py-4 text-xs text-stone-500">
              已经到底了
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
