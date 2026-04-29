import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Compass, HeartHandshake, Sparkles, ScrollText } from 'lucide-react';

interface HomeLandingProps {
  seoPhrases: string[];
  isLoggedIn: boolean;
  onEnterWall: () => void;
  onCreateWish: () => void;
}

const FALLBACK_PHRASES = [
  '在线祈福',
  '许愿墙',
  '树洞倾诉',
  '还愿谢语',
  '匿名祝福',
  '心愿记录',
  '凡所祈愿',
  '如是圆满',
  '平安喜乐',
  '学业顺遂',
  '事业如愿',
  '爱情美满',
];

const FAQS = [
  {
    question: '如是愿适合用来做什么？',
    answer: '适合在线祈福、发布心愿、表达祝愿、匿名倾诉、记录愿望进展，也适合整理关于爱情、事业、学业、健康与生活的真实心声。',
  },
  {
    question: '进入如是愿后可以直接许愿吗？',
    answer: '可以先浏览主页了解内容方向，进入许愿墙后即可查看公开心愿。登录后还可以发布祈福内容、写下祝愿、参与留言互动。',
  },
  {
    question: '如是愿是否支持手机和电脑访问？',
    answer: '支持。页面同时适配移动端与 PC 端浏览体验，兼顾图文阅读、内容抓取、品牌搜索、问答型搜索和多平台收录场景。',
  },
];

const FEATURE_ITEMS = [
  {
    title: '在线祈福与许愿墙',
    description: '写下关于爱情、事业、学业、健康与生活的盼望，把想说的话留在温和安静的页面里。',
    icon: Sparkles,
  },
  {
    title: '树洞倾诉与情绪安放',
    description: '当你只想倾诉、整理情绪、轻轻说出烦恼时，这里也能成为一个克制而安稳的树洞角落。',
    icon: HeartHandshake,
  },
  {
    title: '还愿记录与温柔回望',
    description: '愿望实现之后，可以把一路走来的心路、谢意与祝福留下，让一条心愿拥有完整的开始与回响。',
    icon: ScrollText,
  },
];

function chunkIntoRows(phrases: string[]) {
  const source = phrases.length > 0 ? phrases : FALLBACK_PHRASES;
  return Array.from({ length: 3 }, (_, rowIndex) =>
    source.filter((_, index) => index % 3 === rowIndex).slice(0, 18)
  );
}

