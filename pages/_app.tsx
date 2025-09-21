import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import '@/styles/globals.css';
import '@/styles/blue-theme.css';
import '@/styles/gradient-buttons.css';
// 1. 引入新组件

// 如果需要统计，请取消注释并安装 @vercel/analytics
// import { Analytics } from "@vercel/analytics/next";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isDetailsPage = router.pathname === '/details' || router.pathname === '/canshou';
  // 2. 增加一个判断，用于在逮捕页隐藏公告
  const isArrestedPage = router.pathname === '/arrested';

  return (
    <>
      <Head>
        <title>✨ 魔法少女竞技场TRPG ✨</title>
        <meta name="description" content="魔法少女TRPG辅助工具" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <div className={isDetailsPage ? 'blue-theme' : ''}>
        <Component {...pageProps} />
      </div>
    </>
  );
}