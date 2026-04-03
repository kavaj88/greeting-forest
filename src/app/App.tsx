import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Plus, Flame, Shield, Sparkles } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { Wish, WishCategory } from './types';
import { WishCard } from './components/WishCard';
import { CreateWishModal } from './components/CreateWishModal';

const INITIAL_WISHES: Wish[] = [
  {
    id: '1',
    category: 'blessing',
    content: '愿父母身体健康，平安喜乐。希望能有更多时间陪伴他们。',
    author: '远方的游子',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    likes: 12,
    bgVariant: 2,
  },
  {
    id: '2',
    category: 'vent',
    content: '今天又加班到了十二点，感觉生活全被工作填满了。真想去山里呆几天什么都不管啊！！',
    author: '打工人小王',
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    likes: 45,
    bgVariant: 3,
  },
  {
    id: '3',
    category: 'wish',
    content: '希望能顺利通过下个月的雅思考试，拿到心仪大学的offer！努力不负韶华。',
    author: '考鸭',
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    likes: 8,
    bgVariant: 1,
  },
  {
    id: '4',
    category: 'blessing',
    content: '祝所有的好心人都能被世界温柔以待。',
    author: '匿名',
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    likes: 102,
    bgVariant: 0,
  },
  {
    id: '5',
    category: 'vent',
    content: '为什么每次下雨天打车都这么难？站在雨里等了半个小时，鞋子全湿透了，心情糟透了。',
    author: '落汤鸡',
    createdAt: Date.now() - 1000 * 60 * 30,
    likes: 3,
    bgVariant: 0,
  },
  {
    id: '6',
    category: 'wish',
    content: '存钱买一辆属于自己的车，带家人去自驾游。',
    author: '大梦想家',
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    likes: 21,
    bgVariant: 1,
  },
];

const TABS: { id: WishCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: '全部心愿', icon: <Leaf size={16} /> },
  { id: 'blessing', label: '祈福', icon: <Flame size={16} /> },
  { id: 'wish', label: '祝愿', icon: <Sparkles size={16} /> },
  { id: 'vent', label: '吐槽', icon: <Shield size={16} /> },
];

export default function App() {
  const [wishes, setWishes] = useState<Wish[]>(INITIAL_WISHES);
  const [activeTab, setActiveTab] = useState<WishCategory>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredWishes = wishes.filter(
    (wish) => activeTab === 'all' || wish.category === activeTab
  );

  const handleAddWish = (newWish: Omit<Wish, 'id' | 'createdAt' | 'likes' | 'bgVariant'>) => {
    const wish: Wish = {
      ...newWish,
      id: Math.random().toString(36).substring(7),
      createdAt: Date.now(),
      likes: 0,
      bgVariant: Math.floor(Math.random() * 4),
    };
    setWishes([wish, ...wishes]);
  };

  const handleLike = (id: string) => {
    setWishes((prev) =>
      prev.map((w) => (w.id === id ? { ...w, likes: w.likes + 1 } : w))
    );
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-800 selection:bg-amber-200">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-inner">
                <Leaf size={24} />
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-stone-800 font-serif whitespace-nowrap">祈愿林</h1>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 whitespace-nowrap">Wishing Woods</p>
                </div>
                <div className="hidden h-8 w-px bg-stone-200 lg:block"></div>
                <div className="hidden text-[13px] leading-relaxed text-stone-500 lg:block whitespace-nowrap">
                  <span className="font-semibold text-stone-700">倾听每一种心声</span> — 在这里留下祈福与祝愿，或是倾吐生活的不快。每一块心愿牌，都有人在默默倾听。
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <nav className="hidden lg:flex items-center gap-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={twMerge(
                      'relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap',
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
                className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-amber-500/20 transition-transform hover:scale-105 hover:bg-amber-600 whitespace-nowrap"
              >
                <Plus size={16} />
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
        <div className="mx-auto max-w-[1400px] pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredWishes.map((wish) => (
                <WishCard key={wish.id} wish={wish} onLike={handleLike} />
              ))}
            </AnimatePresence>
          </div>
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
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
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
