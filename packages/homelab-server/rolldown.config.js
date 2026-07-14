import { defineConfig } from "rolldown"
import { esmExternalRequirePlugin } from "rolldown/plugins"

const stubOptionalNative = {
  name: "stub-optional-native",
  resolveId(id) {
    if (id === "bufferutil" || id === "utf-8-validate") {
      return { id, external: false }
    }
  },
  load(id) {
    if (id === "bufferutil" || id === "utf-8-validate") {
      return "module.exports = undefined;"
    }
  },
}

export default defineConfig({
  input: "./src/main.ts",
  output: { dir: "./dist/bundle" },
  platform: "node",
  plugins: [
    stubOptionalNative,
    esmExternalRequirePlugin(),
  ],
})
