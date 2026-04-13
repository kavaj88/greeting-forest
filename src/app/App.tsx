import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Plus, Flame, Shield, Sparkles } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { Wish, WishCategory } from './types';
import { WishCard } from './components/WishCard';
import { CreateWishModal } from './components/CreateWishModal';
import { fetchWishes, createWish as apiCreateWish, likeWish as apiLikeWish } from '../lib/api';

const INITIAL_WISHES: Wish[] = [
  {
    id: '1',
    category: 'blessing',
    content: '愿父母身体健康，平安喜乐。希望能有更多时间陪伴他们。',
    author: '远方的游子',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    likes: 12,
    bgVariant: 2,
    isPublic: true,
  },
  {
    id: '2',
    category: 'vent',
    content: '今天又加班到了十二点，感觉生活全被工作填满了。真想去山里呆几天什么都不管啊！！',
    author: '打工人小王',
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    likes: 45,
    bgVariant: 3,
    isPublic: true,
  },
  {
    id: '3',
    category: 'wish',
    content: '希望能顺利通过下个月的雅思考试，拿到心仪大学的offer！努力不负韶华。',
    author: '考鸭',
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    likes: 8,
    bgVariant: 1,
    isPublic: true,
  },
  {
    id: '4',
    category: 'blessing',
    content: '祝所有的好心人都能被世界温柔以待。',
    author: '匿名',
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    likes: 102,
    bgVariant: 0,
    isPublic: true,
  },
  {
    id: '5',
    category: 'vent',
    content: '为什么每次下雨天打车都这么难？站在雨里等了半个小时，鞋子全湿透了，心情糟透了。',
    author: '落汤鸡',
    createdAt: Date.now() - 1000 * 60 * 30,
    likes: 3,
    bgVariant: 0,
    isPublic: true,
  },
  {
    id: '6',
    category: 'wish',
    content: '存钱买一辆属于自己的车，带家人去自驾游。',
    author: '大梦想家',
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    likes: 21,
    bgVariant: 1,
    isPublic: true,
  },
];

const TABS: { id: WishCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: '全部心愿', icon: <Leaf size={16} /> },
  { id: 'blessing', label: '祈福', icon: <Flame size={16} /> },
  { id: 'wish', label: '祝愿', icon: <Sparkles size={16} /> },
  { id: 'vent', label: '吐槽', icon: <Shield size={16} /> },
];

export default function App() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [activeTab, setActiveTab] = useState<WishCategory>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 加载心愿数据
  useEffect(() => {
    loadWishes();
  }, []);

  const loadWishes = async () => {
    setIsLoading(true);
    const data = await fetchWishes();
    setWishes(data);
    setIsLoading(false);
  };

  const filteredWishes = wishes.filter(
    (wish) => activeTab === 'all' || wish.category === activeTab
  );

  const handleAddWish = async (newWish: Omit<Wish, 'id' | 'createdAt' | 'likes' | 'bgVariant'>) => {
    const wish = await apiCreateWish({
      category: newWish.category,
      content: newWish.content,
      author: newWish.author,
      isPublic: newWish.isPublic,
      bgVariant: Math.floor(Math.random() * 4),
    });

    if (wish) {
      setWishes((prev) => [wish, ...prev]);
    }
  };

  const handleLike = async (id: string) => {
    await apiLikeWish(id);
    setWishes((prev) =>
      prev.map((w) => (w.id === id ? { ...w, likes: w.likes + 1 } : w))
    );
  };

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
                  <h1 className="text-sm font-bold tracking-tight text-stone-800 font-serif whitespace-nowrap">祈愿林</h1>
                  <p className="text-[9px] uppercase tracking-widest text-stone-400 whitespace-nowrap">Wishing Woods</p>
                </div>
                <div className="hidden h-5 w-px bg-stone-200 lg:block"></div>
                <div className="hidden text-[11px] leading-relaxed text-stone-500 lg:block whitespace-nowrap">
                  <span className="font-semibold text-stone-700">倾听每一种心声</span> — 在这里留下祈福与祝愿，或是倾吐生活的不快。每一块心愿牌，都有人在默默倾听。
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 lg:gap-2">
              <nav className="hidden lg:flex items-center gap-0.5">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={twMerge(
                      'relative flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 whitespace-nowrap',
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
                    <span className="relative z-10">{tab.icon}</span>
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                ))}
              </nav>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-medium text-white shadow-md shadow-amber-500/20 transition-transform hover:scale-105 hover:bg-amber-600 whitespace-nowrap"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">去祈愿</span>
                <span className="sm:hidden">写心愿</span>
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
                'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-amber-100 text-stone-900'
                  : 'bg-stone-100/50 text-stone-500'
              )}
            >
              {tab.icon}
              {tab.label}
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
            </div>
          ) : filteredWishes.length === 0 ? (
            <div className="w-full text-center py-20">
              <Leaf className="mx-auto h-12 w-12 text-stone-300" />
              <p className="mt-4 text-stone-500">暂无心愿，成为第一个许愿的人吧！</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredWishes.map((wish) => (
                <div key={wish.id} className="w-[200px] sm:w-[220px] md:w-[240px]">
                  <WishCard wish={wish} onLike={handleLike} />
                </div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-xl shadow-amber-500/30 transition-transform active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

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
      />
    </div>
  );
}
