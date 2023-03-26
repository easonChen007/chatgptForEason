import { defineConfig } from "astro/config"
import vercel from "@astrojs/vercel/edge"
import unocss from "unocss/astro"
import {
  presetUno,
  presetIcons,
  presetAttributify,
  presetTypography
} from "unocss"
import solidJs from "@astrojs/solid-js"

// https://astro.build/config

export default defineConfig({
  vite: {
    build: {
      chunkSizeWarningLimit: 1000, // 设置警告限制为 800 KB
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              const arr = id.toString().split("node_modules/")[1].split("/")
              if (arr[1].includes("markdown")) return "__markdown"
              if (arr[1].includes("highlight")) return "__highlight"
              if (arr[1].includes('leancloud')) return '__leancloud'
              return "__vendor"
            }
          }
        }
      }
    },
    optimizeDeps: {
      exclude: ["leancloud-storage/av-live*"], // 根据实际文件路径排除 a.js
    },

  },
  integrations: [
    unocss({
      presets: [
        presetAttributify(),
        presetUno(),
        presetTypography({
          cssExtend: {
            ":not(pre) > code::before,:not(pre) > code::after": ""
          }
        }),
        presetIcons()
      ]
    }),
    solidJs()
  ],
  output: "server",
  adapter: vercel()
})
