import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import fs from 'node:fs';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./resources', import.meta.url))
    },
  },
  envPrefix: ['APP_'],
  publicDir: 'resources/public',
  server: {
    host: '0.0.0.0',
    https: {
    //   key: fs.readFileSync('server/ssl/socket.key'),
    //   cert: fs.readFileSync('server/ssl/socket.crt'),
      key: fs.readFileSync('server/ssl/localhost.key'),
      cert: fs.readFileSync('server/ssl/localhost.crt'),
    }
  },
  build: {
    outDir: 'public',
    minify: 'esbuild',
  },
  esbuild: {
    // Remove the console from the production
    // environment and keep the error
    drop: ['debugger'],
    pure: ['console.log', 'console.info']
  },
});
