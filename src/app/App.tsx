import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Plus, Flame, Shield, Sparkles, LogOut, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Wish, WishCategory } from './types';
import { WishCard } from './components/WishCard';
import { CreateWishModal } from './components/CreateWishModal';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { fetchWishes, createWish as apiCreateWish, likeWish as apiLikeWish } from '../lib/api';

interface UserSession {
  email: string;
  loggedAt: string;
  expiresAt: string;
}

const TABS: { id: WishCategory; label: string; labelEn: string; icon: React.ReactNode }[] = [
  { id: 'all', label: '全部心愿', labelEn: 'All Wishes', icon: <Leaf size={16} /> },
  { id: 'blessing', label: '祈福', labelEn: 'Blessings', icon: <Flame size={16} /> },
  { id: 'wish', label: '祝愿', labelEn: 'Wishes', icon: <Sparkles size={16} /> },
  { id: 'vent', label: '吐槽', labelEn: 'Vent', icon: <Shield size={16} /> },
];

const PAGE_SIZE = 72;

export default function App() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [activeTab, setActiveTab] = useState<WishCategory>('all');
  const [pagePerTab, setPagePerTab] = useState<Record<WishCategory, number>>({
    all: 1,
    blessing: 1,
    wish: 1,
    vent: 1,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  // 检查用户登录状态
  useEffect(() => {
    // 从 localStorage 获取 session
    const stored = localStorage.getItem('user_session');
    if (stored) {
      try {
        const session = JSON.parse(stored) as UserSession;
        // 检查是否过期
        if (new Date(session.expiresAt) > new Date()) {
          setUserSession(session);
        } else {
          localStorage.removeItem('user_session');
        }
      } catch {
        localStorage.removeItem('user_session');
      }
    }

    // 监听自定义 auth 事件
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<UserSession>;
      setUserSession(customEvent.detail);
    };

    window.addEventListener('auth-change' as any, handleAuthChange);
    return () => window.removeEventListener('auth-change' as any, handleAuthChange);
  }, []);

  // 加载心愿数据
  useEffect(() => {
    loadWishes();
  }, []);

  const loadWishes = async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchWishes();
    if (result.success) {
      setWishes(result.data || []);
    } else {
      setError(result.error || '加载失败');
    }
    setIsLoading(false);
  };

  // 处理点击"去祈愿"
  const handleOpenWishModal = () => {
    if (!userSession) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('user_session');
    setUserSession(null);
  };

  // 打开用户资料页面
  const handleOpenUserProfile = () => {
    setShowUserProfile(true);
  };

  // 关闭用户资料页面
  const handleCloseUserProfile = () => {
    setShowUserProfile(false);
  };

  // 认证成功回调
  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    if (authMode === 'login') {
      setIsModalOpen(true);
    }
  };

  const filteredWishes = useMemo(
    () => wishes.filter((wish) => activeTab === 'all' || wish.category === activeTab),
    [wishes, activeTab]
  );

  // 分页计算
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredWishes.length / PAGE_SIZE)),
    [filteredWishes.length]
  );

  const storedPage = pagePerTab[activeTab];
  const currentPage = storedPage > totalPages ? totalPages : storedPage < 1 ? 1 : storedPage;

  const setCurrentPageForTab = useCallback((tab: WishCategory, page: number | ((prev: number) => number)) => {
    setPagePerTab((prev) => {
      const current = prev[tab];
      const nextPage = typeof page === 'function' ? page(current) : page;
      return { ...prev, [tab]: nextPage };
    });
  }, []);

  // 同步 clamp 后的页码到 state（防止下次渲染时 again 越界）
  useEffect(() => {
    if (storedPage !== currentPage) {
      setPagePerTab((prev) => ({ ...prev, [activeTab]: currentPage }));
    }
  }, [activeTab, storedPage, currentPage]);

  // 页码变化时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, currentPage]);

  // 当前页的心愿
  const pagedWishes = useMemo(
    () => filteredWishes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredWishes, currentPage]
  );

  const handleAddWish = async (newWish: Omit<Wish, 'id' | 'createdAt' | 'likes' | 'bgVariant'>) => {
    const result = await apiCreateWish({
      category: newWish.category,
      content: newWish.content,
      author: newWish.author,
      isPublic: newWish.isPublic,
      bgVariant: Math.floor(Math.random() * 4),
    }, userSession?.email);

    if (result.success && result.data) {
      setWishes((prev) => [result.data!, ...prev]);
      return true;
    } else {
      setError(result.error || '创建心愿失败');
      return false;
    }
  };

  const handleLike = useCallback(async (id: string) => {
    const result = await apiLikeWish(id);
    if (result.success) {
      setWishes((prev) =>
        prev.map((w) => (w.id === id ? { ...w, likes: w.likes + 1 } : w))
      );
    }
    // 失败时静默处理，不干扰用户体验
  }, []);

  return (
    <div className="min-h-screen text-stone-800 selection:bg-amber-200 relative">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      ></div>
      <div className="fixed inset-0 z-0 bg-[#faf9f6]/80"></div>
      {/* Header */}
      <header className="sticky top-0 z-[10] border-b border-stone-200/50 bg-white/60 backdrop-blur-md">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-10 items-center justify-between gap-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-inner">
                <Leaf size={16} />
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:gap-3">
                <div>
                  <h1 className="text-sm font-bold tracking-tight text-stone-800 font-serif whitespace-nowrap">如是愿</h1>
                  <p className="text-[9px] uppercase tracking-widest text-stone-400 whitespace-nowrap">WISHING YOU</p>
                </div>
                <div className="hidden h-5 w-px bg-stone-200 lg:block"></div>
                <div className="hidden text-[11px] leading-relaxed text-stone-500 lg:block">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-stone-700">如是愿，如是成 — 凡所祈愿，如是圆满；以如是心，成世间愿。</span>
                    <span className="text-stone-500">As you wish, so it becomes — May all your wishes be fulfilled with a mindful heart.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 lg:gap-2">
              {userSession && (
                <div className="hidden lg:flex items-center gap-2 mr-2">
                  <button
                    onClick={handleOpenUserProfile}
                    className="flex flex-col items-center gap-0 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <User size={14} className="text-stone-500" />
                      <span className="text-xs text-stone-600 truncate max-w-[120px]">
                        {userSession.email.split('@')[0]}
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-0 px-3 py-1.5 rounded-full text-xs font-medium text-stone-500 hover:bg-stone-100 transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      <LogOut size={14} />
                      <span>退出</span>
                    </span>
                    <span className="text-[8px] text-stone-400 leading-none mt-0.5">Logout</span>
                  </button>
                </div>
              )}

              <nav className="hidden lg:flex items-center gap-0.5">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={twMerge(
                      'relative flex flex-col items-center gap-0 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200',
                      activeTab === tab.id
                        ? 'text-stone-900'
                        : 'text-stone-500 hover:bg-stone-100/80 hover:text-stone-700'
                    )}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="active-tab"
                        className="absolute inset-0 rounded-full bg-amber-100"
                        transition={{ type: 'spring', duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1">
                      {tab.icon}
                      {tab.label}
                    </span>
                    <span className="relative z-10 text-[9px] text-stone-400 leading-none mt-0.5">{tab.labelEn}</span>
                  </button>
                ))}
              </nav>

              <button
                onClick={handleOpenWishModal}
                className="flex flex-col items-center gap-0 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-medium text-white shadow-md shadow-amber-500/20 transition-transform hover:scale-105 hover:bg-amber-600"
              >
                <span className="flex items-center gap-1">
                  <Plus size={14} />
                  <span className="hidden sm:inline">去祈愿</span>
                  <span className="sm:hidden">写心愿</span>
                </span>
                <span className="text-[8px] uppercase tracking-wider hidden sm:block">Make a Wish</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex space-x-2 overflow-x-auto border-t border-stone-100 px-4 pb-3 pt-3 md:hidden hide-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={twMerge(
                'flex shrink-0 flex-col items-center gap-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-amber-100 text-stone-900'
                  : 'bg-stone-100/50 text-stone-500'
              )}
            >
              <span className="flex items-center gap-1">
                {tab.icon}
                {tab.label}
              </span>
              <span className="text-[8px] text-stone-400 leading-none mt-0.5">{tab.labelEn}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto pb-24 flex flex-wrap justify-center gap-3 max-w-[1920px]">
          {isLoading ? (
            <div className="w-full text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
              <p className="mt-4 text-stone-500">正在加载心愿...</p>
              <p className="text-xs text-stone-400 uppercase tracking-wider">Loading wishes...</p>
            </div>
          ) : error ? (
            <div className="w-full text-center py-20">
              <div className="text-red-500 text-lg mb-2">⚠️ 加载失败</div>
              <p className="text-stone-500 mb-4">{error}</p>
              <p className="text-xs text-stone-400 mb-4">Failed to load</p>
              <button
                onClick={loadWishes}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                重试 · Retry
              </button>
            </div>
          ) : filteredWishes.length === 0 ? (
            <div className="w-full text-center py-20">
              <Leaf className="mx-auto h-12 w-12 text-stone-300" />
              <p className="mt-4 text-stone-500">暂无心愿，成为第一个许愿的人吧！</p>
              <p className="text-xs text-stone-400 mt-1">No wishes yet. Be the first to make a wish!</p>
            </div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {pagedWishes.map((wish) => (
                  <div key={wish.id} className="w-[200px] sm:w-[220px] md:w-[240px]">
                    <WishCard wish={wish} onLike={handleLike} />
                  </div>
                ))}
              </AnimatePresence>

              {/* 分页控件 */}
              {totalPages > 1 && (
                <div className="w-full flex justify-center py-8">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPageForTab(activeTab, (p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 2) return true;
                        return false;
                      })
                      .reduce<(number | string)[]>((acc, page, idx, arr) => {
                        if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                          acc.push('...');
                        }
                        acc.push(page);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        typeof item === 'string' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-stone-400">
                            ...
                          </span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setCurrentPageForTab(activeTab, item)}
                            className={twMerge(
                              'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                              currentPage === item
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                : 'text-stone-600 hover:bg-stone-100'
                            )}
                          >
                            {item}
                          </button>
                        )
                      )}

                    <button
                      onClick={() => setCurrentPageForTab(activeTab, (p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* 底部统计 */}
              <div className="w-full text-center pb-6">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-stone-300">
                    {currentPage}/{totalPages} · {filteredWishes.length}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden">
        <button
          onClick={handleOpenWishModal}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-xl shadow-amber-500/30 transition-transform active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* 用户信息 (Mobile) */}
      {userSession && (
        <div className="fixed bottom-6 left-6 z-40 sm:hidden">
          <button
            onClick={handleOpenUserProfile}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg"
          >
            <User size={18} />
          </button>
        </div>
      )}

      {/* Background Decor */}
      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-amber-200/20 blur-[100px]" />
        <div className="absolute -right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-red-200/20 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[30%] w-[30%] rounded-full bg-blue-200/20 blur-[100px]" />
      </div>

      <CreateWishModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddWish}
        user={userSession}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {showUserProfile && userSession && (
        <div className="fixed inset-0 z-50 overflow-auto bg-white">
          <UserProfile user={userSession} onBack={handleCloseUserProfile} />
        </div>
      )}
    </div>
  );
}
