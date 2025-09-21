// @ts-check

/**
 * @type {import("open-next").OpenNextConfig}
 *
 * OpenNext 是一个将 Next.js 应用打包以适配多种 Serverless 环境（如 AWS Lambda, Cloudflare Workers）的工具。
 * 这个配置文件 `open-next.config.ts` 的主要作用是为 OpenNext 的构建过程提供指令。
 *
 * 关键点：
 * 1.  **防止交互模式**：在 Cloudflare Pages 这样的 CI/CD 环境中，构建过程必须是非交互的。
 * 如果 OpenNext 在构建时找不到这个配置文件，它会进入一个交互式的命令行向导，询问是否要创建一个。
 * 这会导致构建过程挂起并最终失败。因此，即使我们使用默认配置，这个文件的存在本身就是至关重要的。
 * 2.  **默认构建命令**：OpenNext 默认会智能地查找并执行项目 `package.json` 文件中 "scripts" 下的 "build" 命令。
 * 在我们的项目中，"build" 命令是 "next build"，OpenNext 会自动使用它来构建 Next.js 应用。
 * 3.  **override 配置**：`override` 字段允许我们覆盖 OpenNext 的默认行为。
 * 但在这里，我们希望使用默认的构建流程，所以保留一个空对象 `{}` 即可。
 *
 * 总结：这个文件的核心目的就是告诉 OpenNext：“请使用默认配置，不要提问”，从而确保自动化部署流程的顺利进行。
 */
const config = {
  default: {
    override: {
      // 此处留空，以采用 OpenNext 的默认构建行为。
    },
  },
};

export default config;