export function HomeLanding({ seoPhrases, isLoggedIn, onEnterWall, onCreateWish }: HomeLandingProps) {
  const rows = useMemo(() => chunkIntoRows(seoPhrases), [seoPhrases]);
  const featuredPhrases = useMemo(() => (seoPhrases.length > 0 ? seoPhrases.slice(0, 12) : FALLBACK_PHRASES), [seoPhrases]);

  const faqSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          name: '如是愿首页',
          description: '如是愿首页聚合在线祈福、许愿墙、树洞倾诉、还愿谢语等内容入口，适配移动端与 PC 端浏览。',
          inLanguage: 'zh-CN',
        },
        {
          '@type': 'FAQPage',
          mainEntity: FAQS.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ],
    }),
    []
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#201512] text-stone-50">
      <style>{`
        @keyframes home-marquee-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @keyframes home-marquee-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
      `}</style>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <img
        src="/fo.jpg"
        alt="如是愿首页背景"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(252,211,77,0.14),_transparent_34%),linear-gradient(180deg,_rgba(18,10,6,0.18),_rgba(18,10,6,0.64)_35%,_rgba(18,10,6,0.84)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px] opacity-20" />

      <header className="relative z-10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex items-center gap-3"
            aria-label="返回如是愿首页顶部"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <Sparkles size={18} />
            </div>
            <div className="text-left">
              <div className="font-serif text-lg tracking-[0.2em] text-amber-100 transition-colors group-hover:text-white">如是愿</div>
              <p className="text-[11px] uppercase tracking-[0.45em] text-stone-300/80">WISHING YOU</p>
            </div>
          </button>

          <nav className="hidden items-center gap-3 md:flex" aria-label="首页导航">
            <a href="#scene" className="text-sm text-stone-200/90 transition-colors hover:text-white">使用场景</a>
            <a href="#features" className="text-sm text-stone-200/90 transition-colors hover:text-white">页面亮点</a>
            <a href="#faq" className="text-sm text-stone-200/90 transition-colors hover:text-white">常见问题</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEnterWall}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-stone-50 backdrop-blur transition-colors hover:bg-white/15"
            >
              进入许愿墙
            </button>
            <button
              type="button"
              onClick={onCreateWish}
              className="rounded-full bg-amber-300 px-4 py-2 text-sm font-medium text-stone-900 transition-all hover:bg-amber-200"
            >
              {isLoggedIn ? '立即发愿' : '登录后发愿'}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="sr-only">
          <h2>如是愿首页内容介绍</h2>
          <p>
            如是愿首页聚合在线祈福、许愿墙、树洞倾诉、祝福留言、心愿记录与还愿入口，适合浏览关于平安喜乐、学业顺遂、事业如愿、爱情美满和生活祝愿的内容。
          </p>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pb-20 lg:pt-14">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-amber-200/20 bg-amber-200/10 px-4 py-1.5 text-xs tracking-[0.3em] text-amber-100/90">
              在线祈福 · 许愿墙 · 树洞倾诉 · 还愿记录
            </p>
            <h1 className="mt-6 font-serif text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
              如是愿
              <span className="mt-3 block text-2xl leading-snug text-amber-100/95 sm:text-3xl lg:text-4xl">
                在安静的光影里，写下祈福、祝愿、心事与心愿
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-200/90 sm:text-lg">
              这里是如是愿的默认主页。你可以从这里进入许愿墙，浏览大家留下的祈福与祝愿，也可以在适合的时候写下自己的愿望、故事与感受。
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300/85 sm:text-base">
              无论你是想为爱情祈愿、为学业祝福、为事业加油，还是只想在夜深时安静倾诉片刻，这里都留了一盏温柔的灯。
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onEnterWall}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-stone-900 transition-transform hover:scale-[1.02]"
              >
                浏览心愿墙
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={onCreateWish}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm text-stone-50 backdrop-blur transition-colors hover:bg-white/15"
              >
                发布祈福内容
                <Compass size={16} />
              </button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <article className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur-md">
                <div className="text-3xl font-serif text-amber-100">01</div>
                <h2 className="mt-3 text-base font-medium text-white">适合写下的祈愿</h2>
                <p className="mt-2 text-sm leading-6 text-stone-300/90">
                  为家人平安、为身体康健、为远行顺遂、为学业进步而祈福，把想守护的人和事轻轻写下来。
                </p>
              </article>
              <article className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur-md">
                <div className="text-3xl font-serif text-amber-100">02</div>
                <h2 className="mt-3 text-base font-medium text-white">适合留下的祝愿</h2>
                <p className="mt-2 text-sm leading-6 text-stone-300/90">
                  给自己一句鼓励，给朋友一份惦念，给未来一个方向，让愿望不只是期盼，也成为继续前行的力气。
                </p>
              </article>
              <article className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur-md">
                <div className="text-3xl font-serif text-amber-100">03</div>
                <h2 className="mt-3 text-base font-medium text-white">适合安放的心事</h2>
                <p className="mt-2 text-sm leading-6 text-stone-300/90">
                  那些暂时说不出口的疲惫、委屈、惦念与不安，也可以在这里慢慢放下，不必急着给出答案。
                </p>
              </article>
            </div>
          </div>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute -left-6 top-10 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />
            <div className="absolute -right-4 bottom-6 h-32 w-32 rounded-full bg-orange-200/15 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.08))] p-6 shadow-[0_25px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-amber-100/80">Gentle Phrases</p>
                  <h2 className="mt-2 font-serif text-2xl text-white">今日静心词流</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs text-stone-200">
                  愿语缓缓流动
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {featuredPhrases.map((phrase, index) => (
                  <motion.span
                    key={`${phrase}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03, duration: 0.35 }}
                    className="rounded-full border border-amber-100/10 bg-white/10 px-3 py-1.5 text-sm text-stone-100"
                  >
                    {phrase}
                  </motion.span>
                ))}
              </div>

              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-[#2d1e19]/60 p-5">
                <h3 className="text-base font-medium text-white">在这里，你可以慢慢写下</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-200/85">
                  <li>想说给未来的愿望，想送给他人的祝福。</li>
                  <li>想轻轻放下的烦恼，想慢慢整理的心事。</li>
                  <li>想在某一天回头看见的谢意与圆满。</li>
                </ul>
              </div>
            </div>
          </motion.aside>
        </section>

        <section className="relative border-y border-white/10 bg-black/10 py-5">
          <h2 className="sr-only">静心祈福与许愿相关词条滚动展示</h2>
          <div className="space-y-3 overflow-hidden">
            {rows.map((row, rowIndex) => {
              const animationName = rowIndex % 2 === 0 ? 'home-marquee-left' : 'home-marquee-right';
              const repeated = [...row, ...row];

              return (
                <div key={`row-${rowIndex}`} className="overflow-hidden">
                  <div
                    className="flex min-w-max gap-3"
                    style={{
                      animation: `${animationName} ${28 + rowIndex * 4}s linear infinite`,
                    }}
                  >
                    {repeated.map((phrase, index) => (
                      <span
                        key={`${rowIndex}-${phrase}-${index}`}
                        className="rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm text-stone-100/90 backdrop-blur"
                      >
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="scene" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-100/70">Wish Scenes</p>
            <h2 className="mt-3 font-serif text-3xl text-white sm:text-4xl">适合写下这些愿望，也适合安放这些心绪</h2>
            <p className="mt-5 text-base leading-8 text-stone-200/85">
              你可以在这里写下盼望、祝福、牵挂、情绪与感谢。有人为家人平安祈福，有人为考试、工作与远行许愿，也有人只是想把压在心里的话，轻轻说出来。
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {FEATURE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.08] p-6 backdrop-blur-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-200/10 text-amber-100">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 text-xl font-medium text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-300/90">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="features" className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-7 backdrop-blur-md">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-100/70">Beginning Here</p>
            <h2 className="mt-3 font-serif text-3xl text-white">从这里开始，慢慢进入如是愿</h2>
            <p className="mt-5 text-sm leading-7 text-stone-300/90">
              如果你只是路过，可以先看一看词条与光影；如果你带着心事而来，就进入许愿墙；如果你已经准备好写下愿望，也可以直接开始发愿。
            </p>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-[#2a1d19]/70 p-7">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-100/70">What You Can Do</p>
            <h2 className="mt-3 font-serif text-3xl text-white">进入之后，你会看到这些内容与去处</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <h3 className="text-base font-medium text-white">公开心愿</h3>
                <p className="mt-2 text-sm leading-6 text-stone-300/90">浏览别人写下的祈福、祝愿与心愿，在别人的故事里看见温度。</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <h3 className="text-base font-medium text-white">发愿与留言</h3>
                <p className="mt-2 text-sm leading-6 text-stone-300/90">写下愿望，也为别人留一句真诚的回应，让页面一直有回音。</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <h3 className="text-base font-medium text-white">树洞倾诉</h3>
                <p className="mt-2 text-sm leading-6 text-stone-300/90">当不想把话说给熟人听时，也能在这里安静地交给夜色和风。</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <h3 className="text-base font-medium text-white">还愿回望</h3>
                <p className="mt-2 text-sm leading-6 text-stone-300/90">当愿望成真时，可以补上一句谢语，让这份心愿真正圆满落下。</p>
              </div>
            </div>
          </article>
        </section>

        <section id="faq" className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-7 backdrop-blur-md">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-100/70">FAQ</p>
            <h2 className="mt-3 font-serif text-3xl text-white">关于如是愿首页的常见问题</h2>
            <div className="mt-8 grid gap-4">
              {FAQS.map((item) => (
                <article key={item.question} className="rounded-2xl border border-white/10 bg-black/10 p-5">
                  <h3 className="text-lg font-medium text-white">{item.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-300/90">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
