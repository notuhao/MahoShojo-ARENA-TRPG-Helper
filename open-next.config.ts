// @ts-check
import type { OpenNextConfig } from "open-next/types";

/**
 * @type {OpenNextConfig}
 */
const config: OpenNextConfig = {
  default: {
    override: {
      // OpenNext 默认会查找并执行 `build` 脚本 (即 `next build`)。
      // 由于我们的 package.json 中已经配置了 "build": "next build --turbopack",
      // OpenNext 会自动使用它。
      // 因此，这里我们保留一个空对象来使用默认行为，
      // 这个文件的存在本身就是为了防止 OpenNext 进入交互模式。
    },
  },
};

export default config;