import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
// 导入Next.js的Image组件
import Image from 'next/image';
import Footer from '../components/Footer';

interface LogoConfig {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  href?: string;
  className?: string;
  color?: string;
}

const logoConfigs: LogoConfig[] = [
];

export default function Home() {
  const [, setImagesLoaded] = useState(false);

  useEffect(() => {
    const preloadImages = async () => {
      const imageUrls = logoConfigs.map(logo => logo.src);

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
        console.log('图片预加载完成，但部分图片可能失败', error);
        setImagesLoaded(true);
      }
    };

    preloadImages();
  }, []);

  return (
    <>
      <Head>
        <title>✨ 魔法少女竞技场TRPG ✨</title>
        <meta name="description" content="为魔法少女竞技场 TRPG 打造的辅助工具" />
        {logoConfigs.map(logo => (
          <link
            key={logo.id}
            rel="preload"
            href={logo.src}
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
              欢迎来到魔法少女竞技场！
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {logoConfigs.filter(logo => logo.href).map((logo) => (
                <Link key={logo.id} href={logo.href!} className={`feature-button ${logo.className}`}>
                  <div className="gradient-overlay"></div>
                  <div className="feature-button-content">
                    <div className="feature-title-container">
                      <Image
                        src={logo.src}
                        width={logo.width}
                        height={logo.height}
                        alt={logo.alt}
                        className="feature-title-svg"
                        unoptimized={true}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#999', fontStyle: 'italic' }}>
                设定来源于小说《下班，然后变成魔法少女》以及网站“魔法少女生成器”
              </p>
            </div>
          </div>

          <Footer className="footer" />
        </div>
      </div>
    </>
  );
}