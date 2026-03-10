import { defineConfig } from "rolldown"

export default defineConfig({
  input: "./src/main.ts",
  output: { file: "./dist/bundle.js" },
  platform: "node",
})
