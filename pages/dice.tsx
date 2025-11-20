// pages/dice.tsx

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DiceRoller from '../components/DiceRoller';
import Footer from '../components/Footer';
import PageHero from '@/components/PageHero';

/**
 * @fileoverview 在线骰子工具的专属页面
 * @description 该页面为DiceRoller组件提供了一个独立的访问路由和基本的页面布局。
 */
const DicePage: React.FC = () => {
  const diceMeta = [
    { label: '骰种覆盖', value: 'd4 ~ d100' },
    { label: '历史记录', value: '最近 10 条' },
    { label: '奖励/惩罚', value: '原生支持', hint: 'd100 专用双十位判定' },
  ];

  return (
    <>
      <Head>
        <title>在线骰子 - 魔法少女竞技场TRPG</title>
        <meta name="description" content="一个为《魔法少女竞技场》TRPG量身定制的在线d100骰子工具" />
      </Head>

      <div className="magic-background-white min-h-screen py-10">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <PageHero
            title="在线骰子 · DICE TERMINAL"
            description="覆盖 d4~d100、原生 d100 奖励/惩罚骰与成功等级判定，支持备注与投掷历史。"
            activePath="/dice"
            meta={diceMeta}
          />

          <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-rose-100/50">
            <DiceRoller />
          </div>

          <div className="text-center text-sm">
            <Link href="/" className="text-purple-600 hover:underline">
              &larr; 返回首页
            </Link>
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
};

export default DicePage;
