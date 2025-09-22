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
 * @fileoverview 魔法少女竞技场TRPG核心规则书页面 (v0.1.1 重构版)。
 * @description 
 * [V1.1] 修复了构建时出现的 a11y (可访问性) ESLint 错误。
 * [V0.1.1 重构]
 * - 实现了SRS v0.1.1中FR-6/UI-1的需求，重构了UI和交互。
 * - 桌面端侧边栏目录现在是可折叠的，并默认为折叠状态，以优化阅读空间。
 * - 移动端菜单功能保持不变。
 * - 优化了标题ID的生成逻辑，使其更健壮。
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
    return text.toLowerCase()
      .replace(/[^\w\s-]/g, '') // 移除非字母、数字、空格和连字符的字符
      .trim()
      .replace(/\s+/g, '-'); // 将空格替换为连字符
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
        <h3 className="font-bold text-gray-800 mb-2">目录</h3>
        <ul className="space-y-1">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={onLinkClick} // 点击时调用回调
                className={`block py-1 text-sm transition-colors ${
                  activeId === heading.id
                    ? 'text-purple-600 font-bold border-r-2 border-purple-600' // 高亮状态
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={{ paddingLeft: `${(heading.level - 1) * 1}rem` }}
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
        headingElementsRef.current.set(h.id, el);
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

        <main className="container mx-auto px-4 py-8">
          <div className="flex relative">
            {/* 【重构】桌面端可折叠侧边栏 */}
            <aside className={`hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out ${isDesktopSidebarOpen ? 'w-64 lg:w-72 mr-8' : 'w-0'}`}>
              <div className={`sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto ${isDesktopSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                <RulebookSidebar headings={headings} activeId={activeId} />
              </div>
            </aside>
            
            {/* 【新增】桌面端侧边栏开关按钮 */}
            <div className="hidden md:block">
                <button 
                    onClick={() => setDesktopSidebarOpen(!isDesktopSidebarOpen)}
                    className="fixed top-1/2 -translate-y-1/2 bg-white p-2 rounded-r-lg shadow-lg border border-l-0 z-30 transition-transform duration-300 ease-in-out"
                    style={{ left: isDesktopSidebarOpen ? '17rem' : '1rem' }} /* 272px = 17rem */
                    aria-label={isDesktopSidebarOpen ? "折叠目录" : "展开目录"}
                >
                    {isDesktopSidebarOpen ? <ChevronsLeft size={20} /> : <ChevronsRight size={20} />}
                </button>
            </div>

            <article className="prose max-w-none w-full">
              <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </article>
          </div>
        </main>
        
        <Footer />
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