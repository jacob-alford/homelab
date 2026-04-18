import { defineConfig } from "rolldown"
import { esmExternalRequirePlugin } from "rolldown/plugins"

export default defineConfig({
  input: "./src/main.ts",
  output: { file: "./dist/bundle.js" },
  platform: "node",
  plugins: [
    esmExternalRequirePlugin({
      external: ["bufferutil", "utf-8-validate"],
    }),
  ],
})
