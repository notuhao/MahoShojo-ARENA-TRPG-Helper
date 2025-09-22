// @ts-check

/**
 * @type {import("open-next").OpenNextConfig}
 * * OpenNext 是一个将 Next.js 应用打包以适配多种 Serverless 环境（如 AWS Lambda, Cloudflare Workers）的工具。
 * 这个配置文件 `open-next.config.ts` 的主要作用是为 OpenNext 的构建过程提供指令。
 *
 * [V1.1 更新]
 * 新增了一个独立的函数配置 `apiEdge`，用于处理声明了 Edge Runtime 的 API 路由。
 * 这是解决 Cloudflare 部署时 "cannot use the edge runtime" 错误的关键。
 * OpenNext 要求 Edge 函数和 Serverless 函数（Node.js）必须被打包到不同的函数包中。
 *
 * 配置结构解释:
 * 1. `default`: 这是默认的函数包，用于处理所有未被其他配置项匹配的路由。它将作为标准的 Node.js serverless function 运行。
 * 2. `apiEdge`: 这是我们为 Edge 函数新增的自定义函数包。
 * - `routes`: 指定了这个函数包要处理的URL路径。
 * - `override.runtime`: 明确告诉 OpenNext，这个包内的函数需要以 'edge' 模式运行。
 */
const config = {
  // 默认函数包，处理所有非Edge的路由
  default: {
    override: {
      // 此处留空，以采用 OpenNext 的默认构建行为。
    },
  },

  // 为我们的AI Edge API创建一个独立的函数包
  apiEdge: {
    // 明确指定此配置应用于哪个路由
    routes: ["/api/ai/create-character"],
    override: {
      // 告诉OpenNext这个函数包需要使用Edge Runtime
      runtime: "edge",
    },
  },
};

export default config;