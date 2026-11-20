import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Site multipágina:
//   /            -> landing page do ConsertaJá (index.html) com login
//   /dashboard/  -> dashboard administrativo (dashboard/index.html -> main.tsx -> App.tsx)
// Os dois usam o mesmo .env.local e compartilham a sessão do Supabase.
const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        dashboard: resolve(root, 'dashboard/index.html'),
      },
    },
  },
});
