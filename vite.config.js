import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve, extname, basename } from 'path';

function nodeModulesJsx() {
  return {
    name: 'node-modules-jsx',
    async transform(code, id) {
      const cleanId = id.split('?')[0];
      if (!cleanId.includes('node_modules')) return null;
      if (!cleanId.endsWith('.js')) return null;
      const NEEDS_TRANSFORM = [
        'react-native-web',
        '@react-native',
        'react-native/',
      ];
      if (!NEEDS_TRANSFORM.some(pkg => cleanId.includes(pkg))) return null;
      return transformWithEsbuild(code, id, {
        loader: 'jsx',
        jsx:    'automatic',
        format: 'esm',
        target: 'esnext',
      });
    },
  };
}

export default defineConfig({
  base: '/',
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    '__DEV__': false,
    'global': 'globalThis',
  },
  plugins: [nodeModulesJsx(), react(), tailwindcss()],
  resolve: {
    alias: [
      { find: 'react-native', replacement: resolve('./node_modules/react-native-web') },
    ],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'lucide-react',
      'styleq',
      '@react-native/normalize-colors',
      '@react-native-async-storage/async-storage',
      'react-native-web',
    ],
    esbuildOptions: {
      loader: { '.js': 'jsx' },
      jsx: 'automatic',
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    legalComments: 'none',
    target: 'esnext',
    sourcemap: false,
  },
  server: {
    headers: {
      'Content-Security-Policy': "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    },
  },
  build: {
    minify: 'esbuild',
    assetsInlineLimit(filePath, content) {
      if (/\.(png|jpe?g|gif|webp)$/.test(filePath)) return false;
      return content.length < 4096;
    },
    modulePreload: true,
    reportCompressedSize: false,
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'CIRCULAR_DEPENDENCY') {
            console.error('CIRCULAR:', warning.message);
          }
          warn(warning);
        },
      input: {
        main: resolve(__dirname, 'index.html'),
        notapproved:        resolve(__dirname, 'Membership/NotApproved.html'),
      },
      output: {
        compact: true,
        /* manualChunks(id) {
          if (id.includes('node_modules')) return 'v';
          if (id.includes('src/translations')) return 't-' + basename(id, extname(id));
          if (id.includes('/pages/')) return 'p-' + basename(id, extname(id));
        }, */
        manualChunks(id) {
          if (id.includes('node_modules')) return 'v';
          if (id.includes('src/translations')) return 't-' + basename(id, extname(id));
        },
        entryFileNames: 'e_[name]_[hash].js',
        chunkFileNames: '[hash].js',
        assetFileNames: '[hash].[ext]',
      },
    },
  },
});