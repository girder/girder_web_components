import { defineConfig } from 'vite';
import { fileURLToPath } from 'url'
import vue from '@vitejs/plugin-vue2';
import envCompatible from 'vite-plugin-env-compatible';

// not needed after moving to vue3
import { VuetifyResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";

const isDemo = process.env.BUILD_DEMO === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        vue: 'vue/dist/vue.esm.js',
    },
    extensions: [
      '.mjs',
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.json',
      '.vue'
    ]
  },
  plugins: [
    vue({ jsx: true }),
    envCompatible(),
    Components({
      resolvers: [VuetifyResolver()],
      // Don't exclude girder web components
      exclude: [
        /[\\/]node_modules[\\/](?!(@girder[\\/]components[\\/]|\.pnpm[\\/]@girder.*))/,
        /[\\/]\.git[\\/]/,
        /[\\/]\.nuxt[\\/]/,
      ],
    })
  ],
  base: '/',
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
  }
})