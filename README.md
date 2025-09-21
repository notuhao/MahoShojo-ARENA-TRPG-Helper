# 魔法少女竞技场TRPG - 辅助工具站 (MahoShojo A.R.E.N.A. Helper)

[](https://mahoshojo-arena-trpg.pages.dev)

这是一个为桌面角色扮演游戏（TRPG）《魔法少女竞技场》（MahoShojo A.R.E.N.A.）打造的辅助工具项目。旨在为玩家和游戏主持人（GM）提供一套便捷的在线辅助工具，以简化游戏准备流程、提升游戏体验。

本工具基于《下班，然后变成魔法少女》以及“魔法少女生成器”世界观，核心规则参考《魔法少女竞技场 (MahoShojo A.R.E.N.A.) 核心规则书》。

**线上访问地址:** [https://mahoshojo-arena-trpg.pages.dev](https://mahoshojo-arena-trpg.pages.dev)  

## ✨ 主要功能（规划）

  * **网页版规则书**: 提供完整、易于导航和搜索的在线核心规则书。
  * **交互式角色创建器**:
      * **属性分配**: 引导用户分配核心属性，计算角色所使用的点数花费，并提供角色强度评价与合法性校验。
      * **衍生值自动计算**: 自动计算生命值(HP)、魔力值(MP)、伤害加值(DB)等衍生数值。
      * **技能点分配**: 交互式分配技能点，实时显示最终成功率。
      * **能力构筑**: 通过点数购买（Point-Buy）系统，自由组合效果标签和修正标签，创造独一无二的角色能力。
      * **角色卡导出**: 支持将最终完成的角色卡导出为JSON或图片格式，方便查阅和分享。
  * **AI辅助工具**：向AI描述你想要创建的角色（可以只用几句话简略描述，也可以上传一整个角色文档），由AI来创建符合规范的角色。
  * **“魔法少女生成器”公开数据查询**：查询和下载MahoShojo-Generator（魔法少女生成器）公开数据库中的内容，并可用于AI辅助创建角色。
  * **图鉴查询**：查询TRPG项目中储存的图鉴信息，例如物品、地点、人物、组织等等。
  * **模组与资源下载**: 提供社区创作的剧本模组和游戏资源的下载入口。
  * **实用小工具**: 如在线骰子、状态速查表等。

## 🛠️ 技术栈

本项目采用现代化的 Jamstack 架构，以确保极致的性能和优秀的用户体验。

  * **框架**: [Next.js](https://nextjs.org/)
  * **UI库**: [React](https://react.dev/)
  * **语言**: [TypeScript](https://www.typescriptlang.org/)
  * **CSS框架**: [Tailwind CSS](https://tailwindcss.com/)
  * **部署**: [Cloudflare Pages](https://pages.cloudflare.com/)

## 🚀 本地开发指南

如果你希望在本地运行此项目，请遵循以下步骤：

**1. 环境准备**

确保你的电脑上已经安装了以下软件：

  * [Node.js](https://nodejs.org/) (建议使用 v18 或更高版本的 LTS)
  * [Git](https://git-scm.com/)

**2. 克隆项目**

```bash
git clone https://github.com/notuhao/MahoShojo-ARENA-TRPG-Helper
cd MahoShojo-ARENA-TRPG-Helper
```

**3. 安装依赖**

本项目使用 `npm` 作为包管理器。

```bash
npm install
```

**4. 启动本地开发服务器**

```bash
npm run dev
```

**5. 开始使用**

在浏览器中打开 [http://localhost:3000](http://localhost:3000)，你就可以看到正在本地运行的网站了。所有代码修改都会自动热更新，无需手动刷新页面。

## ☁️ 部署

本项目已配置为通过 Cloudflare Pages 进行持续集成与部署 (CI/CD)。

任何时候，当新的代码被推送到 `main` 分支时，Cloudflare 将会自动拉取最新代码、执行构建流程，并将新版本无缝部署到线上。

## 🤝 贡献

欢迎任何形式的贡献！如果你发现了 Bug 或有任何功能建议，请随时提交一个 Issue。