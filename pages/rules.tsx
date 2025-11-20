// 文件: pages/rules.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticProps, NextPage } from 'next';
import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Footer from '../components/Footer';
import PageHero from '@/components/PageHero';
import { BookOpenCheck, Menu, X } from 'lucide-react';

/**
 * @fileoverview 魔法少女竞技场TRPG核心规则书页面 (v0.1.3 修正版)。
 * @description
 * - generateHeadingId 支持中文锚点，任何语言标题都能被正确索引。
 * - 新版本页面采用统一粉色背景与 PageHero 抬头，便于跨页面导航。
 */

interface Heading {
  level: number;
  text: string;
  id: string;
}

interface RulebookPageProps {
  content: string;
  headings: Heading[];
}

// --- 辅助函数：为标题生成ID ---
const generateHeadingId = (text: string) => {
  return encodeURIComponent(text);
};

interface RulebookSidebarProps {
  headings: Heading[];
  activeId: string;
  onLinkClick?: () => void;
}

const RulebookSidebar: React.FC<RulebookSidebarProps> = ({ headings, activeId, onLinkClick }) => {
  return (
    <nav className="space-y-4">
      <div>
        <h3 className="mb-2 px-2 text-sm font-bold text-pink-600">章节导航</h3>
        <ul className="space-y-1">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={onLinkClick}
                className={`block rounded-xl border-l-4 py-1 text-sm transition-colors ${
                  activeId === heading.id
                    ? 'border-pink-500 bg-pink-50 font-semibold text-pink-600'
                    : 'border-transparent text-slate-600 hover:border-pink-200 hover:bg-white'
                }`}
                style={{ paddingLeft: `${(heading.level - 1) * 1 + 0.5}rem` }}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

const RulebookPage: NextPage<RulebookPageProps> = ({ content, headings }) => {
  const [activeId, setActiveId] = useState<string>(headings.length > 0 ? headings[0].id : '');
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const intersectingEntries = entries.filter((entry) => entry.isIntersecting);
      if (intersectingEntries.length > 0) {
        setActiveId(intersectingEntries[0].target.id);
      }
    };

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '0px 0px -80% 0px',
      threshold: 1.0,
    });

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  const components = {
    h1: ({ node, children, ...props }: any) => {
      const text = React.Children.toArray(children).join('');
      const id = generateHeadingId(text);
      return (
        <h1 id={id} {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ node, children, ...props }: any) => {
      const text = React.Children.toArray(children).join('');
      const id = generateHeadingId(text);
      return (
        <h2 id={id} {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ node, children, ...props }: any) => {
      const text = React.Children.toArray(children).join('');
      const id = generateHeadingId(text);
      return (
        <h3 id={id} {...props}>
          {children}
        </h3>
      );
    },
    h4: ({ node, children, ...props }: any) => {
      const text = React.Children.toArray(children).join('');
      const id = generateHeadingId(text);
      return (
        <h4 id={id} {...props}>
          {children}
        </h4>
      );
    },
  };

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const scrollToContent = useCallback(() => {
    const target = document.getElementById('rulebook-content');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const chapterCount = headings.filter((heading) => heading.level === 1).length;
  const heroMeta = [
    { label: '主章节', value: `${chapterCount} 章` },
    { label: '锚点总数', value: `${headings.length}` },
    { label: '当前版本', value: 'v0.1.3', hint: 'rulebook.md 最新修订' },
  ];

  const heroAction = (
    <div className="rounded-2xl border border-pink-100 bg-white/90 p-4 text-sm shadow-inner shadow-rose-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">阅读指引</p>
      <p className="mt-2 text-slate-600">
        建议先通读第3/5/6章以掌握混合判定与战斗循环，再结合角色卡与AI GM进行演练。
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-300 transition hover:bg-pink-500"
        >
          <Menu className="h-4 w-4" />
          打开移动目录
        </button>
        <button
          type="button"
          onClick={scrollToContent}
          className="flex items-center justify-center gap-2 rounded-2xl border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-pink-600 transition hover:bg-pink-50"
        >
          <BookOpenCheck className="h-4 w-4" />
          跳到正文
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>核心规则书 - 魔法少女竞技场TRPG</title>
        <meta name="description" content="在线查阅《魔法少女竞技场》TRPG核心规则书" />
      </Head>

      <div className="magic-background-white min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <PageHero
            title="核心规则书 · RULEBOOK"
            description="实时同步 The Bible（第3/5/6章为 AI GM 的必读核心），支持移动目录与章节锚点跳转。"
            activePath="/rules"
            meta={heroMeta}
            actionSlot={heroAction}
          />

          <div className="mt-10 grid gap-8 md:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="hidden md:block">
              <div className="sticky top-28 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur">
                <RulebookSidebar headings={headings} activeId={activeId} />
              </div>
            </aside>

            <main>
              <article
                id="rulebook-content"
                className="prose prose-slate max-w-none rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-rose-100/50"
              >
                <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </article>

              <div className="mt-10">
                <Footer />
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* 移动端抽屉式菜单 */}
      <div
        className={`fixed inset-0 z-50 transform bg-black/0 transition md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={closeMobileMenu}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') closeMobileMenu();
          }}
          role="button"
          tabIndex={0}
          aria-label="关闭目录"
        ></div>
        <div className="relative ml-auto flex h-full w-72 flex-col bg-white p-6 shadow-2xl">
          <button onClick={closeMobileMenu} className="self-end p-2" aria-label="关闭目录">
            <X className="h-6 w-6 text-gray-700" />
          </button>
          <div className="mt-4 overflow-y-auto">
            <RulebookSidebar headings={headings} activeId={activeId} onLinkClick={closeMobileMenu} />
          </div>
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps<RulebookPageProps> = async () => {
  const filePath = path.join(process.cwd(), 'lib', 'trpg', 'rulebook.md');
  const content = fs.readFileSync(filePath, 'utf8');

  const headingLines = content.match(/^#+\s+.*/gm) || [];
  const headings: Heading[] = headingLines.map((line) => {
    const level = line.match(/^#+/)![0].length;
    const text = line.replace(/^#+\s*/, '');
    const id = generateHeadingId(text);
    return { level, text, id };
  });

  return {
    props: {
      content,
      headings,
    },
  };
};

export default RulebookPage;
