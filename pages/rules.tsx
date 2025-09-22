// pages/rules.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GetStaticProps, NextPage } from 'next';
import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Footer from '../components/Footer';
import { Menu, X } from 'lucide-react';

/**
 * @fileoverview 魔法少女竞技场TRPG核心规则书页面。
 * @description 
 * [V1.1] 修复了构建时出现的 a11y (可访问性) ESLint 错误。
 * 1. 明确传递 children 给自定义标题组件，以解决 `heading-has-content` 问题。
 * 2. 为移动端菜单的遮罩层 div 添加了 role 和 onKeyDown 属性，以解决 `click-events-have-key-events` 和 `no-static-element-interactions` 问题。
 * 3. 优化了标题ID的生成逻辑，使其更健壮。
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
  onLinkClick?: () => void; // 新增回调，用于在移动端点击后关闭菜单
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
                    ? 'text-purple-600 font-bold'
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
  
  // 使用useRef来持有IntersectionObserver实例，防止重复创建
  const observer = useRef<IntersectionObserver | null>(null);
  
  // 存储标题元素的引用，避免在useEffect中重复查询DOM
  const headingElementsRef = useRef<Map<string, Element>>(new Map());

  // 使用IntersectionObserver实现滚动时高亮当前章节
  useEffect(() => {
    // 清理旧的observer
    if (observer.current) {
      observer.current.disconnect();
    }
  
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
        // 从上到下找到第一个在视口内的标题并高亮它
        const intersectingEntries = entries.filter(e => e.isIntersecting);
        if (intersectingEntries.length > 0) {
            // entries是按DOM顺序排列的，所以第一个就是最上面的
            setActiveId(intersectingEntries[0].target.id);
        }
    };
  
    observer.current = new IntersectionObserver(handleObserver, {
      rootMargin: '0px 0px -80% 0px', // 在视口顶部20%的区域内寻找标题
      threshold: 1.0,
    });
  
    // 填充引用Map并观察元素
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


  // **[FIXED]** 自定义Markdown组件渲染，解决 a11y 问题
  // 我们显式地传递 children，并使用更健壮的方式从 children 中提取文本来生成ID
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
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0">
              <div className="sticky top-24"> {/* 增加粘性定位的偏移量 */}
                <RulebookSidebar headings={headings} activeId={activeId} />
              </div>
            </aside>

            <article className="prose lg:prose-lg max-w-none w-full">
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
          {/* **[FIXED]** 为遮罩层添加 role 和 onKeyDown，解决 a11y 问题 */}
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

// --- 数据获取 ---

export const getStaticProps: GetStaticProps<RulebookPageProps> = async () => {
  const filePath = path.join(process.cwd(), 'lib', 'trpg', 'rulebook.md');
  const content = fs.readFileSync(filePath, 'utf8');

  // **[IMPROVED]** 优化标题ID生成逻辑
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