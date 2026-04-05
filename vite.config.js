import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 项目站地址为 https://<用户>.github.io/<仓库名>/ ，构建时需设置 VITE_BASE_PATH=/<仓库名>/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
});
