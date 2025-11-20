import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { ReactNode } from 'react';

interface HeroMetaItem {
  label: string;
  value: string;
  hint?: string;
}

interface QuickEntrance {
  href: string;
  label: string;
  description: string;
}

interface PageHeroProps {
  title: string;
  description: string;
  activePath: string;
  eyebrow?: string;
  meta?: HeroMetaItem[];
  actionSlot?: ReactNode;
  bottomSlot?: ReactNode;
}

const QUICK_ENTRANCES: QuickEntrance[] = [
  { href: '/', label: '功能面板', description: '返回欢迎页' },
  { href: '/character/create', label: '角色创建器', description: '构筑与导出角色卡' },
  { href: '/rules', label: '核心规则书', description: '查阅 THE BIBLE' },
  { href: '/dice', label: '在线骰子', description: 'd100 与奖惩骰' },
  { href: '/arena', label: '叙事终端', description: '高互动性跑团界面' },
];

/**
 * @description 跨页面复用的抬头组件，负责品牌统一、关键信息展示以及核心入口分发。
 */
const PageHero = ({
  title,
  description,
  eyebrow = '✨ 魔法少女竞技场TRPG',
  activePath,
  meta,
  actionSlot,
  bottomSlot,
}: PageHeroProps) => {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 px-6 py-8 text-slate-800 shadow-xl shadow-rose-200/50 backdrop-blur">
      <div className="pointer-events-none absolute inset-0"> 
        <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-pink-200/70 blur-3xl" />
        <div className="absolute bottom-0 left-8 h-32 w-32 rounded-full bg-rose-100/70 blur-2xl" />
        <div className="absolute right-16 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-amber-100/70 blur-xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-500">
            <Sparkles className="h-4 w-4" />
            {eyebrow}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-pink-600 sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
        </div>

        {actionSlot ? (
          <div className="w-full max-w-sm lg:w-auto">{actionSlot}</div>
        ) : (
          meta && meta.length > 0 && (
            <div className="w-full max-w-sm rounded-2xl border border-white/80 bg-white/70 p-4 shadow-inner shadow-rose-100/80">
              <dl className="space-y-3">
                {meta.slice(0, 2).map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {item.label}
                    </dt>
                    <dd className="text-2xl font-bold text-slate-900">{item.value}</dd>
                    {item.hint && <p className="text-xs text-slate-500">{item.hint}</p>}
                  </div>
                ))}
              </dl>
            </div>
          )
        )}
      </div>

      {meta && meta.length > 0 && !actionSlot && meta.length > 2 && (
        <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-2">
          {meta.slice(2).map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/70 bg-white/60 p-4 text-sm shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
              <p className="mt-1 text-xl font-bold text-slate-800">{item.value}</p>
              {item.hint && <p className="text-xs text-slate-500">{item.hint}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 mt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">
          核心入口
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {QUICK_ENTRANCES.map((entrance) => {
            const isActive = entrance.href === activePath;
            return (
              <Link
                key={entrance.href}
                href={entrance.href}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex min-w-[12rem] flex-1 cursor-pointer flex-col rounded-2xl border px-4 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-pink-300 sm:flex-none ${
                  isActive
                    ? 'border-pink-400 bg-pink-600 text-white shadow-lg shadow-pink-200/50'
                    : 'border-white/70 bg-white/60 text-slate-700 hover:border-pink-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{entrance.label}</p>
                  <ArrowUpRight
                    className={`h-4 w-4 transition ${isActive ? 'text-white' : 'text-pink-400 group-hover:text-pink-500'}`}
                  />
                </div>
                <p className={`mt-1 text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                  {entrance.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {bottomSlot && <div className="relative z-10 mt-6">{bottomSlot}</div>}
    </section>
  );
};

export default PageHero;
