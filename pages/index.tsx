// pages/index.tsx

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '../components/Footer';

// 定义功能入口的配置信息
interface FeatureConfig {
  id: string;
  title: string;
  description: string;
  href: string;
  className: string;
  iconSrc: string;
  isExternal?: boolean; // 【新增】用于标记外部链接的字段
}

// 功能列表配置
const featureConfigs: FeatureConfig[] = [
  {
    id: 'character-creator',
    title: '交互式角色创建器',
    description: '引导式创建、自动计算、构筑独一无二的魔法少女。',
    href: '/character/create',
    className: 'creator-card',
    iconSrc: '/mahou-title.svg',
  },
  {
    id: 'rulebook',
    title: '在线核心规则书',
    description: '随时查阅《魔法少女竞技场》的核心规则与设定。',
    href: '/rules',
    className: 'rules-card',
    iconSrc: '/scenario.svg',
  },
  {
    id: 'dice-roller',
    title: '在线骰子工具',
    description: '内置d100判定和奖惩骰规则的便捷投骰器。',
    href: '/dice',
    className: 'dice-roller-card',
    iconSrc: '/file.svg', 
  },
  // 【指向魔法少女生成器的外部链接入口
  {
    id: 'mahoshojo-generator',
    title: '前往魔法少女生成器',
    description: '源项目，快速生成包含背景、故事和立绘的角色。',
    href: 'https://mahoshojo.colanns.me',
    className: 'generator-link-card',
    iconSrc: '/logo.svg', // 使用生成器的Logo作为图标
    isExternal: true,
  },
];

export default function Home() {
  const [, setImagesLoaded] = useState(false);

  // 预加载功能卡片的图标，提升用户体验
  useEffect(() => {
    const preloadImages = async () => {
      const imageUrls = featureConfigs.map(config => config.iconSrc);
      const imagePromises = imageUrls.map(url => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });
      });

      try {
        await Promise.all(imagePromises);
        setImagesLoaded(true);
      } catch (error) {
        console.log('部分图片预加载失败', error);
        setImagesLoaded(true); // 即使部分失败也继续渲染
      }
    };
    preloadImages();
  }, []);

  return (
    <>
      <Head>
        <title>✨ 魔法少女竞技场TRPG - 辅助工具 ✨</title>
        <meta name="description" content="为魔法少女竞技场 TRPG 打造的辅助工具" />
        {featureConfigs.map(config => (
          <link
            key={config.id}
            rel="preload"
            href={config.iconSrc}
            as="image"
            type="image/svg+xml"
          />
        ))}
      </Head>
      <div className="magic-background-white">
        <div className="container">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}>
              <Image
                src="/logo.svg"
                width={280}
                height={180}
                alt="魔法少女竞技场TRPG"
                unoptimized={true}
              />
            </div>

            <p className="subtitle text-center mb-4">
              欢迎来到A.R.E.N.A.辅助工具站，选择一个工具开始你的冒险吧！
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {featureConfigs.map((config) => (
                <Link 
                  key={config.id} 
                  href={config.href} 
                  passHref
                  // 根据 isExternal 标志决定是否在新标签页打开
                  target={config.isExternal ? "_blank" : undefined}
                  rel={config.isExternal ? "noopener noreferrer" : undefined}
                  style={{ textDecoration: 'none' }}
                >
                  <div className={`feature-button ${config.className}`}>
                    <div className="gradient-overlay"></div>
                    <div className="feature-button-content !p-6">
                      <div className="flex items-center w-full">
                        <div className="flex-shrink-0">
                          <Image
                            src={config.iconSrc}
                            width={48}
                            height={48}
                            alt={config.title}
                            className="feature-title-svg"
                            unoptimized={true}
                          />
                        </div>
                        <div className="ml-4 text-left">
                          <h3 className="text-lg font-bold text-gray-800">{config.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#999', fontStyle: 'italic' }}>
                设定来源于小说《下班，然后变成魔法少女》以及“魔法少女生成器”
              </p>
            </div>
          </div>

          <Footer className="footer" />
        </div>
      </div>
    </>
  );
}