// @ts-check

/**
 * @type {import("open-next").OpenNextConfig}
 * * [V1.2 更新]
 * 由于已将所有API路由统一为Node.js Runtime，不再需要为Edge函数进行特殊配置。
 * 我们现在可以依赖OpenNext的默认行为来处理所有函数。
 */
const config = {
  default: {
    override: {
      // 此处留空，以采用 OpenNext 的默认构建行为。
    },
  },
};

export default config;