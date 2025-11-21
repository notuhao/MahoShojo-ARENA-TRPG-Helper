// pages/dice.tsx

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DiceRoller from '../components/DiceRoller';
import Footer from '../components/Footer';

/**
 * @fileoverview 在线骰子工具的专属页面
 * @description 该页面为DiceRoller组件提供了一个独立的访问路由和基本的页面布局。
 */
const DicePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>在线骰子 - 魔法少女竞技场TRPG</title>
        <meta name="description" content="一个为《魔法少女竞技场》TRPG量身定制的在线d100骰子工具" />
      </Head>

      <div className="magic-background-white min-h-screen py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">在线骰子工具</h1>
            <p className="text-gray-600 mt-2">
              为《魔法少女竞技场》TRPG量身定制的便捷投骰器
            </p>
          </div>

          <DiceRoller />
          
          <div className="mt-12 text-center">
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