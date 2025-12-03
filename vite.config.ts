import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  // 开发服务器配置
  server: {
    port: 5173,
    strictPort: false  // 端口被占用时自动递增
  },

  // 路径别名配置
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },

  // 库模式打包配置
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Stream2md',
      fileName: (format) => `stream2md.${format}.js`
    },
    rollupOptions: {
      // 确保外部化处理不想打包进库的依赖
      external: ['vue'],
      output: {
        // 在 UMD 构建模式下为外部化的依赖提供全局变量
        globals: {
          vue: 'Vue'
        },
        // 使用 named 导出，避免 default 导出警告
        exports: 'named'
      }
    }
  },

  // SCSS 配置
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables" as *;`
      }
    }
  }
})
