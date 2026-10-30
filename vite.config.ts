import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      // Split vendor libraries into cacheable chunks so app-code updates
      // re-download only kilobytes on exhibition-day school Wi-Fi
      rolldownOptions: {
        output: {
          advancedChunks: {
            groups: [
              { name: 'three', test: /node_modules[\\/]three/ },
              { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ }
            ]
          }
        }
      }
    }
  };
});
