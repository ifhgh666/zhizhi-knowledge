import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base 用相对路径：GitHub Pages 的地址是 https://<用户名>.github.io/<仓库名>/，
// 相对路径在任何子路径下都能正确加载资源和 data/*.json。
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: { outDir: 'dist', emptyOutDir: true },
})
