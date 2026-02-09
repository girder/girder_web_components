import dts from 'vite-plugin-dts';
import svgLoader from 'vite-svg-loader';
import Vue from '@vitejs/plugin-vue';
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const isDemo = process.env.BUILD_DEMO === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svgLoader(),
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
    }),
    dts({
      insertTypesEntry: true,
    }),
  ],
  optimizeDeps: {
    exclude: [
      'vuetify',
    ],
  },
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
  },
  build: isDemo
    ? {
        outDir: '_site',
        emptyOutDir: true,
        rollupOptions: {
          input: 'demo/main.js',
        },
      }
    : {
    lib: {
      entry: 'src/index.js',
      name: 'girder',
      fileName: (format) => `girder.${format}.js`,
      formats: ['es', 'cjs', 'umd'],
    },
    rollupOptions: {
      external: ['vue', 'vuetify'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          vuetify: 'Vuetify'
        }
      }
    },
    sourcemap: true,
    minify: true
  },
})
