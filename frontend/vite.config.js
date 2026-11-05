import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    // Bỏ qua cảnh báo strict để build thành công
    rollupOptions: {
      onwarn(warning, warn) {
        return; // Bỏ qua toàn bộ cảnh báo rollup
      }
    }
  }
});