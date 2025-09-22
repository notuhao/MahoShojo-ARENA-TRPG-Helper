// 文件: pages/rules.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GetStaticProps, NextPage } from 'next';
import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Footer from '../components/Footer';
import { Menu, X, ChevronsRight, ChevronsLeft } from 'lucide-react';

/**
 * @fileoverview 魔法少女竞技场TRPG核心规则书页面 (v0.1.3 修正版)。
 * @description 
 * - [核心修正] 修复了 generateHeadingId 函数的逻辑错误。旧函数会移除中文字符，导致纯中文标题的锚点链接失效。
 * - 新函数采用 encodeURIComponent，可以为任何文本（包括中文和特殊符号）生成一个稳定、有效的URL锚点ID。
 */

// --- 类型定义 ---

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
    /**
     * 【核心修正】
     * 使用 encodeURIComponent 来确保任何文本（包括中文）都能生成一个有效的、唯一的URL片段标识符。
     * 这是最稳健的处理方式，可以避免手动处理各种特殊字符和语言的复杂性。
     */
    return encodeURIComponent(text);
}

// --- 侧边栏导航组件 ---

interface RulebookSidebarProps {
  headings: Heading[];
  activeId: string;
  onLinkClick?: () => void; // 用于在移动端点击后关闭菜单
}

const RulebookSidebar: React.FC<RulebookSidebarProps> = ({ headings, activeId, onLinkClick }) => {
  return (
    <nav className="space-y-4">
      <div>
        <h3 className="font-bold text-gray-800 mb-2 px-2">目录</h3>
        <ul className="space-y-1">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={onLinkClick}
                className={`block py-1 text-sm transition-colors border-l-4 ${
                  activeId === heading.id
                    ? 'text-purple-600 font-bold border-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-100'
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

// --- 主页面组件 ---

const RulebookPage: NextPage<RulebookPageProps> = ({ content, headings }) => {
  const [activeId, setActiveId] = useState<string>(headings.length > 0 ? headings[0].id : '');
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  // 【新增】桌面端侧边栏状态
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(false);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const headingElementsRef = useRef<Map<string, Element>>(new Map());

  useEffect(() => {
    if (observer.current) {
      observer.current.disconnect();
    }
  
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const intersectingEntries = entries.filter(e => e.isIntersecting);
      if (intersectingEntries.length > 0) {
        setActiveId(intersectingEntries[0].target.id);
      }
    };
  
    observer.current = new IntersectionObserver(handleObserver, {
      rootMargin: '0px 0px -80% 0px',
      threshold: 1.0,
    });
  
    headingElementsRef.current.clear();
    headings.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) {
        observer.current?.observe(el);
      }
    });
  
    return () => observer.current?.disconnect();
  }, [headings]);


  const components = {
    h1: ({ node, children, ...props }: any) => {
      const text = React.Children.toArray(children).join('');
      const id = generateHeadingId(text);
      return <h1 id={id} {...props}>{children}</h1>;
    },
    h2: ({ node, children, ...props }: any) => {
      const text = React.Children.toArray(children).join('');
      const id = generateHeadingId(text);
      return <h2 id={id} {...props}>{children}</h2>;
    },
    h3: ({ node, children, ...props }: any) => {
      const text = React.Children.toArray(children).join('');
      const id = generateHeadingId(text);
      return <h3 id={id} {...props}>{children}</h3>;
    },
    h4: ({ node, children, ...props }: any) => {
      const text = React.Children.toArray(children).join('');
      const id = generateHeadingId(text);
      return <h4 id={id} {...props}>{children}</h4>;
    },
  };

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <>
      <Head>
        <title>核心规则书 - 魔法少女竞技场TRPG</title>
        <meta name="description" content="在线查阅《魔法少女竞技场》TRPG核心规则书" />
      </Head>

      <div className="bg-gray-50 min-h-screen">
        <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-40">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link href="/" className="text-lg font-bold text-gray-800 hover:text-purple-600 transition-colors">
                 ✨ 魔法少女竞技场TRPG
                </Link>
                <div className="hidden md:block">
                  <Link href="/character/create" className="text-gray-600 hover:text-purple-600">
                    角色创建器
                  </Link>
                </div>
                <div className="md:hidden">
                    <button onClick={() => setMobileMenuOpen(true)} className="p-2" aria-label="打开目录">
                        <Menu className="h-6 w-6 text-gray-700" />
                    </button>
                </div>
            </div>
        </header>

        {/* --- 桌面端侧边栏与内容区 --- */}
        <div className="hidden md:block">
            {/* 侧边栏，使用 fixed 定位 */}
            <aside className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-white/80 backdrop-blur-sm border-r z-30 transform transition-transform duration-300 ease-in-out ${isDesktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="h-full overflow-y-auto pt-6 pb-12">
                <RulebookSidebar headings={headings} activeId={activeId} />
              </div>
            </aside>

            {/* 侧边栏开关按钮，使用 fixed 定位 */}
            <button 
                onClick={() => setDesktopSidebarOpen(!isDesktopSidebarOpen)}
                className="fixed top-1/2 -translate-y-1/2 bg-white p-1 rounded-r-lg shadow-lg border border-l-0 z-30 transition-all duration-300 ease-in-out"
                style={{ left: isDesktopSidebarOpen ? '18rem' : '0rem' }} // 18rem = 72 * 0.25rem
                aria-label={isDesktopSidebarOpen ? "折叠目录" : "展开目录"}
            >
                {isDesktopSidebarOpen ? <ChevronsLeft size={20} /> : <ChevronsRight size={20} />}
            </button>
        </div>

        {/* 主内容区 */}
        <main className={`transition-all duration-300 ease-in-out ${isDesktopSidebarOpen ? 'md:ml-72' : 'md:ml-0'}`}>
          <div className="container mx-auto px-4 py-8">
            <article className="prose max-w-none w-full">
              <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </article>
          </div>
          <Footer />
        </main>
      </div>

       {/* 移动端抽屉式菜单 */}
       <div 
        className={`fixed inset-0 z-50 transition-transform transform ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden`}
      >
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={closeMobileMenu}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') closeMobileMenu();
            }}
            role="button"
            tabIndex={0}
            aria-label="关闭目录"
          ></div>
          <div className="relative w-72 h-full bg-white ml-auto p-6 flex flex-col shadow-lg">
              <button onClick={closeMobileMenu} className="self-end mb-4 p-2" aria-label="关闭目录">
                  <X className="h-6 w-6 text-gray-700" />
              </button>
              <div className="overflow-y-auto">
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
  const headings: Heading[] = headingLines.map(line => {
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