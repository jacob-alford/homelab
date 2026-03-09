import { defineConfig } from "rolldown"

export default defineConfig({
  input: "./src/main.ts",
  output: "./dist/bundle.js",
  platform: "node",
})
