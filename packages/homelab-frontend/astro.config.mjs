import { defineConfig } from "astro/config"

import solidJs from "@astrojs/solid-js"

// https://astro.build/config
export default defineConfig({
  // eslint-disable-next-line no-undef
  base: process.env.PUBLIC_BASE_PATH || "/",
  integrations: [solidJs()],
  vite: {
    resolve: {
      noExternal: ["solid-icons"],
    },
  },
})
