import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/web',
  build: {
    outDir: '../../dist/web',
    emptyOutDir: true,
    // Production optimizations
    minify: 'terser',
    sourcemap: true,
    target: 'es2020',
    // Asset handling
    assetsDir: 'assets',
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/web/index.html')
      },
      external: [
        // Exclude Node.js specific modules from browser bundle
        'fs', 'path', 'os', 'crypto', 'util', 'events', 'stream',
        'child_process', 'net', 'http', 'https', 'url', 'querystring',
        'zlib', 'buffer', 'tty', 'readline', 'fsevents'
      ],
      output: {
        // Code splitting configuration
        manualChunks: (id) => {
          // Vendor chunk for node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          // Game engine chunk
          if (id.includes('/engine/')) {
            return 'engine';
          }
          // Models chunk
          if (id.includes('/models/')) {
            return 'models';
          }
          // UI components chunk
          if (id.includes('/ui/')) {
            return 'ui';
          }
          // Web components chunk
          if (id.includes('/web/') && !id.includes('main.ts')) {
            return 'web-components';
          }
        },
        // Asset naming
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    // Terser options for better minification
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true
      }
    },
    // CommonJS options
    commonjsOptions: {
      exclude: ['fsevents']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@engine': resolve(__dirname, 'src/engine'),
      '@models': resolve(__dirname, 'src/models'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@web': resolve(__dirname, 'src/web')
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true, // Allow external connections
    // Hot reload configuration
    hmr: {
      overlay: true
    }
  },
  preview: {
    port: 4173,
    host: true,
    open: true
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    '__DEV__': JSON.stringify(process.env.NODE_ENV !== 'production')
  },
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      // Add any CSS preprocessor options here if needed
    }
  },
  // Optimization for development
  optimizeDeps: {
    include: [
      // Pre-bundle dependencies for faster dev server startup
    ]
  }
});